-- NOCH NICHT ANGEWENDET (Stand 20.09.2026) — Anwendung per Supabase-MCP apply_migration nach Uwes Freigabe; danach Datei auf Ledger-Version umbenennen.
-- Kauf -> Zugang: Buchungsstatus und Widerruf reparieren (20.09.2026).
-- Befund beim Eigenregie-Testkauf: Die LIVE-Fassung von grant_course_access
-- setzte keinen Status (Spalten-Default 'pending'), anders als 009_rpc_v2.sql.
-- Folgen: (1) Diplom-Käufer ohne Zugang (Prüfung verlangt active/confirmed),
-- (2) Eigenregie-Platzzähler blieb bei 0, (3) "Meine Kurse" zeigte "Ausstehend".
-- Zusätzlich: Policy "Users view own active bookings" prüfte revoked_at nicht;
-- da Policies ODER-verknüpft sind, blieb Zugang nach Rückgabe/Chargeback bestehen.

create or replace function public.grant_course_access(p_user_id uuid, p_course_id uuid)
returns uuid
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $$
declare v_booking_id uuid;
begin
  insert into bookings (user_id, course_id, status)
  values (p_user_id, p_course_id, 'active')
  on conflict (user_id, course_id) do update
    set status = 'active', revoked_at = null, granted_at = now(), updated_at = timezone('utc', now())
  returning id into v_booking_id;
  return v_booking_id;
end; $$;

create or replace function public.revoke_course_access(p_user_id uuid, p_course_id uuid)
returns integer
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $$
declare v_count int;
begin
  update bookings
     set revoked_at = now(), status = 'refunded', updated_at = timezone('utc', now())
   where user_id = p_user_id and course_id = p_course_id and revoked_at is null;
  get diagnostics v_count = row_count;
  return v_count;
end; $$;

alter policy "Users view own active bookings" on public.bookings
  using (((select auth.uid()) = user_id) and status = any (array['active'::text, 'pending'::text]) and revoked_at is null);

-- Nachziehen: bezahlte (per Digistore-Webhook verarbeitete) Buchungen, die
-- nur wegen des Funktionsfehlers auf 'pending' stehen.
update public.bookings b
   set status = 'active', updated_at = timezone('utc', now())
 where b.status = 'pending'
   and b.revoked_at is null
   and exists (select 1 from public.digistore_orders o
                where o.booking_id = b.id and o.processing_status = 'processed'
                  and o.ds_event in ('payment','rebill','rebill_resumed'));

-- Bereits widerrufene Buchungen einheitlich markieren.
update public.bookings set status = 'refunded', updated_at = timezone('utc', now())
 where revoked_at is not null and status in ('pending','active','confirmed');

-- Testkauf Eigenregie (Digistore-Testzahlung LVEQKQ7E, 20.09.2026) widerrufen,
-- damit er nicht als Pilotplatz zählt.
update public.bookings b
   set revoked_at = now(), status = 'refunded', updated_at = timezone('utc', now())
  from public.digistore_orders o
 where o.booking_id = b.id and o.ds_order_id = 'LVEQKQ7E' and b.revoked_at is null;

-- Aufräumen: "Users can insert own bookings" ist wirkungslos (authenticated hat
-- kein INSERT-Recht auf bookings) und lädt beim Lesen zu Fehlschlüssen ein.
drop policy if exists "Users can insert own bookings" on public.bookings;
-- TRUNCATE umgeht RLS; anon/authenticated brauchen es nicht.
revoke truncate on public.bookings from anon, authenticated;
