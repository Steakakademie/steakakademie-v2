-- ============================================================
-- Streitfall-Umfrage: fehlende Tabellenrechte + Haertung
-- Migration: 20261002143516_streitfall_votes_rechte
--
-- ANGEWENDET am 02.10.2026, 16:35 (Freigabe Uwe: „Ja, auf Supabase anwenden").
-- Der Dateiname traegt die Version aus supabase_migrations.schema_migrations
-- (Ledger-Regel). Danach an der Live-DB belegt: `authenticated` hat auf
-- streitfall_votes INSERT, SELECT, UPDATE; die drei entzogenen Rechte stehen
-- fuer anon/authenticated auf keiner Tabelle in public mehr (vorher 190
-- Eintraege); Stimme abgeben und aendern als Rolle authenticated in einer
-- verworfenen Transaktion: ok.
--
-- 1) Befund (Audit 02.10.2026, an der Live-DB belegt)
--    20260817_streitfall_umfrage.sql legt fuer streitfall_votes drei Policies
--    an (INSERT, UPDATE, SELECT fuer `authenticated`), aber KEIN Tabellenrecht.
--    Der Projekt-Default gibt `authenticated` nur SELECT (20260530_grants_fix).
--    RLS-Policies wirken erst HINTER dem Tabellenrecht — ohne INSERT/UPDATE
--    endet jede Stimme mit 42501 „permission denied". Die Umfrage steht seit
--    17.08.2026 unter acht Streitfaellen; die Tabelle hat null Zeilen, der
--    Besucher sieht „Die Stimme konnte nicht gespeichert werden".
--
--    Der Client schreibt per upsert (ON CONFLICT … DO UPDATE), braucht also
--    INSERT und UPDATE; die Spalte id ist bigserial, deshalb zusaetzlich die
--    Sequenz.
--
-- 2) Haertung
--    `anon` und `authenticated` tragen auf den Tabellen in public noch
--    TRUNCATE, TRIGGER und REFERENCES aus den Supabase-Standardrechten.
--    TRUNCATE unterliegt nicht der RLS. Ueber die REST-Schnittstelle ist es
--    nicht erreichbar (PostgREST kennt nur SELECT/INSERT/UPDATE/DELETE und
--    Funktionsaufrufe) — es ist also keine offene Luecke, aber ein Recht, das
--    niemand braucht und das eine einzige unvorsichtige RPC-Funktion scharf
--    machen wuerde. Die drei Rechte werden entzogen; SELECT/INSERT/UPDATE/
--    DELETE bleiben unberuehrt.
--
-- Idempotent (re-runnable).
-- ============================================================

-- 1) Stimmen abgeben und aendern
GRANT INSERT, UPDATE ON public.streitfall_votes TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.streitfall_votes_id_seq TO authenticated;

-- 2) Ungenutzte Rechte entziehen (alle Tabellen und Ansichten in public)
REVOKE TRUNCATE, TRIGGER, REFERENCES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
