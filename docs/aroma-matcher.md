# Aroma-Matcher (Smart-Pairing-Engine) — Steckbrief

**Route:** `/aroma-matcher` · **API:** `POST /api/aroma-matcher` · **Stand:** 17.09.2026 (MVP, Branch `feat/aroma-matcher`)

## Was es ist

„Meat-First"-Pairing: Cut wählen → Aroma-Radar (4 Aromenfamilien seit Kuration v1: Röst & Maillard · Nussig & Reifung · Cremig & Lactone · Umami & Metallisch; Tailwind-Balken) → drei Cluster
(Rubs & Glazes · Wood & Smoke · Drinks & Sides), jeder Vorschlag mit Begründung.
Lead-Magnet: anonym nur Teaser (Dry-Aged Ribeye), registriert **5 verschiedene Cuts frei**,
danach Sperrzustand mit Warteliste (Arbeitstitel „Aroma-Matrix").

## Datenbasis — und was sie (noch) nicht ist

- `data/aroma-matcher/cuts.json` — 10 Cuts, **Koch-Kuration v0**, fachlich von Uwe freizugeben.
- Aromenfamilien-Profile sind **relative Gewichtungen (0–100)**, keine Messwerte.
- Schlüsselaromen werden **ohne OAV-Zahlen** angezeigt. Das Seed vom 17.09. enthielt OAV-Werte
  ohne Quelle — die stehen erst wieder im UI, wenn jeder Wert belegt ist (Literatur: Belitz/Grosch;
  Cerny & Grosch 1992 für Rind). Der USP „nur Schlüsselaromen oberhalb der Wahrnehmungsschwelle"
  ist damit ein **Kurationsprinzip**, kein Zahlenversprechen. Wortwahl im UI bewusst „spürbar",
  nicht „garantiert".
- **Lizenz-Doktrin unverändert** (siehe `foodpairing-steckbrief.md`): FlavorDB und FooDB sind
  nicht-kommerziell lizenziert → nicht integrieren. PubChem liefert Stammdaten, keine
  Geruchsschwellen. Eigene Kuration bleibt die einzige saubere Basis.
- Abgrenzung zum bestehenden `/api/foodpairing` (Molekül-Graph, `aroma_*`-Tabellen, Rezeptseiten):
  bleibt frei und öffentlich. Der Matcher ist das interaktive, kontingentierte Werkzeug obendrauf.

## Kontingent-Logik (Migration `20260917125339_aroma_matcher_abfragen.sql` — am 17.09.2026 per MCP angewendet, Ledger-Version = Dateiname)

- `aroma_matcher_abfragen (user_id, cut_id)` — PK = ein Cut zählt pro Konto genau einmal.
- RPC `consume_aroma_matcher_abfrage(user, cut, limit=5)` → Rest nach der Abfrage; `-1` = erschöpft,
  nichts freigeschaltet. Wiederholung eines analysierten Cuts kostet nichts. Advisory-Lock pro Konto.
- `aroma_matrix_warteliste (user_id)` — ein Klick im Sperr-Modal, kein DOI nötig (eingeloggtes Konto).
- Admin-Cookie: unbegrenzt, nichts wird verbucht.

## Bewusst NICHT gebaut (MVP-Schnitt für 01.10.)

- Keine `/vip`-Landingpage: es gibt kein Produkt dahinter, und ein „VIP-Rang" kollidiert mit dem
  Feuer-Rang-System. Name/Preis/Produkt entscheidet Uwe; die Warteliste sammelt derweil Nachfrage.
- Kein Queen-of-Fire-Branding: `/grillstil` ist ein Content-Feed, kein eigener Bereich.
  Signature-Matches dort sind ein Folgeschritt (3 statische Karten).
- Kein Loops-Sync der Warteliste (Tabelle reicht; Export per SQL).

## Offene Schritte

1. Uwe gibt `cuts.json` fachlich frei (Cluster-Empfehlungen sind Koch-Wissen).
2. Juristische Kurzprüfung der Aussagen (Steckbrief-Vorbehalt), dann Pre-Launch-Mailing.
3. Signature-Matches auf `/grillstil`; Header-Eintrag unter „Werkzeuge".
