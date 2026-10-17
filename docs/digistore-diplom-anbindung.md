# Grillmeister-Diplom an Digistore anbinden — Runbook

> Stand 16.10.2026. Abteilung: Wachstum (Monetarisierung), CLAUDE.md §5 Blocker 3.
> Code-Seite ist vorbereitet (PR vom 16.10.2026). Was fehlt, steht in Abschnitt 2 und
> kann nur Uwe im Digistore-Backend und im Vercel-Projekt erledigen.

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

**Noch offen, in dieser Reihenfolge** (Reihenfolge ist Pflicht — Variablen vor Mapping = Kauf ohne Zugang):

1. ✓ 17.10.2026: Mapping `750228 → grillmeister-diplom`, `published = true`, `price = 99.00` —
   Migration `20261017083813_diplom_digistore_mapping.sql` (Ledger-Version), live abgefragt.
2. ✓ 17.10.2026: Vercel (2.3) `NEXT_PUBLIC_DS_DIPLOM_PRODUCT_ID=750228`, `NEXT_PUBLIC_DS_DIPLOM_PREIS=99`
   (Production + Preview, Typ plain). Wirksam auf Production mit dem nächsten Build — der Merge dieses PRs.
3. Digistore-Backend, per API nicht setzbar:
   - Leistungszeitraum Einmalzahlung steht auf **„3 Monate"** (Default des Produkttyps) — der Zugang ist
     unbefristet (`src/lib/diplome/zugang.ts`), also auf „lebenslang/unbefristet" stellen.
   - IPN: prüfen, dass die Anbindung „alle Produkte" umfasst oder 750228 aufnehmen.
   - Erst wenn `/diplome` Preis und Button zeigt: Produkt für DS-de **zur Prüfung einreichen**.
4. Testkauf (2.4) über den Testpay-Link aus dem Produkt (Digistore → Produkt 750228 → Vorschau).

**Raten (Entscheidung Uwe 17.10.2026: geplatzte Rate sperrt):** Rate 1 (`payment`) öffnet den Zugang mit
Login-Mail. `payment_missed` entzieht ihn sofort. Zahlt der Käufer nach, öffnet das nächste `payment` ihn
wieder (mit Mail); reguläre Folgeraten kommen ohne Mail. Damit Rate 2/3 nicht als Duplikat verschluckt werden,
trägt der Idempotenz-Schlüssel ab Rate 2 die Nummer (`payment#2`, `payment_missed#2`) — siehe `route.ts`,
Abschnitt „Raten". Der Entzug setzt `bookings.status = 'refunded'` (einziger Entzugsstatus der DB-Funktion);
der Grund steht in `digistore_orders`.

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

1. `digistore_orders`: Zeile mit `processing_status = 'processed'`, Produkt-ID stimmt.
2. `bookings`: Buchung auf `grillmeister-diplom` für den Test-Nutzer.
3. Sentry: **kein** neues Issue „kassiert ohne Auslieferung".
4. Login-Link aus der Mail führt nach `/diplome/roadmap`, Stufe-2-Lektion ist offen.
5. Rückerstattung des Testkaufs auslösen → `bookings.revoked_at` gesetzt, Lektion wieder zu.

### 2.5 Nacharbeiten

- `docs/COCKPIT.md`, Wachstum: „Offen, nur Uwe: Digistore-Produkt fürs Diplom" streichen.
- `src/app/api/webhooks/digistore24/route.ts`, Kopfkommentar: Produkt in die Liste der
  geprüften Produkte aufnehmen.
- Gutschein fürs Diplom (G4) braucht ein **eigenes** Voucher-Produkt — getrennt entscheiden
  (`docs/gutschein-konzept-weihnachten-2026.md`).

## 3. Was dieses Runbook nicht abdeckt

- Preisentscheidung und Zahlpläne in Digistore.
- Steuer-/AGB-Fragen des Diploms (Kanzlei; FernUSG-Einordnung siehe
  `src/lib/eigenregie/angebot.ts`, Kopfkommentar — gilt sinngemäß: keine persönliche
  Betreuung im Kurspreis).
- Den Gutschein-Kaufweg (eigene Variablen, eigenes Produkt).
