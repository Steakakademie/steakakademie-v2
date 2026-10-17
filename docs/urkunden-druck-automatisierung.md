# Gedruckte Urkunden — von der Bestellung zum Briefkasten

Stand 10.09.2026. Ersetzt den Zustand, in dem eine Urkundenbestellung eine
Freitext-Mail an `pitmaster@` war und von Hand gedruckt und kuvertiert wurde.

## Der Weg einer Bestellung

1. **Besteller** wählt unter `/diplome/urkunde` eine bestandene Stufe (seit 17.10.2026;
   vorher ein Level, das nie auf der Urkunde stand), trägt
   Name und Versandadresse ein → `POST /api/urkunde/bestellen`.
2. Die Route prüft serverseitig gegen `course_progress`, ob die Stufe wirklich
   bestanden ist, und legt eine Zeile in `urkunden_bestellungen` an
   (Status `neu`). Eine Loops-Mail meldet die Bestellung an `pitmaster@`.
3. **Uwe** öffnet `/admin/urkunden`, sieht die Bestellung, schaut sich über
   „Vorschau" die fertig gesetzte Urkunde an und markiert nach Zahlungseingang
   `bezahlt`.
4. **Freigabe** löst die Produktion aus: Nummer vergeben → Urkunde rendern →
   in den privaten Bucket `urkunden` legen → signierte URL erzeugen → Gelato
   beauftragen. Status `gesendet`, Gelato-Auftragsnummer steht in der Zeile.
5. Gelato druckt und verschickt.

Die Zahlung läuft in dieser Phase noch außerhalb (Rechnung/Überweisung). Das
ist der einzige verbliebene Handgriff neben der Freigabe.

## Warum manuelle Freigabe

So ausdrücklich gewünscht: Erst Testphase, dann Vollautomatik. Bei der Freigabe
wird Geld ausgegeben und etwas physisch verschickt — ein falsch geschriebener
Name fällt beim Empfänger auf und ist dann nicht mehr zu korrigieren.

Der Knopf **„Probe (Gelato-Entwurf)"** spielt die ganze Kette durch, legt den
Auftrag bei Gelato aber als `draft` an: nichts wird produziert, nichts
berechnet. Nummer und Druckdatei entstehen dabei trotzdem und werden von der
späteren echten Freigabe weiterverwendet.

Für die Umstellung auf Vollautomatik ruft der Digistore-Webhook nach
Zahlungseingang `produziere(bestellungId)` auf — an der Funktion selbst ändert
sich nichts, es fällt nur der Knopf weg.

## Rendern ohne Browser

Auf Vercel läuft kein Chromium. Die Urkunden entstehen deshalb zweistufig:

**Einmalig, lokal** (`node scripts/urkunden-vorlagen.mjs`):
Playwright rendert die fünf Designs aus `design/urkunden/` in 300 dpi und
vermisst dabei die drei variablen Textfelder (Name, Datum, Nummer). Die Felder
stehen im Bild auf `visibility:hidden` — sie belegen ihren Platz, erscheinen
aber nicht. Ergebnis: `src/lib/urkunde/vorlagen/`.

