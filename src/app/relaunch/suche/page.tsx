import type { Metadata } from 'next';
import Link from 'next/link';
import { search, type Hit } from '@/lib/suche';
import { relaunchHref } from '@/lib/relaunch/href';
import MarcoStarter from '@/components/relaunch/MarcoStarter';

/**
 * Suche im Relaunch-Design — im Handoff nicht entworfen, am 05.09.2026 von
 * Uwe beauftragt („Was in der neuen Seite fehlt sind die Shop-Produkte und
 * eine Suche.").
 *
 * DIESELBE QUELLE WIE /suche: `search()` aus src/lib/suche.ts. Zwei Suchen mit
 * je eigener Sammel-Logik wären zwei Wahrheiten darüber, was auffindbar ist —
 * und der Redaktionsvorbehalt (Entwürfe bleiben unsichtbar) ist genau die
 * Sorte Regel, die man nicht zweimal pflegen will. Hier ist nur die Ansicht neu.
 *
 * MARCO ALS AUFFANGNETZ, NICHT ALS ERSATZ: Uwes Einwand war richtig — Marco
 * kann suchen, aber niemand liest ein Chat-Widget als Suchfeld. Die Rollen
 * sind jetzt getrennt: die Suche beantwortet „wo ist X" (navigierend, exakt),
 * Marco beantwortet „was nehme ich für Y" (beratend, unscharf). Marco steht
 * deshalb UNTER den Treffern — und bei null Treffern an deren Stelle.
 *
 * noindex kommt aus dem /relaunch-Layout; zusätzlich hat die Suchergebnisseite
 * auf der Alt-Site schon `index: false` (dünne, kombinatorische URLs gehören
 * nicht in den Index).
 */
export const metadata: Metadata = {
  title: 'Suche',
  robots: { index: false, follow: true },
};

/** Reihenfolge der Typ-Filter — nach erwarteter Nachfrage, nicht alphabetisch. */
const TYP_REIHENFOLGE = [
  'Cut', 'Rezept', 'Grilltechnik', 'Streitfall', 'Glossar',
  'Test & Vergleich', 'Artikel', 'USA-Expedition', 'Persönlichkeit',
];

