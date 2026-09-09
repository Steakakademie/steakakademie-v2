'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, RotateCcw, X, HelpCircle } from 'lucide-react';
import { checkFragen, type CheckFrage } from '@/lib/diplome/lektions-fragen';
import { merkeBestandenenCheck } from '@/lib/diplome/check-speicher';

/**
 * LektionsCheck — Verstaendnis-Check unter jeder Lektion (Uwe, 09.09.2026).
 *
 * ABSICHTLICH ANDERS ALS DIE STUFENPRUEFUNG:
 *  - Rueckmeldung SOFORT je Frage, nicht erst am Ende. Der Check soll beim
 *    Lernen helfen; die Pruefung soll messen. Fuer das eine ist frueher Aufschluss
 *    richtig, fuer das andere waere er ein Fehler.
 *  - Bewertung im Browser. Es haengt nichts daran, also gibt es nichts zu
 *    erschleichen — anders als bei /api/diplome/pruefung, wo die Loesungen den
 *    Client nie erreichen duerfen.
 *  - KEIN RIEGEL. Auch wer alles falsch hat, kommt weiter. Ein Riegel
 *    produziert Abbrecher; wer ohne Verstaendnis weitergeht, laeuft spaeter in
 *    der Stufenpruefung auf und weiss dann, woran es lag.
 *
 * Bei falscher Antwort nennt der Hinweis den Abschnitt im Klartext statt per
 * Sprungmarke: Die Lektionen laufen ohne rehype-slug, ihre Ueberschriften haben
 * keine IDs. Der Text steht ohnehin direkt darueber auf derselben Seite.
 *
 * Bestanden = alle Fragen im ersten Anlauf richtig. Nur dann wird der Slug
 * gemerkt — das ist die Grundlage fuer das Glutbett (Abschnitt B). Wer
 * „Nochmal" drueckt, faengt sauber von vorn an und kann bestehen; das ist
 * gewollt, denn das Ziel ist Verstaendnis, nicht ein Ranking.
 */

type Props = {
  lektionSlug: string;
  /** Stufenfarbe aus stufen.ts — haelt den Check im Farbklang seiner Stufe. */
  color: string;
  naechsteUrl?: string | null;
  naechsterTitel?: string | null;
};

