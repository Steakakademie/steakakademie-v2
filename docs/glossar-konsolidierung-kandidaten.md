# Glossar-Konsolidierung — Kandidatenliste (Plan C2)

**Erstellt:** 18.09.2026 · **Stand:** 183 Eintraege in `content/glossar/` · **Nachtrag 09.10.2026:** 25 Eintraege zusammengelegt, siehe unten

> **Diese Liste loescht nichts.** Sie benennt Kandidaten und die Signale dazu.
> Die Entscheidung braucht Ranking- und Zugriffsdaten, die es derzeit nicht gibt:
> Google Analytics ist fuer den MCP-Zugang gesperrt, ein Plausible-API-Schluessel
> liegt nicht im Repo, und `public.web_vitals` deckt nur 10 Tage mit 92 Zeilen
> ueber 38 Glossar-Routen ab. **B2 (GSC-Links-Report, Ahrefs, Bing) zuerst.**
>
> **Aufgehoben fuer Fuellwort-Permutationen am 09.10.2026** (SEO-Audit 08.10.):
> Drei Wochen nach dieser Zeile gibt es weiterhin keine Search Console, und bei
> rund 9 Google-Sitzungen pro Woche fuer die gesamte Seite (monitoring-log KW41)
> haetten Eintraege wie `smoker-fans` oder `wagyu-kenner` auch mit GSC keine
> messbaren Impressionen. Die Liste der zusammengelegten Slugs steht in
> `data/taxonomie.yaml` → `glossar_weiterleitungen` (Quelle fuer 301, Gate und
> Waechter). Fuer die uebrigen Cluster (`maillard`, `dry`, `infrarot`, `medium`,
> `oberhitze`, `rub`, Hub-Dubletten wie `reverse-sear`/`sous-vide`) gilt die
> Sperre weiter.

## Warum ueberhaupt

`ACTION-PLAN.md:35` (C2): rund 30-45 Keyword-Permutationen zusammenlegen, je mit 301.
Begruendung dort: HCU-Risiko und Kannibalisierung. Messung heute:

- **182 von 183** Eintraegen haben unter 150 Woerter (Median 113)
- **13 Cluster** mit je >= 3 Eintraegen umfassen **68** Eintraege

## Signale je Eintrag

- **Woerter** — Textumfang des MDX-Bodys
- **Links** — eingehende interne Links aus `content/` (nach dem C1-Sprint)
- **Vorschlag** — `Hub` = Zielseite des Clusters, `pruefen` = Kandidat zum Zusammenlegen

### `wagyu` — 13 Eintraege

| Slug | Kategorie | Woerter | Links | Vorschlag |
|---|---|--:|--:|---|
| `wagyu` | Fleischkunde | 117 | 3 | **Hub** |
| `wagyu-rinder` | Fleischkunde | 113 | 2 | pruefen |
| ~~`wagyu-wissen`~~ | Fleischkunde | 124 | 1 | ✅ erledigt 09.10.2026 → `wagyu` |
| ~~`wagyu-burger`~~ | Fleischkunde | 116 | 1 | ✅ erledigt 09.10.2026 → `wagyu` |
| `wagyu-zucht` | Fleischkunde | 115 | 1 | pruefen |
| ~~`wagyu-kenner`~~ | Fleischkunde | 114 | 1 | ✅ erledigt 09.10.2026 → `wagyu` |
| `wagyu-kreuzungen` | Fleischkunde | 114 | 1 | pruefen |
| ~~`wagyu-zubereitungen`~~ | Fleischkunde | 110 | 1 | ✅ erledigt 09.10.2026 → `wagyu` |
| `wagyu-brisket` | Cuts & Teilstücke | 106 | 1 | pruefen |
| ~~`wagyu-hotdog`~~ | Cuts & Teilstücke | 106 | 1 | ✅ erledigt 09.10.2026 → `wagyu` |
| `wagyu-zertifikat` | Fleischkunde | 106 | 1 | pruefen |
| ~~`wagyu-farm`~~ | Fleischkunde | 119 | 0 | ✅ erledigt 09.10.2026 → `wagyu` |
| ~~`wagyu-pioneer`~~ | Fleischkunde | 109 | 0 | ✅ erledigt 09.10.2026 → `wagyu` |

