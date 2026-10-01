/**
 * POST /api/kochwissen   (application/json)
 *
 * RAG-Endpoint der Wissensdatenbank: Frage → Vektor-Retrieval (Voyage + pgvector)
 * → belegte Antwort durch Claude, geerdet an den gefundenen Wissenseinträgen.
 *
 * Body: { frage: string, kategorie?: string, cut?: string, limit?: number }
 * Antwort: { antwort: string, treffer: Array<{ titel, quelle, kategorie, similarity }> }
 *
 * Grundsatz: Claude antwortet AUSSCHLIESSLICH aus dem gelieferten Kontext und
 * erfindet keine Temperaturen/Zeiten/Mengen. Jede Antwort nennt die Quellen.
 *
 * Siehe docs/wissensdatenbank-architektur.md.
 *
 * Eingangsschutz (01.10.2026): Bis dahin war dieser Endpunkt — Voyage-Embedding
 * plus Claude pro Aufruf — ohne jede Grenze aufrufbar; kein Browser-Bauteil im
 * Repo ruft ihn, nur /api/kochwissen/generieren war über guardRequest gesichert.
 * Jetzt: Same-Origin, 10 Fragen / IP / 10 min, Login oder Admin-Cookie — gleiche
 * Linie wie /generieren (project_api_guard: Rezept-Schmiede bewusst nicht anonym).
 */
const RATE = { limit: 10, windowMs: 10 * 60 * 1_000 };
const BodySchema = z.object({
  frage: z.string().trim().min(1, 'frage fehlt').max(2000),
  kategorie: z.string().max(100).optional().nullable(),
  cut: z.string().max(100).optional().nullable(),
  limit: z.coerce.number().int().min(1).max(20).optional().default(8),
});

import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { guardRequest } from '@/lib/api/guard';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { searchKochwissen, buildKontext, rerankTreffer, type Treffer } from '@/lib/kochwissen/retrieval';
import { searchContext, type KnowledgeMatch } from '@/lib/voyage-retrieval';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Im Projekt erprobtes, gültiges API-Modell (wie contentAgent/pm-agent).
const MODEL = 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `Du bist der Wissens-Assistent der Steakakademie.
Beantworte die Frage AUSSCHLIESSLICH auf Basis der bereitgestellten Wissenseinträge.
Regeln:
- Erfinde nichts. Insbesondere keine Temperaturen, Zeiten, Mengen oder Fakten, die nicht im Kontext stehen.
- Übernimm Zahlenwerte (Temperaturen, Zeiten) wörtlich aus den Einträgen.
- Wenn der Kontext die Frage nicht beantwortet, sage das offen, statt zu raten.
- Antworte auf Deutsch, präzise und praxisnah.
- Nenne am Ende die genutzten Quellen als Liste der "Quelle-Fundstelle"-Angaben.`;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY fehlt.' }, { status: 500 });
  }
  if (!process.env.VOYAGE_API_KEY) {
    return NextResponse.json({ error: 'VOYAGE_API_KEY fehlt.' }, { status: 500 });
  }

  // 1) Eingabe — Herkunft, Rate-Limit, Auth, Schema über den zentralen Guard.
  const guard = await guardRequest(req, { key: 'kochwissen', rate: RATE, schema: BodySchema, auth: 'user-or-admin' });
  if (!guard.ok) return guard.response;
  const frage = guard.body.frage;
  const kategorie = guard.body.kategorie ?? null;
  const cut = guard.body.cut ?? null;
  const limit = guard.body.limit;

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // 2) Query-Embedding + Vektor-Retrieval — zwei Korpora parallel:
  //    a) kochwissen (kuratierte Einträge, match_kochwissen)
  //    b) knowledge_embeddings (docs/ + content/, Nacht-Index, match_knowledge)
  //    Der Reranker sortiert beide gemeinsam — er arbeitet auf Rohtext und ist
  //    daher unabhängig davon, mit welchem Modell die Korpora eingebettet sind.
  let treffer: Treffer[];
  try {
    const [kuratiert, dokuChunks] = await Promise.all([
      searchKochwissen(admin, frage, { kategorie, cut, limit }),
      // Doku-Suche ist Zusatzkontext: Ausfall darf die Kernantwort nicht blocken.
      kategorie || cut
        ? Promise.resolve<KnowledgeMatch[]>([]) // Filter existieren nur im kuratierten Korpus
        : searchContext(frage, Math.min(limit, 8)).catch((e) => {
            console.warn('[kochwissen] Doku-Index nicht erreichbar:', e instanceof Error ? e.message : e);
            return [] as KnowledgeMatch[];
          }),
    ]);

    const ausDoku: Treffer[] = dokuChunks.map((m) => ({
      id: m.id,
      titel: m.metadata.title,
      kategorie: m.metadata.category,
      cut_zutat: null,
      schwierigkeit: null,
      keywords: null,
      quelle: m.metadata.file_path,
      inhalt: m.content,
      similarity: m.similarity,
    }));

    treffer = ausDoku.length
      ? await rerankTreffer(frage, [...kuratiert, ...ausDoku], limit)
      : kuratiert;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Retrieval fehlgeschlagen: ${msg}` }, { status: 502 });
  }

  if (treffer.length === 0) {
    return NextResponse.json({
      antwort: 'Dazu liegt in der Wissensdatenbank (noch) kein passender Eintrag vor.',
      treffer: [],
    });
  }

  // 3) Kontext bauen + geerdete Antwort
  const kontext = buildKontext(treffer);

  let antwort: string;
  try {
    const { text } = await generateText({
      model: anthropic(MODEL),
      system: SYSTEM_PROMPT,
      prompt: `Frage: ${frage}\n\nWissenseinträge:\n${kontext}`,
    });
    antwort = text;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Antwort fehlgeschlagen: ${msg}` }, { status: 502 });
  }

  return NextResponse.json({
    antwort,
    treffer: treffer.map((t) => ({
      titel: t.titel,
      quelle: t.quelle,
      kategorie: t.kategorie,
      similarity: t.similarity,
    })),
  });
}
