# Bildquellen vergleich (Provenienz)

Einstufung je Quelle: docs/bildquellen-whitelist.md

| Datei | Motiv | Quelle | ID | Link |
|---|---|---|---|---|
| `fleischthermometer.jpg` | Gegrilltes Fleisch auf einem Brett, daneben zwei digitale Fleischthermometer | Unsplash | ZASXYTnkP-U | https://unsplash.com/photos/ZASXYTnkP-U |
| `grills.jpg` | Kugelgrill im Garten, Rauch steigt aus dem geschlossenen Deckel | Pexels | 8704464 | https://www.pexels.com/photo/8704464/ |
| `dry-aging-kuehlschrank-vergleich.jpg/.webp` | Drei Rib-Eye-Stuecke am Haken im Reifeschrank, Wortmarke DRY AGER im Hintergrund | Unsplash | W-M0h1FJD0M | https://unsplash.com/photos/W-M0h1FJD0M |
| `messer.jpg` | Zwei Messer auf einem hellen Holzschneidebrett vor dunklem Holzuntergrund | Unsplash | M8COBu-_Va8 | https://unsplash.com/photos/M8COBu-_Va8 |
| `dry-aging-kuehlschrank-vergleich.jpg/.webp` | Drei Rib-Eye-Stuecke am Haken im Reifeschrank | Unsplash | W-M0h1FJD0M | https://unsplash.com/photos/W-M0h1FJD0M |

---

## Offen (Stand 21.09.2026, aktualisiert)

Bis zum 21.09.2026 lagen in diesem Ordner vier Bilder ohne Provenienzeintrag, die ein
voellig anderes Motiv zeigten als ihr Dateiname: Luftbild St. Louis, Meer mit Felsen,
Seebruecke, Gemuese auf Schneidebrett. Sie waren Hero-Bilder der Vergleichsseiten.

- ~~`dry-aging-kuehlschrank-vergleich`~~ — **erledigt.** Ersetzt durch das Echtfoto oben,
  jetzt auch in `data/bildregister.yaml` als `lizenz` eingetragen (stand vorher bei
  `offen`, obwohl das Echtfoto schon lag — Nachtrag aus dem Bild-Motiv-Check-Lauf,
  siehe `docs/bild-motiv-check-log.md`).
- `oberhitzegrill-vergleich` — **noch falsch** (Seebruecke). Kein Echtfoto eines
  Oberhitzegrills im Bestand. Die Seite erklaert ein Geraet, nach `docs/bildprogramm.md`
  also Echtfoto-Pflicht; das KI-Bild `methoden/oberhitze-grillen.jpg` waere ein Regelbruch.
  Jetzt zusaetzlich als `motiv_strittig: true` in `data/bildregister.yaml` gefuehrt, damit
  der Punkt nicht mehr nur hier steht — Auswahl eines Echtfotos bleibt Publishing-
  Entscheidung (CLAUDE.md Regel 4), also bei Uwe.
- `kuechenmaschine-vergleich` — **noch falsch** (Meer). Kein Motiv im Bestand. Gleiche
  Nachpflege: `motiv_strittig: true` in `data/bildregister.yaml`.
- ~~`premium-fleischthermometer.jpg/.webp`~~ — **erledigt.** Verwaiste Dateien (Gemuese,
  von keiner Seite referenziert — die Seite nutzt `/images/hero-thermometer.jpg`) sind
  geloescht.
