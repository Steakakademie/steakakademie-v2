'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Check } from 'lucide-react';

export interface UmfrageOption {
  key: string;
  label: string;
}

interface Props {
  slug: string;
  frage: string;
  optionen: UmfrageOption[];
}

/**
 * Umfrage unter einem Streitfall — Stufe 1 der Nutzerbeteiligung.
 *
 * Bewusst ohne Freitext: Was es nicht gibt, muss niemand moderieren. Eine Stimme
 * je Nutzer und Streitfall, abgesichert ueber einen UNIQUE-Index in der Datenbank
 * statt ueber Rate-Limits oder Captchas.
 *
 * Das Ergebnis ist auch ohne Anmeldung sichtbar — es ist Inhalt und soll von
 * Suchmaschinen gelesen werden. Abstimmen erfordert Anmeldung; das verhindert
 * Mehrfachstimmen und ist zugleich der Anlass zur Registrierung.
 *
 * Konzept: docs/konzept-nutzerbeteiligung.md
 */
type Summe = { option_key: string; stimmen: number };

export default function StreitfallUmfrage({ slug, frage, optionen }: Props) {
  const [ergebnis, setErgebnis] = useState<Record<string, number> | null>(null);
  const [eigeneWahl, setEigeneWahl] = useState<string | null>(null);
  const [angemeldet, setAngemeldet] = useState<boolean | null>(null);
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  useEffect(() => {
    let abgebrochen = false;

    (async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const [{ data: summen }, { data: sitzung }] = await Promise.all([
        // RPC statt View: streitfall_votes ist RLS-geschuetzt (nur eigene Stimme);
        // die SECURITY-DEFINER-Funktion liefert ausschliesslich Summen.
        supabase.rpc('streitfall_ergebnis_summen', { p_slug: slug }),
        supabase.auth.getUser(),
      ]);
      if (abgebrochen) return;

      setErgebnis(
        Object.fromEntries(((summen ?? []) as Summe[]).map((z) => [z.option_key, z.stimmen])),
      );

      const nutzer = sitzung?.user ?? null;
      setAngemeldet(Boolean(nutzer));
      if (!nutzer) return;

      const { data: eigene } = await supabase
        .from('streitfall_votes')
        .select('option_key')
        .eq('slug', slug)
        .maybeSingle();
      if (!abgebrochen) setEigeneWahl(eigene?.option_key ?? null);
    })();

    return () => {
      abgebrochen = true;
    };
  }, [slug]);

  async function abstimmen(optionKey: string) {
    if (laeuft || eigeneWahl === optionKey) return;
    setLaeuft(true);
    setFehler(null);

    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { data: sitzung } = await supabase.auth.getUser();
    const nutzer = sitzung?.user;
    if (!nutzer) {
      setAngemeldet(false);
      setLaeuft(false);
      return;
    }

    const vorher = eigeneWahl;
    // Optimistisch anzeigen — bei Fehler wird zurueckgesetzt.
    setEigeneWahl(optionKey);
    setErgebnis((alt) => {
      const neu = { ...(alt ?? {}) };
      if (vorher) neu[vorher] = Math.max(0, (neu[vorher] ?? 1) - 1);
      neu[optionKey] = (neu[optionKey] ?? 0) + 1;
      return neu;
    });

    const { error } = await supabase
      .from('streitfall_votes')
      .upsert(
        { slug, option_key: optionKey, user_id: nutzer.id },
        { onConflict: 'slug,user_id' },
      );

    if (error) {
      setEigeneWahl(vorher);
      setFehler('Die Stimme konnte nicht gespeichert werden. Bitte später erneut versuchen.');
    }
    setLaeuft(false);
  }

  const gesamt = Object.values(ergebnis ?? {}).reduce((s, n) => s + n, 0);
  const zeigeErgebnis = eigeneWahl !== null || angemeldet === false;

  return (
    <section
      className="mt-8 p-6"
      style={{ border: '1px solid rgba(200,136,42,0.2)', background: 'rgba(255,255,255,0.02)' }}
      aria-labelledby={`umfrage-${slug}`}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <BarChart3 size={17} className="text-brand-gold" />
        <h2
          id={`umfrage-${slug}`}
          className="font-sans text-[11px] font-bold tracking-[0.14em] uppercase text-brand-gold"
        >
          {frage}
        </h2>
      </div>

      <ul className="space-y-2.5">
        {optionen.map((o) => {
          const stimmen = ergebnis?.[o.key] ?? 0;
          const anteil = gesamt > 0 ? Math.round((stimmen / gesamt) * 100) : 0;
          const gewaehlt = eigeneWahl === o.key;
          return (
            <li key={o.key}>
              <button
                type="button"
                onClick={() => abstimmen(o.key)}
                disabled={laeuft}
                aria-pressed={gewaehlt}
                className="relative w-full text-left px-4 py-3 transition-colors duration-200 ease-out motion-reduce:transition-none disabled:opacity-60"
                style={{
                  border: gewaehlt
                    ? '1px solid rgba(200,136,42,0.6)'
                    : '1px solid rgba(200,136,42,0.18)',
                  background: 'rgba(0,0,0,0.25)',
                }}
              >
                {/* Balken liegt hinter der Beschriftung, nicht daneben — sonst
                    springt das Layout beim Wechsel von Frage zu Ergebnis. */}
                {zeigeErgebnis && (
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 transition-[width] duration-500 motion-reduce:transition-none"
                    style={{ width: `${anteil}%`, background: 'rgba(200,136,42,0.16)' }}
                  />
                )}
                <span className="relative flex items-center justify-between gap-4">
                  <span className="font-body text-[0.95rem] text-text-light flex items-center gap-2">
                    {gewaehlt && <Check size={14} className="text-brand-gold shrink-0" />}
                    {o.label}
                  </span>
                  {zeigeErgebnis && (
                    <span className="font-sans text-sm font-bold text-brand-gold tabular-nums shrink-0">
                      {anteil}%
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 font-sans text-xs text-text-light/55">
        {gesamt > 0
          ? `${gesamt.toLocaleString('de-DE')} ${gesamt === 1 ? 'Stimme' : 'Stimmen'}`
          : 'Noch keine Stimmen — deine wäre die erste.'}
        {angemeldet === false && (
          <>
            {' · '}
            <Link href="/auth/login" className="text-brand-gold underline underline-offset-2 hover:no-underline">
              Anmelden zum Abstimmen
            </Link>
          </>
        )}
        {eigeneWahl && ' · Du kannst deine Antwort jederzeit ändern.'}
      </p>

      {fehler && (
        <p className="mt-2 font-sans text-xs text-brand-fire" role="alert">
          {fehler}
        </p>
      )}
    </section>
  );
}
