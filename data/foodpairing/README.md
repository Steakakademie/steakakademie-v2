# Foodpairing — Rohdaten (Aroma-Netzwerk)

Ablageort für das **bipartite Zutat↔Aromamolekül-Dataset**, das
`scripts/foodpairing-import.mjs` nach Supabase importiert
(Tabellen `aroma_ingredient` / `aroma_compound` / `aroma_ingredient_compound`).
Architektur & Rechtslage: `docs/foodpairing-steckbrief.md`.

> ⚖️ **Hier liegt unsere EIGENE kuratierte Seed-Kuration** (`ingr_info.tsv`,
> `comp_info.tsv`, `ingr_comp.tsv` — siehe `SOURCES.md`): kommerziell sauber, aus
> öffentlich-freier Aromachemie + eigenem CC-BY-Wissen. Diese drei Dateien **sind**
> eingecheckt.
>
> **NICHT zulässig** (NonCommercial bzw. Copyright): **Ahn-Flavor-Network**
> (Sci. Rep. 2011, **CC BY-NC-SA**), **FlavorDB/FooDB** (CC-BY-NC), **VCF** (Abo),
> **FEMA-Liste**, **Aroma-Wheels**. Solche Fremd-Datasets niemals hier ablegen.

## Aufbau (v2, 28.09.2026)

`belege.tsv` ist die Quelle der Wahrheit (eine Zeile je Fachquelle). `ingr_comp.tsv` wird
daraus von `scripts/foodpairing-build.mjs` **erzeugt** — nie von Hand ändern.
`ausgeschlossen.tsv` dokumentiert recherchierte, aber zu schwach belegte Zeilen.
Synonyme (Ribeye, Steak, Bacon …) stehen in `src/lib/foodpairing-alias.ts`, nicht als
eigene Zutaten.

## Erwartete Dateien

| Datei | Spalten (tab- oder kommagetrennt) |
|---|---|
| `ingr_info.tsv` | `id  name  category` |
| `comp_info.tsv` | `id  name  CAS` |
| `ingr_comp.tsv` | `ingredient_id  compound_id  evidenz  quellen` (generiert; Import liest die ersten zwei Spalten) |

Kommentar-/Headerzeilen mit `#` werden übersprungen. Die `id`-Werte stammen aus dem
Quelldatensatz → Import ist idempotent (re-runnable).

## Import

```bash
node scripts/foodpairing-import.mjs --dir data/foodpairing --dry-run   # Vorschau
node scripts/foodpairing-import.mjs --dir data/foodpairing             # → Supabase (Sync: entfernt, was nicht mehr in den Dateien steht)
node scripts/foodpairing-import.mjs --dir data/foodpairing --no-prune  # nur ergänzen, nichts entfernen
```

Voraussetzung: Migration `supabase/migrations/20260615_aroma_pairings.sql` eingespielt,
`NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.
