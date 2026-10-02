# Konzept — BBQ-Grundkurs als Einstiegsprodukt

> ## ⛔ EINGESTELLT — Entscheidung Uwe, 09.09.2026
>
> **Der BBQ-Grundkurs entfällt als eigenes Produkt.** Grund ist der neu gefasste
> Rahmenlehrplan vom 08.09.2026: Stufe 1 des Grillmeister-Diploms ist von sieben
> auf **elf Lektionen** gewachsen und deckt vier der fünf hier geplanten Module
> ab — Hitze verstehen (1.5, 1.6), Kerntemperatur & Carryover (1.7, 1.9),
> Fehler retten (1.3, 1.4, 1.11), Grundcuts folgen in Stufe 2. Und zwar
> kostenlos. Ein Bezahlprodukt, das dasselbe sagt, was zwei Klicks weiter gratis
> steht, hätte beide beschädigt.
>
> **Dieses Papier wird nicht gelöscht.** Zwei Argumente darin gelten weiter und
> haben mit dem Produkt nichts zu tun: der Sprung von 0 € auf 99–149 € (§2) und
> das Weihnachtsgeschäft (§2, zweiter Absatz). Beides wird über **Gutscheine
> aufs Diplom** gelöst, nicht über ein zweites Produkt — ein Rabatt, den man
> beenden kann, ist mehr wert als ein Preis, den man nicht mehr erhöhen kann.
>
> Technischer Stand nach der Entscheidung: `/bbq-grundkurs` und
> `/danke/bbq-grundkurs` leiten dauerhaft auf `/diplome`
> (`next.config.mjs`). **Offen und in dieser Reihenfolge abzuarbeiten:** erst
> Digistore 696399 abschalten, dann `digistore_products`-Mapping und die
> `courses`-Zeile entfernen — nie umgekehrt, sonst zahlt jemand und landet
> nirgends. Auf der Kurszeile liegt eine Buchung (vermutlich Testkauf), die vor
> dem Löschen zu prüfen ist.
>
> Alles unterhalb dieser Linie ist der Stand vom 27.08.2026 und beschreibt ein
> Produkt, das es nicht geben wird.

---

**Regel-8b-Konzept. Vorlage zur Freigabe.** Stand 27.08.2026.
Entscheidung Uwe (27.08.): Der Kurs bleibt — als eigenes Produkt zwischen
kostenlosem Trichter und Grillmeister-Diplom.

## 1. Was vorgefallen war

Am 15.08. war der Grundkurs als **Video**-Kurs beschlossen, abgegrenzt vom
Diplom-Lernweg über das **Format** (Video gegen Text), nicht über den Inhalt.
Am 16.08. fiel die Entscheidung, die 35 Diplom-Lektionen zu vertonen — damit war
die Abgrenzung weg und es standen zwei fast deckungsgleiche Video-Kurse im Plan.

Daraus wurde in der Notiz „geht darin auf, entfällt als eigenes Produkt". Das
war die Beschreibung einer **Zusammenführung**, nicht einer Streichung — der
Produktionsplan führt Weg 3 ausdrücklich weiter: *„BBQ-Grundkurs bleibt
separates Produkt mit anderem Inhalt — dann braucht er eine neue Abgrenzung
jenseits des Formats."* Genau die wird hier gezogen.

## 2. Warum es ihn braucht — die Lücke im Angebot

| | Stufe 1 (Bronze) | **hier klafft es** | Stufe 2–5 |
|---|---|---|---|
| Preis | kostenlos | — | 99 € / 149 € |
| Rolle | Trichter | — | Ausbildung |

Der Sprung von gratis auf 149 € ist die Stelle, an der Interessenten abspringen.
Es fehlt der Schritt, bei dem jemand zum ersten Mal Geld ausgibt und dabei
sofort etwas bekommt.

Zweiter Grund: das Weihnachtsgeschäft. Das Gutschein-Lineup besteht heute aus
**Mein Protokoll (19 €)** und **Steak-Beichte (7 €)**. Ein Grundkurs im niedrigen
zweistelligen Bereich ist das Geschenk, das man einem Grill-Anfänger tatsächlich
macht — 149 € verschenkt man nicht spontan.

## 3. Die Abgrenzung, die fehlte

Nicht über das Format. Über den **Anlass**:

| | Grundkurs | Grillmeister-Diplom |
|---|---|---|
| Was es ist | **ein Abend** | eine **Ausbildung** |
| Versprechen | die fünf Dinge, die sofort besser machen | vom Anfänger zum Pitmaster |
| Umfang | 5 Module | 5 Stufen, 35 Lektionen |
| Abschluss | keiner — du kannst es danach | Prüfung + Zertifikat je Stufe |
| Wiederholung | einmal durch, dann Nachschlagewerk | begleitet über Monate |

