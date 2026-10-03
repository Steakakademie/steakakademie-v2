# Der Wächter — keine Zusage ohne Beleg

**Stand:** 03.10.2026 · **Abteilung:** Systems & Ops · **Kosten:** 0 €
**Konzept:** claude.ai-Projekt „Steakakademie", `konzept_waechter_2026-10-02` (Freigabe Uwe). Gebaut ist **Schritt 1**.

## Zweck

Die Erstinventur vom 03.10.2026 fand 431 Zusagen im Seitentext; 150 davon deckte nichts — „jeden Freitag" ohne eine versendete Kampagne, „7 Lektionen" bei 11. Die vorhandenen Wächter prüfen Abläufe und Inhalte, keiner prüft eine Zusage gegen das, wovon sie abhängt. Seit Schritt 1 gilt:

1. **Was die Seite verspricht, steht im Register** — `data/zusagen.yaml`, ein Eintrag je Versprechen, mit Beleg.
2. **Neue Zusagen ohne Beleg kommen nicht auf `main`** — Gate `scripts/check-zusagen.mjs` in `npm run check`, also im Pflicht-Check „P0-Gates pruefen".
3. **Jeder Beleg wird täglich ausgewertet** — `scripts/zusagen-belege.mjs`, läuft im Ops-Heartbeat mit und nutzt dessen Meldeweg (Job-Summary, roter Lauf, Issue, Jira).

Der Wächter beweist **Deckung, nicht Qualität**: Dass die Willkommensstrecke sendet, sagt nichts darüber, ob die Mail gut ist.

## Befehle

| Befehl | Was er tut |
|---|---|
| `npm run check:zusagen` | Gate: Register, Fundstellen, Belege ohne Netz, Zusage-Muster im Seitentext. Rund 4 s. |
| `npm run check:zusagen -- --alle` | zeigt auch die Treffer aus der Baseline |
| `npm run check:zusagen:baseline` | schreibt `data/zusagen-baseline.json` neu (nur nach einer Korrektur) |
| `npm run zusagen:belege` | alle Belege jetzt auswerten, auch die mit Netz (nur lesend). Ohne Schlüssel in der Umgebung melden Loops- und Supabase-Belege „nicht prüfbar". |

## Das Register

```yaml
- id: spickzettel-link-per-mail          # kebab-case, eindeutig
  zusage: Wer die Anmeldung bestätigt, bekommt den Link zur Druckseite per Mail.
  wo:                                     # jede Fundstelle: Datei + Textstück
    - datei: src/app/cuts/page.tsx
      muster: "Wir schicken dir den Link zum druckfertigen Spickzettel mit allen Garstufen."
  beleg:                                  # ein Beleg oder eine Liste — alle müssen halten
    - typ: loops
      art: workflow
      id: cmt1wxrmn07uo0j0aofqglkmv
      betreff: Spickzettel
  bei_bruch: Den Satz herausnehmen, bis die Willkommensstrecke wieder sendet.
  abteilung: Wachstum                     # eine der fünf
  seit: "2026-10-03"
```

`muster` wird gegen den **sichtbaren Text** der Datei geprüft (JSX-Text und Zeichenketten, Leerraum zusammengezogen; Kommentare, Importe, Klassenlisten und Pfade zählen nicht). Ändert jemand den Satz, schlägt das Gate an — dann `muster` nachziehen **und** prüfen, ob der Beleg die neue Fassung noch deckt.

### Beleg-Typen

| Typ | Felder | Hält, wenn … | Geprüft |
|---|---|---|---|
| `code` | `datei`, optional `regex`; mehrere über `alle:` | die Datei existiert und die Regex trifft | Gate + täglich |
| `zaehlung` | `zahl`, `quelle` (`glob` + optional `frontmatter`, oder `datei` + `regex`, optional `eindeutig`), `vergleich` (`gleich` · `mindestens` · `hoechstens`), optional `im_text` | die Quelle so viele Dinge zählt, wie der Text nennt. Die Zahl muss in jedem `muster` stehen — „Sechs" statt „6" über `im_text`. | Gate + täglich |
| `http` | `url`, optional `status` (Standard 200), `enthaelt`, `enthaelt_nicht`, `location_enthaelt` | die Produktions-Adresse so antwortet. Nur GET, Weiterleitungen werden nicht verfolgt. | täglich |
| `loops` | `art: workflow` + `id`, optional `betreff` · `art: transactional` + `id`, optional `variablen` | der Workflow auf „Sending" steht (und eine Mail mit dem Betreff enthält) · die Transaktionsmail veröffentlicht ist | täglich |
| `supabase` | `tabelle`, optional `filter`; `min_zeilen` / `max_zeilen` oder `spalte` + `max_alter_tage` | Zeilenzahl bzw. jüngster Zeitstempel passen | täglich |
| `mensch` | `was`, `geprueft_am`, `gueltig_tage`, optional `von` | die Handbestätigung nicht älter ist als ihre Frist | Gate (Hinweis) + täglich |

