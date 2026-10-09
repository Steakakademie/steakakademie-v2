# Geschenkgutscheine — Konzept Weihnachten 2026

Stand 09.10.2026. Konzept zu Cockpit-Problem #103. **Sortiment entschieden
(Uwe, 09.10.2026): G1–G4 und freie Wertgutscheine über 25, 50, 75 und 100 €.**
Offen bleiben die Kanzlei-Fragen und Uwes Schritte in Digistore und Vercel.
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

### Freie Wertgutscheine (Mehrzweckgutscheine)

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
ist kundenunfreundlich und rechtlich angreifbar (Kanzlei-Frage 6).

**Offen für den Fall, dass der Restwert nicht reicht** (z. B. 25 € auf das
Diplom für 99 €): Zuzahlung bräuchte doch einen Digistore-Checkout mit
einmaligem Rabattcode über den Restwert. Vorschlag für 2026: keine Zuzahlung;
Werte so wählen, dass sie zu den Preisen passen, und auf `/gutschein` klar
sagen, was ein Wert abdeckt. Entscheidung Uwe.

**Steuer — vor dem Bau klären (Kanzlei-Frage 7):** Digistore verkauft als
Wiederverkäufer und behandelt jeden Verkauf als steuerpflichtige Leistung. Beim
Mehrzweckgutschein fällt die Umsatzsteuer aber erst bei der Einlösung an. Ob und
wie Digistore einen Mehrzweckgutschein abbilden kann, müssen Kanzlei und
Digistore-Support beantworten. Bis dahin wird nichts gebaut, was Geld annimmt.

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
| T2 | G2: zweite Steak-Beichte-Karte in `GIFTABLE_PRODUCTS` (eigener Schlüssel statt `courseSlug`) | Die Liste ist heute nach `courseSlug` geschlüsselt |
| T3 | ✓ 09.10. (PR #362, Migration `20261009170338` angewendet): Mein-Protokoll-Gutschrift beim Einlösen in dieselbe Transaktion wie `redeem_voucher` | Scheitert der Eintrag heute, ist der Gutschein verbraucht und das Guthaben fehlt (nur Log) |
| T4 | ✓ 09.10. (dieselbe Migration): Rückgabe eines eingelösten Mein-Protokoll-Gutscheins bucht auch die Gutschrift zurück | Gleiches Verhalten wie beim Direktkauf |
| T5 | G4: Diplom in `GIFTABLE_PRODUCTS` und `NEXT_BY_SLUG` (`/diplome/lernen`), sobald der Direktkauf läuft | Siehe auch Cockpit #111 |
| T6 | Zuordnungs-Migration vorbereiten (Platzhalter für die Digistore-IDs) | Statt SQL im Editor; gleicher Weg wie alle Migrationen |
| T7 | Tests für Gutschein-Kauf und -Einlösung | Webhook-Pfad für Gutscheine ist heute nicht eigens getestet |
| T8 | Sichtbarkeit im Code: Hinweis „Auch als Gutschein" auf `/steak-beichte` und `/mein-protokoll`, Teaser auf der Startseite, im November/Dezember Link im Header | Heute nur Footer |
| T9 | Wertgutscheine: Migration (Tabellen für Guthaben und Buchungen, Funktionen anlegen/einlösen/zurücknehmen), Webhook-Zweig, Einlöseseite mit Produktauswahl, Mail, Tests | Erst nach Antwort auf Kanzlei-Frage 7 |
| T10 | ✓ 09.10.: `/gutschein` um die vier Werte erweitert (hinter dem Schalter `WERTGUTSCHEINE_AKTIV`, bis T9 aus), AGB-Entwurf `docs/agb-5a-wertgutscheine-entwurf.md`, Gültigkeit an AGB angeglichen | Heute regelt § 5a nur Produktgutscheine |

## Uwe

1. ~~Sortiment entscheiden~~ — erledigt 09.10.: G1–G4, W25–W100.
2. Fragen an die Kanzlei (unten) mitschicken — passt zu #43 und #107. Frage 7
   zusätzlich an den Digistore-Support.
3. Digistore: Gutschein-Produkte anlegen (Produkt kopieren), **an die
   IPN-Anbindung 352984 hängen**, Danke-Seite `/danke/gutschein`, Verkauf ab
   01.11. G4 erst, wenn das Diplom selbst kaufbar ist; W25–W100 erst nach
   Antwort auf Frage 7.
4. Vercel: `NEXT_PUBLIC_DS_VOUCHER_*` setzen, neu bauen.
5. Testkauf im Digistore-Testmodus, Einlösen mit einem zweiten Konto.
6. Social-Beiträge und Mails freigeben und veröffentlichen.

## Fragen an die Kanzlei

1. Darf ein Gutschein vor dem 01.11. angeboten (nicht verkauft) werden, etwa
   als Ankündigung auf `/gutschein`?
2. Widerrufsrecht beim Kauf eines digitalen Gutscheins: 14 Tage ab Kauf? Erlischt
   es mit dem Versand des Codes oder erst mit der Einlösung? Welcher Text gehört
   auf `/gutschein` und in Digistore?
3. Einzweckgutschein (§ 3 Abs. 14 UStG) bei Regelbesteuerung: Umsatzsteuer beim
   Verkauf — so richtig?
4. Gültigkeit: **Am 09.10. angeglichen.** AGB § 5a nannten schon das Jahresende
   (§§ 195, 199 BGB), Webseite und Datenbank rechneten „3 Jahre ab Kauf" — ein
   Gutschein wäre vor dem Ende der AGB-Frist abgelaufen. Jetzt gilt überall
   „bis 31.12. des dritten Folgejahres" (Migration `20261009170345`, angewendet
   09.10.2026). Frage an die Kanzlei nur noch: Ist die Formulierung so richtig?
   Entwurf: `docs/agb-5a-wertgutscheine-entwurf.md`.
