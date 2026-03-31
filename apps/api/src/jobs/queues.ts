import Bull from 'bull'
import { redis } from '../lib/redis'
import { logger } from '../lib/logger'
import { syncWorker } from './workers/sync.worker'
import { notificacionesWorker } from './workers/notificaciones.worker'
import { mantenimientoWorker } from './workers/mantenimiento.worker'

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'

// ─── QUEUES ───────────────────────────────────────────────

export const syncQueue = new Bull('sync', REDIS_URL)
export const notificacionesQueue = new Bull('notificaciones', REDIS_URL)
export const mantenimientoQueue = new Bull('mantenimiento', REDIS_URL)

// ─── INIT WORKERS & SCHEDULES ─────────────────────────────

export async function initQueues(): Promise<void> {
  // Attach workers
  syncQueue.process('*', syncWorker)
  notificacionesQueue.process('*', notificacionesWorker)
  mantenimientoQueue.process('*', mantenimientoWorker)

  // Error handlers
  for (const q of [syncQueue, notificacionesQueue, mantenimientoQueue]) {
    q.on('failed', (job, err) => {
      logger.error(`Job ${job.name} failed: ${err.message}`)
    })
    q.on('completed', (job) => {
      logger.debug(`Job ${job.name} completed`)
    })
  }

  // ─── SCHEDULES ─────────────────────────────────────────

  // Sync every 3h
  const sistemas = ['MEV', 'SRT', 'PJN_BA', 'PJN_NEUQUEN', 'PJN_RIO_NEGRO']
  for (const sistema of sistemas) {
    await syncQueue.add(
      'sync-sistema',
      { sistema },
      {
        repeat: { cron: '0 */3 * * *' }, // every 3h
        jobId: `sync-${sistema}`,
        removeOnComplete: true,
        removeOnFail: 10,
      }
    )
  }

  // WhatsApp notifications every 30min
  await notificacionesQueue.add(
    'enviar-whatsapp',
    {},
    {
      repeat: { cron: '*/30 * * * *' },
      jobId: 'whatsapp-notificaciones',
      removeOnComplete: true,
    }
  )

  // Daily maintenance at 3am
  await mantenimientoQueue.add(
    'deduplicar-expedientes',
    {},
    { repeat: { cron: '0 3 * * *' }, jobId: 'deduplicar', removeOnComplete: true }
  )
  await mantenimientoQueue.add(
    'backup-bd',
    {},
    { repeat: { cron: '0 4 * * *' }, jobId: 'backup', removeOnComplete: true }
  )
  await mantenimientoQueue.add(
    'limpiar-logs',
    {},
    { repeat: { cron: '0 5 * * *' }, jobId: 'limpiar-logs', removeOnComplete: true }
  )

  logger.info('Scheduled jobs registered')
}
