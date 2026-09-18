# 🎛️ COCKPIT — Steakakademie

> **Das ist die einzige Datei, die Uwe anheftet.** Alles andere wird über die fünf
> Abteilungen unten erreicht — nicht über Einzel-Ordner im Sichtfeld.
>
> **Regel:** Es gibt **fünf** Abteilungen. Dauerhaft. Neues wird einer der fünf
> zugeordnet — es kommt keine sechste dazu. Wenn etwas in keine passt, ist es
> entweder falsch geschnitten oder gehört nicht ins Projekt.
>
> **Pflege:** Je Abteilung genau drei Zeilen — *läuft · hängt · nächster Schritt*.
> Wird die Liste länger, gehört der Rest in die Detail-Doku der Abteilung, nicht hierher.
>
> Angelegt 10.08.2026 (Konsistenz-Audit). Stand der Einträge: siehe Datum je Zeile.

---

## Die fünf Abteilungen

| # | Abteilung | Ersetzt | Einstieg |
|---|---|---|---|
| 1 | **Systems & Ops** | Entwicklung + IT-Betrieb | `src/` · `scripts/` · `supabase/` · `.github/workflows/` |
| 2 | **Studio** | Video-/Bildproduktion | `video/` · `training/` · `bild-austausch/` |
| 3 | **Redaktion** | Content-Team + Fachredaktion | `content/` · `data/` |
| 4 | **Wachstum** | SEO/GEO · Social · Newsletter · Affiliate | `products/` · `steakakademie-audit/` |
| 5 | **Kanzlei** | Recht · Steuern · Behörden | `compliance/` · `Existenzgruendung-Jobcenter/` |

---

## 1 · Systems & Ops

**Läuft:** Vercel-Produktion (`steakakademie.de`), Supabase-Auth (Magic Link), Branch
Protection auf `main` mit drei Pflicht-Checks (`P0-Gates pruefen`, `Stille Content-Defekte
prüfen`, `Build pruefen` — alle aus GitHub Actions), 21 GitHub-Actions-Workflows,
Sentry-Monitoring, Ops-Alert → Jira (KAN), **Ops-Heartbeat** (täglich 09:00 UTC,
`docs/ops-heartbeat.md`) — prüft Ergebnisse statt Läufe und schlägt an, wenn eine
Automation aufhört zu liefern, auch wenn sie grün bleibt.

**Hängt:** Der Build-Gate baut ohne Env-Variablen — Supabase-gestützte Bereiche rendern
dabei leer. Er beweist Übersetzung und Durchlauf, nicht die Datenlage; ob das reichen soll,
ist offen ·
`_content_snap.tgz` / `_fix_sync.tgz` als Müll im Repo-Root (Regel 14).

