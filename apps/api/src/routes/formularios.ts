import { Router, Response } from 'express'
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'

export const formulariosRouter = Router()
formulariosRouter.use(requireAuth)

// GET /api/formularios — lista todos los formularios de inicio
formulariosRouter.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { estado, abogadoId, page = '1', limit = '50' } = req.query as Record<string, string>

  const take = parseInt(limit)
  const skip = (parseInt(page) - 1) * take

  const where: Record<string, unknown> = {}
  if (estado) where.estado = estado

  const [formularios, total] = await Promise.all([
    prisma.formularioInicio.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        caso: {
          include: {
            cliente: { select: { id: true, nombre: true } },
            art: { select: { id: true, nombre: true } },
            abogado: { select: { id: true, nombre: true } },
          },
        },
      },
    }),
    prisma.formularioInicio.count({ where }),
  ])

  res.json({
    data: formularios,
    total,
    page: parseInt(page),
    limit: take,
    totalPages: Math.ceil(total / take),
  })
})

// GET /api/formularios/:casoId — obtener formulario de un caso
formulariosRouter.get('/:casoId', async (req: AuthRequest, res: Response): Promise<void> => {
  const formulario = await prisma.formularioInicio.findUnique({
    where: { casoId: req.params.casoId },
    include: {
      caso: {
        include: {
          cliente: true,
          art: true,
          abogado: true,
          datosSrt: true,
        },
      },
    },
  })

  if (!formulario) {
    res.json({ data: null })
    return
  }

  res.json({ data: formulario })
})

// POST /api/formularios/:casoId/generar — generar o marcar como generado
formulariosRouter.post(
  '/:casoId/generar',
  requireRole('admin', 'abogado'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const caso = await prisma.caso.findUnique({
      where: { id: req.params.casoId },
      include: { cliente: true, art: true, abogado: true, datosSrt: true },
    })

    if (!caso) throw new AppError(404, 'Caso no encontrado')

    // Validar campos mínimos requeridos
    const missing: string[] = []
    if (!caso.clienteId && !caso.cuil) missing.push('cliente o CUIL del trabajador')
    if (!caso.artId) missing.push('ART')
    if (!caso.tipoAtEp) missing.push('tipo de contingencia')
    if (!caso.fechaSiniestro) missing.push('fecha de siniestro')

    if (missing.length > 0) {
      throw new AppError(
        400,
        `Faltan campos obligatorios: ${missing.join(', ')}`
      )
    }

    const { linkGoogleDocs, linkPdf, idAutocrat } = req.body

    const formulario = await prisma.formularioInicio.upsert({
      where: { casoId: req.params.casoId },
      create: {
        casoId: req.params.casoId,
        estado: linkGoogleDocs ? 'GENERADO' : 'PENDIENTE',
        linkGoogleDocs: linkGoogleDocs ?? null,
        linkPdf: linkPdf ?? null,
        idAutocrat: idAutocrat ?? null,
        fechaGeneracion: linkGoogleDocs ? new Date() : null,
      },
      update: {
        estado: linkGoogleDocs ? 'GENERADO' : 'PENDIENTE',
        linkGoogleDocs: linkGoogleDocs ?? undefined,
        linkPdf: linkPdf ?? undefined,
        idAutocrat: idAutocrat ?? undefined,
        fechaGeneracion: linkGoogleDocs ? new Date() : undefined,
      },
    })

    // Si tiene Google Docs link, registrar también en datosSrt
    if (linkGoogleDocs) {
      await prisma.datosSrt.upsert({
        where: { casoId: req.params.casoId },
        create: {
          casoId: req.params.casoId,
          formularioInicioUrl: linkGoogleDocs,
        },
        update: { formularioInicioUrl: linkGoogleDocs },
      })
    }

    res.json({ data: formulario })
  }
)

// PUT /api/formularios/:casoId/pdf — guardar link del PDF descargado
formulariosRouter.put(
  '/:casoId/pdf',
  requireRole('admin', 'abogado'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { linkPdf } = req.body
    if (!linkPdf) throw new AppError(400, 'linkPdf requerido')

    const formulario = await prisma.formularioInicio.update({
      where: { casoId: req.params.casoId },
      data: { linkPdf, estado: 'DESCARGADO' },
    })

    res.json({ data: formulario })
  }
)

// DELETE /api/formularios/:casoId — eliminar formulario
formulariosRouter.delete(
  '/:casoId',
  requireRole('admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    await prisma.formularioInicio.delete({ where: { casoId: req.params.casoId } })
    res.json({ data: { message: 'Formulario eliminado' } })
  }
)
