# Ereignis-Playbook — was die Schleife unterbricht

> Abteilung 4 · Wachstum. Aufruf: `/marketing-ereignis <art>`. Jedes Ereignis hat
> **Erkennung → Sofortmaßnahme → Wer entscheidet**. Alles nach außen bleibt human-gated.

| Art (`<art>`) | Erkennung | Sofortmaßnahme (Agent) | Uwe entscheidet |
|---|---|---|---|
| `nachfrage-spitze` | GSC: Suchanfrage +50 % ggü. 28-Tage-Schnitt; Grillwetter-Wochenende; Feiertag | Passende Fachseite prüfen und schärfen (Snippet, FAQ), Social-Paket dazu priorisieren | Freigabe des Pakets |
| `beitrag-laeuft` | Ein Post liegt beim 3-Fachen des Kanal-Medians | Zweitverwertung planen: Karussell → Reel → Pin → Newsletter-Block; Link-Ziel prüfen | Freigabe der Zweitverwertung |
| `ranking-faellt` | GSC: Seite verliert ≥ 5 Positionen bei Top-20-Keyword über 7 Tage | Seite gegen Konkurrenz-SERP prüfen (`claude-seo:seo-page`), Aktualisierung als PR | Merge |
| `fachfehler-hinweis` | Kommentar/Mail weist auf falsche Angabe hin | Gegen Kanon prüfen; Antwortentwurf; bei echtem Fehler Fix-PR **zuerst** | Antwort + Merge |
| `negativer-kommentar` | Kritik, Beschwerde, Shitstorm-Ansatz | Sachlichen Antwortentwurf schreiben, nichts löschen, keine Diskussion im Affekt | Antwort |
| `rueckruf-warnung` | lebensmittelwarnung.de meldet Rückruf zu Fleisch/Grillprodukt, das wir erwähnen oder verlinken | Betroffene Seiten und Affiliate-Links finden, Hinweis-Entwurf, Link pausieren | Sofort; Sicherheit vor Reichweite |
| `link-tot` | `check-affiliate-links.yml` öffnet Issue | Ersatzprodukt beim selben Partner suchen, Fix-PR; ohne Ersatz Link entfernen | Merge |
| `kalender-duenn` | Warteschlange < 3 freigabefertige Pakete für die nächsten 7 Tage | `themen-scout` + `content-studio` nachproduzieren lassen | Freigabe |
| `konkurrent-startet` | Neuer deutschsprachiger Anbieter zu Diplom/Grillkurs online | Kurzanalyse (Angebot, Preis, Lücke), keine Reaktion nach außen | Ob und wie reagiert wird |
| `kooperations-anfrage` | Mail/DM von Marke, Presse, Podcast | Anfrage zusammenfassen, Risiken (Werbekennzeichnung, Exklusivität) benennen, Antwortentwurf | Zusage/Absage |
| `kaufanfrage` | DM/Mail „Wo kann ich kaufen?" | Vor Kauf-Schalter: Warteliste-Antwort; danach: Link zur Produktseite | Antwort |

## Regeln

- Ein Ereignis erzeugt **eine** Datei in `wachstum/warteschlange/` mit `typ: ereignis`.
- Sicherheit und Recht schlagen Tempo (Prioritätslogik `04-MARKETING-AGENCY-MODEL.md` §2).
- Kein Löschen fremder Kommentare durch Agenten, kein Blockieren, keine öffentliche Antwort ohne Freigabe.
