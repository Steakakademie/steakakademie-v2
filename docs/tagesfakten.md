# Tagesfakten — eine Zeile je Tag (M1 / C24, seit 22.10.2026)

> Abteilung: Systems & Ops (Tabelle, Skript, Workflow) · Nutzer: Wachstum (Montags-Puls, Wochenbericht)
> und das Go/No-Go am 29.10.2026. Anlass: Arbeitsplan 14.10., Paket M1 — „Tabelle füllt sich täglich".

## Was es ist

`public.tagesfakten` hat je UTC-Kalendertag eine Zeile: Besucher, Produkt-Klicks, Anmeldungen,
Bestätigungen, Käufe, Erstattungen, Widerrufe, Provisionen. Geschrieben wird sie **nur** von
`scripts/tagesfakten.mjs` über die Service-Role, täglich 03:10 UTC durch
`.github/workflows/tagesfakten.yml`. Lesen dürfen `anon` und `authenticated` nichts — Umsatz-
und Besucherzahlen sind nicht öffentlich. Migration: `supabase/migrations/20261022210000_tagesfakten.sql`.

**NULL heißt „Quelle fehlt", nie „0".** Welche Quelle gefehlt hat, steht je Spalte in `quellen`
(`"besucher": "fehlt: PLAUSIBLE_API_KEY fehlt"`). Eine 0 steht nur, wenn die Quelle da war und
nichts gezählt hat.

## Quellen, Stand 22.10.2026

| Spalte | Quelle | Stand |
|---|---|---|
| `kaeufe`, `erstattungen` | `digistore_orders` (`payment`/`on_payment` bzw. `refund`, nur `processed`) | läuft |
| `widerrufe` | `widerrufe` nach `created_at` | läuft |
| `besucher` | Plausible Stats API v2, `visitors` | **wartet auf `PLAUSIBLE_API_KEY`** (GitHub-Secret; Plausible → Settings → API keys, Stats API) |
| `produkt_klicks` | Plausible-Ziel `Affiliate-Klick` (gesendet von `/go/<slug>`) | wartet auf denselben Schlüssel |
| `anmeldungen`, `bestaetigungen` | — | **offen:** Loops zählt per API nicht je Tag. Weg 1: Plausible-Ziele am Formular und an der DOI-Seite. Weg 2: Loops-Export von Hand. Bis dahin NULL. |
| `provisionen_cent` | — | **offen:** Awin-/Amazon-Berichte haben keinen API-Zugang; Uwe trägt wöchentlich nach oder es bleibt NULL. |

Tag = UTC. `digistore_orders.created_at` ist UTC, Plausible wird mit `date_range: [tag, tag]`
gefragt — derselbe Schnitt. Für Uwes Blick auf „gestern Abend" kann das um eine Stunde
(Winter) bzw. zwei (Sommer) verschoben sein; bewusst so gelassen, damit die Zahl reproduzierbar ist.

## Was rot ist

- Tabelle fehlt (Migration nicht eingespielt) oder Schreiben scheitert → Exit 1 mit Hinweis.
- `digistore_orders` oder `widerrufe` nicht lesbar → Exit 1. Ohne die Datenbankzahlen ist die
  Zeile wertlos; NULL wäre hier eine Lüge.
- Nicht rot: fehlender Plausible-Schlüssel. Das ist eine bekannte Lücke mit Grund in `quellen`.
- Der Ops-Heartbeat (`data/ops-heartbeat.json`, Eintrag „Tagesfakten") schlägt an, wenn seit
  2 Tagen keine Zeile mehr geschrieben wurde — Regel 10: Ergebnisse prüfen, nicht Läufe.

## Nachträge und Handstart

```
node scripts/tagesfakten.mjs --tag 2026-10-21            # einen Tag neu zählen (upsert)
node scripts/tagesfakten.mjs --dry-run --tag 2026-10-21  # nur zählen, nicht schreiben
```

Workflow-Handstart: Actions → „Tagesfakten (Supabase)" → Run workflow, Feld `tag`. Ein
Nachtrag überschreibt die Zeile des Tages (Upsert auf `tag`).

## Was hier bewusst nicht steht

Keine Auswertung, keine Grafik, kein Vergleich zur Vorwoche — das ist die Aufgabe des
Montags-Pulses (`wachstums-analyst`, `wachstum/berichte/`). Diese Tabelle ist die Quelle,
nicht der Bericht.
