import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { allStreitfalls } from 'contentlayer/generated';
import { sichtbareArtikel } from '@/lib/redaktion';
import { anzahlDiplomLektionen } from '@/lib/plattform-puls';
import { formatDate } from '@/lib/utils';
import EmberCanvas from '@/components/relaunch/EmberCanvas';
import Siegel, { STUFEN } from '@/components/relaunch/Siegel';

export const metadata: Metadata = {
  title: 'Steakakademie — Relaunch-Vorschau',
  description: 'Die methodisch tiefste BBQ-Plattform auf Deutsch. Cuts, Techniken, Streitfälle, Rezepte und ein Diplom in fünf Stufen.',
};

/**
 * Startseite des Relaunches (Handoff, Ansicht 1). Aufbau von oben:
 * Hero (dunkel, Glut) → Streitfälle (hell) → Manifest + Im Feuer (dunkel) →
 * Cuts & Techniken (hell) → Kursprogramm (dunkel) → Werkzeuge + Über uns (hell).
 *
 * Hero-Einstieg: die abgenommene Variante „5 Rubriken" (Pillen). Die Alternative
 * mit drei Karten ist im Prototyp ein verworfener Schalter und wird nicht gebaut.
 *
 * Startseiten-Doktrin der Alt-Site (CLAUDE.md § 2 Regel 8: Value-Prop-Band →
 * HERO → Artikel → Mitglieder-CTA) gilt für `/`. Diese Seite liegt unter
 * /relaunch, das Hierarchie-Gate prüft nur src/app/page.tsx. Vor dem Umschalten
 * ist zu klären, ob die Doktrin auf das neue Layout übertragen wird — Uwe.
 *
 * Streitfälle kommen aus contentlayer (Redaktionsvorbehalt via sichtbareArtikel),
 * in der Reihenfolge des Prototyps, aufgefüllt mit dem Rest nach Datum.
 */
const STREITFALL_REIHENFOLGE = ['myoglobin', 'holz-waessern', 'poren-schliessen', 'natron-methode', 'wenden'];

function streitfaelleFuerStart() {
  const sichtbar = sichtbareArtikel(allStreitfalls);
  const nachSlug = new Map(sichtbar.map((s) => [s.slug, s]));
  const bevorzugt = STREITFALL_REIHENFOLGE.map((slug) => nachSlug.get(slug)).filter(Boolean) as typeof sichtbar;
  const rest = sichtbar
    .filter((s) => !STREITFALL_REIHENFOLGE.includes(s.slug))
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
  return [...bevorzugt, ...rest].slice(0, 5);
}

