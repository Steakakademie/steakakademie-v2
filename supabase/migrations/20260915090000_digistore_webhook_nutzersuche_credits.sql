-- ANGEWENDET am 15.09.2026 auf Projekt bbgdrzhlellxzggbbqcm (per MCP apply_migration),
-- Ledger-Version 20260915072704. Geprueft danach: Spalte + beide Funktionen vorhanden,
-- SECURITY DEFINER mit festem search_path, EXECUTE nur service_role (anon/authenticated
-- false), find_user_id_by_email findet ein bekanntes Konto trotz Gross-/Leerzeichen und
-- liefert NULL fuer eine unbekannte Adresse; Security-Advisor ohne neuen Befund.
-- Musste VOR dem Merge des Webhook-Codes (route.ts) laufen — sonst ruft der Webhook zwei
-- RPCs, die es nicht gibt, und jede Zustellung endet in 500.
-- Wiederholbar (CREATE OR REPLACE / IF NOT EXISTS).
--
-- ANLASS 1 — Bestandskunden ab Nutzer 201 unauffindbar:
-- Der Webhook suchte Konten mit auth.admin.listUsers({ page: 1, perPage: 200 }) und
-- verglich die E-Mail im Code. Ab dem 201. Konto fiel jeder weitere Bestandskunde
-- durch das Raster: Kauf → createUser scheitert an „email_exists" → 500 → Digistore
-- wiederholt ohne Ende, der Kunde bekommt keinen Zugang. Rueckerstattung → „refund for
-- unknown user" → der Zugang bleibt bestehen. Die Admin-API kennt keine Suche per
-- E-Mail, deshalb die Abfrage direkt auf auth.users.
--
-- ANLASS 2 — Credits bei Wiederholung doppelt:
-- grant_diagnose_credits addiert. Scheiterte nach der Gutschrift der Loops-Versand,
-- ging die Order auf 'failed', Digistore stellte erneut zu und die Credits wurden ein
-- zweites Mal gutgeschrieben — jeder Loops-Ausfall ein Gratis-Credit. Kurs- und
-- Gutschein-Pfad sind nicht betroffen: grant_course_access (Upsert) und create_voucher
-- (je ds_order_id) sind von sich aus wiederholbar.

-- ── 1. Konto per E-Mail finden ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.find_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT id
  FROM auth.users
  WHERE lower(email) = lower(trim(p_email))
  ORDER BY created_at
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.find_user_id_by_email(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_user_id_by_email(text) TO service_role;

-- ── 2. Credits je Order genau einmal ────────────────────────────────────────
ALTER TABLE public.digistore_orders
  ADD COLUMN IF NOT EXISTS credits_applied_at timestamptz;

COMMENT ON COLUMN public.digistore_orders.credits_applied_at IS
  'Zeitpunkt, zu dem die Credits dieser Order gutgeschrieben wurden. Gesetzt = eine erneute Zustellung schreibt nichts mehr gut (grant_order_credits).';

-- Markierung und Gutschrift in EINER Transaktion: entweder beides oder nichts.
-- Parallele Zustellungen serialisieren sich an der Zeilensperre des UPDATE.
CREATE OR REPLACE FUNCTION public.grant_order_credits(
  p_order_id uuid,
  p_user_id  uuid,
  p_amount   int
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.digistore_orders
     SET credits_applied_at = now()
   WHERE id = p_order_id
     AND credits_applied_at IS NULL;

  IF NOT FOUND THEN
    IF NOT EXISTS (SELECT 1 FROM public.digistore_orders WHERE id = p_order_id) THEN
      RAISE EXCEPTION 'digistore order not found: %', p_order_id;
    END IF;
    RETURN false;  -- schon gutgeschrieben
  END IF;

  PERFORM public.grant_diagnose_credits(p_user_id, p_amount);
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_order_credits(uuid, uuid, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_order_credits(uuid, uuid, int) TO service_role;
