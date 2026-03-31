import { Router, Response } from 'express'
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { encrypt, decrypt } from '../lib/encrypt'
import { syncQueue } from '../jobs/queues'

export const conexionesRouter = Router()
conexionesRouter.use(requireAuth)

// GET /api/conexiones
conexionesRouter.get('/', async (_req: AuthRequest, res: Response): Promise<void> => {
  const credenciales = await prisma.credencial.findMany({
    select: {
      id: true,
      sistema: true,
      estadoConexion: true,
      ultimaSincronizacion: true,
      ultimaPrueba: true,
      intentosFallidos: true,
      intervaloSincronizacionMinutos: true,
      createdAt: true,
      updatedAt: true,
      // Never return encrypted creds
    },
  })

  // Attach sync logs per system
  const logs = await prisma.syncLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  res.json({ data: { credenciales, recentLogs: logs } })
})

// PUT /api/conexiones/:sistema - Update credentials
conexionesRouter.put(
  '/:sistema',
  requireRole('admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { usuario, password, intervaloMinutos } = req.body

    const data: Record<string, unknown> = {}
    if (usuario) data.usuarioEncrypted = encrypt(usuario)
    if (password) data.passwordEncrypted = encrypt(password)
    if (intervaloMinutos) data.intervaloSincronizacionMinutos = parseInt(intervaloMinutos)

    const cred = await prisma.credencial.upsert({
      where: { sistema: req.params.sistema as never },
      create: {
        sistema: req.params.sistema as never,
        ...data,
      },
      update: data,
      select: {
        id: true, sistema: true, estadoConexion: true,
        ultimaSincronizacion: true, intervaloSincronizacionMinutos: true,
      },
    })

    res.json({ data: cred })
  }
)

// POST /api/conexiones/:sistema/test
conexionesRouter.post(
  '/:sistema/test',
  requireRole('admin', 'abogado'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    await syncQueue.add(
      'test-connection',
      { sistema: req.params.sistema, test: true },
      { attempts: 1 }
    )

    res.json({ data: { message: 'Prueba de conexión encolada' } })
  }
)

// POST /api/conexiones/:sistema/sync
conexionesRouter.post(
  '/:sistema/sync',
  requireRole('admin', 'abogado'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    await syncQueue.add(
      'manual-sync',
      { sistema: req.params.sistema },
      { attempts: 2 }
    )

    res.json({ data: { message: 'Sincronización manual encolada' } })
  }
)

// GET /api/conexiones/:sistema/logs
conexionesRouter.get('/:sistema/logs', async (req: AuthRequest, res: Response): Promise<void> => {
  const logs = await prisma.syncLog.findMany({
    where: { sistema: req.params.sistema as never },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  res.json({ data: logs })
})
