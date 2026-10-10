# GEO-Quellenanalyse: 10 Kernfragen (Stand 10.10.2026)

Researcher-Bericht für das SEO/GEO-Team der Steakakademie. Das Repo wurde nur gelesen, nichts geändert, nichts committet.
Grundlage: GSC-Export vom 09.10.2026 (Positionen laut Auftrag), Stichproben vom 10.10.2026 (ca. 09:30–10:30 UTC).

---

## 0. Was prüfbar war und was nicht (bitte zuerst lesen)

| Kanal | Status | Begründung |
|---|---|---|
| **Google-Suche (DE)** | **nicht prüfbar** | WebFetch landet auf der Consent-Seite (consent.google.de). Im Browser kommt ein reCAPTCHA („ungewöhnlicher Datenverkehr“). Consent nicht bestätigt, CAPTCHA nicht umgangen. |
| **Google AI Overviews** | **nicht prüfbar** | Gleicher Grund. |
| **Perplexity** | **nicht prüfbar** | HTTP 403. |
| **DuckDuckGo** (als Bing-Ersatz) | **nicht prüfbar** | CAPTCHA. |
| **Bing, organisch** | **nur eingeschränkt** | Für diese IP liefert Bing bei mehrteiligen Anfragen offenbar nur Treffer zum **ersten Wort**. „texas crutch temperatur“ ergab Texas-Reiseseiten, „kerntemperatur ribeye/spanferkel/hackfleisch“ dieselbe allgemeine Kerntemperatur-Liste, `site:steakakademie.de` ergab answers.microsoft.com. Brauchbar sind deshalb nur die Listen für die Kopfbegriffe **„kerntemperatur“** und **„chateaubriand“**. |
| **Bing KI-Modus / Copilot-Suche** (`bing.com/copilotsearch`) | **prüfbar, ohne Login** | Liefert echte KI-Antworten mit Quellenlinks. Copilot und die ChatGPT-Suche greifen auf den Bing-Index zurück, deshalb ist dieser Kanal der **aussagekräftigste Teil dieses Berichts**. |
| **Websuche-Proxy** (WebSearch-Tool) | nur als Proxy | US-Index, kein Google DE. Viele PDFs, englische Seiten und Spam. **Nicht als Google-Ranking lesen**, sondern nur als Hinweis, welche Seitentypen es gibt. |

**Konsequenz:** Für Google bleibt die GSC-Position die einzige belastbare Zahl. Alle Suchergebnisse sind eine **nicht personalisierte Einzel-Stichprobe** (Zeitpunkt, IP und Standort beeinflussen sie).

---

## (a) Tabelle je Frage

Legende: **SA** = steakakademie.de. „KI-Quellen“ = Quellen der Bing-KI-Modus-Antwort, ausgelesen aus den Quellenlinks.

### 1. „kerntemperatur hackfleisch“ / „kerntemperatur frikadellen“ (GSC Pos. ~9–10, tausende Impressionen, ~0 Klicks)

| | Ergebnis |
|---|---|
| Google-Top-5 | nicht prüfbar |
| Bing-Top-5 organisch | nicht zuverlässig (Bing lieferte nur die allgemeine „kerntemperatur“-Liste, siehe Frage 2) |
| SA bei Bing | in keiner sichtbaren Liste. Für die Long-Tail-Anfrage nicht prüfbar. |
| **KI-Quellen „kerntemperatur hackfleisch“** | grillfuerst.de/magazin/kerntemperatur/schweinefleisch/hackbraten-hackfleisch/ (Händler-Ratgeber) · partyservice-dick.de (Caterer-Ratgeber) · die-frau-am-grill.de/grill-lexikon/hackfleisch-kerntemperatur/ (Blog-Lexikon) · bbq-treff.de/kerntemperatur/ (Tabelle) |
| **KI-Quellen „kerntemperatur frikadellen“** | kerntemperatur-tabelle.de/kerntemperatur-fuer-frikadellen-…/ (Affiliate-Ratgeber) · grillfuerst.de (wie oben) · bbq-treff.de/kerntemperatur/ |
| KI-Antwort (Kern) | „70–72 °C“ als Standard. Schwein 75 °C, Geflügelhack mindestens 75 °C. Garzeit 6–12 Min. pro Seite. „Das BfR empfiehlt mindestens 70 °C“, belegt aber mit grillfuerst.de, nicht mit dem BfR. |
| SA in KI-Antwort | **nein** |
| Websuche-Proxy | familienkost.de (Rezept-PDF), amberg.de (Behörden-PDF), antwort.net (Q&A), fitimalter-dge.de (DGE-PDF), heidelberg24.de (Ratgeber) |

