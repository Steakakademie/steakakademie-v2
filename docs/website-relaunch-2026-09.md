# Website-Relaunch 2026-09 — Stand, Entscheidungen, Umschalt-Kriterien

**Angelegt:** 05.09.2026, ergänzt 05.09. abends (Claude, Cowork-Session, Branch `relaunch/2026-09`)
**Quelle des Designs:** `handoff/website-relaunch/README.md` (hifi, verbindlich) + Prototyp
**Abteilung:** 1 · Systems & Ops (Code) — Inhalte der Kataloge gehören zu 3 · Redaktion

## Was gilt

- **Die Alt-Site ist archiviert, nicht gelöscht.** Tag `archiv/website-v1-2026-09`,
  Branch `archiv/website-v1`, Git-Bundle + Verzeichnis-Abbild + Env-Namensliste unter
  `C:\Dev\_archiv\` (dort `ARCHIV-README.md`). Referenz-Kopie von `/` und `/home-b` fürs
  zweite Standbein: `OneDrive\…\Projects\Steakakademie\Archiv-Website-v1\`.
- **Der Relaunch läuft parallel** unter `/relaunch` und `/relaunch/[katalog]`, eigenes
  Layout, `noindex`, Canonical auf `/`. Die Alt-Site (`/`, `/home-b`, alle ~500 Seiten)
  ist unberührt. Kein Feature-Flag nötig, solange der Pfad-Präfix trennt.
- **Launch 01.10.2026 bleibt mit dem heutigen Stand.** Umschalten erst, wenn die
  Kriterien unten grün sind.
- **Keine Slug-Änderungen** beim Umschalten — die URLs der Inhalte bleiben, nur das
  Layout wechselt. Das ist die SEO-Bedingung.

## Was gebaut ist (05.09.2026)

| Teil | Datei(en) | Stand |
|---|---|---|
| Tokens + Komponenten-Klassen | `src/app/relaunch/relaunch.css` | Werte 1:1 aus dem Handoff, gescoped unter `.sk` |
| Schriften | `src/app/relaunch/layout.tsx` | Big Shoulders Display 600–900 + Literata 400/600/i400 via `next/font`, self-hosted |
| Kopfzeile, Fußbereich, Marke | `src/components/relaunch/{Header,Footer,Rauchring}.tsx` | Marke „2b Rauchring", Spickzettel genau einmal |
| Spickzettel-Formular | `src/components/relaunch/SpickzettelForm.tsx` | gegen `/api/newsletter`, mit Einwilligungs-Checkbox (s. u.), source `footer-relaunch` |
| Glut-Animation | `src/components/relaunch/EmberCanvas.tsx` | alle vier Perf-Regeln, Stufe „Ruhig", nur im Hero |
| Startseite | `src/app/relaunch/page.tsx` | alle sieben Abschnitte; Streitfälle aus contentlayer (Redaktionsvorbehalt) |
| Übersicht-Muster | `src/app/relaunch/[katalog]/page.tsx` + `src/components/relaunch/Katalog.tsx` | EIN Muster, vier Kataloge; Filter/Sort/Ansicht ohne Nachladen; Ansicht in `localStorage` |
| Katalog-Daten | `src/lib/relaunch/katalog.ts` | 40 Cuts, 8 Streitfälle, 8 Rezepte, 10 Techniken — Text aus dem Prototyp |
| Diplom-Siegel | `src/components/relaunch/Siegel.tsx` | fünf Stufen, Ringfarben und Füllgrad wie im Prototyp |
| E2E | `tests/e2e/relaunch-uebersicht.spec.ts`, `tests/e2e/relaunch-detail.spec.ts` | 10 Tests: Filter, Sort, Ansicht-Persistenz, Leer/404, Startseite, Portionsrechner, Bezahlschutz, Anzeige-Kennzeichnung, KI-Kennzeichnung |
| Streitfall (Ansicht 3) | `src/app/relaunch/streitfaelle/[slug]/page.tsx` | 8 Artikel aus contentlayer; Nummer aus dem Katalog, Merksatz als Pull-Quote, Entscheidung, Umfrage, FAQ, Schema |
| Rezept (Ansicht 5) | `src/app/relaunch/rezepte/[kategorie]/[slug]/page.tsx` + `Portionen.tsx` | 118 Rezepte, Portionsrechner 1–12, Ablauf, Cut-Atlas-Hinweis, Symbolbild-Kennzeichnung, Recipe-Schema, Affiliate-Bausteine |
| Diplome (Ansicht 7) | `src/app/relaunch/diplome/page.tsx` | 5 Stufen, Stufe 1 mit Lektionsliste, „Der ganze Pfad", Fortschritt lokal |
| Lektion (Ansicht 4) | `src/app/relaunch/diplome/lernen/[stufe]/[lektion]/page.tsx` + `LektionFortschritt.tsx` | 35 Lektionen; Stufe 2–5 nur Anreißer (Bezahlschutz wie live); Balken, Abschluss, Merksatz |
| Werkzeug (Ansicht 6) | `src/app/relaunch/vergleich/[slug]/page.tsx` | 7 Vergleiche; Produktkarten aus der Registry mit „Anzeige" vor dem Klick, `/go/[id]` rel=sponsored |
| Über uns (Ansicht 8) | `src/app/relaunch/ueber-uns/page.tsx` | Prototyp-Text, Weide-Bild (KI, gekennzeichnet), Reifekammer-Platzhalter mit Hinweis, Redaktion mit Persona-Label |
| Lesetext-MDX | `src/components/relaunch/Prose.tsx` | alle MDX-Komponenten der Alt-Seiten (Callouts, AffiliateBox, ProductCard, ComparisonTable, BuyingGuide, BBQPairing) + helle Prose-Stile |
| Suche (Nachtrag 06.09.) | `src/app/relaunch/suche/page.tsx`, `src/components/relaunch/{SucheFeld,MarcoStarter}.tsx`, `src/lib/{suche.ts,relaunch/href.ts}` | Feld in der Kopfzeile, Ergebnisseite mit Bereichs-Filter, Marco als Auffangnetz — dieselbe Suchquelle wie `/suche` |

**Alle acht Handoff-Ansichten sind damit gebaut.** Die Kopfzeile verlinkt Diplome und Über uns
auf die Relaunch-Vorlagen; „Ausrüstung" auf die Live-Übersicht `/vergleich`, weil der Handoff
keine Werkzeug-*Übersicht* entwirft. Cut- und Technik-Detailseiten haben keine Handoff-Vorlage
und bleiben live (Katalog verlinkt dorthin).

**Nebenbefund, autonom behoben (Regel 6 / § 0):** Die Admin-Erkennung stand an sechs Stellen
als `cookie === process.env.ADMIN_PASSWORD`. Fehlt die Variable (Preview ohne Env-Scope,
lokale Kopie, Build-Gate), ist `undefined === undefined` wahr — jeder Besucher wäre Admin,
inklusive Volltext der Bezahl-Lektionen. Jetzt eine Stelle: `src/lib/admin-auth.ts`, ohne
Passwort kein Admin. Aufgefallen, weil in der Cowork-VM Stufe 2 lesbar war.

## Nachtrag 06.09.2026: Suche (im Handoff nicht entworfen)

Auftrag Uwe: *„Was in der neuen Seite fehlt sind die Shop-Produkte und eine Suche. Es gibt
eigentlich eine Suche in Form von der KI Marco. Die Frage ist aber ob die User das checken."*
Die Frage ist berechtigt und die Antwort lautet nein: Ein Chat-Widget unten rechts wird als
Support gelesen, nicht als Suchfeld. Wer „Tomahawk" sucht, sucht ein Feld mit einer Lupe.

**Rollenteilung statt Ersatz.** Die Suche beantwortet *„wo ist X"* — navigierend, exakt,
ohne Wartezeit und ohne Token-Kosten. Marco beantwortet *„was nehme ich für Y"* — beratend,
unscharf. Marco steht deshalb **unter** den Treffern und **an ihrer Stelle**, wenn es keine
gibt; der Knopf öffnet den Chat mit einer vorbereiteten Frage, **schickt sie aber nicht ab**
(kein API-Aufruf ohne Zutun des Besuchers).

**Eine Suchquelle, nicht zwei.** `search()` wurde aus `src/app/suche/page.tsx` nach
`src/lib/suche.ts` gehoben; Alt-Seite und Relaunch nutzen dieselbe Funktion. Zwei Sammel-
Logiken wären zwei Wahrheiten darüber, was auffindbar ist — und der Redaktionsvorbehalt
(`nurVeroeffentlicht`, Art. 50 KI-VO: Entwürfe bleiben unsichtbar) ist genau die Sorte
Regel, die man nicht zweimal pflegen will. Ein E2E-Test vergleicht die Trefferzahl beider
Seiten und schlägt an, wenn sie auseinanderlaufen.

**Gelernt (gehört in § A):** `relaunchHref()` stand in `Katalog.tsx`, einer
`'use client'`-Datei. Ein Server-Bauteil, das eine gewöhnliche Funktion von dort importiert,
bekommt keine Funktion, sondern einen Client-Verweis — die Seite starb zur Laufzeit mit
`(0 , c.s) is not a function`. Im `next build` **unsichtbar**, weil die Suchseite dynamisch
ist und erst beim Aufruf rendert; erst Playwright hat es gefunden. Gemeinsam genutzte Logik
gehört nicht in ein `'use client'`-Modul — sie liegt jetzt in `src/lib/relaunch/href.ts`.
Merksatz: Ein grüner Build beweist bei dynamischen Routen nur die Übersetzung, nicht den Lauf.

**Offen (Uwe):** Die Shop-Produkte aus derselben Nachricht — die Ausrüstungs-*Übersicht*
hat keine Handoff-Vorlage und wartet auf Uwes Blick („außer die Ausrüstungsübersicht, die
ich mir angucken muss"). Bis dahin zeigt „Ausrüstung" in der Kopfzeile weiter auf die
Live-Übersicht `/vergleich`.

## Bewusste Abweichungen vom Prototyp — mit Grund

1. **Einwilligungs-Checkbox im Spickzettel-Formular.** Der Prototyp zeigt nur
   E-Mail-Feld + Knopf. Das Rechts-Audit vom 28.08.2026 verlangt die Checkbox mit dem
   versionierten Wortlaut (`@/lib/newsletter-consent`, § 7 Abs. 2 Nr. 2 UWG).
   Prioritäts-Logik: Recht → Fakten → Marke. Nicht verhandelbar.
2. **Filterleiste klebt UNTER der Kopfzeile** (`top: var(--sk-header-h)`), nicht bei
   `top: 0`. Im Prototyp stehen beide auf `top: 0` — dort verschwindet die Leiste
   hinter dem Header (z-index 20 > 5), sobald sie kleben soll. Ein Defekt des
   Prototyps, kein Gestaltungswille.
3. **Kopfzeile unter 720px nicht sticky.** Ohne Mobile-Navigation (Handoff, offener
   Punkt 2) bricht die Leiste um und ist ~290px hoch — ein Drittel des Bildschirms.
   Bis die Mobile-Nav entworfen ist, bleibt sie auf schmalen Geräten im Fluss. Fällt
   mit dem Mobile-Nav-Entwurf wieder weg.
4. **Karten ohne Detailseite sind keine Links.** Der Prototyp führt jeden Eintrag auf
   dieselbe Beispielseite (offener Punkt 4). Hier: `href` nur, wo die Live-Seite
   existiert (9 von 66 Einträgen, geprüft gegen `content/` und `src/app/`); sonst
   „Detailseite folgt" statt eines toten Links. Kein Link wurde erfunden.
5. **„Ausrüstung"** zeigt auf `/vergleich` (die Vergleichstests), weil `/ausruestung`
   keine Index-Seite hat.
6. **Werkzeuge-Liste auf der Startseite:** „Foodpairing" und „Rezept-Schmiede" aus dem
   Prototyp haben keine Route → ersetzt durch Kerntemperatur-Spickzettel und
   „Rezepte nach Methode". Rückgängig machen, sobald die Routen existieren.
7. **`schwenkgrill-glut.jpg`** liegt im Repo auf 2400px/q85 (1,1 MB statt 10,4 MB).
   Original im OneDrive-Handoff.
8. **Vier Token für WCAG AA angepasst** (gemessen, 22 Paare): gedämpft hell `#7d7166` →
   `#6f655a` (4,08 → 4,9:1), gedämpft dunkel `#7d7166` → `#8f8376` (3,93 → 5,0:1),
   Zählnummer `#c9bfb2` → `#948878` (1,68 → 3,2:1), Akzent als *Text* auf hell `#e2531f` →
   `#bf4210` (3,29 → 4,5:1, Hover `#a33a0d`). Knöpfe und Display-Größen ab 24px fett behalten
   `#e2531f`. Der Handoff verlangt genau das (Punkt 5 „geprüfte Kontraste nachholen");
   Präzedenz ist der `/home-b`-Kontrastfix vom 03.09. Im Handoff-README steht „#e2531f auf
   #15120f erreicht nur 2,9:1" — gemessen sind es 4,88:1; die Regel bleibt trotzdem, weil sie
   Gestaltung ist, nicht Messung.
9. **Umfrage nur mit Supabase-Env.** Der Browser-Client wirft ohne
   `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY` und nimmt die ganze Seite mit — auf Vercel ist die Env da,
   im Build-Gate nicht. Gleiche Regel wie `content-feed.ts`: auf Anwesenheit verzweigen.
10. **Werkzeug: die drei Infokästen** („So haben wir getestet", „Was zählt", „Transparenz")
   enthalten konkrete Methodik-Behauptungen (Eiswasser, 6 h Smoker, ±1 °C), die in den
   Vergleichs-Inhalten nicht stehen — nicht erfunden. `testedCount`/`testDuration` aus dem
   Frontmatter stehen im Kicker.
11. **Rezept: Umsatz-Bausteine der Alt-Seite bleiben**, obwohl der Prototyp sie nicht zeigt:
   Cut-Bestellen und drei Produktkarten als Abschnitt „Dafür brauchst du" (Kennzeichnung in den
   Komponenten). **Nicht übernommen, Entscheidung offen:** CookCoach, AromaPairing, BBQPairing,
   Rezept-Einreichung — der Handoff schweigt dazu.
12. **Lektion: Merksatz statt Kontrollfrage.** Die Lektionen tragen keine Quizdaten; die
   Kontrollfrage des Prototyps wäre erfunden. An ihrer Stelle der prüfungsrelevante `merksatz`.
   Fortschritt lokal (`sk.lektionen`) — Platzhalter, wie im Handoff beschrieben.
13. **Über uns:** Redaktionsliste mit „KI-Persona · fachlich verantwortet von Uwe Yendell"
   (aus `authors.ts`, Art. 50 KI-VO) — steht nicht im Prototyp, darf aber nicht fehlen.

## Was NICHT geprüft wurde (Berichtspflicht § A)

- **Vercel-Preview** — kein Push aus der Cowork-VM möglich; Branch liegt als Bundle vor.
- **Pflicht-Checks in Actions** (P0-Gates, Stille Content-Defekte, Build pruefen) —
  lokal liefen `npm run check`, `legal-guard`, `tsc`, `lint`, `next build`, vitest 96/96,
  Playwright 34/34 (10 neu). Vercel-Preview des ersten Stands (07d3627) war READY, aber
  hinter Deployment Protection — Inhalt nicht von außen gesehen.
- **Eingeloggte Zustände** (Kursstatus „Stufe 1 · 1/7") — nicht angebunden, nur
  Zustand „kein Fortschritt".
- **Kontraste:** rechnerisch geprüft (WCAG-Formel, 22 Paare, Abweichung 8) — kein
  Lighthouse-/axe-Lauf, keine Prüfung der übernommenen Alt-Komponenten (Callouts,
  ProductCard, Umfrage) auf hellem Grund.
- **Fakten in `katalog.ts`:** gegen `data/kerntemperatur-referenz.yaml` abgeglichen, zwei
  Werte korrigiert (Schweinefilet 63 °C, Ziehtemperatur 52 °C). Die Prototyp-Tabelle der
  Garstufen (Rare 48–52 usw.) wurde NICHT übernommen — sie widerspricht der Referenz
  (Medium Rare 54–58) und hat in den Lektionen keine Datenbasis.
- **Startseiten-Doktrin** (CLAUDE.md § 2 Regel 8) gilt für `src/app/page.tsx`; das
  Gate prüft `/relaunch` nicht. Ob die Reihenfolge Value-Prop → HERO → Artikel →
  Mitglieder-CTA auf das neue Layout übertragen wird, entscheidet Uwe.
- **Lighthouse / Bundle-Größe** nicht gemessen (Start 1,74 kB + 136 kB, Rezept 3,3 kB + 140 kB,
  Streitfall 2,6 kB + 207 kB First Load — die Umfrage zieht den Supabase-Client).
- **Bezahlschutz mit gesetztem ADMIN_PASSWORD + Cookie** (Admin sieht Volltext) nicht
  durchgespielt — nur der Fall „kein Admin → nur Anreißer".
- **Safari/iOS** nicht gesehen — nur Chromium headless, 1400px und 390px.
- **Suche (06.09.):** geprüft sind tsc, lint, `npm run check`, legal-guard, `next build`,
  vitest 96/96, Playwright **41/41** (7 neu), 6 Bildschirmfotos ohne Konsolenfehler,
  10 neue Farbpaare rechnerisch AA (4,61–17,05:1). **Nicht** geprüft: Rechtschreibprüfung
  über die neuen Texte (`spell:check` braucht die LanguageTool-API), Verhalten mit
  Tastatur-Kürzel „/" auf Safari, Suche mit sehr langen Anfragen jenseits 80 Zeichen
  (abgeschnitten, nicht getestet), und ob Marco die vorbereitete Frage brauchbar
  beantwortet (kein API-Schlüssel in der VM).

## Umschalt-Kriterien (alle grün, sonst kein Umschalten)

1. Mobile-Navigation entworfen (Uwe/Design) und gebaut
2. Login/Registrierung entworfen und gebaut — Stufe 2+ braucht Konto
3. Cut- und Technik-Detailseite entworfen (keine Handoff-Vorlage); Streitfall/Rezept/Lektion/Werkzeug/Diplome/Über uns sind gebaut
4. ~~Kerntemperaturen in `katalog.ts` gegen die Referenz abgeglichen~~ ✅ 05.09.
5. Lighthouse Mobile ≥ 90, axe-Lauf WCAG AA (rechnerische Token-Prüfung ✅, Komponenten offen)
6. Playwright grün (Bestand + Relaunch), Legal-Guard grün, alle Pflicht-Checks
7. Rechtsseiten inhaltlich byteidentisch, Anwaltstestat unangetastet
8. Sitemap-URLs unverändert
9. Entscheidung zur Startseiten-Doktrin (s. o.)

**Umschalten heißt dann:** `src/app/relaunch/*` nach `src/app/*` heben (Layout wird
Root-Layout, `[katalog]` wird `/cuts` … — die bestehenden Routen bleiben, nur ihr Layout
wechselt), `noindex` entfernen, Vorschau-Leiste entfernen, `AB_HOME`-Middleware
stilllegen. Erst dann wird `/home-b` unerreichbar — und bleibt trotzdem im Archiv.

### Offen: Was aus dem alten Root-Layout mitgeht (Nachtrag 17.09.2026, Entscheidung Uwe)

„Layout wird Root-Layout" ist nicht vollständig beschrieben. `src/app/layout.tsx` trägt heute
mehr als Schriften und Rahmen. Ersetzt das Relaunch-Layout es wörtlich, fällt alles unten
**stillschweigend** weg. Bleibt das Relaunch-Layout dagegen darunter geschachtelt (wie heute
unter `/relaunch`), läuft alles weiter — auch das, was nach dem Handoff wegfallen soll.
Keine der beiden Varianten ist entschieden. Jeder Punkt braucht vor dem Umschalten ein
„mitnehmen" oder „weglassen":

| Teil im alten Root-Layout | Was er tut | Vorschlag, nicht entschieden |
|---|---|---|
| `LayoutExtras` | Marco-Chat + Exit-Intent | mitnehmen — die Relaunch-Suche setzt Marco als Auffangnetz voraus: `MarcoStarter` feuert `sk:marco`, zuhören tut nur `MarcoWidget`, und das lädt ausschließlich `LayoutExtras` |
| `PlausibleScript` | cookielose Reichweite | mitnehmen |
| `WebVitals` | Core Web Vitals → eigene DB | mitnehmen — Kriterium 5 (Lighthouse) braucht danach Felddaten |
| `JsErrors` | Browser-Fehler → eigene DB (Sentry-Ersatz) | mitnehmen |
| `ConsentBanner` + `ClarityScript` | Einwilligung + Clarity nach Opt-in | mitnehmen, Banner auf hellem Grund prüfen (Kontrast) |
| `organizationSchema()`, `websiteSchema()` | globales JSON-LD inkl. SearchAction | mitnehmen — SEO-Bedingung „nichts verlieren" |
| `metadata` (`metadataBase`, `title.template`, Open Graph, Twitter, `robots: index`) | Grund-Metadaten aller Seiten | mitnehmen; das Relaunch-`metadata` (Vorschau-Titel, `noindex`, Canonical auf `/`) **darf nicht** Root werden |
| `MotionProvider` | Reduced-Motion-Vertrag für Framer Motion (`plans/002`) | für Relaunch-Seiten nicht nötig (kein `framer-motion` in `src/app/relaunch`, `src/components/relaunch`, Stand 17.09.); nur für live gebliebene Alt-Seiten und übernommene Alt-Komponenten, die Framer nutzen |
| `globals.css` + Schriften Playfair/Source Serif/DM Sans, `html`-Hintergrund `#17100B` | Alt-Design | nicht mitnehmen für Relaunch-Seiten — **aber** Cut- und Technik-Detailseiten bleiben vorerst live im Alt-Design (Kriterium 3) und brauchen es, solange es sie gibt |
| `EmberGlow` | reaktiver Glut-Schein auf **jeder** Seite (`position: fixed`, `z-index: 1`) | weglassen — Handoff: die Glut im Hero (`EmberCanvas`) ist das *einzige* bewegte Element. Heute nur verdeckt (`relaunch.css:59`, `.sk { z-index: 2 }`), der Scroll-Listener läuft unsichtbar weiter |
| `SmokeEffect.tsx` (nicht eingebunden) | Revert-Reserve für `EmberGlow` | mit `EmberGlow` löschen (bleibt im Archiv-Tag) |

Folgearbeit beim Weglassen von `EmberGlow`: den `z-index`-Kommentar in `relaunch.css:59`
anpassen und `plans/006` als überholt markieren.

## Branch nachziehen (Uwe, eigenes Terminal)

`relaunch/2026-09` liegt seit 05.09. auf origin (07d3627). Die Folge-Commits (Ansichten 3–8,
Admin-Härtung, Kontraste, Merge mit main) liegen im Bundle `C:\Dev\_archiv\relaunch-2026-09.bundle`:

```powershell
cd C:\Dev\steakakademie-v2
git fetch C:\Dev\_archiv\relaunch-2026-09.bundle relaunch/2026-09:relaunch/2026-09
git push origin relaunch/2026-09
gh pr create --base main --head relaunch/2026-09 --title "Relaunch 2026-09: alle acht Ansichten parallel unter /relaunch + Admin-Härtung" --body-file docs/website-relaunch-2026-09.md
```

Der Branch enthält bereits den Merge von `origin/main` (d40ea79) — „Require branches to be up
to date" ist damit erfüllt, solange main sich nicht weiterbewegt. Vercel baut die Vorschau unter
`<preview>/relaunch`. Der PR verändert an der Live-Site nur eines: die Admin-Härtung
(`src/lib/admin-auth.ts`) — die ist gewollt und wirkt sofort.
