import { Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { AuthRequest } from './auth'

export function audit(entidad: string, accion: string) {
  return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    // This runs after the route handler via a response interceptor pattern
    // For simplicity, we log on the way in (create/update/delete)
    try {
      const idEntidad =
        req.params.id ?? req.params.casoId ?? req.params.comentarioId ?? undefined

      await prisma.auditLog.create({
        data: {
          usuarioId: req.user?.id,
          entidad,
          accion,
          idEntidad,
          cambiosJson: req.body ?? undefined,
        },
      })
    } catch {
      // Non-blocking — audit errors should never break the request
    }
    next()
  }
}
