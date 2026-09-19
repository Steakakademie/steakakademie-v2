-- Eigenregie (Digistore 695900): Kurszeile + Mapping, damit ein Kauf Zugang freischaltet.
-- Freigabe Konzept durch Uwe am 19.09.2026. Idempotent.
-- Am 19.09.2026 per Supabase-MCP angewendet; Dateiname = Ledger-Version.
insert into public.courses (title, description, price, slug, published)
values ('Eigenregie',
        'Geführter Selbstbau-Kurs: Website aus der Abhängigkeit in ein eigenes Projekt holen – Diagnose plus sechs Module.',
        999.00, 'eigenregie', true)
on conflict (slug) do update set title = excluded.title, description = excluded.description,
  price = excluded.price, published = true, updated_at = timezone('utc', now());

insert into public.digistore_products (ds_product_id, course_id)
select '695900', id from public.courses where slug = 'eigenregie'
on conflict (ds_product_id) do update set course_id = excluded.course_id;
