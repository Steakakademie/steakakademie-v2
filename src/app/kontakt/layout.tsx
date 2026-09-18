import type { Metadata } from 'next';
import { ogImages } from '@/lib/og';

export const metadata: Metadata = {
  title: 'Kontakt',
  description: 'Fragen, Feedback oder Kooperationsanfragen? So erreichst du die Steakakademie — direkt, ohne Ticketsystem.',
  alternates: { canonical: 'https://steakakademie.de/kontakt' },
  openGraph: {
    images: ogImages('Kontakt'),
    title: 'Kontakt',
    description: 'So erreichst du die Steakakademie.',
    url: 'https://steakakademie.de/kontakt',
    type: 'website',
  },
};

export default function KontaktLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
