import { CasoResumen, Caso } from './caso'
import { EtapaCaso } from './enums'

// ─── GENERIC API RESPONSE ─────────────────────────────────

export interface ApiResponse<T = unknown> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiError {
  error: string
  message: string
  statusCode: number
}

// ─── AUTH ─────────────────────────────────────────────────

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  usuario: {
    id: string
    email: string
    nombre: string
    rol: string
  }
}

// ─── CASOS ────────────────────────────────────────────────

export interface GetCasosParams {
  etapa?: EtapaCaso
  rart?: string
  captadoraId?: string
  abogadoId?: string
  jurisdiccion?: string
  tipoAtEp?: string
  search?: string
  page?: number
  limit?: number
}

export interface KanbanData {
  etapa: EtapaCaso
  casos: CasoResumen[]
  total: number
}

// ─── DASHBOARD ────────────────────────────────────────────

export interface DashboardResumen {
  totalCasos: number
  extrajudicial: number
  judicial: number
  acuerdosCerrados: number
  desglose: Record<EtapaCaso, number>
}

export interface UltimoMovimiento {
  casoId: string
  numeroCaso: string
  descripcion: string
  sistema: string
  createdAt: string
}

// ─── ANÁLISIS ─────────────────────────────────────────────

export interface AnalisisPorEtapa {
  etapa: EtapaCaso
  cantidad: number
}

export interface AnalisisPorCaptadora {
  captadoraId: string
  captadoraNombre: string
  cantidad: number
  porcentaje: number
}

export interface AnalisisTimeline {
  mes: string
  cantidad: number
}

export interface AnalisisVelocidad {
  etapaOrigen: EtapaCaso
  etapaDestino: EtapaCaso
  promedioDias: number
}

// ─── CONEXIONES ───────────────────────────────────────────

export interface EstadoConexionSistema {
  sistema: string
  estado: string
  ultimaSincronizacion?: string
  proximaSincronizacion?: string
  casosSincronizados: number
  intentosFallidos: number
  intervalomMinutos: number
}
