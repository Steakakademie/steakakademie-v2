# Affiliate-Angebote, Bundles und Aktionsseiten — Konzept

Stand 11.10.2026. Auftrag Uwe (11.10.2026): Affiliate-Angebote, „Bundles in mehreren
Richtungen" und Aktionsseiten (Weihnachten, Neujahr, …) im Stil der Steakakademie; Vorbild für
die Mechanik: grillfuerst.de. Dazu die Fragen: Bedingungen der Advertiser, darf ich Bundles
packen, was ist zu beachten, ist alles DSGVO-konform?

Ergänzt `docs/affiliate-strategie-2026.md` (Programme, Start 01.11.) und
`docs/gutschein-sichtbarkeit-konzept.md` (Gutscheine). Grundlage: zwei Recherchen vom 11.10.2026 —
Bestand im Repo (Code, Tests, Datenschutzerklärung) und öffentliche Quellen (Awin-AGB + Code of
Conduct, Webgains-AGB, Amazon-Programmrichtlinien, PAngV, UWG, JMStV, Werberat, Awin-DSGVO-Annex).
**Keine Rechtsberatung.** Was nur nach Login bei Awin/Webgains einsehbar ist, steht in Abschnitt 7.

---

## 1. Antwort in fünf Sätzen

1. **Bundles ja — als kuratierte Zusammenstellung, nicht als Produkt.** Wir verkaufen nichts, wir
   empfehlen; jeder Artikel verlinkt in seinen Shop, es gibt keinen Paketpreis und keinen
   gemeinsamen Warenkorb.
2. **Mechaniken von Grillfürst lassen sich übersetzen**, aber nicht kopieren: Themenwelten,
   Setups statt Sets, eigene digitale Zugaben statt Händler-Zugaben, Markenwelten als
   Partnerseiten. Rabatt-Badges und Streichpreise nur mit Händlerdaten und PAngV-Pflichten.
3. **Die Advertiser-Bedingungen** sind nur zum Teil öffentlich (Abschnitt 3). Was öffentlich ist:
   Kennzeichnung, keine Veränderung von Werbemitteln, keine Markenkeywords in Anzeigen, nur
   freigegebene Gutscheincodes, Amazon-Links nicht in Mails/PDFs und nicht hinter Zwischenseiten.
4. **DSGVO: Der heutige Stand ist sauber** (keine Tracking-Skripte, keine Cookies, Weiterleitung
   speichert nichts). **Für Awin/Webgains ist er noch nicht fertig:** Datenschutzerklärung
   Abschnitt 13 ist veraltet, und die Kennzeichnungsregel im Code kennt nur Amazon.
5. **Vor dem 01.11. braucht es einen Compliance-PR** (Abschnitt 6), sonst liefen die ersten
   Awin-Links ohne „Anzeige" — das wäre ein Abmahnrisiko am ersten Tag.

---

## 2. Was Grillfürst macht — und was davon in die Steakakademie passt

Geprüft am 11.10.2026 auf der Startseite (Browser + Seitentext).

