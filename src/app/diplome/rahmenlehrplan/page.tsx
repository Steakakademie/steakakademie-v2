import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, CheckCircle2, Clock, GitBranch } from 'lucide-react';
import { allDiplomLektions } from 'contentlayer/generated';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { STUFEN, DIPLOM_HINWEIS, QUIZ_FRAGEN_PRO_PRUEFUNG, QUIZ_BESTEHENSQUOTE } from '@/lib/diplome/stufen';
import { RAHMENLEHRPLAN, DOKTRIN } from '@/lib/diplome/rahmenlehrplan';
import { courseSchema, breadcrumbSchema } from '@/lib/schema';

/**
 * /diplome/rahmenlehrplan — der oeffentliche Rahmenlehrplan des Grillmeister-
 * Diploms (Uwe, freigegeben 08.09.2026). Indexiert, bewusst.
 *
 * Was hier steht: je Stufe das Stufenziel, je Lektion das Lernziel als
 * beobachtbare Faehigkeit, der praktische Nachweis, die Pruefungsordnung, die
 * Doktrin. Was hier NICHT steht: Lektionsinhalte. Die Seite sagt, was ein
 * Grillmeister koennen muss — nicht, wie man es lernt.
 *
 * Warum indexiert, obwohl Stufe 2–5 hinter der Bezahlschranke liegen:
 * „Grillmeister" hat keine Ausbildungsordnung. Diese Seite ist die Definition,
 * die es im deutschsprachigen Netz so nicht gibt — sie wird verlinkt und von
 * KI-Suchen als Quelle gezogen. Genau dafuer ist sie gebaut.
 *
 * Stand je Lektion kommt aus contentlayer: existiert die Lektion, ist sie
 * verlinkt; sonst steht „geplant" dran. Kein „fertig", wo nichts liegt (Regel 7).
 */

export const metadata: Metadata = {
  title: 'Rahmenlehrplan Grillmeister-Diplom: Was ein Grillmeister können muss',
  description:
    'Der Rahmenlehrplan des Grillmeister-Diploms der Steakakademie: fünf Stufen, 41 Lernziele, Prüfungsordnung und praktische Nachweise — von Grillmeister Bronze bis Grillmeister Meisterklasse.',
  alternates: { canonical: 'https://steakakademie.de/diplome/rahmenlehrplan' },
  openGraph: {
    title: 'Rahmenlehrplan Grillmeister-Diplom',
    description: 'Fünf Stufen, 41 Lernziele, Prüfungsordnung: Was ein Grillmeister können muss — verbindlich aufgeschrieben.',
    url: 'https://steakakademie.de/diplome/rahmenlehrplan',
    type: 'website',
  },
};

