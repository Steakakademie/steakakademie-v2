import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Dynamisches Standard-OG-Bild (1200×630) — markenkonform, ohne statisches Asset.
// Ersetzt das fehlende /api/og überall.
//
// Seit dem og:image-Sweep (Plan C5) nimmt die Route zwei optionale Parameter:
//   /api/og?title=BBQ-Glossar&sub=Fachbegriffe%20erklaert
// Ohne Parameter bleibt alles wie zuvor — die Startseite nutzt weiter /api/og
// pur. Gesetzt werden sie ueber ogImages() aus src/lib/og.ts.
//
// Laengen sind gedeckelt, damit ein langer Titel das Layout nicht sprengt: der
// Titel bricht bei 76px in maximal drei Zeilen, die Unterzeile in eine.
const TITEL_MAX = 80;
const SUB_MAX = 110;

/** Query-Wert saeubern: Steuerzeichen raus, auf Maximallaenge kuerzen. */
function clean(value: string | null, max: number): string | null {
  if (!value) return null;
  const text = value.replace(/\s+/g, ' ').trim();
  if (!text) return null;
  return text.length > max ? text.slice(0, max - 1).trimEnd() + '…' : text;
}

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const titel = clean(params.get('title'), TITEL_MAX) ?? 'Deutschlands BBQ-Wissensplattform';
  const sub = clean(params.get('sub'), SUB_MAX) ?? 'Cuts · Techniken · Kerntemperaturen · Grillmeister-Diplome';

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: '#0D0A06',
          padding: '72px',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              width: '14px',
              height: '56px',
              background: '#C8882A',
              marginRight: '24px',
            }}
          />
          <div
            style={{
              fontSize: '32px',
              fontWeight: 700,
              letterSpacing: '8px',
              color: '#C8882A',
            }}
          >
            STEAKAKADEMIE
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: '76px',
              fontWeight: 800,
              lineHeight: 1.05,
              color: '#F5EDE2',
              maxWidth: '960px',
            }}
          >
            {titel}
          </div>
          <div style={{ fontSize: '34px', color: '#A89B8C', marginTop: '28px' }}>
            {sub}
          </div>
        </div>

        <div style={{ fontSize: '30px', color: '#C8882A' }}>steakakademie.de</div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
