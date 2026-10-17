# Gedruckte Urkunden — von der Bestellung zum Briefkasten

Stand 10.09.2026. Ersetzt den Zustand, in dem eine Urkundenbestellung eine
Freitext-Mail an `pitmaster@` war und von Hand gedruckt und kuvertiert wurde.

## Der Weg einer Bestellung

1. **Besteller** wählt unter `/diplome/urkunde` ein bestandenes Level, trägt
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
| Versand `ups_standard_tariff` (nachverfolgbar, 4–5 Werktage) | 8,70 € |
| **Selbstkosten** | **12,21 €** |
| Verkaufspreis | 17,99 € |

Bewusst nicht DHL Warenpost (6,49 €): unversichert und nicht nachverfolgbar.
Auf der Urkunde steht eine fortlaufende Nummer — bei Verlust gäbe es weder
Nachweis noch Ersatz.

Keine Umsatzsteuer (§ 19 UStG, Kleinunternehmerregelung). Der Preis steht an
einer Stelle: `src/lib/urkunde/preis.ts`.

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
3. Das Skript meldet, wenn eines der drei Felder nicht mehr gefunden wird oder
   der Name unerwartet umbricht. Solche Meldungen nicht übergehen: Die Vorlage
   wäre dann falsch vermessen und die Texte stünden schief.
4. Eine Bestellung mit „Probe" durchspielen und die Vorschau ansehen.
