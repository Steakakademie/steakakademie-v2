-- Am 17.10.2026 via Supabase-MCP gegen Prod angewendet (Ledger-Version 20261017101203).
-- Geprüft in Transaktion mit ROLLBACK: verwaiste Sitzungen zählen nicht, zwei aktive neuere
-- sperren die älteste, Prüfcode aus gen_random_bytes, UNIQUE auf urkunde_nr entfernt.
-- ── Nachbesserung Urkunden-Schutz + Geräte-Limit (17.10.2026, unabhängige Prüfung) ──
-- 1. Verwaiste Sitzungen zählen nicht mehr: Ohne Abmeldung (gelöschte Cookies,
--    privates Fenster, Safari löscht Skript-Cookies nach 7 Tagen) bleibt eine Sitzung
--    in auth.sessions stehen. Bisher hätte so ein iPhone mit wöchentlicher
--    Neuanmeldung das zweite echte Gerät desselben Kunden ausgesperrt.
--    Jetzt zählen nur Sitzungen, die in den letzten 3 Tagen benutzt wurden
--    (refreshed_at / updated_at), und die eigene immer.
-- 2. Prüfcode aus kryptografischem Zufall (pgcrypto gen_random_bytes statt random()).
-- 3. urkunden_bestellungen.urkunde_nr nicht mehr UNIQUE: Die Nummer gehört seit
--    20261017094922 zur Urkunde, nicht zur Bestellung — ein Nachdruck derselben
--    Stufe trägt dieselbe Kennung.
-- Idempotent.

CREATE OR REPLACE FUNCTION public.sitzung_zugelassen(p_max int DEFAULT 2)
RETURNS TABLE (zugelassen boolean, sitzungen_7d int)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_sid uuid;
  v_max int := greatest(1, least(coalesce(p_max, 2), 10));
BEGIN
  BEGIN
    v_sid := nullif(auth.jwt() ->> 'session_id', '')::uuid;
  EXCEPTION WHEN others THEN
    v_sid := NULL;
  END;
  IF v_uid IS NULL OR v_sid IS NULL THEN
    RETURN QUERY SELECT true, 0;   -- kein Nutzer-Token: Entscheidung liegt beim Aufrufer
    RETURN;
  END IF;

  RETURN QUERY
    SELECT
      EXISTS (
        SELECT 1 FROM (
          SELECT s.id FROM auth.sessions s
           WHERE s.user_id = v_uid
             AND (s.not_after IS NULL OR s.not_after > now())
             AND (
               s.id = v_sid
               OR greatest(
                    coalesce(s.refreshed_at AT TIME ZONE 'UTC', s.created_at),
                    coalesce(s.updated_at, s.created_at)
                  ) > now() - interval '3 days'
             )
           ORDER BY s.created_at DESC
           LIMIT v_max
        ) j WHERE j.id = v_sid
      ),
      (SELECT count(*)::int FROM auth.sessions s
        WHERE s.user_id = v_uid AND s.created_at > now() - interval '7 days');
END;
$$;
REVOKE ALL ON FUNCTION public.sitzung_zugelassen(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sitzung_zugelassen(int) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.urkunde_ausstellen_fuer(p_user_id uuid, p_stufe int, p_name text DEFAULT NULL)
RETURNS TABLE (nr text, pruefcode text, name text, stufe int, ausgestellt_am timestamptz, neu boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
#variable_conflict use_column
DECLARE
  v_name   text;
  v_nr     text;
  v_code   text;
  v_bytes  bytea;
  v_alpha  constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   -- 32 Zeichen: 256 % 32 = 0, gleichverteilt
  i        int;
BEGIN
  IF p_user_id IS NULL THEN RAISE EXCEPTION 'nicht_angemeldet'; END IF;
  IF p_stufe IS NULL OR p_stufe NOT BETWEEN 1 AND 5 THEN RAISE EXCEPTION 'stufe_ungueltig'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM course_progress cp
     WHERE cp.user_id = p_user_id AND cp.stufe = p_stufe AND cp.status = 'bestanden'
  ) THEN
    RAISE EXCEPTION 'nicht_bestanden';
  END IF;

  RETURN QUERY
    SELECT u.nr, u.pruefcode, u.name, u.stufe, u.ausgestellt_am, false
      FROM urkunden u WHERE u.user_id = p_user_id AND u.stufe = p_stufe;
  IF FOUND THEN RETURN; END IF;

  SELECT n.name INTO v_name FROM urkunden_namen n WHERE n.user_id = p_user_id;
  IF v_name IS NULL THEN
    v_name := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
    IF char_length(v_name) NOT BETWEEN 2 AND 60 THEN RAISE EXCEPTION 'name_fehlt'; END IF;
    INSERT INTO urkunden_namen (user_id, name) VALUES (p_user_id, v_name)
      ON CONFLICT (user_id) DO NOTHING;
    SELECT n.name INTO v_name FROM urkunden_namen n WHERE n.user_id = p_user_id;
  END IF;

  v_nr := naechste_urkundennummer(extract(year FROM now())::int);
  v_bytes := extensions.gen_random_bytes(6);
  v_code := '';
  FOR i IN 0..5 LOOP
    v_code := v_code || substr(v_alpha, 1 + (get_byte(v_bytes, i) % 32), 1);
  END LOOP;

  INSERT INTO urkunden (nr, pruefcode, user_id, stufe, name)
    VALUES (v_nr, v_code, p_user_id, p_stufe, v_name)
    ON CONFLICT (user_id, stufe) DO NOTHING;

  RETURN QUERY
    SELECT u.nr, u.pruefcode, u.name, u.stufe, u.ausgestellt_am, (u.nr = v_nr)
      FROM urkunden u WHERE u.user_id = p_user_id AND u.stufe = p_stufe;
END;
$$;
REVOKE ALL ON FUNCTION public.urkunde_ausstellen_fuer(uuid, int, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.urkunde_ausstellen_fuer(uuid, int, text) TO service_role;

ALTER TABLE public.urkunden_bestellungen DROP CONSTRAINT IF EXISTS urkunden_bestellungen_urkunde_nr_key;
CREATE INDEX IF NOT EXISTS urkunden_bestellungen_urkunde_nr_idx ON public.urkunden_bestellungen (urkunde_nr);
