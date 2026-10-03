# EU AI Act — Rollen- und Risikoeinstufung steakakademie.de

Stand: 19.08.2026 · Referenz: EU-KI-Verordnung 2024/1689 (Art. 50 in Kraft seit 02.08.2026)
Fachliche Grundlage: e-recht24 „KI-Kennzeichnungspflicht für Unternehmer" (geprüft 19.08.2026),
Homepagecheck RAin Nieweg 18.08.2026. Kein Rechtsgutachten — Arbeitsdokumentation.

## Rolle: BETREIBER (Deployer)

steakakademie.de entwickelt und vertreibt kein eigenes KI-Modell, sondern bindet
fremde KI-Systeme über APIs ein:

| System | Anbieter | Zweck |
|---|---|---|
| Marco-Chat (Gemini API) | Google | BBQ-Fragen und Foto-Analysen angemeldeter Nutzer |
| Bild-Editing (Nano Banana / FLUX) | fal.ai | Rezept-/Cut-Bilder ab Echtfoto-Basis |
| Redaktions-Unterstützung | Anthropic | Textentwürfe unter redaktioneller Kontrolle |
| Rezept-Prüfung Community | Anthropic | Sicherheits-/Qualitätscheck von Einreichungen (Vorprüfung; Veröffentlichung erst nach Freigabe durch einen Menschen) |
| Mein Protokoll, Steak-Beichte | Anthropic | Grillplan bzw. Fehlerdiagnose als Kaufprodukt |
| Rezept-Schmiede, Wissenssuche | Anthropic + Voyage AI | Rezept bzw. Antwort aus der Wissensdatenbank (angemeldete Nutzer) |

**Korrektur 03.10.2026 (Abgleich Text ↔ Technik):** Bis dahin stand Marco hier als
„Claude API / Anthropic". Der Chat läuft über Google Gemini
(`src/app/api/marco/route.ts`: `@google/genai`, Modell per `GEMINI_MODEL`), nimmt
auch Fotos entgegen und ist seit 22.09.2026 nur angemeldet nutzbar. Die letzten
beiden Zeilen fehlten ganz (Routen: `/api/mein-protokoll/generate`,
`/api/steak-beichte/analyze`, `/api/kochwissen`, `/api/kochwissen/generieren`).
Die Community-Rezept-Prüfung veröffentlicht seit 03.10.2026 nichts mehr selbst
(`src/lib/rezept/einreichung-status.ts`). Nicht aufgenommen: der englische
„Niche Validator" (`/tools/niche-validator`, Anthropic, ohne Login) — Rest eines
Fremdprojekts, Entscheidung über Verbleib offen. Offen und aus dem Repo nicht
belegbar: Vertrag/Auftragsverarbeitung mit Google für die Gemini-API.

Erweiterte Anbieterpflichten würden erst greifen, wenn ein selbst feingetuntes
Modell als eigenes Produkt vertrieben wird → relevant frühestens bei GF2
(KI-System als Produkt); vor GF2-Launch neu bewerten und ARAG-Deckung klären (KAN-77).

## Risikoklasse: MINIMAL

Kulinarische Bildung, Rezept-Assistenz und Food-Bilder fallen in keine
Hochrisiko-Kategorie des Anhang III (keine Biometrie, Medizin, kritische
Infrastruktur, Beschäftigung, Strafverfolgung). Es verbleiben ausschließlich
die Transparenzpflichten aus Art. 50.

## Umsetzung der Art.-50-Pflichten (Stand 19.08.2026)

1. **Chatbot (Abs. 1):** KI-Hinweis VOR Interaktionsbeginn — sichtbare
   „KI"-Badge am Marco-Button, aria-label „KI-Assistent … keine echte Person",
   Hinweis im Chatfenster. (KAN-73)
2. **Bilder (Abs. 2/4):** `imageAI: true` im Frontmatter aller KI-generierten/
   -bearbeiteten Bilder; sichtbares Label auf der Rezeptseite
   („KI-Symbolbild", verlinkt auf /ki-disclaimer). Ein pauschaler Disclaimer
   allein genügt nicht (e-recht24). Herkunftsnachweis je Bild:
   public/images/rezepte/CREDITS.md.
   OFFEN: maschinenlesbare Kennzeichnung — die sharp-Pipeline strippt
   C2PA-Metadaten der fal.ai-Quellen (kein `.withMetadata()`); Stichprobe
   19.08.: 0 Marker in verarbeiteten Bildern. Entscheidung über Nachrüstung
   steht aus (Digital-Omnibus-Frist für Anbieter: 02.12.2026; als Betreiber
   nachrangig, aber sauberer).
3. **Texte (Abs. 4):** Redaktionsvorbehalt — KI-Entwürfe werden geprüft und
   verantwortet (Uwe Yendell, fachliche Verantwortung dokumentiert in
   src/lib/authors.ts). Damit entfällt die Text-Kennzeichnungspflicht;
   die Marco-Persona ist zusätzlich offen als „KI-Redaktionspersona"
   ausgewiesen (Autorenprofil /autoren).
4. **Barrierefreiheit (Abs. 5):** Hinweise als sichtbarer Text bzw. aria-label,
   nicht nur title-Attribut.

## Wiedervorlage

- Vor GF2-Launch: Rolleneinstufung neu bewerten (Betreiber → ggf. Anbieter).
- Wöchentliche Code-Prüfung: Montags-Compliance-Scan, Punkt 19.
- Offene Anwaltsfrage (nachrangig): Einordnung fotorealistischer
  Food-Composings zwischen „technischer Anpassung" und „Deepfake" —
  bei nächstem Kontakt mit RAin Nieweg mitnehmen.
