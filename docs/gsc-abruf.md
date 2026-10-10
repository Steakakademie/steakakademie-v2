# Search-Console-Abruf per API

> Abteilung Wachstum (SEO/GEO), Mechanik: Systems & Ops. Stand 10.10.2026.
> Skript: `scripts/gsc-abruf.mjs`, Test: `scripts/gsc-abruf.test.mjs`.

**Wozu:** Die Leistungsdaten der Search Console (Suchanfragen, Seiten, Länder, Geräte,
Verlauf) kommen ohne ZIP-Export und ohne Klickstrecke, für jeden Zeitraum, reproduzierbar.
Grundlage für die Messung am 30.10.2026 und jede weitere.

**Was es nicht tut:** Es schreibt nichts in die Search Console (nur-Lesen-Scope
`webmasters.readonly`), sendet nichts und legt keine Rohdaten im öffentlichen Repo ab.

## Einrichtung (einmalig, ca. 15 Minuten, Uwe)

1. **Google Cloud Console** → mit der Adresse anmelden, die die Search Console verwaltet
   (empfohlen: `steakakademie@gmail.com`) → neues Projekt „Steakakademie SEO".
2. **APIs & Dienste → Bibliothek →** „Google Search Console API" → **Aktivieren**.
   (Nicht „Search Console URL Testing Tools" — die richtige heißt „Google Search Console API".)
3. **IAM & Verwaltung → Dienstkonten → Dienstkonto erstellen**, Name z. B. `gsc-lesen`.
   Keine Projektrolle vergeben, keine Nutzer einladen.
4. Dienstkonto öffnen → **Schlüssel → Schlüssel hinzufügen → Neuen Schlüssel erstellen → JSON**.
   Die Datei wird heruntergeladen. **Nicht in dieses Repo legen.** Ablageorte, die das
   Skript akzeptiert: außerhalb des Repos (z. B. `C:\Users\Uwe\geheim\gsc-key.json`) oder
   unter `privat/` (gitignored). Jeder andere Ort im Repo wird abgelehnt.
5. In der **Search Console → Einstellungen → Nutzer und Berechtigungen → Nutzer hinzufügen**:
   die E-Mail-Adresse des Dienstkontos (`gsc-lesen@<projekt>.iam.gserviceaccount.com`),
   Berechtigung **Eingeschränkt** (reicht zum Lesen).
6. In `.env.local` (gitignored) eintragen:
   ```
   GSC_DIENSTKONTO_PFAD=C:\Users\Uwe\geheim\gsc-key.json
   GSC_PROPERTY=sc-domain:steakakademie.de
   ```
   `GSC_PROPERTY` ist optional, der Standard ist `sc-domain:steakakademie.de`.

> **Wichtig zur Property:** Die Domain-Property muss unter der Adresse existieren, die das
> Dienstkonto einlädt. Wurde die Property mit einer alten Adresse angelegt, zuerst
> `steakakademie@gmail.com` dort als **Inhaber** hinzufügen (Einstellungen → Nutzer und
> Berechtigungen). Für den API-Zugang selbst genügt der Eintrag des Dienstkontos (Schritt 5).

## Benutzung

```bash
node scripts/gsc-abruf.mjs --probelauf          # zeigt Zeitraum und Ziel, ruft nichts ab
node scripts/gsc-abruf.mjs                      # letzte 90 Tage, Websuche
node scripts/gsc-abruf.mjs --tage 28
node scripts/gsc-abruf.mjs --von 2026-10-09 --bis 2026-10-30
node scripts/gsc-abruf.mjs --suchtyp discover
```

Ausgabe: `privat/gsc/<abrufdatum>/` mit `suchanfragen.csv`, `seiten.csv`,
`suchanfrage-seite.csv`, `laender.csv`, `geraete.csv`, `verlauf.csv` und `abruf.json`
(Property, Suchtyp, Zeitraum). Das Ende des Zeitraums liegt drei Tage vor heute, weil
die jüngsten Tage unvollständig sind.

## Abgrenzung zum Handexport

* Die API liefert bis zu 25.000 Zeilen je Auswertung (blätternd). Der Handexport kappt bei
  1.000 Zeilen — daher fehlten bisher Suchanfragen mit wenigen Impressionen.
* Anonymisierte Suchanfragen (sehr seltene) liefert auch die API nicht einzeln aus;
  die Summe in `verlauf.csv` ist daher größer als die Summe in `suchanfragen.csv`.
* Der Bericht „Generative KI" der Search Console ist in diesem Skript **nicht** enthalten.
  Ob die API ihn überhaupt ausliefert, ist ungeprüft (Annahme: nein) — bis dahin bleibt
  dafür der Export per Hand.

## Sicherheit

* Der Schlüssel erlaubt nur Lesen und nur für Properties, in denen das Dienstkonto Nutzer ist.
  Verloren oder versehentlich geteilt: in der Cloud Console den Schlüssel löschen, einen
  neuen erzeugen.
* Das Skript gibt den Schlüssel nie aus; Fehlermeldungen nennen nur HTTP-Status und Ursache.
* Rohdaten der Search Console gehören nicht ins öffentliche Repo (Entscheidung 09.10.2026) —
  `privat/` ist gitignored.

## Noch nicht enthalten

* **Bing Webmaster Tools** (eigene API, eigener Schlüssel, Bing ist laut `docs/geo-baseline.md`
  der stärkste Suchkanal). Folgt, sobald ein API-Schlüssel unter Bing Webmaster Tools →
  Einstellungen → API-Zugriff erzeugt ist.