Die neue Seite /kerntemperatur-hackfleisch ist seit 09.10. live. Dass Bing sie schon kennt, ist unwahrscheinlich und ließ sich nicht prüfen.

### 2. „kerntemperatur“ / „kerntemperatur fleisch tabelle“ (Pos. ~9 bzw. ~37)

| | Ergebnis |
|---|---|
| Google-Top-5 | nicht prüfbar |
| **Bing-Top-5 organisch** („kerntemperatur“, belastbar) | 1 kerntemperatur-tabelle.de/kerntemperatur-tabellen/ (Tabellen-Hub, Affiliate) · 2 kerntemperatur.org (Tabellen-Site) · 3 grillfuerst.de/magazin/kerntemperatur/kerntemperatur-messen/ (Händler, „vor 5 Tagen“ aktualisiert) · 4 bbq-treff.de/kerntemperatur/ (filterbare Tabelle) · 5 grillrezepte24.de/kerntemperaturen/ (Tabelle). Danach: omoxx.com, bbq-ratgeber.de, de.wikipedia.org, tastybits.de, kerntemperatur.org (PDF). |
| SA bei Bing | nicht in den Top 10 |
| KI-Quellen „kerntemperatur“ | Keine KI-Antwort, der KI-Modus zeigte nur die Ergebnisliste (dieselben Top 5). |
| **KI-Quellen „kerntemperatur fleisch tabelle“** | kerntemperatur-tabelle.de/kerntemperatur-tabellen/ · bbq-treff.de/kerntemperatur/ |
| SA in KI-Antwort | **nein** |
| Websuche-Proxy | grillfuerst.de (messen), bettybossi.ch (PDF), grillfuerst.de (steak), fitimalter-dge.de (PDF), bosch-home.com (Gerätedoku) |

### 3. „chateaubriand kerntemperatur“ / „chateaubriand“ (Pos. ~11, /rezepte/fleisch/chateaubriand-filet)

| | Ergebnis |
|---|---|
| Google-Top-5 | nicht prüfbar |
| **Bing-Top-5 organisch** („chateaubriand“, belastbar) | 1 de.wikipedia.org (Lexikon) · 2 einfachkochen.de (Rezept) · 3 chefkoch.de (Rezeptsammlung) · 4 eat.de (Rezept) · 5 nationalgerichtrezepte.de (Rezept). Auf 6 grillfuerst.de (Fleischguide), auf 7 guerillachefs.de. |
| SA bei Bing | nicht in den Top 10 |
| **KI-Quellen „chateaubriand kerntemperatur“** | kerntemperaturen.com/kerntemperatur/chateaubriand/ (Spezial-Tabellenseite) · kerntemperatur-tabelle.de/chateaubriand-kerntemperatur-…/ (Affiliate-Ratgeber) · eat.de (Rezept) · grillfuerst.de (Fleischguide) · gutekueche.de (Rezept) · harry-kocht.de (Foodblog) |
| KI-Antwort (Kern) | „52–56 °C (Medium Rare)“, dazu eine Vergleichstabelle der Garstufen aus mehreren Quellen. |
| SA in KI-Antwort | **nein** |
| Websuche-Proxy | schmeck-den-sueden.de (Rezept-PDF), ah.nl, blick.ch, lecker.de, en.wikipedia.org |

### 4. „kerntemperatur ribeye“ (Pos. ~32, /cuts/ribeye)

| | Ergebnis |
|---|---|
| Google-Top-5 | nicht prüfbar |
| Bing-Top-5 organisch | nicht zuverlässig (nur Liste zum ersten Wort) |
| **KI-Quellen** | grillfuerst.de/magazin/kerntemperatur/rind/rib-eye-steak/ (Händler, Einzelseite) · kerntemperatur-tabelle.de/ribeye-kerntemperatur-…/ · moesta.com/pages/grill-glossar/ribeye-kerntemperatur (Händler-Glossar) · initiative-tierwohl.de/magazin/ribeye-steak-grillen/ (Branchen-Initiative) |
| KI-Antwort (Kern) | Garstufen-Liste von Rare 48–50 °C bis Well Done, mit Fett-Begründung („schmilzt ab ~55 °C“) |
| SA in KI-Antwort | **nein** |
| Websuche-Proxy | bosch-home.com, grillfuerst.de, toppy.nl, napoleon.com (2×) |

### 5. „bfr geflügel kerntemperatur 70 2 minuten“ (Pos. ~5–7)

