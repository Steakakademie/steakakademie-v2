import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import AktionsSeite from '@/components/aktionen/AktionsSeite';
import { aktionBySlug, istAktiv } from '@/lib/aktionen';
import { KURZE_ADRESSE } from '@/lib/aktionen/nav';

/**
 * Aktionsseiten /aktionen/<slug> (11.10.2026) — Daten aus data/aktionen/<slug>.yaml.
 *
 * Sichtbar nur im Saisonfenster; außerhalb 404 (und nicht in der Sitemap). Mit
 * `?vorschau=1` ist die Seite jederzeit zu sehen, dann mit noindex und Hinweisleiste —
 * zum Gegenlesen vor dem Start. Stündlich neu gerendert, damit das Fenster ohne Deploy
 * greift (wie die Startseite).
 *
 * /aktionen/geschenke hat die kurze Adresse /geschenke (eigene Route); hier wird dauerhaft
 * dorthin weitergeleitet, damit es nur eine URL gibt.
 */
export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const aktion = aktionBySlug(slug);
  if (!aktion) return {};
  const sp = await searchParams;
  const vorschau = sp.vorschau === '1';
  return {
    title: aktion.seoTitle,
    description: aktion.seoDescription,
    alternates: { canonical: `https://steakakademie.de${KURZE_ADRESSE[slug] ?? `/aktionen/${slug}`}` },
    robots: vorschau || !istAktiv(aktion) ? { index: false, follow: false } : undefined,
  };
}

export default async function AktionPage({ params, searchParams }: Props) {
  const { slug } = await params;
  if (KURZE_ADRESSE[slug]) permanentRedirect(KURZE_ADRESSE[slug]);
  const aktion = aktionBySlug(slug);
  if (!aktion) notFound();
  const sp = await searchParams;
  const vorschau = sp.vorschau === '1';
  if (!vorschau && !istAktiv(aktion)) notFound();
  return <AktionsSeite aktion={aktion} vorschau={vorschau && !istAktiv(aktion)} />;
}
