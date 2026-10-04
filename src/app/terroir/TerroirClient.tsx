'use client';

import { useState } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ChevronRight, X } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface Origin {
  id: string;
  flag: string;
  region: string;
  land: string;
  rasse: string;
  haltung: string;
  futter: string;
  klima: string;
  geschmacksprofil: string[];
  charakteristik: string;
  ideelerCut: string;
  marmorierung: 'gering' | 'mittel' | 'hoch' | 'extrem';
  intensitaet: number;
  empfehlung: string;
}

const ORIGINS: Origin[] = [
  {
    id: 'wagyu',
    flag: '🇯🇵',
    region: 'Kobe & Matsusaka',
    land: 'Japan',
    rasse: 'Wagyu (Tajima-Linie)',
    haltung: 'Stall, Einzelhaltung, minimaler Stress',
    futter: 'Getreide, Biertrester, Reisstroh — bis zu 3 Jahre',
    klima: 'gemäßigt, feucht, küste',
    geschmacksprofil: ['butterig', 'nussig', 'süßlich', 'umami-reich'],
    charakteristik: 'Die höchste Marmorierungsstufe der Welt. Das Fett schmilzt bei Körpertemperatur — Wagyu braucht man nicht kauen, man lässt es zergehen. BMS-Score bis 12.',
    ideelerCut: 'Wagyu Ribeye, A5-Sirloin',
    marmorierung: 'extrem',
    intensitaet: 98,
    empfehlung: 'Dünn aufschneiden, Pfanne trocken, kein Öl — das Eigenfett des Fleisches reicht.',
  },
  {
    id: 'angus',
    flag: '🇦🇺',
    region: 'Victoria & New South Wales',
    land: 'Australien',
    rasse: 'Black Angus (Grain-Finished)',
    haltung: 'Weidehaltung + 100–300 Tage Feedlot',
    futter: 'Gras + Getreide-Finisher (Mais, Sorghum)',
    klima: 'subtropisch bis gemäßigt',
    geschmacksprofil: ['kräftig', 'fleischig', 'leicht nussig', 'ausgewogen'],
    charakteristik: 'Das verlässliche Premium-Beef. Australischer Angus bietet konsistente Qualität mit guter Marmorierung — das Arbeitspferd der Steakhäuser weltweit.',
    ideelerCut: 'Ribeye, Striploin, Tenderloin',
    marmorierung: 'hoch',
    intensitaet: 74,
    empfehlung: 'Der ideale Cut für Reverse Sear. Gleichmäßige Fettverteilung verzeiht auch leichte Fehler bei der Garzeit.',
  },
  {
    id: 'galician',
    flag: '🇪🇸',
    region: 'Galicien',
    land: 'Spanien',
    rasse: 'Rubia Gallega (alte Ochsen)',
    haltung: 'Weidehaltung, oft über 10 Jahre',
    futter: 'Gras, Kräuter der galizischen Bergwiesen',
    klima: 'atlantisch, feucht, grün',
    geschmacksprofil: ['intensiv', 'komplex', 'mineralisch', 'grasig-würzig'],
    charakteristik: 'Galizischer Ochse ist die europäische Antwort auf Wagyu. Das Fleisch alter Tiere entwickelt eine Tiefe, die junge Rinder nie erreichen. Dunkelrot, fest, außergewöhnlich aromatisch.',
    ideelerCut: 'Chuletón (Côte de Boeuf am Knochen)',
    marmorierung: 'hoch',
    intensitaet: 91,
    empfehlung: 'Nur Salz. Keine Kräuter, keine Marinade — das Fleisch erzählt seine Geschichte selbst.',
  },
  {
    id: 'longhorn',
    flag: '🇺🇸',
    region: 'Texas Hill Country',
    land: 'USA',
    rasse: 'Texas Longhorn / Hereford Cross',
    haltung: 'Extensive Weidehaltung, Freilauf',
    futter: 'Naturgras, keine Getreide-Finisher',
    klima: 'heiß, trocken, semi-arid',
    geschmacksprofil: ['wild', 'grasig', 'lean', 'direkt'],
    charakteristik: 'Texas Grass-Fed ist kein Wagyu — und will es auch nicht sein. Es ist ehrliches, muskulöses Rindfleisch mit Charakter. Weniger Fett, mehr Biss, unmistakeable Terroir.',
    ideelerCut: 'Brisket, Flank Steak, Hanger',
    marmorierung: 'gering',
    intensitaet: 62,
    empfehlung: 'Low & Slow ist hier Pflicht. Das Brisket aus Texas braucht 14 Stunden — und gibt alles zurück.',
  },
  {
    id: 'argentina',
    flag: '🇦🇷',
    region: 'Pampa (Buenos Aires, Entre Ríos)',
    land: 'Argentinien',
    rasse: 'Hereford & Aberdeen Angus',
    haltung: 'Ganzjährige Weidehaltung, kein Feedlot',
    futter: 'Naturgras der Pampa-Ebene (Omega-3-reich)',
    klima: 'gemäßigt, regenreich, fruchtbar',
    geschmacksprofil: ['grasig', 'frisch', 'sauber', 'leicht säuerlich'],
    charakteristik: 'Argentinisches Grass-Fed ist die Seele des Asado. Das Fleisch der Pampas schmeckt nach Freiheit — leichter im Fettgehalt, aber reich an Grassaromen und Omega-3-Fettsäuren.',
    ideelerCut: 'Asado de Tira (Short Ribs), Vacío (Flank), Entraña (Skirt)',
    marmorierung: 'mittel',
    intensitaet: 71,
    empfehlung: 'Nur Salz am Knochen, hohe Hitze, kein Wenden. Das ist Asado.',
  },
  {
    id: 'highland',
    flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    region: 'Schottisches Hochland',
    land: 'Schottland',
    rasse: 'Highland Cattle',
    haltung: 'Ganzjährige Freilufthaltung, rauestes Klima Europas',
    futter: 'Heide, Gras, natürliche Kräuter',
    klima: 'kalt, windig, feucht',
    geschmacksprofil: ['wild', 'kräutrig', 'komplex', 'leicht rauchig'],
    charakteristik: 'Das Highland-Rind trotzt dem schottischen Winter ohne Stall. Das Ergebnis ist ein tiefes, fast wildes Fleischaroma. Das Fett ist gelblich — Zeichen von Beta-Carotin aus dem Grünfutter.',
    ideelerCut: 'Bone-In Ribeye, Brisket, Short Rib',
    marmorierung: 'mittel',
    intensitaet: 83,
    empfehlung: 'Dry Aging 28+ Tage intensiviert das Profil nochmals. Dann einfach und respektvoll zubereiten.',
  },
];

