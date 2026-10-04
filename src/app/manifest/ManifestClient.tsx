'use client';

import { m as motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const THESES = [
  {
    nr: 'I',
    title: 'Steak ist kein Essen. Es ist Haltung.',
    body: 'Wer ein Steak zubereitet, trifft Entscheidungen. Über Hitze, Zeit, Schnitt und Ruhe. Diese Entscheidungen verraten, ob jemand zugehört hat — oder nur satt werden will.',
  },
  {
    nr: 'II',
    title: 'Jedes schlechte Steak ist ein Verbrechen.',
    body: 'Ein Tier hat sein Leben gegeben. Ein Landwirt hat Jahrzehnte investiert. Ein Schlachter hat Präzisionsarbeit geleistet. Wer das in einer überhitzten Pfanne zerstört, schuldet dem Fleisch eine Entschuldigung.',
  },
  {
    nr: 'III',
    title: 'Der Cut bestimmt die Methode — nie umgekehrt.',
    body: 'Das Filet verlangt andere Hitze als das Onglet. Die Brust braucht andere Zeit als das Ribeye. Wer alle Cuts gleich behandelt, respektiert keinen.',
  },
  {
    nr: 'IV',
    title: 'Kerntemperatur ist keine Empfehlung. Sie ist Physik.',
    body: '54°C ist Medium Rare — unabhängig von Meinung, Tradition oder Grill-Onkel. Proteinfaltung kennt keine Ausnahmen. Das Thermometer lügt nicht.',
  },
  {
    nr: 'V',
    title: 'Übergart ist nicht auf der sicheren Seite.',
    body: 'Wer Fleisch übergart, weil er sich unsicher fühlt, ist nicht vorsichtig — er ist unwissend. Sicherheit entsteht durch Wissen, nicht durch Zerstörung.',
  },
  {
    nr: 'VI',
    title: 'Medium Rare ist Respekt, kein Trend.',
    body: 'Die Maillard-Reaktion bei 140°C. Das schmelzende intramuskuläre Fett. Die rosarote Mitte, die saftig bleibt. Das ist kein kulinarischer Zeitgeist — das ist Biologie.',
  },
  {
    nr: 'VII',
    title: 'Ein Diplom beweist nicht, was du weißt. Es beweist, wer du bist.',
    body: 'Wer die Steakakademie durchläuft, war bereits vor dem ersten Kurs obsessiv. Das Diplom gibt der inneren Überzeugung eine Sprache und ein Abzeichen.',
  },
  {
    nr: 'VIII',
    title: 'Wir lehren keine Rezepte. Wir lehren Prinzipien.',
    body: 'Rezepte vergisst man. Prinzipien nicht. Wer versteht, warum Reverse Searing funktioniert, braucht kein Rezept mehr — er versteht das Fleisch.',
  },
  {
    nr: 'IX',
    title: 'Das perfekte Steak existiert.',
    body: 'Es ist kein Mythos, keine Utopie und kein Glücksfall. Es ist das Ergebnis von Wissen, Disziplin und dem Mut, das Thermometer zu benutzen. Wir helfen dir, es zu finden.',
  },
  {
    nr: 'X',
    title: 'Es gibt keine Entschuldigung für Unwissenheit.',
    body: 'Die Steakakademie existiert. Wer nach diesem Tag noch ein graues, trockenes Stück Fleisch serviert, hat eine Wahl getroffen — und das Fleisch verdient Besseres.',
  },
];

export default function ManifestClient() {
  return (
    <>
      <Header />

      <style>{`
        @media print {
          nav, footer, .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .thesis-nr { color: #8B6914 !important; }
          .thesis-title { color: #000 !important; }
          .thesis-body { color: #333 !important; }
        }
      `}</style>

      <main className="min-h-screen bg-surface-dark">

        {/* Header */}
        <section className="border-b border-brand-gold/15 py-20 px-4">
          <div className="max-w-editorial mx-auto">
            <nav className="flex items-center gap-1.5 text-xs font-sans text-text-light/55 mb-8" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
              <ChevronRight size={12} />
              <span className="text-text-light/65">Das Manifest</span>
            </nav>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-6">
                Steakakademie · Gründungsdokument · Mai 2026
              </span>
              <h1 className="font-serif text-6xl md:text-8xl font-bold text-text-light mb-6 leading-none tracking-tight">
                Das Manifest.
              </h1>
              <p className="font-body text-text-light/50 text-lg max-w-lg leading-relaxed">
                Zehn Thesen über Fleisch, Wissen und den Unterschied,
                den es macht, wenn man es ernst nimmt.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Theses */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-0">
          {THESES.map((t, i) => (
            <motion.div
              key={t.nr}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
              className="group"
            >
              <div className="py-10 border-b border-brand-gold/10 last:border-b-0">
                <div className="flex items-baseline gap-6">
                  <span className="thesis-nr text-brand-gold/65 font-serif text-4xl font-bold w-12 shrink-0 leading-none">
                    {t.nr}
                  </span>
                  <div>
                    <h2 className="thesis-title font-serif text-2xl md:text-3xl font-bold text-text-light mb-3 leading-tight group-hover:text-brand-gold transition-colors duration-300">
                      {t.title}
                    </h2>
                    <p className="thesis-body font-body text-text-light/50 text-base leading-relaxed max-w-2xl">
                      {t.body}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </section>

        {/* Seal */}
        <section className="py-20 px-4 text-center border-t border-brand-gold/10">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="inline-block"
          >
            <div className="border-2 border-brand-gold/40 w-40 h-40 flex flex-col items-center justify-center mx-auto mb-8 text-center rounded-full">
              <span className="text-4xl mb-1">🥩</span>
              <span className="text-brand-gold text-[10px] font-sans font-bold uppercase tracking-[0.2em] leading-tight">
                Steakakademie<br />MMXXVI
              </span>
            </div>
            <p className="font-body text-text-light/55 text-sm max-w-sm mx-auto leading-relaxed">
              Dieses Manifest gilt. Nicht weil wir es gesagt haben,
              sondern weil das Fleisch es verdient.
            </p>
            <p className="text-brand-gold font-serif font-bold text-xl mt-4">
              steakakademie.de
            </p>
          </motion.div>
        </section>

        {/* Actions */}
        <section className="no-print pb-20 px-4 flex flex-col sm:flex-row gap-4 justify-center items-center border-t border-brand-gold/10 pt-12">
          <button
            onClick={() => window.print()}
            className="px-8 py-3 border border-brand-gold/40 text-brand-gold font-sans font-bold tracking-[0.08em] uppercase text-sm hover:bg-brand-gold/10 transition-colors duration-300"
          >
            Drucken / Als PDF speichern ↓
          </button>
          <Link
            href="/diplome"
            className="px-8 py-3 bg-brand-gold/10 border border-brand-gold/50 text-brand-gold font-sans font-bold tracking-[0.08em] uppercase text-sm hover:bg-brand-gold/20 transition-colors duration-300"
          >
            Zum Diplom-System →
          </Link>
        </section>

      </main>
      <Footer />
    </>
  );
}