### `smoker` — 10 Eintraege

| Slug | Kategorie | Woerter | Links | Vorschlag |
|---|---|--:|--:|---|
| `smoker-temperatur` | Thermodynamik | 249 | 3 | **Hub** |
| ~~`smoker-long`~~ | Ausrüstung | 108 | 1 | ✅ erledigt 09.10.2026 → `/methoden/smoken-low-and-slow` |
| ~~`smoker-enthusiasten`~~ | Ausrüstung | 101 | 1 | ✅ erledigt 09.10.2026 → `/methoden/smoken-low-and-slow` |
| ~~`smoker-test`~~ | Ausrüstung | 100 | 1 | ✅ erledigt 09.10.2026 → `/methoden/smoken-low-and-slow` |
| ~~`smoker-designs`~~ | Ausrüstung | 98 | 1 | ✅ erledigt 09.10.2026 → `/methoden/smoken-low-and-slow` |
| ~~`smoker-fans`~~ | Ausrüstung | 98 | 1 | ✅ erledigt 09.10.2026 → `/methoden/smoken-low-and-slow` |
| `smoker-monitoring` | Techniken & Methoden | 97 | 1 | pruefen |
| ~~`smoker-setup`~~ | Ausrüstung | 86 | 1 | ✅ erledigt 09.10.2026 → `/methoden/smoken-low-and-slow` |
| `smoker-finish` | Techniken & Methoden | 112 | 0 | pruefen |
| ~~`smoker-aufbau`~~ | Ausrüstung | 109 | 0 | ✅ erledigt 09.10.2026 → `/methoden/smoken-low-and-slow` |

Ziel ist bewusst die Methodenseite, nicht `smoker-temperatur`: Fans, Setup, Aufbau,
Test und Designs beschreiben das Geraet und seinen Betrieb — das steht dort, nicht
in einem Thermodynamik-Begriff.

### `kerntemperatur` — 6 Eintraege

| Slug | Kategorie | Woerter | Links | Vorschlag |
|---|---|--:|--:|---|
| `kerntemperatur` | Thermodynamik | 108 | 14 | **Hub** |
| ~~`kerntemperatur-ziel`~~ | Thermodynamik | 96 | 3 | ✅ erledigt 09.10.2026 → `kerntemperatur` |
| `kerntemperatur-referenz` | Thermodynamik | 110 | 2 | pruefen (Entwurf, nicht veroeffentlicht) |
| ~~`kerntemperatur-kontrolle`~~ | Thermodynamik | 109 | 1 | ✅ erledigt 09.10.2026 → `kerntemperatur` |
| ~~`kerntemperatur-prinzip`~~ | Thermodynamik | 122 | 0 | ✅ erledigt 09.10.2026 → `kerntemperatur` |
| ~~`kerntemperatur-wissen`~~ | Thermodynamik | 103 | 0 | ✅ erledigt 09.10.2026 → `kerntemperatur` |

### `maillard` — 6 Eintraege

| Slug | Kategorie | Woerter | Links | Vorschlag |
|---|---|--:|--:|---|
| `maillard-reaktion` | Chemie & Physik | 114 | 71 | **Hub** |
| `maillard-zone` | Chemie & Physik | 115 | 1 | pruefen |
| `maillard-intensitaet` | Chemie & Physik | 113 | 1 | pruefen |
| `maillard-aromen` | Chemie & Physik | 101 | 1 | pruefen |
| `maillard-flaeche` | Chemie & Physik | 121 | 0 | pruefen |
| `maillard-schwelle` | Chemie & Physik | 118 | 0 | pruefen |

### `brisket` — 5 Eintraege

| Slug | Kategorie | Woerter | Links | Vorschlag |
|---|---|--:|--:|---|
| `brisket-test` | Techniken & Methoden | 119 | 1 | **Hub** |
| `brisket-buns` | Techniken & Methoden | 113 | 1 | pruefen |
| ~~`brisket-smoker`~~ | Ausrüstung | 90 | 1 | ✅ erledigt 09.10.2026 → `/cuts/brisket` |
| ~~`brisket-rezept`~~ | Techniken & Methoden | 115 | 0 | ✅ erledigt 09.10.2026 → `/cuts/brisket` |
| ~~`brisket-evangelium`~~ | Techniken & Methoden | 105 | 0 | ✅ erledigt 09.10.2026 → `/cuts/brisket` |

