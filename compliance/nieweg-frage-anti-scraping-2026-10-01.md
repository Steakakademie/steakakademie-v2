# Frage an RAin Nieweg — Anti-Scraping-Klausel und KI-Nutzungsvorbehalt

Stand 01.10.2026 · Abteilung Kanzlei · Status: **offen, noch nicht gestellt**

> Diese Frage gehört in Uwes Fragendokument `C:\Users\Uwe\Documents\Nieweg.docx`
> (Fortsetzung der Nummerierung nach Frage 27). Sie liegt hier im Repo, weil die
> Datei aus der Cowork-Session am 01.10.2026 nicht erreichbar war. Uwe überträgt
> sie — danach kann diese Datei bleiben (Nachweis, was wann gefragt wurde).

## Was technisch bereits umgesetzt ist (PR feat/bot-schutz-2026-10)

Nicht Teil der Frage, aber Kontext für die Anwältin:

1. **Maschinenlesbarer Nutzungsvorbehalt** für Text- und Data-Mining
   (§ 44b Abs. 3 UrhG): HTTP-Header `TDM-Reservation: 1` auf jeder Seite,
   `/.well-known/tdmrep.json` und `/.well-known/tdm-policy.json` (W3C TDM
   Reservation Protocol).
2. **robots.txt:** KI-Crawler, die für Modelltraining sammeln (GPTBot, ClaudeBot,
   CCBot, Google-Extended, Bytespider u. a.) sind gesperrt; KI-Suchcrawler, die
   steakakademie.de als Quelle zitieren (OAI-SearchBot, ChatGPT-User,
   Claude-SearchBot, PerplexityBot u. a.) bleiben erlaubt.
3. Formulare: Honeypot-Felder, Rate-Limits, Cloudflare Turnstile.

## Frage 28 — Anti-Scraping-Klausel in den Nutzungsbedingungen

Wir möchten in die Nutzungsbedingungen (und ggf. in die AGB) einen Hinweis
aufnehmen, der das automatisierte Auslesen der Inhalte untersagt. Hintergrund:
die Streitfälle mit „Grillakademie Ruhr" und steakakademie.com, und der Wunsch,
Urheberschaft und Markenhoheit an den Inhalten (Rezepte, Cut-Atlas,
Kerntemperatur-Referenz, Lektionstexte) klar zu dokumentieren.

**Entwurf (bitte prüfen, kürzen oder ersetzen):**

> **§ X Automatisiertes Auslesen und Text-/Data-Mining**
> (1) Die Inhalte von steakakademie.de (Texte, Rezepte, Tabellen, Bilder,
> Datenbanken) sind urheberrechtlich geschützt. Das automatisierte Auslesen,
> Kopieren, Spiegeln oder Indexieren der Inhalte (Scraping, Crawling, Harvesting)
> sowie deren Verwendung zum Training, zur Feinabstimmung oder zur Auswertung
> von KI-Systemen ist ohne vorherige schriftliche Zustimmung der Steakakademie
> untersagt.
> (2) Die Steakakademie behält sich die Nutzung ihrer Inhalte für Text- und
> Data-Mining im Sinne von § 44b Abs. 3 UrhG ausdrücklich vor. Der Vorbehalt ist
> maschinenlesbar hinterlegt (TDM Reservation Protocol, robots.txt).
> (3) Ausgenommen ist das Crawlen durch Suchmaschinen und KI-gestützte
> Suchdienste zum Zweck der Auffindbarkeit mit Quellenangabe, soweit die
> robots.txt dies erlaubt.
> (4) Verstöße können zivilrechtlich verfolgt werden.

**Konkrete Fragen:**

a) Ist die Formulierung so geeignet, oder ist eine Klausel in Nutzungsbedingungen
   für anonyme Besucher (kein Vertragsschluss) ohnehin nur ein Hinweis mit
   Dokumentationswirkung? Reicht dann der maschinenlesbare Vorbehalt (Punkt 1
   oben) plus ein kurzer Satz im Impressum/Footer?

b) Genügt die Kombination aus HTTP-Header, tdmrep.json und robots.txt als
   „maschinenlesbarer Vorbehalt" nach § 44b Abs. 3 UrhG, oder empfehlen Sie
   zusätzlich einen Hinweis im Seitenquelltext oder in den Metadaten?

c) Ist Absatz (3) (Ausnahme für KI-Suche mit Quellenangabe) rechtlich
   unschädlich für den Vorbehalt in Absatz (2), oder schwächt er ihn?

d) Soll der Hinweis auch in die AGB der Bezahlprodukte (Diplom, Kurse) — dort als
   echte Vertragspflicht des Kunden?

e) Für den Fall eines Verstoßes: Welche Nachweise sollten wir ab jetzt
   routinemäßig sichern (Server-Logs mit User-Agent, Zeitstempel, Screenshots der
   kopierten Inhalte), damit eine spätere Abmahnung belastbar ist?

## Nach der Antwort

- Klausel in `src/app/nutzungsbedingungen/page.tsx` einbauen (Regel 6: defensive
  Compliance autonom, aber Wortlaut nur nach Freigabe).
- `/.well-known/tdm-policy.json` zeigt als Lizenzquelle auf
  `/nutzungsbedingungen` — passt, sobald die Klausel dort steht.
- `compliance/website-rechtscheck.yaml` um einen Eintrag `tdm-vorbehalt` ergänzen.
