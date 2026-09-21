# GEO-Baseline — Nullpunkt für Erfolgsmessung

> Zweck: dokumentierter Ist-Stand VOR den Entity-/GEO-Maßnahmen. Bei jedem Re-Check
> neue Spalte/Zeile ergänzen, nie überschreiben.

## Messung 1 — 07.07.2026 (Baseline)

### Google (klassische Suche)

⚠️ Methodik-Hinweis: erhoben via US-basierter Websuche — deutsche SERP kann leicht
abweichen. Für den Trend reicht es; ideal wäre zusätzlich 1 manueller Check aus DE
(Inkognito) mit Screenshot.

| Query | steakakademie.de in Top 10? | Wer rankt stattdessen (Top 3) |
|---|---|---|
| „Kerntemperatur Steak" | ❌ nein | Grillfürst, grillclub.amainfo.at, Block House |
| „Kerntemperatur Steak medium Tabelle" | ❌ nein | Block House, Grillfürst, Grillcenter Nord |
| Brand-Query „steakakademie.de Kerntemperatur" | ✅ Platz 1 (/temperatur-guide) | — |

**Befund:** /temperatur-guide ist indexiert und rankt auf Brand-Queries, hat aber
**null generische Sichtbarkeit** auf dem Kern-Keyword. Gegner = Händler mit
Domain-Autorität (Grillfürst, Block House, Weber, Santos). Deckt sich mit der
GEO-Doktrin: Backlinks + Entity fehlen, Content allein reicht nicht.

### AI-Suche (manuell von Uwe zu erheben — je ~5 Min)

Frage jeweils wörtlich: **„Was ist die richtige Kerntemperatur für ein Steak medium?"**

| Plattform | Datum | Steakakademie zitiert/erwähnt? | Wer wird zitiert? | Screenshot abgelegt? |
|---|---|---|---|---|
| ChatGPT | 07.07.2026 | ❌ nein | niemand — antwortete aus Modellwissen, Quellen-Panel: „Keine weiteren Quellen gefunden" (Medium 55–57 °C) | ✅ |
| Perplexity | 07.07.2026 | ❌ nein | 10 Quellen, u. a. Fleisch24.at, Grillfürst, grillclub.amainfo, initiative-tierwohl (Medium 57–60 °C) | ✅ |
| Google AI Overview (google.de, DE-Standort Wuppertal) | 07.07.2026 | ❌ nein | KI-Übersicht zitiert Block House (+4), Grillcenter Nord, Initiative Tierwohl (55–60 °C) | ✅ |

**Zusatzbefund dt. SERP (echter DE-Standort, ersetzt US-Caveat oben):** Organisch Top 10
ebenfalls ohne steakakademie.de — Grillfürst #1, Block House #2, dann YouTube-Videos,
AMA-Grillclub, Little London, Initiative Tierwohl, Grillcenter Nord, Oberpfalz-Beef,
Bell Schweiz. AI-Overview-Quellen ⊂ SERP-Gewinner → GEO folgt SEO, wie in der Doktrin.

Screenshots nach `docs/geo-baseline-screenshots/` (gitignoren falls groß).

## Messung 2 — 04.08.2026 (Re-Check +4 Wochen)

Maßnahme seit Baseline: Wikidata-Item **Q140455747** live + in `sameAs` des
Organization-Markups verdrahtet (Commit `bf19328`).

### Google (klassische Suche)

⚠️ Methodik-Hinweis: erneut via US-basierter Websuche erhoben (gleiche Methodik wie
Baseline-Tabelle oben, damit vergleichbar). DE-Standort-Gegencheck durch Uwe steht aus.

| Query | steakakademie.de in Top 10? | Wer rankt stattdessen (Top 3) | Δ ggü. Baseline |
|---|---|---|---|
| „Kerntemperatur Steak" | ❌ nein | Grillfürst, Little London, grillclub.amainfo.at | unverändert (Block House aus Top 3 gerutscht) |
| „Kerntemperatur Steak medium Tabelle" | ✅ **ja — Platz 3** (`/temperatur-guide`, Titel „Kerntemperaturen Fleisch — Komplette Tabelle 2026") | Beefbandits, Grillfürst, **steakakademie.de** | 🟢 **erster generischer Treffer überhaupt** (Baseline: ❌) |
| Brand-Query „steakakademie.de Kerntemperatur" | (nicht erneut geprüft) | — | — |

**Befund:** Erster nicht-Brand-Treffer. Die Long-Tail-Variante mit „Tabelle" rankt,
das Kopf-Keyword „Kerntemperatur Steak" weiter nicht. Konkurrenzfeld unverändert:
Händler/Marken mit Domain-Autorität (Grillfürst, Block House, Beefbandits,
Grillcenter Nord). Neu im Feld: beefbandits.de, rewe.de, tastybits.de.

### AI-Suche (manuell von Uwe zu erheben — je ~5 Min)

