import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { diplomZugang, istBezahlstufe } from '@/lib/diplome/zugang';
import { allDiplomLektions } from 'contentlayer/generated';
import { useMDXComponent } from 'next-contentlayer2/hooks';
import { STUFEN } from '@/components/relaunch/Siegel';
import { skMdx, Weiche } from '@/components/relaunch/Prose';
import { LektionAbschluss, LektionBalken } from '@/components/relaunch/LektionFortschritt';

/**
 * Lektion (Handoff, Ansicht 4): Lesebreite 960px, dunkler Kopfstreifen mit
 * Stufenanzeige und Fortschrittsbalken (4px-Segmente), danach hell: Titel,
 * Kennzahlenkarten, Inhalt, Merksatz, Abschluss-Knopf, Weiche.
 *
 * BEZAHLPRODUKT-SCHUTZ — identisch zur Alt-Seite (26.08.2026,
 * docs/konzept-diplom-stufe-2-5.md): Stufe 1 ist der freie Trichter, Stufen 2–5
 * zeigen öffentlich nur den Anreißer; der Volltext öffnet sich mit Kauf-
 * Berechtigung (heute: Admin-Cookie). cookies() wird NUR für Bezahlstufen
 * gelesen, damit die sieben Stufe-1-Lektionen statisch bleiben und im Sitemap
 * stehen. Wer das hier lockert, öffnet das Produkt.
 *
 * Die Kontrollfrage des Prototyps hat in den Lektionen keine Datenbasis — an
 * ihrer Stelle steht der prüfungsrelevante Merksatz (Feld `merksatz`).
 */
type Params = { stufe: string; lektion: string };
type Props = { params: Promise<Params> };

const url = (l: { stufe: number; lektionSlug: string }) => `/relaunch/diplome/lernen/stufe-${l.stufe}/${l.lektionSlug}`;

function finde(params: Params) {
  const n = Number(params.stufe.replace('stufe-', ''));
  return allDiplomLektions.find((l) => l.stufe === n && l.lektionSlug === params.lektion);
}

export function generateStaticParams() {
  return allDiplomLektions.map((l) => ({ stufe: `stufe-${l.stufe}`, lektion: l.lektionSlug }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const l = finde(params);
  if (!l) return {};
  return { title: l.seoTitle ?? l.title, description: l.seoDescription ?? l.excerpt };
}

/**
 * Async-Huelle entscheidet den Zugang (Admin ODER aktive Diplom-Buchung —
 * src/lib/diplome/zugang.ts, Audit 06.09.2026 R3); der Kern bleibt synchron,
 * weil useMDXComponent ein Hook ist. diplomZugang() nur fuer Bezahlstufen,
 * damit Stufe 1 statisch bleibt.
 */
export default async function LektionSeite(props: Props) {
  const params = await props.params;
  const l = finde(params);
  if (!l) notFound();
  const gesperrt = istBezahlstufe(l.stufe) ? !(await diplomZugang()).zugang : false;
  return <LektionInhalt l={l} gesperrt={gesperrt} />;
}

function LektionInhalt({ l, gesperrt }: { l: NonNullable<ReturnType<typeof finde>>; gesperrt: boolean }) {
  const stufe = STUFEN[l.stufe - 1];
  const MDXContent = useMDXComponent(l.body.code);

  const geschwister = allDiplomLektions.filter((x) => x.stufe === l.stufe).sort((a, b) => a.order - b.order);
  const idx = geschwister.findIndex((x) => x.lektionSlug === l.lektionSlug);
  const naechste = geschwister[idx + 1];

  return (
    <>
      <div className="sk-d" style={{ borderBottom: '1px solid #332b25' }}>
        <div className="sk-lektion__kopf">
          <div className="sk-lektion__zeile">
            <Link href="/relaunch/diplome" className="sk-lektion__back">← Stufe {l.stufe} · {stufe.name}</Link>
            <span style={{ color: 'var(--sk-dark-faint)' }}>Lektion {l.order} von {geschwister.length}</span>
          </div>
          <LektionBalken urls={geschwister.map(url)} aktuell={url(l)} />
        </div>
      </div>

      <div className="sk-lektion">
        <h1 className="sk-h sk-lektion__h1">{l.title}</h1>
        <div className="sk-grid" style={{ ['--min' as string]: '280px', marginTop: 28 }}>
          <div className="sk-card" style={{ gap: 10 }}>
            <div className="sk-kicker sk-kicker--13 sk-kicker--accent">Worum es geht</div>
            <p style={{ fontSize: 17, lineHeight: 1.5 }}>{l.excerpt}</p>
          </div>
          <div className="sk-card" style={{ gap: 10 }}>
            <div className="sk-kicker sk-kicker--13 sk-kicker--accent">Stufe</div>
            <p style={{ fontSize: 17, lineHeight: 1.5 }}>Stufe {l.stufe} · {stufe.name} — {stufe.unter}{l.stufe === 1 ? ' · ohne Login' : ' · Konto erforderlich'}</p>
          </div>
        </div>

        {gesperrt ? (
          <div className="sk-dunkelblock" style={{ marginTop: 40 }}>
            <p className="sk-prose__p" style={{ color: '#d9cfc2' }}>{l.excerpt}</p>
            <div className="sk-kicker sk-kicker--13 sk-kicker--warm" style={{ marginTop: 20 }}>Teil der Grillmeister-Ausbildung</div>
            <p className="sk-h sk-h--24" style={{ marginTop: 8 }}>Diese Lektion gehört zu Stufe {l.stufe} des Grillmeister-Diploms.</p>
            <p className="sk-text sk-text--16" style={{ marginTop: 10 }}>
              Stufe 1 mit sieben vollständigen Lektionen ist frei zugänglich. Verkaufsstart 01.10.2026 — Gründungs-Preis 99 € für die ersten 100, danach 149 €.
            </p>
            <div className="sk-cta-row" style={{ marginTop: 20 }}>
              <Link href="/relaunch/diplome" className="sk-btn sk-btn--primary">Zur Ausbildung</Link>
              <Link href="/relaunch/diplome/lernen/stufe-1/grillarten" className="sk-btn sk-btn--ghost">Stufe 1 kostenlos lernen</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="sk-prose" style={{ marginTop: 40 }}>
              <MDXContent components={skMdx} />
            </div>
            <div className="sk-dunkelblock" style={{ marginTop: 40 }}>
              <div className="sk-kicker sk-kicker--13 sk-kicker--warm" style={{ marginBottom: 12 }}>Prüfungsrelevant · Merksatz</div>
              <div className="sk-h" style={{ fontWeight: 800, fontSize: 'clamp(24px, 3vw, 32px)' }}>{l.merksatz}</div>
            </div>
            <div style={{ marginTop: 32 }}>
              <LektionAbschluss url={url(l)} nr={l.order} />
            </div>
          </>
        )}

        {naechste ? (
          <Weiche kicker={`Weiter · Lektion ${naechste.order} von ${geschwister.length}`} titel={naechste.title} text={naechste.excerpt} href={url(naechste)} />
        ) : (
          <Weiche kicker="Stufe abgeschlossen · Prüfung" titel={`Prüfung Stufe ${l.stufe}`} text="Die Prüfung läuft auf der Roadmap — bestanden heißt Zertifikat als PDF und Freischaltung der nächsten Stufe." href="/diplome/roadmap" />
        )}
      </div>
    </>
  );
}
