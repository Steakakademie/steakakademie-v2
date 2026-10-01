# AVV-Nachweis: Gelato als Auftragsverarbeiter

**Geprüft am:** 10.09.2026
**Anlass:** Offener Punkt aus der Urkunden-Übergabe (Diplom-System) — AVV mit dem
Druckdienstleister fehlte als Voraussetzung, um Kundenadressen für den Versand
gedruckter Urkunden automatisiert an Gelato zu übertragen.

## Vertragspartner (ergänzt 01.10.2026)

**Gelato ASA**, Dronning Eufemias Gate 8, 0191 Oslo, Norwegen (EWR).

Wörtlich aus den Gelato API Terms, Abschnitt Definitionen (Last Updated Date:
2 June 2025, abgerufen 01.10.2026):

> "Gelato (or we): Gelato ASA, Norwegian company having its principal place of
> business at Dronning Eufemias Gate 8, 0191 Oslo, Norway."

Dieselbe Anschrift nennen die API Terms als Zustelladresse für Mitteilungen.
Eine Organisationsnummer steht weder in den API Terms noch in den Data
Processing Terms.

**Offen für die Rechtsprüfung:** Die Data Processing Terms (Last Updated Date:
29 November 2024) führen 91 Druckpartner als Unterauftragsverarbeiter weltweit,
u. a. in Drittländern, und verweisen dafür auf die EU-Standardvertragsklauseln.
Welcher Partner eine Bestellung aus Deutschland druckt, ist dort nicht
festgelegt. Ob Datenschutz 10e die Unterauftragsverarbeiter bzw. mögliche
Drittlandübermittlungen nennen muss, ist nicht geklärt.

## Befund

Gelato verlangt **keine separat unterschriebene AVV-Datei**. Der Auftragsverarbeitungsvertrag
("Data Processing Terms") ist vertraglich in die Nutzungsbedingungen der Services
integriert und gilt automatisch, sobald Gelato im Auftrag des Kunden (hier: der
Steakakademie) personenbezogene Daten von dessen Endkunden verarbeitet — z. B.
Lieferadressen bei einer Bestellung über die API.

### Wörtliches Zitat — Gelato API Terms, Clause 21 ("Privacy")

> "Where you access the Services to fulfil Orders of the End Customers, we process
> personal data received by us in connection with the Orders and/or the Services,
> as processor under the direction and responsibility of you, and our Data
> Processing Terms applies."

Quelle: https://www.gelato.com/legal/api-terms (Stand 10.09.2026)

### Ergänzend — Gelato Data Processing Terms, Abschnitt 1.2

> "These Data Processing Terms supersede any prior agreements and provisions
> between the parties concerning the processing of personal data under the
> Terms or Agreement."

Die Data Processing Terms regeln die Verarbeitung "under the Terms or Agreement
concerning the Services provided by Gelato" — sie sind also Bestandteil des
Hauptvertrags, den man mit der Nutzung der Gelato-Services automatisch eingeht,
nicht ein separat zu unterzeichnendes Dokument.

Quelle: https://www.gelato.com/legal/data-processing-terms (Stand 10.09.2026)

## Bewertung

Damit ist die datenschutzrechtliche Voraussetzung (Art. 28 DSGVO — schriftlicher
Auftragsverarbeitungsvertrag) für die Übermittlung von Kundenadressen an Gelato
im Rahmen der automatisierten Urkunden-Bestellung erfüllt, sofern ein reguläres
Gelato-Konto/API-Zugang unter diesen Bedingungen besteht. Eine zusätzliche
Unterschrift oder ein gesonderter Antrag ist nicht erforderlich.

**Vorbehalt:** Diese Bewertung beruht auf den öffentlich abrufbaren Rechtstexten
zum Prüfzeitpunkt. Rechtstexte können sich ändern — bei einer erneuten Prüfung
vor produktivem Rollout der Automatisierung sollte der aktuelle Stand der
Data Processing Terms gegen dieses Dokument abgeglichen werden. Keine Rechtsberatung.

## Offene Punkte (unverändert aus der Urkunden-Übergabe)

- Echte Nummernvergabe (Zähler-Logik für `SA-2026-000X`) — noch zu klären.
- Fehlender Rechtshinweis auf dem gedruckten Blatt — noch zu übertragen aus der
  digitalen Vorschau (`DIPLOM_HINWEIS`, siehe `src/lib/diplome/stufen.ts`).
- Wie der Dienstleister (Gelato) Aufträge programmatisch annimmt (API-Anbindung,
  Auth) — noch zu spezifizieren.