| | Ergebnis |
|---|---|
| Google-Top-5 | nicht prüfbar |
| Bing-Top-5 organisch | nicht zuverlässig |
| **KI-Quellen** | grillcenter-nord.de (Kerntemperatur Fasan, Händler) · kerntemperatur-tabelle.de/kerntemperatur-tabellen/ · bbq-ratgeber.de/techniken/kerntemperaturen.html · initiative-tierwohl.de/…/gefluegel-kerntemperatur/ |
| KI-Antwort (Kern) | „Das BfR empfiehlt … 70 °C … für 2 Minuten“, belegt mit einem **Fasan-Artikel eines Händlers**. **bfr.bund.de wird nicht zitiert.** |
| SA in KI-Antwort | **nein** |
| Websuche-Proxy | rheinneckarblog.de, bundesregierung.de (2×, Verbraucherinfo mit „mindestens zwei Minuten 70 °C“), bfr.bund.de (PM Entenbrust: Campylobacter erst ab 74 °C sicher abgetötet), bau.de (Forum) |

**Primärquellen-Befund (verifiziert):**
- BfR-Pressemitteilung 01/2014 vom 10.01.2014, „Keime in der Küche“ (bfr.bund.de/presseinformation/keime-in-der-kueche-tipps-zur-lebensmittelhygiene/): allgemein „für zwei Minuten oder länger auf mindestens 70 °C“. Geflügel wird darin nicht eigens genannt.
- BfR-PM 07/2006 vom 03.03.2006 zu Geflügel/Vogelgrippe: nennt 70 °C, aber **ohne** Haltezeit.
- bundesregierung.de (Verbraucherinfo Geflügel): 70 °C für mindestens zwei Minuten.
- Laut Suchtreffer nennt das BfR-Merkblatt „Sicher verpflegt“ (Gemeinschaftseinrichtungen) 72 °C für zwei Minuten. Den Volltext habe ich nicht geöffnet.

→ Die verbreitete Formel „BfR: Geflügel 70 °C / 2 Min.“ ist im Netz meist nur sekundär belegt. Eine Seite, die die BfR-Primärquelle präzise und verlinkt angibt, hätte hier ein echtes Alleinstellungsmerkmal.

### 6. „kerntemperatur schnitzel“ (Pos. ~8–10)

| | Ergebnis |
|---|---|
| Google-Top-5 | nicht prüfbar |
| Bing-Top-5 organisch | nicht zuverlässig |
| **KI-Quellen** | eat.de/rezept/schweineschnitzel-im-backofen/ (Rezept) · grillfuerst.de/magazin/kerntemperatur/schweinefleisch/ (Händler-Tabelle) |
| KI-Antwort (Kern) | „65–70 °C“ für Schweineschnitzel |
| SA in KI-Antwort | **nein** |
| Websuche-Proxy | psinfoodservice.com (Produktdatenblatt: mind. 74 °C), grillfuerst.de (Kalbsnuss), vienna.at, t-online.de, hornbach (PDF) |

SA hat keine eigene Schnitzel-Seite. Schnitzel steht nur als Zeile „Schnitzel / Minutensteak – 70 °C“ im /temperatur-guide. In data/kerntemperatur-referenz.yaml gibt es **keinen Schnitzel-Eintrag**; am nächsten liegt `pork_keule` (70).

### 7. „texas crutch temperatur“ (Pos. ~21)

| | Ergebnis |
|---|---|
| Google-Top-5 | nicht prüfbar |
| Bing-Top-5 organisch | nicht zuverlässig (Bing zeigte Texas-Reiseseiten) |
| KI-Quellen | Antwort vorhanden, aber die Quellenlinks ließen sich nicht auslesen (auch nach dem Nachladen leer) → **Quellen nicht prüfbar** |
| KI-Antwort (Kern) | „Einwickeln bei 66–74 °C“, Plateau „meist zwischen 68 und 71 °C“ |
| SA in KI-Antwort | nicht feststellbar |
| Websuche-Proxy | nur englische und US-Seiten: bbqhost.com, tvwbb.com (Forum), girlscangrill.com sowie mehrere Spam-Domains. Nicht repräsentativ. |

SA hat dazu drei Seiten: /glossar/texas-crutch (ohne Temperaturangabe), /artikel/texas-crutch-folie-oder-butcher-paper (**neu seit 09.10.**, FAQPage, reviewedBy Uwe, BfR-Link) und /artikel/stall-plateauphase-beim-smoken (neu seit 09.10.). Welche davon in der GSC auf Pos. 21 steht, geht aus dem Auftrag nicht hervor; vermutlich das Glossar oder die Methodenseite.

### 8. „kerntemperatur spanferkel“ (Pos. ~30)

