import type { Metadata } from 'next';
import Link from 'next/link';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { ChevronRight, Thermometer, Flame, ShieldAlert, Clock } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PrintButton from '@/components/gutschein/PrintButton';
import NewsletterSignup from '@/components/ui/NewsletterSignup';
import { ogImages } from '@/lib/og';

export const metadata: Metadata = {
  title: 'Kerntemperatur-Spickzettel zum Ausdrucken',
  description:
    'Der Kerntemperatur-Spickzettel: alle Garstufen für Rind, Schwein, Lamm, Geflügel und Fisch auf einer Seite — druckfertig für die Grillstation.',
  alternates: { canonical: 'https://steakakademie.de/kerntemperatur-spickzettel' },
  openGraph: {
    images: ogImages('Der Kerntemperatur-Spickzettel — druckfertig'),
    title: 'Der Kerntemperatur-Spickzettel — druckfertig',
    description: 'Alle Kerntemperaturen auf einer Seite. Keine Faustregeln — Werte, die stimmen.',
    url: 'https://steakakademie.de/kerntemperatur-spickzettel',
    type: 'website',
  },
};

// ── Kanonische Referenz laden (Single Source of Truth, Regel 8c) ─────────────
interface Badge { c: number; range: [number, number]; label: string }
interface Referenz {
  meta: { carryover: string; ruhen: string; messen: string };
  badges: Record<string, Badge>;
  sicherheit: Record<string, number>;
}

function loadReferenz(): Referenz {
  const raw = readFileSync(join(process.cwd(), 'data', 'kerntemperatur-referenz.yaml'), 'utf8');
  return yaml.load(raw) as Referenz;
}

// Anzeige-Gruppen: Badge-Key → menschlicher Eintrag (Werte kommen aus der YAML).
const GRUPPEN: { titel: string; rows: { key: string; was: string }[] }[] = [
  {
    titel: 'Rind',
    rows: [
      { key: 'beef_mr', was: 'Premium-Steaks — Ribeye, Filet, T-Bone, Porterhouse' },
      { key: 'wagyu', was: 'Wagyu — das Fett schmilzt früher' },
      { key: 'beef_lowslow', was: 'Brisket & Short Ribs — Kollagen wird Gelatine' },
    ],
  },
  {
    titel: 'Schwein',
    rows: [
      { key: 'pork_juicy', was: 'Kotelett, Filet, Steaks' },
      { key: 'pork_kruste', was: 'Krustenbraten' },
      { key: 'pork_lowslow', was: 'Pulled Pork & Spareribs' },
    ],
  },
  {
    titel: 'Lamm',
    rows: [
      { key: 'lamb_mr', was: 'Karree, Koteletts' },
      { key: 'lamb_rosa', was: 'Lammkeule rosa' },
      { key: 'lamb_done', was: 'Keule' },
    ],
  },
  {
    titel: 'Geflügel & Hack',
    rows: [
      { key: 'poultry', was: 'Hähnchen & Pute — immer vollständig durchgaren' },
      { key: 'duck_breast', was: 'Entenbrust — darf rosa sein' },
      { key: 'duck_whole', was: 'Ganze Ente / Gans' },
      { key: 'burger', was: 'Burger-Patty — gewolftes Fleisch immer durch' },
    ],
  },
  {
    titel: 'Fisch',
    rows: [
      { key: 'salmon', was: 'Lachs' },
      { key: 'tuna', was: 'Thunfisch — nur scharf angegrillt' },
      { key: 'whitefish', was: 'Dorade, Kabeljau, Rotbarbe, Schwertfisch, Mahi-Mahi' },
      { key: 'oily_whole', was: 'Ganze Makrele / Sardine' },
    ],
  },
];

