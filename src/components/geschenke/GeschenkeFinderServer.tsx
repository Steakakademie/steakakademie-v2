import { getProductById } from '@/lib/products';
import { klickKlassen, produktLink } from '@/components/affiliate/produkt-anzeige';
import { aktionBySlug } from '@/lib/aktionen';
import type { Setup } from '@/lib/aktionen/typen';
import type { FinderSetup, ProduktZeile } from '@/lib/geschenke-finder';
import GeschenkeFinder from './GeschenkeFinder';

/**
 * Server-Hülle des Geschenke-Finders: liest die Setups der Aktionsseite „Geschenke"
 * (data/aktionen/geschenke.yaml, nur Setups mit `stufe`) und bereitet je Produkt Link und
 * Kennzeichnung über produktLink vor — die eine Quelle für „Anzeige" und rel. Der Client
 * (GeschenkeFinder) entscheidet darüber nichts mehr.
 */
export function finderSetups(setups: Setup[]): FinderSetup[] {
  return setups
    .filter((s): s is Setup & { stufe: NonNullable<Setup['stufe']> } => Boolean(s.stufe))
    .map((s) => ({
      titel: s.titel,
      fuer: s.fuer,
      stufe: s.stufe,
      produkte: s.produkte
        .map((p): ProduktZeile | null => {
          const product = getProductById(p.id);
          if (!product) return null;
          const link = produktLink(product);
          return {
            id: product.id,
            name: product.name,
            brand: product.brand,
            warum: p.warum,
            href: link.href,
            rel: link.rel,
            partner: link.partner,
            klickKlassen: klickKlassen(product, 'finder'),
          };
        })
        .filter((p): p is ProduktZeile => p !== null),
    }));
}

export default function GeschenkeFinderServer({ basisUrl = '/geschenke-finder' }: { basisUrl?: string }) {
  const aktion = aktionBySlug('geschenke');
  if (!aktion) return null;
  const setups = finderSetups(aktion.setups);
  if (setups.length === 0) return null;
  return <GeschenkeFinder setups={setups} basisUrl={basisUrl} />;
}