| | Ergebnis |
|---|---|
| Google-Top-5 | nicht prüfbar |
| Bing-Top-5 organisch | nicht zuverlässig |
| **KI-Quellen** | kerntemperatur-tabelle.de/kerntemperatur-fuer-saftiges-spanferkel/ · marcofellner.at (Spanferkel-Kotelett) · thomassixt.de/kochfragen/… (Koch-Blog, Rollbraten) · grillmotor.net (2×: Spanferkel grillen, Drehspieß-Garzeiten) |
| KI-Antwort (Kern) | „75–80 °C“ für ganzes Spanferkel, gemessen in der Keule ohne Knochenkontakt, dazu Werte für Kotelett und Rollbraten |
| SA in KI-Antwort | **nein** |
| Websuche-Proxy | rewe.de (Rezept, ca. 75 °C), weber.com (72–74 °C am Nacken), hornbach (PDF), rewe.de (Shop), topratgeber24.de |

**SA hat zu Spanferkel keinerlei Inhalt.** Im Repo gibt es null Treffer, und in der YAML gibt es keinen Wert. Pos. ~30 stammt vermutlich vom /temperatur-guide.

### 9. „kerntemperatur steak“ (Pos. ~28–35)

| | Ergebnis |
|---|---|
| Google-Top-5 | nicht prüfbar |
| Bing-Top-5 organisch | nicht zuverlässig |
| **KI-Quellen** | grillfuerst.de/magazin/kerntemperatur/steak/ · bbqlabor.de/kerntemperatur-steak/ (Blog-Tabelle) · kerntemperatur-tabelle.de/kerntemperatur-fuer-rindfleisch-…/ · grillfuerst.ch/magazin/kerntemperatur/steak/ |
| KI-Antwort (Kern) | Garstufen von Rare 48–52 °C bis Well Done 70–75 °C, dazu Messhinweise |
| SA in KI-Antwort | **nein** |
| Websuche-Proxy | doncarne.de (Händler-Blog), rewe.de, weber.com (PDF), falter.at, leinetal24.de |

SA hat **keine eigene Antwortseite „Kerntemperatur Steak“**. Die Werte stehen im /temperatur-guide, in /cuts/ribeye und anderen Cut-Seiten.

### 10. „low and slow smoken temperatur“ (Pos. ~9, /methoden/smoken-low-and-slow)

| | Ergebnis |
|---|---|
| Google-Top-5 | nicht prüfbar |
| Bing-Top-5 organisch | nicht zuverlässig |
| **KI-Quellen** | bbq-ratgeber.de/techniken/low-and-slow.html · thebbqbastard.com (EN) · gg-grillen.de/bbq-lexikon/low-and-slow/ · ofen.de (Händler-Blog) · bbqjourneyonline.com (EN) |
| KI-Antwort (Kern) | „110–130 °C Garraum“, alternativ 107–135 °C (225–275 °F) bzw. 90–120 °C |
| SA in KI-Antwort | **nein** |
| Websuche-Proxy | nur englische Seiten, überwiegend Spam. Nicht repräsentativ. |

**Gesamtbild:** In **keiner** der neun ausgelesenen Bing-KI-Antworten wird steakakademie.de zitiert. In beiden belastbaren Bing-Kopfbegriff-Listen steht SA nicht in den Top 10. Ob SA überhaupt im Bing-Index steht, ließ sich nicht prüfen, weil die `site:`-Abfrage degradiert war. → Bing Webmaster Tools direkt prüfen (siehe T2).

---

## (b) Muster: was die zitierten Seiten gemeinsam haben

Grundlage: 9 Bing-KI-Antworten und 10 per WebFetch geöffnete Konkurrenzseiten: grillfuerst Hackfleisch und Rib-Eye, kerntemperatur-tabelle.de Frikadellen, Spanferkel und Hub, bbq-treff.de, kerntemperaturen.com Chateaubriand, initiative-tierwohl Geflügel, bbq-ratgeber Low & Slow, BfR.

