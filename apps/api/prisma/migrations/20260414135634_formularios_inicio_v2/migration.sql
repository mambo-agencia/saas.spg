-- CreateEnum
CREATE TYPE "EtapaCaso" AS ENUM ('SRT', 'LITIGIOS_EXTRAJUDICIAL', 'NEGOCIACIONES', 'LITIGIOS_JUDICIAL', 'ACUERDO_CERRADO', 'SENTENCIADO', 'CONGELADO');

-- CreateEnum
CREATE TYPE "TipoAtEp" AS ENUM ('accidente_trabajo_accion_especial', 'accidente_in_itinere', 'enfermedad_profesional', 'enfermedad_no_listada');

-- CreateEnum
CREATE TYPE "Jurisdiccion" AS ENUM ('CABA', 'PROVINCIA_BA', 'NEUQUEN', 'RIO_NEGRO');

-- CreateEnum
CREATE TYPE "OrigenCaptacion" AS ENUM ('captadora', 'pauta_meta', 'referencia', 'otra');

-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('admin', 'abogado', 'captadora');

-- CreateEnum
CREATE TYPE "SistemaExterno" AS ENUM ('MEV', 'SRT', 'PJN_BA', 'PJN_NEUQUEN', 'PJN_RIO_NEGRO');

-- CreateEnum
CREATE TYPE "EstadoConexion" AS ENUM ('conectada', 'error', 'pendiente');

-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('homologacion', 'revision_medica', 'cumpleanos', 'reunion', 'entrevista', 'audiencia', 'sentencia', 'otra');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('resolucion', 'audiencia', 'escrito', 'notificacion', 'otra');

-- CreateEnum
CREATE TYPE "CategoriaAdjunto" AS ENUM ('srt', 'judicial', 'general');

-- CreateEnum
CREATE TYPE "EstadoSync" AS ENUM ('exito', 'error');

-- CreateEnum
CREATE TYPE "ZonaAbogado" AS ENUM ('zona_oeste', 'zona_norte', 'ambas');

-- CreateEnum
CREATE TYPE "EstadoFormulario" AS ENUM ('PENDIENTE', 'GENERADO', 'DESCARGADO');

