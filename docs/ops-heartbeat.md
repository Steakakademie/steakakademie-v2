# Ops-Heartbeat — der Totmannschalter der Automation

**Angelegt 13.09.2026, zuletzt angepasst 03.10.2026.** Grund: `recipe-grow` lief vom
27.08. bis 13.09.2026 jede Nacht grün durch, in 48 Sekunden, und erzeugte kein einziges
Rezept. Die Seed-Liste in `scripts/recipe-agent.mjs` war nach 84 Einträgen abgearbeitet —
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
| Workflow | `.github/workflows/ops-heartbeat.yml`, täglich 09:00 UTC + Handstart |
| Skript | `scripts/ops-heartbeat.mjs` (die eigenen Prüfungen: nur Node-Bordmittel) |
| Prüfpunkte | `data/ops-heartbeat.json` |
| Zusagen-Belege | `scripts/zusagen-belege.mjs` gegen `data/zusagen.yaml` — laufen im selben Lauf mit (seit 03.10.2026) |
| Lokal | `npm run heartbeat` (meldet, ohne rot zu werden) |

Die eigenen Prüfungen des Wächters kommen bewusst ohne Abhängigkeiten aus: ein
Wächter, der an einem kaputten `npm ci` scheitert, ist keiner. Seit 03.10.2026 macht
der Workflow trotzdem ein `npm ci --ignore-scripts` — allein für die Zusagen-Belege,
die YAML lesen (`js-yaml`). Der Schritt darf scheitern (`continue-on-error`): Dann
prüft der Heartbeat seine eigenen Bereiche wie gewohnt und meldet die Belege als
**nicht geprüft** — das ist rot, reißt den Wächter aber nicht mit.

## Prüf-Typen

- **`git`** — wann wurde ein Pfad zuletzt verändert? (`content/rezepte`, …)
  Braucht `fetch-depth: 0`, sonst findet `git log` nichts.
  **`nurNeueDateien: true` (seit 03.10.2026): nur neu hinzugefügte Dateien zählen.**
  Ohne die Option stellt jeder Commit im Pfad die Uhr zurück — auch ein
  Tippfehler-Fix von Hand. Am 02.10.2026 meldete der Heartbeat „Glossar: vor
  8,8 Tagen" und meinte damit eine Hand-Korrektur vom 23.09.; die letzte Lieferung
  des Agenten war der 19.09. Mit der Option zählt nur ein Commit, der im Pfad eine
  Datei **hinzufügt** (`--diff-filter=A`; eine Umbenennung zählt nicht). Legt ein
  Mensch eine neue Datei an, zählt auch das. In einem flachen Klon bricht die
  Prüfung ab, statt ein falsches Datum zu melden.
- **`supabase`** — wie alt ist der neueste Datensatz? (`content_drafts`, `hoefe`)
  Optionaler `filter` in PostgREST-Syntax, z. B. `status=neq.draft`.
  Optionales `wennLeer`: Liefert der Filter **noch nie** eine Zeile, zählt das
  Alter des **ältesten** Datensatzes aus `wennLeer.filter` gegen `maxTage`. Wartet
  auch dort nichts, ist der Punkt grün. Ohne `wennLeer` gilt „keine Zeile" sofort
  als überfällig. (Ergänzt 14.09.2026: „Content-Freigaben" schlug beim ersten
  Live-Lauf an, obwohl der älteste Entwurf erst 8 von 21 Tagen wartete.)
- **`artefakt`** (seit 03.10.2026) — wann hat ein Workflow zuletzt ein Artefakt
  dieses Namens hochgeladen? Für Agenten, deren Ergebnis weder im Repo noch in der
  Datenbank landet: `social-grow` lädt seine Entwürfe als Artefakt `social-drafts`
  hoch. Ohne Entwürfe entsteht kein Artefakt — das Alter des jüngsten ist damit die
  Frage „wann kam zuletzt etwas heraus". Felder: `artefakt` (Name), `minBytes`
  (hält eine leere Hülle draußen, Standard 1). Abgelaufene Artefakte zählen nicht.
  Braucht `actions: read` (im Workflow gesetzt).
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

## Nicht geprüft ist rot (seit 03.10.2026)

