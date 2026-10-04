import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, ArrowRight, MapPin, Award, Compass } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

/**
 * USA-Expedition — die vier US-BBQ-Stile (content/usa/) plus Adressen.
 *
 * Geführte Roadtrips und ein USA-Diplom sind IN VORBEREITUNG (Entscheidung Uwe,
 * 03.10.2026). Bis dahin standen hier drei Routen mit Dauer, Preis, Planungsjahr
 * und dem Knopf „Interesse bekunden", dazu eine Kachel „USA-Diplom" mit
 * Online-Prüfung und Urkunde per Post. Buchbar war davon nichts, ein USA-Diplom
 * kennt das Diplom-System nicht (src/lib/diplome/stufen.ts).
 * Die alte Fassung liegt in der Git-Historie.
 *
 * Geblieben ist, was es gibt: die vier Stile, zwei Angebote Dritter mit Link zum
 * Veranstalter und die Smokehouse-Adressen als Liste — ohne Route, Dauer, Preis
 * oder Termin. Vorbild für den Vorbereitungs-Hinweis: /fleischpass.
 */

export const metadata: Metadata = {
  title: 'The Pitmaster Pilgrimage — US-BBQ-Expedition',
  description:
    'Die vier großen US-BBQ-Stile — Texas, Kansas City, Memphis, Carolinas —, dazu Camp Brisket an der Texas A&M, die KCBS-Juroren-Schulung und Smokehouse-Adressen nach Region. Der Pilgerstätten-Überblick für ernsthafte Grillmeister.',
};

const SACRED_FOUR = [
  {
    state: 'Texas',
    flag: '🤠',
    style: 'Central Texas Style',
    icon: '🥩',
    color: 'from-red-950/80 to-surface-base',
    accent: '#C8882A',
    signature: 'Brisket — 14 Stunden, Post-Oak-Rauch, kein Zucker',
    pillars: ['Beef Brisket', 'Beef Ribs', 'Hot Links', 'Pork Ribs'],
    creed:
      'Salt, Pepper, Smoke. Das ist Gesetz. Sauce kommt auf dem Nebentisch. Texas BBQ ist ein Bekenntnis zur Reinheit — keine Ablenkungen, kein Verstecken hinter Süße.',
    legend: 'Franklin Barbecue, Austin',
    href: '/usa-expedition/texas-style',
  },
  {
    state: 'Kansas City',
    flag: '🎷',
    style: 'Kansas City Style',
    icon: '🍖',
    color: 'from-orange-950/80 to-surface-base',
    accent: '#E85018',
    signature: 'Burnt Ends — der karamellisierte Brisket-Würfel',
    pillars: ['Burnt Ends', 'Pulled Pork', 'Baby Back Ribs', 'Baked Beans'],
    creed:
      'Alles ist erlaubt — jedes Fleisch, jede Sauce. Kansas City ist die demokratischste BBQ-Stadt der Welt. Sweet, sticky, smoky. Die Sauce regiert.',
    legend: 'Arthur Bryant\'s, Kansas City',
    href: '/usa-expedition/kansas-city',
  },
  {
    state: 'Memphis',
    flag: '🎸',
    style: 'Memphis Style',
    icon: '🐖',
    color: 'from-purple-950/80 to-surface-base',
    accent: '#A97CBD',
    signature: 'Dry Ribs — Rub-only, kein Sauce-Kompromiss',
    pillars: ['Dry Ribs', 'Wet Ribs', 'Pulled Pork', 'Spaghetti'],
    creed:
      'Memphis ist das BBQ der Musiker, der Nachteulen, der Nonkonformisten. Trocken oder nass — das ist die einzige Frage, die zählt. Pork ist Religion.',
    legend: 'Central BBQ, Memphis',
    href: '/usa-expedition/memphis',
  },
  {
    state: 'Carolinas',
    flag: '🐓',
    style: 'Carolina Style',
    icon: '🫙',
    color: 'from-yellow-950/60 to-surface-base',
    accent: '#D4A017',
    signature: 'Whole Hog — das Tier in seiner vollständigen Würde',
    pillars: ['Whole Hog', 'Pulled Pork', 'Vinegar Sauce', 'Coleslaw'],
    creed:
      'Das älteste BBQ Amerikas. Kein Rind, kein Kompromiss — nur das ganze Schwein über Hickory-Holz. North Carolina schwört auf Vinegar, South Carolina auf Mustard. Der Krieg geht weiter.',
    legend: 'Skylight Inn, Ayden NC',
    href: '/usa-expedition/carolinas',
  },
];

