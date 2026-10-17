-- Grillmeister-Diplom: Digistore-Produkt 750228 -> Kurs grillmeister-diplom (Uwe, 17.10.2026)
-- Am 17.10.2026 via Supabase-MCP gegen Prod angewendet (Projekt bbgdrzhlellxzggbbqcm,
-- Ledger-Version 20261017083813) und per Abfrage verifiziert.
-- Preis-Entscheidung Uwe 17.10.2026: 99,00 EUR einmalig oder 3 x 35 EUR (Digistore-Zahlplaene 1533112 / 1533113).
-- Wiederholbar (ON CONFLICT / UPDATE).
INSERT INTO digistore_products (ds_product_id, course_id)
SELECT '750228', id FROM courses WHERE slug = 'grillmeister-diplom'
ON CONFLICT (ds_product_id) DO UPDATE SET course_id = EXCLUDED.course_id;

UPDATE courses SET published = true, price = 99.00 WHERE slug = 'grillmeister-diplom';
