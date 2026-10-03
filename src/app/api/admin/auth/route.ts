import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  ADMIN_COOKIE,
  ADMIN_SITZUNG_SEKUNDEN,
  erzeugeAdminToken,
  istAdminPasswort,
} from '@/lib/admin-auth'
import { rateLimitRequest } from '@/lib/api/guard'

/**
 * POST /api/admin/auth — Admin-Login.
 *
 * Der Cookie traegt seit 02.10.2026 ein signiertes Sitzungs-Token, nicht mehr
 * das Passwort (Begruendung: src/lib/admin-auth.ts). Wer noch einen alten
 * Cookie mit dem Passwort als Wert hat, ist abgemeldet und meldet sich einmal
 * neu an.
 *
 * Begrenzung seit 03.10.2026: 5 Versuche je IP in 15 Minuten, danach 429.
 * Bis dahin liess sich das Passwort beliebig oft durchprobieren — der Vergleich
 * ist zeitkonstant, aber ohne Zaehler nuetzt das nichts. Gezaehlt wird JEDER
 * Versuch, auch der richtige: Ein Limit, das nur Fehlversuche zaehlt, braucht
 * einen zweiten Zustand, und fuenf Anmeldungen in 15 Minuten reichen im Alltag.
 * Der Zaehler lebt im Prozess (Grenze in src/lib/api/guard.ts beschrieben) —
 * er bremst Skript-Schleifen, eine harte Sperre ist er nicht.
 */
const LOGIN_RATE = { limit: 5, windowMs: 15 * 60_000 }

export async function POST(req: Request) {
  // Vor dem Body und vor dem Vergleich: gesperrte Clients kosten nichts.
  const limit = rateLimitRequest(req, 'admin-login', LOGIN_RATE)
  if (!limit.ok) return limit.response

  let password: unknown
  try {
    ({ password } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (typeof password === 'string' && istAdminPasswort(password)) {
    const token = await erzeugeAdminToken()
    if (token) {
      const cookieStore = await cookies()
      cookieStore.set(ADMIN_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: ADMIN_SITZUNG_SEKUNDEN,
        path: '/',
      })
      return NextResponse.json({ ok: true })
    }
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
