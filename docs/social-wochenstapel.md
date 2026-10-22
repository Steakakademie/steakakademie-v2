# Social Media — Wochenstapel

Stand 21.10.2026 · Entscheidung Uwe 21.10.2026: ein Stapel pro Woche, ein Klick am Montag. LinkedIn und X vorerst nicht. Zielgruppe: Hobbygriller in Deutschland, Österreich und der Schweiz (DACH). Metricool-Tarif nach dem Gratismonat: Starter.

## Ablauf

| Wann | Wer | Was |
|---|---|---|
| Sonntag 17:31 | geplante Aufgabe „Social-Wochenstapel erstellen“ | `scripts/social/wochenstapel.mjs` baut den Plan für Di–Mo. Claude feilt dünne Texte nach, `--pruefen` prüft die Regeln, der Stapel landet als Entwurf auf der Seite „Wochenstapel“ (Claude-Artifact mit Datenbank) |
| Montag | Uwe | Seite öffnen, einzelne Posts bei Bedarf mit „Nicht posten“ herausnehmen, **„Stapel freigeben“** klicken |
| Montag 12:31 / 19:31, Dienstag 08:31 | geplante Aufgabe „Social-Wochenstapel einplanen“ | Bei Freigabe: jeden Post über den Metricool-Connector einplanen (kein Entwurf mehr), Ergebnis und Planer-Link je Post zurück auf die Seite, Verlauf fortschreiben |

Ohne Klick wird nichts eingeplant. Posts, deren Termin beim Einplanen schon vorbei ist, rücken auf denselben Wochentag eine Woche später oder entfallen; das steht dann auf der Seite.

## Wochenmix

| Kanal | Menge | Termine | Inhalt |
|---|---|---|---|
| Pinterest | 7 Pins | täglich 12:00 | Logik und Texte aus `scripts/pinterest/pins.mjs` (Pinnwand, Grafik `/api/og/pin`, gesperrte Rezepte) |
| Facebook | 3 Linkposts | Di · Do · Sa 18:30 | Rezeptlink mit UTM, die Vorschaukarte kommt aus `og:image` der Rezeptseite |
| Instagram | 3 Bildposts | Mi · Fr · So 18:30 | Rezeptbild, „Link in der Bio“ |
| Reels + TikTok | je Video | Di · Do · Sa 12:30 | nur wenn fertige Kurzvideos mit öffentlicher Datei-URL vorliegen (`--videos`) |

Facebook und Instagram nehmen andere Rezepte als Pinterest in derselben Woche. Reihenfolge: DACH-Klassiker (`ZUERST`), dann neueste. Ist alles einmal gelaufen, beginnt die Runde von vorn (Evergreen).

## Regeln (geprüft von `pruefe()` bzw. `--pruefen`)

- **Keine °C in Texten**, außer bei Videos, die eine Referenz-Seite 1:1 abbilden (`referenzwerte: true`, Ausnahme Uwe 21.10.2026). Werte kommen dann aus `data/kerntemperatur-referenz.yaml`.
- **KI-Kennzeichnung**: Text-Satz „Bild KI-generiert.“ bzw. „KI-Stimme“ und das Plattform-Flag (Instagram `isAiGenerated`, TikTok `isAigc`).
- **Direktlinks**: nie `mtr.cool`, Metricool-Shortener aus (`shortener: false`). UTM: `utm_source=<netz>&utm_medium=social&utm_campaign=wochenstapel-kw<NN>`; Pinterest behält `utm_campaign=rezept-pins`.
- **Nur funktionierende Seiten**: Rezepte, keine Produkt- oder Kaufseiten, solange der Verkauf ruht.

## Aufruf

```bash
node scripts/social/wochenstapel.mjs --start 2026-10-27 --verlauf verlauf.json [--videos videos.json] > stapel.json
node scripts/social/wochenstapel.mjs --pruefen stapel.json
```

`verlauf.json` und der Stapel liegen in der Datenbank der Seite „Wochenstapel“ (Collections `verlauf/kanaele` und `stapel/<Jahr>-KW<NN>`), nicht im Repo.

## Kosten

0 € bis auf den Metricool-Tarif (Starter, ab Ende des Gratismonats).
