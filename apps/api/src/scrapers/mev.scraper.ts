import * as cheerio from 'cheerio'
import { prisma } from '../lib/prisma'
import { logger } from '../lib/logger'

const MEV_BASE_URL = 'https://mev.pjn.gov.ar'

interface SyncResult {
  casosSincronizados: number
  movimientosDetectados: number
}

/**
 * MEV is public — no credentials needed.
 * Scrapes each case's PJN expediente number.
 */
export async function syncMev(): Promise<SyncResult> {
  let casosSincronizados = 0
  let movimientosDetectados = 0

  // Get all cases with MEV conexion
  const conexiones = await prisma.conexionCaso.findMany({
    where: { sistema: 'MEV', nroExpediente: { not: null } },
    include: { caso: { select: { id: true, numeroCaso: true } } },
    take: 100, // Process in batches
  })

  for (const conexion of conexiones) {
    try {
      const html = await fetchMevExpediente(conexion.nroExpediente!)
      const movimientos = parseMevMovimientos(html)

      for (const mov of movimientos) {
        // Upsert by fecha + descripcion to avoid duplicates
        const existing = await prisma.movimientoExpediente.findFirst({
          where: {
            casoId: conexion.casoId,
            sistema: 'MEV',
            fechaMovimiento: mov.fecha,
            descripcion: mov.descripcion,
          },
        })

        if (!existing) {
          await prisma.movimientoExpediente.create({
            data: {
              casoId: conexion.casoId,
              sistema: 'MEV',
              tipo: 'resolucion',
              descripcion: mov.descripcion,
              fechaMovimiento: mov.fecha,
              urlDocumento: mov.url,
            },
          })
          movimientosDetectados++
        }
      }

      await prisma.conexionCaso.update({
        where: { id: conexion.id },
        data: { ultimaSincronizacion: new Date(), conectado: true },
      })

      casosSincronizados++
    } catch (err) {
      logger.warn(`MEV sync failed for case ${conexion.caso.numeroCaso}: ${err}`)
    }
  }

  return { casosSincronizados, movimientosDetectados }
}

async function fetchMevExpediente(nroExpediente: string): Promise<string> {
  const url = `${MEV_BASE_URL}/consultas/expediente?nro=${encodeURIComponent(nroExpediente)}`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 SPG-Juridico-Sync/1.0' },
    signal: AbortSignal.timeout(30_000),
  })

  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.text()
}

function parseMevMovimientos(html: string): Array<{ fecha: Date; descripcion: string; url?: string }> {
  const $ = cheerio.load(html)
  const movimientos: Array<{ fecha: Date; descripcion: string; url?: string }> = []

  // Selector depends on MEV's actual HTML structure — adjust after inspection
  $('table.actuaciones tr').each((_i, row) => {
    const cols = $(row).find('td')
    if (cols.length < 2) return

    const fechaStr = $(cols[0]).text().trim()
    const descripcion = $(cols[1]).text().trim()
    const url = $(cols[1]).find('a').attr('href')

    if (!fechaStr || !descripcion) return

    const [day, month, year] = fechaStr.split('/')
    const fecha = new Date(`${year}-${month}-${day}`)
    if (isNaN(fecha.getTime())) return

    movimientos.push({ fecha, descripcion, url: url ? `${MEV_BASE_URL}${url}` : undefined })
  })

  return movimientos
}