export default function RelaunchStartseite() {
  const [aufmacher, ...reihe] = streitfaelleFuerStart();

  return (
    <>
      {/* HERO — dunkel, rau; die Glut nur hier */}
      <section className="sk-hero">
        <EmberCanvas level="Ruhig" />
        <div className="sk-hero__veil" />
        <div className="sk-hero__inner">
          <div className="sk-hero__kicker">Die methodisch tiefste BBQ-Plattform auf Deutsch</div>
          <h1 className="sk-h sk-h--hero">Gutes Fleisch verdient keinen Zufall.</h1>
          <p className="sk-hero__lead">
            Du hast Hunger. Du hast ein Stück Fleisch, das einem Tier gehört hat. Was jetzt passiert, entscheidest du — nach Gefühl oder nach Wissen. Hier lernst du das Zweite. Methodisch, fachlich verantwortet, ohne Bullshit.
          </p>
          <nav className="sk-pills" aria-label="Rubriken">
            <Link href="/relaunch/cuts" className="sk-pill">Cuts &amp; Fleischkunde</Link>
            <Link href="/relaunch/techniken" className="sk-pill">Grilltechniken</Link>
            <Link href="/relaunch/streitfaelle" className="sk-pill">Wissen</Link>
            <Link href="/relaunch/rezepte" className="sk-pill">Rezepte</Link>
            <Link href="/vergleich" className="sk-pill">Ausrüstung</Link>
          </nav>
        </div>
      </section>

      {/* STREITFÄLLE — hell, lesen */}
      <section className="sk-sec sk-l">
        <div className="sk-wrap">
          <div className="sk-between" style={{ marginBottom: 32 }}>
            <div>
              <div className="sk-kicker sk-kicker--accent" style={{ marginBottom: 8 }}>Streitfälle am Grill</div>
              <h2 className="sk-h sk-h--l">Was jeder sagt.<br />Und was stimmt.</h2>
            </div>
            <Link href="/relaunch/streitfaelle" className="sk-more">Alle Streitfälle →</Link>
          </div>
          <div className="sk-grid" style={{ ['--min' as string]: '300px' }}>
            {aufmacher && (
              <Link href={`/relaunch${aufmacher.url}`} className="sk-card sk-card--media">
                <Image src={aufmacher.image} alt={aufmacher.imageAlt} width={800} height={500} sizes="(min-width: 1240px) 600px, 100vw" />
                <div className="sk-card__body">
                  <span className="sk-kicker sk-kicker--13 sk-kicker--muted">Wissen &amp; Wissenschaft</span>
                  <span className="sk-h sk-h--30">{aufmacher.title}</span>
                  <span className="sk-text sk-text--16">{aufmacher.excerpt}</span>
                  <span className="sk-meta sk-meta--14">{aufmacher.author} · {formatDate(aufmacher.publishedAt)}</span>
                </div>
              </Link>
            )}
            <div className="sk-sf-list">
              {reihe.map((s, i) => (
                <Link key={s.slug} href={`/relaunch${s.url}`} className="sk-sf-row">
                  <span className="sk-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="sk-sf-row__body">
                    <span className="sk-h sk-h--24">{s.title}</span>
                    <span className="sk-text">{s.excerpt}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MANIFEST + IM FEUER — dunkel */}
      <section className="sk-sec sk-d">
        <div className="sk-wrap sk-2col sk-2col--center">
          <div>
            <div className="sk-kicker sk-kicker--warm" style={{ marginBottom: 18 }}>Manifest</div>
            <blockquote className="sk-manifest">Feuer ist Geduld.<br />Rauch ist Zeit.<br />Das perfekte Steak ist keine Technik — es ist ein Standpunkt.</blockquote>
            <div className="sk-manifest__by">Marco, der Pitmaster</div>
          </div>
          <Link href="/methoden/oberhitze-grillen" className="sk-card sk-card--dark sk-imfeuer">
            <div className="sk-imfeuer__kicker"><span className="sk-dot sk-dot--12" />Im Feuer — diese Woche</div>
            <div className="sk-h sk-h--sub sk-imfeuer__title">Oberhitze-Grillen: Was 800 Grad wirklich können</div>
            <p className="sk-imfeuer__text">Steakhouse-Kruste in Sekunden — mit Strahlungshitze statt heißer Luft. Für welche Cuts es taugt und wo die Grenzen liegen.</p>
            <div className="sk-imfeuer__foot">
              <span><small>Dazu das Rezept:</small> Ribeye, Reverse Sear</span>
              <span style={{ color: '#ff8a3d' }}>→</span>
            </div>
          </Link>
        </div>
      </section>

      {/* CUTS & TECHNIKEN — hell */}
      <section className="sk-sec sk-l">
        <div className="sk-wrap sk-stack">
          <div>
            <div className="sk-between" style={{ marginBottom: 24 }}>
              <h2 className="sk-h sk-h--sec">Cuts &amp; Fleischkunde</h2>
              <Link href="/relaunch/cuts" className="sk-more">40 Cuts im Atlas →</Link>
            </div>
            <div className="sk-grid" style={{ ['--min' as string]: '260px' }}>
              <Link href="/cuts/ribeye" className="sk-card sk-card--tall">
                <span className="sk-h sk-h--mega">Ribeye</span>
                <span className="sk-text">Vom Longissimus dorsi bis zum Spinalis — was den beliebtesten Premium-Cut ausmacht und wie Marmorierung bewertet wird.</span>
              </Link>
              <Link href="/cuts/brisket" className="sk-card sk-card--tall">
                <span className="sk-h sk-h--mega">Brisket</span>
                <span className="sk-text">Der König des Texas BBQ. Wer versteht, was in 12–18 Stunden am Smoker passiert, schlägt jedes Restaurant.</span>
              </Link>
              <Link href="/cuts/pulled-pork" className="sk-card sk-card--tall">
                <span className="sk-h sk-h--mega">Pulled Pork</span>
                <span className="sk-text">Das demokratischste Gericht im BBQ: günstig, zugänglich, vergebend — wenn du die Grundlagen verstehst.</span>
              </Link>
            </div>
          </div>
          <div>
            <div className="sk-between" style={{ marginBottom: 24 }}>
              <h2 className="sk-h sk-h--sec">Grilltechniken</h2>
              <Link href="/relaunch/techniken" className="sk-more">Alle 10 Techniken →</Link>
            </div>
            <div className="sk-tiles">
              <Link href="/methoden/reverse-sear" className="sk-tile"><span className="sk-h sk-h--24">Reverse Sear</span><span className="sk-meta sk-meta--14">Warum umgekehrt besser ist</span></Link>
              <Link href="/methoden/smoken-low-and-slow" className="sk-tile"><span className="sk-h sk-h--24">Smoken — Low &amp; Slow</span><span className="sk-meta sk-meta--14">Geduld macht zart</span></Link>
              <Link href="/methoden/plancha-feuerplatte" className="sk-tile"><span className="sk-h sk-h--24">Plancha &amp; Feuerplatte</span><span className="sk-meta sk-meta--14">Grillen mit Kontakthitze</span></Link>
              <Link href="/methoden/rotisserie-drehspiess" className="sk-tile"><span className="sk-h sk-h--24">Rotisserie</span><span className="sk-meta sk-meta--14">Gleichmäßig garen am Drehspieß</span></Link>
              <Link href="/methoden/minion-methode" className="sk-tile"><span className="sk-h sk-h--24">Minion-Methode</span><span className="sk-meta sk-meta--14">Stundenlange Glut ohne Nachlegen</span></Link>
            </div>
          </div>
        </div>
      </section>

      {/* KURSPROGRAMM — dunkel */}
      <section className="sk-sec sk-sec--strong sk-d" style={{ borderTop: '1px solid #332b25' }}>
        <div className="sk-wrap">
          <div style={{ maxWidth: 720, marginBottom: 48 }}>
            <div className="sk-kicker sk-kicker--warm" style={{ marginBottom: 14 }}>Deine Reise zum Grillmeister</div>
            <h2 className="sk-h sk-h--xl">Fünf Stufen.<br />Ein Diplom.<br />Kein Zufall mehr.</h2>
            <p className="sk-lead" style={{ marginTop: 20, maxWidth: '56ch' }}>
              {anzahlDiplomLektionen()} Lektionen von der ersten Glut bis zum Meister. Stufe 1 liest du ohne Anmeldung — registrieren musst du dich erst, wenn du deinen Fortschritt behalten willst.
            </p>
          </div>
          <div className="sk-stufen">
            {STUFEN.map((s) => (
              <Link key={s.nr} href="/relaunch/diplome" className={`sk-stufe${s.frei ? ' sk-stufe--frei' : ''}`}>
                <Siegel nr={s.nr} />
                <span className="sk-stufe__nr">Stufe {s.nr}{s.frei ? ' · frei' : ''}</span>
                <span className="sk-h sk-h--card">{s.name}</span>
                <span className="sk-meta sk-meta--14">{s.unter}</span>
              </Link>
            ))}
          </div>
          <div className="sk-cta-row">
            <Link href="/relaunch/diplome" className="sk-btn sk-btn--primary sk-btn--big">Stufe 1 jetzt starten — ohne Login</Link>
            <span className="sk-meta sk-meta--14">Kein Abo. Keine Kreditkarte.</span>
          </div>
        </div>
      </section>

      {/* WERKZEUGE + ÜBER UNS — hell */}
      <section className="sk-sec sk-l">
        <div className="sk-wrap sk-2col">
          <div>
            <div className="sk-kicker sk-kicker--accent" style={{ marginBottom: 12 }}>Werkzeuge</div>
            <h2 className="sk-h sk-h--sec" style={{ marginBottom: 22 }}>Spiel mit Aromen, Cuts &amp; Rezepten</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link href="/relaunch/cuts" className="sk-card sk-card--row">
                <span><span className="sk-h sk-h--22">Cut-Atlas</span><span className="sk-meta sk-meta--14">Lage, Muskel, Marmorierung, Garpunkt — 40 Cuts</span></span>
                <span className="sk-entry__go">→</span>
              </Link>
              <Link href="/kerntemperatur-spickzettel" className="sk-card sk-card--row">
                <span><span className="sk-h sk-h--22">Kerntemperatur-Spickzettel</span><span className="sk-meta sk-meta--14">Rind, Schwein, Lamm, Geflügel, Fisch — druckfertig</span></span>
                <span className="sk-entry__go">→</span>
              </Link>
              <Link href="/relaunch/rezepte" className="sk-card sk-card--row">
                <span><span className="sk-h sk-h--22">Rezepte nach Methode</span><span className="sk-meta sk-meta--14">Acht Rezepte, acht Techniken — jedes lehrt eine</span></span>
                <span className="sk-entry__go">→</span>
              </Link>
              <Link href="/hoefe" className="sk-card sk-card--row">
                <span><span className="sk-h sk-h--22">Hofladen-Radar</span><span className="sk-meta sk-meta--14">Fleisch direkt vom Erzeuger — Umkreissuche nach Ort oder PLZ</span></span>
                <span className="sk-entry__go">→</span>
              </Link>
            </div>
          </div>
          <div className="sk-ueber">
            <span className="sk-kicker sk-kicker--warm">Wer hinter der Akademie steht</span>
            <span className="sk-h" style={{ fontWeight: 800, fontSize: 'clamp(28px, 3vw, 40px)' }}>Bevor ein Steak auf den Rost kommt, hat es zwei Jahre gelebt.</span>
            <span className="sk-text sk-text--16">Wir erzählen, wo das Fleisch herkommt — vom Züchter über die Reifung bis zum Handwerk am Feuer. 30 Jahre Lehrerfahrung stecken in der Methodik. Kein Marketing, eine Haltung.</span>
            <Link href="/relaunch/ueber-uns" className="sk-more" style={{ marginTop: "auto" }}>Die Geschichte lesen →</Link>
          </div>
        </div>
      </section>
    </>
  );
}
