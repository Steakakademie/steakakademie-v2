import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, CheckCircle2, XCircle, ArrowRight, Lock, CalendarClock, Users } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ogImages } from '@/lib/og';
import { angebotFuer, euro, CHECKOUT_URL, PILOT_ENDE, PILOT_PLAETZE, PILOT_PREIS, REGULAERER_PREIS } from '@/lib/eigenregie/angebot';
import { vergebenePlaetze } from '@/lib/eigenregie/plaetze.server';
import { KOSTEN } from '@/lib/eigenregie/diagnose';
import { allEigenregieModuls } from 'contentlayer/generated';

export const metadata: Metadata = {
  // Uwe, 02.09.2026: noindex — Gruender-Bereich ist aus der Steakakademie ausgebaut. CLAUDE.md Abschnitt 10.
  robots: { index: false, follow: false },
  title: 'Eigenregie: Deine Website in deiner Hand',
  description:
    'Selbstlern-Kurs: Du holst deine Website in ein eigenes Projekt — eigene Konten, eigener Code, eigene Domain. Diagnose plus sechs Module mit prüfbaren Ergebnissen.',
  alternates: { canonical: 'https://steakakademie.de/eigenregie' },
  openGraph: {
    images: ogImages('Eigenregie — Dein Business „KOMPLETT“ in Eigenregie.'),
    title: 'Eigenregie — Dein Business „KOMPLETT“ in Eigenregie.',
    description: 'Eigene Konten, eigener Code, eigene Domain. Selbstbau mit Claude Code, Schritt für Schritt — ehrlich kalkuliert.',
    url: 'https://steakakademie.de/eigenregie',
    type: 'website',
  },
};

/** Preis/Plätze serverseitig, alle 5 Minuten neu — für jeden Besucher identisch. */
export const revalidate = 300;

/**
 * Verkauf erst an, wenn der Testkauf durch ist (Uwe, 19.09.2026: „Ein Testkauf, dann wieder aktiv schalten“).
 * Schalter: Vercel-Env NEXT_PUBLIC_EIGENREGIE_VERKAUF=an (alle Umgebungen) + Redeploy.
 */
const VERKAUF_AN = process.env.NEXT_PUBLIC_EIGENREGIE_VERKAUF === 'an';
/**
 * Redaktionsvorbehalt: ohne Freigabe aller Module kein Kaufbutton — egal, was der Schalter sagt.
 * Gezählt werden die sechs nummerierten Module (order > 0); das Startkapitel (order 0) muss ebenfalls freigegeben sein.
 */
const INHALT_FREIGEGEBEN =
  allEigenregieModuls.filter((m) => m.order > 0).length === 6 &&
  allEigenregieModuls.every((m) => m.status === 'published' && m.reviewed);

const MODULE = [
  { nr: 0, titel: 'Diagnose und Zielbild', ergebnis: 'Dein persönlicher Weg: Reihenfolge, Zeitplan, Werkzeugkosten.' },
  { nr: 1, titel: 'Ownership: Konten, Domain, Repository', ergebnis: 'Alle Zugänge nachweislich in deiner Hand, eigenes Code-Repository.' },
  { nr: 2, titel: 'Migration in ein eigenes Projekt', ergebnis: 'Deine Seite läuft lokal in neuer Form, alle alten Adressen abgebildet.' },
  { nr: 3, titel: 'Live gehen ohne Ausfall', ergebnis: 'Deine Domain zeigt auf dein Projekt — E-Mail und Weiterleitungen geprüft.' },
  { nr: 4, titel: 'Claude Code als dauerhaftes Werkzeug', ergebnis: 'Drei Änderungen selbst umgesetzt und veröffentlicht.' },
  { nr: 5, titel: 'Rechtssichere Basis', ergebnis: 'Impressum, Datenschutz, Einwilligung und Verträge mit Dienstleistern sauber aufgestellt.' },
  { nr: 6, titel: 'Übergabe an dich selbst', ergebnis: 'Dein Betriebs-Handbuch, Sicherungen und eine 30-Minuten-Monatsroutine.' },
];

