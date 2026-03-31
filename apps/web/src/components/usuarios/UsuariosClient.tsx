'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { Usuario } from '@spg/shared'

const ROL_LABELS = { admin: 'Admin', abogado: 'Abogado', captadora: 'Captadora' }

export function UsuariosClient() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nombre: '', email: '', rol: 'captadora', telefono: '', matricula: '' })

  const { data: usuarios } = useQuery<Usuario[]>({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const res = await api.get('/usuarios')
      return res.data.data
    },
  })

  const crearM = useMutation({
    mutationFn: (data: typeof form) => api.post('/usuarios', data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['usuarios'] })
      const { tempPassword } = res.data.data
      alert(`Usuario creado. Contraseña temporal: ${tempPassword}`)
      setShowForm(false)
    },
  })

  const toggleActivoM = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      api.put(`/usuarios/${id}`, { activo: !activo }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  })

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Usuarios</h1>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary">
          + Nuevo Usuario
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card animate-fade-in">
          <h2 className="section-title text-sm mb-4">NUEVO USUARIO</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Nombre</label>
              <input className="input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Rol</label>
              <select className="input" value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
                <option value="captadora">Captadora</option>
                <option value="abogado">Abogado</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input className="input" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </div>
            {form.rol === 'abogado' && (
              <div>
                <label className="label">Matrícula</label>
                <input className="input" value={form.matricula} onChange={(e) => setForm({ ...form, matricula: e.target.value })} />
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => crearM.mutate(form)} className="btn-primary" disabled={crearM.isPending}>
              Crear Usuario
            </button>
            <button onClick={() => setShowForm(false)} className="btn-ghost">Cancelar</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['Nombre', 'Email', 'Rol', 'Teléfono', 'Último Login', 'Estado', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs text-text-secondary uppercase tracking-wider font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usuarios?.map((u) => (
              <tr key={u.id} className="border-b border-border/50 hover:bg-bg-hover last:border-0">
                <td className="px-4 py-3 font-medium text-text">{u.nombre}</td>
                <td className="px-4 py-3 text-text-secondary">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`badge text-xs ${
                    u.rol === 'admin' ? 'badge-acuerdo' :
                    u.rol === 'abogado' ? 'badge-litigios-jud' :
                    'badge-srt'
                  }`}>
                    {ROL_LABELS[u.rol]}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-secondary">{u.telefono ?? '-'}</td>
                <td className="px-4 py-3 text-text-secondary text-xs">{formatDate(u.ultimoLogin)}</td>
                <td className="px-4 py-3">
                  <span className={`badge text-xs ${u.activo ? 'badge-acuerdo' : 'badge-congelado'}`}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActivoM.mutate({ id: u.id, activo: u.activo })}
                    className={`text-xs ${u.activo ? 'text-red-400 hover:underline' : 'text-green-400 hover:underline'}`}
                  >
                    {u.activo ? 'Deshabilitar' : 'Habilitar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
