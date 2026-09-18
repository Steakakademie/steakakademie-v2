# Rezeptbild-Quellen (Provenienz)

Bilder des Austauschpakets vom 18.08.2026: 21 Rezepte, deren bisheriges Bild das
falsche Gericht zeigte (siehe docs/bild-audit-rezepte-2026-08-18.md, Abschnitt C).

**Verfahren:** echtes Referenzfoto aus Pexels, Unsplash oder Pixabay →
`fal-ai/nano-banana-pro/edit` (erst BEWAHREN, dann ÄNDERN) → deterministisches
Grading mit sharp. Das Motiv stammt unverändert aus dem Quellfoto; verändert
wurden Licht, Umgebung und Bildausschnitt. Deshalb tragen alle Einträge
`imageAI: true` — die Bearbeitung ist generativ, die Vorlage nicht.

**Lizenzen:** Pexels, Unsplash und Pixabay erlauben kommerzielle Nutzung und
Bearbeitung ohne Attributionspflicht. Diese Datei ist der Provenienznachweis,
keine Pflichtangabe. Einstufung je Quelle: docs/bildquellen-whitelist.md.

| Slug | Quelle | Fotograf | Foto-ID | Abnahme |
|------|--------|----------|---------|---------|
| cedar-plank-lachs | Pexels | A D R I A N A | 37245150 | 19.08.2026 |
| bourbon-brisket-pairing | Pexels | Hayden Walker | 9397270 | 18.08.2026 |
| braaibroodjies | Unsplash | Erik Mclean | uKVaDWj7n-A | 18.08.2026 |
| bun-cha-hanoi | Pexels | Markus Winkler | 3858270 | 18.08.2026 |
| ca-nuong-bananenblatt | Unsplash | Design4business | xnxS_he76E4 | 18.08.2026 |
| chateaubriand-filet | Unsplash | Stu Moffat | Vr6Su7dd2qs | 18.08.2026 |
| iberico-carrillera | Pexels | AMANDA LIM | 8257027 | 18.08.2026 |
| iberico-secreto | Pexels | King  Ho | 31916852 | 18.08.2026 |
| onglet-hanger-steak | Pexels | wutthichai charoenburi | 19774527 | 18.08.2026 |
| porterhouse-grill | Pexels | Mohamed  Olwy | 36682989 | 18.08.2026 |
| moo-ping | Pexels | Chait Goli | 4318378 | 18.08.2026 |
| pla-pao-salzkruste | Pexels | Bert Christiaens | 15510263 | 18.08.2026 |
| sis-kebab-tuerkisch | Pexels | mefodiy | 8707683 | 18.08.2026 |
| sosaties-braai | Pexels | Mohamed  Olwy | 37058646 | 18.08.2026 |
| tavuk-sis-kebab | Unsplash | Artem Beliaikin | 7b8eGUOBbGE | 18.08.2026 |
| texas-coleslaw | Unsplash | Some Tale | 2c-7wjgc4fg | 18.08.2026 |
| thit-nuong-vietnam | Pexels | Anh Nguyen | 33999512 | 18.08.2026 |
| thunfisch-steak-grill | Pexels | Ioan Bilac | 6424962 | 18.08.2026 |
| ganze-makrele-grill | Unsplash | Clint Bustrillos | 3_M4NxDo89A | 18.08.2026 |
| ikan-bakar-singapur | Unsplash | ivia okke hartanti | xR8iT4ZpIro | 18.08.2026 |
| roastbeef-reverse-sear | Pexels | Regina Tommasi | 30221650 | 18.08.2026 |
| wagyu-burger | Pexels | Philippe Alamazani | 27469753 | 18.08.2026 |

## Eigenfotos (imageAI: false)

Bilder ohne jede generative Bearbeitung. Sie sind der Gegenpol zum Austauschpaket:
Motiv, Licht und Umgebung stammen unverändert aus der Kamera, verändert wurden nur
Ausschnitt, Drehung und Farbe — deterministisch mit sharp, nicht generativ. Die
EXIF-Daten bleiben erhalten und sind der Herkunftsnachweis.

| Rezept | Datei | Aufnahme | Bearbeitung |
|---|---|---|---|
| spareribs-3-2-1 | `spareribs-3-2-1.jpg`, `-hero.jpg` | Uwe Yendell, 19.08.2026, Samsung SM-G985F | 90° gedreht (Querformat), links beschnitten (Kamera-Wasserzeichen entfernt), Sättigung 0,72 (Rücknahme des Samsung-„Essen"-Modus), Kontrast 1,06, Schärfung sigma 1 |
| spareribs-3-2-1 | `spareribs-3-2-1-bark.jpg` (Schrittbild) | Uwe Yendell, 19.08.2026, Samsung SM-G985F | links/rechts beschnitten (Gehäusekante, Kamera-Wasserzeichen), Sättigung 0,88, Kontrast 1,08, Schärfung sigma 1,2. Ohne „Essen"-Modus aufgenommen |


## Korrektur 16.09.2026 (Compliance-Scan)

- `picanha-churrasco` — am 18.08.2026 (Commit 2d1a48f) als „vermutlich echtes Foto"
  eingestuft und bewusst OHNE `imageAI` getaggt (Begründung: natürliche
  Fettkappen-Textur). Der damalige Befund hatte die eingebetteten Metadaten nicht
  ausgewertet und stattdessen nach visuellem Eindruck entschieden. Erneute Prüfung
  16.09.2026 (Metadaten direkt am Original-Bild verifiziert): `picanha-churrasco.jpg`
  trägt eingebettet `DigitalSourceType="http://cv.iptc.org/newscodes/digitalsourcetype/
  trainedAlgorithmicMedia"` und `photoshop:Credit="Made with Google AI"` — eindeutige,
  maschinenlesbare KI-Herkunft (Google AI / Nano Banana), keine Kamera-EXIF.
  `picanha-churrasco-hero.jpg` trägt dieselbe Aufnahme ohne diese Metadaten
  (vermutlich beim Grading/Export gestrippt, vgl. `compliance/ai-act-einstufung.md`).
  Frontmatter korrigiert: `imageAI: true` + `imageSource` gesetzt. Damit rendert das
  „KI-Symbolbild"-Badge (RecipeTemplate.tsx) korrekt.

## Offener Befund

- `cedar-plank-lachs` — Bild am 19.08.2026 ersetzt, der Audit-Befund
  ("keine Zedernplanke") bleibt aber **offen**. Vier Suchläufe über drei
  Bibliotheken fanden kein Foto von Lachs auf sichtbarer Zedernplanke. Das
  gewählte Bild zeigt rohen Lachs auf einem Holzbrett; der Alt-Text behauptet
  entsprechend keine Zedernplanke. Beschaffung eines passenden Motivs per
  Stock-Einzelkauf oder Eigenfoto: KAN-78.

## Übriger Bestand

Alle anderen Dateien in diesem Ordner stammen aus der rein generativen
fal.ai/FLUX-Pipeline und sind in docs/bild-audit-rezepte-2026-08-18.md als
KI-Bilder ausgewiesen.
