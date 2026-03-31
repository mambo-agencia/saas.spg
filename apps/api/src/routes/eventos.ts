import { Router, Response } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'

export const eventosRouter = Router()
eventosRouter.use(requireAuth)

// GET /api/eventos?fecha_inicio=&fecha_fin=
eventosRouter.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { fecha_inicio, fecha_fin, casoId, tipo } = req.query as Record<string, string>

  const where: Record<string, unknown> = {}
  if (fecha_inicio || fecha_fin) {
    where.fechaEvento = {
      ...(fecha_inicio ? { gte: new Date(fecha_inicio) } : {}),
      ...(fecha_fin ? { lte: new Date(fecha_fin) } : {}),
    }
  }
  if (casoId) where.casoId = casoId
  if (tipo) where.tipoEvento = tipo

  const eventos = await prisma.evento.findMany({
    where,
    orderBy: { fechaEvento: 'asc' },
    include: { caso: { select: { numeroCaso: true, autos: true } } },
  })

  res.json({ data: eventos })
})

// GET /api/eventos/calendario/:anio/:mes
eventosRouter.get('/calendario/:anio/:mes', async (req: AuthRequest, res: Response): Promise<void> => {
  const { anio, mes } = req.params
  const start = new Date(parseInt(anio), parseInt(mes) - 1, 1)
  const end = new Date(parseInt(anio), parseInt(mes), 0, 23, 59, 59)

  const eventos = await prisma.evento.findMany({
    where: { fechaEvento: { gte: start, lte: end } },
    orderBy: { fechaEvento: 'asc' },
    include: { caso: { select: { numeroCaso: true, autos: true } } },
  })

  res.json({ data: eventos })
})

// GET /api/eventos/hoy
eventosRouter.get('/hoy', async (_req: AuthRequest, res: Response): Promise<void> => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)

  const eventos = await prisma.evento.findMany({
    where: { fechaEvento: { gte: start, lte: end } },
    orderBy: { fechaEvento: 'asc' },
    include: { caso: { select: { numeroCaso: true, autos: true } } },
  })

  res.json({ data: eventos })
})

// GET /api/eventos/:id
eventosRouter.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const evento = await prisma.evento.findUnique({
    where: { id: req.params.id },
    include: { caso: { select: { numeroCaso: true, autos: true } } },
  })
  if (!evento) throw new AppError(404, 'Evento no encontrado')
  res.json({ data: evento })
})

// POST /api/eventos
eventosRouter.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const evento = await prisma.evento.create({
    data: {
      ...req.body,
      usuarioResponsable: req.user?.id,
      participantes: JSON.stringify(req.body.participantes ?? []),
    },
  })
  res.status(201).json({ data: evento })
})

// PUT /api/eventos/:id
eventosRouter.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const evento = await prisma.evento.update({
    where: { id: req.params.id },
    data: {
      ...req.body,
      participantes: req.body.participantes
        ? JSON.stringify(req.body.participantes)
        : undefined,
    },
  })
  res.json({ data: evento })
})

// DELETE /api/eventos/:id
eventosRouter.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.evento.delete({ where: { id: req.params.id } })
  res.json({ data: { message: 'Evento eliminado' } })
})
