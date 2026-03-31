import { Router, Response } from 'express'
import { body, query, validationResult } from 'express-validator'
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'
import { generateNumeroCaso } from '../services/casos.service'

export const casosRouter = Router()
casosRouter.use(requireAuth)

// GET /api/casos - Lista con filtros y paginación
casosRouter.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const {
      etapa,
      rart,
      captadoraId,
      abogadoId,
      jurisdiccion,
      tipoAtEp,
      search,
      page = '1',
      limit = '50',
    } = req.query as Record<string, string>

    const take = parseInt(limit)
    const skip = (parseInt(page) - 1) * take

    const where: Record<string, unknown> = {}

    if (etapa) where.etapa = etapa
    if (jurisdiccion) where.jurisdiccion = jurisdiccion
    if (tipoAtEp) where.tipoAtEp = tipoAtEp
    if (captadoraId) where.captadoraId = captadoraId
    if (abogadoId) where.abogadoId = abogadoId
    if (rart) where.artId = rart

    if (search) {
      where.OR = [
        { autos: { contains: search, mode: 'insensitive' } },
        { numeroCaso: { contains: search, mode: 'insensitive' } },
        { cliente: { nombre: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [casos, total] = await Promise.all([
      prisma.caso.findMany({
        where,
        take,
        skip,
        orderBy: { updatedAt: 'desc' },
        include: {
          cliente: { select: { id: true, nombre: true } },
          art: { select: { id: true, nombre: true } },
          captadora: { select: { id: true, nombre: true } },
          abogado: { select: { id: true, nombre: true } },
        },
      }),
      prisma.caso.count({ where }),
    ])

    res.json({
      data: casos,
      total,
      page: parseInt(page),
      limit: take,
      totalPages: Math.ceil(total / take),
    })
  }
)

// GET /api/casos/kanban - Agrupado por etapa para vista Kanban
casosRouter.get('/kanban', async (_req: AuthRequest, res: Response): Promise<void> => {
  const etapas = [
    'SRT',
    'LITIGIOS_EXTRAJUDICIAL',
    'NEGOCIACIONES',
    'LITIGIOS_JUDICIAL',
    'ACUERDO_CERRADO',
    'SENTENCIADO',
    'CONGELADO',
  ] as const

  const results = await Promise.all(
    etapas.map(async (etapa) => {
      const [casos, total] = await Promise.all([
        prisma.caso.findMany({
          where: { etapa },
          take: 50,
          orderBy: { updatedAt: 'desc' },
          include: {
            cliente: { select: { id: true, nombre: true } },
            art: { select: { id: true, nombre: true } },
            captadora: { select: { id: true, nombre: true } },
            abogado: { select: { id: true, nombre: true } },
          },
        }),
        prisma.caso.count({ where: { etapa } }),
      ])
      return { etapa, casos, total }
    })
  )

  res.json({ data: results })
})

// GET /api/casos/:id
casosRouter.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const caso = await prisma.caso.findUnique({
    where: { id: req.params.id },
    include: {
      cliente: true,
      art: true,
      captadora: { select: { id: true, nombre: true } },
      abogado: true,
      datosSrt: true,
      datosJudiciales: true,
      conexiones: true,
      movimientos: { orderBy: { fechaMovimiento: 'desc' }, take: 50 },
      comentarios: {
        orderBy: { createdAt: 'desc' },
        include: { usuario: { select: { id: true, nombre: true } } },
      },
      adjuntos: { orderBy: { createdAt: 'desc' } },
      eventos: { orderBy: { fechaEvento: 'asc' } },
    },
  })

  if (!caso) throw new AppError(404, 'Caso no encontrado')
  res.json({ data: caso })
})

// POST /api/casos
casosRouter.post(
  '/',
  requireRole('admin', 'abogado', 'captadora'),
  [
    body('jurisdiccion').notEmpty(),
    body('tipoAtEp').notEmpty(),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'ValidationError', errors: errors.array() })
      return
    }

    const numeroCaso = await generateNumeroCaso()

    const caso = await prisma.caso.create({
      data: {
        ...req.body,
        numeroCaso,
        captadoraId: req.body.captadoraId ?? req.user?.id,
      },
      include: {
        cliente: true,
        art: true,
        captadora: { select: { id: true, nombre: true } },
        abogado: true,
      },
    })

    res.status(201).json({ data: caso })
  }
)

