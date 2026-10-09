# AGB § 5a — Entwurf für freie Wertgutscheine

Stand 09.10.2026. **Entwurf, nicht live.** Gutschein-Konzept T10
(`docs/gutschein-konzept-weihnachten-2026.md`). Die Kanzlei prüft den Text,
bevor er in `src/app/agb/page.tsx` übernommen wird. Übernommen wird er erst
zusammen mit T9 (Wertgutscheine kaufbar), nicht vorher — eine AGB-Regel für ein
Produkt, das es nicht gibt, verwirrt nur.

Der heutige § 5a regelt nur Produktgutscheine. Der Entwurf teilt ihn in zwei
Absätze; Absatz 1 ist der heutige Text, nur die Gültigkeit ist an den Code
angeglichen (Migration `20261009200000`).

---

## § 5a Geschenkgutscheine

**(1) Produktgutscheine.** Wir bieten Geschenkgutscheine für jeweils ein
bestimmtes digitales Produkt an (z. B. einen Kurs oder eine Anzahl
Steak-Beichte-Diagnosen). Der Gutschein berechtigt den Inhaber zur einmaligen
Freischaltung des auf dem Gutschein genannten Produkts.

- **Gültigkeit:** bis zum 31. Dezember des dritten Jahres nach dem Jahr der
  Ausstellung (§§ 195, 199 BGB). Das Datum steht auf der Geschenkseite.
- **Übertragbarkeit:** Der Gutschein ist übertragbar und kann von der Person
  eingelöst werden, die im Besitz des Gutschein-Codes ist.
- **Einlösung:** Code unter steakakademie.de/gutschein/einloesen eingeben. Für
  die Einlösung ist ein (kostenloses) Nutzerkonto erforderlich; nach der
  Einlösung wird das Produkt freigeschaltet.
- **Keine Barauszahlung:** Der Gutschein wird vollständig auf das genannte
  Produkt eingelöst. Eine Barauszahlung ist ausgeschlossen.

**(2) Wertgutscheine.** Wir bieten Geschenkgutscheine über einen festen Betrag
an (25 €, 50 €, 75 € oder 100 €). Der Betrag kann auf die Produkte angerechnet
werden, die auf der Einlöseseite zur Auswahl stehen.

- **Teileinlösung und Restguthaben:** Der Wertgutschein kann in mehreren
  Schritten eingelöst werden. Ein nicht verbrauchter Betrag bleibt bis zum Ende
  der Gültigkeit als Guthaben auf dem Code erhalten.
- **Zuzahlung:** Reicht das Guthaben für ein Produkt nicht aus, kann das
  Produkt mit diesem Gutschein nicht eingelöst werden; eine Zuzahlung ist
  derzeit nicht möglich. *[Entscheidung Uwe offen — siehe Konzept,
  „Offen für den Fall, dass der Restwert nicht reicht".]*
- **Gültigkeit, Übertragbarkeit, Einlösung:** wie Absatz 1.
- **Keine Barauszahlung:** Weder der Gutscheinbetrag noch ein Restguthaben wird
  bar ausgezahlt.

**(3) Widerruf.** Bis zur ersten Einlösung besteht das 14-tägige
Widerrufsrecht (siehe § 6a). Mit der Freischaltung des digitalen Inhalts
erlischt es für den eingelösten Teil gemäß § 356 Abs. 5 BGB.
*[Kanzlei: Gilt das bei einem teilweise eingelösten Wertgutschein für den
Restbetrag weiter?]*

Die Zahlungsabwicklung erfolgt über Digistore24 (§ 2). Die Preise enthalten
die gesetzliche Mehrwertsteuer (§ 3).
*[Kanzlei: Formulierung beim Mehrzweckgutschein, bei dem die Umsatzsteuer erst
bei Einlösung entsteht — Konzept, Frage 7.]*

---

## Fragen an die Kanzlei zu diesem Entwurf

1. Ist der Ausschluss der Barauszahlung beim Restguthaben eines
   Wertgutscheins zulässig?
2. Darf die Zuzahlung ausgeschlossen werden, oder muss es sie geben?
3. Widerruf bei teilweiser Einlösung (siehe Absatz 3).
4. Formulierung zur Umsatzsteuer beim Mehrzweckgutschein (Konzept, Frage 7).
5. Die Gültigkeit „bis 31.12. des dritten Folgejahres" — so richtig formuliert?
   (Die bisherige Fassung nannte „3 Jahre ab Ausstellung … beginnend zum
   Schluss des Ausstellungsjahres"; die Webseite sagte „3 Jahre ab Kauf", die
   Datenbank rechnete ab Kauf. Code und Seiten sind seit 09.10.2026 auf das
   Jahresende angeglichen.)
