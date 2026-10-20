# Pinterest — Konto @Steakakademie

Stand 20.10.2026

| Baustein | Stand |
|---|---|
| Konto | Unternehmenskonto „Steakakademie \| BBQ, Grillen & Fleischkunde“ · @Steakakademie · Kategorie „Verlag oder Medien“ |
| Domain | steakakademie.de verifiziert (Meta-Tag `p:domain_verify`, PR #454) → Rich Pins über die Recipe-Strukturdaten |
| Planung | Metricool-Marke „Steakakademie“ (blogId 7542969), Claude-Connector |
| Pinterest-Tag | bewusst **nicht** installiert (nur für Anzeigen; müsste ins Consent-Banner) |

## Pin-Grafiken

`/api/og/pin` rendert Hochformat 2:3 (1000 × 1500): Rezeptbild oben, Titel (Playfair), Unterzeile, Herkunft · Schwierigkeit · Zeit, „KI-Bild“-Hinweis bei `imageAI: true`. Bilder nur aus `/images/` (kein offener Bild-Proxy). CDN-Cache 1 Tag.

## Pins planen

```
node scripts/pinterest/pins.mjs                    # offene Rezepte je Pinnwand
node scripts/pinterest/pins.mjs --naechste 7       # nächste Pins (reihum über die Pinnwände)
node scripts/pinterest/pins.mjs --erledigt <slug>  # nach dem Einplanen vermerken
```

Pinnwände: Rind vom Grill · Low & Slow BBQ · Schwein & Iberico · Geflügel vom Grill · Lamm vom Grill · Fisch vom Grill · Beilagen, Saucen & Rubs (+ Fleischkunde & Cuts für Wissensinhalte). Zuordnung in `pinnwand()`: Fisch/Beilagen nach Kategorie, Fleisch zuerst nach Garmethode (Low & Slow), dann nach Fleischart.

Regeln: Link immer mit UTM `utm_source=pinterest&utm_medium=social&utm_campaign=rezept-pins`. Erste zwei Wochen nur Entwürfe in Metricool, öffentlich erst nach Uwes Freigabe. Status: `privat/pinterest/status.json`.