export default function SpickzettelPage() {
  const ref = loadReferenz();

  return (
    <>
      {/* Print: nur das Blatt, hell auf weiß */}
      <style>{`
        @media print {
          @page { margin: 12mm; }
          body { background: #fff !important; }
          .print-sheet, .print-sheet * { color: #111 !important; background: #fff !important; border-color: #999 !important; }
          .print-sheet .accent { color: #8a5a14 !important; }
        }
      `}</style>

      <div className="print:hidden"><Header /></div>

      <main className="min-h-screen bg-surface-base">
        <div className="mx-auto max-w-editorial px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          {/* Breadcrumb + Intro (nicht im Druck) */}
          <div className="print:hidden">
            <nav className="mb-6 flex items-center gap-1.5 font-sans text-xs text-text-muted" aria-label="Breadcrumb">
              <Link href="/" className="transition-colors hover:text-brand-fire">Start</Link>
              <ChevronRight size={12} />
              <Link href="/temperatur-guide" className="transition-colors hover:text-brand-fire">Temperatur-Guide</Link>
              <ChevronRight size={12} />
              <span className="text-text-secondary">Spickzettel</span>
            </nav>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl">
                <h1 className="font-serif text-3xl leading-tight text-text-primary sm:text-4xl">
                  Der Kerntemperatur-Spickzettel
                </h1>
                <p className="mt-3 font-body text-[1rem] leading-relaxed text-text-secondary">
                  Alle Werte auf einer Seite — ausdrucken, an die Grillstation hängen, nie wieder raten.
                  Das sind die autoritativen Werte der Steakakademie, keine Internet-Faustregeln.
                </p>
              </div>
              <PrintButton label="Spickzettel drucken" />
            </div>
          </div>

          {/* ── Das Blatt ──────────────────────────────────────────────────── */}
          <div className="print-sheet rounded-sm border border-border-subtle bg-surface-elevated p-6 sm:p-8">
            {/* Kopf */}
            <div className="mb-6 flex items-center justify-between border-b-2 border-text-primary pb-4">
              <div>
                <div className="accent font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-brand-gold">
                  Steakakademie · Pitmaster-Doktrin
                </div>
                <div className="font-serif text-2xl font-bold text-text-primary">Kerntemperaturen</div>
              </div>
              <Thermometer size={28} className="accent text-brand-gold" />
            </div>

            {/* 3 Regeln */}
            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              {[
                { Icon: Flame, t: 'Nachziehen', d: ref.meta.carryover },
                { Icon: Clock, t: 'Ruhen', d: ref.meta.ruhen },
                { Icon: Thermometer, t: 'Messen', d: ref.meta.messen },
              ].map(({ Icon, t, d }) => (
                <div key={t} className="rounded-sm border border-border-subtle p-3">
                  <div className="mb-1 flex items-center gap-1.5">
                    <Icon size={13} className="accent text-brand-gold" />
                    <span className="font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-text-primary">{t}</span>
                  </div>
                  <p className="font-body text-[0.82rem] leading-snug text-text-secondary">{d}</p>
                </div>
              ))}
            </div>

            {/* Tabellen je Gruppe */}
            <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
              {GRUPPEN.map((g) => (
                <section key={g.titel}>
                  <h2 className="accent mb-2 border-b border-border-subtle pb-1 font-serif text-lg font-bold text-brand-gold">
                    {g.titel}
                  </h2>
                  <table className="w-full border-collapse font-body text-[0.88rem]">
                    <tbody>
                      {g.rows.map(({ key, was }) => {
                        const b = ref.badges[key];
                        if (!b) return null;
                        return (
                          <tr key={key} className="border-b border-border-subtle/60 align-top">
                            <td className="py-1.5 pr-2 text-text-secondary">{was}</td>
                            <td className="whitespace-nowrap py-1.5 pr-2 text-right font-sans font-bold text-text-primary">
                              {b.range[0] === b.range[1] ? `${b.c} °C` : `${b.range[0]}–${b.range[1]} °C`}
                            </td>
                            <td className="whitespace-nowrap py-1.5 font-sans text-[0.78rem] text-text-muted">{b.label}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </section>
              ))}

              {/* Sicherheit */}
              <section>
                <h2 className="mb-2 flex items-center gap-1.5 border-b border-border-subtle pb-1 font-serif text-lg font-bold text-brand-fire">
                  <ShieldAlert size={15} /> Nie unterschreiten
                </h2>
                <table className="w-full border-collapse font-body text-[0.88rem]">
                  <tbody>
                    {[
                      { was: 'Schweinefleisch', key: 'schwein' },
                      { was: 'Geflügel', key: 'gefluegel' },
                      { was: 'Hackfleisch (gewolft)', key: 'hackfleisch' },
                      { was: 'Wildschwein (Trichinen)', key: 'wildschwein' },
                    ].map(({ was, key }) => (
                      <tr key={key} className="border-b border-border-subtle/60">
                        <td className="py-1.5 pr-2 text-text-secondary">{was}</td>
                        <td className="whitespace-nowrap py-1.5 text-right font-sans font-bold text-text-primary">
                          ≥ {ref.sicherheit[key]} °C
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </div>

            {/* Fuß */}
            <div className="mt-6 flex items-center justify-between border-t border-border-subtle pt-3 font-sans text-[0.72rem] text-text-muted">
              <span>Alle Werte = Kerntemperatur im dicksten Punkt, gemessen vor dem Ruhen.</span>
              <span className="accent font-bold text-brand-gold">steakakademie.de</span>
            </div>
          </div>

          {/* CTA (nicht im Druck) — Audit 15.08.2026: war ein Link auf /newsletter,
              also ein Klick zwischen Interesse und Eintrag. Header und Top-Bar zeigen
              jetzt hierher, deshalb steht das Formular direkt hier.
              Hinweis: Solange es die PDF-Fassung nicht gibt (Block B1), ist diese Seite
              frei zugänglich — das Formular sammelt, der Inhalt bleibt indexierbar. */}
          <div className="mt-10 print:hidden">
            <NewsletterSignup
              source="spickzettel-seite"
              eyebrow="Kostenloses Geschenk"
              headline="Diese Seite als Spickzettel ins Postfach."
              subline="Wir schicken dir die druckfertige Fassung — plus jeden Freitag ein Stück BBQ-Wissen, das bleibt. Kostenlos, jederzeit abbestellbar."
              cta="Spickzettel sichern"
            />
          </div>
        </div>
      </main>
      <div className="print:hidden"><Footer /></div>
    </>
  );
}
