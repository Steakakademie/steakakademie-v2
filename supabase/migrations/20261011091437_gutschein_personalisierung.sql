-- ============================================================
-- Geschenkgutscheine: Personalisierung und Versand zum Wunschtermin
--
-- ANGEWENDET am 11.10.2026 (Uwe im Chat: „Ja zu beiden, Migration anwenden und Secret
-- eintragen"), per Supabase-MCP, Ledger-Version 20261011091437. Vorher gelesen: die
-- Tabelle hatte 13 Spalten, keine der neuen. Hinweis: #385 war zu dem Zeitpunkt schon
-- gemergt; bis zur Anwendung fiel die Geschenkseite auf die Grunddaten zurück.
--
-- Auftrag Uwe, 11.10.2026: „bau Personalisierung und Wunschtermin"
-- (docs/gutschein-sichtbarkeit-konzept.md, Muster M1 und M2).
--
-- Was der Schenkende kann (Link mit Schlüssel in seiner Gutschein-Mail):
--   - Name des Beschenkten, eigener Name, Nachricht, Motiv wählen
--   - den Gutschein selbst weitergeben (Standard) ODER per Mail an die beschenkte
--     Person schicken lassen — sofort oder zu einem Termin
-- Ändern geht, bis der Gutschein verschickt oder eingelöst ist.
--
-- Datensparsamkeit: Die Mail-Adresse des Beschenkten ist die Adresse eines Dritten.
-- Sie wird nach erfolgreichem Versand gelöscht; stehen bleibt nur ein maskierter
-- Hinweis (z. B. „a•••@example.de") für die Statusanzeige des Schenkenden.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS, Constraints nur, wenn sie fehlen.
-- ============================================================

-- ── 1. Schlüssel für den Schenkenden ─────────────────────────
-- Der Gutschein-Code allein ist der Wert des Geschenks und landet beim Beschenkten.
-- Ändern darf nur, wer zusätzlich diesen Schlüssel hat (steht nur in der Käufer-Mail).
ALTER TABLE public.vouchers
  ADD COLUMN IF NOT EXISTS schenker_token uuid NOT NULL DEFAULT gen_random_uuid();

-- ── 2. Personalisierung ──────────────────────────────────────
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS empfaenger_name text;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS schenker_name   text;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS motiv           text NOT NULL DEFAULT 'glut';

-- ── 3. Versand an die beschenkte Person ──────────────────────
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS empfaenger_email   text;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS empfaenger_hinweis text;  -- maskiert, bleibt nach Versand
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS versand_am         timestamptz;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS versand_status     text NOT NULL DEFAULT 'keiner';
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS versand_versuche   int  NOT NULL DEFAULT 0;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS versendet_am       timestamptz;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS versand_fehler     text;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vouchers_motiv_check') THEN
    ALTER TABLE public.vouchers ADD CONSTRAINT vouchers_motiv_check
      CHECK (motiv IN ('glut','weihnachten','geburtstag','vatertag','danke'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vouchers_versand_status_check') THEN
    -- keiner: Schenkender gibt selbst weiter · geplant: wartet auf versand_am ·
    -- in_arbeit: ein Lauf hat ihn gerade übernommen · versendet · fehlgeschlagen: nach 3 Versuchen
    ALTER TABLE public.vouchers ADD CONSTRAINT vouchers_versand_status_check
      CHECK (versand_status IN ('keiner','geplant','in_arbeit','versendet','fehlgeschlagen'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vouchers_personalisierung_laenge_check') THEN
    ALTER TABLE public.vouchers ADD CONSTRAINT vouchers_personalisierung_laenge_check
      CHECK (
        coalesce(length(empfaenger_name), 0) <= 60
        AND coalesce(length(schenker_name), 0) <= 60
        AND coalesce(length(gift_message), 0) <= 500
        AND coalesce(length(empfaenger_email), 0) <= 254
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vouchers_geplant_braucht_ziel_check') THEN
    -- Ein geplanter Versand ohne Adresse oder Termin wäre ein stiller Ausfall.
    ALTER TABLE public.vouchers ADD CONSTRAINT vouchers_geplant_braucht_ziel_check
      CHECK (versand_status <> 'geplant' OR (empfaenger_email IS NOT NULL AND versand_am IS NOT NULL));
  END IF;
END $$;

-- Der Versandlauf fragt stündlich nach fälligen Gutscheinen.
CREATE INDEX IF NOT EXISTS idx_vouchers_versand_faellig
  ON public.vouchers (versand_am)
  WHERE versand_status IN ('geplant','in_arbeit');

-- RLS bleibt wie in 20260607_vouchers.sql: nur Service-Role. Keine neue Policy nötig.
