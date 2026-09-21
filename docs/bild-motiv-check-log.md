# Bild-Motiv-Check — Belegter Lauf (21.09.2026)

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

## Entscheidung

**Bedingung aus PR #180 ist NICHT erfüllt.** Sie verlangt eine belegte
Trefferquote „insbesondere ohne falsch positive Ablehnungen" — dieser Lauf
liefert fünf. `--strict` bleibt aus in `.github/workflows/content-gates.yml`.
Ein scharf geschalteter Gate hätte in diesem einen Lauf fünf unbeteiligte PRs
blockiert (fleischthermometer, grills, messer, premium-fleischthermometer,
pulled-pork), bei nur zwei echten Treffern.

**Was der Lauf trotzdem wert war:** Er hat die zwei bereits über `CREDITS.md`
bekannten Bugs (`kuechenmaschine-vergleich`, `oberhitzegrill-vergleich`)
reproduzierbar bestätigt — Recall auf den bekannten Fällen ist 2/2. Das
Präzisionsproblem liegt in der Abgleich-Logik, nicht in der Grundidee.

**Offen, bevor ein zweiter Beleg-Lauf sich lohnt:** Stufe 2 sollte nicht mehr
angewiesen werden, „was spricht dagegen" zu erfinden, wenn der Alt-Text die
angebliche Behauptung gar nicht enthält — der messer-Fall zeigt das an einem
klaren Beispiel. Ein Fix dafür ist nicht Teil dieser Änderung (Verhaltensänderung
am Prompt ist ein eigener Schritt, keiner, der beim Beleg-Lauf nebenbei passiert).

Die zwei echten Bugs sind jetzt in `data/bildregister.yaml` als
`motiv_strittig: true` geführt (bisher stand das nur in `CREDITS.md`), damit sie
über den Content-Qualitäts-Datenpfad sichtbar bleiben statt nur in einem
Ordner-Kommentar.
