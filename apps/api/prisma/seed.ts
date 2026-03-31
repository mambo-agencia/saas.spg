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

  // ─── ABOGADOS ─────────────────────────────────────────────
  await prisma.abogado.upsert({
    where: { matricula: '12345' },
    create: {
      nombre: 'Dr. Juan García',
      zona: 'ambas',
      jurisdicciones: JSON.stringify(['CABA', 'PROVINCIA_BA', 'NEUQUEN', 'RIO_NEGRO']),
      matricula: '12345',
      direccion: 'Av. Corrientes 1234, CABA',
      domicilioElectronico: 'jgarcia@spgjuridico.com.ar',
      telefono: '1112345678',
      email: 'jgarcia@spgjuridico.com.ar',
    },
    update: {},
  })

  // ─── ARTs ─────────────────────────────────────────────────
  const arts = [
    { nombre: 'IBERIA', razonSocial: 'Iberia ART S.A.', cuit: '30-12345678-9' },
    { nombre: 'SWISS', razonSocial: 'Swiss Medical ART S.A.', cuit: '30-23456789-0' },
    { nombre: 'MERCANTIL', razonSocial: 'Mercantil Andina S.A.', cuit: '30-34567890-1' },
    { nombre: 'APRE', razonSocial: 'APRE ART S.A.', cuit: '30-45678901-2' },
    { nombre: 'EXPERTA', razonSocial: 'Experta ART S.A.', cuit: '30-56789012-3' },
    { nombre: 'FEDERACION PATRONAL', razonSocial: 'Federación Patronal Seguros S.A.', cuit: '30-67890123-4' },
    { nombre: 'GALENO', razonSocial: 'Galeno ART S.A.', cuit: '30-78901234-5' },
    { nombre: 'PREVENCIÓN', razonSocial: 'Prevención ART S.A.', cuit: '30-89012345-6' },
  ]

  for (const art of arts) {
    await prisma.arte.upsert({
      where: { cuit: art.cuit },
      create: art,
      update: { nombre: art.nombre },
    })
  }

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