const ACADEMY_TOUR = [
  {
    id: 'camp-brisket',
    title: 'Camp Brisket',
    subtitle: 'Texas A&M University',
    description:
      'Das einzige universitäre BBQ-Seminar der Welt. Meat Scientists und Pitmaster-Legenden über zwei Tage — Wissenschaft trifft Glutglut in College Station, Texas.',
    badge: 'Wissenschaft',
    badgeColor: 'text-sky-400 border-sky-900/40',
    icon: '🎓',
    details: ['2-Tage-Intensivseminar', 'Texas A&M Meat Science Lab', 'Jährlich Januar', 'Limitiert auf 200 Teilnehmer'],
    href: 'https://meat.tamu.edu',
    external: true,
  },
  {
    id: 'kcbs-judge',
    title: 'KCBS Certified Judge',
    subtitle: 'Kansas City Barbecue Society',
    description:
      'Werde offizieller Wettbewerbs-Juror der KCBS — dem weltgrößten BBQ-Verband. Zwei Stunden Theorie, danach Verkostung. Gültig bei allen KCBS-sanctionierten Events weltweit.',
    badge: 'Zertifikat',
    badgeColor: 'text-brand-gold border-brand-gold/30',
    icon: '⚖️',
    details: ['Eintagesschulung', 'Online + Präsenz', 'Weltweit anerkannt', 'KCBS-Membership inkl.'],
    href: 'https://kcbs.us',
    external: true,
  },
];

// Adressen nach Region — eine Liste zum Selbstplanen, kein Reiseangebot.
const PILGERSTAETTEN = [
  {
    id: 'texas',
    region: 'Texas Hill Country & Austin',
    adressen: ['Franklin Barbecue', 'La Barbecue', 'Snow\'s BBQ', 'Louie Mueller', 'Cooper\'s Old Time Pit Bar-B-Que'],
    image: '/images/articles/brisket-texas-smoked.webp',
  },
  {
    id: 'bbq-belt',
    region: 'Memphis · Kansas City · St. Louis',
    adressen: ['Central BBQ Memphis', 'Rendezvous Memphis', 'Arthur Bryant\'s KC', 'Joe\'s KC', 'Pappys Smokehouse'],
    image: '/images/articles/reverse-sear-cast-iron-steak.webp',
  },
  {
    id: 'carolinas',
    region: 'North & South Carolina',
    adressen: ['Skylight Inn Ayden', 'Grady\'s BBQ', 'Scott\'s BBQ', 'Sweatman\'s BBQ'],
    image: '/images/articles/ribeye-premium-cut.webp',
  },
];

