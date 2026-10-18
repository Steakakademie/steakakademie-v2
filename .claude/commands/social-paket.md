---
description: "Marketing-OS: Mehrkanal-Paket aus einer Fachseite bauen und prüfen"
argument-hint: "<Pfad oder Slug, z. B. content/cuts/flat-iron.mdx>"
---

Quelle: `$ARGUMENTS`

1. Löse die Quelle auf: Pfad direkt, sonst mit Glob unter `content/**/<slug>.mdx` suchen.
   Gibt es keine oder mehrere Treffer, nenne sie und stoppe.
2. Setze `content-studio` mit dieser Quelle ein.
3. Setze danach `marken-pruefer` mit dem erzeugten Pfad ein — ein eigener Agent, nicht das Studio.
4. Bei BLOCKIERT: Fundstellen an `content-studio` zurück, höchstens zwei Runden.
5. Ergebnis an Uwe: Pfad, Prüfergebnis, die drei Hooks. Nichts posten.
