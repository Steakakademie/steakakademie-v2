# Störfall-Checkliste — Symptom · Prüfung · Handgriff

> Abteilung: Systems & Ops. Angelegt 22.10.2026 (Paket T7 / C23 im Launch-Plan). Je Störfall ein
> Absatz, immer in derselben Reihenfolge: **Symptom** (woran man es merkt), **Prüfung** (womit man
> es belegt, bevor man etwas anfasst), **Handgriff** (was zu tun ist, und wer). „Wer" ist
> ehrlich: Billing, Secrets, Digistore, Vercel-Schalter kann nur Uwe.
>
> Grundregel aus CLAUDE.md Abschnitt A: Ein Signal, das zu einem bekannten Fehler passt, kann
> eine andere Ursache haben. Erst belegen, dann handeln. Und: Grün ist kein Ergebnis (Regel 10) —
> der Heartbeat prüft Ergebnisse, nicht Läufe.

## Wo die Alarme ankommen

| Weg | Was dort landet |
|---|---|
| Jira-Projekt KAN | Rote Workflows (Heartbeat, Funktionsproben, Sicherung, Importe) öffnen je Label **ein** Ticket (`scripts/ops-alert-to-jira.mjs`, Dedup). Vercel-Deploy-Fehler ebenfalls (`vercel-deploy-alert.yml`). |
| Sentry | Laufzeitfehler der Seite; „Kassiert ohne Auslieferung" aus dem Digistore-Webhook mit Fingerprint je Produkt. |
| GitHub Actions → Job-Summary | Zahlen und Gründe. Ein grüner Lauf mit „nicht gelaufen" im Summary ist ein Störfall (Lehre vom 22.10.: Backup-Probe viermal übersprungen, Lauf grün). |
| `ops-heartbeat` (täglich 09:00 UTC, `docs/ops-heartbeat.md`) | 16 Prüfpunkte mit Frist, „nicht geprüft" ist rot. |

## 1. Vercel liefert 402 / DEPLOYMENT_DISABLED

**Symptom:** Die Seite antwortet mit HTTP 402, alle Deployments abgeschaltet; Heartbeat „Website
erreichbar" rot, KAN-Ticket. Am 14.09.2026 stundenlang so.

**Prüfung:** `curl -o /dev/null -w '%{http_code}' https://steakakademie.de/` → 402. Vercel-Dashboard
→ Account → Billing: Zahlung offen oder Karte abgelehnt? Deployment-Liste: Status `DISABLED`?
Nicht am Code suchen, solange Billing nicht geklärt ist.

**Handgriff (nur Uwe):** Zahlung im Vercel-Dashboard begleichen, danach Redeploy des letzten
grünen Deployments (Deployments → ⋯ → Redeploy). Es gibt keinen Notbehelf mehr: Netlify ist
seit 13.09.2026 abgebaut. Danach Heartbeat per `workflow_dispatch` starten und „Website
erreichbar" grün sehen. Kosten-Hintergrund: `docs/vercel-kosten.md`.

## 2. Supabase nicht erreichbar oder pausiert

**Symptom:** Login scheitert, Mitgliederbereiche leer, `/api/*` mit 500; Funktionsproben rot;
Sentry meldet Verbindungsfehler. Free-Tarif-Projekte pausiert Supabase nach 7 Tagen Inaktivität
oder bei Überschreitung.

**Prüfung:** Supabase-Dashboard → Projekt `bbgdrzhlellxzggbbqcm` → Status (Paused? Limits?).
`curl` gegen `https://<projekt>.supabase.co/rest/v1/` mit Anon-Key → 200 oder Fehler.
Logs im Dashboard (Postgres, API). Nicht im Code suchen, solange das Projekt pausiert ist.

**Handgriff:** Pausiert → Restore im Dashboard (Uwe). Limits überschritten → erst Ursache
(Tabellengröße, Egress) im Usage-Tab, dann entscheiden. Datenverlust → Wiederherstellen nach
`docs/supabase-backup.md`, Abschnitt „Wiederherstellen (Ernstfall)": Artefakt laden, Prüfsumme,
entschlüsseln (Passphrase nur offline), Schema aus Git, Daten aus dem Dump. Letztes Backup mit
belegter Probe prüfen: Actions → „Supabase-Sicherung" → Job-Summary muss Zeilen in der Kopie
nennen, nicht „nicht gelaufen".

