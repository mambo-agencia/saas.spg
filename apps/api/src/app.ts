import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import path from 'path'

import { authRouter } from './routes/auth'
import { usuariosRouter } from './routes/usuarios'
import { clientesRouter } from './routes/clientes'
import { casosRouter } from './routes/casos'
import { eventosRouter } from './routes/eventos'
import { analisisRouter } from './routes/analisis'
import { conexionesRouter } from './routes/conexiones'
import { notasRouter } from './routes/notas'
import { artsRouter } from './routes/arts'
import { abogadosRouter } from './routes/abogados'
import { errorHandler } from './middleware/errorHandler'
import { notFound } from './middleware/notFound'
import { logger } from './lib/logger'

const app = express()

// ─── SECURITY & MIDDLEWARE ────────────────────────────────

app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  })
)
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// HTTP logging
app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  })
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api', limiter)

// Static files (uploads)
app.use(
  '/uploads',
  express.static(path.join(process.cwd(), 'uploads'))
)

// ─── HEALTH CHECK ─────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── ROUTES ───────────────────────────────────────────────

app.use('/api/auth', authRouter)
app.use('/api/usuarios', usuariosRouter)
app.use('/api/clientes', clientesRouter)
app.use('/api/casos', casosRouter)
app.use('/api/eventos', eventosRouter)
app.use('/api/analisis', analisisRouter)
app.use('/api/conexiones', conexionesRouter)
app.use('/api/notas-usuario', notasRouter)
app.use('/api/arts', artsRouter)
app.use('/api/abogados', abogadosRouter)

// ─── ERROR HANDLERS ───────────────────────────────────────

app.use(notFound)
app.use(errorHandler)

export default app