| Grillfürst | Mechanik | Steakakademie-Übersetzung | Passt? |
|---|---|---|---|
| „Ab 50 € Warenkorb kostenfrei dazu" (gestaffelte Zugaben) | Warenkorb-Anreiz | Geht nicht (fremder Warenkorb). **Eigene Zugabe:** Wer über einen Partnerlink kauft, hat nichts davon — aber die Aktionsseite kann unsere kostenlosen Dinge beilegen: Spickzettel, Kerntemperatur-Guide, Steak-Beichte-Probe | ja, als eigener Mehrwert |
| „15 %*" / „50 %*" mit Streich-UVP | Rabatt-Badge | Nur mit Vergleichspreis aus dem Händler-Feed und Stand-Datum; § 11 PAngV (30-Tage-Bestpreis) gilt dem Händler, aber die Darstellung muss stimmen | später, nur mit Feed |
| „Unser Grill des Jahres" mit Streichpreis | Hero-Empfehlung | „Empfehlung des Jahres" als Marktübersicht ohne Testbehauptung (Regel 12, Vergleichsseiten) | ja, ohne „getestet" |
| X-DEAL „inkl. Gussplatte & Drehspieß", Dutch-Oven-Sets, Starter-Set | Sets | **Setups:** „Oberhitze-Einsteiger-Setup", „Dry-Age-Setup", „Weihnachtsmenü-Setup" — je 3–6 Artikel aus verschiedenen Shops, mit unserem Wissen dazwischen (warum dieses Thermometer zu diesem Grill) | **ja, Kern** |
| Markenwelten (Napoleon, Broil King …) | Markenseite | Partnerwelten für Santos, SharkNinja (Ninja Woodfire), BOS FOOD, vineshop24 — nur mit freigegebenen Werbemitteln und Logo-Erlaubnis | ja, ab Freischaltung |
| Themenwelten (Pizzaofen, Outdoorküche) | Themenseite | **Aktions-/Saisonseiten:** Weihnachten, Neujahr, Vatertag, Grillsaison-Start, Black Week | **ja, Kern** |
| „Frag die Grillfürst KI", WhatsApp, Videoberatung | Beratung | Marco (gibt es), Hofladen-Radar, Cut-Generator — die Beratung ist unser Vorsprung | ja, schon da |
| Einführungspreis „gültig bis 13.10." | Frist | Nur mit echter Händlerfrist aus dem Programm (Black Week Burghardt 23.–30.11.) — keine erfundene Knappheit | ja, nur echt |
| „Alle Preise inkl. USt. zzgl. Versand", Lieferzeit | Pflichtangaben | Sobald wir Preise zeigen: dieselben Angaben + Stand | Pflicht |
| Newsletter, Gutscheine im Menü | Bindung | Wissens-Brief, eigene Gutscheine (gebaut) | ja |

**Was wir bewusst nicht machen:** Countdown-Timer, „nur noch 3 Stück", Exit-Popups, Banner über
dem Inhalt (CLAUDE.md §2 Regel 8: Inhalt zuerst), erfundene Rabatte.

---

## 3. Bedingungen der Advertiser — was öffentlich belegt ist

| Programm | Provision | Cookie | Öffentlich bekannte Regeln | Quelle |
|---|---|---|---|---|
| **Santos Grills** (Awin 32287) | 10 % Santos-Marke, 7 % andere Marken | 30 Tage | Werbemittel über Awin; Programmbedingungen nur nach Login | ui.awin.com/merchant-profile/32287 |
| **BOS FOOD** (Awin 19712) | 10 % Endkunden, 3 % Gastro/Firmen | 30 Tage | nur dem Programm zugeordnete Gutscheincodes; keine Markenkeywords in Anzeigen; keine iFrames/Pop-ups; nur Awin-Werbemittel; Markenname redaktionell (Rezepte) in Ordnung, **Logo vorab abstimmen**; Produktdaten-Feed vorhanden | Profil + Suchmaschinen-Auszug der Terms |
| **SharkNinja DE** (Awin 19810) | Standard 5 %, **Editorial Content 1–5 %**, Vergleichsseiten 1–3 %, Voucher 1–2 %; Zubehör/Refurbished 0 % | 30 Tage, Validierung 30 Tage | geschlossene PPC-Richtlinie, keine Markenkeywords, Feed vorhanden | Profil |
| **Burghardt Delicious** (Awin 115505) | nicht öffentlich | 30 Tage | **Achtung: Snacks, Nüsse, Trockenfrüchte, Feinkost, Wein** — kein Grillzubehör. Wein ⇒ Alkoholregeln (Abschnitt 5). Werbemittel „nach Absprache" | Profil |
| **vineshop24** (Webgains) | bis 14 % vom Netto-Warenwert (Aggregator-Angabe) | 60 Tage | nur freigegebene Gutscheine, abgelaufene binnen 14 Tagen entfernen; keine Markenkeywords; Direktlinks nur nach Absprache; keine Layer/iFrames; Impressum Pflicht. Jugendschutz-Auflagen des Advertisers: **nicht öffentlich** | affi.io (Aggregator, nicht Webgains) |
| **Amazon PartnerNet** | je Kategorie | 24 h Warenkorb | Pflichtsatz „Als Amazon-Partner verdiene ich an qualifizierten Verkäufen"; Preise/Verfügbarkeit nur per API, max. 24 h alt, sonst Zeitstempel; **keine Links in E-Mails ohne Opt-in, nicht in E-Books/Druck**; keine Verschleierung von URL, **Zwischenseiten-Weiterleitungen ohne Nutzeraktion = keine Vergütung**; Bewertungen/Sterne nur per API; keine Eigenkäufe, keine Anreize | partnernet.amazon.de/help/operating/policies |

