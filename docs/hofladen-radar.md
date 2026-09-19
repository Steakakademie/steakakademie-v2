# Hofladen-Radar (`/hoefe`) — Konzept, Entscheidungen, Betrieb

**Angelegt:** 13.09.2026 (Claude, Cowork-Session, Branch `feat/hofladen-radar`)
**Abteilung:** 1 · Systems & Ops (Code, Import) — Position/Text gehören zu 4 · Wachstum
**Auftrag:** Uwe, 13.09.2026 — Briefing-Paket „Hofladen-Radar für Direktvermarkter von Fleisch"

## Was es ist

Umkreissuche nach Hofläden/Direktvermarktern in Deutschland, Österreich und der Schweiz (seit 19.09.2026) — Ort oder PLZ eingeben,
Radius 10/25/50/100 km, Filter „nur Höfe mit belegtem Fleischangebot", Trefferliste
mit Entfernung, Karte (Klick-zum-Laden), Profilseite je Hof (`/hoefe/[slug]`).
Datenbasis: OpenStreetMap `shop=farm`, wöchentlich importiert. **Stand 13.09.2026
(Trockenlauf gegen Overpass):** 6.734 Elemente, 5.975 mit Namen (= importierbar),
378 mit belegtem Fleischangebot, 3.470 mit PLZ + Ort, 1.329 Bio, 3.199 mit Website.

## Position auf der Website — Entscheidung 13.09.2026

Der Radar schließt die Lücke „Woher bekomme ich gutes Fleisch?" — die Site deckt Cuts →
Technik → Wissen → Rezepte → Ausrüstung ab, aber nirgends Bezug. Deshalb:

1. **Eigene Route `/hoefe`** als Werkzeug in der Cuts-Säule (Breadcrumb Start → Cuts →
   Hofladen-Radar). SEO: lokale Suchen „Hofladen Fleisch + Ort". Claim/Premium (im
   Schema angelegt) braucht eigene Profilseiten.
2. **Kontext-Einstiege mit Kaufintention:** `HofladenHinweis` in der Sidebar jeder
   Cut-Detailseite (`/cuts/[slug]`, unter der Produkt-Empfehlung) und unter jedem
   Fleisch-Rezept (RecipeTemplate, nach `CutBestellen`). Kein Affiliate → keine
   Werbekennzeichnung nötig.
3. **Startseite:** vierte Kachel in der Werkzeuge-Sektion (`ToolBoxes.tsx`, Grid 2/4) —
   Abschnittsreihenfolge unverändert, das Hierarchie-Gate ist nicht berührt.
   Relaunch-Startseite: vierte Zeile in „Werkzeuge".
4. **Footer** Gruppe „Cuts": „Hofladen-Radar".
5. **Nicht in die Hauptnavigation** — acht Einträge sind voll; erst wenn Traffic belegt ist.
6. **Keine eingebettete Karte auf der Startseite:** Leaflet + Kacheln kosten LCP auf der
   wichtigsten Seite, und Kacheln von Dritten brauchen Consent.

## Abweichungen vom Briefing — und warum

