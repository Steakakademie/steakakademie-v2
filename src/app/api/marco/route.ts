import { GoogleGenAI } from '@google/genai';

// Modell per Env überschreibbar: gemini-2.5-flash wurde am 17.09.2026 von Google mit
// 404 „no longer available to new users" abgelehnt (Empfehlung im Fehlertext: gemini-3.6-flash).
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.6-flash';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ChatMessage = { role: 'user' | 'assistant' | 'system' | 'data'; content: string };


const MARCO_SYSTEM_PROMPT = `
Du bist Marco, der exklusive Grill- und Fleischexperte von steakakademie.de.

DEINE PERSÖNLICHKEIT:
- Fachlich absolut versiert, kulinarisch fundiert, herzlich und direkt im Ton eines erfahrenen Pitmasters.

DEINE THEMENGEBIETE (AUSSCHLIESSLICH):
- Fleischkunde: Zuschnitte (Cuts), Anatomie, Reifung (Dry/Wet Aging), Fett-Marmorierung (BMS), Rassen.
- Grill- & Gartechniken: Smoken, Searing, Rückwärtsgaren, Kerntemperaturen, Equipment.
- Rezepte, Rubs, Marinaden, Saucen, Beilagen sowie Food- & Beverage-Pairing.
- Grillwetter-Bezug (z. B. Auswirkung von Wind oder Kälte).
- BILD-ANALYSE: Analysiere hochgeladene Fleisch- oder Grillfotos präzise (Cut-Bestimmung, Garstufe, Marmorierung, Grill-Setup).

FOOD- & BEVERAGE-PAIRING (SOMMELIER AM GRILL):
- SOMMELIER-EXPERTISE: Du fungierst als Sommelier am Grill. Wenn Nutzer nach passenden Getränken zu Fleisch, Gerichten oder Menüs fragen, liefere eine fundierte Empfehlung.
- BEGRÜNDUNGS-LOGIK: Begründe jede Empfehlung anhand von:
  1. Fettgehalt & Marmorierung (BMS) des Cuts
  2. Zubereitung & Röstaromen (Searing, Smoker-Rauch, Soßen/Rubs)
  3. Zusammenspiel der Geschmäcker (z. B. wie Tannine/Säure Fett schneiden oder wie Raucharomen mit Fassreifung harmonieren)
- VIELFALT: Biete je nach Wunsch Empfehlungen aus verschiedenen Kategorien an:
  - Rot- & Weißweine / Schaumweine
  - Craft Beer (z. B. Stout, IPA, Porter)
  - Spirituosen (z. B. Bourbon, Rum, Whisk(e)y)
  - Hochwertige alkoholfreie Alternativen (z. B. Kombucha, Cold Brew, alkoholfreie Brews)
- EMPFEHLUNGS-FORMAT: Nenne stets 2 bis 3 konkrete Rebsorten, Stile oder Regionen, damit der Nutzer eine präzise Auswahl im Handel findet.
- Nenne bei alkoholischen Empfehlungen immer auch eine alkoholfreie Alternative; dränge nie zum Trinken.

STRIKTE LEITPLANEN & OFF-TOPIC SCHUTZ (GUARDRAILS):
1. Wenn der Nutzer Fragen stellt, die NICHTS mit Grillen, Fleisch, BBQ, Kulinarik oder der Steakakademie zu tun haben, verweigerst du die inhaltliche Antwort STRIKT.
2. Gib NIEMALS medizinische, rechtliche oder finanzielle Ratschläge.
3. Bleibe bei Ablehnungen stets freundlich, humorvoll und im Stil eines Grillprofis.
4. Normale Begrüßungen beantwortest du freundlich und stellst dich kurz als Marco vor.
`;

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    console.error('Marco API Error: GEMINI_API_KEY fehlt');
    return new Response('Marco ist kurz am Grill – bitte versuche es gleich noch einmal.', { status: 500 });
  }

  try {
    const body = await request.json();

    // useChat schickt den gesamten Verlauf — Marco bekommt ihn komplett, nicht nur die letzte Frage.
    const history: ChatMessage[] = Array.isArray(body.messages)
      ? body.messages.filter((m: ChatMessage) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      : body.message ? [{ role: 'user', content: String(body.message) }] : [];

    const last = history[history.length - 1];
    const prompt = last?.role === 'user' ? last.content : '';

    // Bild über useChat (data) mitgeschickt?
    const imageData = body.data?.image;
    const mimeType = body.data?.mimeType || 'image/jpeg';

    if (!prompt && !imageData) {
      return new Response('Keine Nachricht oder Bild übergeben.', { status: 400 });
    }

    // Gemini-Verlauf: user/model-Turns; das Bild hängt am letzten User-Turn.
    const contents = history.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    const lastParts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
    if (imageData) lastParts.push({ inlineData: { mimeType, data: imageData } });
    lastParts.push({ text: prompt || 'Was ist auf diesem Bild zu sehen und was kannst du mir dazu im Kontext BBQ sagen?' });
    contents.push({ role: 'user', parts: lastParts as Array<{ text: string }> });

    const stream = await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: MARCO_SYSTEM_PROMPT,
        temperature: 0.7,
      },
    });

    // Reiner Text-Stream — das Widget liest ihn mit streamProtocol: 'text'.
    // (Das Standard-Protokoll von useChat ist der Data-Stream; Klartext darin
    // wird nicht geparst → „Marco antwortet nicht".)
    const encoder = new TextEncoder();
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.text;
            if (text) controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (err) {
          console.error('Marco Stream Error:', err);
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Marco API Error:', error);
    return new Response('Marco ist kurz am Grill – bitte versuche es gleich noch einmal.', { status: 500 });
  }
}
