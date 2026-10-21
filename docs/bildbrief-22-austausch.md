# Bildbrief — Austausch der 22 Falsch-Motiv-Bilder (18.08.2026)

**Pipeline je Bild (Doktrin, siehe bildstrategie):** echtes Referenzfoto (Unsplash — Lizenz geklärt 14.08.) → `fal-ai/nano-banana-pro/edit` (erst BEWAHREN, dann ÄNDERN) → deterministisches Grading (ImageMagick-Werte lt. Bildstrategie) → Frontmatter: `imageSource: "Echtfoto-Basis (Unsplash: <Fotograf>), KI-bearbeitet (Nano Banana)"` + `imageAI: true` + CREDITS-Eintrag.

**Guthaben:** vorhanden — 17,33 $ (fal.ai-Dashboard, 18.08. 09:19). Kein Blocker.
**Grading-Werte & sharp-Übersetzung:** siehe `docs/bildstrategie-grading.md`.

| # | Rezept | MUSS aufs Bild | Unsplash-Suche (EN) |
|---|---|---|---|
| 1 | bourbon-brisket-pairing | Brisket-Scheiben + Bourbon-Glas, KEIN Text/Schild | brisket bourbon glass bbq |
| 2 | braaibroodjies | Gegrillte, gefüllte Sandwiches mit Grillmarken, im Rost geklappt | grilled cheese sandwich braai toastie |
| 3 | bun-cha-hanoi | Schälchen Brühe + Reisnudeln + kleine Grillfleisch-Patties + Kräuter | bun cha vietnamese noodle bowl |
| 4 | ca-nuong-bananenblatt | Ganzer Fisch AUF Bananenblatt, sichtbares Blatt | grilled fish banana leaf |
| 5 | cedar-plank-lachs | Lachsseite AUF sichtbarer Zedernholzplanke | cedar plank salmon grill |
| 6 | chateaubriand-filet | Dickes Mittelstück Rinderfilet, geschnitten, rosa, OHNE Spiralstruktur | chateaubriand beef tenderloin sliced |
| 7 | iberico-carrillera | Geschmorte Schweinebäckchen, knochenlos, dunkle Sauce | braised pork cheeks |
| 8 | iberico-secreto | Dünner, fächriger Secreto-Cut, knochenlos, stark marmoriert | secreto iberico pork cut |
| 9 | onglet-hanger-steak | Hanger Steak knochenlos, grobe Längsfaser, geschnitten | hanger steak sliced |
| 10 | porterhouse-grill | Steak MIT T-Knochen, zwei Muskelseiten sichtbar | porterhouse steak bone |
| 11 | moo-ping | Fleisch auf HOLZSPIESSEN, thai, leicht karamellisiert | thai grilled pork skewers moo ping |
| 12 | pla-pao-salzkruste | Ganzer Fisch in weißer SALZKRUSTE, thai Straßengrill | salt crusted grilled fish thai |
| 13 | sis-kebab-tuerkisch | Fleischwürfel auf Metall-SPIESSEN über Mangal | shish kebab skewers turkish |
| 14 | sosaties-braai | Marinierte Spieße mit Fleisch + Aprikosen/Zwiebeln (südafrikanisch) | sosatie skewers braai apricot |
| 15 | tavuk-sis-kebab | Hähnchenwürfel auf SPIESSEN, nicht ganzes Hähnchen | chicken shish kebab skewers |
| 16 | texas-coleslaw | Krautsalat (Kohl-Streifen, cremig o. Essig), Beilagen-Schüssel | coleslaw bowl bbq side |
| 17 | thit-nuong-vietnam | Gegrillte marinierte Schweinescheiben, mit Reis/Nudeln + Kräutern | vietnamese grilled pork thit nuong |
| 18 | thunfisch-steak-grill | Thunfischsteak: außen Kruste, innen ROT-ROH, klare Fischtextur | seared tuna steak grill |
| 19 | ganze-makrele-grill | Echte Makrele (Streifenmuster!) ganz vom Grill | grilled whole mackerel |
| 20 | ikan-bakar-singapur | Fisch in/auf Bananenblatt mit roter Sambal-Marinade | ikan bakar sambal banana leaf |
| 21 | roastbeef-reverse-sear | Roastbeef am Stück + Scheiben, rosa Kern, OHNE Fremdobjekte | roastbeef sliced medium rare |
| 22 | wagyu-burger | Aufgebauter Burger mit dickem Patty, koherentes Stacking | wagyu beef burger |

