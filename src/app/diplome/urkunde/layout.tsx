import type { Metadata } from 'next';
import { urkundePreisMitVersand } from '@/lib/urkunde/preis';

// Der Preis kommt aus src/lib/urkunde/preis.ts — nie hier hartschreiben.
// Bis 11.09.2026 stand hier „9,99 € + 4,99 € Porto" (= 14,98 €), waehrend die
// Seite selbst schon 17,99 € inkl. Versand auswies. Google zeigte damit einen
// anderen Preis als die Seite — eine irrefuehrende Angabe im Sinne des § 5 UWG.
export const metadata: Metadata = {
  title: 'Grillmeister-Urkunde — digital kostenlos, gedruckt per Post',
  description: `Deine Grillmeister-Urkunde: digital kostenlos zum Teilen, auf Wunsch gedruckt und per Post (${urkundePreisMitVersand()}). Mit Name, Grad und erreichter Stufe.`,
  alternates: { canonical: 'https://steakakademie.de/diplome/urkunde' },
  openGraph: {
    title: 'Grillmeister-Urkunde — digital kostenlos, gedruckt per Post',
    description: `Urkunde mit deinem Namen, Grad und Stufe — digital gratis, gedruckt per Post (${urkundePreisMitVersand()}).`,
    url: 'https://steakakademie.de/diplome/urkunde',
    type: 'website',
  },
};

export default function UrkundeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