`mensch` ist für alles ohne Schnittstelle: eine Variable im Hosting, ein Haken im Digistore-Backend, ein Vertrag. Der Beleg **läuft ab** — danach neu nachsehen und `geprueft_am` setzen. Im Gate ist ein Ablauf nur ein Hinweis (ein Pflicht-Check soll nicht vom Kalender abhängen), in der täglichen Prüfung macht er den Lauf rot.

### Vier Zustände

`gedeckt` · `gebrochen` · `abgelaufen` · `nicht prüfbar`. **„Nicht prüfbar" ist nie grün** (CLAUDE.md §2 Regel 10): Fehlt ein Schlüssel oder antwortet der Dienst nicht, steht das mit Zahl und Grund im Summary, und der Lauf endet rot — je Grund eine Zeile, nicht eine je Beleg.

### Einen Eintrag ergänzen

1. Satz schreiben, `npm run check:zusagen` — das Gate nennt Datei, Zeile und Klasse.
2. Fragen: Wovon hängt der Satz ab? Das ist der Beleg. Gibt es keinen, ist der Satz nicht gedeckt — umformulieren.
3. Eintrag in `data/zusagen.yaml`; `muster` muss die Zusage-Worte ganz enthalten.
4. `npm run check:zusagen` grün, bei Netz-Belegen einmal `npm run zusagen:belege`.

Preise und Verkaufstermine gehören **nicht** hierher, sondern nach `data/angebote.yaml`.

## Das Gate

Fünf Klassen von Zusage-Mustern in `src/app`, `src/components` und `content/` (ohne `_archiv`, Tests, `/admin`):

| Klasse | Beispiele |
|---|---|
| Zeit/Frequenz | „jeden Freitag", „wöchentlich", „alle 2 Wochen", „innerhalb von 48 Stunden" — in `content/` aus (dort ist „täglich wenden" eine Kochanweisung) |
| Versand | „per E-Mail", „wir schicken dir", „du bekommst … eine E-Mail", „wir melden uns" |
| Test/Prüfung | „getestet", „Testsieger", „zertifiziert", „geprüft" |
| Bestandszahl | getippte Zahl vor einem Bestandswort: „128 Rezepte", „6.000 Höfe" — in `content/` erst ab 10 |
| Garantie | „Garantie", „Geld zurück" |

Ein Treffer ist in Ordnung, wenn ein Register-Muster ihn ganz enthält oder er in der Baseline steht. Ein **neuer** Treffer bricht mit Exit 1 ab. Zwei Auswege: **Beleg eintragen** oder **umformulieren**. Ist der Satz gar keine Zusage (Kochanweisung, Zitat, Rechtsbegriff), kommt er mit Grund unter `keine_zusage` in `data/zusagen.yaml`.

### Baseline — nur kleiner, nie von Hand

`data/zusagen-baseline.json` hält den Altbestand vom 03.10.2026: Zusage-Muster, die noch kein Eintrag deckt. Der Schlüssel ist Datei + Klasse + normalisierter Satz, ohne Zeilennummer. **Altbestand beheben, nie eintragen** — danach `npm run check:zusagen:baseline`. Die Baseline ist die offene Arbeitsliste des Wächters: Jeder Eintrag dort ist ein Satz, für den heute niemand geradesteht.

## Grenzen

- Das Gate fängt, was einem Muster entspricht. Eine ungewöhnlich formulierte Zusage rutscht durch — dafür liest der Montags-Puls geänderte Texte mit.
- Gelesen werden nur die drei Bäume oben. Text in `src/lib/` und `data/` sieht das Gate nicht; das Register kann trotzdem auf solche Dateien zeigen.
- Die Loops-IDs im Register sind dieselben, die im Hosting als Variablen hinterlegt sind — der Wächter sieht die Werte dort nicht. Wird im Hosting eine Vorlage getauscht, muss das Register folgen.
- „Wenig Verkehr" beweist keinen Defekt: Deshalb stehen im Register kaum Lebenszeichen („letzte Zeile vor n Tagen"), sondern Zustände.

## Was noch kommt

| Schritt | Inhalt |
|---|---|
| 2 | **Funktionsproben:** Die anonymen Proben laufen seit 03.10.2026 täglich (`.github/workflows/funktionsproben.yml`, `tests/proben/`). Offen ist der angemeldete Teil: Ein gekennzeichnetes Testkonto benutzt die Seite wie ein Mitglied (anmelden, Aroma-Abfrage, abstimmen) — er läuft erst, wenn das Testkonto eingerichtet ist. Fängt „still kaputt". |
| 3 | **Systemkarte und „Wächter fragen":** der Zustand außerhalb des Codes als lesbare Übersicht; jede Frage zu einer Zusage wird mit Beleg und Uhrzeit beantwortet. |
