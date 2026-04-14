'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { FormularioInicio } from '@spg/shared'

interface Props {
  casoId: string
}

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

export function FormularioInicioTab({ casoId }: Props) {
  const queryClient = useQueryClient()
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [linkGoogleDocs, setLinkGoogleDocs] = useState('')
  const [linkPdf, setLinkPdf] = useState('')

  const { data: formulario, isLoading } = useQuery<FormularioInicio | null>({
    queryKey: ['formulario', casoId],
    queryFn: async () => {
      const res = await api.get(`/formularios/${casoId}`)
      return res.data.data
    },
  })

  const generarMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/formularios/${casoId}/generar`, {
        linkGoogleDocs: linkGoogleDocs || undefined,
        linkPdf: linkPdf || undefined,
      })
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formulario', casoId] })
      queryClient.invalidateQueries({ queryKey: ['caso', casoId] })
      setShowLinkForm(false)
      setLinkGoogleDocs('')
      setLinkPdf('')
    },
  })

  const pdfMutation = useMutation({
    mutationFn: async (pdf: string) => {
      const res = await api.put(`/formularios/${casoId}/pdf`, { linkPdf: pdf })
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formulario', casoId] })
    },
  })

  if (isLoading) {
    return <div className="text-text-secondary text-sm">Cargando...</div>
  }

  return (
    <div className="space-y-4">
      {/* Estado actual */}
      <div className="card flex items-start justify-between gap-4">
        <div>
          <p className="label">Estado del formulario</p>
          {formulario ? (
            <div className="flex items-center gap-3 mt-1">
              <span className={`badge ${ESTADO_BADGE[formulario.estado]}`}>
                {ESTADO_LABEL[formulario.estado]}
              </span>
              {formulario.fechaGeneracion && (
                <span className="text-xs text-text-muted">
                  Generado {formatDate(formulario.fechaGeneracion)}
                </span>
              )}
            </div>
          ) : (
            <p className="text-sm text-text-secondary mt-1">Sin formulario creado</p>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => setShowLinkForm(!showLinkForm)}
            className="btn-secondary text-xs"
          >
            {formulario ? 'Actualizar links' : 'Registrar documento'}
          </button>
          <button
            onClick={() => generarMutation.mutate()}
            disabled={generarMutation.isPending}
            className="btn-primary text-xs"
          >
            {generarMutation.isPending ? 'Guardando...' : formulario ? 'Marcar generado' : 'Crear formulario'}
          </button>
        </div>
      </div>

      {/* Form para links */}
      {showLinkForm && (
        <div className="card space-y-3 border border-accent/20">
          <p className="text-sm font-medium text-text">Registrar links del documento</p>
          <div>
            <label className="label">Link Google Docs</label>
            <input
              type="url"
              value={linkGoogleDocs}
              onChange={(e) => setLinkGoogleDocs(e.target.value)}
              className="input"
              placeholder="https://docs.google.com/document/d/..."
            />
          </div>
          <div>
            <label className="label">Link PDF</label>
            <input
              type="url"
              value={linkPdf}
              onChange={(e) => setLinkPdf(e.target.value)}
              className="input"
              placeholder="https://drive.google.com/..."
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => generarMutation.mutate()}
              disabled={generarMutation.isPending}
              className="btn-primary text-xs"
            >
              Guardar
            </button>
            <button
              onClick={() => setShowLinkForm(false)}
              className="btn-ghost text-xs"
            >
              Cancelar
            </button>
          </div>
          {generarMutation.isError && (
            <p className="text-xs text-red-400">
              {(generarMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                'Error al guardar'}
            </p>
          )}
        </div>
      )}

      {/* Links del documento */}
      {formulario && (formulario.linkGoogleDocs || formulario.linkPdf) && (
        <div className="card space-y-3">
          <p className="text-sm font-medium text-text">Documentos generados</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {formulario.linkGoogleDocs && (
              <div>
                <p className="label">Google Docs</p>
                <a
                  href={formulario.linkGoogleDocs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent text-sm hover:underline flex items-center gap-1"
                >
                  Abrir documento →
                </a>
              </div>
            )}
            {formulario.linkPdf && (
              <div>
                <p className="label">PDF</p>
                <a
                  href={formulario.linkPdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 text-sm hover:underline flex items-center gap-1"
                >
                  Descargar PDF →
                </a>
              </div>
            )}
          </div>
          {formulario.linkGoogleDocs && !formulario.linkPdf && (
            <div>
              <p className="label">Registrar PDF</p>
              <div className="flex gap-2 mt-1">
                <input
                  type="url"
                  className="input flex-1"
                  placeholder="URL del PDF descargado..."
                  id="pdf-url-input"
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('pdf-url-input') as HTMLInputElement
                    if (input?.value) pdfMutation.mutate(input.value)
                  }}
                  disabled={pdfMutation.isPending}
                  className="btn-secondary text-xs"
                >
                  Guardar PDF
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info sobre AutoCrat */}
      {!formulario && (
        <div className="card bg-bg/50 border-dashed">
          <p className="text-xs text-text-secondary leading-relaxed">
            <span className="text-accent font-medium">AutoCrat</span> — En una próxima versión, al hacer clic en{' '}
            <em>Crear formulario</em> se enviará automáticamente a AutoCrat para generar el Google Docs
            con todos los datos del caso. Por ahora, podés registrar manualmente el link una vez generado.
          </p>
        </div>
      )}
    </div>
  )
}
