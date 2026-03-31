'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'

const SISTEMAS = [
  { key: 'MEV', label: 'MEV', descripcion: 'Ministerio de Economía — Expedientes públicos', publica: true },
  { key: 'SRT', label: 'SRT', descripcion: 'Superintendencia de Riesgos del Trabajo', publica: false },
  { key: 'PJN_BA', label: 'PJN Buenos Aires', descripcion: 'Poder Judicial de la Nación — Pcia. BA', publica: false },
  { key: 'PJN_NEUQUEN', label: 'PJN Neuquén', descripcion: 'Poder Judicial de Neuquén', publica: false },
  { key: 'PJN_RIO_NEGRO', label: 'PJN Río Negro', descripcion: 'Poder Judicial de Río Negro', publica: false },
]

interface Credencial {
  sistema: string
  estadoConexion: string
  ultimaSincronizacion?: string
  intentosFallidos: number
  intervaloSincronizacionMinutos: number
}

export function ConexionesClient() {
  const qc = useQueryClient()
  const [editando, setEditando] = useState<string | null>(null)
  const [creds, setCreds] = useState({ usuario: '', password: '' })

  const { data } = useQuery({
    queryKey: ['conexiones'],
    queryFn: async () => {
      const res = await api.get('/conexiones')
      return res.data.data
    },
  })

  const syncMutation = useMutation({
    mutationFn: (sistema: string) => api.post(`/conexiones/${sistema}/sync`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conexiones'] }),
  })

  const testMutation = useMutation({
    mutationFn: (sistema: string) => api.post(`/conexiones/${sistema}/test`),
  })

  const updateCredsM = useMutation({
    mutationFn: ({ sistema, data }: { sistema: string; data: Record<string, string> }) =>
      api.put(`/conexiones/${sistema}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conexiones'] })
      setEditando(null)
    },
  })

  const credMap: Record<string, Credencial> = {}
  data?.credenciales?.forEach((c: Credencial) => { credMap[c.sistema] = c })

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="page-title">Conexiones</h1>
      <p className="text-text-secondary text-sm">
        Gestionar credenciales y sincronización con organismos externos
      </p>

      <div className="grid grid-cols-1 gap-4">
        {SISTEMAS.map((sys) => {
          const cred = credMap[sys.key]
          const isConnected = cred?.estadoConexion === 'conectada'
          const isError = cred?.estadoConexion === 'error'

          return (
            <div key={sys.key} className="card">
              <div className="flex items-start gap-4">
                {/* Status indicator */}
                <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                  isConnected ? 'bg-green-400' :
                  isError ? 'bg-red-400' :
                  'bg-zinc-600'
                }`} />

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-display text-lg text-text">{sys.label}</h3>
                    <span className={`badge text-xs ${
                      isConnected ? 'badge-acuerdo' :
                      isError ? 'bg-red-500/15 text-red-400 border border-red-500/25' :
                      'badge-congelado'
                    }`}>
                      {isConnected ? 'Conectada' : isError ? 'Error' : 'Pendiente'}
                    </span>
                    {sys.publica && (
                      <span className="badge text-xs bg-blue-500/15 text-blue-400 border border-blue-500/25">Pública</span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary">{sys.descripcion}</p>
                  {cred?.ultimaSincronizacion && (
                    <p className="text-xs text-text-muted mt-1">
                      Última sync: {formatDateTime(cred.ultimaSincronizacion)}
                    </p>
                  )}
                  {cred?.intentosFallidos > 0 && (
                    <p className="text-xs text-red-400 mt-0.5">
                      {cred.intentosFallidos} intento(s) fallido(s)
                    </p>
                  )}

                  {/* Credential form */}
                  {editando === sys.key && (
                    <div className="mt-3 p-3 bg-bg rounded border border-border space-y-2">
                      <div>
                        <label className="label">Usuario</label>
                        <input
                          type="text"
                          className="input"
                          value={creds.usuario}
                          onChange={(e) => setCreds((c) => ({ ...c, usuario: e.target.value }))}
                          placeholder="Usuario del sistema"
                        />
                      </div>
                      <div>
                        <label className="label">Contraseña</label>
                        <input
                          type="password"
                          className="input"
                          value={creds.password}
                          onChange={(e) => setCreds((c) => ({ ...c, password: e.target.value }))}
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateCredsM.mutate({ sistema: sys.key, data: { usuario: creds.usuario, password: creds.password } })}
                          className="btn-primary text-xs"
                        >
                          Guardar
                        </button>
                        <button onClick={() => setEditando(null)} className="btn-ghost text-xs">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  {!sys.publica && (
                    <button
                      onClick={() => {
                        setEditando(sys.key)
                        setCreds({ usuario: '', password: '' })
                      }}
                      className="btn-secondary text-xs"
                    >
                      Credenciales
                    </button>
                  )}
                  <button
                    onClick={() => testMutation.mutate(sys.key)}
                    className="btn-secondary text-xs"
                    disabled={testMutation.isPending}
                  >
                    Probar
                  </button>
                  <button
                    onClick={() => syncMutation.mutate(sys.key)}
                    className="btn-primary text-xs"
                    disabled={syncMutation.isPending}
                  >
                    Sync
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
