import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Crown, Wine, Trees, Scale, NotebookPen, Check, Lock } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import NewsletterSignup from '@/components/ui/NewsletterSignup';
import { FREE_LIMIT } from '@/lib/aroma-matcher/data';
import { ogImages } from '@/lib/og';

/**
 * /vip — Warteliste fuer den VIP-Pass (Lead-Magnet, Uwe-Plan vom 18.09.2026:
 * Warteliste mit Early-Bird).
 *
 * Bewusst KEIN Kaufbutton: Digistore-Produkt 734925 ist gesperrt, bis Webhook-
 * Mapping (734925 → VIP-Rolle), Testkauf und die VIP-Bausteine stehen. Die
 * Anmeldung laeuft ueber den Wissens-Brief (DOI, Loops) mit der Quelle
 * `vip-warteliste` → Loops-Gruppe `vip_warteliste`, damit die Launch-Mail an
 * genau diese Gruppe geht.
 *
 * EINE Warteliste (03.10.2026): Dies ist die einzige. Das Sperr-Modal des
 * Aroma-Matchers trug bis dahin in eine zweite ein (aroma_matrix_warteliste,
 * ohne jeden Versand) — es verweist jetzt auf `#warteliste` dieser Seite.
 *
 * Kein Startdatum auf der Seite (03.10.2026): Drei der vier Bausteine sind noch
 * nicht gebaut. Sie heissen „geplant", nicht „bald", und einen Termin nennt die
 * Seite erst, wenn er steht. Vorher stand an vier Stellen „Start Ende 2026".
 *
 * Preis: 49 € im Jahr (Uwe, 19.09.2026; Digistore-Plan 1507301). Eine
 * Monatsoption steht hier bewusst nicht — Preise werden auf dieser Seite nur
 * genannt, wenn sie mit Digistore uebereinstimmen, und nicht nebenbei eingefuehrt.
 */

export const dynamic = 'force-static';

const TITEL = 'VIP-SteakAkademiker — der Pass für Griller, die es genau wissen wollen';

export const metadata: Metadata = {
  title: 'VIP-SteakAkademiker — Warteliste',
  description:
    'Aroma-Matcher ohne Limit, Räucherholz-Finder, Profi-Rezepte grammgenau und Grill-Logbuch: Der VIP-Pass der Steakakademie ist in Vorbereitung. Jetzt auf die Warteliste — mit Early-Bird-Vorteil.',
  alternates: { canonical: 'https://steakakademie.de/vip' },
  openGraph: {
    images: ogImages('VIP-SteakAkademiker', 'Warteliste — in Vorbereitung'),
    title: TITEL,
    description: 'Der VIP-Pass der Steakakademie ist in Vorbereitung. Jetzt auf die Warteliste.',
    url: 'https://steakakademie.de/vip',
    type: 'website',
  },
};

const BAUSTEINE = [
  {
    icon: Wine,
    titel: 'Aroma-Matcher ohne Limit',
    // Der Matcher selbst läuft, mit Freikontingent. „Ohne Limit" gibt es noch
    // nicht — die API kennt keine VIP-Stufe (src/app/api/aroma-matcher/route.ts).
    text: `Rub, Räucherholz und das passende Glas zu jedem Cut — mit einem Satz, warum. Der Matcher läuft schon: ${FREE_LIMIT} Cuts sind gratis. Ohne Limit ist für den VIP-Pass geplant.`,
    status: 'teils',
    href: '/aroma-matcher',
  },
  {
    icon: Trees,
    titel: 'Räucherholz-Finder',
    text: 'Welches Holz zu welchem Grillgut, in welcher Dosierung, welche Mischungen. Die Warnliste der ungeeigneten Hölzer soll für alle frei sein.',
    status: 'geplant',
  },
  {
    icon: Scale,
    titel: 'Profi-Rezepte grammgenau',
    text: 'Die großen Grillklassiker — Pulled Pork, 3-2-1-Ribs, Brisket, Pastrami, Picanha — mit Rub-Verhältnissen in Gramm, Pökel-Prozenten, Kerntemperaturen nach Dicke und Drink-Pairing. Werbefrei, druckfertig.',
    status: 'geplant',
  },
  {
    icon: NotebookPen,
    titel: 'Grill-Logbuch',
    text: 'Der Fleischpass soll festhalten, was du wann wie gegrillt hast — Cut, Methode, Temperaturen, dein Urteil.',
    status: 'geplant',
    href: '/fleischpass',
  },
] as const;

const STATUS_ETIKETT = { teils: 'Gratis-Teil live', geplant: 'Geplant' } as const;

const BLEIBT_FREI = [
  'Cut-Atlas, Grilltechniken, Kerntemperaturen und alle Wissensartikel',
  'Alle Rezepte in Esslöffel, Teelöffel und Stück',
  `${FREE_LIMIT} Cuts im Aroma-Matcher`,
  'Marco, der KI-Grillmeister — auch als Sommelier am Grill',
  'Aroma-Tuning, Rezept-Schmiede, Hofladen-Radar',
];

