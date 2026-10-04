# Ideen-Radar — entfernt am 03.10.2026

**Abteilung:** Redaktion · beschrieben 27.08.2026, entfernt 03.10.2026.

## Was es war

Ein Themenspeicher: Der Radar las die RSS-Feeds von acht amerikanischen BBQ-Seiten
und legte daraus einen internen Backlog an — ausschließlich Titel, Link, Datum und
Kategorien, nie Fließtext, Zutaten oder Bilder.

## Warum entfernt

Der Radar hat gesammelt, aber nichts hat das Gesammelte je verarbeitet: Die Brücke
zum Rezept-Agenten wurde nie gebaut. Bei der Entfernung lagen 98 Einträge im
Backlog, alle im Zustand `neu`, und kein Skript las sie. Den Nachschub für die
Rezept-Produktion liefert `scripts/recipe-seeds.mjs` (`data/rezept-seeds.json`),
unabhängig vom Radar.

Gelöscht sind: `.github/workflows/ideen-radar.yml`, `scripts/ideen-radar.mjs`,
`data/ideen-backlog.json`, `data/rezept-quellen.yaml` sowie der Eintrag
„Ideen-Radar" in `data/ops-heartbeat.json`. `scripts/workflows.test.mjs` hält fest,
dass Workflow, Skript und Backlog nicht unbemerkt zurückkommen.

Wer wieder eine Themenrecherche aus fremden Quellen baut, liest zuerst den
folgenden Abschnitt — er gilt unabhängig vom Werkzeug.

## Zwei Quellen sind ausgeschlossen — und bleiben es

Geprüft am 27.08.2026. Die Ausschlüsse standen bis zur Entfernung zusätzlich im
Kopf von `data/rezept-quellen.yaml`; dieser Abschnitt ist seit 03.10.2026 ihr
einziger Ort.

**bbqingwiththenolands.com** sperrt in der robots.txt `ClaudeBot`, `GPTBot`,
`anthropic-ai`, `CCBot`, `Google-Extended`, `Bytespider`, `Amazonbot`,
`Applebot-Extended` und `meta-externalagent` mit `Disallow: /`. Das ist ein
ausdrückliches Opt-out, und es wird respektiert. Nicht wieder aufnehmen ohne
schriftliche Erlaubnis. (Die Begründung vom 27.08. lautete zusätzlich, unsere eigene
robots.txt lade dieselben Crawler ein. Das stimmt seit 01.10.2026 nicht mehr — wir
sperren Training-Crawler inzwischen selbst, `docs/bot-schutz-2026-10.md`. Am
Ausschluss ändert das nichts.)

**usa-kulinarisch.de** untersagt im Impressum die Nutzung durch kommerzielle
Portale wörtlich: *„dass sich kommerzielle Portale zum Nulltarif bei mir bedienen
… betrachte ich meine Urheberrechte als verletzt und werde entsprechend dagegen
vorgehen."* Erlaubt ist es nur nach Rücksprache per Mail. Solange die nicht
vorliegt: draußen. Die Betreiberin lädt zur Anfrage ausdrücklich ein — eine
Kooperation mit gegenseitiger Verlinkung wäre der saubere Weg. Der Entwurf dafür
liegt in `docs/anfrage-usa-kulinarisch.md`.

## Die Grenze, die für jede Themenrecherche gilt

Gerichtenamen und Themen sind nicht schutzfähig, der ausformulierte Text und die
Fotos einer Seite sehr wohl. Aus einem fremden Titel wird bei uns höchstens ein
*Auftrag* an die eigene Pipeline: eigene Recherche, eigener Text, eigene
Umrechnung, eigene Bilder. Wo eine Quelle den Anstoß gegeben hat, wird sie im
fertigen Beitrag genannt und verlinkt (CLAUDE.md §2 Regel 1 und 5).
