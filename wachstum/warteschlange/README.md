# Freigabe-Warteschlange

Dateiname: `JJJJ-MM-TT-<slug>.md`. Eine Datei je Paket oder Ereignis.

## Status

`entwurf` → `geprueft` (Marken-Prüfer bestanden) → `freigegeben` (PR gemerged) →
`veroeffentlicht` (Uwe, mit Links) · daneben `verworfen`.

Nur `geprueft` darf in einen PR. `freigegeben` setzt niemand von Hand — der Merge ist die Freigabe;
der Direktor zieht den Status beim nächsten Wochenplan nach.

## Vorlage

```markdown
---
typ: paket            # paket | ereignis
status: entwurf
quelle: content/cuts/flat-iron.mdx
saeule: cuts-rassen   # cuts-rassen | technik-temperatur | streitfaelle | rezepte-laender | akademie
ziel: newsletter      # newsletter | fachseite | produkt (nur nach Kauf-Schalter)
ziel_url: https://steakakademie.de/newsletter
werbung: false        # true = Affiliate/Kooperation → „Werbung" im Vorschaubild
stimme: jonas         # marco | jonas | elena
geplant_fuer: 2026-10-24
pruefung: offen       # offen | bestanden | blockiert
veroeffentlicht: []   # Links nach dem Posten
---

## Hooks (3 Varianten)
## Instagram — Karussell
## Instagram/TikTok — Reel-Skript (Sprechertext + Bildbrief je Szene)
## Facebook
## Pinterest
## Newsletter-Block
## Bildbrief für Abteilung 2 · Studio
## Prüfbericht
```
