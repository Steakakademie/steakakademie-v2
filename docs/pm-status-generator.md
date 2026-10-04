# PM-Status-Generator — Entwurf und Betriebsregeln

> Status: **Alle acht Bereiche migriert.** `readinessScore` liefert seit dem
> 13.08.2026 erstmals eine belegte Zahl: 72 % (58 von 81 pruefbaren Kriterien).
> Stand 13.08.2026.

Dieses Dokument legt fest, **was** der Generator misst und **warum** er es so
misst. Die Kriterien selbst stehen in `data/pm-status-kriterien.yaml`, der Code
in `scripts/generate-pm-context.mjs`, das Ergebnis in
`src/lib/pm-agent-context.generated.ts`.

## Vorgeschichte: der Fehler, der das ausgelöst hat

Bis August 2026 enthielt `pm-agent-context.generated.ts` Bereichsprozente aus
einem einmaligen Lauf vom 25.06.2026. Zwei davon — „Auth & Community 0 %" und
„Agenten & Automation 0 %" — hat das Konsistenz-Audit vom 10.08.2026 als
nachweislich falsch belegt (CLAUDE.md §1).

Die Nullen bedeuteten nie „0 % fertig". Sie bedeuteten **„nicht gemessen"**.
Das Datenformat konnte den Unterschied nicht ausdrücken, und so wurde aus einer
fehlenden Messung eine Tatsachenbehauptung — im Admin-Dashboard als Balken, im
System-Prompt des PM-Agenten als Fakt.

Zwei weitere Befunde aus derselben Untersuchung:

- Der Generator `generate-pm-context.js`, auf den sich der Dateikopf berief,
  lag nicht im Repo und war **nie committet**. Die Datei wurde faktisch von
  Hand gepflegt.
- Die vier Listen (`completed`, `critical`, `next`, `open`) enthielten 76
  Einträge mit inneren Widersprüchen: „Physisches Diplom" stand gleichzeitig
  in `completed` und `open`, „Supabase Auth abschließen" in `critical` **und**
  `next`, obwohl Auth live ist. `critical` zählte 19 Einträge, während
  CLAUDE.md §5 fünf Blocker führt — der Prompt behauptete dem Agenten
  gegenüber „19 kritische Blocker".

Daraus folgen die Regeln unten. Sie sind keine Stilfragen.

## Die drei Ebenen

**Ebene 1 — Fakten.** Interpretationsfreie Messungen. Eine Zahl oder ein
Boolean, den zwei Personen unabhängig gleich ermitteln. Vier Quellen:

| Quelle | Beispiele |
|---|---|
| Repo | Dateien, Routen, Frontmatter, Konfigurationswerte |
| Lokale Tools | `npm audit --json`, `tsc --noEmit`, `npm ls` |
| GitHub-API | Workflow-Läufe und ihre Ergebnisse |
| DNS / HTTP | NS-, MX-, TXT-Records, `server`-Header der Live-Seite |

**Ebene 2 — Kriterien.** Falsifizierbare **Sätze**, je auf genau einen Fakt
gestützt. Keine Substantive: „Supabase" kann weder wahr noch falsch sein,
„Jeder Avatar-Zustand hat ein Video-Asset" schon.

**Ebene 3 — Score.** `erfüllt ÷ prüfbar`, pro Bereich und gesamt. Nie ohne
Nenner ausgeliefert.

## Regel 1: Drei Zustände, nicht zwei

Jedes Kriterium ist `erfuellt`, `nicht_erfuellt` oder **`nicht_messbar`**.

Nicht-messbare Kriterien fallen aus dem Nenner. Sie zählen **nicht** als
nicht erfüllt. Ohne diese Regel entsteht wieder eine Null, die „nicht
gemessen" heißt und als „0 % fertig" gelesen wird.

## Regel 2: Fehlschlag ist kein Ergebnis

