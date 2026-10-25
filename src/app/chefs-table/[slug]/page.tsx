import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PartnerPortraet from '@/components/chefs-table/PartnerPortraet';
import { OEFFENTLICH, partnerBySlug, sichtbarePartner } from '@/lib/chefs-table';
import { PARTNER_ARTEN, istFreigegeben } from '@/lib/chefs-table/typen';
import { ORGANIZATION_ID } from '@/lib/schema';

/**
 * Porträtseite /chefs-table/<slug> (25.10.2026) — Daten aus data/chefs-table/<slug>.yaml.
 *
 * Versteckt, bis der erste Partner zugesagt hat (src/lib/chefs-table/index.ts,
 * OEFFENTLICH): noindex, nicht in der Sitemap, nur per Link. Platzhalter sind nur in
 * diesem Zustand sichtbar; sobald OEFFENTLICH gilt, rendern nur freigegebene Porträte.
 */

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return sichtbarePartner().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = partnerBySlug(slug);
  if (!p) return {};
  const titel = `${p.name} — Küchenpartner der Steakakademie`;
  const beschreibung = `${p.name} (${PARTNER_ARTEN[p.art]}, ${p.ort}): Feuer-Geschichte, Signature-Gericht und Rezepte am Chefs’ Table der Steakakademie.`;
  return {
    title: titel,
    description: beschreibung,
    alternates: { canonical: `https://steakakademie.de/chefs-table/${p.slug}` },
    robots: OEFFENTLICH && istFreigegeben(p) ? undefined : { index: false, follow: false },
    openGraph: { title: titel, description: beschreibung, url: `https://steakakademie.de/chefs-table/${p.slug}`, type: 'profile' },
  };
}

export default async function ChefsTablePartnerPage({ params }: Props) {
  const { slug } = await params;
  const p = partnerBySlug(slug);
  if (!p) notFound();

  const weitere = sichtbarePartner().filter((w) => w.slug !== p.slug);

  // Strukturierte Daten erst bei freigegebenen Porträten — Platzhalter sind keine Entität.
  const jsonLd = istFreigegeben(p)
    ? {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': p.art === 'koch' ? 'Person' : p.art === 'restaurant' ? 'Restaurant' : 'LocalBusiness',
            '@id': `https://steakakademie.de/chefs-table/${p.slug}#${p.art === 'koch' ? 'person' : 'business'}`,
            name: p.fakten.name,
            url: p.fakten.website,
            telephone: p.fakten.telefon,
            address: { '@type': 'PostalAddress', streetAddress: p.fakten.adresse, addressLocality: p.ort, addressCountry: p.land },
            sameAs: [p.fakten.website, p.fakten.instagram].filter(Boolean),
            ...(p.art !== 'koch' && { employee: { '@type': 'Person', name: p.koch.name, jobTitle: p.koch.rolle } }),
            memberOf: { '@id': ORGANIZATION_ID },
            ...(p.bilder.kueche && { image: `https://steakakademie.de${p.bilder.kueche}` }),
          },
          ...(p.faq.length > 0
            ? [{
                '@type': 'FAQPage',
                mainEntity: p.faq.map((f) => ({
                  '@type': 'Question',
                  name: f.frage,
                  acceptedAnswer: { '@type': 'Answer', text: f.antwort },
                })),
              }]
            : []),
        ],
      }
    : null;

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <PartnerPortraet partner={p} weitere={weitere} />
    </>
  );
}
