import type { Metadata } from 'next';
import Link from 'next/link';
import { allDiplomLektions } from 'contentlayer/generated';
import Siegel, { STUFEN } from '@/components/relaunch/Siegel';
import { LektionMarker } from '@/components/relaunch/LektionFortschritt';

export const metadata: Metadata = {
  title: 'Grillmeister-Diplome — Vom Funken zum Pitmaster',
  description: 'Fünf Stufen, 35 Lektionen, je eine Prüfung pro Stufe. Stufe 1 ist frei zugänglich.',
};

/**
 * Diplome (Handoff, Ansicht 7): dunkler Kopf, danach hell. Stufe 1 offen mit
 * Lektionsliste, rechts „Der ganze Pfad" mit allen fünf Stufen und die
 * Karte „Fortschritt behalten".
 *
 * Lektionen kommen aus content/diplom-lektionen (5 × 7). Stufe 1 ist frei,
 * Stufen 2–5 sind das kostenpflichtige Diplom — die Lektionsseiten zeigen dort
 * nur den Anreißer (gleiche Regel wie live). Die Prüfung je Stufe läuft heute
 * auf der Roadmap; hier wird verlinkt, nichts nachgebaut.
 */
const relaunchUrl = (l: { stufe: number; lektionSlug: string }) => `/relaunch/diplome/lernen/stufe-${l.stufe}/${l.lektionSlug}`;

export default function DiplomeSeite() {
  const proStufe = (n: number) => allDiplomLektions.filter((l) => l.stufe === n).sort((a, b) => a.order - b.order);
  const stufe1 = proStufe(1);

  return (
    <>
      <section className="sk-d" style={{ padding: 'clamp(48px, 6vw, 88px) 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="sk-kicker sk-kicker--warm" style={{ marginBottom: 14 }}>Akademie · Grillmeister-Diplome</div>
          <h1 className="sk-h" style={{ fontWeight: 900, fontSize: 'clamp(44px, 6.5vw, 88px)', lineHeight: .92 }}>Vom Funken zum Pitmaster.</h1>
          <p className="sk-lead" style={{ marginTop: 20, maxWidth: '60ch' }}>
            Fünf Stufen, 35 Lektionen, je eine Prüfung pro Stufe. Klar strukturiert, auf den Punkt, ohne Füllstoff. Stufe 1 ist frei zugänglich — ein Account speichert deinen Fortschritt, mehr nicht.
          </p>
        </div>
      </section>

      <div className="sk-diplome">
        <div>
          <div className="sk-diplome__head">
            <Siegel nr={1} size={72} />
            <div>
              <div className="sk-kicker sk-kicker--13 sk-kicker--accent">Stufe 1 · Basis-Zertifikat · frei</div>
              <h2 className="sk-h" style={{ fontWeight: 800, fontSize: 40 }}>Der Funke</h2>
            </div>
          </div>
          <ol className="sk-lektionen">
            {stufe1.map((l, i) => (
              <li key={l.lektionSlug}>
                <Link href={relaunchUrl(l)} className="sk-lektionen__row">
                  <LektionMarker url={relaunchUrl(l)} aktuell={i === 0} />
                  <span className="sk-lektionen__title">{l.order} · {l.title}</span>
                  <span className="sk-lektionen__go">Lesen →</span>
                </Link>
              </li>
            ))}
            <li>
              <Link href="/diplome/roadmap" className="sk-lektionen__row sk-lektionen__row--pruefung">
                <span className="sk-marker sk-marker--locked" aria-hidden="true" />
                <span className="sk-h" style={{ fontWeight: 800, fontSize: 17, letterSpacing: '.04em' }}>Prüfung Stufe 1</span>
                <span className="sk-lektionen__go" style={{ color: '#ffb35c' }}>Zur Roadmap →</span>
              </Link>
            </li>
          </ol>
          <p className="sk-meta sk-meta--14" style={{ marginTop: 14 }}>Bestandene Prüfung = Grad Grillmeister Bronze und Freischaltung von Stufe 2.</p>
        </div>

        <div className="sk-pfad">
          <div className="sk-kicker sk-kicker--13 sk-kicker--muted" style={{ marginBottom: 4 }}>Der ganze Pfad</div>
          {STUFEN.filter((s) => s.nr > 1).map((s) => (
            <div key={s.nr} className="sk-pfad__row">
              <Siegel nr={s.nr} size={60} />
              <div>
                <div className="sk-kicker sk-kicker--13 sk-kicker--muted">Stufe {s.nr} · {s.unter} · Konto</div>
                <div className="sk-h sk-h--24">{s.name}</div>
                <div className="sk-meta sk-meta--14">{proStufe(s.nr).length} Lektionen + Prüfung</div>
              </div>
            </div>
          ))}
          <div className="sk-card sk-card--dark" style={{ marginTop: 12, gap: 8 }}>
            <div className="sk-h sk-h--24">Fortschritt behalten</div>
            <p className="sk-text">Kostenloser Zugang. Kein Abo, keine Kreditkarte — nur damit deine Lektionen nicht verloren gehen.</p>
            <Link href="/auth/login" className="sk-btn sk-btn--primary" style={{ alignSelf: 'flex-start', marginTop: 6 }}>Werde SteakAdemiker</Link>
          </div>
        </div>
      </div>
    </>
  );
}
