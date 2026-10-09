# Mail-Entwürfe — Geschenkgutscheine Weihnachten 2026

Stand 09.10.2026. Entwürfe von Claude zum Gutschein-Konzept
(`docs/gutschein-konzept-weihnachten-2026.md`, Abschnitt „Sichtbarkeit": zwei
Mails an die Liste des Wissens-Briefs). **Versand nur durch Uwe** in Loops
(CLAUDE.md §2 Regel 4). Social-Gegenstück: `docs/social-gutscheine-weihnachten-2026.md`.

## Vor dem Versand prüfen

1. **Gutscheine kaufbar** (Karten auf `/gutschein` zeigen „Verschenken"),
   Testkauf durchgelaufen.
2. **Ratgeber veröffentlicht** — Mail 1 verlinkt
   `/artikel/geschenke-fuer-grillfans`.
3. **Empfänger nur mit passender Einwilligung.** Die Mails bewerben eigene
   Produkte. Gedeckt ist das von der Einwilligungsfassung `2026-08-28-v2`
   („… Produktempfehlungen und Werbung rund um Grill-, BBQ- und
   Küchenprodukte …", `src/lib/newsletter-consent.ts`). Die Fassung
   `2026-08-28-v1` nannte nur den Wissens-Brief, ohne Werbung. In Loops daher
   ein Segment über die Kontakt-Eigenschaften, die
   `src/app/api/newsletter/confirm/route.ts` setzt: **`doiConfirmedAt` gesetzt
   UND `consentVersion` = `2026-08-28-v2`**. Kontakte ohne Version oder mit v1 bekommen diese Mails
   nicht. Ob das so trägt, gehört auf die Kanzlei-Liste (#107).
4. **Fußzeile:** Abmeldelink und Impressum-Angaben kommen aus der
   Loops-Vorlage — einmal in der Vorschau nachsehen.
5. **Kennzeichnung:** Werbung muss als solche erkennbar sein (§ 6 Abs. 1 DDG).
   Beide Entwürfe sagen im ersten Satz, dass es um Gutscheine geht, und der
   Betreff verspricht nichts anderes, als drinsteht.

## Zeitplan

| Mail | Versand (Vorschlag) | Thema |
|---|---|---|
| 1 | Di 24.11., 18 Uhr | Geschenke für Grillfans — Ratgeber und Gutscheine |
| 2 | Fr 18.12., 18 Uhr | Last Minute — Code per E-Mail |

Mail 1 bewusst vor dem Black Friday (27.11.), wenn die Postfächer voll
werden. Mail 2 nach dem Stichtag vieler Paketdienste, an dem Last-Minute-Käufer
anfangen zu suchen.

---

## Mail 1 — Geschenke für Grillfans

**Betreff (A):** Was Griller sich wirklich wünschen
**Betreff (B):** Ein Grillgeschenk, das nicht im Schrank landet
**Preheader:** Nach Erfahrung sortiert — und Gutscheine für alle, die schon alles haben.

---

Hallo {{firstName | default: "du"}},

heute geht es ausnahmsweise nicht um Kerntemperaturen, sondern um
Weihnachten — und um unsere neuen Geschenkgutscheine.

Jedes Jahr wandern Grillschürzen mit Sprüchen und Spießsets unter den Baum.
Im Juli liegen sie im Schrank. Ein gutes Grillgeschenk erkennst du an einer
einzigen Frage: **Macht es beim nächsten Grillen einen Unterschied?**

Wir haben das in einem Ratgeber sortiert — nicht nach Preis, sondern danach,
wo die beschenkte Person gerade steht:

- **Einsteiger:** Messen statt raten. Ein ordentliches Einstichthermometer
  bringt mehr als jedes Gadget.
- **Fortgeschrittene:** Werkzeug für den nächsten Schritt — Messer,
  Oberhitze, Reifung.
- **Wer schon alles hat:** Wissen statt Ware.

**[Zum Ratgeber „Geschenke für Grillfans"](https://steakakademie.de/artikel/geschenke-fuer-grillfans)**

Für die letzte Gruppe gibt es jetzt unsere Gutscheine:

- **Steak-Beichte, 7 €** — eine Diagnose für genau das Steak, das nicht so
  wurde wie geplant. Passt auch zum Wichteln.
- **Steak-Beichte 5er, 25 €** — für alle, die oft am Grill stehen.
- **Mein Protokoll, 19 €** — ein persönlicher Plan über acht Wochen.

Der Code kommt per E-Mail, dazu eine Geschenkseite zum Ausdrucken.

**[Alle Gutscheine ansehen](https://steakakademie.de/gutschein)**

Nächste Woche geht es wieder ums Grillen. Versprochen.

Marco
*für die Steakakademie*

---

## Mail 2 — Last Minute

**Betreff (A):** Kein Paket mehr? Dann eben per E-Mail.
**Betreff (B):** Das Grillgeschenk, das noch rechtzeitig ankommt
**Preheader:** Gutschein-Code per E-Mail, Geschenkseite zum Ausdrucken.

---

Hallo {{firstName | default: "du"}},

eine kurze Mail, falls dir noch ein Geschenk für jemanden fehlt, der gern
grillt: Unsere Gutscheine brauchen keinen Paketdienst.

Du bekommst den Code per E-Mail, dazu eine Geschenkseite zum Ausdrucken —
falten, in eine Karte legen, fertig. Das klappt auch noch am 24.12.

- **Steak-Beichte, 7 €** — eine Diagnose für ein misslungenes Steak
- **Steak-Beichte 5er, 25 €** — fünf Diagnosen für Vielgriller
- **Mein Protokoll, 19 €** — acht Wochen persönlicher Grillplan

**[Gutschein aussuchen](https://steakakademie.de/gutschein)**

Eingelöst wird mit einem kostenlosen Konto auf steakakademie.de. Gültig ist
jeder Gutschein bis zum 31. Dezember 2029.

Frohe Feiertage — und eine gute Glut im neuen Jahr.

Marco
*für die Steakakademie*

---

## Anpassen, falls sich bis dahin etwas ändert

- **Grillmeister-Diplom kaufbar?** Dann in beiden Mails als vierten Gutschein
  aufnehmen, mit dem dann gültigen Preis.
- **Wertgutscheine (25/50/75/100 €) kaufbar** (T9)? Dann in Mail 2 ergänzen:
  „Oder ein fester Betrag — die beschenkte Person sucht selbst aus."
- **Gültigkeit:** „bis zum 31. Dezember 2029" stimmt für jeden 2026 gekauften
  Gutschein (Migration `20261009170345`). Für Mails ab 2027 Jahr anpassen.
- **Absender Marco:** KI-Persona. Ob die Mail-Vorlage den Hinweis
  „KI-Persona · fachlich verantwortet von Uwe Yendell" trägt wie die
  Persona-Seiten, bitte in der Loops-Vorlage prüfen (CLAUDE.md §2, Personas).
  Sonst als Absender „Die Steakakademie" nehmen.

## Messen

Loops: Öffnungs- und Klickrate je Mail, Abmeldungen. `vouchers`: Gutscheine
in den 48 Stunden nach dem Versand gegenüber den 48 Stunden davor.
