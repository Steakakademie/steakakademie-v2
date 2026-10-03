import type { Metadata } from 'next'
import Link from 'next/link'
import RechtsZeile from '@/components/layout/RechtsZeile'

export const metadata: Metadata = {
  title: 'Bestellung bestätigt',
  description: 'Deine Bestellung wurde erfolgreich abgeschlossen.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function DankePage() {
  return (
    <main className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">

        {/* Icon */}
        <div className="mx-auto mb-8 w-20 h-20 rounded-full bg-[#F5A623]/10 border border-[#F5A623]/30 flex items-center justify-center">
          <svg className="w-10 h-10 text-[#F5A623]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        {/* Headline */}
        <h1 className="text-3xl font-bold text-white mb-3">
          Herzlichen Glückwunsch!
        </h1>
        <p className="text-[#F5A623] font-semibold text-lg mb-6">
          Deine Bestellung ist eingegangen.
        </p>

        {/* Steps */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8 text-left space-y-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-widest mb-4">
            Nächste Schritte
          </h2>

          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-[#F5A623] text-black text-xs font-bold flex items-center justify-center">1</span>
            <div>
              <p className="text-white text-sm font-medium">E-Mail prüfen</p>
              <p className="text-white/50 text-sm">Du erhältst in wenigen Minuten eine Bestätigung von Digistore24 und von uns eine E-Mail mit deinem Login-Link.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-[#F5A623] text-black text-xs font-bold flex items-center justify-center">2</span>
            <div>
              <p className="text-white text-sm font-medium">Konto erstellen oder einloggen</p>
              <p className="text-white/50 text-sm">Klicke auf den Link in deiner E-Mail oder melde dich direkt hier an.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-[#F5A623] text-black text-xs font-bold flex items-center justify-center">3</span>
            <div>
              <p className="text-white text-sm font-medium">Sofortiger Zugang</p>
              <p className="text-white/50 text-sm">Dein Kurs-Zugang wird automatisch freigeschaltet — du kannst sofort starten.</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/auth/login"
          className="inline-block w-full bg-[#F5A623] hover:bg-[#e09520] text-black font-bold py-4 px-8 rounded-lg transition-colors text-base"
        >
          Jetzt einloggen &amp; Kurs starten
        </Link>

        <p className="mt-4 text-white/30 text-xs">
          Die Abbuchung erfolgt durch Digistore24.com. Bei Fragen:{' '}
          <a href="mailto:pitmaster@steakakademie.de" className="underline hover:text-white/60 transition-colors">
            pitmaster@steakakademie.de
          </a>
        </p>

        <RechtsZeile />

      </div>
    </main>
  )
}