-- CreateTable
CREATE TABLE "arts" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "razon_social" TEXT NOT NULL,
    "cuit" TEXT,
    "domicilio" TEXT,
    "domicilio_provincia" TEXT,
    "domicilio_nqn" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "website" TEXT,
    "contacto_nombre" TEXT,
    "contacto_telefono" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abogados" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "zona" "ZonaAbogado" NOT NULL DEFAULT 'ambas',
    "jurisdicciones" TEXT NOT NULL DEFAULT '[]',
    "cuit" TEXT,
    "matricula" TEXT,
    "direccion" TEXT,
    "domicilio_electronico" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "abogados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "rol" "RolUsuario" NOT NULL DEFAULT 'abogado',
    "matricula" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas_usuario" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notas_usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "cuil" TEXT,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "casos" (
    "id" TEXT NOT NULL,
    "numero_caso" TEXT NOT NULL,
    "autos" TEXT,
    "cliente_id" TEXT,
    "cuil" TEXT,
    "jurisdiccion" "Jurisdiccion" NOT NULL,
    "tipo_at_ep" "TipoAtEp" NOT NULL,
    "diagnostico" TEXT,
    "relato_hechos" TEXT,
    "fecha_siniestro_pmi" TIMESTAMP(3),
    "fecha_alta_medica" TIMESTAMP(3),
    "fecha_carta_documento" TIMESTAMP(3),
    "fecha_telegrama" TIMESTAMP(3),
    "fecha_nacimiento" TIMESTAMP(3),
    "edad_pmi" INTEGER,
    "domicilio_cliente" TEXT,
    "localidad_cliente" TEXT,
    "ibm" DECIMAL(12,2),
    "empleador" TEXT,
    "cuit_empleador" TEXT,
    "art_id" TEXT,
    "testigo_1" TEXT,
    "testigo_2" TEXT,
    "captadora_id" TEXT,
    "origen_captacion" "OrigenCaptacion" NOT NULL DEFAULT 'captadora',
    "etapa" "EtapaCaso" NOT NULL DEFAULT 'SRT',
    "estado_detalle" TEXT,
    "abogado_id" TEXT,
    "monto_demandado" DECIMAL(15,2),
    "lesion" TEXT,
    "afecciones_derivadas" TEXT,
    "porcentaje_incapacidad" DECIMAL(5,2),
    "region_afectada" TEXT,
    "requiere_estudios_medicos" BOOLEAN NOT NULL DEFAULT false,
    "observaciones_medicas" TEXT,
    "domicilio_notificacion" TEXT,
    "domicilio_servicios" TEXT,
    "domicilio_reporte" TEXT,
    "fecha_baja_laboral" TIMESTAMP(3),
    "fecha_denuncia" TIMESTAMP(3),
    "domicilio_empleador" TEXT,
    "localidad_empleador" TEXT,
    "provincia_empleador" TEXT,
    "notas_internas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "casos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "datos_srt" (
    "id" TEXT NOT NULL,
    "caso_id" TEXT NOT NULL,
    "fecha_inicio" TIMESTAMP(3),
    "nro_expediente" TEXT,
    "comision_medica" TEXT,
    "tipo_tramite" TEXT,
    "formulario_inicio_url" TEXT,
    "escrito_inicio_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "datos_srt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "datos_judiciales" (
    "id" TEXT NOT NULL,
    "caso_id" TEXT NOT NULL,
    "fecha_inicio" TIMESTAMP(3),
    "nro_expediente" TEXT,
    "juzgado" TEXT,
    "pmo_url" TEXT,
    "demanda_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "datos_judiciales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formularios_inicio" (
    "id" TEXT NOT NULL,
    "caso_id" TEXT NOT NULL,
    "estado" "EstadoFormulario" NOT NULL DEFAULT 'PENDIENTE',
    "link_google_docs" TEXT,
    "link_pdf" TEXT,
    "id_autocrat" TEXT,
    "fecha_generacion" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "formularios_inicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conexiones_caso" (
    "id" TEXT NOT NULL,
    "caso_id" TEXT NOT NULL,
    "sistema" "SistemaExterno" NOT NULL,
    "conectado" BOOLEAN NOT NULL DEFAULT false,
    "nro_expediente" TEXT,
    "ultima_sincronizacion" TIMESTAMP(3),
    "url_expediente" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conexiones_caso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_expediente" (
    "id" TEXT NOT NULL,
    "caso_id" TEXT NOT NULL,
    "sistema" "SistemaExterno" NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "descripcion" TEXT,
    "fecha_movimiento" TIMESTAMP(3) NOT NULL,
    "url_documento" TEXT,
    "notificado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_expediente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comentarios" (
    "id" TEXT NOT NULL,
    "caso_id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "contenido" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comentarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adjuntos" (
    "id" TEXT NOT NULL,
    "caso_id" TEXT NOT NULL,
    "nombre_archivo" TEXT NOT NULL,
    "url_archivo" TEXT NOT NULL,
    "tipo_archivo" TEXT,
    "tamanio_bytes" INTEGER,
    "categoria" "CategoriaAdjunto" NOT NULL DEFAULT 'general',
    "uploaded_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adjuntos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo_evento" "TipoEvento" NOT NULL,
    "fecha_evento" TIMESTAMP(3) NOT NULL,
    "caso_id" TEXT,
    "usuario_responsable" TEXT,
    "descripcion" TEXT,
    "lugar" TEXT,
    "color" TEXT,
    "participantes" TEXT NOT NULL DEFAULT '[]',
    "recordatorio_minutos" INTEGER NOT NULL DEFAULT 60,
    "notificado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empleadores" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cuit" TEXT,
    "domicilio" TEXT,
    "localidad" TEXT,
    "provincia" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empleadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credenciales" (
    "id" TEXT NOT NULL,
    "sistema" "SistemaExterno" NOT NULL,
    "usuario_encrypted" TEXT,
    "password_encrypted" TEXT,
    "ultima_sincronizacion" TIMESTAMP(3),
    "estado_conexion" "EstadoConexion" NOT NULL DEFAULT 'pendiente',
    "ultima_prueba" TIMESTAMP(3),
    "intentos_fallidos" INTEGER NOT NULL DEFAULT 0,
    "intervalo_sincronizacion_minutos" INTEGER NOT NULL DEFAULT 180,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credenciales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "entidad" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "id_entidad" TEXT,
    "cambios_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_log" (
    "id" TEXT NOT NULL,
    "sistema" "SistemaExterno" NOT NULL,
    "casos_sincronizados" INTEGER NOT NULL DEFAULT 0,
    "movimientos_detectados" INTEGER NOT NULL DEFAULT 0,
    "estado" "EstadoSync" NOT NULL,
    "error_mensaje" TEXT,
    "duracion_segundos" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "arts_cuit_key" ON "arts"("cuit");

-- CreateIndex
CREATE UNIQUE INDEX "abogados_matricula_key" ON "abogados"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_cuil_key" ON "clientes"("cuil");

-- CreateIndex
CREATE UNIQUE INDEX "casos_numero_caso_key" ON "casos"("numero_caso");

-- CreateIndex
CREATE UNIQUE INDEX "datos_srt_caso_id_key" ON "datos_srt"("caso_id");

-- CreateIndex
CREATE UNIQUE INDEX "datos_judiciales_caso_id_key" ON "datos_judiciales"("caso_id");

-- CreateIndex
CREATE UNIQUE INDEX "formularios_inicio_caso_id_key" ON "formularios_inicio"("caso_id");

-- CreateIndex
CREATE UNIQUE INDEX "conexiones_caso_caso_id_sistema_key" ON "conexiones_caso"("caso_id", "sistema");

-- CreateIndex
CREATE UNIQUE INDEX "empleadores_nombre_key" ON "empleadores"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "credenciales_sistema_key" ON "credenciales"("sistema");

-- AddForeignKey
ALTER TABLE "notas_usuario" ADD CONSTRAINT "notas_usuario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casos" ADD CONSTRAINT "casos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casos" ADD CONSTRAINT "casos_art_id_fkey" FOREIGN KEY ("art_id") REFERENCES "arts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casos" ADD CONSTRAINT "casos_captadora_id_fkey" FOREIGN KEY ("captadora_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casos" ADD CONSTRAINT "casos_abogado_id_fkey" FOREIGN KEY ("abogado_id") REFERENCES "abogados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "datos_srt" ADD CONSTRAINT "datos_srt_caso_id_fkey" FOREIGN KEY ("caso_id") REFERENCES "casos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "datos_judiciales" ADD CONSTRAINT "datos_judiciales_caso_id_fkey" FOREIGN KEY ("caso_id") REFERENCES "casos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formularios_inicio" ADD CONSTRAINT "formularios_inicio_caso_id_fkey" FOREIGN KEY ("caso_id") REFERENCES "casos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conexiones_caso" ADD CONSTRAINT "conexiones_caso_caso_id_fkey" FOREIGN KEY ("caso_id") REFERENCES "casos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_expediente" ADD CONSTRAINT "movimientos_expediente_caso_id_fkey" FOREIGN KEY ("caso_id") REFERENCES "casos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_caso_id_fkey" FOREIGN KEY ("caso_id") REFERENCES "casos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adjuntos" ADD CONSTRAINT "adjuntos_caso_id_fkey" FOREIGN KEY ("caso_id") REFERENCES "casos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adjuntos" ADD CONSTRAINT "adjuntos_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_caso_id_fkey" FOREIGN KEY ("caso_id") REFERENCES "casos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_usuario_responsable_fkey" FOREIGN KEY ("usuario_responsable") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
