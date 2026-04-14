import { logger } from '../lib/logger'

interface SyncResult {
  casosSincronizados: number
  movimientosDetectados: number
}

/**
 * PJN BA scraper — pendiente de implementación con Puppeteer.
 * Deshabilitado en producción hasta configurar el entorno con Chromium.
 */
export async function syncPjnBa(): Promise<SyncResult> {
  logger.warn('PJN BA scraper deshabilitado en esta versión')
  return { casosSincronizados: 0, movimientosDetectados: 0 }
}