const FUER_DICH = [
  'Du bist selbstständig und willst deine Website selbst ändern können — ohne Ticket und Wartezeit.',
  'Du willst Domain, Code und Zugänge im eigenen Besitz haben.',
  'Du hast 2–5 Stunden pro Woche und scheust dich nicht vor neuen Werkzeugen.',
];
const NICHT_FUER_DICH = [
  'Du willst gar nicht selbst bauen — dann ist eine Umsetzung durch einen Dienstleister ehrlicher.',
  'Du brauchst einen großen Shop mit Warenwirtschaft oder ein Mitgliederportal.',
  'Du erwartest persönliche Betreuung im Kurspreis — Eigenregie ist ein Kurs zum Selbstlernen.',
  'Du hast noch kein Gewerbe angemeldet — dann zuerst die Gründung.',
];

const FAQ = [
  { q: 'Muss ich programmieren können?', a: 'Nein. Claude Code schreibt den Code, du lernst, klare Aufträge zu geben und Ergebnisse zu prüfen. Sicherer Umgang mit dem Computer reicht; die Diagnose sagt dir vorab, wie viel Zeit das bei dir braucht.' },
  { q: 'Was kostet das neben dem Kurs?', a: `Claude Code läuft nur mit einem kostenpflichtigen Claude-Tarif (Pro, ca. ${KOSTEN.claudePro} €/Monat, Preis in US-Dollar, Stand 09/2026). Hosting kostet 0 € (Netlify Free, gewerblich erlaubt, Kontingent begrenzt) oder ca. ${KOSTEN.hostingMax} €/Monat (Vercel Pro — der kostenlose Vercel-Tarif ist nur für private Seiten erlaubt). GitHub, Cloudflare und Bitwarden laufen kostenlos. Deine Domain bezahlst du wie bisher.` },
  { q: 'Wie lange dauert das wirklich?', a: 'Bei einem Auftritt mit 5–15 Seiten meist 15–25 Arbeitsstunden, verteilt auf einige Wochen. Die Diagnose rechnet dir das mit deiner verfügbaren Zeit aus — ohne Schönfärberei.' },
  { q: 'Mein Vertrag mit dem bisherigen Anbieter läuft noch — was tun?', a: 'Kein Hindernis. Du baust parallel auf und schaltest um, wenn alles steht. Modul 3 zeigt den Umschaltplan inklusive Rückweg, damit Website und E-Mail durchgehend erreichbar bleiben.' },
  { q: 'Was bedeutet „Pilotgruppe“?', a: `Die ersten ${PILOT_PLAETZE} Käufer bekommen den Pilotpreis. Im Gegenzug bitten wir dich nach dem Durchlauf um ehrliches Feedback per kurzem Fragebogen — damit verbessern wir den Kurs, bevor der reguläre Preis gilt. Die Begrenzung ist echt und wird technisch gezählt.` },
  { q: 'Bekomme ich persönliche Betreuung?', a: 'Nein. Eigenregie ist ein Kurs zum Selbstlernen: Diagnose, sechs Module, Checklisten und Vorlagen. Persönliche Betreuung, Korrekturen oder die Beantwortung von Einzelfragen sind nicht Teil des Kurses.' },
  { q: 'Bekomme ich Rechtsberatung?', a: 'Nein. Modul 5 zeigt, welche Pflichten es gibt und wie du sie umsetzt — aus der Praxis, nicht als Rechtsberatung. Bei Unsicherheit gehört die Frage zu Anwalt, IHK oder Handwerkskammer.' },
];

