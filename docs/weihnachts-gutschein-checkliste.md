# Weihnachts-Gutscheine scharfschalten — Uwes Checkliste

> ⏳ **VERKAUFSSTART: 01.11.2026** (Gewerbeanmeldung zum 01.11. — vorher keine
> neuen Verkaufsprodukte freischalten). Konzept, Sortiment und Zeitplan:
> `docs/gutschein-konzept-weihnachten-2026.md`.
>
> Stand 09.10.2026 (vorher 26.08.2026). Das System für **Produktgutscheine**
> ist code-seitig komplett (seit Migration `20260607_vouchers.sql`):
> Kaufabwicklung über den Digistore24-Webhook, Code-Erzeugung, druckbare
> Gutschein-Seite (`/gutschein/[code]`), Einlösung (`/gutschein/einloesen` →
> Kurs-Zugang, Steak-Beichte-Diagnosen bzw. Mein-Protokoll-Gutschrift),
> Loops-Mail (`LOOPS_VOUCHER_TEMPLATE_ID`, auf Vercel gesetzt ✅).
>
> **Es fehlt der Handelsteil** — je Produkt eine Strecke in Digistore24, eine
> Zuordnung in der Datenbank und eine Variable in Vercel.
>
> **Sortiment (Uwe, 09.10.2026):**
> G1 Steak-Beichte 7 € · G2 Steak-Beichte 5er 25 € · G3 Mein Protokoll 19 € ·
> G4 Grillmeister-Diplom (erst, wenn das Diplom selbst kaufbar ist).
> Freie Wertgutscheine 25/50/75/100 € brauchen eigenen Code und die Antwort
> der Kanzlei zur Umsatzsteuer — sie stehen **nicht** in dieser Checkliste.

---

## Stand 11.10.2026 — Schritt 1 und 2 erledigt, Schritt 3 offen

**Schritt 1 (Digistore24) ist fertig** — drei Produkte angelegt, alle **inaktiv**, Verkaufsstart
01.11.2026 00:00, Genehmigung „noch nicht beantragen", Danke-Seite
`https://steakakademie.de/danke/gutschein`, Produkttyp Downloads. Der Preisplan der Vorlage, der
nicht zum Gutschein gehört, ist **deaktiviert**, nicht gelöscht:

| | Produkt-ID | Preis | Checkout |
|---|---|---|---|
| G1 Geschenkgutschein: Steak-Beichte | 746579 | 7 € | https://www.checkout-ds24.com/product/746579 |
| G2 Geschenkgutschein: Steak-Beichte 5er | 746580 | 25 € | https://www.checkout-ds24.com/product/746580 |
| G3 Geschenkgutschein: Mein Protokoll | 746581 | 19 € | https://www.checkout-ds24.com/product/746581 |

