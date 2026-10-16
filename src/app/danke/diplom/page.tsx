import type { Metadata } from 'next'
import Link from 'next/link'
import RechtsZeile from '@/components/layout/RechtsZeile'

/**
 * Dankeseite des Grillmeister-Diploms — Ziel der Dankeseiten-URL im Digistore-Produkt
 * (src/lib/diplome/angebot.ts: DIPLOM_DANKE_PFAD). Aufbau wie /danke/mein-protokoll.
 * Der Zugang kommt per Login-Link aus dem Webhook (TOOL_REDIRECT grillmeister-diplom →
 * /diplome/roadmap); diese Seite erklaert nur, was jetzt passiert.
 */
export const metadata: Metadata = {
  title: 'Bestellung bestätigt — Grillmeister-Diplom',
  description: 'Danke für deinen Kauf — so startest du in Stufe 2 der Grillmeister-Ausbildung.',
  robots: { index: false, follow: false },
}

export default function DankeDiplomPage() {
  return (
    <main className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">

        <div className="mx-auto mb-8 w-20 h-20 rounded-full bg-[#F5A623]/10 border border-[#F5A623]/30 flex items-center justify-center">
          <svg className="w-10 h-10 text-[#F5A623]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">
          Danke — deine Grillmeister-Ausbildung geht weiter.
        </h1>
        <p className="text-[#F5A623] font-semibold text-lg mb-6">
          Stufe 2 bis 5. Lektionen, Prüfungen, Medaillen.
        </p>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8 text-left space-y-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-widest mb-4">
            Was jetzt passiert
          </h2>

          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-[#F5A623] text-black text-xs font-bold flex items-center justify-center">1</span>
            <div>
              <p className="text-white text-sm font-medium">E-Mail prüfen</p>
              <p className="text-white/60 text-sm">Du erhältst in wenigen Minuten eine Bestätigung von Digistore24 und von uns eine E-Mail mit deinem Login-Link. Schau auch im Spam-Ordner nach.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-[#F5A623] text-black text-xs font-bold flex items-center justify-center">2</span>
            <div>
              <p className="text-white text-sm font-medium">Login-Link klicken</p>
              <p className="text-white/60 text-sm">Der Link meldet dich an und führt dich zur Roadmap. Dort sind die Lektionen von Stufe 2 bis 5 jetzt für dich geöffnet.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-[#F5A623] text-black text-xs font-bold flex items-center justify-center">3</span>
            <div>
              <p className="text-white text-sm font-medium">Mit Stufe 2 weitermachen</p>
              <p className="text-white/60 text-sm">Lektion für Lektion, am Ende jeder Stufe die Prüfung. Dein Fortschritt wird in deinem Konto gespeichert.</p>
            </div>
          </div>
        </div>

        <p className="text-white/40 text-xs mb-6">
          Die Abbuchung erfolgt durch Digistore24.com
        </p>

        <Link
          href="/diplome/roadmap"
          className="inline-block mb-6 px-7 py-3.5 rounded-md bg-[#F5A623] text-black font-bold text-base hover:bg-[#F5A623]/90 transition-colors"
        >
          Zur Roadmap
        </Link>
        <p className="text-white/50 text-xs mb-6">
          Dafür meldest du dich mit der E-Mail-Adresse an, mit der du gekauft hast. Später findest du
          die Ausbildung jederzeit unter{' '}
          <Link href="/meine-kurse" className="underline text-white/70 hover:text-white">Meine Kurse</Link>.
          Kommt keine E-Mail an: pitmaster@steakakademie.de
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
