/**
 * Erzeugt die Druckvorlagen der Urkunden aus den Design-Dateien.
 *
 *   node scripts/urkunden-vorlagen.mjs
 *
 * Liest  design/urkunden/Urkunde N *.dc.html
 * Schreibt src/lib/urkunde/vorlagen/stufe-N-{1,2}z.png  (300 dpi)
 *          src/lib/urkunde/vorlagen/boxen.json          (Textkaesten)
 *
 * Nur noetig, wenn sich das Design aendert. Im Alltag laeuft nichts davon —
 * der Server setzt die drei variablen Texte ohne Browser auf diese Vorlagen
 * (src/lib/urkunde/render.ts), weil auf Vercel kein Chromium laeuft.
 *
 * Zwei Vorlagen je Stufe: Die Textspalte ist ein Flex-Layout mit
 * justify-content:space-between — ein zweizeiliger Name verschiebt alles
 * darunter. Die Laufzeit waehlt anhand der gemessenen Textbreite.
 *
 * Die drei variablen Felder stehen in der Vorlage auf visibility:hidden. Sie
 * belegen ihren Platz weiter (das Layout bleibt exakt stehen), erscheinen aber
 * nicht im Bild.
 *
 * Schriften kommen als @font-face aus src/lib/urkunde/schriften — nicht von
 * Google und nicht aus dem System. Nur so rendert der Browser hier mit genau
 * den Dateien, mit denen der Server spaeter die Texte setzt; sonst weichen die
 * Buchstabenbreiten minimal ab und die vermessenen Kaesten stimmen nicht mehr.
 * (Die frueheren Renderings vom 09.09.2026 liefen ohne die Schriften und
 * fielen still auf Georgia/DejaVu zurueck.)
 */
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DESIGN = path.join(WURZEL, 'design', 'urkunden');
const SCHRIFTEN = path.join(WURZEL, 'src', 'lib', 'urkunde', 'schriften');
const ZIEL = path.join(WURZEL, 'src', 'lib', 'urkunde', 'vorlagen');

const DPI = 300;
const SKALIERUNG = DPI / 96;

const DATEIEN = [
  { stufe: 1, datei: 'Urkunde 1 Bronze.dc.html' },
  { stufe: 2, datei: 'Urkunde 2 Silber.dc.html' },
  { stufe: 3, datei: 'Urkunde 3 Gold.dc.html' },
  { stufe: 4, datei: 'Urkunde 4 Platin.dc.html' },
  { stufe: 5, datei: 'Urkunde 5 Meister.dc.html' },
];

/** Die Vorgabewerte aus den .dc.html — daran werden die Felder gefunden. */
const FELDER = {
  name: 'Maximilian Brandhorst',
  datum: '14. März 2026',
  nr: 'Urkunden-Nr. SA-2026-0148',
};

const SCHRIFT_SCHNITTE = [
  { datei: 'PlayfairDisplay-Medium.ttf', familie: 'Playfair Display', gewicht: 500 },
  { datei: 'PlayfairDisplay-SemiBold.ttf', familie: 'Playfair Display', gewicht: 600 },
  { datei: 'PlayfairDisplay-SemiBold.ttf', familie: 'Playfair Display', gewicht: 700 },
  { datei: 'DMSans-Regular.ttf', familie: 'DM Sans', gewicht: 400 },
  { datei: 'DMSans-Medium.ttf', familie: 'DM Sans', gewicht: 500 },
  { datei: 'DMSans-Bold.ttf', familie: 'DM Sans', gewicht: 700 },
];

function schriftCss() {
  return SCHRIFT_SCHNITTE.map(({ datei, familie, gewicht }) => {
    const b64 = fs.readFileSync(path.join(SCHRIFTEN, datei)).toString('base64');
    return `@font-face{font-family:'${familie}';font-style:normal;font-weight:${gewicht};font-display:block;src:url(data:font/ttf;base64,${b64}) format('truetype');}`;
  }).join('\n');
}

