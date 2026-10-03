'use client';

import { useState } from 'react';
import { m as motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface AgingStage {
  days: number;
  label: string;
  accentClass: string;
  borderClass: string;
  gradientFrom: string;
  moisture: number;
  umami: number;
  tenderness: number;
  crust: string;
  aroma: string;
  profil: string[];
  beschreibung: string;
  fuerWen: string;
  temperatur: string;
  luftfeuchtigkeit: string;
  luftzirkulation: string;
  risiken: string[];
}

const STAGES: AgingStage[] = [
  {
    days: 14,
    label: '14 Tage',
    accentClass: 'text-brand-gold',
    borderClass: 'border-brand-gold/30',
    gradientFrom: 'from-brand-gold/5',
    moisture: 85,
    umami: 40,
    tenderness: 55,
    crust: 'Noch keine nennenswerte Kruste',
    aroma: 'Frisch, mild, buttery',
    profil: ['mild', 'buttery', 'frisch'],
    beschreibung: 'Das Fleisch beginnt sich zu entspannen. Enzyme brechen Muskelproteine auf — die Zartheit nimmt spürbar zu. Der Geschmack ist noch mild und erinnert an frisches Rindfleisch mit leichter Süße.',
    fuerWen: 'Einsteiger ins Dry Aging. Ideal für alle die gewöhnliches Fleisch deutlich besser machen wollen ohne extremes Aroma.',
    temperatur: '2–4 °C',
    luftfeuchtigkeit: '80–85 %',
    luftzirkulation: 'Mittel',
    risiken: ['Kaum Risiken bei korrekter Temperatur', 'Kurze Reifezeit verzeiht minimale Fehler'],
  },
  {
    days: 21,
    label: '21 Tage',
    accentClass: 'text-orange-400',
    borderClass: 'border-orange-500/30',
    gradientFrom: 'from-orange-500/5',
    moisture: 75,
    umami: 62,
    tenderness: 72,
    crust: 'Erste dünne Kruste entwickelt sich',
    aroma: 'Nussig, leicht würzig, komplexer',
    profil: ['nussig', 'würzig', 'komplex'],
    beschreibung: 'Der Sweet Spot für viele Restaurants. 21 Tage bringen eine klare Steigerung der Zartheit und Geschmackskomplexität. Das charakteristische Dry-Aged-Aroma ist spürbar, aber nicht überwältigend.',
    fuerWen: 'Der Standard für gehobene Steakhäuser. Perfekte Balance zwischen Alltagstauglichkeit und Premium-Erlebnis.',
    temperatur: '2–4 °C',
    luftfeuchtigkeit: '78–83 %',
    luftzirkulation: 'Mittel bis hoch',
    risiken: ['Erste Schimmelkontrolle nötig', 'Temperaturkonstanz wird wichtiger'],
  },
  {
    days: 28,
    label: '28 Tage',
    accentClass: 'text-red-400',
    borderClass: 'border-red-500/30',
    gradientFrom: 'from-red-500/5',
    moisture: 65,
    umami: 78,
    tenderness: 85,
    crust: 'Ausgeprägte Kruste, tiefes Dunkelrot',
    aroma: 'Intensiv nussig, pilzig, würzig',
    profil: ['intensiv', 'pilzig', 'nussig', 'tief'],
    beschreibung: 'Hier beginnt die eigentliche Dry-Aged-Komplexität. Das Fleisch verliert durch Feuchtigkeitsverlust deutlich an Gewicht — aber was bleibt ist konzentrierte Perfektion. Aromen von Nüssen, Pilzen und etwas Blauschimmelkäse treten auf.',
    fuerWen: 'BBQ-Enthusiasten und Fleischliebhaber die das volle Dry-Aged-Erlebnis suchen. Der bevorzugte Reifegrad für Wagyu-Puristen.',
    temperatur: '2–3 °C',
    luftfeuchtigkeit: '75–80 %',
    luftzirkulation: 'Hoch',
    risiken: ['Regelmäßige Schimmelkontrolle', 'Gewichtsverlust 15–20 %', 'Schlechter Luftstrom führt zu unerwünschtem Schimmel'],
  },
  {
    days: 45,
    label: '45 Tage',
    accentClass: 'text-rose-400',
    borderClass: 'border-rose-500/30',
    gradientFrom: 'from-rose-500/5',
    moisture: 50,
    umami: 91,
    tenderness: 94,
    crust: 'Dicke Kruste, intensive Trockenschicht',
    aroma: 'Komplex, käsig, nussig, fast würzend',
    profil: ['käsig', 'extrem komplex', 'fast überwältigend'],
    beschreibung: 'Expertenterritorium. Das Fleisch hat fast die Hälfte seiner Feuchtigkeit verloren — der Geschmack ist konzentriert und komplex wie kaum etwas anderes. Aromen von gereiftem Käse, Nüssen und Erde dominieren.',
    fuerWen: 'Experten und Puristen. Nicht für Dry-Aged-Neulinge geeignet — das Profil kann überwältigend sein.',
    temperatur: '1–2 °C',
    luftfeuchtigkeit: '70–75 %',
    luftzirkulation: 'Sehr hoch, konstant',
    risiken: ['Tägliche Kontrolle empfohlen', 'Gewichtsverlust 25–35 %', 'Hohe Anforderungen an Equipment', 'Kein Fehler bei Temperatur erlaubt'],
  },
  {
    days: 90,
    label: '90 Tage',
    accentClass: 'text-purple-400',
    borderClass: 'border-purple-500/30',
    gradientFrom: 'from-purple-500/5',
    moisture: 35,
    umami: 98,
    tenderness: 99,
    crust: 'Extreme Kruste, vollständige Transformation',
    aroma: 'Umami-Bombe, fast blauschimmelkäsig, einmalig',
    profil: ['extrem', 'transformiert', 'einmalig', 'grenzerfahrung'],
    beschreibung: 'Jenseits des Gewöhnlichen. 90-Tage-Dry-Aged-Fleisch ist eine sensorische Grenzerfahrung. Das Fleisch hat sich in etwas anderes verwandelt. Legendär — und nur in wenigen Restaurants auf der Welt zu finden.',
    fuerWen: 'Absolute Puristen und Sammler von Erfahrungen. Wer einmal 90-Tage-Dry-Aged gegessen hat, versteht warum Fleisch Kunst sein kann.',
    temperatur: '1–2 °C',
    luftfeuchtigkeit: '65–70 %',
    luftzirkulation: 'Professionell, kalibriert',
    risiken: ['Professionelles Equipment notwendig', 'Extreme Fachkenntnis erforderlich', 'Gewichtsverlust >40 %', 'Für Heimreifung nicht empfohlen'],
  },
];

function MetricBar({ value, label, accentClass }: { value: number; label: string; accentClass: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs font-sans">
        <span className="text-text-light/40">{label}</span>
        <span className={accentClass}>{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden bg-surface-dark">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-brand-gold/30 to-brand-gold"
        />
      </div>
    </div>
  );
}

export default function AgingClient() {
  const [active, setActive] = useState<AgingStage>(STAGES[2]); // default 28 days

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-dark">

        {/* Header */}
        <section className="border-b border-brand-gold/15">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
            <nav className="flex items-center gap-1.5 text-xs font-sans text-text-light/40 mb-6" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
              <ChevronRight size={12} />
              <span className="text-text-light/65">Aging Matrix</span>
            </nav>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Steakakademie · Reifung
              </span>
              <h1 className="font-serif text-5xl lg:text-7xl font-bold text-text-light leading-tight mb-4">
                Precision<br />
                <span className="text-brand-gold">Aging Matrix.</span>
              </h1>
              <p className="font-body text-lg text-text-light/60 max-w-xl leading-relaxed">
                14 Tage oder 90? Zartheit, Umami, Aroma — jede Stufe verändert das Fleisch
                fundamental. Hier findest du den richtigen Reifegrad für deinen Anspruch.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Stage Selector */}
        <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-8 flex flex-wrap justify-center gap-3">
            {STAGES.map((s) => (
              <button
                key={s.days}
                onClick={() => setActive(s)}
                className={`border px-5 py-2.5 text-sm font-sans font-bold transition-colors duration-300 ${
                  active.days === s.days
                    ? `${s.borderClass} bg-surface-elevated ${s.accentClass}`
                    : 'border-brand-gold/15 text-text-light/30 hover:border-brand-gold/30 hover:text-text-light/60'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Detail Panel */}
          <motion.div
            key={active.days}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`border ${active.borderClass} bg-gradient-to-br ${active.gradientFrom} to-transparent p-6 md:p-8`}
          >
            <div className="grid gap-8 md:grid-cols-2">
              {/* Left */}
              <div className="space-y-5">
                <div>
                  <p className={`mb-1 text-[10px] font-sans font-bold uppercase tracking-[0.18em] ${active.accentClass}`}>
                    {active.label} Dry Aging
                  </p>
                  <p className="font-serif text-2xl font-bold text-text-light">{active.aroma}</p>
                </div>

                <div className="space-y-3">
                  <MetricBar value={active.umami} label="Umami-Intensität" accentClass={active.accentClass} />
                  <MetricBar value={active.tenderness} label="Zartheit" accentClass={active.accentClass} />
                  <MetricBar value={100 - active.moisture} label="Konzentration (Feuchtigkeitsverlust)" accentClass={active.accentClass} />
                </div>

                <div>
                  <p className="mb-2 text-xs font-sans text-text-light/30">Geschmacksprofil</p>
                  <div className="flex flex-wrap gap-2">
                    {active.profil.map((p) => (
                      <span key={p} className={`border ${active.borderClass} px-3 py-1 text-xs font-sans ${active.accentClass}`}>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border border-brand-gold/15 bg-surface-elevated p-4">
                  <p className="mb-1 text-[10px] font-sans font-bold uppercase tracking-wider text-text-light/30">Für wen?</p>
                  <p className="text-sm font-body leading-relaxed text-text-light/60">{active.fuerWen}</p>
                </div>
              </div>

              {/* Right */}
              <div className="space-y-5">
                <p className="text-sm font-body leading-relaxed text-text-light/60">{active.beschreibung}</p>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Temperatur', value: active.temperatur, emoji: '🌡️' },
                    { label: 'Luftfeuchte', value: active.luftfeuchtigkeit, emoji: '💧' },
                    { label: 'Luftstrom', value: active.luftzirkulation, emoji: '💨' },
                  ].map((c) => (
                    <div key={c.label} className="border border-brand-gold/10 bg-surface-elevated p-3 text-center">
                      <p className="mb-1 text-lg">{c.emoji}</p>
                      <p className="text-[10px] font-sans text-text-light/30">{c.label}</p>
                      <p className="text-xs font-sans font-bold text-text-light/70">{c.value}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="mb-2 text-[10px] font-sans font-bold uppercase tracking-wider text-text-light/30">Risiken & Anforderungen</p>
                  <ul className="space-y-1">
                    {active.risiken.map((r) => (
                      <li key={r} className="flex gap-2 text-xs font-body text-text-light/40">
                        <span className="mt-0.5 text-brand-gold/50">›</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={`border ${active.borderClass} p-3`}>
                  <p className="text-xs font-sans text-text-light/30">
                    Kruste: <span className="text-text-light/50">{active.crust}</span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Timeline */}
        <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <h2 className="mb-6 text-center text-[10px] font-sans font-bold uppercase tracking-[0.18em] text-text-light/30">Reifegrad-Timeline</h2>
          <div className="relative max-w-lg mx-auto">
            <div className="absolute left-0 right-0 top-4 h-px bg-brand-gold/10" />
            <div className="relative flex justify-between">
              {STAGES.map((s) => (
                <button
                  key={s.days}
                  onClick={() => setActive(s)}
                  className="flex flex-col items-center gap-2"
                >
                  <div className={`relative z-10 flex h-8 w-8 items-center justify-center border-2 transition-colors duration-300 ${
                    active.days === s.days
                      ? `${s.borderClass} bg-surface-elevated`
                      : 'border-brand-gold/10 bg-surface-dark hover:border-brand-gold/25'
                  }`}>
                    <div className={`h-2.5 w-2.5 transition-colors ${active.days === s.days ? 'bg-brand-gold' : 'bg-surface-elevated'}`} />
                  </div>
                  <span className={`text-[10px] font-sans font-bold transition-colors ${active.days === s.days ? s.accentClass : 'text-text-light/20'}`}>
                    {s.days}d
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="border-t border-brand-gold/10 py-20 px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 font-serif text-3xl font-bold text-text-light">
              Dry Aging selbst meistern.
            </h2>
            <p className="mx-auto mb-8 max-w-md font-body text-sm leading-relaxed text-text-light/50">
              In Level 4 des Steak-Diploms geht es um Reifung und Lagerung:
              Marmorierung, Dry und Wet Aging, Lagern und Einkauf.
            </p>
            <Link
              href="/diplome"
              className="inline-flex items-center gap-2 px-8 py-4 border border-brand-gold/50 text-brand-gold font-sans font-bold tracking-[0.1em] uppercase text-sm hover:bg-brand-gold/10 transition-colors"
            >
              Dry-Ager Diplom → Level 4
              <ChevronRight size={14} />
            </Link>
          </motion.div>
        </section>

      </main>
      <Footer />
    </>
  );
}
