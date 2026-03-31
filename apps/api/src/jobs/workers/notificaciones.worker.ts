import { Job } from 'bull'
import { logger } from '../../lib/logger'
import { prisma } from '../../lib/prisma'
import { sendWhatsApp } from '../../services/whatsapp.service'

export async function notificacionesWorker(_job: Job): Promise<void> {
  // Get unnotified movements in the last 30 min
  const since = new Date(Date.now() - 35 * 60 * 1000) // 35min window

  const movimientos = await prisma.movimientoExpediente.findMany({
    where: { notificado: false, createdAt: { gte: since } },
    include: {
      caso: {
        include: {
          abogado: { select: { telefono: true, nombre: true } },
          captadora: { select: { telefono: true, nombre: true } },
        },
      },
    },
    take: 50,
  })

  if (movimientos.length === 0) return

  logger.info(`Sending ${movimientos.length} WhatsApp notifications`)

  const sent: string[] = []

  for (const mov of movimientos) {
    try {
      const telefono = mov.caso.abogado?.telefono
      if (!telefono) continue

      const message =
        `📋 *SPG Juridico* — Nuevo movimiento\n` +
        `Caso: ${mov.caso.numeroCaso}\n` +
        `Sistema: ${mov.sistema}\n` +
        `Tipo: ${mov.tipo}\n` +
        `${mov.descripcion ?? ''}\n` +
        `📅 ${new Date(mov.fechaMovimiento).toLocaleDateString('es-AR')}`

      await sendWhatsApp(telefono, message)
      sent.push(mov.id)
    } catch (err) {
      logger.warn(`Failed to send WA for movement ${mov.id}: ${err}`)
    }
  }

  if (sent.length > 0) {
    await prisma.movimientoExpediente.updateMany({
      where: { id: { in: sent } },
      data: { notificado: true },
    })
  }
}