export default function LektionsCheck({ lektionSlug, color, naechsteUrl, naechsterTitel }: Props) {
  const fragen = useMemo(() => checkFragen(lektionSlug), [lektionSlug]);

  /** Gewaehlter Options-Index je Frage-ID; eine Frage wird nur einmal beantwortet. */
  const [gewaehlt, setGewaehlt] = useState<Record<string, number>>({});

  const beantwortet = fragen.filter((f) => gewaehlt[f.id] !== undefined).length;
  const fertig = fragen.length > 0 && beantwortet === fragen.length;
  const richtige = fragen.filter((f) => gewaehlt[f.id] === f.correct).length;
  const bestanden = fertig && richtige === fragen.length;

  // Schreiben gehoert in einen Effekt, nicht ins Rendern: React ruft die
  // Render-Funktion mehrfach und in StrictMode doppelt auf — ein localStorage-
  // Schreibvorgang dort liefe unkontrolliert oft und wuerde waehrend des
  // Renderns den Zustand setzen (Warnung + zusaetzlicher Durchlauf).
  useEffect(() => {
    if (bestanden) merkeBestandenenCheck(lektionSlug);
  }, [bestanden, lektionSlug]);

  // Lektionen ohne Fragensatz (Stufe 2-5, solange dort nichts hinterlegt ist)
  // zeigen gar nichts an — ein leerer Kasten waere schlechter als keiner.
  // Die Pruefung steht NACH den Hooks: Hooks duerfen nicht bedingt laufen.
  if (fragen.length === 0) return null;

  function waehle(frage: CheckFrage, index: number) {
    if (gewaehlt[frage.id] !== undefined) return; // eine Antwort je Frage
    setGewaehlt((vorher) => ({ ...vorher, [frage.id]: index }));
  }

  function nochmal() {
    setGewaehlt({});
  }

  const falsche = fragen.filter((f) => gewaehlt[f.id] !== undefined && gewaehlt[f.id] !== f.correct);

  return (
    <section
      className="mt-10 border"
      style={{ borderColor: `${color}40`, background: `${color}08` }}
      aria-labelledby={`check-${lektionSlug}`}
    >
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center gap-2 mb-1.5">
          <HelpCircle size={15} style={{ color }} />
          <h2
            id={`check-${lektionSlug}`}
            className="font-sans text-[11px] font-bold tracking-[0.14em] uppercase"
            style={{ color }}
          >
            Sitzt das Wissen?
          </h2>
        </div>
        <p className="font-body text-sm text-text-secondary leading-relaxed">
          {fragen.length} kurze Fragen zu dieser Lektion. Kein Nachweis, keine Wertung —
          sie zeigen dir nur, ob du weiterlesen kannst oder besser nochmal nach oben schaust.
        </p>
      </div>

      <ol className="px-6 pb-2">
        {fragen.map((frage, nr) => {
          const wahl = gewaehlt[frage.id];
          const offen = wahl === undefined;
          const richtig = wahl === frage.correct;

          return (
            <li key={frage.id} className="py-5 border-t border-border-subtle first:border-t-0">
              <p className="font-serif text-base sm:text-lg font-bold text-text-primary leading-snug mb-3">
                <span className="mr-2 font-sans text-xs align-middle" style={{ color }}>
                  {nr + 1}
                </span>
                {frage.q}
              </p>

              <div className="space-y-2">
                {frage.options.map((option, i) => {
                  const dieseGewaehlt = wahl === i;
                  const dieseRichtig = i === frage.correct;
                  // Nach der Antwort wird die richtige Loesung immer markiert —
                  // sonst weiss der Lernende bei einem Fehler nicht, was gilt.
                  const zeigeRichtig = !offen && dieseRichtig;
                  const zeigeFalsch = !offen && dieseGewaehlt && !dieseRichtig;

                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={!offen}
                      onClick={() => waehle(frage, i)}
                      aria-pressed={dieseGewaehlt}
                      className={`w-full flex items-start gap-2.5 text-left px-4 py-2.5 border font-body text-[0.9375rem] leading-snug transition-colors ${
                        offen
                          ? 'border-border-subtle hover:border-brand-gold/50 hover:bg-brand-gold/5 cursor-pointer'
                          : 'cursor-default'
                      }`}
                      style={
                        zeigeRichtig
                          ? { borderColor: '#2E7D32', background: 'rgba(46,125,50,0.10)' }
                          : zeigeFalsch
                            ? { borderColor: '#B23A28', background: 'rgba(178,58,40,0.08)' }
                            : undefined
                      }
                    >
                      <span className="shrink-0 mt-0.5 w-4">
                        {zeigeRichtig && <Check size={15} style={{ color: '#2E7D32' }} />}
                        {zeigeFalsch && <X size={15} style={{ color: '#B23A28' }} />}
                      </span>
                      <span className={zeigeFalsch ? 'text-text-secondary' : 'text-text-primary'}>
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>

              {!offen && (
                <div className="mt-3 pl-1">
                  <p className="font-body text-sm text-text-secondary leading-relaxed">
                    {frage.explain}
                  </p>
                  {!richtig && frage.hinweis && (
                    <p className="mt-1.5 font-sans text-xs text-text-muted">
                      Nochmal nachlesen: {frage.hinweis}
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {fertig && (
        <div className="px-6 py-5 border-t" style={{ borderColor: `${color}30` }}>
          {bestanden ? (
            <>
              <p className="font-serif text-lg font-bold text-text-primary mb-1">
                Lektion bestanden — alle {fragen.length} richtig.
              </p>
              <p className="font-body text-sm text-text-secondary mb-4">
                Das Wissen sitzt. Weiter zur nächsten Lektion.
              </p>
            </>
          ) : (
            <>
              <p className="font-serif text-lg font-bold text-text-primary mb-1">
                {richtige} von {fragen.length} richtig — lies die Lektion nochmal.
              </p>
              <p className="font-body text-sm text-text-secondary mb-4">
                {falsche.length === 1
                  ? 'Eine Frage sitzt noch nicht. '
                  : `${falsche.length} Fragen sitzen noch nicht. `}
                Der Hinweis unter jeder Frage sagt dir, wo es steht. Weitergehen kannst du
                trotzdem — die Stufenprüfung fragt dasselbe später noch einmal.
              </p>
            </>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={nochmal}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-sans font-bold uppercase tracking-widest border transition-colors hover:opacity-85"
              style={{ borderColor: `${color}60`, color }}
            >
              <RotateCcw size={13} /> Nochmal
            </button>

            {/* Der Titel der naechsten Lektion steht bewusst NICHT in
                Grossbuchstaben: „WEITER: RUBS, MARINADEN UND DAS TIMING BEIM
                WUERZEN" schreit und sprengt die Zeile. Uppercase bleibt dem
                kurzen Signalwort, der Titel laeuft normal mit und wird auf
                schmalen Schirmen ausgeblendet.
                Der Kommentar steht VOR der Bedingung: hinter `{x && (` waere
                Ausdruckskontext, dort beginnt `{` ein Objektliteral und der
                Build bricht mit „Expected jsx identifier". */}
            {naechsteUrl && (
              <Link
                href={naechsteUrl}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-sans font-bold transition-opacity hover:opacity-90 max-w-full"
                style={
                  bestanden
                    ? { background: color, color: '#120C07' }
                    : { border: '1px solid var(--border-subtle, rgba(0,0,0,0.12))', color: 'inherit' }
                }
              >
                <span className="uppercase tracking-widest shrink-0">Weiter</span>
                {naechsterTitel && (
                  <span className="hidden sm:inline font-normal opacity-75 truncate">
                    · {naechsterTitel}
                  </span>
                )}
                <ArrowRight size={13} className="shrink-0" />
              </Link>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