const MARMORIERUNG_LABEL: Record<Origin['marmorierung'], string> = {
  gering: 'Gering',
  mittel: 'Mittel',
  hoch: 'Hoch',
  extrem: 'Extrem',
};

const MARMORIERUNG_COLOR: Record<Origin['marmorierung'], string> = {
  gering: 'text-sky-400 border-sky-900/50',
  mittel: 'text-brand-gold border-brand-gold/30',
  hoch: 'text-orange-400 border-orange-900/50',
  extrem: 'text-brand-fire border-brand-fire/30',
};

export default function TerroirClient() {
  const [selected, setSelected] = useState<Origin | null>(null);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-dark">

        {/* Header */}
        <section className="border-b border-brand-gold/15">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
            <nav className="flex items-center gap-1.5 text-xs font-sans text-text-light/55 mb-6" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
              <ChevronRight size={12} />
              <span className="text-text-light/65">Meat-Terroir</span>
            </nav>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Steakakademie · Fleisch-Terroir
              </span>
              <h1 className="font-serif text-5xl lg:text-7xl font-bold text-text-light leading-tight mb-4">
                Terroir des Fleisches.
              </h1>
              <p className="font-body text-lg text-text-light/60 max-w-2xl leading-relaxed">
                Wie Wein seinen Geschmack aus Boden, Klima und Handwerk bezieht,
                trägt Rindfleisch die Geschichte seiner Herkunft in jedem Bissen.{' '}
                <span className="text-brand-gold">Das nennen wir Meat Terroir.</span>
              </p>
            </motion.div>
          </div>
        </section>

        {/* Concept pillars */}
        <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { emoji: '🌱', title: 'Futter', text: 'Gras oder Getreide? Die Nahrung formt das Fettsäureprofil — und damit den Geschmack.' },
              { emoji: '🌍', title: 'Klima', text: 'Kälte, Hitze, Feuchtigkeit — extremes Klima erzeugt Fleisch mit mehr Charakter.' },
              { emoji: '🐄', title: 'Rasse', text: 'Genetik bestimmt Marmorierung, Muskelstruktur und das maximale Geschmackspotenzial.' },
            ].map((item) => (
              <div key={item.title} className="border border-brand-gold/15 bg-surface-elevated p-5 text-center">
                <p className="mb-2 text-3xl">{item.emoji}</p>
                <p className="mb-1 font-serif text-base font-bold text-text-light">{item.title}</p>
                <p className="text-xs font-body leading-relaxed text-text-light/55">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Origin Cards */}
        <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <h2 className="mb-8 text-center font-serif text-2xl font-bold text-text-light">
            6 Terroirs — 6 Geschichten
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ORIGINS.map((o, i) => (
              <motion.button
                key={o.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.35 }}
                onClick={() => setSelected(o)}
                className="text-left border border-brand-gold/15 bg-surface-elevated p-5 transition-colors duration-300 hover:border-brand-gold/40 hover:bg-surface-card"
              >
                <div className="mb-3 flex items-start justify-between">
                  <span className="text-3xl">{o.flag}</span>
                  <span className={`border px-2 py-0.5 text-[10px] font-sans font-bold uppercase tracking-wider ${MARMORIERUNG_COLOR[o.marmorierung]}`}>
                    {MARMORIERUNG_LABEL[o.marmorierung]}
                  </span>
                </div>
                <p className="mb-0.5 font-serif text-lg font-bold text-text-light">{o.region}</p>
                <p className="mb-3 text-xs font-sans text-text-light/55">{o.land} · {o.rasse}</p>

                {/* Intensitäts-Bar */}
                <div className="mb-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[10px] font-sans text-text-light/30">Geschmacksintensität</span>
                    <span className="text-[10px] font-sans text-brand-gold/60">{o.intensitaet}/100</span>
                  </div>
                  <div className="h-1 overflow-hidden bg-surface-dark">
                    <div
                      className="h-full bg-gradient-to-r from-brand-gold/40 to-brand-gold"
                      style={{ width: `${o.intensitaet}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {o.geschmacksprofil.map((g) => (
                    <span key={g} className="bg-surface-dark px-2 py-0.5 text-[10px] font-sans text-text-light/55">
                      {g}
                    </span>
                  ))}
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Detail Modal */}
        <AnimatePresence>
          {selected && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelected(null)}
                className="fixed inset-0 z-40 bg-black/85 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, y: 32, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 32, scale: 0.97 }}
                transition={{ duration: 0.28 }}
                className="fixed inset-x-4 bottom-0 top-16 z-50 mx-auto max-w-2xl overflow-y-auto border border-brand-gold/20 bg-surface-dark p-6 md:inset-y-8"
              >
                <button
                  onClick={() => setSelected(null)}
                  className="mb-4 flex items-center gap-2 text-xs font-sans text-text-light/55 hover:text-brand-gold transition-colors"
                >
                  <X size={14} />
                  Zurück zur Übersicht
                </button>

                <div className="mb-4 flex items-start gap-4">
                  <span className="text-5xl">{selected.flag}</span>
                  <div>
                    <h2 className="font-serif text-3xl font-bold text-text-light">{selected.region}</h2>
                    <p className="text-brand-gold/70 font-sans text-sm">{selected.land} · {selected.rasse}</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <p className="font-body leading-relaxed text-text-light/70">{selected.charakteristik}</p>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Haltung', value: selected.haltung },
                      { label: 'Futter', value: selected.futter },
                      { label: 'Klima', value: selected.klima },
                      { label: 'Idealer Cut', value: selected.ideelerCut },
                    ].map((item) => (
                      <div key={item.label} className="border border-brand-gold/15 bg-surface-elevated p-3">
                        <p className="mb-1 text-[10px] font-sans font-bold uppercase tracking-wider text-brand-fire/70">{item.label}</p>
                        <p className="text-xs font-body leading-relaxed text-text-light/60">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="border border-brand-gold/20 bg-brand-gold/5 p-4">
                    <p className="mb-1 text-[10px] font-sans font-bold uppercase tracking-wider text-brand-gold">Zubereitungsempfehlung</p>
                    <p className="text-sm font-body leading-relaxed text-text-light/70">{selected.empfehlung}</p>
                  </div>

                  <div>
                    <p className="mb-2 text-[10px] font-sans font-bold uppercase tracking-wider text-text-light/30">Geschmacksprofil</p>
                    <div className="flex flex-wrap gap-2">
                      {selected.geschmacksprofil.map((g) => (
                        <span key={g} className="border border-brand-gold/20 px-3 py-1 text-xs font-sans text-brand-gold">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-brand-gold/10 pt-4">
                    <Link
                      href="/diplome"
                      onClick={() => setSelected(null)}
                      className="inline-flex items-center gap-2 border border-brand-gold/30 px-4 py-2 text-sm font-sans font-medium text-brand-gold hover:bg-brand-gold/10 transition-colors"
                    >
                      Fleisch-Sommelier werden → Diplom Level 9
                    </Link>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Bottom CTA */}
        <section className="border-t border-brand-gold/10 py-20 px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 font-serif text-3xl font-bold text-text-light md:text-4xl">
              Werde zum<br />
              <span className="text-brand-gold">Fleisch-Sommelier.</span>
            </h2>
            <p className="mx-auto mb-8 max-w-md font-body text-sm leading-relaxed text-text-light/50">
              Im Steak-Diplom behandelt Level 6 Herkunft und internationale Cuts,
              Level 9 die Wagyu-Sensorik und das Verkosten.
            </p>
            <Link
              href="/diplome"
              className="inline-flex items-center gap-2 px-8 py-4 border border-brand-gold/50 text-brand-gold font-sans font-bold tracking-[0.1em] uppercase text-sm hover:bg-brand-gold/10 transition-colors"
            >
              Wagyu-Sommelier Diplom
              <ChevronRight size={14} />
            </Link>
          </motion.div>
        </section>

      </main>
      <Footer />
    </>
  );
}
