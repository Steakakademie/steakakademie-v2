import type { Metadata } from 'next';
import { ogImages } from '@/lib/og';

export const metadata: Metadata = {
  title: 'Diplom-System kennenlernen — interaktive Demo',
  description: 'Probiere das Grillmeister-Diplom-System: So funktioniert die Ausbildung von Bronze bis Meister — Stufen, Prüfungen und Urkunden im Überblick.',
  alternates: { canonical: 'https://steakakademie.de/diplome/simulation' },
  // Demo-Oberflaeche, ~40 Woerter Text, aus der Sitemap schon ausgeschlossen —
  // jetzt auch aus dem Index (SEO-Audit 08.10.2026).
  robots: { index: false, follow: true },
  openGraph: {
    images: ogImages('Diplom-System kennenlernen — Demo'),
    title: 'Diplom-System kennenlernen — Demo',
    description: 'So funktioniert die Grillmeister-Ausbildung: Stufen, Prüfungen, Urkunden.',
    url: 'https://steakakademie.de/diplome/simulation',
    type: 'website',
  },
};

export default function SimulationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
