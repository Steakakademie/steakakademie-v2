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

## Lauf 3 — 22.09.2026, Stabilitätsmessung (`gyutan-sendai.jpg`, identischer Input, `temperature: 0`)

Bisher prüften Lauf 1 und 2 die Präzision — dieselben Bilder gegen
unterschiedliche Motive. Lauf 3 prüft etwas anderes: **dasselbe Bild gegen sich
selbst**, an aufeinanderfolgenden Tagen, ohne jede Änderung an Bild, Alt-Text,
Titel oder Skript. `temperature: 0` steht in beiden `callClaude`-Aufrufen in
`scripts/check-bild-motiv.mjs` fest verdrahtet — die Erwartung war
Reproduzierbarkeit.

**Von Uwe berichtet:** gestern 3× `passt`, heute 6× `unpassend` — bei
identischem Bild, identischem Alt-Text, identischem Titel, identischer
`temperature: 0`.

**Zur Bestätigung selbst nachgestellt** (22.09.2026, sechs Läufe
`node scripts/check-bild-motiv.mjs content/rezepte/gyutan-sendai.mdx`
hintereinander, wenige Minuten auseinander): **1× `passt`, 5× `unpassend`.**
Nicht-Determinismus bei `temperature: 0` ist damit nicht nur über Tage,
sondern schon innerhalb einer einzigen Sitzung reproduzierbar — die
Zeitspanne allein erklärt es nicht.

| Lauf | Urteil | Stufe-1-Merkmal „Fettkante" | Stufe-2-Begründung |
|---|---|---|---|
| 1 | passt | „Keine Fettkante sichtbar" | „Alle Merkmale passen" |
| 2 | unpassend | „Keine sichtbare Fettkante" | „Keine Fettkante typisch für Rinderzunge. Eher Rinderfilet oder Roastbeef." |
| 3 | unpassend | „Keine Fettkante vorhanden" | „Keine Fettkante typisch für Rinderzunge. Regelmäßiger Faserverlauf spricht für Muskelfleisch wie Roastbeef." |
| 4 | unpassend | „Keine sichtbare Fettkante" | „Keine sichtbare Fettkante typisch für Rinderzunge. Merkmale deuten auf Roastbeef oder Carpaccio." |
| 5 | unpassend | „Keine sichtbare Fettkante" | „Keine sichtbare Fettkante typisch für Rinderzunge. Merkmale deuten auf Roastbeef oder Carpaccio." |
| 6 | unpassend | „Keine sichtbare Fettkante" | „Keine Fettkante typisch für Rinderzunge. Eher Roastbeef oder Carpaccio." |