1. **Eine URL pro Frage schlägt die große Tabelle.** Bei konkreten Fragen zitiert die KI fast immer Einzelseiten, zum Beispiel grillfuerst `/kerntemperatur/rind/rib-eye-steak/`, kerntemperatur-tabelle.de `…frikadellen…`, `…spanferkel…`, `…chateaubriand…` und kerntemperaturen.com `/kerntemperatur/chateaubriand/`. Große Sammeltabellen werden nur bei Sammelfragen zitiert („kerntemperatur fleisch tabelle“ → kerntemperatur-tabelle.de-Hub, bbq-treff). grillfuerst und kerntemperatur-tabelle.de betreiben beide ein **Hub-and-Spoke-System** (Übersicht plus Einzelseite je Fleisch oder Gericht).
2. **Die Zahl steht im ersten Satz.** Beispiele: grillfuerst Hackfleisch „70 bis 72 °C“ im Einstieg, grillfuerst Rib-Eye „55 bis 56 °C“ im ersten Satz, kerntemperatur-tabelle.de Frikadellen und Spanferkel ebenfalls mit Zahl im ersten Absatz, bbq-ratgeber Low & Slow „110 bis 130 °C“ im ersten Absatz. Ausnahme sind die Hub-Tabellen (bbq-treff, kerntemperatur-tabelle-Hub), die ihre Zahlen erst in der dichten Tabelle bringen.
3. **Garstufen-Tabellen mit klaren Spalten.** Oft mit **Ziel- und Entnahmetemperatur** (bbq-treff: Gargut/Garstufe/Ziel/Entnahme; kerntemperaturen.com: Garstufe/Zieltemperatur/Entnehmen). Die KI-Antworten übernehmen solche Tabellen fast 1:1, bei Chateaubriand sogar als Quellenvergleich.
4. **Quellen und Autoren sind beim Konkurrenzumfeld selten.** grillfuerst, bbq-treff, kerntemperatur-tabelle.de, initiative-tierwohl und bbq-ratgeber verlinken **keine** Behördenquelle. Nur kerntemperaturen.com nennt USDA/FoodSafety.gov. Namentliche Autoren gibt es fast nirgends (Ausnahme: kerntemperatur-tabelle.de „Brian Russel, Grill-Enthusiast“). → In dieser Stichprobe entscheidet E-E-A-T **nicht** darüber, ob eine Seite zitiert wird. Relevanz der URL und eine direkte Antwort wiegen schwerer. Saubere Quellen bleiben trotzdem ein Unterscheidungsmerkmal, gerade bei Sicherheitsfragen (BfR, Frage 5).
5. **Aktualität ist sichtbar.** grillfuerst zeigt „Aktualisiert am 18.09.2026“ bzw. „05.10.2026“, die Bing-Liste sogar „vor 5 Tagen“, bbq-ratgeber „Redaktionsstand 28.07.2026“.
6. **FAQ-Blöcke mit Kurzantworten sind Standard** (grillfuerst 5–7, bbq-treff 5, bbq-ratgeber 6) und decken Nebenfragen ab: Garzeit, „medium Burger?“, Messpunkt.
7. **Händler und Affiliates dominieren.** Dazu gehören grillfuerst (Händler), kerntemperatur-tabelle.de (MEATER-Affiliate), moesta, ofen.de und grillcenter-nord (Händler), initiative-tierwohl (Branche). Eine Behörde taucht in keiner KI-Antwort als Quelle auf.
8. **Die Konkurrenz widerspricht sich oft selbst**, das ist eine Chance für SA. kerntemperatur-tabelle.de nennt für Frikadellen in der Einleitung 70–72 °C und im Mittelteil 75 °C, für Spanferkel 75–80 °C bzw. 85–90 °C im Smoker-Abschnitt. grillfuerst Rib-Eye nennt im Einstieg 55–56 °C und später 55 °C. SAs einheitliche Werte aus einer YAML-Referenz sind ein echter Vorteil, solange die eigenen Seiten auch untereinander widerspruchsfrei sind (siehe Befunde unten).

**Werte der Konkurrenz (nur als Befund, keine Empfehlung):** Hackfleisch meist 70–72 °C (SA: mindestens 70, Korridor 70–72). Frikadellen teils 74–75 °C. Chateaubriand-KI 52–56 °C MR. Ribeye-KI MR 52–54 °C. Schnitzel 65–70 °C (eat.de, grillfuerst) oder 74 °C (Produktdatenblatt). Spanferkel 72–80 °C. Low & Slow 110–130 °C. Texas Crutch 66–74 °C.

---

## (c) Maßnahmen je Seite, nach Hebel priorisiert

### Technisch/strukturell (ohne Inhaltsfreigabe)

