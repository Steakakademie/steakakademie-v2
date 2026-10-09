-- ============================================================
-- Geschenkgutschein „Mein Protokoll": Gutschrift beim Einlösen und
-- Gegenbuchung bei Rückgabe — in derselben Transaktion wie der Gutschein.
--
-- NOCH NICHT ANGEWENDET (Stand 09.10.2026). Anwenden nur mit Freigabe Uwe;
-- danach den Dateinamen auf die Ledger-Version setzen (Regel aus PR #285).
-- Reihenfolge zum Deploy egal: /api/gutschein/redeem schreibt die Gutschrift
-- bis dahin selbst (idempotent über UNIQUE (quelle, referenz), dieselbe
-- Referenz wie hier).
--
-- Anlass (Konzept docs/gutschein-konzept-weihnachten-2026.md, T3 + T4):
--   T3  Die Route rief erst redeem_voucher (Gutschein → 'redeemed', Zugang)
--       und schrieb danach die Protokoll-Gutschrift. Scheiterte der zweite
--       Schritt, war der Gutschein verbraucht und das Guthaben fehlte — nur
--       eine Logzeile. Jetzt in einem Zug: scheitert die Gutschrift, rollt die
--       ganze Einlösung zurück und der Code bleibt einlösbar.
--   T4  revoke_voucher entzog bei Rückgabe nur den Kurs-Zugang. Die
--       Gutschrift blieb stehen, und ein Nutzer mit einem ZWEITEN Protokoll aus
--       einem Direktkauf verlor seinen Zugang mit. Jetzt wie im Webhook beim
--       Direktkauf: Gegenbuchung; Zugang nur entziehen, wenn danach kein
--       Guthaben mehr übrig ist.
--
-- Referenz der Gutschrift: der Gutschein-Code in kanonischer Form (vouchers.code),
-- Rückgabe: '<Code>:rueckgabe' — gleiches Muster wie '<Order-ID>:rueckgabe'.
-- Bestand: vouchers hat 0 Zeilen (09.10.2026), es gibt nichts nachzuziehen.
--
-- Idempotent: CREATE OR REPLACE, gleiche Signaturen wie 20260607_vouchers.sql.
-- ============================================================

CREATE OR REPLACE FUNCTION redeem_voucher(
  p_code    text,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v       vouchers;
  v_slug  text;
  v_title text;
BEGIN
  SELECT * INTO v FROM vouchers
    WHERE code = upper(replace(trim(p_code), ' ', ''))
    FOR UPDATE;

  IF NOT FOUND               THEN RETURN jsonb_build_object('status','not_found'); END IF;
  IF v.status = 'redeemed'   THEN RETURN jsonb_build_object('status','already_redeemed'); END IF;
  IF v.status = 'revoked'    THEN RETURN jsonb_build_object('status','revoked'); END IF;
  IF v.valid_until < now()   THEN RETURN jsonb_build_object('status','expired'); END IF;

  SELECT slug, title INTO v_slug, v_title FROM courses WHERE id = v.course_id;

  IF v.kind = 'credit' THEN
    PERFORM grant_diagnose_credits(p_user_id, COALESCE(v.credit_amount, 1));
  ELSE
    PERFORM grant_course_access(p_user_id, v.course_id);
    -- Mein Protokoll: Der Zugang öffnet nur die Tür; WIE VIELE Protokolle
    -- bezahlt sind, steht in protokoll_gutschriften. Ein Gutschein = 1.
    IF v_slug = 'mein-protokoll' THEN
      INSERT INTO protokoll_gutschriften (user_id, quelle, referenz, anzahl)
      VALUES (p_user_id, 'gutschein', v.code, 1)
      ON CONFLICT (quelle, referenz) DO NOTHING;
    END IF;
  END IF;

  UPDATE vouchers
    SET status = 'redeemed', redeemed_by = p_user_id, redeemed_at = now()
    WHERE id = v.id;

  RETURN jsonb_build_object('status','ok','course_slug',v_slug,'course_title',v_title);
END;
$$;

CREATE OR REPLACE FUNCTION revoke_voucher(p_ds_order_id text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v      vouchers;
  v_slug text;
  v_rest integer;
BEGIN
  SELECT * INTO v FROM vouchers WHERE ds_order_id = p_ds_order_id FOR UPDATE;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;

  IF v.status = 'redeemed' AND v.redeemed_by IS NOT NULL THEN
    IF v.kind = 'credit' THEN
      PERFORM revoke_diagnose_credits(v.redeemed_by, COALESCE(v.credit_amount, 1));
    ELSE
      SELECT slug INTO v_slug FROM courses WHERE id = v.course_id;

      IF v_slug = 'mein-protokoll' THEN
        INSERT INTO protokoll_gutschriften (user_id, quelle, referenz, anzahl)
        SELECT v.redeemed_by, 'gutschein', v.code || ':rueckgabe', -g.anzahl
          FROM protokoll_gutschriften g
          WHERE g.quelle = 'gutschein' AND g.referenz = v.code AND g.anzahl > 0
        ON CONFLICT (quelle, referenz) DO NOTHING;

        SELECT COALESCE(sum(anzahl), 0) INTO v_rest
          FROM protokoll_gutschriften WHERE user_id = v.redeemed_by;

        -- Guthaben aus einem anderen Kauf → Zugang bleibt (wie im Webhook).
        IF v_rest <= 0 THEN
          PERFORM revoke_course_access(v.redeemed_by, v.course_id);
        END IF;
      ELSE
        PERFORM revoke_course_access(v.redeemed_by, v.course_id);
      END IF;
    END IF;
  END IF;

  UPDATE vouchers SET status = 'revoked' WHERE id = v.id;
  RETURN 'revoked';
END;
$$;

-- Rechte wie in 20260607_vouchers.sql (CREATE OR REPLACE behält sie, hier
-- ausdrücklich, damit die Datei allein den Sollzustand beschreibt).
REVOKE ALL ON FUNCTION redeem_voucher(text, uuid) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION revoke_voucher(text)       FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION redeem_voucher(text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION revoke_voucher(text)       TO service_role;
