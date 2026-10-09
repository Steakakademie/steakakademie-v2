# Geschenkgutscheine — Konzept Weihnachten 2026

Stand 09.10.2026. Konzept zu Cockpit-Problem #103. **Sortiment entschieden
(Uwe, 09.10.2026): G1–G4 und freie Wertgutscheine über 25, 50, 75 und 100 €.**
**Nachtrag 09.10.2026 abends (Uwe):** Wertgutscheine auf 2027 verschoben;
Werbemails unterschreibt „Die Steakakademie", Social-Posts tragen „Werbung" im
Bild. Damit entfällt die Kanzlei-Anfrage vor dem 01.11. (siehe „Rechtsfragen").
Offen bleiben eine Anfrage an den Digistore-Support und Uwes Schritte in
Digistore und Vercel.
Ersetzt nicht die Checkliste `docs/weihnachts-gutschein-checkliste.md` — die
bleibt die Klickanleitung für die Produktgutscheine.

## Ziel

Digitale Geschenkgutscheine ab dem Verkaufsstart am **01.11.2026**
(Gewerbeanmeldung) bis Heiligabend verkaufen. Sichtbar werden sie organisch,
ohne Anzeigen. Das stärkste Argument im Dezember: **Der Gutschein ist in zwei
Minuten im Postfach — auch am 24.12.**

## Ausgangslage (geprüft 09.10.2026)

**Fertig im Code** (seit `20260607_vouchers.sql`, erweitert bis 02.10.):

- Kauf über den Digistore-Webhook (`handleVoucherProduct` in
  `src/app/api/webhooks/digistore24/route.ts`): Code `SA-XXXX-XXXX`, nichts wird
  beim Käufer freigeschaltet.
- Gutschein-Mail über Loops (`LOOPS_VOUCHER_TEMPLATE_ID` ist in Vercel gesetzt).
- Druckbare Geschenkseite `/gutschein/[code]`, Einlösung `/gutschein/einloesen`
  mit Konto. Mein Protokoll schreibt beim Einlösen ein Protokoll gut,
  Steak-Beichte Diagnose-Guthaben.
- Rückgabe/Chargeback nimmt den Gutschein zurück, auch wenn er eingelöst ist.
- AGB § 5a Geschenkgutscheine.
- `/gutschein` ist live, `index, follow`, steht in der Sitemap.

**Es fehlt:**

- Digistore-Produkte für die Gutscheine, ihre Zuordnung in `digistore_products`
  und die Checkout-Variablen `NEXT_PUBLIC_DS_VOUCHER_*`. Deshalb zeigen beide
  Karten auf `/gutschein` „In Vorbereitung".
- Sichtbarkeit: `/gutschein` ist nur aus dem Footer verlinkt. Der
  Saison-Kalender (`data/saison-kalender.yaml`) weist den Generator zwar an, im
  Weihnachtsfenster auf `/gutschein` zu verweisen, aber aus `content/` verlinkt
  bisher **kein** Beitrag darauf.

**Die Checkliste war an drei Stellen veraltet** (mit T1 im selben PR korrigiert):

1. Verkaufsstart steht auf 01.10., gilt ist 01.11.
2. Sie nennt als Webhook `…/digistore24?token=…`. Die Anmeldung per URL-Token
   greift nur mit `DIGISTORE_WEBHOOK_ALLOW_URL_TOKEN=true`, und die Variable ist
   in Vercel nicht gesetzt. Ein so angelegtes Gutschein-Produkt bekäme 401: Der
   Käufer zahlt, ein Code entsteht nicht. Richtig ist: Gutschein-Produkte an die
   bestehende IPN-Anbindung 352984 hängen (Prüfung über `sha_sign`).
3. Der Hinweis auf verlinkende Saison-Beiträge beschreibt die Absicht, nicht
   den Bestand (siehe oben).

## Sortiment — entschieden 09.10.2026

### Produktgutscheine (Einzweckgutscheine)

| # | Gutschein | Preis | Was der Beschenkte bekommt | Aufwand |
|---|---|---|---|---|
| G1 | Steak-Beichte | 7 € | 1 Diagnose | nur Digistore + Zuordnung |
| G2 | Steak-Beichte 5er | 25 € | 5 Diagnosen | Digistore + Zuordnung (`voucher_credit_amount = 5`) + eine Karte im Code |
| G3 | Mein Protokoll | 19 € | 1 Protokoll (8 Wochen, eine Korrektur) | nur Digistore + Zuordnung |
| G4 | Grillmeister-Diplom | 99 € (geplant) | Stufe 2–5 | Kaufweg des Diploms zuerst, dann wie G3 |

**G4 hängt am Kaufweg des Diploms.** Die Inhalte sind laut Uwe eingerichtet.
Stand 09.10. auf der Live-Seite und in der Datenbank fehlt aber noch der Weg
zum Kauf: `/diplome` zeigt für Stufe 2–5 keinen Kaufknopf („die weiteren
Stufen folgen Schritt für Schritt"), der Kurs `grillmeister-diplom` steht auf
`published = false` und hat keine Zeile in `digistore_products`; der Anmeldelink
nach dem Kauf führt auf `/mein-system` (Cockpit #111). Ein Gutschein darf erst
verkauft werden, wenn der Direktkauf funktioniert — sonst löst der Beschenkte
etwas ein, das niemand kaufen kann.

### Freie Wertgutscheine (Mehrzweckgutscheine) — verschoben auf 2027

**Entscheidung Uwe, 09.10.2026:** nicht im Weihnachtsgeschäft 2026. Grund: Die
Umsatzsteuer beim Mehrzweckgutschein über Digistore als Wiederverkäufer ist
offen, und Restguthaben, Zuzahlung und Widerruf bei Teileinlösung wären ohne
Anwalt nur unsicher zu beantworten. Was steht, bleibt stehen: Karten auf
`/gutschein` hinter `WERTGUTSCHEINE_AKTIV = false`, AGB-Entwurf in
`docs/agb-5a-wertgutscheine-entwurf.md`. Die Steuerfrage geht vorab an den
Digistore-Support.

| # | Gutschein | Preis |
|---|---|---|
| W25 | Wertgutschein 25 € | 25 € |
| W50 | Wertgutschein 50 € | 50 € |
| W75 | Wertgutschein 75 € | 75 € |
| W100 | Wertgutschein 100 € | 100 € |

Der Beschenkte kann den Wert auf jedes freigegebene Produkt anrechnen, auch
in Teilen. Was übrig bleibt, bleibt als Guthaben auf dem Code stehen.

**Wie die Einlösung funktionieren soll — Vorschlag: Guthaben bei uns, Einlösung
ohne zweiten Checkout.**

1. Käufer bezahlt den Wertgutschein über Digistore (eigenes Produkt je Wert).
2. Der Webhook legt einen Code mit Guthaben an (neue Tabelle, z. B.
   `wertgutscheine`: Code, Wert, Restwert, Gültigkeit) und verschickt ihn über
   Loops — wie heute beim Produktgutschein.
3. Der Beschenkte meldet sich an, gibt den Code ein, wählt ein Produkt. Ist der
   Restwert hoch genug, wird der Preis abgebucht und das Produkt sofort
   freigeschaltet (dieselben Funktionen wie heute: `grant_course_access`,
   Diagnose-Guthaben, Protokoll-Gutschrift). Jede Abbuchung steht als eigene
   Zeile in einer Buchungstabelle — Grundlage für Buchhaltung und Rückfragen.
4. Rückgabe des Wertgutscheins (Refund/Chargeback in Digistore): Restwert auf 0,
   bereits freigeschaltete Produkte werden entzogen — gleiches Muster wie
   `revoke_voucher`.

**Verworfen: Digistore-Rabattcodes.** Digistore kann Rabattcodes mit festem
Betrag erzeugen (`createVoucher`), der Webhook könnte also beim Kauf einen
solchen Code anlegen. Ein Rabattcode wird aber nur einmal verwendet: Löst
jemand einen 50-€-Code auf Mein Protokoll (19 €) ein, wären 31 € verloren. Das
ist kundenunfreundlich und rechtlich angreifbar (ein Restguthaben darf nicht verfallen).

**Offen für den Fall, dass der Restwert nicht reicht** (z. B. 25 € auf das
Diplom für 99 €): Zuzahlung bräuchte doch einen Digistore-Checkout mit
einmaligem Rabattcode über den Restwert. Vorschlag für 2026: keine Zuzahlung;
Werte so wählen, dass sie zu den Preisen passen, und auf `/gutschein` klar
sagen, was ein Wert abdeckt. Entscheidung Uwe.

**Steuer — vor dem Bau klären:** Digistore verkauft als Wiederverkäufer und
behandelt jeden Verkauf als steuerpflichtige Leistung. Beim Mehrzweckgutschein
fällt die Umsatzsteuer aber erst bei der Einlösung an. Ob und wie Digistore einen
Mehrzweckgutschein abbilden kann, beantwortet zuerst der Digistore-Support
(Anfrage vom 09.10.). Bis dahin wird nichts gebaut, was Geld annimmt.

### Bewusst nicht

- Mein Protokoll im 2er-Paket (29 €) als Produktgutschein: Die Einlösung
  schreibt fest ein Protokoll gut. Mit einem Wertgutschein ab 50 € ist das
  2er-Paket trotzdem verschenkbar.
- Gedruckte Urkunde als Produktgutschein: setzt eine bestandene Stufe voraus.
  Später als Einlöseziel für Wertgutscheine denkbar.

## Technik — Claude, je per PR

| # | Was | Warum |
|---|---|---|
| T1 | ✓ 09.10.: Checkliste auf den Stand gebracht (Datum, IPN statt Token-URL, Sichtbarkeit, Sortiment) | Sonst entsteht ein Produkt, das kassiert und keinen Code liefert |
| T2 | ✓ 09.10. (PR #362): G2 als zweite Steak-Beichte-Karte in `GIFTABLE_PRODUCTS` (eigener Schlüssel statt `courseSlug`) | Die Liste war nach `courseSlug` geschlüsselt |
| T3 | ✓ 09.10. (PR #362, Migration `20261009170338` angewendet): Mein-Protokoll-Gutschrift beim Einlösen in dieselbe Transaktion wie `redeem_voucher` | Scheitert der Eintrag heute, ist der Gutschein verbraucht und das Guthaben fehlt (nur Log) |
| T4 | ✓ 09.10. (dieselbe Migration): Rückgabe eines eingelösten Mein-Protokoll-Gutscheins bucht auch die Gutschrift zurück | Gleiches Verhalten wie beim Direktkauf |
| T5 | ✓ 09.10. (PR #362): G4 erscheint erst mit Checkout und Preis; Weiterleitung auf `/diplome/roadmap` | Siehe auch Cockpit #111 |
| T6 | Zuordnungs-Migration, sobald Uwe die Digistore-IDs nennt | Statt SQL im Editor; gleicher Weg wie alle Migrationen |
| T7 | ✓ 09.10. (PR #362): Tests für Gutschein-Kauf und -Einlösung | Webhook-Pfad für Gutscheine war nicht eigens getestet |
| T8 | ✓ 09.10. (PR #362): Hinweis „Auch als Gutschein" auf `/steak-beichte` und `/mein-protokoll`, Startseiten-Teaser und Menüpunkt 01.11.–24.12., nur mit kaufbarem Gutschein | Vorher nur Footer |
| T9 | **2027:** Wertgutscheine — Migration (Guthaben, Buchungen, anlegen/einlösen/zurücknehmen), Webhook-Zweig, Einlöseseite mit Produktauswahl, Mail, Tests; `WERTGUTSCHEINE_AKTIV` auf `true` | Verschoben (Uwe, 09.10.); vorher Antwort zur Umsatzsteuer |
| T10 | ✓ 09.10.: `/gutschein` um die vier Werte erweitert (hinter dem Schalter `WERTGUTSCHEINE_AKTIV`, bis T9 aus), AGB-Entwurf `docs/agb-5a-wertgutscheine-entwurf.md`, Gültigkeit an AGB angeglichen | Heute regelt § 5a nur Produktgutscheine |

## Uwe

1. ~~Sortiment entscheiden~~ — erledigt 09.10.: G1–G4, W25–W100.
2. Anfrage an den Digistore-Support senden (Gmail-Entwurf vom 09.10.,
   „Fragen zu Gutschein-Produkten"). Die Kanzlei-Anfrage entfällt vorerst
   (Abschnitt „Rechtsfragen").
3. Digistore: Gutschein-Produkte anlegen (Produkt kopieren), **an die
   IPN-Anbindung 352984 hängen**, Danke-Seite `/danke/gutschein`, Verkauf ab
   01.11. G4 erst, wenn das Diplom selbst kaufbar ist. W25–W100 nicht 2026.
4. Vercel: `NEXT_PUBLIC_DS_VOUCHER_*` setzen, neu bauen.
5. Testkauf im Digistore-Testmodus, Einlösen mit einem zweiten Konto.
6. Social-Beiträge und Mails freigeben und veröffentlichen.

## Rechtsfragen — Einschätzung ohne Kanzlei (09.10.2026)

Eine Kanzlei-Anfrage ist vor der Zusage zum Einstiegsgeld nicht bezahlbar, und
die Rechtsschutzversicherung deckt sie nach erneuter Prüfung der Bedingungen
nicht. Die Fragen sind deshalb von Claude als **allgemeine Rechtsinformation**
eingeschätzt — keine anwaltliche Prüfung, ohne Haftung; das Restrisiko trägt
Uwe. Grundlage, die mehrere Fragen klärt: **Digistore24 ist Wiederverkäufer**
und damit Vertragspartner des Käufers; Widerrufsbelehrung, Checkout und
Umsatzsteuer gegenüber dem Käufer laufen über Digistore. Unsere AGB regeln die
Einlösung.

| Frage | Einschätzung | Sicherheit | Folge |
|---|---|---|---|
| Ankündigung vor 01.11. („In Vorbereitung", ohne Kauf) | Kein Verkauf; Preise mit „inkl. MwSt." unproblematisch | hoch | so lassen |
| Widerruf beim Gutscheinkauf | Belehrung und Frist über den Digistore-Checkout; bei Widerruf wird der Gutschein gesperrt (`revoke_voucher`) | mittel–hoch | Digistore-Support fragt nach dem Ablauf |
| Umsatzsteuer Einzweckgutschein | Entsteht beim Verkauf (§ 3 Abs. 14 UStG); über Digistore per Gutschrift wie jeder Verkauf | hoch | nichts zu tun |
| Gültigkeit „bis 31.12. des dritten Folgejahres" | Entspricht der gesetzlichen Verjährung (§§ 195, 199 BGB); angreifbar wären nur kürzere Fristen | hoch | seit 09.10. überall so (Migration `20261009170345`) |
| Eingestelltes Produkt mit offenen Gutscheinen | Kaufpreis erstatten (§§ 275, 326 BGB); Ersatz nur mit Zustimmung | hoch | im Fall der Fälle erstatten |
| Wertgutscheine (Restguthaben, Zuzahlung, Teil-Widerruf, Umsatzsteuer) | teils üblich, Umsatzsteuer über Digistore offen | niedrig–mittel | **auf 2027 verschoben**; Steuerfrage an Digistore |
| „Werbung" im Social-Bild | Pflicht nur, wenn der kommerzielle Zweck nicht erkennbar ist (§ 5a Abs. 4 UWG) — beim eigenen Firmenkonto erkennbar | mittel | **trotzdem kennzeichnen** (kostet nichts) |
| Newsletter-Einwilligung v2 deckt eigene Gutscheine | „Werbung rund um Grill-, BBQ- und Küchenprodukte" deckt eigene digitale Grillprodukte nachvollziehbar | mittel–hoch | nur v2 + Double-Opt-in anschreiben |
| KI-Persona „Marco" als Absender einer Werbemail | Irreführungsrisiko, wenn Empfänger eine echte Person annehmen | — | **Absender „Die Steakakademie"** |

Kostenfreie Anlaufstellen, falls doch etwas offen bleibt: Digistore-Support,
Finanzamt (allgemeine Auskünfte zur Umsatzsteuer), IHK-Gründungsberatung,
Gründungscoaching über AVGS des Jobcenters, Beratungshilfe beim Amtsgericht
(bei gewerblichen Fragen oft abgelehnt). Der ausführliche Kanzlei-Entwurf mit
allen zwölf Fragen liegt weiter in Gmail (Entwürfe) für später.

## Sichtbarkeit — organisch

- **Suche:** Die Nachfrage nach „Geschenk für Griller", „Grill Gutschein",
  „Geschenkideen Grillfans" steigt ab November. Dafür:
  - ✓ 09.10. (T10): `/gutschein` geschärft — Title „Geschenkgutscheine für
    Grillfans", neue Description, FAQ mit FAQPage-Schema.
  - ✓ 09.10.: Ratgeber-Entwurf `content/artikel/geschenke-fuer-grillfans.mdx`
    (`status: draft`, geplant 02.11.). Ohne Produktnamen und Preise; verweist
    auf die Marktübersichten. Veröffentlicht erst nach Uwes Gegenlesen,
    **Anfang November**, damit er vor dem Höhepunkt indexiert ist.
  - Mit dem heutigen Search-Console-Bericht abgleichen, welche dieser Begriffe
    schon Impressionen haben.
- **Interne Links:** Produktseiten, Startseite, passende Rezepte und Cuts
  (siehe T8).
- **Social:** in die Wochenrunde, 3–4 Beiträge zwischen Mitte November und
  22.12., der letzte als „Last Minute".
- **Mail:** zwei Mails an die Liste des Wissens-Briefs (Ende November,
  um den 18.12.) — Entwurf Claude, Versand Uwe.

## Zeitplan

| Bis | Was | Wer |
|---|---|---|
| 09.10. | Sortiment entschieden | Uwe ✓ |
| 09.10. | T1–T8, T10, Ratgeber-, Social- und Mail-Entwürfe | Claude ✓ |
| 09.10. | Wertgutscheine auf 2027, keine Kanzlei vor dem 01.11. | Uwe ✓ |
| 16.10. | Anfrage an den Digistore-Support gesendet | Uwe |
| 31.10. | Digistore-Produkte, Variablen, Zuordnung (T6), Testkauf | Uwe, Claude prüft |
| 01.11. | Verkauf live für G1–G3 (G4, sobald das Diplom kaufbar ist) | — |
| 2027 | T9 Wertgutscheine | Claude |
| 01.11.–24.12. | Ratgeber, Social, Mails | Claude entwirft, Uwe veröffentlicht |

## Messen

Verkaufte und eingelöste Produktgutscheine stehen in `vouchers`
(`status`, `issued_at`, `redeemed_at`), Wertgutscheine später in ihrer eigenen
Tabelle samt Buchungen. Der tägliche Cockpit-Abgleich nimmt
die Zahl je Woche auf, sobald der Verkauf läuft.
