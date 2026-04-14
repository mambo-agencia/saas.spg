'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { api } from '@/lib/api'
import { formatDate, formatRelative } from '@/lib/utils'
import type { FormularioInicio } from '@spg/shared'

type EstadoFilter = 'todos' | 'PENDIENTE' | 'GENERADO' | 'DESCARGADO'

const ESTADO_BADGE: Record<string, string> = {
  PENDIENTE: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  GENERADO: 'bg-blue-500/15 text-blue-400 border border-blue-500/25',
  DESCARGADO: 'bg-green-500/15 text-green-400 border border-green-500/25',
}

const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  GENERADO: 'Generado',
  DESCARGADO: 'Descargado',
}

interface FormularioRow extends FormularioInicio {
  caso: {
    id: string
    numeroCaso: string
    cliente?: { nombre: string } | null
    art?: { nombre: string } | null
    abogado?: { nombre: string } | null
    tipoAtEp: string
    jurisdiccion: string
  }
}

export function FormulariosClient() {
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('todos')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['formularios', estadoFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '100' })
      if (estadoFilter !== 'todos') params.set('estado', estadoFilter)
      const res = await api.get(`/formularios?${params}`)
      return res.data as { data: FormularioRow[]; total: number }
    },
  })

  const formularios = (data?.data ?? []).filter((f) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      f.caso.numeroCaso.toLowerCase().includes(q) ||
      f.caso.cliente?.nombre?.toLowerCase().includes(q) ||
      f.caso.abogado?.nombre?.toLowerCase().includes(q) ||
      f.caso.art?.nombre?.toLowerCase().includes(q)
    )
  })

  const stats = {
    total: data?.total ?? 0,
    pendientes: (data?.data ?? []).filter((f) => f.estado === 'PENDIENTE').length,
    generados: (data?.data ?? []).filter((f) => f.estado === 'GENERADO').length,
    descargados: (data?.data ?? []).filter((f) => f.estado === 'DESCARGADO').length,
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="page-title">Formularios de Inicio</h1>
        <Link href="/casos/nuevo" className="btn-primary">
          + Nuevo Caso
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total" value={stats.total} color="text-accent" />
        <StatCard label="Pendientes" value={stats.pendientes} color="text-amber-400" />
        <StatCard label="Generados" value={stats.generados} color="text-blue-400" />
        <StatCard label="Descargados" value={stats.descargados} color="text-green-400" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-64"
          placeholder="Buscar caso, cliente, ART..."
        />
        <div className="flex gap-1">
          {(['todos', 'PENDIENTE', 'GENERADO', 'DESCARGADO'] as EstadoFilter[]).map((e) => (
            <button
              key={e}
              onClick={() => setEstadoFilter(e)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                estadoFilter === e
                  ? 'bg-accent text-bg font-semibold'
                  : 'bg-bg-secondary border border-border text-text-secondary hover:text-text'
              }`}
            >
              {e === 'todos' ? 'Todos' : ESTADO_LABEL[e]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-text-secondary text-sm py-8 text-center">Cargando formularios...</div>
      ) : formularios.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-text-secondary text-sm">No hay formularios de inicio.</p>
          <p className="text-text-muted text-xs mt-1">
            Los formularios se crean desde la ficha de cada caso (pestaña SRT).
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg/50">
                <th className="text-left px-4 py-3 label">Caso</th>
                <th className="text-left px-4 py-3 label">Trabajador</th>
                <th className="text-left px-4 py-3 label">Abogado</th>
                <th className="text-left px-4 py-3 label">ART</th>
                <th className="text-left px-4 py-3 label">Estado</th>
                <th className="text-left px-4 py-3 label">Generado</th>
                <th className="text-right px-4 py-3 label">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {formularios.map((f) => (
                <tr key={f.id} className="border-b border-border/50 hover:bg-bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/casos/${f.caso.id}`} className="font-mono text-accent hover:underline text-xs">
                      {f.caso.numeroCaso}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text">
                    {f.caso.cliente?.nombre ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {f.caso.abogado?.nombre ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {f.caso.art?.nombre ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${ESTADO_BADGE[f.estado]}`}>
                      {ESTADO_LABEL[f.estado]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs">
                    {f.fechaGeneracion ? formatRelative(f.fechaGeneracion) : formatDate(f.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {f.linkGoogleDocs && (
                        <a
                          href={f.linkGoogleDocs}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent hover:underline"
                        >
                          Google Doc →
                        </a>
                      )}
                      {f.linkPdf && (
                        <a
                          href={f.linkPdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:underline"
                        >
                          PDF →
                        </a>
                      )}
                      <Link href={`/casos/${f.caso.id}`} className="btn-secondary text-xs py-1 px-2">
                        Ver caso
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card">
      <p className={`font-display text-3xl ${color}`}>{value}</p>
      <p className="text-xs text-text-secondary uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  )
}