### `wettkampf` — 5 Eintraege

| Slug | Kategorie | Woerter | Links | Vorschlag |
|---|---|--:|--:|---|
| `wettkampf-bbq` | Techniken & Methoden | 119 | 1 | **Hub** |
| `wettkampf-standards` | Techniken & Methoden | 105 | 1 | pruefen |
| `wettkampf-pitmaster` | Techniken & Methoden | 103 | 1 | pruefen (Hub fuer `wettbewerbs-pitmaster`, s. u.) |
| `wettkampf-team` | Techniken & Methoden | 97 | 1 | pruefen |
| ~~`wettkampf-grillmeister`~~ | Techniken & Methoden | 94 | 0 | ✅ erledigt 09.10.2026 → `wettkampf-bbq` |
| ~~`wettbewerbs-pitmaster`~~ | Techniken & Methoden | — | 1 | ✅ erledigt 09.10.2026 → `wettkampf-pitmaster` (Praefix-Clustering hat die Schreibvariante nicht gefunden) |

### `dry` — 4 Eintraege

| Slug | Kategorie | Woerter | Links | Vorschlag |
|---|---|--:|--:|---|
| `dry-aging` | Reifung | 120 | 2 | **Hub** |
| `dry-rub` | Würzung & Marinaden | 117 | 2 | pruefen |
| `dry-brining` | Würzung & Marinaden | 114 | 0 | pruefen |
| `dry-aged` | Reifung | 89 | 0 | pruefen |

### `kollagen` — 4 Eintraege

| Slug | Kategorie | Woerter | Links | Vorschlag |
|---|---|--:|--:|---|
| `kollagen` | Fleischkunde | 117 | 14 | **Hub** |
| ~~`kollagen-umwandlung`~~ | Chemie & Physik | 100 | 2 | ✅ erledigt 09.10.2026 → `kollagen-transformation` (Begriff steht jetzt in dessen Definition) |
| `kollagen-anteil` | Fleischkunde | 110 | 1 | Hauptbegriff laut `taxonomie.yaml`, bleibt |
| `kollagen-transformation` | Chemie & Physik | 107 | 1 | Hauptbegriff laut `taxonomie.yaml`, bleibt |

**Angeglichen 21.09.2026 (Entscheidung Uwe):** `data/taxonomie.yaml` fuehrt
`kollagen-anteil` (← `kollagen-anteile`) und `kollagen-transformation`
(← `kollagen-umwandlung`) als Hauptbegriffe. Die urspruengliche Zeile, beide in
`kollagen` einzuschmelzen, widersprach dem und ist hinfaellig. Die Taxonomie ist
maßgeblich; `scripts/check-taxonomy.mjs` (in `npm run check`) meldet solche
Widersprueche kuenftig automatisch. Offen bleibt nur `kollagen-umwandlung` —
Zusammenlegung in `kollagen-transformation` weiter erst mit GSC-Daten (B2).

### ~~`bark`~~ — **abgeschlossen 21.09.2026** ✅

| Slug | Kategorie | Stand |
|---|---|---|
| `bark` | Chemie & Physik | **Hub — kanonischer Eintrag** |
| `bark-killer` | Techniken & Methoden | **eigenstaendig, bleibt** (Entscheidung Uwe) |
| ~~`bark-aussage`~~ | ~~Chemie & Physik~~ | erledigt → `bark` |
| ~~`bark-aussagen`~~ | ~~Chemie & Physik~~ | erledigt → `bark` |
| ~~`bark-bildung`~~ | ~~Chemie & Physik~~ | erledigt → `bark` |

Aus fuenf Eintraegen sind zwei geworden. Kein offener Punkt mehr.

**Schritt 1 — `bark-aussage` und `bark-aussagen` (21.09.2026).** Beide am 19.09.
angelegt, Titel „Bark", `status: draft`, nahezu wortgleiche Definition, dazu
widersprechende Temperaturangaben (110–130 gegen 107–121 °C). „aussage"/
„aussagen" ist ein Fuellwort im Sinne von `data/taxonomie.yaml`; bei vorhandenem
Hauptbegriff darf so ein Slug gar nicht erst entstehen. Uebernommen wurden
Polyphenol-Einlagerung, Texturspanne und das Spritz-Verbot waehrend der
Bark-Phase.

