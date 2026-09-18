# Ops-Heartbeat — der Totmannschalter der Automation

**Angelegt 13.09.2026.** Grund: `recipe-grow` lief vom 27.08. bis 13.09.2026 jede
Nacht grün durch, in 48 Sekunden, und erzeugte kein einziges Rezept. Die
Seed-Liste in `scripts/recipe-agent.mjs` war nach 84 Einträgen abgearbeitet —
für den Workflow kein Fehler, also kein Alarm. Siebzehn Tage Stillstand fielen
erst auf, als Uwe die Rezeptseite ansah.

## Der Denkfehler, den das behebt

GitHub Actions kennt nur zwei Zustände: *durchgelaufen* und *abgebrochen*.
„Hat nichts produziert" ist im grünen Fall enthalten. Jeder Agent, der aus einem
Vorrat schöpft — Seeds, RSS-Quellen, Warteschlangen — kann deshalb leise
versiegen, während das Dashboard weiter grün leuchtet.

Der Heartbeat prüft daher **Ergebnisse statt Läufe**: *Wann kam aus diesem
Bereich zuletzt etwas heraus?*

## Wie es läuft

| | |
|---|---|
| Workflow | `.github/workflows/ops-heartbeat.yml`, täglich 09:00 UTC |
| Skript | `scripts/ops-heartbeat.mjs` (nur Node-Bordmittel, kein `npm ci`) |
| Prüfpunkte | `data/ops-heartbeat.json` |
| Lokal | `npm run heartbeat` (meldet, ohne rot zu werden) |

Der Wächter läuft bewusst ohne Abhängigkeiten: ein Wächter, der an einem
kaputten `npm ci` scheitert, ist keiner.

## Prüf-Typen

- **`git`** — wann wurde ein Pfad zuletzt verändert? (`content/rezepte`, …)
  Braucht `fetch-depth: 0`, sonst findet `git log` nichts.
- **`supabase`** — wie alt ist der neueste Datensatz? (`content_drafts`)
  Optionaler `filter` in PostgREST-Syntax, z. B. `status=neq.draft`.
  Optionales `wennLeer`: Liefert der Filter **noch nie** eine Zeile, zählt das
  Alter des **ältesten** Datensatzes aus `wennLeer.filter` gegen `maxTage`. Wartet
  auch dort nichts, ist der Punkt grün. Ohne `wennLeer` gilt „keine Zeile" sofort
  als überfällig. (Ergänzt 14.09.2026: „Content-Freigaben" schlug beim ersten
  Live-Lauf an, obwohl der älteste Entwurf erst 8 von 21 Tagen wartete.)
- **`http`** — antwortet die Live-Seite? Nachgerüstet am 14.09.2026: An diesem Tag
  lieferte `steakakademie.de` über Stunden **HTTP 402 / `DEPLOYMENT_DISABLED`** —
  der Vercel-Account war gesperrt, alle Deployments abgeschaltet. Der Heartbeat
  prüfte bis dahin nur, ob Inhalte *nachwachsen*, nicht ob sie *erreichbar* sind;
  der Ausfall fiel bloß zufällig an einem roten Check in einem Pull Request auf.
  Felder: `basis`, `pfade`, `erlaubt` (Standard `[200]`). Jede Route bekommt einen
  **zweiten Anlauf** vor dem Alarm — einzelne Routen antworten nach einem Kaltstart
  gelegentlich gar nicht, und ein Wächter, der bei jedem Zucken anschlägt, wird
  nach drei Fehlalarmen ignoriert. Vercels `x-vercel-error`-Header wandert in die
  Meldung, damit die Ursache gleich dabeisteht.
- **`workflow`** — wann ist ein Workflow zuletzt überhaupt gestartet?
  Deckt den Fall ab, dass **GitHub geplante Workflows in ruhigen Repos nach
  60 Tagen ohne Aktivität abschaltet** — dann läuft nichts mehr, und nichts
  wird rot, weil nichts läuft.

## Meldeweg bei Stillstand

1. **Job wird rot** → GitHub schickt die Fehlermail. Das ist der Kanal, der
   tatsächlich ankommt.
2. **GitHub-Issue** mit Label `ops-heartbeat` — eines, das aktualisiert und bei
   Besserung automatisch wieder geschlossen wird. Kein Issue-Regen.
3. **Jira-Ticket** (KAN) über `scripts/ops-alert-to-jira.mjs`, inklusive der
   bestehenden Eskalation ab dem dritten Vorfall.

## Neue Automation angelegt?

Dann gehört sie in `data/ops-heartbeat.json`. Felder:

```json
{
  "name": "Anzeigename",
  "typ": "git | supabase | workflow | http",
  "pfad": "content/…",            // typ git
  "tabelle": "…", "spalte": "…",  // typ supabase
  "filter": "status=neq.draft",   // typ supabase, optional
  "wennLeer": { "spalte": "created_at", "filter": "status=in.(draft,review)" },  // typ supabase, optional
  "datei": "name.yml",            // typ workflow
  "basis": "https://…",           // typ http
  "pfade": ["/", "/rezepte"],     // typ http
  "erlaubt": [200],               // typ http, optional
  "maxTage": 7,
  "hinweis": "Was zu tun ist, wenn das hier anschlägt."
}
```

`maxTage` großzügig über dem Takt ansetzen: ein wöchentlicher Lauf braucht
mindestens 10 Tage Frist, sonst schlägt der Wächter bei jedem Feiertag an und
wird nach drei Fehlalarmen ignoriert — dann ist er wertlos.

## Was dieser Wächter NICHT ist

Der `http`-Typ ist **keine Uptime-Überwachung**. Der Lauf ist täglich um 09:00 UTC;
ein Ausfall um 10:00 fällt also frühestens am nächsten Morgen auf. Für die
Content-Produktion ist das richtig — dort zählen Tage. Für die Erreichbarkeit der
Website zählen Minuten.

Was er leistet: Ein Ausfall, der über Nacht steht, wird am nächsten Morgen
garantiert gemeldet, statt zufällig entdeckt zu werden. Das ist eine Untergrenze,
keine Überwachung. Wer echte Uptime-Alarme will, nimmt dafür ein eigenes Werkzeug
(Vercel-eigene Benachrichtigungen oder einen kostenlosen Uptime-Dienst mit
1–5-Minuten-Takt) — nicht diesen Cron.

## Fehlende Secrets

Fehlen `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`, wird der
betroffene Prüfpunkt **übersprungen, nicht rot**. Ein Wächter, der wegen eines
fehlenden Secrets dauerrot steht, erzieht zum Wegschauen.
