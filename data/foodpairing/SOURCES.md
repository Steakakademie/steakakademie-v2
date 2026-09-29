# Quellen & Lizenz des Aroma-Datasets

Dieses Pairing-Dataset ist eine **eigene Kuration der Steakakademie**, keine fremde Datenbank.
Es besteht aus **Fakten** (welcher Aromastoff in welchem Lebensmittel geruchsprägend ist)
mit Einzelnachweis. Fakten sind nicht urheberrechtlich geschützt; die Kurzbelege in
`belege.tsv` sind eigene Formulierungen (max. 20 Wörter), keine Zitate. Ab R3 (29.09.2026)
steht zusätzlich je Beleg eine kurze wörtliche Belegstelle mit Quellenangabe in `zitate.tsv` —
ausschließlich als Nachweis, maschinell prüfbar mit `npm run foodpairing:zitate`.

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

## Recherche R3 (29.09.2026) — eigene Recherche mit Pflichtzitat
- Verfahren: vier Recherche-Agenten; jede Zeile mit wörtlichem Zitat aus Abstract,
  Open-Access-Volltext oder Tabelle. **Alle** 81 gelieferten Zitate automatisch gegen die frisch
  geladenen Quelltexte geprüft (PubMed, Europe PMC, Crossref, OpenAlex): 81/81 wörtlich vorhanden.
  Danach fachlich gesichtet — wörtlich richtig heißt noch nicht belastbar — und von einem
  separaten Agenten ohne Kenntnis der Recherche fachlich gegengeprüft (4 Fehler, 13 Hinweise,
  alle eingearbeitet): 41 übernommen, 40 nicht übernommen (Gründe in `ausgeschlossen.tsv`). Die übernommenen Zitate stehen in `zitate.tsv`;
  `npm run foodpairing:zitate` prüft sie jederzeit erneut (Negativtest: manipulierte Zitate,
  fremde Tabellenzeilen und fehlende Stoffnamen werden erkannt).
- **+ Röstknoblauch** (neue Zutat; Cadwallader et al. 2011, ACS Symp. Ser. 1068, GC-O mit
  Headspace-Verdünnung + AEDA, 177 °C/1,5 h): 13 Stoffe, u. a. Allylmethyltrisulfid,
  Dimethyltrisulfid, Guaiacol, Furaneol, Vanillin, (Z)/(E)-Isoeugenol.
