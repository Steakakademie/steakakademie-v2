# 007 — Arbeitszeitplaner-Maske ein- und ausblenden

- **Status**: DONE — umgesetzt und im Browser gemessen am 02.10.2026 (Messwerte am Ende)
- **Commit**: 1eae59d
- **Severity**: MEDIUM (additive Verbesserung, kein Defekt)
- **Category**: Missed opportunity — preventing a jarring change
- **Estimated scope**: 1 Datei, ~20 geänderte Zeilen (dazu Einrückung des Maskeninhalts)
- **Herkunft**: Branch `feature/arbeitszeitplaner-modal-motion` (Commit `454432f`, 02.09.2026) lag nie in `main`. Dieser Plan ersetzt dort `plans/001-arbeitszeitplaner-modal-motion.md` und ist auf den Stand nach Plan 002 angepasst.

## Problem

`src/components/gruendung/ArbeitszeitPlaner.tsx` zeigt beim Erstaufruf selbst eine Maske („Wie viel Zeit hast du?"): `setMaskOpen(true)` im Lade-Effekt, wenn kein `configured`-Flag im localStorage liegt. Es ist das Erste, was ein neuer Besucher der Gründer-Schmiede sieht, und es war das einzige Modal im Projekt ohne Bewegung. Backdrop und Dialog erscheinen und verschwinden zwischen zwei Frames; `{maskOpen && …}` hängt das Element aus dem DOM, ein Exit ist damit ohne `AnimatePresence` unmöglich.

`RecipeSubmitModal` und `ExitIntent` federn beide ein. Wer die abrupte Maske zuerst sieht, liest den ganzen Bereich als weniger fertig als den Rest der Site.

## Ziel

Backdrop blendet ein; Panel blendet ein, steigt leicht von unten auf und skaliert von 0,97 auf 1. Der Ausgang ist kürzer als der Eingang.

| Wert | Quelle |
| --- | --- |
| Feder `{ stiffness: 300, damping: 26 }` | `RecipeSubmitModal.tsx`, wörtlich |
| `scale: 0.97` | `ExitIntent.tsx`, wörtlich |
| Ausgang als feste kurze Dauer (0,16 s), nicht als Feder | `RecipeSubmitModal.tsx` |
| `ease: [0, 0, 0.2, 1]` für den Backdrop | Tailwind `ease-out`, wie `globals.css` |
| `y: 12` (steigt von unten) | Der Dialog ist vertikal zentriert (`items-center`); `ExitIntent` sitzt auf `top-[10%]` und fällt deshalb umgekehrt ein |

## Konventionen (seit Plan 002 verbindlich)

- Import ist **`m as motion`**, nie das volle `motion`. `MotionProvider` setzt `LazyMotion strict`; ein voller Import wirft im Dev-Modus und holt rund 50 kB zurück ins Bundle.
- **Keine eigene `useReducedMotion`-Verzweigung.** `MotionConfig reducedMotion="user"` im selben Provider schaltet Verschiebung und Skalierung bei `prefers-reduced-motion` ab und lässt die Deckkraft stehen. Der Alt-Branch hatte dafür zwei Varianten-Objekte; sie wären jetzt doppelt.
- Keine neuen Abhängigkeiten, keine Easing-Tokens.

## Grenzen

Nur Bewegungs-Wrapper: kein `className`, kein Text, kein Layout, keine localStorage-Logik geändert. Barrierefreiheit der Maske (Dialog-Rolle, Escape, Fokus) ist bewusst **nicht** Teil dieses Plans, sie steht im folgenden Commit.

## Ergebnis (02.10.2026)

Dev-Server, Chromium, Playwright-Messung pro Frame (Skript nicht im Repo). Erstaufruf mit leerem localStorage, danach „Timetable bauen", danach „Zeiten ändern":

| | normal | `prefers-reduced-motion: reduce` |
| --- | --- | --- |
| Eingang, Deckkraft | 0 → 1 über 9 Zwischenframes | 0 → 1 über 10 Zwischenframes |
| Eingang, Transform | 18 verschiedene Werte | 2 Werte (Start, Ende), also keine Bewegung |
| Ausgang | 19 Frames im DOM, danach entfernt | 18 Frames im DOM, danach entfernt |
| Wieder öffnen | wie Eingang | wie Eingang |
| Konsolen-/Seitenfehler | 0 | 0 |

Nicht gemessen: Verhalten auf echten Touch-Geräten, unter CPU-Drosselung, und der visuelle Eindruck (Slow-Motion) durch eine Person.
