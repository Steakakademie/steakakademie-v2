import Anthropic from '@anthropic-ai/sdk'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { ADMIN_COOKIE, istAdminCookie } from '@/lib/admin-auth'
import { AGENT_SYSTEM_PROMPT } from '@/lib/pm-agent-context'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/**
 * POST /api/pm-agent — interner PM-Chat (nur Admin).
 *
 * Haertung 03.10.2026: Bis dahin pruefte die Route selbst NICHTS. Einziger
 * Schutz war der Matcher in src/proxy.ts. Faellt der aus (Umbenennung der
 * Datei, ein Tippfehler im Matcher, ein neuer Pfad daneben), steht ein
 * Sonnet-Endpunkt ohne Anmeldung und ohne Grenze offen — und niemand merkt es,
 * weil alles weiter funktioniert. Deshalb prueft die Route das Admin-Cookie
 * jetzt selbst, wie die Routen unter /api/admin. Der Proxy bleibt als erste
 * Schicht bestehen.
 *
 * Dazu eine Obergrenze fuer den Body und ein Schema fuer `messages`: Vorher
 * ging `await req.json()` ungeprueft an Anthropic — beliebig gross, beliebige
 * Rollen.
 */
const MAX_BODY_BYTES = 256 * 1024

// Nur user/assistant — der Systemprompt kommt vom Server, nicht aus dem Body.
const PmBody = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(32_000) }))
    .min(1)
    .max(100),
})

function fehler(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

export async function POST(req: Request) {
  if (!(await istAdminCookie((await cookies()).get(ADMIN_COOKIE)?.value))) {
    return fehler(401, 'Unauthorized')
  }

  // Erst die angekuendigte, dann die tatsaechliche Groesse (Content-Length kann
  // fehlen oder luegen).
  const angekuendigt = Number(req.headers.get('content-length') ?? '0')
  if (Number.isFinite(angekuendigt) && angekuendigt > MAX_BODY_BYTES) {
    return fehler(413, 'Anfrage zu groß.')
  }
  let roh: string
  try {
    roh = await req.text()
  } catch {
    return fehler(400, 'Body nicht lesbar.')
  }
  if (new TextEncoder().encode(roh).length > MAX_BODY_BYTES) {
    return fehler(413, 'Anfrage zu groß.')
  }

  let body: unknown
  try {
    body = JSON.parse(roh)
  } catch {
    return fehler(400, 'Ungültiges JSON.')
  }
  const eingabe = PmBody.safeParse(body)
  if (!eingabe.success) return fehler(400, 'Ungültige Eingabe.')
  const { messages } = eingabe.data

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: AGENT_SYSTEM_PROMPT,
    messages,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
