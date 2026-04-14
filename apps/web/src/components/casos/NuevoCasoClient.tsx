'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Abogado, Arte, Empleador } from '@spg/shared'

const TIPO_AT_EP_OPTIONS = [
  { value: 'accidente_trabajo_accion_especial', label: 'Accidente de Trabajo — Acción Especial' },
  { value: 'accidente_in_itinere', label: 'Accidente In Itinere' },
  { value: 'enfermedad_profesional', label: 'Enfermedad Profesional Listada' },
  { value: 'enfermedad_no_listada', label: 'Enfermedad Profesional No Listada' },
]

const JURISDICCION_OPTIONS = [
  { value: 'PROVINCIA_BA', label: 'Provincia de Buenos Aires' },
  { value: 'NEUQUEN', label: 'Neuquén' },
  { value: 'CABA', label: 'CABA' },
  { value: 'RIO_NEGRO', label: 'Río Negro' },
]

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

function AutocompleteInput({
  value,
  onChange,
  suggestions,
  placeholder,
  label,
  required,
}: {
  value: string
  onChange: (v: string) => void
  suggestions: string[]
  placeholder?: string
  label: string
  required?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <label className="label">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="input"
        required={required}
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-bg-secondary border border-border rounded shadow-card-hover max-h-48 overflow-y-auto">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={() => {
                onChange(s)
                setOpen(false)
              }}
              className="w-full text-left px-3 py-2 text-sm text-text hover:bg-bg-hover transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function NuevoCasoClient() {
  const router = useRouter()
  const queryClient = useQueryClient()

  // ─── Form state ───────────────────────────────────────────
  const [form, setForm] = useState({
    // Datos del caso
    jurisdiccion: 'PROVINCIA_BA',
    tipoAtEp: 'accidente_trabajo_accion_especial',
    abogadoId: '',

    // Trabajador
    nombreTrabajador: '',
    apellidoTrabajador: '',
    cuil: '',
    fechaNacimiento: '',
    domicilioCliente: '',
    localidadCliente: '',

    // Empleador
    empleador: '',
    cuitEmpleador: '',
    domicilioEmpleador: '',
    localidadEmpleador: '',
    provinciaEmpleador: '',

    // ART y Comisión
    artId: '',
    comisionMedica: '',

    // Contingencia
    fechaSiniestro: '',
    fechaDenuncia: '',
    fechaBajaLaboral: '',
    relatoHechos: '',

    // Médico
    lesion: '',
    afeccionesDerivadas: '',
    porcentajeIncapacidad: '',
    regionAfectada: '',
    requiereEstudiosMedicos: false,
    observacionesMedicas: '',

    // Domicilios
    domicilioNotificacion: '',
    domicilioServicios: '',
    domicilioReporte: '',

    // Notas
    notasInternas: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // ─── Search queries ───────────────────────────────────────
  const debouncedLesion = useDebounce(form.lesion, 300)
  const debouncedRegion = useDebounce(form.regionAfectada, 300)
  const debouncedEmpleador = useDebounce(form.empleador, 300)

  const { data: abogadosData } = useQuery({
    queryKey: ['abogados'],
    queryFn: async () => {
      const res = await api.get('/abogados')
      return res.data.data as Abogado[]
    },
  })

  const { data: artsData } = useQuery({
    queryKey: ['arts'],
    queryFn: async () => {
      const res = await api.get('/arts')
      return res.data.data as Arte[]
    },
  })

  const { data: lesionSuggestions } = useQuery({
    queryKey: ['lesiones', debouncedLesion],
    queryFn: async () => {
      const res = await api.get(`/autocomplete/lesiones?q=${encodeURIComponent(debouncedLesion)}`)
      return res.data.data as string[]
    },
    enabled: debouncedLesion.length > 0,
  })

  const { data: regionSuggestions } = useQuery({
    queryKey: ['regiones', debouncedRegion],
    queryFn: async () => {
      const res = await api.get(`/autocomplete/regiones?q=${encodeURIComponent(debouncedRegion)}`)
      return res.data.data as string[]
    },
  })

  const { data: empleadorSuggestions } = useQuery({
    queryKey: ['empleadores', debouncedEmpleador],
    queryFn: async () => {
      const res = await api.get(`/autocomplete/empleadores?q=${encodeURIComponent(debouncedEmpleador)}`)
      return (res.data.data as Empleador[]).map((e) => e.nombre)
    },
    enabled: debouncedEmpleador.length > 1,
  })

  // ─── Abogado seleccionado → autofill jurisdiccion ─────────
  const abogados = abogadosData ?? []
  const arts = artsData ?? []
  const selectedAbogado = abogados.find((a) => a.id === form.abogadoId)
  const selectedArt = arts.find((a) => a.id === form.artId)

  useEffect(() => {
    if (selectedAbogado) {
      const jurisdicciones = JSON.parse(selectedAbogado.jurisdicciones || '[]') as string[]
      if (jurisdicciones.length > 0) {
        set('jurisdiccion', jurisdicciones[0])
      }
    }
  }, [selectedAbogado])

  function set(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  // ─── Validate ─────────────────────────────────────────────
  function validate() {
    const newErrors: Record<string, string> = {}
    if (!form.abogadoId) newErrors.abogadoId = 'Seleccioná un abogado'
    if (!form.nombreTrabajador.trim()) newErrors.nombreTrabajador = 'Requerido'
    if (!form.apellidoTrabajador.trim()) newErrors.apellidoTrabajador = 'Requerido'
    if (!form.cuil.trim()) newErrors.cuil = 'Requerido'
    if (form.cuil && !/^\d{2}-\d{8}-\d{1}$/.test(form.cuil)) {
      newErrors.cuil = 'Formato: XX-XXXXXXXX-X'
    }
    if (form.cuitEmpleador && !/^\d{2}-\d{8}-\d{1}$/.test(form.cuitEmpleador)) {
      newErrors.cuitEmpleador = 'Formato: XX-XXXXXXXX-X'
    }
    if (!form.artId) newErrors.artId = 'Seleccioná una ART'
    if (!form.tipoAtEp) newErrors.tipoAtEp = 'Requerido'
    if (form.porcentajeIncapacidad) {
      const n = parseFloat(form.porcentajeIncapacidad)
      if (isNaN(n) || n < 0 || n > 100) newErrors.porcentajeIncapacidad = 'Debe ser 0–100'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ─── Submit ───────────────────────────────────────────────
  const crearMutation = useMutation({
    mutationFn: async () => {
      // Primero crear o encontrar el cliente
      let clienteId: string | undefined
      const nombreCompleto = `${form.apellidoTrabajador.toUpperCase()} ${form.nombreTrabajador.toUpperCase()}`.trim()

      if (nombreCompleto) {
        const clienteRes = await api.post('/clientes', {
          nombre: nombreCompleto,
          cuil: form.cuil || undefined,
        })
        clienteId = clienteRes.data.data.id
      }

      // Guardar empleador para autocompletado futuro
      if (form.empleador.trim()) {
        await api.post('/autocomplete/empleadores', {
          nombre: form.empleador,
          cuit: form.cuitEmpleador || undefined,
          domicilio: form.domicilioEmpleador || undefined,
          localidad: form.localidadEmpleador || undefined,
          provincia: form.provinciaEmpleador || undefined,
        }).catch(() => { /* no bloquear si falla */ })
      }

      // Crear el caso
      const casoPayload = {
        clienteId,
        cuil: form.cuil || undefined,
        jurisdiccion: form.jurisdiccion,
        tipoAtEp: form.tipoAtEp,
        abogadoId: form.abogadoId || undefined,
        artId: form.artId || undefined,
        empleador: form.empleador || undefined,
        cuitEmpleador: form.cuitEmpleador || undefined,
        domicilioEmpleador: form.domicilioEmpleador || undefined,
        localidadEmpleador: form.localidadEmpleador || undefined,
        provinciaEmpleador: form.provinciaEmpleador || undefined,
        domicilioCliente: form.domicilioCliente || undefined,
        localidadCliente: form.localidadCliente || undefined,
        fechaNacimiento: form.fechaNacimiento || undefined,
        fechaSiniestro: form.fechaSiniestro || undefined,
        fechaDenuncia: form.fechaDenuncia || undefined,
        fechaBajaLaboral: form.fechaBajaLaboral || undefined,
        relatoHechos: form.relatoHechos || undefined,
        lesion: form.lesion ? form.lesion.toUpperCase() : undefined,
        afeccionesDerivadas: form.afeccionesDerivadas || undefined,
        porcentajeIncapacidad: form.porcentajeIncapacidad ? parseFloat(form.porcentajeIncapacidad) : undefined,
        regionAfectada: form.regionAfectada || undefined,
        requiereEstudiosMedicos: form.requiereEstudiosMedicos,
        observacionesMedicas: form.observacionesMedicas || undefined,
        domicilioNotificacion: form.domicilioNotificacion || undefined,
        domicilioServicios: form.domicilioServicios || undefined,
        domicilioReporte: form.domicilioReporte || undefined,
        notasInternas: form.notasInternas || undefined,
        etapa: 'SRT',
      }

      const casoRes = await api.post('/casos', casoPayload)
      const caso = casoRes.data.data

      // Crear datos SRT con comisión médica
      if (form.comisionMedica) {
        await api.post(`/casos/${caso.id}/datos-srt`, {
          comisionMedica: form.comisionMedica,
        })
      }

      // Crear formulario de inicio en estado pendiente
      await api.post(`/formularios/${caso.id}/generar`, {})

      return caso
    },
    onSuccess: (caso) => {
      queryClient.invalidateQueries({ queryKey: ['casos'] })
      router.push(`/casos/${caso.id}`)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    crearMutation.mutate()
  }

  // ─── Helper for ART domicilio ─────────────────────────────
  const artDomicilioLabel =
    form.jurisdiccion === 'NEUQUEN' || form.jurisdiccion === 'RIO_NEGRO'
      ? selectedArt?.domicilioNqn ?? selectedArt?.domicilio ?? '—'
      : selectedArt?.domicilioProvincia ?? selectedArt?.domicilio ?? '—'

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in pb-16">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="btn-ghost text-sm">
          ← Volver
        </button>
        <h1 className="page-title">Nuevo Caso</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ─── SECCIÓN 1: CASO ──────────────────────────────── */}
        <Section title="Datos del Caso">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">
                Abogado <span className="text-red-400">*</span>
              </label>
              <select
                value={form.abogadoId}
                onChange={(e) => set('abogadoId', e.target.value)}
                className="input"
              >
                <option value="">Seleccionar abogado...</option>
                {abogados.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </select>
              {errors.abogadoId && <p className="text-xs text-red-400 mt-1">{errors.abogadoId}</p>}
            </div>

            {/* Autofill del abogado */}
            {selectedAbogado && (
              <div className="card bg-bg/50 text-xs space-y-1">
                <p className="text-text-secondary">
                  <span className="text-text-muted">CUIT:</span>{' '}
                  {selectedAbogado.cuit ?? '—'}
                </p>
                <p className="text-text-secondary">
                  <span className="text-text-muted">Matrícula:</span>{' '}
                  {selectedAbogado.matricula ?? '—'}
                </p>
                <p className="text-text-secondary">
                  <span className="text-text-muted">Email:</span>{' '}
                  {selectedAbogado.email ?? '—'}
                </p>
              </div>
            )}

            <div>
              <label className="label">
                Jurisdicción <span className="text-red-400">*</span>
              </label>
              <select
                value={form.jurisdiccion}
                onChange={(e) => set('jurisdiccion', e.target.value)}
                className="input"
              >
                {JURISDICCION_OPTIONS.map((j) => (
                  <option key={j.value} value={j.value}>
                    {j.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">
                Tipo de Contingencia <span className="text-red-400">*</span>
              </label>
              <select
                value={form.tipoAtEp}
                onChange={(e) => set('tipoAtEp', e.target.value)}
                className="input"
              >
                {TIPO_AT_EP_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {errors.tipoAtEp && <p className="text-xs text-red-400 mt-1">{errors.tipoAtEp}</p>}
            </div>
          </div>
        </Section>

        {/* ─── SECCIÓN 2: TRABAJADOR ───────────────────────── */}
        <Section title="Datos del Trabajador / Damnificado">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Nombre"
              required
              value={form.nombreTrabajador}
              onChange={(v) => set('nombreTrabajador', v)}
              error={errors.nombreTrabajador}
            />
            <Field
              label="Apellido"
              required
              value={form.apellidoTrabajador}
              onChange={(v) => set('apellidoTrabajador', v)}
              error={errors.apellidoTrabajador}
            />
            <Field
              label="CUIL"
              required
              value={form.cuil}
              onChange={(v) => set('cuil', v)}
              placeholder="XX-XXXXXXXX-X"
              error={errors.cuil}
            />
            <Field
              label="Fecha de Nacimiento"
              type="date"
              value={form.fechaNacimiento}
              onChange={(v) => set('fechaNacimiento', v)}
            />
            <div className="sm:col-span-2">
              <Field
                label="Domicilio"
                value={form.domicilioCliente}
                onChange={(v) => set('domicilioCliente', v)}
                placeholder="Calle 123, Piso 4°, Dto B"
              />
            </div>
            <Field
              label="Localidad"
              value={form.localidadCliente}
              onChange={(v) => set('localidadCliente', v)}
            />
          </div>
        </Section>

        {/* ─── SECCIÓN 3: EMPLEADOR ────────────────────────── */}
        <Section title="Datos del Empleador">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <AutocompleteInput
                label="Razón Social / Nombre"
                value={form.empleador}
                onChange={(v) => set('empleador', v)}
                suggestions={empleadorSuggestions ?? []}
                placeholder="Nombre de la empresa..."
              />
            </div>
            <Field
              label="CUIT"
              value={form.cuitEmpleador}
              onChange={(v) => set('cuitEmpleador', v)}
              placeholder="XX-XXXXXXXX-X"
              error={errors.cuitEmpleador}
            />
            <div className="sm:col-span-2">
              <Field
                label="Domicilio"
                value={form.domicilioEmpleador}
                onChange={(v) => set('domicilioEmpleador', v)}
              />
            </div>
            <Field
              label="Localidad"
              value={form.localidadEmpleador}
              onChange={(v) => set('localidadEmpleador', v)}
            />
            <Field
              label="Provincia"
              value={form.provinciaEmpleador}
              onChange={(v) => set('provinciaEmpleador', v)}
            />
          </div>
        </Section>

        {/* ─── SECCIÓN 4: ART ──────────────────────────────── */}
        <Section title="ART y Comisión Médica">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">
                ART <span className="text-red-400">*</span>
              </label>
              <select
                value={form.artId}
                onChange={(e) => set('artId', e.target.value)}
                className="input"
              >
                <option value="">Seleccionar ART...</option>
                {arts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </select>
              {errors.artId && <p className="text-xs text-red-400 mt-1">{errors.artId}</p>}
            </div>

            <Field
              label="Comisión Médica"
              value={form.comisionMedica}
              onChange={(v) => set('comisionMedica', v)}
              placeholder="Ej: 384"
            />

            {/* Autofill de la ART */}
            {selectedArt && (
              <div className="sm:col-span-2 card bg-bg/50 text-xs space-y-1">
                <p className="text-text-secondary">
                  <span className="text-text-muted">CUIT:</span> {selectedArt.cuit ?? '—'}
                </p>
                <p className="text-text-secondary">
                  <span className="text-text-muted">Domicilio ({form.jurisdiccion}):</span>{' '}
                  {artDomicilioLabel}
                </p>
              </div>
            )}
          </div>
        </Section>

        {/* ─── SECCIÓN 5: CONTINGENCIA ─────────────────────── */}
        <Section title="Datos de la Contingencia">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field
              label="Fecha del Siniestro"
              type="date"
              value={form.fechaSiniestro}
              onChange={(v) => set('fechaSiniestro', v)}
            />
            <Field
              label="Fecha de Denuncia (SRT)"
              type="date"
              value={form.fechaDenuncia}
              onChange={(v) => set('fechaDenuncia', v)}
            />
            <Field
              label="Fecha de Baja Laboral"
              type="date"
              value={form.fechaBajaLaboral}
              onChange={(v) => set('fechaBajaLaboral', v)}
            />
          </div>
          <div className="mt-4">
            <label className="label">Relato de los Hechos</label>
            <textarea
              value={form.relatoHechos}
              onChange={(e) => set('relatoHechos', e.target.value)}
              className="input min-h-[120px] resize-y"
              placeholder="Describir cómo ocurrió el accidente o la enfermedad..."
            />
          </div>
        </Section>

        {/* ─── SECCIÓN 6: MÉDICO ───────────────────────────── */}
        <Section title="Datos Médicos">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <AutocompleteInput
                label="Lesión / Diagnóstico"
                value={form.lesion}
                onChange={(v) => set('lesion', v.toUpperCase())}
                suggestions={lesionSuggestions ?? []}
                placeholder="Ej: LESIÓN DORSOLUMBAR"
              />
            </div>
            <div>
              <AutocompleteInput
                label="Región Afectada"
                value={form.regionAfectada}
                onChange={(v) => set('regionAfectada', v)}
                suggestions={regionSuggestions ?? []}
                placeholder="Ej: COLUMNA LUMBAR"
              />
            </div>
            <div>
              <label className="label">
                % de Incapacidad (0–100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={form.porcentajeIncapacidad}
                onChange={(e) => set('porcentajeIncapacidad', e.target.value)}
                className="input"
                placeholder="Ej: 15"
              />
              {errors.porcentajeIncapacidad && (
                <p className="text-xs text-red-400 mt-1">{errors.porcentajeIncapacidad}</p>
              )}
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.requiereEstudiosMedicos}
                  onChange={(e) => set('requiereEstudiosMedicos', e.target.checked)}
                  className="w-4 h-4 accent-accent"
                />
                <span className="text-sm text-text">Requiere estudios médicos</span>
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Afecciones Derivadas</label>
              <input
                type="text"
                value={form.afeccionesDerivadas}
                onChange={(e) => set('afeccionesDerivadas', e.target.value)}
                className="input"
                placeholder="Ej: estrés, depresión reactiva, limitación funcional..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Observaciones Médicas</label>
              <textarea
                value={form.observacionesMedicas}
                onChange={(e) => set('observacionesMedicas', e.target.value)}
                className="input min-h-[80px] resize-y"
                placeholder="Notas adicionales sobre el cuadro médico..."
              />
            </div>
          </div>
        </Section>

        {/* ─── SECCIÓN 7: DOMICILIOS ───────────────────────── */}
        <Section title="Domicilios para Notificación">
          <div className="grid grid-cols-1 gap-4">
            <Field
              label="Domicilio de Notificación"
              value={form.domicilioNotificacion}
              onChange={(v) => set('domicilioNotificacion', v)}
              placeholder="Donde recibe notificaciones..."
            />
            <Field
              label="Domicilio de Servicios Médicos"
              value={form.domicilioServicios}
              onChange={(v) => set('domicilioServicios', v)}
              placeholder="Donde atiende médicos..."
            />
            <Field
              label="Domicilio de Reporte Habitual"
              value={form.domicilioReporte}
              onChange={(v) => set('domicilioReporte', v)}
              placeholder="Donde reporta habitualmente..."
            />
          </div>
        </Section>

        {/* ─── SECCIÓN 8: OBSERVACIONES ────────────────────── */}
        <Section title="Observaciones Internas">
          <textarea
            value={form.notasInternas}
            onChange={(e) => set('notasInternas', e.target.value)}
            className="input min-h-[80px] resize-y w-full"
            placeholder="Notas internas (no aparecen en el formulario)..."
          />
        </Section>

        {/* ─── ERROR GENERAL ───────────────────────────────── */}
        {crearMutation.isError && (
          <div className="card border border-red-500/30 bg-red-500/5">
            <p className="text-sm text-red-400">
              {(crearMutation.error as { response?: { data?: { message?: string } } })?.response?.data
                ?.message ?? 'Error al crear el caso'}
            </p>
          </div>
        )}

        {/* ─── SUBMIT ──────────────────────────────────────── */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={crearMutation.isPending}
            className="btn-primary flex-1 sm:flex-none sm:min-w-[160px] justify-center"
          >
            {crearMutation.isPending ? 'Guardando...' : 'Guardar Caso'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Helper components ───────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card space-y-4">
      <h2 className="section-title text-sm border-b border-border pb-2">{title}</h2>
      {children}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required,
  error,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  required?: boolean
  error?: string
}) {
  return (
    <div>
      <label className="label">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`input ${error ? 'border-red-500/50' : ''}`}
        required={required}
      />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}
