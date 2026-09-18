import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { KATALOGE, KATALOG_REIHENFOLGE, istKatalogKey } from '@/lib/relaunch/katalog';
import Katalog from '@/components/relaunch/Katalog';

/**
 * Übersicht — „das wichtigste Muster der Website. Eine Ansicht, vier Kataloge.
 * Wenn hiervon vier separate Seiten gebaut werden, ist die Übergabe
 * missverstanden." (Handoff-README, Ansicht 2)
 *
 * Routen: /relaunch/cuts · /relaunch/streitfaelle · /relaunch/rezepte ·
 * /relaunch/techniken — ein Routen-Parameter, eine Datei.
 *
 * Reiter: role="tablist"/"tab" mit aria-selected (Nachholarbeit Punkt 5). Sie
 * sind echte Links, weil jeder Katalog eine eigene URL hat — der Zustand
 * `katalog` des Prototyps ist hier der Routen-Parameter.
 */
type Props = { params: Promise<{ katalog: string }> };

export function generateStaticParams() {
  return KATALOG_REIHENFOLGE.map((katalog) => ({ katalog }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  if (!istKatalogKey(params.katalog)) return {};
  const k = KATALOGE[params.katalog];
  return { title: k.titel, description: k.lead };
}

export default async function UebersichtSeite(props: Props) {
  const params = await props.params;
  if (!istKatalogKey(params.katalog)) notFound();
  const k = KATALOGE[params.katalog];

  return (
    <>
      <div className="sk-d">
        <div className="sk-kat-head">
          <nav className="sk-crumbs" aria-label="Brotkrümel">
            <Link href="/relaunch">Start</Link>
            <span aria-hidden="true">/</span>
            <strong aria-current="page">{k.label}</strong>
          </nav>
          <h1 className="sk-h sk-h--page">{k.titel}</h1>
          <p className="sk-lead" style={{ marginTop: 18 }}>{k.lead}</p>
          <div className="sk-tabs" role="tablist" aria-label="Kataloge">
            {KATALOG_REIHENFOLGE.map((key) => {
              const on = key === k.key;
              return (
                <Link
                  key={key}
                  href={`/relaunch/${key}`}
                  role="tab"
                  aria-selected={on}
                  className={`sk-tab${on ? ' sk-tab--on' : ''}`}
                >
                  {KATALOGE[key].tab}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      {/* key erzwingt frischen Filter-/Sortier-Zustand je Katalog; die Ansicht
          bleibt über localStorage erhalten — genau das Verhalten aus dem Handoff. */}
      <Katalog key={k.key} katalog={k} />
    </>
  );
}
