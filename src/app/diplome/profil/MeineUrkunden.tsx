'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { STUFEN } from '@/lib/diplome/stufen';
import { kennungAus, pruefPfad } from '@/lib/urkunde/kennung';

type Urkunde = { nr: string; pruefcode: string; stufe: number; name: string; ausgestellt_am: string };
type Stand = { bestanden: number[]; name: string | null; urkunden: Urkunde[] };

/**
 * Deine Urkunden (17.10.2026) — die kostenlose digitale Urkunde je bestandener
 * Stufe, mit Prüf-Link. Ein Name pro Konto: beim ersten Ausstellen festgelegt,
 * danach nur über den Support änderbar (Datenbank: urkunden_namen, Funktion
 * urkunde_ausstellen). Gelesen wird per RLS nur das eigene Konto; geschrieben
 * ausschliesslich über /api/urkunde/ausstellen.
 */
export default function MeineUrkunden() {
  const [stand, setStand] = useState<Stand | null>(null);
  const [nameEingabe, setNameEingabe] = useState('');
  const [bestaetigt, setBestaetigt] = useState(false);
  const [laeuft, setLaeuft] = useState<number | null>(null);
  const [fehler, setFehler] = useState('');

  const laden = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [fortschritt, name, urkunden] = await Promise.all([
        supabase.from('course_progress').select('stufe, status').eq('user_id', user.id).eq('status', 'bestanden'),
        supabase.from('urkunden_namen').select('name').eq('user_id', user.id).maybeSingle(),
        supabase.from('urkunden').select('nr, pruefcode, stufe, name, ausgestellt_am').eq('user_id', user.id),
      ]);
      const bestanden = Array.from(new Set(
        ((fortschritt.data ?? []) as { stufe: number | null }[])
          .map((z) => z.stufe)
          .filter((s): s is number => typeof s === 'number'),
      )).sort((a, b) => a - b);
      setStand({
        bestanden,
        name: (name.data as { name?: string } | null)?.name ?? null,
        urkunden: (urkunden.data ?? []) as Urkunde[],
      });
    } catch {
      setStand({ bestanden: [], name: null, urkunden: [] });
    }
  }, []);

  useEffect(() => { void laden(); }, [laden]);

  async function ausstellen(stufe: number) {
    setFehler('');
    if (!stand?.name) {
      if (nameEingabe.trim().length < 2) { setFehler('Bitte trag den Namen ein, der auf deinen Urkunden stehen soll.'); return; }
      if (!bestaetigt) { setFehler('Bitte bestätige, dass der Name stimmt — er lässt sich danach nur über den Support ändern.'); return; }
    }
    setLaeuft(stufe);
    try {
      const res = await fetch('/api/urkunde/ausstellen', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(stand?.name ? { stufe } : { stufe, name: nameEingabe.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFehler(typeof data?.error === 'string' ? data.error : 'Die Urkunde konnte gerade nicht ausgestellt werden.');
        return;
      }
      await laden();
    } catch {
      setFehler('Keine Verbindung — bitte später noch einmal versuchen.');
    } finally {
      setLaeuft(null);
    }
  }

  if (!stand || stand.bestanden.length === 0) return null;

  const offen = stand.bestanden.filter((s) => !stand.urkunden.some((u) => u.stufe === s));

  return (
    <div className="mt-6 border border-border-subtle bg-surface-elevated p-6">
      <h2 className="font-serif text-lg font-bold text-text-primary mb-1">Deine Urkunden</h2>
      <p className="text-xs font-sans text-text-muted mb-4">
        Digital und kostenlos, für jede bestandene Stufe. Jede Urkunde hat eine Nummer, mit der andere sie unter{' '}
        <Link href="/urkunde" className="underline hover:text-brand-fire">steakakademie.de/urkunde</Link> prüfen können.
      </p>

      {stand.name ? (
        <p className="text-sm font-sans text-text-secondary mb-4">
          Name auf deinen Urkunden: <strong className="text-text-primary">{stand.name}</strong>
          <span className="block text-xs text-text-muted mt-1">
            Ein Name pro Konto. Stimmt etwas nicht? Schreib uns über das{' '}
            <Link href="/kontakt" className="underline hover:text-brand-fire">Kontaktformular</Link>.
          </span>
        </p>
      ) : offen.length > 0 ? (
        <div className="mb-4 space-y-3">
          <label htmlFor="urkunden-name" className="block text-sm font-sans text-text-secondary">
            Name, wie er auf deinen Urkunden stehen soll
          </label>
          <input
            id="urkunden-name"
            value={nameEingabe}
            onChange={(e) => setNameEingabe(e.target.value)}
            maxLength={60}
            autoComplete="name"
            placeholder="z. B. Max Mustermann"
            className="w-full border border-border-subtle bg-transparent px-3 py-2 text-sm font-sans text-text-primary focus:outline-none focus:border-brand-fire"
          />
          <label className="flex items-start gap-2 text-xs font-sans text-text-muted">
            <input type="checkbox" checked={bestaetigt} onChange={(e) => setBestaetigt(e.target.checked)} className="mt-0.5" />
            <span>
              Der Name ist richtig geschrieben. Mir ist klar: Er gilt für alle meine Urkunden und lässt sich danach nur
              über den Support ändern. Wer meine Urkunden-Nummer kennt, sieht auf der Prüfseite diesen Namen, den Grad
              und das Datum.
            </span>
          </label>
        </div>
      ) : null}

      <ul className="divide-y divide-border-subtle">
        {stand.bestanden.map((nr) => {
          const s = STUFEN.find((x) => x.nr === nr);
          const u = stand.urkunden.find((x) => x.stufe === nr);
          return (
            <li key={nr} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-sm font-sans font-semibold text-text-primary">
                  {s ? `${s.cert} · Stufe ${s.nr}` : `Stufe ${nr}`}
                </p>
                {u && <p className="text-xs font-mono text-text-muted">{kennungAus(u.nr, u.pruefcode)}</p>}
              </div>
              {u ? (
                <div className="flex gap-4 text-sm font-sans">
                  <a href={`/api/urkunde/bild?k=${encodeURIComponent(kennungAus(u.nr, u.pruefcode))}`} className="underline hover:text-brand-fire">
                    Herunterladen
                  </a>
                  <Link href={pruefPfad(u.nr, u.pruefcode)} className="underline hover:text-brand-fire">Prüfseite</Link>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => ausstellen(nr)}
                  disabled={laeuft !== null}
                  className="bg-brand-fire text-white text-sm font-sans font-bold px-4 py-2 hover:opacity-90 disabled:opacity-60"
                >
                  {laeuft === nr ? 'Wird ausgestellt …' : 'Urkunde ausstellen'}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {fehler && <p role="alert" className="mt-3 text-sm font-sans text-red-500">{fehler}</p>}
    </div>
  );
}
