# Quellen & Lizenz des Aroma-Datasets

Dieses Pairing-Dataset ist eine **eigene Kuration der Steakakademie**, keine fremde Datenbank.
Es besteht aus **Fakten** (welcher Aromastoff in welchem Lebensmittel geruchsprägend ist)
mit Einzelnachweis. Fakten sind nicht urheberrechtlich geschützt; die Kurzbelege in
`belege.tsv` sind eigene Formulierungen (max. 20 Wörter), keine Zitate.

## Stand v2 (28.09.2026)
- **71 Zutaten · 198 Aromastoffe · 576 Verknüpfungen**, belegt durch **588 Belegzeilen aus
  121 Fachstudien** (jede mit DOI). v1 hatte 21 Zutaten, 11 Stoffe(-gruppen), 52 Kanten ohne
  Einzelquelle.
- Grundlage: **Schlüssel-Aromastoffe** aus der Lebensmittelchemie — Aromaextrakt-
  Verdünnungsanalyse (AEDA), Aromawerte (OAV), Rekombinations- und Weglassversuche,
  GC-Olfaktometrie. Klassische Arbeitsgruppen u. a. Grosch, Schieberle, Buettner, Steinhaus
  (Deutsche Forschungsanstalt für Lebensmittelchemie / TU München).
- Jede Zeile in `belege.tsv` nennt Zubereitung, Quelle, DOI und die tatsächlich geöffnete URL
  (meist PubMed- bzw. Europe-PMC-Abstract). Recherche am 28.09.2026; Stichprobe von 12 Belegen
  unabhängig gegen die Abstracts geprüft: 12/12 bestätigt.
- **Evidenz A** = AEDA/OAV/Rekombination/Omission. **Evidenz B** = GC-O ohne Verdünnung,
  Headspace-OAV oder Übersichtsartikel mit Geruchsangabe. Schwächeres (nur Sensorik-Korrelation,
  Übersicht ohne Geruchsmessung, Fehlgerüche, vorläufige Identifizierung) steht mit Grund in
  `ausgeschlossen.tsv` und wird nicht importiert.
- CAS-Nummern über PubChem geprüft; leer, wo die Quelle Stereochemie/Identität offenlässt.

## Nachtrag 29.09.2026
- **+ Paprikapulver** (edelsüß; Zimmermann & Schieberle 2000, AEDA, Abstract geprüft): β-Ionon,
  Furaneol, Sotolon, 2- und 3-Methylbuttersäure. Stand danach: 72 Zutaten · 199 Stoffe ·
  581 Kanten · 593 Belege.
- Aus einer externen Web-Recherche **nicht** übernommen (Gründe in `ausgeschlossen.tsv`):
  Pfeffer und Oregano (Studien existieren, Abstract nicht abrufbar → noch nicht verifiziert),
  Basilikum (DOI gehörte zu einer fachfremden Studie), Nelke (Zusatzstoffe nicht im Abstract),
  Ahornsirup (nur GC-MS).
- **+ Schwarzer Knoblauch** (fermentiert; Yang et al. 2019, J. Agric. Food Chem.,
  10.1021/acs.jafc.9b03269 — AEDA, Rekombination und Omission, Abstract geprüft): 9 Schlüsselstoffe,
  darunter Furaneol, 3-Methylbuttersäure, Allylmethyltrisulfid; neu im Vokabular
  (E,Z)-2,6-Nonadien-1-ol und γ-Undecalacton. Zweitbeleg: Übersicht Kilic-Buyukkurt et al. 2023
  (Volltext geprüft). Stand danach: 73 Zutaten · 201 Stoffe · 590 Kanten · 605 Belege.
- Aus einer dritten externen Lieferung **nicht** übernommen: Frühlingszwiebel (Studie zu einem
  Pfannkuchen-Gericht, DOI falsch zugeordnet), Knoblauch-roh als Evidenz A (zitierter Satz betraf
  schwarzen Knoblauch), Pfeffer weiterhin unverifiziert.

## Bekannte Lücken (ehrlich)
- Nicht belegbar gefunden: **Oregano, Wacholderbeere, Ahornsirup, frische Feige,
  gebratener westlicher Bacon, Tomatenmark.** (Teils existieren Studien, deren Abstract
  keine Einzelstoffe nennt oder die nicht abrufbar waren.)
- Dünn belegt: Nelke (1 Stoff), Basilikum (2), Räucherlachs (1), Pfeffer (Standardquelle
  Jagella & Grosch 1999 nicht abrufbar), Hirsch (nur Headspace-OAV).
- „Speck" stützt sich auf chinesischen Speck (geräuchert bzw. luftgetrocknet), „Rotwein" und
  „Weißwein" fassen mehrere Rebsorten zusammen — Details je Zeile in `belege.tsv`.

## Bewusst NICHT verwendet (Lizenz)
- **Ahn-Flavor-Network** (Sci. Rep. 1:196, 2011): **CC BY-NC-SA 3.0** (NonCommercial).
- **FlavorDB / FooDB** (CC BY-**NC**), **VCF** (kostenpflichtig), **FEMA-Liste**,
  **Aroma-Wheels**, Foodpairing.com, The Flavor Bible — ausgeschlossen.

## Erweitern
Neue Belegzeile(n) in `belege.tsv` (gleiche Regeln: Primärliteratur, geöffnete URL, keine
NC-Datenbanken), fehlende Zutat/Stoff-ID in `ingr_info.tsv` / `comp_info.tsv` ergänzen,
dann `npm run foodpairing:build`. `npm run check` meldet, wenn `ingr_comp.tsv` nicht passt.
