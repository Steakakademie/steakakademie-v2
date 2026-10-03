'use client';
import { useState, useEffect } from 'react';

interface Zutat { menge: string; einheit: string; name: string }
interface Schritt { beschreibung: string }
interface Moderation {
  safe?: boolean;
  is_recipe?: boolean;
  quality_score?: number;
  category_guess?: string;
  reasons?: string;
  user_message?: string;
}
interface UserRecipe {
  id: string;
  slug: string;
  title: string;
  description: string;
  author_name: string;
  status: string;
  quality_score: number | null;
  moderation: Moderation | null;
  ingredients: Zutat[];
  steps: Schritt[];
  created_at: string;
}

export default function RezeptModerationPage() {
  const [recipes, setRecipes] = useState<UserRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr('');
    try {
      const res = await fetch('/api/admin/rezepte');
      if (res.status === 401) { setErr('Nicht eingeloggt — /admin/login'); setLoading(false); return; }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setRecipes(json.recipes);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Fehler');
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function decide(id: string, status: 'approved' | 'rejected') {
    setBusy(id);
    try {
      const res = await fetch('/api/admin/rezepte', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setRecipes((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Fehler');
    }
    setBusy(null);
  }

  return (
    <div className="min-h-screen bg-[#0a0805] text-[#e8dcc8] font-mono p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="text-[#c8621a] text-xs tracking-widest">🥩 STEAKAKADEMIE · REZEPT-MODERATION
          <a href="/admin/review" className="ml-4 text-[#8a7e6a] hover:text-[#d4a53a]">▸ CONTENT-REVIEW</a>
        </div>
        <button onClick={load} className="text-[#8a7e6a] text-xs hover:text-[#d4a53a]">↻ neu laden</button>
      </div>

      <p className="text-[#8a7e6a] text-[11px] mb-4">
        Alle Einreichungen, die die KI-Vorprüfung bestanden haben (needs_review), plus ausstehende (pending).
        Seit 03.10.2026 gibt die KI nichts mehr selbst frei: Unter /rezepte/community erscheint ein Rezept erst
        nach „Freigeben“ hier. Von der KI abgelehnte Einreichungen (rejected) tauchen hier nicht auf.
      </p>

      {err && <p className="text-red-400 text-xs mb-4">{err}</p>}
      {loading ? (
        <p className="text-[#8a7e6a] text-sm animate-pulse motion-reduce:animate-none">Lade Einreichungen…</p>
      ) : recipes.length === 0 ? (
        <p className="text-[#8a7e6a] text-sm">Keine offenen Einreichungen. 🔥</p>
      ) : (
        <div className="space-y-3">
          {recipes.map((r) => {
            const isOpen = open === r.id;
            const score = r.quality_score ?? r.moderation?.quality_score ?? null;
            return (
              <div key={r.id} className="bg-[#16130a] border border-[#2a2416] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center flex-wrap gap-2 text-[10px] tracking-widest mb-1">
                      <span className="text-[#d4a53a] uppercase">{r.status}</span>
                      {score !== null && <span className="text-[#8a7e6a]">· Score {score}/100</span>}
                      <span className="text-[#8a7e6a]">· von {r.author_name}</span>
                      {r.moderation?.category_guess && <span className="text-[#8a7e6a]">· {r.moderation.category_guess}</span>}
                    </div>
                    <h3 className="text-sm text-[#e8dcc8] leading-snug">{r.title}</h3>
                    <p className="text-xs text-[#8a7e6a] mt-1 line-clamp-2">{r.description}</p>
                    {r.moderation?.reasons && (
                      <p className="text-[11px] text-[#bda86a] mt-1.5 italic">KI: {r.moderation.reasons}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => decide(r.id, 'approved')}
                      disabled={busy === r.id}
                      className="bg-[#3a7a3a] text-white text-xs px-3 py-1.5 tracking-wider hover:bg-[#4a9a4a] disabled:opacity-40"
                    >✓ Freigeben</button>
                    <button
                      onClick={() => decide(r.id, 'rejected')}
                      disabled={busy === r.id}
                      className="border border-[#c8621a]/50 text-[#c8621a] text-xs px-3 py-1.5 tracking-wider hover:bg-[#c8621a]/10 disabled:opacity-40"
                    >✕ Ablehnen</button>
                    <button
                      onClick={() => setOpen(isOpen ? null : r.id)}
                      className="text-[#8a7e6a] text-[10px] hover:text-[#d4a53a]"
                    >{isOpen ? 'zuklappen' : 'Details'}</button>
                  </div>
                </div>
                {isOpen && (
                  <div className="mt-3 pt-3 border-t border-[#2a2416] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#bdb3a0]">
                    <div>
                      <div className="text-[#d4a53a] text-[10px] tracking-widest mb-1.5">ZUTATEN</div>
                      <ul className="space-y-0.5">
                        {r.ingredients?.map((z, i) => (
                          <li key={i}>· {z.menge} {z.einheit} {z.name}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-[#d4a53a] text-[10px] tracking-widest mb-1.5">ZUBEREITUNG</div>
                      <ol className="space-y-1 list-decimal list-inside">
                        {r.steps?.map((s, i) => (
                          <li key={i} className="leading-relaxed">{s.beschreibung}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
