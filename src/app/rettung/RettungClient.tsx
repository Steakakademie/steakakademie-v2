'use client';

import { useState, type ReactNode } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ChevronRight, Plus } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface Scenario {
  id: string;
  emoji: string;
  problem: string;
  symptom: string;
  ursache: string;
  rettung: string[];
  praevention: string;
  level: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'grau',
    emoji: '😱',
    problem: 'Das Steak ist komplett grau',
    symptom: 'Kein Röstaroma, keine Kruste — das Fleisch sieht aus wie gekocht.',
    ursache: 'Die Pfanne war nicht heiß genug, oder das Steak war zu nass. Feuchtigkeit auf der Oberfläche verhindert die Maillard-Reaktion — das Fleisch dampft statt zu brutzeln.',
    rettung: [
      'Pfanne auf maximale Hitze bringen — mindestens 2 Minuten vorheizen.',
      'Steak mit Küchenpapier vollständig trocken tupfen.',
      'Erst wenn die Pfanne raucht: Steak hinein — ohne Öl in der Pfanne, Öl direkt aufs Fleisch.',
      '90 Sekunden ohne Bewegen — Kruste braucht Zeit.',
    ],
    praevention: 'Steak immer mindestens 30 Minuten vor dem Braten aus dem Kühlschrank nehmen und trocken tupfen. Wasser ist der Feind der Kruste.',
    level: 'Level 1: Glut-Lehrling',
  },
  {
    id: 'zaeh',
    emoji: '🦷',
    problem: 'Das Steak ist zäh wie Schuhsohle',
    symptom: 'Kauen ohne Ende, kein Genuss — das Fleisch gibt einfach nicht nach.',
    ursache: 'Entweder falscher Cut, zu früh geschnitten oder gegen die Faser geschnitten. Muskelfleisch ohne Marmorierung braucht Low & Slow.',
    rettung: [
      'Sofort: Gegen die Faser aufschneiden — Fasern sichtbar machen und im 90°-Winkel durchtrennen.',
      'Wenn noch warm: In Alufolie wickeln, 10 Minuten ruhen lassen.',
      'Für morgen: Reste dünn aufschneiden, in Fond erwärmen — perfekt für Sandwiches.',
    ],
    praevention: 'Skirt, Flank und Hanger immer gegen die Faser schneiden. Ribeye und Strip können in beliebiger Richtung geschnitten werden. Die Faser ist dein Kompass.',
    level: 'Level 3: Onglet-Kenner',
  },
  {
    id: 'zu-durch',
    emoji: '🪨',
    problem: 'Das Steak ist durchgegart',
    symptom: 'Keine Saftigkeit, trockenes Grau durch und durch — der Gast war höflich, du bist verzweifelt.',
    ursache: 'Zu lange gegart oder falsches Thermometer-Timing. Carryover Cooking: Das Fleisch gart nach der Hitze noch 2–4°C weiter.',
    rettung: [
      'Nicht wegwerfen — in dünne Scheiben schneiden.',
      'Rinderbrühe oder Butter bei mittlerer Hitze in die Pfanne, Scheiben kurz einlegen.',
      'Sofort servieren: Die Feuchtigkeit kaschiert die Übergare für den Gaumen.',
    ],
    praevention: 'Fleisch bei 3–4°C unter Zieltemperatur aus der Hitze nehmen. Medium = 57°C Kern → raus bei 53–54°C. Immer mit Sofortlese-Thermometer arbeiten.',
    level: 'Level 5: Flammen-Virtuose',
  },
  {
    id: 'kein-rauch',
    emoji: '💨',
    problem: 'Der Smoker gibt keinen Smoke Ring',
    symptom: 'Das Pulled Pork oder Brisket sieht von innen aus wie normales Fleisch — kein pink-roter Ring am Rand.',
    ursache: 'Zu hohe Starttemperatur, falsches Holz oder das Fleisch war zu warm beim Auflegen. Der Smoke Ring entsteht nur unter 65°C Kerntemperatur.',
    rettung: [
      'Beim nächsten Mal: Fleisch direkt aus dem Kühlschrank auf den Smoker — kalt = mehr Zeit im kritischen Temperaturbereich.',
      'Härteres Holz nutzen: Hickory, Mesquite, Eiche statt Obstholz.',
      'Smoke Ring ist Optik — beeinflusst den Geschmack nicht. Komfort-Wissen für Gäste.',
    ],
    praevention: 'Erste 2 Stunden unter 120°C Garraum-Temperatur halten. Gutes Holz, saubere Verbrennung, keine Alufolie in der Anfangsphase.',
    level: 'Level 7: Smoke-Artist',
  },
  {
    id: 'verbrennt',
    emoji: '🔥',
    problem: 'Das Steak verbrennt außen, ist innen roh',
    symptom: 'Schwarze Kruste, roter Kern — das klassische Anfänger-Desaster.',
    ursache: 'Direkte Hitze ist zu hoch für dicke Cuts. Ein 4 cm Steak braucht Indirekt-Hitze um den Kern zu erreichen, bevor die Außenseite verbrennt.',
    rettung: [
      'Sofort: In die indirekte Zone des Grills verschieben.',
      'Deckel schließen — Konvektion gart den Kern gleichmäßig weiter.',
      'Die schwarze Seite abschaben — oft ist weniger verbrannt als gedacht.',
    ],
    praevention: 'Reverse Sear für alles über 3 cm: Erst indirekt auf 52°C, dann 2 Minuten pro Seite direkt über der Glut. Perfektes Ergebnis, garantiert.',
    level: 'Level 5: Flammen-Virtuose',
  },
  {
    id: 'nicht-saftig',
    emoji: '🏜️',
    problem: 'Das Steak ist trocken trotz korrekter Kerntemperatur',
    symptom: 'Alles richtig gemacht — und trotzdem kein Saft auf dem Teller.',
    ursache: 'Zu frühes Anschneiden. Die Fasern sind beim Garen zusammengezogen und der Saft zentralisiert sich im Kern. Ohne Ruhephase läuft alles raus.',
    rettung: [
      'Noch zu retten: In Alufolie wickeln mit einem Teelöffel Butter, 8–10 Minuten ruhen.',
      'Beim Anschneiden gesammelten Saft über das Fleisch gießen.',
      'Sauce machen: Saft in der Pfanne mit Knoblauch und Rosmarin aufkochen.',
    ],
    praevention: 'Faustregel: 1 Minute Ruhezeit pro cm Dicke. Ein 4 cm Steak ruht mindestens 4 Minuten, besser 6–8. Immer abgedeckt, damit es nicht auskühlt.',
    level: 'Level 1: Glut-Lehrling',
  },
];

