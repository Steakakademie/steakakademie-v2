-- ============================================================
-- Geschenkgutscheine: Gültigkeit bis Jahresende des dritten Folgejahres
--
-- NOCH NICHT ANGEWENDET (Stand 09.10.2026). Anwenden nur mit Freigabe Uwe;
-- danach den Dateinamen auf die Ledger-Version setzen (Regel aus PR #285).
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