Ein DNS-Timeout, eine nicht erreichbare API, ein abgestürztes Tool ergeben
`nicht_messbar` — niemals `nicht_erfuellt`.

Dieser Fehler ist im Projekt schon einmal passiert: Am 09.08.2026 meldete
`direct_clip_search` `clips: [], errors: []`, obwohl in Wahrheit die
Netzverbindung gesperrt war. Der Fehlschlag wurde still als „0 Treffer"
verbucht (siehe memory.md).

## Regel 3: Fehlgeschlagenes Parsen bricht ab

Findet der Generator die Blocker-Sektion in CLAUDE.md nicht — Überschrift
umbenannt, Format geändert —, schreibt er **keine leere Liste**, sondern
beendet sich mit Exit-Code 1. Eine leere Blockerliste würde dem Agenten
„null Blocker" erzählen, also das Gegenteil der Wahrheit.

Dasselbe gilt für jede andere Quelle, deren Struktur sich ändern kann.

## Regel 4: Kriterien sind Daten, nicht Code

Die Kriterien leben in `data/pm-status-kriterien.yaml`. Eine
Definitionsänderung ist damit ein lesbarer Content-Diff, kein Code-Review.
Der Generator hält nur die Prüf-Implementierungen unter ihrer `pruefung`-ID.

Ein Kriterium ohne zugeordnete Prüfung ist ein harter Fehler — sonst
verschwindet es still aus dem Nenner.

## Regel 5: Nicht jede naheliegende Prüfung ist richtig

Ein Kriterium kann technisch sauber messen und trotzdem das Falsche verlangen.
Dann bestraft der Score eine bewusste, gut begründete Entscheidung — und der
Druck entsteht, sie rückgängig zu machen, statt das Kriterium zu korrigieren.

Zwei Beispiele aus „Monetarisierung", beide bewusst **nicht** geprüft:

- **„Alle Amazon-Links sind `/dp/`-Deeplinks."** Klingt richtig, wäre falsch.
  Bei Produkten mit US-Eigenvertrieb (Thermapen ONE, ThermoWorks Signals) ist
  die Such-URL die bessere Wahl, weil der Deeplink auf amazon.de ins Leere
  führt. Festgehalten in memory.md, 25.06.2026.
- **„Der Digistore-Webhook prüft eine `sha_sign`-Signatur."** Der eingesetzte
  IPN-Typ unterstützt das gar nicht; Token-in-URL ist die dokumentierte Wahl.
  Geprüft wird deshalb, was tatsächlich schützt: dass ohne gültiges Token
  ein 401 zurückkommt.

Beide Auslassungen stehen als Kommentar im Kriterienkatalog, direkt neben der
Stelle, an der jemand sie „nachrüsten" würde. Eine stillschweigende Auslassung
wäre wertlos — sie würde beim nächsten Durchgang wieder eingebaut.

Praktische Konsequenz: Wer ein Kriterium hinzufügt, prüft zuerst, ob der
gemessene Sollzustand wirklich der gewollte ist. Im Zweifel ist die
Projekthistorie (`memory.md`, CLAUDE.md) die Quelle, nicht die Intuition.

## Die Felder

| Feld | Herkunft |
|---|---|
| `bereiche` | Gemessene Bereiche: Score, Zähler, Nenner, alle Einzelkriterien mit Beleg |
| `nichtGemessen` | Bereiche ohne Kriterienkatalog. **Explizit gelistet, nicht weggelassen** — sonst sieht das Dashboard vollständig aus, obwohl es sechs Achtel nicht kennt |
| `critical` | Geparst aus **CLAUDE.md §5**. Bereits menschlich kuratiert, priorisiert, versioniert |
| `completed` | Abgeleitet: Kriterien mit Status `erfuellt` |
| `open` | Abgeleitet: Kriterien mit Status `nicht_erfuellt` |
| `readinessScore` | `null`, solange nicht alle acht Bereiche migriert sind |

