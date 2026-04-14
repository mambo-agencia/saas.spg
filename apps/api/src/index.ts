import 'dotenv/config'
import app from './app'
import { logger } from './lib/logger'
import { initQueues } from './jobs/queues'
import { prisma } from './lib/prisma'

const PORT = process.env.PORT ?? 4000

async function main() {
  // Test DB connection
  await prisma.$connect()
  logger.info('PostgreSQL connected')

  // Redis + queues son opcionales (se omiten si REDIS_URL no está configurado)
  if (process.env.REDIS_URL) {
    try {
      const { redis } = await import('./lib/redis')
      await redis.ping()
      logger.info('Redis connected')
      await initQueues()
      logger.info('Job queues initialized')
    } catch (err) {
      logger.warn('Redis no disponible — las colas de sincronización están deshabilitadas', err)
    }
  } else {
    logger.warn('REDIS_URL no configurado — colas deshabilitadas')
  }

  app.listen(PORT, () => {
    logger.info(`API running on http://localhost:${PORT}`)
    logger.info(`Environment: ${process.env.NODE_ENV}`)
  })
}

main().catch((err) => {
  logger.error('Fatal startup error', err)
  process.exit(1)
})

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down...')
  await prisma.$disconnect()
  process.exit(0)
})
