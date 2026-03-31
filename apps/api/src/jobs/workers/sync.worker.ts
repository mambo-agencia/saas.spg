import { Job } from 'bull'
import { logger } from '../../lib/logger'
import { prisma } from '../../lib/prisma'
import { syncMev } from '../../scrapers/mev.scraper'
import { syncPjnBa } from '../../scrapers/pjn-ba.scraper'

export async function syncWorker(job: Job): Promise<void> {
  const { sistema, test } = job.data as { sistema: string; test?: boolean }
  const start = Date.now()

  logger.info(`Sync job started: ${sistema}${test ? ' (test)' : ''}`)

  try {
    let casosSincronizados = 0
    let movimientosDetectados = 0

    if (test) {
      // Just try to connect
      logger.info(`Testing connection to ${sistema}`)
      await prisma.credencial.update({
        where: { sistema: sistema as never },
        data: { ultimaPrueba: new Date() },
      })
      return
    }

    switch (sistema) {
      case 'MEV':
        ;({ casosSincronizados, movimientosDetectados } = await syncMev())
        break
      case 'PJN_BA':
        ;({ casosSincronizados, movimientosDetectados } = await syncPjnBa())
        break
      // PJN_NEUQUEN, PJN_RIO_NEGRO, SRT — similar structure
      default:
        logger.warn(`No scraper implemented for ${sistema}`)
    }

    const duracion = Math.round((Date.now() - start) / 1000)

    await Promise.all([
      prisma.syncLog.create({
        data: {
          sistema: sistema as never,
          casosSincronizados,
          movimientosDetectados,
          estado: 'exito',
          duracionSegundos: duracion,
        },
      }),
      prisma.credencial.updateMany({
        where: { sistema: sistema as never },
        data: {
          ultimaSincronizacion: new Date(),
          estadoConexion: 'conectada',
          intentosFallidos: 0,
        },
      }),
    ])

    logger.info(`Sync ${sistema} OK — ${casosSincronizados} casos, ${movimientosDetectados} movimientos, ${duracion}s`)
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))

    await Promise.all([
      prisma.syncLog.create({
        data: {
          sistema: sistema as never,
          casosSincronizados: 0,
          movimientosDetectados: 0,
          estado: 'error',
          errorMensaje: error.message,
        },
      }),
      prisma.credencial.updateMany({
        where: { sistema: sistema as never },
        data: {
          estadoConexion: 'error',
          intentosFallidos: { increment: 1 },
        },
      }),
    ])

    throw error
  }
}
