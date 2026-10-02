import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  ADMIN_COOKIE,
  ADMIN_SITZUNG_SEKUNDEN,
  erzeugeAdminToken,
  istAdminPasswort,
} from '@/lib/admin-auth'

/**
 * POST /api/admin/auth — Admin-Login.
 *
 * Der Cookie traegt seit 02.10.2026 ein signiertes Sitzungs-Token, nicht mehr
 * das Passwort (Begruendung: src/lib/admin-auth.ts). Wer noch einen alten
 * Cookie mit dem Passwort als Wert hat, ist abgemeldet und meldet sich einmal
 * neu an.
 */
export async function POST(req: Request) {
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
