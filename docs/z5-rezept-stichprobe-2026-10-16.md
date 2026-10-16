# Z5 — Rezept-Stichprobe gegen die Kerntemperatur-Referenz

**Stand:** 16.10.2026 · **Paket:** Z5 (Arbeitsplan bis 01.11.) · **Prüfer:** Claude
**Referenz:** `data/kerntemperatur-referenz.yaml` (Single Source of Truth, CLAUDE.md §2 Regel 2/8c)
**Umfang:** die zuletzt vom Rezept-Agenten erzeugten Rezepte (#401, #404, #405, #406) —
vier Stück, also eine **Vollprüfung** dieser Tranche, keine Teilmenge.
Geprüft: Kerntemperatur und Ruhezeit.

## Ergebnis je Rezept

| Rezept | PR | Fleisch | Rezept sagt | Referenz | Urteil |
|---|---|---|---|---|---|
| smoked-chuck-roast | #404 | Rind, Low & Slow | 90–96 °C, final 96 °C | `beef_lowslow` c93 / [90,96] | ✓ Kerntemperatur exakt; zwei interne Nicks behoben (s. u.) |
| patlican-kebab | #405 | Lammhack-Rollen | Kern 70 °C | `sicherheit.hackfleisch: 70` | ✓ exakt |
| hot-links-texas | #406 | Schwein-Rind-Wurst (gewolft) | Kern 70 °C | `sicherheit.hackfleisch: 70` | ✓ exakt |
| ciger-sis-tuerkisch | #401 | Lammleber (Innerei) | Kern 56 °C, Korridor 56–62 °C („rosa") | **kein Eintrag** | ⚠ Befund — Uwe-Entscheidung |

## Behoben (autonom, von Uwe freigegeben am 16.10.)

`smoked-chuck-roast.mdx` hatte zwei **interne** Widersprüche (keine Referenz-Verletzung):

1. **Folier-Zeitpunkt:** Schritt-Liste nannte 65 °C, der Fließtext 75 °C.
   Vereinheitlicht auf **71–75 °C** (fachlich üblich, Stall-Ende) in Schritt und Prosa.
2. **Ruhezeit:** Schritt nannte 15 Min, der Fehler-Abschnitt 20–30 Min.
   Vereinheitlicht auf **20–30 Min, eingewickelt** (in der Folie, Handtuch/Kühlbox).

## Offener Befund — Uwe-Entscheidung (nicht autonom geändert)

**ciger-sis-tuerkisch** gibt für Lammleber eine Kerntemperatur von **56 °C (rosa)** an,
Korridor 56–62 °C. Problem:

- **Leber/Innereien stehen nicht in `kerntemperatur-referenz.yaml`.** Der Agent hat den
  Wert damit **ohne kanonischen Anker** gesetzt — Regel 8c verbietet geratene
  Temperaturen.
- 56 °C liegt unter dem allgemeinen Durchgar-Bereich. Das Rezept nennt einen
  Sicherheits-Caveat (70 °C für Risikogruppen), aber der **Default ist rosa** — das
  widerspricht „automatisch erzeugte Texte bleiben beim Sicherheitsminimum"
  (Regel 2, Rezept-Agent).

Das ist dieselbe Klasse wie Entenbrust (`duck_breast`) und Wildschwein-Rücken/-Filet
(`boar_*`): kulturell authentisch rosa, aber unter der Sicherheitsgrenze — dort über
`unter_sicherheit: true` + Pflicht-`hinweis` gelöst. **Vorschlag:** die Referenz um
einen Leber-Eintrag (z. B. `lamb_liver`) mit `unter_sicherheit` + Hinweis erweitern
**oder** den Rezept-Default auf durchgegart anheben. Entscheidung liegt bei Uwe
(Temperatur ist eine Fach-/Sicherheitsfrage, kein Formatierungsfehler).

## Konsequenz für den Rezept-Agenten

Plan Z5: „Bei Befund: Rezept-Agent bis 01.11. pausieren."

- Für **definierte** Teilstücke hielt die Kerntemperatur-Disziplin 3/3 (chuck-roast,
  kebab, hot-links) — das Risiko „mergt ungeprüft falsche Werte" ist für diese
  Tranche **entkräftet**.
- Der Leber-Fall ist eine **Referenz-Lücke**, kein systematischer Agent-Fehler.
  **Empfehlung: nicht pauschal pausieren.** Stattdessen Referenz-Lücke schließen
  (Leber/Innereien) und das Content-Qualitäts-Gate für Innereien schärfen, damit ein
  künftiger rosa-Innereien-Default auffällt. Letztes Wort: Uwe.
