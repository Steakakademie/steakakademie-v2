-- ============================================================
-- Hofladen-Radar — CHECK-Grenzen von Deutschland auf DE + AT + CH weiten
--
-- STAND DIESER DATEI: NOCH NICHT ANGEWENDET. Anwenden nur nach Freigabe durch
-- Uwe; danach wird der Dateiname auf die Ledger-Version umgestellt.
--
-- Anlass (03.10.2026): 20260913120000_hoefe.sql legt die Tabelle mit
--   CHECK (lat BETWEEN 47 AND 56)  und  CHECK (lng BETWEEN 5 AND 16)
-- an — eine Deutschland-Box. Seit PR #147 (19.09.2026) holt der Wochenimport auch
-- Oesterreich und die Schweiz. Wien liegt bei 16,37° Ost, Genf bei 46,2° Nord, das
-- Tessin bei 45,8° Nord: jede dieser Zeilen verletzt die alte Grenze, und weil
-- hoefe_import_upsert 500 Zeilen in einer Transaktion schreibt, scheiterte der
-- ganze Lauf. Belegt in den Lauf-Logs vom 21.09. und 28.09.2026:
--   new row for relation "hoefe" violates check constraint "hoefe_lng_check"
-- (8591 bzw. 8602 brauchbare Hoefe gelesen, 0 geschrieben). Der Bestand steht
-- seither auf dem Handlauf vom 15.09.2026 (6069 Hoefe) — nur Deutschland.
--
-- Neue Grenzen: Breite 45,5–55,5 · Laenge 5,5–17,5. Dieselben Zahlen wie im Code
-- (src/lib/hoefe/grenzen.json — die eine Quelle fuer Import und Suche); den
-- Gleichstand prueft src/__tests__/hoefe-grenzen.test.ts gegen DIESE Datei.
-- Tatsaechliche Extrempunkte, die der Rahmen umfassen muss:
--   Sueden   45,82° N  Chiasso (CH)
--   Norden   55,06° N  List auf Sylt (DE)
--   Westen    5,87° O  Isenbruch, Selfkant (DE)
--   Osten    17,16° O  Deutsch Jahrndorf (AT)
-- Ringsum bleibt rund ein Drittel Grad Luft. Die Box ist ein Schutz gegen
-- Ausreisser (vertauschte Koordinaten, Null-Insel), kein Grenzverlauf.
--
-- Die neue Box ist im Norden (55,5 statt 56) und Westen (5,5 statt 5) etwas ENGER
-- als die alte. In Deutschland liegt dort nichts; steht in der Tabelle trotzdem
-- eine solche Zeile, schlaegt ADD CONSTRAINT fehl und die Migration aendert
-- nichts (Supabase fuehrt die Datei in einer Transaktion aus). Vorher pruefen:
--   SELECT count(*) FROM hoefe
--    WHERE lat NOT BETWEEN 45.5 AND 55.5 OR lng NOT BETWEEN 5.5 AND 17.5;   -- soll 0 sein
--
-- Nicht betroffen (am 03.10.2026 gelesen): hoefe_im_umkreis rechnet nur mit den
-- uebergebenen Koordinaten, hoefe_import_upsert kennt keine Grenzen, die View
-- hoefe_public ebenso wenig. Feste Zahlen standen nur in den beiden CHECKs.
--
-- Constraint-Namen: Postgres benennt einen Spalten-CHECK ohne eigenen Namen
-- <tabelle>_<spalte>_check. "hoefe_lng_check" ist aus der Fehlermeldung belegt,
-- "hoefe_lat_check" folgt derselben Regel (nicht an der Datenbank nachgesehen).
-- Sollte der lat-Constraint anders heissen, bleibt er neben dem neuen stehen und
-- der Import meldet weiter Ablehnungen — dann mit dem tatsaechlichen Namen im Log.
--
-- Idempotent: kann mehrfach ausgefuehrt werden.
-- ============================================================

ALTER TABLE public.hoefe DROP CONSTRAINT IF EXISTS hoefe_lat_check;
ALTER TABLE public.hoefe DROP CONSTRAINT IF EXISTS hoefe_lng_check;

ALTER TABLE public.hoefe
  ADD CONSTRAINT hoefe_lat_check CHECK (lat BETWEEN 45.5 AND 55.5);
ALTER TABLE public.hoefe
  ADD CONSTRAINT hoefe_lng_check CHECK (lng BETWEEN 5.5 AND 17.5);

COMMENT ON CONSTRAINT hoefe_lat_check ON public.hoefe IS
  'Rahmen DE + AT + CH (Breite). Gleiche Zahlen wie src/lib/hoefe/grenzen.json.';
COMMENT ON CONSTRAINT hoefe_lng_check ON public.hoefe IS
  'Rahmen DE + AT + CH (Laenge). Gleiche Zahlen wie src/lib/hoefe/grenzen.json.';
