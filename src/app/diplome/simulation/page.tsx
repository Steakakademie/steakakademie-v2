'use client';

import { useState } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import NewsletterSignup from '@/components/ui/NewsletterSignup';
import { urkundePreisMitVersand } from '@/lib/urkunde/preis';
import {
  Flame, ChevronRight, Lock, Check, X,
  BookOpen, Award, ArrowRight, Trophy,
} from 'lucide-react';

// ─── CONTENT DATA ────────────────────────────────────────────────────────────

const LEVELS_OVERVIEW = [
  { id: 1, name: 'Glut-Lehrling', emoji: '🔥', unlocked: true },
  { id: 2, name: 'Marinier-Meister', emoji: '🧂', unlocked: true },
  { id: 3, name: 'Onglet-Kenner', emoji: '🥩', unlocked: false },
  { id: 4, name: 'Dry-Ager', emoji: '🧊', unlocked: false },
  { id: 5, name: 'Flammen-Virtuose', emoji: '🎯', unlocked: false },
  { id: 6, name: 'Cuts-Experte', emoji: '🗺️', unlocked: false },
  { id: 7, name: 'Smoke-Artist', emoji: '💨', unlocked: false },
  { id: 8, name: 'Thermometer-Profi', emoji: '🌡️', unlocked: false },
  { id: 9, name: 'Wagyu-Sommelier', emoji: '🏅', unlocked: false },
  { id: 10, name: 'Master of Steak', emoji: '👑', unlocked: false },
];

const QUIZ = {
  question: 'Was ist der entscheidende Vorteil der Zwei-Zonen-Methode?',
  options: [
    { id: 0, text: 'Die Außenseite wird durch mehr Hitze knuspriger.' },
    { id: 1, text: 'Du kannst gleichzeitig anbraten UND kontrolliert garen — ohne zu verbrennen.', correct: true },
    { id: 2, text: 'Das Fleisch braucht weniger Zeit auf dem Grill.' },
  ],
};

// ─── MOTION VARIANTS ─────────────────────────────────────────────────────────

const slide = {
  enter: { opacity: 0, x: 28 },
  center: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
  exit: { opacity: 0, x: -28, transition: { duration: 0.2 } },
};

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="transition-[width] duration-300 rounded-full"
          style={{
            width: i === current ? 20 : 6,
            height: 6,
            background: i === current
              ? '#C8882A'
              : i < current
                ? 'rgba(200,136,42,0.35)'
                : 'rgba(255,255,255,0.12)',
          }}
        />
      ))}
    </div>
  );
}

