import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { istAdminPasswort } from '@/lib/admin-auth'

export async function POST(req: Request) {
  const { password } = await req.json()

  if (istAdminPasswort(password)) {
    const cookieStore = await cookies()
    cookieStore.set('admin_auth', password, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
