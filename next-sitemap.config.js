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
    // tuwasduwillst.de ist eine eigene Marke (Host-Weiche in next.config.mjs):
    // diese Seiten gehoeren nicht in die Steakakademie-Sitemap.
    '/tuwasduwillst',
    '/tuwasduwillst/*',
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
        return slug ? { loc: `/diplome/lernen/stufe-1/${slug}`, changefreq: 'monthly', priority: 0.7 } : null;
      }).filter(Boolean);
    })();

    // 02.09.2026: Gruender-Routen (gruender-schmiede, ehrliches-system, steuer-matrix,
    // eigenregie, erste-kunden-sprint, seo-sprint) hier entfernt — siehe
    // exclude oben. Sie wurden explizit nachgetragen, weil SSR sie aus dem Manifest
    // haelt; ohne diese Zeile fallen sie von allein weg.
    const ssrPaths = [
      '/cut-generator', '/steak-beichte', '/mein-protokoll', '/rezepte/community',
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
  // Prioritäten nach Content-Typ
  transform: async (config, path) => {
    // /artikel bleibt draussen, solange kein Artikel freigegeben ist (null = ausschliessen).
    // Die Detailseiten brauchen keine Regel: generateStaticParams erzeugt sie in
    // Produktion gar nicht erst, sie stehen also ohnehin nicht im Manifest.
    if (!ARTIKEL_FREIGEGEBEN && path.startsWith('/artikel')) {
      return null;
    }
    // Serie als Pillar-Content: gleiche Prioritaet wie Cuts/Methoden.
    if (path === '/fleischwissen' || path.startsWith('/fleischwissen/')) {
      return { loc: path, changefreq: 'monthly', priority: 0.9 };
    }
    // Pillar Pages: höchste Priorität
    if (path.startsWith('/cuts/') || path.startsWith('/vergleich/') || path.startsWith('/methoden/')) {
      return { loc: path, changefreq: 'monthly', priority: 0.9 };
    }
    // Artikel
    if (path.startsWith('/artikel/')) {
      return { loc: path, changefreq: 'monthly', priority: 0.8 };
    }
    // Homepage
    if (path === '/') {
      return { loc: path, changefreq: 'daily', priority: 1.0 };
    }
    return { loc: path, changefreq: config.changefreq, priority: config.priority };
  },
};
