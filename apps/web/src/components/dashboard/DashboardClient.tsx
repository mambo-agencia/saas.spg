'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatDate, formatRelative, ETAPA_LABELS } from '@/lib/utils'
import { EtapaCaso } from '@spg/shared'
import type { DashboardResumen, UltimoMovimiento } from '@spg/shared'

export function DashboardClient() {
  const today = new Date()

  const { data: resumen } = useQuery<DashboardResumen>({
    queryKey: ['dashboard', 'resumen'],
    queryFn: async () => {
      const res = await api.get('/analisis/resumen')
      return res.data.data
    },
  })

  const { data: eventosHoy } = useQuery({
    queryKey: ['eventos', 'hoy'],
    queryFn: async () => {
      const res = await api.get('/eventos/hoy')
      return res.data.data
    },
  })

  const { data: notasData, refetch: refetchNotas } = useQuery({
    queryKey: ['notas'],
    queryFn: async () => {
      const res = await api.get('/notas-usuario')
      return res.data.data
    },
  })

  const { data: movimientos } = useQuery<UltimoMovimiento[]>({
    queryKey: ['analisis', 'movimientos'],
    queryFn: async () => {
      const res = await api.get('/analisis/ultimos-movimientos')
      return res.data.data
    },
  })

  const dateLabel = today.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-text-secondary text-sm capitalize">{dateLabel}</p>
      </div>

      {/* Top row: Notas + Eventos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Mis Notas */}
        <div className="card">
          <h2 className="section-title text-base mb-4">MIS NOTAS</h2>
          <div className="space-y-2">
            {notasData?.length === 0 && (
              <p className="text-text-secondary text-sm">Sin notas. ¡Creá la primera!</p>
            )}
            {notasData?.slice(0, 6).map((nota: { id: string; contenido: string; completada: boolean }) => (
              <div key={nota.id} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={nota.completada}
                  onChange={async () => {
                    await api.put(`/notas-usuario/${nota.id}`, { completada: !nota.completada })
                    refetchNotas()
                  }}
                  className="mt-0.5 accent-accent"
                />
                <span
                  className={nota.completada ? 'line-through text-text-secondary text-sm' : 'text-sm'}
                >
                  {nota.contenido}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={async () => {
              const text = prompt('Nueva nota:')
              if (text) {
                await api.post('/notas-usuario', { contenido: text })
                refetchNotas()
              }
            }}
            className="btn-ghost mt-3 text-xs"
          >
            + Nueva nota
          </button>
        </div>

        {/* Eventos Hoy */}
        <div className="card">
          <h2 className="section-title text-base mb-4">EVENTOS DE HOY</h2>
          {eventosHoy?.length === 0 ? (
            <p className="text-text-secondary text-sm">Sin eventos hoy</p>
          ) : (
            <div className="space-y-3">
              {eventosHoy?.map((evento: { id: string; fechaEvento: string; titulo: string; caso?: { numeroCaso: string; autos?: string }; tipoEvento: string }) => (
                <div key={evento.id} className="flex gap-3 items-start">
                  <span className="text-xs text-accent font-mono mt-0.5 min-w-[42px]">
                    {new Date(evento.fechaEvento).toLocaleTimeString('es-AR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-text">{evento.titulo}</p>
                    {evento.caso && (
                      <p className="text-xs text-text-secondary">{evento.caso.numeroCaso}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Panorama de Casos */}
      {resumen && (
        <div>
          <h2 className="section-title mb-4">PANORAMA DE CASOS</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="stat-card">
              <span className="stat-number">{resumen.totalCasos}</span>
              <span className="stat-label">Total Activos</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{resumen.extrajudicial}</span>
              <span className="stat-label">Extrajudicial</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{resumen.judicial}</span>
              <span className="stat-label">Judicial</span>
            </div>
          </div>

          {/* Desglose */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <p className="text-xs text-text-secondary uppercase tracking-wider mb-3">Desglose Extrajudicial</p>
              {[EtapaCaso.SRT, EtapaCaso.LITIGIOS_EXTRAJUDICIAL, EtapaCaso.NEGOCIACIONES].map((etapa) => (
                <div key={etapa} className="flex justify-between text-sm py-1 border-b border-border last:border-0">
                  <span className="text-text-secondary">{ETAPA_LABELS[etapa]}</span>
                  <span className="text-accent font-mono">{resumen.desglose[etapa] ?? 0}</span>
                </div>
              ))}
            </div>
            <div className="card">
              <p className="text-xs text-text-secondary uppercase tracking-wider mb-3">Desglose Judicial</p>
              {[EtapaCaso.LITIGIOS_JUDICIAL, EtapaCaso.SENTENCIADO, EtapaCaso.ACUERDO_CERRADO, EtapaCaso.CONGELADO].map((etapa) => (
                <div key={etapa} className="flex justify-between text-sm py-1 border-b border-border last:border-0">
                  <span className="text-text-secondary">{ETAPA_LABELS[etapa]}</span>
                  <span className="text-accent font-mono">{resumen.desglose[etapa] ?? 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Últimos movimientos */}
      {movimientos && movimientos.length > 0 && (
        <div className="card">
          <h2 className="section-title text-base mb-4">ÚLTIMOS MOVIMIENTOS EN EXPEDIENTES</h2>
          <div className="space-y-2">
            {movimientos.slice(0, 8).map((mov) => (
              <div key={mov.casoId + mov.createdAt} className="flex items-center gap-3 text-sm py-1.5 border-b border-border/50 last:border-0">
                <span className="text-xs font-mono text-accent min-w-[100px]">{mov.numeroCaso}</span>
                <span className="flex-1 text-text-secondary truncate">{mov.descripcion}</span>
                <span className="text-xs text-text-muted min-w-[70px] text-right">{formatRelative(mov.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
