import { Router, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'

export const analisisRouter = Router()
analisisRouter.use(requireAuth)

// GET /api/analisis/resumen - Dashboard panorama
analisisRouter.get('/resumen', async (_req: AuthRequest, res: Response): Promise<void> => {
  const etapas = [
    'SRT', 'LITIGIOS_EXTRAJUDICIAL', 'NEGOCIACIONES',
    'LITIGIOS_JUDICIAL', 'ACUERDO_CERRADO', 'SENTENCIADO', 'CONGELADO',
  ] as const

  const counts = await Promise.all(
    etapas.map((etapa) => prisma.caso.count({ where: { etapa } }))
  )

  const desglose = Object.fromEntries(etapas.map((e, i) => [e, counts[i]]))

  const extrajudicial =
    (desglose.SRT ?? 0) +
    (desglose.LITIGIOS_EXTRAJUDICIAL ?? 0) +
    (desglose.NEGOCIACIONES ?? 0)

  const judicial =
    (desglose.LITIGIOS_JUDICIAL ?? 0) + (desglose.SENTENCIADO ?? 0)

  res.json({
    data: {
      totalCasos: counts.reduce((a, b) => a + b, 0),
      extrajudicial,
      judicial,
      acuerdosCerrados: desglose.ACUERDO_CERRADO ?? 0,
      desglose,
    },
  })
})

// GET /api/analisis/por-etapa
analisisRouter.get('/por-etapa', async (_req: AuthRequest, res: Response): Promise<void> => {
  const result = await prisma.caso.groupBy({
    by: ['etapa'],
    _count: { id: true },
  })
  res.json({ data: result.map((r) => ({ etapa: r.etapa, cantidad: r._count.id })) })
})

// GET /api/analisis/por-tipo
analisisRouter.get('/por-tipo', async (_req: AuthRequest, res: Response): Promise<void> => {
  const result = await prisma.caso.groupBy({
    by: ['tipoAtEp'],
    _count: { id: true },
  })
  res.json({ data: result.map((r) => ({ tipo: r.tipoAtEp, cantidad: r._count.id })) })
})

// GET /api/analisis/por-rart
analisisRouter.get('/por-rart', async (_req: AuthRequest, res: Response): Promise<void> => {
  const result = await prisma.caso.groupBy({
    by: ['artId'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10,
    where: { artId: { not: null } },
  })

  const artIds = result.map((r) => r.artId).filter(Boolean) as string[]
  const arts = await prisma.arte.findMany({
    where: { id: { in: artIds } },
    select: { id: true, nombre: true },
  })

  const artMap = Object.fromEntries(arts.map((a) => [a.id, a.nombre]))

  res.json({
    data: result.map((r) => ({
      artId: r.artId,
      artNombre: r.artId ? artMap[r.artId] : 'Sin ART',
      cantidad: r._count.id,
    })),
  })
})

// GET /api/analisis/por-captadora
analisisRouter.get('/por-captadora', async (_req: AuthRequest, res: Response): Promise<void> => {
  const result = await prisma.caso.groupBy({
    by: ['captadoraId'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    where: { captadoraId: { not: null } },
  })

  const ids = result.map((r) => r.captadoraId).filter(Boolean) as string[]
  const usuarios = await prisma.usuario.findMany({
    where: { id: { in: ids } },
    select: { id: true, nombre: true },
  })
  const userMap = Object.fromEntries(usuarios.map((u) => [u.id, u.nombre]))

  const total = result.reduce((sum, r) => sum + r._count.id, 0)

  res.json({
    data: result.map((r) => ({
      captadoraId: r.captadoraId,
      captadoraNombre: r.captadoraId ? userMap[r.captadoraId] : 'Sin captadora',
      cantidad: r._count.id,
      porcentaje: total > 0 ? Math.round((r._count.id / total) * 100) : 0,
    })),
  })
})

// GET /api/analisis/timeline-iniciados
analisisRouter.get('/timeline-iniciados', async (_req: AuthRequest, res: Response): Promise<void> => {
  // Last 12 months
  const since = new Date()
  since.setMonth(since.getMonth() - 11)
  since.setDate(1)
  since.setHours(0, 0, 0, 0)

  const casos = await prisma.caso.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
  })

  const byMonth: Record<string, number> = {}
  casos.forEach(({ createdAt }) => {
    const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`
    byMonth[key] = (byMonth[key] ?? 0) + 1
  })

  res.json({
    data: Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, cantidad]) => ({ mes, cantidad })),
  })
})

// GET /api/analisis/congelados
analisisRouter.get('/congelados', async (_req: AuthRequest, res: Response): Promise<void> => {
  const since30 = new Date()
  since30.setDate(since30.getDate() - 30)

  const casos = await prisma.caso.findMany({
    where: { updatedAt: { lte: since30 }, etapa: { notIn: ['ACUERDO_CERRADO', 'SENTENCIADO'] } },
    orderBy: { updatedAt: 'asc' },
    include: { cliente: { select: { nombre: true } }, art: { select: { nombre: true } } },
    take: 100,
  })

  res.json({ data: casos })
})

// GET /api/analisis/tasa-conversion
analisisRouter.get('/tasa-conversion', async (_req: AuthRequest, res: Response): Promise<void> => {
  const [total, acuerdos, sentenciados] = await Promise.all([
    prisma.caso.count({ where: { etapa: { not: 'SRT' } } }),
    prisma.caso.count({ where: { etapa: 'ACUERDO_CERRADO' } }),
    prisma.caso.count({ where: { etapa: 'SENTENCIADO' } }),
  ])

  res.json({
    data: {
      total,
      acuerdosCerrados: acuerdos,
      sentenciados,
      tasaAcuerdo: total > 0 ? Math.round((acuerdos / total) * 100) : 0,
      tasaJudicial: total > 0 ? Math.round((sentenciados / total) * 100) : 0,
    },
  })
})

// GET /api/analisis/ultimos-movimientos
analisisRouter.get('/ultimos-movimientos', async (_req: AuthRequest, res: Response): Promise<void> => {
  const movimientos = await prisma.movimientoExpediente.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { caso: { select: { numeroCaso: true, autos: true } } },
  })
  res.json({ data: movimientos })
})
