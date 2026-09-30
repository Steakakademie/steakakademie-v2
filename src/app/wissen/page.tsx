import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Thermometer, Flame, Snowflake, Beef, BookOpen, LifeBuoy, Globe, Wheat, FlaskConical } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'BBQ-Wissen — Technik, Fleischkunde, Cuts',
  description:
    'Das gebündelte BBQ-Wissen der Steakakademie: Kerntemperaturen, Grilltechniken, Fleischreifung, Cuts, Lexikon und mehr — methodisch, präzise, nachvollziehbar.',
  alternates: { canonical: 'https://steakakademie.de/wissen' },
};

const HUB = [
  { href: '/temperatur-guide', icon: Thermometer, title: 'Kerntemperaturen', desc: 'Die vollständige Tabelle für jedes Fleisch — von Rare bis Well Done, mit der Wissenschaft dahinter (inkl. Maillard-Reaktion).' },
  { href: '/methoden', icon: Flame, title: 'Grilltechniken', desc: 'Direktes vs. indirektes Grillen, Reverse Sear, Low & Slow — die Methoden, die den Unterschied machen.' },
  { href: '/aging', icon: Snowflake, title: 'Fleischreifung', desc: 'Dry Aging vs. Wet Aging: Enzyme, Zeit, Bedingungen — die Precision Aging Matrix von 14 bis 90 Tagen.' },
  { href: '/cuts', icon: Beef, title: 'Cuts & Fleischkunde', desc: 'Welches Fleischteil ist was — Anatomie, Marmorierung, Herkunft und die richtige Zubereitung je Cut.' },
  { href: '/glossar', icon: BookOpen, title: 'BBQ-Lexikon', desc: 'Begriffe von A bis Z — Bark, Stall, Smoke Ring, Plateauphase: das Vokabular der Pitmaster.' },
  { href: '/rettung', icon: LifeBuoy, title: 'Steak-Rettung', desc: 'Wenn etwas schiefläuft: die häufigsten Fehler und wie du sie beim nächsten Mal vermeidest.' },
  { href: '/foodpairing', icon: FlaskConical, title: 'Foodpairing', desc: 'Warum Steak und Schokolade zusammenpassen: Schlüssel-Aromen, Aroma-Rad zum Ausprobieren und bekannte Kombinationen im Faktencheck.' },
  { href: '/terroir', icon: Globe, title: 'Meat-Terroir', desc: 'Warum Herkunft schmeckt: Rasse, Fütterung, Region — und was das für dein Fleisch bedeutet.' },
  // Freigegeben am 03.09.2026 (war vom 30.08. bis 03.09. ausgebaut, solange die
  // Serienteile auf status: review standen).
  { href: '/fleischwissen', icon: Wheat, title: 'Fleischwissen', desc: 'Dreiteilige Serie zur Herkunft: US-Feedlot gegen deutsche Bullenmast, Gras gegen Getreide, und was Schlachtstress mit deinem Steak macht. Mit Primärquellen.' },
];

export default function WissenHub() {
  return (
    <>
      <Header />
      <main className="bg-surface-base">
        <section className="border-b border-border-subtle">
          <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <nav className="flex items-center gap-1.5 text-xs font-sans text-text-muted mb-8" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
              <ChevronRight size={12} />
              <span className="text-text-secondary">Wissen</span>
            </nav>

            <div className="max-w-2xl">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-3">
                Wissens-Hub
              </span>
              <h1 className="font-serif text-3xl lg:text-4xl font-bold text-text-primary mb-4">
                BBQ-Wissen, methodisch geordnet
              </h1>
              <p className="font-body text-base text-text-secondary leading-relaxed">
                Kein Sammelsurium — eine geordnete Wissensbasis. Hier findest du die Grundlagen,
                die Technik und die Fleischkunde der Steakakademie, jeweils in eigene Tiefenstrecken aufbereitet.
              </p>
            </div>
          </div>
        </section>

        <section className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {HUB.map(({ href, icon: Icon, title, desc }) => (
              <Link
                key={href}
                href={href}
                className="group border border-border-subtle bg-surface-elevated p-6 hover:border-brand-gold/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <Icon size={22} className="text-brand-gold shrink-0 mt-0.5" />
                  <div>
                    <h2 className="font-serif text-lg font-bold text-text-primary group-hover:text-brand-gold transition-colors mb-1">
                      {title}
                    </h2>
                    <p className="font-body text-sm text-text-secondary leading-relaxed">{desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