**Schritt 2 — `bark-bildung` (21.09.2026).** Beschrieb denselben Gegenstand wie
`bark`, nur den Vorgang statt das Ergebnis — mit erneut abweichender
Temperaturangabe (110–130 °C). Uebernommen wurden die Karamellisierung der
oberflaechlichen Zucker, die Farb- und Texturbeschreibung („dunkelbraun bis
schwarz, texturiert"), der Dry Rub vor dem Raeuchern und der Hinweis, die
fertige Kruste nicht abzukratzen. Der Begriff „Bark-Bildung" selbst steht jetzt
im Definitionsabsatz von `bark`, damit die Suchphrase nicht verloren geht.
Die vier eingehenden internen Verweise (`cuts/brisket`, `cuts/pulled-pork`,
`methoden/smoken-low-and-slow`, `rezepte/spareribs-3-2-1`) zeigen direkt auf
`/glossar/bark`; der 301 faengt externe Links und Lesezeichen.

**Nicht konsolidiert — und das bleibt so:** `bark-killer` beschreibt nicht die
Kruste, sondern ihr Scheitern, und gehoert deshalb in „Techniken & Methoden".
`bark` und `bark-killer` verweisen seit dem 21.09. gegenseitig aufeinander. Die
AMBIGUOUS-Kante, die der Wissensgraph zwischen der Kategorie-Angabe hier und
`bark` zieht, bleibt bewusst stehen: Sie bildet die Kategorie-Differenz ab, und
die ist real, nicht fehlerhaft.

301-Weiterleitungen fuer alle drei geloeschten Slugs in `next.config.mjs`,
Synonyme in `data/taxonomie.yaml`.

### `infrarot` — 3 Eintraege

| Slug | Kategorie | Woerter | Links | Vorschlag |
|---|---|--:|--:|---|
| `infrarot-thermometer` | Ausrüstung | 101 | 4 | **Hub** |
| `infrarot-brenner` | Ausrüstung | 97 | 1 | pruefen |
| `infrarot-strahlung` | Thermodynamik | 127 | 0 | pruefen |

### `medium` — 3 Eintraege

| Slug | Kategorie | Woerter | Links | Vorschlag |
|---|---|--:|--:|---|
| `medium` | Fleischkunde | 116 | 7 | **Hub** |
| `medium-rare` | Fleischkunde | 140 | 6 | pruefen |
| `medium-well` | Fleischkunde | 109 | 0 | pruefen |

### `oberhitze` — 3 Eintraege

| Slug | Kategorie | Woerter | Links | Vorschlag |
|---|---|--:|--:|---|
| `oberhitze-finish` | Techniken & Methoden | 121 | 0 | **Hub** |
| `oberhitze-brenner` | Ausrüstung | 108 | 0 | pruefen |
| `oberhitze-grillen` | Techniken & Methoden | 102 | 0 | pruefen |

### `rub` — 3 Eintraege

| Slug | Kategorie | Woerter | Links | Vorschlag |
|---|---|--:|--:|---|
| `rub` | Würzung & Marinaden | 122 | 5 | **Hub** |
| `rub-mischung` | Würzung & Marinaden | 118 | 1 | pruefen |
| `rub-rezepte` | Würzung & Marinaden | 121 | 0 | pruefen |

## Nicht in Clustern

115 Eintraege stehen allein und sind keine Permutations-Kandidaten.

## Vorgehen, wenn die Daten da sind

1. Fuer jeden Cluster die Impressionen/Klicks je URL aus der GSC ziehen (letzte 3 Monate).
2. Eintraege ohne Impressionen und ohne eingehende Links in den Hub einarbeiten (nur Inhalt, der dort fehlt).
3. 301 auf den Hub setzen — Muster: `next.config.mjs:157` (bestehende Glossar-Weiterleitung).
4. Interne Links auf den alten Slug auf den Hub umbiegen (`grep -rn "/glossar/<slug>" content src`).
5. Sitemap und `DefinedTermSet` pruefen, danach `npm run check`.

**Nicht zusammenlegen**, solange ein Eintrag Impressionen hat oder intern verlinkt ist —
die Links stammen aus dem C1-Sprint und zeigen, welche Begriffe im Fliesstext wirklich vorkommen.

---

## Nachtrag 21.09.2026 — Synonym-Paare (Praefix-Clustering findet sie nicht)

Die Cluster oben entstehen ueber gemeinsame Slug-Praefixe. Zwei Eintraege, die
dasselbe erklaeren aber verschieden heissen, fallen dabei durch. Der
Semantik-Lauf vom 21.09.2026 hat diese Paare gemeldet:

| Paar | Befund | Vorschlag |
|---|---|---|
| ~~`packer-brisket` / `packer-cut`~~ | Beide definierten die komplette Rinderbrust aus Flat und Point mit Fettdeckel. Inhaltlich deckungsgleich, nur andere Formulierung. | ✅ **Erledigt 21.09.2026.** Hub `packer-brisket`, `packer-cut` geloescht, 301 gesetzt. |
| ~~`stall` / `plateauphase`~~ | Beide erklaeren dasselbe Phaenomen — Verdunstungskuehlung waehrend des Smokens. `stall` nennt die Ursache praeziser, `plateauphase` fuehrt zusaetzlich den Kollagenabbau an (fachlich zweifelhaft als Ursache des Plateaus). | ✅ **Erledigt 09.10.2026.** Hub `stall` („deutsch auch Plateauphase" steht jetzt in der Definition), `plateauphase` geloescht, 301 ueber `glossar_weiterleitungen`. |

Fuer `stall` / `plateauphase` gilt die Sperre wie oben weiter: **erst
GSC-Daten (B2), dann zusammenlegen.** `stall` ist ausserdem frisch
veroeffentlicht (Pipeline W2, Commit 8eb3962) — die Impressionen brauchen
ohnehin Vorlauf. Das packer-Paar ist von der Sperre ausgenommen worden und
abgeschlossen (siehe unten).

> ✅ **Richtung beim packer-Paar entschieden (Uwe, 21.09.2026): Hub ist
> `packer-brisket`.** Der urspruengliche Vorschlag dieser Tabelle lautete
> umgekehrt — Hub `packer-cut` mit der Begruendung „gelaeufigerer
> Handelsbegriff". Er ist damit hinfaellig.
>
> Die Entscheidung bestaetigt, was ohnehin schon durchgesetzt wurde, und
> beseitigt den Widerspruch:
>
> | Quelle | kanonisch | Status |
> |---|---|---|
> | `data/taxonomie.yaml:83` — `packer-cut: packer-brisket` | `packer-brisket` | operativ, **unveraendert** — die Zeile stand bereits richtig |
> | `data/content-qualitaet-baseline.json` | `packer-brisket` | `packer-cut.mdx` als bekannte Dublette im Ratchet, **unveraendert** |
> | diese Zeile | `packer-brisket` | **angeglichen** |
>
> Es war also nichts umzustellen: Gate, Generatoren und Baseline zeigten von
> Anfang an auf `packer-brisket`. Allein die Vorschlagszeile wies in die
> Gegenrichtung.
>
> **Zusammenlegung ausgefuehrt am 21.09.2026** (Freigabe Uwe, bewusst ohne die
> GSC-Daten abzuwarten — die Sperre galt der Richtungsfrage, und die war
> entschieden). `content/glossar/packer-cut.mdx` ist geloescht, der Verweis in
> `content/cuts/brisket.mdx` Zeile 126 zeigt auf `/glossar/packer-brisket`,
> der 301 steht in `next.config.mjs`.
>
> Uebernommen wurde aus dem geloeschten Eintrag: der englische Begriff „Fat
> Cap", der Trimm-Korridor 6–8 mm statt pauschal 6 mm, die Gelatinisierung
> beider Muskeln beim Low-and-Slow-Garen und die Spritz-Regel ab 65 °C
> Kerntemperatur. Der Begriff „Packer-Cut" selbst steht jetzt im
> Definitionsabsatz von `packer-brisket`, damit die Suchphrase nicht mit dem
> Slug verschwindet.
>
> **Zwei Fehler wurden bewusst NICHT uebernommen:**
> - „Das komplette Packer-Brisket wiegt 12-16 kg" — gemeint sind 12–16 lb.
>   Derselbe Einheitenfehler war am selben Tag schon in `packer-brisket.mdx`
>   korrigiert worden; im Zwillingseintrag stand er noch.
> - „die Firma Packers standardisierte dieses Zuschnittformat" — es gibt keine
>   Firma dieses Namens. Der Name kommt von den Schlachtbetrieben (packing
>   houses), die das Bruststueck so verpacken. `packer-brisket.mdx` hatte die
>   richtige Herleitung bereits.
>
> Belegt am 21.09.2026: beide Eintraege sind praktisch gleichwertig
> (174 gegen 181 Woerter, beide vom 23.05.2026, beide Kategorie
> „Cuts & Teilstuecke", je ein eingehender Link). Beide Begriffe stehen
> nebeneinander im Fliesstext von `content/cuts/brisket.mdx` — Zeile 35
> „Ein volles Packer-Brisket …", Zeile 126 „… kein Packer-Cut".
>
> Das Paar `stall` / `plateauphase` ist **nicht** betroffen: `taxonomie.yaml`
> fuehrt dort `plateauphase: stall` und stimmt mit dem Vorschlag ueberein.

Ebenfalls aus demselben Lauf, bereits durch die Cluster oben abgedeckt:
`kerntemperatur-*` (6 Eintraege, Cluster `kerntemperatur`) und `kollagen-*`
(4 Eintraege, Cluster `kollagen`).

---

## Nachtrag 09.10.2026 — 25 Eintraege zusammengelegt (SEO-Audit 08.10.2026)

Was anders ist als bei `bark` und `packer-cut`: Die Weiterleitungen stehen nicht
mehr einzeln in `next.config.mjs`, sondern als Liste in `data/taxonomie.yaml`
(`glossar_weiterleitungen`, Slug → Ziel-URL). Daraus baut `next.config.mjs` die
301, `glossarDublette()` sperrt die Neuanlage (Gate und Glossar-Agent), und
`src/__tests__/glossar-weiterleitungen.test.ts` prueft, dass keine Datei und kein
interner Link mehr auf einen alten Slug zeigt und jedes Ziel existiert.

Zusammengelegt wurden nur Eintraege ohne eigenen Begriffsinhalt: die
Fuellwort-Permutationen nach `glossar_fuellwort_suffixe` (`kerntemperatur-*`,
`wagyu-{farm,kenner,pioneer,wissen,zubereitungen}`), die beiden Synonyme aus
`glossar_synonyme` (`kollagen-umwandlung`, `plateauphase`), dazu `wagyu-hotdog`,
`wagyu-burger` (Gerichte, keine Begriffe), `smoker-{fans,enthusiasten,long,test,
designs,setup,aufbau}`, `brisket-{evangelium,rezept,smoker}`,
`wettkampf-grillmeister` und die Schreibvariante `wettbewerbs-pitmaster`.
Inhalt wurde nicht uebernommen — die Eintraege bestanden aus der Schablone
Definition/Hintergrund/Praxistipp ohne Fakten, die dem Ziel fehlen; einzig die
Suchphrasen „Plateauphase" und „Kollagen-Umwandlung" stehen jetzt in der
Definition ihres Hubs. 16 interne Links in `content/` zeigen direkt auf die Ziele.

**Offen bleiben** (echte Begriffe oder Hub-Dubletten, die eine Redaktions-
Entscheidung brauchen): `maillard-*`, `dry-*`, `infrarot-*`, `medium-*`,
`oberhitze-*`, `rub-*`, `wagyu-{rinder,zucht,kreuzungen,zertifikat,brisket}`,
`wettkampf-{standards,pitmaster,team}`, `brisket-{test,buns}`,
`smoker-{monitoring,finish}` — und die Glossar-Dubletten zu Hub-Seiten
(`reverse-sear`, `sous-vide`, `minion-methode`, `direktes-/indirektes-grillen`,
`rotisserie`, `plancha`, `low-slow`, `oberhitze-grillen`, `oberhitzegrill-vergleich`,
`rib-eye`, `pulled-pork`), die je 1–11 eingehende Links tragen.
