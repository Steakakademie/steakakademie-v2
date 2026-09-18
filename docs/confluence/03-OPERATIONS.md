# [OPERATIONS] — Plattform, Tech-Stack & aktive Kampagnen

> Quelle: `CLAUDE.md` → `[technik]`/`[tools]`, `STATUS.md`, `ROADMAP.md`, Supabase (Projekt `bbgdrzhlellxzggbbqcm`).

## Stack

- **Frontend:** Next.js 14 App Router, TailwindCSS, Framer Motion, Contentlayer2, TypeScript.
- **Hosting/Deploy:** **Vercel** (Auto-Deploy via GitHub `main`) — kanonisch. Domain `steakakademie.de` (GoDaddy), DNS via Cloudflare (NS `rohin`/`zita.ns.cloudflare.com`), A-Records zeigen auf Vercel; `www` läuft über Cloudflare proxied auf Vercel und wird per `vercel.json` 308 auf die Apex-Domain umgeleitet.
  - Korrigiert 13.08.2026: Hier stand bis dahin „Netlify (Auto-Deploy) + Vercel (verknüpft)". Das war seit der Umstellung falsch herum — belegt durch `server: Vercel` + `x-vercel-id` in der Live-Antwort. Vgl. `compliance/website-rechtscheck.yaml` §3, das Vercel bereits am 07.06.2026 als Host korrigiert hatte.
  - **Netlify: abgebaut am 13.09.2026.** Site `steakakademie-de` baute aus demselben Repo mit. Die frühere Notiz „Builds gestoppt" (13.08.2026) war überholt — Netlify hat weitergebaut, bis das Team am 13.09.2026 das Build-Minuten-Kontingent des Free-Plans aufgebraucht hatte. `netlify.toml` liegt **nicht** mehr im Repo (Stand 13.09.2026 geprüft: keine Netlify-Datei, keine Netlify-Abhängigkeit, kein Netlify-Schritt in den Workflows). Achtung, weiterhin offen bis zur Löschung im Dashboard: Die Kopie `steakakademie-de.netlify.app` war am 13.09.2026 online und lieferte `meta-robots: index, follow` — eine crawlbare Zweitfassung; gegen Duplicate Content schützt allein das Canonical-Tag auf die Hauptdomain. Restschritte (nur im Netlify-Dashboard bzw. GitHub möglich): Site löschen oder Repo-Verbindung trennen, danach die Netlify-GitHub-App entfernen — erst dann fallen die Netlify-Checks an PRs weg.
- **Auth/DB:** Supabase (Auth Magic Link/OTP + OAuth PKCE, PostgreSQL, RLS, Storage). Dual-path callback `src/app/auth/callback/route.ts`.
- **E-Mail:** Loops.so (transaktional + Newsletter); 8 Aliases @steakakademie.de via Cloudflare Email Routing.
- **KI-Bild:** **fal.ai (FLUX.1 dev) = EINZIGER Bildgenerator.** Higgsfield verbannt (03.06.2026).
- **Analytics:** GA4 `G-MP7TY25SL5`; Google Search Console `sc-domain:steakakademie.de`.

## Supabase-Schema (10 Tabellen, alle RLS-aktiv)

| Tabelle | Zweck | Zeilen |
|---------|-------|--------|
| `courses` | Kurs-Definitionen | 4 |
| `digistore_products` | Produkt-Mapping (Digistore↔Kurs) | 4 |
| `digistore_orders` | Bestellungen (Webhook) | 8 |
| `bookings` | Course-Grants | 1 |
| `course_progress` | Lernfortschritt | 0 |
| `protokolle` | Mein-Protokoll-Pläne | 3 |
| `diagnosen` | Steak-Beichte-Diagnosen | 1 |
| `diagnose_credits` | Credit-Guthaben | 1 |
| `widerrufe` | Widerrufe (Verbraucherrecht) | 4 |
| `profiles` | öffentliche Profile (slug) | 1 |

**Security (gehärtet 03.06.):** `search_path` auf 4 PL/pgSQL-Funktionen fixiert, `rls_auto_enable()` EXECUTE revoked. ⚠️ Offen: Leaked-Password-Protection deaktiviert → KAN-16.

## Digistore24-Produkte

**Stand 03.09.2026, direkt über die Digistore24-API geprüft** (`listProducts`). Die vorherige
Fassung dieser Tabelle war an drei Stellen falsch — sie führte 695894 und 695900 als
„deaktiviert bis Substanz". Beide sind im Konto aktiv, 695894 und 695900 sind sogar für
DS-de **genehmigt**. Wer eine Statusangabe hier ändert, prüft sie vorher gegen die API.