export default async function EigenregiePage(props: { searchParams: Promise<{ locked?: string }> }) {
  const { locked } = await props.searchParams;
  const verkauft = await vergebenePlaetze();
  const angebot = angebotFuer(new Date(), verkauft);
  const endeText = PILOT_ENDE.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Berlin' });
  const kaufbar = VERKAUF_AN && INHALT_FREIGEGEBEN && !angebot.ausverkauft;

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Eigenregie',
    description: 'Selbstlern-Kurs: Website in ein eigenes Projekt holen — eigene Konten, eigener Code, eigene Domain.',
    brand: { '@type': 'Brand', name: 'Steakakademie' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      price: angebot.preis,
      ...(angebot.pilot ? { priceValidUntil: '2026-10-31' } : {}),
      availability: kaufbar ? 'https://schema.org/InStock' : angebot.ausverkauft ? 'https://schema.org/SoldOut' : 'https://schema.org/PreOrder',
      url: 'https://steakakademie.de/eigenregie',
    },
  };
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };

  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <main className="bg-surface-base">
        {locked ? (
          <div className="bg-brand-gold/10 border-b border-brand-gold/30">
            <p className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-3 font-sans text-sm text-text-primary flex items-center gap-2">
              <Lock size={14} /> Der Kursbereich ist nur mit gekauftem Zugang erreichbar. Schon gekauft? Melde dich mit der E-Mail-Adresse deiner Bestellung an.
            </p>
          </div>
        ) : null}

        {/* Hero */}
        <section className="bg-surface-dark border-b border-border-subtle">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <nav className="flex items-center gap-1.5 text-xs font-sans text-text-light/50 mb-8" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-brand-gold">Start</Link>
              <ChevronRight size={12} />
              <span>Eigenregie</span>
            </nav>
            <p className="text-[11px] font-sans font-bold tracking-[0.18em] uppercase text-brand-gold mb-4">Selbstlern-Kurs · Diagnose + 6 Module</p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-text-light leading-[1.05] mb-6">
              Dein Business „KOMPLETT“<br />in Eigenregie.
            </h1>
            <p className="font-body text-lg lg:text-xl text-text-light/75 max-w-2xl leading-relaxed mb-8">
              Deine Website, dein Code, deine Zugänge. Du holst deinen Auftritt Schritt für Schritt in ein eigenes Projekt —
              und änderst ihn danach selbst, mit Claude Code als Werkzeug.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/eigenregie/diagnose" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-fire text-white font-sans font-bold">
                Kostenlose Diagnose starten <ArrowRight size={16} />
              </Link>
              <a href="#kaufen" className="inline-flex items-center gap-2 px-6 py-3 border border-text-light/30 text-text-light font-sans font-bold hover:border-brand-gold">
                Preis und Pilotgruppe
              </a>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="border-b border-border-subtle">
          <div className="max-w-content mx-auto px-4 sm:px-6 py-16">
            <p className="text-[11px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">Worum es geht</p>
            <h2 className="font-serif text-3xl font-bold text-text-primary mb-6">Wer die Zugänge hat, hat die Kontrolle.</h2>
            <div className="space-y-4 font-body text-lg text-text-secondary leading-relaxed">
              <p>
                Viele Selbstständige wissen nicht genau, wo ihre Domain registriert ist, wer das Passwort zum Hosting hat und wo der
                Code ihrer Seite liegt. Solange alles läuft, fällt das nicht auf. Beim ersten Wechsel, Streit oder Ausfall schon.
              </p>
              <p>
                Eigenregie ändert genau das: Zuerst holst du alle Zugänge zu dir. Dann baust du deine Seite in einem Projekt nach, das
                dir gehört — und lernst, sie selbst zu pflegen. Nicht als Theorie, sondern mit einem prüfbaren Ergebnis am Ende jedes Moduls.
              </p>
            </div>
          </div>
        </section>

        {/* Module */}
        <section className="border-b border-border-subtle bg-surface-card/40">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <p className="text-[11px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-3">Der Aufbau</p>
            <h2 className="font-serif text-3xl font-bold text-text-primary mb-10">Sieben Schritte. Jeder endet mit einem Ergebnis.</h2>
            <ol className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {MODULE.map((m) => (
                <li key={m.nr} className="border border-border-subtle bg-surface-base p-6">
                  <p className="text-xs font-sans font-bold tracking-widest uppercase text-brand-fire mb-2">Modul {m.nr}</p>
                  <h3 className="font-serif text-lg font-bold text-text-primary mb-2">{m.titel}</h3>
                  <p className="flex items-start gap-2 font-body text-sm text-text-secondary">
                    <CheckCircle2 size={16} className="text-brand-gold shrink-0 mt-0.5" /> {m.ergebnis}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Für wen */}
        <section className="border-b border-border-subtle">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <h2 className="font-serif text-2xl font-bold text-text-primary mb-5">Passt, wenn …</h2>
              <ul className="space-y-3">
                {FUER_DICH.map((t) => (
                  <li key={t} className="flex items-start gap-3 font-body text-text-secondary"><CheckCircle2 size={18} className="text-brand-gold shrink-0 mt-0.5" /> {t}</li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-text-primary mb-5">Passt nicht, wenn …</h2>
              <ul className="space-y-3">
                {NICHT_FUER_DICH.map((t) => (
                  <li key={t} className="flex items-start gap-3 font-body text-text-secondary"><XCircle size={18} className="text-text-muted shrink-0 mt-0.5" /> {t}</li>
                ))}
              </ul>
              <p className="font-body text-sm text-text-muted mt-5">
                Unsicher? Die <Link href="/eigenregie/diagnose" className="text-brand-fire underline">Diagnose</Link> sagt es dir in drei Minuten — auch, wenn ein anderer Weg besser passt.
              </p>
            </div>
          </div>
        </section>

        {/* Kosten ehrlich */}
        <section className="border-b border-border-subtle bg-surface-dark">
          <div className="max-w-content mx-auto px-4 sm:px-6 py-16">
            <p className="text-[11px] font-sans font-bold tracking-[0.18em] uppercase text-brand-gold mb-3">Ehrlich kalkuliert</p>
            <h2 className="font-serif text-3xl font-bold text-text-light mb-8">Was es insgesamt kostet</h2>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-text-light/10">
                <tr><td className="py-3 pr-4 font-sans font-bold text-text-light">Kurs Eigenregie</td><td className="py-3 font-body text-text-light/80">einmalig {euro(angebot.preis)}{angebot.pilot ? ` (Pilotpreis, danach ${euro(REGULAERER_PREIS)})` : ''}</td></tr>
                <tr><td className="py-3 pr-4 font-sans font-bold text-text-light">Claude Pro (für Claude Code)</td><td className="py-3 font-body text-text-light/80">ca. {KOSTEN.claudePro} €/Monat — Pflicht</td></tr>
                <tr><td className="py-3 pr-4 font-sans font-bold text-text-light">Hosting</td><td className="py-3 font-body text-text-light/80">0 € (Netlify Free) bis ca. {KOSTEN.hostingMax} €/Monat (Vercel Pro)</td></tr>
                <tr><td className="py-3 pr-4 font-sans font-bold text-text-light">GitHub, Cloudflare, Bitwarden</td><td className="py-3 font-body text-text-light/80">0 €</td></tr>
                <tr><td className="py-3 pr-4 font-sans font-bold text-text-light">Domain</td><td className="py-3 font-body text-text-light/80">wie bisher</td></tr>
              </tbody>
            </table>
            <p className="font-body text-xs text-text-light/50 mt-4">Werkzeugpreise der Anbieter in US-Dollar, gerundet, Stand 09/2026. Prüfe sie vor der Buchung beim Anbieter.</p>
          </div>
        </section>

        {/* Wer */}
        <section className="border-b border-border-subtle">
          <div className="max-w-content mx-auto px-4 sm:px-6 py-16 flex flex-col sm:flex-row gap-8 items-start">
            <Image src="/images/uwe-yendell.jpg" alt="Uwe Yendell" width={128} height={128} className="w-28 h-28 object-cover border border-brand-gold/30" />
            <div>
              <p className="text-[11px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-2">Wer dahintersteht</p>
              <h2 className="font-serif text-2xl font-bold text-text-primary mb-3">Uwe Yendell</h2>
              <p className="font-body text-text-secondary leading-relaxed">
                Gründer der Steakakademie, Profi-Koch mit Hintergrund in IT und Online-Marketing. Die Steakakademie läuft genau auf dem
                Weg, den dieser Kurs zeigt: eigenes Repository, Next.js, Cloudflare, gepflegt mit Claude Code — ohne Agentur. Die Fallen,
                in die man dabei läuft, sind im Kurs als „Umweg vermieden“ an genau der Stelle eingebaut, an der sie auftreten.
              </p>
            </div>
          </div>
        </section>

        {/* Preis + CTA */}
        <section id="kaufen" className="border-b border-brand-gold/20 bg-brand-gold/5 scroll-mt-20">
          <div className="max-w-content mx-auto px-4 sm:px-6 py-16">
            <p className="text-[11px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-3">{angebot.pilot ? 'Pilotgruppe' : 'Einmaliger Zugang'}</p>
            <h2 className="font-serif text-3xl font-bold text-text-primary mb-2">Eigenregie — {euro(angebot.preis)}</h2>
            {angebot.pilot ? (
              <div className="font-body text-text-secondary space-y-2 mb-8">
                <p>
                  Pilotpreis bis einschließlich {endeText} für höchstens {PILOT_PLAETZE} Teilnehmer — danach {euro(REGULAERER_PREIS)}.
                  Der Grund für die Begrenzung: Die ersten {PILOT_PLAETZE} Käufer geben uns nach dem Durchlauf ehrliches Feedback per Fragebogen — damit verbessern wir den Kurs, bevor der reguläre Preis gilt.
                </p>
                <p className="flex flex-wrap gap-x-6 gap-y-1 font-sans text-sm text-text-primary">
                  <span className="inline-flex items-center gap-1.5"><CalendarClock size={15} className="text-brand-fire" /> endet am {endeText}</span>
                  {angebot.freiePlaetze !== null ? (
                    <span className="inline-flex items-center gap-1.5"><Users size={15} className="text-brand-fire" /> {angebot.freiePlaetze} von {PILOT_PLAETZE} Plätzen frei</span>
                  ) : null}
                </p>
              </div>
            ) : (
              <p className="font-body text-text-secondary mb-8">Einmalzahlung, dauerhafter Zugang zu Diagnose und allen sechs Modulen.</p>
            )}

            {kaufbar ? (
              <a href={CHECKOUT_URL} className="inline-flex items-center gap-2 px-8 py-4 bg-brand-fire text-white font-sans font-bold text-base" rel="nofollow">
                Jetzt für {euro(angebot.preis)} starten <ArrowRight size={18} />
              </a>
            ) : (
              <div>
                <span className="inline-flex items-center gap-2 px-8 py-4 font-sans font-bold text-base border border-brand-gold/40 text-text-muted cursor-not-allowed" aria-disabled="true">
                  {angebot.ausverkauft ? 'Pilotplätze vergeben' : 'Verkaufsstart in Kürze'}
                </span>
                <p className="font-body text-sm text-text-muted mt-3">
                  Bis dahin: Mach die <Link href="/eigenregie/diagnose" className="text-brand-fire underline">kostenlose Diagnose</Link>.
                </p>
              </div>
            )}

            <p className="font-body text-xs text-text-muted mt-8 leading-relaxed">
              Alle Preise inkl. MwSt. Verkauf und Rechnung über Digistore24. <strong className="text-text-primary">Widerrufsrecht:</strong> Bei
              digitalen Inhalten erlischt das Widerrufsrecht erst, wenn du beim Kauf ausdrücklich zustimmst, dass der Zugang sofort
              beginnt, und bestätigst, dass du dadurch dein Widerrufsrecht verlierst. Das wird im Bestellvorgang abgefragt.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-b border-border-subtle">
          <div className="max-w-content mx-auto px-4 sm:px-6 py-16">
            <h2 className="font-serif text-3xl font-bold text-text-primary mb-8">Häufige Fragen</h2>
            <div className="divide-y divide-border-subtle">
              {FAQ.map(({ q, a }) => (
                <div key={q} className="py-5">
                  <h3 className="font-serif text-lg font-bold text-text-primary mb-2">{q}</h3>
                  <p className="font-body text-text-secondary leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
            <p className="font-body text-xs text-text-muted mt-8">
              Zum Vergleich der Pilotpreis: {euro(PILOT_PREIS)} gegenüber {euro(REGULAERER_PREIS)} regulär ab 1. November 2026.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
