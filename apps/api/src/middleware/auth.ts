import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    rol: string
    nombre: string
  }
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized', message: 'Token requerido' })
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? '') as {
      id: string
      email: string
      rol: string
      nombre: string
    }

    // Verify user still exists and is active
    const user = await prisma.usuario.findUnique({
      where: { id: payload.id, activo: true },
      select: { id: true, email: true, rol: true, nombre: true },
    })

    if (!user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Usuario no encontrado' })
      return
    }

    req.user = user
    next()
  } catch {
    res.status(401).json({ error: 'Unauthorized', message: 'Token inválido o expirado' })
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.rol)) {
      res.status(403).json({ error: 'Forbidden', message: 'Sin permisos suficientes' })
      return
    }
    next()
  }
}
