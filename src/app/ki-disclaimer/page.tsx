import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'KI-Disclaimer — Hinweise zu KI-Assistenten',
  description:
    'Rechtliche Hinweise zu den KI-Assistenten der Steakakademie. Leistungsumfang, Datenschutz, EU AI Act Konformität.',
  alternates: { canonical: 'https://steakakademie.de/ki-disclaimer' },
  robots: { index: true, follow: true },
};

export default function KiDisclaimerPage() {
  const linkClass = 'text-brand-fire hover:underline';
  const h2Class =
    'font-sans text-sm font-bold tracking-[0.12em] uppercase text-text-primary mb-3';

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-base">
        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14">

          <nav
            className="flex items-center gap-1.5 text-xs font-sans text-text-muted mb-8"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-brand-gold transition-colors">
              Start
            </Link>
            <ChevronRight size={12} />
            <span>KI-Disclaimer</span>
          </nav>

          <h1 className="font-serif text-3xl font-bold text-text-primary mb-2">
            KI-Systeme &amp; KI-Disclaimer
          </h1>
          <p className="text-sm font-sans text-text-muted mb-10">Stand: Oktober 2026</p>

          <div className="max-w-content space-y-10 font-body text-text-secondary leading-relaxed">

            {/* Section 1 */}
            <section>
              <h2 className={h2Class}>1. Unsere KI-Assistenten</h2>
              <p className="mb-4">
                Auf Steakakademie.de setzen wir KI-gestützte Assistenzsysteme ein, um dir
                kompetente Grillberatung anzubieten. Die folgende Tabelle gibt einen
                Überblick über die eingesetzten Systeme:
              </p>
              {/* Abgleich Text ↔ Technik 03.10.2026. Marco stand hier als „Claude Haiku
                  (Anthropic PBC)" — der Chat läuft über Google Gemini
                  (src/app/api/marco/route.ts). Ergänzt: Rezept-Schmiede
                  (/api/kochwissen/generieren, Claude Sonnet + Voyage AI). Modellnamen ohne
                  Versionsnummer, weil Marcos Modell per Umgebungsvariable wechselbar ist.
                  Nicht aufgenommen: die Wissenssuche (/api/kochwissen) — der Endpunkt
                  existiert, aber keine Oberfläche ruft ihn auf; und der englischsprachige
                  „Niche Validator" (/tools/niche-validator) — Rest eines Fremdprojekts,
                  Entscheidung offen. */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-white/10">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="px-4 py-2 text-left font-sans font-bold text-text-primary">
                        Assistent
                      </th>
                      <th className="px-4 py-2 text-left font-sans font-bold text-text-primary">
                        Technische Basis
                      </th>
                      <th className="px-4 py-2 text-left font-sans font-bold text-text-primary">
                        Verarbeitungszweck
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/5">
                      <td className="px-4 py-3">
                        <span className="font-semibold text-text-primary">
                          Marco „Der Meister&quot;
                        </span>
                      </td>
                      <td className="px-4 py-3">Gemini (Google)</td>
                      <td className="px-4 py-3">
                        Grillberatung im Chat für angemeldete Nutzer: Cuts, Temperaturen, Techniken,
                        Kaufempfehlungen sowie die Einschätzung von Fotos, die du anhängst
                      </td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="px-4 py-3">
                        <span className="font-semibold text-text-primary">
                          Rezept-Prüfung &amp; Bild
                        </span>
                      </td>
                      <td className="px-4 py-3">Claude (Anthropic PBC) · FLUX (fal.ai)</td>
                      <td className="px-4 py-3">
                        Automatisierte Vorprüfung eingereichter Community-Rezepte (veröffentlicht
                        wird erst nach Freigabe durch einen Menschen) und Erzeugung von
                        KI-Symbolbildern
                      </td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="px-4 py-3">
                        <span className="font-semibold text-text-primary">Mein Protokoll</span>
                      </td>
                      <td className="px-4 py-3">Claude Sonnet (Anthropic PBC)</td>
                      <td className="px-4 py-3">
                        Persönlicher 8-Wochen-Grillplan aus deinen Fragebogen-Antworten. Kerntemperaturen
                        werden nach der Erzeugung maschinell gegen die Referenz der Steakakademie geprüft
                      </td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="px-4 py-3">
                        <span className="font-semibold text-text-primary">Steak-Beichte</span>
                      </td>
                      <td className="px-4 py-3">Claude Sonnet (Anthropic PBC)</td>
                      <td className="px-4 py-3">
                        Diagnose von Grillfehlern aus deiner Beschreibung und einem optionalen Foto
                      </td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="px-4 py-3">
                        <span className="font-semibold text-text-primary">Rezept-Schmiede</span>
                      </td>
                      <td className="px-4 py-3">Claude Sonnet (Anthropic PBC) · Voyage AI</td>
                      <td className="px-4 py-3">
                        Erstellt für angemeldete Nutzer auf deinen Auftrag hin ein Rezept aus den
                        Einträgen unserer Wissensdatenbank. Voyage AI sucht die passenden Einträge,
                        das Sprachmodell formuliert daraus den Text
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-xs text-text-muted">
                Marco ist eine KI-gesteuerte Persona — kein menschlicher Berater.
                Alle Antworten werden in Echtzeit durch das KI-Modell generiert und
                können inhaltliche Fehler enthalten. Das gilt auch für unsere redaktionellen
                Personas Marco, Jonas und Elena: Artikel unter ihren Namen entstehen
                KI-unterstützt und werden fachlich geprüft und verantwortet von
                Gründer Uwe Yendell.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className={h2Class}>2. EU AI Act Konformität</h2>
              <p className="mb-4">
                Die Europäische Union hat mit dem{' '}
                <abbr title="Verordnung (EU) 2024/1689 über Künstliche Intelligenz">
                  EU AI Act
                </abbr>{' '}
                (in Kraft seit August 2024) verbindliche Anforderungen für KI-Systeme
                eingeführt. Steakakademie.de erfüllt die relevanten Anforderungen wie folgt:
              </p>
              <ul className="space-y-3 mb-4">
                <li className="flex gap-3">
                  <span className="shrink-0 text-green-400 font-bold">✅</span>
                  <div>
                    <span className="font-semibold text-text-primary">
                      Art. 50 Abs. 1 EU AI Act — Transparenzpflicht (Interaktion):
                    </span>{' '}
                    Nutzer werden deutlich darauf hingewiesen, dass sie mit einem
                    KI-System interagieren. Das Chat-Widget kennzeichnet Marco an der
                    Schaltfläche („KI&quot;) und im Chatfenster ausdrücklich als KI-Assistenten.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 text-green-400 font-bold">✅</span>
                  <div>
                    <span className="font-semibold text-text-primary">
                      Art. 50 Abs. 4 EU AI Act — Sichtbare Kennzeichnung KI-erzeugter Inhalte (Deployer-Pflicht):
                    </span>{' '}
                    Die meisten Bilder zu unseren Rezepten, ein Teil der Bilder zu Artikeln und
                    Streitfällen, einzelne Bilder zu Fleischzuschnitten sowie alle Bilder zu
                    Community-Rezepten sind mit KI erzeugt oder mit KI bearbeitet (FLUX und Nano Banana über fal.ai, vereinzelt Google
                    Gemini). Sie sind am Bild sichtbar als „KI-Symbolbild&quot; bzw. „KI-Bild&quot;
                    gekennzeichnet und können vom tatsächlichen Gericht abweichen. Die Transparenzpflicht nach Art. 50 Abs. 4 gilt ab dem
                    2. August 2026; wir setzen die Kennzeichnung bereits jetzt um.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 text-yellow-400 font-bold">⚠</span>
                  <div>
                    <span className="font-semibold text-text-primary">
                      Art. 50 Abs. 2 EU AI Act — Maschinenlesbare Kennzeichnung (Provider-Pflicht, Frist 02.12.2026):
                    </span>{' '}
                    Die Pflicht zur maschinenlesbaren Einbettung von Content Credentials (z.&nbsp;B.
                    C2PA-Metadaten) in KI-generierte Bilder liegt beim <em>Anbieter</em> des
                    KI-Systems — hier fal.ai als Betreiber des FLUX-Bildgenerators. Die Frist
                    wurde durch die Digital-Omnibus-VO (EU) 2026/1744 (in Kraft 27.07.2026)
                    für vor dem 02.08.2026 in Verkehr gebrachte Systeme auf{' '}
                    <strong className="text-text-primary">02.12.2026</strong> verlängert. Als{' '}
                    <em>Deployer</em> haben wir fal.ai zu dieser Anforderung kontaktiert und
                    fordern vertraglich konforme Umsetzung ein. Bis zur bestätigten Lieferung
                    von Content Credentials durch fal.ai kompensieren wir durch die sichtbare
                    Kennzeichnung nach Art. 50 Abs. 4 und dokumentieren den Sachverhalt hier
                    transparent.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 text-green-400 font-bold">✅</span>
                  <div>
                    <span className="font-semibold text-text-primary">
                      Risikoklasse — Niedriges Risiko:
                    </span>{' '}
                    Das eingesetzte KI-System fällt nicht unter die Hochrisiko-KI-Systeme
                    gemäß Art. 6 EU AI Act (Anhang III). Es handelt sich um ein
                    allgemeines Informationsassistenz-System ohne Entscheidungsrelevanz
                    in sensiblen Bereichen.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 text-green-400 font-bold">✅</span>
                  <div>
                    <span className="font-semibold text-text-primary">
                      Einsatzzweck:
                    </span>{' '}
                    Informationsassistenz im Bereich Grillen und BBQ. Kein automatisierter
                    Entscheidungsprozess, keine Verarbeitung besonderer Datenkategorien
                    (Art. 9 DSGVO), keine Auswirkungen auf Rechte oder rechtliche
                    Positionen von Personen.
                  </div>
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className={h2Class}>3. Grenzen &amp; Haftungsausschluss</h2>
              <p className="mb-4">
                KI-Antworten von Marco sind ausdrücklich <strong className="text-text-primary">keine</strong>:
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li>
                  <strong className="text-text-primary">Rechtsberatung</strong> im Sinne
                  des Rechtsdienstleistungsgesetzes (§ 2 RDG) — bei rechtlichen Fragen
                  wende dich an einen zugelassenen Rechtsanwalt.
                </li>
                <li>
                  <strong className="text-text-primary">Steuerberatung</strong> im Sinne
                  des Steuerberatungsgesetzes (§ 3 StBerG) — bei steuerlichen Fragen
                  wende dich an einen Steuerberater oder das zuständige Finanzamt.
                </li>
                <li>
                  <strong className="text-text-primary">Gesundheits- oder
                  Ernährungsberatung</strong> — Informationen über Garstufen und
                  Temperaturen ersetzen keine medizinische oder ernährungswissenschaftliche
                  Beratung, insbesondere bei Vorerkrankungen oder besonderen
                  Risikogruppen.
                </li>
                <li>
                  <strong className="text-text-primary">Lebensmittelsicherheits-Garantie</strong> —
                  Angaben zu Garzeiten, Kerntemperaturen oder Hygiene dienen der
                  Orientierung. Die Einhaltung der geltenden Lebensmittelhygiene-Vorschriften
                  liegt in der Verantwortung des Nutzers.
                </li>
              </ul>
              <p className="text-sm">
                KI-generierte Antworten können inhaltliche Fehler, Ungenauigkeiten oder
                veraltete Informationen enthalten. Alle Empfehlungen müssen eigenverantwortlich
                geprüft werden. Steakakademie.de übernimmt keine Haftung für Schäden, die
                aus der Nutzung von KI-Antworten entstehen.
              </p>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className={h2Class}>4. Datenschutz bei KI-Nutzung</h2>
              <p className="mb-4">
                Bei der Nutzung des Chat-Assistenten Marco werden folgende
                datenschutzrelevante Verarbeitungen vorgenommen:
              </p>
              {/* Abgleich Text ↔ Technik 03.10.2026 (src/app/api/marco/route.ts,
                  src/components/ai/MarcoWidget.tsx): Empfänger ist Google (Gemini), nicht
                  Anthropic; übermittelt werden Verlauf UND Fotos; der Chat verlangt ein
                  angemeldetes Konto.
                  ENTFERNT, weil für den falschen Empfänger geschrieben: „Datenübermittlung
                  an Anthropic (USA) … EU-Standardvertragsklauseln" und der Punkt
                  „Auftragsverarbeitung: … DPA mit Anthropic geschlossen. Keine Weitergabe an
                  weitere Dritte." */}
              <ul className="space-y-3 mb-4">
                <li className="flex gap-3">
                  <span className="shrink-0 font-bold text-brand-gold">→</span>
                  <div>
                    <span className="font-semibold text-text-primary">
                      Datenübermittlung an Google:
                    </span>{' '}
                    Deine Chat-Nachrichten, mit jeder neuen Nachricht der bisherige Verlauf der
                    laufenden Unterhaltung sowie Fotos, die du anhängst, werden zur KI-Verarbeitung
                    an Google übertragen (KI-Modell „Gemini&quot;; Google Ireland Limited, Gordon
                    House, Barrow Street, Dublin 4, Irland; ggf. Google LLC, 1600 Amphitheatre
                    Parkway, Mountain View, CA 94043, USA).
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 font-bold text-brand-gold">→</span>
                  <div>
                    <span className="font-semibold text-text-primary">
                      Nur für angemeldete Nutzer:
                    </span>{' '}
                    Der Chat setzt ein Nutzerkonto voraus; dein Konto wird bei jeder Anfrage
                    geprüft, um den Zugang zu gewähren.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 font-bold text-brand-gold">→</span>
                  <div>
                    <span className="font-semibold text-text-primary">
                      Keine serverseitige Speicherung:
                    </span>{' '}
                    Chat-Verläufe und Fotos werden nicht auf Servern von Steakakademie.de
                    gespeichert. Nach dem Neuladen oder Schließen der Seite sind Chat-Inhalte
                    nicht mehr abrufbar.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 font-bold text-brand-gold">→</span>
                  <div>
                    <span className="font-semibold text-text-primary">
                      Keine Speicherung im Konto:
                    </span>{' '}
                    Chat-Eingaben werden nicht in deinem Nutzerkonto gespeichert, und Kontodaten
                    wie deine E-Mail-Adresse werden nicht an das KI-Modell übermittelt.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 font-bold text-brand-gold">→</span>
                  <div>
                    <span className="font-semibold text-text-primary">
                      Rechtsgrundlage:
                    </span>{' '}
                    Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse: Bereitstellung
                    des Beratungsdienstes und Verbesserung des Serviceangebots).
                  </div>
                </li>
              </ul>
              <p className="text-sm mb-3">
                Die übrigen KI-Funktionen aus der Tabelle oben übermitteln deine Eingaben an
                Anthropic PBC (Rezept-Prüfung, Mein Protokoll, Steak-Beichte, Rezept-Schmiede), an
                Voyage AI (Rezept-Schmiede) und an fal.ai (Bild zu einem Community-Rezept). Was
                dabei jeweils übermittelt wird, steht in der{' '}
                <Link href="/datenschutz" className={linkClass}>
                  Datenschutzerklärung
                </Link>{' '}
                (Abschnitte 10a bis 10c und 11a).
              </p>
              <p className="text-sm">
                Wir empfehlen, keine sensiblen personenbezogenen Daten (Name, Adresse,
                Gesundheitsdaten, Bankdaten) in den Chat einzugeben und keine Fotos anzuhängen,
                auf denen Personen zu erkennen sind. Vollständige
                Datenschutzinformationen:{' '}
                <Link href="/datenschutz" className={linkClass}>
                  Datenschutzerklärung
                </Link>
              </p>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className={h2Class}>5. Meldung von KI-Fehlern</h2>
              <p className="mb-3">
                Solltest du inhaltlich fehlerhafte, irreführende oder problematische
                KI-Antworten feststellen, bitten wir um Meldung. Dein Feedback hilft
                uns, die Qualität des Assistenten kontinuierlich zu verbessern.
              </p>
              <p>
                E-Mail:{' '}
                <a
                  href="mailto:pitmaster@steakakademie.de?subject=KI-Feedback"
                  className={linkClass}
                >
                  pitmaster@steakakademie.de
                </a>{' '}
                — Betreff: „KI-Feedback&quot;
              </p>
            </section>

            {/* Footer nav */}
            <div className="border-t border-white/10 pt-6 flex flex-wrap gap-4 text-sm">
              <Link href="/datenschutz" className={linkClass}>
                Datenschutzerklärung
              </Link>
              <Link href="/impressum" className={linkClass}>
                Impressum
              </Link>
              <Link href="/agb" className={linkClass}>
                AGB
              </Link>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
