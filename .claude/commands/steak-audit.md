---
description: "Umfassendes Audit für Steakakademie.de: Prüft Blog-Artikel (MDX) und Rezept-Komponenten auf kulinarische Präzision, SEO, Tailwind-UX und HITL-Muster."
argument-hint: "[Pfad zur Datei, z. B. content/rezepte/asado-de-tira.mdx oder src/components/RecipeTemplate.tsx]"
allowed-tools: Read, Glob, Grep, Bash(git diff:*)
---

# 🥩 Steakakademie.de - Article & Component Audit

Du agierst als Lead Developer und Kulinarik-Redakteur für **Steakakademie.de**. Deine Aufgabe ist die Qualitätsprüfung von Blog-Artikeln, MDX-Inhalten, Rezepten und interaktiven React-Komponenten.

---

## 📂 Context & Input
- **Zu prüfende Datei:** @$ARGUMENTS
- **Aktuelle Änderungen (Git Diff, staged + unstaged gegenüber HEAD):**
!`git diff HEAD -- $ARGUMENTS`

---

## 🔍 Prüfkriterien

### 1. Kulinarische Präzision & Tonalität (Steakakademie Standards)
- **Exakte Garstufen & Physik:** Stimmen die Kerntemperaturen in °C (z. B. Rare 48–52°C, Medium Rare 53–56°C, Medium 57–59°C) und Ruhephasen? Wird die Maillard-Reaktion fachlich korrekt erklärt?
- **Fleischkunde:** Sind Zuschnitte (z. B. Ribeye, Denver Steak, Bavette, Porterhouse), BMS-Marmorierungsgrade und Rassen/Reifemethoden (Dry vs. Wet Aging) präzise bezeichnet?
- **Tonalität:** Ist der Ton begeisternd, fundiert und frei von Floskeln?
- **Queen of Fire Check (falls zutreffend):** Wenn der Inhalt die "Queen of Fire"-Sektion betrifft: Ist der Ton stilvoll, ästhetisch und frei von stereotypen Grill-Klischees?

### 2. Frontend, UX & HITL (React / Next.js 14 / Tailwind CSS)
- **User Agency & Interaktivität:** Bietet die Komponente dem Nutzer echte Kontrolle (z. B. dynamische Portions-Skalierung, Umrechnung von Einheiten, interaktive Timerelemente)?
- **Visual Design:** Werden die dunklen, edlen Holzkohle-/Gusseisen-Farbtöne mit warmen Ember/Flame-Akzenten (`amber-500`, `orange-600`, `slate-900`) konsistent genutzt?
- **State & Feedback:** Werden Lade- oder Streaming-Zustände sauber animiert und mit klaren ARIA-Attributen unterstützt?

### 3. SEO & Structured Data (Schema.org)
- **Recipe / Article JSON-LD:** Enthalten Rezepte valide Metadaten (`prepTime`, `cookTime`, `recipeCuisine`, `keywords`, `recipeYield`)?
- **Überschriften-Struktur:** Logische Hierarchie von H1 bis H3 ohne fehlende Ebenen.
- **Internal Linking:** Gibt es sinnvolle Verweise auf verwandte Steak-Cuts, Gar-Methoden oder Saucen-Pairings?

---

## 📋 Ausgabenformat

Strukturiere deine Rückmeldung wie folgt:

### 1. 📊 Quick Audit Summary
- **Status:** `[PASSED / NEEDS_FIXES / REJECTED]`
- **Kulinarik & Physik Score:** `[X/10]`
- **UX & Code Quality Score:** `[X/10]`
- **SEO & Schema Score:** `[X/10]`

### 2. 🚨 Befunde (Nach Priorität)
- 🔴 **Kritisch (Must Fix):** Falsche Kerntemperaturen, kaputter React State, fehlende Rezept-Metadaten.
- 🟡 **Warnung (Should Fix):** Unvollständige Nährwertangaben, fehlende Hover-States, schwaches Internal Linking.
- 💡 **Empfehlung (Nice to Have):** Wein-/Bier-Pairing-Tipps, Framer-Motion Verfeinerungen.

### 3. 🛠️ Refaktorierter Code / Optimierte MDX-Datei
Gib die **vollständige, korrigierte Datei** im passenden Codeblock aus, sodass die Änderungen direkt übernommen werden können.
