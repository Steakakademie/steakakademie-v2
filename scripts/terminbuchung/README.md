# Terminbuchung Personal-Coaching (tuwasduwillst.de)

Festgelegt von Uwe am 26./27.09.2026. Buchungswerkzeug: **Cal.com Free** (0 €). Dazu ein Google-Apps-Script (0 €), das den Rhythmus pflegt.

## Ablauf für den Kunden

1. Coaching bei Digistore kaufen.
2. Danke-Seite bzw. Kaufbestätigung: Button „Jetzt Termin wählen" → Cal.com-Buchungsseite (verlinkt, nicht eingebettet: Datenschutzerklärung Abschnitt 10d).
3. Termin wählen, drei Fragen beantworten, Bestellnummer angeben, fertig.

## Rhythmus und Zeiten

| Rhythmuswoche | buchbar |
|---|---|
| 1 (erste ab Mo 05.10.2026) | Mo, Mi, Fr |
| 2 | Di, Mi, Do |
| 3 | Mo–Fr |
| 4 | Mo, Di, Do, Fr |

Danach beginnt der Rhythmus von vorn.

- Termin 60 Minuten, danach 30 Minuten Vorbereitung auf das nächste Coaching
- Mittagspause 12:00–13:00
- Terminbeginne: **09:00 · 10:30 · 13:00 · 14:30 · 16:00**
- Höchstens **4 Termine pro Tag**, Mindestvorlauf **24 Stunden**, buchbar **8 Wochen** im Voraus
- NRW-Feiertage sind gesperrt

## Einrichtung Cal.com (einmalig, ca. 20 Minuten)

1. **Konto** auf cal.com anlegen. Nutzername z. B. `tuwasduwillst`, Zeitzone Europe/Berlin, Sprache Deutsch.
2. **Kalender verbinden** (Einstellungen → Kalender): den Google-Kalender, in dem das Rotations-Skript läuft, **und** alle privaten Kalender, die auf Konflikte geprüft werden sollen. Neue Buchungen landen im Google-Hauptkalender.
3. **Verfügbarkeit** (Availability → neuer Plan „Coaching"): Mo–Fr 09:00–12:00 **und** 13:00–17:00, Zeitzone Europe/Berlin.
4. **Terminart** „Personal-Coaching (60 Min)":
   - Dauer 60 Min · Ort: Google Meet
   - Grenzen: Puffer **nach** dem Termin 30 Min · Mindestvorlauf 24 Std · **Zeitintervall 90 Min** · Buchungslimit **4 pro Tag** · künftige Buchungen max. 56 Tage
   - Erweitert: **E-Mail-Bestätigung des Buchenden verlangen** einschalten (gegen Spam-Buchungen)
   - Beschreibung, Buchungsfragen und Texte: siehe Projekt-Doc `claude/coaching_calcom_texte_2026-09-27.md`
5. **Erinnerungen** (Workflows): 24 Std. und 1 Std. vor dem Termin per E-Mail an den Teilnehmer. Falls Cal.com Free die Workflows sperrt: Standard-Bestätigung nutzen, die Google-Kalender-Einladung erinnert zusätzlich.
6. **Skript anlegen:** script.google.com → Neues Projekt → Inhalt von `rotation-blocker.cjs` einfügen (die letzte Zeile mit `module.exports` darf bleiben) → Funktion `einrichten` einmal ausführen → Kalenderzugriff erlauben.
7. **Testbuchung** (unten), dann den Buchungslink an Claude geben: Er kommt auf die Danke-Seite und in die Digistore-Kaufbestätigung.

## Betrieb

- Das Skript läuft jeden Morgen um 03:00 Uhr und pflegt die Blocker für die nächsten 9 Wochen.
- **Abwesenheit:** einen normalen Termin (Status „beschäftigt") in einen der verbundenen Kalender eintragen. Die Zeit verschwindet sofort von der Buchungsseite.
- **Rhythmus ändern:** `KONFIG.muster` im Skript. Der nächste Lauf räumt alte Blocker selbst auf.
- **Buchbar erst ab einem Tag:** `KONFIG.ersterTag`, z. B. `'2026-11-02'` (Jobcenter: bezahlte Coachings erst ab Gewerbeanmeldung).
- **Terminbeginne ändern:** `KONFIG.slots` anpassen und in Cal.com Zeitintervall und Verfügbarkeit gleich halten.

## Belegt-Optik

An buchbaren Tagen blockt das Skript zusätzlich einzelne Termine nach Zufall:

| Abstand ab heute | geblockte Termine pro Tag (von 5) |
|---|---|
| bis 14 Tage | 1–3 |
| 15–35 Tage | 1–2 |
| danach | 0–1 |

- **Stabil:** Der Zufall hängt am Datum. Jeder Lauf blockt dieselben Termine, nichts springt hin und her.
- **Echte Termine zählen mit:** Ist ein Tag schon real belegt, kommen entsprechend weniger Zufallsblocker dazu.
- **Einstellen:** `KONFIG.zufall.staffel` ändert die Menge, `KONFIG.zufall.salz` erzeugt eine neue Verteilung, `KONFIG.zufall.aktiv = false` schaltet sie ab.
- **Grenze:** Die Buchungsseite zeigt nur freie Zeiten. Nirgends „gebucht", „fast ausgebucht" oder „nur noch 2 frei" dazuschreiben, solange das nicht stimmt. Erfundene Knappheit ist irreführende Werbung (UWG).
- Nach 4 Wochen prüfen: Finden zahlende Kunden genug freie Termine? Sonst die Staffel senken.

## Testbuchung vor dem Start

1. Testkauf bei Digistore → Kaufbestätigung und Danke-Seite zeigen den Buchungslink?
2. Termin buchen → Pflichtfragen und Bestellnummer erscheinen? Bestätigungs-Mail mit Meet-Link und Link zum Verschieben/Stornieren kommt an?
3. Termin steht im Google-Kalender; der nächste Start ist erst 90 Minuten später buchbar?
4. Fünften Termin am selben Tag versuchen → gesperrt?
5. Termin verschieben und stornieren → beide Mails kommen an?
6. Erinnerung 1 Std. vorher kommt an?
7. Alles einmal am Handy wiederholen.
