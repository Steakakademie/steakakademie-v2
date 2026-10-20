# YouTube-Anbindung — Kanal @master_of_steak

Stand 20.10.2026 · eingerichtet von Claude auf Uwes Freigabe

## Was steht

| Baustein | Stand |
|---|---|
| Kanal | „steakakademie“ · **@master_of_steak** · `UCJONYPqtOUubc78rZ5sc-Hg` · persönlicher Kanal von **u.yendell@gmail.com** |
| Google-Cloud-Projekt | `steakakademie` (Konto steakakademie@gmail.com) · YouTube Data API v3 + YouTube Analytics API aktiv |
| OAuth | App „Steakakademie YouTube“ · extern · **In Produktion** (Token läuft nicht nach 7 Tagen ab) · nicht von Google geprüft (für eigene Nutzung unnötig, max. 100 Nutzer) |
| Client | „Claude YouTube Connector“ (Desktop) |
| Bereiche | `youtube.readonly`, `youtube.upload`, `youtube.force-ssl`, `yt-analytics.readonly` |
| Zugangsdaten | nur in `.env.local` (gitignored): `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN`, `YOUTUBE_CHANNEL_ID` |

**Achtung:** Der fremde, leere Kanal **@steakakademie** (UCcMvEW-o4yZ9_TZrMqbLnKg, seit 26.04.2025) gehört nicht zu uns. Er stand bis PR #451 im Organization-Schema.

## Skripte (`scripts/youtube/`)

| Aufruf | Zweck | Kosten (Einheiten von 10.000/Tag) |
|---|---|---|
| `node scripts/youtube/status.mjs` | Verbindungstest, Kanal-Kurzstatus | ~2 |
| `node scripts/youtube/audit.mjs` | Kanal + alle Videos gegen die Checkliste → `privat/youtube/<datum>/audit.md` | ~3 |
| `node scripts/youtube/analytics.mjs --tage 90` | Aufrufe, Wiedergabedauer, Traffic-Quellen, Suchbegriffe, Länder, Geräte | Analytics-Kontingent |
| `node scripts/youtube/kommentare.mjs --tage 30` | unbeantwortete Kommentare (antwortet **nicht** selbst) | ~1 je 100 |
| `node scripts/youtube/metadaten.mjs --plan <json> [--anwenden]` | Titel/Beschreibung/Tags/Kategorie/Sprache/KI-Angabe aus Plan; Probelauf zeigt Diff, Sicherung vor dem Schreiben | 50 je Video |
| `node scripts/youtube/kanal.mjs --datei <json> [--anwenden]` | Kanalbeschreibung, Keywords, Sprache, Land | 50 |
| `node scripts/youtube/upload.mjs --datei … --titel … --ki ja\|nein [--veroeffentlichen-am …]` | Upload **immer privat oder geplant**, nie sofort öffentlich; `--ki` ist Pflicht | eigener Upload-Topf |
| `node scripts/youtube/playlists.mjs --plan <json> [--anwenden]` | Playlists anlegen/befüllen, idempotent (gleicher Titel = gleiche Liste, keine Duplikate) | 50 je Liste/Video |
| `node scripts/youtube/playlists-kopieren.mjs [--anwenden] [--max-einheiten 8000]` | private Playlists Firmenkanal → Privatkanal, fortsetzbar, löscht nichts | 50 je Liste/Video |

Ausgaben landen unter `privat/youtube/` (gitignored). Läufe außerhalb des Repos: `SA_WURZEL=<repo>` setzen.

## Regeln

1. **KI-Kennzeichnung:** Jedes Video mit KI-Bild, -Video oder -Stimme bekommt `containsSyntheticMedia: true` **und** einen Satz in der Beschreibung. Die API gibt das Feld beim Auslesen nicht zurück — der Satz in der Beschreibung ist der prüfbare Nachweis.
2. **Uploads** gehen privat oder mit `publishAt` hoch. Öffentlich schaltet ein Termin, nie ein Sofort-Upload.
3. **Kommentare** beantwortet nur Uwe oder Claude nach Freigabe (öffentlich, im Namen der Steakakademie).
4. **Keine Kerntemperaturen in YouTube-Texten**, solange die Referenz (`data/kerntemperatur-referenz.yaml`) und die Rezepte nicht übereinstimmen. Die Rezeptseite ist die einzige Quelle.
5. **Schreibänderungen** zuerst als Probelauf, dann ein einzelnes Video als Probe, dann alle. YouTube braucht 30–60 s, bis Änderungen lesbar sind.

## Umzug ins Brand-Konto + private Playlists (Entscheidung 20.10.2026)

Uwe hat entschieden: Kanal in ein neues Brand-Konto „Steakakademie“ verschieben, damit Privatkonto und Marke getrennt sind. Reihenfolge:

1. **Uwe:** Studio-Berechtigungen räumen und deaktivieren → leeres Brand-Konto „Steakakademie“ anlegen → Kanal dorthin verschieben (Ziel darf nur das neue, leere Konto sein, der Zielkanal wird ersetzt).
2. **Claude:** Kanal-ID, Handle, Videos, Playlists prüfen. Den bisherigen Token in `YOUTUBE_PRIVAT_REFRESH_TOKEN` umbenennen (er gehört zu u.yendell@gmail.com und zeigt nach dem Umzug auf dessen neuen Privatkanal), Firmenkanal neu anmelden (Brand-Konto auswählen) → `YOUTUBE_REFRESH_TOKEN`.
3. **Uwe:** im Konto u.yendell@gmail.com einen neuen Privatkanal anlegen.
4. **Claude:** `node scripts/youtube/playlists-kopieren.mjs --anwenden` nächtlich (Budget 8.000 Einheiten/Lauf), bis alle Listen kopiert sind.
5. **Uwe:** Originale im Firmenkanal selbst löschen. Claude führt kein endgültiges Löschen aus.

