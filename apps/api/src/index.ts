import 'dotenv/config'
import app from './app'
import { logger } from './lib/logger'
import { initQueues } from './jobs/queues'
import { prisma } from './lib/prisma'
import { redis } from './lib/redis'

const PORT = process.env.PORT ?? 4000

async function main() {
  // Test DB connection
  await prisma.$connect()
  logger.info('PostgreSQL connected')

  // Test Redis
  await redis.ping()
  logger.info('Redis connected')

  // Init Bull queues and workers
  await initQueues()
  logger.info('Job queues initialized')

  app.listen(PORT, () => {
    logger.info(`API running on http://localhost:${PORT}`)
    logger.info(`Environment: ${process.env.NODE_ENV}`)
  })
}

main().catch((err) => {
  logger.error('Fatal startup error', err)
  process.exit(1)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down...')
  await prisma.$disconnect()
  redis.disconnect()
  process.exit(0)
})
