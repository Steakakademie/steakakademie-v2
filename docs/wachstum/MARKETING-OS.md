# Marketing-OS — das Ein-Personen-Marketingteam der Steakakademie

> **Abteilung 4 · Wachstum** (CLAUDE.md §3.0). Mechanik: Systems & Ops.
> Angelegt 18.10.2026 auf Uwes Auftrag: „Wenn es das Optimum ist, setze es um.
> Wenn nicht, optimiere es, bis es absolut optimal zur Steakakademie passt."
> **Status:** vorgebaut, Teile scharf. Was erst nach der Gewerbeanmeldung
> eingeschaltet wird, steht unter „Schalter".

---

## 1. Ausgangspunkt und warum nicht 1:1

Vorlage waren die Schaubilder „The One-Person Marketing Team" / „Social Media Team"
(ReStructure AI, Brain = Claude Code). Sie passen im Grundaufbau — Signale →
Gehirn → Abteilungen → Freigabe → Messung. Eins zu eins übernommen hätten sie
der Steakakademie geschadet:

| Element der Vorlage | Problem für die Steakakademie | Lösung hier |
|---|---|---|
| Eigene Abteilungen „Research / Content / Posting / Growth" | Bricht die Regel „fünf Abteilungen, keine sechste" | Vier **Teams innerhalb von Abteilung 4**, Bild/Video bleibt bei Abteilung 2 |
| Eigene Wissensschicht mit 20 .md-Dateien | Konkurrierende Gedächtnis-Dateien waren am 27.08. die Ursache fehlgeleiteter Sessions | **Verweis-Index** auf die kanonischen Quellen, neu nur, was fehlte |
| Hook-Writer auf Reichweite | Marke: „ehrlich, kein Clickbait" | Hook-Bank mit Fakten-/Streitfall-Hooks, Prüfer blockt Übertreibungen |
| Auto-Posting, Comment- und DM-Responder | Regel 4: Agenten entwerfen, Uwe gibt frei | Freigabe-Warteschlange; Merge = Freigabe; veröffentlicht wird danach |
| „You (Sales Calls)" | Es gibt keinen Beratungsverkauf | Entfällt; Kauf läuft über Digistore24 |
| Ads Manager | Bezahlte Ads vorerst nicht (Uwe, 08.10.2026) | Schalter „Ads", vorbereitet, aus |
| Allgemeine Fakten | Fachfehler (spider-steak, Geflügel-Studie) kosten Glaubwürdigkeit | **Marken-Prüfer** als eigenes, unabhängiges Gate mit Kanon-Abgleich |
| Allgemeine „Interrupts" | Fehlen fleischspezifische Ereignisse | Ereignis-Playbook inkl. Rückruf, Grillwetter, Fachfehler-Hinweis |

---

## 2. Aufbau

```
SIGNALE ─────────► GEHIRN ─────────────► VIER TEAMS (Abteilung 4) ─► PRÜFER ─► FREIGABE ─► VERÖFFENTLICHEN ─► MESSEN ─┐
GSC · Clarity      marketing-direktor     Recherche    themen-scout              (Gate)    Uwe:      Uwe/Kanal   wachstums-  │
Loops · Saison     (Claude Code)          Studio       content-studio            marken-   Merge     (kein       analyst     │
Digistore*         Wissensschicht         Veröffentl.  warteschlange             pruefer   = Go      Auto-Post)              │
Kommentare         docs/wachstum/wissen   Messung      wachstums-analyst                                                     │
     ▲                                                                                                                       │
     └───────────────────────────────── Lernschleife: Wochenbericht → nächster Wochenplan ◄──────────────────────────────────┘
* nach Gewerbeanmeldung
```

### Die vier Teams in Abteilung 4

| Team | Agent (`.claude/agents/`) | Befehl (`.claude/commands/`) | Liefert |
|---|---|---|---|
| Leitung | `marketing-direktor` | `/marketing-wochenplan`, `/marketing-tagesbrief` | Wochenplan, Tagesbrief, Routing |
| Recherche | `themen-scout` | `/themen-radar` | `wachstum/themen-backlog.md` |
| Content-Studio | `content-studio` | `/social-paket <slug>` | Mehrkanal-Paket in `wachstum/warteschlange/` |
| Veröffentlichung & Community | — (Uwe, nach Freigabe) | `/marketing-ereignis <art>` | Freigegebene Posts, Antwortentwürfe |
| Messung | `wachstums-analyst` | `/marketing-tagesbrief` | Wochenbericht, Anomalien |
| Gate (quer) | `marken-pruefer` | wird von Studio und Direktor gerufen | BESTANDEN / BLOCKIERT mit Fundstellen |

Bild und Video produziert weiter **Abteilung 2 · Studio** (FLUX/LoRA, Video-Toolkit,
OpenMontage). Das Content-Studio liefert dafür Skript und Bildbrief, nicht das Asset.

