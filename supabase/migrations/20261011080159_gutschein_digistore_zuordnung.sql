-- ============================================================
-- Geschenkgutscheine: Digistore24-Produkte den Gutschein-Kursen zuordnen
--
-- ANGEWENDET am 11.10.2026 (Freigabe Uwe im Chat: „Ja, Migration ausführen"), per
-- Supabase-MCP auf Projekt bbgdrzhlellxzggbbqcm, Ledger-Version 20261011080159 — der
-- Dateiname entspricht ihr (Regel aus PR #285; vorher 20261011100000). Zurückgelesen:
-- 746579 / 746580 / 746581 stehen mit den Werten unten, credit_amount überall NULL.
--
-- Anlass: Uwe hat am 11.10.2026 die drei Produktgutscheine des Sortiments vom 09.10.
-- in Digistore24 angelegt (inaktiv, Verkaufsstart 01.11.2026, IPN-Anbindung 352984
-- gilt für alle Produkte). Damit der Webhook einen Kauf als Gutschein erkennt — und
-- NICHT als unbekanntes Produkt —, braucht jede Produkt-ID eine Zeile in
-- digistore_products (docs/weihnachts-gutschein-checkliste.md, Schritt 2).
--
--   746579  Geschenkgutschein: Steak-Beichte      7 €   1 Diagnose  → Credit-Gutschein (1)
--   746580  Geschenkgutschein: Steak-Beichte 5er  25 €  5 Diagnosen → Credit-Gutschein (5)
--   746581  Geschenkgutschein: Mein Protokoll     19 €  Protokoll   → Kurs-Gutschein
--
-- Wie der Webhook entscheidet (src/app/api/webhooks/digistore24/route.ts):
--   is_voucher = true und course_id gesetzt → handleVoucherProduct: der Kauf erzeugt NUR
--   einen Code (SA-XXXX-XXXX), beim Käufer wird nichts freigeschaltet.
--   voucher_credit_amount gesetzt → Credit-Gutschein (redeem_voucher ruft
--   grant_diagnose_credits); NULL → Kurs-Gutschein.
--   credit_amount bleibt bei Gutscheinen NULL: Ein Wert dort würde den Kauf als
--   Credit-Kauf des Käufers behandeln (Zweig 0 im Webhook greift nur bei is_voucher = false,
--   die Zeile soll trotzdem eindeutig sein).
--
-- Kein Seed ohne Prüfung: Fehlt einer der beiden Kurse (steak-beichte, mein-protokoll),
-- würde INSERT … SELECT ohne Fehlermeldung keine Zeile schreiben — der Käufer zahlte, ein
-- Code entstünde nicht. Deshalb bricht der Block am Ende mit einer Ausnahme ab, wenn nicht genau drei
-- Gutschein-Zeilen mit den erwarteten Werten stehen.
--
-- Idempotent: ON CONFLICT … DO UPDATE kann beliebig oft laufen.
-- ============================================================

-- G1 Steak-Beichte: Credit-Gutschein über 1 Diagnose
INSERT INTO public.digistore_products (ds_product_id, course_id, is_voucher, voucher_credit_amount, credit_amount)
SELECT '746579', id, true, 1, NULL FROM public.courses WHERE slug = 'steak-beichte'
ON CONFLICT (ds_product_id) DO UPDATE
  SET course_id = EXCLUDED.course_id,
      is_voucher = true,
      voucher_credit_amount = EXCLUDED.voucher_credit_amount,
      credit_amount = NULL;

-- G2 Steak-Beichte 5er: Credit-Gutschein über 5 Diagnosen
INSERT INTO public.digistore_products (ds_product_id, course_id, is_voucher, voucher_credit_amount, credit_amount)
SELECT '746580', id, true, 5, NULL FROM public.courses WHERE slug = 'steak-beichte'
ON CONFLICT (ds_product_id) DO UPDATE
  SET course_id = EXCLUDED.course_id,
      is_voucher = true,
      voucher_credit_amount = EXCLUDED.voucher_credit_amount,
      credit_amount = NULL;

-- G3 Mein Protokoll: Kurs-Gutschein (Gutschrift eines Protokolls beim Einlösen)
INSERT INTO public.digistore_products (ds_product_id, course_id, is_voucher, voucher_credit_amount, credit_amount)
SELECT '746581', id, true, NULL, NULL FROM public.courses WHERE slug = 'mein-protokoll'
ON CONFLICT (ds_product_id) DO UPDATE
  SET course_id = EXCLUDED.course_id,
      is_voucher = true,
      voucher_credit_amount = NULL,
      credit_amount = NULL;

-- Kontrolle: genau diese drei Zeilen, mit den erwarteten Gutschein-Werten.
DO $$
DECLARE
  anzahl int;
BEGIN
  SELECT count(*) INTO anzahl
  FROM public.digistore_products p
  JOIN public.courses c ON c.id = p.course_id
  WHERE p.is_voucher = true
    AND p.credit_amount IS NULL
    AND (
         (p.ds_product_id = '746579' AND c.slug = 'steak-beichte' AND p.voucher_credit_amount = 1)
      OR (p.ds_product_id = '746580' AND c.slug = 'steak-beichte' AND p.voucher_credit_amount = 5)
      OR (p.ds_product_id = '746581' AND c.slug = 'mein-protokoll' AND p.voucher_credit_amount IS NULL)
    );
  IF anzahl <> 3 THEN
    RAISE EXCEPTION 'Gutschein-Zuordnung unvollständig: % von 3 Zeilen — fehlt der Kurs steak-beichte oder mein-protokoll in courses?', anzahl;
  END IF;
END $$;
