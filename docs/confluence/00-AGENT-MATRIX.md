# Agent-Matrix — Steakakademie

> **Quelle der Wahrheit:** `CLAUDE.md` → Branch `[agenten]`. Diese Seite ist ein Spiegel für die Confluence-Übersicht.
> **Ehrlicher Status (Audit 03.06.2026, akt. 13.06.2026, claude-mem obs 2947/2948/2995):** 12 Agenten geplant, **5–6 tatsächlich aktiv.** Die Lücke ist bewusst dokumentiert, nicht beschönigt.

## Tatsächlich aktiv (laufen heute)

| # | Agent | Mechanik | Trigger | Status |
|---|-------|----------|---------|--------|
| 1 | **AGB/Rechts-Compliance-Scanner** | CronCreate (Remote) gegen `compliance/website-rechtscheck.yaml` (21 Komponenten) | täglich 06:00 UTC | ✅ aktiv |
| 5 | **Affiliate-Link-Checker** | GitHub Actions `check-affiliate-links.yml` → `npm run check-links:json`, öffnet/schließt GitHub Issue | Mo 08:00 UTC | ✅ aktiv |
| 6 | **Social Media Senior Director** | GitHub Actions `social-grow.yml` → `scripts/social-posts.mjs` (Claude Haiku), Post-Entwürfe als Artifact `social-drafts`; trägt Werbekennzeichnungs-Pflicht (LG Köln 12.05.2026) | So 04:00 UTC | ✅ aktiv (human-gated, **kein** Auto-Posten) |
| 11 | **Glossar-Agent** | GitHub Actions `glossary-grow.yml` → `scripts/glossary-agent.mjs` (Claude Haiku), legt neue Begriffe unter `content/glossar` als PR vor | nur Handstart (`workflow_dispatch`) | ⏸️ **pausiert seit 03.10.2026** — kein Zeitplan mehr; Vorrat leer, wartet auf die Entscheidung über die Glossar-Konsolidierung (`docs/glossar-konsolidierung-kandidaten.md`) |
| 12 | **Rezept-Agent** | GitHub Actions `recipe-grow.yml` → `scripts/recipe-agent.mjs` (Claude Sonnet) + `recipe-images.mjs` (FLUX.1/FAL) | täglich 03:30 UTC | ✅ aktiv (aus Build entfernt 02.06.) |
| — | **cron-scout** | `scripts/cron-scout.mjs` | manuell/`cron:scout` | ⚠️ blockiert bis ADMIN_PASSWORD rotiert (KAN-15) |

## Entfernt am 03.10.2026

| Automation | Was gelöscht ist | Grund |
|------------|------------------|-------|
| **Auto-Fix-Agent** | `auto-fix.yml` | 0 Läufe — war verwaist |
| **Newsletter-Workflow** | `newsletter-weekly.yml`, `scripts/newsletter-weekly.mjs` | nie eine Ausgabe versendet; es gibt keinen automatischen Wochenversand |
| **Ideen-Radar** | `ideen-radar.yml`, `scripts/ideen-radar.mjs`, `data/ideen-backlog.json`, `data/rezept-quellen.yaml` | sammelte, ohne dass etwas die Einträge verarbeitete — Vermerk und Quellen-Ausschlüsse in `docs/ideen-radar.md` |

## Geplant, noch nicht gebaut

| # | Agent | Benötigt | Jira |
|---|-------|----------|------|
| 2 | SEO-Monitor | GSC Service Account | KAN-21 |
| 3 | Content-Pipeline (Recherche→Übersetzung→DE) | DeepL, Notion, `recipe-scraper/` (gelöscht) | — |
| 4 | Newsletter/DOI-Monitor | Loops.so API | — |
| 7 | Konkurrenz-Monitor (Frühwarnung „Präsenz-Player geht online") | Nimble/Brightdata, Searchfit | — |
| 8 | Rechts-Update-Scanner | WebFetch (bmj.de, eur-lex) | — |
| 9 | Digistore24-Performance-Report | Digistore24 API | — |
| 10 | GSC-Indexierungs-Report | GSC API (deckt KAN-21 mit ab) | KAN-21 |

## Konsolidierungs-Empfehlung (aus Audit 2995)

- **Agent 2 + 10** zusammenlegen (beide GSC) → ein SEO/Index-Monitor.
- **Agent 1 + 8** überschneiden sich (beide Rechts/Compliance) → prüfen, ob 8 in 1 aufgeht.
- **Agent 3** referenziert gelöschtes `recipe-scraper/` → Roadmap-Eintrag bereinigen oder neu spezifizieren.
- ~~**Auto-Fix-Agent** entweder an realen Alert-Trigger anschließen oder als dormant markieren.~~ Erledigt 03.10.2026: entfernt (siehe oben).

## Virtuelle AI-Workforce (Rovo-Orchestrator-Ebene)

> **Vollständiges Betriebsmodell** (Hierarchie, Prioritäten, Pipeline „wer beginnt, was
> kommt als Nächstes", RACI je Marketing-Frage): siehe `04-MARKETING-AGENCY-MODEL.md`.

Mapping der Orchestrator-Rollen auf die reale Arbeit — **keine Doppelung** der obigen Automation, sondern Zuständigkeits-Linsen:

| Rolle | Deckt ab | Reale Artefakte |
|-------|----------|-----------------|
| Content & Culinary Expert | Pitmaster-Doktrin, Rezepte, Glossar, Lektionen | Agent 11/12, `content/` |
| **SEO Manager** | In Google ranken: Keywords, technisches SEO, Schema, interne Links, Backlinks/Outreach, SERP | KAN-1, KAN-18, KAN-24, Searchfit |
| **GEO Manager** | KI-Zitierbarkeit (ChatGPT/Perplexity/Gemini), Entity/Wikidata, **Ganzseiten-Re-Check bei jedem neuen Text** | `docs/geo-manager-agent.md`, `scripts/geo-check.mjs` |
| Social Media Senior Director | Reichweite, Community, Kanäle (Agent 6) | `scripts/social-posts.mjs`, `social-grow.yml` |
| Tech & Automation Engineer | Code, Supabase, GitHub Actions, Deploy | KAN-6, alle Agenten-Workflows |
| Brand & UX Designer | „High-Tech & Smoke"-Design, FLUX-Bilder | Design-System, FAL-Pipeline |
