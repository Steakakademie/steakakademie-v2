# Montreal Smoked Meat: Pökeln — Entscheidungsvorlage (05.10.2026, korrigiert)

> **Status: Entwurf. Am Rezept ist davon nichts umgesetzt.**
> Korrektur gegenüber der ersten Fassung (#331): Die erste Fassung verwechselte Natriumnitrit
> und Nitrit-Ion und nannte deshalb „16 g Pökelsalz je kg" als Obergrenze. Richtig sind
> **24 g je kg** (siehe 3.2). Der Vergleich mit Serious Eats lag bei „Drei- bis Vierfachen"
> statt etwa dem Zwei- bis Zweieinhalbfachen. Der Vorschlag „Option A mit festen Mengen"
> entfällt (siehe 4).
> Nitrit ist giftig. Zahlen unten sind Rechnungen mit ausgewiesenen Annahmen, keine geprüften Dosierungen.

Rezept: `content/rezepte/montreal-smoked-meat.mdx` (Folge von #320, #323, #330).

## 1. Grundsatz (Uwe, 05.10.2026)

Pökelrezepte sind keine Festwerte. Salz, Zucker, Gewürze und Zeit richten sich nach Stück,
Wurstware und gewünschtem Geschmacksgrad; „genau so" gibt es nicht. **Fest ist nur die
Sicherheitsgrenze beim Nitrit.** Das Rezept soll deshalb Spannen je kg nennen, nicht eine
Einzelmenge für ein 2-kg-Stück.

## 2. Quellenlage (was die Cowork-Rohdaten tatsächlich enthalten)

Geprüft: `Rezept-Rohdaten/pruefprotokoll.md`, `rohdaten.jsonl`, `richtwerte-poekeln-lake-injektion-raeuchern.md`.

- Ein Montreal-Rezept mit Mengen steht dort **nicht**. Die Seite `schlachten-und-wursten-wie-damals-bei-opa.de`
  kommt in den 31 Einträgen nicht vor; die Detailseiten sind nur mit Login lesbar und wurden nicht geöffnet.
- Die Praxisquellen im Protokoll (Nr. 19–21) sind Hobby- und Händler-Ratgeber mit Belegstufe
  „niedrig-mittel" und liegen bei etwa 20–21 g Nitritpökelsalz je kg im Vakuum. Das ist kein
  Metzger-Standard, den man übernehmen könnte.
- Die Richtwerte (Lake 3–10 %, Zucker 20–40 % der Salzmenge, Gleichgewichtslake, Nitritpökelsalz
  höchstens 24 g/kg) stammen aus deinem Dokument und dem Artikel „Pökeln, Lake, Räuchern — die Zahlen".
  Die Spannen unten leiten sich daraus ab.

Externe Quellen zu Montreal (alle Trockenpökeln, 7–8 Tage): Serious Eats, Glebe Kitchen, Tourisme Montréal,
Taste of Canada. Nasspökeln kommt nur in Leserkommentaren vor.

## 3. Rechnung

### 3.1 Zwei Salze nicht verwechseln

| | Nitritgehalt |
|---|---|
| Prague Powder #1 (US-Rezepte) | 6,25 % Natriumnitrit |
| Nitritpökelsalz (Deutschland) | höchstens 0,5 % |

Zwölffacher Unterschied. US-Mengen mit deutschem Salz nachbauen gibt viel zu wenig Nitrit, umgekehrt viel zu viel.

### 3.2 Grenzwert (korrigiert)

Die EU-Grenze von **80 mg/kg** (VO (EU) 2023/2108, ab 9. Oktober 2025) gilt als **Nitrit-Ion**.
Natriumnitrit (NaNO₂) enthält 69 % Ion. Bei 0,5 % Natriumnitrit im Pökelsalz bringt 1 g Pökelsalz
5 mg NaNO₂ = 3,33 mg Ion. Obergrenze: 80 / 3,33 = **24 g Pökelsalz je kg Fleisch**
(bei 0,4 %: 30 g/kg). Das deckt sich mit Artikel und Glossar. Ausnahmen für traditionelle Erzeugnisse
und die Anwendung auf den Privatgebrauch sind nicht nachgelesen.

### 3.3 Serious Eats (korrigiert)

22 g Prague Powder #1 = 1.375 mg NaNO₂ = rund 950 mg Ion auf 4,5–5,4 kg, also etwa 175–210 mg/kg.
Das ist das Zwei- bis Zweieinhalbfache der EU-Grenze. US-Mengen sind nicht übertragbar.

### 3.4 Jetziges Rezept (Lake, 2 kg)

15 g Pökelsalz auf 2 kg = 7,5 g/kg, also nur etwa ein Drittel der erlaubten Menge. Nach Gleichgewicht
(Annahme: Fleisch 70–75 % Wasser, gleichmäßige Verteilung) kommen im Fleisch rund 15–25 mg Ion/kg an,
bei rund 2,8 % Salz. Das ist keine Überschreitung, aber deutlich weniger Nitrit als die Praxisquellen
(20 g/kg ≈ 67 mg). Ob die Umrötung dabei zuverlässig gelingt, ist offen.

## 4. Vorschlag: Spannen statt Festwerte

Nicht „Option A mit festen Mengen für 2 kg". Stattdessen bleibt das Verfahren (Lake oder trocken) im
Rezept und die Mengen werden je kg als Spanne angegeben:

| Größe | Spanne je kg Fleisch | Art |
|---|---|---|
| Nitritpökelsalz (0,5 %) | bis höchstens 24 g | **hart**, Sicherheitsgrenze |
| Gesamtsalz im Fleisch | etwa 2–3 % | Geschmack |
| Zucker | 20–40 % der Salzmenge | Geschmack |
| Lake (falls Lake) | 3–10 %, Gleichgewichtsrechnung | Geschmack/Methode |
| Zeit | nach Dicke, nicht nach Gewicht | Methode |

Die Zahlen in der Tabelle sind aus deinen Richtwerten übernommen, nicht neu geprüft.
Ein Rechenhilfsmittel (Fleisch in g → Pökelsalz, Kochsalz, Zucker) ist die naheliegende Form
(vgl. Prüfprotokoll Nr. 18: Vorlage für einen eigenen Rechner).

## 5. Offen

- Welches Verfahren das Montreal-Rezept zeigen soll (Lake oder trocken). Fließtext („Trockenpökeln",
  „4–5 kg Flat") und Zutaten (Lake, 2 kg) widersprechen sich weiterhin.
- Räucherzeit 6 h (Quellen 6–10 h), Schnittstärke (0,5–0,7 cm gegen 3–4 mm), `cookTime` PT18H: siehe #330.
- „Salz diffundiert etwa 1 cm pro Tag", „Flat 8–10 cm dick": keine Quelle.
- Nitritgehalt des konkret verwendeten Produkts steht auf der Packung; weicht er von 0,5 % ab, ändert sich die Obergrenze.

## Quellen

- Pökeln / Nitritpökelsalz, Wikipedia: https://de.wikipedia.org/wiki/Nitritp%C3%B6kelsalz
- VO (EU) 2023/2108 (Auszug): https://eur-lex.europa.eu/legal-content/DE/TXT/PDF/?uri=OJ:L_202302108
- CVUA Stuttgart: https://www.ua-bw.de/pub/beitrag.asp?subid=1&ID=1878
- Serious Eats: https://www.seriouseats.com/montreal-smoked-meat-recipe
- Glebe Kitchen: https://glebekitchen.com/montreal-smoked-meat/
- Tourisme Montréal: https://www.mtl.org/en/experience/guide-to-montreal-smoked-meat
- Meatwave: https://meatwave.com/recipes/montreal-smoked-meat-recipe

## Nicht geprüft

- Wortlaut und Ausnahmen der VO 2023/2108, Anwendung auf den Privatgebrauch.
- Ob die Spannen aus 4 für Umrötung und Keimhemmung bei Brisket ausreichen.
- Die Nitritwerte im Fleisch aus 3.4 (Überschlag mit Annahmen).
- Der Inhalt der Quelle `schlachten-und-wursten-wie-damals-bei-opa.de`.
