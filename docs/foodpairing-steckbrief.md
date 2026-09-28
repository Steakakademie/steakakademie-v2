# Foodpairing-Tool — Technischer Steckbrief

> **Zweck:** „Was passt zu **X**?" — ein interaktiver User-Magnet im Head-Bereich von
> steakakademie.de (analog zum Cut-Generator), der wissenschaftlich fundierte
> Aroma-Pairings über **geteilte Aromamoleküle** anzeigt und später den
> Rezept-Generator füttert.

---

## 1 · Rechtssicherer Quellen-Stack

Verifiziert (Stand 2026-06-15). **„Einsehbar" ≠ „weiterverwendbar".** Da steakakademie.de
**kommerziell** ist (Affiliate/Shop), fallen alle **NC**-Lizenzen weg.

| Quelle | Lizenz | Nutzung |
|---|---|---|
| **Eigene Kuration** (Steakakademie: öffentl. Aromachemie + CC-BY-`foods-oa`) | unser Eigentum → kommerziell frei | **Basis** der `aroma_*`-Tabellen (steak-fokussiert) |
| **PubChem** (NCBI) | Public Domain, freie API | Molekül-Stammdaten (`pubchem_cid`) |
| **Open Food Facts** | ODbL (Share-alike!) | Zutat-/Produktdaten — **separat** offen halten |
| **`kochwissen`-DB** | unser Eigentum | Verzahnung mit Technik-/Maillard-Wissen |

**Gesperrt** (nur erwähnen/verlinken, **nie** integrieren): **Ahn-Flavor-Network
(CC BY-NC-SA)**, VCF (Abo 1.485 €/J.), FEMA-GRAS-Liste (Copyright), UC-Davis-Aroma-Wheel
(Copyright), FlavorDB & FoodKG (CC-BY-**NC**), Foodpairing.com, The Flavor Bible, Aromyx,
Nielsen-Massey, ChefSteps.

> ⚖️ **Vor Live-Gang:** Kurze juristische Prüfung der Ahn-Daten-Nachnutzung
> (Teile stammen ursprünglich aus Fenaroli's Handbook) und der ODbL-Share-alike-Pflicht.
> Das Import-Skript ist quelle-agnostisch — wir können jederzeit auf ein anderes
> freigegebenes Dataset wechseln, ohne Schema/Endpoint zu ändern.

---

## 1b · Aroma-Dataset — eigene Kuration (statt Ahn)

**Wichtige Lizenz-Korrektur:** Das Ahn-Flavor-Network (Sci. Rep. 1:196, 2011,
DOI 10.1038/srep00196) steht unter **CC BY-NC-SA 3.0** — also **NonCommercial**.
Für steakakademie.de (kommerziell) damit **nicht** nutzbar. Ein früherer Hinweis auf
„CC BY 4.0" war falsch (das ist die heutige Scientific-Reports-Policy, nicht die dieses
Papers von 2011).

**Stattdessen: eigene Seed-Kuration** in `data/foodpairing/` (`ingr_info.tsv`,
`comp_info.tsv`, `ingr_comp.tsv`; siehe `SOURCES.md`) — gebaut aus öffentlich-freier
Aromachemie (Fakten sind nicht schützbar) + unserem CC-BY-`foods-oa`-Wissen.
Kommerziell sauber, klein, steak-fokussiert, eingecheckt. Format:

| Datei | Spalten |
|---|---|
| `ingr_info.tsv` | `id  name  category` |
| `comp_info.tsv` | `id  name  CAS` |
| `ingr_comp.tsv` | `ingredient_id  compound_id` |

**Live schalten:** `import-foodpairing.yml` **ohne URLs** starten → nutzt die
eingecheckten Dateien → Import nach Supabase → Foodpairing-Box wird echt.

**Erweiterung (optional):** weitere CC-BY-Paper, oder ein **kommerziell lizenziertes**
Dataset nach schriftlicher Freigabe der Autoren (z. B. FlavorDB/FooDB). Niemals ein
NC-Dataset kommerziell einspielen.

