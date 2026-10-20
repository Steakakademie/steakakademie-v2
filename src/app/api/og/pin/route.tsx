import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Pinterest-Pin im Hochformat 2:3 (1000×1500) — Rezeptbild oben, Titel unten (20.10.2026).
// Aufruf (Plan-Skript scripts/pinterest/pins.mjs baut die URLs):
//   /api/og/pin?img=/images/rezepte/picanha.jpg&title=Picanha%20Churrasco&sub=Brasilianischer%20Klassiker&meta=Brasilien%20·%20Einsteiger&ki=1
//
// Sicherheit: `img` nur als lokaler Pfad unter /images/ (jpg/png) — keine fremden URLs,
// damit die Route nicht als offener Bild-Proxy missbraucht werden kann.
// `ki=1` blendet „KI-Bild“ ein (Transparenz wie auf der Website, Art. 50 KI-VO).
const TITEL_MAX = 70;
const SUB_MAX = 90;
const META_MAX = 60;
const BILD_PFAD = /^\/images\/[a-z0-9/_-]+\.(jpe?g|png)$/i;

/** Query-Wert säubern: Leerraum glätten, auf Maximallänge kürzen. */
function clean(value: string | null, max: number): string | null {
  if (!value) return null;
  const text = value.replace(/\s+/g, ' ').trim();
  if (!text) return null;
  return text.length > max ? text.slice(0, max - 1).trimEnd() + '…' : text;
}

/** Schriftgröße nach Titellänge, damit lange Titel in höchstens vier Zeilen passen. */
function titelGroesse(titel: string): number {
  if (titel.length <= 13) return 104;
  if (titel.length <= 18) return 90;
  if (titel.length <= 28) return 76;
  if (titel.length <= 45) return 64;
  return 56;
}

// Markenschriften aus dem Urkunden-Satz (Playfair für den Titel, DM Sans für den Rest).
// Edge-Muster laut Next-Doku: Datei per import.meta.url bündeln und als ArrayBuffer laden.
const schriften = Promise.all([
  fetch(new URL('../../../../lib/urkunde/schriften/PlayfairDisplay-SemiBold.ttf', import.meta.url)).then((r) => r.arrayBuffer()),
  fetch(new URL('../../../../lib/urkunde/schriften/DMSans-Medium.ttf', import.meta.url)).then((r) => r.arrayBuffer()),
  fetch(new URL('../../../../lib/urkunde/schriften/DMSans-Bold.ttf', import.meta.url)).then((r) => r.arrayBuffer()),
]);

export async function GET(request: Request) {
  const [playfair, dmMedium, dmBold] = await schriften;
  const { searchParams, origin } = new URL(request.url);
  const titel = clean(searchParams.get('title'), TITEL_MAX) ?? 'Rezept vom Grill';
  const sub = clean(searchParams.get('sub'), SUB_MAX);
  const meta = clean(searchParams.get('meta'), META_MAX);
  const img = searchParams.get('img');
  const bild = img && BILD_PFAD.test(img) && !img.includes('..') ? `${origin}${img}` : null;
  const ki = searchParams.get('ki') === '1';

  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#0D0A06', fontFamily: 'DM Sans' }}>
        {/* Bild oben (960 px) — Satori kennt kein next/image */}
        <div style={{ display: 'flex', position: 'relative', width: 1000, height: 960 }}>
          {bild ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bild} alt="" width={1000} height={960} style={{ width: 1000, height: 960, objectFit: 'cover' }} />
          ) : (
            <div style={{ display: 'flex', width: 1000, height: 960, background: '#1E150C' }} />
          )}
          {/* Übergang ins dunkle Textfeld */}
          <div
            style={{
              position: 'absolute', left: 0, bottom: 0, width: 1000, height: 220,
              background: 'linear-gradient(180deg, rgba(13,10,6,0) 0%, #0D0A06 100%)',
            }}
          />
          {ki && (
            <div
              style={{
                position: 'absolute', top: 28, right: 28, display: 'flex',
                background: 'rgba(13,10,6,0.72)', color: '#F5EDE2', fontSize: 22,
                padding: '8px 16px', borderRadius: 6,
              }}
            >
              KI-Bild
            </div>
          )}
        </div>

        {/* Text unten */}
        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, padding: '0 72px 60px', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', width: 12, height: 40, background: '#C8882A', marginRight: 20 }} />
              <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 7, color: '#C8882A' }}>STEAKAKADEMIE</div>
            </div>
            <div
              style={{
                fontSize: titelGroesse(titel), fontFamily: 'Playfair Display', fontWeight: 600, lineHeight: 1.1,
                color: '#F5EDE2', marginTop: 20,
              }}
            >
              {titel}
            </div>
            {sub && <div style={{ fontSize: 38, lineHeight: 1.25, color: '#E8DCCB', marginTop: 18 }}>{sub}</div>}
            {meta && <div style={{ fontSize: 28, color: '#A89B8C', marginTop: 18 }}>{meta}</div>}
          </div>
          <div style={{ display: 'flex', fontSize: 30, color: '#E85018', fontWeight: 700 }}>Rezept auf steakakademie.de →</div>
        </div>
      </div>
    ),
    {
      width: 1000,
      height: 1500,
      fonts: [
        { name: 'Playfair Display', data: playfair, weight: 600, style: 'normal' },
        { name: 'DM Sans', data: dmMedium, weight: 500, style: 'normal' },
        { name: 'DM Sans', data: dmBold, weight: 700, style: 'normal' },
      ],
      // Rezeptbilder ändern sich selten — einen Tag im CDN halten.
      headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' },
    },
  );
}
