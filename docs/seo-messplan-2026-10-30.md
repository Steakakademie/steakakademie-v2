# SEO-Messplan — Antwortseiten Hackfleisch und Steak (Messungen 30.10. und 20.11.2026)

> Abteilung Wachstum (SEO/GEO). Stand 10.10.2026. Quelle: Search-Console-API über
> `scripts/gsc-abruf.mjs` (Anleitung `docs/gsc-abruf.md`), Auswertung über
> `scripts/gsc-messung.mjs`. Rohdaten liegen nur lokal in `privat/gsc/` (gitignored);
> hier stehen ausschließlich Summen.

## Frage
Schlägt eine **eigene Antwortseite je Frage** die Sammelseite `/temperatur-guide`?
Zwei Tests: `/kerntemperatur-hackfleisch` (live seit 09.10.2026, Anfragen standen bei
Position ~9) und `/kerntemperatur-steak` (live seit 10.10.2026, Anfragen standen bei
Position ~22–32). Steigen Position und Klickrate, und welche Seite listet Google?

## Ausgangswert (vor den Seiten)
Zeitraum **11.09.–08.10.2026** (28 Tage, Websuche, Property `sc-domain:steakakademie.de`,
abgerufen am 10.10.2026; der Verlauf reicht wegen des Datenverzugs bis 06.10.).
Erzeugt mit `node scripts/gsc-messung.mjs privat/gsc/2026-10-10_28-tage-vorher`:

| Gruppe | Anfragen | Impressionen | je Tag | Klicks | Ø Position | rankende Seite(n) |
|---|---|---|---|---|---|---|
| Hackfleisch / Frikadellen / Burger | 101 | 2.709 | 96,8 | 2 | 8,2 | `/temperatur-guide` 100 % |
| Chateaubriand | 55 | 760 | 27,1 | 1 | 11,3 | Rezeptseite 100 % |
| Schnitzel | 5 | 85 | 3,0 | 0 | 9,1 | `/temperatur-guide` 100 % |
| Spanferkel | 3 | 32 | 1,1 | 0 | 32,2 | `/temperatur-guide` 100 % |
| Schwein allgemein | 51 | 116 | 4,1 | 0 | 14,9 | `/temperatur-guide` 100 % |
| **Steak / Rind / Ribeye / Filet** | 147 | 409 | 14,6 | 0 | **21,9** | `/temperatur-guide` 78 %, Chateaubriand 9 % |
| Geflügel / BfR | 11 | 22 | 0,8 | 1 | 10,5 | `/temperatur-guide` 100 % |
| Kerntemperatur allgemein | 78 | 820 | 29,3 | 2 | 9,5 | `/temperatur-guide` 87 % |

| Seite | Impressionen | je Tag | Klicks | CTR | Position |
|---|---|---|---|---|---|
| `/kerntemperatur-hackfleisch` | 0 | — | 0 | — | — (Seite gab es nicht) |
| `/kerntemperatur-steak` | 0 | — | 0 | — | — (Seite gab es nicht) |
| `/temperatur-guide` | 9.824 | 350,9 | 22 | 0,22 % | 8,4 |
| `/cuts/ribeye` | 0 | — | 0 | — | — |
| `/rezepte/fleisch/chateaubriand-filet` | 1.308 | 46,7 | 3 | 0,23 % | 10,4 |

Gesamt im Fenster: 13.119 Impressionen, 59 Klicks. Zum Vergleich der 90-Tage-Abruf
(10.07.–06.10.): 36.087 Impressionen, 191 Klicks. Nur rund 37 % der Impressionen sind einzeln
als Suchanfrage ausgewiesen, der Rest ist anonymisiert — Gruppensummen sind eine Untergrenze.

**Die Gruppen sind Teil der Definition.** Sie stehen im Skript `gsc-messung.mjs` (festgelegte
Reihenfolge, eine Anfrage zählt nur in der ersten passenden Gruppe). Wer die Muster ändert,
muss den Ausgangswert neu erzeugen, sonst vergleicht man zwei verschiedene Mengen.

## Messung 1 — 30.10.2026: Hackfleisch
Zeitraum **14.10.–27.10.2026** (14 Tage; Indexierung abwarten, Datenverzug 3 Tage):

