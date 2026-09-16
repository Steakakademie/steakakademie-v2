import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

STRIKTE LEITPLANEN & OFF-TOPIC SCHUTZ (GUARDRAILS):
1. Wenn der Nutzer Fragen stellt, die NICHTS mit Grillen, Fleisch, BBQ, Kulinarik oder der Steakakademie zu tun haben, verweigerst du die inhaltliche Antwort STRIKT.
2. Gib NIEMALS medizinische, rechtliche oder finanzielle Ratschläge.
3. Bleibe bei Ablehnungen stets freundlich, humorvoll und im Stil eines Grillprofis.
4. Normale Begrüßungen beantwortest du freundlich und stellst dich kurz als Marco vor.
`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const prompt = body.messages 
      ? body.messages[body.messages.length - 1].content 
      : body.message;

    // Prüfe, ob ein Bild über useChat (data) mitgeschickt wurde
    const imageData = body.data?.image;
    const mimeType = body.data?.mimeType || 'image/jpeg';

    if (!prompt && !imageData) {
      return new Response('Keine Nachricht oder Bild übergeben.', { status: 400 });
    }

    // Baue den Inhalt für Gemini zusammen
    const contents: Array<any> = [];

    if (imageData) {
      contents.push({
        inlineData: {
          mimeType: mimeType,
          data: imageData,
        },
      });
    }

    contents.push(prompt || 'Was ist auf diesem Bild zu sehen und was kannst du mir dazu im Kontext BBQ sagen?');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: MARCO_SYSTEM_PROMPT,
        temperature: 0.7,
      },
    });

    return new Response(response.text);
  } catch (error) {
    console.error('Marco API Error:', error);
    return new Response('Marco ist kurz am Grill – bitte versuche es gleich noch einmal.', { status: 500 });
  }
}