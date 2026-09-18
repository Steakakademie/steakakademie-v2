# SEO-Monitoring-Log — Steakakademie

> Wöchentlicher Status-Check gegen die Audit-Baseline vom 07.07.2026.
> Neuester Eintrag oben. Erhebung via US-basierter WebSearch → DE-SERP kann abweichen (Caveat je Zeile).

## KW38 — 14.09.2026

> Vorwoche = **KW37 (07.09.)**, direkt darunter. Abstand 7 Tage, sauberer Wochenrhythmus.
> Queries wörtlich wie im Auftrag — 1:1 vergleichbar mit KW37.

### Rankings (US-basierte WebSearch — Trefferliste, KEINE deutsche SERP-Position)

| Keyword | steakakademie.de in der Trefferliste? | Wer erscheint (Top 3) | Δ KW37 | Δ Baseline |
|---|---|---|---|---|
| „Kerntemperatur Steak" | ❌ **nein** (Liste mit 5 Treffern) | lecker.de · shop.block-house.de · grillfuerst.de | = (KW37 ebenfalls nicht gelistet; **Top 3 identisch**) | = (Baseline: nicht in Top 10) |
| „Ribeye" | ❌ nein — trotz eigenem Ribeye-Guide | meatnbone.com · Wikipedia „Rib eye steak" · allenbrothers.com | = (Feld weiter rein US/EN) | = |
| „Reverse Sear" | ❌ nein — trotz eigener Methoden-Seite | traeger.com · jesspryles.com · theglamorousgourmet.com | = (nicht gelistet; Top-3-Zusammensetzung leicht rotiert) | = |
| „Brisket Anleitung" | ❌ nein — trotz eigenem Brisket-Guide | bbqpit.de · ofen.de · bbqlicate.de | = (nicht gelistet; beefbandits jetzt Rang 4 statt 3) | = |
| „Steakakademie" (Brand) | ✅ ja — **Rang 5** (`steakakademie.de/`) | Instagram @steakakademie · Facebook Steakakademie (Bochum, fremd) · **github.com/Arkamas/steakakademie-v2** | 🔴 **Rang 3 → Rang 5** | 🔴 schlechter (Baseline: Platz 1) |

⚠️ **Methodik-Caveats:**
- Werkzeug ist US-basiert. Laut `docs/geo-baseline.md` (Messung 3) ist die Trefferliste
  **keine deutsche SERP-Position**. Leitmessung bleibt der manuelle DE-Inkognito-Check
  durch Uwe — **auch diese Woche nicht erhoben** (damit seit Messung 3, 09.08., offen).
- „Ribeye" und „Reverse Sear" liefern erneut eine **rein US/EN-SERP** — für DACH der
  falsche Markt. Als „nicht gefunden" gewertet, aber ohne Aussagekraft.
- Der Brand-Rückgang von Rang 3 auf 5 ist bei diesem Werkzeug **keine belegte
  Positionsveränderung**; die Ursache ist aber sichtbar (siehe Befund).

