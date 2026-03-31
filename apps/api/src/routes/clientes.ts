import { Router, Response } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'

export const clientesRouter = Router()
clientesRouter.use(requireAuth)

clientesRouter.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { search } = req.query as { search?: string }
  const clientes = await prisma.cliente.findMany({
    where: search
      ? {
          OR: [
            { nombre: { contains: search, mode: 'insensitive' } },
            { cuil: { contains: search } },
          ],
        }
      : {},
    orderBy: { nombre: 'asc' },
    take: 50,
  })
  res.json({ data: clientes })
})

clientesRouter.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const cliente = await prisma.cliente.findUnique({
    where: { id: req.params.id },
    include: { casos: { select: { id: true, numeroCaso: true, etapa: true, autos: true } } },
  })
  if (!cliente) throw new AppError(404, 'Cliente no encontrado')
  res.json({ data: cliente })
})

clientesRouter.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const cliente = await prisma.cliente.create({ data: req.body })
  res.status(201).json({ data: cliente })
})

clientesRouter.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const cliente = await prisma.cliente.update({ where: { id: req.params.id }, data: req.body })
  res.json({ data: cliente })
})