`completed` und `open` sind damit **zwei Sichten auf einen Datensatz**. Ein
Eintrag kann nicht mehr in beiden stehen — das ist strukturell ausgeschlossen,
nicht bloß einmalig korrigiert.

`next` entfällt ersatzlos. Priorisierung ist ein Urteil, kein Repo-Fakt, und
CLAUDE.md §5 ist bereits nach Priorität nummeriert. Eine zweite, handgepflegte
Reihenfolge war genau das Artefakt, das verrottet ist.

## readinessScore: über Kriterien, nicht über Bereiche

Sobald alle acht Bereiche migriert sind, gilt

```
readinessScore = erfüllte Kriterien (gesamt) ÷ prüfbare Kriterien (gesamt)
```

**Nicht** der Mittelwert der acht Bereichsprozente. Der würde einen Bereich mit
vier Kriterien genauso stark gewichten wie einen mit zwanzig.

Ausgeliefert wird nie die nackte Zahl, sondern immer mit Nenner:
„52 % (37 von 71 prüfbaren Kriterien, 6 nicht messbar)". Damit bekommt auch das
„Ziel 80 %" im Agenten-Prompt zum ersten Mal eine überprüfbare Bedeutung.

Seit dem 13.08.2026 sind alle acht Bereiche migriert, das Feld traegt also eine
Zahl: **72 % (58 von 81 pruefbaren Kriterien)**. Faellt spaeter ein Bereich
zurueck in `nichtGemessen`, wird das Feld wieder `null` — eine fehlende Kennzahl
ist ehrlicher als eine erfundene, und `null` zwingt Dashboard und Prompt, den
Zustand zu benennen statt eine Zahl zu zeigen.

## Was bewusst nicht gemessen wird

Ersatzlos gestrichen, weil außerhalb des Repos und nicht automatisch prüfbar:
„Sitemap bei Google eingereicht" (die DNS-Verifikation ist prüfbar, die
Einreichung selbst nur über die GSC-API), „Physisches Diplom", die
Social-Accounts, „Portraits generieren", „CLAUDE.md Mindmap-Hook" (liegt in
`~/.claude`, nicht im Repo), sowie alle Substantiv-Einträge ohne Aussage.

Von 25 `completed`-Einträgen überlebt rund ein Drittel als geprüftes Kriterium.
Das ist beabsichtigt: eine kürzere Liste, in der jeder Eintrag stimmt, ist mehr
wert als 25, von denen einer den falschen Hoster nennt — siehe unten.

## Was von außen prüfbar ist (DNS/HTTP)

Am 13.08.2026 gemessen:

| Prüfung | Befund |
|---|---|
| NS | `rohin.ns.cloudflare.com`, `zita.ns.cloudflare.com` → Cloudflare DNS bestätigt |
| MX | `route1/2/3.mx.cloudflare.net` → Cloudflare Email Routing aktiv |
| SPF | `v=spf1 include:_spf.mx.cloudflare.net ~all` — **kein Loops-Include** |
| DMARC | `v=DMARC1; p=none` — vorhanden, aber nur Monitoring |
| GSC | `google-site-verification=…` als TXT → Search Console verifiziert |
| Hosting | `server: Vercel`, `x-vercel-id: fra1::…` |

Zwei Konsequenzen:

1. **Der Eintrag „Netlify Hosting" war falsch.** Die Seite läuft auf Vercel.
   Im Repo liegen `netlify.toml` und `vercel.json` nebeneinander; die
   Netlify-Datei ist ein Überbleibsel. Ein handgepflegter Eintrag hat monatelang
   den falschen Hoster behauptet.
2. **Die Search-Console-API ist verfügbar.** Die Verifikation liegt nicht als
   Meta-Tag im Repo, sondern als DNS-TXT — eine Repo-Suche findet sie nicht.
   Für „SEO & Traffic" sind damit echte Messwerte erreichbar, ebenso GA4.

## Migrationsreihenfolge

