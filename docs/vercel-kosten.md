# Vercel-Kosten — Einstellungen und Begründung

> Abteilung 1 · Systems & Ops. Stand: 19.10.2026. Anlass: Rechnung FSDI5MXA-0006
> (17.10.2026) über 80,80 $ statt erwarteter 20 $.

## Befund (Rechnung 17.09.–16.10.2026)

| Posten | Betrag | Ursache |
|---|---|---|
| Pro-Grundgebühr | 20,00 $ | fix |
| Build CPU Minutes (11.772) | 24,61 $ | rund 30 Deployments pro Tag |
| Deployment Storage | 14,71 $ | alte Deployments bis zu 1 Jahr aufbewahrt |
| Serverless Function Storage | 6,98 $ | hängt an denselben Deployments |
| Besucherverkehr (ISR, CDN, Bilder, Funktionen) | ca. 1,60 $ | echte Nutzung |
| MwSt. 19 % | 12,91 $ | |

Rund 46 von 48 $ Mehrkosten entstanden durch den Arbeitsablauf, nicht durch Besucher.
Belegt per Vercel-MCP: 100 Deployments zwischen 15.10. 22:16 und 18.10. 21:52 UTC,
davon viele reine Doku-Commits (`docs(...)`, `chore(gitignore)`).

## Eingestellt am 19.10.2026 (Projekt `steakakademie-v2`, Dashboard → Settings → Build and Deployment)

**1. Ignored Build Step** (Projekt-Einstellung, nicht in `vercel.json`):

```sh
P=$VERCEL_GIT_PREVIOUS_SHA;[ "$P" ]&&[ $P != $VERCEL_GIT_COMMIT_SHA ]&&git diff --quiet $P HEAD -- ':!docs' ':!plans' ':!compliance' ':!steakakademie-audit' ':!handoff' ':!wachstum' ':!.claude' ':!.agents' ':!.github' ':(exclude,glob)*.md';[ $? = 0 ]
```

- Exit 0 = Build überspringen, alles andere = bauen.
- **Redeploy desselben Commits baut immer** (`$P != $VERCEL_GIT_COMMIT_SHA`). Korrektur
  19.10.2026, 22:50: Die erste Fassung (ohne diese Bedingung) hat Redeploys nach einer
  geänderten Umgebungsvariable übersprungen — Uwe änderte `ADMIN_PASSWORD`, zwei Redeploys
  endeten `CANCELED`, das neue Passwort griff nicht. Env-Änderungen brauchen einen Build.
- `VERCEL_GIT_PREVIOUS_SHA` ist der letzte **erfolgreiche** Deploy dieses Branches.
  Verglichen wird also alles seit dem letzten Build, nicht nur der letzte Commit.
- Sicher nach oben: Fehlt die Variable (erster Push eines neuen Branches), wird gebaut.
- **Exit 128 ist KEIN „bauen" — Korrektur 23.10.2026, belegt.** Die Fassung vom 19.10.
  endete mit dem Exitcode von `git diff`; liegt der Vorgänger-Commit nicht im flachen
  Klon (`fatal: bad object c8687ae…`), ist das 128, und Vercel setzt das Deployment auf
  **ERROR** statt zu bauen. Genau das traf am 22.10. 22:41 UTC drei Preview-Deploys
  (Branches von #471/#472/#473, jeweils nach einem Merge von `main` in den Branch —
  der letzte erfolgreiche Deploy des Branches lag damit außerhalb der Klon-Tiefe) und
  erzeugte KAN-96/KAN-97. Deshalb endet der Befehl jetzt mit `;[ $? = 0 ]`: nur ein
  leerer Diff liefert 0 (überspringen), alles andere — auch 128 — liefert 1 (bauen).
  Lokal geprüft (23.10.): fehlender Vorgänger → 1, Code-Commit → 1, leere Variable → 1,
  Redeploy → 1, Doku-Commit #468 → 0. Dafür ist `':!.gitignore'` aus der Liste
  gefallen (Feldgrenze 256 Zeichen, jetzt 250): eine `.gitignore`-Änderung baut
  einmal umsonst, das ist der billigere Fehler.
- Ausgenommen sind nur Pfade, die der Build nachweislich nicht liest (prebuild,
  postbuild, `contentlayer.config`, `next.config`, `src/` am 19.10.2026 per grep geprüft)
  und `.md` **nur im Wurzelverzeichnis** (`glob`-Magie: `*` überspringt kein `/`).
  `.md`-Dateien in `data/`, `public/`, `src/` lösen weiter einen Build aus.
- Gegen die letzten 12 main-Commits getestet: 7 übersprungen, 5 gebaut — alle 5 mit
  Änderungen unter `content/`, `data/` oder `design/`.
- **Wer einen neuen Ordner anlegt, den der Build liest, darf ihn nicht in diese
  Liste aufnehmen.** Wer einen neuen reinen Doku-Ordner anlegt, kann ihn ergänzen
  (Feld max. 256 Zeichen, aktuell 250).
- PRs blockiert das nicht: Vercel ist seit 05.09.2026 kein Pflicht-Check (CLAUDE.md §A).

**2. Build-Maschine:** fest **Standard** (4 vCPU, 8 GB) statt Elastic. Elastic lief
zuletzt ebenfalls auf 4 vCPU, hätte aber bei langen Builds selbsttätig hochskaliert
(bis 30 vCPU). Basic (2 vCPU) wäre pro Build vermutlich günstiger, aber langsamer —
nicht gewählt, erst nach Messung der nächsten Rechnung entscheiden.

**3. Deployment-Aufbewahrung:** Abgebrochen 1 Tag · Fehlgeschlagen 1 Woche ·
Vorschau 1 Woche · Produktion 30 Tage (vorher 30 / 90 / 180 Tage / 1 Jahr).
Rollback ist damit nur 30 Tage zurück möglich.

## Belegt am 19.10.2026 (Branch `chore/vercel-kosten-senken`)

- Erster Push (`038eec7`, neuer Branch): gebaut wie vorgesehen, auf Standard in
  112 s READY (letzter Elastic-Build auf main: 103 s).
- Zweiter Push (`6e1a9f3`, nur diese Datei): Deployment `CANCELED`, GitHub-Status
  `Vercel` = **success** mit „Canceled by Ignored Build Step" — blockiert also keinen PR.

## Nicht geändert

- **On-Demand Concurrent Builds** steht auf „Run all builds immediately". Ob das
  zusätzlich kostet oder nur die Warteschlange überspringt, ist aus der Doku nicht
  eindeutig — erst an der nächsten Rechnung prüfen.
- **Spend Management** — von Uwe am 19.10.2026 gesetzt: Team-Budget **5 $**, Pause **aus**,
  Webhook aus. Vercel warnt fest bei 50 / 75 / 100 % (also 2,50 / 3,75 / 5 $); eigene
  Schwellen gibt es nicht. Das Budget gilt für On-Demand-Kosten **nach** dem im Pro-Plan
  enthaltenen Guthaben und ist **keine Kostenbremse** — ohne Pause laufen Kosten weiter,
  es kommen nur Warnungen. Pause bleibt bewusst aus: sie würde steakakademie.de abschalten.

## Prüfen bei der nächsten Rechnung (~17.11.2026)

Build CPU Minutes, Deployment Storage und Serverless Function Storage gegen die
Werte oben halten. Sinkt Build CPU nicht deutlich, Basic-Maschine erwägen.