Plan: `privat/youtube/playlists-privat-plan.json` — 117 Listen / 1.131 Videos „kopieren“, 23 Listen „firma“ (bleiben privat im Firmenkanal), 5 leere „leer-loeschen“. Fortschritt: `privat/youtube/kopie-status.json`.

## Neu anmelden (wenn `invalid_grant` kommt)

Passiert nach Passwortwechsel von u.yendell@gmail.com oder wenn der Zugriff unter myaccount.google.com → „Drittanbieter-Apps“ entzogen wurde.

1. Im Browser (angemeldet als u.yendell@gmail.com) öffnen:
   `https://accounts.google.com/o/oauth2/v2/auth?client_id=<YOUTUBE_CLIENT_ID>&redirect_uri=http%3A%2F%2F127.0.0.1%3A8765&response_type=code&access_type=offline&prompt=consent&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fyoutube.readonly%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fyoutube.upload%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fyoutube.force-ssl%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fyt-analytics.readonly`
2. Konto **u.yendell@gmail.com** wählen (nicht das Brand-Konto „U.Yendell“), Warnung „nicht überprüft“ → Erweitert → „Steakakademie YouTube öffnen“, alle Häkchen setzen.
3. Die Seite 127.0.0.1 lädt nicht — das ist richtig. Den Wert `code=…` aus der Adresszeile gegen den Token tauschen (POST `https://oauth2.googleapis.com/token` mit client_id, client_secret, code, `grant_type=authorization_code`, `redirect_uri=http://127.0.0.1:8765`) und `refresh_token` in `.env.local` eintragen.
4. `node scripts/youtube/status.mjs` muss „steakakademie (@master_of_steak)“ melden.

## Umgesetzt am 20.10.2026

- 48 Shorts: Titel aus den SEO-Titeln der Rezepte (vorher Schablonen mit Grammatikfehlern und mitten im Titel abgeschnitten), Beschreibung mit Deeplink aufs Rezept + Spickzettel + Diplom, KI-Hinweis, bereinigte Hashtags (kein `#steak` mehr an Fisch/Lamm/Geflügel), Tags aus den Rezept-Keywords, Kategorie 26 „Howto & Style“ (vorher 22), Sprache und Audiosprache `de`, `containsSyntheticMedia: true`.
- Kanal: Beschreibung ohne „Deutschlands erste …“ (§ 5 UWG), 11 Länder statt „12 Weltregionen“, kein Versprechen „wöchentlich“, KI-Hinweis, Kanalsprache `de`, neue Keywords.
- 6 öffentliche Playlists, jedes Short in genau einer: Rind vom Grill (21) · Low & Slow (9) · Schwein & Iberico (4) · Geflügel (3) · Lamm (3) · Fisch (8). Plan: `privat/youtube/playlists-2026-10-20.json`.
- Sicherungen des Vorher-Stands: `privat/youtube/2026-10-20/sicherung-*.json`, `kanal-sicherung-*.json`.

## Befund aus den Zahlen (21.06.–18.10.2026)

9.310 Aufrufe, 91 % aus dem Shorts-Feed, 640 aus der YouTube-Suche, 50 von Suchmaschinen. Durchschnittlich 90 % angesehen (Clips sind 16 s lang). 8 neue Abos, 0 Kommentare, 1 Teilen. 1.164 Aufrufe aus den USA (nicht Zielmarkt). Das heißt: Reichweite ohne Bindung. Letzte 28 Tage (21.09.–18.10.): nur 114 Aufrufe — die Reichweite kam fast komplett im Juli/August, solange täglich hochgeladen wurde; seit dem letzten Upload (31.07.) steht der Kanal.

Weil @master_of_steak der **persönliche** Kanal von u.yendell@gmail.com ist, hängen dort auch ~145 Playlists des Privatkontos (alle privat, für Besucher unsichtbar; Stand 20.10.2026). Links in Shorts-Beschreibungen sind nicht klickbar; Website-Besuche entstehen über das Kanalprofil und über längere Videos.

## Offen

- **Uwe:** steakakademie@gmail.com im YouTube Studio → Einstellungen → Berechtigungen als **Administrator** einladen und die Einladung annehmen (Claude durfte die Rolle nicht vergeben). Die API läuft weiter über den Token von u.yendell@gmail.com.
- **Uwe:** Kanalname auf „Steakakademie“ (groß) und Handle z. B. auf `@steakakademie.de` umstellen — geht nur im Studio; `@steakakademie` ist vergeben.
- **Kerntemperaturen im Videobild** weichen bei Lammkoteletts (56 vs. 61–64 °C im Rezept), Lammkarree (56 vs. 58–60), Lammkeule (60 vs. 70 in der Rezeptbeschreibung), Krustenbraten (72 vs. 82–85), Ente (75 vs. 82–85), Iberico Secreto/Pluma (63 vs. 65–68), Schwertfisch (58 vs. 52–55) und Thunfisch (46 vs. 50–55) vom Rezept ab. Nach Klärung der Referenz: betroffene Shorts neu rendern oder auf privat stellen.
- Kanal-Trailer und ein regelmäßiges Langformat (Grundlage: Diplom-Lektionen) — Konzept: Projekt-Doc `claude/youtube_optimierung_2026-10-20.md`.
- Mittelfristig: Kanal in ein Brand-Konto mit steakakademie@gmail.com als Inhaber verschieben (trennt Privat und Marke, ermöglicht API-Zugang ohne Privatkonto). Schwer umkehrbar — nur auf Uwes ausdrückliche Entscheidung.
