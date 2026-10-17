# Grillmeister-Diplom an Digistore anbinden — Runbook

> Stand 17.10.2026, nach Merge #424 und erfolgreichem Testkauf. Abteilung: Wachstum
> (Monetarisierung), CLAUDE.md §5 Blocker 3. Der Kaufweg ist technisch fertig und getestet,
> **aber gesperrt: Verkauf erst nach der Gewerbeanmeldung** (Abschnitt 0a). Was noch fehlt,
> steht in Abschnitt 0 unter „Noch offen" und ist Handarbeit von Uwe.

## 0. Stand 17.10.2026 — Digistore-Produkt angelegt (Cowork, über die Digistore-API)

| Punkt | Wert |
|---|---|
| Produkt-ID | **750228** — „Grillmeister-Diplom — Stufe 2 bis 5", intern „Grillmeister-Diplom" |
| Produkttyp | Mitgliederbereich und Video-Kurse (38) — bringt die Widerrufs-Checkbox nach § 356 Abs. 5 BGB mit |
| Zahlplan 1 | 1533112 — einmalig **99 €** (Preis-Entscheidung Uwe, 17.10.2026) |
| Zahlplan 2 | 1533113 — **3 × 35 €** monatlich (gesamt 105 €), Raten nicht vorzeitig kündbar |
| Dankeseite / Verkaufsseite | `https://steakakademie.de/danke/diplom` / `https://steakakademie.de/diplome` |
| Affiliate | 10 %, Auto-Accept (wie die übrigen Produkte) |
| Aktiv / Freigabe DS-de | aktiv / **„Neu" — noch nicht zur Prüfung eingereicht** |

### 0a. Verkaufssperre bis zur Gewerbeanmeldung (Uwe, 17.10.2026)

Uwe, nach dem Merge von #425: „das Produkt darf noch nicht verkauft werden, erst nachdem ich
das Gewerbe angemeldet habe." Geplant ist die Gewerbeanmeldung zum **01.11.2026** (Uwe, 17.10.2026).
Zwei Riegel, beide müssen beim Verkaufsstart wieder fallen:

