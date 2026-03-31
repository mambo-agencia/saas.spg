import puppeteer, { Browser } from 'puppeteer'
import { prisma } from '../lib/prisma'
import { decrypt } from '../lib/encrypt'
import { logger } from '../lib/logger'

interface SyncResult {
  casosSincronizados: number
  movimientosDetectados: number
}

/**
 * PJN BA requires login with credentials.
 * Uses Puppeteer for JS-rendered pages.
 */
export async function syncPjnBa(): Promise<SyncResult> {
  const credencial = await prisma.credencial.findUnique({ where: { sistema: 'PJN_BA' } })

  if (!credencial?.usuarioEncrypted || !credencial.passwordEncrypted) {
    throw new Error('PJN BA credentials not configured')
  }

  const usuario = decrypt(credencial.usuarioEncrypted)
  const password = decrypt(credencial.passwordEncrypted)

  let browser: Browser | null = null
  let casosSincronizados = 0
  let movimientosDetectados = 0

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 SPG-Juridico-Sync/1.0')

    // LOGIN — URL and selectors depend on actual PJN BA site
    await page.goto('https://scw.pjn.gov.ar/scw/login.seam', { waitUntil: 'networkidle2' })
    await page.type('#username', usuario)
    await page.type('#password', password)
    await page.click('button[type=submit]')
    await page.waitForNavigation({ waitUntil: 'networkidle2' })

    // Check login success
    const title = await page.title()
    if (title.toLowerCase().includes('login')) {
      throw new Error('PJN BA login failed — check credentials')
    }

    // Get all cases with PJN_BA conexion
    const conexiones = await prisma.conexionCaso.findMany({
      where: { sistema: 'PJN_BA', nroExpediente: { not: null } },
      include: { caso: { select: { id: true, numeroCaso: true } } },
      take: 50,
    })

    for (const conexion of conexiones) {
      try {
        await page.goto(
          `https://scw.pjn.gov.ar/scw/expediente/${encodeURIComponent(conexion.nroExpediente!)}`,
          { waitUntil: 'networkidle2' }
        )

        const movimientos = await page.evaluate(() => {
          const rows = document.querySelectorAll('table.actuaciones tbody tr')
          return Array.from(rows).map((row) => {
            const cols = row.querySelectorAll('td')
            return {
              fecha: cols[0]?.textContent?.trim() ?? '',
              descripcion: cols[1]?.textContent?.trim() ?? '',
              url: cols[1]?.querySelector('a')?.href ?? undefined,
            }
          })
        })

        for (const mov of movimientos) {
          if (!mov.fecha || !mov.descripcion) continue

          const [day, month, year] = mov.fecha.split('/')
          const fecha = new Date(`${year}-${month}-${day}`)
          if (isNaN(fecha.getTime())) continue

          const existing = await prisma.movimientoExpediente.findFirst({
            where: {
              casoId: conexion.casoId,
              sistema: 'PJN_BA',
              fechaMovimiento: fecha,
              descripcion: mov.descripcion,
            },
          })

          if (!existing) {
            await prisma.movimientoExpediente.create({
              data: {
                casoId: conexion.casoId,
                sistema: 'PJN_BA',
                tipo: 'resolucion',
                descripcion: mov.descripcion,
                fechaMovimiento: fecha,
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
        logger.warn(`PJN BA sync failed for case ${conexion.caso.numeroCaso}: ${err}`)
      }
    }
  } finally {
    await browser?.close()
  }

  return { casosSincronizados, movimientosDetectados }
}
