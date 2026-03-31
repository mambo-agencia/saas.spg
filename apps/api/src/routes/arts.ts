import { Router, Response } from 'express'
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'

export const artsRouter = Router()
artsRouter.use(requireAuth)

artsRouter.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { search } = req.query as { search?: string }
  const arts = await prisma.arte.findMany({
    where: {
      activa: true,
      ...(search ? { nombre: { contains: search, mode: 'insensitive' } } : {}),
    },
    orderBy: { nombre: 'asc' },
  })
  res.json({ data: arts })
})

artsRouter.post('/', requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const art = await prisma.arte.create({ data: req.body })
  res.status(201).json({ data: art })
})

artsRouter.put('/:id', requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const art = await prisma.arte.update({ where: { id: req.params.id }, data: req.body })
  res.json({ data: art })
})
