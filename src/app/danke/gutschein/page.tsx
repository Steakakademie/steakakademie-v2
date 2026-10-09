import type { Metadata } from 'next'
import Link from 'next/link'
import RechtsZeile from '@/components/layout/RechtsZeile'

export const metadata: Metadata = {
  title: 'Bestellung bestätigt — Geschenkgutschein',
  description: 'Dein Geschenkgutschein wird erstellt und kommt per E-Mail.',
  robots: { index: false, follow: false },
}

export default function DankeGutscheinPage() {
  return (
    <main className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">

        <div className="mx-auto mb-8 w-20 h-20 rounded-full bg-[#F5A623]/10 border border-[#F5A623]/30 flex items-center justify-center">
          <svg className="w-10 h-10 text-[#F5A623]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H4.5a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">
          Der Gutschein ist auf dem Weg.
        </h1>
        <p className="text-[#F5A623] font-semibold text-lg mb-6">
          Verschenkt wird gleich — per Code oder ausgedruckt.
        </p>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8 text-left space-y-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-widest mb-4">
            Was jetzt passiert
          </h2>

          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-[#F5A623] text-black text-xs font-bold flex items-center justify-center">1</span>
            <div>
              <p className="text-white text-sm font-medium">E-Mail prüfen</p>
              <p className="text-white/60 text-sm">Du erhältst in wenigen Minuten deinen Gutschein-Code mit einem Link zur druckbaren Geschenkseite.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-[#F5A623] text-black text-xs font-bold flex items-center justify-center">2</span>
            <div>
              <p className="text-white text-sm font-medium">Verschenken</p>
              <p className="text-white/60 text-sm">Code weitergeben oder die Geschenkseite ausdrucken und unter den Baum legen — beides funktioniert.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-[#F5A623] text-black text-xs font-bold flex items-center justify-center">3</span>
            <div>
              {/* 03.10.2026: „jederzeit … kein Zeitdruck" stand gegen die Frist.
                  09.10.2026: Frist wie AGB § 5a — bis Jahresende des dritten Folgejahres
                  (Migration 20261009200000); vorher rechnete die Datenbank ab Kauf. */}
              <p className="text-white text-sm font-medium">Einlösen — mindestens 3 Jahre Zeit</p>
              <p className="text-white/60 text-sm">
                Die beschenkte Person löst den Code unter{' '}
                <span className="text-white/80">steakakademie.de/gutschein/einloesen</span>{' '}
                ein und legt sofort los. Kein Abo. Der Gutschein gilt bis zum 31. Dezember des dritten
                Jahres nach dem Kauf.
              </p>
            </div>
          </div>
        </div>

        <p className="text-white/40 text-xs mb-6">
          Die Abbuchung erfolgt durch Digistore24.com
        </p>

        <Link
          href="/"
          className="inline-block text-[#F5A623] hover:text-[#F5A623]/80 text-sm font-medium underline underline-offset-4 transition-colors"
        >
          Zurück zur Startseite
        </Link>

        <RechtsZeile />
      </div>
    </main>
  )
}