Frage jeweils wörtlich: **„Was ist die richtige Kerntemperatur für ein Steak medium?"**

| Plattform | Datum | Steakakademie zitiert/erwähnt? | Wer wird zitiert? | Screenshot abgelegt? |
|---|---|---|---|---|
| ChatGPT | — | — | — | ☐ |
| Perplexity | — | — | — | ☐ |
| Google AI Overview (google.de, DE-Standort Wuppertal) | — | — | — | ☐ |

Screenshots nach `docs/geo-baseline-screenshots/`.

## Messung 3 — 09.08.2026 (Re-Check, automatisierter Lauf)

> Hinweis: Die geplante „Messung 2 (+4 Wochen)" wurde bereits am 04.08.2026 erhoben
> (siehe oben). Dieser Lauf ist daher als **Messung 3** ergänzt, nicht überschrieben.

Maßnahme seit Baseline unverändert: Wikidata-Item **Q140455747** live + in `sameAs`
des Organization-Markups verdrahtet (Commit `bf19328`). **Keine neue Maßnahme seit
Messung 2** — dieser Lauf misst nur Stabilität.

### Google (klassische Suche)

⚠️ Methodik-Hinweis: erneut via US-basierter Websuche (gleiche Methodik wie Messung 1+2).
Die Werkzeug-Ausgabe liefert eine Ergebnis-Liste, **keine exakten SERP-Positionen** —
„Platz" = Rang innerhalb der zurückgegebenen Trefferliste, nicht garantiert Google-Rang.
DE-Standort-Gegencheck durch Uwe steht weiterhin aus.

| Query | steakakademie.de in Top 10? | Wer rankt stattdessen (Top 3) | Δ ggü. Messung 2 |
|---|---|---|---|
| „Kerntemperatur Steak" | ❌ nein | Grillfürst, lecker.de, grillclub.amainfo.at | unverändert ❌ (neu im Feld: lecker.de; Block House weiter nur Rang 4) |
| „Kerntemperatur Steak medium Tabelle" | ✅ **ja — Rang 3** (`/temperatur-guide`, Titel „Kerntemperaturen Fleisch — Komplette Tabelle 2026") | Beefbandits, Grillfürst, **steakakademie.de** | 🟢 **gehalten** (identische Position wie 04.08.) |
| Brand-Query „steakakademie.de Kerntemperatur" | (nicht geprüft in diesem Lauf) | — | — |

**DE-Gegencheck (Uwe, 09.08.2026, google.de Inkognito, Wuppertal)** — Frage-Query
wörtlich „Was ist die richtige Kerntemperatur für ein Steak medium":

| Query | steakakademie.de gefunden? | Position | Umfeld |
|---|---|---|---|
| „Was ist die richtige Kerntemperatur für ein Steak medium" | ✅ ja, aber **Seite 4** (`&start=30`, ca. Platz 33–34) | `/temperatur-guide`, Snippet „Kerntemperaturen Fleisch — Komplette Tabelle 2026" | Die Frau am Grill, Bell Schweiz, **steakakademie.de**, Grillcenter Nord, REWE |

⚠️ **Methodik-Korrektur (wichtig):** Die US-Websuche oben meldete für die verwandte
Query „…medium Tabelle" Rang 3. Der echte DE-SERP zeigt für die Frage-Query Seite 4.
Andere Query → nicht 1:1 vergleichbar, ABER: die US-Werkzeug-Liste ist **keine
verlässliche Positionsangabe** für den deutschen Markt und überschätzt vermutlich.
**Ab Messung 4: DE-Inkognito-Check ist die Leitmessung, US-Websuche nur Indikator.**

**Realistische Einordnung:** Seite 4 ≈ 0 Klicks. Die Seite ist indexiert und thematisch
zugeordnet — aber generisch praktisch unsichtbar. Das deckt sich mit der Doktrin:
Content steht, **Autorität/Backlinks fehlen**.

