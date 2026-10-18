# Wissensschicht des Marketing-OS — Verweis-Index

> **Regel:** Diese Schicht kopiert nichts. Jede Zeile zeigt auf die **eine** kanonische
> Quelle. Konkurrierende Gedächtnis-Dateien waren am 27.08.2026 die Ursache
> fehlgeleiteter Sessions (`docs/ARCHITEKTUR-AUDIT-2026-08-27.md`). Ändert sich etwas,
> wird die Quelle geändert, nie diese Liste um eine Abschrift ergänzt.
> Neu angelegt wurden nur drei Dateien, für die es vorher keine Quelle gab (★).

## Pflichtlektüre für jeden Marketing-Agenten

| Thema | Kanonische Quelle | Abschnitt |
|---|---|---|
| Marken-DNA, Claim, Farben, Tonalität | `marketing_agent.txt` | MARKEN-DNA |
| Social-Sprachregister, erlaubte/gesperrte Wörter, Hook-Formel | `marketing_agent.txt` | SPRACHREGISTER SOCIAL, ZWEITES REGISTER |
| Werbekennzeichnung (LG Köln 12.05.2026) | `marketing_agent.txt` | WERBEKENNZEICHNUNG |
| Was nie getan wird | `marketing_agent.txt` | CONSTRAINTS |
| Zielgruppen | `marketing_agent.txt` | ZIELGRUPPEN |
| Stimmen Marco / Jonas / Elena + KI-Kennzeichnung | `src/lib/authors.ts`, `docs/avatare/` | — |
| Kerntemperaturen (immer nach Teilstück) | `data/kerntemperatur-referenz.yaml` | — |
| Cuts | `data/cuts-knowledge.yaml` | — |
| Methoden | `docs/methodenkanon.md` | — |
| Kochwissen-Datenbank | Supabase `public.kochwissen`, `docs/wissensdatenbank-architektur.md` | — |
| Pipeline, RACI, Prioritätslogik | `docs/confluence/04-MARKETING-AGENCY-MODEL.md` | §2–§5 |
| Profile, Handles, Link-in-Bio | `docs/social-media-grundausstattung.md` | §0 |
| Saisonfenster | `data/saison-kalender.yaml` | — |
| Produkte, Preise, Status | `products/registry.yaml`, `data/angebote.yaml` | — |
| Affiliate-Partner, Regeln | `docs/affiliate-strategie-2026.md` | — |
| Newsletter-Strecke (Ziel jedes Posts) | `docs/loops-willkommenssequenz.md` | — |
| Erlaubte und gesperrte Recherchequellen | `docs/ideen-radar.md` | „Zwei dauerhaft ausgeschlossen" |
| SEO-/GEO-Messung | `docs/seo-monitoring-methodik.md`, `docs/geo-baseline.md`, `docs/gsc-abruf.md` | — |
| Bildstil | `docs/bildstrategie-grading.md` | — |
| Video-Marke, Marcos Stimme | `docs/video-toolkit/brand/`, `docs/video-toolkit-setup.md` §6 | — |

## Neu, weil es keine Quelle gab (★)

| Datei | Inhalt |
|---|---|
| ★ `kanal-regeln.md` | Je Kanal: Format, Takt, Stimme, CTA-Ziel, Hook-Muster nach Inhaltstyp |
| ★ `content-saeulen.md` | Die fünf Themen-Säulen, ihr Anteil am Mix, wohin sie verlinken |
| ★ `ereignis-playbook.md` | Was die Schleife unterbricht und wie darauf reagiert wird |

## Lesereihenfolge für einen Agenten

1. Diese Datei.
2. Die Abschnitte aus `marketing_agent.txt`, die seine Aufgabe betreffen.
3. Die ★-Datei seines Teams.
4. Für jede Fachaussage: Kanon-Datei (Temperatur, Cut, Methode) — nie aus dem Gedächtnis.
