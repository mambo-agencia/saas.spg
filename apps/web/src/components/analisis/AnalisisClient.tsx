'use client'

import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from 'recharts'
import { api } from '@/lib/api'
import { ETAPA_LABELS, TIPO_AT_EP_LABELS } from '@/lib/utils'

const COLORS = ['#b4ff3c', '#4AFF8A', '#60a5fa', '#a78bfa', '#fbbf24', '#f97316', '#6b7280']

export function AnalisisClient() {
  const { data: porEtapa } = useQuery({
    queryKey: ['analisis', 'por-etapa'],
    queryFn: async () => {
      const res = await api.get('/analisis/por-etapa')
      return res.data.data.map((d: { etapa: string; cantidad: number }) => ({
        name: ETAPA_LABELS[d.etapa as keyof typeof ETAPA_LABELS] ?? d.etapa,
        value: d.cantidad,
      }))
    },
  })

  const { data: porTipo } = useQuery({
    queryKey: ['analisis', 'por-tipo'],
    queryFn: async () => {
      const res = await api.get('/analisis/por-tipo')
      return res.data.data.map((d: { tipo: string; cantidad: number }) => ({
        name: TIPO_AT_EP_LABELS[d.tipo] ?? d.tipo,
        value: d.cantidad,
      }))
    },
  })

  const { data: porRart } = useQuery({
    queryKey: ['analisis', 'por-rart'],
    queryFn: async () => {
      const res = await api.get('/analisis/por-rart')
      return res.data.data
    },
  })

  const { data: porCaptadora } = useQuery({
    queryKey: ['analisis', 'por-captadora'],
    queryFn: async () => {
      const res = await api.get('/analisis/por-captadora')
      return res.data.data
    },
  })

  const { data: timeline } = useQuery({
    queryKey: ['analisis', 'timeline'],
    queryFn: async () => {
      const res = await api.get('/analisis/timeline-iniciados')
      return res.data.data
    },
  })

  const { data: conversion } = useQuery({
    queryKey: ['analisis', 'conversion'],
    queryFn: async () => {
      const res = await api.get('/analisis/tasa-conversion')
      return res.data.data
    },
  })

  const tooltipStyle = {
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    color: '#f5f5f5',
    fontSize: '12px',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="page-title">Análisis</h1>

      {/* Tasa de Conversión */}
      {conversion && (
        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card">
            <span className="stat-number">{conversion.total}</span>
            <span className="stat-label">Casos en proceso</span>
          </div>
          <div className="stat-card">
            <span className="stat-number text-green-400">{conversion.acuerdosCerrados}</span>
            <span className="stat-label">Acuerdos Cerrados ({conversion.tasaAcuerdo}%)</span>
          </div>
          <div className="stat-card">
            <span className="stat-number text-blue-400">{conversion.sentenciados}</span>
            <span className="stat-label">Sentenciados ({conversion.tasaJudicial}%)</span>
          </div>
        </div>
      )}

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Por Etapa */}
        <div className="card">
          <h2 className="section-title text-sm mb-4">CASOS POR ETAPA</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={porEtapa} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="name" tick={{ fill: '#a0a0a0', fontSize: 10 }} />
              <YAxis tick={{ fill: '#a0a0a0', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" fill="#b4ff3c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Por Tipo AT/EP */}
        <div className="card">
          <h2 className="section-title text-sm mb-4">CASOS POR TIPO</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={porTipo} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {porTipo?.map((_: unknown, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Timeline */}
      {timeline && (
        <div className="card">
          <h2 className="section-title text-sm mb-4">CASOS INICIADOS (ÚLTIMOS 12 MESES)</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={timeline} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="mes" tick={{ fill: '#a0a0a0', fontSize: 11 }} />
              <YAxis tick={{ fill: '#a0a0a0', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="cantidad" stroke="#b4ff3c" strokeWidth={2} dot={{ fill: '#b4ff3c', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Por RART */}
        {porRart && (
          <div className="card">
            <h2 className="section-title text-sm mb-4">CASOS POR ART (TOP 10)</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={porRart.map((d: { artNombre: string; cantidad: number }) => ({ name: d.artNombre, value: d.cantidad }))} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis type="number" tick={{ fill: '#a0a0a0', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#a0a0a0', fontSize: 10 }} width={80} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#4AFF8A" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Por Captadora */}
        {porCaptadora && (
          <div className="card">
            <h2 className="section-title text-sm mb-4">CASOS POR CAPTADORA</h2>
            <div className="space-y-2">
              {porCaptadora.map((d: { captadoraId: string; captadoraNombre: string; cantidad: number; porcentaje: number }) => (
                <div key={d.captadoraId} className="flex items-center gap-3">
                  <span className="text-sm text-text w-32 truncate">{d.captadoraNombre}</span>
                  <div className="flex-1 bg-bg rounded-full h-2">
                    <div
                      className="bg-accent h-2 rounded-full"
                      style={{ width: `${d.porcentaje}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-accent w-8 text-right">{d.cantidad}</span>
                  <span className="text-xs text-text-secondary w-8">{d.porcentaje}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