export default function UsaExpeditionPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen" style={{ background: '#17100B' }}>

        {/* ── HERO — Full-Bleed 60vh ─────────────────────────────────────── */}
        <section className="hero-fullbleed" style={{ height: '60vh', minHeight: '480px' }}>
          <Image
            src="/images/articles/usa-expedition-smoker-hero.webp"
            alt="Großer Offset-Smoker mit Rauch bei Sonnenuntergang — Texas BBQ Pitmaster"
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ filter: 'brightness(0.42) contrast(1.12) saturate(0.65)' }}
          />
          {/* Overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(to bottom, rgba(23,16,11,0.10) 0%, rgba(23,16,11,0.30) 30%, rgba(23,16,11,0.80) 70%, #17100B 100%)',
            }}
          />
          {/* Ambient ember glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 60% 40% at 30% 60%, rgba(232,80,24,0.12) 0%, transparent 70%)',
            }}
          />
          {/* Content */}
          <div className="hero-fullbleed-content">
            <div className="max-w-editorial mx-auto w-full px-4 sm:px-6 lg:px-8 pb-16 lg:pb-24">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.25em] uppercase mb-4"
                style={{ color: '#E85018' }}>
                Steakakademie · USA-Expedition
              </span>
              <h1
                className="font-serif font-bold leading-[1.05] mb-5"
                style={{
                  fontSize: 'clamp(2.2rem, 5vw, 4.5rem)',
                  color: '#F0E8D8',
                  maxWidth: '820px',
                  textShadow: '0 2px 24px rgba(0,0,0,0.6)',
                }}
              >
                The Pitmaster Pilgrimage —<br />
                <span style={{ color: '#C8882A' }}>Die US-BBQ-Expedition.</span>
              </h1>
              <p
                className="font-body leading-relaxed"
                style={{ color: 'rgba(230,213,195,0.65)', maxWidth: '580px', fontSize: '1.05rem' }}
              >
                Vier Stile. Jahrzehnte Handwerk. Tausende Meilen Smoke-Trail.
                Wer BBQ versteht, muss es gelebt haben.
              </p>
            </div>
          </div>
        </section>

        {/* ── INTRO — Kurze Editorial-Zeile ─────────────────────────────── */}
        <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-4">
          <div className="flex items-start gap-5 max-w-3xl">
            <div className="h-px mt-3 w-12 shrink-0" style={{ background: '#C8882A' }} />
            <p className="font-body leading-relaxed" style={{ color: '#C4A882', fontSize: '1rem' }}>
              Amerika hat keine einheitliche BBQ-Wahrheit — es hat vier Wahrheiten. Regional, dogmatisch,
              und jede davon überzeugt, die einzig richtige zu sein. Wer versteht, warum Texas keinen Zucker
              braucht und North Carolina kein Rind kennt, der versteht BBQ.
            </p>
          </div>
        </section>

        {/* ── ASYMMETRISCHES GRID ────────────────────────────────────────── */}
        <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">

          {/* Row 1: Sacred Four (2/3) + Lernen vor Ort (1/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

            {/* ── THE SACRED FOUR — 2/3 Breite ──────────────────────────── */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-5">
                <MapPin size={14} style={{ color: '#E85018' }} />
                <span className="font-sans text-[10px] font-bold tracking-[0.22em] uppercase" style={{ color: '#E85018' }}>
                  The Sacred Four
                </span>
                <div className="h-px flex-1" style={{ background: 'rgba(200,136,42,0.18)' }} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SACRED_FOUR.map((region) => (
                  <Link
                    key={region.state}
                    href={region.href}
                    className="group block relative overflow-hidden transition-colors duration-300 border border-brand-gold/[0.12] hover:border-brand-gold/[0.35]"
                    style={{ background: '#1E1410' }}
                  >
                    {/* Ambient gradient top */}
                    <div
                      className="absolute inset-x-0 top-0 h-24 pointer-events-none"
                      style={{
                        background: `linear-gradient(to bottom, ${region.accent}14 0%, transparent 100%)`,
                      }}
                    />

                    <div className="relative p-5">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-2xl">{region.flag}</span>
                        <span
                          className="font-sans text-[9px] font-bold tracking-[0.18em] uppercase px-2 py-0.5 border"
                          style={{ color: region.accent, borderColor: `${region.accent}40` }}
                        >
                          {region.style}
                        </span>
                      </div>

                      <h2 className="font-serif text-xl font-bold mb-1 group-hover:text-brand-gold transition-colors"
                        style={{ color: '#F0E8D8' }}>
                        {region.state}
                      </h2>
                      <p className="font-sans text-[11px] mb-3" style={{ color: region.accent }}>
                        {region.signature}
                      </p>

                      <p className="font-body text-xs leading-relaxed mb-4" style={{ color: 'rgba(196,168,130,0.70)' }}>
                        {region.creed}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {region.pillars.map((p) => (
                          <span
                            key={p}
                            className="font-sans text-[9px] tracking-wide px-2 py-0.5"
                            style={{ background: 'rgba(200,136,42,0.07)', color: '#9F8A7B' }}
                          >
                            {p}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between border-t pt-3"
                        style={{ borderColor: 'rgba(200,136,42,0.12)' }}>
                        <span className="font-sans text-[10px]" style={{ color: '#9F8A7B' }}>
                          {region.legend}
                        </span>
                        <ChevronRight
                          size={13}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: '#C8882A' }}
                        />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* ── LERNEN VOR ORT — 1/3 Breite, Angebote Dritter ─────────── */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-5">
                <Award size={14} style={{ color: '#E85018' }} />
                <span className="font-sans text-[10px] font-bold tracking-[0.22em] uppercase" style={{ color: '#E85018' }}>
                  Lernen vor Ort
                </span>
                <div className="h-px flex-1" style={{ background: 'rgba(200,136,42,0.18)' }} />
              </div>

              <p className="font-sans text-[10px] mb-4" style={{ color: '#9F8A7B' }}>
                Angebote der jeweiligen Veranstalter, nicht der Steakakademie. Termine, Plätze und
                Bedingungen stehen dort.
              </p>

              <div className="space-y-4">
                {ACADEMY_TOUR.map((item) => (
                  <div
                    key={item.id}
                    className="group"
                    style={{
                      background: '#1E1410',
                      border: '1px solid rgba(200,136,42,0.12)',
                    }}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-xl">{item.icon}</span>
                        <span
                          className={`font-sans text-[9px] font-bold tracking-[0.18em] uppercase px-2 py-0.5 border ${item.badgeColor}`}
                        >
                          {item.badge}
                        </span>
                      </div>

                      <h3 className="font-serif text-base font-bold mb-0.5" style={{ color: '#F0E8D8' }}>
                        {item.title}
                      </h3>
                      <p className="font-sans text-[10px] mb-3" style={{ color: '#9F8A7B' }}>
                        {item.subtitle}
                      </p>

                      <p className="font-body text-xs leading-relaxed mb-4" style={{ color: 'rgba(196,168,130,0.8)' }}>
                        {item.description}
                      </p>

                      <ul className="space-y-1 mb-4">
                        {item.details.map((d) => (
                          <li key={d} className="flex items-center gap-2 font-sans text-[10px]"
                            style={{ color: '#9F8A7B' }}>
                            <span style={{ color: '#C8882A' }}>·</span>
                            {d}
                          </li>
                        ))}
                      </ul>

                      <Link
                        href={item.href}
                        target={item.external ? '_blank' : undefined}
                        rel={item.external ? 'noopener noreferrer' : undefined}
                        className="inline-flex items-center gap-1.5 font-sans text-[10px] font-bold tracking-widest uppercase transition-colors"
                        style={{ color: '#C8882A' }}
                      >
                        {item.external ? 'Externe Website' : 'Mehr erfahren'}
                        <ChevronRight size={11} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── PILGERSTÄTTEN — Volle Breite, Adressen ohne Reiseangebot ───── */}
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-5">
              <Compass size={14} style={{ color: '#E85018' }} />
              <span className="font-sans text-[10px] font-bold tracking-[0.22em] uppercase" style={{ color: '#E85018' }}>
                Pilgerstätten
              </span>
              <div className="h-px flex-1" style={{ background: 'rgba(200,136,42,0.18)' }} />
              <span className="font-sans text-[10px]" style={{ color: '#9F8A7B' }}>
                Smokehouse-Adressen nach Region
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {PILGERSTAETTEN.map((ort, i) => (
                <div
                  key={ort.id}
                  className="relative overflow-hidden"
                  style={{
                    background: '#1E1410',
                    border: '1px solid rgba(200,136,42,0.12)',
                  }}
                >
                  {/* Image area — Schmuckbild */}
                  <div className="relative h-40 overflow-hidden">
                    <Image
                      src={ort.image}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                      style={{ filter: 'brightness(0.45) saturate(0.6)' }}
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(to bottom, transparent 30%, rgba(30,20,16,0.95) 100%)',
                      }}
                    />
                    <div className="absolute top-3 left-3" aria-hidden="true">
                      <span
                        className="font-serif font-bold"
                        style={{ fontSize: '3rem', lineHeight: 1, color: 'rgba(200,136,42,0.15)' }}
                      >
                        0{i + 1}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="font-serif text-lg font-bold mb-3" style={{ color: '#F0E8D8' }}>
                      {ort.region}
                    </h3>
                    <ul className="space-y-0.5">
                      {ort.adressen.map((adresse) => (
                        <li key={adresse} className="font-sans text-[10px] flex items-center gap-2" style={{ color: '#9F8A7B' }}>
                          <span style={{ color: '#C8882A' }} aria-hidden="true">→</span>
                          {adresse}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── IN VORBEREITUNG — Roadtrips und USA-Diplom ─────────────────── */}
        <section
          className="mt-16 py-20 px-4 text-center"
          style={{ borderTop: '1px solid rgba(200,136,42,0.12)' }}
        >
          <p className="font-sans text-[10px] font-bold tracking-[0.25em] uppercase mb-4" style={{ color: '#E85018' }}>
            In Vorbereitung
          </p>
          <h2 className="font-serif font-bold mb-4" style={{ color: '#F0E8D8', fontSize: 'clamp(1.8rem, 3vw, 2.8rem)' }}>
            Geführte Roadtrips und ein USA-Diplom
          </h2>
          <p className="font-body text-sm leading-relaxed mx-auto mb-3 max-w-md" style={{ color: 'rgba(196,168,130,0.75)' }}>
            Beides gibt es noch nicht. Deshalb stehen hier keine Routen zum Buchen, keine Termine
            und keine Preise.
          </p>
          <p className="font-body text-sm leading-relaxed mx-auto mb-8 max-w-md" style={{ color: 'rgba(196,168,130,0.75)' }}>
            Was es schon gibt: die vier Stile weiter oben — und die Techniken dahinter, zum Nachmachen
            am eigenen Grill.
          </p>
          <Link
            href="/methoden"
            className="inline-flex items-center gap-2 px-8 py-4 font-sans font-bold text-sm tracking-[0.1em] uppercase"
            style={{
              border: '1px solid rgba(200,136,42,0.45)',
              color: '#C8882A',
            }}
          >
            Zu den Grilltechniken
            <ArrowRight size={14} />
          </Link>
          <p className="font-body text-xs leading-relaxed mx-auto mt-6 max-w-md" style={{ color: 'rgba(196,168,130,0.75)' }}>
            Dazu der{' '}
            <Link href="/newsletter" className="underline" style={{ color: '#C8882A' }}>
              Wissens-Brief
            </Link>
            : BBQ-Wissen, das bleibt — ohne festen Takt, ohne Spam.
          </p>
        </section>

      </main>

      <Footer />
    </>
  );
}