**Review-Schritt:** Vor Commit alle 22 als Galerie an Uwe zur fachlichen Abnahme (wie beim Cut-Atlas-Verfahren).

## Ergebnis der Abnahme (18.08.2026)

**21 von 22 abgenommen** und übernommen — Bilder in `public/images/rezepte/`,
Frontmatter mit `imageSource`/`imageAI`/neuem `imageAlt`, Provenienz in
`public/images/rezepte/CREDITS.md`.

**Erledigt 21.10.2026: `cedar-plank-lachs` — per Adobe Firefly neu erzeugt (Lachs auf Zedernplanke mit Glasur), siehe `data/bildregister.yaml`. Der Rest dieses Abschnitts ist der Verlauf der drei erfolglosen Stock-Anläufe.**

1. `pixabay-4051565` — gegarter Lachs auf verkohlter Planke, aber von der Glut
   rotgetränkt. Abgelehnt: unschön.
2. `pixabay-2326481` — rohe Filets auf unverkohlter Planke, teils blass. Die
   Farbkorrektur half nicht, weil die blassen Filets bereits in der Quelle
   blass sind. Abgelehnt.
3. Suche geschärft auf `cooked salmon charred cedar plank` — 21 Kandidaten,
   davon nennen nur vier überhaupt eine Planke: die beiden bereits abgelehnten,
   eine reine Holzstruktur ohne Fisch und Flammlachs (an Bretter genagelt, ums
   offene Feuer gestellt — anderes Garverfahren). Der beste Rest zeigt gegarten
   Lachs auf dem Grillrost, ganz ohne Planke.

**Farbkorrektur an Kandidat 1 gescheitert, Befund verallgemeinerbar:** Grading
korrigiert Farbe, nicht Licht. Die Kohle unter der Planke ist dort die
Lichtquelle, die ganze Szene ist rot beleuchtet. Farbton-Drehung macht daraus
Magenta, Kanalkorrektur macht den Lachs pink und die Planke violett. Es gibt
keine neutrale Information zurückzuholen.

4. Roh-Motiv zugelassen (19.08.2026), Suche auf `raw salmon fillet cedar plank`
   und `fresh salmon side wooden plank` — 25 Kandidaten. Bester Treffer
   `pexels-37245150`: schöner roher Lachs, kräftig orange, aber auf einem
   **Bambus-Schneidebrett mit Griff**, nicht auf einer Planke. Die Planke per
   Edit zu ergänzen ist ausgeschlossen, das wäre eine Inhaltsänderung und
   verletzt BEWAHREN.

**Fazit nach vier Läufen:** In Pexels, Unsplash und Pixabay existiert kein
verwendbares Foto von Lachs auf einer sichtbaren Zedernplanke — weder roh noch
gegart. Das Rezept bleibt beim bisherigen Bild; der Audit-Befund „Keine
Zedernplanke" bleibt bestehen. Weiter geht es über eine bezahlte Stock-Lizenz
oder ein Eigenfoto: **KAN-78**. Dort stehen alle vier Runden mit
Kandidaten-IDs, die drei Optionen und der Weg zurück in die Pipeline.

**Zwei Motive mit entschärftem MUSS** (Begründung am jeweiligen JOBS-Eintrag in
`scripts/rezept-bild-austausch.mjs`): `bourbon-brisket-pairing` ohne Bourbonglas,
`sosaties-braai` ohne Aprikosen. Die Alt-Texte behaupten beides entsprechend nicht.

**Achtung Altlast (abgeglichen 18.08.2026):** Im images-Ordner lagen 14 geänderte Rezept-JPGs. Davon sind **13 die verworfenen KI-Ersatzbilder** (Bildstrategie 14.08.) — sie bleiben uncommittet. Das 14. war **kein** Ausschuss: `picanha-churrasco` war ein echtes Foto, das das bis dahin ausgelieferte KI-Bild ersetzt, welches gar keine Picanha zeigte (keine Fettkappe, falsche Form). Es ist als `2d1a48f` committet und erledigt damit Abschnitt D des Audits. Nebenbefund: Das Audit hat den Plattenstand gescannt, nicht HEAD — daher stand `picanha-churrasco` dort unter „vermutlich echtes Foto".
