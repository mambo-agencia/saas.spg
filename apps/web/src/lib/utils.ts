import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { EtapaCaso } from '@spg/shared'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSec = Math.round(diffMs / 1000)
  const diffMin = Math.round(diffSec / 60)
  const diffHour = Math.round(diffMin / 60)
  const diffDay = Math.round(diffHour / 24)

  if (diffSec < 60) return 'hace un momento'
  if (diffMin < 60) return `hace ${diffMin}min`
  if (diffHour < 24) return `hace ${diffHour}h`
  if (diffDay === 1) return 'ayer'
  if (diffDay < 7) return `hace ${diffDay}d`
  return formatDate(date)
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '-'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(value)
}

export const ETAPA_LABELS: Record<EtapaCaso, string> = {
  [EtapaCaso.SRT]: 'SRT',
  [EtapaCaso.LITIGIOS_EXTRAJUDICIAL]: 'Litigios Extrajudicial',
  [EtapaCaso.NEGOCIACIONES]: 'Negociaciones',
  [EtapaCaso.LITIGIOS_JUDICIAL]: 'Litigios Judicial',
  [EtapaCaso.ACUERDO_CERRADO]: 'Acuerdo Cerrado',
  [EtapaCaso.SENTENCIADO]: 'Sentenciado',
  [EtapaCaso.CONGELADO]: 'Congelado',
}

export const ETAPA_BADGE_CLASS: Record<EtapaCaso, string> = {
  [EtapaCaso.SRT]: 'badge-srt',
  [EtapaCaso.LITIGIOS_EXTRAJUDICIAL]: 'badge-litigios-ext',
  [EtapaCaso.NEGOCIACIONES]: 'badge-negociaciones',
  [EtapaCaso.LITIGIOS_JUDICIAL]: 'badge-litigios-jud',
  [EtapaCaso.ACUERDO_CERRADO]: 'badge-acuerdo',
  [EtapaCaso.SENTENCIADO]: 'badge-sentenciado',
  [EtapaCaso.CONGELADO]: 'badge-congelado',
}

export const TIPO_AT_EP_LABELS: Record<string, string> = {
  accidente_trabajo_accion_especial: 'Accidente de Trabajo',
  accidente_in_itinere: 'Accidente In Itinere',
  enfermedad_profesional: 'Enfermedad Profesional',
  enfermedad_no_listada: 'Enfermedad No Listada',
}

export const JURISDICCION_LABELS: Record<string, string> = {
  CABA: 'CABA',
  PROVINCIA_BA: 'Buenos Aires',
  NEUQUEN: 'Neuquén',
  RIO_NEGRO: 'Río Negro',
}