**Web-Vorschau aus derselben Vorlage** (`node scripts/urkunden-vorschau.mjs`, seit
17.10.2026): verkleinert `stufe-N-1z.png` auf 1600 px WebP (~55 KB) nach
`public/images/urkunde/`. `/diplome/urkunde` zeigt dieses Bild als Vorschau und legt
Name und Datum per CSS an die Stellen aus `boxen.json`
(`src/lib/urkunde/vorschau-layout.ts`, `src/components/diplome/UrkundeVorschau.tsx`).
Vorher stand dort eine CSS-Attrappe mit Eckrahmen und Emoji, die mit dem Druck nichts
gemein hatte (Uwe, 17.10.2026: „grafisch eine andere als die, die der User bekommt").
Was die Vorschau nicht zeigt: die zweizeilige Variante bei langen Namen und die
Urkunden-Nummer. Wächter: `src/__tests__/urkunde-vorschau.test.ts` (Geometrie, Bilder
vorhanden und unter 250 KB).

**Pro Bestellung, auf dem Server** (`src/lib/urkunde/render.ts`):
opentype.js setzt die drei Texte als SVG-Pfade an die vermessenen Stellen,
sharp rastert und legt sie auf die Vorlage. Keine Schriftinstallation, kein
Browser, rund eine halbe Sekunde.

**Nachgeprüft:** Gegen einen echten Browser-Render derselben Daten weicht das
Ergebnis um höchstens einen Pixel bei 300 dpi ab (0,085 mm).

### Zwei Vorlagen je Stufe

Die Textspalte ist ein Flex-Layout mit `justify-content: space-between`. Ein
zweizeiliger Name verschiebt damit alles darunter — Stufenname, Datum,
Unterschrift, Nummer. Deshalb gibt es `stufe-N-1z.png` und `stufe-N-2z.png`;
welche passt, entscheidet die gemessene Textbreite. Passt ein Name auch
zweizeilig nicht, wird er in Ein-Prozent-Schritten verkleinert.

### Schriften

`Playfair Display` und `DM Sans` liegen als TTF in
`src/lib/urkunde/schriften/` (OFL, Lizenztexte daneben). Das Vorlagen-Skript
bindet exakt dieselben Dateien als `@font-face` ein — nur so stimmen die
Buchstabenbreiten im Browser mit denen überein, die opentype.js später
berechnet.

> Die Renderings vom 09.09.2026 liefen ohne diese Schriften und fielen still
> auf Georgia/DejaVu zurück. Wer alte Dateien mit neuen vergleicht, sieht
> deshalb deutlich andere Buchstabenformen — die neuen sind die richtigen.

## Druckprodukt und Kalkulation

| Position | Betrag |
|---|---|
| `cards_pf_a4_pt_250-gsm-coated-silk_cl_4-0_hor` — A4 quer, 250 g/m² seidenmatt, 4/0 | 3,51 € |
| Versand `ups_standard_tariff` (nachverfolgbar, 3–4 Werktage laut Gelato-Entwurf) | 8,34 € (Probe 17.10.2026; Planung war 8,70 €) |
| **Selbstkosten** | **11,85 €** (Planung 12,21 €) |
| Verkaufspreis | 17,99 € |

Bewusst nicht DHL Warenpost (6,49 €): unversichert und nicht nachverfolgbar.
Auf der Urkunde steht eine fortlaufende Nummer — bei Verlust gäbe es weder
Nachweis noch Ersatz.

Der Preis enthält die gesetzliche Umsatzsteuer (Regelbesteuerung — Uwe, 17.10.2026:
„Preis enthält MwSt."; bis dahin stand hier § 19 UStG, die Bestellseite sagte seit #343
schon „inkl. MwSt."). Der Preis steht an einer Stelle: `src/lib/urkunde/preis.ts`.

## Erste Probe (17.10.2026)

Erster vollständiger Durchlauf gegen die echte Gelato-API, ausgelöst von Uwe über
„Probe (Gelato-Entwurf)" unter `/admin/urkunden`, Bestellung `ffe6f8aa-446f-4381-94ba-ab1a56ba8554`
(Stufe 1, Level 1, Name „Uwe Yendell", Testdaten: die bestandene Stufe war dafür von Hand in
`course_progress` eingetragen).

| Spur | Befund |
|---|---|
| `urkunden_zaehler` | `2026 / 1` — erste Nummer des Jahres |
| `urkunden_bestellungen.urkunde_nr` | `SA-2026-0001-NP6SPP` |
| Bucket `urkunden` | `druck/2026/SA-2026-0001-NP6SPP-ffe6f8aa.png`, 1,33 MB, 3581×2553 px, 300 dpi — Name, Datum „17. Oktober 2026" und Nummer sitzen an den vermessenen Stellen (Datei heruntergeladen und angesehen) |
| Gelato | Entwurf `44ab63cd-a17b-4b31-a68a-0638888e5049`, `orderType: draft`, `fulfillmentStatus: draft`, Referenz `ffe6f8aa-…-probe`; Produkt `cards_pf_a4_pt_250-gsm-coated-silk_cl_4-0_hor` 3,51 €, UPS Standard 8,34 €, Summe 11,85 €, Lieferfenster 20.–21.10. |
| Status danach | wieder `neu` (Probe setzt zurück), `fehler_text` leer |
| Sentry | kein neues Issue |
| Signierte Datei-URL in `gelato_antwort` | gültig 180 Tage (`exp` im Token) |

Damit ist der `GELATO_API_KEY` belegt gültig und der Weg Rendern → Bucket → Gelato
funktioniert in der Produktion. **Beide Mails belegt (17.10.2026, zweite Probe):** die
Bestellbestätigung an den Besteller (Loops-Vorlage „Urkunde — Bestellbestätigung", 2 gesendet /
2 zugestellt, erste Nutzung überhaupt) und die Meldung an pitmaster@ (Kontakt-Vorlage, bei Uwe
um 22:17 Uhr angekommen). **Nicht geprüft:** ein echter Druck (Freigabe) und die Zustellung.

Zwei Dinge, die bei der Probe aufgefallen sind, ohne hier behoben zu sein:

1. **Das Formular ließ ein Level wählen, die Urkunde ist aber je Stufe gesetzt.** Die
   Unterzeile der Vorlage ist das Stufen-Badge aus `STUFEN` („Glut-Lehrling", „Fleischkenner" …),
   kein Level-Titel — der erste Befund („Ehrentitel des ersten Levels") war insofern ein
   Lesefehler; für Stufe 1 fallen Badge und Level-1-Name nur zusammen. **Entschieden (Uwe,
   17.10.2026): „Urkunde je Stufe ohne Level-Auswahl."** Formular und `POST /api/urkunde/bestellen`
   nehmen seitdem `stufe` (1–5), `level_id` bleibt nur für Altbestellungen in der Tabelle.
2. **Die Pflichtzeile aus Rahmenlehrplan §1** (`DIPLOM_HINWEIS`) fehlte auf allen fünf
   Druckvorlagen. **Entschieden (Uwe, 17.10.2026): „muss sein, klein und am unteren Ende."**
   Seitdem steht sie in `design/urkunden/*.dc.html` unter der Nummer-Zeile (6,5 pt, Versalien),
   Vorlagen und Web-Vorschau neu erzeugt; Wächter in `src/__tests__/urkunde-vorschau.test.ts`.
3. **Die Vorlage nannte den Grad „Bronze-Zertifikat · Stufe 1"**, `STUFEN[].cert` heißt seit
   08.09.2026 „Grillmeister Bronze" und steht laut Rahmenlehrplan §1 nie ohne Träger.
   **Entschieden (Uwe, 17.10.2026): „Grillmeister Bronze · Steakakademie auf die Urkunde."**
   Die Grad-Zeile aller fünf Vorlagen ist seitdem `gradMitTraeger(stufe)` („Grillmeister Bronze ·
   Steakakademie" … „Grillmeister Meisterklasse · Steakakademie"); die Stufennummer steht weiter
   im Siegel (I–V). Wächter: `src/__tests__/urkunde-vorschau.test.ts`.

Aufräumen nach der ersten Probe (erledigt 17.10.2026): Bestellung `ffe6f8aa` storniert, Gelato-Entwurf
gelöscht, Test-Zeile aus `course_progress` entfernt. Die vergebene Nummer SA-2026-0001 bleibt
verbraucht — der Zähler zählt nicht zurück.

### Zweite Probe (17.10.2026, 22:24 Uhr, nach #432)

Gleicher Weg, neue Vorlagen: Bestellung `9371e419-563d-49f6-8546-371a44516d29` über das
Stufen-Formular (`stufe: 1`, `level_id: null`), Probe unter `/admin/urkunden`. Ergebnis:
Gelato-Entwurf `28aace73-b614-4130-b4ef-7aafb7afdfea` (`draft`, 11,85 €), Druckdatei
`druck/2026/SA-2026-0001-NP6SPP-9371e419.png` (1,34 MB, 300 dpi), angesehen: Grad-Zeile
„Grillmeister Bronze · Steakakademie", Badge „Glut-Lehrling", Pflichtzeile klein unter der
Nummer — alles aus #432 ist im Druck angekommen.

**Zweiter Befund, gewollt:** Die zweite Bestellung trägt dieselbe Kennung SA-2026-0001-NP6SPP
wie die erste, der Zähler steht weiter auf 1. Das ist das Nachdruck-Verhalten aus
`urkunde_ausstellen_fuer` (idempotent je Konto und Stufe, `public.urkunden`): Wer seine Urkunde
zweimal bestellt, bekommt zweimal dieselbe Urkunde, nicht zwei Urkunden mit zwei Nummern. Der
Prüfcode bleibt damit eindeutig pro Person und Stufe.

Aufräumen nach der zweiten Probe: Bestellung `9371e419` stornieren, Gelato-Entwurf `28aace73`
löschen, und — wichtiger als beim ersten Mal — die Zeile `SA-2026-0001` aus `public.urkunden`
sowie die Test-Stufe (`course_progress` `3dd5feff-32b1-4462-890f-edacbc2ae319`) löschen: Solange
die `urkunden`-Zeile steht, bestätigt `/urkunde/SA-2026-0001-NP6SPP` öffentlich eine Prüfung,
die nie abgelegt wurde.

## Urkunden-Nummer

`SA-<Jahr>-<vier Stellen>`, je Jahr bei 1 beginnend, vergeben von
`naechste_urkundennummer(jahr)` in Postgres. Die Vergabe geschieht erst bei der
Freigabe — sonst reißen stornierte Bestellungen Lücken in eine Nummer, die auf
einem gedruckten Blatt steht.

Startwert eines Jahres vorgeben (falls die Zählung woanders weiterlaufen soll):

```sql
INSERT INTO urkunden_zaehler (jahr, letzte_nr) VALUES (2026, 147)
ON CONFLICT (jahr) DO UPDATE SET letzte_nr = excluded.letzte_nr;
```

## Datenschutz

Die Druckdateien liegen im **privaten** Bucket `urkunden`. Gelato bekommt keine
offene URL, sondern eine signierte mit halbjähriger Gültigkeit — auf dem Blatt
steht ein Klarname.

Die Versandadresse wird an Gelato übermittelt; das steht so im Einwilligungs-
text (`URKUNDE_CONSENT_TEXT`), und der Wortlaut wird je Bestellung mitgespeichert
(Art. 5 Abs. 2 DSGVO). Der AV-Nachweis für Gelato liegt unter
`compliance/`.

## Umgebungsvariablen

| Variable | Wofür | Fehlt sie … |
|---|---|---|
| `GELATO_API_KEY` | Druckauftrag | … gibt es kein Bestellformular, `POST /api/urkunde/bestellen` antwortet 503 (seit 02.10.2026, `src/lib/urkunde/bestellbar.ts`). Bis 17.10.2026 hieß die Variable auf Vercel `Gelato` und wurde deshalb nicht gefunden. |
| `LOOPS_URKUNDE_BESTAETIGUNG_TEMPLATE_ID` | Bestellbestätigung an den Besteller (§ 312i BGB) | … dasselbe: kein Formular, 503 |
| `SUPABASE_SERVICE_ROLE_KEY` | Bestellungen, Bucket | … geht gar nichts |
| `ADMIN_PASSWORD` | `/admin/urkunden` | … ist niemand Admin (siehe `lib/admin-auth.ts`) |
| `LOOPS_API_KEY`, `LOOPS_KONTAKT_TEMPLATE_ID` | Benachrichtigung | … wird nur gespeichert, keine Mail |

## Wenn das Design sich ändert

1. `design/urkunden/*.dc.html` anpassen.
2. `node scripts/urkunden-vorlagen.mjs` — erzeugt Vorlagen und `boxen.json` neu.
   Seit 17.10.2026 bedient das Skript die Designs über einen lokalen HTTP-Server statt
   `file://`: Chromium (Playwright 1.60) lehnt `fetch()` auf `file://` ab, die Design-Laufzeit
   lädt Siegel und Seitenskript aber genau so — die Seite blieb unsichtbar, der Screenshot
   lief in den Timeout.
   Danach `node scripts/urkunden-vorschau.mjs`, sonst zeigt die Bestellseite das alte Bild.
3. Das Skript meldet, wenn eines der drei Felder nicht mehr gefunden wird oder
   der Name unerwartet umbricht. Solche Meldungen nicht übergehen: Die Vorlage
   wäre dann falsch vermessen und die Texte stünden schief.
4. Eine Bestellung mit „Probe" durchspielen und die Vorschau ansehen.
