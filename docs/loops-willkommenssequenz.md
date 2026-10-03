# Loops — Willkommenssequenz „Wissens-Brief" (4 Mails)

> Copy-paste-fertig für Loops (Loop: Trigger = Contact created, Quelle Newsletter-DOI).
> Absender: `login@steakakademie.de` ist Auth — für Marketing den Loops-Standard-Absender nutzen.
> Stimme: direkt, ehrlich, Pitmaster — kein Marketing-Sprech. Jede Mail EIN Job.
> Abstände: Mail 1 sofort · Mail 2 +2 Tage · Mail 3 +3 Tage · Mail 4 +3 Tage.
>
> **Stand 03.10.2026 — Takt-Zusage prüfen:** Die Website verspricht beim Wissens-Brief
> keinen Takt mehr („ohne festen Takt, ohne Spam"), und einen automatischen Wochenversand
> gibt es nicht. Die Mailtexte unten nennen aber noch an drei Stellen den Freitag (Mail 1,
> 2 und 4). Am 03.10.2026 in Loops nachgesehen: Die dort gespeicherten Mails 1, 2 und 4 tragen
> den Satz noch. Ändern lässt er sich nur bei pausiertem Workflow — Mailtext ist
> Außenauftritt, also Uwes Freigabe (CLAUDE.md §2 Regel 4). Danach diese Vorlage nachziehen.

---

## Mail 1 — sofort nach Bestätigung (Leadmagnet liefern)
**Betreff:** Dein Spickzettel: alle Kerntemperaturen auf einer Seite
**Preheader:** Ausdrucken, an die Grillstation, nie wieder raten.

```
Willkommen beim Wissens-Brief.

Versprochen ist versprochen — hier ist dein Kerntemperatur-Spickzettel:
alle Garstufen für Rind, Schwein, Lamm, Geflügel und Fisch auf einer
Seite. Keine Internet-Faustregeln, sondern die Werte, mit denen wir in
der Steakakademie arbeiten.

→ Spickzettel öffnen & drucken:
https://steakakademie.de/kerntemperatur-spickzettel

Drei Regeln, die wichtiger sind als jede Tabelle:
1. Miss im dicksten Punkt — nie am Knochen.
2. Nimm das Fleisch ~3 °C vor dem Ziel runter (es zieht nach).
3. Lass es ruhen. Steaks 3–5 Minuten, große Braten länger.

Jeden Freitag bekommst du ab jetzt ein Stück BBQ-Wissen, das bleibt.

Uwe — Steakakademie
```

## Mail 2 — +2 Tage (bestes Wissen, Vertrauen)
**Betreff:** Der eine Fehler, der mehr Steaks ruiniert als alles andere
**Preheader:** Es ist nicht die Hitze. Es ist das Timing danach.

```
Der häufigste Steak-Killer ist nicht zu viel Hitze — es ist das
fehlende Ruhen.

Schneidest du sofort an, läuft der Saft aufs Brett statt im Fleisch zu
bleiben. 3–5 Minuten Geduld machen aus einem guten Steak ein sehr gutes.

Warum das physikalisch so ist, und wie du mit Reverse Sear Kruste UND
perfekten Kern bekommst, liest du hier:

→ https://steakakademie.de/methoden/reverse-sear
→ https://steakakademie.de/temperatur-guide

Freitag gibt's das nächste Stück Wissen.

Uwe — Steakakademie
```

## Mail 3 — +3 Tage (Diplom = Bindung)
**Betreff:** Vom Funken zum Pitmaster — dein kostenloser Lernweg
**Preheader:** 35 Lektionen, 5 Stufen, null Euro.

```
Die meisten lernen Grillen aus zusammengewürfelten YouTube-Videos.
Das Ergebnis: Lücken, die man nicht sieht — bis das teure Stück Fleisch
danebengeht.

Die Grillmeister-Ausbildung der Steakakademie ist ein strukturierter
Lernweg: 5 Stufen von Bronze bis Meister, 35 Lektionen — von der
Feuerführung bis zur Wettkampf-Präsentation. Komplett kostenlos.

→ Starte mit Stufe 1: https://steakakademie.de/diplome

Nimm dir eine Lektion pro Tag. In fünf Wochen grillst du anders.

Uwe — Steakakademie
```

## Mail 4 — +3 Tage (Produktbrücke, ehrlich)
**Betreff:** Wenn's mal schiefgeht: Sag mir, was passiert ist
**Preheader:** Die Steak-Beichte — Diagnose statt Daumendrücken.

```
Irgendwann passiert es jedem: 45 Euro Tomahawk, außen verbrannt, innen
grau. Der Moment, in dem man entweder flucht — oder versteht, was
schiefging.

Dafür gibt es die Steak-Beichte: Du beschreibst (oder fotografierst),
was passiert ist, und bekommst eine ehrliche Diagnose mit
Korrektur-Protokoll für den nächsten Versuch. Eine Diagnose kostet 7 €
— weniger als das nächste verdorbene Steak.

→ https://steakakademie.de/steak-beichte

Und falls du gerade dabei bist, dir nebenbei etwas Eigenes aufzubauen:
Ich dokumentiere auf der Steakakademie auch, WIE dieses Projekt
entsteht — KI-gesteuert, als Ein-Personen-Betrieb. Falls dich das
interessiert: https://steakakademie.de/ehrliches-system

Ab jetzt: jeden Freitag der Wissens-Brief. Gute Glut!

Uwe — Steakakademie
```

---

## Setup in Loops (Uwe, ~15 Min)
1. loops.so → **Loops** → „+ New Loop" → Trigger: **Contact added** (Audience-Filter: source enthält `newsletter`, falls gesetzt).
2. 4 E-Mails anlegen (Copy oben), Delays: 0 / 2 Tage / 3 Tage / 3 Tage.
3. Loop aktivieren. Test: eigene Mail über steakakademie.de/newsletter anmelden, DOI bestätigen, Mail 1 prüfen.

---

## Status: per Workflows API angelegt (20.08.2026)

Die Sequenz wurde **nicht** im Editor, sondern über die Loops Workflows API gebaut
(der UI-Weg schlug fehl → Loops-Support-Ticket #20060).

- **Workflow-ID:** `cmt1wxrmn07uo0j0aofqglkmv`
- **Name:** „Willkommenssequenz Wissens-Brief"
- **Status:** `Sending` — aktiviert am 20.08.2026 (Aktivierung nur in der Loops-UI moeglich, kein Publish-Endpunkt in der API)

### Graph
| # | Node | Typ | Detail |
|---|------|-----|--------|
| 1 | n1 | SignupTrigger | Kontakt angelegt (passiert erst nach DOI-Bestätigung, siehe `api/newsletter/confirm`) |
| 2 | n3 | AudienceFilter | `source` contains `doi-confirmed`, `appliesDownstream: true` |
| 3 | n4 | SendEmailAction | Mail 1 — Spickzettel |
| 4 | n5 | TimerAction | 2 Tage |
| 5 | n6 | SendEmailAction | Mail 2 — Ruhen lassen |
| 6 | n7 | TimerAction | 3 Tage |
| 7 | n8 | SendEmailAction | Mail 3 — Diplom |
| 8 | n9 | TimerAction | 3 Tage |
| 9 | n10 | SendEmailAction | Mail 4 — Steak-Beichte |
| 10 | n2 | ExitAction | — |

### Email-Message-IDs (für spätere Content-Updates via `/v1/email-messages/{id}`)
- Mail 1: `cmt1wz9xs080x0j0ardpynkon`
- Mail 2: `cmt1wzam308gq0jzufvgv3vbw`
- Mail 3: `cmt1wzb8y085o0j0dft01wu1h`
- Mail 4: `cmt1wzbux08720jysur0aular`

Absender: `Steakakademie <pitmaster@…>`, Reply-To `pitmaster@steakakademie.de`.
Guardian-Check: 0 Errors, 0 Warnings für alle vier Mails.
Inhalt als LMX; Änderungen brauchen die aktuelle `contentRevisionId` (Revision-Locking).

### End-to-End-Test 20.08.2026 — bestanden
| Schritt | Ergebnis |
|---|---|
| `POST /api/newsletter` (live) | HTTP 200 |
| `LOOPS_DOI_TEMPLATE_ID` in Produktion | gesetzt (sonst 503) |
| DOI-Mail zugestellt | 19:45 |
| Kontakt angelegt nach Bestätigung | 19:47:09, `source: steakakademie-website-footer-doi-confirmed` |
| Mail 1 ausgeliefert | 19:47:10 — 1 Sekunde nach Kontaktanlage |

Wichtig für künftige Tests: `SignupTrigger` feuert **nur bei Neuanlage** eines Kontakts.
Existiert die Testadresse in Loops bereits, läuft `/api/newsletter/confirm` in den
409-/Update-Zweig — der Workflow startet dann nicht, der Test sieht aber trotzdem grün aus.
Testadresse also vorher in Loops löschen.

### Offen
- Workflow „Wöchentlicher Newsletter" (`cmr0ayxxf066d0jzrzlx3wvwn`) ist serverseitig defekt:
  `GET /v1/workflows/{id}` liefert `{"message":"Internal error"}`. Andere Workflows im selben
  Team laden normal → Datenproblem an genau diesem Workflow, nicht am Account. Loops-Ticket #20060.
- `LOOPS_DOI_TEMPLATE_ID` und `LOOPS_MAGIC_LINK_TEMPLATE_ID` fehlen in der lokalen `.env.local`
  (Produktion ist ok) — lokale DOI-/Magic-Link-Tests schlagen deshalb fehl.