export default function VipPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-base">
        <div className="mx-auto max-w-editorial px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <nav className="mb-6 flex items-center gap-1.5 font-sans text-xs text-text-muted" aria-label="Breadcrumb">
            <Link href="/" className="transition-colors hover:text-brand-fire">Start</Link>
            <ChevronRight size={12} />
            <span className="text-text-secondary">VIP</span>
          </nav>

          {/* Kopf */}
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-sans font-bold uppercase tracking-[0.22em] text-brand-gold">
              <Crown size={12} /> VIP-SteakAkademiker · in Vorbereitung
            </span>
            <h1 className="mt-2 font-serif text-3xl leading-tight text-text-primary sm:text-4xl">
              Der Pass für Griller, die es genau wissen wollen.
            </h1>
            <p className="mt-4 font-body text-[1.05rem] leading-relaxed text-text-secondary">
              Die Steakakademie bleibt frei — das Wissen, die Cuts, die Rezepte. Der VIP-Pass legt
              die Profi-Schicht darüber: grammgenau statt Esslöffel, ohne Limit statt Kontingent,
              druckfertig statt Werbung. Er ist in Vorbereitung; einen Starttermin nennen wir erst,
              wenn er steht. Wer auf der Warteliste steht, erfährt es zuerst und bekommt den
              Early-Bird-Preis.
            </p>
            <p className="mt-3 font-sans text-sm text-text-muted">
              <span className="font-semibold text-text-primary">49 € im Jahr.</span> Warteliste: 20 % Early-Bird-Rabatt
              zum Start.
            </p>
          </div>

          {/* Bausteine */}
          <section className="mt-10 grid gap-4 md:grid-cols-2" aria-labelledby="vip-bausteine">
            <h2 id="vip-bausteine" className="sr-only">Was im VIP-Pass steckt</h2>
            {BAUSTEINE.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.titel} className="flex flex-col rounded-xl border border-brand-gold/25 bg-surface-card p-5">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-brand-fire">
                      <Icon size={18} />
                      <h3 className="font-serif text-lg font-bold text-text-light">{b.titel}</h3>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-0.5 text-[10px] font-sans font-bold uppercase tracking-[0.18em] ${
                        b.status === 'teils' ? 'bg-brand-gold text-ink' : 'border border-border-subtle text-text-muted'
                      }`}
                    >
                      {STATUS_ETIKETT[b.status]}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-text-secondary">{b.text}</p>
                  {'href' in b && b.href && (
                    <Link
                      href={b.href}
                      className="mt-4 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-brand-gold hover:gap-2 transition-[gap]"
                    >
                      Ansehen <ChevronRight size={14} />
                    </Link>
                  )}
                </div>
              );
            })}
          </section>

          {/* Warteliste */}
          <section id="warteliste" className="mt-12 scroll-mt-24">
            <NewsletterSignup
              source="vip-warteliste"
              eyebrow="Warteliste · Early-Bird"
              headline="Auf die VIP-Warteliste."
              subline="Du erfährst als Erster, wenn der VIP-Pass startet — mit 20 % Early-Bird-Rabatt. Bis dahin der Wissens-Brief: BBQ-Wissen, das bleibt — ohne festen Takt, ohne Spam. Jederzeit abbestellbar."
              cta="Auf die Warteliste"
            />
          </section>

          {/* Was frei bleibt */}
          <section className="mt-12 grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="font-serif text-2xl font-bold text-text-primary">Was für alle frei bleibt</h2>
              <p className="mt-2 text-sm text-text-secondary">
                Nie das Gesamtangebot hinter einer Bezahlschranke — das ist die Regel des Hauses.
              </p>
              <ul className="mt-4 space-y-2">
                {BLEIBT_FREI.map((z) => (
                  <li key={z} className="flex items-start gap-2 text-sm text-text-secondary">
                    <Check size={16} className="mt-0.5 shrink-0 text-brand-gold" /> {z}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-border-subtle bg-surface-card p-5">
              <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-text-light">
                <Lock size={16} className="text-brand-gold" /> Warum noch kein Kaufbutton?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                Weil wir nichts verkaufen, was noch nicht da ist. Der Aroma-Matcher läuft mit Freikontingent;
                Räucherholz-Finder, Profi-Rezepte und Grill-Logbuch sind geplant und noch nicht gebaut. Der Pass
                kommt, wenn alle vier Bausteine stehen — und die Warteliste erfährt es zuerst.
              </p>
              <h3 className="mt-5 font-sans text-xs font-bold uppercase tracking-[0.18em] text-text-muted">
                So funktioniert die Warteliste
              </h3>
              <ol className="mt-2 space-y-1.5 text-sm text-text-secondary">
                <li>1. E-Mail eintragen, Bestätigungslink klicken (Double-Opt-in).</li>
                <li>2. Bis dahin der Wissens-Brief, ohne festen Takt — kein Verkaufsdruck, keine Countdown-Mails.</li>
                <li>3. Zum Start eine Mail mit deinem Early-Bird-Preis. Fertig.</li>
              </ol>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