| Prio | Seite | Maßnahme | Begründung/Befund |
|---|---|---|---|
| **T1** | /kerntemperatur-hackfleisch | **Interne Links auf die neue Seite** setzen, möglichst über einen Template- oder „Weiterführend“-Baustein: von /rezepte/…/smash-burger, wagyu-burger, kofte-mangal sowie von /glossar/hackfleisch. | 128 Content-Dateien verlinken /temperatur-guide, **0** verlinken /kerntemperatur-hackfleisch. Den einzigen eingehenden Link liefert der eingefrorene Guide. Ohne interne Signale bleibt Google wahrscheinlich beim Guide (bisher Pos. ~9, ~0 Klicks). Falls dafür der MDX-Fließtext geändert werden muss: Uwe kurz bestätigen lassen. |
| **T2** | gesamte Domain | **Bing Webmaster Tools prüfen** (Indexstatus, Crawl-Fehler) und **IndexNow** für neue oder geänderte URLs einrichten, beginnend mit /kerntemperatur-hackfleisch und den beiden Artikeln vom 09.10. | Im Repo ist kein IndexNow zu finden. SA wird in keiner Bing-KI-Antwort zitiert, und Copilot sowie die ChatGPT-Suche hängen am Bing-Index. Der Indexstand war von hier aus nicht prüfbar. |
| T3 | /kerntemperatur-hackfleisch, /kerntemperatur-spickzettel (Guide nach 30.10.) | `lastmod` in der Sitemap auch für TSX-Seiten ausgeben, etwa aus einer Datumskonstante je Seite. | In sitemap-0.xml haben genau diese drei Seiten **kein lastmod**. MDX-Seiten haben eins. |
| T4 | /kerntemperatur-hackfleisch | Das sichtbare Datum „Veröffentlicht/aktualisiert am 09.10.2026“ ausgeben (im Schema steht es schon als `dateModified`). | Konkurrenten zeigen ihr Datum sichtbar, SA zeigt auf der Seite keins. |
| T5 | /methoden/smoken-low-and-slow | **FAQPage-Schema** für den vorhandenen FAQ-Abschnitt ermöglichen (Methoden-Template, `faq`-Frontmatter wie bei den Artikeln). | Es gibt sichtbar 3 FAQs, aber kein FAQPage-JSON-LD. Google zeigt FAQ-Rich-Results nur noch eingeschränkt; der Nutzen liegt vor allem in der maschinenlesbaren Struktur. |
| T6 | /methoden/smoken-low-and-slow | Link-Baustein zu /artikel/stall-plateauphase-beim-smoken, /artikel/texas-crutch-folie-oder-butcher-paper, /glossar/texas-crutch, /cuts/brisket, /cuts/pulled-pork und /temperatur-guide. | Die Seite verlinkt bisher nur Glossar- und Methodenseiten. Die beiden neuen Fachartikel zum Stall und zum Crutch sind nicht angebunden. |
| T7 | /glossar/texas-crutch | Den Link auf /artikel/texas-crutch-folie-oder-butcher-paper prominent setzen (Template-Baustein „Vertiefung“). | Das Glossar nennt keine Temperatur. Die Antwort zur Anfrage „texas crutch temperatur“ steht im neuen Artikel. |
| T8 | /rezepte/fleisch/chateaubriand-filet | Bei der nächsten Überarbeitung `dateModified` im Recipe-Schema ausgeben. Falls eine FAQ ergänzt wird, das Rezept-Template FAQPage-fähig machen. | Das Recipe-Schema hat nur `datePublished` (02.06.2026). |
| T9 | /temperatur-guide — **nach 30.10.** | Article-Schema mit `dateModified` ergänzen (bisher nur FAQPage und HowTo). Sprunganker je Tabelle (#hackfleisch, #gefluegel, #schwein …) für Deep-Links. | Sichtbar steht „Zuletzt aktualisiert: September 2026“, im Schema fehlt das Datum. HowTo-Rich-Results werden von Google nicht mehr angezeigt. |

### Inhaltlich (braucht Uwes Freigabe)

| Prio | Seite | Maßnahme | Begründung/Befund |
|---|---|---|---|
| **I1** | **neu: /kerntemperatur-steak** | Antwortseite nach dem Muster /kerntemperatur-hackfleisch: Zahl in H1 und erstem Satz, Garstufen-Tabelle aus `garstufen_rind` und `badges.beef_mr`, Spalte „vom Grill nehmen“ aus `meta.carryover`, FAQ, Links auf Cut-Seiten. | Pos. 28–35. Alle vier KI-Quellen sind dedizierte „Kerntemperatur Steak“-Seiten. Die Werte stehen schon in der YAML, es braucht keine neuen Werte. |
| **I2** | /cuts/ribeye | (a) Im ersten Absatz die Zahl nennen (Medium Rare 52–55 °C, Standard 54 °C, aus der YAML). (b) „Kerntemperatur“ in die H1 oder Unterzeile aufnehmen, der Title hat es schon. (c) FAQ-Frage „Welche Kerntemperatur hat ein Ribeye?“ ergänzen; bisher behandelt keine der 6 FAQs die Kerntemperatur. | Pos. ~32. Die Konkurrenz (grillfuerst) nennt die Zahl im ersten Satz. Die Ranges überschneiden sich (52–55 / 55–60), das ist laut YAML Absicht („Korridore“). Für Snippets hilft es, den Standardwert 54 °C sichtbar hervorzuheben. |
| **I3** | /rezepte/fleisch/chateaubriand-filet | (a) In den ersten Absatz Definition plus Kerntemperatur. (b) Garstufen-Tabelle (aus `garstufen_rind`). (c) Title um „Kerntemperatur“ ergänzen (bisher „Chateaubriand Rezept \| Steakakademie“). (d) FAQ ergänzen. (e) **Widersprüche klären:** `servings: 4`/1200 g gegenüber „klassisch für zwei Personen“/„400–600 g“; Sear „60–90 Sekunden“ im Fließtext gegenüber „90–120 Sekunden“ in Schritt 4; Schritt-Titel „Indirekte Zone auf 53°C einstellen“ (gemeint ist die Kerntemperatur, der Garraum hat 110–120 °C). | **Befund YAML:** Der Text nennt „nach Ruhe 56–57 °C — klassisch medium-rare“. Laut `garstufen_rind` liegt Medium Rare bei 52–55 °C und Medium bei 55–60 °C. Uwe muss entscheiden; ich schlage keinen Wert vor. Pos. ~11. KI zitiert eine Spezialseite mit Garstufen-Tabelle. |
| I4 | /kerntemperatur-hackfleisch | (a) BfR- und EFSA-Quellen **verlinken** und präzise benennen, etwa die BfR-PM 01/2014 „Keime in der Küche“ (≥ 70 °C, ≥ 2 Min.). (b) Den Prüfvermerk (`reviewedAt` von Uwe) auch hier ausgeben, damit `reviewedBy` und `lastReviewed` im Schema erscheinen. Die Artikel-Seiten haben das schon, diese TSX-Seite nicht. (c) Ob Garzeit-Hinweise wie „Frikadellen je Seite …“ aufgenommen werden, entscheidet Uwe; laut Seitenkommentar stehen sie bewusst nicht drin, weil keine Referenz sie deckt. | Die Seite ist strukturell bereits stark (H1 mit Zahl, erster Satz mit Zahl, 2 echte Tabellen, FAQPage, Article mit Datum) und deckt die KI-Nebenfragen ab. Es fehlen Quellenlinks und ein menschlicher Prüfnachweis im Schema. |
| I5 | /methoden/smoken-low-and-slow | (a) „110–130 °C“ schon in den ersten Satz. (b) Garraum vereinheitlichen: Überblick 110–130 °C gegenüber Tabelle 110–120 °C für Brisket, Pulled Pork und Ribs. (c) Stall-Angabe angleichen: hier 65–70 °C, im Stall-Artikel 65–72 °C. (d) Externe Quellen ergänzen. | **Befund YAML:** Die Tabelle nennt Pulled Pork mit 88–95 °C, `pork_lowslow` hat 90–95. Die Untergrenze 88 liegt unter dem Korridor (im Texas-Crutch-Artikel ist ein 88-°C-Wert ausdrücklich als Quellenaussage abgegrenzt, hier nicht). Pos. ~9. bbq-ratgeber nennt die Zahl im ersten Absatz und hat 6 FAQs. |
| I6 | /artikel/texas-crutch-folie-oder-butcher-paper | Prüfen, ob der Einstieg die Temperaturspanne aus den Quellen (65–71 °C früh / 82 °C spät, wie in der FAQ) schon im ersten Absatz klar als Quellenangabe nennt. Die ehrliche Aussage „kein belegter Wert“ bleibt. | KI-Antworten geben eine Zahl aus (66–74 °C). Wer zitiert werden will, braucht die Spanne früh im Text, gern mit dem Hinweis, dass sie nicht belegt ist. Der Artikel ist erst seit 09.10. live; Ranking abwarten. |
| I7 | **neu oder im Guide: Spanferkel** | Zuerst einen **Referenzwert in data/kerntemperatur-referenz.yaml** festlegen (ganz, Keule, Rollbraten, Kotelett), danach Antwortseite oder Guide-Zeile. | SA hat keinerlei Inhalt und keinen YAML-Wert. Die Konkurrenz nennt 72–80 °C (nur Befund). Pos. ~30 bei leerer Abdeckung. |
| I8 | Schnitzel (Guide-Zeile oder eigene kurze Antwortseite) | Uwe entscheidet, welcher YAML-Eintrag für Schnitzel gilt (etwa `pork_keule` oder ein eigener Eintrag). Danach eine Antwort mit Zahl im ersten Satz, Schwein und Kalb getrennt. | Die Guide-Zeile sagt 70 °C, die YAML hat keinen Schnitzel-Eintrag, die KI zitiert eat.de und grillfuerst mit 65–70 °C. Pos. 8–10 mit einer einzigen Tabellenzeile. |
| I9 | **neu: Geflügel/BfR-Antwort** (eigene Seite oder Guide-Abschnitt **nach 30.10.**) | Antwort auf „BfR Geflügel 70 °C 2 Minuten“ mit **verlinkter Primärquelle** und klarer Trennung: BfR-Allgemeinregel (≥ 70 °C ≥ 2 Min., PM 01/2014), BfR zu Campylobacter/Ente (74 °C), SA-Hauswert `sicherheit.gefluegel` 72 °C. | Pos. 5–7. Die KI behauptet „BfR“, belegt es aber mit einem Händler-Fasan-Artikel. Mit präziser Quellenangabe kann SA die zitierfähigste Seite für diese Frage werden. |
| I10 | /temperatur-guide — **nach 30.10.** | (a) Erster Absatz mit Zahl (bisher nur Definition). (b) **Quellenliste korrigieren:** Die EFSA-Quelle heißt „Scientific Opinion on the risk posed by pathogens in food of non-animal origin“ und belegt die Schweinefleisch-Aussage („EFSA-Studie von 2011“, 63 °C) nicht. (c) Quellen verlinken (BfR, EFSA, FSIS, VO 2075/2005). (d) Spanferkel- und Chateaubriand-Zeilen ergänzen, sobald YAML-Werte da sind. (e) Den Guide als Hub mit Links zu den Antwortseiten (Hackfleisch, Steak, Geflügel …) ausbauen. (f) Byline mit fachlich Verantwortlichem. | **Befund YAML:** Die Sous-Vide-Tabelle nennt „Schweinefilet 60 °C — Rosa, EFSA-konform“ (page.tsx Z. 1131). `sicherheit.schwein` ist 63, `pork_juicy` 63–65. Das ist ein Widerspruch zur eigenen Referenz und zur Guide-Aussage „63 °C“; nur als Befund notiert, Uwe entscheidet. |

### Reihenfolge-Vorschlag (Hebel/Aufwand)
1. **T1 + T2** sofort: interne Links auf /kerntemperatur-hackfleisch und Bing-Indexierung. Größtes Impressionsvolumen, Seite schon fertig.
2. **I1** (/kerntemperatur-steak) und **I2** (Ribeye-Einstieg). Beide nutzen vorhandene YAML-Werte.
3. **I3** (Chateaubriand: Tabelle, Einstieg, Widersprüche). Pos. ~11 ist nah an Seite 1.
4. **I9/I10** (BfR-Antwort, Guide-Korrekturen) ab 31.10.
5. **I7/I8** (Spanferkel, Schnitzel). Setzen voraus, dass Uwe vorher Referenzwerte festlegt.

---

## Anhang: Methodik und Rohdaten

- Bing KI-Modus: `https://www.bing.com/copilotsearch?q=<anfrage>&setlang=de&cc=DE`, ohne Login, im eingebauten Browser. Quellen aus den Links der Antwort ausgelesen (Weiterleitungs-Parameter `u=` dekodiert).
- Bing organisch: per WebFetch und Browser. Long-Tail-Anfragen degradiert (siehe Abschnitt 0).
- Konkurrenzseiten per WebFetch analysiert. Die Merkmale (erster Absatz, Tabellen, Quellen, Autor, Datum, FAQ) stammen aus einer Modell-Zusammenfassung der Seite. Wortzahlen sind grobe Schätzungen.
- SA-Seiten: live per curl (Title, Meta, H1, JSON-LD, Tabellen) und im Repo-Quelltext gegengeprüft (content/rezepte/chateaubriand-filet.mdx, content/methoden/smoken-low-and-slow.mdx, src/app/temperatur-guide/page.tsx, src/app/kerntemperatur-hackfleisch/page.tsx, data/kerntemperatur-referenz.yaml, next-sitemap.config.js, live sitemap-0.xml, robots.txt, llms.txt).
- robots.txt erlaubt die KI-Such-Bots (OAI-SearchBot, Claude-SearchBot, PerplexityBot …) und sperrt die Trainings-Bots. Copilot läuft über bingbot. llms.txt ist vorhanden und listet /temperatur-guide, /kerntemperatur-hackfleisch und /cuts/ribeye. Hier besteht kein Handlungsbedarf.
- Keine Formulare abgesendet, keine Konten angelegt, kein Consent bestätigt, kein CAPTCHA umgangen.