| Briefing | Umgesetzt | Grund |
|---|---|---|
| PostGIS `GEOMETRY(Point)` | `lat`/`lng` double + btree, Haversine in SQL (`hoefe_im_umkreis`) | PostgREST liefert Geometrie als WKB-Hex, nicht `POINT(lon lat)` — der Regex im Briefing hätte **jeden** Marker auf `null` gesetzt. 6.000 Punkte brauchen keine Extension; Bounding-Box + Haversine reicht (lokal gemessen: Function Scan, sofort). |
| RLS `SELECT USING (true)` auf der Tabelle | Tabelle ohne Client-Grant; View `hoefe_public` (security_invoker) mit Spalten-Whitelist + Column-Grant | `USING (true)` hätte `email`, `inhaber_user_id`, `osm_tags` offengelegt. Lokal geprüft: `SELECT email FROM hoefe` als anon → permission denied. |
| Wöchentlicher `upsert` über alles | `hoefe_import_upsert()` überspringt `beansprucht = true` | Sonst überschreibt der Import jede Woche die Angaben eines zahlenden Inhabers. Lokal geprüft: 1 beanspruchter Hof bleibt bei zwei Importläufen unverändert. |
| Overpass `produce~"(?i)(meat…)"` | `nwr["shop"="farm"]`, Fleisch-Flag aus Tags abgeleitet (`fleischAusTags`) | `(?i)` ist in Overpass ein **statischer Fehler** (belegt 13.09.) — die Edge Function hätte nie ein Ergebnis geliefert. Mit korrektem `,i` wären es nur 113 Treffer statt 378; `produce` ist in DE selten getaggt. |
| Supabase Edge Function (Deno) | `scripts/hoefe-import.mjs` + `.github/workflows/hoefe-import.yml` (Mo 03:30 UTC) | Alle Importe im Repo laufen als Actions-Cron mit denselben zwei Secrets; eine dritte Laufzeit nur hierfür wäre Ballast. Overpass-Hauptinstanz antwortet unter Last 503 → drei Instanzen, zwei Runden. |
| `@supabase/auth-helpers-nextjs` | `@supabase/supabase-js` mit anon-Key (Muster `content-feed.ts`) | Paket ist deprecated, Repo nutzt `@supabase/ssr`; für rein öffentliche Daten reicht anon. Ohne Env liefert alles leer (Build-Gate). |
| `tile.openstreetmap.org` | MapTiler (`NEXT_PUBLIC_MAPTILER_KEY`), Stil `streets-v2-dark` | OSM-Tile-Usage-Policy verbietet Produktivnutzung ohne eigenen Provider. |
| Karte sofort laden | Klick-zum-Laden, „Immer laden" in `localStorage` (`sa-karte-v1`), Widerruf unter der Karte | IP-Übertragung an Dritte = Einwilligung (Art. 6 Abs. 1 lit. a). Datenschutz § 6a ergänzt, CSP `img-src`/`connect-src` um `api.maptiler.com`, `Permissions-Policy geolocation=(self)`. |
| Marker-PNGs von cdnjs | CSS-DivIcons (`globals.css`, `.hof-marker`) | CSP erlaubt keine Dritt-Bilder; Markenfarben statt Leaflet-Blau. |
| `/hoefe/${slug}` ohne Seite | `src/app/hoefe/[slug]/page.tsx` (ISR 1 h, kein generateStaticParams) | Popup-Links wären 404 gewesen. Unbestätigte Profile sind `noindex, follow` — 6.000 Thin-Content-Seiten würden die Domain belasten; Index erst mit `beansprucht`. |
| Filter-Checkbox ohne State, `limit(100)`, keine Clusterung | Umkreis-RPC mit `p_nur_fleisch`, max. 200 Treffer sortiert nach Premium → Entfernung | Deutschlandweite Vollkarte wäre unbrauchbar; die Suche ist immer lokal. |
| `slate`/`amber`, helles Design | Site-Tokens (`brand-gold`, `brand-fire`, `surface-*`), dunkel wie die Live-Site | Marken-DNA (§ 2 Regel 3). Der Relaunch bekommt den Radar, sobald dort Cut-Detail entworfen ist. |

## Betrieb

- **Migration:** `supabase/migrations/20260913120000_hoefe.sql` — anwenden per
  `supabase db push` (Uwe) bzw. claude.ai-Connector. Nicht über den lokalen MCP.