Die IPN-Anbindung 352984 („Steakakademie IPN (sha_sign)") gilt für **alle Produkte** und ist aktiv;
eine Zuordnung je Produkt ist nicht nötig. Die alte Token-Anbindung 325764 ist inaktiv.

**Schritt 2 ist erledigt:** Migration `supabase/migrations/20261011080159_gutschein_digistore_zuordnung.sql`
am 11.10.2026 per Supabase-MCP angewendet (Freigabe Uwe im Chat: „Ja, Migration ausführen"),
Ledger-Version 20261011080159. Zurückgelesen: 746579 → steak-beichte, Credit-Gutschein 1;
746580 → steak-beichte, Credit-Gutschein 5; 746581 → mein-protokoll, Kurs-Gutschein;
`credit_amount` bei allen NULL; die Originale 696394 und 696396 unverändert. Die Migration bricht
ab, wenn nicht genau diese drei Zeilen entstehen. Test: `src/__tests__/gutschein-digistore-zuordnung.test.ts`.
Nächster Schritt: Testkauf im Digistore-Testmodus.

**Schritt 3 (Vercel):** `NEXT_PUBLIC_DS_VOUCHER_STEAK_BEICHTE`, `NEXT_PUBLIC_DS_VOUCHER_STEAK_BEICHTE_5ER`
und `NEXT_PUBLIC_DS_VOUCHER_MEIN_PROTOKOLL` auf die Checkout-Adressen oben, dann Redeploy. **Erst
kurz vor dem 01.11.** — mit der Variablen wechselt die Karte auf `/gutschein` von „In Vorbereitung"
auf den Kaufknopf.

**Gültigkeit der Gutscheine:** bis 31.12. des dritten Folgejahres (Kauf 2026 → 31.12.2029),
AGB § 5a, Datenbank-Vorgabe seit Migration 20261009170345. Das ist unabhängig von der
Rückgabefrist (Geld-zurück-Frist) des Digistore-Produkts.

**Rückgabefrist (geprüft 11.10.2026 per Digistore-API):** Die Regel „Gesetzlich 14 Tage (laut
AGB)" gilt für alle Produkte, alle drei Gutscheine sind darin angehakt. Die API meldet trotzdem
`refund_days: 60` — und zwar für **jedes nicht genehmigte** Produkt (746579–746581 und auch das
alte Mein Protokoll 696396); nur das genehmigte 696394 meldet 14. Neu speichern der Regel hat
daran nichts geändert. Vermutung (nicht belegt): Bis zur Genehmigung gilt Digistores
Standardfrist. **Nach der Genehmigung erneut prüfen** (`getProduct`, Feld `refund_policy`);
steht dann noch 60, beim Digistore-Support nachfragen.

**Offen:** Genehmigungsantrag bei Digistore (das Original Mein Protokoll 696396 ist selbst noch
nicht genehmigt).

**Personalisierung und Wunschtermin (gebaut 11.10.2026)** — vor dem Verkaufsstart:
1. Migration `supabase/migrations/…_gutschein_personalisierung.sql` anwenden (Uwes Ja), **vor**
   dem Merge des PR — Geschenkseite und API lesen die neuen Spalten.
2. `GUTSCHEIN_VERSAND_SECRET`: einen langen Zufallswert als GitHub-Actions-Secret **und** als
   Vercel-Variable (Production) setzen. Ohne ihn ist der Workflow „Gutschein-Versand" rot.
3. Loops: Transaktionsmail „Geschenk für dich" anlegen (Variablen und Textvorschlag:
   `docs/gutschein-sichtbarkeit-konzept.md`, „Loops-Vorlage"), ID als
   `LOOPS_VOUCHER_GIFT_TEMPLATE_ID` in Vercel (Production), Redeploy. Ohne sie gibt es nur
   „selbst weitergeben".
4. Beim Testkauf zusätzlich: Link aus der Käufer-Mail öffnen → Formular sichtbar; Namen,
   Nachricht, Motiv speichern; einmal „Sofort" an eine eigene Zweitadresse, einmal ein Termin
   in der nächsten Stunde → kommt die Mail, steht auf der Geschenkseite „Verschickt an …"?

**Wertgutscheine W25–W100** sind seit 11.10.2026 ebenfalls angelegt (746668–746671, inaktiv) —
**nicht aktivieren**, Stand und Gründe: `docs/gutschein-konzept-weihnachten-2026.md`.

## Je Produkt drei Schritte (≈ 10 Min/Produkt)

### 1) Digistore24: Gutschein-Produktvariante anlegen
Digistore24 → Produkte → **Produkt kopieren** (vom bestehenden Produkt) →
- Titel: „**Geschenkgutschein: Mein Protokoll**" (bzw. Steak-Beichte,
  Steak-Beichte 5er, Grillmeister-Diplom)
- Preis wie Original (19 € / 7 € / 25 € / Diplompreis)
- Beschreibung: „Digitaler Geschenkgutschein — Code kommt per E-Mail,
  einlösbar auf steakakademie.de/gutschein/einloesen. Kein Abo."
- **Anbindung: das Produkt an die bestehende IPN-Anbindung 352984 hängen**
  (Digistore → Einstellungen → Anbindungen (IPN); dort die Produktauswahl
  prüfen, falls die Anbindung nicht für alle Produkte gilt).
  ⚠️ **Nicht** eine eigene Webhook-URL mit `?token=…` eintragen: Die Anmeldung
  per URL-Token ist abgeschaltet (`DIGISTORE_WEBHOOK_ALLOW_URL_TOKEN` ist in
  Vercel nicht gesetzt). Ein so angebundenes Produkt bekäme 401 — der Käufer
  zahlt, ein Code entsteht nicht. Die IPN-Anbindung meldet sich über `sha_sign`
  (`DIGISTORE_IPN_PASSPHRASE`).
- **Danke-Seite**: `https://steakakademie.de/danke/gutschein`
- **Verkaufsstart** auf den 01.11.2026 setzen.
- Notiere die neue **Produkt-ID** (z. B. 69xxxx) und gib sie Claude.

### 2) Datenbank: Produkt als Gutschein zuordnen
Claude legt dafür eine Migration an (Konzept T6); die Statements zum Nachlesen:

```sql
-- G3 Mein Protokoll — Kurs-Gutschein
INSERT INTO digistore_products (ds_product_id, course_id, is_voucher)
SELECT '<DS_ID_PROTOKOLL>', id, true FROM courses WHERE slug = 'mein-protokoll'
ON CONFLICT (ds_product_id) DO UPDATE SET is_voucher = true;

-- G1 Steak-Beichte — Credit-Gutschein (1 Diagnose)
INSERT INTO digistore_products (ds_product_id, course_id, is_voucher, voucher_credit_amount)
SELECT '<DS_ID_BEICHTE>', id, true, 1 FROM courses WHERE slug = 'steak-beichte'
ON CONFLICT (ds_product_id) DO UPDATE SET is_voucher = true, voucher_credit_amount = 1;

-- G2 Steak-Beichte 5er — Credit-Gutschein (5 Diagnosen)
INSERT INTO digistore_products (ds_product_id, course_id, is_voucher, voucher_credit_amount)
SELECT '<DS_ID_BEICHTE_5ER>', id, true, 5 FROM courses WHERE slug = 'steak-beichte'
ON CONFLICT (ds_product_id) DO UPDATE SET is_voucher = true, voucher_credit_amount = 5;

-- G4 Grillmeister-Diplom — Kurs-Gutschein (erst nach dem Direktkauf)
INSERT INTO digistore_products (ds_product_id, course_id, is_voucher)
SELECT '<DS_ID_DIPLOM_GUTSCHEIN>', id, true FROM courses WHERE slug = 'grillmeister-diplom'
ON CONFLICT (ds_product_id) DO UPDATE SET is_voucher = true;
```

### 3) Vercel: Checkout-URL als Env setzen (Production)
Settings → Environment Variables → Production:

| Variable | Wert |
|---|---|
| `NEXT_PUBLIC_DS_VOUCHER_MEIN_PROTOKOLL` | `https://www.checkout-ds24.com/product/<DS_ID_PROTOKOLL>` |
| `NEXT_PUBLIC_DS_VOUCHER_STEAK_BEICHTE` | `https://www.checkout-ds24.com/product/<DS_ID_BEICHTE>` |

Für G2 und G4 nennt Claude die Variablennamen, sobald die Karten im Code
stehen (Konzept T2 und T5).

**Entfallen (Uwe, 09.09.2026):** `NEXT_PUBLIC_DS_VOUCHER_BBQ_GRUNDKURS` — der
BBQ-Grundkurs ist eingestellt, Stufe 1 des Diploms deckt seinen Stoff kostenlos ab.
Der Eintrag ist auch aus `src/lib/gutschein-products.ts` raus: Ein Geschenkgutschein
auf ein Produkt, das es nicht mehr gibt, ist der schlimmste Fall dieser Liste — der
Schenkende zahlt, der Beschenkte kann nichts einlösen.

→ **Redeploy** auslösen (env greift erst im nächsten Build).
→ Karte auf `/gutschein` wechselt automatisch von „In Vorbereitung" auf Kauf-Button.

---

## Abnahme (Testkauf)
1. Gutschein-Produkt im Digistore-Testmodus kaufen (vor dem 01.11. kein Echtkauf)
2. E-Mail mit Code kommt (Loops-Template `LOOPS_VOUCHER_TEMPLATE_ID`)
3. `/gutschein/<code>` zeigt die druckbare Geschenkseite
4. Mit Zweit-Konto auf `/gutschein/einloesen` einlösen → Zugang, Diagnosen bzw.
   Protokoll-Guthaben da
5. In `digistore_orders` steht die Bestellung als `processed`, in `vouchers` der Code
6. Erst nach grünem Durchlauf: Kampagne bewerben

## Sichtbarkeit (nach Freischaltung — Marketing-Schritt)
- `/gutschein` ist live, indexierbar und in der Sitemap, aber **nur im Footer**
  verlinkt (geprüft 09.10.2026).
- Der Saison-Kalender (`data/saison-kalender.yaml`, Fenster bis 24.12.) weist den
  Generator an, wo passend auf `/gutschein` zu verweisen. Stand 09.10. enthält aber
  **kein** Beitrag unter `content/` einen solchen Link — der frühere Hinweis
  „Saison-Berichte verweisen bereits auf `/gutschein`" beschrieb die Absicht,
  nicht den Bestand.
- Was geplant ist (Links auf Produktseiten und Startseite, Header im
  November/Dezember, Ratgeber „Geschenke für Grillfans", Social, zwei Mails):
  Konzept, Abschnitt „Sichtbarkeit".
