import type { Metadata } from 'next';
import NicheValidator from '@/components/tools/NicheValidator';
import { ogImages } from '@/lib/og';

export const metadata: Metadata = {
  title: 'The Niche Authority Validator · AuthorityOS',
  description:
    'A 45-second strategic audit of any niche. Get a verdict, TAM estimate, pillar pages, buyer personas, revenue projection, and the contrarian angle most builders miss. Free. No login.',
  robots: { index: true, follow: true },
  openGraph: {
    images: ogImages('The Niche Authority Validator'),
    title: 'The Niche Authority Validator',
    description:
      'A 45-second strategic audit of any niche. Built by the system behind steakakademie.de.',
    type: 'website',
  },
};

export default function NicheValidatorPage() {
  return <NicheValidator />;
}