Fehlt einer Prüfung ihr Zugang — Supabase-Secrets, GitHub-Token —, meldete sie
früher „übersprungen", und das zählte wie OK. So konnten Prüfungen stumm
wegfallen, der Lauf blieb grün und das Summary sagte „Automation lebt". Die
frühere Begründung („ein Wächter, der wegen eines fehlenden Secrets dauerrot steht,
erzieht zum Wegschauen") ist damit aufgegeben: Ein Wächter, der nicht hinsehen
kann, darf nicht „alles in Ordnung" melden.

Das Urteil kennt jetzt drei Zustände:

| Zustand | Bedeutung | Lauf |
|---|---|---|
| **steht** | mindestens ein Bereich überfällig oder Prüfung gescheitert | rot |
| **blind** | kein Stillstand, aber mindestens ein Bereich **nicht geprüft** | rot |
| **lebt** | jeder Bereich wurde geprüft und liefert | grün |

Nicht geprüfte Bereiche stehen im Job-Summary mit eigener Zeile („NICHT GEPRÜFT —
…") und eigener Überschrift, in Issue und Jira-Ticket mit dem Zusatz „(nicht
geprüft)", damit sie niemand als Stillstand liest.

## Prüfpunkte (Stand 03.10.2026)

Maßgeblich ist `data/ops-heartbeat.json` — dort steht zu jedem Eintrag auch der
Hinweis, was bei einem Anschlag zu tun ist.

| Bereich | Typ | Frist (Tage) | Was er sieht |
|---|---|---|---|
| Website erreichbar | `http` | — | `/`, `/rezepte`, `/diplome`, `/cuts` antworten mit 200 |
| Funktionsproben | `workflow` | 2 | `funktionsproben.yml` (täglich 05:23 UTC) startet noch |
| Rezept-Produktion | `git`, nur neue Dateien | 4 | neue Datei unter `content/rezepte` |
| Rezept-Workflow | `workflow` | 2 | `recipe-grow.yml` startet noch |
| Content-Entwürfe (Scout + Saison) | `supabase` | 10 | neuester Entwurf in `content_drafts` |
| Content-Freigaben | `supabase` | 21 | letzte Freigabe/Verwerfung, sonst ältester wartender Entwurf |
| Affiliate-Link-Prüfung | `workflow` | 10 | `check-affiliate-links.yml` startet noch |
| Hofladen-Import | `supabase` | 9 | frischer `letzter_import` in `hoefe` |
| Social-Entwürfe | `artefakt` | 9 | Artefakt `social-drafts` mit mindestens 300 Bytes |
| Wissensindex-Workflow | `workflow` | 2 | `index-knowledge.yml` startet noch |
| Wissensindex (RAG-Embeddings) | `supabase` | 7 | neuester `indexed_at` in `knowledge_embeddings` |

Neu am 03.10.2026:

- **Hofladen-Import** — der Wochenlauf (montags) setzt bei jedem geschriebenen Hof
  `letzter_import`. Anlass: Vom 15.09. bis 03.10.2026 scheiterten drei Cron-Läufe
  im Skript und wurden grün gemeldet.
- **Social-Entwürfe** — erster Eintrag vom Typ `artefakt`. Der Wächter sieht nur,
  *dass* Entwürfe entstehen, nicht, ob jemand sie abholt.
- **Funktionsproben** — der Eintrag sieht nur, *dass* die Proben starten. Scheitert
  eine Probe, meldet der Workflow das selbst (roter Lauf, Jira-Ticket über
  `scripts/ops-alert-to-jira.mjs`).

Entfernt am 03.10.2026:

- **Ideen-Radar** — die Automation ist gelöscht (`docs/ideen-radar.md`).
- **Glossar** — der Glossar-Agent ist pausiert: `glossary-grow.yml` hat keinen
  Zeitplan mehr, nur Handstart. Zeitplan und Eintrag gehören zusammen — wer den
  Zeitplan wieder einschaltet, trägt den Eintrag wieder ein (CLAUDE.md §2 Regel 10),
  sonst läuft der Agent erneut unbemerkt leer. `scripts/ops-heartbeat.test.mjs`
  hält das fest.

## Zusagen-Belege (seit 03.10.2026)

Nach den Bereichen aus `data/ops-heartbeat.json` laufen die Belege des
Zusagen-Registers mit: für jede Zusage auf der Seite die Frage, ob das, wovon sie
abhängt, noch steht. Register, Beleg-Typen und Zustände (gedeckt · gebrochen ·
abgelaufen · nicht prüfbar) stehen in **`docs/waechter.md`** — hier nur, was den
Heartbeat betrifft:

- **Ein Urteil, ein Meldeweg.** Die Belege erscheinen als Zeilen im selben
  Job-Summary und gehen in dasselbe Issue und dasselbe Jira-Ticket. Ein gebrochener
  oder abgelaufener Beleg macht den Lauf rot; „nicht prüfbar" ebenso — je Grund
  eine Zeile, nicht eine je Beleg.
- **`npm ci --ignore-scripts`** im Workflow dient nur dieser Prüfung (siehe „Wie es
  läuft"). Ist sie nicht ladbar, steht „Zusagen-Belege: nicht geprüft" im Summary.
- **Secret `LOOPS_API_KEY`** — für Belege vom Typ `loops` (nur lesende Aufrufe).
  Fehlt es, sind diese Belege „nicht prüfbar" und der Lauf wird rot. Belege vom Typ
  `supabase` nutzen dieselben Supabase-Secrets wie die Prüfpunkte oben.
- Lokal: `npm run zusagen:belege`.

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
  "typ": "git | supabase | artefakt | workflow | http",
  "pfad": "content/…",            // typ git
  "nurNeueDateien": true,         // typ git, optional: nur neu hinzugefügte Dateien zählen
  "tabelle": "…", "spalte": "…",  // typ supabase
  "filter": "status=neq.draft",   // typ supabase, optional
  "wennLeer": { "spalte": "created_at", "filter": "status=in.(draft,review)" },  // typ supabase, optional
  "artefakt": "social-drafts",    // typ artefakt
  "minBytes": 300,                // typ artefakt, optional
  "datei": "name.yml",            // typ workflow
  "basis": "https://…",           // typ http
  "pfade": ["/", "/rezepte"],     // typ http
  "erlaubt": [200],               // typ http, optional
  "maxTage": 7,
  "hinweis": "Was zu tun ist, wenn das hier anschlägt."
}
```

`maxTage` großzügig über dem Takt ansetzen: ein wöchentlicher Lauf braucht
mindestens 9–10 Tage Frist, sonst schlägt der Wächter bei jedem Feiertag an und
wird nach drei Fehlalarmen ignoriert — dann ist er wertlos.

Wird eine Automation entfernt oder pausiert, geht ihr Eintrag im selben Zug mit:
Ein Eintrag, der auf etwas zeigt, das es nicht mehr gibt, meldet dauerhaft
Stillstand, den niemand beheben soll.

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

Ob die Seite noch *tut*, was ein Besucher von ihr will, prüft er ebenfalls nicht —
dafür gibt es seit 03.10.2026 die Funktionsproben
(`.github/workflows/funktionsproben.yml`, `npm run proben`).