- **+ Ahornsirup** (neue Zutat; Belford et al. 1991, Zugabeversuch + deskriptive Sensorik → B):
  Furaneol, Sotolon („sugar furanone"), Guaiacol, Vanillin.
- **Knoblauch** jetzt mit Primärstudien: Sasmaz et al. 2024 (AEDA, frisch), Wang et al. 2025
  (blanchiert; AEDA/AECA), Chen et al. 2026 (Headspace-OAV, Paste → B). **Schwarzer Knoblauch**
  + Furfurylalkohol (Sasmaz 2024). Nach der Fachprüfung gestrichen: Abe et al. 2020 (AEDA an
  einem ausgekochten SDE-Extrakt; Dithiine laut Autoren GC-Artefakte, Methional ein Erhitzungsprodukt).
- **Basilikum** +6 Stoffe (D'Alessandro et al. 2021, GC-O über drei Verdünnungsstufen, Tabelle 2 →
  B). **Pfeffer** + weißer Pfeffer (Zhang et al. 2024, relative OAV aus GC-MS mit Literaturschwellen
  → B; belegt Beteiligung, keine Rangfolge).
  **Nelke** + β-Caryophyllen (Oliveira et al. 2026, OAV-Aromaradar → B).
- CAS nachgetragen: 3-Vinyl-1,2-dithiacyclohex-4-en = 62488-52-2 (PubChem CID 525328). Nicht zu
  verwechseln mit 3-Vinyl-4H-1,2-dithiin (= …cyclohex-5-en, 62488-53-3).
- Abgelehnt u. a.: Frühlingszwiebel-/Schalottenöl (Produkte; Aldehyde teils aus dem Frittieröl),
  Wang et al. 2023 (Foods; GC-O-Geruchszuordnungen widersprechen bekannten Geruchsqualitäten),
  unbestimmte Isomere, Zhang et al. 2025 (nur Unterscheidungsmarker).
- Stand danach: **75 Zutaten · 208 Stoffe · 623 Kanten · 646 Belege.**

## Nachtrag Pfeffer (29.09.2026, Quelle von Uwe)
- **Pfeffer, schwarz: +11 Belege** aus der Dissertation Dawid 2012 (TU München, Lehrstuhl Hofmann;
  frei auf mediaTUM: https://mediatum.ub.tum.de/doc/1096439/1096439.pdf, S. 35). Sie zitiert die
  Omissionsversuche von Jagella & Grosch 1999: α- und β-Pinen, Myrcen, α-Phellandren, Limonen,
  Linalool, Methylpropanal, 2- und 3-Methylbutanal, Buttersäure, 3-Methylbuttersäure sind die
  wertgebenden flüchtigen Stoffe des schwarzen Pfeffers. **Evidenz B** (Sekundärzitat; die
  Primärarbeit bleibt über keine API abrufbar). Zitat maschinell gegen das PDF geprüft.
- Die Dissertation selbst behandelt vor allem Geschmacks- und Schärfestoffe (nicht flüchtig) —
  für ein Aroma-Netz nur über dieses Literaturkapitel nutzbar.
- Stand danach: **75 Zutaten · 208 Stoffe · 630 Kanten · 657 Belege.**

## Nachtrag Granvogl-Arbeiten (29.09.2026, Hinweis von Uwe)
Aus der Publikationsliste von M. Granvogl (J. Agric. Food Chem.) drei Sensomics-Studien — jeweils
AEDA, Mengenbestimmung per Isotopenverdünnung (SIDA), OAV und Rekombination → **Evidenz A**:
- **Kakao + dunkle Schokolade** (Seyfried & Granvogl 2019, 90 % und 99 % Kakao): Dimethyltrisulfid,
  Essigsäure, Guaiacol, 3-Methylbuttersäure, Phenylessigsäure, Vanillin, Linalool.
- **Bier + Weißbier** (Langos et al. 2013): β-Damascenon, 3-Methylbutylacetat, Ethyl-2-methylpropanoat,
  Ethylbutanoat, Acetaldehyd, 3-Methyl-1-butanol, Dimethylsulfid, 4-Vinylguaiacol, 2-Phenylethanol.
- **+ Rum** (neue Zutat; Franitza et al. 2016, zwei Arbeiten): Vanillin, Ethyl-2-methylbutanoat,
  β-Damascenon, 2,3-Butandion, 3-Methylbutanal, Ethylbutanoat; aus der Fassreifung 4-Ethylphenol,
  Guaiacol, 4-Ethylguaiacol, 4-Propylguaiacol (OAV ≥ 1).
- Gesichtet, nicht übernommen: Birne (Abstract nennt nur Mengen, keine Geruchsbewertung),
  Kartoffelchips (nur ausgewählte Stoffe, Schwerpunkt Schadstoffe), Lakritz, Hopfen, Tee,
  Toona (für eine Grill-Seite ohne Nutzen), Olivenöl-Fehlaromen (Fehlgerüche).
- Stand danach: **76 Zutaten · 211 Stoffe · 649 Kanten · 685 Belege**; 80/80 Zitate bestätigt.

## Bekannte Lücken (ehrlich)
- Nicht belegbar gefunden: **Oregano** (nur Übersicht zu ätherischen Ölen), **Wacholderbeere,
  Schnittlauch, Bärlauch, Schalotte, Frühlingszwiebel** (keine Olfaktometrie-/AEDA-/OAV-Studie
  an der Zutat selbst, bzw. nur Öl-Produkte), **frische Feige, gebratener westlicher Bacon,
  Tomatenmark.** (Teils existieren Studien, deren Abstract keine Einzelstoffe nennt oder die nicht
  abrufbar waren.)
- **Lauch geparkt:** 3 Stoffe belegt (Nielsen & Poll 2004, GC-O), aber kein Hub-Stoff — die
  Build-Regel „jede Zutat dockt an einen Hub an" lässt ihn (noch) nicht zu.
- Dünn belegt: Nelke (2 Stoffe), Räucherlachs (1), Hirsch (nur Headspace-OAV). Pfeffer: die
  Primärarbeit Jagella & Grosch 1999 ist nur als Sekundärzitat (Dawid 2012) belegt.
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
Zu jedem neuen Beleg gehört eine Zeile in `zitate.tsv` (wörtliche Belegstelle, `stoff_im_zitat`
so geschrieben wie im Zitat). Externe Lieferungen im selben Format vorab prüfen:
`npm run foodpairing:zitate -- --datei lieferung.tsv` (braucht Netz, läuft daher nicht in `check`).
