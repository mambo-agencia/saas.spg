import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // ─── ADMIN USER ───────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin1234!', 12)
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@spgjuridico.com.ar' },
    create: {
      email: 'admin@spgjuridico.com.ar',
      passwordHash: adminHash,
      nombre: 'Administrador SPG',
      rol: 'admin',
    },
    update: {},
  })
  console.log(`Admin user: ${admin.email}`)

  // ─── ABOGADOS (datos reales SPG) ──────────────────────────
  const abogadosData = [
    {
      nombre: 'Pablo Zarich',
      zona: 'ambas' as const,
      jurisdicciones: JSON.stringify(['PROVINCIA_BA', 'NEUQUEN']),
      cuit: '20-12345678-9',
      matricula: 'T° LIII F° 113 C.A.S.I.',
      email: 'pablo@sanchezpachelo.com.ar',
      direccion: 'Av. Corrientes 1234, CABA',
      telefono: '1145678901',
      activo: true,
    },
    {
      nombre: 'Magdalena Salotti',
      zona: 'ambas' as const,
      jurisdicciones: JSON.stringify(['PROVINCIA_BA', 'NEUQUEN']),
      cuit: '27-23456789-0',
      matricula: 'T° LIV F° 150 C.A.S.I.',
      email: 'magdalena@sanchezpachelo.com.ar',
      direccion: 'Av. Corrientes 1234, CABA',
      telefono: '1145678902',
      activo: true,
    },
    {
      nombre: 'Dr. Juan García',
      zona: 'ambas' as const,
      jurisdicciones: JSON.stringify(['CABA', 'PROVINCIA_BA', 'NEUQUEN', 'RIO_NEGRO']),
      cuit: '20-34567890-1',
      matricula: '12345',
      email: 'jgarcia@spgjuridico.com.ar',
      direccion: 'Av. Corrientes 1234, CABA',
      telefono: '1112345678',
      activo: true,
    },
  ]

  for (const a of abogadosData) {
    await prisma.abogado.upsert({
      where: { matricula: a.matricula },
      create: a,
      update: { nombre: a.nombre, email: a.email, cuit: a.cuit },
    })
  }
  console.log(`Abogados: ${abogadosData.length} upserted`)

  // ─── ARTs (datos reales) ──────────────────────────────────
  const arts = [
    {
      nombre: 'SWISS MEDICAL',
      razonSocial: 'Swiss Medical ART S.A.',
      cuit: '30-12345678-5',
      domicilio: 'Av. Corrientes 123, CABA',
      domicilioProvincia: 'Av. Corrientes 123, Buenos Aires',
      domicilioNqn: 'Mitre 456, Neuquén',
    },
    {
      nombre: 'EXPERTA ART',
      razonSocial: 'Experta ART S.A.',
      cuit: '30-23456789-6',
      domicilio: 'Calle Florida 789, CABA',
      domicilioProvincia: 'Calle Florida 789, Buenos Aires',
      domicilioNqn: 'San Martín 111, Neuquén',
    },
    {
      nombre: 'LA HOLANDO',
      razonSocial: 'La Holando Sudamericana Cía. de Seguros',
      cuit: '33-50003806-9',
      domicilio: 'Paseo Colón 300, CABA',
      domicilioProvincia: 'Paseo Colón 300, Buenos Aires',
      domicilioNqn: null,
    },
    {
      nombre: 'FED. PATRONAL',
      razonSocial: 'Federación Patronal Seguros S.A.',
      cuit: '30-34567890-7',
      domicilio: 'Leandro N. Alem 567, CABA',
      domicilioProvincia: 'Leandro N. Alem 567, Buenos Aires',
      domicilioNqn: null,
    },
    {
      nombre: 'IBERIA',
      razonSocial: 'Iberia ART S.A.',
      cuit: '30-12345678-9',
      domicilio: 'Av. Rivadavia 1234, CABA',
      domicilioProvincia: 'Av. Rivadavia 1234, Buenos Aires',
      domicilioNqn: 'Av. Argentina 789, Neuquén',
    },
    {
      nombre: 'MERCANTIL ANDINA',
      razonSocial: 'Mercantil Andina S.A.',
      cuit: '30-45678901-2',
      domicilio: 'Tucumán 500, CABA',
      domicilioProvincia: null,
      domicilioNqn: 'Belgrano 123, Neuquén',
    },
    {
      nombre: 'GALENO',
      razonSocial: 'Galeno ART S.A.',
      cuit: '30-78901234-5',
      domicilio: 'Viamonte 1234, CABA',
      domicilioProvincia: 'Viamonte 1234, Buenos Aires',
      domicilioNqn: 'Lácar 456, Neuquén',
    },
    {
      nombre: 'PREVENCIÓN',
      razonSocial: 'Prevención ART S.A.',
      cuit: '30-89012345-6',
      domicilio: 'Sarmiento 999, CABA',
      domicilioProvincia: 'Sarmiento 999, Buenos Aires',
      domicilioNqn: null,
    },
  ]

  for (const art of arts) {
    await prisma.arte.upsert({
      where: { cuit: art.cuit },
      create: art,
      update: {
        nombre: art.nombre,
        domicilioProvincia: art.domicilioProvincia,
        domicilioNqn: art.domicilioNqn,
      },
    })
  }
  console.log(`ARTs: ${arts.length} upserted`)

  // ─── EMPLEADORES (para autocompletado) ───────────────────
  const empleadores = [
    { nombre: 'YPF S.A.', cuit: '30-54668997-9', domicilio: 'Macacha Güemes 515', localidad: 'Buenos Aires', provincia: 'CABA' },
    { nombre: 'TECHINT S.A.', cuit: '30-55442367-3', domicilio: 'Av. Leandro N. Alem 1067', localidad: 'Buenos Aires', provincia: 'CABA' },
    { nombre: 'TRANSPORTES NEUQUÉN S.A.', cuit: '30-71234567-8', domicilio: 'Av. Argentina 1234', localidad: 'Neuquén', provincia: 'NEUQUEN' },
    { nombre: 'CONSTRUCCIONES SUR S.A.', cuit: '30-61234567-0', domicilio: 'Ruta 22 km 5', localidad: 'Neuquén', provincia: 'NEUQUEN' },
    { nombre: 'SUPERMERCADOS LA ANONIMA', cuit: '30-70845676-5', domicilio: 'Av. Rivadavia 4200', localidad: 'Buenos Aires', provincia: 'PROVINCIA_BA' },
  ]

  for (const emp of empleadores) {
    await prisma.empleador.upsert({
      where: { nombre: emp.nombre },
      create: emp,
      update: { cuit: emp.cuit },
    })
  }
  console.log(`Empleadores: ${empleadores.length} upserted`)

  // ─── CREDENCIALES INICIALES ───────────────────────────────
  const sistemas = ['MEV', 'SRT', 'PJN_BA', 'PJN_NEUQUEN', 'PJN_RIO_NEGRO'] as const
  for (const sistema of sistemas) {
    await prisma.credencial.upsert({
      where: { sistema },
      create: { sistema, estadoConexion: 'pendiente' },
      update: {},
    })
  }

  console.log('Seed complete ✓')
  console.log('Default credentials → admin@spgjuridico.com.ar / Admin1234!')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
