import type { Metadata } from 'next';
import { ogImages } from '@/lib/og';

export const metadata: Metadata = {
  title: 'Grillmeister-Roadmap — 5 Stufen, Quiz & Prüfung',
  description: 'Die interaktive Grillmeister-Ausbildung: 5 Stufen von Bronze bis Meister mit Lektionen, Quiz und Flashcards. Lerne systematisch und schalte deine Diplome frei.',
  alternates: { canonical: 'https://steakakademie.de/diplome/roadmap' },
  // Interaktive Oberflaeche, ~140 Woerter Text, aus der Sitemap schon
  // ausgeschlossen — jetzt auch aus dem Index (SEO-Audit 08.10.2026).
  robots: { index: false, follow: true },
  openGraph: {
    images: ogImages('Grillmeister-Roadmap — 5 Stufen, Quiz & Prüfung'),
    title: 'Grillmeister-Roadmap — 5 Stufen, Quiz & Prüfung',
    description: 'Interaktive BBQ-Ausbildung in 5 Stufen: Lektionen, Quiz, Flashcards — von Bronze bis Meister.',
    url: 'https://steakakademie.de/diplome/roadmap',
    type: 'website',
  },
};

export default function RoadmapLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