**Nächster Schritt (07.09.):** Relaunch (#62) und Diplom-Audit (#63) sind auf `main` und live;
Suche (#65), Autorenstimmen (#66), Migrations-Härtung + YAML (#67) liegen als grüne PRs zum Merge.
Danach: Supabase-CLI auf Uwes Rechner installieren + `supabase link` — bis dahin laufen
Migrationen nur über den claude.ai-Connector (07.09. so angewendet: 20260902160000 und
20260906190000, Ledger stimmt). Relaunch-Umschalten weiter erst nach Mobile-Nav, Login,
Cut-Detailseite. Build-Gate-Datenlage: bleibt bei Übersetzung + Durchlauf (Entscheidung 05.09.).
*Diplom seit 07.09.:* Prüfung serverseitig (`/api/diplome/pruefung`), Nutzer ohne Schreibrecht auf
`course_progress`, Kauf → Zugang über `courses.slug = grillmeister-diplom` — **Digistore-Produkt dafür
existiert noch nicht** (6 Produkte gelistet, keins fürs Diplom); `AUDIT-Ausbildungssystem-2026-09-06.md`.

*Hofladen-Radar 13.09.2026 (Branch `feat/hofladen-radar`, PR offen):* `/hoefe` + `/hoefe/[slug]`,
Umkreissuche (SQL-Haversine, kein PostGIS), OSM-Wochenimport als Actions-Cron, Karte per
Klick-zum-Laden (MapTiler). **Uwe:** Migration `20260913120000_hoefe.sql` einspielen, Workflow
„Hofladen-Radar importieren" einmal starten, `NEXT_PUBLIC_MAPTILER_KEY` in Vercel — Konzept und
Abweichungen vom Briefing in `docs/hofladen-radar.md`.

*Erledigt 05.09.2026 (Relaunch):* Alt-Site archiviert (Tag `archiv/website-v1-2026-09`,
Branch `archiv/website-v1` — beide auf origin, Bundle + Abbild in `C:\Dev\_archiv\`,
Build-Probe grün) · Relaunch parallel unter `/relaunch`: **alle acht Handoff-Ansichten**
(Startseite, Übersicht ×4, Streitfall, Rezept mit Portionsrechner, Lektion, Werkzeug,
Diplome, Über uns), Kontraste auf AA, Kerntemperaturen gegen Referenz, 10 E2E-Tests ·
Template-Kopie von `/` und `/home-b` fürs zweite Standbein in
`Projects\Steakakademie\Archiv-Website-v1\` · **Admin-Härtung** `src/lib/admin-auth.ts`:
ohne gesetztes `ADMIN_PASSWORD` gab es an sechs Stellen `undefined === undefined` — jeder
Besucher wäre Admin gewesen (Preview ohne Env-Scope!). Jetzt eine Stelle, ohne Passwort kein Admin.

*Erledigt 05.09.2026 (abends):* Node-Version auf **eine Quelle** zusammengezogen —
`.nvmrc` (`24`) ist die Quelle, alle 21 setup-node-Stellen in 20 Workflows lesen sie über
`node-version-file`, `engines: ">=24 <25"` in package.json grenzt nach oben ab. Die
Obergrenze ist Absicht: Vercel wählt Node nach `engines`, offen gelassen spränge die
Produktion beim nächsten Major von allein. Vorher stand die Zahl 21-mal hart im Repo
(Gate 22, übrige Workflows 20, Vercel 24.x). Gate zuerst und einzeln belegt (`node: v24.20.0` im
Lauf-Log) · Eigener Build-Riegel `.github/workflows/build-gate.yml`
gebaut, Job `Build pruefen` (contentlayer → tsc → `next build`, 2,5–3 min, `.next/cache`
über `actions/cache`) · als Pflicht-Check eingetragen und **belegt statt behauptet**: mit
ausstehendem Lauf meldete GitHub an PR #56 `BLOCKED` und verweigerte den Merge, nach grünen
Checks `CLEAN` · erst danach **Vercel aus den Required Checks entfernt** — es baut und
meldet weiter, blockiert aber nicht mehr. Grund: Vercel war das einzige bauende Gate, und
ob dort ein Ignored Build Step gesetzt ist, lässt sich aus dem Repo nicht einsehen; damit
gab es keine Garantie, dass Vercel immer meldet. Der Schutz hängt jetzt an einem Job, der
dem Repo gehört.

*Erledigt 05.09.2026:* `BOT_PAT` gesetzt (Fine-grained, nur dieses Repo, Contents +
Pull requests RW) — Nachweis an PR #52: Autor `Arkamas` statt `github-actions[bot]`, die
Pflicht-Checks liefen an, der Fallback-Hinweis „Ohne BOT_PAT erstellt" blieb aus. Damit
läuft das Content-Wachstum wieder (stand seit 01.09.) · Vercel als dritter Required
Status Check eingetragen (Commit-Status, Kontext exakt `Vercel` — nicht der Check-Run
`Vercel Preview Comments`). Bis dahin standen nur zwei Kontexte in der Liste: #52 mergte
um 14:38:14 UTC, der Vercel-Build startete erst um 14:40:21 UTC — `4057b24` kam ohne
Vercel-Gate auf main · `can_approve_pull_request_reviews` war bereits `true`, nichts geändert.

*Erledigt 04.09.2026:* PR-Gate für alle Bot-Pushes (Text auto-merge, Bilder Review) ·
Race durch eigene Branches gelöst · 13 `workflow_dispatch`-Inputs über `env` entschärft
(Script-Injection-Muster) · Guard in `train-pork-lora.yml` (fehlendes Dataset ≠ Fehler).

---

## 2 · Studio

**Läuft:** Cut-Foto-Generator (FLUX.1 + `sa_rawcut`-LoRA) mit **PR-Review-Gate** —
nichts geht ohne Sichtprüfung live. Rezeptbild-Generator (`sa_foodstyle`-LoRA).
Kräuter-Rotation im Cut-Prompt (6 Kräuter, deterministisch je Slug).

Video-Toolkit (MIT, v0.20.0) seit 04.09. im Repo verankert (PR #47 gemergt):
`npm run vt:setup:win`, Marken-Profil kanonisch in `docs/video-toolkit/brand/`,
Modal mit 6/8 Endpunkten (**Qwen3-TTS**, **FLUX2**, Image-Edit, Upscale, Musik,
SadTalker) — Doku `docs/video-toolkit-setup.md`.

**Marcos Stimme ist abgenommen und eingefroren** (04.09., B3 „warm-erfahren",
Voice-Design statt Klon). Die Referenz-WAV liegt versioniert im Repo, weil Qwen3-TTS
**keinen Seed** kennt — löschen und neu generieren ergäbe eine *andere* Stimme.
Nie löschen, Neu-Abnahme nur mit Freigabe (`docs/video-toolkit-setup.md` §6).

**Hängt:** **R2 fehlt — Pflicht vor der nächsten Generierung** (ohne R2 gehen
Referenz-Assets an einen öffentlichen Filehoster, Befund 04.09.; Setup-Skripte warnen
rot; die vier Schlüssel stehen bereits auskommentiert in `tools/video-toolkit/.env`) ·
16 Cut-Fotos fehlen (Platzhalter greift) · `training/lora-pork/dataset/` fehlt →
Training läuft nicht (Guard fängt es ab) · zwei Video-Stacks parallel (OpenMontage +
Toolkit) — einer zu viel.

**Nächster Schritt:** R2 einrichten (`docs/video-toolkit-setup.md` §3, 0 €) → erste
Lernvideo-Produktion mit Marcos Stimme. Danach OpenMontage stilllegen.

---

## 3 · Redaktion

**Läuft:** 64 Cuts im Katalog, 334 MDX-Dateien ohne Frontmatter-Fehler, keine toten
internen Links, Glossar- und Rezept-Agent (täglich 03:00 / 03:30 UTC), Rechtschreibprüfung
(report-only), MDX-Komponenten-Gate im `prebuild`.
*13.09.:* Rezept-Nachschub automatisiert — `data/rezept-seeds.json` (34 Gerichte aus den
11 BBQ-Hochburgen) wird von `scripts/recipe-seeds.mjs` aufgefüllt, sobald der Vorrat unter
10 offene Seeds fällt. Der Agent läuft damit nicht mehr trocken.

**Hängt:** **Rezept-Produktion stand vom 27.08. bis 13.09.2026 still** — 84 Seeds
abgearbeitet, `recipe-grow` lief 17 Nächte grün in 48 Sekunden ohne Ergebnis. Ursache
behoben (Nachschub + Heartbeat), aber: der Rückstand von ~17 Rezepten wird nicht
nachgeholt, es läuft ab jetzt wieder 1 Rezept/Tag ·
7 Rind-Cuts mit `52–54 °C` widersprechen der Untergrenze 54 °C in
`data/kerntemperatur-referenz.yaml` — Fachentscheidung offen, welche Seite recht hat ·
`content/cuts/pulled-pork.mdx` hat keinen Katalog-Eintrag (Seite existiert, aus dem
Atlas nicht erreichbar) · `id: 'roastbeef'` ≠ `slug: 'rumpsteak'` (einziger ID/Slug-Bruch) ·
**Ideen-Radar sammelt Altbestand:** 25 der 79 Einträge in `data/ideen-backlog.json` sind älter als ein Jahr
(23 aus 2024, 2 aus 2025) — der 21-Tage-Frischefilter aus dem BBQ-News-Scout (03.09.,
`MAX_AGE_DAYS` in `scripts/cron-scout.mjs`) greift hier nicht, `scripts/ideen-radar.mjs`
kennt keine Altersgrenze. Als reiner Themenspeicher unkritisch; vor dem nächsten
Pipeline-Ausbau aber entscheiden, ob Altes gefiltert oder bewusst als Evergreen markiert
wird, sonst geht es unbesehen als „aktuell" in die Content-Pipeline. Geprüft 05.09.2026:
keine ausgeschlossenen Quellen (bbqingwiththenolands, usa-kulinarisch), keine Duplikate
in `id`, `link` oder Titel.

**Nächster Schritt:** Rind-Kerntemperaturen entscheiden — Katalog an YAML angleichen
oder YAML korrigieren. Kein Raten (Regel 8c). *Hinweis 07.09.:* `meta.ziehtemperatur` in der
YAML erklärt 52–54 °C ausdrücklich als Ziehwert — die 7 Cuts sind möglicherweise kein
Widerspruch, sondern nur unbeschriftet (Zieh- statt Serviertemperatur). Vor dem Angleichen
lesen, wie die Zahl im Katalog beschriftet ist.
*07.09.:* Diplom-Lektionen an die Referenz angeglichen (Rind MR 54–58 serviert, Schwein 63–65,
Warmhalten ≥ 63, Brisket 90–96); „Gefahrenzone" nur noch HACCP; YAML `pork_juicy` auf [63,65];
Garstufen-Skala Rind liegt als `garstufen_rind_vorschlag` (bestätigt: false) — **Uwe bestätigt
oder verwirft**, dann wandert sie unter `badges` oder die drei Fundstellen werden angepasst.
Audit-Rest R15 (Elemente ab Stufe 2, 0 Bilder in 35 Lektionen) braucht ein Regel-8b-Konzept.

*Erledigt 10.08.2026:* 7 Schwein-Cuts lagen unter dem Sicherheitsminimum 63 °C
(presa/pluma erreichten es nie) → auf `63–65 °C` korrigiert.

---

## 4 · Wachstum

**Läuft:** Affiliate-Link-Checker (Mo 08:00 UTC), Social-Post-Entwürfe als Artifact
(human-gated, kein Auto-Posting), GEO-Check, Content-Wachstum (So 04:00 UTC),
`products/registry.yaml` mit 32 Einträgen.

**Hängt:** `lastChecked` in der Registry überall 22.05.2026 (~3 Monate ungeprüft) ·
4 offene Affiliate-TODOs (Santosgrills, Grillfürst, Ankerkraut, Otto Gourmet) ·
5 Einträge ohne jeden Affiliate-Parameter = aktuell reine Gratis-Links ·
Newsletter-Versand seit 10.08. nur noch manuell nach Vorschau-Freigabe.

**Nächster Schritt:** Affiliate-Programme anmelden — der einzige Monetarisierungs-Hebel
mit 0 € Startkosten (CLAUDE.md §5, Blocker 4).
*07.09.:* Verteilplan für Reel 1 liegt (`Projects/Steakakademie/Marketing/VERTEILPLAN-Reel-1-2026-09-06.md`,
0 €, TikTok + Instagram ernst, Rest Zweitverwertung). Microsoft Clarity läuft live (~30 Suchsitzungen/Woche,
>80 % mobil), Vercel Web Analytics nicht aktiviert, GA4 offen. Live-Site hat keine Social-Links.
**Offen, nur Uwe:** Claim „Geiler Scheiss" — Reel als Einzelstück oder Marke (Befund liegt); Digistore-
Produkt fürs Diplom anlegen und in `digistore_products` auf `grillmeister-diplom` mappen. **Nebenbefund:**
Digistore-Produkt 695900 (Agentur-Killer-Sprint, aktiv, approved) hat keine Zeile in `digistore_products`
und keinen Kurs — ein Kauf dort würde derzeit nichts freischalten.

---

## 5 · Kanzlei

**Läuft:** Rechts-Compliance-Scanner (täglich 06:00 UTC) gegen
`compliance/website-rechtscheck.yaml`, Impressum/Datenschutz/AGB/Widerruf live,
KI-Disclaimer nach EU AI Act, Existenzgründungs-Paket für das Jobcenter vollständig
(Businessplan, Lebenslauf, Finanzplan, §16c-Antrag 4.100 €, Anschreiben, Checkliste).

**Hängt:** Re-Prüfung der behobenen Anwalts-Mängel durch RAin Nieweg steht aus ·
Wortmarke „Steakakademie" — Gebühr offen · Berufsgenossenschaft/Unfallversicherung
erst nach Gewerbeanmeldung klärbar.

**Nächster Schritt (real, nur Uwe):** Gewerbe **erst nach** ESG-Antragseingang anmelden,
Aufnahmedatum 01.09.2026 im Antragsgespräch bestätigen.

---

## Zuordnungs-Regel für Neues

Bevor ein neuer Ordner, ein neues Tool oder eine neue Automatisierung entsteht:
**Zu welcher der fünf gehört es?** Die Antwort steht im Commit oder in der
Abteilungs-Doku — nicht implizit im Kopf. Findet sich keine Abteilung, ist das ein
Signal zum Nachdenken, kein Grund für eine sechste.
