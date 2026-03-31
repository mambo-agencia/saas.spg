import { Router, Response } from 'express'
import bcrypt from 'bcryptjs'
import { body, validationResult } from 'express-validator'
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'

export const usuariosRouter = Router()
usuariosRouter.use(requireAuth)

// GET /api/usuarios
usuariosRouter.get('/', requireRole('admin'), async (_req: AuthRequest, res: Response): Promise<void> => {
  const usuarios = await prisma.usuario.findMany({
    select: {
      id: true, email: true, nombre: true, telefono: true,
      rol: true, matricula: true, activo: true, ultimoLogin: true, createdAt: true,
    },
    orderBy: { nombre: 'asc' },
  })
  res.json({ data: usuarios })
})

// GET /api/usuarios/:id
usuariosRouter.get('/:id', requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.params.id },
    select: {
      id: true, email: true, nombre: true, telefono: true,
      rol: true, matricula: true, activo: true, ultimoLogin: true, createdAt: true,
    },
  })
  if (!usuario) throw new AppError(404, 'Usuario no encontrado')
  res.json({ data: usuario })
})

// POST /api/usuarios
usuariosRouter.post(
  '/',
  requireRole('admin'),
  [
    body('email').isEmail().normalizeEmail(),
    body('nombre').notEmpty(),
    body('rol').isIn(['admin', 'abogado', 'captadora']),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'ValidationError', errors: errors.array() })
      return
    }

    // Generate temp password
    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!'
    const hash = await bcrypt.hash(tempPassword, 12)

    const usuario = await prisma.usuario.create({
      data: {
        ...req.body,
        passwordHash: hash,
      },
      select: {
        id: true, email: true, nombre: true, rol: true, createdAt: true,
      },
    })

    // TODO: send email with tempPassword via nodemailer

    res.status(201).json({ data: { ...usuario, tempPassword } })
  }
)

// PUT /api/usuarios/:id
usuariosRouter.put('/:id', requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { passwordHash, ...data } = req.body // never allow direct hash update here

  const usuario = await prisma.usuario.update({
    where: { id: req.params.id },
    data,
    select: {
      id: true, email: true, nombre: true, telefono: true,
      rol: true, matricula: true, activo: true,
    },
  })
  res.json({ data: usuario })
})

// DELETE /api/usuarios/:id (soft delete)
usuariosRouter.delete('/:id', requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.usuario.update({
    where: { id: req.params.id },
    data: { activo: false },
  })
  res.json({ data: { message: 'Usuario deshabilitado' } })
})
