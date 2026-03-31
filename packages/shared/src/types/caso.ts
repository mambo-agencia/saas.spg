import {
  CategoriaAdjunto,
  EtapaCaso,
  Jurisdiccion,
  OrigenCaptacion,
  SistemaExterno,
  TipoAtEp,
  TipoEvento,
  TipoMovimiento,
} from './enums'

export interface Arte {
  id: string
  nombre: string
  razonSocial: string
  cuit?: string
  domicilio?: string
  telefono?: string
  email?: string
  activa: boolean
}

export interface Cliente {
  id: string
  nombre: string
  telefono?: string
  email?: string
  cuil?: string
  notas?: string
  createdAt: string
}

export interface DatosSrt {
  id: string
  casoId: string
  fechaInicio?: string
  nroExpediente?: string
  comisionMedica?: string
  tipoTramite?: string
  formularioInicioUrl?: string
  escritoInicioUrl?: string
}

export interface DatosJudiciales {
  id: string
  casoId: string
  fechaInicio?: string
  nroExpediente?: string
  juzgado?: string
  pmoUrl?: string
  demandaUrl?: string
}

export interface ConexionCaso {
  id: string
  casoId: string
  sistema: SistemaExterno
  conectado: boolean
  nroExpediente?: string
  ultimaSincronizacion?: string
  urlExpediente?: string
}

export interface MovimientoExpediente {
  id: string
  casoId: string
  sistema: SistemaExterno
  tipo: TipoMovimiento
  descripcion?: string
  fechaMovimiento: string
  urlDocumento?: string
  notificado: boolean
  createdAt: string
}

export interface Comentario {
  id: string
  casoId: string
  usuarioId?: string
  usuarioNombre?: string
  contenido: string
  createdAt: string
  updatedAt: string
}

export interface Adjunto {
  id: string
  casoId: string
  nombreArchivo: string
  urlArchivo: string
  tipoArchivo?: string
  tamanioBytes?: number
  categoria: CategoriaAdjunto
  uploadedBy?: string
  createdAt: string
}

export interface EventoCaso {
  id: string
  titulo: string
  tipoEvento: TipoEvento
  fechaEvento: string
  casoId?: string
  usuarioResponsable?: string
  descripcion?: string
  lugar?: string
  color?: string
  participantes?: string[]
  recordatorioMinutos?: number
  notificado: boolean
}

export interface Caso {
  id: string
  numeroCaso: string
  autos?: string

  // Datos generales
  clienteId?: string
  cliente?: Cliente
  cuil?: string
  jurisdiccion: Jurisdiccion
  tipoAtEp: TipoAtEp
  diagnostico?: string
  relatoHechos?: string
  fechaSiniestro?: string
  fechaAltaMedica?: string
  fechaCartaDocumento?: string
  fechaTelegrama?: string
  fechaNacimiento?: string
  edadPmi?: number
  domicilioCliente?: string
  localidadCliente?: string
  ibm?: number
  empleador?: string
  cuitEmpleador?: string
  artId?: string
  art?: Arte
  testigo1?: string
  testigo2?: string
  captadoraId?: string
  captadoraNombre?: string
  origenCaptacion?: OrigenCaptacion

  // Estado
  etapa: EtapaCaso
  estadoDetalle?: string
  abogadoId?: string
  abogadoNombre?: string
  montoDemandado?: number

  // Relacionados (cargados bajo demanda)
  datosSrt?: DatosSrt
  datosJudiciales?: DatosJudiciales
  conexiones?: ConexionCaso[]
  movimientos?: MovimientoExpediente[]
  comentarios?: Comentario[]
  adjuntos?: Adjunto[]
  eventos?: EventoCaso[]

  createdAt: string
  updatedAt: string
}

export interface CasoResumen {
  id: string
  numeroCaso: string
  autos?: string
  clienteNombre?: string
  etapa: EtapaCaso
  jurisdiccion: Jurisdiccion
  tipoAtEp: TipoAtEp
  artNombre?: string
  captadoraNombre?: string
  abogadoNombre?: string
  createdAt: string
  updatedAt: string
}
