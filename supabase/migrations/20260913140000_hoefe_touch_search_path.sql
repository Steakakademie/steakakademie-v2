-- ANGEWENDET erst am 15.09.2026 auf Projekt bbgdrzhlellxzggbbqcm (per MCP apply_migration),
-- Ledger-Version 20260915073002. Die Datei lag seit dem 13.09. im Repo, war aber nie auf
-- der Produktion gelaufen — aufgefallen, weil der Security-Advisor den Befund unten weiter
-- meldete. Vorher geprueft: Rumpf auf der Produktion identisch, nur ohne search_path.
-- Danach: proconfig = search_path=public, pg_temp, Trigger an hoefe unveraendert,
-- Advisor-Befund 0011 fuer hoefe_touch_geaendert verschwunden.
--
-- Nachtrag zu 20260913120000_hoefe.sql
--
-- Der Supabase-Linter (0011, function_search_path_mutable) hat nach dem Anwenden
-- der Hoefe-Migration am 13.09.2026 genau einen eigenen Befund gemeldet:
-- hoefe_touch_geaendert() war die einzige der drei neuen Funktionen ohne festes
-- search_path. hoefe_im_umkreis und hoefe_import_upsert haben es, die
-- Trigger-Funktion hatte ich uebersehen.
--
-- Warum das zaehlt, obwohl die Funktion SECURITY INVOKER ist: ein veraenderliches
-- search_path laesst sich pro Rolle setzen. Ein Angreifer mit Schreibrecht auf ein
-- Schema, das dann vor public liegt, koennte `now()` ueberschatten. Hier waere der
-- Schaden klein (ein falscher Zeitstempel in geaendert_am), aber der Riegel kostet
-- eine Zeile — und die Regel "alle Funktionen mit festem search_path" ist nur dann
-- eine Regel, wenn sie keine Ausnahmen hat.
--
-- Eigene Datei statt Aenderung an 20260913120000: die Ur-Migration ist bereits auf
-- der Produktion angewendet. Angewendete Migrationen werden nicht nachtraeglich
-- umgeschrieben, sonst laufen Repo und Datenbank auseinander.

CREATE OR REPLACE FUNCTION hoefe_touch_geaendert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.geaendert_am := now();
  RETURN NEW;
END $$;