function StepLabel({ text }: { text: string }) {
  return (
    <p className="text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-3">
      {text}
    </p>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function DiplomSimulation() {
  const [step, setStep] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const TOTAL = 7;

  const next = () => setStep(s => Math.min(s + 1, TOTAL - 1));

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-dark">

        {/* Top bar */}
        <div className="border-b border-brand-gold/10 bg-surface-dark/80 sticky top-16 z-30 backdrop-blur-sm">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <span className="text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire flex items-center gap-1.5">
              <BookOpen size={10} />
              Diplom-Simulation
            </span>
            <span className="text-[10px] font-sans text-text-light/30">
              Schritt {step + 1} von {TOTAL}
            </span>
          </div>
          {/* Global progress bar */}
          <div className="h-0.5 bg-surface-elevated">
            <motion.div
              className="h-full bg-brand-gold"
              animate={{ width: `${((step + 1) / TOTAL) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Simulation stage */}
        <div className="max-w-2xl mx-auto px-4 py-14 min-h-[80vh] flex flex-col items-center justify-center">

          <StepDots current={step} total={TOTAL} />

          <AnimatePresence mode="wait">

            {/* ──────────────────────────────── STEP 0: OVERVIEW */}
            {step === 0 && (
              <motion.div key="s0" variants={slide} initial="enter" animate="center" exit="exit"
                className="w-full text-center">
                <StepLabel text="Steakakademie · Das System" />
                <h1 className="font-serif text-3xl lg:text-4xl font-bold text-text-light mb-4 leading-tight">
                  10 Level.<br />Von den Grundlagen<br />bis zur Meisterklasse.
                </h1>
                <p className="font-body text-text-light/55 mb-10 max-w-md mx-auto leading-relaxed">
                  Jedes Level baut auf dem vorherigen auf. Kein Raten, kein Durchklicken —
                  echtes Wissen, das am Grill funktioniert.
                </p>

                {/* Level strip */}
                <div className="flex items-center justify-center flex-wrap gap-1 mb-10">
                  {LEVELS_OVERVIEW.map((l, i) => (
                    <div key={l.id} className="flex items-center gap-1">
                      <div className="relative">
                        <div
                          className="w-9 h-9 flex items-center justify-center border text-xs font-sans font-bold transition-[background-color,border-color,color]"
                          style={{
                            borderColor: l.unlocked ? '#C8882A' : 'rgba(255,255,255,0.1)',
                            background: l.unlocked ? 'rgba(200,136,42,0.15)' : 'transparent',
                            color: l.unlocked ? '#C8882A' : 'rgba(255,255,255,0.2)',
                          }}
                        >
                          {l.unlocked ? l.emoji : <Lock size={12} />}
                        </div>
                        {l.unlocked && (
                          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-sans text-brand-gold/70">
                            offen
                          </div>
                        )}
                      </div>
                      {i < LEVELS_OVERVIEW.length - 1 && (
                        <div className="w-3 h-px bg-white/8" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-8 space-y-3">
                  <button
                    onClick={next}
                    className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 bg-brand-gold text-ink font-sans font-bold text-sm tracking-[0.1em] uppercase px-8 py-4 hover:bg-[#b07020] transition-colors"
                  >
                    <Flame size={14} />
                    Erste Lektion erleben
                  </button>
                  <p className="text-[10px] font-sans text-text-light/25">
                    ~2 Minuten · Keine Anmeldung nötig
                  </p>
                </div>
              </motion.div>
            )}

            {/* ──────────────────────────────── STEP 1: LEVEL INTRO */}
            {step === 1 && (
              <motion.div key="s1" variants={slide} initial="enter" animate="center" exit="exit"
                className="w-full">
                <StepLabel text="Level 1 — Glut-Lehrling" />

                <div className="border border-brand-gold/30 bg-surface-elevated p-7 mb-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="text-4xl shrink-0 mt-1">🔥</div>
                    <div>
                      <h2 className="font-serif text-2xl font-bold text-text-primary mb-2">
                        Glut-Lehrling
                      </h2>
                      <p className="text-sm font-body text-text-secondary leading-relaxed">
                        Das Fundament, auf dem alles andere aufbaut. Wer die Grundlagen
                        nicht beherrscht, verbessert sich nie — egal wie viel er grillt.
                      </p>
                    </div>
                  </div>

                  {/* What you'll learn */}
                  <div className="space-y-2 mb-6">
                    {[
                      'Die Zwei-Zonen-Methode — direktes vs. indirektes Grillen',
                      'Temperatur lesen und steuern — ohne Thermometer-Angst',
                      'Wann geht was auf den Grill — Timing-Grundlagen',
                      'Die häufigsten Anfänger-Fehler (und wie du sie sofort vermeidest)',
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="w-4 h-4 border border-brand-gold/40 flex items-center justify-center shrink-0 mt-0.5">
                          <div className="w-1.5 h-1.5 bg-brand-gold/60 rounded-full" />
                        </div>
                        <span className="text-sm font-body text-text-secondary">{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-6 pt-4 border-t border-border-subtle">
                    <div>
                      <p className="text-[10px] font-sans text-text-muted uppercase tracking-wider mb-0.5">Lektionen</p>
                      <p className="text-sm font-sans font-bold text-text-primary">4 Module</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-sans text-text-muted uppercase tracking-wider mb-0.5">Dauer</p>
                      <p className="text-sm font-sans font-bold text-text-primary">~3 Wochen</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-sans text-text-muted uppercase tracking-wider mb-0.5">Abschluss</p>
                      <p className="text-sm font-sans font-bold text-text-primary">Wissens-Test</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={next}
                  className="w-full flex items-center justify-center gap-2 border border-brand-gold/50 text-brand-gold font-sans font-bold text-sm tracking-[0.1em] uppercase py-4 hover:bg-brand-gold/10 transition-colors"
                >
                  Lektion 1 starten
                  <ChevronRight size={14} />
                </button>
              </motion.div>
            )}

            {/* ──────────────────────────────── STEP 2: LESSON CONTENT */}
            {step === 2 && (
              <motion.div key="s2" variants={slide} initial="enter" animate="center" exit="exit"
                className="w-full">
                <div className="flex items-center gap-2 mb-2">
                  <StepLabel text="Lektion 1 von 4 · Glut-Lehrling" />
                </div>

                <h2 className="font-serif text-2xl font-bold text-text-primary mb-2 leading-tight">
                  Die Zwei-Zonen-Methode
                </h2>
                <p className="text-[10px] font-sans font-bold tracking-[0.15em] uppercase text-text-muted mb-6">
                  Das Fundament aller Grilltechniken
                </p>

                {/* Lesson content */}
                <div className="font-body text-text-secondary leading-relaxed space-y-4 mb-8 text-sm">
                  <p>
                    Der häufigste Fehler beim Grillen: Alles bei voller Hitze. Das Ergebnis kennst du —
                    außen verbrannt, innen roh. Die Zwei-Zonen-Methode löst das grundlegend.
                  </p>
                  <p>
                    Du teilst deinen Grill in zwei Bereiche: eine <strong className="text-text-primary">heiße Zone</strong> mit
                    direkter Glut darunter — zum Anbraten und Kruste-Bilden. Und eine{' '}
                    <strong className="text-text-primary">kühlere Zone</strong> ohne Glut — zum kontrollierten
                    Garen auf Kerntemperatur.
                  </p>
                </div>

                {/* Visual Zone Diagram */}
                <div className="border border-brand-gold/20 overflow-hidden mb-8">
                  <div className="grid grid-cols-2">
                    {/* Hot zone */}
                    <div className="bg-brand-fire/10 border-r border-brand-gold/20 p-5 text-center">
                      <div className="text-3xl mb-2">🔥🔥🔥</div>
                      <p className="text-xs font-sans font-bold text-brand-fire uppercase tracking-wider mb-1">
                        Heiße Zone
                      </p>
                      <p className="text-[10px] font-body text-text-secondary leading-relaxed">
                        Direkte Glut · 250–350°C<br />
                        Für: Anbraten, Kruste, Searing
                      </p>
                    </div>
                    {/* Cool zone */}
                    <div className="bg-surface-elevated p-5 text-center">
                      <div className="text-3xl mb-2">〰️〰️〰️</div>
                      <p className="text-xs font-sans font-bold text-brand-gold uppercase tracking-wider mb-1">
                        Kühlere Zone
                      </p>
                      <p className="text-[10px] font-body text-text-secondary leading-relaxed">
                        Indirekte Hitze · 120–180°C<br />
                        Für: Garen, Kerntemperatur
                      </p>
                    </div>
                  </div>
                  {/* Arrow */}
                  <div className="bg-surface-dark px-5 py-2 flex items-center justify-center gap-3">
                    <span className="text-[10px] font-sans text-text-muted">Steak wandert →</span>
                    <div className="flex-1 h-px bg-brand-gold/20" />
                    <span className="text-[10px] font-sans text-brand-gold">Reverse Sear Prinzip</span>
                  </div>
                </div>

                {/* Key insight */}
                <div className="border-l-2 border-brand-gold pl-4 mb-8">
                  <p className="text-sm font-body text-text-secondary italic">
                    &quot;Wer Hitze steuert, steuert Ergebnisse. Die Zwei-Zonen-Methode ist
                    der erste Schritt vom Raten zum Wissen.&quot;
                  </p>
                </div>

                <button
                  onClick={next}
                  className="w-full flex items-center justify-center gap-2 bg-brand-gold text-ink font-sans font-bold text-sm tracking-[0.1em] uppercase py-4 hover:bg-[#b07020] transition-colors"
                >
                  Wissen prüfen →
                </button>
              </motion.div>
            )}

            {/* ──────────────────────────────── STEP 3: QUIZ */}
            {step === 3 && (
              <motion.div key="s3" variants={slide} initial="enter" animate="center" exit="exit"
                className="w-full">
                <StepLabel text="Wissens-Check · Lektion 1" />

                <h2 className="font-serif text-xl font-bold text-text-primary mb-8 leading-snug">
                  {QUIZ.question}
                </h2>

                <div className="space-y-3 mb-8">
                  {QUIZ.options.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setQuizAnswer(opt.id);
                        setTimeout(next, 600);
                      }}
                      className={`w-full text-left border p-4 transition-colors duration-200 group ${
                        quizAnswer === opt.id
                          ? opt.correct
                            ? 'border-emerald-500/60 bg-emerald-500/10 text-text-primary'
                            : 'border-brand-fire/60 bg-brand-fire/10 text-text-primary'
                          : 'border-brand-gold/15 bg-surface-elevated hover:border-brand-gold/40 text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-6 h-6 shrink-0 border flex items-center justify-center text-xs font-bold transition-colors ${
                          quizAnswer === opt.id
                            ? opt.correct
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : 'border-brand-fire bg-brand-fire text-white'
                            : 'border-brand-gold/30 text-text-muted group-hover:border-brand-gold/60'
                        }`}>
                          {quizAnswer === opt.id
                            ? opt.correct ? <Check size={12} /> : <X size={12} />
                            : String.fromCharCode(65 + opt.id)
                          }
                        </div>
                        <span className="text-sm font-body leading-snug pt-0.5">{opt.text}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <p className="text-xs font-sans text-text-muted text-center">
                  Klicke auf die richtige Antwort
                </p>
              </motion.div>
            )}

            {/* ──────────────────────────────── STEP 4: ANSWER REVEAL */}
            {step === 4 && (
              <motion.div key="s4" variants={slide} initial="enter" animate="center" exit="exit"
                className="w-full text-center">

                {/* Result indicator */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center mx-auto mb-6"
                >
                  <Check size={28} className="text-emerald-400" />
                </motion.div>

                <StepLabel text={quizAnswer === 1 ? 'Richtig!' : 'Fast — die richtige Antwort:'} />

                <h2 className="font-serif text-2xl font-bold text-text-primary mb-4 leading-tight">
                  {quizAnswer === 1
                    ? 'Genau das ist der Kern.'
                    : 'Die Kontrolle ist entscheidend.'}
                </h2>

                <p className="font-body text-text-secondary text-sm leading-relaxed max-w-md mx-auto mb-8">
                  Die Zwei-Zonen-Methode gibt dir Kontrolle: Direkthitze für die Kruste, indirekte Zone
                  für das präzise Garen zur Kerntemperatur. Du entscheidest, was passiert —
                  nicht das Feuer.
                </p>

                {/* Progress visual */}
                <div className="border border-brand-gold/20 bg-surface-elevated p-5 mb-8 max-w-sm mx-auto">
                  <p className="text-[10px] font-sans text-text-muted uppercase tracking-wider mb-3">
                    Dein Fortschritt · Level 1
                  </p>
                  <div className="flex gap-2">
                    {['Zwei-Zonen', 'Temperatur', 'Timing', 'Fehler'].map((label, i) => (
                      <div key={label} className="flex-1 text-center">
                        <div className={`h-1.5 mb-1.5 ${i === 0 ? 'bg-brand-gold' : 'bg-surface-dark'}`} />
                        <p className="text-[8px] font-sans text-text-muted leading-tight">{label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] font-sans text-brand-gold mt-3">1 von 4 Lektionen ✓</p>
                </div>

                <button
                  onClick={next}
                  className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 border border-brand-gold/50 text-brand-gold font-sans font-bold text-sm tracking-[0.1em] uppercase py-4 hover:bg-brand-gold/10 transition-colors"
                >
                  Was gibt es nach Level 1?
                  <ChevronRight size={14} />
                </button>
              </motion.div>
            )}

            {/* ──────────────────────────────── STEP 5: ACHIEVEMENT */}
            {step === 5 && (
              <motion.div key="s5" variants={slide} initial="enter" animate="center" exit="exit"
                className="w-full text-center">
                <StepLabel text="Nach Level 1 — Dein Abschluss" />

                <h2 className="font-serif text-2xl font-bold text-text-light mb-3 leading-tight">
                  Dein Bronze-Diplom.<br />Offiziell. Gedruckt. Per Post.
                </h2>
                <p className="font-body text-text-light/55 text-sm mb-10 max-w-md mx-auto leading-relaxed">
                  Nach dem Abschluss-Test erreichst du den Grad Grillmeister Bronze —
                  digital zum Teilen kostenlos, auf Wunsch gedruckt per Post ({urkundePreisMitVersand()}).
                </p>

                {/* Animated diploma */}
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
                  className="relative max-w-sm mx-auto mb-10"
                >
                  {/* Certificate card */}
                  <div className="border-2 border-brand-gold/40 bg-gradient-to-b from-[#1a1105] to-surface-dark p-8 text-center relative overflow-hidden">
                    {/* Corner ornaments */}
                    <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-brand-gold/30" />
                    <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-brand-gold/30" />
                    <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-brand-gold/30" />
                    <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-brand-gold/30" />

                    {/* Seal */}
                    <motion.div
                      initial={{ rotate: -10, scale: 0.8 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ delay: 0.5, type: 'spring', stiffness: 150 }}
                      className="w-16 h-16 border-2 border-brand-gold/60 bg-brand-gold/10 flex items-center justify-center mx-auto mb-4"
                    >
                      <Trophy size={28} className="text-brand-gold" />
                    </motion.div>

                    <p className="text-[9px] font-sans font-bold tracking-[0.2em] uppercase text-brand-fire mb-2">
                      Steakakademie
                    </p>
                    <h3 className="font-serif text-xl font-bold text-text-light mb-1">
                      Bronze-Grillmeister
                    </h3>
                    <p className="text-xs font-sans text-text-muted mb-3">
                      Dein Name · 2026
                    </p>
                    <div className="h-px bg-brand-gold/20 my-3" />
                    <p className="text-[9px] font-body text-text-muted/60 leading-relaxed">
                      Hat Level 1 — Glut-Lehrling erfolgreich<br />
                      abgeschlossen und die Grundlagen des Grillens<br />
                      durch Prüfung nachgewiesen.
                    </p>
                  </div>

                  {/* Glow */}
                  <div className="absolute inset-0 bg-brand-gold/3 blur-2xl -z-10" />
                </motion.div>

                {/* What this means */}
                <div className="border border-brand-gold/15 bg-surface-elevated p-4 text-left max-w-sm mx-auto mb-8">
                  <p className="text-[10px] font-sans font-bold tracking-[0.15em] uppercase text-brand-fire mb-3">
                    Was Bronze bedeutet
                  </p>
                  {[
                    'Zwei-Zonen-Methode sicher beherrschen',
                    'Kerntemperaturen kennen und anwenden',
                    'Die 4 häufigsten Fehler dauerhaft vermeiden',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2 mb-2">
                      <Check size={12} className="text-brand-gold shrink-0 mt-0.5" />
                      <span className="text-xs font-body text-text-secondary">{item}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={next}
                  className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 bg-brand-gold text-ink font-sans font-bold text-sm tracking-[0.1em] uppercase py-4 hover:bg-[#b07020] transition-colors"
                >
                  <Flame size={14} />
                  Das Echte beginnen
                </button>
              </motion.div>
            )}

            {/* ──────────────────────────────── STEP 6: FINAL CTA */}
            {step === 6 && (
              <motion.div key="s6" variants={slide} initial="enter" animate="center" exit="exit"
                className="w-full text-center">
                <StepLabel text="Du bist bereit" />

                <h2 className="font-serif text-3xl font-bold text-text-light mb-3 leading-tight">
                  Dein Grillmeister-Weg<br />beginnt jetzt.
                </h2>
                <p className="font-body text-text-light/55 text-sm mb-10 max-w-sm mx-auto leading-relaxed">
                  Du hast gerade das Prinzip erlebt. Das echte Level 1 gibt dir alle vier
                  Lektionen, den Abschluss-Test und dein persönliches Bronze-Diplom.
                </p>

                {/* Primary CTA */}
                <Link
                  href="/diplome"
                  className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 bg-brand-gold text-ink font-sans font-bold text-sm tracking-[0.1em] uppercase py-4 hover:bg-[#b07020] transition-colors mb-3"
                >
                  <Flame size={14} />
                  Level 1 starten — kostenlos
                </Link>

                {/* Social proof */}
                <p className="text-[10px] font-sans text-text-light/30 mb-10">
                  Kein Account nötig · Eigenes Tempo · Physisches Diplom optional (3 €)
                </p>

                {/* Divider */}
                <div className="flex items-center gap-3 max-w-xs mx-auto mb-6">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[10px] font-sans text-text-light/30">oder</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Email capture */}
                <NewsletterSignup
                  source="simulation-final-cta"
                  eyebrow="Level-Benachrichtigung"
                  headline="Noch nicht sicher?"
                  subline="Lass dich erinnern, wenn neue Level freigegeben werden."
                  cta="Merken"
                  className="max-w-md mx-auto text-left"
                />

                {/* Back to explore */}
                <div className="mt-10 pt-8 border-t border-white/8">
                  <Link
                    href="/persoenlichkeiten"
                    className="text-xs font-sans text-text-light/30 hover:text-brand-gold transition-colors"
                  >
                    ← Zur Persönlichkeiten-Übersicht
                  </Link>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </main>
      <Footer />
    </>
  );
}
