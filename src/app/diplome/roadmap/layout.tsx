import type { Metadata } from 'next';
import { ogImages } from '@/lib/og';

export const metadata: Metadata = {
  title: 'Grillmeister-Roadmap — 5 Stufen, Quiz & Prüfung',
  description: 'Die interaktive Grillmeister-Ausbildung: 5 Stufen von Bronze bis Meister mit Lektionen, Quiz und Flashcards. Lerne systematisch und schalte deine Diplome frei.',
  alternates: { canonical: 'https://steakakademie.de/diplome/roadmap' },
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