**Befund — neu diese Woche:** Beim Brand-Keyword stehen jetzt **zwei GitHub-Seiten des
eigenen öffentlichen Repos** (`Arkamas/steakakademie-v2` sowie PR #49 unter
`Steakakademie/steakakademie-v2`) **vor** der eigenen Domain. Das Repo ist öffentlich
(bekannt, siehe Memory „Repo-Hygiene"); neu ist, dass es auf die Marken-Query indexiert
wird und dabei die Website verdrängt. SEO-Schaden gering (wer „Steakakademie" sucht,
findet die Seite weiterhin), aber das Marken-SERP zeigt Interessenten jetzt PR-Titel wie
„fix(ci): Fehlerpfad in pr-statt-push" statt Inhalte. Bei den vier Sach-Keywords bewegt
sich nichts: null Sichtbarkeit, bei „Kerntemperatur Steak" sogar Top 3 **identisch** mit
KW37.

### Off-Page-Delta

Query `"steakakademie.de" -site:steakakademie.de`: **weiterhin 0 echte externe
Erwähnungen/Backlinks.** Alle Treffer sind Namensvettern oder fremde Kursanbieter,
keiner verlinkt auf unsere Domain:

- https://www.facebook.com/steakakademie/ (Steakakademie Bochum — fremd)
- https://beisser.de/fleischerei/steakakademie/
- https://www.grillkonzept.de/kurstermin/steakakademie-100-bestes-fleisch-holzwickede-2022-05-13/ (**neu in der Liste**, fremder Kursanbieter)
- https://www.grillkonzept.de/kurstermin/steakakademie-100-bestes-fleisch-2024-01-05/
- https://www.oberpfalz-beef.de/gutschein-kurs-steaktasting/7024 (fremd)
- Wikipedia „Nordakademie" (themenfremd)
- (KW37 gelistet, diese Woche nicht mehr: smokefire-grillakademie.de — Listen-Rauschen, war ohnehin kein Link auf uns)

**Δ KW37 (0) und Δ Baseline (0): unverändert 0 — jetzt 10 Wochen.**

> Abgrenzung, damit es nicht falsch gezählt wird: Die neu sichtbaren GitHub-Seiten sind
> **eigene Properties**, kein externer Backlink und kein Autoritätssignal. Off-Page
> bleibt bei null.

### Technik-Status

| Check | Ergebnis | Status | Δ KW37 |
|---|---|---|---|
| www → non-www Redirect | `https://www.steakakademie.de/` → `https://steakakademie.de/`, Seite lädt vollständig, Canonical `https://steakakademie.de`, `meta-robots: index, follow` | 🟢 ok | = |
| `/llms.txt` erreichbar | vollständig ausgeliefert (`text/plain`): Kern-Referenzen, Weitere Inhalte, Über | 🟢 ok | = (5. Woche in Folge sauber) |
| `/robots.txt` endet mit Sitemap-Zeile | `Sitemap: https://steakakademie.de/sitemap.xml` als letzte Zeile; AI-Crawler (GPTBot, ClaudeBot, PerplexityBot u. a.) weiterhin ausdrücklich erlaubt | 🟢 ok | = |

### Offene Punkte / GEO

- Wikidata **Q140455747** in `src/lib/schema.ts` (`sameAs`, Zeile 35) ✅ weiterhin verdrahtet — nichts offen.
- **AI-Abfragen-Tabelle `docs/geo-baseline.md`: Messung 4 (01.09.) weiterhin komplett leer**
  (ChatGPT, Perplexity, Google AIO — alle drei „nicht erhoben"), Messung 2 (04.08.) ebenfalls.
  Der 4-Wochen-Re-Check war zum **06.09. fällig — jetzt 8 Tage überfällig**. Nur manuell
  durch Uwe erhebbar (~15 Min für alle drei).
  Folge unverändert: Die Kernfrage aus Messung 3 — **bleibt der Perplexity-Treffer vom
  09.08. stabil?** — ist seit fünf Wochen unbeantwortet. Der einzige belegte GEO-Erfolg
  des Projekts gilt weiter als *einmalig beobachtet*, nicht als Ranking.
- **Backlinks = 0** bleibt der strukturelle Engpass — jetzt 10 Wochen unverändert.
  Die Empfehlung aus KW36 **und** KW37 (Foren-Referenz) ist erneut nicht umgesetzt worden.
- Nicht geprüft in diesem Lauf: DE-Inkognito-SERP, echte Positionen, Google Search Console,
  Traffic-Zahlen, Content-Änderungen seit KW37.

### Ampeln

- Rankings: 🔴 (4 von 5 Keywords ohne Sichtbarkeit, Sach-Top-3 teils wörtlich identisch mit KW37; Brand-Query zusätzlich von eigenen GitHub-Seiten verdrängt)
- Off-Page: 🔴 (10 Wochen 0 Backlinks — Ursache Nr. 1, unverändert)
- Technik: 🟢 (alle drei Checks sauber, fünfte Woche in Folge)

### Handlungsempfehlung (max. 1)

**Die Foren-Empfehlung entweder diese Woche terminieren oder streichen.** Sie steht jetzt
die dritte Woche unerledigt im Log; sie noch kleiner zu schneiden hat beim zweiten Versuch
nicht geholfen. Zwei ehrliche Optionen, eine davon wählen:
(a) **15-Minuten-Termin im Kalender** für eine sachliche Antwort in *einem* deutschen
BBQ-Forum (Grillsportverein oder BBQPit-Community) auf eine Frage, die die
Kerntemperatur-Tabelle tatsächlich beantwortet, mit `/temperatur-guide` als Beleg —
Regel 5 (kein Spam): nur posten, wo die Antwort auch ohne Link hilfreich wäre. Oder
(b) **bewusst streichen** und akzeptieren, dass Off-Page vorerst bei null bleibt —
dann steht sie nächste Woche nicht mehr als „offen" im Log.
Ein drittes Mal dieselbe unerledigte Zeile zu wiederholen wäre Selbstbetrug.

### Trend vs. Vorwoche

Stillstand mit einem kleinen Rückschritt: sachlich exakt wie KW37 (null generische
Sichtbarkeit, bei „Kerntemperatur Steak" sogar identische Konkurrenz-Top-3), zusätzlich
verdrängen jetzt eigene GitHub-Repo-Seiten die Domain auf der Marken-Query von Rang 3 auf
Rang 5. Technik seit fünf Wochen stabil grün — das ist nicht die Baustelle. Die Baustelle
ist seit zehn Wochen dieselbe und wurde in zehn Wochen kein einziges Mal angefasst.

---

## KW37 — 07.09.2026

> Vorwoche = **KW36 (31.08.)**, direkt darunter. Abstand 7 Tage, sauberer Wochenrhythmus.
> Queries diesmal wörtlich wie im Auftrag — also 1:1 vergleichbar mit KW36.

### Rankings (US-basierte WebSearch — Trefferliste, KEINE deutsche SERP-Position)

| Keyword | steakakademie.de in der Trefferliste? | Wer erscheint (Top 3) | Δ KW36 | Δ Baseline |
|---|---|---|---|---|
| „Kerntemperatur Steak" | ❌ **nein** (Liste mit 5 Treffern) | lecker.de · shop.block-house.de · grillfuerst.de | 🔴 **Rückfall** (KW36: Rang 5) | = (Baseline: nicht in Top 10) |
| „Ribeye" | ❌ nein — trotz eigenem Ribeye-Guide | Kansas City Steaks · meatnbone.com · 44steaks.com | = | = |
| „Reverse Sear" | ❌ nein — trotz eigener Methoden-Seite | nocrumbsleft.net · theglamorousgourmet.com · jessicagavin.com | = (Top 3 **identisch** mit KW36) | = |
| „Brisket Anleitung" | ❌ nein — trotz eigenem Brisket-Guide | bbqpit.de · ofen.de · grillkameraden.de | = (Top 3 **identisch** mit KW36) | = |
| „Steakakademie" (Brand) | ✅ **ja — Rang 3** (`steakakademie.de/`) | Instagram @steakakademie · Facebook Steakakademie (Bochum, fremd) · **steakakademie.de** | = (KW36 ebenfalls Rang 3) | 🔴 schlechter (Baseline: Platz 1) |

⚠️ **Methodik-Caveats:**
- Werkzeug ist US-basiert. Laut `docs/geo-baseline.md` (Messung 3) ist die Trefferliste
  **keine deutsche SERP-Position** — sie überschätzt vermutlich. Leitmessung bleibt der
  manuelle DE-Inkognito-Check durch Uwe; der ist **auch diese Woche nicht erhoben**.
- „Ribeye" und „Reverse Sear" lieferten erneut eine **rein US/EN-SERP** (US-Händler,
  US-Foodblogs, kein DE-Ergebnis). Für DACH ist das faktisch der **falsche Markt** —
  als „nicht gefunden" gewertet, aber ohne Aussagekraft.
- Der Rückfall bei „Kerntemperatur Steak" ist bei diesem Werkzeug **nicht sicher ein
  Ranking-Verlust**. Rang 5 (KW36) → nicht gelistet (KW37) kann Listen-Rauschen sein.
  Die Query war diesmal identisch, also kein Query-Effekt — das macht es zwar
  belastbarer als letzte Woche, aber immer noch nicht zu einer Positionsaussage.

**Befund:** Der einzige generische Lichtblick der Vorwoche ist weg. Bei drei von vier
Sach-Keywords sind sogar die Top 3 **identisch** mit KW36 — das Feld bewegt sich nicht,
und wir bewegen uns nicht hinein. Brand-Query stabil auf Rang 3, davor weiterhin die
eigenen Social-Kanäle plus die fremde Bochumer Steakakademie.

### Off-Page-Delta

Query `"steakakademie.de" -site:steakakademie.de`: **weiterhin 0 echte externe
Erwähnungen/Backlinks.** Alle Treffer sind Namensvettern oder fremde Kursanbieter,
keiner verlinkt auf unsere Domain:

- https://www.facebook.com/steakakademie/ (Steakakademie Bochum — fremd)
- https://smokefire-grillakademie.de/products/grillkurs-steak-akademie-4-0-das-perfekte-steak-1 (**neu in der Liste**, fremder Kursanbieter, kein Link auf uns)
- https://www.grillkonzept.de/kurstermin/steakakademie-100-bestes-fleisch-2024-01-05/
- https://beisser.de/fleischerei/steakakademie/
- Wikipedia „Nordakademie" (themenfremd)

**Δ KW36 (0) und Δ Baseline (0): unverändert 0 — jetzt 9 Wochen.**

### Technik-Status

| Check | Ergebnis | Status | Δ KW36 |
|---|---|---|---|
| www → non-www Redirect | `https://www.steakakademie.de/` → `https://steakakademie.de/`, Seite lädt vollständig, Canonical `https://steakakademie.de` | 🟢 ok | = |
| `/llms.txt` erreichbar | vollständig ausgeliefert (`text/plain`): Kern-Referenzen, Weitere Inhalte, Über | 🟢 ok | = (4. Woche in Folge sauber) |
| `/robots.txt` endet mit Sitemap-Zeile | `Sitemap: https://steakakademie.de/sitemap.xml` als letzte Zeile; AI-Crawler (GPTBot, ClaudeBot, PerplexityBot u. a.) weiterhin ausdrücklich erlaubt | 🟢 ok | = |

### Offene Punkte / GEO

- Wikidata **Q140455747** in `src/lib/schema.ts` (`sameAs`, Zeile 35) ✅ weiterhin verdrahtet — nichts offen.
- **AI-Abfragen-Tabelle `docs/geo-baseline.md`: Messung 4 (01.09.) ist komplett leer**
  (ChatGPT, Perplexity, Google AIO — alle drei Zeilen „nicht erhoben"), Messung 2 (04.08.)
  ebenfalls. Der turnusmäßige 4-Wochen-Re-Check war für **~06.09. fällig — seit gestern
  überfällig**. Nur manuell durch Uwe erhebbar (~15 Min für alle drei).
  Folge: Die Kernfrage aus Messung 3 — **bleibt der Perplexity-Treffer vom 09.08. stabil?** —
  ist jetzt seit einem Monat unbeantwortet. Der einzige belegte GEO-Erfolg des Projekts
  gilt damit weiter als *einmalig beobachtet*, nicht als Ranking.
- **Backlinks = 0** bleibt der strukturelle Engpass — jetzt 9 Wochen unverändert.
  Die Handlungsempfehlung aus KW36 (Foren-Referenzen) ist **nicht umgesetzt worden**.

**Nebenbefund (nicht Teil des SEO-Auftrags, nur beobachtet):** Die Live-Startseite zeigt
bei Streitfällen, Grilltechniken und Cuts durchgängig „Uwe Yendell" als Autor. Laut
Memory-Stand ist der Autorenwechsel (Marco/Elena/Jonas, Commit `89761d9`, 06.09.) noch
nicht auf main/Produktion — passt zusammen, ist also **kein Defekt**, sondern nur der
Hinweis, dass der Commit noch aussteht. Nicht geprüft: Git-Stand.

### Ampeln

- Rankings: 🔴 (von 🟡 zurück — der einzige generische Treffer ist weg, 4 von 5 Keywords ohne Sichtbarkeit; Brand-Query stabil, aber unter den eigenen Social-Kanälen)
- Off-Page: 🔴 (9 Wochen 0 Backlinks — Ursache Nr. 1, unverändert)
- Technik: 🟢 (alle drei Checks sauber, vierte Woche in Folge)

### Handlungsempfehlung (max. 1)

**Diese Woche einen einzigen Backlink erzeugen — nicht drei bis fünf.** Die
KW36-Empfehlung („3–5 Foren") ist unerledigt geblieben, das ist typisch für zu große
Pakete. Reduzierter Auftrag: **eine** Frage in **einem** deutschen BBQ-Forum
(Grillsportverein oder BBQPit-Community), bei der die Kerntemperatur-Tabelle die
gestellte Frage tatsächlich beantwortet, sachlich beantworten und `/temperatur-guide`
als Beleg verlinken. 15 Minuten. Regel 5 (kein Spam) gilt: nur dort posten, wo die
Antwort ohne Link auch schon hilfreich wäre. Alles andere im SEO-Bereich ist nachrangig,
solange die Autoritätsseite bei null steht.

### Trend vs. Vorwoche

Rückschritt: Der Kopf-Keyword-Treffer aus KW36 ist verschwunden, die Konkurrenz-Top-3
sind bei drei Keywords buchstäblich identisch — es bewegt sich nichts, weil an der
einzigen wirksamen Stellschraube (Backlinks) neun Wochen lang nichts passiert ist.

---

## KW36 — 31.08.2026

> Vorwoche = **KW35 (28.08.)**, direkt darunter. Abstand 3 Tage (Montag statt Freitag erhoben) —
> kurze Spanne, Deltas entsprechend vorsichtig lesen.

### Rankings (Google Top 10, US-basierte Websuche — DE-SERP kann abweichen)

| Keyword | steakakademie.de Top 10? | Wer stattdessen (Top 3) | Δ KW35 | Δ Baseline |
|---|---|---|---|---|
| „Kerntemperatur Steak" | ✅ **ja — Rang 5 der Trefferliste** (`/temperatur-guide`, Titel „Kerntemperaturen Fleisch — Tabelle 2026") | grillclub.amainfo.at · shop.block-house.de · grillfuerst.de | 🟢 **Verbesserung** (KW35: Rang 8/9, allerdings mit abweichender Query) | 🟢 **Verbesserung** (Baseline: nicht in Top 10) |
| „Ribeye" | ❌ nein | Kansas City Steaks · Omaha Steaks · meatnbone.com | = | = |
| „Reverse Sear" | ❌ nein | nocrumbsleft.net · theglamorousgourmet.com · jessicagavin.com | = | = |
| „Brisket Anleitung" | ❌ nein — trotz eigenem Brisket-Guide nicht gelistet | bbqpit.de · ofen.de · grillkameraden.de | = (Top 3 identisch) | = |
| „Steakakademie" (Brand) | ✅ **ja — Rang 3** (`steakakademie.de/`); davor nur die **eigenen** Kanäle Instagram (#1) und Facebook (#2) | Instagram @steakakademie · Facebook Steakakademie (Bochum, fremd) · **steakakademie.de** | 🟢 Verbesserung (KW35: „nicht sichtbar") | 🔴 schlechter (Baseline: Platz 1) |

⚠️ **Methodik-Caveats:**
- Queries diesmal **wörtlich** wie im Auftrag („Kerntemperatur Steak", „Ribeye", „Reverse Sear",
  „Brisket Anleitung", „Steakakademie") — also wieder vergleichbar mit der Baseline, aber **nicht
  1:1 mit KW35**, wo bei zwei Zeilen erweiterte Queries liefen. Die Verbesserung bei
  „Kerntemperatur Steak" ist daher **teilweise ein Query-Effekt**, nicht sicher ein Ranking-Effekt.
- „Ribeye" und „Reverse Sear" lieferten diese Woche eine **rein US/EN-SERP** (US-Händler,
  US-Foodblogs, kein einziges DE-Ergebnis). Für den DACH-Markt ist das Ergebnis **nicht
  aussagekräftig** — als „nicht gefunden" gewertet, aber ehrlich: hier wurde faktisch der
  falsche Markt gemessen. Ohne DE-Standort-Check keine belastbare Aussage.
- Trefferliste ≠ exakte Google-Position (Methodik-Korrektur aus `docs/geo-baseline.md`, Messung 3).

**Befund:** Erstmals seit Beginn dieser Log-Reihe erscheint `/temperatur-guide` beim
Kopf-Keyword „Kerntemperatur Steak" in der Trefferliste — Rang 5, zwischen Grillfürst und
Grillcenter Nord. Das deckt sich mit dem Muster aus `geo-baseline.md`: die Seite ist indexiert
und thematisch korrekt zugeordnet, das Umfeld bleibt aber unverändert von Händlern mit
Domain-Autorität besetzt. Auf den drei anderen Sach-Keywords weiterhin keine Sichtbarkeit.

### Off-Page-Delta

Query `"steakakademie.de" -site:steakakademie.de`: **weiterhin 0 echte externe Erwähnungen/Backlinks.**
Alle Treffer sind Namensvettern bzw. fremde Anbieter, keine Verlinkung auf unsere Domain:
- https://www.facebook.com/steakakademie/ (Steakakademie Bochum / Grillakademie Ruhr — fremd)
- https://www.oberpfalz-beef.de/gutschein-kurs-steaktasting/7024
- https://beisser.de/fleischerei/steakakademie/
- https://www.grillkonzept.de/kurstermin/steakakademie-100-bestes-fleisch-2024-01-05/
- https://akademie-der-kochenden-kuenste.de/kurse/kochkurse/steak-kochkurse/…

**Δ KW35 (0) und Δ Baseline (0): unverändert 0 — jetzt 8 Wochen.**

### Technik-Status

| Check | Ergebnis | Status | Δ KW35 |
|---|---|---|---|
| www → non-www Redirect | `https://www.steakakademie.de/` → `https://steakakademie.de/`, Seite lädt vollständig, Canonical `https://steakakademie.de` | 🟢 ok | = |
| `/llms.txt` erreichbar | vollständig ausgeliefert (`Content-Type: text/plain`), Kern-Referenzen + Weitere Inhalte + Über | 🟢 ok | = (3. Woche in Folge sauber) |
| `/robots.txt` endet mit Sitemap-Zeile | `Sitemap: https://steakakademie.de/sitemap.xml` als letzte Zeile vorhanden; AI-Crawler-Block (GPTBot, ClaudeBot, PerplexityBot u. a.) unverändert erlaubt | 🟢 ok | = |

### Offene Punkte / GEO

- Wikidata **Q140455747** in `src/lib/schema.ts` (`sameAs`, Zeile 35) ✅ weiterhin verdrahtet — nichts offen.
- **AI-Abfragen-Tabelle in `docs/geo-baseline.md`:** Messung 3 (09.08.) ist **vollständig ausgefüllt**
  (ChatGPT ❌, Perplexity ✅ erstmals zitiert, Google AIO ❌). Offen ist die **Tabelle von Messung 2
  (04.08.)** — dort sind alle drei Zeilen noch leer. Nächster turnusmäßiger AI-Re-Check laut
  4-Wochen-Rhythmus: **~06.09.2026, in 6 Tagen.** Nur manuell durch Uwe erhebbar.
- **Backlinks = 0** bleibt der strukturelle Engpass — jetzt 8 Wochen unverändert.

### Ampeln

- Rankings: 🟡 (von 🔴 hoch — erstmals ein Treffer beim Kopf-Keyword, aber Query-Effekt nicht ausschließbar; 3 von 5 Keywords weiter ohne Sichtbarkeit)
- Off-Page: 🔴 (8 Wochen 0 Backlinks — Ursache Nr. 1)
- Technik: 🟢 (alle drei Checks sauber)

### Handlungsempfehlung (max. 1)

**Backlink-Beschaffung starten statt weiter zu messen.** Acht Wochen Nullstand bei den
Erwähnungen ist kein Rauschen mehr, sondern der Befund. Konkret und diese Woche machbar:
`/temperatur-guide` bei 3–5 deutschen BBQ-Foren/Communities als Referenz einbringen
(Regel 5 beachten: kein Spam — nur dort, wo die Tabelle eine gestellte Frage tatsächlich
beantwortet). Alles andere im SEO-Bereich ist nachrangig, solange die Autoritäts-Seite null ist.

### Trend vs. Vorwoche

Erster sichtbarer Lichtblick beim Kopf-Keyword „Kerntemperatur Steak" (Rang 5 statt gar nicht) —
methodisch aber unsicher, weil die Query gewechselt hat; Off-Page und Technik unverändert.

---

## KW35 — 28.08.2026

> Vorwoche = **KW34 (17.08.)**, direkt darunter. Lücke: kein KW35-Eintrag zwischen 17.08.
> und heute — normaler Wochenabstand (11 Tage, Freitag statt Montag erhoben).

### Rankings (Google Top 10, US-basierte Websuche — DE-SERP kann abweichen)

| Keyword | steakakademie.de Top 10? | Wer stattdessen (Top 3) | Δ KW34 | Δ Baseline |
|---|---|---|---|---|
| „Kerntemperatur Steak" | ❌ nein — taucht in der breiteren Trefferliste auf Rang 8/9 auf, nicht Top 3 | REWE · Block House · Schickling-Grill | = | = |
| „Ribeye" | ❌ nein — trotz eigenem Ribeye-Guide nicht gelistet | spice.alibaba · Grillgoods.de · Die Frau am Grill — diesmal SERP größtenteils DE (Verbesserung ggü. sonstigem US/EN-Caveat) | = | = |
| „Reverse Sear" (Query: „Reverse Sear Steak Methode Anleitung") | ❌ nein | MeatEater (US) · **bbqpit.de** · Snake River Farms — **identisches Top-3 wie KW34** | = | = |
| „Brisket Anleitung" | ❌ nein — trotz eigenem Brisket-Guide nicht gelistet | bbqpit.de · ofen.de · grillkameraden.de | leichte Rotation (bbqlicate.de raus Top3, ofen.de neu #2) | = |
| „Steakakademie" (Brand) | ❌ nicht sichtbar | FB Bochum (Grillakademie Ruhr) · Beisser · GrillKonzept | = | = |

⚠️ **Methodik-Caveat Zeile 1:** Query lautete „Kerntemperatur Steak Tabelle Grad" (Zusatz ggü.
Vorwochen-Query „Kerntemperatur Steak") — bedingt vergleichbar, deshalb keine Wertung als
Verbesserung, nur als Beobachtung notiert.

**Befund:** Siebte Messung in Folge ohne generische Sichtbarkeit auf allen 5 Keywords — auch dort,
wo eigene Guides existieren (Ribeye, Brisket). Konkurrenzfeld unverändert: Händler/Magazine/DE-BBQ-
Portale mit Domain-Autorität. Keine neue Bewegung.

### Off-Page-Delta

Query `"steakakademie.de" -site:steakakademie.de`: **weiterhin 0 echte externe Erwähnungen/Backlinks.**
Alle Treffer = fremde Steak-Akademien (FB Bochum, Oberpfalz Beef, Beisser, GrillKonzept) oder
themenfremde Wikipedia-Treffer (Nordakademie, Kunstakademie Düsseldorf, Theaterakademie Mannheim).
**Δ KW34 (0) und Δ Baseline (0): unverändert 0 — jetzt 7 Wochen.**

### Technik-Status

| Check | Ergebnis | Status | Δ KW34 |
|---|---|---|---|
| www → non-www Redirect | `https://www.steakakademie.de/` → `https://steakakademie.de` | 🟢 ok | = |
| `/llms.txt` erreichbar | vollständiger Inhalt beim Abruf (Kern-Referenzen, Weitere Inhalte, Über; `Content-Type: text/plain`) | 🟢 ok | = (**2. Woche in Folge sauber — Stabilität bestätigt**) |
| `/robots.txt` endet mit Sitemap-Zeile | `Sitemap: https://steakakademie.de/sitemap.xml` vorhanden | 🟢 ok | = |

**Neuer Fund (kein Delta bestimmbar, da in Vorwochen nicht geprüft):** `/robots.txt` enthält jetzt
einen expliziten Block mit ausdrücklich erlaubten AI-/Answer-Engine-Crawlern (GPTBot, ClaudeBot,
anthropic-ai, PerplexityBot, Google-Extended, Applebot-Extended, Amazonbot, CCBot, Bytespider) —
deckt sich mit der GEO-Doktrin „Burggraben 3". Ehrlich: unklar, seit wann das so ist, da frühere
Checks nur die Sitemap-Zeile prüften. Reiner Fakt, keine Wertung als „neu diese Woche".

### Offene Punkte / GEO

- Wikidata **Q140455747** in `src/lib/schema.ts` (`sameAs`, Zeile 35) ✅ bestätigt — nichts offen.
- Nächster AI-Re-Check (ChatGPT/Perplexity/Google AIO) laut `docs/geo-baseline.md` fällig
  **~06.09.2026** — noch **9 Tage hin, diese Woche kein Handlungsbedarf.** Nur manuell durch Uwe erhebbar.
- **Backlinks = 0** bleibt der strukturelle Engpass — jetzt 7 Wochen unverändert.

### Ampeln

- Rankings: 🔴 (null generische Sichtbarkeit, 7 Wochen ohne Bewegung, auch auf Keywords mit eigenem Content)
- Off-Page: 🔴 (weiter 0 Backlinks — Ursache Nr. 1)
- Technik: 🟢 (llms.txt zweite Woche grün — Stabilität bestätigt; Redirect + robots weiter ok)
- GEO-Setup: 🟢 (Wikidata gesetzt, letzter AI-Re-Check dokumentiert, nächster erst 06.09. fällig)

### Handlungsempfehlung (1)

**Affiliate-/Partner-Anmeldungen abarbeiten** (Santosgrills, Grillfürst, Ankerkraut, Otto Gourmet) —
seit KW23 offen, jetzt 7 Wochen 0 Backlinks in Folge. Technik ist kein Engpass mehr, Content ist da
(auch für Ribeye/Brisket kein Ranking trotz eigenem Guide) — ohne externe Domain-Signale bewegt sich
bei den Rankings strukturell nichts.

**Trend vs. Vorwoche (KW34):** Stillstand bei Rankings und Backlinks (unverändert 0/0); Technik
bestätigt sich als stabil (llms.txt zweite grüne Woche in Folge) statt neuem Fortschritt.

---

## KW34 — 17.08.2026

> Vorwoche = **KW33 (10.08.)**, direkt darunter.

### Rankings (Google Top 10, US-basierte Websuche — DE-SERP kann abweichen)

| Keyword | steakakademie.de Top 10? | Wer stattdessen (Top 3) | Δ KW33 | Δ Baseline |
|---|---|---|---|---|
| „Kerntemperatur Steak" | ❌ nein | Grillfürst · grillclub.amainfo.at · Block House | = | = |
| „Ribeye" | ❌ nein | meatnbone · 44steaks · Wikipedia — ⚠️ SERP rein US/EN, DE-Wert **nicht messbar** | = | = |
| „Reverse Sear" (Query: „Reverse Sear Steak Methode Anleitung") | ❌ nein | MeatEater (US) · **bbqpit.de** · Snake River Farms — DE-Treffer diesmal im Feld, Steakakademie trotzdem nicht | = | = |
| „Brisket Anleitung" | ❌ nein | bbqpit.de · grillkameraden.de · bbqlicate.de | = | = |
| „Steakakademie" (Brand) | ❌ nicht sichtbar | FB Bochum (Grillakademie Ruhr) · Beisser · GrillKonzept | = | = |

**Befund:** Sechste Messung in Folge ohne generische Sichtbarkeit. Der KW32-Ausreißer bleibt
widerlegt (KW33 bestätigt). Konkurrenzfeld unverändert: Händler/Magazine mit Domain-Autorität.
Neu: bei „Reverse Sear" liefert die Suche erstmals einen echten DE-Wettbewerber (bbqpit.de) mit
aus — der Vergleich wird damit belastbarer, das Ergebnis bleibt gleich.

### Off-Page-Delta

Query `"steakakademie.de" -site:steakakademie.de`: **weiterhin 0 echte externe Erwähnungen/Backlinks.**
Alle Treffer = fremde Steak-Akademien (FB Bochum, Oberpfalz Beef, Beisser, GrillKonzept,
Metzgerei Lotter, akademie-der-kochenden-kuenste). **Δ KW33 (0) und Δ Baseline (0): unverändert 0 —
jetzt 6 Wochen.**

### Technik-Status

| Check | Ergebnis | Status | Δ KW33 |
|---|---|---|---|
| www → non-www Redirect | `https://www.steakakademie.de/` → `https://steakakademie.de` | 🟢 ok | = |
| `/llms.txt` erreichbar | **vollständiger Inhalt beim ersten Abruf** (Kern-Referenzen, Weitere Inhalte, Über; `Content-Type: text/plain`) | 🟢 **ok** | ⬆️ von 🟡 |
| `/robots.txt` endet mit Sitemap-Zeile | `Sitemap: https://steakakademie.de/sitemap.xml` vorhanden | 🟢 ok | = |

**llms.txt geschlossen (mit Vorbehalt):** Anders als in KW33 kein leerer Erstabruf — Inhalt kam
sofort und vollständig, inkl. korrektem Content-Type. Der Cache-/Kaltstart-Verdacht der Vorwoche
hat sich **nicht wiederholt**. Ehrlich: ein einzelner sauberer Abruf beweist keine dauerhafte
Stabilität, aber nach 4 Wochen 🔴 und 1 Woche 🟡 ist das der erste voll saubere Lauf → 🟢.

### Offene Punkte / GEO

- **AI-Re-Check ist erledigt** — er wurde am **09.08.2026** durchgeführt und als „Messung 3" in
  `docs/geo-baseline.md` dokumentiert (KW33-Eintrag wusste davon noch nichts, dort noch als
  „6 Tage überfällig" geführt). **Korrektur zur Vorwoche.**
- **🟢 Erster GEO-Erfolg des Projekts:** **Perplexity zitiert `/temperatur-guide` erstmals** in
  den 10 Quellen (Baseline 07.07.: nicht dabei). Einordnung aus geo-baseline.md, hier übernommen:
  Zitierung im Quellen-Panel, **nicht** inline als Antwort-Grundlage; Ursache (Wikidata vs.
  Index-Reifung) **nicht kausal belegbar**; Stabilität noch ungeprüft.
- ChatGPT: weiterhin kein Web-Retrieval bei der Standardfrage → Kanal strukturell nicht adressierbar.
  Google AI Overview: weiterhin nicht zitiert (folgt organischen Gewinnern → Autoritätsproblem).
- DE-Gegencheck (Uwe, 09.08., Inkognito): `/temperatur-guide` organisch auf **Seite 4 (~Platz 33)** —
  indexiert, aber ohne Klick-Relevanz.
- Wikidata **Q140455747** in `src/lib/schema.ts` (`sameAs`, Zeile 27) ✅ — nichts offen.
- **Nächster AI-Re-Check fällig: ~06.09.2026** (4-Wochen-Rhythmus ab Messung 3). Nur manuell durch Uwe.
- **Backlinks = 0** bleibt der strukturelle Engpass — 6 Wochen unverändert.

### Ampeln

- Rankings: 🔴 (null generische Sichtbarkeit, 6 Wochen ohne Bewegung)
- Off-Page: 🔴 (weiter 0 Backlinks — Ursache Nr. 1)
- Technik: 🟢 (**hochgestuft von 🟡** — llms.txt erstmals sauber, Redirect + robots unverändert ok)
- GEO-Setup: 🟢 (**hochgestuft von 🟡** — Re-Check nachgeholt, erstes AI-Zitat gemessen)

### Handlungsempfehlung (1)

**Affiliate-/Partner-Anmeldungen jetzt abarbeiten** (Santosgrills, Grillfürst, Ankerkraut,
Otto Gourmet) — seit KW23 offen, günstigste Quelle für die ersten echten Domain-Nennungen.
Der Perplexity-Erfolg schärft die Begründung statt sie zu entkräften: Content-Tiefe zahlt bereits
auf retrieval-basierte Kanäle ein, aber **Google organisch und Google AI Overview folgen der
Domain-Autorität** — dort bewegt sich ohne Backlinks weiterhin nichts. Technik ist ab dieser
Woche kein Engpass mehr.

**Trend vs. Vorwoche (KW33):** Erste Woche mit echtem Fortschritt seit der Baseline — llms.txt
sauber ausgeliefert und der nachgeholte AI-Re-Check zeigt das erste Perplexity-Zitat; Rankings und
Backlinks bleiben davon unberührt bei null.

---

## KW33 — 10.08.2026

> Vorwoche = **KW32 Lauf 2 (03.08.)**, direkt darunter.

### Rankings (Google Top 10, US-basierte Websuche — DE-SERP kann abweichen)

| Keyword | steakakademie.de Top 10? | Wer stattdessen (Top 3) | Δ KW32 (Lauf 2) | Δ Baseline |
|---|---|---|---|---|
| „Kerntemperatur Steak" | ❌ nein | Grillfürst · LECKER · grillclub.amainfo.at / Block House | 🔴 **zurück auf ❌** (Lauf 2 hatte Pos. 4) | = |
| „Ribeye" | ❌ nein | meatnbone · gamekeepersmeat (AU) · omahasteaks — ⚠️ SERP rein US/EN, DE-Wert **nicht messbar** | = | = |
| „Reverse Sear" | ❌ nein | acabonacfarms · jessicagavin · grillio — ⚠️ SERP rein US/EN, DE-Wert **nicht messbar** | = | = |
| „Brisket Anleitung" | ❌ nein | bbqpit.de · grillkameraden.de · bbqlicate.de | = | = |
| „Steakakademie" (Brand) | ❌ nicht sichtbar | FB Bochum (Grillakademie Ruhr) · Beisser · GrillKonzept / steak-akademie.nrw | = | = |

**Auflösung des KW32-Positiv-Funds:** Der am 03.08. (Lauf 2) gemessene Top-10-Treffer für
„Kerntemperatur Steak" ist **heute nicht reproduzierbar**. Damit bestätigt sich der damals notierte
Verdacht: **Messrauschen**, keine gesicherte Ranking-Verbesserung. Richtig, dass er nicht als Erfolg
verbucht wurde. Belastbar bleibt nur: `/temperatur-guide` ist indexiert und wird ausgespielt.
Für eine echte Aussage braucht es einen manuellen DE-Inkognito-Check mit Screenshot.

### Off-Page-Delta

Query `"steakakademie.de" -site:steakakademie.de`: **weiterhin 0 echte externe Erwähnungen/Backlinks.**
Alle Treffer = fremde Steak-Akademien (FB Bochum, Beisser, GrillKonzept, Oberpfalz Beef,
Bergische Grillakademie, dfw24, akademie-der-kochenden-kuenste).
**Δ KW32 (0) und Δ Baseline (0): unverändert 0.**

### Technik-Status

| Check | Ergebnis | Status | Δ KW32 |
|---|---|---|---|
| www → non-www Redirect | `https://www.steakakademie.de/` → `https://steakakademie.de/` | 🟢 ok | = |
| `/llms.txt` erreichbar | 1. Fetch: **leerer Body** · 2. Fetch unmittelbar danach: **vollständiger Inhalt** (Kern-Referenzen, Weitere Inhalte, Über) | 🟡 **intermittierend** | ⬆️ von 🔴 (war 4 Wochen durchgehend leer) |
| `/robots.txt` endet mit Sitemap-Zeile | `Sitemap: https://steakakademie.de/sitemap.xml` vorhanden | 🟢 ok | = |

**llms.txt — Stand ehrlich:** Der Inhalt wird jetzt **grundsätzlich ausgeliefert** (Repo `public/llms.txt`,
1557 Byte, live identisch). Aber zwei aufeinanderfolgende Abrufe im selben Lauf lieferten
unterschiedliche Ergebnisse (erst leer, dann voll) → Verdacht auf **Cache-/Kaltstart-Effekt am Edge**,
nicht auf ein Inhaltsproblem. **Nicht als abgeschlossen verbuchen**, nächste Woche gegenprüfen.

### Offene Punkte / GEO

- **AI-Re-Check jetzt 6 Tage überfällig.** Fällig war 04.08. (4-Wochen-Rhythmus ab 07.07.).
  Die 3 Abfragen (ChatGPT · Perplexity · Google AI Overview) auf „Was ist die richtige Kerntemperatur
  für ein Steak medium?" sind **nur manuell durch Uwe** erhebbar → Ergebnisse in `docs/geo-baseline.md`.
- Wikidata **Q140455747** in `src/lib/schema.ts` (`sameAs`, Zeile 26/27) ✅ — nichts offen.
- **Backlinks = 0** bleibt der strukturelle Engpass — inzwischen 5 Wochen unverändert.

### Ampeln

- Rankings: 🔴 (**zurückgestuft von 🟡** — KW32-Treffer als Rauschen widerlegt, generische Sichtbarkeit = null)
- Off-Page: 🔴 (weiter 0 Backlinks — Ursache Nr. 1)
- Technik: 🟡 (Redirect + robots ok; llms.txt liefert Inhalt, aber intermittierend)
- GEO-Setup: 🟡 (Prerequisites erledigt, Re-Check überfällig)

### Handlungsempfehlung (1)

**Erste externe Erwähnungen erzeugen — über die seit KW23 offenen Affiliate-Anmeldungen**
(Santosgrills, Grillfürst, Ankerkraut, Otto Gourmet). Deren Partner-/Publisher-Listen und
Freigabe-Seiten sind die günstigste Quelle für die ersten echten Domain-Nennungen.
Technik und Content sind seit Wochen nicht mehr der Engpass — **ohne Backlinks bewegt sich nichts**,
und fünf Wochen Messung ohne jede Ranking-Bewegung belegen genau das.

**Trend vs. Vorwoche (KW32):** Rückschritt auf dem Papier — der einzige Positiv-Fund der Vorwoche
war Messrauschen; einziger realer Fortschritt ist die (noch instabile) llms.txt-Auslieferung.
Substanziell steht das Projekt seit der Baseline unverändert: 0 Backlinks, 0 generische Sichtbarkeit.

---

## KW32 — 03.08.2026 (Lauf 2, Nachtrag)

> ⚠️ Zweiter Lauf am selben Tag. Nicht überschrieben, weil sich ein Messergebnis **geändert** hat
> (siehe „Kerntemperatur Steak"). Vergleich hier: gegen **Lauf 1 vom 03.08.** (direkt darunter).

### Rankings (Google Top 10, US-basierte Websuche — DE-SERP kann abweichen)

| Keyword | steakakademie.de Top 10? | Wer stattdessen (Top 3) | Δ Lauf 1 (03.08.) |
|---|---|---|---|
| „Kerntemperatur Steak" | ✅ **JA — `/temperatur-guide` auf Pos. 4** | Grillfürst · grillclub.amainfo.at · Block House | 🟢 **NEU sichtbar** (Lauf 1: ❌) |
| „Ribeye" | ❌ nein | meatnbone · omahasteaks · allenbrothers — ⚠️ SERP rein US/EN, DE-Wert **nicht messbar** | = |
| „Reverse Sear" | ❌ nein | acabonacfarms · jessicagavin · grillio — ⚠️ SERP rein US/EN, DE-Wert **nicht messbar** | = |
| „Brisket Anleitung grillen" | ❌ nein | grillkameraden.de · ofen.de · beefbandits.de | = |
| „Steakakademie" (Brand) | ❌ nicht sichtbar | FB Bochum (Grillakademie Ruhr) · GrillKonzept · Beisser / Oberpfalz Beef | = |

**⚠️ Ehrlichkeits-Caveat zum Positiv-Fund:** Zwei Läufe am selben Tag mit identischer Query liefern
unterschiedliche Ergebnisse. Ob das eine **echte Ranking-Verbesserung** ist oder **Messrauschen**
(personalisierte/rotierende Ergebnisse, US-Standort), ist aus der Ferne **nicht entscheidbar**.
Nicht als gesicherter Erfolg verbuchen — nächste Woche gegenprüfen, idealerweise 1× manuell aus DE
(Inkognito, Screenshot). Fakt bleibt: `/temperatur-guide` ist indexiert und wird ausgespielt.

### Off-Page-Delta

Query `"steakakademie.de" -site:steakakademie.de`: **weiterhin 0 echte externe Erwähnungen/Backlinks.**
Alle Treffer = fremde Steak-Akademien (Facebook Bochum, GrillKonzept, Beisser, Oberpfalz Beef,
Metzgerei Lotter, akademie-der-kochenden-kuenste). **Δ Baseline (0) und Δ Lauf 1 (0): unverändert 0.**

### Technik-Status

| Check | Ergebnis | Status | Δ Lauf 1 |
|---|---|---|---|
| www → non-www Redirect | `https://www.steakakademie.de/` → `https://steakakademie.de/` | 🟢 ok | = |
| `/llms.txt` erreichbar | Body **leer** ausgeliefert (robots.txt liefert im Vergleich sauberen Text) | 🔴 leer | = (**4. Woche offen**) |
| `/robots.txt` endet mit Sitemap-Zeile | `Sitemap: https://steakakademie.de/sitemap.xml` vorhanden | 🟢 ok | = |

**llms.txt bestätigt:** `public/llms.txt` hat lokal echten Inhalt (Kern-Referenzen: temperatur-guide,
ribeye, brisket, reverse-sear, glossar). Live leer → **Deploy-/Auslieferungsproblem, kein Inhaltsproblem.**

### Offene Punkte / GEO

- Wikidata **Q140455747** in `src/lib/schema.ts` (`sameAs`, Zeile 27) ✅ — nichts offen.
- AI-Abfragen-Tabelle in `docs/geo-baseline.md` gefüllt (07.07.) ✅ — **AI-Re-Check (ChatGPT /
  Perplexity / Google AIO) wird morgen, 04.08., fällig** (4-Wochen-Rhythmus). Nur manuell durch Uwe erhebbar.
- Backlinks = 0 bleibt der strukturelle Engpass.

### Ampeln

- Rankings: 🟡 (**hochgestuft von 🔴** — erster generischer Top-10-Treffer gemessen, aber unbestätigt)
- Off-Page: 🔴 (weiter 0 Backlinks — Ursache Nr. 1)
- Technik: 🟡 (Redirect + robots ok; llms.txt 4. Woche leer)
- GEO-Setup: 🟡 (Prerequisites erledigt, Re-Check ab morgen fällig)

### Handlungsempfehlung (1)

**llms.txt-Deploy fixen** — unverändert der einzige offene Punkt vollständig in eigener Code-Kontrolle,
jetzt 4 Wochen alt. Datei hat Inhalt, wird live nicht ausgeliefert → Netlify/Next-Routing prüfen.

**Trend vs. Lauf 1:** Erster möglicher Lichtblick — `/temperatur-guide` in Top 10 auf dem Kern-Keyword,
aber innerhalb eines Tages widersprüchlich gemessen und deshalb nicht als Erfolg gesichert.

---

## KW32 — 03.08.2026 (Lauf 1)

> ⚠️ Lücke: kein Eintrag für KW30/KW31 vorhanden → „Vorwoche" = KW29 (13.07.), Abstand 3 Wochen.

### Rankings (Google Top 10, US-basierte Websuche — DE-SERP kann abweichen)

| Keyword | steakakademie.de Top 10? | Wer stattdessen (Top 3) | Δ KW29 |
|---|---|---|---|
| „Kerntemperatur Steak" | ❌ nein | Grillfürst · Block House · grillclub.amainfo.at | = unverändert |
| „Ribeye grillen Anleitung" | ❌ nein | spice.alibaba · die-frau-am-grill · grillportal | = unverändert (Top-3-Mix leicht rotiert) |
| „Reverse Sear" | ❌ nein | grillio · MeatEater · jesspryles — ⚠️ SERP rein US/EN, DE-Wert nicht messbar | = unverändert |
| „Brisket Anleitung" | ❌ nein | bbqpit.de · grillkameraden.de · bbqlicate.de | = unverändert |
| „Steakakademie" (Brand) | ❌ nicht sichtbar | FB Bochum (Grillakademie Ruhr) · GrillKonzept · Beisser / Oberpfalz Beef | = unverändert |

**Positiv-Befund (neu gemessen):** Long-Tail „steakakademie.de Kerntemperatur Guide" liefert
`steakakademie.de/temperatur-guide` in den Top-Treffern — Seite ist indexiert und wird mit
korrektem Snippet (BfR/EFSA-Bezug, Sous-vide) ausgespielt. Generische Sichtbarkeit bleibt null.

### Off-Page-Delta

Query `"steakakademie.de" -site:steakakademie.de`: **weiterhin 0 echte externe Erwähnungen/Backlinks.**
Alle Treffer betreffen fremde Steak-Akademien (Facebook Bochum, GrillKonzept, Beisser, Oberpfalz Beef,
Metzgerei Lotter, akademie-der-kochenden-kuenste). **Δ Baseline (0) und Δ KW29 (0): unverändert 0.**

### Technik-Status

| Check | Ergebnis | Status | Δ KW29 |
|---|---|---|---|
| www → non-www Redirect | `https://www.steakakademie.de/` → `https://steakakademie.de/` | 🟢 ok | = |
| `/llms.txt` erreichbar | Body **leer** ausgeliefert (kein Content-Type im Response, anders als robots.txt) | 🔴 leer | = (3. Woche offen) |
| `/robots.txt` endet mit Sitemap-Zeile | `Sitemap: https://steakakademie.de/sitemap.xml` vorhanden | 🟢 ok | = |

**Verschärfter Befund zu llms.txt:** Die Datei existiert im Repo (`public/llms.txt`, 1.533 Byte, Stand 07.07.)
— live kommt trotzdem ein leerer Body zurück. Das ist also **kein Content-Problem, sondern ein Deploy-/
Auslieferungs-Problem** (Datei nie deployed oder Route liefert nichts). Unsicher, welches von beidem —
nicht aus der Ferne entscheidbar.

### Offene Punkte / GEO

- Wikidata-Item **Q140455747** steht in `src/lib/schema.ts` (`sameAs`) ✅ — nichts offen.
- AI-Abfragen-Tabelle in `docs/geo-baseline.md` gefüllt (Stand 07.07.) ✅ — **aber: Re-Check-Rhythmus
  ist „alle 4 Wochen" → der AI-Re-Check (ChatGPT / Perplexity / Google AIO) ist seit ~04.08. FÄLLIG.**
  Muss manuell von Uwe erhoben werden (~5 Min je Plattform), Ergebnisse als neue Messung eintragen.
- Backlinks/Entity-Autorität = 0 bleibt der strukturelle Engpass.

### Ampeln

- Rankings: 🔴 (null generische Sichtbarkeit, 4 Wochen ohne Bewegung)
- Off-Page: 🔴 (weiter 0 Backlinks — Ursache Nr. 1 für Rankings)
- Technik: 🟡 (Redirect + robots ok; llms.txt seit 3 Wochen leer)
- GEO-Setup: 🟡 (Prerequisites erledigt, aber Re-Check überfällig)

### Handlungsempfehlung (1)

**Die llms.txt-Auslieferung prüfen und fixen** — Datei liegt mit Inhalt im Repo, wird live aber leer
ausgeliefert. Kein Content-Job, sondern Deploy/Routing. Ist der einzige offene Punkt, der vollständig
in eigener Code-Kontrolle liegt und seit drei Wochen unerledigt ist. Strategischer Haupt-Hebel bleibt
unverändert: **erste externe Backlinks** (Affiliate-/Partner-Anmeldungen, Erwähnungen) — ohne die
bewegt sich bei den Rankings nichts.

**Trend vs. Vorwoche (KW29):** Stillstand — keine Ranking-, keine Off-Page-, keine Technik-Bewegung;
einzige Neuigkeit ist die Präzisierung, dass llms.txt ein Deploy- und kein Inhaltsproblem ist.

---

## KW29 — 13.07.2026

### Rankings (Google Top 10)

| Keyword | steakakademie.de Top 10? | Wer stattdessen (Top 3) | Δ Baseline |
|---|---|---|---|
| „Kerntemperatur Steak" | ❌ nein | Grillfürst · Block House · Grillcenter Nord | = (unverändert) |
| „Ribeye" (grillen/Anleitung) | ❌ nein | die-frau-am-grill · thekitchn (US) · grillportal | neu gemessen |
| „Reverse Sear" | ❌ nein | jessicagavin · foodnetwork · kosmosq — ⚠️ SERP fast rein US/EN, DE-Wert unklar | neu gemessen |
| „Brisket Anleitung" | ❌ nein | bbqlicate · Grillfürst · Burnhard | neu gemessen |
| „Steakakademie" (Brand) | ❌ nicht sichtbar | Oberpfalz Beef · GrillKonzept · steak-akademie.nrw / FB Bochum | ⚠️ siehe Hinweis |

> ⚠️ **Brand-Hinweis (ehrlich):** Baseline-„Platz 1" bezog sich auf die Long-Tail-Query
> „steakakademie.de Kerntemperatur" (→ /temperatur-guide). Der **nackte Gattungs-/Markenbegriff
> „Steakakademie"** ist von fremden Präsenz-Anbietern (Oberpfalz Beef, GrillKonzept/Grillakademie Ruhr,
> steak-akademie.nrw) belegt — steakakademie.de taucht in der US-Websuche dort **nicht** in den Top-Treffern auf.
> Das ist **kein** Widerspruch zur Baseline, sondern eine schärfere Messung. Deckt sich mit der Doktrin:
> Domain-Autorität/Entity fehlt noch. Manueller DE-Inkognito-Check empfohlen zur Bestätigung.

### Off-Page-Delta

Query `"steakakademie.de" -site:steakakademie.de`: **0 echte externe Erwähnungen/Backlinks** auf
steakakademie.de gefunden — alle Treffer betreffen **fremde** Steak-Akademien (Oberpfalz Beef, GrillKonzept,
Metzgerei Lotter u. a.). **Δ Baseline (0): unverändert 0.**

### Technik-Status

| Check | Ergebnis | Status |
|---|---|---|
| www → non-www Redirect | `https://www.steakakademie.de/` → `https://steakakademie.de/` | 🟢 ok |
| `/llms.txt` erreichbar | HTTP 200, aber **Inhalt leer** (0 Byte Body) | 🔴 leer |
| `/robots.txt` endet mit Sitemap-Zeile | `Sitemap: https://steakakademie.de/sitemap.xml` vorhanden | 🟢 ok |

### Offene Punkte / GEO

- **GEO-Prerequisites erledigt** (positiv): Wikidata-Item **Q140455747** steht in `src/lib/schema.ts` (`sameAs`);
  AI-Abfragen-Tabelle in `docs/geo-baseline.md` ist gefüllt (ChatGPT/Perplexity/Google-AIO am 07.07. erhoben).
  → hier ist nichts offen.
- **llms.txt liefert leeren Body** — für AI-Crawler wertlos, sollte befüllt werden.
- **Backlinks/Entity-Autorität = 0** bleibt der strukturelle Engpass (unverändert zur Doktrin).

### Ampeln

- Rankings: 🔴 (null generische Sichtbarkeit, unverändert)
- Off-Page: 🔴 (weiter 0 Backlinks)
- Technik: 🟡 (www-Redirect + robots ok; llms.txt leer)
- GEO-Setup: 🟢 (Wikidata + AI-Baseline erledigt)

### Handlungsempfehlung (1)

**`/llms.txt` mit Inhalt füllen** (Titel, Kurzbeschreibung, Links zu /temperatur-guide, /cuts, /methoden,
/diplome). Kleiner, voll in Code-Kontrolle liegender GEO-Hebel — 200 = ok, aber leerer Body bringt AI-Crawlern nichts.
Strategisch bleibt der große Hebel unverändert: **erste externe Backlinks** (Affiliate-/Partner-Anmeldungen, Erwähnungen).

**Trend vs. Vorwoche:** Erster Log-Eintrag — keine Vorwoche; ggü. Baseline 07.07. keine Ranking-/Off-Page-Bewegung (erwartungsgemäß, da Wikidata/Backlinks noch nicht greifen), Technik-Neubefund: llms.txt leer.