Begonnen wurde mit **Avatar-System** und **Tech-Stack & Tools**, weil beide
ihren Nenner bereits mitbringen: der Zustandsautomat definiert sieben Zustände,
`npm audit` liefert JSON. Dort ließ sich das Format an echten Daten prüfen,
bevor die strittigen Bereiche drankamen.

Danach **Technische Infrastruktur** — der erste Bereich, der ganz überwiegend
von außen gemessen wird (HTTP-Header, DNS, GitHub-API). Er hat zwei Regeln
auf die Probe gestellt: ohne Netz sind zehn seiner zwölf Kriterien
`nicht_messbar`, und ein Bereich kann dadurch `score: null` bekommen. Beides
darf nicht als Balken bei 0 % erscheinen — Dashboard und Prompt weisen es
seither ausdrücklich als "nicht messbar" aus.

Dann **Monetarisierung** — der Bereich, der Regel 5 erzwungen hat: zwei
naheliegende Kriterien haetten bewusste Entscheidungen als Maengel gewertet.
Umsatzzahlen bleiben aussen vor, gemessen wird die Verdrahtung.

Zuletzt **KI-System & Automation**. Der Bereich misst nicht nur Technik,
sondern die Einhaltung der nicht-verhandelbaren Regeln — und hat dabei einen
echten Widerspruch zwischen Doktrin und Implementierung freigelegt (siehe
unten).

Dann **Kurse & Diplom** — der erste Bereich, in dem die Messung den Bestand
besser aussehen liess als die Schaetzung: 90 %. Die 35 Lektionen sind
lueckenlos, ohne doppelte Slugs oder Ordnungszahlen und mit allen neun
Pflichtfeldern. Der frueher vermutete Widerspruch "5 Lektionsstufen gegen 4
Diplom-Stufen" existierte nie (siehe unten).

Dann **SEO & Traffic** — 90 %, aber mit einer wichtigen Einschraenkung: der
Bereich misst die *Struktur*, nicht den *Traffic*. Es gibt keine serverseitig
angebundene Datenquelle. Plausible und Clarity laufen im Browser; die
/go-Redirects senden zwar Ereignisse an `plausible.io/api/event`, aber Senden
ist nicht Lesen. Das ist als eigenes Kriterium erfasst und steht auf
`nicht_erfuellt`, nicht auf `nicht_messbar`: dass nichts angebunden ist, laesst
sich einwandfrei feststellen — es ist ein Befund, kein Messfehler.

Zuletzt **Content-Strategie** — der Bereich, der am laengsten offen blieb, weil
ihm der Nenner fehlt. Geloest durch Verzicht: gemessen wird ausschliesslich die
*Beschaffenheit* des Bestands, nie sein Umfang. "Wie viele Rezepte sind genug"
steht nirgends im Repo; Aufloesbarkeit, Konsistenz und Vollstaendigkeit dagegen
sind ohne Zielvorgabe pruefbar. Kommt spaeter eine Keyword-Map als Datei dazu,
kann Umfang ergaenzt werden.

Damit sind alle acht Bereiche migriert und `readinessScore` ist nicht mehr
`null`.

Für „Content-Strategie" ist vorher zu klären, woraus der Nenner kommt — es gibt
weder Keyword-Map noch Redaktionsplan als Datei. Ohne beides ist der Bereich
nicht ehrlich zu bepunkten und bleibt besser `nichtGemessen`.

## Offener Widerspruch: Regel 4 gegen die Wachstums-Workflows

Regel 4 in CLAUDE.md steht unter den **nicht-verhandelbaren** Regeln:
„Agenten produzieren Entwuerfe, **Uwe gibt frei**. Kein Auto-Posting.“

Gemessen am 13.08.2026 pushen vier Workflows generierte Artefakte direkt auf
`main`, ohne Pull Request: `recipe-grow.yml`, `glossary-grow.yml`,
`regenerate-recipe-images.yml`, `train-pork-lora.yml`. `recipe-grow` schreibt
in seine eigene Zusammenfassung: „committet + gepusht → loest Deploy aus“.

