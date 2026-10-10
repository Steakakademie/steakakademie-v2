import type { Metadata } from 'next';
import RettungClient from './RettungClient';
import Angebotshinweis from '@/components/angebote/Angebotshinweis';
import { angebote } from '@/lib/angebote/register';
import { hinweisImText } from '@/lib/angebote/auswahl';

export const metadata: Metadata = {
  title: 'Steak-Rettungs-Bibliothek — 6 Grillfehler',
  // 03.10.2026: an die sechs Faelle der Seite angeglichen (RettungClient.tsx) —
  // „keine Kruste" und „Fleisch klebt" gibt es dort nicht.
  description: 'Die 6 häufigsten Grillkatastrophen und wie du sie rettest: grau, zäh, durchgegart, kein Smoke Ring, außen verbrannt und innen roh, trocken. Mit Anleitungen.',
  alternates: { canonical: 'https://steakakademie.de/rettung' },
  openGraph: {
    title: 'Steak-Rettungs-Bibliothek — 6 Grillkatastrophen und ihre Lösung',
    description: 'Steak zu durch, zu roh oder trocken? Unsere Rettungs-Bibliothek hilft sofort.',
    url: 'https://steakakademie.de/rettung',
    images: [{ url: '/api/og', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image', creator: '@steakakademie' },
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Startseite', item: 'https://steakakademie.de' },
    { '@type': 'ListItem', position: 2, name: 'Wissen', item: 'https://steakakademie.de/wissen' },
    { '@type': 'ListItem', position: 3, name: 'Steak-Rettung', item: 'https://steakakademie.de/rettung' },
  ],
};

export default function RettungPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* Anlass „Dein Fall steht nicht dabei“ → Steak-Beichte (data/angebote.yaml). Server-Baustein als Slot. */}
      <RettungClient
        beichte={<Angebotshinweis hinweis={hinweisImText(angebote(), { typ: 'rettung', slug: 'rettung' })} seite="rettung" variante="karte" />}
      />
    </>
  );
}
