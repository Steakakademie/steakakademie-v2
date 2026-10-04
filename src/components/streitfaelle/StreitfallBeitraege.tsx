'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageSquareQuote } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  slug: string;
}

/**
 * "Stimmen aus der Praxis" — Stufe 2 der Nutzerbeteiligung.
 *
 * Zeigt die freigegebenen Erfahrungsberichte zu einem Streitfall und darunter
 * ein Formular fuer angemeldete Nutzer: maximal 600 Zeichen, EIN Beitrag je
 * Nutzer und Streitfall. Nichts erscheint automatisch — jeder Beitrag landet
 * in der Moderations-Warteschlange (/admin/beitraege) und wird erst nach
 * manueller Freigabe sichtbar. Die Warteschlange ist der Filter; es gibt
 * bewusst keine Kommentare, keine Antworten, keine Votes und keine
 * Benachrichtigungen (Konzept, Abschnitt 7).
 *
 * WICHTIG: Diese Komponente wird auf der Streitfall-Seite nur eingebunden,
 * wenn STREITFALL_BEITRAEGE_ENABLED === '1'. Livegang erst nach anwaltlicher
 * DSA-Pruefung + Nutzungsbedingungen-Update — Flag setzt Uwe.
 *
 * Konzept: docs/konzept-nutzerbeteiligung.md
 */
type Beitrag = { anzeigename: string; beitrag: string; created_at: string };

const MAX_ZEICHEN = 600;

