import { Router, Response } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'

export const autocompleteRouter = Router()
autocompleteRouter.use(requireAuth)

// ─── LESIONES FRECUENTES ──────────────────────────────────
const LESIONES_FRECUENTES = [
  'POLITRAUMATISMO',
  'FRACTURA DE COSTILLAS',
  'FRACTURA DE CLAVÍCULA',
  'FRACTURA DE RADIO',
  'FRACTURA DE CÚBITO',
  'FRACTURA DE TIBIA',
  'FRACTURA DE PERONÉ',
  'FRACTURA DE HÚMERO',
  'FRACTURA DE FÉMUR',
  'FRACTURA DE VÉRTEBRA',
  'HERIDA LACEROCONTUSA',
  'HERIDA CORTANTE',
  'LESIÓN DORSOLUMBAR',
  'LUMBALGIA',
  'CERVICOBRAQUIALGIA',
  'CERVICALGIA',
  'DORSALGIA',
  'SÍNDROME DEL TÚNEL CARPIANO',
  'SÍNDROME DE MANGUITO ROTADOR',
  'LESIÓN DE HOMBRO',
  'RUPTURA DE MENISCO',
  'ESGUINCE DE TOBILLO',
  'ESGUINCE DE RODILLA',
  'CONTUSIÓN',
  'APLASTAMIENTO DE DEDOS',
  'AMPUTACIÓN TRAUMÁTICA',
  'QUEMADURAS',
  'HIPOACUSIA LABORAL',
  'EPICONDILITIS',
  'TENDINITIS',
  'BURSITIS',
  'HERNIA DISCAL',
  'ENFERMEDAD CELÍACA LABORAL',
  'SILICOSIS',
  'ASBESTOSIS',
  'DERMATITIS DE CONTACTO',
  'ESTRÉS LABORAL',
  'TRASTORNO DE ESTRÉS POST-TRAUMÁTICO',
]

const REGIONES_AFECTADAS = [
  'COLUMNA CERVICAL',
  'COLUMNA DORSAL',
  'COLUMNA LUMBAR',
  'COLUMNA DORSO-LUMBAR',
  'COLUMNA CERVICO-DORSAL',
  'HOMBRO DERECHO',
  'HOMBRO IZQUIERDO',
  'AMBOS HOMBROS',
  'CODO DERECHO',
  'CODO IZQUIERDO',
  'MUÑECA DERECHA',
  'MUÑECA IZQUIERDA',
  'MANO DERECHA',
  'MANO IZQUIERDA',
  'AMBAS MANOS',
  'RODILLA DERECHA',
  'RODILLA IZQUIERDA',
  'TOBILLO DERECHO',
  'TOBILLO IZQUIERDO',
  'PIE DERECHO',
  'PIE IZQUIERDO',
  'CADERA DERECHA',
  'CADERA IZQUIERDA',
  'TÓRAX',
  'CABEZA Y CUELLO',
  'MIEMBRO SUPERIOR DERECHO',
  'MIEMBRO SUPERIOR IZQUIERDO',
  'MIEMBRO INFERIOR DERECHO',
  'MIEMBRO INFERIOR IZQUIERDO',
  'MIEMBROS SUPERIORES',
  'MIEMBROS INFERIORES',
  'SISTEMA AUDITIVO',
  'SISTEMA RESPIRATORIO',
  'SISTEMA NERVIOSO CENTRAL',
  'SISTEMA NERVIOSO PERIFÉRICO',
  'PSIQUIS',
  'POLITOPOGRÁFICA',
]

// GET /api/autocomplete/lesiones?q=...
autocompleteRouter.get('/lesiones', (req: AuthRequest, res: Response): void => {
  const q = ((req.query.q as string) ?? '').toUpperCase().trim()
  const results = q
    ? LESIONES_FRECUENTES.filter((l) => l.includes(q)).slice(0, 10)
    : LESIONES_FRECUENTES.slice(0, 10)
  res.json({ data: results })
})

// GET /api/autocomplete/regiones?q=...
autocompleteRouter.get('/regiones', (req: AuthRequest, res: Response): void => {
  const q = ((req.query.q as string) ?? '').toUpperCase().trim()
  const results = q
    ? REGIONES_AFECTADAS.filter((r) => r.includes(q)).slice(0, 10)
    : REGIONES_AFECTADAS.slice(0, 10)
  res.json({ data: results })
})

// GET /api/autocomplete/empleadores?q=...
autocompleteRouter.get('/empleadores', async (req: AuthRequest, res: Response): Promise<void> => {
  const q = ((req.query.q as string) ?? '').trim()
  const empleadores = await prisma.empleador.findMany({
    where: q
      ? { nombre: { contains: q, mode: 'insensitive' } }
      : undefined,
    take: 10,
    orderBy: { nombre: 'asc' },
  })
  res.json({ data: empleadores })
})

// POST /api/autocomplete/empleadores — guardar empleador nuevo para autocomplete futuro
autocompleteRouter.post('/empleadores', async (req: AuthRequest, res: Response): Promise<void> => {
  const { nombre, cuit, domicilio, localidad, provincia } = req.body
  if (!nombre) {
    res.status(400).json({ error: 'nombre requerido' })
    return
  }
  const empleador = await prisma.empleador.upsert({
    where: { nombre },
    create: { nombre, cuit, domicilio, localidad, provincia },
    update: { cuit: cuit ?? undefined, domicilio: domicilio ?? undefined },
  })
  res.json({ data: empleador })
})
