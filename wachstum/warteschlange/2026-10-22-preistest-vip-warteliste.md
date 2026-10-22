---
typ: ereignis
status: entwurf
quelle: src/app/vip/page.tsx
saeule: akademie
ziel: newsletter
ziel_url: https://steakakademie.de/vip
werbung: false
stimme: jonas
geplant_fuer: 2026-10-28
pruefung: offen
veroeffentlicht: []
---

# Preisfrage an die VIP-Warteliste (C8) — Entwurf, 2. Fassung nach Marken-Prüfung

**Empfänger:** Loops-Gruppe `vip_warteliste` (Empfängerzahl vor dem Versand in Loops nachsehen).
**Absender:** Jonas (KI-Persona), fachlich verantwortet von Uwe Yendell.
**Zweck:** Herausfinden, welcher Jahrespreis für die Warteliste tragfähig ist — **ohne zu verkaufen und ohne eine Zahl vorzugeben.** Vor der Gewerbeanmeldung (01.11.) darf nichts kaufbar sein; auf `/vip` steht 49 € im Jahr, Digistore-Plan 1507301. Die Mail nennt keinen anderen Preis.
**Was die Mail NICHT sagt (Zusagen-Regel 12, Seite `/vip`):** kein Start, kein „bevor wir freischalten", kein Termin, kein Rhythmus, keine Bestandszahl, kein „getestet", keine Alleinstellung („sonst nirgends"), keine Rabatthöhe.

## Zwei Entscheidungen, die vor dem Versand bei Uwe liegen (Prüfbericht Punkte 4 und 7)

1. **Einwilligungsumfang:** Die Warteliste wurde für den Wissens-Brief und „zum Start eine Mail mit deinem Early-Bird-Preis" eingetragen (`/vip`, „kein Verkaufsdruck"). Eine Preisfrage davor ist davon nicht ausdrücklich gedeckt (§ 7 UWG). Entweder Uwe/Kanzlei sagt „gedeckt", oder `/vip` bekommt den Mailtyp „gelegentliche Rückfragen" ergänzt (eigener PR) und die Mail geht erst an Neueinträge.
2. **Schalter „Kauf-CTAs aus":** Die Mail hat kein Kaufziel und keinen Preis in der Auswahl mehr; sie fragt offen. Ob das unter den Schalter fällt, entscheidet Uwe.

## Betreff (A/B, je Hälfte der Gruppe)

- A: `Eine Frage zum VIP-Pass`
- B: `Was wäre dir der VIP-Pass wert? (ein Klick)`

## Vorschautext

`Ein Klick, damit wir den Preis richtig setzen. Es wird nichts verkauft.`

## Text

Hallo {{firstName | Grillfreund}},

du stehst auf der Warteliste für den VIP-Pass der Steakakademie. Wir bereiten ihn vor und möchten eine Sache von dir wissen — nur diese eine.

Geplant sind vier Bausteine: der Aroma-Matcher ohne Limit, grammgenaue Profi-Rezepte (das erste Mutterrezept ist online, ein Teil der Einsätze davon gratis), ein Räucherholz-Finder und ein Grill-Logbuch. Was davon wann steht, siehst du auf der VIP-Seite; einen Termin nennen wir erst, wenn er steht.

**Welcher Jahrespreis wäre für dich noch ein klares Ja?**

[ Unter 40 € ]   → `https://steakakademie.de/vip?stimme=a&utm_source=loops&utm_campaign=preisfrage-vip`
[ 40 bis 60 € ]   → `https://steakakademie.de/vip?stimme=b&utm_source=loops&utm_campaign=preisfrage-vip`
[ Über 60 € ]   → `https://steakakademie.de/vip?stimme=c&utm_source=loops&utm_campaign=preisfrage-vip`
[ Ich bin mir nicht sicher ]   → `https://steakakademie.de/vip?stimme=d&utm_source=loops&utm_campaign=preisfrage-vip`

Ein Klick reicht. Das ist eine Umfrage, kein Angebot: Es wird nichts gebucht, du bleibst auf der Warteliste, und der Preis auf der Seite bleibt, wie er dort steht.

Danke dir — das hilft uns bei der Preisfindung.

Jonas
Jonas · KI-Persona · fachlich verantwortet von Uwe Yendell
Steakakademie

*Du bekommst diese Mail, weil du dich auf der VIP-Warteliste eingetragen hast. Abmelden: {{unsubscribeUrl}} · Anbieter: siehe Impressum https://steakakademie.de/impressum*

## Messung

- Klicks je Spanne über den Parameter `stimme` (a–d) im Plausible-Seitenbericht oder als Ziel „VIP-Preisfrage". `/vip` ist `force-static` und ignoriert den Parameter — die Seite ändert sich nicht, nur Plausible liest die Query.
- Auswertung nach 7 Tagen in `wachstum/berichte/` (wachstums-analyst). Entscheidung über den Startpreis trifft Uwe; `/vip` und Digistore-Plan bleiben bis dahin bei 49 €.

## Technik vor dem Versand

- Versand als Loops-Kampagne an die Gruppe `vip_warteliste`, nicht als Transaktionsmail; A/B-Aufteilung in Loops anlegen.
- Datenschutzerklärung: Plausible-Klickzählung aus Mails ist dort zu prüfen (Prüfbericht, nicht geprüft).
- Nach dem Versand: Versandzeitpunkt unter `veroeffentlicht` eintragen.

## Prüfbericht

**1. Lauf (marken-pruefer, 22.10.2026): BLOCKIERT** — sieben Punkte: Alleinstellung ohne Quelle, falsche Bausteine („Aroma-Matrix", „werbefreier Bereich"), Pass als vorhandenes Produkt dargestellt, Start-Versprechen in Betreff und Text, „Keine Werbung" angreifbar, Einwilligungsumfang, fehlender KI-Persona-Hinweis, 69 € ohne Digistore-Entsprechung, Nähe zum Schalter „Kauf-CTAs aus". Hinweise: „2 Klicks" vs. „ein Klick", manipulativer Dank, fehlendes Impressum, Rabatthöhe.

**2. Fassung (22.10.2026, abends):** Punkte 1, 2, 3, 5, 6 und alle Hinweise umgesetzt — Bausteine und Status wie auf `/vip`, kein Start, keine Alleinstellung, keine Preiszahl in der Auswahl (Spannen statt 49/69 €), KI-Persona-Zeile, Impressum, „ein Klick" einheitlich. Punkte 4 und 7 stehen als Entscheidungen oben. **Erneuter Prüflauf vor dem Versand nötig.**
