# Affiliate-Strategie Steakakademie — Herbst 2026

Stand 09.10.2026. Entwurf von Claude für die Arbeitssitzung am 10.10.2026
(Cockpit #28 „Affiliate läuft ungeprüft", CLAUDE.md § 5 Blocker 4). Ziel: die
neuen Zusagen bei AWIN und Webgains nutzen, bevor sie verfallen — und zwar so,
dass vor dem 01.11.2026 keine Einnahmen entstehen, die das Einstiegsgeld
gefährden.

## Kurz

1. **Morgen (10.10.):** alles vorbereiten, nichts scharf schalten. Registry
   nachziehen, AWIN-Deeplinks bauen, Platzierungen festlegen, den Advertisern
   schreiben, dass es am 01.11. losgeht.
2. **Ab 01.11. (oder nach Zusage des Jobcenters):** Links live, Black Week und
   Weihnachten mitnehmen.
3. **Amazon** im selben Jobcenter-Gespräch klären — die Amazon-Links sind
   schon heute live (siehe „Ein Haken").

## Bestand (geprüft 09.10.2026)

**Technik ist da:**

- Produktregister `products/registry.yaml` (32 Produkte: 25 Amazon, 1 Otto
  Gourmet, 6 sonstige), Programmregister `products/affiliate-programs.yaml`
  (Status `planned` / `applied` / `active`).
- Weiterleitung `/go/[produkt]` mit Klickzählung (Plausible-Event
  „Affiliate-Klick", ohne Cookie), 302 auf den Partnerlink.
- Fleisch-Brücke im Cut-Generator (`src/lib/cut-affiliate.ts`): Partner mit
  `status: 'active'` vor Amazon-Fallback.
- Komponenten für Vergleiche, Inline-Links, Preis mit Stand;
  `/affiliate-disclosure` listet automatisch alle Programme mit `active`.

**Veraltet:** Das Programmregister ist vom 02.06.2026. Es kennt weder AWIN
noch Webgains und führt Programme (360° BBQ, Grill-Experte, Banggood,
BURNHARD) als `planned`, deren Stand niemand geprüft hat.

**Amazon:** `active`, Tag `steakakademie-21`. Die Links sind
Amazon-**Suchen** (`/s?k=…`), keine Produktseiten — das konvertiert
schlechter, ist aber zulässig.

## Zusagen (aus dem Postfach, Stand 09.10.)

AWIN, Publisher-ID **3102406** (Konto aktiv seit 22.09.):

| Advertiser | AWIN-ID | Zugelassen | Passt zu | Einschätzung |
|---|---|---|---|---|
| Santos Grills DE | 32287 | 05.10. | Grill-Marktübersicht, Oberhitze, Gasgrill-Artikel | **Kern.** Hoher Warenkorb, genau das Thema. Provisionssätze am 06.10. geändert — im Profil nachsehen. |
| BOS FOOD DE | 19712 | 02.10. | ~~Cut-Seiten, Cut-Generator (Fleisch-Brücke)~~ — **korrigiert 10.10.2026 (Uwe):** Spezialitäten wie Trüffel, Öle, Kaviar; Rezepte und Zutaten, Geschenke | **Kern für Spezialitäten.** Der Shop führt auch Fleisch, ist aber nicht als Fleischpartner vorgesehen. |
| SharkNinja DE | 19810 | 09.10. | Ninja Woodfire (Outdoor-Grill/Smoker), Küchenmaschinen-Übersicht | Gut, aber nur für einzelne Geräte. Provisionssätze am 09.10. geändert. |
| Burghardt Delicious | 115505 | 06.10. | Geschenke-Ratgeber, Wissens-Brief im Advent | Ergänzung. Feinkost, Probiersets, Weihnachtsgeschenke. Bietet höhere Provision für feste Platzierungen. Black Week 23.–30.11. (26 %), Nikolaus 01.–02.12. |
| Air Fryer Club | 121016 | Einladung 04.10. | — | Nicht annehmen: Heißluftfritteuse ist nicht unser Thema. |
| brickzonehub | — | Einladung 07.10. | — | Nicht annehmen: kein Bezug. |
| Delonghi DE, OlivenZauber | — | abgelehnt | — | — |

**Webgains:** Konto seit 21.09. aktiv. Zusagen für einzelne Programme sind im
Postfach **nicht** zu finden. Morgen in Webgains nachsehen, welche
Advertiser dort sind, und gezielt bewerben (Grill, Fleisch, Messer, Gewürze).
*Nachtrag 10.10.2026:* In der Webgains-Oberfläche ist Steakakademie genau einem
Programm beigetreten: **vineshop24 DE** (Wein, Spirituosen, Geschenke; Provision
5–14 %, Produktfeed ja, keine PPC-Richtlinie). Im Register als `applied`; er passt zu den
Wein- und Whisky-Empfehlungen der Rezepte und zum Geschenke-Ratgeber, nicht zum
Fleisch-Kern. Vor dem Start klären: Jugendschutz/Altersprüfung bei Alkohol. Die Tabs
„Ausstehend" und „Einladungen" sind noch nicht gesichtet.

## Verabschieden sie sich?

Kurzfristig nicht. Advertiser räumen inaktive Publisher meist in größeren
Abständen aus — nach Monaten ohne Klicks, nicht nach drei Wochen. Was hilft
und nichts kostet: **eine kurze Nachricht an jeden zugelassenen Advertiser
über die AWIN-Nachrichtenfunktion**, dass die Platzierungen vorbereitet sind
und am 01.11. live gehen (Vorlage unten). Burghardt fragt ausdrücklich danach.

**Echte Frist bei Amazon:** Amazon schließt neue Partnerkonten, die in den
ersten 180 Tagen nach der Anmeldung keine drei qualifizierten Verkäufe
erreichen. Morgen in PartnerNet das Anmeldedatum nachsehen. Wurde das Konto
im Juni eröffnet, endet die Frist im Dezember.

## Ein Haken: Einnahmen vor dem 01.11.

Provisionen sind Einnahmen. Für Partnerlinks gilt deshalb dasselbe wie für die
Steak-Beichte (Cockpit #43): Einstiegsgeld wird nach gängiger Praxis vor
Aufnahme der Selbstständigkeit beantragt, und Einnahmen während der
Grundsicherung sind zu melden (Einschätzung, keine Beratung).

- **Neue Partnerlinks** (AWIN, Webgains) erst ab 01.11. bzw. nach Zusage live.
- **Amazon-Links sind schon live.** Im Jobcenter-Gespräch mitnennen und
  fragen, ob sie bis zum 01.11. raus sollen. In PartnerNet nachsehen, ob es
  bisher Provisionen gab.

## Platzierung — wo welcher Partner hin

Grundsatz: Partnerlinks stehen dort, wo jemand ohnehin eine Kaufentscheidung
vorbereitet. Kein Link ohne Bezug, keine Banner im Lesefluss.

| Ort | Heute | Ab 01.11. |
|---|---|---|
| Marktübersichten (`/vergleich/*`) | Amazon-Suchen | Santos als Fachhändler für Grills und Oberhitze; SharkNinja für Ninja Woodfire; Amazon für Kleinteile |
| Cut-Seiten und Cut-Generator | Amazon-Fallback | Fleischpartner **offen** (Don Carne/Albers ohne Rückmeldung, meatshop.de: Uwe ruft am 12.10. an); bis dahin Amazon-Fallback |
| Rezepte | einzelne Amazon-Links | unverändert, nur wo Zubehör wirklich gebraucht wird |
| Ratgeber „Geschenke für Grillfans" (Entwurf, 02.11.) | — | Santos, BOS FOOD (Spezialitäten als Geschenk), Burghardt (Probiersets) |
| Wissens-Brief | — | höchstens ein Partnerangebot je Ausgabe, als „Werbung" markiert; Black Week und Nikolaus mit Burghardt-Codes |
| Startseite, Kopfzeile | — | keine Partnerlinks (Startseiten-Hierarchie) |

## Technik — morgen

1. **Programmregister** um die vier AWIN-Advertiser ergänzen, Status
   `applied` (zugelassen, nicht live), mit AWIN-ID. Veraltete Einträge prüfen.
   `/affiliate-disclosure` nennt sie erst, wenn sie auf `active` stehen.
2. **AWIN-Deeplink-Baustein** in `src/lib/`: aus Advertiser-ID und Ziel-URL
   den Trackinglink bauen
   (`https://www.awin1.com/cread.php?awinmid=<ID>&awinaffid=3102406&ued=<URL>`),
   optional `clickref` für den Platz auf der Seite. Damit braucht nicht jeder
   Link einen Gang ins AWIN-Backend.
3. **Produktregister**: Für die Grills und Geräte, die Santos und SharkNinja
   führen, die Ziel-URL beim Händler ergänzen — vorerst ohne Umschalten.
4. **Fleisch-Brücke**: ~~BOS FOOD als Partner vorbereiten~~ — **entfällt (Uwe, 10.10.2026)**: Fleischpartner ist noch offen, BOS FOOD ist für Spezialitäten vorgesehen.
5. **Ein Schalter für den Start**: alles hängt an `status` im Register — am
   01.11. auf `active` stellen, ein PR, fertig.
6. **Kennzeichnung prüfen**: Jeder Partnerlink wird so ausgezeichnet und
   gekennzeichnet wie heute die Amazon-Links (`rel="sponsored"` in den
   Komponenten unter `src/components/affiliate/`) — auch bei AWIN und Webgains.

Banner und Produktfeeds aus AWIN bleiben vorerst draußen: Banner nur, wo sie
inhaltlich passen (Ratgeber, Wissens-Brief), und dann aus dem Netzwerk
eingebunden, nicht als Kopie — sonst zählt der Klick nicht.

## Vorlage: Nachricht an die Advertiser (AWIN-Nachrichtenfunktion)

> Hallo [Advertiser-Team],
>
> vielen Dank für die Freischaltung. Ich bereite gerade die Platzierungen auf
> steakakademie.de vor: [z. B. die Grill-Marktübersicht und die Seiten zu
> Oberhitze und Gasgrills / die Cut-Seiten mit Bezugsquellen für Wagyu und
> Dry Aged]. Online gehen sie am 01.11.2026, rechtzeitig vor der Black Week.
>
> Falls Sie für November und Dezember Aktionen planen, nehme ich die Codes
> gern in den Ratgeber „Geschenke für Grillfans" und in den Wissens-Brief auf.
>
> Viele Grüße
> Uwe Yendell, Steakakademie

Abschicken ist ein Schritt für Uwe (AWIN-Konto). Für Burghardt zusätzlich die
Black-Week-Platzierung im Wissens-Brief ansprechen — sie bieten dafür eine
höhere Provision an.

## Messen

Klicks je Partner und Platz über das Plausible-Event „Affiliate-Klick"
(`provider`, `produkt`), Umsätze und Provisionen in AWIN, Webgains und
PartnerNet. Der Cockpit-Abgleich nimmt ab November eine Zahl je Woche auf.

## Offene Entscheidungen für Uwe

1. Amazon-Links bis zum 01.11. lassen oder herausnehmen? (Jobcenter fragen)
2. Air Fryer Club und brickzonehub ablehnen — einverstanden?
3. Burghardt im Wissens-Brief zur Black Week fest einplanen?

## Stand 10.10.2026 — vorbereitet, nichts scharf

Umgesetzt (PR „AWIN-Vorbereitung"); **alle neuen Links sind aus**:

| Schritt aus „Technik — morgen" | Stand |
|---|---|
| 1 Programmregister | Santos, BOS FOOD, SharkNinja, Burghardt mit Status `applied` und AWIN-ID eingetragen. Provision und Cookie-Dauer stehen **nicht** drin („im AWIN-Profil nachsehen") — die Sätze haben sich am 06. und 09.10. geändert und sind hier nicht belegt. `/affiliate-disclosure` führt sie unter „in Vorbereitung", nicht als aktiv. Die alten Einträge (360° BBQ, Grill-Experte, Banggood, BURNHARD) sind weiter ungeprüft seit 02.06. |
| 2 Deeplink-Baustein | `src/lib/awin.ts` (`awinLink`): prüft https und die Domain des Advertisers, `clickref` für die Auswertung. Test: `src/__tests__/awin.test.ts`. |
| 3 Produktregister | **Nicht gemacht.** Dafür braucht es die konkreten Produktseiten bei Santos und SharkNinja; die ziehe ich nicht aus dem Gedächtnis. Aufgabe: im AWIN-Backend je Gerät die Ziel-URL holen. |
| 4 Fleisch-Brücke | **Korrigiert 10.10.2026 (Uwe):** BOS FOOD ist nicht der Fleischpartner, sondern für Spezialitäten vorgesehen. In `src/lib/cut-affiliate.ts` gibt es **keinen** Primärpartner mehr; es bleibt der Amazon-Fallback, bis ein Händler feststeht. |
| 5 Ein Schalter | `status` in `products/affiliate-programs.yaml` je Programm; die Fleisch-Brücke zusätzlich über `PRIMARY` in `cut-affiliate.ts` (derzeit leer) — ein PR. |
| 6 Kennzeichnung | Die Weiterleitungen `/go/…` und `/go-fleisch/…` zählen und kennzeichnen jeden Partnerlink gleich; Test `affiliate-weiterleitung.test.ts` bleibt grün. |

### Start am 01.11.2026 (oder nach Zusage des Jobcenters)
1. In AWIN je Advertiser Provision und Cookie-Dauer ablesen und in `products/affiliate-programs.yaml` eintragen.
2. Die vier Einträge dort von `applied` auf `active` stellen.
3. Steht bis dahin ein Fleischhändler fest: `PRIMARY` in `src/lib/cut-affiliate.ts` setzen (Händler, Link-Aufbau, Status `'active'`). Ohne Händler bleibt der Amazon-Fallback.
4. Die Platzierungen der Tabelle „Platzierung" setzen (Marktübersichten, Geschenke-Ratgeber, Wissens-Brief) — jeder Link über `awinLink` und die eigene Weiterleitung.
5. `/affiliate-disclosure` prüfen: die Programme stehen oben statt unter „in Vorbereitung".
