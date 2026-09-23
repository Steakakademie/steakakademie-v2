# SEO-Monitoring — Methodik

> **Gilt für:** den wöchentlichen SEO-Lauf, der `steakakademie-audit/monitoring-log.md` füllt.
> **Gilt nicht für:** den 4-wöchigen GEO-Re-Check (AI Overview, Perplexity, ChatGPT) — dessen
> Verfahren steht in `docs/geo-baseline.md`, Abschnitt „Messung 5", und wird hier nicht wiederholt.
> **Angelegt:** 21.09.2026, aus dem Verfahren der Messung 5 und elf Log-Einträgen zusammengezogen.

Diese Datei ist die verbindliche Verfahrensquelle, auf die der Auftragstext verweist. Weicht ein Lauf
von ihr ab, gehört die Abweichung in den Log-Eintrag — nicht in eine stillschweigende Anpassung.

---

## 1. Vor dem Lauf

Zu lesen: der letzte Eintrag in `monitoring-log.md` (für die Δ-Spalten) und `docs/geo-baseline.md`,
Abschnitt „Re-Check-Rhythmus" (ob der GEO-Re-Check fällig ist).

**Zahlen aus dem Auftragstext sind keine Messwerte.** Nennt der Auftrag eine Position, eine Session-Zahl
oder ein Datum, wird das nicht übernommen, sondern selbst erhoben oder als „nicht erhoben" gemeldet.
Begründung: Messung 5 hat genau so einen Widerspruch aufgedeckt (Re-Check-Termin „~29.09." aus dem
Auftrag gegen „18.10.2026" aus der Datei — die Datei gewann, weil sie die Quelle ist).

**Selbst erheben statt delegieren.** Messung 2 und 4 haben über sechs Wochen leere Zeilen produziert,
weil die manuelle Erhebung ausblieb: grüner Lauf ohne Ergebnis, der Fall aus CLAUDE.md Regel 10. Was
nicht selbst messbar ist, wird als nicht gemessen gemeldet.

---

## 2. Leitmessung: Google DE organisch

Die eine Zahl, an der der Lauf hängt.

| Parameter | Wert |
|---|---|
| Query (wörtlich) | „Was ist die richtige Kerntemperatur für ein Steak medium" |
| URL | `google.de?hl=de&gl=de&num=10`, Seiten 1–5 über `&start=0/10/20/30/40` |
| Browser | In-App-Browser, echter DE-Standort, anonym, **kein Login** |
| Zählung | aus dem DOM: `#search a h3` → `closest('a')`, Google-eigene Links gefiltert |

Nicht verwenden: US-basierte WebSearch-Trefferlisten. Sie liefern keine deutsche SERP-Position; die
Einträge bis KW38 sind deshalb mit der Leitmessung **nicht** vergleichbar.

**Zählweise, im Eintrag offenzulegen:** organische Treffer je Seite aufsummieren, bis die eigene URL
auftaucht. Beispiel aus KW39: `7 + 10 + 10 + 7 = 34`.

### Toleranz und was daraus folgen darf

Seiten liefern unterschiedlich viele organische Treffer (Anzeigen, „Weitere Fragen", Videoblöcke
dazwischen). Die absolute Position ist dadurch **auf ±3 genau**, die Seitenangabe ist belastbar.

- **Trendaussagen stützen sich auf die Seite** („Seite 4 gehalten").
- Die absolute Zahl wird weiter genannt, aber **als Indikator ohne Trendwert**.
- Eine Differenz innerhalb von ±3 ist keine Bewegung und wird nicht als solche berichtet.

Zusätzlich je Lauf: Brand-Query und das Kopf-Keyword „Kerntemperatur Steak". Wird eines davon nur
oberflächlich geprüft, steht das in „Was NICHT geprüft wurde".

---

## 3. Technik-Checks

Alle Checks prüfen **Statuscodes und Header, nicht den Seiteninhalt**. Ein ladender Seiteninhalt belegt
keinen Redirect — das hat sechs Wochen lang ein falsches 🟢 erzeugt (siehe KW39, Abschnitt „Auflösung").

| Check | Befehl | Erwartet (Stand 21.09.2026) |
|---|---|---|
| www-Redirect, **Wurzel** | `curl -sI -o /dev/null -w '%{http_code} %header{location}\n' https://www.steakakademie.de/` | `308 https://steakakademie.de/` |
| www-Redirect, **Unterseite** | dito mit `/temperatur-guide` | `308 https://steakakademie.de/temperatur-guide` |
| Apex leitet **nicht** um | dito mit `https://steakakademie.de/` | `200`, keine Location |
| `/llms.txt` | `curl -s -o /dev/null -w '%{http_code} %{content_type} %{size_download}\n' https://steakakademie.de/llms.txt` | `200 text/plain 1533` |
| `/robots.txt` Sitemap-Zeile | `curl -s https://steakakademie.de/robots.txt \| tail -1` | `Sitemap: https://steakakademie.de/sitemap.xml` |

**Wurzel-URL und Unterseite sind beide Pflicht.** Die Regel `source: "/:path*"` in `vercel.json` traf
jeden Pfad außer der blanken Wurzel — genau diese Lücke bleibt unsichtbar, wenn nur eine der beiden
Formen geprüft wird.

Fällt ein Check rot aus: Ursache eingrenzen, bevor bewertet wird. Zwei Schichten sind zu trennen, weil
`www` über den Cloudflare-Proxy läuft und die Apex direkt über Vercel:

```bash
# Die Apex läuft nicht über den Proxy — ihre IP ist die Vercel-Anycast-IP.
#   Linux/macOS: IP=$(dig +short steakakademie.de | head -1)
#   Windows:     nslookup steakakademie.de   → Adresse übernehmen (21.09.2026: 216.150.1.193)
curl -sI --resolve "www.steakakademie.de:443:$IP" -o /dev/null \
     -w '%{http_code} %header{location}\n' https://www.steakakademie.de/
```

Kommt derselbe Befund auch an Cloudflare vorbei, liegt es nicht an Cloudflare. Am 21.09.2026 war das
so — der 200er kam auch direkt von Vercel, was den Proxy als Ursache ausgeschlossen hat.

---

## 4. Zugriffsdaten (Microsoft Clarity)

Fenster: 7 Tage, Non-Bot-Sessions. Zu erfassen: Sessions gesamt, Verhältnis Bing zu Google, meistbesuchte
Seiten.

Grenzen, die in den Eintrag gehören, wenn sie greifen:

- **Keine Attribution einzelner Besucher.** Ob Traffic auf einer Seite von Uwe selbst, einem Bot oder
  echten Besuchern stammt, ist aus Clarity heraus nicht entscheidbar — dann als nicht attribuiert melden.
- **Kleine Fallzahlen sind keine Trends.** Ein Verhältnis aus einstelligen Session-Zahlen wird als
  Einzelbefund berichtet, nicht als Entwicklung.
- Impressionen, CTR und Durchschnittsposition liefert Clarity **nicht**. Solange die Search Console nicht
  angebunden ist, gehören sie in „Was NICHT geprüft wurde" — nicht geschätzt.

---

## 5. Off-Page

Externe Backlinks zählen, ohne die bekannten fremden Namensvettern (Steakakademie Bochum, GrillKonzept,
butchery-lehel.de u. a.) mitzuzählen — Erwähnung ohne Link ist kein Backlink.

**Wochenzählung:** „Wochen in Folge ohne Backlink" wird nur hochgezählt, wenn seit dem letzten Eintrag
eine **neue Kalenderwoche** begonnen hat. Zwei Läufe in derselben Woche teilen sich den Stand.

Nur wenn ein Link existiert, ist die nofollow-Prüfung fällig; sonst entfällt sie ausdrücklich.

---

## 6. Bericht

Ein Eintrag hat diese Abschnitte, in dieser Reihenfolge:

1. `### Rankings` — mit der Messmethode in der Überschrift
2. `### Google AI Overview` — nur, was auf derselben SERP sichtbar war
3. `### Traffic`
4. `### Off-Page-Delta`
5. `### Technik-Status`
6. `### Offene Punkte`
7. `### Ampeln`
8. `### Handlungsempfehlung (max. 1)`
9. `### Trend in einem Satz`
10. `### Was NICHT geprüft wurde`

### Ampeln

Fünf Bereiche, immer alle fünf: Rankings · AI Overview / GEO · Traffic · Off-Page · Technik.
Jede Ampel braucht eine Begründung aus **dieser** Messung, mit Zahl; „unverändert" ist nur mit Bezug
auf den konkreten Vorwert zulässig.

### Genau eine Handlungsempfehlung

Kostenrahmen und Aufwand gehören dazu. Ist ein zweiter Befund objektiv dringlicher, wird er
**nachrichtlich** geführt und ausdrücklich nicht als zweite Empfehlung gezählt — so bleibt die Vorgabe
„max. 1" erfüllt, ohne dass der dringlichere Befund untergeht.

Kein Spam als Empfehlung: keine gekauften Links, keine Foren-Platzierungen ohne Substanz
(CLAUDE.md Regel 5).

### „Was NICHT geprüft wurde" ist Pflicht

Ein Lauf ohne diesen Abschnitt ist unvollständig (CLAUDE.md Abschnitt A). Hinein gehört alles, was
diesmal ausgelassen, nur oberflächlich geprüft oder mangels Zugang nicht messbar war — einschließlich
der Frage, ob committet wurde.

---

## 7. Methodik ändern

Jede Änderung an diesem Verfahren ist ein **Bruch der Zeitreihe** und wird im Eintrag als solcher
benannt, mit Grund und mit dem Hinweis, ab wann die alten Werte nicht mehr vergleichbar sind. Vorbild:
der Wechsel von der US-WebSearch-Liste auf die DE-Leitmessung in KW39.

Danach wird diese Datei angepasst — sonst beschreibt sie einen Lauf, den niemand mehr durchführt.