export default function StreitfallBeitraege({ slug }: Props) {
  const [beitraege, setBeitraege] = useState<Beitrag[]>([]);
  const [angemeldet, setAngemeldet] = useState<boolean | null>(null);
  const [schonEingereicht, setSchonEingereicht] = useState(false);
  const [anzeigename, setAnzeigename] = useState('');
  const [text, setText] = useState('');
  const [laeuft, setLaeuft] = useState(false);
  const [hinweis, setHinweis] = useState<string | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let abgebrochen = false;

    (async () => {
      const [{ data: freigegebene }, { data: sitzung }] = await Promise.all([
        // RLS: sichtbar sind freigegebene Beitraege (fuer alle) plus der
        // eigene — fuer die Anzeige filtern wir explizit auf 'freigegeben'.
        supabase
          .from('streitfall_beitraege')
          .select('anzeigename, beitrag, created_at')
          .eq('slug', slug)
          .eq('status', 'freigegeben')
          .order('created_at', { ascending: false }),
        supabase.auth.getUser(),
      ]);
      if (abgebrochen) return;

      setBeitraege((freigegebene ?? []) as Beitrag[]);

      const nutzer = sitzung?.user ?? null;
      setAngemeldet(Boolean(nutzer));
      if (!nutzer) return;

      // Hat der Nutzer hier schon etwas eingereicht? (RLS: eigener Beitrag
      // ist immer lesbar, auch solange er in der Warteschlange steht.)
      const { data: eigener } = await supabase
        .from('streitfall_beitraege')
        .select('status')
        .eq('slug', slug)
        .eq('user_id', nutzer.id)
        .maybeSingle();
      if (!abgebrochen && eigener) setSchonEingereicht(true);
    })();

    return () => {
      abgebrochen = true;
    };
  }, [slug]);

  async function einreichen(e: React.FormEvent) {
    e.preventDefault();
    if (laeuft) return;
    setLaeuft(true);
    setFehler(null);

    try {
      const res = await fetch('/api/streitfall-beitrag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, anzeigename, beitrag: text }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFehler(json.error ?? 'Speichern fehlgeschlagen. Bitte später erneut versuchen.');
      } else {
        setSchonEingereicht(true);
        setHinweis(json.message ?? 'Danke für deinen Beitrag.');
        setText('');
      }
    } catch {
      setFehler('Speichern fehlgeschlagen. Bitte später erneut versuchen.');
    }
    setLaeuft(false);
  }

  return (
    <section
      className="mt-8 p-6"
      style={{ border: '1px solid rgba(200,136,42,0.2)', background: 'rgba(255,255,255,0.02)' }}
      aria-labelledby={`beitraege-${slug}`}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <MessageSquareQuote size={17} className="text-brand-gold" />
        <h2
          id={`beitraege-${slug}`}
          className="font-sans text-[11px] font-bold tracking-[0.14em] uppercase text-brand-gold"
        >
          Stimmen aus der Praxis
        </h2>
      </div>

      {beitraege.length > 0 ? (
        <ul className="space-y-4">
          {beitraege.map((b, i) => (
            <li
              key={`${b.anzeigename}-${b.created_at}-${i}`}
              className="px-4 py-3"
              style={{ border: '1px solid rgba(200,136,42,0.18)', background: 'rgba(0,0,0,0.25)' }}
            >
              <p className="font-body text-[0.95rem] leading-relaxed text-text-light/85">
                {b.beitrag}
              </p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="font-sans text-xs font-bold text-brand-gold">{b.anzeigename}</p>
                {/* Melde- und Abhilfeverfahren (Art. 16 DSA): niedrigschwellig direkt
                    am veroeffentlichten Inhalt, nicht nur in den Nutzungsbedingungen. */}
                <a
                  href={`mailto:pitmaster@steakakademie.de?subject=${encodeURIComponent(
                    'Inhaltsmeldung: Beitrag zu ' + slug,
                  )}&body=${encodeURIComponent(
                    'Gemeldeter Beitrag von "' + b.anzeigename + '" (' + slug + ')\n\nGrund der Meldung:\n',
                  )}`}
                  className="font-sans text-[11px] text-text-light/55 underline underline-offset-2 hover:text-text-light/70 shrink-0"
                  aria-label={`Beitrag von ${b.anzeigename} melden`}
                >
                  Inhalt melden
                </a>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="font-sans text-xs text-text-light/55">
          Noch keine Stimmen — deine könnte die erste sein.
        </p>
      )}

      {/* Formular: nur fuer Angemeldete, ein Beitrag je Nutzer und Streitfall. */}
      {angemeldet && !schonEingereicht && (
        <form onSubmit={einreichen} className="mt-6 space-y-3">
          <p className="font-sans text-xs text-text-light/55">
            Wie machst du es? Kurz und konkret — veröffentlicht wird nur eine Auswahl,
            mit Vorname und Ort.
          </p>
          <input
            type="text"
            value={anzeigename}
            onChange={(e) => setAnzeigename(e.target.value)}
            required
            minLength={2}
            maxLength={40}
            placeholder="Anzeigename, z. B. Thomas aus Kassel"
            className="w-full px-4 py-3 font-body text-[0.95rem] text-text-light bg-transparent"
            style={{ border: '1px solid rgba(200,136,42,0.18)', background: 'rgba(0,0,0,0.25)' }}
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_ZEICHEN))}
            required
            minLength={20}
            maxLength={MAX_ZEICHEN}
            rows={4}
            placeholder="Dein Erfahrungsbericht (20 bis 600 Zeichen)"
            className="w-full px-4 py-3 font-body text-[0.95rem] text-text-light bg-transparent resize-y"
            style={{ border: '1px solid rgba(200,136,42,0.18)', background: 'rgba(0,0,0,0.25)' }}
          />
          <div className="flex items-center justify-between gap-4">
            <span className="font-sans text-xs text-text-light/55 tabular-nums">
              {text.length}/{MAX_ZEICHEN} Zeichen
            </span>
            <button
              type="submit"
              disabled={laeuft || text.trim().length < 20 || anzeigename.trim().length < 2}
              className="font-sans text-sm font-bold text-brand-gold px-4 py-2 transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ border: '1px solid rgba(200,136,42,0.6)' }}
            >
              {laeuft ? 'Wird gesendet …' : 'Beitrag einsenden'}
            </button>
          </div>
        </form>
      )}

      {angemeldet && schonEingereicht && (
        <p className="mt-4 font-sans text-xs text-text-light/55">
          {hinweis ??
            'Du hast zu diesem Streitfall schon einen Beitrag geschrieben. Beiträge werden gelegentlich gesichtet, veröffentlicht wird nur eine Auswahl.'}
        </p>
      )}

      {angemeldet === false && (
        <p className="mt-4 font-sans text-xs text-text-light/55">
          <Link href="/auth/login" className="text-brand-gold hover:underline">
            Anmelden
          </Link>
          {' '}zum Mitschreiben — ein Beitrag je Streitfall, veröffentlicht wird nur eine Auswahl.
        </p>
      )}

      {fehler && (
        <p className="mt-2 font-sans text-xs text-brand-fire" role="alert">
          {fehler}
        </p>
      )}
    </section>
  );
}
