-- Tagesfakten (M1 / C24 im Launch-Plan, 22.10.2026): eine Zeile je Tag mit den
-- Zahlen, an denen der Montags-Puls und das Go/No-Go haengen. Geschrieben wird
-- ausschliesslich ueber die Service-Role (scripts/tagesfakten.mjs, Workflow
-- tagesfakten.yml, taeglich 03:10 UTC). Kein Lesen fuer anon/authenticated —
-- Umsatz- und Besucherzahlen sind nicht oeffentlich.
--
-- NULL heisst „Quelle fehlt", nie „0". Welche Quelle gefehlt hat, steht in `quellen`.

create table if not exists public.tagesfakten (
  tag               date primary key,
  besucher          integer,                 -- Plausible: visitors (NULL ohne PLAUSIBLE_API_KEY)
  produkt_klicks    integer,                 -- Plausible-Ziel „Affiliate-Klick" (/go/<slug>)
  anmeldungen       integer,                 -- Newsletter-Anmeldungen (Quelle noch offen, s. docs/tagesfakten.md)
  bestaetigungen    integer,                 -- DOI-Bestaetigungen (Quelle noch offen)
  kaeufe            integer not null default 0,  -- digistore_orders: payment/on_payment, processed
  erstattungen      integer not null default 0,  -- digistore_orders: refund, processed
  widerrufe         integer not null default 0,  -- public.widerrufe nach created_at
  provisionen_cent  integer,                 -- Awin/Amazon: erst mit Berichtszugang (NULL)
  quellen           jsonb not null default '{}'::jsonb,  -- je Spalte: Quelle oder Grund fuer NULL
  erfasst_at        timestamptz not null default now()
);

comment on table public.tagesfakten is
  'Eine Zeile je Tag (UTC): Besucher, Produkt-Klicks, Anmeldungen, Kaeufe, Erstattungen, Widerrufe, Provisionen. Schreibt nur scripts/tagesfakten.mjs (Service-Role). NULL = Quelle fehlt, Grund in quellen. Konzept: docs/tagesfakten.md';

alter table public.tagesfakten enable row level security;
-- Bewusst keine Policy: anon und authenticated sehen nichts, die Service-Role umgeht RLS.

revoke all on public.tagesfakten from anon, authenticated;
