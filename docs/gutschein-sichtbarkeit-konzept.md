# Gutscheine sichtbar machen — Konzept

Stand 11.10.2026. Auftrag Uwe (11.10.2026): „zusätzlich ein Gutschein-Konzept, wie sie auf
der Homepage und innerhalb der Website ersichtlich gemacht werden. Auch dazu gibt es moderne
Konzepte. Angedacht sind sie für z. B. die angedachten Bundles von Bos Food. Möglicherweise
noch Print-on-Demand-Produkte von Gelato."

Ergänzt `docs/gutschein-konzept-weihnachten-2026.md` (Sortiment, Technik T1–T10, Recht) und
ersetzt es nicht. Die Muster unten sind Claudes Einordnung gängiger Shop-Praxis — **keine
Studie, keine gemessenen Konversionszahlen**. Was wirkt, zeigt erst unsere eigene Messung
(Abschnitt 5).

---

## 1. Was schon steht (T8/T10, 09.10.2026)

| Ort | Was | Sichtbar |
|---|---|---|
| Menü (`Header.tsx`) | Punkt „Gutscheine" | 01.11.–24.12., nur mit kaufbarem Gutschein |
| Startseite (`GutscheinTeaser.tsx`) | Teaser unter dem Diplom-Teaser | 01.11.–24.12., nur mit kaufbarem Gutschein |
| `/steak-beichte`, `/mein-protokoll` (`GutscheinHinweis.tsx`) | „Auch als Gutschein" | sobald der jeweilige Gutschein kaufbar ist |
| Footer | Link `/gutschein` | immer |
| `/gutschein` | Karten, FAQ mit FAQPage-Schema | immer (Karten „In Vorbereitung" bis zu den Vercel-Variablen) |
| Angebots-Register (`data/angebote.yaml`, `id: gutscheine`) | Eintrag fürs Angebotsregal | nach Regal-Logik |
| Ratgeber (`content/artikel/geschenke-fuer-grillfans.mdx`) | Entwurf, geplant 02.11. | nach Uwes Freigabe |
| Social, Mail | Entwürfe `docs/social-…`, `docs/mail-…` | Versand Uwe |

Das ist die Grundsichtbarkeit. Was fehlt, ist das, was einen Gutschein **zum Geschenk** macht:
Personalisierung, Zustellung zum richtigen Zeitpunkt und der Weg vom Produkt zum Geschenk mit
einem Klick.

**Fest bleibt:** Startseiten-Hierarchie (CLAUDE.md §2 Regel 8) — kein Gutschein above the fold,
der Teaser bleibt unter dem Diplom-Teaser. Keine erfundene Knappheit, kein Countdown, der nicht
stimmt (§ 5 UWG; Regel 12: keine Zusage ohne Beleg).

---

## 2. Moderne Muster — und was davon zur Steakakademie passt

| # | Muster | Was der Käufer erlebt | Passt? | Aufwand |
|---|---|---|---|---|
| M1 | **Personalisieren nach dem Kauf** | Auf `/danke/gutschein`: Name des Beschenkten, eigene Nachricht, Motiv (Glut · Weihnachten · Geburtstag · Vatertag) | **ja — größter Hebel** | mittel |
| M2 | **Zustellung zum Wunschtermin** | „Am 24.12. um 8 Uhr an papa@…" — Mail geht dann an den Beschenkten, Kopie an den Käufer | **ja** | mittel |
| M3 | **Zum Ausdrucken** | Druckbare Seite gibt es (`/gutschein/[code]`); dazu Klappkarte A6/A5 als PDF im gewählten Motiv | ja | klein |
| M4 | **Geschenk-Schalter am Produkt** | Auf der Produktseite „Für mich · Als Geschenk" statt eines Hinweises darunter | ja | klein |
| M5 | **Last-Minute ehrlich** | Ab 15.12.: „In zwei Minuten im Postfach — auch an Heiligabend". Nur echte Fakten, kein Ablauf-Timer | ja | klein |
| M6 | **Nach Budget sortiert** | Ratgeber und `/gutschein` gliedern nach „bis 10 € · bis 25 € · bis 50 € · 100 €" | ja (mit Wertgutscheinen) | klein |
| M7 | **Im Kontext statt im Banner** | Regal-Slot „Verschenken" auf den meistbesuchten Seiten (`/temperatur-guide`, `/kerntemperatur-hackfleisch`) im Saisonfenster, unter dem Inhalt | ja | klein (Regal steht) |
| M8 | **Danke-Seite als Brücke** | Nach dem Kauf: „Noch jemandem eine Freude machen?"; nach dem Einlösen: Einladung zum Wissens-Brief (nur mit Einwilligung) | ja | klein |
| M9 | **Guthaben im Konto** | „Mein Guthaben" mit Restwert, Guthabenabfrage ohne Login | erst mit Wertgutscheinen (T9) | groß |
| M10 | **Wallet-Pass** | Gutschein in Apple/Google Wallet | später, nett, kein Muss | mittel |
| M11 | **Anlässe übers Jahr** | Vatertag (Mai), Saisonstart Grillen (März/April), Geburtstag — nicht nur Weihnachten | ja, ab 2027 | klein (Saison-Kalender) |
| M12 | **Firmen und Vereine** | Mengengutscheine für Mitarbeiter, Grillclubs, Metzgereien | später; Anfrage per Kontaktformular | mittel |
| M13 | **Gutschein zum Anfassen** | Gedruckte Karte mit Code, verschickt per Print-on-Demand (Gelato) | 2027, siehe Abschnitt 3 | groß |

**Bewusst nicht:** Exit-Intent-Popups und Dauer-Banner über dem Inhalt (widerspricht Regel 8),
Rabatt-Countdowns, „nur noch 3 verfügbar" bei digitalen Gutscheinen (immer unwahr).

### M1 + M2 gebaut (11.10.2026, Uwe: „bau Personalisierung und Wunschtermin")

So ist es umgesetzt (weicht in Details von der Skizze darunter ab):

- **Zugang:** Der Link in der Käufer-Mail trägt einen Schlüssel (`/gutschein/<code>?k=…`,
  Spalte `vouchers.schenker_token`). Nur mit Schlüssel zeigt die Geschenkseite das Formular
  „Gutschein persönlich machen". Der Code allein — den der Beschenkte hat — reicht nicht.
  Kein Login nötig, keine Änderung an der bestehenden Loops-Vorlage der Käufer-Mail.
- **Felder:** Für (Name), Von (Name), Nachricht (max. 300 Zeichen), Motiv (Glut · Weihnachten ·
  Geburtstag · Vatertag · Danke). Die Geschenkseite zeigt Anlass-Zeile, „Für …", Nachricht und
  „— Von"; die Druckansicht ebenso.
- **Versand:** „Ich gebe ihn selbst weiter" (Standard) oder „Die Steakakademie schickt ihn per
  E-Mail" — sofort oder ab einer vollen Stunde zwischen 6 und 22 Uhr deutscher Zeit, frühestens
  10 Minuten ab jetzt, höchstens 400 Tage voraus und nie nach Ablauf des Gutscheins. Ändern
  geht, bis der Gutschein verschickt oder eingelöst ist.
- **Lauf:** `.github/workflows/gutschein-versand.yml` ruft alle 15 Minuten
  `POST /api/gutschein/versand` (Secret `GUTSCHEIN_VERSAND_SECRET`). Übernahme
  `geplant → in_arbeit` nur, solange noch geplant (kein Doppelversand); Fehler → zurück auf
  geplant, nach 3 Versuchen `fehlgeschlagen`. Der Lauf ist rot bei jedem Fehler, offenem
  Fehlschlag oder hängendem Versand; Heartbeat-Eintrag „Gutschein-Versand".
- **Datensparsamkeit:** Die Empfänger-Adresse wird nach dem Versand gelöscht, es bleibt
  `empfaenger_hinweis` (z. B. `p•••@example.de`). Abschnitt 10 der Datenschutzerklärung ergänzt.
- **Ohne Loops-Vorlage** (`LOOPS_VOUCHER_GIFT_TEMPLATE_ID` fehlt) bieten Formular und
  Danke-Seite den Mail-Versand nicht an; Personalisierung und Druck funktionieren trotzdem.
- Code: `src/lib/gutschein-personalisierung.ts` (Regeln, Zeitzone), `src/lib/gutschein-versand.ts`,
  `src/app/api/gutschein/personalisieren/route.ts`, `src/app/api/gutschein/versand/route.ts`,
  `src/components/gutschein/GutscheinPersonalisieren.tsx`, Migration
  `supabase/migrations/…_gutschein_personalisierung.sql`. Tests:
  `src/__tests__/gutschein-personalisierung.test.ts`, `src/__tests__/gutschein-versand.test.ts`.

#### Loops-Vorlage „Geschenk für dich" (Uwe legt sie an)

Transaktionale Mail in Loops, ID danach als `LOOPS_VOUCHER_GIFT_TEMPLATE_ID` in Vercel
(Production). Die Datenvariablen müssen **genau so** heißen; der Code schickt immer alle, leere
als leeren Text:

| Variable | Inhalt | Beispiel |
|---|---|---|
| `empfaenger_name` | Für | Papa |
| `schenker_name` | Von (immer gefüllt beim Mail-Versand) | Anna |
| `nachricht` | Nachricht, kann leer sein | Für das nächste perfekte Steak |
| `anlass` | Anlass-Zeile des Motivs, bei „Glut" leer | Frohe Weihnachten! |
| `course_title` | Produkt | Mein Protokoll |
| `voucher_code` | Code | SA-ABCD-EFGH |
| `voucher_url` | Geschenkseite **ohne** Schlüssel | https://steakakademie.de/gutschein/SA-ABCD-EFGH |
| `gueltig_bis` | Ablaufdatum | 31.12.2029 |

Vorschlag Betreff: `{schenker_name} schenkt dir: {course_title}`

Vorschlag Text (keine Werbung, kein Newsletter-Hinweis — die beschenkte Person hat nichts
abonniert):

> {anlass}
>
> Hallo {empfaenger_name},
>
> {schenker_name} hat dir einen Gutschein der Steakakademie geschenkt: **{course_title}**.
>
> {nachricht}
>
> Dein Code: **{voucher_code}** — gültig bis {gueltig_bis}.
>
> [Gutschein ansehen und einlösen]({voucher_url})
>
> Zum Einlösen meldest du dich mit deiner E-Mail-Adresse an (kostenlos), dann ist dein Geschenk
> sofort freigeschaltet.
>
> Die Steakakademie
>
> *Diese Mail kommt, weil {schenker_name} dir den Gutschein über steakakademie.de geschickt hat.
> Deine Adresse haben wir nur für diese Mail gespeichert und danach gelöscht.*

### Technische Skizze M1 + M2 (Stand vor dem Bau)

- `/danke/gutschein` bekommt nach dem Kauf ein Formular: Empfänger-Name, Empfänger-Mail
  (optional), Nachricht (max. 300 Zeichen), Motiv, Versandzeitpunkt (sofort oder Datum/Uhrzeit).
- Neue Spalten in `vouchers` (Migration): `empfaenger_name`, `empfaenger_email`, `nachricht`,
  `motiv`, `versand_am`. Der Code entsteht weiter im Webhook; das Formular ergänzt nur.
- Versand: täglicher bzw. stündlicher Lauf (Vercel Cron) schickt fällige Gutscheine über Loops
  (`LOOPS_VOUCHER_TEMPLATE_ID`, neue Datenvariablen für Name, Nachricht, Motiv).
- `/gutschein/[code]` zeigt Motiv und Nachricht.
- **Datenschutz:** Die Mail-Adresse des Beschenkten ist ein Dritter — Zweck nur Zustellung,
  Löschung nach Einlösung bzw. Ablauf, Abschnitt in `/datenschutz`. Kein Newsletter an
  Empfänger ohne eigene Einwilligung.
- **Zuordnung (§3.0):** Abteilung 1 Systems & Ops (Code), Abteilung 4 Wachstum (Sichtbarkeit).

---

## 3. Wertgutscheine, BOS FOOD und Gelato — Einordnung

**Uwes Absicht:** Die Wertgutscheine (25/50/75/100 €) sollen auch für BOS-FOOD-Bundles und
eventuell Gelato-Produkte taugen.

### BOS FOOD — mit einem Steakakademie-Gutschein nicht einlösbar

BOS FOOD läuft über AWIN als **Partnerprogramm** (Status `applied`, `products/affiliate-programs.yaml`).
Gekauft wird **bei BOS FOOD**, BOS FOOD ist Verkäufer. Ein Guthaben bei der Steakakademie kann
dort nicht angerechnet werden — weder technisch (deren Kasse kennt unsere Codes nicht) noch
rechtlich (wir sind nicht Vertragspartner des Kaufs).

Drei Wege, die funktionieren:

| Weg | Wie | Einschätzung |
|---|---|---|
| a | **BOS FOODs eigene Geschenkgutscheine** per Partnerlink empfehlen | einfach, sauber; **nicht geprüft**, ob BOS FOOD Gutscheine anbietet und ob AWIN sie vergütet |
| b | **„Bundle" = unser digitaler Teil + Partnerlink**: z. B. Menü-Guide/Mein Protokoll (per Gutschein bezahlbar) mit einer Einkaufsliste, die auf BOS FOOD verlinkt | passt zum Bestehenden; der Gutschein deckt nur unseren Teil |
| c | **Selbst Lebensmittel verkaufen** (Bundles einkaufen und weiterverkaufen) | **nicht 2026**: Lebensmittelunternehmer mit Registrierung bei der Lebensmittelüberwachung, Pflichtangaben (LMIV), Kühlkette, Haftung — eigenes Geschäftsfeld |

**Empfehlung:** a prüfen (eine E-Mail an BOS FOOD oder ein Blick in den Shop), b als
Weihnachts-Bundle-Seite (die geparkte Idee vom 02.11.); c nicht.

### Gelato (Print-on-Demand) — möglich, aber als eigener Shop

Gelato druckt und verschickt auf Bestellung (Schürze, Poster „Cuts-Karte", Grillkarte als
Kunstdruck, Grußkarte). Damit wären es **eigene** Produkte, also grundsätzlich als Einlöseziel
für Wertgutscheine geeignet. Voraussetzungen, alle offen:

- Ein Kaufweg für physische Ware: Digistore mit Versandkosten (Digistore kennt
  Versandkostenregeln) **oder** Gelatos Anbindung an einen eigenen Shop. Ob Digistore
  Print-on-Demand-Fulfillment über einen Dritten zulässt: **nicht geprüft**.
- Bestellung an Gelato aus dem Webhook (Gelato-API) — neuer Code.
- **Produktsicherheit (GPSR):** Für physische Ware gelten Pflichtangaben (Hersteller,
  Kontakt, Sicherheitshinweise); in Digistore steht bei unseren Produkten `gpsr: No`.
- Widerruf, Retouren, Versandkosten — anders als bei digitalen Produkten.

**Empfehlung:** 2027 als eigenes Vorhaben „Steakakademie-Merch" mit Produkt-Qualitätscheck
(CLAUDE.md, Skill `produkt-qualitaetscheck`). Der naheliegende erste Gelato-Artikel ist die
**gedruckte Gutscheinkarte** (M13) — sie macht aus dem digitalen Gutschein ein Geschenk zum
Auspacken, ohne dass wir Lager oder Versand haben.

### Folge für die Wertgutscheine

Einlöseziele 2027: **eigene digitale Produkte** (Steak-Beichte, Mein Protokoll, Diplom, später
Kurse), dann **eigener Merch**, sobald er existiert. BOS FOOD nicht. Damit bleibt der
Mehrzweckgutschein-Charakter (mehrere Produkte, Teileinlösung) — und die offene
Umsatzsteuerfrage über Digistore als Wiederverkäufer (Konzept Weihnachten, „Steuer — vor dem
Bau klären") gilt unverändert.

---

## 4. Vorschlag zur Reihenfolge

| Wann | Was | Wer |
|---|---|---|
| bis 31.10. | M4, M5, M6 (Ratgeber), M7, M8 — alles klein, hinter dem bestehenden Saisonfenster | Claude per PR, Uwe merged |
| ✓ 11.10. | M1 + M2 gebaut (Personalisierung, Wunschtermin); M3 Klappkarte offen | Claude, Migration + PR |
| 01.11.–24.12. | Messen (Abschnitt 5), wöchentlich nachsteuern | Claude |
| 2027 | T9 Wertgutscheine + M9; M11 Vatertag; M12 Firmen; Gelato-Merch + M13; M10 Wallet | nach Entscheidung |

## 5. Messen

- Plausible-Ereignisse je Einstieg: `gutschein_klick` mit `quelle` = `menue`, `teaser`,
  `produkt`, `regal`, `ratgeber`, `mail`, `social`.
- Verkäufe und Einlösungen aus `vouchers` (`issued_at`, `redeemed_at`), wöchentlich im Cockpit.
- Ob sich die Quelle bis in den Digistore-Kauf durchreichen lässt (Checkout-Parameter, der in
  der IPN ankommt): **Annahme, vor dem Bau prüfen**.