**Befund:** Kein Rückfall. Der einzige generische Treffer (`Kerntemperatur Steak
medium Tabelle`, Rang 3) ist über 5 Tage **stabil** — spricht gegen ein Zufalls-
Flackern und für eine echte Ranking-Position. Kopf-Keyword „Kerntemperatur Steak"
weiterhin ohne Sichtbarkeit; Feld dort unverändert von Händlern/Marken mit
Domain-Autorität besetzt (Grillfürst #1, dahinter Redaktions-/Händlerseiten).

### AI-Suche (manuell von Uwe zu erheben — je ~5 Min)

Frage jeweils wörtlich: **„Was ist die richtige Kerntemperatur für ein Steak medium?"**

| Plattform | Datum | Steakakademie zitiert/erwähnt? | Wer wird zitiert? | Screenshot abgelegt? |
|---|---|---|---|---|
| ChatGPT | 09.08.2026 | ❌ nein | **niemand** — Antwort aus Modellwissen, Quellen-Panel: „Keine weiteren Quellen gefunden" (Medium 56–58 °C) | ✅ (Chat-Screenshot 11:20) |
| Perplexity (1. Versuch, verworfen) | 09.08.2026 | ⚠️ ungültig | kein Retrieval; lief versehentlich im **„Computer"-Modus** (`/computer/tasks/…`, Modell „Preview (GLM 5.2-based)"), Quellen-Panel leer | ✅ (11:25) |
| **Perplexity (gültige Messung)** | 09.08.2026 | ✅ **JA — erstmals zitiert** | 10 Quellen; **steakakademie.de `/temperatur-guide` im Quellen-Panel gelistet** (Titel „Kerntemperaturen Fleisch — Komplette Tabelle 2026", mit Beschreibungstext „…Wissenschaftlich fundiert, praxiserprobt."). Weitere Quellen u. a. YouTube, shop.block-house. Inline-Zitat im Antworttext ging an `shop.block-hous +1` (Medium 57–60 °C) | ✅ (Screenshot 11:35, `/search/f824c6b7…`) |
| Google AI Overview (google.de, DE-Standort Wuppertal, Inkognito) | 09.08.2026 | ❌ nein (in den sichtbaren Quellen) | **shop.block-house.de** (2× inline + Karte), **Grillfürst** (2× inline + Karte), **Grillcenter Nord** (1× inline). Wert: Medium **54–58 °C**. Panel-Button „Alle anzeigen" nicht geöffnet → vollständige Quellenliste ungeprüft | ✅ (Screenshot 11:40) |

### 🟢 Kern-Befund Messung 3 — erster AI-Zitier-Erfolg

**Perplexity zitiert steakakademie.de erstmals.** Baseline 07.07.: 10 Quellen, keine
davon Steakakademie. Heute: 10 Quellen, **`/temperatur-guide` ist dabei**. Das ist der
erste messbare GEO-Erfolg des Projekts.

Einordnung (bewusst nüchtern):
- **Zitiert ≠ Antwort-Grundlage.** Das Inline-Zitat im Fließtext ging an
  `shop.block-hous +1`; Steakakademie steht in der Quellenliste, hat den genannten
  Wert (57–60 °C) aber nicht geprägt. Nächste Stufe = *inline* zitiert werden.
- **Exakte Rangposition unsicher.** Uwe liest „10. Stelle"; im Screenshot ist
  steakakademie.de die 2. sichtbare Karte im Panel. Panel-Reihenfolge ≠ garantierter
  Rang. Für den Trend irrelevant — Aufnahme in die Quellenmenge ist das Signal.
- **Kausalität zu Wikidata: nicht belegbar.** Perplexity retrievt live aus dem Index;
  ein besser eingebetteter/indexierter Guide erklärt es ebenso gut wie das
  Entity-Signal. Ehrlich: **wir wissen nicht, warum** — nur *dass*.
- **Asymmetrie zur Google-Sichtbarkeit ist der eigentliche Punkt:** google.de organisch
  Seite 4, Perplexity in den Top-10-Quellen. AI-Retrieval bewertet **inhaltliche
  Passung** stärker als Domain-Autorität — genau die Lücke, die die GEO-Doktrin als
  Chance beschreibt. Content-Tiefe zahlt hier schon, bevor Backlinks da sind.

**ChatGPT-Befund:** identisches Muster wie Baseline 07.07. — kein Web-Retrieval,
also **keine Zitier-Chance für irgendeine Domain**. Das ist kein Steakakademie-Problem,
sondern ein Kanal-Befund: Bei dieser Frage antwortet ChatGPT ohne Suche, GEO greift hier
strukturell nicht. Hebel liegt folglich bei Perplexity + Google AI Overview (beide
retrieval-basiert). Werte-Drift zur Baseline: ChatGPT nannte 07.07. 55–57 °C, heute
56–58 °C — Modell-Rauschen, kein Signal.

**AI-Overview-Befund:** unverändert ggü. Baseline — dieselben Player (Block House,
Grillfürst, Grillcenter Nord), Steakakademie nicht dabei. Anders als Perplexity folgt
Googles KI-Übersicht eng den organischen Gewinnern; bei Platz ~33 organisch ist eine
Zitierung nicht zu erwarten. **Hier hilft nur Autorität/Backlinks, nicht mehr Content.**

### Gesamt-Fazit Messung 3 (09.08.2026)

| Kanal | Baseline 07.07. | Messung 3 | Δ |
|---|---|---|---|
| Google DE organisch | nicht in Top 10 | Seite 4 (~Platz 33) | 🟡 sichtbar, aber ohne Klick-Relevanz |
| ChatGPT | nicht zitiert (kein Retrieval) | nicht zitiert (kein Retrieval) | ⚪ unverändert, Kanal strukturell zu |
| **Perplexity** | nicht zitiert (10 Quellen) | ✅ **zitiert** (10 Quellen) | 🟢 **erster GEO-Erfolg** |
| Google AI Overview | nicht zitiert | nicht zitiert | ⚪ unverändert |