// PUT /api/casos/:id
casosRouter.put('/:id', requireRole('admin', 'abogado'), async (req: AuthRequest, res: Response): Promise<void> => {
  const caso = await prisma.caso.findUnique({ where: { id: req.params.id } })
  if (!caso) throw new AppError(404, 'Caso no encontrado')

  const updated = await prisma.caso.update({
    where: { id: req.params.id },
    data: req.body,
    include: { cliente: true, art: true },
  })

  res.json({ data: updated })
})

// PUT /api/casos/:id/etapa
casosRouter.put('/:id/etapa', requireRole('admin', 'abogado'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { etapa } = req.body
  if (!etapa) {
    res.status(400).json({ error: 'ValidationError', message: 'etapa requerida' })
    return
  }

  const caso = await prisma.caso.update({
    where: { id: req.params.id },
    data: { etapa },
  })

  res.json({ data: caso })
})

// DELETE /api/casos/:id
casosRouter.delete('/:id', requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.caso.delete({ where: { id: req.params.id } })
  res.json({ data: { message: 'Caso eliminado' } })
})

// ─── DATOS SRT ────────────────────────────────────────────

casosRouter.get('/:casoId/datos-srt', async (req: AuthRequest, res: Response): Promise<void> => {
  const datos = await prisma.datosSrt.findUnique({ where: { casoId: req.params.casoId } })
  res.json({ data: datos })
})

casosRouter.post('/:casoId/datos-srt', requireRole('admin', 'abogado'), async (req: AuthRequest, res: Response): Promise<void> => {
  const datos = await prisma.datosSrt.upsert({
    where: { casoId: req.params.casoId },
    create: { ...req.body, casoId: req.params.casoId },
    update: req.body,
  })
  res.json({ data: datos })
})

// ─── DATOS JUDICIALES ─────────────────────────────────────

casosRouter.get('/:casoId/datos-judiciales', async (req: AuthRequest, res: Response): Promise<void> => {
  const datos = await prisma.datosJudiciales.findUnique({ where: { casoId: req.params.casoId } })
  res.json({ data: datos })
})

casosRouter.post('/:casoId/datos-judiciales', requireRole('admin', 'abogado'), async (req: AuthRequest, res: Response): Promise<void> => {
  const datos = await prisma.datosJudiciales.upsert({
    where: { casoId: req.params.casoId },
    create: { ...req.body, casoId: req.params.casoId },
    update: req.body,
  })
  res.json({ data: datos })
})

// ─── COMENTARIOS ──────────────────────────────────────────

casosRouter.get('/:casoId/comentarios', async (req: AuthRequest, res: Response): Promise<void> => {
  const comentarios = await prisma.comentario.findMany({
    where: { casoId: req.params.casoId },
    orderBy: { createdAt: 'desc' },
    include: { usuario: { select: { id: true, nombre: true } } },
  })
  res.json({ data: comentarios })
})

casosRouter.post('/:casoId/comentarios', async (req: AuthRequest, res: Response): Promise<void> => {
  const comentario = await prisma.comentario.create({
    data: {
      casoId: req.params.casoId,
      usuarioId: req.user?.id,
      contenido: req.body.contenido,
    },
    include: { usuario: { select: { id: true, nombre: true } } },
  })
  res.status(201).json({ data: comentario })
})

casosRouter.delete('/:casoId/comentarios/:id', requireRole('admin', 'abogado'), async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.comentario.delete({ where: { id: req.params.id } })
  res.json({ data: { message: 'Comentario eliminado' } })
})

// ─── MOVIMIENTOS ──────────────────────────────────────────

casosRouter.get('/:casoId/movimientos', async (req: AuthRequest, res: Response): Promise<void> => {
  const movimientos = await prisma.movimientoExpediente.findMany({
    where: { casoId: req.params.casoId },
    orderBy: { fechaMovimiento: 'desc' },
    take: 100,
  })
  res.json({ data: movimientos })
})