---

## 2 · Datenmodell  (`supabase/migrations/20260615_aroma_pairings.sql`)

Bipartites Graph-Modell — **keine** Embeddings nötig.

```
aroma_ingredient (id, name, slug, category)
aroma_compound   (id, name, cas, pubchem_cid, is_hub, hub_role)   -- is_hub = Schaltzentrale
aroma_ingredient_compound (ingredient_id → compound_id)            -- die Kanten
```

### Hub-Ebene (oberste Ebene)
**`is_hub`** markiert die **Schaltzentralen** — die wenigen Leit-Aromastoffe, an die
alles andockt (Hub-and-Spoke): Röst-Pyrazine, 2-Methyl-3-furanthiol, 1-Octen-3-ol,
2-Acetyl-1-pyrrolin, Strecker-Aldehyde, Räucherphenole. `hub_role` beschreibt die Nabe.
- `aroma_hub_overview()` — RPC: Hubs mit Reichweite (Zutaten-Zahl) + Beispiel-Zutaten.
- `aroma_ingredient_ohne_hub` — View/Qualitätsregel: Zutaten, die an **keinen** Hub
  andocken (sollte leer sein → jede Zutat muss an die oberste Ebene andocken).
- Rezept-Generator (`/api/kochwissen/generieren`): verankert jedes Gericht an den
  Leit-/Hub-Aromastoffen (Prompt-Regel) → der Hub ist auch bei Rezepten die Spine.

**Pairing = geteilte Moleküle** (Food-Pairing-Prinzip): Die RPC `match_foodpairing(zutat, limit)`
findet zur Ziel-Zutat alle Partner, sortiert nach Anzahl gemeinsamer Moleküle, plus bis zu
3 Beispielmoleküle für die Erklärung. On-the-fly (kein Vorberechnen aller ~1530² Paare).

RLS: nur `service_role` (Zugriff ausschließlich server-seitig, wie bei `kochwissen`).

---

## 3 · Ablauf

```
User tippt "Ribeye"
      │
      ▼
POST /api/foodpairing  { zutat: "Ribeye", limit: 20 }
      │  (admin client, service_role)
      ▼
RPC match_foodpairing  → Partner nach geteilten Molekülen
      │
      ▼
{ zutat, treffer: [ { partner:"Kakao", shared:7, shared_examples:[...] }, … ] }
```

**Import** (einmalig / bei Daten-Update):
```bash
# Dateien rechtssicher in data/foodpairing/ ablegen (ingr_info / comp_info / ingr_comp)
node scripts/foodpairing-import.mjs --dir data/foodpairing            # → Supabase
node scripts/foodpairing-import.mjs --dir data/foodpairing --dry-run  # Vorschau
```

---

## 4 · Endpoint-Vertrag

`POST /api/foodpairing`

| Feld | Typ | |
|---|---|---|
| `zutat` | string | **Pflicht** |
| `limit` | int 1–50 | optional, Default 20 |

Antwort `200`: `{ zutat, treffer: [{ partner, category, shared, shared_examples }] }`
· `404` wenn Zutat nicht im Netzwerk · `400` ungültige Eingabe · `502` RPC-Fehler.

---

## 5 · UI — Head-Box (Skizze)

```
┌───────────────────────────────────────────┐
│  🧪  FOODPAIRING                           │
│  „Was passt zu …?"                         │
│  ┌─────────────────────────┐  [ Finden ]   │
│  │ Ribeye                  │               │
│  └─────────────────────────┘               │
│                                            │
│  Top-Treffer für Ribeye:                   │
│  ● Kakao        ▓▓▓▓▓▓▓  7 Moleküle        │
│  ● Röstzwiebel  ▓▓▓▓▓    5                 │
│  ● Butter       ▓▓▓▓     4                 │
│    └ teilen u.a. 4-Methylpentansäure …     │
│                                            │
│  [ → Rezept daraus erstellen ]  ⭐⭐        │
└───────────────────────────────────────────┘
```