- **Erstimport:** Workflow „Hofladen-Radar importieren" manuell starten (Dry-Run
  zuerst). Danach Montag 03:30 UTC automatisch. Secrets liegen bereits vor
  (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
- **MapTiler:** Free-Tier-Key anlegen (cloud.maptiler.com), auf `steakakademie.de`
  + Preview-Domain beschränken, als `NEXT_PUBLIC_MAPTILER_KEY` in Vercel (alle
  Scopes). Ohne Key: Trefferliste läuft, Karte zeigt „nicht freigeschaltet",
  Geocoding fällt auf Nominatim zurück (1 Anfrage/s — nur Notnagel).
- **Claim-Flow** ist bewusst nur Schema (`beansprucht`, `premium`, `inhaber_user_id`,
  `premium_bis`) + Kontaktformular (Betreff „hofladen", Slug im Nachrichtentext,
  Tag `[Hofladen]`). Bestätigung setzt Uwe manuell per SQL, bis ein Admin-Flow
  gebaut ist. **Vor** einem Premium-Angebot: Preis, AGB-Absatz, Rechnungsweg (GoBD).
- **Datenqualität:** „Fleisch belegt" heißt: ein OSM-Tag nennt Fleisch. „Nicht
  bestätigt" heißt nur „keine Angabe" — die Texte sagen das ausdrücklich (Regel 7).
  Öffnungszeiten sind der rohe `opening_hours`-String.

## Angewendet auf der Produktion (13.09.2026)

Migration `20260913120000_hoefe` liegt auf der echten Instanz (`bbgdrzhlellxzggbbqcm`,
PG 17.6) — angewendet über den claude.ai-Supabase-Connector nach Uwes Freigabe.
Belegt, nicht behauptet:

- Tabelle, View, beide Funktionen, 6 Indizes vorhanden, RLS aktiv.
- `anon` darf `name` lesen, `email` **nicht** (`has_column_privilege` je geprüft);
  `hoefe_import_upsert` ist für `anon` nicht ausführbar, `hoefe_im_umkreis` schon.
- Haversine gegengerechnet: 51,27/7,19 → 51,29/7,21 liefert 2,623 km, unabhängige
  Rechnung 2,62 km.
- Ende-zu-Ende über die Live-Seite mit einer Probe-Zeile: Geocoding (Nominatim,
  kein MapTiler-Key) → RPC → Trefferliste mit Entfernung. Probe-Zeile danach
  gelöscht, Tabelle steht wieder auf 0.
- `/api/hoefe` direkt aufgerufen antwortet `{"error":"Nur same-origin"}`.

Offener Nachtrag: `20260913140000_hoefe_touch_search_path.sql` — der Supabase-Linter
meldete `hoefe_touch_geaendert()` als einzige der drei Funktionen ohne festes
`search_path`. Datei liegt im Repo, **noch nicht angewendet**.

## Nicht geprüft (13.09.2026)

- Der Import gegen die echte Instanz (nur lokaler Trockenlauf gegen Overpass und
  lokaler Upsert gegen PG 16). Die Tabelle ist noch leer — bis der Workflow
  einmal läuft, findet die Suche nichts.
- MapTiler-Kacheln und Geocoding **mit Key** — kein Key in der Session; Stil-ID
  `streets-v2-dark` und Geocoding-Antwortformat sind aus der Doku, nicht aus einem Lauf.
- Playwright-E2E für `/hoefe` (Seite braucht Supabase-Env für Zahlen; Formular und
  Consent-Overlay rendern auch ohne). Vitest: 12 Tests grün.
- Verhalten des Import-Workflows in GitHub Actions (nur lokaler Trockenlauf +
  Upsert gegen PG 16 mit den 5.974 echten Zeilen).

## Erweiterung DACH (19.09.2026)

- Overpass-Abfrage: `area["ISO3166-1"~"^(DE|AT|CH)$"]` statt nur DE; Plausibilitäts-Box `imDachRaum()` (45,5–55,5° N / 5,5–17,5° O) in `scripts/lib/hoefe-osm.mjs` und `src/lib/hoefe/geocode.ts` — beide gleich halten.
- Geocoding: MapTiler `country=de,at,ch`, Nominatim `countrycodes=de,at,ch`. Reine PLZ: 5-stellig → DE, 4-stellig → AT/CH (mehrdeutig, z. B. 1010 Wien vs. 1010 Lausanne — der Geocoder nimmt den bekanntesten Treffer, das Label zeigt das Land; Nominatim-Test: 1010 → Wien, 8001 → Zürich, 6020 → Innsbruck).
- Karte: maxBounds Ost auf 17,5° (Burgenland).
- Keine DB-Änderung nötig (Umkreis-RPC ist länderneutral). AT/CH-Höfe erscheinen nach dem nächsten Import-Lauf.