export default function RahmenlehrplanPage() {
  const vorhanden = new Map(allDiplomLektions.map((l) => [l.lektionSlug, l]));
  const gesamt = RAHMENLEHRPLAN.reduce((n, s) => n + s.lernziele.length, 0);
  const fertig = RAHMENLEHRPLAN.reduce((n, s) => n + s.lernziele.filter((z) => z.lektionSlug && vorhanden.has(z.lektionSlug)).length, 0);

  const courseSch = courseSchema({
    name: 'Grillmeister-Diplom der Steakakademie — Rahmenlehrplan',
    description: metadata.description as string,
    url: '/diplome/rahmenlehrplan',
    teaches: RAHMENLEHRPLAN.flatMap((s) => s.lernziele.map((z) => z.block)),
  });
  const breadcrumbSch = breadcrumbSchema([
    { name: 'Diplome', url: '/diplome' },
    { name: 'Rahmenlehrplan', url: '/diplome/rahmenlehrplan' },
  ]);

  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSch) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSch) }} />

      <main className="bg-surface-base">
        {/* Kopf */}
        <section className="bg-surface-dark border-b border-brand-gold/15">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <nav className="flex items-center gap-1.5 text-xs font-sans text-text-light/40 mb-8" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
              <ChevronRight size={12} />
              <Link href="/diplome" className="hover:text-brand-gold transition-colors">Diplom-System</Link>
              <ChevronRight size={12} />
              <span className="text-text-light/65">Rahmenlehrplan</span>
            </nav>
            <div className="max-w-3xl">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Grillmeister-Diplom · Rahmenlehrplan
              </span>
              <h1 className="font-serif text-4xl lg:text-5xl xl:text-6xl font-bold text-text-light leading-tight mb-6">
                Was ein Grillmeister<br className="hidden lg:block" /> können muss.
              </h1>
              <p className="font-serif text-xl lg:text-2xl text-text-light/80 leading-relaxed mb-4">
                „Grillmeister" ist kein geschützter Beruf. Es gibt keine Ausbildungsordnung, keinen
                Lehrplan, keine Prüfungsordnung. Wir haben eine geschrieben.
              </p>
              <p className="font-body text-base text-text-light/55 leading-relaxed mb-10 max-w-2xl">
                Fünf Stufen, {gesamt} Lernziele, jedes als überprüfbare Fähigkeit formuliert. Dazu ein
                praktischer Nachweis je Stufe und eine Prüfungsordnung, die alle Lektionen abdeckt.
                Der Plan entstand aus sieben Kurs-Produktionsbüchern und der Praxis eines Kursleiters,
                der über Jahre Grillkurse für einen der großen Hersteller geleitet hat.
              </p>
              <div className="flex flex-wrap gap-6">
                {[
                  { icon: <CheckCircle2 size={14} />, text: `${fertig} von ${gesamt} Lektionen veröffentlicht` },
                  { icon: <Clock size={14} />, text: `Prüfung: bis zu ${QUIZ_FRAGEN_PRO_PRUEFUNG} Fragen, ${QUIZ_BESTEHENSQUOTE} % richtig` },
                  { icon: <GitBranch size={14} />, text: 'Gerätespur Kohle / Gas' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-xs font-sans text-text-light/55">
                    <span className="text-brand-gold">{icon}</span>
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Klassifizierung */}
        <section className="border-b border-border-subtle">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-content mx-auto">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Die fünf Grade
              </span>
              <h2 className="font-serif text-3xl font-bold text-text-primary mb-6">
                Grillmeister Bronze bis Grillmeister Meisterklasse
              </h2>
              <p className="font-body text-text-secondary leading-relaxed mb-8">
                Der Grad steht auf der Urkunde und benennt, was jemand kann. Der Ehrentitel — vom
                Glut-Lehrling bis zum Master of Steak — ist der Rang in der Community. Rang motiviert,
                Grad qualifiziert.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-subtle">
                      <th className="text-left py-3 pr-4 text-xs font-sans font-bold tracking-[0.12em] uppercase text-text-muted">Stufe</th>
                      <th className="text-left py-3 pr-4 text-xs font-sans font-bold tracking-[0.12em] uppercase text-text-muted">Grad</th>
                      <th className="text-left py-3 pr-4 text-xs font-sans font-bold tracking-[0.12em] uppercase text-text-muted">Ehrentitel</th>
                      <th className="text-left py-3 text-xs font-sans font-bold tracking-[0.12em] uppercase text-text-muted">Kern</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle/40">
                    {STUFEN.map((s) => (
                      <tr key={s.key}>
                        <td className="py-3 pr-4 text-sm font-sans text-text-muted">{s.nr}</td>
                        <td className="py-3 pr-4 text-sm font-serif font-bold text-text-primary">{s.cert}</td>
                        <td className="py-3 pr-4 text-sm font-body text-text-secondary">{s.badge}</td>
                        <td className="py-3 text-sm font-body text-text-secondary">{s.title}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-6 text-xs font-sans text-text-muted">{DIPLOM_HINWEIS}</p>
            </div>
          </div>
        </section>

        {/* Stufen */}
        {RAHMENLEHRPLAN.map((plan) => {
          const stufe = STUFEN.find((s) => s.nr === plan.nr)!;
          return (
            <section key={plan.nr} className="border-b border-border-subtle" id={`stufe-${plan.nr}`}>
              <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="max-w-content mx-auto">
                  <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase mb-4" style={{ color: stufe.color }}>
                    Stufe {plan.nr} · {stufe.cert}
                  </span>
                  <h2 className="font-serif text-3xl font-bold text-text-primary mb-4">{stufe.title}</h2>
                  <p className="font-body text-text-secondary leading-relaxed mb-8">
                    <strong className="text-text-primary">Stufenziel:</strong> {plan.stufenziel}
                  </p>

                  <ol className="space-y-4 mb-8">
                    {plan.lernziele.map((z, i) => {
                      const lektion = z.lektionSlug ? vorhanden.get(z.lektionSlug) : undefined;
                      return (
                        <li key={z.block} className="flex gap-4">
                          <span className="shrink-0 w-8 h-8 flex items-center justify-center font-sans text-xs font-bold" style={{ background: `${stufe.color}22`, color: stufe.color }}>
                            {i + 1}
                          </span>
                          <div>
                            <div className="flex flex-wrap items-baseline gap-x-2">
                              {lektion ? (
                                <Link href={lektion.url} className="font-serif font-bold text-text-primary hover:text-brand-gold transition-colors">
                                  {z.block}
                                </Link>
                              ) : (
                                <span className="font-serif font-bold text-text-primary">{z.block}</span>
                              )}
                              {!lektion && (
                                <span className="text-[10px] font-sans uppercase tracking-[0.12em] text-text-muted">geplant</span>
                              )}
                              {z.geraetespur && (
                                <span className="text-[10px] font-sans uppercase tracking-[0.12em] text-brand-gold">Kohle / Gas</span>
                              )}
                            </div>
                            <p className="font-body text-sm text-text-secondary leading-relaxed">
                              <span className="text-text-muted">Kann danach:</span> {z.kann}.
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>

                  <div className="border px-5 py-4" style={{ borderColor: `${stufe.color}40`, background: `${stufe.color}0A` }}>
                    <p className="text-xs font-sans text-text-secondary leading-relaxed">
                      <strong className="text-text-primary">Praktischer Nachweis:</strong> {plan.handgriff}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          );
        })}

        {/* Pruefungsordnung */}
        <section className="border-b border-border-subtle bg-surface-dark">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-content mx-auto">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Prüfungsordnung
              </span>
              <h2 className="font-serif text-3xl font-bold text-text-light mb-6">So wird geprüft</h2>
              <div className="space-y-4 font-body text-text-light/70 leading-relaxed">
                <p>
                  Jede Stufe hat einen Fragenpool mit mindestens drei Fragen je Lektion. Die Prüfung zieht
                  daraus bis zu {QUIZ_FRAGEN_PRO_PRUEFUNG} Fragen — höchstens eine je Lektion, damit keine
                  Lektion ungeprüft bleibt — und ist bestanden ab {QUIZ_BESTEHENSQUOTE} Prozent richtigen
                  Antworten. Jeder Durchgang zieht neu.
                </p>
                <p>
                  Die Ziehung und die Bewertung laufen auf unserem Server; der Browser sieht die Lösungen
                  erst mit dem Ergebnis. Wer nicht besteht, bekommt zu jeder falschen Antwort die Erklärung
                  und die Lektion, in der sie steht.
                </p>
                <p>
                  Ab Stufe 3 gehört zur gedruckten Urkunde zusätzlich der praktische Nachweis — ein Foto mit
                  Kurzprotokoll. Das ist der Unterschied zwischen „Quiz bestanden" und „kann es".
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Doktrin */}
        <section className="border-b border-border-subtle">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="mb-10">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-3">
                Wie jede Lektion gebaut ist
              </span>
              <h2 className="font-serif text-3xl font-bold text-text-primary">Sechs Regeln, kein Fließtext</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {DOKTRIN.map((d, i) => (
                <div key={d.titel} className="bg-surface-card border border-border-subtle p-6">
                  <div className="w-8 h-8 flex items-center justify-center font-sans text-xs font-bold mb-3" style={{ background: 'rgba(200,136,42,0.12)', color: '#C8882A' }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3 className="font-serif text-base font-bold text-text-primary mb-2">{d.titel}</h3>
                  <p className="font-body text-sm text-text-secondary leading-relaxed">{d.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Einstieg */}
        <section>
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-content mx-auto text-center">
              <h2 className="font-serif text-3xl font-bold text-text-primary mb-4">Stufe 1 ist frei.</h2>
              <p className="font-body text-text-secondary mb-8">
                Elf Lektionen, eine Prüfung, der Grad Grillmeister Bronze — ohne Konto, ohne Kosten.
              </p>
              <Link
                href="/diplome"
                className="inline-flex items-center gap-2 px-8 py-4 font-sans font-bold text-sm uppercase tracking-[0.08em] bg-brand-fire text-text-light hover:bg-brand-gold transition-colors"
              >
                Zum Diplom-System <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
