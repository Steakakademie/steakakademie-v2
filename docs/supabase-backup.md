# Supabase-Sicherung — täglicher Export

> Angelegt 17.10.2026 (Uwe: „Sicherungsziel für Supabase: bau den täglichen Export").
> Abteilung Systems & Ops. Workflow `.github/workflows/db-backup.yml`, täglich 02:40 UTC.

## Warum

Supabase läuft im Free-Tarif ohne automatische Backups (CLAUDE.md §6). Seit dem
17.10.2026 liegen in der Datenbank Dinge, die sich nicht neu erzeugen lassen:
Urkunden-Nummern mit Prüfcodes (`public.urkunden`), Buchungen und Digistore-Bestellungen,
Konten (`auth.users`), Hofladen-Beansprüche, Content-Entwürfe. Vor diesem Tag gab es von
der Datenbank keine einzige Kopie.

## Was gesichert wird

| Enthalten | Nicht enthalten, bewusst |
|---|---|
| Schema `public` komplett (33 Tabellen, Stand 17.10.2026, 128 MB inkl. Embeddings) | Sitzungen und Refresh-Tokens (`auth.sessions`, `auth.refresh_tokens`, `auth.one_time_tokens`, `auth.flow_state`, `auth.mfa_amr_claims`) — ein Backup soll keine Anmeldungen wiederbeleben |
| Schema `auth` mit `users` und `identities` (Konten, Passwort-Hashes) | `auth.audit_log_entries` (wächst, kein Nutzwert) |
| Schema `storage` (Bucket-Metadaten) | die Dateien im Bucket `urkunden` — Druckdateien lassen sich aus der DB neu rendern (`src/lib/urkunde/render.ts`) |
| | Supabase-interne Schemas (`realtime`, `vault`, `graphql`, `supabase_migrations`) |

Format: `pg_dump --format=custom`, Postgres-Client 17 passend zum Server (17.6).
Die Datei heißt `supabase-<datum>_<uhrzeit>.dump.enc`, daneben `.sha256` und
`inventar-quelle.txt` (Zeilen je Tabelle zum Zeitpunkt des Exports).

## Wohin

GitHub-Artefakt dieses Repos, **90 Tage** (das Maximum, das GitHub erlaubt), fester Name
`supabase-sicherung` (das Datum steckt in den Dateinamen; ein Artefakt je Lauf). Das Repo
ist öffentlich: Artefakte kann jeder
angemeldete GitHub-Nutzer laden. Deshalb ist die Datei mit **AES-256-CBC, PBKDF2
(600 000 Iterationen, SHA-256)** über `openssl enc` verschlüsselt. Ohne die Passphrase ist
das Artefakt wertlos.

Warum kein zweiter Ort: Jeder weitere Ort (privates Repo, Drive, S3) braucht eigene
Zugangsdaten und Pflege. 90 Tage rollierend reichen, um einen Datenverlust oder eine
kaputte Migration zu überleben — die Frist ist der Preis für null Kosten und null Pflege.
Wer länger zurück will, lädt ein Artefakt herunter und legt es offline ab.

## Secrets (einmalig, Uwe)

| Secret | Inhalt | Woher |
|---|---|---|
| `SUPABASE_DB_URL` | `postgresql://postgres.bbgdrzhlellxzggbbqcm:<PASSWORT>@aws-1-eu-central-1.pooler.supabase.com:5432/postgres` | Supabase → Project Settings → Database → Connection string, **Session pooler** (IPv4; der direkte Host `db.<ref>.supabase.co` ist nur per IPv6 erreichbar, GitHub-Runner haben keins). Passwort dort zurücksetzen, falls unbekannt. |
| `BACKUP_PASSPHRASE` | mind. 32 zufällige Zeichen | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` — **Kopie offline zu den Recovery-Codes**. Geht sie verloren, sind alle Artefakte unbrauchbar. |

Eintragen: GitHub → Settings → Secrets and variables → Actions, oder
`gh secret set SUPABASE_DB_URL` bzw. `gh secret set BACKUP_PASSPHRASE` (Wert wird abgefragt,
landet nicht in der Shell-History).

Fehlt ein Secret oder ist die Passphrase kürzer als 32 Zeichen, endet der Lauf rot mit
Klartext-Meldung — „nicht gesichert" ist nie grün (CLAUDE.md §2 Regel 10).

## Was der Lauf jedes Mal beweist

1. **Rückweg der Verschlüsselung:** Direkt nach dem Verschlüsseln wird entschlüsselt und
   byteweise mit dem Original verglichen (`cmp`).
2. **Wiederherstellung:** Der Dump wird in ein frisches `pgvector/pgvector:pg17` im selben
   Lauf eingespielt (mit den Supabase-Rollen `anon`, `authenticated`, `service_role` und
   den Erweiterungen `vector`, `pgcrypto`, `uuid-ossp`, damit Policies und Defaults
   auflösen). Danach zählt der Lauf jede `public`-Tabelle in Quelle und Kopie. **Weicht
   eine Zahl ab, ist der Lauf rot.** Ausnahme Telemetrie (`web_vitals`, `js_errors`): dort
   darf die Quelle inzwischen mehr Zeilen haben, nie weniger.
3. **Zahlen im Summary:** Tabellen mit Daten, Zeilen in Quelle und Kopie, Zahl der
   unkritischen Restore-Meldungen (Grants, Kommentare), erste 20 davon aufgeklappt.

**Vom 19. bis 22.10.2026 lief die Probe in keinem Zeitplan-Lauf (22.10.2026, belegt).** Die
Bedingung `inputs.restore_probe != false` war nur für den Handknopf gedacht; bei `schedule`
ist `inputs` leer, GitHub vergleicht `null` mit `false` als `0 == 0`, und der Schritt stand
viermal auf „skipped" — das Summary sagte jeweils „Wiederherstellungsprobe: nicht gelaufen",
der Lauf blieb grün. Nur die zwei Handstarts vom 18.10. hatten je eine Probe. Seit dem 22.10.
lautet die Bedingung `github.event_name != 'workflow_dispatch' || inputs.restore_probe`;
Wächter: `scripts/workflows.test.mjs`. Beleg nach dem Merge: im nächsten Zeitplan-Lauf muss
Schritt „Wiederherstellung proben" auf `success` stehen und das Summary Zeilen in der Kopie
nennen. Lehre: Ein Summary, das „nicht gelaufen" meldet, gehört rot, nicht grün.

Nicht bewiesen: die Wiederherstellung in ein **echtes Supabase-Projekt** (dort existieren
`auth` und `storage` schon, siehe unten). Das ist bewusst Handarbeit im Ernstfall, einmal
geübt werden sollte es trotzdem — offen.

## Wiederherstellen (Ernstfall)

1. Artefakt laden: GitHub → Actions → „Supabase-Sicherung" → Lauf des gewünschten Tages →
   Artifacts, oder `gh run download <run-id> -n supabase-sicherung`.
2. Prüfsumme: `sha256sum -c supabase-<stamp>.dump.enc.sha256`.
3. Entschlüsseln (Passphrase aus der Offline-Ablage):
   ```
   openssl enc -d -aes-256-cbc -md sha256 -pbkdf2 -iter 600000 \
     -in supabase-<stamp>.dump.enc -out supabase-<stamp>.dump
   ```
4. Ansehen, was drin ist: `pg_restore --list supabase-<stamp>.dump | grep 'TABLE DATA'`.
5. **In ein frisches Supabase-Projekt:** zuerst in dessen SQL-Editor
   `create extension if not exists vector;`, dann die Migrationen aus `supabase/migrations/`
   per `supabase db push` einspielen (Schema aus Git ist die Wahrheit, der Dump liefert die
   Daten), danach nur die Daten:
   ```
   pg_restore --data-only --no-owner --no-privileges --disable-triggers \
     --schema=public -d "<NEUE SESSION-POOLER-URI>" supabase-<stamp>.dump
   pg_restore --data-only --no-owner --no-privileges --disable-triggers \
     --table=auth.users --table=auth.identities -d "<NEUE SESSION-POOLER-URI>" supabase-<stamp>.dump
   ```
   Reihenfolge wichtig: `auth.users` vor allem, was per Fremdschlüssel darauf zeigt —
   `--disable-triggers` schaltet die Prüfung während des Ladens ab.
6. Vercel-Variablen auf das neue Projekt umstellen (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`), Redeploy, Funktionsproben
   von Hand starten.
