-- Am 17.10.2026 via Supabase-MCP gegen Prod angewendet (Projekt bbgdrzhlellxzggbbqcm,
-- Ledger-Version 20261017094922) und in Transaktionen mit ROLLBACK geprüft:
-- Geräte-Limit (älteste Sitzung false, neueste true), Ausstellen (Name bereinigt + fest,
-- zweiter Name ignoriert, idempotent), Fehlerfälle (name_fehlt, nicht_bestanden,
-- direktes INSERT / Kernfunktion / Zähler als Nutzer verweigert), Prüfung (Code nötig).
-- ── Urkunden-Schutz + Geräte-Limit (Entscheidung Uwe, 17.10.2026) ──────────────
-- Anlass: Ein Konto konnte die Ausbildung für mehrere Personen tragen. Zwei Lücken:
--   1. Der Name auf der Urkunde war bei jeder Bestellung frei wählbar — ein Konto
--      konnte Urkunden auf beliebige Namen erzeugen.
--   2. Kein Limit für gleichzeitig angemeldete Geräte.
-- Lösung:
--   urkunden_namen   ein Name pro Konto, einmal festgelegt, nur über den Support änderbar
--   urkunden         jede ausgestellte Urkunde mit Nummer + Prüfcode, öffentlich prüfbar
--   sitzung_zugelassen()  Kurszugang nur für die zwei zuletzt angemeldeten Sitzungen
-- Idempotent (IF NOT EXISTS / CREATE OR REPLACE / Policy-Check).

-- ── 1. Name pro Konto ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.urkunden_namen (
  user_id        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name           text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 60),
  festgelegt_am  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.urkunden_namen ENABLE ROW LEVEL SECURITY;

-- ── 2. Ausgestellte Urkunden ─────────────────────────────────────────────────
-- nr = fortlaufende Nummer (SA-<Jahr>-<4 Stellen>, gemeinsamer Zähler mit dem Druck).
-- pruefcode = 6 Zeichen Zufall: ohne ihn liessen sich durch Hochzählen der Nummer
-- alle Absolventen-Namen abrufen. Öffentlich prüfbar ist nur nr + pruefcode zusammen.
CREATE TABLE IF NOT EXISTS public.urkunden (
  nr              text PRIMARY KEY,
  pruefcode       text NOT NULL CHECK (pruefcode ~ '^[A-Z2-9]{6}$'),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stufe           int  NOT NULL CHECK (stufe BETWEEN 1 AND 5),
  name            text NOT NULL,
  ausgestellt_am  timestamptz NOT NULL DEFAULT now(),
  widerrufen_am   timestamptz,
  UNIQUE (user_id, stufe)
);
ALTER TABLE public.urkunden ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='urkunden_namen' AND policyname='urkunden_namen_select_own') THEN
    CREATE POLICY urkunden_namen_select_own ON public.urkunden_namen
      FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='urkunden_namen' AND policyname='urkunden_namen_service_all') THEN
    CREATE POLICY urkunden_namen_service_all ON public.urkunden_namen
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='urkunden' AND policyname='urkunden_select_own') THEN
    CREATE POLICY urkunden_select_own ON public.urkunden
      FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='urkunden' AND policyname='urkunden_tabelle_service_all') THEN
    CREATE POLICY urkunden_tabelle_service_all ON public.urkunden
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Lesen eigener Zeilen ja, Schreiben nur über die Funktionen unten.
REVOKE ALL ON public.urkunden_namen, public.urkunden FROM anon, authenticated;
GRANT SELECT ON public.urkunden_namen, public.urkunden TO authenticated;
GRANT ALL    ON public.urkunden_namen, public.urkunden TO service_role;

-- ── 3. Urkunde ausstellen (Kern, für Nutzer und Druck-Freigabe gemeinsam) ────
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
  v_alpha  constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
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

  -- Schon ausgestellt → dieselbe Urkunde zurück (idempotent).
  RETURN QUERY
    SELECT u.nr, u.pruefcode, u.name, u.stufe, u.ausgestellt_am, false
      FROM urkunden u WHERE u.user_id = p_user_id AND u.stufe = p_stufe;
  IF FOUND THEN RETURN; END IF;

  -- Name: der festgelegte gewinnt immer; sonst wird p_name jetzt festgelegt.
  SELECT n.name INTO v_name FROM urkunden_namen n WHERE n.user_id = p_user_id;
  IF v_name IS NULL THEN
    v_name := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
    IF char_length(v_name) NOT BETWEEN 2 AND 60 THEN RAISE EXCEPTION 'name_fehlt'; END IF;
    INSERT INTO urkunden_namen (user_id, name) VALUES (p_user_id, v_name)
      ON CONFLICT (user_id) DO NOTHING;
    SELECT n.name INTO v_name FROM urkunden_namen n WHERE n.user_id = p_user_id;
  END IF;

  v_nr := naechste_urkundennummer(extract(year FROM now())::int);
  v_code := '';
  FOR i IN 1..6 LOOP
    v_code := v_code || substr(v_alpha, 1 + floor(random() * length(v_alpha))::int, 1);
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

-- Nutzer-Einstieg: nur für sich selbst.
CREATE OR REPLACE FUNCTION public.urkunde_ausstellen(p_stufe int, p_name text DEFAULT NULL)
RETURNS TABLE (nr text, pruefcode text, name text, stufe int, ausgestellt_am timestamptz, neu boolean)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT * FROM public.urkunde_ausstellen_fuer((SELECT auth.uid()), p_stufe, p_name);
$$;
REVOKE ALL ON FUNCTION public.urkunde_ausstellen(int, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.urkunde_ausstellen(int, text) TO authenticated, service_role;

-- ── 4. Öffentliche Prüfung ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.urkunde_pruefen(p_nr text, p_code text)
RETURNS TABLE (nr text, name text, stufe int, ausgestellt_am timestamptz, gueltig boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT u.nr, u.name, u.stufe, u.ausgestellt_am, (u.widerrufen_am IS NULL)
    FROM urkunden u
   WHERE u.nr = upper(btrim(p_nr)) AND u.pruefcode = upper(btrim(p_code));
$$;
REVOKE ALL ON FUNCTION public.urkunde_pruefen(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.urkunde_pruefen(text, text) TO anon, authenticated, service_role;

-- ── 5. Geräte-Limit ──────────────────────────────────────────────────────────
-- Zugelassen sind die p_max zuletzt angelegten Sitzungen des Kontos (auth.sessions,
-- created_at = Anmeldezeitpunkt; Token-Refresh behält die Sitzung). Eine ältere
-- Sitzung bleibt angemeldet, bekommt aber keine Kursinhalte, bis der Nutzer die
-- anderen Geräte abmeldet oder sich neu anmeldet. sitzungen_7d = neue Anmeldungen
-- der letzten 7 Tage (Hinweis auf Weitergabe).
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
