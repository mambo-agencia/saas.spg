// ─── CASO ENUMS ───────────────────────────────────────────

export enum EtapaCaso {
  SRT = 'SRT',
  LITIGIOS_EXTRAJUDICIAL = 'LITIGIOS_EXTRAJUDICIAL',
  NEGOCIACIONES = 'NEGOCIACIONES',
  LITIGIOS_JUDICIAL = 'LITIGIOS_JUDICIAL',
  ACUERDO_CERRADO = 'ACUERDO_CERRADO',
  SENTENCIADO = 'SENTENCIADO',
  CONGELADO = 'CONGELADO',
}

export enum TipoAtEp {
  ACCIDENTE_TRABAJO_ACCION_ESPECIAL = 'accidente_trabajo_accion_especial',
  ACCIDENTE_IN_ITINERE = 'accidente_in_itinere',
  ENFERMEDAD_PROFESIONAL = 'enfermedad_profesional',
  ENFERMEDAD_NO_LISTADA = 'enfermedad_no_listada',
}

export enum Jurisdiccion {
  CABA = 'CABA',
  PROVINCIA_BA = 'PROVINCIA_BA',
  NEUQUEN = 'NEUQUEN',
  RIO_NEGRO = 'RIO_NEGRO',
}

export enum OrigenCaptacion {
  CAPTADORA = 'captadora',
  PAUTA_META = 'pauta_meta',
  REFERENCIA = 'referencia',
  OTRA = 'otra',
}

// ─── USUARIO ENUMS ────────────────────────────────────────

export enum RolUsuario {
  ADMIN = 'admin',
  ABOGADO = 'abogado',
  CAPTADORA = 'captadora',
}

// ─── SISTEMA EXTERNO ENUMS ────────────────────────────────

export enum SistemaExterno {
  MEV = 'MEV',
  SRT = 'SRT',
  PJN_BA = 'PJN_BA',
  PJN_NEUQUEN = 'PJN_NEUQUEN',
  PJN_RIO_NEGRO = 'PJN_RIO_NEGRO',
}

export enum EstadoConexion {
  CONECTADA = 'conectada',
  ERROR = 'error',
  PENDIENTE = 'pendiente',
}

// ─── EVENTO ENUMS ─────────────────────────────────────────

export enum TipoEvento {
  HOMOLOGACION = 'homologacion',
  REVISION_MEDICA = 'revision_medica',
  CUMPLEANOS = 'cumpleanos',
  REUNION = 'reunion',
  ENTREVISTA = 'entrevista',
  AUDIENCIA = 'audiencia',
  SENTENCIA = 'sentencia',
  OTRA = 'otra',
}

export const EVENTO_COLORES: Record<TipoEvento, string> = {
  [TipoEvento.HOMOLOGACION]: '#FF6B6B',
  [TipoEvento.REVISION_MEDICA]: '#4ECDC4',
  [TipoEvento.CUMPLEANOS]: '#FFE66D',
  [TipoEvento.REUNION]: '#95E1D3',
  [TipoEvento.ENTREVISTA]: '#C7CEEA',
  [TipoEvento.AUDIENCIA]: '#FF8B94',
  [TipoEvento.SENTENCIA]: '#FFBE0B',
  [TipoEvento.OTRA]: '#a0a0a0',
}

// ─── MOVIMIENTO ENUMS ─────────────────────────────────────

export enum TipoMovimiento {
  RESOLUCION = 'resolucion',
  AUDIENCIA = 'audiencia',
  ESCRITO = 'escrito',
  NOTIFICACION = 'notificacion',
  OTRA = 'otra',
}

// ─── ADJUNTO ENUMS ────────────────────────────────────────

export enum CategoriaAdjunto {
  SRT = 'srt',
  JUDICIAL = 'judicial',
  GENERAL = 'general',
}
