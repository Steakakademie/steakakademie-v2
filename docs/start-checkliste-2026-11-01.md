# Start-Checkliste 01.11.2026 — Verkaufsstart und Affiliate-Start

> Abteilung: Systems & Ops, mit Wachstum (Affiliate) und Kanzlei (Gewerbe). Angelegt 22.10.2026
> (Paket T8 / C23 im Launch-Plan) als Draft-PR; der Merge dieser Datei ist **kein** Start.
> Jede Zeile nennt, wer sie ausführt. Reihenfolge ist Pflicht — Variablen vor Mapping heißt
> Kauf ohne Zugang (Runbook `docs/digistore-diplom-anbindung.md`).
>
> **Vorbedingung (Uwe, 17.10.2026):** „das Produkt darf noch nicht verkauft werden, erst nachdem ich
> das Gewerbe angemeldet habe." Ohne Gewerbeanmeldung gibt es am 01.11. nur Teil B (Affiliate) —
> Soft-Start, neuer Verkaufstermin 15.11. (Arbeitsplan, Abschnitt 5).

## 0. Go/No-Go am 29.10. — was grün sein muss

| Nr | Kriterium | Beleg | Stand 22.10. |
|---|---|---|---|
| 1 | Gewerbeanmeldung liegt vor (oder Soft-Start beschlossen) | Datum im Cockpit | Termin 01.11. (K1) |
| 2 | Testkauf Mein Protokoll **und** Steak-Beichte protokolliert, inkl. echter Plan-Erzeugung | Protokoll mit Screenshots (K7 / C18) | nur Diplom belegt |
| 3 | `main` grün, 21/21 Funktionsproben an drei Tagen | Actions | 15/21 ohne Testkonto (T2 / C22) |
| 4 | Zusagen-Gate grün für den Abgabeumfang, Prüfdatum Tranche 1 | `npm run check:zusagen`, `npm run pruefstand` | 168 Altbestand (Z1 / C20) |
| 5 | Sicherung mit belegter Probe; Kostendeckel gesetzt | Job-Summary Sicherung; Konsolen (T4 / C17) | Probe-Fix PR #465; Deckel nicht belegt |
| 6 | Störfall-Checkliste; pitmaster@ empfängt | `docs/stoerfall-checkliste.md`; Zustellprobe (M4) | Liste da; Probe offen |

Rot bei 2, 3 oder 4 → Teil A verschiebt sich auf den 15.11., Teil B läuft trotzdem.

## A. Verkaufsstart (nur nach Gewerbeanmeldung)

### A1 — Kanzlei und Kasse, vor allem anderen (Uwe)

- [ ] Gewerbeanmeldung erledigt, Datum und Aktenzeichen im Cockpit (Kanzlei).
- [ ] Impressum und AGB gegen die Gewerbedaten geprüft (Rechtsform, Anschrift, USt-Stand). Preisangabe:
      bleibt § 19 UStG **oder** Umstellung auf „inkl. MwSt." — nur mit Steuertelefon-Antwort (K6 / C21).
- [ ] Digistore 750228: Verkaufsstopp aufheben, Leistungszeitraum unbefristet, Produkt bei DS-de zur
      Prüfung einreichen. Für 696394 (Steak-Beichte) und 696396 (Mein Protokoll): Verkaufsstopp aufheben,
      Zahlpläne und Widerrufs-Checkbox geprüft (K3).

### A2 — Datenbank, dann Variablen (Claude bereitet vor, Uwe wendet an)

- [ ] `courses.published = true` für `steak-beichte` und `mein-protokoll` — heute `false` (22.10., live
      abgefragt). Ohne das meldet der Webhook `kurs-unpublished` und der Käufer sieht nichts. Als
      Migration im Ledger, nicht per Hand im Editor.
- [ ] Mapping geprüft: `digistore_products` 696394 → `steak-beichte` (credit_amount 1), 696396 →
      `mein-protokoll`, 750228 → `grillmeister-diplom` — alle vorhanden (22.10.).
- [ ] **Start-PR** mergen: `data/angebote.yaml` `mein-protokoll` und `steak-beichte` von
      `status: ab_datum` auf `status: live` (Kaufknopf über `verkaufsstand()`, eine Stelle). Der PR
      läuft durch alle vier Pflicht-Checks; Merge am Starttag durch Uwe.
- [ ] Vercel: `NEXT_PUBLIC_DS_DIPLOM_PRODUCT_ID=750228` zurück auf **Production + Preview**
      (heute nur Preview). Dabei erledigen: `NEXT_PUBLIC_GA_ID` löschen, `DIPLOM_PRUEFUNG_SECRET`
      setzen (T5, beides offen seit dem 14.10.).
