import type { Metadata } from 'next'
import Link from 'next/link'
import RechtsZeile from '@/components/layout/RechtsZeile'

export const metadata: Metadata = {
  title: 'Bestellung bestätigt — Steak-Beichte',
  description: 'Deine Steak-Beichte wurde erfolgreich gebucht.',
  robots: { index: false, follow: false },
}

export default function DankeStakBeichtePage() {
  return (
    <main className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">

        <div className="mx-auto mb-8 w-20 h-20 rounded-full bg-[#F5A623]/10 border border-[#F5A623]/30 flex items-center justify-center">
          <svg className="w-10 h-10 text-[#F5A623]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        {/* 03.10.2026: Hier stand „Deine Beichte ist angekommen. Die Diagnose läuft" —
            nach dem Kauf ist aber noch nichts eingereicht; die Analyse startet erst
            mit dem Formular. */}
        <h1 className="text-3xl font-bold text-white mb-3">
          Danke — jetzt fehlt nur noch deine Beichte.
        </h1>
        <p className="text-[#F5A623] font-semibold text-lg mb-6">
          Die Diagnose startet, sobald du das Formular abschickst.
        </p>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8 text-left space-y-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-widest mb-4">
            Was jetzt passiert
          </h2>

          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-[#F5A623] text-black text-xs font-bold flex items-center justify-center">1</span>
            <div>
              <p className="text-white text-sm font-medium">E-Mail prüfen</p>
              <p className="text-white/60 text-sm">Du bekommst in wenigen Minuten zwei E-Mails: von der Steakakademie deinen persönlichen Login-Link zum Diagnose-Formular, von Digistore24 die Kaufbestätigung. Schau auch im Spam-Ordner nach.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-[#F5A623] text-black text-xs font-bold flex items-center justify-center">2</span>
            <div>
              <p className="text-white text-sm font-medium">Dein Grillproblem beschreiben</p>
              <p className="text-white/60 text-sm">Füll das kurze Formular aus — was war das Ziel, was ist passiert, wie hat das Ergebnis ausgesehen.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-[#F5A623] text-black text-xs font-bold flex items-center justify-center">3</span>
            <div>
              <p className="text-white text-sm font-medium">Diagnose erhalten</p>
              <p className="text-white/60 text-sm">Du bekommst deine persönliche Ursachenanalyse mit konkretem Korrektur-Protokoll — damit es nächstes Mal klappt.</p>
            </div>
          </div>
        </div>

        <p className="text-white/40 text-xs mb-6">
          Die Abbuchung erfolgt durch Digistore24.com
        </p>

        {/* Der Weg zum Formular hing bisher allein am Link in der Kauf-Mail. */}
        <Link
          href="/steak-beichte/diagnose"
          className="inline-block mb-6 px-7 py-3.5 rounded-md bg-[#F5A623] text-black font-bold text-base hover:bg-[#F5A623]/90 transition-colors"
        >
          Direkt zum Diagnose-Formular
        </Link>
        <p className="text-white/50 text-xs mb-6">
          Dafür meldest du dich mit der E-Mail-Adresse an, mit der du gekauft hast.
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
