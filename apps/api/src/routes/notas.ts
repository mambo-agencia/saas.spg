import { Router, Response } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'

export const notasRouter = Router()
notasRouter.use(requireAuth)

// GET /api/notas-usuario
notasRouter.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const notas = await prisma.notaUsuario.findMany({
    where: { usuarioId: req.user!.id },
    orderBy: [{ completada: 'asc' }, { orden: 'asc' }],
  })
  res.json({ data: notas })
})

// POST /api/notas-usuario
notasRouter.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const nota = await prisma.notaUsuario.create({
    data: { usuarioId: req.user!.id, contenido: req.body.contenido },
  })
  res.status(201).json({ data: nota })
})

// PUT /api/notas-usuario/:id
notasRouter.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const nota = await prisma.notaUsuario.updateMany({
    where: { id: req.params.id, usuarioId: req.user!.id },
    data: req.body,
  })
  res.json({ data: nota })
})

// DELETE /api/notas-usuario/:id
notasRouter.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.notaUsuario.deleteMany({
    where: { id: req.params.id, usuarioId: req.user!.id },
  })
  res.json({ data: { message: 'Nota eliminada' } })
})
