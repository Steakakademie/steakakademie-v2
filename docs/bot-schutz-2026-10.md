# Bot-Schutz und KI-Nutzungsvorbehalt — Stand 01.10.2026

Abteilung Systems & Ops (Code) + Kanzlei (Vorbehalt). PR `feat/bot-schutz-2026-10`.

## Entscheidung (Uwe, 01.10.2026)

Aus einem externen Stufenkonzept („Cloudflare Pro, Turnstile, Honeypots,
Canonicals, dynamisches Nachladen, verschlüsselte Preise") übernommen:
Turnstile, Honeypots, Rate-Limits, Canonical-Prüfung, Anti-Scraping-Hinweis.
**Gestrichen:** Cloudflare-DNS/Pro (Kosten), Inhalte per JavaScript nachladen
(schadet SEO/GEO — die Rezepte sollen zitiert werden), verschlüsselte Preise
(kein eigener Shop, Preise laufen über Digistore/Affiliate).
**Ergänzt:** maschinenlesbarer Nutzungsvorbehalt nach § 44b Abs. 3 UrhG und die
KI-Regel **„Training-Bots sperren, Such-Bots erlauben"** — das kehrt die
robots.txt-Fassung um, die seit dem GEO-Konzept („Burggraben 3") ALLE
KI-Crawler ausdrücklich zuließ.

## Was gebaut ist

| Baustein | Wo | Wirkung |
|---|---|---|
| Honeypot-Feld `website` | Kontakt, Newsletter (bestand), Widerruf, Nischen-Lead (neu); `src/components/ui/HoneypotFeld.tsx` | befüllt → stilles 200, nichts passiert |
| Turnstile | Kontakt, Newsletter, Login/Registrierung, Nischen-Lead; `src/components/ui/Turnstile.tsx` + `src/lib/api/turnstile.ts` | rendert nur mit Site-Key, Server prüft nur mit Secret; fail-open bei Cloudflare-Ausfall |
| `guardRequest` Optionen `honeypot`, `turnstile`; Helfer `botCheck`, `rateLimitRequest` | `src/lib/api/guard.ts` | ein Ort für alle Formular-Routen |
| Alt-Limiter abgelöst | `/api/newsletter` (5/10 min), `/api/validator` (10/h) | keine zweite Map-Kopie mehr |
| Neu gesichert | `/api/kochwissen` (10/10 min, **Login/Admin Pflicht** — war komplett offen, Claude + Voyage pro Aufruf), `/api/widerruf` (10/h, Honeypot, **kein** Turnstile — § 312k BGB), `/api/niche-validator/lead` (5/h), `/api/gutschein/redeem` (10/h — Codes nicht durchprobierbar), `/api/kontakt` (5/10 min) | |
| CSP | `next.config.mjs`: `script-src` + `frame-src` erlauben `challenges.cloudflare.com` | vorher `frame-src 'none'` |
| TDM-Vorbehalt | Header `TDM-Reservation: 1` + `TDM-Policy`, `/.well-known/tdmrep.json`, `/.well-known/tdm-policy.json` | § 44b Abs. 3 UrhG maschinenlesbar |
| robots.txt | `public/robots.txt` | Training-Crawler `Disallow: /`, Such-Crawler erlaubt |
| Sitemap | `next-sitemap.config.js` | 163 noindex-URLs raus (159× `/relaunch/*`, 3 Rechtsseiten, `apple-icon.png`) — 585 → 419 URLs |

**Nicht geprüft in der Session:** Playwright-E2E, Vercel-Preview, das Turnstile-
Widget im Browser (kein Site-Key vorhanden). Geprüft: tsc 0 Fehler, eslint 0
Fehler, Vitest 10/10 neue Tests, `next build` grün (419 Sitemap-URLs),
`next start`-Smoke: robots/tdmrep/tdm-policy 200, Header gesetzt, Honeypot auf
Newsletter (JSON) und Kontakt (Formular-POST) liefert stilles OK.

## Canonical-Crawl (01.10.2026, live, 585 Sitemap-URLs)

425 Seiten mit korrektem Self-Canonical, **0 Abweichungen** auf der Alt-Site.
159 `/relaunch/*`-Seiten: noindex + Canonical auf `/` — gewollt, aber sie
standen in der Sitemap. Plus 3 Rechtsseiten mit `robots: index: false` und die
Bild-Route `apple-icon.png`. Alle aus der Sitemap genommen (siehe Tabelle).

## Was Uwe tun muss (Reihenfolge einhalten)

1. ~~Turnstile anlegen~~ **erledigt 01.10.2026, 14:50:** Widget
   `steakakademie-formulare` im Cloudflare-Konto (Account 6844ff22…), Hostnames
   `steakakademie.de`, `tuwasduwillst.de`, `vercel.app` (deckt die Previews),
   Modus „Verwaltet". Kosten 0 €, keine DNS-Änderung. Schlüssel liegen NUR in
   Vercel und im Cloudflare-Dashboard, nicht im Repo.
2. ~~Vercel-Env~~ **erledigt 01.10.2026:** `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
   (plain) und `TURNSTILE_SECRET_KEY` (sensitive) in Production, Preview und
   Development gesetzt. Greift ab dem nächsten Build — der PR-Preview wurde
   danach neu angestoßen.
3. **Erst nach dem Merge + Produktions-Deploy** Supabase → Authentication → Attack Protection → Captcha →
   Turnstile, Secret eintragen. Vorher nicht — sonst sperrt sich der Login aus,
   weil der Browser noch kein Token liefert.
4. **Vercel Firewall** (vercel.com → Projekt → Firewall). Stand 01.10.2026: für
   das Projekt wurde noch nie eine Firewall-Konfiguration angelegt (API:
   „Config not found"); das Anlegen aus der Session war gesperrt. Empfehlung:
   - Managed Ruleset **Bot Protection** zunächst auf **Log**, nach einer Woche
     Beobachtung auf **Challenge**. Vorher: `ops-heartbeat` und E2E rufen die
     Seite per curl auf — eine Bypass-Regel (eigener Header) für diese Läufe,
     sonst meldet der Wächter rot.
   - **AI Bots** Ruleset: auf **Log**, nicht Deny — das Ruleset trifft auch die
     erwünschten Such-Crawler. Die Trennung macht die robots.txt.
   - **Attack Challenge Mode** nur im Angriffsfall von Hand einschalten.
   Welche Rulesets der aktuelle Vercel-Tarif enthält, zeigt das Dashboard — aus
   der API war das nicht ablesbar.
5. **Nieweg-Frage 28** aus `compliance/nieweg-frage-anti-scraping-2026-10-01.md`
   ins Fragendokument übertragen; Klausel erst nach Antwort in die
   Nutzungsbedingungen.

## Grenzen, ehrlich

- Rate-Limits zählen pro Vercel-Instanz (siehe Kopf von guard.ts). Harte
  Garantie erst mit Upstash hinter `RateLimiter` — Gratis-Tarif vorher prüfen.
- robots.txt und TDM-Vorbehalt sind Regeln, keine Mauern. Wer sie ignoriert,
  verstößt — aufhalten tut ihn nur die Firewall (Punkt 4).
- Turnstile fail-open bei Netzfehler ist bewusst: Ein Cloudflare-Ausfall darf
  kein Kontaktformular stilllegen. Honeypot und Rate-Limit greifen dann weiter.
