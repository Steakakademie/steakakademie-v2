# SEO-Messplan — Wirkung der Hackfleisch-Seite (Messung 30.10.2026)

> Abteilung Wachstum (SEO/GEO). Stand 10.10.2026. Quelle: Search-Console-API über
> `scripts/gsc-abruf.mjs` (Anleitung `docs/gsc-abruf.md`). Rohdaten liegen nur lokal in
> `privat/gsc/` (gitignored); hier stehen ausschließlich Summen.

## Frage
Holt `/kerntemperatur-hackfleisch` (live seit 09.10.2026) die Hackfleisch-Nachfrage vom
Temperatur-Guide ab — und steigen Klickrate und Position?

## Ausgangswert (vor der Seite)
Zeitraum **11.09.–08.10.2026** (28 Tage, Websuche, Property `sc-domain:steakakademie.de`,
abgerufen am 10.10.2026; die letzten Tage vor dem Abruf sind wegen des Datenverzugs
unvollständig, der Verlauf reicht bis 06.10.):

| Kennzahl | Wert |
|---|---|
| Impressionen gesamt / Klicks | 13.119 / 59 |
| Hack-Anfragen (Suchanfragen mit hack, frikadell, bulett, burger, gehackt, faschiert, fleischk, hacksteak, fleischpflanz) | 100 Anfragen · 2.699 Impressionen · 2 Klicks · Ø Position 8,16 (nach Impressionen gewichtet) |
| `/temperatur-guide` | 9.824 Impressionen · 22 Klicks (0,22 %) · Position 8,45 |
| `/kerntemperatur-hackfleisch` | keine Impressionen (Seite gab es nicht) |

Zum Vergleich der letzte 90-Tage-Abruf (10.07.–06.10.): 36.087 Impressionen, 191 Klicks;
61 % der einzeln ausgewiesenen Suchanfrage-Impressionen sind Hackfleisch (8.135 bei 6 Klicks).
Nur rund 37 % der Impressionen werden als Suchanfrage einzeln ausgewiesen, der Rest ist
anonymisiert — Anfragen-Summen sind deshalb immer eine Untergrenze.

## Messung am 30.10.
Zeitraum **14.10.–27.10.2026** (14 Tage; Indexierung der Seite abwarten, Datenverzug 3 Tage):

```bash
node scripts/gsc-abruf.mjs --von 2026-10-14 --bis 2026-10-27
```

Vergleich nach **Tagesdurchschnitt** (28-Tage-Ausgangswert ÷ 28, Messfenster ÷ 14):

1. Hack-Anfragen: Impressionen/Tag (Ausgangswert ≈ 96), Ø Position, Klicks, **welche Seite
   rankt** (Datei `suchanfrage-seite.csv`: Hack-Anfrage → `/kerntemperatur-hackfleisch` oder
   `/temperatur-guide`).
2. `/kerntemperatur-hackfleisch`: Impressionen, Klicks, CTR, Position.
3. `/temperatur-guide`: CTR (Ausgangswert 0,22 %) und Impressionen/Tag (≈ 351).
4. Indexierung: URL-Prüfung `/kerntemperatur-hackfleisch` und `/cuts/ribeye` (nicht per
   API enthalten, in der Search Console von Hand).
5. Plausible: Ereignis `Angebot_Klick` auf den Seiten `antwortseite` und `rettung`
   (Regale aus #373) — werden sie angeklickt?

## Grenzen
- 14 Tage Messfenster und kleine Zahlen (Klicks im einstelligen Bereich): ein Unterschied
  von wenigen Klicks ist Rauschen, kein Ergebnis. Aussagekräftig sind Position und die
  Frage, **welche Seite** für Hack-Anfragen gelistet wird.
- Die Seiten wurden am 10.10. mit Links und IndexNow ergänzt (#369, #371, #373): Effekte
  lassen sich nicht einzeln zuordnen, nur gemeinsam.
- Ranking-Änderungen brauchen oft 2–6 Wochen; eine zweite Messung um den 20.11. ist sinnvoll.
- Der Bericht „Generative KI" ist nicht per API abrufbar; dafür bleibt der Export von Hand.
