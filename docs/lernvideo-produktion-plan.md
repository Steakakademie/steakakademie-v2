# Lernvideo-Produktion Diplom — Plan & Nacht-Automatik

**Stand:** 16.08.2026 · **Zielmarke:** Vorverkauf in 6 Wochen (~27.09.2026)

---

## 1. Entscheidungen vom 16.08.2026 (Uwe)

| Frage | Entscheidung | Konsequenz |
|---|---|---|
| Protagonist | **Avatar-System** (Marco/Jonas/Elena), synthetisch | Vollautomatik möglich; Doktrin „kein persönlicher Auftritt Uwes" gewahrt |
| Inhalt | **Die 35 Diplom-Lektionen** (5 Stufen × 7) werden vertont | Ersetzt die Format-Abgrenzung des BBQ-Grundkurses vom 10.07. |

**Damit überholt:** `steakakademie-video/docs/lernvideo-machart.md` (12.06.) nannte Uwe als
Protagonisten vor der Kamera. Diese Machart ist **nicht** mehr die Grundlage — der
Mikasa-Stil bleibt als *Erzähl-Vorbild* gültig (ein Vorgang komplett, wenige Schnitte,
sparsame Overlays, 2–3 Min), nur eben synthetisch umgesetzt.

### ⚠️ OFFENER PUNKT — Entscheidung Uwe, blockiert den Vorverkauf

Das Diplom ist **kostenlos**. Wenn seine 35 Lektionen Videos bekommen, ist noch nicht
entschieden, **was zu Weihnachten verkauft wird**. Drei saubere Wege:

1. **Videopfad wird das Bezahlprodukt** — Text bleibt frei, Video kostet. Klare Abgrenzung,
   kein Wertverlust am Gratis-Angebot. (Empfehlung)
2. **Videos bleiben frei, verkauft wird die Urkunde/Prüfung** — Wissen gratis, Zertifizierung
   kostet. Passt zur Marke, ist aber ein dünneres Verkaufsargument.
3. **BBQ-Grundkurs bleibt separates Produkt** mit anderem Inhalt — dann braucht er eine neue
   Abgrenzung jenseits des Formats.
   → **ENTSCHIEDEN (Uwe, 27.08.2026): Weg 1 UND Weg 3.** Der Videopfad wird das
   Bezahlprodukt des Diploms, und der Grundkurs bleibt als eigenes Einstiegsprodukt
   bestehen. Die neue Abgrenzung läuft über den **Anlass** statt über das Format:
   der Grundkurs ist ein Abend, das Diplom eine Ausbildung mit Prüfung und
   Zertifikat. Konzept: `docs/konzept-bbq-grundkurs.md`.
   Die frühere Notiz „BBQ-Grundkurs geht darin auf, entfällt als eigenes Produkt"
   beschrieb das Ende der *Doppelung*, nicht das Ende des Kurses.

Ohne diese Entscheidung gibt es kein Gutschein-Produkt für die Video-Strecke.

---

## 2. Die Maschine — steht bereits

Es muss **nichts Neues gebaut** werden. Alle Teile sind installiert und verifiziert:

| Stufe | Werkzeug | Kosten | Status |
|---|---|---|---|
| Skript & Szenenplan | OpenMontage (Agenten-Pipeline) | 0 € | installiert 09.08. |
| Sprecherstimme | **Piper TTS** (offline, `.venv/bin/piper`) | **0 €** | vorhanden, PATH-abhängig |
| Bildmaterial | **fal.ai** (einziger zugelassener Bildgenerator) | Cent-Beträge | Muster: `scripts/cut-images.mjs` |
| Komposition | **Remotion** (in OpenMontage + eigenes `steakakademie-video`) | 0 € | vorhanden |
| Schnitt/Ton/Untertitel | FFmpeg 9/9, Untertitel 2/2, Audio 2/2 | 0 € | vorhanden |

OpenMontages Zustandsautomat `idea → script → scene_plan → assets → edit → compose → publish`
hat **an jeder Stufe ein Approval-Gate** — deckungsgleich mit Regel 4.

---

## 3. Nacht-Automatik — Aufbau

**Nicht** über einen geplanten Claude-Lauf: Eine frische Sitzung hat nachts keinen Zugriff
auf `C:\Dev` (Ordnerfreigaben gelten pro Sitzung), und die Rechner-Brücke hat kein Internet
und bricht nach 45 s ab.