function sortiereTypen(typen: string[]): string[] {
  return [...typen].sort((a, b) => {
    const ia = TYP_REIHENFOLGE.indexOf(a);
    const ib = TYP_REIHENFOLGE.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}

/**
 * Ein Treffer. Zeigt das Ziel im Relaunch (Streitfall, Rezept, Werkzeug,
 * Diplome), bleibt der Link intern; für alles andere gibt es noch keine
 * Vorlage — dann führt er ins alte Design und sagt das auch. Lieber ein
 * ehrlicher Hinweis als ein überraschender Stilbruch.
 */
function Treffer({ h }: { h: Hit }) {
  const ziel = relaunchHref(h.url);
  const intern = ziel !== h.url;
  return (
    <li>
      <Link href={ziel} className="sk-tref">
        <span className="sk-tref__kind">{h.kind}</span>
        <span className="sk-h sk-h--row sk-tref__titel">{h.title}</span>
        {h.snippet && <span className="sk-tref__text">{h.snippet}</span>}
        <span className={intern ? 'sk-tref__go' : 'sk-tref__go sk-tref__go--alt'}>
          {intern ? 'Ansehen →' : 'Altes Design ↗'}
        </span>
      </Link>
    </li>
  );
}

type Props = { searchParams: Promise<{ q?: string; typ?: string }> };

// Next 14: searchParams ist ein einfaches Objekt (erst Next 15 macht es zum Promise)
export default async function RelaunchSuche(props: Props) {
  const searchParams = await props.searchParams;
  const query = (searchParams.q ?? '').trim().slice(0, 80);
  const alle = query ? search(query) : [];

  const zaehler = alle.reduce<Record<string, number>>((acc, h) => {
    acc[h.kind] = (acc[h.kind] ?? 0) + 1;
    return acc;
  }, {});
  const typen = sortiereTypen(Object.keys(zaehler));

  // Ein Filter, den es in dieser Trefferliste nicht gibt, wird ignoriert statt
  // eine leere Seite zu erzeugen — sonst führt ein alter Lesezeichen-Link mit
  // ?typ=Rezept bei einer anderen Suche ins Nichts.
  const typ = searchParams.typ && zaehler[searchParams.typ] ? searchParams.typ : undefined;
  const treffer = typ ? alle.filter((h) => h.kind === typ) : alle;

  const marcoFrage = query
    ? `Ich suche etwas zu „${query}“ auf der Steakakademie. Was passt dazu?`
    : 'Ich suche etwas Bestimmtes auf der Steakakademie — hilfst du mir?';

  return (
    <>
      <div className="sk-d">
        <div className="sk-kat-head sk-kat-head--suche">
          <nav className="sk-crumbs" aria-label="Brotkrümel">
            <Link href="/relaunch">Start</Link>
            <span aria-hidden="true">/</span>
            <strong aria-current="page">Suche</strong>
          </nav>
          <h1 className="sk-h sk-h--page">
            {query ? <>Suche nach „{query}&ldquo;</> : 'Suche'}
          </h1>

          <form action="/relaunch/suche" method="get" role="search" className="sk-suchgross">
            <label htmlFor="sk-suchgross-feld" className="sk-sr">Website durchsuchen</label>
            <input
              id="sk-suchgross-feld"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Cuts, Rezepte, Techniken, Begriffe …"
              maxLength={80}
              className="sk-input sk-suchgross__feld"
              autoFocus={!query}
            />
            <button type="submit" className="sk-btn sk-btn--primary sk-suchgross__knopf">Suchen</button>
          </form>

          {query && (
            <p className="sk-lead sk-suchgross__zahl">
              {alle.length === 0
                ? 'Keine Treffer.'
                : `${alle.length} ${alle.length === 1 ? 'Treffer' : 'Treffer'} in ${typen.length} ${typen.length === 1 ? 'Bereich' : 'Bereichen'}.`}
            </p>
          )}
        </div>
      </div>

      {typen.length > 1 && (
        <div className="sk-filterbar">
          <div className="sk-filterbar__inner">
            <span className="sk-filterbar__label">Bereich</span>
            <div className="sk-filterbar__chips">
              <Link
                href={`/relaunch/suche?q=${encodeURIComponent(query)}`}
                className={`sk-chip${typ ? '' : ' sk-chip--on'}`}
                aria-current={typ ? undefined : 'true'}
              >
                Alle ({alle.length})
              </Link>
              {typen.map((k) => (
                <Link
                  key={k}
                  href={`/relaunch/suche?q=${encodeURIComponent(query)}&typ=${encodeURIComponent(k)}`}
                  className={`sk-chip${typ === k ? ' sk-chip--on' : ''}`}
                  aria-current={typ === k ? 'true' : undefined}
                >
                  {k} ({zaehler[k]})
                </Link>
              ))}
            </div>
            <span className="sk-filterbar__gap" />
            <span className="sk-count">{treffer.length} angezeigt</span>
          </div>
        </div>
      )}

      <div className="sk-kat-body">
        {treffer.length > 0 && (
          <ul className="sk-list sk-treffer">
            {treffer.map((h) => <Treffer key={h.url} h={h} />)}
          </ul>
        )}

        {query && alle.length === 0 && (
          <div className="sk-empty">
            <p className="sk-empty__title">Nichts gefunden</p>
            <p className="sk-empty__text">
              Die Suche vergleicht Titel und Anrisstexte — sie versteht keine ganzen Fragen.
              Für „welches Fleisch für Gäste, die kein Blut sehen wollen&ldquo; ist Marco zuständig.
            </p>
            <MarcoStarter frage={marcoFrage}>Marco fragen</MarcoStarter>
            <p className="sk-empty__text" style={{ marginTop: 22, marginBottom: 0 }}>
              Oder stöbern: <Link href="/relaunch/cuts">Cuts</Link> ·{' '}
              <Link href="/relaunch/rezepte">Rezepte</Link> ·{' '}
              <Link href="/relaunch/techniken">Grilltechniken</Link> ·{' '}
              <Link href="/relaunch/streitfaelle">Wissen</Link>
            </p>
          </div>
        )}

        {!query && (
          <div className="sk-empty">
            <p className="sk-empty__title">Wonach suchst du?</p>
            <p className="sk-empty__text">
              Die Suche findet Cuts, Rezepte, Grilltechniken, Streitfälle und Glossarbegriffe
              über Titel und Anrisstext. Wer eine Frage stellen will statt einen Begriff zu
              suchen, ist bei Marco besser aufgehoben.
            </p>
            <MarcoStarter frage={marcoFrage}>Marco fragen</MarcoStarter>
          </div>
        )}

        {query && alle.length > 0 && (
          <aside className="sk-marcobox">
            <div>
              <p className="sk-h sk-h--24">Nicht dabei, was du suchst?</p>
              <p className="sk-text sk-marcobox__text">
                Die Suche vergleicht Begriffe. Marco kennt die Inhalte und antwortet auf
                ganze Fragen — inklusive „warum&ldquo; und „was stattdessen&ldquo;.
              </p>
            </div>
            <MarcoStarter frage={marcoFrage} className="sk-btn sk-btn--primary sk-marcobox__knopf">
              Marco fragen
            </MarcoStarter>
          </aside>
        )}
      </div>
    </>
  );
}
