import type { Metadata } from 'next';
import Anamnese from '@/components/baukasten/Anamnese';

/**
 * Projekt-Anamnese für den Website-Baukasten (KONZEPT-Website-Baukasten-2026-09-25, Abschnitt 13).
 * Erreichbar als tuwasduwillst.de/projekt-anamnese (Rewrite in next.config.mjs).
 * noindex, solange tuwasduwillst.de im Platzhalter-Stand ist — Freigabe fürs Indexieren kommt mit der Landingpage.
 */
export const metadata: Metadata = {
  title: { absolute: 'Projekt-Anamnese: Was kostet deine Website? — tuwasduwillst.de' },
  description: 'Sechs kurze Schritte, ein ehrliches Ergebnis: Umfang, Richtpreis, Mietkauf-Rate und der nächste Schritt für deine Website. Ohne Anmeldung.',
  alternates: { canonical: 'https://tuwasduwillst.de/projekt-anamnese' },
  robots: { index: false, follow: false },
};

export default function ProjektAnamnesePage() {
  return (
    <main className="relative z-10 min-h-screen flex flex-col bg-[#0F0D0B] text-[#F4EFE9] print:bg-white print:text-black">
      <header className="border-b border-[#F4EFE9]/10 print:hidden">
        <div className="max-w-3xl mx-auto px-6 py-5">
          <a href="https://tuwasduwillst.de/" className="font-sans text-xs font-bold tracking-[0.2em] uppercase text-[#E85018]">tuwasduwillst.de</a>
        </div>
      </header>

      <div className="flex-1">
        <div className="w-full max-w-3xl mx-auto px-6 py-12 sm:py-16">
          <p className="font-sans text-xs font-bold tracking-[0.2em] uppercase text-[#E85018] mb-4">Kostenlos · ca. 6 Minuten · ohne Anmeldung</p>
          <h1 className="font-sans text-4xl sm:text-5xl font-bold leading-[1.05] mb-5">Was braucht deine Website wirklich?</h1>
          <p className="font-sans text-lg text-[#F4EFE9]/75 max-w-2xl leading-relaxed mb-12 print:text-black">
            Wie ein Anamnesebogen: erst verstehen, dann empfehlen. Beantworte ein paar Fragen — danach siehst du Umfang,
            Richtpreis und deinen nächsten Schritt. Ob Neuaufbau oder Modernisierung: Die Website gehört am Ende dir.
          </p>
          <Anamnese />
        </div>
      </div>

      <footer className="border-t border-[#F4EFE9]/10 print:hidden">
        <div className="max-w-3xl mx-auto px-6 py-6 flex flex-wrap gap-x-6 gap-y-2 font-sans text-sm text-[#F4EFE9]/60">
          <span>Uwe Yendell</span>
          <a href="https://steakakademie.de/impressum" className="underline hover:text-[#F4EFE9]">Impressum</a>
          <a href="https://steakakademie.de/datenschutz" className="underline hover:text-[#F4EFE9]">Datenschutz</a>
        </div>
      </footer>
    </main>
  );
}