Beide dürfen dieselben Themen berühren. Der Unterschied ist **Tiefe und
Anspruch**, nicht Stoffgebiet — so wie ein Tageskurs und eine Lehre beide vom
Feuer handeln. Wer den Grundkurs kauft und mehr will, bekommt den Kaufpreis auf
das Diplom angerechnet. Damit ist der Kurs kein Konkurrent des Diploms, sondern
seine Vorstufe.

## 4. Die fünf Module (Elemente, Umfang, Quellen — Regel 8b)

Inhalt wie bereits im Kurs-Schema der Seite hinterlegt. Je Modul:

| Nr. | Modul | Lernziel in einem Satz |
|---|---|---|
| 1 | Hitze verstehen | Du baust direkte, indirekte und Kombi-Zone auf und weißt, wann welche. |
| 2 | Kerntemperatur & Carryover | Du triffst den Garpunkt über das Thermometer statt über die Uhr. |
| 3 | Die fünf Grundcuts | Du erkennst Ribeye, Entrecôte, Rumpsteak, Flanksteak, Hähnchenbrust und behandelst jeden richtig. |
| 4 | Reverse Sear & Kruste | Du erzeugst eine Kruste, ohne den Kern zu übergaren. |
| 5 | Fehler retten | Du erkennst die häufigsten Grillfehler früh und fängst sie ab. |

**Elemente je Modul, verbindlich:**

- Video 6–10 Minuten (Marco, Stimme + Hände + Grill, kein sprechender Kopf)
- Begleittext 700–900 Wörter mit `<Schnelluebersicht>` und mindestens zwei Callouts
- ein Bild im Hausstil, KI-gekennzeichnet
- ein Selbsttest mit drei erklärten Fragen
- ein Begleit-PDF je Modul (Tabelle, Cut-Guide oder Checkliste)

**Faktenquellen (Regel 8c):** Alle Temperaturwerte aus
`data/kerntemperatur-referenz.yaml`. Modul 2 und 4 verweisen auf
`/temperatur-guide`, Modul 4 zusätzlich auf `/methoden/reverse-sear` samt der
Unterscheidung Zieh- gegen Servier-Temperatur. Modul 3 zieht die Cut-Angaben aus
dem Cut-Atlas. **Kein Wert wird für den Kurs neu erfunden.**

**Prüfungsbezug:** keiner. Der Kurs hat bewusst keine Prüfung und kein
Zertifikat — das ist das Unterscheidungsmerkmal zum Diplom und muss es bleiben.

Gesamtumfang: ~40 Minuten Video, ~4.000 Wörter, 15 Selbsttestfragen, 5 PDFs.

## 5. Entschieden (Uwe, 27.08.2026)

1. **Preis: 49 €.**
2. **Anrechnung: 50 %** — wer den Grundkurs besitzt, bekommt **24,50 €** auf das
   Grillmeister-Diplom angerechnet (Vorverkauf 99 € → 74,50 €; regulär
   149 € → 124,50 €). Die halbe statt der vollen Anrechnung hält die Marge und
   bleibt trotzdem ein spürbarer Aufstiegs-Anreiz.
3. **Zeitpunkt: weiterhin offen.** Das Diplom hat Vorrang bis zum 01.10.;
   der Grundkurs teilt sich Marcos Stimme und die Produktionsstrecke mit ihm —
   realistisch nach dem Diplom-Vorverkauf. Bis dahin bleibt die Seite ohne
   Starttermin (siehe §6) und es wird kein Digistore-Produkt angelegt
   (Gewerbeanmeldung 01.10., Vorgabe vom 26.08.).

**Umsetzungsnotiz Kaufabwicklung (wenn es so weit ist):** Die Anrechnung läuft
am einfachsten über einen personalisierten Digistore-Gutscheincode über 24,50 €,
der Grundkurs-Käufern nach dem Kauf automatisch per Mail zugeht — kein
Sonderpreis-Produkt, keine zweite Preisliste, sauber nachweisbar. Auf der
Kursseite wird die Anrechnung erst beworben, wenn beide Produkte kaufbar sind.

## 6. Sofort erledigt (27.08.2026)

Die Landeseite versprach an sieben Stellen „Kursstart geplant 2026" — bei
laufendem Jahr 2026 ohne Kurs ist das ein Versprechen, das wir brechen. Alle
Jahreszahlen sind raus; die Seite sagt jetzt „In Vorbereitung" und ausdrücklich:
*„Einen Starttermin nennen wir erst, wenn er steht — wir kündigen nichts an, was
wir nicht halten können."*

Das Course-Schema bleibt bewusst **ohne `Offer`**: ein Angebot ohne
Kaufmöglichkeit wäre eine Falschangabe gegenüber Google und dem Nutzer.