### Bestehende Automationen — eingebunden, nicht ersetzt

| Bestand | Rolle im Marketing-OS |
|---|---|
| `social-grow.yml` / `scripts/social-posts.mjs` (So 04:00 UTC) | Rezept-Posts als Rohstoff; `content-studio` veredelt einzelne davon zu Paketen |
| `scripts/gsc-abruf.mjs` (eingerichtet) | Hauptsignal für `themen-scout` und `wachstums-analyst` |
| `geo-check.yml`, `check-affiliate-links.yml` | Signale für das Ereignis-Playbook |
| `recipe-grow.yml`, `saison-grow.mjs`, `data/saison-kalender.yaml` | Saisonsteuerung des Wochenplans |
| Loops-Willkommensstrecke | Ziel jedes Social-Posts: Link-in-Bio → Wissens-Brief |
| `docs/confluence/04-MARKETING-AGENCY-MODEL.md` | Pipeline, RACI, Prioritätslogik — gilt unverändert |

---

## 3. Der Ablauf einer Woche

1. **Montag** — `/marketing-wochenplan`: Direktor liest Saisonfenster, Themen-Backlog,
   letzten Wochenbericht und plant 2 Artikel-Anstöße + Social-Pakete nach Kanal-Takt.
2. **Laufend** — `/social-paket <slug>` je Plan-Eintrag. Studio schreibt, Prüfer prüft,
   Ergebnis landet als Datei mit `status: geprueft` in der Warteschlange.
3. **Freigabe** — Uwe liest im PR, ändert direkt, merged. **Merge = Freigabe.**
4. **Veröffentlichen** — Uwe postet bzw. plant die freigegebenen Pakete, setzt in der
   Datei `status: veroeffentlicht` und die Links.
5. **Freitag** — `/marketing-tagesbrief woche`: Analyst schreibt den Wochenbericht nach
   `wachstum/berichte/`. Erkenntnisse fließen in den nächsten Wochenplan.
6. **Jederzeit** — Ereignis tritt ein → `/marketing-ereignis <art>` nach Playbook.

---

## 4. Schalter — was heute geht und was wartet

| Schalter | Stand 18.10.2026 | Einschalten, wenn | Was dann passiert |
|---|---|---|---|
| Recherche, Studio, Prüfer, Warteschlange | **an** | — | sofort nutzbar |
| Wochenbericht aus GSC + Clarity | **an** | — | sofort nutzbar |
| Kauf-CTAs in Posts (Diplom, Steak-Beichte) | **aus** | Gewerbe angemeldet + Verkaufsstopp in Digistore aufgehoben | Studio darf Produkt-CTAs schreiben; `kanal-regeln.md` §4 umstellen |
| Umsatzdaten im Wochenbericht | **aus** | erster echter Verkauf | Analyst liest Digistore-Statistik mit |
| Affiliate-Posts | **an, nur mit Kennzeichnung** | — | „Werbung"/„Anzeige" im Vorschaubild (LG Köln 12.05.2026) |
| Social-Kanäle bespielen | **teilweise** | Kanäle eingerichtet (YouTube u. a. offen) | Takt laut `kanal-regeln.md` |
| Geplantes Veröffentlichen per Tool | **aus** | Uwe wählt ein Werkzeug (Postiz gestrichen 07.10.) | Freigegebene Dateien werden zeitgesteuert verteilt — Freigabe bleibt Pflicht |
| Bezahlte Ads | **aus** | Uwe gibt Budget frei | eigener Ads-Fahrplan; Legal ist mit-verantwortlich |

**Offener Widerspruch, bewusst nicht aufgelöst:** Uwe wünschte am 07.10.2026 regelmäßiges
automatisches Posten; CLAUDE.md Regel 4 verbietet Auto-Posting. Dieses System hält
Regel 4 ein und automatisiert alles bis zur Freigabe. Ob nach der Freigabe zeitgesteuert
gepostet werden darf, entscheidet Uwe — dann den Schalter oben umlegen und Regel 4
mit Datum ergänzen.

---

## 5. Grenzen, die nicht verhandelbar sind

- Uwe erscheint nie vor der Kamera und nie als Autorenstimme. Stimmen: Marco, Jonas, Elena
  mit Kennzeichnung „KI-Persona · fachlich verantwortet von Uwe Yendell".
- Keine Zahl ohne Quelle, keine Temperatur ohne Teilstück, Kanon `data/kerntemperatur-referenz.yaml`.
- Recherche sammelt nur Titel, Links, Fragen — keine fremden Texte, Rezepte oder Bilder.
  Ausgeschlossene Quellen: `docs/ideen-radar.md`.
- Kein Spam, kein Mass-Follow, keine Fake-Accounts, keine gekauften Bewertungen.
- Nichts geht ohne Uwes Freigabe nach außen.