```bash
node scripts/gsc-abruf.mjs --von 2026-10-14 --bis 2026-10-27
# Ordner umbenennen, sonst überschreibt der nächste Lauf ihn:
#   privat/gsc/<abrufdatum>  →  privat/gsc/2026-10-30_messung-1
node scripts/gsc-messung.mjs privat/gsc/2026-10-30_messung-1
```

Verglichen wird nach **Impressionen je Tag** (die Spalte „je Tag" liefert das Skript):

1. Hackfleisch: Impressionen/Tag (Ausgangswert 96,8), Ø Position (8,2), **welche Seite
   rankt** — in `suchanfrage-seite.csv` nach Hack-Anfragen filtern: `/kerntemperatur-hackfleisch`
   oder `/temperatur-guide`?
2. `/kerntemperatur-hackfleisch`: Impressionen, Klicks, CTR, Position.
3. `/temperatur-guide`: CTR (Ausgangswert 0,22 %) und Impressionen/Tag (350,9).
4. Steak: **nur Indexierung prüfen** (URL-Prüfung `/kerntemperatur-steak`), noch keine
   Ranking-Bewertung — die Seite ist erst 3 Wochen alt.
5. Von Hand in der Search Console: URL-Prüfung `/kerntemperatur-hackfleisch`,
   `/kerntemperatur-steak`, `/cuts/ribeye`; Seiten → „Nicht indexiert" (29 alte
   Glossar-URLs als „Seite mit Weiterleitung").
6. Plausible: Ereignis `Angebot_Klick` auf den Seiten `antwortseite` und `rettung`
   (Regale aus #373): werden sie angeklickt?

## Messung 2 — 20.11.2026: Steak (und zweiter Blick auf Hackfleisch)
Zeitraum **04.11.–17.11.2026** (14 Tage; Datenverzug 3 Tage, die Steak-Seite hatte gut drei
Wochen zur Indexierung):

```bash
node scripts/gsc-abruf.mjs --von 2026-11-04 --bis 2026-11-17
# Ordner umbenennen → privat/gsc/2026-11-20_messung-2
node scripts/gsc-messung.mjs privat/gsc/2026-11-20_messung-2
```

1. **Steak-Gruppe** (Ausgangswert: 14,6 Impressionen/Tag, Ø Position **21,9**, 0 Klicks):
   Position, Impressionen/Tag und vor allem **welche Seite rankt** — `/kerntemperatur-steak`
   statt `/temperatur-guide`? Einzelanfragen: „kerntemperatur steak", „steak kerntemperatur",
   „kerntemperatur ribeye", „kerntemperatur rindersteak".
2. `/kerntemperatur-steak`: Impressionen, Klicks, CTR, Position.
3. Hackfleisch gegenüber Messung 1: Hält sich der Effekt, oder war er ein Ausreißer?
4. Chateaubriand-Rezeptseite: CTR (Ausgangswert 0,23 %; Snippet seit 10.10. neu).
5. Entscheidung: Lohnen sich Schwein und Geflügel/BfR als eigene Seiten (Ziele 3 und 4 aus
   `privat/seo-geo/themenluecken-2026-10-10.md`)?

## Entscheidungsregel
Eine eigene Antwortseite gilt als **belegt**, wenn für ihre Anfragen (a) die neue Seite statt
des Guides gelistet wird **und** (b) Ø Position und Impressionen/Tag gegenüber dem Ausgangswert
besser sind. Nur (a) ohne (b) heißt: Google ordnet die Seite zu, belohnt sie aber nicht.
Ein Unterschied von wenigen Klicks ist kein Ergebnis.

## Grenzen
- **14 Tage Messfenster, kleine Zahlen** (Klicks im einstelligen Bereich): ein Unterschied von
  wenigen Klicks ist Rauschen. Aussagekräftig sind Position, Impressionen/Tag und die Frage,
  **welche Seite** gelistet wird.
- Die Seiten wurden mit Links, Regalen und IndexNow ergänzt (#369, #371, #373, #377): Effekte
  lassen sich nicht einzeln zuordnen, nur gemeinsam.
- Ranking-Änderungen brauchen oft 2–6 Wochen; ein Befund vom 30.10. ist ein Zwischenstand.
- Der Bericht „Generative KI" ist nicht per API abrufbar; dafür bleibt der Export von Hand.
- Saison: Im November beginnt die Grill-Nebensaison, die Gesamt-Impressionen können sinken.
  Deshalb zählen Position und Anteil der Seite, nicht die absolute Zahl.
