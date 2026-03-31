'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ETAPA_LABELS, ETAPA_BADGE_CLASS, formatDate, formatCurrency, TIPO_AT_EP_LABELS, JURISDICCION_LABELS } from '@/lib/utils'
import type { Caso } from '@spg/shared'

type Tab = 'generales' | 'conexiones' | 'abogado' | 'srt' | 'judicial' | 'movimientos' | 'comentarios' | 'adjuntos'

export function CasoDetailClient({ id }: { id: string }) {
  const [activeTab, setActiveTab] = useState<Tab>('generales')
  const [nuevoComentario, setNuevoComentario] = useState('')

  const { data: caso, refetch } = useQuery<Caso>({
    queryKey: ['caso', id],
    queryFn: async () => {
      const res = await api.get(`/casos/${id}`)
      return res.data.data
    },
  })

  if (!caso) {
    return <div className="text-text-secondary p-8">Cargando caso...</div>
  }

  async function enviarComentario() {
    if (!nuevoComentario.trim()) return
    await api.post(`/casos/${id}/comentarios`, { contenido: nuevoComentario })
    setNuevoComentario('')
    refetch()
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'generales', label: 'Datos Generales' },
    { key: 'conexiones', label: 'Conexiones' },
    { key: 'abogado', label: 'Abogado' },
    { key: 'srt', label: 'SRT' },
    { key: 'judicial', label: 'Judicial' },
    { key: 'movimientos', label: 'Movimientos' },
    { key: 'comentarios', label: 'Comentarios' },
    { key: 'adjuntos', label: 'Adjuntos' },
  ]

  return (
    <div className="space-y-4 animate-fade-in max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono text-accent text-sm">{caso.numeroCaso}</span>
            <span className={`badge ${ETAPA_BADGE_CLASS[caso.etapa]}`}>
              {ETAPA_LABELS[caso.etapa]}
            </span>
          </div>
          <h1 className="font-display text-2xl text-text leading-tight">
            {caso.autos ?? caso.cliente?.nombre ?? 'Sin título'}
          </h1>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button className="btn-secondary text-sm">Editar</button>
          <button className="btn-primary text-sm">Cambiar Etapa</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text hover:border-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="animate-fade-in">
        {activeTab === 'generales' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Cliente" value={caso.cliente?.nombre} />
            <Field label="CUIL" value={caso.cuil} />
            <Field label="Jurisdicción" value={JURISDICCION_LABELS[caso.jurisdiccion]} />
            <Field label="Tipo AT/EP" value={TIPO_AT_EP_LABELS[caso.tipoAtEp]} />
            <Field label="ART" value={caso.art?.nombre} />
            <Field label="Empleador" value={caso.empleador} />
            <Field label="CUIT Empleador" value={caso.cuitEmpleador} />
            <Field label="IBM (Sueldo)" value={formatCurrency(caso.ibm)} />
            <Field label="Fecha Siniestro" value={formatDate(caso.fechaSiniestro)} />
            <Field label="Fecha Alta Médica" value={formatDate(caso.fechaAltaMedica)} />
            <Field label="Fecha Nacimiento" value={formatDate(caso.fechaNacimiento)} />
            <Field label="Domicilio" value={caso.domicilioCliente} />
            <Field label="Localidad" value={caso.localidadCliente} />
            <Field label="Captadora" value={caso.captadoraNombre} />
            <div className="md:col-span-2">
              <Field label="Diagnóstico" value={caso.diagnostico} multiline />
            </div>
            <div className="md:col-span-2">
              <Field label="Relato de Hechos" value={caso.relatoHechos} multiline />
            </div>
          </div>
        )}

        {activeTab === 'conexiones' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {['MEV', 'SRT', 'PJN BA', 'PJN Neuquén', 'PJN Río Negro'].map((sys, i) => {
              const conexion = caso.conexiones?.[i]
              const connected = conexion?.conectado
              return (
                <div key={sys} className="card flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-text">{sys}</p>
                    {conexion?.nroExpediente && (
                      <p className="text-xs text-text-secondary font-mono">{conexion.nroExpediente}</p>
                    )}
                    {conexion?.ultimaSincronizacion && (
                      <p className="text-xs text-text-muted">{formatDate(conexion.ultimaSincronizacion)}</p>
                    )}
                  </div>
                  <span className={`text-lg ${connected ? 'text-green-400' : 'text-zinc-600'}`}>
                    {connected ? '✓' : '✗'}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'abogado' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Abogado" value={caso.abogadoNombre} />
            <Field label="Monto Demandado" value={formatCurrency(caso.montoDemandado)} />
          </div>
        )}

        {activeTab === 'srt' && caso.datosSrt && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Fecha de Inicio" value={formatDate(caso.datosSrt.fechaInicio)} />
            <Field label="Nro. Expediente" value={caso.datosSrt.nroExpediente} />
            <Field label="Comisión Médica" value={caso.datosSrt.comisionMedica} />
            <Field label="Tipo de Trámite" value={caso.datosSrt.tipoTramite} />
            <FileField label="Formulario de Inicio" url={caso.datosSrt.formularioInicioUrl} />
            <FileField label="Escrito de Inicio" url={caso.datosSrt.escritoInicioUrl} />
          </div>
        )}

        {activeTab === 'judicial' && caso.datosJudiciales && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Fecha de Inicio" value={formatDate(caso.datosJudiciales.fechaInicio)} />
            <Field label="Nro. Expediente" value={caso.datosJudiciales.nroExpediente} />
            <Field label="Juzgado" value={caso.datosJudiciales.juzgado} />
            <FileField label="PMO" url={caso.datosJudiciales.pmoUrl} />
            <FileField label="Demanda" url={caso.datosJudiciales.demandaUrl} />
          </div>
        )}

        {activeTab === 'movimientos' && (
          <div className="space-y-2">
            {caso.movimientos?.length === 0 && (
              <p className="text-text-secondary text-sm">Sin movimientos registrados</p>
            )}
            {caso.movimientos?.map((mov) => (
              <div key={mov.id} className="card flex items-start gap-3">
                <span className="text-xs bg-bg px-2 py-1 rounded font-mono text-accent">{mov.sistema}</span>
                <div className="flex-1">
                  <p className="text-sm text-text">{mov.descripcion}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{formatDate(mov.fechaMovimiento)}</p>
                </div>
                {mov.urlDocumento && (
                  <a href={mov.urlDocumento} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">
                    Ver
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'comentarios' && (
          <div className="space-y-4">
            <div className="space-y-3">
              {caso.comentarios?.map((com) => (
                <div key={com.id} className="card">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-accent">{com.usuarioNombre ?? 'Usuario'}</span>
                    <span className="text-xs text-text-muted">{formatDate(com.createdAt)}</span>
                  </div>
                  <p className="text-sm text-text">{com.contenido}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <textarea
                value={nuevoComentario}
                onChange={(e) => setNuevoComentario(e.target.value)}
                className="input flex-1 min-h-[72px] resize-none"
                placeholder="Agregar comentario..."
              />
              <button onClick={enviarComentario} className="btn-primary self-end">
                Enviar
              </button>
            </div>
          </div>
        )}

        {activeTab === 'adjuntos' && (
          <div className="space-y-3">
            {caso.adjuntos?.length === 0 && (
              <p className="text-text-secondary text-sm">Sin adjuntos</p>
            )}
            {caso.adjuntos?.map((adj) => (
              <div key={adj.id} className="card flex items-center gap-3">
                <span className="text-2xl">📄</span>
                <div className="flex-1">
                  <p className="text-sm text-text">{adj.nombreArchivo}</p>
                  <p className="text-xs text-text-secondary capitalize">{adj.categoria}</p>
                </div>
                <a href={adj.urlArchivo} download className="btn-secondary text-xs">
                  Descargar
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  multiline,
}: {
  label: string
  value?: string | number | null
  multiline?: boolean
}) {
  return (
    <div>
      <p className="label">{label}</p>
      {multiline ? (
        <p className="text-sm text-text bg-bg rounded p-3 min-h-[60px] whitespace-pre-wrap">
          {value ?? '-'}
        </p>
      ) : (
        <p className="text-sm text-text">{value ?? '-'}</p>
      )}
    </div>
  )
}

function FileField({ label, url }: { label: string; url?: string | null }) {
  return (
    <div>
      <p className="label">{label}</p>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-accent text-sm hover:underline">
          Ver archivo →
        </a>
      ) : (
        <p className="text-sm text-text-secondary">No cargado</p>
      )}
    </div>
  )
}
