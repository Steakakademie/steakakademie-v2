# Animations-Pläne

Ergebnis eines Motion-Audits vom 02.09.2026 (Skills `improve-animations` + `find-animation-opportunities`) auf Commit `14448e2`.

Jeder Plan ist selbsttragend: exakte Dateipfade, aktueller Code im Zitat, exakte Zielwerte, Grenzen und Verifikation. Er lässt sich von einem Agenten ohne Kontext aus diesem Gespräch ausführen.

## Pläne

| # | Titel | Severity | Kategorie | Umfang | Status |
| --- | --- | --- | --- | --- | --- |
| [001](001-fortschrittsbalken-scalex.md) | Startseiten-Fortschrittsbalken von `width` auf `scaleX` umstellen | HIGH | Performance | 1 Datei, ~6 Zeilen | **DONE**¹ |
| [002](002-reduced-motion-framer.md) | Reduced-Motion-Vertrag für framer-motion einlösen | HIGH | Accessibility | 1 neue Datei + 2 Dateien | **DONE**² |
| [003](003-transition-all-ersetzen.md) | `transition-all` durch benannte Properties ersetzen | MEDIUM | Performance | 75 Stellen in 41 Dateien | **DONE**³ |
| [004](004-hover-nur-mit-echtem-zeiger.md) | Hover-Motion nur noch bei echtem Zeigegerät auslösen | LOW | Accessibility | 1 Datei, 3 Zeilen | **DONE**¹ |
| [005](005-mobiles-menue-animieren.md) | Mobiles Menü mit Ein- und Ausblendung versehen | MEDIUM | Missed opportunity | 1 Datei, ~10 Zeilen | **DONE**⁴ |
| [006](006-emberglow-compositor-layer.md) | `EmberGlow` vom Repaint auf Compositor-Layer umstellen | LOW | Performance | 1 Datei, ~40 Zeilen | **DONE**⁵ |
| [007](007-arbeitszeitplaner-maske-animieren.md) | Arbeitszeitplaner-Maske ein- und ausblenden | MEDIUM | Missed opportunity | 1 Datei, ~20 Zeilen | **DONE**⁶ |

⁶ Umgesetzt am 02.10.2026, im Browser pro Frame gemessen (normal und `prefers-reduced-motion`), Zahlen im Plan. Der Plan stammt aus dem Alt-Branch `feature/arbeitszeitplaner-modal-motion` (der dort `001` hiess und nie in `main` landete) und wurde auf den Stand nach 002 angepasst: Import `m as motion`, keine eigene Reduced-Motion-Verzweigung.

⁵ Am 02.09.2026 gemessen und umgesetzt. Vorher/Nachher auf demselben Server (`next start`, Mediane aus 6 Laeufen): Der EmberGlow zurechenbare Aufwand faellt von **+76 Paint-Ereignissen und −4,0 Bildern/s auf 0 Paints und −0,3 Bilder/s**. Optisch unveraendert — die Ebenen-Gewichte treffen bei 0/50/100 % exakt Rare/Medium/Well Done, der Pixelvergleich weicht um hoechstens 1,4 von 255 je Kanal ab. Ursprungsbefund: Die im Abschnitt „Nicht in Plänen enthalten" geforderte Messung liegt damit vor: Der Repaint kostet beim Vollscroll +71 Paint-Ereignisse (+24 %) und rund 3 Bilder pro Sekunde (52,5 statt 55,6). Real, aber klein — deshalb LOW und kein Dringlichkeitsfall. Zwei Vermutungen wurden dabei widerlegt: unter 4× CPU-Drosselung trägt die Messung nicht, und in der Ruhephase nach dem Scrollen entsteht kein Mehraufwand. Zahlen und Methode im Plan.

⁴ Umgesetzt und verifiziert am 02.09.2026. Öffnen ~250 ms, Schließen ~140 ms, Element bleibt während der Exit-Animation im DOM. Der Nebenbefund aus Plan 002 tritt hier ebenfalls auf und ist damit als allgemeines framer-motion-Verhalten belegt — dort nachgetragen.

³ Umgesetzt am 02.09.2026: 68 von 75 Vorkommen ersetzt; die restlichen 7 waren wirkungslos (keine Property ändert sich an diesen Elementen) und wurden im Nachgang ersatzlos entfernt. `transition-all` kommt in `src/` nicht mehr vor, `transition-property:all` auch nicht mehr im gebauten CSS. Alle erzeugten Regeln im gebauten CSS gegengeprüft, Verhalten pro Gruppe automatisiert verifiziert. Zwei Lücken in der Entscheidungstabelle des Plans wurden dabei korrigiert und dort dokumentiert.