Ein Freigabe-Schritt existiert nirgends: das Rezept-Frontmatter kennt kein
`draft`-Feld, und der Contentlayer-Typ definiert auch keines. KI-erzeugte
Rezepte und Glossareintraege gehen also ungeprueft live.

Entweder die Workflows oder die Regel muessen sich aendern. Diese Entscheidung
gehoert Uwe, nicht dem Generator. Das Kriterium
`generatoren-pushen-nicht-direkt` haelt den Widerspruch so lange sichtbar,
bis er entschieden ist — und faellt weg oder wird gruen, je nachdem wie.

**Nachtrag 03.10.2026:** Der Abschnitt beschreibt die Messung vom 13.08.2026. Seit
04.09.2026 oeffnen die Bot-Workflows Pull Requests, statt direkt zu pushen
(`docs/ci-bot-pat.md`); ob das Kriterium damit gruen ist, wurde fuer diesen Nachtrag
nicht neu gemessen. `glossary-grow.yml` ist seit 03.10.2026 pausiert — kein Zeitplan
mehr, der Handstart gilt weiter.

## Warnung: grep taugt nicht zur Befundaufnahme

Waehrend dieser Migration haben oberflaechliche Textsuchen **vier** Befunde
erzeugt, die sich bei genauem Hinsehen aufloesten:

| Behauptung | Wirklichkeit |
|---|---|
| „Der Avatar-Automat hat 8 Zustaende“ | 7 — ein `'react'` aus fremdem Kontext wurde mitgezaehlt |
| „2 Workflows haben keinen Trigger“ | Alle 16 haben einen; gesucht wurde nur nach `schedule` und `workflow_dispatch`, nicht nach `issues` oder `deployment_status` |
| „5 Lektionsstufen gegen 4 Diplom-Stufen“ | Es gibt 5 Tiers; das Suchmuster enthielt `meister`, der Code schreibt `master` |
| „Platin und Meister sind unerreichbar“ | `tierForLevel` wird von einer 10er-Level-Liste gefuettert, nicht von der 5er-Roadmap |

| „11 Seiten ohne Metadata“ | Alle 11 sind in robots.txt gesperrt oder in `next-sitemap.config.js` ausgeschlossen — die 91-von-93-Zaehlung zuvor hatte ausserdem alle `.tsx` statt nur `page.tsx` gezaehlt |
| „Traffic-Quelle ist angebunden“ | Gefunden wurde `plausible.io/api/event` in den /go-Redirects: Ereignis-Versand, kein Statistik-Abruf |

Die letzten beiden entstanden erst *im gebauten Kriterium* und wurden nur
entdeckt, weil das Ergebnis unplausibel aussah („93 von 93 Rezepten fehlen“).

Alle sechs waeren als Kriterium in den Katalog gewandert und haetten dort
dauerhaft Falsches behauptet — mit dem Anschein von Messgenauigkeit, weil sie
aus einem Generator kommen.

Konsequenz fuer neue Kriterien: **Die Pruefung parst, sie grept nicht.** Wo ein
Muster unvermeidlich ist, wird der Befund vor dem Einbau an der Quelle
gegengelesen. Ein falsches Kriterium ist schaedlicher als ein fehlendes: das
fehlende weiss man nicht, das falsche glaubt man.

## Betrieb

```bash
npm run pm:context            # misst und schreibt die generierte Datei
npm run pm:context -- --offline   # überspringt Netz-Prüfungen (→ nicht_messbar)
npm run pm:context -- --check     # schreibt nichts, Exit 1 bei Abweichung (CI)
```

Der Generator ist idempotent: gleicher Repo-Stand, gleiches Ergebnis. Einzige
Ausnahme ist das Feld `generatedAt`, das im `--check`-Modus ignoriert wird.
