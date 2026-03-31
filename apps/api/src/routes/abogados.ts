import { Router, Response } from 'express'
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'

export const abogadosRouter = Router()
abogadosRouter.use(requireAuth)

abogadosRouter.get('/', async (_req: AuthRequest, res: Response): Promise<void> => {
  const abogados = await prisma.abogado.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
  })
  res.json({ data: abogados })
})

abogadosRouter.post('/', requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const abogado = await prisma.abogado.create({
    data: {
      ...req.body,
      jurisdicciones: JSON.stringify(req.body.jurisdicciones ?? []),
    },
  })
  res.status(201).json({ data: abogado })
})

abogadosRouter.put('/:id', requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const abogado = await prisma.abogado.update({
    where: { id: req.params.id },
    data: {
      ...req.body,
      jurisdicciones: req.body.jurisdicciones
        ? JSON.stringify(req.body.jurisdicciones)
        : undefined,
    },
  })
  res.json({ data: abogado })
})