² Umgesetzt und verifiziert am 02.09.2026, mit **einem offenen Nebenbefund**: Beim Öffnen des Marco-Panels fällt die Opacity nur mit aktivem Reduced Motion für einen Frame (~16 ms) auf 0. Reproduzierbar in Dev und Produktion, vier Hypothesen geprüft und widerlegt — Details im Plan unter „Offener Nebenbefund". Gehört als eigene Aufgabe untersucht.

¹ Umgesetzt und vollständig verifiziert am 02.09.2026. Mechanisch: `tsc --noEmit`, `next lint`, `next build` (501 Seiten) je ohne Fehler. Verhalten: automatisiert im Browser gemessen (Playwright aus dem Repo) — Messwerte stehen im jeweiligen Plan unter „Ergebnis". Keine Regression gefunden.

## Empfohlene Reihenfolge

```
004  →  001  →  002  →  005  →  003
```

1. **004** zuerst: drei Zeilen Konfiguration, kein Komponenten-Risiko, wirkt sofort projektweit. Guter erster Durchlauf, um die Verifikationskette (`build` + Feel Check) einzuspielen.
2. **001** danach: isoliert, höchster Einzelhebel, berührt keinen anderen Plan.
3. **002** setzt für seinen Kontrollschritt 3 voraus, dass 001 erledigt ist.
4. **005** setzt 002 voraus, damit das neue Menü Reduced Motion von Anfang an respektiert.
5. **003** zuletzt: der mit Abstand größte Plan, und er berührt `FrischSaisonal.tsx` sowie `Header.tsx` — beide werden vorher von 001 und 005 geändert. Diese Reihenfolge vermeidet Konflikte in denselben Dateien.

## Abhängigkeiten

| Plan | hängt ab von | warum |
| --- | --- | --- |
| 002 | 001 | Schritt 3 kontrolliert den Balken, den 001 auf `scaleX` umstellt. Ohne 001: Schritt überspringen und vermerken |
| 005 | 002 | Reduced Motion kommt über den `MotionProvider` aus 002, nicht über eigenen Code im Header |
| 003 | 001, 005 | Gleiche Dateien (`FrischSaisonal.tsx`, `Header.tsx`), unterschiedliche Zeilen — Reihenfolge vermeidet Merge-Konflikte |
| 007 | 002 | Import `m as motion` und Reduced Motion kommen aus dem `MotionProvider` von 002 |
| 001, 004 | — | unabhängig |

## Nicht in Plänen enthalten

Aus dem Audit bestätigt, aber bewusst nicht eingeplant:

- **Vier weitere Fortschrittsbalken auf `width`** — `AgingClient.tsx:137-139`, `diplome/simulation/page.tsx:107-108`, `NicheValidator.tsx:585-587`, `AnimatedBar.tsx:33-36`. Gleiche Ursache wie 001, aber einmalig statt im Loop.
- **Keine Motion-Tokens** — Dauern von 0,2 s bis 1,0 s handgetippt über die Codebase verstreut, Easing meist das schwache eingebaute `'easeOut'`.
- **Entrances laufen beim Mount statt per `whileInView`** (`ManifestClient`, `TerroirClient`, `RettungClient`, `urkunde`) — Inhalt unter dem Fold ist fertig animiert, bevor er sichtbar wird.
- **Framer-Kurzformen `x`/`y`/`scale` statt vollständiger Transform-Strings**, am ehesten spürbar beim Endlos-Shimmer in `ExitIntent.tsx:21-23`.

Abgelehnt und nicht wieder aufzunehmen: Stagger auf Artikel-Listen (zu hohe Frequenz), zusätzliche Pulsation in `EmberGlow` (dokumentierte Entscheidung gegen Dauerschleifen), Ausbau des Desktop-Dropdowns (bereits korrekt bei 150 ms), Umbau der Akkordeon-Höhe in `RettungClient.tsx:192-195` (Höhen-Transition ist für Akkordeons der vorgesehene Weg), Motion auf Rechner-Ergebnissen in `TaxCalculator`/`PortionCalculator`/`CookCoach` (funktionale Zahlen bewegen sich nicht).
