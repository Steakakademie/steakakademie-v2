# Weihnachts-Gutscheine scharfschalten — Uwes Checkliste

> ⏳ **VERKAUFSSTART: 01.10.2026** (Gewerbeanmeldung zum 01.10. — vorher keine
> neuen Verkaufsprodukte anlegen). Bis dahin: Saison-Generator baut den
> Weihnachts-Content auf; die Schritte unten sind ab dem 01.10. dran.
>
> Stand 26.08.2026. Das Gutschein-System ist **code-seitig komplett** (seit
> Migration `20260607_vouchers.sql`): Kaufabwicklung über Digistore24-Webhook,
> Code-Erzeugung, druckbare Gutschein-Seite (`/gutschein/[code]`), Einlösung
> (`/gutschein/einloesen` → Kurs-Zugang bzw. Steak-Beichte-Credits),
> Loops-Bestätigungsmail (`LOOPS_VOUCHER_TEMPLATE_ID`, auf Vercel gesetzt ✅).
>
> **Es fehlt NUR der Handelsteil** — drei Klick-Strecken in Digistore24 und
> zwei Einträge je Produkt. Danach ist /gutschein sofort verkaufsfähig.
>
> ⚠️ **BBQ-Grundkurs bewusst NICHT freischalten**, bis der Video-Kurs echt
> fertig ist („erst Substanz, dann verkaufen"). Start-Lineup Weihnachten:
> **Mein Protokoll (19 €) + Steak-Beichte (7 €)** — Gründer-Schmiede optional.

---

## Je Produkt drei Schritte (≈ 10 Min/Produkt)

### 1) Digistore24: Gutschein-Produktvariante anlegen
Digistore24 → Produkte → **Produkt kopieren** (vom bestehenden Produkt) →
- Titel: „**Geschenkgutschein: Mein Protokoll**" (bzw. Steak-Beichte)
- Preis wie Original (19 € / 7 €)
- Beschreibung: „Digitaler Geschenkgutschein — Code kommt per E-Mail,
  einlösbar auf steakakademie.de/gutschein/einloesen. Kein Abo."
- **Webhook-URL** (wie bei den Hauptprodukten):
  `https://steakakademie.de/api/webhooks/digistore24?token=<DIGISTORE_WEBHOOK_TOKEN>`
- **Danke-Seite**: `https://steakakademie.de/danke/gutschein`
- Notiere die neue **Produkt-ID** (z. B. 69xxxx).

### 2) Supabase: Produkt als Gutschein mappen (SQL-Editor, je 1 Statement)

```sql
-- Mein Protokoll — Kurs-Gutschein
INSERT INTO digistore_products (ds_product_id, course_id, is_voucher)
SELECT '<DS_ID_PROTOKOLL>', id, true FROM courses WHERE slug = 'mein-protokoll'
ON CONFLICT (ds_product_id) DO UPDATE SET is_voucher = true;

-- Steak-Beichte — Credit-Gutschein (1 Diagnose)
INSERT INTO digistore_products (ds_product_id, course_id, is_voucher, voucher_credit_amount)
SELECT '<DS_ID_BEICHTE>', id, true, 1 FROM courses WHERE slug = 'steak-beichte'
ON CONFLICT (ds_product_id) DO UPDATE SET is_voucher = true, voucher_credit_amount = 1;
```

### 3) Vercel: Checkout-URL als Env setzen (Production)
Settings → Environment Variables → Production:

| Variable | Wert |
|---|---|
| `NEXT_PUBLIC_DS_VOUCHER_MEIN_PROTOKOLL` | `https://www.checkout-ds24.com/product/<DS_ID_PROTOKOLL>` |
| `NEXT_PUBLIC_DS_VOUCHER_STEAK_BEICHTE` | `https://www.checkout-ds24.com/product/<DS_ID_BEICHTE>` |

**Entfallen (Uwe, 09.09.2026):** `NEXT_PUBLIC_DS_VOUCHER_BBQ_GRUNDKURS` — der
BBQ-Grundkurs ist eingestellt, Stufe 1 des Diploms deckt seinen Stoff kostenlos ab.
Der Eintrag ist auch aus `src/lib/gutschein-products.ts` raus: Ein Geschenkgutschein
auf ein Produkt, das es nicht mehr gibt, ist der schlimmste Fall dieser Liste — der
Schenkende zahlt, der Beschenkte kann nichts einlösen.

**Damit stehen im Weihnachtsregal nur noch 19 € und 7 €.** Der 79-€-Platz war der
einzige im geschenktauglichen Bereich; sein Ersatz ist ein **Gutschein auf das
Grillmeister-Diplom (99 €)**, sobald das Diplom monetarisiert ist. Diese Lücke ist
der bewusst in Kauf genommene Preis der Einstellung — nicht ein Versehen.

→ **Redeploy** auslösen (env greift erst im nächsten Build).
→ Karte auf `/gutschein` wechselt automatisch von „In Vorbereitung" auf Kauf-Button.

---

## Abnahme (Testkauf, wie bei A+B verifiziert)
1. Gutschein-Produkt selbst kaufen (Digistore-Testmodus oder Echtkauf + Storno)
2. E-Mail mit Code kommt (Loops-Template `LOOPS_VOUCHER_TEMPLATE_ID`)
3. `/gutschein/<code>` zeigt die druckbare Geschenkseite
4. Mit Zweit-Konto auf `/gutschein/einloesen` einlösen → Zugang/Credits da
5. Erst nach grünem Durchlauf: Kampagne bewerben

## Sichtbarkeit (nach Freischaltung — Marketing-Schritt)
- `/gutschein` ist bisher **nur im Footer** verlinkt.
- Für die Weihnachts-Kampagne: Header-Hinweis + Saison-Berichte verweisen
  bereits auf `/gutschein` (Saison-Generator, Fenster „Weihnachten", aktiv
  seit 25.08.) + Loops-Kampagnenmail an die Liste.
