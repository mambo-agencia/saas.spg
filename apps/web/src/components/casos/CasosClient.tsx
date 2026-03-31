'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import Link from 'next/link'
import { api } from '@/lib/api'
import { EtapaCaso } from '@spg/shared'
import { ETAPA_LABELS, ETAPA_BADGE_CLASS, TIPO_AT_EP_LABELS } from '@/lib/utils'

const KANBAN_COLUMNS: EtapaCaso[] = [
  EtapaCaso.SRT,
  EtapaCaso.LITIGIOS_EXTRAJUDICIAL,
  EtapaCaso.NEGOCIACIONES,
  EtapaCaso.LITIGIOS_JUDICIAL,
  EtapaCaso.CONGELADO,
]

interface CasoCard {
  id: string
  numeroCaso: string
  autos?: string
  cliente?: { nombre: string }
  art?: { nombre: string }
  captadora?: { nombre: string }
  abogado?: { nombre: string }
  tipoAtEp: string
  etapa: EtapaCaso
  updatedAt: string
}

export function CasosClient() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')

  const { data: kanbanData, isLoading } = useQuery({
    queryKey: ['casos', 'kanban'],
    queryFn: async () => {
      const res = await api.get('/casos/kanban')
      return res.data.data as Array<{ etapa: EtapaCaso; casos: CasoCard[]; total: number }>
    },
  })

  const cambiarEtapaMutation = useMutation({
    mutationFn: async ({ id, etapa }: { id: string; etapa: EtapaCaso }) => {
      await api.put(`/casos/${id}/etapa`, { etapa })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['casos'] }),
  })

  function onDragEnd(result: DropResult) {
    if (!result.destination) return

    const { draggableId, destination } = result
    const newEtapa = destination.droppableId as EtapaCaso

    cambiarEtapaMutation.mutate({ id: draggableId, etapa: newEtapa })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-text-secondary">
        Cargando casos...
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="page-title">Casos</h1>
        <div className="flex gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input w-64"
            placeholder="Buscar caso, cliente..."
          />
          <Link href="/casos/nuevo" className="btn-primary">
            + Nuevo Caso
          </Link>
        </div>
      </div>

      {/* Kanban */}
      <div className="overflow-x-auto pb-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-3 min-w-max">
            {KANBAN_COLUMNS.map((etapa) => {
              const col = kanbanData?.find((c) => c.etapa === etapa)
              const casos = col?.casos ?? []
              const total = col?.total ?? 0

              return (
                <div key={etapa} className="w-72 flex-shrink-0">
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className={`badge text-xs uppercase tracking-wider ${ETAPA_BADGE_CLASS[etapa]}`}>
                      {ETAPA_LABELS[etapa]}
                    </span>
                    <span className="text-text-secondary text-xs font-mono">{total}</span>
                  </div>

                  {/* Column body */}
                  <Droppable droppableId={etapa}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`kanban-column min-h-[400px] transition-colors ${
                          snapshot.isDraggingOver ? 'bg-accent/5 border border-accent/20' : ''
                        }`}
                      >
                        {casos.map((caso, index) => (
                          <Draggable key={caso.id} draggableId={caso.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`kanban-card ${snapshot.isDragging ? 'border-accent/50 shadow-glow-sm rotate-1' : ''}`}
                              >
                                <Link href={`/casos/${caso.id}`} onClick={(e) => {
                                  if (snapshot.isDragging) e.preventDefault()
                                }}>
                                  <p className="text-xs font-mono text-accent mb-1">{caso.numeroCaso}</p>
                                  <p className="text-sm font-medium text-text leading-snug line-clamp-2 mb-2">
                                    {caso.autos ?? caso.cliente?.nombre ?? 'Sin título'}
                                  </p>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {caso.art && (
                                      <span className="text-xs text-text-secondary bg-bg px-1.5 py-0.5 rounded">
                                        {caso.art.nombre}
                                      </span>
                                    )}
                                    <span className="text-xs text-text-muted">
                                      {TIPO_AT_EP_LABELS[caso.tipoAtEp]?.slice(0, 12)}
                                    </span>
                                  </div>
                                  {caso.captadora && (
                                    <p className="text-xs text-text-muted mt-1.5">
                                      📍 {caso.captadora.nombre}
                                    </p>
                                  )}
                                </Link>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              )
            })}
          </div>
        </DragDropContext>
      </div>
    </div>
  )
}