- [ ] Redeploy der Produktion auslösen (Vercel → Deployments → Redeploy) — Variablen gelten erst damit.

### A3 — Nachkontrolle live (Claude, innerhalb einer Stunde nach dem Redeploy) = C26

- [ ] `/diplome`, `/mein-protokoll`, `/steak-beichte`: Kaufknopf sichtbar, Preis stimmt (99 € / 3 × 35 €;
      19 €/29 €; 7 €/25 €), kein „Verkaufsstart geplant" mehr. Beleg: Screenshot + `curl` 200.
- [ ] Ein Klick auf jeden Kaufknopf führt zum Digistore-Checkout des richtigen Produkts (ID in der URL).
- [ ] Funktionsproben per `workflow_dispatch` starten: grün.
- [ ] Sentry 60 min beobachten: kein „Kassiert ohne Auslieferung", kein neuer Fehler-Cluster.
- [ ] Erster echter Kauf (oder Testkauf im Testmodus): `digistore_orders` Zeile `processed`, `bookings`
      aktiv, Login-Mail angekommen, Zugang sichtbar, Rechnung aus Digistore — Protokoll mit Screenshots.
- [ ] Cockpit: Zeile „Verkauf live seit 01.11.2026, HH:MM, Deploy <id>" in Wachstum und Kanzlei.
- [ ] Tagesfakten: am 02.11. Zeile für den 01.11. mit `kaeufe` prüfen (`docs/tagesfakten.md`).

## B. Affiliate-Start (läuft auch ohne Gewerbeanmeldung — Provisionen fließen erst später)

- [ ] Awin: Programme freigeschaltet (SharkNinja 19810 bestätigt, Bremer Gewürzhandel seit 12.10.);
      Werbefläche steakakademie.de für alle vier Programme eingetragen (A1 — Beleg fehlt noch).
- [ ] **Affiliate-Start-PR** (C11) mergen: `products/affiliate-programs.yaml` SharkNinja `status: active`
      — ab dann schaltet `/go/<id>` vom Amazon-Suchlink auf den Awin-Deeplink (`src/lib/partnerziel.ts`).
      Im selben PR: Feed-Fehler = Lagerstand unbekannt, Link bleibt (nie 503 an Besucher; der
      Status gehört nach `/api/partner/feed-status` und in den Heartbeat).
- [ ] `AWIN_FEED_SHARKNINJA` liegt in Vercel (seit 22.10., Production + Preview). Nach dem Redeploy
      `/api/partner/feed-status?advertiser=sharkninja` → `status: ok`, Geräte `imFeed: true`.
      BZ651EU ist bei sharkninja.de **nicht lieferbar** (22.10.) — Link darf nur erscheinen, wenn der
      Feed `lieferbar: true` sagt.
- [ ] Kennzeichnung: jede Platzierung mit Partnerlink zeigt „Anzeige" vor dem ersten Klick und trägt
      `rel="sponsored"` (`src/components/affiliate/produkt-anzeige.ts`; Test C14).
- [ ] Heartbeat-Eintrag „Awin-Feed SharkNinja" (typ http auf `feed-status`, erwartet `ok`) — Teil des
      Start-PR.
- [ ] Nachkontrolle: drei `/go/<id>`-Links klicken → Awin-Weiterleitung mit `clickref`; Plausible-Ziel
      „Affiliate-Klick" zählt.

## C. Wenn etwas schiefgeht

`docs/stoerfall-checkliste.md` — Digistore-Webhook (3), Vercel (1), Supabase (2). Rückweg des
Verkaufsstarts in dieser Reihenfolge: Verkaufsstopp in Digistore (wirkt sofort, auch bei gecachter
Seite) → `angebote.yaml` zurück auf `ab_datum` per PR → Variable auf Preview. Niemals nur den
Button verstecken: der Checkout-Link ist sonst weiter erreichbar (Lehre vom 17.10.).

## D. Handgriffe, die nur Uwe kann (gesammelt)

1. Gewerbeanmeldung, Impressum/AGB-Daten, Steuertelefon-Antwort.
2. Digistore: Verkaufsstopps aufheben, DS-de-Prüfung, Testkauf.
3. Vercel: drei Variablen, Redeploy.
4. Supabase: Migration `published = true` anwenden (Connector).
5. Awin: Werbefläche, Programmfreigaben.
6. GitHub: Start-PR und Affiliate-Start-PR mergen — der Merge ist die Freigabe.