**Sondern über GitHub Actions** — exakt das Muster, das im Repo längst läuft
(`recipe-grow` täglich 03:30 UTC, `social-grow` sonntags 04:00; Stand 03.10.2026 —
`glossary-grow` ist seitdem pausiert und läuft nur noch per Handstart):

```
.github/workflows/lernvideo-render.yml
  cron: '0 1 * * *'          # täglich 01:00 UTC / 03:00 Berlin
  workflow_dispatch:          # + manuell auslösbar

  1. openmontage-setup.sh ausführen (Tool ist gitignored, AGPLv3 — wird in CI installiert)
  2. Nächste unproduzierte Lektion aus content/diplom-lektionen/ ziehen
  3. script → scene_plan → assets (fal.ai) → compose
  4. STOPP vor `publish`. Fertiges MP4 als Artefakt hochladen.
  5. Bei Fehler: Jira-Ticket (Muster: ops-alert-to-jira.mjs)
```

**Der Gate bleibt:** Die Nacht produziert einen *fertigen Entwurf*, kein
veröffentlichtes Video. Uwe sieht morgens das Artefakt, gibt frei oder verwirft —
genau wie bei den Social-Entwürfen (`social-grow` lädt sie als Artefakt hoch, nichts
wird automatisch gepostet). Der hier früher genannte Newsletter-Workflow ist am
03.10.2026 entfernt worden.

---

## 4. Zeitplan bis zum Vorverkauf (6 Wochen)

**Realistisch sind Stufe 1 komplett (7 Lektionen), nicht alle 35.** Der Engpass ist nicht
das Rendern, sondern das Prüfen — jede Lektion braucht deinen fachlichen Blick.

| Woche | Ergebnis |
|---|---|
| 1 | Pipeline-Workflow bauen; **eine** Pilotlektion („Grillarten verstehen") komplett durch die Kette |
| 2 | Pilot-Review mit Uwe: Stimme, Tempo, Bildsprache, Overlay-Stil festzurren → Stil-Sperre |
| 3–4 | Nächtlicher Lauf produziert die restlichen 6 Lektionen der Stufe 1 (1 pro Nacht + Puffer) |
| 5 | Korrekturschleife, Untertitel, Kapitelmarken; Verkaufsseite + Gutschein-Anbindung |
| 6 | Puffer + Vorverkaufsstart mit ehrlicher Ansage: **„Stufe 1 sofort, Stufe 2–5 monatlich"** |

Danach läuft die Maschine weiter: ~1 Lektion pro Nacht, Stufe 2–5 (28 Lektionen) in etwa
sechs Wochen Produktionszeit plus Prüfzeit.

---

## 5. Format je Lektion (Mikasa-Stil, synthetisch)

- **Länge:** 2–3 Minuten, 16:9 für die Lernplattform + 9:16-Auskopplung für Social
- **Aufbau:** Hook (0–5 s, eine überraschende Zahl oder These aus der Lektion) → EIN Vorgang
  komplett → Merksatz als Overlay → Ergebnis-Shot → CTA „Kerntemperatur-Spickzettel"
- **Stimme:** feste Piper-Stimme je Avatar (Marco = Lektionen zur Technik, Jonas = Einsteiger,
  Elena = Wissenschaft/Hintergrund) — einmal festlegen, nie wechseln
- **Quelle:** Der `merksatz` im Frontmatter jeder Lektion ist der natürliche Video-Kern
- **Fakten:** Alle Temperaturwerte ausschließlich aus `data/kerntemperatur-referenz.yaml`
- **Kennzeichnung:** KI-Erzeugung sichtbar (EU AI Act Art. 50) — Hinweis im Abspann + Beschreibung

---

## 6. Was Uwe zuarbeiten muss

1. **Entscheidung zum Bezahlprodukt** (Abschnitt 1) — blockiert den Vorverkauf
2. **Pexels/Pixabay-Keys** (kostenlos registrieren) — erweitert die Bildbasis über fal.ai hinaus
3. **Kosten-Go für fal.ai** — geschätzt 6–10 Bilder je Lektion, Cent-Beträge pro Bild
4. **Pilot-Review in Woche 2** — der wichtigste Termin: Danach ist der Stil gesperrt und die
   Maschine läuft ohne Rückfragen durch