## 3. Digistore-Webhook kommt nicht an oder scheitert

**Symptom:** Käufer meldet „bezahlt, kein Zugang". Sentry-Issue „Kassiert ohne Auslieferung"
(Gründe: `kein-mapping`, `kurs-unpublished`, `mapping-lesefehler`, `verarbeitung-gescheitert`).
Oder gar nichts: kein Sentry, keine Zeile in `digistore_orders`.

**Prüfung:** `digistore_orders` nach `ds_order_id` oder E-Mail: Zeile vorhanden? `processing_status`
`failed` mit `error_message`? Keine Zeile → der Webhook hat die Seite nie erreicht: in Digistore
→ Einstellungen → Anbindungen (IPN) den Versandstatus und die Antwort der Seite lesen;
`DIGISTORE_IPN_PASSPHRASE` und `DIGISTORE_WEBHOOK_TOKEN` in Vercel (Scope Production) vorhanden?
Mapping: `digistore_products` → `course_id` → `courses.published`. Nach dem Verkaufsstart ist
`published = false` bei 696394/696396 der wahrscheinlichste Grund (Stand 22.10.: beide
unveröffentlicht, Alarm `kurs-unpublished`).

**Handgriff:** Fehlendes Mapping oder `published` → Migration bzw. Update über den
Supabase-Connector (Claude bereitet vor, Uwe wendet an); danach Bestellung in Digistore
erneut senden (IPN → „erneut senden") — der Webhook ist idempotent über `ds_order_id`. Passphrase
rotiert → Secret in Vercel nachziehen, Redeploy. Bis zur Behebung: Käufer per Hand
freischalten (`bookings`) und Beleg im Ticket. Runbook: `docs/digistore-diplom-anbindung.md`.

## 4. KI-API-Limit oder -Ausfall (Anthropic, Voyage, Gemini, fal)

**Symptom:** Marco-Chat, Kochwissen, Mein-Protokoll-Erzeugung, Steak-Beichte, Rezept-Agent
antworten mit 429/5xx oder „ANTHROPIC_API_KEY fehlt"; Sentry häuft 429; Rezept-Workflow rot.

**Prüfung:** Zuerst die Konsole des Anbieters: Anthropic Console → Usage/Limits (Spend Cap
erreicht?), Voyage Dashboard (Free-Tier 200M Tokens), Google AI Studio (Gemini-Quote), fal.ai.
Dann der Endpunkt: `curl -X POST https://steakakademie.de/api/marco` same-origin ist nicht
möglich, also im Browser die Seite benutzen und Netzwerk-Tab lesen. Rate-Limits der Seite selbst
stehen in `src/app/api/*/route.ts` (`RATE`); ein 429 **von der Seite** ist der eigene Schutz,
ein 429 **vom Anbieter** steht im Server-Log (Vercel → Logs).

**Handgriff:** Spend Cap erreicht → Uwe entscheidet: anheben oder bis Monatsende warten;
die Seite bleibt bedienbar, nur die KI-Funktionen melden einen Hinweis. Schlüssel widerrufen →
neuen Schlüssel in Vercel (Production) und GitHub-Secret setzen, Redeploy. Anbieter-Ausfall
→ nichts anfassen, Status-Seite des Anbieters verlinken, Ticket offen lassen. Liste der
KI-Endpunkte und ihrer Limits: `docs/stoerfall-checkliste.md` Anhang A.

## 5. Heartbeat rot

**Symptom:** KAN-Ticket „ops-heartbeat", Job-Summary nennt den Prüfpunkt: „seit N Tagen nichts"
oder „nicht geprüft".

**Prüfung:** Das Summary sagt, **welcher** Punkt. „Nicht geprüft" heißt Secret fehlt oder Dienst
lehnt ab — das ist ein eigener Störfall, kein Rauschen. Dann die Quelle des Punkts: Workflow-Lauf
(Actions), Tabelle (Supabase), Artefakt (Actions → Artifacts), Git (letzter Commit des Agenten).

**Handgriff:** Je Punkt der Hinweis in `data/ops-heartbeat.json` — er wurde für genau diesen
Fall geschrieben. Zeitplan nach 60 Tagen Ruhe abgeschaltet → Workflow einmal per Hand starten.
Seed-Vorrat leer (Rezept-Agent) → `scripts/recipe-seeds.mjs`. Niemals den Prüfpunkt
entschärfen, um grün zu werden; wenn ein Punkt bewusst außer Betrieb geht, kommt er mit Grund
und Datum aus der Liste (PR).

## 6. Pflicht-Check hängt, jeder PR blockiert

**Symptom:** Merge-Button `BLOCKED`, ein Kontext bleibt `pending` oder taucht gar nicht auf.

**Prüfung:** `gh api repos/Steakakademie/steakakademie-v2/branches/main/protection/required_status_checks`
→ die vier Namen exakt vergleichen mit `gh api .../commits/<sha>/check-runs`. Ein falsch
geschriebener Kontext wird nie grün. Workflow-Datei auf `main` vorhanden?

**Handgriff (nur Uwe, Branch-Protection):** Kontext korrigieren — den Namen aus einem echten
Check-Run abschreiben, nie tippen. Nie `enforce_admins` aushebeln, nie Bypass. CLAUDE.md
Abschnitt A, Git.

## 7. Mail kommt nicht an (Loops, pitmaster@)

**Symptom:** Magic-Link-Mail bleibt aus, Willkommensstrecke sendet nicht, Kontaktformular ohne
Eingang. Zusagen-Belege (Heartbeat) melden Loops-Workflow „gebrochen" oder „blind".

**Prüfung:** Loops → Workflows: aktiv? Loops → Logs für die Adresse. `LOOPS_API_KEY` in Vercel
und GitHub vorhanden (Namen, nie Werte)? Cloudflare → DNS: SPF/DKIM/DMARC-Einträge unverändert?
Zustellprobe an die eigene Adresse (M4 — bis heute nicht belegt).

**Handgriff:** Workflow in Loops wieder aktivieren; Schlüssel rotiert → beide Stellen
nachziehen; DNS-Änderung → zurücknehmen und 24 h warten. Vorlagen: `docs/loops-mailvorlagen.md`.

## Anhang A — KI-Endpunkte und ihre Bremsen (Stand 22.10.2026)

Alle öffentlichen KI-Routen laufen über `guardRequest` (`src/lib/api/guard.ts`: Same-Origin,
Rate-Limit je IP, Body-Schema, optional Auth, Turnstile). Ausnahme Steak-Beichte: Multipart,
eigener Zähler je IP **und** je Nutzer. Admin-Routen liegen hinter `istAdminCookie`.
Ehrliche Grenze: Die Zähler leben im Prozess; auf Vercel ist das je Instanz.

| Route | Modell / Dienst | Limit (Anfragen / Fenster) | Schutz |
|---|---|---|---|
| `api/chat` | Anthropic | 30 / 10 min | guardRequest |
| `api/marco` | Anthropic | 20 / 10 min | guardRequest |
| `api/kochwissen` | Voyage (+ Reranker) | 10 / 10 min | guardRequest |
| `api/kochwissen/generieren` | Anthropic | 10 / 60 min | guardRequest |
| `api/mein-protokoll/generate` | Anthropic `claude-sonnet-4-5`, 12.000 Tokens | 6 / 60 min | guardRequest + Login |
| `api/steak-beichte/analyze` | Anthropic `claude-sonnet-4-5` | 10 / 10 min je IP und je Nutzer | eigener Zähler + Login + Guthaben |
| `api/niche-validator/analyze` | Anthropic | 5 / 60 min | guardRequest |
| `api/validator` | Anthropic | 10 / 60 min | guardRequest |
| `api/rezept-bild` | fal | 10 / 60 min | guardRequest |
| `api/rezept-einreichen` | Anthropic | 5 / 60 min | guardRequest + Turnstile |
| `api/admin/fal-check` | fal | — | Admin-Cookie |
| `api/pm-agent` | Anthropic | — | Admin-Cookie |

**Nicht in der Konsole gesetzt (Stand 22.10., aus dem Repo nicht einsehbar):** Spend Caps bei
Anthropic, Google, Voyage, fal — Paket T4 / C17, Handgriff Uwe. Ohne Deckel begrenzt nur die
Tabelle oben, und die gilt je Instanz.
