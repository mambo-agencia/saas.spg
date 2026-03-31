'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { TipoEvento, EVENTO_COLORES } from '@spg/shared'
import { formatDate } from '@/lib/utils'

const TIPO_LABELS: Record<TipoEvento, string> = {
  [TipoEvento.HOMOLOGACION]: 'Homologación',
  [TipoEvento.REVISION_MEDICA]: 'Revisión Médica',
  [TipoEvento.CUMPLEANOS]: 'Cumpleaños',
  [TipoEvento.REUNION]: 'Reunión',
  [TipoEvento.ENTREVISTA]: 'Entrevista',
  [TipoEvento.AUDIENCIA]: 'Audiencia',
  [TipoEvento.SENTENCIA]: 'Sentencia',
  [TipoEvento.OTRA]: 'Otra',
}

export function AgendaClient() {
  const qc = useQueryClient()
  const now = new Date()
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [anio, setAnio] = useState(now.getFullYear())
  const [showForm, setShowForm] = useState(false)

  const { data: eventos } = useQuery({
    queryKey: ['eventos', 'calendario', anio, mes],
    queryFn: async () => {
      const res = await api.get(`/eventos/calendario/${anio}/${mes}`)
      return res.data.data
    },
  })

  function prevMes() {
    if (mes === 1) { setMes(12); setAnio(a => a - 1) }
    else setMes(m => m - 1)
  }

  function nextMes() {
    if (mes === 12) { setMes(1); setAnio(a => a + 1) }
    else setMes(m => m + 1)
  }

  const mesLabel = new Date(anio, mes - 1).toLocaleDateString('es-AR', {
    month: 'long',
    year: 'numeric',
  })

  // Build calendar grid
  const firstDay = new Date(anio, mes - 1, 1).getDay()
  const daysInMonth = new Date(anio, mes, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  function getEventosForDay(day: number) {
    return eventos?.filter((e: { fechaEvento: string }) => {
      const d = new Date(e.fechaEvento)
      return d.getDate() === day && d.getMonth() + 1 === mes && d.getFullYear() === anio
    }) ?? []
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Agenda</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + Nuevo Evento
        </button>
      </div>

      {/* Month nav */}
      <div className="flex items-center gap-4">
        <button onClick={prevMes} className="btn-ghost px-3">←</button>
        <h2 className="font-display text-xl text-text capitalize min-w-[200px] text-center">
          {mesLabel}
        </h2>
        <button onClick={nextMes} className="btn-ghost px-3">→</button>
      </div>

      {/* Calendar */}
      <div className="card p-3">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d) => (
            <div key={d} className="text-center text-xs text-text-secondary py-1 font-medium">
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />
            const dayEvents = getEventosForDay(day)
            const isToday =
              day === now.getDate() && mes === now.getMonth() + 1 && anio === now.getFullYear()

            return (
              <div
                key={i}
                className={`min-h-[72px] p-1.5 rounded border text-sm transition-colors ${
                  isToday
                    ? 'border-accent/50 bg-accent/5'
                    : 'border-border hover:border-border-hover'
                }`}
              >
                <span className={`text-xs font-mono ${isToday ? 'text-accent font-bold' : 'text-text-secondary'}`}>
                  {day}
                </span>
                <div className="mt-1 space-y-0.5">
                  {dayEvents.slice(0, 3).map((ev: { id: string; titulo: string; tipoEvento: TipoEvento }) => (
                    <div
                      key={ev.id}
                      className="text-xs px-1 py-0.5 rounded truncate"
                      style={{
                        backgroundColor: `${EVENTO_COLORES[ev.tipoEvento]}22`,
                        color: EVENTO_COLORES[ev.tipoEvento],
                        borderLeft: `2px solid ${EVENTO_COLORES[ev.tipoEvento]}`,
                      }}
                    >
                      {ev.titulo}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-text-muted">+{dayEvents.length - 3} más</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Upcoming events list */}
      <div className="card">
        <h2 className="section-title text-sm mb-4">PRÓXIMOS EVENTOS</h2>
        <div className="space-y-2">
          {eventos?.slice(0, 10).map((ev: { id: string; fechaEvento: string; titulo: string; tipoEvento: TipoEvento; caso?: { numeroCaso: string } }) => (
            <div key={ev.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: EVENTO_COLORES[ev.tipoEvento] }}
              />
              <span className="text-xs text-text-secondary min-w-[90px]">
                {formatDate(ev.fechaEvento)}
              </span>
              <span className="flex-1 text-sm text-text">{ev.titulo}</span>
              <span className="text-xs px-2 py-0.5 rounded border" style={{
                color: EVENTO_COLORES[ev.tipoEvento],
                borderColor: `${EVENTO_COLORES[ev.tipoEvento]}40`,
                backgroundColor: `${EVENTO_COLORES[ev.tipoEvento]}15`,
              }}>
                {TIPO_LABELS[ev.tipoEvento]}
              </span>
              {ev.caso && (
                <span className="text-xs text-accent font-mono">{ev.caso.numeroCaso}</span>
              )}
            </div>
          ))}
          {(!eventos || eventos.length === 0) && (
            <p className="text-text-secondary text-sm">Sin eventos este mes</p>
          )}
        </div>
      </div>
    </div>
  )
}
