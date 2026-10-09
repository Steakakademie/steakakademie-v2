const fs = require('fs');
const path = require('path');

/**
 * Gibt es mindestens einen freigegebenen Artikel?
 *
 * Solange keiner auf reviewed: true steht, rendert /artikel nur den
 * Leerzustand. Eine leere Seite gehoert weder in die Sitemap noch in den Index —
 * sie waere Thin Content und wuerde die Route verbrennen, bevor sie Inhalt hat.
 *
 * Bewusst konditional aus dem Dateibestand gelesen statt als manueller Schalter:
 * Sobald Uwe den ersten Artikel freigibt, faellt der Ausschluss beim naechsten
 * Build von allein weg. Ein Flag muesste jemand zurueckdrehen und wuerde
 * garantiert vergessen.
 *
 * Die Bedingung spiegelt nurVeroeffentlicht() aus src/lib/redaktion.ts.
 * Gelesen wird die Frontmatter direkt, weil diese Datei CommonJS ist und die
 * contentlayer-Ausgabe ESM — der Dateibestand ist ohnehin die Quelle.
 */
function hatFreigegebeneArtikel() {
  const dir = path.join(__dirname, 'content', 'artikel');
  let dateien;
  try {
    dateien = fs.readdirSync(dir).filter((f) => f.endsWith('.mdx'));
  } catch {
    return false; // Verzeichnis fehlt = nichts freigegeben
  }
  return dateien.some((f) => {
    const raw = fs.readFileSync(path.join(dir, f), 'utf8');
    // \r im Zeichensatz wegen CRLF-Dateien im Repo (KAN-26)
    const feld = (k) => {
      const m = raw.match(new RegExp(`^${k}:[ \\t]*(.*?)[ \\t\\r]*$`, 'm'));
      return m ? m[1].replace(/^["']|["']$/g, '').trim() : null;
    };
    const status = feld('status');
    const reviewed = feld('reviewed');
    return status !== 'draft' && status !== 'review' && reviewed !== 'false';
  });
}

const ARTIKEL_FREIGEGEBEN = hatFreigegebeneArtikel();

/**
 * Letzte Aenderung je Inhaltsseite, aus den Contentlayer-Dokumenten gelesen
 * (SEO-Audit 08.10.2026: `lastmod` stand nur an 4 von 430 URLs — den
 * BBQ-News — obwohl jede Inhaltsseite ein Datum traegt). Google nutzt lastmod
 * zur Crawl-Priorisierung, aber nur, wenn es verlaesslich ist: deshalb KEIN
 * Build-Zeitstempel (autoLastmod) und nichts aus der Zukunft, sondern das
 * juengste von updatedAt, reviewedAt und publishedAt — und bei Seiten ohne
 * Dokument gar nichts.
 *
 * Laeuft im postbuild, also nach `contentlayer2 build`: die Indizes liegen dann
 * unter .contentlayer/generated/<Typ>/_index.json. Fehlen sie, gibt es eben
 * kein lastmod — die Sitemap bleibt gueltig.
 */
function lastmodNachUrl() {
  const karte = new Map();
  const basis = path.join(__dirname, '.contentlayer', 'generated');
  let typen;
  try { typen = fs.readdirSync(basis); } catch { return karte; }
  const jetzt = Date.now();
  for (const typ of typen) {
    const datei = path.join(basis, typ, '_index.json');
    let docs;
    try { docs = JSON.parse(fs.readFileSync(datei, 'utf8')); } catch { continue; }
    if (!Array.isArray(docs)) continue;
    for (const d of docs) {
      if (!d || typeof d.url !== 'string') continue;
      const zeiten = [d.updatedAt, d.reviewedAt, d.publishedAt]
        .map((x) => (x ? Date.parse(x) : NaN))
        .filter((n) => Number.isFinite(n) && n <= jetzt);
      if (zeiten.length === 0) continue;
      karte.set(d.url, new Date(Math.max(...zeiten)).toISOString());
    }
  }
  return karte;
}

const LASTMOD = lastmodNachUrl();

// Hinweis (30.08.2026): Hier stand ein Ausschluss fuer noch nicht erschienene
// Fleischwissen-Teile. Die Staffelung ist abgeschafft — alle drei Teile gehoeren
// in die Sitemap. Das Feld `newsletterAt` in den MDX ist rein dokumentarisch und
// darf hier NICHT als Filter wiederauftauchen.

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://steakakademie.de',
  generateRobotsTxt: false,
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 5000,
  exclude: [
    '/home-b',        // A/B-Variante (Editorial Ember) — noindex, Canonical auf /
    // Canonical-Crawl 01.10.2026 (585 Sitemap-URLs live geprueft): 425 Seiten mit
    // korrektem Self-Canonical, KEINE Abweichung auf der Alt-Site. Aber 163
    // noindex-Seiten standen in der Sitemap — widerspruechliches Signal an
    // Google („bitte indexieren" vs. „bitte nicht"). Raus damit:
    '/relaunch',      // Parallel-Relaunch: noindex, Canonical auf / (159 URLs)
    '/relaunch/*',
    '/challenge-teilnahmebedingungen', // robots: { index: false }
    '/nutzungsbedingungen',            // robots: { index: false }
    '/eigenregie/diagnose',            // robots: { index: false }
    '/fleischpass',                    // robots: { index: false } — in Vorbereitung (02.10.2026)
    // 03.10.2026: Bestaetigungsseite des Double-Opt-in — noindex, ohne den Klick
    // aus der Mail ohne Sinn. Sie ist statisch und stand deshalb im Manifest.
    '/newsletter/bestaetigt',
    // Ebenfalls noindex. Heute rendern diese Seiten dynamisch und stehen deshalb
    // nicht im Manifest — der Ausschluss haelt sie auch dann draussen, wenn eine
    // davon wieder statisch wird. Waechter: src/__tests__/sitemap-noindex.test.ts
    '/suche',
    // SEO-Audit 08.10.2026: ein Rezept, ~70 Woerter eigener Text — noindex in
    // beiden page.tsx, bis die Liste traegt. Stand bis dahin in ssrPaths.
    '/rezepte/community',
    '/rezepte/community/*',
    '/gutschein/*',                    // Einloesen + einzelner Gutschein; /gutschein selbst bleibt drin
    '/eigenregie/lernen',
    '/eigenregie/lernen/*',
    '/apple-icon.png', // Bild-Route (ImageResponse), kein Dokument, kein Canonical
    // tuwasduwillst.de ist eine eigene Marke (Host-Weiche in next.config.mjs):
    // diese Seiten gehoeren nicht in die Steakakademie-Sitemap.
    '/tuwasduwillst',
    '/tuwasduwillst/*',
    // BBQ-Grundkurs eingestellt (Uwe, 09.09.2026): Die URL leitet dauerhaft auf
    // /diplome. Eine weitergeleitete URL gehoert nicht in die Sitemap — das ist
    // ein widerspruechliches Signal an Google. Solange die Seitendateien noch im
    // Repo liegen, wuerde next-sitemap sie sonst aus dem Manifest ziehen.
    '/bbq-grundkurs',
    '/danke/bbq-grundkurs',
    // Bezahlprodukt-Schutz (26.08.2026): Stufe 2-5 sind Teil des kostenpflichtigen
    // Grillmeister-Diploms. Oeffentlich bleibt nur der Anreisser auf der Seite
    // selbst — die Volltexte gehoeren nicht in den Index. Stufe 1 (Bronze,
    // kostenloser Trichter) bleibt drin.
    '/diplome/lernen/stufe-2/*',
    '/diplome/lernen/stufe-3/*',
    '/diplome/lernen/stufe-4/*',
    '/diplome/lernen/stufe-5/*',
    '/go/*',
    '/api/*',
    '/admin/*',
    // Uwe, 02.09.2026: Gruender-Bereich ("Ehrliches System") raus aus der Sitemap.
    // Nav und Footer sind seit 641b346 ausgebaut; solange die Seiten indexiert
    // bleiben, sieht Google die Domain weiter thematisch gemischt (BBQ + Gruender-
    // Tools). CLAUDE.md Abschnitt 10: GF3 wird nicht vermarktet, bevor GF1 liefert.
    // Die Routen bleiben erreichbar, nur Sitemap und Index sind sie los.
    // Passend dazu: noindex in den page.tsx dieser Routen.
    '/ehrliches-system',
    '/gruender-schmiede',
    '/gruender-schmiede/*',
    '/steuer-matrix',
    '/steuer-matrix/*',
    '/steuer-matrix-live',
    '/seo-sprint',
    '/eigenregie',
    '/erste-kunden-sprint',
    '/mein-system',
    '/meine-kurse',
    '/profil',
    '/steuer-matrix/rechner',
    '/auth/*',
    '/danke/*',
    '/diplome/urkunde',
    '/diplome/simulation',
    '/diplome/roadmap',
    '/fleischpass',
    '/steak-beichte/diagnose',
    '/steak-beichte/diagnose/*',
    '/mein-protokoll/fragebogen',
    '/mein-protokoll/plan',
    '/prive',
    '/icon.svg',
    '/diplome/profil',
    '/tools/*',
    '/zzp-niche',
    '/zzp-niche/*',
    '/eu-steuervergleich',
    '/eu-steuervergleich/*',
    '/affiliate-disclosure',
    '/agb',
    '/datenschutz',
    '/impressum',
    '/kontakt',
  ],
  // SSR-Seiten (dynamisch wegen Supabase-Preisen) fehlen im Prerender-Manifest
  // → next-sitemap sieht sie nicht. Verkaufs-Landingpages hier explizit aufnehmen.
  additionalPaths: async () => {
    // Stufe-1-Lektionen explizit nachtragen. Sie sind der kostenlose Trichter
    // und muessen im Index bleiben. Nicht auf das Build-Manifest verlassen:
    // die Route teilt sich eine Datei mit den Bezahlstufen, und deren
    // Zugangspruefung kann sie jederzeit wieder dynamisch machen. Frontmatter
    // direkt gelesen, weil diese Datei CommonJS ist und contentlayer ESM.
    const stufe1 = (() => {
      const dir = path.join(__dirname, 'content', 'diplom-lektionen', 'stufe-1');
      let dateien;
      try { dateien = fs.readdirSync(dir).filter((f) => f.endsWith('.mdx')); }
      catch { return []; }
      return dateien.map((f) => {
        const raw = fs.readFileSync(path.join(dir, f), 'utf8');
        const m = raw.match(/^lektionSlug:[ \t]*(.*?)[ \t\r]*$/m);
        const slug = m ? m[1].replace(/^["']|["']$/g, '').trim() : null;
        if (!slug) return null;
        const loc = `/diplome/lernen/stufe-1/${slug}`;
        return { loc, changefreq: 'monthly', priority: 0.7, lastmod: LASTMOD.get(loc) };
      }).filter(Boolean);
    })();

    // 02.09.2026: Gruender-Routen (gruender-schmiede, ehrliches-system, steuer-matrix,
    // eigenregie, erste-kunden-sprint, seo-sprint) hier entfernt — siehe
    // exclude oben. Sie wurden explizit nachgetragen, weil SSR sie aus dem Manifest
    // haelt; ohne diese Zeile fallen sie von allein weg.
    // /hoefe (Hofladen-Radar) rendert dynamisch (Umkreissuche) und fehlte
    // deshalb in der Sitemap, obwohl indexierbar und von jeder Seite verlinkt
    // (SEO-Audit 08.10.2026). /rezepte/community ist raus: noindex, siehe exclude.
    const ssrPaths = [
      '/cut-generator', '/steak-beichte', '/mein-protokoll', '/hoefe',
    ];

    // 03.09.2026: BBQ-News-Beitraege (/bbq-news/<slug>). Die Detailseiten
    // rendern per ISR aus Supabase und stehen deshalb nicht im Prerender-
    // Manifest. Gelesen wird nur status=approved — dieselbe Freigabe-Grenze
    // wie in src/lib/bbq-news.ts. Die Kategorienliste kommt aus
    // src/lib/content-routing.ts (per Regex, weil diese Datei CommonJS ist);
    // eine zweite, handgepflegte Liste wuerde auseinanderlaufen.
    // Ohne Env oder bei Fehler: leer — die Sitemap bleibt gueltig.
    const bbqNews = await (async () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key || typeof fetch !== 'function') return [];
      let cats = [];
      try {
        const src = fs.readFileSync(path.join(__dirname, 'src', 'lib', 'content-routing.ts'), 'utf8');
        const re = /^\s*'?([a-z0-9-]+)'?\s*:\s*\{\s*route:\s*'\/bbq-news'/gm;
        let m;
        while ((m = re.exec(src)) !== null) cats.push(m[1]);
      } catch { return []; }
      if (cats.length === 0) return [];
      try {
        const q = new URLSearchParams({
          select: 'slug,generated_at',
          status: 'eq.approved',
          category: `in.(${cats.join(',')})`,
          slug: 'not.is.null',
          order: 'generated_at.desc',
          limit: '200',
        });
        const res = await fetch(`${url}/rest/v1/content_drafts?${q}`, {
          headers: { apikey: key, Authorization: `Bearer ${key}` },
        });
        if (!res.ok) return [];
        const rows = await res.json();
        return rows
          .filter((r) => r && r.slug)
          .map((r) => ({
            loc: `/bbq-news/${r.slug}`,
            changefreq: 'monthly',
            priority: 0.7,
            lastmod: r.generated_at ? new Date(r.generated_at).toISOString() : undefined,
          }));
      } catch { return []; }
    })();

    return [
      ...ssrPaths.map((loc) => ({ loc, changefreq: 'weekly', priority: 0.8 })),
      ...stufe1,
      ...bbqNews,
    ];
  },
  robotsTxtOptions: {
    additionalSitemaps: [],
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/go/', '/api/'],
      },
    ],
  },
  // Prioritäten nach Content-Typ; lastmod aus den Contentlayer-Daten (s. LASTMOD)
  transform: async (config, path) => {
    // /artikel bleibt draussen, solange kein Artikel freigegeben ist (null = ausschliessen).
    // Die Detailseiten brauchen keine Regel: generateStaticParams erzeugt sie in
    // Produktion gar nicht erst, sie stehen also ohnehin nicht im Manifest.
    if (!ARTIKEL_FREIGEGEBEN && path.startsWith('/artikel')) {
      return null;
    }
    const lastmod = LASTMOD.get(path);
    // Serie als Pillar-Content: gleiche Prioritaet wie Cuts/Methoden.
    if (path === '/fleischwissen' || path.startsWith('/fleischwissen/')) {
      return { loc: path, changefreq: 'monthly', priority: 0.9, lastmod };
    }
    // Pillar Pages: höchste Priorität
    if (path.startsWith('/cuts/') || path.startsWith('/vergleich/') || path.startsWith('/methoden/')) {
      return { loc: path, changefreq: 'monthly', priority: 0.9, lastmod };
    }
    // Artikel
    if (path.startsWith('/artikel/')) {
      return { loc: path, changefreq: 'monthly', priority: 0.8, lastmod };
    }
    // Homepage
    if (path === '/') {
      return { loc: path, changefreq: 'daily', priority: 1.0 };
    }
    return { loc: path, changefreq: config.changefreq, priority: config.priority, lastmod };
  },
};