| Riegel | Stand | Wer öffnet ihn |
|---|---|---|
| Kauf-Button auf der Seite | `NEXT_PUBLIC_DS_DIPLOM_PRODUCT_ID` am 17.10.2026 auf **nur Preview** gesetzt (Wert 750228 bleibt). Ohne die Variable rendert `src/lib/diplome/angebot.ts` `kaufbar: false`: kein Button, Lektionen sagen „derzeit noch nicht buchbar". Production neu gebaut. | Claude oder Uwe: Variable wieder auf Production + Preview, Redeploy. |
| Digistore-Produkt 750228 | ✓ **Verkaufsstopp gesetzt** (Uwe, 17.10.2026, nach Merge #426). DS-de-Freigabe nicht eingereicht. Vorher war der Checkout-Link öffentlich erreichbar — wer ihn kannte, kam ohne unseren Button an die Kasse. | Uwe hebt den Verkaufsstopp zum Verkaufsstart wieder auf (Schritt 1 unten). Per API nicht möglich (Token nicht in dieser Umgebung). |

Was der Testkauf hinterlassen hat, bleibt: Buchung 4YY6TULF auf Uwes Konto (Test-Erstattung
offen). Der Webhook bleibt scharf — eine echte Bestellung würde trotzdem ausgeliefert, deshalb
ist der Verkaufsstopp in Digistore der eigentliche Riegel, der Button nur die Sichtbarkeit.

**Verkaufsstart nach Gewerbeanmeldung (geplant 01.11.2026), in dieser Reihenfolge:** (1) Verkaufsstopp in Digistore
aufheben, Leistungszeitraum auf unbefristet; (2) Variable zurück auf Production + Preview,
Redeploy, Button auf `/diplome` sichtbar; (3) Produkt bei DS-de zur Prüfung einreichen;
(4) Impressum/AGB auf die Gewerbedaten prüfen (Kanzlei).

**Noch offen, in dieser Reihenfolge** (Reihenfolge ist Pflicht — Variablen vor Mapping = Kauf ohne Zugang):

1. ✓ 17.10.2026: Mapping `750228 → grillmeister-diplom`, `published = true`, `price = 99.00` —
   Migration `20261017083813_diplom_digistore_mapping.sql` (Ledger-Version), live abgefragt.
2. ✓ 17.10.2026: Vercel (2.3) `NEXT_PUBLIC_DS_DIPLOM_PRODUCT_ID=750228`, `NEXT_PUBLIC_DS_DIPLOM_PREIS=99`
   (Production + Preview, Typ plain). Wirksam auf Production mit dem nächsten Build — der Merge dieses PRs.
   **Seit 17.10.2026 nachmittags ist die Produkt-ID nur noch auf Preview** (Abschnitt 0a).
3. Digistore-Backend, per API nicht setzbar:
   - Leistungszeitraum Einmalzahlung steht auf **„3 Monate"** (Default des Produkttyps). Das Feld ist nur eine
     Angabe auf der Rechnung, es sperrt nichts. Entscheidung Uwe 17.10.2026: Zugang **unbefristet** → auf
     „lebenslang/unbefristet" stellen. Gegen Weitergabe schützen Geräte-Limit und Namensbindung (Abschnitt 0b).
   - ✓ 17.10.2026: IPN-Anbindung 352984 umfasst alle Produkte — belegt durch den Testkauf
     (`ipn_config_product_ids = all` im Payload).
   - Erst wenn `/diplome` Preis und Button zeigt: Produkt für DS-de **zur Prüfung einreichen**.
4. ✓ 17.10.2026, 14:18 Uhr: Testkauf **4YY6TULF** (Zahlplan 1533112, Testmodus, 99,00) — Webhook
   nach 35 s: `digistore_orders.processing_status = processed`, Buchung auf `grillmeister-diplom`
   aktiv, Recovery-Token für den Login-Link erzeugt, kein Sentry-Alarm. Uwe bestätigt: Mail
   angekommen, Link landet auf `/diplome/roadmap`, Stufe 2 nach Abschluss von Modul 1 offen.
5. Test-Erstattung auslösen (2.4, Punkt 5) — prüft den Entzugspfad (`bookings.revoked_at`).
6. Login-Mail „LogIn Link" in Loops an das Design der übrigen Vorlagen angleichen (Uwe,
   17.10.2026). Nur im Loops-Editor möglich: die Vorlagen sind MJML, und die Loops-API
   antwortet auf Lesen wie Schreiben mit „MJML format is not supported via API". Vorbild:
   „Urkunde — Bestellbestätigung" (09.10.2026). Die Variablen `magic_link` und `course_title`
   müssen erhalten bleiben — der Webhook füllt genau diese beiden.
7. Vercel-Variable `Gelato` (Production, 09.10.2026) in `GELATO_API_KEY` umbenennen —
   betrifft nicht das Diplom, aber die gedruckte Urkunde: `src/lib/urkunde/bestellbar.ts`
   sucht den exakten Namen, bis dahin antwortet die Bestellung mit 503.

**Raten (Entscheidung Uwe 17.10.2026: geplatzte Rate sperrt):** Rate 1 (`payment`) öffnet den Zugang mit
Login-Mail. `payment_missed` entzieht ihn sofort. Zahlt der Käufer nach, öffnet das nächste `payment` ihn
wieder (mit Mail); reguläre Folgeraten kommen ohne Mail. Damit Rate 2/3 nicht als Duplikat verschluckt werden,
trägt der Idempotenz-Schlüssel ab Rate 2 die Nummer (`payment#2`, `payment_missed#2`) — siehe `route.ts`,
Abschnitt „Raten". Der Entzug setzt `bookings.status = 'refunded'` (einziger Entzugsstatus der DB-Funktion);
der Grund steht in `digistore_orders`.

## 0b. Schutz gegen Weitergabe des Kontos (17.10.2026, Entscheidung Uwe)