**Einordnung, wo die Varianz sitzt:** Uwes Befund (gestern/heute) führt sie auf
Stufe 1 zurück — eine zwischen Sitzungen schwankende Merkmalsliste. In meinen
sechs Läufen war ausgerechnet das Merkmal „Fettkante" in Stufe 1 durchgehend
stabil (alle sechs Läufe melden „keine/keine sichtbare Fettkante") — variiert
hat stattdessen, wie Stufe 2 dieselbe Stufe-1-Aussage bewertet: einmal als
neutral/passend (Lauf 1), fünfmal als Ablehnungsgrund (Läufe 2–6). Beide
Beobachtungen widersprechen sich nicht — sie zeigen zwei verschiedene
Varianzquellen (Stufe 1 UND Stufe 2), je nachdem, welche Stichprobe man zieht.
Für die Schlussfolgerung ist das ohne Belang: **ob die Varianz in Stufe 1,
Stufe 2 oder beiden sitzt — bei identischem Input darf ein Gate nicht
zwischen bestanden und abgelehnt wechseln.** Das ist unabhängig vom
Präzisionsproblem aus Lauf 1/2 ein eigenständiges, fundamentales Argument
gegen `--strict`: selbst ein perfekt präziser Check wäre als Gate untauglich,
wenn er bei unverändertem Bild von Lauf zu Lauf das Urteil wechselt — ein PR
würde dann nicht am Inhalt scheitern, sondern an der Sekunde, in der die CI
zufällig lief.

## Korrektur zur Recall-Begründung aus #183 (Logik-Inversion bei `gyutan-sendai.jpg`)

\#183 zählte `gyutan-sendai.jpg` als vom zweistufigen Check „richtig erkannt"
und leitete daraus **Recall = 2/3** ab. Die Zahl selbst bleibt zutreffend für
den damals ausgewerteten Lauf (der hat tatsächlich `unpassend` ausgegeben,
passend zum bekannten echten Fehler) — **die Begründung dahinter war falsch.**
\#183 suggerierte „saubere Merkmalserkennung". Lauf 3 zeigt: das war sie nicht.

**Der fachliche Fehler:** Rinderzunge hat anatomisch KEINE Fettkante — das ist
seit PR #179 als Ground Truth im Repo dokumentiert (`motiv_hinweis` in
`data/bildregister.yaml`: „Erkannt an der Fettkante an einzelnen Scheiben
[Uwe]; Zunge hat keine."). Die Stufe-2-Begründungen aus Lauf 3 (Tabelle oben)
argumentieren aber durchgehend in die andere Richtung: „Keine Fettkante
typisch für Rinderzunge" wird als Grund GEGEN die Rinderzungen-Behauptung
verwendet, mit der Schlussfolgerung „eher Roastbeef/Carpaccio" — also
funktional so, als würde das Modell eine Fettkante für Rinderzunge ERWARTEN
und ihr Fehlen als Widerspruch werten. Genau umgekehrt zur fachlichen
Tatsache: Das Fehlen einer Fettkante spricht FÜR Rinderzunge, nicht dagegen.

**Zusammen mit der in Lauf 3 belegten Instabilität ergibt sich:** Das Modell
hat `gyutan-sendai.jpg` nicht durch saubere Merkmalserkennung als unpassend
erkannt, sondern durch ein fachlich umgekehrtes Argument (Fettkante-Erwartung
bei einem Cut, der keine hat), das je nach Lauf mal zum — zufällig richtigen —
Urteil „unpassend" führt und mal nicht. Der 2/3-Recall aus #183 ist damit kein
Beleg für einen funktionierenden Erkennungsmechanismus bei diesem Bild,
sondern ein Schnappschuss eines Laufs, dessen Begründung falsch und dessen
Ausgang instabil ist. Für andere Bilder (`kuechenmaschine-vergleich`,
`oberhitzegrill-vergleich`) gilt das nicht — dort war die Stufe-1-Beschreibung
selbst eindeutig themenfremd (Meer, Steg), keine fachlich umgekehrte
Einzelargumentation.

## Entscheidung

**Bedingung aus PR #180 ist NICHT erfüllt — nach drei Läufen deutlicher als
nach einem.** Sie verlangt eine belegte Trefferquote „insbesondere ohne falsch
positive Ablehnungen". Lauf 1 lieferte fünf falsch positive Ablehnungen von
sieben; Lauf 2 lieferte acht von acht in der Stichprobe, bei einer
Ablehnungsquote von 80 % über 167 Bilder. `--strict` bleibt aus in
`.github/workflows/content-gates.yml`. Ein scharf geschalteter Gate hätte allein
in Lauf 2 den Großteil aller Rezept-PRs blockiert, ohne dass in der Stichprobe
auch nur ein einziger Treffer echt war.

**Lauf 3 macht die Ablehnung von `--strict` kategorisch, nicht nur graduell.**
Selbst wenn die Präzisionsprobleme aus Lauf 1/2 eines Tages behoben wären: ein
Check, der bei `temperature: 0` und unverändertem Bild zwischen `passt` und
`unpassend` wechselt (belegt sowohl über Tage — Uwes 3×/6×-Befund — als auch
innerhalb einer Sitzung — die sechs Läufe oben), kann kein Gate tragen. Ein
Gate muss bei gleichem Input gleich urteilen; dieses tut es nicht.

**Was die Läufe trotzdem wert waren:** Lauf 1 hat die zwei bereits über
`CREDITS.md` bekannten Bugs (`kuechenmaschine-vergleich`,
`oberhitzegrill-vergleich`) reproduzierbar bestätigt — dort war die
Stufe-1-Beschreibung eindeutig themenfremd, kein Grenzfall. Der dritte bekannte
Fall (`gyutan-sendai.jpg`) zählt weiterhin formal als Treffer (Recall **2/3**),
aber mit der in Lauf 3 belegten Einschränkung: kein sauberer Fund, sondern ein
fachlich umgekehrtes Argument plus Instabilität (Details oben). Das
Präzisionsproblem liegt in der Abgleich-Logik, nicht in der Grundidee — die
Instabilität liegt tiefer, im Modellverhalten bei `temperature: 0` selbst.

**Offen, bevor ein vierter Beleg-Lauf sich lohnt:** drei strukturelle Ursachen
sind jetzt belegt, nicht nur vermutet — Stufe-2-Context-Pollution (Seitentitel
statt reinem Alt-Text als Erwartungsquelle), Stufe-1-Negativ-Fehlschluss
(Nicht-Erwähnung eines Merkmals wird als dessen Abwesenheit gewertet) und
Nicht-Determinismus bei `temperature: 0` (Lauf 3). Ein Fix dafür ist nicht Teil
dieser Änderung (Verhaltensänderung am Prompt bzw. an der Modellkonfiguration
ist ein eigener Schritt, keiner, der beim Beleg-Lauf nebenbei passiert) — aber
alle drei Ursachen sind jetzt konkret genug, um sie gezielt anzugehen, statt
weiter nur Stichproben zu ziehen. Ein weiterer Beleg-Lauf lohnt sich erst,
wenn mindestens die Instabilität angegangen ist — sonst misst jeder weitere
Lauf nur wieder Rauschen.

Die zwei echten Bugs sind in `data/bildregister.yaml` als
`motiv_strittig: true` geführt (bisher stand das nur in `CREDITS.md`), damit sie
über den Content-Qualitäts-Datenpfad sichtbar bleiben statt nur in einem
Ordner-Kommentar.