Drei Head-Boxen gesamt: 🔥 Cut-Generator · 🧪 Foodpairing · 🍳 Rezept-Schmiede.

---

## 6 · Verzahnung mit dem Rezept-Generator (der Burggraben)

Der Knopf **„→ Rezept daraus erstellen"** reicht die Brücken-Zutat an
`POST /api/kochwissen/generieren` weiter — inkl. **⭐-Niveau**:

```
Foodpairing (Aroma)  →  Brücken-Zutat Z
        └──────────────►  generieren { auftrag:"Ribeye mit Z", niveau:2 }
                          → technisch korrektes Rezept, geerdet in kochwissen
```

Das kann kein Wettbewerber mit reiner Aromadatenbank nachbauen — uns fehlt die
Technik-Ebene (`kochwissen`) **nicht**.

---

## 7 · Offene To-dos vor Live

- [ ] Migration `20260615_aroma_pairings.sql` in Supabase einspielen
- [ ] Freigegebenes Dataset in `data/foodpairing/` ablegen + `foodpairing-import.mjs` laufen lassen
- [ ] `pubchem_cid` optional anreichern (PubChem-API, public domain)
- [ ] Juristischer Kurz-Check (Ahn-Nachnutzung, ODbL-Share-alike)
- [ ] Head-Box-Komponente + „→ Rezept"-Verkettung im Frontend
- [ ] Optional: CI-Workflow `import-foodpairing.yml` (analog `ingest-kochwissen.yml`)

## 8 · Dataset v2 (28.09.2026)

- **Anlass:** v1 hatte 21 Zutaten, 11 Stoffe/Stoffgruppen, Ø 2,5 Stoffe je Zutat. Treffer
  teilten 1–3 Moleküle; typische Steak-Begleiter (Rotwein, Rosmarin, Knoblauch, Pfeffer)
  fehlten, „Ribeye", „Rind", „Steak" waren dreifach geführt.
- **v2:** 71 Zutaten · 198 Einzelstoffe mit CAS · 576 Kanten aus 588 Belegen (121 Studien,
  alle mit DOI). Quelle der Wahrheit `data/foodpairing/belege.tsv`, Build
  `npm run foodpairing:build`, Drift-Check in `npm run check`. Details: `data/foodpairing/SOURCES.md`.
- **21 Hubs** nach tatsächlichem Vernetzungsgrad (Furaneol, Methional, β-Damascenon,
  3-Methylbutanal …); jede Zutat dockt an mindestens einen an (Build prüft das).
- Synonyme als Alias in der API (`src/lib/foodpairing-alias.ts`) statt Doppel-Zutaten.
- **Import = Sync (Freigabe Uwe, 28.09.2026):** `foodpairing-import.mjs` gleicht die DB an die
  Dateien an und entfernt Überzähliges. Beim ersten v2-Lauf: Zutaten 20 „Ribeye" und 21 „Steak",
  Stoffe 1–11 (v1-Stoffgruppen) und damit deren 52 Kanten per Cascade — am 28.09. lesend per SQL
  gegengeprüft. Sicherungen: `--dry-run` zeigt die Löschliste vorher (braucht Service-Key, im
  Workflow vorhanden); Abbruch ohne Schreibvorgang, wenn die Dateien weniger als die Hälfte der
  Zutaten/Kanten der DB enthalten (`--force-prune` übersteuert); `--no-prune` = reiner Upsert.
  **Achtung:** Wer den Workflow mit fremden Datei-URLs startet, ersetzt damit den Bestand.
- Die Hub-Namen im Prompt des Rezept-Generators (`/api/kochwissen/generieren`) sind
  Stoffgruppen-Begriffe und bleiben fachlich gültig; der Generator liest die Tabellen nicht.