| Baustein | Wo | Wirkung |
|---|---|---|
| Geräte-Limit 2 | `src/lib/auth/geraete-limit.ts`, DB `sitzung_zugelassen()` | Bezahlte Inhalte nur auf den zwei zuletzt angemeldeten Sitzungen (gezählt werden nur Sitzungen, die in den letzten 3 Tagen benutzt wurden — verwaiste aus gelöschten Cookies sperren niemanden); ältere landen auf `/auth/geraete` („Andere Geräte abmelden und hier weiterlernen"). Gilt für Diplom, Eigenregie, Mein Protokoll, Steuer-Matrix (alle über `requireCourseAccess` bzw. `diplomZugang`) und die Diplom-Prüfung. |
| Hinweis bei Auffälligkeit | Sentry, Issue „Geräte-Limit: auffällig viele neue Anmeldungen" | ab 6 neuen Anmeldungen in 7 Tagen, ein Issue pro Konto (nur Konto-ID). |
| Ein Name pro Konto | DB `urkunden_namen` | beim ersten Ausstellen bzw. der ersten Druckbestellung festgelegt; Änderung nur per SQL/Support. |
| Urkunde mit Prüfcode | DB `urkunden`, `/api/urkunde/ausstellen`, `/api/urkunde/bild` | digitale Urkunde kostenlos im Profil; Kennung `SA-2026-0001-K7Q2XM` steht auf der Urkunde; Druck nutzt dieselbe Kennung. |
| Öffentliche Prüfseite | `/urkunde`, `/urkunde/<kennung>` (noindex, nicht in der Sitemap) | zeigt Name, Grad, Datum — nur mit Prüfcode, Nummern hochzählen verrät nichts. |

Migrationen: `20261017094922_urkunden_schutz_geraete_limit.sql` + `20261017101203_urkunden_schutz_nachbesserung.sql` (angewendet und per SQL geprüft).
Support-Fall „Name falsch": `update urkunden_namen set name = '…' where user_id = '…';` und betroffene
`urkunden.name` gleich mitziehen. Admin-Cookie (Uwe) ist vom Geräte-Limit nur beim Diplom ausgenommen.

## 1. Was schon da ist (belegt am 16.10.2026)

| Baustein | Wo | Stand |
|---|---|---|
| Kurs in der DB | `courses.slug = grillmeister-diplom` | vorhanden, `published = false`, kein Produkt zeigt darauf |
| Zugang nach Kauf | `src/lib/diplome/zugang.ts` | aktive Buchung auf dem Kurs öffnet Stufe 2–5 |
| Webhook | `src/app/api/webhooks/digistore24/route.ts` | legt Buchung an, schickt Login-Link mit `next=/diplome/roadmap`; alarmiert bei fehlendem Mapping oder unveröffentlichtem Kurs (Sentry) |
| Kaufweg auf der Seite | `src/lib/diplome/angebot.ts` | zeigt Preis und Kauf-Button erst, wenn zwei Variablen gesetzt sind (Abschnitt 2.3) |
| Dankeseite | `/danke/diplom` | fertig, `noindex` |
| Gutschein fürs Diplom | `src/lib/gutschein-products.ts` | eigenes Voucher-Produkt, eigene Variablen (`NEXT_PUBLIC_DS_VOUCHER_DIPLOM`, `…_PREIS`) — getrennt vom Kauf hier |
| Tests | `src/__tests__/digistore-webhook.test.ts`, `diplom-angebot.test.ts` | Kauf → Buchung + Roadmap-Link; ohne Variablen kein Button |

## 2. Was Uwe tut, in dieser Reihenfolge

### 2.1 Digistore-Produkt anlegen

- Produkttyp digitales Produkt, Einmalzahlung. Preis: Entscheidung Uwe (bisher im
  Gespräch: 99 € Gründungspreis, 149 € regulär — `docs/gutschein-konzept-weihnachten-2026.md`
  G4; nichts davon ist bisher irgendwo zugesagt).
- **Dankeseiten-URL:** `https://steakakademie.de/danke/diplom`
- **IPN / Webhook:** dieselbe Anbindung wie bei den bestehenden Produkten
  (`/api/webhooks/digistore24`, Token aus `DIGISTORE_WEBHOOK_TOKEN`). Ist die IPN
  kontoweit eingerichtet, ist hier nichts zu tun — prüfen, ob das Produkt in der
  IPN-Produktliste enthalten ist.
- Widerrufs-Checkbox aktivieren (offener Punkt aus CLAUDE.md §5, gilt für alle Produkte).
- Produkt-ID notieren (reine Ziffern, z. B. `7xxxxx`).

### 2.2 Datenbank: Mapping und Veröffentlichung

Als Migration unter `supabase/migrations/<zeitstempel>_diplom_digistore_mapping.sql`
anlegen (Vorlage `20260610_seed_gruender_schmiede.sql`) und über den Supabase-Connector
oder die CLI ausführen. `<PRODUKT_ID>` ersetzen:

```sql
-- Grillmeister-Diplom: Digistore-Produkt <PRODUKT_ID> → Kurs grillmeister-diplom (Uwe, <Datum>)
INSERT INTO digistore_products (ds_product_id, course_id)
SELECT '<PRODUKT_ID>', id FROM courses WHERE slug = 'grillmeister-diplom'
ON CONFLICT (ds_product_id) DO UPDATE SET course_id = EXCLUDED.course_id;

-- Erst veröffentlichen, wenn der Kaufweg steht — sonst alarmiert jeder Kauf „kurs-unpublished".
UPDATE courses SET published = true WHERE slug = 'grillmeister-diplom';
```

Reihenfolge ist wichtig: **Mapping vor dem ersten Verkauf.** Ohne Zeile kassiert
Digistore, der Webhook legt keine Buchung an und schlägt in Sentry Alarm
(„kein-mapping"). Mit Zeile, aber `published = false`, kommt die Buchung, der Käufer
sieht die Lektionen trotzdem (Zugang prüft nur die Buchung) — und Sentry meldet
„kurs-unpublished", bis das Flag gesetzt ist.

### 2.3 Vercel: zwei Variablen, dann Redeploy

Scope Production **und** Preview, damit die Vorschau denselben Stand zeigt:

| Variable | Wert | Wirkung |
|---|---|---|
| `NEXT_PUBLIC_DS_DIPLOM_PRODUCT_ID` | Produkt-ID, nur Ziffern | Checkout-Link `https://www.checkout-ds24.com/product/<ID>` |
| `NEXT_PUBLIC_DS_DIPLOM_PREIS` | z. B. `99` oder `99 € statt 149 €` | Preis-Label an Button und Lektions-Sperre |

Fehlt eine der beiden, zeigt keine Seite Preis oder Button; die gesperrte Lektion sagt
weiter „derzeit noch nicht buchbar". `NEXT_PUBLIC_*` wird zur Bauzeit eingesetzt — nach dem
Setzen ein Deployment auslösen (leerer Commit oder „Redeploy" im Dashboard).

Wo die Variablen wirken: `/diplome` (Kauf-Kasten über dem Roadmap-Button) und jede
gesperrte Lektion ab Stufe 2 (Button „Diplom freischalten · <Preis>").

### 2.4 Testkauf

Digistore bietet Testkäufe mit `@test-ds24.com`-Adressen an (so kamen die drei
`failed`-Zeilen vom Mai/Juni 2026 zustande). Danach prüfen:

1. ✓ 17.10.2026: `digistore_orders` 4YY6TULF, `processing_status = 'processed'`, Produkt 750228.
2. ✓ 17.10.2026: `bookings` auf `grillmeister-diplom`, Status `active`.
3. ✓ 17.10.2026: Sentry ohne neues Issue, Vercel-Log ohne Warnung des Webhooks.
4. ✓ 17.10.2026: Login-Link führt nach `/diplome/roadmap`, Stufe 2 nach Modul 1 offen (Uwe).
5. Rückerstattung des Testkaufs auslösen → `bookings.revoked_at` gesetzt, Lektion wieder zu. **Offen.**

### 2.5 Nacharbeiten

- ✓ `docs/COCKPIT.md`, Wachstum: Stand 17.10.2026 eingetragen.
- ✓ `src/app/api/webhooks/digistore24/route.ts`, Kopfkommentar: 750228 mit Mapping und Testkauf.
- Gutschein fürs Diplom (G4) braucht ein **eigenes** Voucher-Produkt — getrennt entscheiden
  (`docs/gutschein-konzept-weihnachten-2026.md`).

## 3. Was dieses Runbook nicht abdeckt

- Preisentscheidung und Zahlpläne in Digistore.
- Steuer-/AGB-Fragen des Diploms (Kanzlei; FernUSG-Einordnung siehe
  `src/lib/eigenregie/angebot.ts`, Kopfkommentar — gilt sinngemäß: keine persönliche
  Betreuung im Kurspreis).
- Den Gutschein-Kaufweg (eigene Variablen, eigenes Produkt).