7. Urkunden-Druckdateien sind nicht im Backup: Für eine Bestellung, die schon gedruckt
   war, rendert „Probe" unter `/admin/urkunden` die Datei mit derselben Kennung neu.

**Nutzer müssen sich neu anmelden** (Sitzungen sind nicht im Backup) — Magic Link
funktioniert, Passwort-Hashes sind in `auth.users` enthalten.

## Wächter

- `data/ops-heartbeat.json`, Eintrag „Supabase-Sicherung" (Typ `artefakt`, mindestens 1 MB,
  Frist 2 Tage): schlägt an, wenn zwei Tage lang kein Artefakt ankommt — egal ob der Lauf
  nicht startet (GitHub schaltet Zeitpläne in ruhigen Repos nach 60 Tagen ab) oder vor dem
  Hochladen scheitert. Geprüft wird das Ergebnis, nicht der Lauf (CLAUDE.md §2 Regel 10).
- Scheitert der Lauf selbst, kommt ein Jira-Ticket `ops-db-backup-failed` (KAN).
- `scripts/workflows.test.mjs`: der Workflow verschlüsselt, bevor er hochlädt, und löscht
  den Klartext — der Test liest den Workflow-Text.

## Grenzen, ehrlich

- Rollierend 90 Tage. Älteres ist weg, es sei denn, jemand hat es offline gelegt.
- Ein Backup pro Tag: Verlust von bis zu 24 Stunden Daten ist möglich.
- Artefakt-Speicher zählt bei öffentlichen Repos nicht gegen ein Kontingent; bei
  ~60 MB je Tag sind das rund 5 GB im Umlauf. Sollte das Repo je privat werden, greift
  das 500-MB-Kontingent des Free-Plans — dann Frist senken oder Ziel wechseln.
- Passphrase-Verlust = Totalverlust der Backups. Die Passphrase liegt nicht im Repo,
  nicht in `.env.local`, nicht im Chat — nur im GitHub-Secret und offline.
