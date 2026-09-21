# CLAUDE.md — Operating-Anker Steakakademie

> **Diese Datei lädt Claude Code bei JEDEM Session-Start automatisch.** Sie ist das
> persistente Gedächtnis und die Single Source of Truth fürs Projekt. Hier stehen:
> Rolle, harte Realität, nicht-verhandelbare Regeln, Struktur, offene Blocker.
> **Wenn etwas wichtig ist und überleben soll → hierher, nicht in den Chat.**
> Letzte Pflege: 16.06.2026.

---

## A. Umgebung & Verifikation — VOR jeder Arbeit lesen

> Diese Karte steht bewusst ganz oben und ist bewusst kurz. Jede Zeile hier hat
> mindestens einmal einen halben Arbeitstag gekostet. Sie steht hier und nirgends
> sonst — die frueher dafuer genutzte memory.md ist am 27.08.2026 entfernt (§ 6).

**Bauen und Pruefen**
- **Next 16 seit 17.09.2026 (PR chore/nextjs-16-upgrade), vorher 14.2.35 (EOL).**
  Was sich fuer jede Session aendert: (1) `npm run build` und `npm run dev` laufen
  **mit `--webpack`** — Turbopack ist in Next 16 Standard, aber `next-contentlayer2`
  loest `contentlayer/generated` darunter nicht auf (offenes Issue timlrx/contentlayer2#74).
  Nie das `--webpack` aus den Scripts entfernen, ohne das Issue geprueft zu haben.
  (2) `next lint` gibt es nicht mehr, `next build` lintet nicht mehr: Linting ist
  `npm run lint` (ESLint 9 Flat Config, `eslint.config.mjs`, nur `src/`). ESLint 10
  bricht mit dem gebuendelten eslint-plugin-react — auf 9.x bleiben.
  (3) `src/middleware.ts` heisst `src/proxy.ts` (Export `proxy`, Runtime Node).
  (4) `cookies()`, `headers()`, `params`, `searchParams` sind **asynchron** —
  `await createClient()` fuer den Supabase-Server-Client, `await props.params` in
  Pages. (5) `next dev` schreibt nach `.next/dev`, `next build` nach `.next` — die
  alte Regel „nach dem Build `.next` loeschen, bevor `dev` startet" ist damit hinfaellig.
- `node_modules` in diesem Arbeitsbaum ist eine **Windows-Installation**. Native
  Binaries (esbuild, swc) starten unter Linux nicht. **Im Arbeitsbaum selbst** kann
  eine Linux-Session deshalb nur lesen, aendern und Skripte pruefen.
  **Bauen und typechecken geht trotzdem — in einer eigenen Kopie (02.09.2026,
  korrigiert 04.09.2026 aus einem echten Verifier-Lauf in der Cowork-VM):**
  `git archive HEAD | tar -x -C "$HOME/verify-build" && cd "$HOME/verify-build" && npm ci`,
  dann `npx contentlayer2 build`, dann `npx tsc --noEmit`, dann `npx next build`
  (2 CPU: tsc 26 s, Build 2:23 min). Vier Dinge, die den Lauf sonst kosten:
  **(a) nicht nach `/tmp`** — dort darf die Cowork-VM nicht schreiben/raeumen
  (`rm: Operation not permitted`); `$HOME/verify-build` funktioniert.
  **(b) `contentlayer2 build` VOR `tsc`** — in einer frischen Kopie fehlt
  `contentlayer/generated`, tsc meldet dann ~271 Fehler, von denen keiner echt ist.
  **(c) `next build` ueberschreitet das 120-Sekunden-Fenster** eines Bash-Aufrufs und
  endet mit **124** — das ist abgeschnitten, nicht gescheitert: erneut aufrufen, der
  zweite Lauf nutzt den gefuellten Cache und endet mit 0. Nie als gruen und nie als
  kaputt werten. **(d) Netz-Egress ist vorhanden** (`git fetch`, `npm ci`, `npm ping`
  je Exit 0) — die frueher hier und in §4 notierte Aussage "lokale Cowork-VM hat
  keinen Netz-Egress" gilt so nicht mehr. Ausserdem: `pkill -f "next start"` killt
  in dieser Sandbox die eigene Shell mit (Exit 143) und verwirft die restliche
  Ausgabe — Aufraeumen gehoert in einen eigenen, letzten Aufruf.
  E2E dazu: `npx playwright install chromium`,
  fehlende `libXdamage.so.1` ohne root via `apt-get download libxdamage1` +
  `dpkg-deb -x` + `LD_LIBRARY_PATH`; `next start` und Tests im **selben** Bash-Aufruf
  starten (Hintergrundprozesse ueberleben den Aufruf nicht). Ergebnis dann per
  `cp` in den Arbeitsbaum zurueck. Details: docs/PERF-AUDIT-2026-09-02.md.
- **Eingeloggte Seiten sind auf einem Preview-Deployment NICHT testbar (04.09.2026).**
  Der Supabase-Auth-Callback leitet auf die hinterlegte Site-URL, und die zeigt auf die
  Produktion: Wer sich auf `*-git-*.vercel.app` anmeldet, landet auf steakakademie.de
  und traegt sein Cookie dort ein — auf der Preview bleibt er ausgeloggt. Der
  `redirectTo`-Parameter wird dabei ueberschrieben. Anonym pruefbar ist nur, DASS das
  Zugangstor greift (307 auf `/auth/login`). Fuer den Inhalt hinter dem Tor gilt: am
  Quelltext beweisen (Bedingung + Datenlage, z. B. `checkoutUrl` ist bei allen
  Eintraegen `null`, also kann der Zweig nicht rendern) und den Blick auf die
  Produktion nach dem Merge verschieben — oder das Passwort-Formular der Preview
  nutzen, das ohne Umleitung auskommt. Nie als "geprueft" ausgeben, was nur gelesen wurde.
- **Ein gruener `next build` beweist bei DYNAMISCHEN Routen nichts ueber den Lauf
  (06.09.2026).** `/relaunch/suche` liest `searchParams`, wird also erst beim Aufruf
  gerendert. Der Build war gruen, die Seite lieferte trotzdem 500:
  `(0 , c.s) is not a function`. Ursache: eine gewoehnliche Funktion (`relaunchHref`)
  lag in einer `'use client'`-Datei; ein Server-Bauteil bekommt von dort keine Funktion,
  sondern einen Client-Verweis. Zwei Regeln daraus: **gemeinsam genutzte Logik nie in
  ein `'use client'`-Modul legen** (eigene Datei unter `src/lib/`), und **jede mit `f`
  markierte Route im Build-Report einmal wirklich aufrufen** (`curl -o /dev/null -w
  '%{http_code}'`), bevor sie als geprueft gilt.
- **Exitcode pruefen, immer.** Ein Befehl, der nichts ausgibt, ist nicht gruen.
  `timeout` liefert Exitcode 124 — das ist ein Abbruch ohne Ergebnis, kein Bestehen.
- Ein voller Typecheck passt **nicht** in ein 45-Sekunden-Fenster. Nicht anfangen,
  sondern uebergeben.
- Schnelle Alternative ohne native Binaries: TSX-Syntax ueber den TypeScript-Parser
  (`ts.createSourceFile(...).parseDiagnostics`). Faengt Syntax, **keine Typen** —
  und genau so ist es zu berichten.

**Git**
- Vor jeder Aussage zu `ahead`/`behind`: **erst `git fetch`**. Ohne das ist
  `origin/main` in diesem Arbeitsbaum beliebig alt.
- **main ist seit 01.09.2026 durch GitHub Branch Protection geschuetzt.**
  Direct-Push auf main ist blockiert. Ablauf fuer jede Code-, AGB-, Content- oder
  Styling-Aenderung: eigener Branch (`feature/...` oder `fix/...`) → Push auf
  diesen Branch → Vercel baut ein Preview-Deployment mit denselben Gates wie die
  Produktion (`check-mdx-komponenten`, `check-redaktionsvorbehalt`,
  `check-startseiten-hierarchie`, Linter) → Pull Request nach main.
- **Die Gates sind seit 04.09.2026 ein echter Riegel — vorher waren sie es nicht.**
  Bei PR #46 nachgesehen: "Require status checks to pass" war zwar an, die Liste
  darunter aber leer ("No required checks"). Ein roter Gate-Lauf haette den
  Merge-Button also nicht aufgehalten, und "Require branches to be up to date"
  war wirkungslos mit — das greift erst ab dem ersten eingetragenen Check.
  **Pflicht sind seit dem Abend des 05.09.2026 diese drei** — die Namen exakt
  so, wie sie gemeldet werden: `P0-Gates pruefen`, `Stille Content-Defekte
  prüfen` und `Build pruefen` (alle drei Quelle GitHub Actions, Check-Runs).
  Bewusst NICHT Pflicht: "Rechtschreibung (nur Bericht)" — der Name ist
  Programm, er meldet und blockiert nicht — sowie seit dem 05.09. auch
  **Vercel** (siehe uebernaechster Punkt).
  Merke: Ein aktivierter Schutzschalter ohne Inhalt sieht im UI genauso aus wie
  ein scharfer. Wer sich auf einen Riegel verlaesst, sieht einmal nach, ob eine
  Liste dahinter steht.
- **Content-Quality-Gate seit 21.09.2026** (`scripts/check-content-qualitaet.mjs`,
  Regeln in `scripts/lib/content-qualitaet.mjs`, Vokabular in `data/taxonomie.yaml`):
  haengt in `npm run check` und blockiert damit ueber `P0-Gates pruefen` —
  Abbrueche, Wortdopplungen, Fahrenheit-Reste, Kerntemperatur unter Sicherheitswert,
  Tierart-Konflikte, Glossar-Dubletten. Dieselben Regeln laufen im recipe-agent und
  glossary-agent VOR dem Schreiben. Altbestand steht in
  `data/content-qualitaet-baseline.json` (Ratchet): **beheben, nie von Hand
  eintragen**; nach einer Korrektur `npm run check:qualitaet:baseline`. Bewusst
  nicht im prebuild (Audit 27.08., Regel 5). Vision-Check der Hero-Bilder
  (`check-bild-motiv.mjs`) laeuft im PR nur als Bericht.
- **Vercel wurde erst am 05.09.2026 Pflicht — der Punkt darueber hat es seit
  dem 04.09. faelschlich behauptet.** Was die Luecke gekostet hat: PR #52
  (Ideen-Radar, Bot-PR mit Auto-Merge) wurde am 05.09. um 14:38:14 UTC gemergt,
  der Vercel-Build startete um 14:40:21 UTC — der Auto-Merge hat auf ihn nicht
  gewartet, weil er nur auf die *eingetragenen* Kontexte schaut. `4057b24` ist
  so ohne Vercel-Gate auf main gelandet (der Build wurde nachtraeglich gruen).
  Lehre: Was hier ueber einen Riegel steht, ist eine Behauptung, bis
  `gh api repos/Arkamas/steakakademie-v2/branches/main/protection` sie belegt.
  Ein falsch geschriebener Kontext ist dabei die teurere Variante — er wird nie
  gruen gemeldet und blockiert jeden PR dauerhaft. Deshalb den Namen vor dem
  Eintragen aus `gh api repos/.../commits/<sha>/status` bzw. `.../check-runs`
  eines echten PR-Kopfes abschreiben, nie tippen.
- **`Build pruefen` ist seit 05.09.2026 der Bau-Riegel, und Vercel ist wieder
  optional.** Warum in dieser Reihenfolge: Vercel war der einzige Pflicht-Check,
  der ueberhaupt baut — ein Fremdanbieter als alleiniges Bau-Gate. Meldet der
  einmal nicht (Ignored Build Step, pausiertes Projekt, getrennte GitHub-App,
  Fork-PR), haengt jeder PR unbefristet, und `enforce_admins: true` laesst
  niemanden vorbei. Ob im Vercel-Dashboard ein Ignored Build Step steht, ist aus
  dem Repo **nicht einsehbar** (die Vercel-MCP gibt das Feld nicht heraus) — es
  gab also keine Garantie, dass Vercel immer meldet.
  `.github/workflows/build-gate.yml` liefert denselben Schutz jetzt repo-eigen:
  contentlayer → tsc
  → `next build`, rund 2,5-3 min. Vercel baut weiter und meldet weiter, nur
  blockiert es nicht mehr.
  Belegt statt behauptet (05.09.): mit ausstehendem `Build pruefen` meldete
  GitHub an PR #56 `BLOCKED` und verweigerte den Merge ("the base branch policy
  prohibits the merge"), nach gruenen Checks `CLEAN`. Erst danach ist Vercel aus
  der Liste geflogen.
  Was der Gate NICHT leistet: er baut ohne jede Env-Variable. Supabase-gestuetzte
  Bereiche rendern dabei leer (`content-feed.ts`/`bbq-news.ts` verzweigen auf die
  ANWESENHEIT der Variablen). Er beweist Uebersetzung und Durchlauf, nicht die
  Datenlage. Platzhalter waeren schaedlich — mit erfundenem Wert wuerde zur
  Bauzeit ein Host angefragt, den es nicht gibt.
- **Node hat seit 05.09.2026 genau eine Quelle: `.nvmrc` (Inhalt `24`).** Alle
  21 setup-node-Stellen in 20 Workflows lesen sie ueber `node-version-file:
  .nvmrc` (auto-fix.yml nutzt kein setup-node), und `engines` in package.json
  grenzt sie mit **`>=24 <25`** nach oben ab. Vorher stand die Zahl 21-mal hart
  im Repo — ein Upgrade haette 21 Dateien angefasst und beim ersten vergessenen
  Treffer still auseinanderlaufen lassen. Anheben heisst jetzt: `.nvmrc` und die
  `engines`-Grenze aendern, sonst nichts.
  **Warum die Obergrenze `<25` und nicht das offene `>=24`:** Vercel waehlt die
  Node-Version anhand von `engines`. Bliebe die Grenze offen, wuerde die
  Produktion beim naechsten Major von selbst springen — ohne PR, ohne gruenen
  Gate, ohne dass jemand es entschieden hat. Mit `<25` bleibt der Sprung eine
  Aenderung, die durch die Pflicht-Checks muss.
  `.nvmrc` steht bewusst auf `24` und nicht auf einer Patch-Version: das Vercel-
  Projekt meldet `nodeVersion: 24.x`, also ebenfalls einen Bereich. Ein fester
  Patch im Repo wuerde von Vercel wieder abweichen, sobald die dort nachziehen —
  genau die Spreizung, die hier abgeschafft wurde. Welche Version ein Lauf
  tatsaechlich zieht, steht im Log (`node: v24.20.0` am 05.09.).
  Warum ueberhaupt 24: dieselbe Hauptversion wie die Produktion. Ein Gate auf
  einer anderen Version kann gruen sein, waehrend der Deploy scheitert.
  Vorher lag der Gate auf 22 und die uebrigen Workflows auf 20, waehrend die
  Produktion schon auf 24 baute. Ein Gate auf einer anderen Hauptversion als die
  Produktion kann gruen sein, waehrend der Deploy an etwas scheitert, das erst
  dort auftritt — der Riegel haette dann genau die Klasse Fehler durchgelassen,
  fuer die es ihn gibt. Reihenfolge beim Anheben: erst der Gate allein und
  belegt gruen (`node: v24.20.0` im Lauf-Log, nicht nur `node-version: 24` in
  der Datei), dann der Rest. Wer die Version wieder aendert, aendert den
  Cache-Schluessel in build-gate.yml mit (`...-node24-next-...`) — ein Cache aus
  einer anderen ABI gehoert nicht in den Lauf.
- Reihenfolge bleibt **commit → `npm run build` → push**, nur jetzt auf den
  Branch statt auf main. Ohne lokalen Build vorher wird das Preview rot statt
  der Produktion — aber rot bleibt rot: Vier rote Deployments am 26.08. kamen aus
  genau dieser Vertauschung.
- Die Frage, ob die Gates den Merge-Button sperren oder nur informativ laufen,
  ist mit dem Punkt oben beantwortet: drei Kontexte sperren, alles andere laeuft
  informativ mit ("Rechtschreibung", "Abmahn-Regressionen"). **Netlify stand hier
  bis 13.09.2026 mit in der Liste — die Anbindung ist seitdem abgebaut (§ 4).**
- **Nie `git add -A`**, auch nicht auf ein Unterverzeichnis. Immer Pfade einzeln
  nennen — sonst wandert uncommitteter Fremdstand mit (Regel 9).
- Ein Linux-Zugriff ueber die Ordner-Bruecke darf keine Dateien loeschen. git legt
  bei jedem Index-Zugriff `.git/index.lock` an und kann sie danach nicht raeumen:
  Lock nach `.git/_to_delete/` **verschieben**, dann weiterarbeiten.
- **`git reset --hard` (und vermutlich `git pull`/`git checkout <ref>` mit vielen
  geaenderten Dateien) NIE ueber die Ordner-Bruecke (07.09.2026).** Reset versucht,
  jede Tracked-Datei per unlink+neu zu schreiben — das scheitert im Mount fuer
  praktisch die gesamte Datei-Liste ("unable to unlink old ..."), bricht mit
  `fatal: Could not reset index file` ab, OHNE den Arbeitsbaum sichtbar zu
  beschaedigen (git haelt Index/HEAD dabei konsistent zum letzten Commit — mit
  `git status`/`git diff --stat HEAD` bestaetigt, keine echte Korruption). Trotzdem:
  Schreck und Zeitverlust vermeidbar. Um lokal `main` wieder an `origin/main`
  anzugleichen, wenn mehrere Dateien abweichen: **Uwe selbst in PowerShell**
  (`git fetch && git reset --hard origin/main`) — dort ist es ein normaler,
  schneller Vorgang ohne Mount-Beschraenkung. Einzelne Dateien (`git checkout --
  <pfad>`) und der Lock-Workaround oben bleiben ueber die Bruecke unproblematisch.
- **Tag `archiv/formulierungen-bot-pat` (05.09.2026):** hält die getrennten Commits
  22b1a1e und 8a51086 (BOT_PAT-Formulierungen, vor #50 per Squash zu main verschmolzen)
  dauerhaft erreichbar — ohne den Tag wäre 8a51086 nach dem Entfernen des zugehörigen
  Worktrees nur ~30 Tage über die Reflog-Frist auffindbar gewesen
  (gc.reflogExpireUnreachable). Auf origin gepusht, siehe `git tag -l archiv/*`.

**Frischer Klon: erst `supabase link`**
- `supabase/.temp/` ist seit 02bdb71 (31.08.2026) ignoriert. In einer neuen
  Arbeitskopie fehlen damit `linked-project.json`, `project-ref` und `pooler-url` —
  die Supabase-CLI ist dort **erst nach einmaligem `supabase link`** einsatzbereit.
  Wer stattdessen anfaengt, einen kaputten CLI-Zustand zu debuggen, sucht am
  falschen Ende. Kein Zugangsdatum betroffen: `pooler-url` hat die Form
  `postgresql://user@host:port/db` und enthaelt **kein** Passwort (in der History
  nachgeprueft, das Repository ist oeffentlich).

**Admin-Erkennung (05.09.2026)**
- Der Vergleich mit `ADMIN_PASSWORD` steht NUR in `src/lib/admin-auth.ts`
  (`istAdminPasswort`). Nie wieder `cookie === process.env.ADMIN_PASSWORD` inline:
  fehlt die Variable, ist `undefined === undefined` wahr und jeder Besucher Admin —
  /admin, /api/admin/*, /api/pm-agent/*, Volltexte der Bezahl-Lektionen. Sechs solche
  Stellen sind am 05.09. auf die Funktion gezogen worden. Ob `ADMIN_PASSWORD` auch im
  Vercel-**Preview**-Scope gesetzt ist, ist aus dem Repo nicht einsehbar — nachsehen.

**Deployment-Status ohne Raten**
- Vercel `projectId: prj_h30tTBcRtSAiIjluBXn8lu5xRUMg`,
  `teamId: team_tEPqF2rHcoOrrPEGRD7Q4hl8` — damit liefert die Vercel-MCP
  `state: READY|ERROR` je Commit. Env-Variablen kann sie **nicht** lesen.

**Netlify ist abgebaut (13.09.2026) — es gibt genau einen Deploy-Weg: Vercel**
- Im Repo liegt **keine** Netlify-Konfiguration mehr: kein `netlify.toml`, keine
  Netlify-Abhaengigkeit in package.json, kein Netlify-Schritt in einem Workflow.
  Was bis zum 13.09.2026 noch auf Netlify zeigte, waren ausschliesslich Kommentare
  und Doku-Saetze — sie sind in diesem Zug auf Vercel korrigiert worden. Wer
  „Netlify" im Repo findet, findet damit eine historische Notiz, keine Mechanik.
  Eine Ausnahme ist offen geblieben: der Kommentar in
  `.github/workflows/build-guard.yml` („blockiert NICHT den Vercel/Netlify-Deploy")
  — Workflow-Dateien sind gegen Schreibzugriffe aus der Cowork-Bruecke gesperrt,
  das aendert Uwe von Hand oder Claude Code lokal.
- Die Netlify-Checks an PRs (Redirect rules, Header rules, Pages changed,
  deploy-preview) stammen aus der **Netlify-GitHub-App plus der Site-Konfiguration
  im Netlify-Dashboard**, nicht aus dem Repo. Sie verschwinden erst, wenn die
  Verbindung dort geloest ist — das ist ein Handgriff im Dashboard, kein Commit.
- Belegter Anlass: Das Netlify-Team hat am 13.09.2026 das Build-Minuten-Kontingent
  des Free-Plans aufgebraucht („builds will be paused"). Die Minuten gingen fuer
  Deploys drauf, die niemand ausliefert — die Produktion laeuft seit dem
  13.08.2026 auf Vercel.
- **Zweiter Grund, wichtiger als die Minuten:** Die Netlify-Kopie
  `steakakademie-de.netlify.app` ist am 13.09.2026 live und liefert
  `meta-robots: index, follow` — eine vollstaendige, crawlbare Zweitfassung der
  Seite. Der Canonical zeigt auf die Hauptdomain, das ist der einzige Schutz.
  Drei Wochen vor dem Launch gehoert diese Kopie offline, nicht nur pausiert.
- **Was dazu im Dashboard noch zu tun ist** (nur Uwe, kein Commit moeglich):
  Site in Netlify loeschen oder mindestens die GitHub-Verbindung trennen
  (Site configuration → Build & deploy → Continuous deployment → „Unlink
  repository"), danach die Netlify-App aus dem GitHub-Konto entfernen
  (GitHub → Settings → Applications → Installed GitHub Apps → Netlify).
  Erst dann verschwinden die Netlify-Checks aus neuen PRs.

**Startseite**
- Es gibt zwei Varianten. `/` = A (dunkel), `/home-b` = B (Editorial Ember,
  Texas-Monthly-Layout). Die Middleware teilt nur zu, wenn **`AB_HOME_ENABLED === '1'`**.
  Steht der Schalter anders, bekommt **jeder** Besucher A — auch Uwe. Wer eine
  Aussage ueber „die neue Startseite" trifft, prueft vorher diesen Schalter.
- **Relaunch 2026-09 laeuft PARALLEL unter `/relaunch` (seit 05.09.2026, noindex).**
  Neues Design aus `handoff/website-relaunch/` (README dort ist verbindlich). Die
  Alt-Site ist archiviert, nie geloescht: Tag `archiv/website-v1-2026-09`, Branch
  `archiv/website-v1`, Abbild `C:\Dev\_archiv\`. Umschalten erst, wenn die Kriterien
  in `docs/website-relaunch-2026-09.md` gruen sind — Mobile-Nav, Login und
  Cut-Detailseite sind laut Handoff bewusst NICHT entworfen und werden nicht erfunden.
  Launch 01.10.2026 bleibt mit dem alten Stand.

**Playwright: Consent-Banner zuerst (Uwe, 02.09.2026)**
- Das DSGVO-Banner liegt `fixed` unten und faengt Klicks/Hover im unteren Viewport
  ab. Ein Timeout dort ist eine Ueberdeckung, keine Regression. Seit 02.09.2026 startet
  jeder E2E-Test mit getroffener Consent-Entscheidung (`storageState` in
  playwright.config.ts); Banner-Tests heben das gezielt auf — tests/e2e/helpers/consent.ts.

**Berichtspflicht**
- Jede Uebergabe nennt ausdruecklich, **was NICHT geprueft wurde**. „Gates gruen"
  ohne den Satz, dass Build und Typecheck nicht liefen, ist eine Falschaussage.

---

## 0. Meine Rolle — Projekt-Director

Ich (Claude) bin der **Projekt-Director** der Steakakademie. Oberste operative Instanz
über dem Agenten-System — human-gated durch **Uwe Yendell** (Inhaber, finale Freigabe).

**Verhalten (nicht verhandelbar):**
- Ich priorisiere **ruthless** nach harter Realität, nicht nach Lust.
- Ich hole Uwe bei Abschweifen („ADHS-Ding") zurück auf das, was Umsatz & Struktur bringt.
- Ich liefere **fertige Outputs + nächsten konkreten Schritt**, keine Entwürfe mit Fragezeichen.
- Ich bin rechenschaftspflichtig dafür, dass die Agentur-Struktur **eine Struktur bleibt**.
- Maßstab: international anerkannte Agentur-Standards, AI-first, wirtschaftlich stabil.

**Mandat (erweitert, 03.07.2026):**
- Eigenständige Planung, Umsetzung und Kontrolle aller Projektbereiche — auf Anfrage
  ein strukturierter **Status-Report** (Ist-Einschätzung in einem Satz, Struktur-Übersicht,
  Produkt-Lifecycle-Matrix Fertig/In Entwicklung/In Planung, Risiko-Priorisierung).
- Aktives Einbringen von Einwänden, wenn Ideen/Entscheidungen das bestmögliche Ergebnis
  gefährden — auch gegen Uwes Meinung.
- Proaktive Hinweise bei liegengebliebenen Aufgaben, gerissenen Fristen oder Kursabweichung.
- **Technische/Daten-Inkonsistenzen (Git-Korruption, kaputte Skripte, halluzinierende
  Hooks, Datei-Korruption) werden bei Entdeckung autonom korrigiert** — analog zu Regel 6
  (Rechtssicherheit), aber verallgemeinert auf technische Integrität. Danach Uwe informieren,
  was gefixt wurde. Human-gated bleibt strikt: Marketing/Publishing/Außenauftritt (Regel 4)
  sowie alles Kostenpflichtige.

---

## 1. Harte Realität (Stand-Anker, zuletzt aus PROJECT_STATUS 04.06.2026)

- **Verkaufsfähigkeit: 52 %** (Ziel 80 %). Das ist die Wahrheit, nicht das Gefühl.
- **Schwächste Bereiche zuerst:** Content-Strategie **17 %**, **Monetarisierung 22 %**.
  → Hier entsteht (k)ein Umsatz.
- **Stärken:** Tech-Stack 76 %, Infrastruktur 75 %, KI-System 58 %, Avatar 57 %.
- **Director-Klartext:** Doku & Rollen sind jetzt gut. Es fehlt **Execution am Geld**:
  Traffic-Asset + Funnel + bezahlbares Produkt. Struktur ≠ Selbstzweck.

> ⚠️ Diese Zahlen sind ein Schnappschuss vom 04.06.2026. Sobald wieder ein
> Generator/Update läuft, hier aktualisieren. Bis dahin: als Richtgröße behandeln,
> nicht als tagesaktuell.
>
> **Korrektur 10.08.2026 (Konsistenz-Audit):** Die früher hier geführten Nullwerte
> „Auth & Community 0 %" und „Agenten & Automation 0 %" waren **nachweislich falsch**
> und wurden entfernt — Supabase-Auth/Magic-Link ist live verifiziert, und es laufen
> 16 GitHub-Actions-Workflows (Glossar-, Rezept-, Content-Wachstum, Link-Checker,
> Build-Guard, GEO-Check, Ops-Alert→Jira). Neue Prozentzahlen bewusst **nicht**
> geschätzt — erst wieder messen, dann eintragen (Regel 7).

---

## 2. Nicht-verhandelbare Regeln (gelten für ALLE Agenten/Outputs)

1. **Recht & Compliance zuerst.** Insb. **Werbekennzeichnung** (LG Köln 12.05.2026):
   „Werbung"/„Anzeige" sichtbar im Grid/Vorschaubild VOR dem ersten Klick; „Ad" zählt
   nicht. Details: `marketing_agent.txt` → Sektion WERBEKENNZEICHNUNG.
2. **Fakten-Genauigkeit (Regel 8c).** Temperaturen/Cuts/Reifung NIE raten — kanonische
   Referenz `data/kerntemperatur-referenz.yaml`. Genauigkeit = stärkster Burggraben.
3. **Marken-DNA** (`marketing_agent.txt`): Ton, Farben (#C8882A/#E85018/#120C07),
   **kein persönlicher Auftritt von Uwe** (Avatar-System Marco/Jonas/Elena).
   **Uwe ist auch keine Autorenstimme (Uwe, 06.09.2026: „Uwe Yendell als Sprachstimme raus").**
   Fachartikel zeichnen die Personas: Marco (Technik, Cuts, Kerntemperaturen),
   Elena (Food Science, Fleischkunde, Fonds), Jonas (Einsteiger, Equipment, Rubs).
   Uwe bleibt **sichtbar als fachlich Verantwortlicher** — das ist Pflicht
   (Art. 50 KI-VO) und das einzige E-E-A-T-Signal eines echten Menschen; ohne ihn
   stünden 145 Artikel von KI-Personas ohne Mensch dahinter. Konkret: `author`/
   `authorSlug` im Frontmatter nie `uwe-yendell`, aber jede Persona-Seite trägt
   „KI-Persona · fachlich verantwortet von Uwe Yendell", und unter Cut-, Methoden-,
   Rezept- und Streitfall-Texten steht `<AutorHinweis>` (src/components/). Der Satz
   „basiert auf eigener Praxiserfahrung" gilt nur für `realPerson: true` — bei einer
   Persona wäre er eine Falschaussage.
4. **Human-gated:** Agenten produzieren Entwürfe, **Uwe gibt frei**. Kein Auto-Posting.
   *Präzisierung Rezepte (Uwe, 13.09.2026):* Bei `content/rezepte/` **ist der PR-Merge
   die Freigabe**. `recipe-grow` läuft mit `auto-merge: false`; ein Rezept kann `main`
   nicht erreichen, ohne dass Uwe den PR von Hand mergt, und der Merge-Commit ist der
   datierte Prüfnachweis, an dem der Redaktionsvorbehalt hängt (Art. 50 Abs. 4 KI-VO).
   Deshalb schreibt der Agent `status: published` / `reviewed: true` — beides wird erst
   mit dem Merge wahr. **Ungeprüft durchwinken macht diese Zeilen zur Falschaussage und
   zieht der KI-Kennzeichnungsbefreiung den Boden weg.** `reviewedAt` setzt weiterhin
   nur Uwe von Hand. Für `content/artikel/`, Streitfälle und Glossar gilt das NICHT —
   dort bleibt der getrennte Freigabeschritt (`nurVeroeffentlicht()`-Filter).
5. **No black-hat:** kein Spam, Mass-Follow, Fake-Entities.
6. **Rechtssicherheit → autonom fixen (Uwe, 01.07.2026).** Was Claude bei einem Audit
   feststellt und was **zu mehr Rechtssicherheit führt, wird SOFORT autonom umgesetzt**
   (Code + committen + pushen) — **kein** vorheriges Freigabe-Warten. Gilt für den
   Rechts-Update-Scanner **und jedes weitere/zukünftige Audit**. Diese Regel überschreibt
   ausdrücklich das „nur Report, kein Commit" des Scanner-Auftrags. Abgrenzung zu Regel 4:
   Human-gated bleibt für Marketing/Publishing/Außenauftritt; **defensive Compliance-Fixes
   (AGB, Datenschutz, Impressum, Widerruf, KI-Disclaimer, Kennzeichnung) laufen autonom**.
   Danach Uwe kurz informieren, was gefixt wurde.
8. **Startseiten-Hierarchie: INHALT ZUERST (Uwe, 20.08.2026).** Der erste Bildschirm
   gehört dem Thema, nicht dem Angebot: H1 → Rubriken-Einstieg (Cuts, Grilltechniken,
   Wissen, Rezepte, Ausrüstung) → erst danach der Mitglieder-CTA. Das Ausbildungs-
   angebot (Diplome) erscheint als Teaser **weiter unten**, nie above the fold.
   **Auflösung des Widerspruchs zu Abschnitt 5:** „Umsatz zuerst" ist eine
   *Arbeits*priorität (woran gebaut wird), **keine Layout-Priorität** (was oben steht).
   Wer beides verwechselt, schiebt das Diplom nach oben — genau das ist mehrfach
   passiert. Abgesichert durch `scripts/check-startseiten-hierarchie.mjs` (Build-Gate,
   läuft im prebuild). Reihenfolge ändern = Soll-Liste im Skript bewusst anpassen UND
   hier vermerken. Nicht durch stilles Umsortieren in `page.tsx`.
   **Aufmacher zuerst — ENDGÜLTIG (Uwe, 27.08.2026) — aufgehoben am 02.09.2026, siehe
   nächsten Absatz:** Der Magazin-Aufmacher
   (HERO, neuester veröffentlichter Inhalt) steht an Position 1, davor nichts.
   Danach: Artikel-Reihe, Value-Prop-Band mit H1 + Rubriken, Werkzeuge, Rest wie
   gehabt. Diese Entscheidung war schon einmal gefallen und wurde später über den
   „Soll-Liste bewusst anpassen"-Weg wieder umgestoßen — dieser Ausweg ist für
   Position 1 deshalb GESCHLOSSEN: das Gate erzwingt HERO an Position 1 jetzt
   unabhängig von der Soll-Liste (Riegel im Skript). Aufheben kann das nur Uwe
   selbst, mit wörtlichem Zitat und Datum an dieser Stelle. Für Abschnitte ab
   Position 3 gilt der alte Änderungsweg weiter. Der Aufmacher speist sich
   automatisch aus dem neuesten veröffentlichten Inhalt
   (src/lib/startseiten-artikel.ts, Redaktionsvorbehalt berücksichtigt) — die
   frühere Platzhalter-Liste ist nur noch Auffüll-Fallback. Neue Inhalte
   freigeben = Startseite dreht sich von selbst.
   **Kopfbereich = Value-Prop-Band, Aufmacher danach, Button unter den Fold
   (Uwe, 02.09.2026 — wörtlich, Cowork-Chat, mit zwei Screenshots):** „Folgendes
   tauschen. Bild 1 an die Stelle von Bild 2 verschieben. Den großen Quadratischen
   Button nach unten setzen. Bild 1 war die eigentliche Headbereich-Website. Was mich
   aber stört ist der große Button auf den ersten Blick." (Bild 1 = Value-Prop-Band
   mit H1 + Rubriken, Bild 2 = Magazin-Aufmacher.) Damit ist die 27.08.-Entscheidung
   auf dem dafür vorgesehenen Weg aufgehoben. Gültige Reihenfolge seitdem:
   1 VALUE-PROP-BAND (H1 + Rubriken, **ohne** Mitglieder-Button) → 2 HERO →
   3 SECONDARY ARTICLES → 4 MITGLIEDER-CTA (der Gold-Button „Werde SteakAdemiker",
   eigener schmaler Abschnitt unter der Artikel-Reihe) → Werkzeuge → Rest wie gehabt.
   Der Riegel im Skript erzwingt jetzt Positionen 1–4; neue Zusatzregel: oberhalb
   des HERO darf **kein** `/auth/login`-CTA stehen (Button nicht auf dem ersten
   Bildschirm). Aufheben wieder nur Uwe selbst, mit wörtlichem Zitat und Datum hier.
   Variante B (`/home-b`) hat ein eigenes Layout und ist von diesem Tausch nicht
   berührt.
   **A/B-Test „Editorial Ember" (seit 26.08.2026):** `/` wird per Cookie `sa_ab_home`
   50/50 gesplittet (src/proxy.ts, bis Next 16 src/middleware.ts). Variante B = interner Rewrite auf `/home-b`
   (noindex, Canonical auf `/`): dieselbe page.tsx, eingehüllt in den hellen
   `.theme-ember`-Layer (globals.css, Palette aus texasmonthly-ref/ideas.md „Editorial
   Ember"). Inhalte + Doktrin-Reihenfolge identisch — das Gate prüft weiterhin die eine
   Quelle. Messung: /api/newsletter hängt für B-Besucher `-vb` an die Loops-source
   (Vergleich in Loops: Anmeldungen mit/ohne Suffix). Test beenden = Middleware-Block
   entfernen + Gewinner-Look fest verdrahten.

8b. **Lerninhalte: erst planen, dann schreiben (kodifiziert 26.08.2026).** Diese Regel
   wurde seit dem Curriculum-Abgleich zweimal zitiert, war aber nie definiert — hiermit
   nachgeholt. Bevor eine Diplom-Lektion, ein Kursmodul oder eine Lerneinheit **geschrieben**
   wird, liegt ein **Konzept** vor, das Uwe freigibt. Das Konzept benennt verbindlich:
   (a) **Lernziel** in einem Satz — was kann der Lernende danach, was er vorher nicht konnte;
   (b) **Elemente** — welche Bausteine die Einheit enthält (Text, `<Schnelluebersicht>`,
   `<TempBox>`, `<Achtung>`, `<ProTipp>`, Bild, Video, Quiz, interaktive Lernmethode aus
   `roadmap/page.tsx`), und in welcher Reihenfolge;
   (c) **Umfang** — Zielwortzahl bzw. Videolänge, damit Tiefe nicht dem Zufall überlassen bleibt;
   (d) **Faktenquellen** — welche Werte aus `data/kerntemperatur-referenz.yaml` oder welcher
   belegten Quelle stammen (Regel 8c gilt unverändert);
   (e) **Prüfungsbezug** — welche Frage der Stufenprüfung diese Einheit beantwortbar macht.
   Erst nach Freigabe wird produziert. Grund: Lektionen ohne vorherige Element-Planung
   geraten zu gleichförmigem Fließtext ohne Prüfungsbezug — genau das ist bei den 35
   bestehenden Lektionen passiert (durchweg 320–440 Wörter, kaum interaktive Elemente).

9. **Arbeitsstände sichern — uncommitteter Code ist ungeschützter Code (23.08.2026).**
   Anlass: Eine fertige Homepage im Texas-Monthly-Stil lag tagelang uncommittet im
   Arbeitsbaum und ist spurlos verschwunden. Git konnte nichts retten, weil Git nur
   schützt, was committet ist. Daraus folgt, verbindlich:
   - **Sichtbares Ergebnis = sofort committen.** Sobald etwas im Browser funktioniert
     oder abgenommen wird, gehört es in einen Commit — nicht „später, wenn es fertig ist".
     Ein unfertiger Commit auf einem Zweig ist jederzeit korrigierbar; eine überschriebene
     Datei ohne Commit ist es nie.
   - **`git clean` NIE direkt.** Immer `git clean-safe` (Alias: sichert erst nach
     `wip/auto`, zeigt dann den Trockenlauf `git clean -nd`). `git clean -fd` löscht
     unversionierte Dateien ohne Rückfrage und ohne Wiederherstellung.
   - **Automatisches Netz:** Der `Stop`-Hook ruft `scripts/wip-autosave.mjs`, das den
     kompletten Arbeitsbaum am Sitzungsende auf den lokalen Branch `wip/auto` schreibt —
     ohne Arbeitsbaum, HEAD oder Staging-Bereich anzufassen. Manuell: `git wip`.
     Ansehen: `git wip-log`. Zurückholen: `git checkout wip/auto -- <pfad>`.
     `wip/auto` wird **nie gepusht und nie gemerged** — es ist ein Netz, kein Verlauf.
   - **Vor riskanten Operationen** (Verschieben des Projekts, Löschen einer Arbeitskopie,
     Rebase, `reset --hard`, Aufräumen) zuerst `git wip` ausführen.
   - **Eine Arbeitskopie, nicht zwei.** Parallelkopien in OneDrive und `C:\Dev` haben
     an diesem Tag zusätzlich Verwirrung gestiftet und Arbeit gekostet. Kanonisch ist
     `C:\Dev\steakakademie-v2`.

7. **Epistemische Ehrlichkeit (Uwe, 03.07.2026) — gilt für JEDE Antwort/JEDEN Output:**
   - Wenn Informationen unsicher, unvollständig oder spekulativ sind, das klar sagen.
     Keine Fakten, Quellen oder Zahlen erfinden.
   - Wenn keine verlässliche Grundlage besteht, ausdrücklich antworten: „Ich weiß es
     nicht" oder „Dazu habe ich keine gesicherten Informationen".
   - Antworten, die auf Annahmen beruhen, deutlich als Annahme kennzeichnen.
   - Vor der Ausgabe prüfen auf: logische Fehler, fehlende Informationen, mögliche
     Verzerrungen oder falsche Annahmen.
   - Bei komplexen Fragen: Problem kurz analysieren, Schritte nachvollziehbar
     erklären, Schlussfolgerung klar formulieren.
   - Quellen nur nennen, wenn sicher ist, dass sie existieren — keine Studien, Bücher
     oder Zitate erfinden.
   - Wenn nur ein Teil der Antwort sicher ist, nur diesen Teil ausgeben.
   - Vor der finalen Antwort kurz prüfen: plausibel, konsistent, vollständig?

10. **Grün ist kein Ergebnis (13.09.2026).** Ein Workflow ist grün, wenn er ohne
   Fehler endet — nicht, wenn er etwas produziert hat. `recipe-grow` lief vom
   27.08. bis 13.09.2026 jede Nacht grün in 48 Sekunden durch und erzeugte kein
   einziges Rezept: die Seed-Liste war abgearbeitet, das war kein Fehlerfall.
   Siebzehn Tage Stillstand, kein Signal. Daraus folgt verbindlich:
   - **Jeder Agenten-Workflow muss messbar liefern.** Wer nichts liefern konnte,
     schreibt das ins Job-Summary — mit Zahl, nicht mit Prosa.
   - **Läuft ein Agent aus Vorrat (Seeds, Quellen, Warteschlangen), braucht er
     Nachschub-Automatik**, nicht nur eine Meldung beim Leerlaufen.
     Beispiel: `scripts/recipe-seeds.mjs` füllt `data/rezept-seeds.json` auf.
   - **Der Wächter prüft Ergebnisse, nicht Läufe.** `ops-heartbeat` (täglich
     09:00 UTC) fragt je Bereich: *Wann kam zuletzt etwas heraus?* Fristen in
     `data/ops-heartbeat.json`. Neue Automation → dort eintragen, sonst kann sie
     unbemerkt sterben.
   - **Scheitern alle Einzelschritte, ist der Lauf rot.** Ein Skript, das jeden
     Durchgang verliert und trotzdem mit 0 endet, lügt.

---

## 3. Agentur-Struktur (Betriebsmodell)

### 3.0 Die FÜNF Abteilungen (Uwe, 10.08.2026 — verbindlich)

Übersicht und aktueller Stand: **`docs/COCKPIT.md`** — das ist die einzige Datei, die
Uwe anheftet, und der Einstieg in alles Weitere.

| # | Abteilung | Ersetzt | Ordner |
|---|---|---|---|
| 1 | **Systems & Ops** | Entwicklung + IT-Betrieb | `src/` `scripts/` `supabase/` `tests/` `tools/` `.github/` |
| 2 | **Studio** | Video-/Bildproduktion | `video/` `training/` `bild-austausch/` |
| 3 | **Redaktion** | Content-Team + Fachredaktion | `content/` `data/` |
| 4 | **Wachstum** | SEO/GEO · Social · Newsletter · Affiliate | `products/` `steakakademie-audit/` |
| 5 | **Kanzlei** | Recht · Steuern · Behörden | `compliance/` `Existenzgruendung-Jobcenter/` |

**Nicht verhandelbar: Es bleibt bei fünf.** Grund: Fünf ist die Grenze dessen, was ohne
Nachschlagen im Kopf bleibt — und genau der Überblicksverlust war der Anlass. Jedes neue
Tool, jeder neue Ordner, jede neue Automatisierung wird **einer der fünf zugeordnet**,
bevor sie entsteht; die Zuordnung gehört sichtbar in den Commit oder die Abteilungs-Doku.
Passt etwas in keine Abteilung, ist das ein Signal zum Nachdenken (falsch geschnitten?
gehört es überhaupt ins Projekt?) — **kein** Grund für eine sechste. Eine sechste
Abteilung kann nur Uwe selbst eröffnen, mit wörtlichem Zitat und Datum an dieser Stelle.

Die Rollen-/RACI-Struktur unten (CMO, Fach-Rollen, Enabler) bleibt davon unberührt —
sie beschreibt **wer** arbeitet, die fünf Abteilungen beschreiben **wo** es einsortiert wird.

### 3.1 Rollen & Hierarchie

**Vollständig:** `docs/confluence/04-MARKETING-AGENCY-MODEL.md` (Hierarchie, Prioritäts-
Logik, Pipeline „wer beginnt/was folgt", RACI je Marketing-Frage, Eskalation).

**Hierarchie kurz:** Uwe (Freigabe) → **Projekt-Director (ich)** → PM-Agent „Der Chef" →
CMO (`marketing_agent.txt`) → Fach-Rollen.

**Fach-Rollen (P1):** SEO Manager · GEO Manager (`docs/geo-manager-agent.md`) ·
Social Media Senior Director (`scripts/social-posts.mjs`) · Content & Culinary Expert ·
Brand & UX Designer. **Enabler (P2):** Tech & Automation · Legal & Compliance ·
Analytics & Data · CRM & Monetization.

**Prioritäts-Logik bei Konflikt:** Recht → Fakten → Marke → ROI → Reichweite → Tempo.

---

## 4. Verankerte Taktiken (heute eingepflegt)

- **GEO:** KI baut auf SEO. Stärkste Signale: Such-Präsenz + Backlinks + Entity (Wikidata),
  NICHT Keyword-Stuffing. `docs/geo-llm-ranking-factors.md`. Auto-Check: `geo-check.yml`.
- **TikTok:** Story-Highlights aktiv nutzen (Reichweiten-Bonus), immer benennen.
- **Werbekennzeichnung:** siehe §2.1.
- **Stufe 2 (Streitfall-Beiträge) ist NICHT live — Korrektur 13.09.2026.** Bis hierher stand
  „LIVE seit 31.08.2026" mit Flag `STREITFALL_BEITRAEGE_ENABLED=1` (Netlify alle Kontexte +
  .env.local). Beides ist im Code nicht gedeckt, nachgeprüft am 13.09.2026: die Komponente
  `src/components/streitfaelle/StreitfallBeitraege.tsx` wird **von keiner Seite importiert**
  (gerendert wird nur `StreitfallUmfrage`, Stufe 1), und `STREITFALL_BEITRAEGE_ENABLED` kommt
  im gesamten Quellbaum **nur im Kommentarkopf dieser Komponente** vor — es liest sie niemand.
  Tabelle, RLS-Policies und Moderations-Warteschlange existieren, die Oberfläche dazu ist
  unerreichbar. Praktisch heisst das: Der Zustand ist der rechtlich sichere (keine
  ungeprüften Nutzerinhalte online, anwaltliche DSA-Prüfung durch RAin Nieweg steht ja noch
  aus) — aber der beschriebene Rückbauweg „Flag auf 0" existiert nicht, und Livegang heisst
  einbauen, nicht umschalten. Beschreibung des geplanten Stands unverändert gültig:
  Erfahrungsberichte unter Streitfällen, nichts erscheint
  automatisch — jeder Beitrag landet mit status `neu` in der Warteschlange und wird manuell unter
  `/admin/beitraege` freigegeben. Ein Beitrag je Nutzer und Streitfall (UNIQUE slug+user_id),
  max. 600 Zeichen, Anzeigename Vorname+Ort. Rechtlich abgedeckt: AGB §12 (Rechtseinräumung,
  manuelle Freigabe, keine Nachnamen) und Melde-Link an jedem Beitrag (Art. 16 DSA) plus
  Nutzungsbedingungen §7. OFFEN: anwaltliche Prüfung durch RAin Nieweg steht aus (Konzept
  Abschnitt 5) — Rückbau jederzeit durch Flag auf 0.

- **Rechtschreibprüfung (22.08.2026):** `npm run spell:check` prüft content/ gegen die
  LanguageTool-API (de-DE), inkrementell über data/spell-check-cache.json, Fachbegriffe in
  data/rechtschreib-whitelist.txt. Report-only (bricht NIE den Build — auch nicht bei
  API-Ausfall); --strict für CI, --force für Vollprüfung. **Korrektur 13.09.2026:** Hier
  stand „läuft im Netlify-postbuild". `postbuild` ruft next-sitemap, validate-frontmatter
  und check-links — **kein** spell:check; Netlify ist abgebaut. Der Lauf ist manuell. Erster
  Voll-Lauf: ~392 Dateien ÷ 20 Req/min ≈ 25 Min in Uwes Terminal, danach nur Deltas.
  Der Checker maskiert JSX-Tags — Bezeichner sind kein Fließtext (Vorfall 30.08.2026, 7f19d67).
  Konkret: `JSX_TAG` in scripts/spell-check.mjs entfernt Tags samt Attributnamen vor dem
  API-Call, `JSX_REST` meldet jede Komponente, die die Maske überlebt hat (unter --strict
  Exit 1). Zweiter Riegel: die Komponentennamen stehen in data/rechtschreib-whitelist.txt.
  **Beim Abarbeiten des Reports gilt: ein Treffer, der wie ein Bezeichner aussieht, wird
  nicht korrigiert, sondern gemeldet.** 7f19d67 hat genau das verletzt und `<Schnelluebersicht>`
  zu `<Schnellübersicht>` eingedeutscht — 94 Stellen in 47 Dateien, Build-Bruch auf
  /methoden/*, /diplome/lernen/* und /gruender-schmiede/lernen/* (Fix: 7a1fdb3).

- **MDX-Komponenten-Gate (30.08.2026):** `scripts/check-mdx-komponenten.mjs` prüft, dass
  jedes `<Großbuchstaben-Tag>` in content/ einen passenden Namen im Code hat — benannter
  Export unter src/components/ oder Schlüssel in einer mdxComponents-Zuordnung. Fehlt der
  Name, bricht der Build mit Datei, Zeile und Tagname ab. Läuft im `prebuild`, also VOR
  `next build`, und zusätzlich in `npm run check`; einzeln: `npm run check:mdx`.
  **Warum:** 7f19d67 war ein Fehler in content/, den tsc nicht sieht — er fiel erst im
  Vercel-Build auf, nach dem Push, und die Produktion stand mehrere Tage rot. Die Maske in
  spell-check.mjs härtet den *Prüfer*; dieses Gate fängt den Bezeichner unabhängig davon,
  wer ihn kaputtgemacht hat. Zwei Dinge, die beim Bauen des Gates aufgefallen sind und die
  man wissen muss: der Tag-Scanner arbeitet mit Unicode-Klassen (`\p{Lu}`), denn mit
  `[A-Za-z]` bricht das Muster genau am `ü` von `Schnellübersicht` ab — das Gate lief in der
  ersten Fassung grün durch seinen eigenen Anlassfall. Und geprüft wird gegen die
  *Vereinigung* aller bekannten Namen, nicht pro Route: eine Komponente, die zwar existiert,
  aber in der mdxComponents-Zuordnung genau dieser Route fehlt, fällt hier nicht auf.

- **Inhalts-Gates im prebuild (Uwe, 31.08.2026).** `prebuild` führt drei Gates aus, in dieser
  Reihenfolge: `check-mdx-komponenten.mjs`, `check-redaktionsvorbehalt.mjs`,
  `check-startseiten-hierarchie.mjs`. npm ruft `prebuild` automatisch vor `build` auf, also
  auch auf Vercel — dort ist es die einzige Stelle, an der die Gates greifen.
  **Gates aus prebuild entfernen ist eine Uwe-Entscheidung, kein Refactoring.**
  31a7083 („Inhalts-Gates aus build/prebuild → npm run check") hat genau das ohne diese
  Abwägung getan und damit den Redaktionsvorbehalt entschärft, an dem die
  AI-Act-Dokumentation hängt, sowie das Hierarchie-Gate, das sich laut eigenem Skript-Header
  und §2 Regel 8 ausdrücklich als *Build*-Gate versteht. `npm run check` darf zusätzlich
  existieren, ersetzt `prebuild` aber nicht: **Vercel führt `check` nie aus.**

- **Bots pushen nie auf main — sie öffnen PRs (04.09.2026).** Seit Branch Protection
  (01.09.) waren alle sechs Agenten-Workflows stumm: letzter Bot-Commit 27.08., vier Tage
  unbemerkt. Jetzt läuft jeder Bot-Commit über `.github/actions/pr-statt-push` — ein
  Ort für die Logik, eigener Branch je Lauf, PR nach main. Reiner Text/Daten (Glossar,
  Ideen-Radar, LoRA-JSON) mergt automatisch nach grünen Pflicht-Checks; alles mit
  **KI-Bildern** (Rezepte, Cut-Fotos, Regenerierung) wartet auf Sichtprüfung — Regel 4/8c.
  **`BOT_PAT` ist Voraussetzung, nicht Komfort** (fine-grained, nur dieses Repo,
  Contents+PRs RW — Anleitung `docs/ci-bot-pat.md`). Ohne PAT scheitert es an zwei
  Hürden: `gh pr create` mit `github.token` schlägt fehl, solange *Settings → Actions →
  General → „Allow GitHub Actions to create and approve pull requests"* aus ist; ist die
  Einstellung an, entsteht der PR zwar, aber der GitHub-Rekursionsschutz lässt die
  Pflicht-Checks nicht anlaufen → unmergefähig. Die Action fängt beide Fälle mit
  lesbarer Meldung ab; der Commit liegt dabei immer schon gepusht auf dem Bot-Branch.
  Diese Einstellung ist **nicht** „Actions bypass branch protection" — sie erlaubt nur
  das Anlegen. **Bypass bleibt tabu**, das wäre der alte Zustand mit Umweg.
  Neue Bot-Workflows nutzen die Action, keinen `git push`. Auto-Merge greift nur bei
  Läufen auf `main` (Riegel gegen Testläufe, die Fremd-Commits mitschleusen).

- **Voyage-Vollausbau (22.08.2026):** Zentraler Client `src/lib/voyage/client.ts`
  (Embeddings, Reranker, Kontext-Embeddings, Multimodal; Retry bei 429). Wissenssuche ist
  zweistufig: pgvector-Recall → `rerank-2.5-lite` (abschaltbar: VOYAGE_RERANK=off, Ausfall
  = Fallback auf Vektor-Reihenfolge). /api/kochwissen zieht ZWEI Korpora: kuratiertes
  `kochwissen` (voyage-3.5) + Nacht-Index `knowledge_embeddings`; der Reranker sortiert
  beide gemeinsam. Nacht-Index läuft auf `voyage-4` (200M Free-Tier; voyage-3 war Legacy
  ohne Free-Tier) — Modellwechsel re-embeddet automatisch (isAlreadyIndexed prüft Modell),
  Query-Seite erkennt das Korpus-Modell selbst (voyage-retrieval.ts). Kochwissen wurde am 22.08.2026 per
  `scripts/kochwissen-reembed.mjs` auf voyage-4 re-embedded — beide Korpora sprechen
  voyage-4 im Speicher. Reranker ist modell-agnostisch.
  **OFFEN, seit 13.09.2026 belegt: VOYAGE_MODEL war „lokal und auf Netlify" gesetzt — die
  Produktion laeuft aber auf Vercel.** `src/lib/kochwissen/voyage.ts` liest
  `process.env.VOYAGE_MODEL ?? 'voyage-3.5'`; anders als der Nacht-Index (voyage-retrieval.ts,
  liest das Modell aus dem Korpus) haengt dieser Pfad allein an der Variable. Fehlt sie im
  Vercel-Projekt, bettet die Produktion Suchanfragen mit voyage-3.5 ein und vergleicht sie
  mit einem voyage-4-Korpus: gleiche Dimension, kein Fehler, still schlechtere Treffer.
  **Zu tun: im Vercel-Dashboard prüfen, ob `VOYAGE_MODEL=voyage-4` in allen Umgebungen
  gesetzt ist — falls nein, setzen und neu deployen.** Aus dem Repo ist das nicht einsehbar
  (Vercel-MCP gibt Env-Variablen nicht heraus).
  Indexierung läuft MANUELL in Uwes Terminal (lokale Cowork-VM hat keinen Netz-Egress);
  der 23:45-Task ist nur noch Wächter (prüft Frische via Supabase, indexiert nicht).

- **Prompt-Caching (20.08.2026):** Alle Anthropic-Calls laufen über `scripts/lib/anthropic.mjs`
  (`callClaude` / `Conversation`). Automatisches Caching = ein Feld `cache_control` auf
  Top-Level des Requests; die API setzt und verschiebt den Breakpoint selbst — **keine**
  cache_control-Marker in einzelne Content-Blöcke setzen. Greift erst ab Modell-Mindestlänge
  (Haiku 4.5: 4096 Tok, Opus 4.7: 2048, Opus 5: 512 — Tabelle `CACHE_MIN_TOKENS` im Modul);
  darunter passiert still nichts. Prüfen: `npm run cache:selftest`. TTL via `ANTHROPIC_CACHE_TTL=1h`.

- **Videoproduktion (OpenMontage, 09.08.2026):** agenten-getriebener Video-Stack,
  installiert per `npm run video:setup` nach `tools/openmontage/` (**gitignored, AGPLv3** —
  nicht ins Repo vendoren). Marken-Playbook + Pflicht-Briefing liegen kanonisch in
  `docs/openmontage/` und werden beim Setup eingespielt. Doku:
  `docs/openmontage-integration.md`. Approval-Gates bleiben an (Regel 4), Paid-Provider
  erst nach Kostenfreigabe.

---

## 5. Kritische Blocker (Umsatz zuerst) — Director-Fokus

1. **Ribeye Pillar Page `/cuts/ribeye`** (18k Suchen/Monat) — höchster Traffic-Hebel,
   erster End-to-End-Lauf der neuen Pipeline (SEO→GEO→Content→Compliance).
2. **Monetarisierung verdrahten:** Digistore24 Danke-/Webhook→Supabase, Diplom Bronze live.
3. **Community:** Supabase Auth (OAuth + Magic Link) ist **live** — offen ist nur
   noch der Community-Teil.
4. **Affiliate-Programme anmelden** (Santos, Grillfürst, Ankerkraut, Otto Gourmet) + PA-API.
5. **Wortmarke „Steakakademie":** AZ 3020262290701 — **Gebühr gezahlt** (Uwe, bestätigt 20.09.2026).
   Damit ist die Frist ~27.08.2026 (KAN-17) erledigt; die Prioritaet vom 27.05.2026 steht.

**Manuelle Restpunkte, übernommen aus den gelöschten `STATUS.md`/`ROADMAP.md`
(Stand dort Mai 2026, seither NICHT nachgeprüft — 03.09.2026):** Digistore24
Dankeseiten-URLs für 696394/696396/696399 auf `/danke/*` setzen, Widerrufs-Checkbox
aktivieren, Genehmigung per „Testkauf anlegen" beantragen · `AMAZON_ACCESS_KEY` +
`AMAZON_SECRET_KEY` in Vercel eintragen, dann `npm run fetch-images` · Google Business
Profil anlegen und verifizieren · `GA4_MEASUREMENT_ID` + `GA4_API_SECRET` in Vercel.
Beide Dateien wurden entfernt, weil sie Netlify als Produktion nannten und am 03.09.
einen Fehlbefund gestützt haben — Statusquelle ist ausschließlich diese Datei.

---

## 6. Projekt-Sicherung (gegen Gedächtnis-/Datenverlust)

- **Diese `CLAUDE.md`** ist der Anker — committet + gepusht = überlebt jeden Container.
- **Git/GitHub** ist das Langzeitgedächtnis: früh & oft committen.
- **Was NICHT in Git lebt** (Supabase-DB, Account-Zugänge), muss separat gesichert werden
  (Supabase-Backups, 2FA + Recovery-Codes offline, lokale Repo-Kopie).
- Confluence-Spiegel `docs/confluence/` für die menschliche Übersicht aktuell halten.

### Drei Orte für Wissen (Uwe, 04.09.2026 — ersetzt „Zwei-Dateien-Gedächtnis" vom 25.06.2026)

- **Doktrin → diese `CLAUDE.md`.** Regeln, Rolle, Was-gilt. Jede Zeile hier ist eine
  Anweisung, kein Bericht. Bewusst gepflegt und bewusst kurz.
- **Fachwissen → `docs/`.** Eine Datei je Sache. Dort stehen das Warum, die Zahlen und
  die Entscheidung mit Datum — z. B. die Stimm-Abnahme Marco in
  `docs/video-toolkit-setup.md` § 6.
- **Stand → `docs/COCKPIT.md`, je Abteilung drei Zeilen** (*läuft · hängt · nächster
  Schritt*). Nur der aktuelle Stand, keine Historie — die liefert Git.

Passt etwas in keinen der drei Orte, ist es entweder falsch geschnitten oder gehört
nicht ins Projekt. Eine vierte Ablage wird nicht angelegt.

Zur selben Sicherungslogik gehört: Transkript-Aufbewahrung steht auf **3650 Tage**
(Default war 30 — die frühen Tage wären längst gelöscht).

**`memory.md` ist am 27.08.2026 entfernt worden** (Commit `9a2f4c4`): 55 KB Altnotizen
als Fließtext, in dem jede Regel unterging — Empfehlung aus
`docs/ARCHITEKTUR-AUDIT-2026-08-27.md`. Die Datei wird **nicht** wiederbelebt, auch nicht
automatisch: der Stop-Hook `scripts/gf3-lesson.cjs` schrieb bis 04.09.2026 nach jedem
Session-Ende dorthin und hätte sie stillschweigend neu angelegt — dieser Zweig ist
entfernt. Session-Lektionen liegen weiterhin in `~/.claude/gf3-log.json` und in claude-mem;
was davon dauerhaft gelten soll, trägt ein Mensch in einen der drei Orte oben ein.


## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

### Betrieb (Stand 07.09.2026)

**`graphify claude install` NICHT ausführen (08.09.2026, belegt).** Der Befehl
löscht diese Betriebssektion aus CLAUDE.md, setzt zwei PreToolUse-Hooks in
`.claude/settings.json` (`Bash|Grep` → `hook-guard search`, `Read|Glob` →
`hook-guard read`), zerstört die Datei-Endzeile und legt
`.claude/settings.json.graphify-bak` als untracked Datei ab — beide Dateien sind
git-getrackt im öffentlichen Repo. Dasselbe gilt für `graphify install --platform
claude`. Rückbau, falls doch gelaufen: `git checkout -- CLAUDE.md
.claude/settings.json` plus Backup-Datei löschen. Die Hooks selbst wären nicht
blockierend gewesen (`hook-guard read` und `hook-guard search` liefern beide
ExitCode 0, blockierend wäre 2) — der Ablehnungsgrund ist die Doku-Zerstörung,
nicht Loop-Gefahr.

**Semantische Ebene.** `graphify update .` macht per Definition nur AST ohne LLM,
Doku-, Paper- und Bilddateien bleiben dabei außen vor — das ist kein Defekt. Der
Lauf, der `semantic_hash` füllt, ist `graphify extract . --backend gemini
--max-concurrency 1`. Vorher immer `graphify check-update .` fragen: keine
Ausgabe = keine Re-Extraktion fällig (08.09.2026 der Fall), dann den teuren Lauf
sparen. Gegenprobe danach: `graphify query "datenschutz"` muss echte Symbole
liefern (`DatenschutzPage()` mit Zeilennummer), nicht nur den Dateinamen.

**Die Auto-Hooks sind entfernt.** `post-commit` und `post-checkout` stießen bei
jedem Commit bzw. Branch-Wechsel einen vollen Rebuild an. Weil ein Label-Lauf
länger braucht als der Abstand zwischen zwei Commits, wurde er regelmäßig von
der nächsten Runde überholt — deshalb veralteten die Community-Labels ständig.
Sicherungskopien lagen unter `_to_delete/graphify-hooks/` (am 05.09. gelöscht;
wieder einspielen ginge mit `graphify hook install` — das ist aber genau der
Zustand, den wir verlassen haben).

**`graphify watch` laeuft absichtlich (Uwe, 10.09.2026).** Der Watcher baut den
Graphen bei Dateiaenderungen von selbst neu und sichert den Vorzustand nach
`graphify-out/<datum>/`. Seine Ausgabe beginnt mit `[graphify watch]` — wer die
sieht, hat den Rebuild NICHT selbst ausgeloest. Ein manuelles `graphify update .`
ist damit meist ueberfluessig; die drei Punkte darunter bleiben es aber nicht:

1. **`label` macht der Watcher nicht.** Er meldet stattdessen „community set
   changed since labeling" und benennt die neuen Communities mechanisch nach
   ihrem Hub — am 10.09. waren das 47 von 681. Der sprechende Name kommt erst
   mit dem Befehl unten.
2. **Der Watcher indexiert, was auf der Platte liegt — nicht, was im Repo
   existiert.** Am 10.09. stand der Arbeitsbaum auf einem von `origin/main`
   abgezweigten Branch; die 60 Dateien des Diplom-Branches waren deshalb nicht
   im Graphen, obwohl sie committet und gepusht waren. Der Lauf war korrekt,
   die Erwartung falsch. Vor einer Aussage ueber den Graphen also erst
   `git branch --show-current` fragen.
3. **Der MCP-Server merkt vom Watcher nichts.** Er liest `graph.json` beim
   Start; nach einem Rebuild antwortet er weiter aus der alten Fassung, ohne
   Fehlermeldung. Client neu starten (Details im Abschnitt MCP-Server).

Von Hand, aus PowerShell — `update` nur ohne laufenden Watcher noetig:

```powershell
graphify update .                                     # AST-Struktur, keine API-Kosten
graphify label . --max-concurrency=1 --batch-size=50  # semantische Community-Namen
```

**`--batch-size=50`, nicht 200 (07.09.2026, aus einem echten Lauf).** Mit 200
hängte sich der Label-Lauf auf: vier LLM-Aufrufe, eine Stunde ohne jede Ausgabe
und ohne Schreibvorgang, Abbruch nur per Strg+C. Derselbe Graph mit 50 lief in
Sekunden durch und benannte 651 der 657 Communities sprechend. `--max-concurrency=1`
bleibt Pflicht (Gemini-Free-Tier).

**Installation über uv, Extras vollständig angeben (07.09.2026).** Das Paket
heißt `graphifyy`, liegt unter `%APPDATA%\uv\tools\graphifyy\` und war auf
0.9.50 gepinnt — `uv tool upgrade` aktualisiert dann nur Abhängigkeiten, nicht
das Tool. Richtig ist:

```powershell
uv tool install "graphifyy[sql,openai]@latest" --force
```

**Beide Extras in einem Befehl**, denn `uv tool install` *ersetzt* die Extras,
statt sie zu ergänzen: Eine Installation mit nur `[sql]` warf `openai` hinaus,
worauf jeder Label-Lauf mit „the 'openai' package is required for this backend"
scheiterte und die Communities mechanisch nach ihrem Hub benannte
(`TaxCalculator.tsx` statt „Tax and AE Calculator"). Ohne `[sql]` wiederum
tragen die 37 Supabase-Migrationen **nichts** zum Graphen bei — mit dem Extra
sind es 95 Knoten samt Tabellen und Triggern.

**Stand nach dem Lauf vom 07.09.2026:** graphify 0.9.56, Graph auf Commit
`c55ac3d`, 5384 Knoten / 7921 Kanten / 657 Communities (651 mit LLM-Namen).
Sicherungskopien des Vorzustands legt graphify selbst unter
`graphify-out/<datum>/` ab.

**Überschreib-Schutz:** Liefert ein neuer Lauf weniger Knoten als der
gespeicherte Graph, bricht graphify mit „Refusing to overwrite" ab und ändert
nichts. Das ist eine Sicherung, kein Fehler — meist fehlt ein Extra (siehe oben).
Erst wenn geklärt ist, warum die Zahl fällt, mit `--force` übergehen.

**`semantic_hash` füllt `label` nicht (07.09.2026).** 1093 der 1361
Manifest-Dateien haben weiterhin `semantic_hash: ""`. Das ist kein Rückstand
des Label-Laufs: Code parst graphify lokal per tree-sitter ohne LLM, während
Dokumente, PDFs und Bilder einen semantischen Durchgang brauchen, den **der
KI-Assistent** fährt — `/graphify --update` in Claude Code, nicht die CLI.
Voraussetzung dafür ist die Claude-Code-Integration (`graphify claude install`),
die in diesem Repo bewusst nicht aktiv ist: `.claude/hooks/graphify-guard.sh`
liegt zwar bereit (sucht graphify zur Laufzeit statt mit absolutem Pfad), ist in
`.claude/settings.json` aber nicht als PreToolUse-Hook verdrahtet — dort steht
nur `SessionStart`.

**Bekannter Defekt, unverändert in 0.9.56 (07.09.2026):** Drei Seiten unter
`src/app/` melden Syntaxfehler und liefern kaum Symbole —
`datenschutz/page.tsx` (Fehler ab Zeile 1, **0** Symbole),
`methoden/page.tsx` (Zeile 57, 3 Symbole), `nutzungsbedingungen/page.tsx`
(Zeile 17, 2 Symbole). Der Code ist in Ordnung: TypeScript kompiliert die
Dateien, der Vercel-Build ist grün. Ausgeschlossen wurden außerdem BOM
(alle drei beginnen mit `imp`, sauberes UTF-8), JSX-Fragmente (`<>` nutzen 127
andere `.tsx` fehlerfrei) und ein nacktes `&` im JSX-Text (49 andere Dateien).
**Heiße Spur:** `tree-sitter-typescript==0.23.2` läuft gegen
`tree-sitter==0.25.2` — die TSX-Grammatik ist zwei Generationen älter als der
Parser-Kern, während JavaScript und Python bereits bei 0.25 stehen; 0.23.2 ist
zugleich die neueste veröffentlichte Version dieser Grammatik. Ein Bugreport
gehört nach https://github.com/Graphify-Labs/graphify/issues. Reproduktion:

```powershell
graphify update .   # Warnung "3 file(s) had syntax errors" in der Ausgabe
```

### MCP-Server (07.09.2026, Cowork-Teil ergaenzt 09.09.2026)

Der Graph haengt als MCP-Server an zwei Stellen — **die beiden Konfigurationen
sind getrennt und wissen nichts voneinander**:

| Client | Konfigurationsdatei | Pfad zur graph.json |
|---|---|---|
| Claude Code (CLI, im Repo) | `.mcp.json` im Projekt | relativ (`graphify-out/graph.json`) |
| Cowork / Claude Desktop | Konfiguration der Desktop-App | **absolut** |

Verfuegbare Werkzeuge in beiden Faellen: `query_graph`, `get_node`,
`get_neighbors`, `get_community`, `god_nodes`, `graph_stats`, `shortest_path`,
`list_prs`, `get_pr_impact`, `triage_prs`.

**Warum die Cowork-Seite eine eigene Einrichtung braucht (09.09.2026).** Die
`.mcp.json` im Repo ist Claude Codes *projektbezogene* Konfiguration; die
Desktop-App liest sie nicht. Ausserdem startet Claude Code im Projektordner, die
Desktop-App nicht — deshalb waere der relative Pfad dort falsch. Eintrag fuer die
Desktop-App:

```json
{
  "mcpServers": {
    "graphify": {
      "command": "C:\\Users\\Uwe\\.local\\bin\\graphify-mcp.exe",
      "args": ["C:\\Dev\\steakakademie-v2\\graphify-out\\graph.json"]
    }
  }
}
```

**Der absolute Pfad ist Pflicht, nicht Notloesung (09.09.2026, belegt).** Die
Desktop-App loest Kommandos nicht ueber den PATH auf — sichtbar am
digistore24-Eintrag derselben Datei, der `C:\\Program Files\\nodejs\\npx.cmd`
statt `npx` verwendet. Mit `"command": "graphify-mcp"` startet der Server nicht.

**Die Datei NICHT von Hand editieren (09.09.2026, zweimal schiefgegangen).**
Beim Einfuegen per Editor landete der Block neben statt in dem bestehenden
Objekt; die Datei war danach kein gueltiges JSON, und die App startete
daraufhin **keinen einzigen** Server mehr — auch die vier funktionierenden
nicht. Ein kaputtes Komma nimmt also alles mit. Sicherer Weg aus PowerShell,
er legt vorher eine Sicherung an und prueft am Ende:

```powershell
$p   = "$env:APPDATA\Claude\claude_desktop_config.json"
$exe = (Get-Command graphify-mcp).Source
Copy-Item $p "$p.bak" -Force
$j = Get-Content $p -Raw | ConvertFrom-Json
$g = [pscustomobject]@{ command = $exe; args = @("C:\Dev\steakakademie-v2\graphify-out\graph.json") }
$j.mcpServers | Add-Member -NotePropertyName graphify -NotePropertyValue $g -Force
[System.IO.File]::WriteAllText($p, ($j | ConvertTo-Json -Depth 20), (New-Object System.Text.UTF8Encoding($false)))
(Get-Content $p -Raw | ConvertFrom-Json).mcpServers | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name
```

`WriteAllText` mit `UTF8Encoding($false)` schreibt **ohne BOM** —
`Set-Content -Encoding UTF8` setzt unter Windows PowerShell eines davor, und
daran scheitert ein JSON-Parser genauso zuverlaessig wie an einem Komma.

Nach dem Schreiben: App ueber das Tray beenden und neu starten. **Der Neustart
loest alle in der App verbundenen Ordner** — die muessen anschliessend wieder
verbunden werden, sonst kommt eine Cowork-Sitzung nicht mehr ans Repo.

**`uvx` ist die schlechtere Variante, gemessen (09.09.2026).** Empfohlen wurde
extern `"command": "uvx", "args": ["--from", "graphifyy[mcp]", "graphify-mcp",
"<pfad>"]`. Das funktioniert — aber `uvx` baut eine EIGENE, fluechtige Umgebung
neben der installierten und laedt beim allerersten Start 58 Pakete inklusive
saemtlicher tree-sitter-Grammatiken. Gemessen in einem Linux-Container mit
demselben Paket: erster Start > 10 Minuten (nach 10 min abgebrochen), jeder
weitere Start 1,2 s. Der bereits installierte Shim antwortet in 0,9 s, ohne
Netzzugriff. Ein MCP-Client, der beim Start ein Zeitlimit hat, faellt in den
ersten Fall — deshalb den Shim direkt aufrufen.

**Nicht existierende Pakete (09.09.2026 geprueft, gegen Halluzinationen).**
`npm view @graphify/mcp` → E404, `pypi.org/pypi/graphify-mcp` → HTTP 404. Beides
kursiert als Konfigurationsvorschlag und ist falsch. Das Paket heisst
**`graphifyy`** (PyPI, aktuell 0.9.57) und liefert die zwei ausfuehrbaren
Dateien `graphify` und `graphify-mcp`.

**Voraussetzung ist das `mcp`-Extra** (zieht `mcp` und `starlette`). Wieder
gilt: alle Extras in **einem** Befehl, sonst fliegen die anderen raus.

```powershell
uv tool install "graphifyy[sql,openai,mcp]@latest" --force
```

**Der Server liest `graph.json` beim START.** Nach jedem `graphify update .`
muss der Client neu gestartet werden — Claude Code beenden und neu oeffnen bzw.
die Desktop-App ueber das Tray-Symbol vollstaendig beenden, nicht nur das
Fenster schliessen. Sonst antwortet der Server stillschweigend aus dem alten
Graphen; das sieht aus wie ein veralteter Code-Stand und kostet Stunden Suche.

Geprueft am 09.09.2026, zweimal: erst in einem Linux-Container gegen die echte
`graph.json` vom 08.09. (5,3 MB) — Handshake ok, `graphify 0.9.57`, zehn
Werkzeuge —, danach **live aus einer Cowork-Sitzung heraus**: die App meldet
`graphify` als `announced`, `graph_stats` liefert **5412 Knoten / 7965 Kanten /
678 Communities** (98 % EXTRACTED, 2 % INFERRED), und `query_graph` gibt echte
Symbole mit Zeilennummern zurueck (z. B. `POST()` in
`src/app/api/js-errors/route.ts` L40, Community „Analytics and Guard Routes").
Die Werte im Abschnitt darueber (5384/7921/657) stammen vom 07.09. und sind
damit ueberholt.

### GRAPHIFY PROTECTED

- DO NOT create, modify, overwrite, or delete any files in `graphify-out/` or `graphify.json`.
- Always query the existing graph in `graphify-out/graph.json` via the graphify tool instead of rescanning raw codebase files.

### Git-Wartung

`gc.auto=0`, `gc.autoDetach=false` und `maintenance.auto=false` sind in
`.git/config` gesetzt. Grund: Wird die automatische Garbage Collection aus einer
Umgebung heraus ausgelöst, die im Repo nicht löschen darf (etwa der
Cowork-Mount), scheitert sie mitten im Lauf und hinterlässt `.lock`-Dateien auf
`refs/heads/main`, `refs/remotes/origin/*` und `packed-refs`. Die blockieren
danach jede weitere Git-Operation, auch `git push`.

Aufräumen darf deshalb nur, wer löschen kann — also von Hand aus PowerShell:

```powershell
git gc --prune=now
```
