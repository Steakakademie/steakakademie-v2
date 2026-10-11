import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AktionsSeite from '@/components/aktionen/AktionsSeite';
import { aktionBySlug, istAktiv } from '@/lib/aktionen';

/**
 * /geschenke — kurze Adresse der Aktionsseite data/aktionen/geschenke.yaml (11.10.2026).
 * Gleiche Regeln wie /aktionen/[slug]: nur im Fenster sichtbar (02.11.–24.12.), sonst 404;
 * `?vorschau=1` zeigt sie vorher mit noindex. Die Sitemap nimmt sie nur im Fenster auf
 * (next-sitemap.config.js).
 */
export const revalidate = 3600;

const SLUG = 'geschenke';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const aktion = aktionBySlug(SLUG);
  if (!aktion) return {};
  const sp = await searchParams;
  const vorschau = sp.vorschau === '1';
  return {
    title: aktion.seoTitle,
    description: aktion.seoDescription,
    alternates: { canonical: 'https://steakakademie.de/geschenke' },
    robots: vorschau || !istAktiv(aktion) ? { index: false, follow: false } : undefined,
  };
}

export default async function GeschenkePage({ searchParams }: Props) {
  const aktion = aktionBySlug(SLUG);
  if (!aktion) notFound();
  const sp = await searchParams;
  const vorschau = sp.vorschau === '1';
  if (!vorschau && !istAktiv(aktion)) notFound();
  return <AktionsSeite aktion={aktion} vorschau={vorschau && !istAktiv(aktion)} />;
}