/**
 * Die Designs kommen ueber HTTP, nicht ueber file:// (17.10.2026). Die
 * Claude-Design-Laufzeit (support.js) holt doc-page.js und das Siegel per
 * fetch(); Chromium (Playwright 1.60) lehnt fetch auf file:// ab — "URL scheme
 * 'file' is not supported", auch mit --allow-file-access-from-files. Die Seite
 * blieb dann auf visibility:hidden und der Screenshot lief in den Timeout.
 * Am 11.09.2026 lief es noch ueber file://; seitdem ist Chromium gewechselt.
 */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.css': 'text/css', '.svg': 'image/svg+xml' };
function designServer() {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const datei = path.join(DESIGN, rel);
    if (!datei.startsWith(DESIGN) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) {
      res.writeHead(404); res.end(); return;
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(datei)] ?? 'application/octet-stream' });
    fs.createReadStream(datei).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, url: `http://127.0.0.1:${server.address().port}` })));
}

const CDN = {
  react: 'https://unpkg.com/react@18.3.1/umd/react.production.min.js',
  reactDom: 'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js',
  babel: 'https://unpkg.com/@babel/standalone@7.29.0/babel.min.js',
};

async function main() {
  if (!fs.existsSync(DESIGN)) {
    console.error(`Design-Ordner fehlt: ${DESIGN}`);
    process.exit(1);
  }
  fs.mkdirSync(ZIEL, { recursive: true });

  const css = schriftCss();
  const { server, url: basis } = await designServer();
  const browser = await chromium.launch({ args: ['--font-render-hinting=none'] });
  const boxen = {};

  for (const { stufe, datei } of DATEIEN) {
    boxen[stufe] = {};

    for (const zeilen of [1, 2]) {
      const page = await browser.newPage({
        viewport: { width: 1600, height: 1100 },
        deviceScaleFactor: SKALIERUNG,
      });
      page.on('pageerror', (e) => console.log(`${datei}: PAGEERROR ${e.message}`));

      // Google-Fonts-Anfragen durch die mitgelieferten Schriften ersetzen.
      await page.route('**/*', async (route) => {
        const u = route.request().url();
        if (u.includes('fonts.googleapis.com')) {
          return route.fulfill({ status: 200, contentType: 'text/css', body: css });
        }
        if (u.includes('fonts.gstatic.com')) return route.abort();
        return route.continue();
      });

      await page.goto(`${basis}/${encodeURIComponent(datei)}`, {
        waitUntil: 'networkidle', timeout: 60000,
      });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(2000);

      const messung = await page.evaluate(({ FELDER, zeilen }) => {
        const seite = document.querySelector('.page');
        const seiteBox = seite.getBoundingClientRect();

        // Die Claude-Design-Laufzeit rendert {{ }}-Platzhalter als <span> im
        // formatierten <div> — gesucht wird der Span, gestylt ist der Div.
        const finde = (text) => [...seite.querySelectorAll('*')]
          .find((el) => el.children.length === 0 && el.textContent.trim() === text) || null;

        // Naechster Vorfahre mit position:absolute — die Textspalte.
        const spalte = (el) => {
          let n = el.parentElement;
          while (n && n !== seite) {
            if (getComputedStyle(n).position === 'absolute') return n;
            n = n.parentElement;
          }
          return seite;
        };

        // Ein inline-block ohne Ausdehnung mit vertical-align:baseline sitzt
        // mit seiner Oberkante genau auf der Grundlinie seiner Zeile — vorne
        // eingehaengt die erste, hinten die letzte.
        const grundlinien = (el) => {
          const mk = () => {
            const m = document.createElement('span');
            m.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
            return m;
          };
          const a = mk(); el.insertBefore(a, el.firstChild);
          const b = mk(); el.appendChild(b);
          const erste = a.getBoundingClientRect().top;
          const letzte = b.getBoundingClientRect().top;
          a.remove(); b.remove();
          return { erste, letzte };
        };

        const inhaltsBox = (el) => {
          const r = el.getBoundingClientRect();
          const s = getComputedStyle(el);
          return {
            left: r.left + parseFloat(s.paddingLeft) + parseFloat(s.borderLeftWidth),
            right: r.right - parseFloat(s.paddingRight) - parseFloat(s.borderRightWidth),
          };
        };

        const felder = {};
        let zeilenIst = null;

        for (const [schluessel, text] of Object.entries(FELDER)) {
          const span = finde(text);
          if (!span) { felder[schluessel] = null; continue; }
          const block = span.parentElement;

          if (schluessel === 'name' && zeilen === 1) block.style.whiteSpace = 'nowrap';

          const s = getComputedStyle(span);
          const r = span.getBoundingClientRect();
          const bezug = inhaltsBox(schluessel === 'name' ? spalte(block) : block);
          const g = grundlinien(span);

          if (schluessel === 'name') {
            const zh = parseFloat(getComputedStyle(block).lineHeight);
            zeilenIst = Math.round((g.letzte - g.erste) / zh) + 1;
          }

          felder[schluessel] = {
            grundlinie: g.erste - seiteBox.top,
            grundlinieLetzte: g.letzte - seiteBox.top,
            zeilenabstand: parseFloat(getComputedStyle(block).lineHeight),
            textLinks: r.left - seiteBox.left,
            textBreite: r.width,
            kastenLinks: bezug.left - seiteBox.left,
            kastenRechts: bezug.right - seiteBox.left,
            schriftgroesse: parseFloat(s.fontSize),
            schriftfamilie: s.fontFamily,
            schriftschnitt: s.fontWeight,
            laufweite: s.letterSpacing === 'normal' ? 0 : parseFloat(s.letterSpacing),
            ausrichtung: schluessel === 'nr' ? 'left' : 'center',
            farbe: s.color,
          };
          span.style.visibility = 'hidden';
        }

        return { seite: { breite: seiteBox.width, hoehe: seiteBox.height }, felder, zeilenIst };
      }, { FELDER, zeilen });

      const fehlend = Object.entries(messung.felder).filter(([, v]) => !v).map(([k]) => k);
      if (fehlend.length) {
        console.error(`Stufe ${stufe}/${zeilen}z: Felder nicht gefunden: ${fehlend.join(', ')} — Design geaendert?`);
        process.exitCode = 1;
      }
      if (messung.zeilenIst !== zeilen) {
        console.error(`Stufe ${stufe}/${zeilen}z: Name belegt ${messung.zeilenIst} Zeile(n) statt ${zeilen}.`);
        process.exitCode = 1;
      }

      const el = await page.$('.page');
      const ziel = path.join(ZIEL, `stufe-${stufe}-${zeilen}z.png`);
      await el.screenshot({ path: ziel });
      boxen[stufe][`${zeilen}z`] = messung;
      console.log(`Stufe ${stufe} / ${zeilen}-zeilig → ${path.basename(ziel)}`);
      await page.close();
    }
  }

  await browser.close();
  server.close();
  fs.writeFileSync(
    path.join(ZIEL, 'boxen.json'),
    JSON.stringify({ dpi: DPI, skalierung: SKALIERUNG, stufen: boxen }, null, 2),
  );
  console.log(`boxen.json geschrieben — ${DATEIEN.length * 2} Vorlagen in ${path.relative(WURZEL, ZIEL)}`);
  if (process.exitCode) console.error('Mit Warnungen beendet — Vorlagen pruefen!');
}

main().catch((e) => { console.error(e); process.exit(1); });

// Hinweis: CDN-Adressen der Design-Laufzeit (nur zur Dokumentation, sie werden
// direkt aus den .dc.html geladen und brauchen beim Lauf eine Internetverbindung):
void CDN;