**Strategische Ableitung — der Kanal-Split ist der Kernbefund:**
- **Perplexity-Typ (freies Retrieval, Passung > Autorität):** hier gewinnen wir **jetzt
  schon**. Hebel = mehr präzise Fach-Guides.
- **Google-AI-Overview-Typ (folgt organischen Gewinnern):** hier zählt nur
  Domain-Autorität. Hebel = **Backlinks**, nicht Content.
- **ChatGPT-Typ (kein Retrieval bei Standardfragen):** derzeit **nicht adressierbar** —
  keine Ressourcen darauf verschwenden.

**Nebenbefund als Marken-Argument:** Die vier AI-Antworten nannten für „Medium" vier
verschiedene Spannen (ChatGPT 56–58, Perplexity Computer-Modus 55–57, Perplexity Suche
57–60, Google AI 54–58 °C). Der Markt ist bei einem Kernwert uneinheitlich — das stützt
die Positionierung „eine kanonische, geprüfte Referenz" (`data/kerntemperatur-referenz.yaml`)
als Burggraben.

**Wikidata-Wirkung:** weiterhin **nicht kausal belegbar**. Der Perplexity-Erfolg ist
real, seine Ursache offen (Entity-Signal vs. Index-Reifung des Guides). Nächste Messung
sollte prüfen, ob der Perplexity-Treffer **stabil** bleibt — einmalig ≠ Ranking.

Screenshots nach `docs/geo-baseline-screenshots/`.

## Messung 4 — 01.09.2026 (Re-Check, automatisierter Lauf)

Maßnahme seit Baseline unverändert: Wikidata-Item **Q140455747** live + in `sameAs`
des Organization-Markups (Commit `bf19328`). **Keine gezielte neue GEO-Maßnahme seit
Messung 2.** Was sich seither faktisch verändert hat, ist der Content-Umfang der Domain
insgesamt (laufende Rezept-/Wissens-Produktion) — ob das auf diese Query wirkt, ist
**nicht belegbar** und wird hier ausdrücklich nicht als Ursache behauptet.

### Google (klassische Suche) — nur INDIKATOR, keine Position

⚠️ **Methodik (seit Messung 3 verbindlich):** Die verfügbare Websuche ist US-basiert und
liefert **keine deutschen SERP-Positionen**. Am 09.08. meldete sie für die verwandte
Query Rang 3, der echte DE-Inkognito-Check zeigte Seite 4 (~Platz 33). Die folgenden
Zeilen sagen deshalb nur aus: **taucht die Domain in der zurückgegebenen Trefferliste
auf, ja/nein** — plus die Reihenfolge *innerhalb dieser Liste*. Das ist **kein Ranking**.
Leitmessung bleibt der manuelle DE-Inkognito-Check durch Uwe (siehe unten, **noch nicht
erhoben**).

| Query | steakakademie.de in der Trefferliste? | Wer erscheint sonst (erste 3 der Liste) | Δ ggü. Messung 3 |
|---|---|---|---|
| „Kerntemperatur Steak" | ✅ **ja** — Listenplatz 5 von 6 (`/temperatur-guide`, Titel „Kerntemperaturen Fleisch — Tabelle 2026") | grillclub.amainfo.at, shop.block-house.de, grillfuerst.de | 🟡 **erstmals überhaupt in der Liste beim Kopf-Keyword** (Messung 1–3: ❌ nie) — Wert unbestätigt |
| „Kerntemperatur Steak medium Tabelle" | ✅ ja — Listenplatz 8 von 9 (`/temperatur-guide`) | shop.block-house.de, rewe.de, tastybits.de | 🟡 weiterhin vorhanden, aber **deutlich weiter hinten in der Liste** als am 04.08./09.08. (dort Listenplatz 3) |
| Brand-Query „steakakademie.de Kerntemperatur" | (nicht erhoben in diesem Lauf) | — | — |

**Vorsichtige Einordnung, ausdrücklich als Annahme gekennzeichnet:** Die beiden
Bewegungen zeigen in gegenläufige Richtungen (Kopf-Keyword neu drin, Long-Tail weiter
hinten). Bei einem Werkzeug, das nachweislich keine verlässlichen DE-Positionen liefert,
ist das **nicht als Ranking-Veränderung interpretierbar** — es kann genauso gut
Listen-Rauschen sein. **Keine Trendaussage ohne den DE-Inkognito-Check.**

Titel-Drift am Rande, gesichert beobachtbar: Der Seitentitel lautet in dieser Messung
„Kerntemperaturen Fleisch — **Tabelle 2026**", in Messung 2 und 3 noch „… **Komplette
Tabelle 2026**". Ursache nicht geprüft (Titeländerung im Repo vs. Google-Rewrite) — wenn
das nicht bewusst geändert wurde, lohnt ein Blick in die Metadaten von
`/temperatur-guide`.