export default function RettungClient({ beichte = null }: { beichte?: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <>
      <Header />

      {/* Schema.org FAQ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: SCENARIOS.map(s => ({
              '@type': 'Question',
              name: s.problem,
              acceptedAnswer: {
                '@type': 'Answer',
                text: `${s.ursache} ${s.rettung.join(' ')}`,
              },
            })),
          }),
        }}
      />

      <main className="min-h-screen bg-surface-dark">

        {/* Header */}
        <section className="border-b border-brand-gold/15">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
            <nav className="flex items-center gap-1.5 text-xs font-sans text-text-light/55 mb-6" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
              <ChevronRight size={12} />
              <span className="text-text-light/65">Steak-Rettung</span>
            </nav>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Steakakademie · Erste Hilfe
              </span>
              <h1 className="font-serif text-5xl lg:text-7xl font-bold text-text-light leading-tight mb-4">
                Steak-Rettung.
              </h1>
              <p className="font-body text-lg text-text-light/60 max-w-xl leading-relaxed">
                Etwas ist schiefgelaufen. Kein Problem — hier findest du die Ursache,
                die sofortige Rettung und wie du es nie wieder passiert.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Scenario Accordion */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-3">
          {SCENARIOS.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
            >
              <button
                onClick={() => setOpenId(openId === s.id ? null : s.id)}
                className="w-full text-left border border-brand-gold/15 bg-surface-elevated px-6 py-5 transition-colors hover:border-brand-gold/30 hover:bg-surface-card"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{s.emoji}</span>
                    <div>
                      <p className="font-serif text-lg font-bold text-text-light">{s.problem}</p>
                      <p className="mt-0.5 text-sm font-body text-text-light/55">{s.symptom}</p>
                    </div>
                  </div>
                  <Plus
                    size={20}
                    className={`flex-shrink-0 text-brand-gold transition-transform duration-300 ${openId === s.id ? 'rotate-45' : ''}`}
                  />
                </div>
              </button>

              <AnimatePresence>
                {openId === s.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="border border-t-0 border-brand-gold/15 bg-surface-base px-6 pb-6 pt-4 space-y-5">
                      {/* Ursache */}
                      <div>
                        <p className="mb-1 text-[10px] font-sans font-bold uppercase tracking-[0.18em] text-brand-fire/70">Warum passiert das?</p>
                        <p className="text-sm font-body leading-relaxed text-text-secondary">{s.ursache}</p>
                      </div>

                      {/* Rettung */}
                      <div>
                        <p className="mb-2 text-[10px] font-sans font-bold uppercase tracking-[0.18em] text-brand-fire">Sofort-Rettung</p>
                        <ol className="space-y-2">
                          {s.rettung.map((step, idx) => (
                            <li key={idx} className="flex gap-3 text-sm font-body text-text-primary">
                              <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center border border-brand-gold/30 text-xs font-bold font-sans text-brand-gold">
                                {idx + 1}
                              </span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Prävention */}
                      <div className="border border-brand-gold/15 bg-brand-gold/5 p-4">
                        <p className="mb-1 text-[10px] font-sans font-bold uppercase tracking-[0.18em] text-brand-gold">Nie wieder</p>
                        <p className="text-sm font-body leading-relaxed text-text-secondary">{s.praevention}</p>
                      </div>

                      {/* CTA */}
                      <div className="flex items-center justify-between border-t border-border-subtle pt-4">
                        <p className="text-xs font-sans text-text-muted">
                          Dieses Wissen gehört zu{' '}
                          <span className="text-brand-gold">{s.level}</span>
                        </p>
                        <Link
                          href="/diplome"
                          className="border border-brand-gold/30 px-4 py-1.5 text-xs font-sans font-medium text-brand-gold hover:bg-brand-gold/10 transition-colors"
                        >
                          Level freischalten →
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </section>

        {/* Hinweis auf die Steak-Beichte (Server-Baustein aus page.tsx; leer, wenn kein Anlass) */}
        {beichte && <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">{beichte}</div>}

        {/* Bottom CTA */}
        <section className="border-t border-brand-gold/10 py-20 px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-3">
              Systematisch besser werden
            </span>
            <h2 className="font-serif text-3xl font-bold text-text-light mb-3 md:text-4xl">
              Rettungen sind gut.<br />
              <span className="text-brand-gold">Fehler vermeiden ist besser.</span>
            </h2>
            <p className="mx-auto mb-8 max-w-md font-body text-text-light/50 text-sm leading-relaxed">
              Das Steak-Diplom geht alle diese Fehler systematisch durch —
              bevor sie passieren. 10 Level, strukturiertes Wissen, zertifiziert.
            </p>
            <Link
              href="/diplome"
              className="inline-flex items-center gap-2 px-8 py-4 border border-brand-gold/50 text-brand-gold font-sans font-bold tracking-[0.1em] uppercase text-sm hover:bg-brand-gold/10 transition-colors"
            >
              Zum Steak-Diplom
              <ChevronRight size={14} />
            </Link>
          </motion.div>
        </section>

      </main>
      <Footer />
    </>
  );
}
