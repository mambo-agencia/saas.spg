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
  domicilioProvincia?: string
  domicilioNqn?: string
  telefono?: string
  email?: string
  activa: boolean
}

export interface Abogado {
  id: string
  nombre: string
  zona: string
  jurisdicciones: string
  cuit?: string
  matricula?: string
  direccion?: string
  domicilioElectronico?: string
  telefono?: string
  email?: string
  activo: boolean
}

export interface Empleador {
  id: string
  nombre: string
  cuit?: string
  domicilio?: string
  localidad?: string
  provincia?: string
}

export type EstadoFormulario = 'PENDIENTE' | 'GENERADO' | 'DESCARGADO'

export interface FormularioInicio {
  id: string
  casoId: string
  estado: EstadoFormulario
  linkGoogleDocs?: string
  linkPdf?: string
  idAutocrat?: string
  fechaGeneracion?: string
  createdAt: string
  updatedAt: string
  caso?: Caso
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

  // --- Datos empleador extendidos ---
  domicilioEmpleador?: string
  localidadEmpleador?: string
  provinciaEmpleador?: string

  // --- Datos formulario de inicio ---
  lesion?: string
  afeccionesDerivadas?: string
  porcentajeIncapacidad?: number
  regionAfectada?: string
  requiereEstudiosMedicos?: boolean
  observacionesMedicas?: string
  domicilioNotificacion?: string
  domicilioServicios?: string
  domicilioReporte?: string
  fechaBajaLaboral?: string
  fechaDenuncia?: string

  // Estado
  etapa: EtapaCaso
  estadoDetalle?: string
  abogadoId?: string
  abogadoNombre?: string
  montoDemandado?: number

  // Relacionados (cargados bajo demanda)
  datosSrt?: DatosSrt
  datosJudiciales?: DatosJudiciales
  formularioInicio?: FormularioInicio
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