**Netzwerkregeln, die für alle Awin-Programme gelten** (AGB August 2025 + Code of Conduct):
Werbemittel unverändert und nur im Rahmen der Programmbedingungen; Verbraucherinformationen
„korrekt und aktuell"; Referrer muss die echte Seite zeigen (unser `/go/`-Redirect ist ein 302 mit
echtem Referrer — nach meiner Einschätzung zulässig, **nicht belegt**); Tracking nur nach bewusstem
Klick; keine Social-Präsenzen Dritter ohne Erlaubnis; Awin-Datenschutzerklärung muss aus unserer
verlinkt sein (DSGVO-Annex 2.5.4). **Webgains:** Werbeanzeigen nicht verändern ohne schriftliche
Genehmigung; kein Spam; Auszahlungsschwelle 50 €.

**Folge für Amazon:** Amazon-Links sollten **nicht** über `/go/` laufen (Programmrichtlinie 6(v)/(w)
und Vergütungskatalog 2(e)). Heute laufen alle 26 Registry-Links über `/go/`. Das ist ein
Vergütungs- und Kontorisiko, kein Rechtsrisiko — Entscheidung: Amazon direkt verlinken, Klick
dann im Browser per Plausible-Klasse zählen (die Klassen gibt es schon).

---

## 4. Bundles — was erlaubt ist und wo die Grenzen liegen

### Erlaubt (Empfehlung)

