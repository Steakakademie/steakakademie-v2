-- ─────────────────────────────────────────────────────────────────────────────
-- Smart-Pairing-Engine (/aroma-matcher) — Freikontingent + Warteliste
--
-- Regel: 5 VERSCHIEDENE Cuts pro Konto sind frei. Ein bereits analysierter Cut
-- kostet bei erneutem Aufruf nichts (PK user_id+cut_id → Wiederholung = no-op).
-- Muster wie 012_diagnose_credits: RLS, service_role schreibt, RPC atomar.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.aroma_matcher_abfragen (
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cut_id     text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  PRIMARY KEY (user_id, cut_id)
);

COMMENT ON TABLE public.aroma_matcher_abfragen IS
  'Welche Cuts ein Konto in der Smart-Pairing-Engine bereits analysiert hat. Zählt gegen das Freikontingent (5 verschiedene Cuts).';

CREATE TABLE IF NOT EXISTS public.aroma_matrix_warteliste (
  user_id    uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

COMMENT ON TABLE public.aroma_matrix_warteliste IS
  'Konten, die nach Verbrauch des Freikontingents Interesse am unbegrenzten Zugang (Arbeitstitel Aroma-Matrix) angemeldet haben.';

ALTER TABLE public.aroma_matcher_abfragen  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aroma_matrix_warteliste ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'aroma_matcher_abfragen' AND policyname = 'service_role_all_aroma_abfragen') THEN
    CREATE POLICY "service_role_all_aroma_abfragen" ON public.aroma_matcher_abfragen FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'aroma_matcher_abfragen' AND policyname = 'users_own_aroma_abfragen') THEN
    CREATE POLICY "users_own_aroma_abfragen" ON public.aroma_matcher_abfragen FOR SELECT TO authenticated
      USING ((SELECT auth.uid()) = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'aroma_matrix_warteliste' AND policyname = 'service_role_all_aroma_warteliste') THEN
    CREATE POLICY "service_role_all_aroma_warteliste" ON public.aroma_matrix_warteliste FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'aroma_matrix_warteliste' AND policyname = 'users_own_aroma_warteliste') THEN
    CREATE POLICY "users_own_aroma_warteliste" ON public.aroma_matrix_warteliste FOR SELECT TO authenticated
      USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

-- ─── RPC: Abfrage verbuchen (atomar) ─────────────────────────────────────────
-- Rückgabe: verbleibende freie Cuts NACH dieser Abfrage (0..p_limit).
--           -1 = Kontingent erschöpft, Cut NICHT freigeschaltet.
-- Bereits analysierter Cut → kein Verbrauch, Rückgabe = aktueller Rest.
CREATE OR REPLACE FUNCTION public.consume_aroma_matcher_abfrage(
  p_user_id uuid,
  p_cut_id  text,
  p_limit   int DEFAULT 5
) RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_used int;
BEGIN
  -- Serialisierung pro Konto: verhindert, dass zwei parallele Requests
  -- gemeinsam über das Limit rutschen.
  PERFORM pg_advisory_xact_lock(hashtext('aroma_matcher:' || p_user_id::text));

  IF EXISTS (SELECT 1 FROM public.aroma_matcher_abfragen WHERE user_id = p_user_id AND cut_id = p_cut_id) THEN
    SELECT count(*) INTO v_used FROM public.aroma_matcher_abfragen WHERE user_id = p_user_id;
    RETURN greatest(p_limit - v_used, 0);
  END IF;

  SELECT count(*) INTO v_used FROM public.aroma_matcher_abfragen WHERE user_id = p_user_id;
  IF v_used >= p_limit THEN
    RETURN -1;
  END IF;

  INSERT INTO public.aroma_matcher_abfragen (user_id, cut_id) VALUES (p_user_id, p_cut_id);
  RETURN p_limit - v_used - 1;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_aroma_matcher_abfrage(uuid, text, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_aroma_matcher_abfrage(uuid, text, int) TO service_role;
