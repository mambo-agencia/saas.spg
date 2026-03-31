import { prisma } from '../lib/prisma'

/**
 * Generates the next sequential case number in the format SPG-YYYY-NNNN
 */
export async function generateNumeroCaso(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `SPG-${year}-`

  const last = await prisma.caso.findFirst({
    where: { numeroCaso: { startsWith: prefix } },
    orderBy: { numeroCaso: 'desc' },
    select: { numeroCaso: true },
  })

  let nextNum = 1
  if (last) {
    const parts = last.numeroCaso.split('-')
    nextNum = parseInt(parts[parts.length - 1]) + 1
  }

  return `${prefix}${String(nextNum).padStart(4, '0')}`
}