5. Was gilt, wenn ein Produkt eingestellt wird, auf das noch Gutscheine
   ausgegeben sind (Erstattung, Ersatzprodukt)?
6. Wertgutscheine: Muss ein Restwert erhalten bleiben, wenn nur ein Teil
   eingelöst wird? Darf eine Zuzahlung ausgeschlossen werden?
7. Wertgutscheine sind Mehrzweckgutscheine (§ 3 Abs. 15 UStG): Umsatzsteuer erst
   bei Einlösung. Digistore verkauft als Wiederverkäufer — kann der Verkauf so
   abgebildet werden, und wie wird die Einlösung bei uns verbucht? Oder lassen
   sich die Wertgutscheine als Einzweckgutscheine gestalten (nur digitale
   Produkte zu 19 %, nur Empfänger in Deutschland)?

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
| 16.10. | Kanzlei-Fragen verschickt, Frage 7 auch an Digistore | Uwe |
| 25.10. | T1–T8 und T10 als PRs, Ratgeber-Entwurf | Claude |
| nach Antwort 7 | T9 Wertgutscheine (etwa 2–3 Arbeitstage mit Tests) | Claude |
| 31.10. | Digistore-Produkte, Variablen, Zuordnung, Testkauf | Uwe, Claude prüft |
| 01.11. | Verkauf live für G1–G3 (G4 und W sobald ihre Voraussetzungen stehen) | — |
| 01.11.–24.12. | Ratgeber, Social, Mails | Claude entwirft, Uwe veröffentlicht |

## Messen

Verkaufte und eingelöste Produktgutscheine stehen in `vouchers`
(`status`, `issued_at`, `redeemed_at`), Wertgutscheine später in ihrer eigenen
Tabelle samt Buchungen. Der tägliche Cockpit-Abgleich nimmt
die Zahl je Woche auf, sobald der Verkauf läuft.