- **Setup-Seiten:** „Was du für X brauchst" — 3–6 Artikel, je mit Begründung aus unserem
  Wissen, jeder mit eigenem Partnerlink („Anzeige") in seinen Shop. Keine Summe, kein „Paketpreis",
  kein „du sparst". Beispiel-Setups für 2026/27:
  - *Oberhitze-Einsteiger* (Santos-Grill + Thermometer + Salz/Öl von BOS FOOD)
  - *Dry-Age zu Hause* (Dry-Ager-Schrank, Thermometer, Messer, Salz)
  - *Weihnachtsmenü Rinderfilet* (Fleisch beim Partner, sobald es einen gibt; Trüffel/Öl BOS FOOD;
    Wein vineshop24; Mein Protokoll als Gutschein)
  - *Ninja-Woodfire-Start* (SharkNinja + Pellets + Spickzettel)
  - *Geschenke bis 25 / 50 / 100 €* (Budget-Gliederung, siehe Gutschein-Konzept M6)
- **Eigener digitaler Teil + Partnerlink:** Menü-Guide, Mein Protokoll oder Steak-Beichte sind
  das, was wir selbst verkaufen können (auch per Gutschein); die Zutaten und Geräte kommen per
  Partnerlink. Das ist das „Bundle" aus dem Gutschein-Konzept, Weg b.
- **Partnerwelten:** je Advertiser eine Seite mit freigegebenen Werbemitteln, unserem Text und
  Links — wie eine Markenwelt, aber ehrlich als Partnerseite („Anzeige" im Kopf).

### Nicht erlaubt oder nicht 2026

- **Kein Paketpreis, kein gemeinsamer Warenkorb, kein „Bundle kaufen"-Knopf.** Wir sind nicht
  Verkäufer; ein Gesamtpreis mit Weiterleitung gilt als „Angebot" im Sinne der PAngV
  (LG Hamburg, 02.02.2023, 304 HK O 102/22) mit allen Pflichten, die wir nicht erfüllen können.
- **Keine eigenen Lebensmittel-Bundles** (einkaufen + weiterverkaufen): Lebensmittelunternehmer,
  LMIV, Kühlkette, Haftung — eigenes Geschäftsfeld (Gutschein-Konzept, Abschnitt 3).
- **Keine Rabattcodes**, die nicht dem jeweiligen Awin-/Webgains-Programm zugeordnet sind.
- **Keine Amazon-Links in Mails, PDFs, E-Books oder gedruckten Spickzetteln.** Der Wissens-Brief
  darf Awin-/Webgains-Partnerlinks enthalten (als „Werbung" markiert, nur Double-Opt-in), keine
  Amazon-Links.
- **Keine Logos ohne Freigabe** (BOS FOOD verlangt Abstimmung; Awin: Werbemittel unverändert).
- **Keine Preise ohne Feed.** Solange kein Produktfeed angebunden ist: Setups ohne Preise, oder
  mit „ca. … € (Stand …)" plus „inkl. MwSt., zzgl. Versand" — und dann Pflicht zur Pflege.

---

## 5. Was zu beachten ist — Checkliste je Seite

| Thema | Pflicht | Grundlage |
|---|---|---|
| **Kennzeichnung** | „Anzeige" oder „Werbung" **am Link**, vor dem Klick. „Affiliate-Link", „sponsored by", „*" ohne Auflösung auf derselben Seite reichen nicht (BGH I ZR 2/11). Partnerwelten/Aktionsseiten zusätzlich im Kopf: „Diese Seite enthält Partnerlinks (Anzeige)". `rel="sponsored"`. | § 5a Abs. 4 UWG, § 6 DDG, § 22 MStV |
| **Amazon-Satz** | „Als Amazon-Partner verdiene ich an qualifizierten Verkäufen" sichtbar, wo Amazon-Links stehen | Teilnahmevereinbarung Ziff. 5 |
| **Preise** | Wenn genannt: Gesamtpreis inkl. USt., Versandkostenhinweis, Stand-Datum; bei Lebensmitteln nach Gewicht/Volumen **Grundpreis** (z. B. €/100 g); Streichpreis nur mit Vergleichspreis aus dem Feed | §§ 3, 4, 6, 11 PAngV; Amazon: 24 h + Zeitstempel |
| **Wein/Spirituosen** (vineshop24, Burghardt) | Keine Ansprache Minderjähriger, keine Personen unter 18 im Bild, kein Alkohol als Leistungs-/Erfolgsfaktor, **keine Gesundheitsaussagen** („bekömmlich"), kein Konsum am Grill mit Kindern im Bild; Hinweis auf Aktionsseiten mit Wein: „Alkoholische Getränke — für Erwachsene ab 18" | § 6 Abs. 5 JMStV, Werberat Alkohol 2026, Art. 4 Abs. 3 HCVO |
| **Öle, Trüffel, Kaviar, Nüsse** | Keine Gesundheitsversprechen („entzündungshemmend", „gut verträglich", „gesund"); Zutaten/Allergene nicht selbst behaupten — der Händler ist LMIV-pflichtig, wir haften für falsche Aussagen | HCVO 1924/2006, UWG |
| **Keine Testbehauptung** | „Empfehlung", „Marktübersicht", nie „getestet"/„Testsieger" ohne echten Test | Regel 12, Wächter `vergleich-keine-testbehauptung.test.ts` |
| **Fristen** | „bis 30.11." nur, wenn die Aktion des Händlers so läuft; danach Satz raus (Zusagen-Register mit `mensch`-Beleg + Ablauf) | Regel 12 |
| **Startseite** | Aktions-Teaser nie above the fold; Platz: unter dem Diplom-Teaser, wie der Gutschein-Teaser | Regel 8 |
| **Werbemittel** | Nur aus dem Netzwerk, unverändert; Logo nur mit Erlaubnis | Awin AGB 10.1, Webgains 5.13 |

---

## 6. DSGVO — Befund und was fehlt

### In Ordnung (belegt im Repo, 11.10.2026)

- `/go/` und `/go-fleisch/` setzen keine Cookies, speichern nichts in Supabase, Ziel nur aus der
  Registry (kein offener Redirect). Die Klickmeldung an Plausible (IP, User-Agent, Herkunftsseite)
  steht in der Datenschutzerklärung, Abschnitt 5.
- Keine Dritt-Skripte von Awin (MasterTag), Amazon (Widgets/OneLink) oder Webgains. Clarity nur
  mit Einwilligung; Plausible ohne Cookies.
- Referrer-Policy `strict-origin-when-cross-origin`.
- Alle Amazon-Links tragen „Anzeige" + `rel="sponsored"` (Tests `partnerlink-preisstand`,
  `MdxTextLink`, legal-guard).

### Fehlt — Compliance-PR vor dem 01.11. (Regel 6: autonom, dann Bericht)

1. **Kennzeichnungsregel erweitern:** `src/components/affiliate/produkt-anzeige.ts` erkennt nur
   Amazon-URLs mit `tag=`. Awin- (`awin1.com`) und Webgains-Links müssen ebenso als Partnerlink
   gelten — sonst laufen sie ohne „Anzeige". Dazu `MdxTextLink.tsx`. Wächter: Test, der einen
   awin1-Link ohne Etikett rot macht.
2. **Datenschutzerklärung Abschnitt 13 neu schreiben:** Kennzeichnung heißt „Anzeige" (nicht „*");
   Verantwortliche nennen — Amazon Europe Core S.à r.l., **AWIN AG** (Berlin; gemeinsame
   Verantwortlichkeit nach DSGVO-Annex 2.5, Link auf awin.com/de/datenschutzerklarung Pflicht),
   **Webgains GmbH** (Nürnberg); Zweck (Provisionsabrechnung), Rechtsgrundlage (Art. 6 Abs. 1
   lit. f), Cookie-Setzung erst auf der Netzwerk-/Händlerdomain nach dem Klick, Speicherdauer laut
   Netzwerk (Awin bis 3 Jahre); veraltete Programme (360° BBQ, Grill-Experte, Banggood) raus,
   Burghardt/BURNHARD rein. Nummerierung (13 vor 12a) ordnen. Gleiches für
   `/affiliate-disclosure`.
3. **„Anzeige" an den Fleisch-Kaufknöpfen** (`CutGenerator.tsx`, `CutAtlasClient.tsx`): der
   Hinweis „Affiliate-Link" steht erst unter dem Knopf — reicht nicht.
4. **`scripts/check-affiliate-tags.mjs` in `npm run check`** aufnehmen (läuft heute nirgends);
   legal-guard auf `src/components/cuts` ausweiten und awin1/webgains in die Tracker-Liste.
5. ✓ 11.10. (Uwe: „nimm Amazon aus /go/ raus"): Amazon-Partnerlinks gehen direkt zu Amazon
   (`produktLink`, `MdxTextLink`, Fleisch-Kaufknopf), Zählung per Plausible-Klasse im Browser;
   `/go/` bleibt für Netzwerk-Links (AWIN, Webgains) und alte URLs.
6. **Netlify-Rest** in `go/.../route.ts` (Header `x-nf-client-connection-ip`) entfernen; Referer
   ohne Query an Plausible melden.
7. `compliance/website-rechtscheck.yaml` Z. 241 aktualisieren.

### Offene Einschätzung: Einwilligung für Awin-Cookies

Awins DSGVO-Annex (Ziff. 2.2) verpflichtet Publisher vertraglich, für die Cookies, die Awin **nach
dem Klick auf awin1.com** setzt, eine Einwilligung einzuholen. Awins eigene Publisher-Richtlinie
(2018) nennt als eine zulässige Form, dass der bewusste Klick auf einen gekennzeichneten externen
Link die Zustimmung ist; eine Aufsichtsbehörden-Aussage zu reinen Textlinks habe ich nicht
gefunden. **Vorschlag (Annahme, keine Rechtsberatung):** keine zusätzliche Consent-Kategorie für
Textlinks; stattdessen (a) Datenschutzerklärung wie oben, (b) „Anzeige" am Link, (c) Hinweis in
der Datenschutzerklärung und auf `/affiliate-disclosure`: „Mit dem Klick auf einen Partnerlink
wirst du über das Netzwerk weitergeleitet; dort wird ein Cookie gesetzt." Sobald ein Netzwerk-
Skript, Banner-Widget oder Produkt-Widget eingebunden wird, braucht es eine Kategorie
„Partner/Marketing" im Consent-Banner — dann ohne Einwilligung kein Skript. Entscheidung Uwe.

---

## 7. Nicht belegbar / nur nach Login

- Vollständige Programmbedingungen von Santos, SharkNinja, Burghardt (Awin „Terms"-Tab: 404
  ohne Login); BOS FOOD nur als Suchmaschinen-Auszug.
- Validierungsfristen Santos/BOS FOOD/Burghardt, Provision Burghardt, Feeds Santos/Burghardt.
- Ob die Advertiser Newsletter, Social-Posts, eigene Redirect-Domains ausdrücklich erlauben.
- Offizielle vineshop24-Bedingungen (nur Aggregator) und Jugendschutz-Auflagen.
- Webgains „Agreement on Data Protection" (PDF existiert, nicht ausgewertet).
- Behördliche Aussage, ob ein Affiliate-Textlink-Klick Einwilligung braucht.
- Grillfürst-Mechaniken auf Unterseiten (nur Startseite geprüft).

**Sobald die Freischaltungen da sind:** Terms je Programm aus dem Login lesen und als Zeilen in
`products/affiliate-programs.yaml` (`bedingungen:`) festhalten — dann ist Abschnitt 3 belegt.

---

## 8. Aktionsseiten — Vorschlag Kalender und Aufbau

| Seite | Fenster | Inhalt | Partner |
|---|---|---|---|
| `/geschenke` (Ratgeber liegt als Entwurf) | 02.11.–24.12. | Budget-Gliederung 10/25/50/100 €, Setups, eigene Gutscheine, „in zwei Minuten im Postfach" | Santos, BOS FOOD, Burghardt, vineshop24, eigene |
| Black Week | 23.–30.11. (Burghardt 26 %) | nur echte Händleraktionen mit Enddatum; Fenster im Saisonkalender anlegen | Burghardt, weitere nach Freischaltung |
| Weihnachtsmenü | 15.11.–24.12. | Rinderfilet/Roastbeef-Setup, Zeitplan, Wein, Trüffel; Mein Protokoll/Menü-Guide als eigener Teil | BOS FOOD, vineshop24, Fleischpartner (offen) |
| Neujahr / Vorsätze | 27.12.–31.01. | „2027 besser grillen": Diplom, Mein Protokoll, Thermometer-Setup; Raclette/Fondue-Alternative am Grill | SharkNinja (Indoor), Amazon |
| Grillsaison-Start | 15.03.–30.04. | Grill-Check, Reinigung, Erstausstattung-Setups | Santos, SharkNinja |
| Vatertag | 01.05.–Pfingsten | Geschenke-Setups, Gutscheine (Motiv Vatertag gebaut) | alle |

Aufbau jeder Aktionsseite: H1 mit Thema (nicht mit Rabatt) → kurzer Nutzen → Setups mit „Anzeige"
je Link → eigener Teil (Gutschein, Guide, Kurs) → FAQ (FAQPage-Schema) → Kennzeichnungsblock mit
Amazon-Satz. Kein Countdown, keine Knappheit. Seitentyp `aktionsseite` in `src/lib/angebote/typen.ts`
für das Angebotsregal.

**Technik — gebaut 11.10.2026:** Inhaltsmodell `data/aktionen/*.yaml` (Form `src/lib/aktionen/typen.ts`,
Loader `src/lib/aktionen/index.ts`), Route `/aktionen/[slug]` und kurze Adresse `/geschenke`,
Seite `src/components/aktionen/AktionsSeite.tsx`, Produktzeile ohne Preis
`src/components/affiliate/AktionProdukt.tsx`. Sichtbar nur im Fenster (sonst 404), `?vorschau=1`
zum Gegenlesen (noindex). Sitemap nimmt sie nur im laufenden Fenster auf (`next-sitemap.config.js`).
Erste Seiten: `geschenke` (02.11.–24.12.) und `weihnachtsmenue` (15.11.–24.12.), ohne Preise,
ohne Temperaturen, ohne Testurteile (Test `src/__tests__/aktionen.test.ts`). Messung: Plausible
`Affiliate-Klick` mit `zone=aktion`.

**Teaser und Menüpunkt (✓ 11.10., #393):** Startseiten-Teaser „Gerade passend" unter dem
Gutschein-Teaser (Marker AKTIONS-TEASER, CLAUDE.md Regel 8) und je laufender Aktion ein
Menüpunkt; Quelle für den Header ist `src/lib/aktionen/nav.ts` (Test gegen die YAML).
**Saison-Leiste und Saison-Chip (✓ 11.10., Uwe: „Trotzdem muss die Steakakademie auch
Verkaufen"):** Im Fenster läuft über der Navigation eine Laufleiste mit den Aktionsseiten und
dem Gutschein (hält bei Hover, still bei „weniger Bewegung"), und im Kopfbereich der
Startseite steht ein glühender Chip zur ersten laufenden Aktion. Anzeigen und Social-Posts
führen trotzdem **direkt** auf `/geschenke` bzw. `/aktionen/<slug>`, nie auf `/`.
**Geschenke-Finder (✓ 11.10., Uwe: „bau den Geschenke-Finder"):** drei Fragen (Für wen? Wie gut
grillt die Person? Was soll es sein?), Ergebnis = Setup der Stufe aus `geschenke.yaml` (Feld
`stufe`) + passender Gutschein, teilbar per Link. Ganzjährig unter `/geschenke-finder` (Tools-Menü),
im Fenster oben auf `/geschenke` (`finder: true`). Keine Budget-Frage, solange keine aktuellen
Preise vorliegen. Code: `src/lib/geschenke-finder.ts`, `src/components/geschenke/*`.
**Vorschau vor dem Fenster:** `https://steakakademie.de/?vorschau=1` schaltet Teaser und Menü
für die Browser-Sitzung ein (alle Aktionsseiten, Links mit `?vorschau=1`), `?vorschau=0` aus
(`src/lib/aktionen/vorschau.ts`). Das Zusagen-Gate
liest `data/aktionen/*.yaml` nicht — die Texte dort bleiben deshalb ohne Versand-, Frist- und
Testaussagen (Kopfkommentar der YAML).

---

## 9. Reihenfolge

| Wann | Was | Wer |
|---|---|---|
| jetzt | Compliance-PR (Abschnitt 6, Punkte 1–7) | Claude, Regel 6 |
| nach Freischaltung | Terms je Programm lesen, ins Register; Logo-Freigaben anfragen (BOS FOOD) | Uwe liest, Claude trägt ein |
| ✓ 11.10. | `/aktionen/[slug]` + `/geschenke` gebaut, ohne Preise (PR). Black-Week-Fenster im Kalender offen | Claude |
| 01.11. | Programme `active`, erste Setups live | Uwe schaltet |
| ab Dezember | Feed-Anbindung prüfen (BOS FOOD, SharkNinja haben Feeds) → dann Preise mit Stand | Entscheidung |
