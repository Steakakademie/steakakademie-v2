import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Bestellung bestätigt — Mein Protokoll',
  description: 'Danke für deinen Kauf — so kommst du zu deinem 8-Wochen-Grillplan.',
  robots: { index: false, follow: false },
}

export default function DankeMeinProtokollPage() {
  return (
    <main className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">

        <div className="mx-auto mb-8 w-20 h-20 rounded-full bg-[#F5A623]/10 border border-[#F5A623]/30 flex items-center justify-center">
          <svg className="w-10 h-10 text-[#F5A623]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">
          Danke — jetzt fehlen nur noch deine Antworten.
        </h1>
        <p className="text-[#F5A623] font-semibold text-lg mb-6">
          8 Wochen. Dein Setup. Deine Ziele.
        </p>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8 text-left space-y-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-widest mb-4">
            Was jetzt passiert
          </h2>

          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-[#F5A623] text-black text-xs font-bold flex items-center justify-center">1</span>
            <div>
              <p className="text-white text-sm font-medium">E-Mail prüfen</p>
              <p className="text-white/60 text-sm">Du bekommst in wenigen Minuten zwei E-Mails: von der Steakakademie deinen persönlichen Login-Link zum Fragebogen, von Digistore24 die Kaufbestätigung mit Rechnung. Schau auch im Spam-Ordner nach.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-[#F5A623] text-black text-xs font-bold flex items-center justify-center">2</span>
            <div>
              <p className="text-white text-sm font-medium">5-Minuten-Fragebogen ausfüllen</p>
              <p className="text-white/60 text-sm">Dein Grill, deine Zeit, dein Niveau, dein Ziel — damit der Plan wirklich zu dir passt. Erstellt wird er erst, wenn du den Fragebogen abschickst.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-[#F5A623] text-black text-xs font-bold flex items-center justify-center">3</span>
            <div>
              <p className="text-white text-sm font-medium">Deinen 8-Wochen-Plan erhalten</p>
              <p className="text-white/60 text-sm">Cuts, Techniken, Progression — Woche für Woche aufgebaut. Zu jedem Protokoll gehört eine kostenlose Korrektur, falls der erste Wurf nicht passt.</p>
            </div>
          </div>
        </div>

        <p className="text-white/40 text-xs mb-6">
          Die Abbuchung erfolgt durch Digistore24.com
        </p>

        <Link
          href="/mein-protokoll/fragebogen"
          className="inline-block mb-6 px-7 py-3.5 rounded-md bg-[#F5A623] text-black font-bold text-base hover:bg-[#F5A623]/90 transition-colors"
        >
          Direkt zum Fragebogen
        </Link>
        <p className="text-white/50 text-xs mb-6">
          Dafür meldest du dich mit der E-Mail-Adresse an, mit der du gekauft hast. Später findest du
          deinen Plan jederzeit unter{' '}
          <Link href="/meine-kurse" className="underline text-white/70 hover:text-white">Meine Kurse</Link>.
          Kommt keine E-Mail an: pitmaster@steakakademie.de
        </p>

        <Link
          href="/"
          className="inline-block text-[#F5A623] hover:text-[#F5A623]/80 text-sm font-medium underline underline-offset-4 transition-colors"
        >
          Zurück zur Startseite
        </Link>
      </div>
    </main>
  )
}
