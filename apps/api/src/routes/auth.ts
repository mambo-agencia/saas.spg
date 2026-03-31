import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthRequest } from '../middleware/auth'

export const authRouter = Router()

const JWT_SECRET = process.env.JWT_SECRET ?? 'CHANGE_ME'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d'

// POST /api/auth/login
authRouter.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'ValidationError', errors: errors.array() })
      return
    }

    const { email, password } = req.body

    const usuario = await prisma.usuario.findUnique({ where: { email } })

    if (!usuario || !usuario.activo) {
      res.status(401).json({ error: 'Unauthorized', message: 'Credenciales inválidas' })
      return
    }

    const valid = await bcrypt.compare(password, usuario.passwordHash)
    if (!valid) {
      res.status(401).json({ error: 'Unauthorized', message: 'Credenciales inválidas' })
      return
    }

    // Update ultimo_login
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoLogin: new Date() },
    })

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    )

    res.json({
      data: {
        accessToken: token,
        usuario: {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          rol: usuario.rol,
        },
      },
    })
  }
)

// POST /api/auth/me
authRouter.get('/me', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      nombre: true,
      telefono: true,
      rol: true,
      matricula: true,
      activo: true,
      ultimoLogin: true,
    },
  })
  res.json({ data: usuario })
})

// POST /api/auth/change-password
authRouter.post(
  '/change-password',
  requireAuth,
  [body('newPassword').isLength({ min: 8 })],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'ValidationError', errors: errors.array() })
      return
    }

    const hash = await bcrypt.hash(req.body.newPassword, 12)
    await prisma.usuario.update({
      where: { id: req.user!.id },
      data: { passwordHash: hash },
    })

    res.json({ data: { message: 'Contraseña actualizada' } })
  }
)