| ID | Produkt | Preis | Digistore: aktiv | Digistore: DS-de | Verkaufsseite | Checkout im Code |
|----|---------|-------|---|---|---|---|
| 696394 | Steak-Beichte (KI-Diagnose, Credits) | 7 € / 25 € (5er) | ✅ Y | ✅ genehmigt | `/steak-beichte` (indexiert) | ✅ an |
| 696396 | Mein Protokoll (8-Wochen-Plan) | 19 € / 29 € | ✅ Y | ⏳ „neu" | `/mein-protokoll` (indexiert) | ✅ an |
| 696399 | BBQ-Grundkurs | 79 € / 127 € | ✅ Y | ⏳ „neu" | `/bbq-grundkurs` (indexiert) | ❌ keine ID im Code |
| 695894 | Gründung-Sprint | 99 € | ✅ Y | ✅ genehmigt | `/gruender-schmiede` (**noindex**) | ❌ **aus, 03.09.2026** |
| 695900 | Eigenregie (bis 07.09.2026 „Agentur-Killer-Sprint") | — | ✅ Y | ✅ genehmigt | `/eigenregie` (**noindex**) | ❌ bewusst aus |
| 695797 | Steuer-Matrix | — | ✅ Y | ✅ genehmigt | `/steuer-matrix` (**noindex**) | ❌ **aus, 03.09.2026** |

⚠️ **Regel:** Jedes Course-Produkt braucht `courses`-Zeile + `digistore_products`-Mapping, sonst kassiert es ohne Auslieferung. Reaktivierung: **erst Substanz, dann Checkout** — nie umgekehrt.

### Gründung-Sprint (695894) — Checkout stillgelegt am 03.09.2026

Die drei Gründer-Seiten wurden am 02.09. deindexiert und aus Navigation und Footer ausgebaut
(`63a08d4`, `641b346`) — GF3 wird nicht vermarktet, bevor GF1 liefert. **Der Checkout war dabei
nicht mitgenommen worden.** Live nachgewiesen am 03.09.: `/gruender-schmiede` zeigte einen
„Jetzt kaufen"-Button auf `checkout-ds24.com/product/695894`, ein „Jetzt für 99 € starten"
und `availability: InStock` im Product-Schema. `noindex` heißt nur „nicht in Google" — die
Seite lieferte 200 und war über die URL kaufbar.

**Entscheidung Uwe, 03.09.2026, wörtlich:** „Gründung-Sprint bleibt aus, dazu haben wir bereits
ein anderes Produkt entwickelt."

Gemeint ist das Konzept **„Zweites Standbein: Websites für Lebensmittelhandwerk"**
(`Projects\Steakakademie\Zweites-Standbein-Websites-Konzept.md`, Stand 30.08.2026).
Es benennt diese Abschaltung selbst als Auslöser: *„Das Ehrliche System verschwindet von
steakakademie.de … Die dort steckende Arbeit wandert in ein eigenes Angebot."*

**Wichtig für die Statusbewertung:** Das Konzept ist ausdrücklich **Konzeptstand, nicht
validiert** — es gibt dafür weder Code noch Website noch Digistore-Produkt (API-Stand
03.09.2026: sechs Produkte, alle aus dem Bestand). Der Gründer-Bereich ist also nicht durch
ein laufendes Angebot abgelöst, sondern vorerst nur stillgelegt. Wer hier später liest: Die
alten Seiten liegen unverlinkt und auf `noindex` herum — das ist eine Zwischenlösung, kein
Zielzustand. Sobald das Nachfolgeangebot steht, gehören sie entweder dorthin weitergeleitet
oder entfernt.

Stillgelegt wurden **beide** Kaufwege, nicht nur einer:
1. `src/app/mein-system/page.tsx` — `checkoutUrl` auf `null`, wie bei 695900.
2. `src/app/gruender-schmiede/page.tsx` — Kaufbutton entfernt (nicht per CSS versteckt: ein
   ausgeblendeter Link bleibt klickbar und im HTML auffindbar), Sprung-CTA „Jetzt für 99 €
   starten" entfernt, Preis und „Sofortzugang" entfernt (Preisangabe neben einem nicht
   buchbaren Angebot ist irreführend), Product-Schema von `InStock` auf `Discontinued` ohne
   Preis. An die Stelle des Buttons tritt ein sachlicher Hinweis, dass das Angebot abgelöst ist.

Das Produkt bleibt in Digistore aktiv und genehmigt — es wird nur nicht mehr angeboten.
Wiedereinschalten: siehe Kommentare an beiden Stellen im Code, und erst nach verifizierter
Auslieferung (`courses`-Zeile + `digistore_products`-Mapping).

### Steuer-Matrix (695797) — Checkout stillgelegt am 03.09.2026

**Entscheidung Uwe, 03.09.2026:** „Steuer-Matrix ebenfalls unsichtbar schalten."

- `src/app/mein-system/page.tsx` — `checkoutUrl` auf `null`.
- `src/app/steuer-matrix/page.tsx` — **zwei** Kauf-CTAs entfernt (Hero und Lock-Overlay über
  der Ländertabelle), Preis und „sofortiger Zugang" / „Sofortzugang nach Kauf" raus,
  Product-Schema `InStock` → `Discontinued` ohne Preis, Preisabruf aus Supabase entfernt.

Beide Buttons zeigten ohnehin nur auf den Anker `#kaufen`, dessen `id` am zweiten Button selbst
hing — ein Kaufversprechen mit Preis, das ins Nichts führte. Der eigentliche Kauf lief allein
über `/mein-system`.

**Käufer behalten ihren Zugang.** Das läuft über `hasAccess` (Abfrage auf `bookings` +
`courses.slug = 'steuer-matrix'`) und ist von der Stilllegung unberührt: Wer gekauft hat, sieht
weiterhin „Zum Rechner", das Lock-Overlay erscheint nur für alle anderen.

✅ **Beantwortet am 04.09.2026 — direkt in der Produktionsdatenbank** (über den
claude.ai-Supabase-Connector; der lokale MCP antwortet weiterhin `Unauthorized`):

| `courses.slug` | Preis | published | `digistore_products`-Mapping | Bookings |
|---|---|---|---|---|
| steuer-matrix | 197 € | ja | 1 | **2** |
| gruender-schmiede | 99 € | ja | 1 | 1 |
| mein-protokoll | 0 | nein | 1 | 2 |
| steak-beichte | 0 | nein | 1 | 1 |
| bbq-grundkurs | 0 | nein | 1 | 1 |

Beide stillgelegten Produkte **hätten ausgeliefert** — Kurszeile und Mapping sind vorhanden.
Die Regel „erst Substanz, dann Checkout" war also erfüllt; die frühere Doku-Angabe
„deaktiviert bis Substanz" war in beiden Fällen falsch. Die Abschaltung bleibt trotzdem
richtig, aber aus dem Grund, den Uwe genannt hat (Produkt abgelöst), nicht wegen fehlender
Auslieferung. **Steuer-Matrix hat zwei Buchungen** — deshalb war es richtig, `hasAccess`
nicht anzufassen: diese Käufer behalten ihren Rechner.

Nebenbefund: `bbq-grundkurs` hat eine Buchung, obwohl `published: false` und Preis 0 — vermutlich
ein Testkauf aus der Einrichtung (Digistore 696399 steht auf „neu"). Bei Gelegenheit prüfen,
ob das eine echte Person ist.

### Nebenbefund: `InStock` ohne Kaufweg (03.09.2026 behoben)

Beim Durchgehen aller Gründer-Seiten fiel auf, dass drei weitere Product-Schemas
`availability: InStock` meldeten, obwohl es dort keinen Kaufweg gibt:

| Seite | vorher | jetzt | Grund |
|---|---|---|---|
| `/eigenregie` (damals `/agentur-killer-sprint`) | InStock | `Discontinued`, seit 04.09.2026 `PreOrder` | 695900 existiert, Checkout bewusst aus |
| `/erste-kunden-sprint` | InStock | `PreOrder` | kein Digistore-Produkt, nie verkauft |
| `/seo-sprint` | InStock | `PreOrder` | kein Digistore-Produkt, nie verkauft |

Auf den beiden Sprint-Seiten stand zusätzlich je ein „Jetzt kaufen"-Button mit Preis und
„Sofort verfügbar nach Kauf" — beide zeigten auf `#kaufen` ins Leere. Entfernt.
`/ehrliches-system` nutzte bereits korrekt `PreOrder`.

**Merksatz:** Sichtbarkeit und Kaufbarkeit sind zwei verschiedene Schalter. Wer einen Bereich
deindexiert, hat den Verkauf noch nicht abgeschaltet — dazu gehören Checkout-Links, Sprung-CTAs
mit Preis, die Preisangabe selbst, Zugangsversprechen („Sofortzugang") und `availability` im
Schema. Und Buttons werden entfernt, nicht per CSS versteckt: ein ausgeblendeter Link bleibt
klickbar und im HTML auffindbar.

## Aktive Ops-Blocker (auf Uwe) → Jira

KAN-9 (Prod-Migrations) · KAN-10 (Danke-URLs) · KAN-11 (Webhook-URLs) · KAN-12 (Env-Vars — **in Vercel**, nicht Netlify; der Jira-Titel nennt ggf. noch Netlify) · KAN-13 (Testkauf-Verifikation) · KAN-15 (ADMIN_PASSWORD rotieren).

## GitHub Actions (Repo `vecmahr/steakakademie-v2`)

`auto-fix.yml` (verwaist) · `check-affiliate-links.yml` (Mo 08:00) · `glossary-grow.yml` (So 03:00) · `recipe-grow.yml` (So 03:30). Scripts: `glossary-agent.mjs`, `recipe-agent.mjs`, `recipe-images.mjs`, `check-affiliate-links.mjs`, `cron-scout.mjs`, `fetch-pa-api-images.mjs`.

## Rechtssicherheit-Gate (HART)

Keine selbst/mit-KI gebaute Seite geht live ohne bestandenen Tiefen-Rechtsscan (Impressum, DSGVO, AGB, Widerruf + **Widerrufsbutton ab 19.06.2026**, Cookie-Consent, PAngV, Schema). Bis Freigabe: `noindex`/Coming-Soon. Katalog: `compliance/website-rechtscheck.yaml` (21 Komponenten).
