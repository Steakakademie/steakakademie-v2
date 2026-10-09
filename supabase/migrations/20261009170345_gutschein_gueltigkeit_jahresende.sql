-- ============================================================
-- Geschenkgutscheine: Gültigkeit bis Jahresende des dritten Folgejahres
--
-- ANGEWENDET am 09.10.2026 (Freigabe Uwe im Chat: „Ja, Migrationen anwenden"),
-- per Supabase-MCP, Ledger-Version 20261009170345 — der Dateiname entspricht ihr
-- (Regel aus PR #285; vorher 20261009200000). Nachgeprüft: column_default von
-- vouchers.valid_until ist der make_timestamptz-Ausdruck unten.
--
-- Anlass (Gutschein-Konzept T10, 09.10.2026): AGB § 5a versprechen
-- „3 Jahre ab Ausstellung (… § 195 BGB, beginnend zum Schluss des
-- Ausstellungsjahres)" — also bis 31.12. des dritten Folgejahres. Die Datenbank
-- setzte valid_until = Kauf + 3 Jahre. Ein Gutschein vom 15.11.2026 wäre am
-- 15.11.2029 abgelaufen, obwohl die AGB ihn bis 31.12.2029 zusagen. Angeglichen
-- wird an die für den Kunden günstigere Frist der AGB (Rechtssicherheit, Regel 6).
--
-- Bestand: vouchers hat 0 Zeilen (09.10.2026) — nur der Vorgabewert ändert sich.
-- Idempotent: SET DEFAULT kann beliebig oft laufen.
-- ============================================================

ALTER TABLE vouchers
  ALTER COLUMN valid_until SET DEFAULT make_timestamptz(
    (extract(year FROM (now() AT TIME ZONE 'Europe/Berlin'))::int + 3), 12, 31, 23, 59, 59, 'Europe/Berlin'
  );
