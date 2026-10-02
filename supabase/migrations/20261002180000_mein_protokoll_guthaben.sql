-- ============================================================
-- Mein Protokoll — Guthaben (Pakete) und Korrektur
--
-- STAND DIESER DATEI: NOCH NICHT ANGEWENDET. Anwenden nur nach Freigabe durch
-- Uwe; danach wird der Dateiname auf die Ledger-Version umgestellt (Regel aus
-- PR #285). Die Migration ist rein additiv: neue Tabelle, drei neue nullbare
-- Spalten, eine neue Funktion. Bestehender Code läuft mit ihr unverändert.
--
-- Anlass (Uwe, 02.10.2026): 19 € = 1 Protokoll, 29 € = 2 Protokolle; je
-- Protokoll ein Plan plus EINE kostenlose Korrektur. Bis dahin ließ sich nach
-- einem Kauf beliebig oft neu generieren — jede Generierung kostet API-Geld —,
-- während die Verkaufsseite „jeder Neudurchlauf erfordert einen neuen Kauf"
-- versprach.
--
-- Idempotent: kann mehrfach ausgeführt werden.
-- ============================================================

-- 1) Gutschriften: was gekauft wurde. Summe(anzahl) = bezahlte Protokolle.
--    Rückgabe = Gegenbuchung mit negativer Anzahl (Spur bleibt erhalten).
CREATE TABLE IF NOT EXISTS public.protokoll_gutschriften (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quelle      text NOT NULL CHECK (quelle IN ('digistore', 'gutschein', 'bestand', 'kulanz')),
  -- digistore: Order-ID (Rückgabe: '<Order-ID>:rueckgabe') · gutschein: Code ·
  -- bestand: user_id · kulanz: frei
  referenz    text NOT NULL,
  anzahl      integer NOT NULL CHECK (anzahl <> 0 AND anzahl BETWEEN -10 AND 10),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (quelle, referenz)
);

CREATE INDEX IF NOT EXISTS idx_protokoll_gutschriften_user
  ON public.protokoll_gutschriften (user_id);

ALTER TABLE public.protokoll_gutschriften ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'protokoll_gutschriften' AND policyname = 'service_role_all_protokoll_gutschriften') THEN
    CREATE POLICY "service_role_all_protokoll_gutschriften" ON public.protokoll_gutschriften
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'protokoll_gutschriften' AND policyname = 'users_own_protokoll_gutschriften') THEN
    CREATE POLICY "users_own_protokoll_gutschriften" ON public.protokoll_gutschriften
      FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
  END IF;
END $$;

-- Tabellenrechte ausdrücklich: Policies allein genügen nicht (Lehre aus #284),
-- und die Standardrechte neuer Tabellen sind zu weit.
REVOKE ALL ON public.protokoll_gutschriften FROM anon, authenticated;
GRANT SELECT ON public.protokoll_gutschriften TO authenticated;
GRANT ALL ON public.protokoll_gutschriften TO service_role;

-- 2) Korrektur + Bestätigung am Plan.
ALTER TABLE public.protokolle
  ADD COLUMN IF NOT EXISTS korrektur_von uuid REFERENCES public.protokolle(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS bestaetigt_at timestamptz,
  ADD COLUMN IF NOT EXISTS bestaetigung  text;

COMMENT ON COLUMN public.protokolle.korrektur_von IS
  'Gesetzt = dieser Plan ist die kostenlose Korrektur des genannten Plans. NULL = eigenes Protokoll, zählt gegen das Guthaben.';
COMMENT ON COLUMN public.protokolle.bestaetigung IS
  'Wortlaut der Bestätigung, die der Nutzer vor dem Erstellen angehakt hat (bestaetigt_at = Zeitpunkt).';

-- Genau eine Korrektur je Plan — in der Datenbank, nicht nur im Code.
CREATE UNIQUE INDEX IF NOT EXISTS protokolle_eine_korrektur_je_plan
  ON public.protokolle (korrektur_von) WHERE korrektur_von IS NOT NULL;

-- 3) Speichern mit Gegenprüfung in EINER Transaktion. Zwei gleichzeitige
--    Anfragen können so kein Protokoll doppelt verbrauchen.
CREATE OR REPLACE FUNCTION public.protokoll_speichern(
  p_user_id       uuid,
  p_answers       jsonb,
  p_plan          jsonb,
  p_korrektur_von uuid DEFAULT NULL,
  p_bestaetigung  text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_gekauft integer;
  v_plaene  integer;
  v_ziel    public.protokolle%ROWTYPE;
  v_id      uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('protokoll:' || p_user_id::text, 0));

  IF p_korrektur_von IS NULL THEN
    SELECT COALESCE(SUM(anzahl), 0) INTO v_gekauft
      FROM public.protokoll_gutschriften WHERE user_id = p_user_id;
    SELECT COUNT(*) INTO v_plaene
      FROM public.protokolle WHERE user_id = p_user_id AND korrektur_von IS NULL;
    IF v_plaene >= v_gekauft THEN
      RETURN jsonb_build_object('status', 'kein_guthaben');
    END IF;
  ELSE
    SELECT * INTO v_ziel
      FROM public.protokolle WHERE id = p_korrektur_von AND user_id = p_user_id;
    IF NOT FOUND OR v_ziel.korrektur_von IS NOT NULL THEN
      RETURN jsonb_build_object('status', 'nicht_korrigierbar');
    END IF;
    IF EXISTS (SELECT 1 FROM public.protokolle WHERE korrektur_von = p_korrektur_von) THEN
      RETURN jsonb_build_object('status', 'korrektur_verbraucht');
    END IF;
  END IF;

  INSERT INTO public.protokolle (user_id, answers, plan, korrektur_von, bestaetigt_at, bestaetigung)
  VALUES (
    p_user_id, p_answers, p_plan, p_korrektur_von,
    CASE WHEN p_bestaetigung IS NULL THEN NULL ELSE now() END,
    p_bestaetigung
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('status', 'ok', 'id', v_id);
END;
$$;

REVOKE ALL ON FUNCTION public.protokoll_speichern(uuid, jsonb, jsonb, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.protokoll_speichern(uuid, jsonb, jsonb, uuid, text) TO service_role;

-- 4) Bestand: Wer heute eine Buchung hat, bekommt so viele Protokolle
--    gutgeschrieben, wie er bereits Pläne besitzt — mindestens eines. Damit ist
--    kein vorhandener Plan „unbezahlt", und niemand verliert etwas.
INSERT INTO public.protokoll_gutschriften (user_id, quelle, referenz, anzahl)
SELECT b.user_id, 'bestand', b.user_id::text,
       LEAST(10, GREATEST(1, (SELECT COUNT(*) FROM public.protokolle p WHERE p.user_id = b.user_id)))::integer
  FROM public.bookings b
  JOIN public.courses  c ON c.id = b.course_id
 WHERE c.slug = 'mein-protokoll'
   AND b.revoked_at IS NULL
ON CONFLICT (quelle, referenz) DO NOTHING;
