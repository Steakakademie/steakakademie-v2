import type { Metadata } from 'next';

/**
 * Platzhalter fuer tuwasduwillst.de (Uwe, 23.09.2026).
 * Eigenregie und weitere Produkte (u. a. Realitäts-Check Selbstständigkeit) ziehen
 * auf diese Domain; die Landingpage entsteht erst nach der Konzeptphase. Bis dahin zeigt JEDE Adresse
 * auf tuwasduwillst.de diese Seite (Rewrite in next.config.mjs).
 * Claims aus areas/eigenregie: #2 als H1, #3 als Meta-Description.
 * Bewusst ohne Steakakademie-Kopf/-Fuss, ohne Kaufweg, noindex.
 */
export const metadata: Metadata = {
  title: { absolute: 'tuwasduwillst.de — Tu was du willst. Mit System.' },
  description: 'Tu was du willst. Niemand sonst entscheidet mit.',
  alternates: { canonical: 'https://tuwasduwillst.de/' },
  robots: { index: false, follow: false },
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: 'https://tuwasduwillst.de/',
    siteName: 'tuwasduwillst.de',
    title: 'Tu was du willst — mit System.',
    description: 'Tu was du willst. Niemand sonst entscheidet mit.',
  },
  twitter: { card: 'summary' },
};

export default function TuwasduwillstPlatzhalter() {
  return (
    <main className="relative z-10 min-h-screen flex flex-col bg-[#0F0D0B] text-[#F4EFE9]">
      <div className="flex-1 flex items-center">
        <div className="w-full max-w-3xl mx-auto px-6 py-24">
          <p className="font-sans text-xs font-bold tracking-[0.2em] uppercase text-[#E85018] mb-6">tuwasduwillst.de</p>
          <h1 className="font-sans text-4xl sm:text-6xl font-bold leading-[1.05] mb-6">
            Tu was du willst —<br />mit System.
          </h1>
          <p className="font-sans text-lg sm:text-xl text-[#F4EFE9]/75 max-w-xl leading-relaxed">
            Niemand sonst entscheidet mit. Hier entstehen ehrliche Werkzeuge für deine Selbstständigkeit — ohne Hochglanz-Versprechen,
            mit echten Zahlen. Zuerst: <strong className="text-[#F4EFE9]">Eigenregie</strong>, der Selbstlern-Kurs für deine eigene
            Website, und der <strong className="text-[#F4EFE9]">Realitäts-Check Selbstständigkeit</strong>.
          </p>
          <div className="mt-10 border-l-2 border-[#E85018] pl-5">
            <p className="font-sans text-base text-[#F4EFE9]/85">
              Du brauchst eine Website — neu oder modernisiert — und willst sie am Ende selbst besitzen?
            </p>
            <a href="https://tuwasduwillst.de/projekt-anamnese" className="inline-block mt-3 font-sans font-bold text-[#E85018] underline underline-offset-4 hover:text-[#F4EFE9]">
              In ca. 6 Minuten zu Umfang und Richtpreis →
            </a>
          </div>
          <p className="font-sans text-sm text-[#F4EFE9]/50 mt-10">Mehr bald hier.</p>
        </div>
      </div>
      <footer className="border-t border-[#F4EFE9]/10">
        <div className="max-w-3xl mx-auto px-6 py-6 flex flex-wrap gap-x-6 gap-y-2 font-sans text-sm text-[#F4EFE9]/60">
          <span>Uwe Yendell</span>
          <a href="https://steakakademie.de/impressum" className="underline hover:text-[#F4EFE9]">Impressum</a>
          <a href="https://steakakademie.de/datenschutz" className="underline hover:text-[#F4EFE9]">Datenschutz</a>
        </div>
      </footer>
    </main>
  );
}
