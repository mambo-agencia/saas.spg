import twilio from 'twilio'
import { logger } from '../lib/logger'

let client: ReturnType<typeof twilio> | null = null

function getClient() {
  if (!client) {
    const sid = process.env.TWILIO_ACCOUNT_SID
    const token = process.env.TWILIO_AUTH_TOKEN
    if (!sid || !token) throw new Error('Twilio credentials not configured')
    client = twilio(sid, token)
  }
  return client
}

export async function sendWhatsApp(to: string, message: string): Promise<void> {
  const from = process.env.TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886'

  // Normalize phone number
  const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:+54${to.replace(/\D/g, '')}`

  try {
    await getClient().messages.create({
      body: message,
      from,
      to: toFormatted,
    })
    logger.debug(`WhatsApp sent to ${toFormatted}`)
  } catch (err) {
    logger.error(`WhatsApp send failed to ${toFormatted}: ${err}`)
    throw err
  }
}
