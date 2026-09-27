# Terminbuchung Personal-Coaching (tuwasduwillst.de)

Festgelegt von Uwe am 26.09.2026. Kosten: 0 € (privates Google-Konto + Google Apps Script).

## Rhythmus

Termine à 60 Minuten, Start stündlich 09:00–16:00, 8 Wochen im Voraus buchbar.

| Rhythmuswoche | buchbar |
|---|---|
| 1 (erste ab Mo 05.10.2026) | Mo, Mi, Fr |
| 2 | Di, Mi, Do |
| 3 | Mo–Fr |
| 4 | Mo, Di, Do, Fr |

Danach beginnt der Rhythmus von vorn. NRW-Feiertage sind automatisch gesperrt.

## Belegt-Optik (ab 27.09.2026)

An buchbaren Tagen blockt das Skript zusätzlich einzelne Stunden nach Zufall:

| Abstand ab heute | geblockte Stunden pro Tag |
|---|---|
| bis 14 Tage | 2–4 |
| 15–35 Tage | 1–3 |
| danach | 0–2 |

- **Stabil:** Der Zufall hängt am Datum. Jeder Lauf blockt dieselben Stunden, nichts springt hin und her.
- **Echte Buchungen zählen mit:** Hat ein Tag drei echte Termine und das Ziel sind drei, kommt kein Zufallsblocker dazu.
- **Einstellen:** `KONFIG.zufall.staffel` ändert die Menge, `KONFIG.zufall.salz` erzeugt eine neue Verteilung, `KONFIG.zufall.aktiv = false` schaltet die Zufallsblocker ab.
- **Werkzeug:** Das funktioniert mit dem Google-Terminplan und mit Cal.com Free gleich, weil beide die Belegung aus dem Google-Kalender lesen.
- **Grenze:** Die Buchungsseite zeigt nur freie Zeiten. Nirgends „gebucht", „fast ausgebucht" oder „nur noch 2 frei" dazuschreiben, solange das nicht stimmt. Erfundene Knappheit ist irreführende Werbung (UWG).

## Einrichtung (einmalig, ca. 15 Minuten)

1. **Terminplan anlegen** (Google Kalender am Computer → Eintragen → Terminplan)
   - Titel: „Personal-Coaching (60 Min)"
   - Termindauer: 60 Minuten
   - Allgemeine Verfügbarkeit: Mo–Fr 09:00–17:00
   - Zeitfenster für Reservierungen: höchstens 56 Tage im Voraus, mindestens 24 Stunden vorher
   - Kalender: **Kalender auf Verfügbarkeit prüfen** anhaken (sonst wirken die Blocker nicht)
   - Ort: Google Meet
   - Reservierungsformular: Pflichtfeld **„Digistore-Bestellnummer"** hinzufügen
2. **Skript anlegen:** script.google.com → Neues Projekt → Inhalt von `rotation-blocker.cjs` einfügen (die letzte Zeile mit `module.exports` darf bleiben) → Funktion `einrichten` einmal ausführen → Kalenderzugriff erlauben.
3. **Buchungslink** (Terminplan → Teilen) an Claude geben, damit er auf der Seite eingebunden wird.

## Betrieb

- Das Skript läuft jeden Morgen um 03:00 Uhr und setzt „Rotation: nicht buchbar"-Blocker für die nächsten 9 Wochen.
- **Abwesenheit:** einen normalen Termin (Status „beschäftigt") in deinen Hauptkalender eintragen. Die Zeit verschwindet sofort von der Buchungsseite.
- **Rhythmus ändern:** `KONFIG.muster` im Skript anpassen. Der nächste Lauf räumt alte Blocker selbst auf.
- **Buchbar erst ab einem bestimmten Tag:** `KONFIG.ersterTag` setzen, z. B. `'2026-11-02'`.

## Grenzen des kostenlosen Google-Kontos

Es gibt eine einzige Buchungsseite. Die Verfügbarkeit wird nur im Hauptkalender geprüft. Keine automatischen Erinnerungs-Mails, keine E-Mail-Bestätigung gegen Spam-Buchungen.
