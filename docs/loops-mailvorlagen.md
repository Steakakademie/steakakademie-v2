# Loops-Mailvorlagen — eine Grundvorlage für alle Mails

Stand 09.10.2026. Design abgenommen von Uwe („Die Richtung gefällt") nach der
Vorschau-Seite „Steakakademie Mail-Vorschau" (Claude-Artifact). Quellen liegen
unter `emails/loops/<vorlage>/index.mjml`, das Logo unter
`emails/loops/img/logo.png` (aus `public/images/logo-barrel-vector.svg`,
192 × 192 px).

## Die fünf Vorlagen

| Ordner | Loops-Vorlage | Variable in Vercel | Variablen in der Mail | Betreff | Vorschautext |
|---|---|---|---|---|---|
| `zugang` | „LogIn Link" | `LOOPS_MAGIC_LINK_TEMPLATE_ID` | `magic_link`, `course_title` | Dein Zugang zur Steakakademie ist da | Ein Klick, und du bist drin. |
| `gutschein` | Gutschein | `LOOPS_VOUCHER_TEMPLATE_ID` | `voucher_code`, `voucher_url`, `course_title`, `gueltig_bis` | Dein Geschenkgutschein: `{DATA_VARIABLE:course_title}` | Code und Geschenkseite zum Ausdrucken. |
| `urkunde-bestaetigung` | **neu anlegen** | `LOOPS_URKUNDE_BESTAETIGUNG_TEMPLATE_ID` (fehlt noch) | `stufe_name`, `name_auf_urkunde`, `preis`, `bestell_id`, `adresse`, `widerruf_hinweis` | Deine Urkunde ist bestellt | Bitte prüf den Namen, er wird genau so gedruckt. |
| `doi` | Double-Opt-in | `LOOPS_DOI_TEMPLATE_ID` | `confirmUrl` | Bitte bestätige deine Anmeldung | Ein Klick, dann kommt der Wissens-Brief. |
| `wissens-brief` | Kampagne | — | — (Abmeldelink `{unsubscribe_link}`) | je Ausgabe | je Ausgabe |

Die Variablennamen stammen aus dem Code (Webhook, `src/lib/urkunde/benachrichtigung.ts`,
`/api/newsletter`). Loops unterscheidet Groß- und Kleinschreibung — so lassen,
wie sie in der Datei stehen.

## Hochladen in Loops

1. ZIPs bauen (aus dem Repo-Ordner):
   `powershell -ExecutionPolicy Bypass -File scripts/loops-vorlagen-packen.ps1`
   — jedes ZIP enthält `index.mjml` und `img/logo.png`; Loops hostet das Logo selbst.
2. In Loops die Vorlage öffnen (Transactional bzw. neue Kampagne), im Editor die
   Stil-Option **Code** wählen, ZIP auswählen, **Upload**.
3. **Bei den transaktionalen Vorlagen nach dem Upload prüfen**, ob Loops die
   Datenvariablen erkannt hat (Liste der Variablen in der Vorlage). Fehlt eine,
   bleibt sie in der Mail als Text stehen.
4. Betreff und Vorschautext aus der Tabelle eintragen, Absendername
   „Die Steakakademie", Antwortadresse `pitmaster@steakakademie.de` — die
   Urkunden-Mail sagt „antworte einfach auf diese Mail".
5. **Veröffentlichen** (Publish). Bei einer neuen Vorlage ändert sich die ID
   nicht, wenn die bestehende Vorlage überschrieben wird; bei der Urkunde ist sie
   neu und gehört in Vercel als `LOOPS_URKUNDE_BESTAETIGUNG_TEMPLATE_ID`.
6. **Testmail** an dich selbst, einmal am Handy (Gmail), einmal am Rechner öffnen,
   den Button klicken.

Unsicher (09.10.2026): ob Loops eine per ZIP hochgeladene Mail anschließend im
visuellen Editor ändern lässt. Für den Wissens-Brief daher: Texte in
`emails/loops/wissens-brief/index.mjml` ändern (Stellen mit `ÄNDERN` markiert),
neu packen, neu hochladen.

## Was bewusst so ist

- **Hell mit dunklem Kopfband.** In dunklen Mail-Apps färben Gmail und Apple
  Mail Fläche und Text selbst um; Kopfband und Button behalten ihre Farbe.
- **Button Gold mit dunkler Schrift**, nicht Gold mit weißer Schrift — weiß auf
  `#C8882A` ist zu kontrastarm.
- **Schriften:** Playfair Display und DM Sans zeigen nur Apple Mail und iOS.
  Gmail und Outlook fallen auf Georgia und Arial zurück; die Abstände sind dafür
  ausgelegt.
- **Logo als PNG**, nicht SVG — viele Mailprogramme zeigen SVG nicht an.
- **„Powered by Loops"** hängt Loops im aktuellen Tarif selbst an (Uwe,
  09.10.2026: vorerst in Ordnung).
- **Gutschein-Gültigkeit als festes Datum** (seit 09.10.2026, Variable
  `gueltig_bis`, z. B. „31.12.2029"): Der Webhook liest `vouchers.valid_until`
  — dieselbe Quelle wie die Geschenkseite — und rechnet bei einem Lesefehler
  die AGB-Regel (31.12. des dritten Folgejahres) selbst nach
  (`src/lib/gutschein-gueltigkeit.ts`). **Reihenfolge beim Ausrollen:** erst den
  Code deployen, dann die Vorlage hochladen — die Vorlage verlangt
  `gueltig_bis`, ohne die Variable scheitert der Versand.
- **Double-Opt-in ohne Werbung**, der Satz zur Werbung gibt die Einwilligung
  `2026-08-28-v2` wieder. Dieselbe Vorlage nutzt `/api/niche-validator/lead` —
  dort passt die Überschrift „Wissens-Brief" nicht. Solange der Gründer-Bereich
  ruht, ist das ohne Folgen; vor einer Reaktivierung eine eigene Vorlage anlegen.
- **Wissens-Brief:** ein Hauptbeitrag, zwei Hinweise, höchstens ein Angebot mit
  sichtbarem „Werbung", Abmeldelink in der Fußzeile.

## Prüfen nach Änderungen

`npx -y mjml@4.15.3 emails/loops/<vorlage>/index.mjml -o <ziel>.html --config.validationLevel=strict`
muss ohne Fehler durchlaufen (am 09.10.2026 für alle fünf geprüft, Bilder aller
fünf Mails im Browser angesehen).
