'use client';

/**
 * Meine Einreichungen — eigene Community-Rezepte mit Status.
 *
 * Schließt die Feedback-Lücke der Rezept-Einreichung: Status und
 * rejection_reason wurden seit jeher in user_recipes gespeichert, aber dem
 * Einreicher nie angezeigt. Liest per Client-Supabase NUR die eigenen Zeilen —
 * abgesichert durch die RLS-Policy "eigene einreichungen lesen"
 * (supabase/migrations/20260830120000_user_recipes.sql).
 * Rendert sich bei 0 Einreichungen gar nicht (kein leerer Kasten im Profil).
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ExternalLink, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Einreichung = {
  slug: string;
  title: string;
  status: 'approved' | 'needs_review' | 'rejected' | 'pending';
  rejection_reason: string | null;
  created_at: string;
};

const STATUS_UI: Record<Einreichung['status'], { label: string; cls: string; Icon: typeof Clock }> = {
  approved:     { label: 'Veröffentlicht',   cls: 'text-green-600',  Icon: CheckCircle2 },
  needs_review: { label: 'In Prüfung',       cls: 'text-brand-gold', Icon: Clock },
  pending:      { label: 'In Prüfung',       cls: 'text-brand-gold', Icon: Clock },
  rejected:     { label: 'Nicht angenommen', cls: 'text-brand-fire', Icon: XCircle },
};

export default function MeineEinreichungen() {
  const [rows, setRows] = useState<Einreichung[] | null>(null);
  const supabase = createClient();

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('user_recipes')
      .select('slug, title, status, rejection_reason, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(25);
    if (data) setRows(data as Einreichung[]);
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  if (!rows || rows.length === 0) return null;

  return (
    <div className="mt-6 border border-border-subtle bg-surface-elevated p-6">
      <h2 className="font-serif text-lg font-bold text-text-primary mb-1">Meine Rezept-Einreichungen</h2>
      <p className="font-body text-sm text-text-secondary mb-5">
        Deine Beiträge zur Community-Küche — und wo sie gerade stehen.
      </p>
      <ul className="space-y-3">
        {rows.map((r) => {
          const ui = STATUS_UI[r.status] ?? STATUS_UI.pending;
          return (
            <li key={r.slug} className="border border-border-subtle p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-sans text-sm font-bold text-text-primary truncate">{r.title}</p>
                  <p className={`inline-flex items-center gap-1.5 font-sans text-xs font-semibold mt-1 ${ui.cls}`}>
                    <ui.Icon size={13} /> {ui.label}
                  </p>
                </div>
                {r.status === 'approved' && (
                  <Link href={`/rezepte/community/${r.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-sans font-bold text-brand-gold underline underline-offset-2 hover:no-underline shrink-0">
                    Ansehen <ExternalLink size={12} />
                  </Link>
                )}
              </div>
              {r.status === 'rejected' && r.rejection_reason && (
                <p className="font-body text-xs text-text-secondary mt-2 leading-snug">
                  {r.rejection_reason} — überarbeite dein Rezept und reiche es gern neu ein.
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
