# Bild-Motiv-Check — Belegte Läufe (21.09.2026)

**Zweck dieser Datei:** Die Bedingung aus [#180](https://github.com/Steakakademie/steakakademie-v2/pull/180)
für `--strict` in `.github/workflows/content-gates.yml` verlangt eine belegte
Trefferquote über mindestens zehn geänderte Bilder, „insbesondere ohne falsch
positive Ablehnungen" (Entscheidung Uwe, 21.09.2026). `data/bild-motiv-report.json`
kann das nicht leisten — gitignored, wird bei jedem Lauf überschrieben. Diese
Datei ist der dauerhafte Ort dafür und wird bei jedem weiteren Beleg-Lauf ergänzt,
nicht ersetzt.

## Lauf 1 — 21.09.2026, 10 Bilder (`--bereich vergleich`, `--bereich cuts`)

Beide Bereiche vollständig durchlaufen (Weg a aus dem Skriptkopf: Stichprobe in
einem Zug statt über Wochen verteilt). Jede Ablehnung des Modells wurde danach
von Hand gegen das tatsächliche Bild geprüft (Datei geöffnet, nicht nur den
Report gelesen).

| Seite | Bild | Modell-Urteil | Modell-Begründung | Manuelle Prüfung | Befund |
|---|---|---|---|---|---|
| `vergleich/dry-aging-kuehlschrank-vergleich` | dry-aging-kuehlschrank-vergleich.webp | passt | Reifeschrank-Merkmale konsistent | Bild zeigt Reifeschrank | ✅ richtig bestanden |
| `vergleich/fleischthermometer` | fleischthermometer.jpg | **unpassend** | „Keine Fettkante — eher wissenschaftliche Fleischuntersuchung" | Bild zeigt eindeutig gegrillte/geräucherte Ribs auf einem Brett neben zwei ThermoPro-Thermometern, genau wie im Alt-Text | ❌ **falsch positiv.** Fehlende Fettkante ist kein Widerspruch zum Alt-Text (der keine behauptet) |
| `vergleich/grills` | grills.jpg | **unpassend** | „Kein Rauch sichtbar, Alt-Text behauptet Rauch" | Bild zeigt einen Kugelgrill im Garten; ein feiner Rauchschleier ist im oberen Bildbereich erkennbar, wenn auch schwach. Grundmotiv (Grill, Garten) ist unstrittig richtig | ❌ **falsch positiv** (mindestens im Kernmotiv; die Rauch-Einzelbehauptung ist bestenfalls strittig, kein Themenfehler) |
| `vergleich/kuechenmaschine-vergleich` | kuechenmaschine-vergleich.webp | **unpassend** | „Felsinsel im Meer — fachfremdes Motiv, keine Küchenmaschine" | Bild zeigt zweifelsfrei eine Felsformation im Meer, keine KitchenAid | ✅ **richtig abgelehnt — echter Bug**, bereits vor diesem Lauf in `CREDITS.md` als „noch falsch" bekannt |
| `vergleich/messer` | messer.jpg | **unpassend** | „Schneidebrett ist hell, nicht dunkel wie im Alt-Text behauptet" | Der Alt-Text behauptet bereits „hellen Holzschneidebrett vor **dunklem** Holzuntergrund" — exakt das, was das Bild zeigt. Das Modell widerspricht seiner eigenen Eingabe | ❌ **falsch positiv, Stufe-2-Bug.** Die Abgleich-Stufe hat einen Widerspruch erfunden, der im Alt-Text gar nicht besteht |
| `vergleich/oberhitzegrill-vergleich` | oberhitzegrill-vergleich.webp | **unpassend** | „Steg über Wasser, Windfahne — Hafenszene, kein Grill" | Bild zeigt zweifelsfrei einen Steg/eine Seebrücke, keinen Grill | ✅ **richtig abgelehnt — echter Bug**, bereits vor diesem Lauf in `CREDITS.md` als „noch falsch" bekannt |
| `vergleich/premium-fleischthermometer` | hero-thermometer.jpg | **unpassend** | „Keine Fettkante — Ribeye ist für Fettmarmorierung bekannt" | Bild zeigt eindeutig ein dickes Steak auf glühender Kohle mit Rauch, aus einer Perspektive ohne freie Sicht auf eine Fettkante. Kein Hinweis auf ein anderes Gericht/Gerät | ❌ **falsch positiv.** Ob spezifisch „Ribeye" nie zu 100 % aus einem Ausschnitt beweisbar — kein Themenfehler |
| `cuts/brisket` | brisket.jpg | passt | Merkmale konsistent mit Brisket | Bild zeigt Brisket-Scheiben | ✅ richtig bestanden |
| `cuts/pulled-pork` | pulled-pork.jpg | **unpassend** | „Heiße Metallfläche — typisch Teppanyaki, nicht Pulled Pork" | Bild zeigt gezupftes, gewürztes Schweinefleisch mit sichtbarer Faserstruktur auf einem **Holz**brett mit Dampf — keine Metallfläche | ❌ **falsch positiv.** Stufe-1-Fehleinschätzung der Oberfläche (Holz als Metall gelesen) |
| `cuts/ribeye` | ribeye-premium-cut.webp | passt | Fettkante, Garzustand, Schnittmuster konsistent mit Ribeye | Bild zeigt Ribeye | ✅ richtig bestanden |

**Auszählung:** 10 geprüft · 3 korrekt bestanden · 2 korrekt abgelehnt (echte,
bereits bekannte Bugs) · **5 falsch positiv abgelehnt.**

Von 7 Ablehnungen waren **5 falsch** — eine Falsch-positiv-Quote von rund 71 %
unter den Ablehnungen. Zwei Fehlerarten sind belegt, nicht nur vermutet:

1. **Stufe-1-Fehllesung** (pulled-pork): Bildbeschreibung nennt eine Oberfläche,
   die im Bild nicht vorhanden ist (Metall statt Holz).
2. **Stufe-2-Selbstwiderspruch** (messer): Die Abgleich-Stufe „findet" einen
   Widerspruch zum Alt-Text, den der Alt-Text gar nicht behauptet — sie hat ihn
   nicht korrekt gelesen.

## Lauf 2 — 21.09.2026, 167 Bilder (`--bereich rezepte`)

Zweiter Beleg-Lauf, diesmal über den mit Abstand größten Content-Bereich
(118 Rezept-Seiten, 167 geprüfte Bilder — mehrere Rezepte führen `image` UND
`heroImage`). Lauf und Stichprobenauswertung kamen von Uwe (Screenshot der
Ergebnisse); diese Zeilen fassen sie zusammen. Anders als bei Lauf 1 habe ich
in dieser Sitzung nicht jedes Bild selbst geöffnet — dieser Unterschied in der
Prüftiefe steht hier bewusst, statt ihn zu verwischen.

- **167 Bilder geprüft, 134 als „unpassend" abgelehnt** — 80 % Ablehnungsquote.
- **Stichprobe von 8 Ablehnungen manuell gegengeprüft: 8 von 8 waren falsch
  positiv** — 0 % Präzision in dieser Stichprobe.

Rezeptseiten schlagen damit noch deutlich schärfer daneben als der
vergleich/cuts-Lauf oben (71 % falsch positiv dort, 100 % in dieser Stichprobe
hier). Zwei strukturelle Fehlerursachen, die in Lauf 1 nur als Einzelbeobachtung
auftauchten, sind damit als Muster erkennbar:

1. **Stufe-2-Context-Pollution.** Die Abgleich-Stufe bekommt neben dem Alt-Text
   zusätzlich den Seitentitel (`titel` in `scripts/check-bild-motiv.mjs`,
   Stufe 2 — `data.title || data.seoTitle`). Rezepttitel sind SEO-optimiert und
   tragen oft mehr Begriffe, als der Alt-Text abdeckt oder ein einzelnes Bild
   zeigen kann. Das Modell prüft dann faktisch gegen den Titel statt gegen den
   Alt-Text — und lehnt ab, sobald ein Titel-Begriff im Bild fehlt, obwohl der
   Alt-Text diesen Begriff nie behauptet hat. Gleiche Grundform wie der
   messer-Selbstwiderspruch aus Lauf 1, nur mit dem Titel statt dem Alt-Text
   als Quelle der erfundenen Erwartung.
2. **Stufe-1-Negativ-Fehlschluss.** Stufe 1 liefert eine Merkmalsliste, die
   laut Prompt nicht erschöpfend sein muss. Stufe 2 sieht aber nur diese
   Liste, nicht das Bild selbst — fehlt ein Merkmal darin, wertet das Modell
   das als „nicht vorhanden" statt als „nicht erwähnt". Exakt das Muster
   hinter den „Keine Fettkante erkennbar/sichtbar"-Ablehnungen aus Lauf 1
   (`fleischthermometer.mdx`, `premium-fleischthermometer.mdx`) — dort schon
   einmal beobachtet, hier über die 8-von-8-Stichprobe als wiederkehrendes
   Muster bestätigt.

## Recall-Korrektur (über alle bekannten Fälle, nicht nur Lauf 1)

Die Recall-Angabe aus Lauf 1 („2/2") war zu eng gefasst — sie zählte nur die in
Lauf 1 selbst gefundenen Treffer. Über alle bislang bekannten echten
Motiv-Fehler zählt zusätzlich `gyutan-sendai.jpg`: der **ursprüngliche,
einstufige** Bild-Motiv-Check hatte dieses Bild bestätigt (falsch negativ) —
erst die zweistufige Blindprüfung aus PR #178 hat es richtig als unpassend
erkannt (wörtlich aus dem `motiv_hinweis` in `data/bildregister.yaml`: „Der
urspruengliche Bild-Motiv-Check hatte das Bild bestaetigt; erst die
Blindpruefung (PR #178) meldet es als unpassend."). Über die drei bislang
bekannten echten Fälle (`gyutan-sendai`, `kuechenmaschine-vergleich`,
`oberhitzegrill-vergleich`) ergibt das:

**Recall = 2/3** — zwei von drei bekannten Motiv-Fehlern wurden von der
jeweils aktuellen Fassung des Checks erkannt, einer (gyutan, unter der alten
Einstufen-Fassung) nicht.

## Entscheidung

**Bedingung aus PR #180 ist NICHT erfüllt — nach zwei Läufen deutlicher als
nach einem.** Sie verlangt eine belegte Trefferquote „insbesondere ohne falsch
positive Ablehnungen". Lauf 1 lieferte fünf falsch positive Ablehnungen von
sieben; Lauf 2 lieferte acht von acht in der Stichprobe, bei einer
Ablehnungsquote von 80 % über 167 Bilder. `--strict` bleibt aus in
`.github/workflows/content-gates.yml`. Ein scharf geschalteter Gate hätte allein
in Lauf 2 den Großteil aller Rezept-PRs blockiert, ohne dass in der Stichprobe
auch nur ein einziger Treffer echt war.

**Was die Läufe trotzdem wert waren:** Lauf 1 hat die zwei bereits über
`CREDITS.md` bekannten Bugs (`kuechenmaschine-vergleich`,
`oberhitzegrill-vergleich`) reproduzierbar bestätigt. Über alle bislang
bekannten echten Fälle liegt der Recall bei **2/3** (siehe Korrektur oben,
`gyutan-sendai.jpg` zählt als falsch negativ unter der alten Einstufen-Fassung).
Das Präzisionsproblem liegt in der Abgleich-Logik, nicht in der Grundidee.

**Offen, bevor ein dritter Beleg-Lauf sich lohnt:** zwei strukturelle Ursachen
sind jetzt über beide Läufe hinweg belegt, nicht nur vermutet — Stufe-2-Context-
Pollution (Seitentitel statt reinem Alt-Text als Erwartungsquelle) und
Stufe-1-Negativ-Fehlschluss (Nicht-Erwähnung eines Merkmals wird als dessen
Abwesenheit gewertet). Ein Fix dafür ist nicht Teil dieser Änderung
(Verhaltensänderung am Prompt ist ein eigener Schritt, keiner, der beim
Beleg-Lauf nebenbei passiert) — aber beide Ursachen sind jetzt konkret genug,
um sie gezielt anzugehen, statt weiter nur Stichproben zu ziehen.

Die zwei echten Bugs sind in `data/bildregister.yaml` als
`motiv_strittig: true` geführt (bisher stand das nur in `CREDITS.md`), damit sie
über den Content-Qualitäts-Datenpfad sichtbar bleiben statt nur in einem
Ordner-Kommentar.