**DE-Gegencheck (Leitmessung):** ❌ **nicht erhoben** — erfordert Uwes manuellen
Inkognito-Check, siehe Bitte unten.

### AI-Suche (manuell von Uwe zu erheben — je ~5 Min)

Frage jeweils wörtlich: **„Was ist die richtige Kerntemperatur für ein Steak medium?"**

| Plattform | Datum | Steakakademie zitiert/erwähnt? | Wer wird zitiert? | Screenshot abgelegt? |
|---|---|---|---|---|
| ChatGPT | — | nicht erhoben | — | ☐ |
| Perplexity (**normaler Suchmodus**, NICHT „Computer") | — | nicht erhoben | — | ☐ |
| Google AI Overview (google.de, DE-Standort, Inkognito) | — | nicht erhoben | — | ☐ |

Screenshots nach `docs/geo-baseline-screenshots/`.

### Bewertung Messung 4 — Bewegung? Ehrliche Antwort: unentschieden

| Kanal | Messung 3 (09.08.) | Messung 4 (01.09.) | Δ |
|---|---|---|---|
| Google DE organisch (Leitmessung) | Seite 4 (~Platz 33) | **nicht erhoben** | ⚪ keine Aussage möglich |
| US-Websuche (Indikator) | Kopf-KW ❌ / Long-Tail Listenplatz 3 | Kopf-KW ✅ Listenplatz 5 / Long-Tail Listenplatz 8 | 🟡 widersprüchlich, nicht belastbar |
| ChatGPT | nicht zitiert (kein Retrieval) | **nicht erhoben** | ⚪ |
| **Perplexity** | ✅ erstmals zitiert | **nicht erhoben** | ⚪ **Stabilitätsfrage offen** |
| Google AI Overview | nicht zitiert | **nicht erhoben** | ⚪ |

**Die zentrale offene Frage dieser Messung ist unbeantwortet geblieben:** Messung 3
formulierte als Prüfauftrag, ob der Perplexity-Treffer **stabil** bleibt — ein einzelner
Treffer ist noch kein Ranking. Das lässt sich nur manuell klären. Bis dahin gilt der
Perplexity-Erfolg vom 09.08. als **einmalig beobachtet, nicht als bestätigtes Ranking**.

**Wikidata-Wirkung:** unverändert **nicht kausal belegbar**. Es gibt weiterhin keine
Messanordnung, die Entity-Signal von Index-Reifung trennt. Wer hier Kausalität behauptet,
überschreibt Regel 7.

**Widerruf früherer Einschätzungen:** keiner. Die Methodik-Korrektur aus Messung 3
(US-Werkzeug = Indikator, nicht Position) hat sich in diesem Lauf bestätigt und wird
nicht abgeschwächt.

## Messung 5 — 20.09.2026 (Re-Check, erstmals vollständig selbst erhoben)

**Methodik-Wechsel, ab hier verbindlich:** Die AI-Abfragen werden nicht mehr an Uwe
delegiert, sondern im eingebauten Browser der Claude-App selbst erhoben (echter
DE-Standort, anonym, kein Login). Grund: Messung 2 und Messung 4 haben über sechs Wochen
**nur leere Zeilen** produziert, weil die manuelle Erhebung ausblieb — grüner Lauf ohne
Ergebnis, exakt der Fall aus CLAUDE.md Regel 10. Google-Positionen werden jetzt aus dem
DOM gezählt (`#search a h3` → `closest('a')`, Google-eigene Links gefiltert), nicht mehr
aus einer US-Websuchliste geschätzt.

Maßnahme seit Baseline unverändert: Wikidata-Item **Q140455747** live + in `sameAs` des
Organization-Markups (Commit `bf19328`). **Keine gezielte neue GEO-Maßnahme.**

### 1. Google DE organisch (Leitmessung) — exakte Position

Query wörtlich: „Was ist die richtige Kerntemperatur für ein Steak medium",
`google.de?hl=de&gl=de&num=10`, Seiten 1–5 über `&start=0/10/20/30/40`.

| Query | Position | URL / Titel | Δ ggü. Messung 3 (09.08.) |
|---|---|---|---|
| „Was ist die richtige Kerntemperatur für ein Steak medium" | **~36** (Seite 4, 6. Treffer der Seite) | `steakakademie.de/temperatur-guide` — „Kerntemperaturen Fleisch — Tabelle 2026 - Steakakademie" | 🟡 Seite 4 gehalten (09.08.: ~33–34). Differenz im Rahmen der Zählunschärfe, **keine Trendaussage** |
| „Kerntemperatur Steak" (Kopf-Keyword) | **nicht auf Seite 1** | — | ⚪ unverändert seit Baseline |

Umfeld Seite 1 der Leit-Query: Grillfürst (1), shop.block-house.de (2), Grillcenter Nord
(3), little-london.de (4), grillclub.amainfo.at (5). Direkt um Position 36 herum:
die-frau-am-grill.de (34), Facebook (35), **steakakademie.de (36)**, REWE (37).

⚠️ **Zählunschärfe ehrlich benannt:** Position = `start` + Index innerhalb der Seite.
Seite 1 lieferte nur 7 organische Treffer (Rest: Anzeigen, „Weitere Fragen", Videoblöcke),
Seite 4 nur 9. Die absolute Zahl ist damit auf **±3 genau**, die Seitenangabe („Seite 4")
ist belastbar. Für den Trend zählt die Seite, nicht die Nachkommastelle.

### 2. Google AI Overview (auf derselben SERP, via `document.body.innerText`)

| | Befund |
|---|---|
| AIO ausgeliefert? | ✅ ja, bei **beiden** Queries |
| Genannter Wert (Leit-Query) | Medium **54–58 °C**, Zielwert ~56 °C |
| Inline zitierte Domains (Leit-Query) | **shop.block-house.de** (dominant, 5 Link-Vorkommen im AIO-Block) + **der-ludwig.de** (das verdeckte „+1") |
| Inline zitierte Domains (Kopf-Keyword) | **doncarne.de** „+1", **Grillfürst** „+3"; Wert ebenfalls 54–58 °C |
| steakakademie.de zitiert? | ❌ nein, in keinem der beiden AIO |

Methodik-Notiz zum Nachmachen: Das AI Overview steht **nicht** im Text, den eine
Extraktion des Suchergebnis-Containers (`#search`/`#rso`) liefert. Wer nur dort schaut,
meldet fälschlich „kein AIO". Geprüft wurde über `document.body.innerText` plus gezielte
Link-Auszählung innerhalb des AIO-Containers — dadurch wird auch das verdeckte „+1"
sichtbar, das im Screenshot nicht lesbar ist.

### 3. Perplexity — zwei unabhängige Läufe, gleiches Ergebnis

Ohne Login, normaler Suchmodus (**nicht** „Computer"-Modus — dort läuft kein Retrieval,
die Messung wäre ungültig, siehe Messung 3).

| | Lauf A (17:25) | Lauf B (17:26) |
|---|---|---|
| Quellenanzahl | 10 | 10 |
| **steakakademie.de gelistet?** | ✅ ja, **Position 6 von 10** | ✅ ja, **Position 6 von 10** |
| **Inline zitiert?** | ❌ nein | ❌ nein |
| Genannter Wert | 55–60 °C | 55–60 °C |

Quellenliste (identische Reihenfolge in beiden Läufen): biggreenegg.eu, tfa-dostmann.de,
burnhard.com, oberpfalz-beef.de, shop.block-house.de, **steakakademie.de/temperatur-guide**,
meat-nomade.de, grillclub.amainfo.at, santosgrills.de, grillcenter-nord.de.

🟢 **Das ist der belastbarste Einzelbefund dieser Messung:** Der Perplexity-Treffer vom
09.08. war **kein Einmalereignis**. Er ist sechs Wochen später da, und zwei Läufe im
Minutenabstand liefern dieselbe Liste in derselben Reihenfolge. Die von Messung 3
gestellte Stabilitätsfrage — offen seit sechs Wochen, in Messung 4 unbeantwortet — ist
damit **beantwortet: stabil.**

⚠️ **Zur Inline-Frage: „nein" ist hier kein Befund über Steakakademie.** Perplexity hat in
beiden Läufen eine 1–2-Satz-Kurzantwort **ganz ohne Inline-Zitate** ausgeliefert — für
**keine** Domain, auch nicht für die Quellen 1–5. Der Antworttext enthielt DOM-geprüft
null externe Links. Die Frage „prägt Steakakademie die Antwort?" ist in diesem Lauf
deshalb **nicht entscheidbar**, nicht „verneint". Wer das als Rückschritt liest, vergleicht
zwei verschiedene Antwortformate.

### 4. ChatGPT — Kontrollmessung

Ohne Login, `chatgpt.com/?q=…`. Antwort aus Modellwissen (Medium 54–57 °C), **kein
Quellen-Panel, kein Retrieval, keine Domain zitiert**. Das ist der **vierte** Lauf in Folge
mit diesem Ergebnis (07.07., 09.08., 20.09. laut Auftragsstand, 20.09. hier). Befund
unverändert: Bei dieser Frage ist der Kanal für **jede** Domain zu — kein
Steakakademie-Problem, strukturell nicht adressierbar. Keine Ressourcen darauf verwenden.

### 5. Zugriffsdaten (Microsoft Clarity)

**Sessions nach Quelle, 14.–20.09.2026:**

| Quelle | Sessions |
|---|---|
| Direct | 35 |
| **bing** | **12** |
| google | 3 |
| chatgpt.com | 1 |
| www.checkout-ds24.com | 1 |

**Top-Seiten, 13.–20.09.2026** (Clarity hat für diese Abfrage ein um einen Tag weiteres
Fenster gewählt — nicht 1:1 mit der Quellen-Tabelle vergleichbar):

| Seite | Sessions |
|---|---|
| `/hoefe` | **22** |
| `/` | 8 |
| `/temperatur-guide` | 6 |
| `/diplome/lernen/stufe-1/dry-rubs-marinaden` | 2 |
| Rest (7 Seiten) | je 1 |

**Zwei Befunde, die nichts mit der GEO-Query zu tun haben und trotzdem wichtiger sind:**

1. **Bing liefert viermal so viel wie Google** (12 : 3). Das ist kein Detail: Bing ist der
   Index hinter Copilot und hinter der ChatGPT-Websuche. Ein GEO-Programm, das nur Google
   misst, misst am stärkeren der beiden messbaren Kanäle vorbei. **Ab Messung 6 gehört
   eine Bing-Positionsmessung in die Leitmessung** — sie fehlt hier noch (siehe unten).
2. **`/hoefe` ist mit 22 Sessions die meistbesuchte Seite** — fast dreimal so viel wie die
   Startseite und fast viermal so viel wie `/temperatur-guide`, auf das sich dieses ganze
   Monitoring konzentriert. Ob das organische Nachfrage oder ein einzelner Verweis ist, ist
   **nicht geprüft**. Wenn es Nachfrage ist, wird hier seit Monaten die falsche Seite
   optimiert. Das gehört vor der nächsten Content-Entscheidung geklärt.
3. Ein Zugriff kam über **chatgpt.com** — bei nachweislich fehlendem Retrieval auf die
   Kernfrage also über einen Link in einem Chat, nicht über eine Zitierung. Zahl zu klein
   für jede Aussage, nur der Vollständigkeit halber notiert.

### Gesamt-Fazit Messung 5

| Kanal | Messung 3 (09.08.) | Messung 4 (01.09.) | Messung 5 (20.09.) | Δ |
|---|---|---|---|---|
| Google DE organisch | Seite 4 (~33) | nicht erhoben | **Seite 4 (~36)** | 🟡 gehalten, ohne Klick-Relevanz |
| Google AI Overview | nicht zitiert | nicht erhoben | **nicht zitiert** | ⚪ unverändert |
| **Perplexity (gelistet)** | ✅ erstmals | nicht erhoben | ✅ **Position 6/10, 2× reproduziert** | 🟢 **stabil bestätigt** |
| Perplexity (inline) | ❌ (Inline ging an block-house) | nicht erhoben | ⚪ **nicht entscheidbar** (Antwort ohne Inline-Zitate) | ⚪ |
| ChatGPT | kein Retrieval | nicht erhoben | **kein Retrieval** | ⚪ Kanal strukturell zu |
| Bing (Traffic) | nie gemessen | nie gemessen | **12 Sessions, stärkster Suchkanal** | 🆕 blinder Fleck |

**Die strategische Ableitung aus Messung 3 hält — mit einer Korrektur:** Der Kanal-Split
(Perplexity belohnt Passung, Google AI Overview belohnt Autorität, ChatGPT ist zu) ist
durch diese Messung gestützt, nicht widerlegt. **Neu ist der vierte Kanal:** Bing wurde nie
gemessen, liefert aber real den meisten Suchtraffic. Das war in vier Messungen ein blinder
Fleck.

**Wikidata-Wirkung:** unverändert **nicht kausal belegbar**. Es gibt weiterhin keine
Messanordnung, die Entity-Signal von Index-Reifung trennt — zwei Datenpunkte (09.08.,
20.09.) zeigen, *dass* Perplexity zitiert, nicht *warum*. Wer hier Kausalität behauptet,
überschreibt Regel 7.

### Widerruf / Korrektur früherer Einschätzungen

- **Messung 3, „Exakte Rangposition unsicher":** aufgelöst. Die Panel-Position ist jetzt
  DOM-gezählt und über zwei Läufe reproduziert — Position 6 von 10, keine Schätzung mehr.
- **Messung 3 + 4, „Perplexity-Erfolg einmalig beobachtet, nicht als bestätigtes Ranking":**
  hiermit **aufgehoben**. Zwei reproduzierte Läufe sechs Wochen später machen daraus einen
  bestätigten, wiederholbaren Treffer.
- **Messung 4, US-Websuche als Indikator:** entfällt ersatzlos. Ab Messung 5 wird
  ausschließlich aus dem DE-DOM gezählt. Die Zeilen in Messung 4 bleiben unverändert
  stehen, sind aber methodisch überholt.
- **Kein Widerruf** bei den Sachbefunden der Messungen 1–4.

### ⚠️ Abweichung zum Auftragstext — bewusst nicht stillschweigend übernommen

Der Task-Auftrag nennt unter „Stand zum Vergleich" eine **Messung 5 vom 20.09.2026** mit
abweichenden Werten: Google Platz **39**, Perplexity **Quelle 1 von 10 und INLINE zitiert**.
Dazu drei Feststellungen, ohne Spekulation:

1. **Diese Messung 5 steht nicht in dieser Datei.** Letzter Commit auf `geo-baseline.md`
   war `3c2cb5d` (Messung 4). Die genannten Werte existieren nur im Auftragstext.
2. **Die Clarity-Zahlen stimmen exakt überein** (Direct 35 / bing 12 / google 3 /
   chatgpt.com 1) — die Werte stammen also mit hoher Wahrscheinlichkeit aus einer
   **zweiten Erhebung desselben Tages**, die nie eingetragen wurde.
3. **Bei Perplexity weichen beide Erhebungen erheblich ab** (Position 1 + inline vs.
   Position 6 + kein Inline). Beide können stimmen: Perplexity liefert nachweislich
   unterschiedliche Antwortformate. Belegt ist nur, was hier gemessen wurde.

**Konsequenz, nicht verhandelbar:** Eine Zahl, die nur im Auftragstext steht, wird nicht
als Messung eingetragen. Die Tabellen oben enthalten ausschließlich eigene Erhebung. Die
Perplexity-Position ist damit **innerhalb eines Tages nicht stabil** — die Listung ist es,
die Rangposition nicht. Messung 6 sollte deshalb **zwei Läufe zu verschiedenen Tageszeiten**
fahren, nicht zwei im Minutenabstand.

### ❌ Was NICHT erhoben wurde (Berichtspflicht, CLAUDE.md Abschnitt A)

| Nicht erhoben | Warum | Was es gebraucht hätte |
|---|---|---|
| **Bing-Position** für dieselbe Query | Bing steht bis heute in keiner Messanordnung — Versäumnis der Methodik, kein technisches Hindernis | ein Aufruf von `bing.com/search?q=…&setlang=de&cc=DE` mit derselben DOM-Zählung; ab Messung 6 einplanen |
| **Screenshots** nach `docs/geo-baseline-screenshots/` | Erhebung lief DOM-basiert; die extrahierten Werte sind präziser als ein Bild, aber es gibt keinen Bildbeleg | `computer{action:"screenshot"}` je Kanal, Ablage im genannten Ordner |
| **Brand-Query** „steakakademie.de Kerntemperatur" | seit Messung 2 durchgängig ausgelassen, hier ebenfalls | ein weiterer Google-Aufruf; niedrige Priorität, Brand-Queries messen keine generische Sichtbarkeit |
| **Vollständige AIO-Quellenliste** hinter „Mehr anzeigen" | nur die inline verdrahteten Domains wurden ausgezählt; das Panel wurde nicht aufgeklappt | Klick auf „Alle anzeigen" im AIO-Block vor der Link-Auszählung |
| **Ursache der `/hoefe`-Zugriffe** | außerhalb des Auftrags dieser Messung | Clarity-Abfrage „Referrer für /hoefe, letzte 7 Tage" |
| `docs/seo-monitoring-methodik.md` | **Datei existiert nicht** — der Auftrag verweist auf sie als verbindliche Verfahrensquelle | Die Datei muss angelegt werden; das Verfahren dieser Messung ist oben inline dokumentiert und taugt als Vorlage |

## Re-Check-Rhythmus

Alle 4 Wochen erheben und hier als neue Sektion anhängen — **nie überschreiben**.

**Nächste Fälligkeit: 18.10.2026.** (Ops-Heartbeat `maxTage: 32` hängt an der Änderung
dieser Datei; bleibt sie aus, wird der tägliche Heartbeat-Lauf rot — so gewollt.)

Messanordnung ab Messung 6 — gegenüber Messung 5 **erweitert**:

1. Google DE organisch, Seiten 1–5, DOM-gezählt (Leit-Query + Kopf-Keyword)
2. Google AI Overview auf derselben SERP, geprüft über `document.body.innerText`
3. **Bing DE, dieselbe Query, DOM-gezählt** — neu, siehe Messung 5 Abschnitt 5
4. Perplexity, **zwei Läufe zu verschiedenen Tageszeiten**, Listung und Inline getrennt
5. ChatGPT, Kontrollmessung (nur: Retrieval ja/nein)
6. Clarity: Sessions nach Quelle + Top-Seiten, **7 Tage, identisches Fenster für beide
   Abfragen** (in Messung 5 differierten sie um einen Tag)

Erwartung unverändert: Auf Google bewegt sich ohne Backlinks nichts. Auf Perplexity ist die
Listung erreicht — die nächste Stufe ist das Inline-Zitat, und die lässt sich nur an einer
Antwort messen, die überhaupt inline zitiert.
