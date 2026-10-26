import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Flame, Lock, MapPin, ArrowUpRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { LAENDER, PARTNER_ARTEN, rezeptAnzahl, type Partner, type PartnerRezept } from '@/lib/chefs-table/typen';

/**
 * Porträtseite eines Küchenpartners (25.10.2026) — Layout nach dem freigegebenen
 * Design-Canvas „Chefs' Table – Layout" (Uwe, 25.10.2026).
 *
 * Aufbau (Konzept Abschnitt 2): Kopf → Kennzeichnung → Feuer-Geschichte → Signature-
 * Gericht + alle Rezepte → Tipp → Fakten-Box + FAQ → drei Aufrufe → weitere Partner.
 *
 * Externe Links zum Partner tragen rel="sponsored": Porträt und Links sind Teil der
 * Gegenleistung für die Rezepte, ohne Kennzeichnung wäre das Linktausch
 * (Google Spam-Richtlinien, Konzept 7.1). Der Wortlaut der Kooperationskennzeichnung
 * kommt von der Kanzlei (C25, A1) — bis dahin steht hier ein neutraler Hinweis.
 */

export const REL_PARTNER = 'sponsored noopener noreferrer';

function Bildfeld({ src, alt, hinweis, ratio }: { src?: string; alt: string; hinweis: string; ratio: string }) {
  if (src) {
    return (
      <div className={`relative ${ratio} overflow-hidden bg-surface-elevated`}>
        <Image src={src} alt={alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
      </div>
    );
  }
  return (
    <div
      className={`${ratio} border border-dashed border-border-subtle bg-surface-elevated flex items-center justify-center text-center p-6 font-sans text-xs tracking-widest uppercase text-text-muted`}
      aria-hidden="true"
    >
      {hinweis}
    </div>
  );
}

function RezeptKarte({ r, hell }: { r: PartnerRezept; hell: boolean }) {
  const inner = (
    <>
      <div className={`relative aspect-[16/10] ${hell ? 'bg-[#C9AC7A]' : 'bg-surface-elevated'}`}>
        <span
          className={`absolute top-3 right-3 px-2 py-1 font-sans text-[11px] font-bold tracking-widest ${
            r.vip ? 'bg-ink text-text-light' : 'bg-ink text-brand-gold'
          }`}
        >
          {r.vip ? 'VIP' : 'FREI'}
        </span>
      </div>
      <span className={`font-sans text-[11px] font-bold tracking-widest uppercase ${hell ? 'text-[#7A2A0B]' : 'text-brand-fire'}`}>{r.kicker}</span>
      <span className={`font-serif text-xl leading-snug ${hell ? 'text-ink' : 'text-text-light'}`}>{r.titel}</span>
      {(r.zeit || r.portionen) && (
        <span className={`font-sans text-xs ${hell ? 'text-[#4A3A2C]' : 'text-text-muted'}`}>
          {[r.zeit, r.portionen].filter(Boolean).join(' · ')}
        </span>
      )}
    </>
  );
  const cls = 'flex flex-col gap-2 no-underline';
  return r.url ? (
    <Link href={r.url} className={cls}>{inner}</Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

export default function PartnerPortraet({ partner, weitere }: { partner: Partner; weitere: Partner[] }) {
  const p = partner;
  const art = PARTNER_ARTEN[p.art];
  const land = LAENDER[p.land];
  const anzahl = rezeptAnzahl(p);
  const abzeichen = p.bis ? `Küchenpartner ${p.seit}–${p.bis}` : `Küchenpartner seit ${p.seit}`;

  return (
    <>
      <Header />
      <main className="bg-surface-base min-h-screen">
        {p.platzhalter && (
          <div className="bg-brand-fire/10 border-b border-brand-fire/30 text-center text-xs font-sans text-text-secondary py-2 px-4">
            Vorschau mit Platzhaltern — kein echter Partner. Diese Seite ist nicht öffentlich.
          </div>
        )}

        <div className="border-b border-border-subtle">
          <nav className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-1.5 text-xs font-sans text-text-muted" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
            <ChevronRight size={11} aria-hidden="true" />
            <Link href="/chefs-table" className="hover:text-brand-gold transition-colors">Chefs’ Table</Link>
            <ChevronRight size={11} aria-hidden="true" />
            <span className="text-text-secondary">{p.name}</span>
          </nav>
        </div>

        {/* Kopf */}
        <section className="bg-surface-card border-b border-border-subtle" aria-label="Küchenpartner">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 grid gap-10 lg:grid-cols-2 lg:items-center">
            <Bildfeld src={p.bilder.kueche} alt={`${p.name} — Küche und Team`} hinweis="Foto Küche oder Team · vom Partner" ratio="aspect-[4/3]" />
            <div className="flex flex-col gap-5">
              <span className="flex items-center gap-2 font-sans text-xs font-bold tracking-[0.18em] text-brand-fire">
                <Flame size={14} aria-hidden="true" />
                CHEFS’ TABLE · KÜCHENPARTNER
              </span>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-[56px] font-bold leading-[1.08] text-text-light">{p.name}</h1>
              <p className="font-sans text-sm tracking-wide text-text-secondary">
                {art} — {p.ort}, {land}
              </p>
              <div className="flex flex-wrap gap-2 font-sans text-[11px] font-bold tracking-widest uppercase">
                <span className="border border-brand-gold text-brand-gold px-3 py-2">✦ {abzeichen}</span>
                <span className="border border-border-subtle text-text-secondary px-3 py-2">{anzahl} Rezepte bei der Steakakademie</span>
                {p.geschlossen && <span className="border border-border-subtle text-text-muted px-3 py-2">Geschlossen</span>}
              </div>
              <p className="font-body text-lg sm:text-xl leading-relaxed text-text-primary">{p.kurz}</p>
              <div className="flex flex-wrap gap-3 mt-1">
                <a
                  href="#signature"
                  className="bg-brand-gold text-ink font-sans text-sm font-bold tracking-widest px-5 py-4 hover:bg-[#D9992F] transition-colors no-underline"
                >
                  SIGNATURE-REZEPT KOCHEN
                </a>
                {p.fakten.reservierung && !p.geschlossen && (
                  <a
                    href={p.fakten.reservierung}
                    rel={REL_PARTNER}
                    target="_blank"
                    className="border border-brand-gold text-text-light font-sans text-sm font-bold tracking-widest px-5 py-4 hover:bg-brand-gold/10 transition-colors no-underline inline-flex items-center gap-2"
                  >
                    TISCH RESERVIEREN <ArrowUpRight size={14} aria-hidden="true" />
                  </a>
                )}
              </div>
              <p className="font-sans text-xs text-text-muted">Küchenpartner werden nur auf Einladung aufgenommen.</p>
            </div>
          </div>
        </section>

        {/* Kennzeichnung — Wortlaut folgt von der Kanzlei (C25, A1) */}
        <div className="bg-surface-dark border-b border-border-subtle">
          <p className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-3 font-sans text-xs text-text-muted">
            Hinweis: {p.name} ist Küchenpartner der Steakakademie. Die Rezepte stammen vom Partner; die Links in dieser Seite führen zu seinen eigenen Seiten.
          </p>
        </div>

        {/* Feuer-Geschichte */}
        <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid gap-10 lg:grid-cols-[1fr_2fr]" aria-label="Die Feuer-Geschichte">
          <div className="flex flex-col gap-3">
            <span className="font-sans text-xs font-bold tracking-[0.18em] text-brand-fire">DIE FEUER-GESCHICHTE</span>
            <h2 className="font-serif text-3xl sm:text-4xl leading-tight text-text-light">
              Feuer ist keine Technik. <span className="text-brand-gold">Feuer ist Erinnerung.</span>
            </h2>
          </div>
          <div className="flex flex-col gap-7">
            {p.geschichte.map((absatz, i) => (
              <p key={i} className="font-body text-lg leading-[1.75] text-text-primary">{absatz}</p>
            ))}
            {p.zitat && (
              <blockquote className="border-y border-border-subtle py-8">
                <p className="font-serif italic text-2xl sm:text-3xl leading-snug text-brand-gold">„{p.zitat}“</p>
                <footer className="mt-3 font-sans text-xs tracking-wide text-text-muted">— {p.koch.name}, {p.koch.rolle}</footer>
              </blockquote>
            )}
          </div>
        </section>

        {/* Signature + alle Rezepte (helle Pergament-Fläche wie im Canvas) */}
        <section id="signature" className="bg-[#D8BE90] text-ink scroll-mt-24" aria-label="Signature-Gericht und Rezepte">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-22 flex flex-col gap-10">
            <div className="flex flex-col gap-2">
              <span className="font-sans text-xs font-bold tracking-[0.18em] text-[#7A2A0B]">SIGNATURE-GERICHT</span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold">Das Gericht, für das man hinfährt</h2>
            </div>
            <div className="grid gap-10 lg:grid-cols-[3fr_2fr] items-stretch">
              <div className="relative">
                {p.bilder.signature ? (
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image src={p.bilder.signature} alt={p.signature.titel} fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" />
                  </div>
                ) : (
                  <div className="aspect-[16/10] border border-dashed border-[#7A5A36] bg-[#C9AC7A] flex items-center justify-center font-sans text-xs tracking-widest uppercase text-[#4A3A2C]" aria-hidden="true">
                    Foto Signature-Gericht · vom Partner
                  </div>
                )}
                {p.signature.rezept?.vip && (
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 bg-ink text-text-light px-2.5 py-1.5 font-sans text-[11px] font-bold tracking-widest">
                    <Lock size={11} aria-hidden="true" /> VIP-REZEPT
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-4 justify-center">
                {p.signature.rezept && (
                  <span className="font-sans text-xs font-bold tracking-widest uppercase text-[#7A2A0B]">{p.signature.rezept.kicker}</span>
                )}
                <h3 className="font-serif text-3xl leading-tight font-bold">{p.signature.titel}</h3>
                <p className="font-body text-lg leading-relaxed text-[#3A2C20]">{p.signature.warum}</p>
                {p.signature.rezept && (p.signature.rezept.zeit || p.signature.rezept.portionen) && (
                  <div className="flex flex-wrap gap-5 font-sans text-sm text-[#4A3A2C]">
                    {p.signature.rezept.zeit && <span>{p.signature.rezept.zeit}</span>}
                    {p.signature.rezept.portionen && <span>{p.signature.rezept.portionen}</span>}
                    <span>grammgenau</span>
                  </div>
                )}
                <div className="flex flex-col gap-2 mt-1">
                  {p.signature.rezept?.url ? (
                    <Link href={p.signature.rezept.url} className="self-start bg-ink text-text-light font-sans text-sm font-bold tracking-widest px-5 py-4 no-underline hover:bg-[#2A1D14] transition-colors">
                      {p.signature.rezept.vip ? 'ZUM VIP-REZEPT' : 'ZUM REZEPT'}
                    </Link>
                  ) : (
                    <Link href="/vip" className="self-start bg-ink text-text-light font-sans text-sm font-bold tracking-widest px-5 py-4 no-underline hover:bg-[#2A1D14] transition-colors">
                      ZUM VIP-BEREICH
                    </Link>
                  )}
                  {p.signature.rezept?.vip && (
                    <span className="font-sans text-xs text-[#4A3A2C]">Zutaten und Schritte gehören zum VIP-Bereich der Steakakademie.</span>
                  )}
                </div>
              </div>
            </div>

            {p.rezepte.length > 0 && (
              <div className="border-t border-[#A88A5C] pt-10 flex flex-col gap-6">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold">Alle Rezepte von {p.name}</h2>
                  <span className="font-sans text-sm text-[#4A3A2C]">{anzahl} Rezepte</span>
                </div>
                <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 list-none p-0 m-0">
                  {p.rezepte.map((r) => (
                    <li key={r.titel}><RezeptKarte r={r} hell /></li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Tipp */}
        <section className="border-b border-border-subtle" aria-label="Tipp für Grill-Anfänger">
          <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 text-center flex flex-col items-center gap-5">
            <span className="font-sans text-xs font-bold tracking-[0.18em] text-brand-fire">DER TIPP FÜR GRILL-ANFÄNGER</span>
            <p className="font-serif text-2xl sm:text-3xl leading-snug text-text-light">{p.tipp}</p>
            <span className="font-sans text-xs tracking-wide text-text-muted">— {p.koch.name}</span>
          </div>
        </section>

        {/* Fakten + FAQ */}
        <section id="fakten" className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid gap-12 lg:grid-cols-[2fr_3fr] scroll-mt-24" aria-label="Wo man den Partner findet">
          <div className="bg-surface-card border border-border-subtle p-7 sm:p-9 flex flex-col gap-5">
            <span className="font-sans text-xs font-bold tracking-[0.18em] text-brand-gold">WO MAN {p.name.toUpperCase()} FINDET</span>
            <dl className="grid grid-cols-[110px_minmax(0,1fr)] gap-y-3 gap-x-4 font-sans text-sm m-0">
              <dt className="text-text-muted">Name</dt><dd className="m-0 text-text-light">{p.fakten.name}</dd>
              <dt className="text-text-muted">Adresse</dt><dd className="m-0 text-text-light">{p.fakten.adresse}</dd>
              {p.fakten.telefon && (<><dt className="text-text-muted">Telefon</dt><dd className="m-0 text-text-light">{p.fakten.telefon}</dd></>)}
              {p.fakten.website && (<><dt className="text-text-muted">Website</dt><dd className="m-0"><a href={p.fakten.website} rel={REL_PARTNER} target="_blank" className="text-brand-gold hover:text-text-light">{p.fakten.website.replace(/^https:\/\//, '')} ↗</a></dd></>)}
              {p.fakten.reservierung && (<><dt className="text-text-muted">Reservierung</dt><dd className="m-0"><a href={p.fakten.reservierung} rel={REL_PARTNER} target="_blank" className="text-brand-gold hover:text-text-light">Tisch reservieren ↗</a></dd></>)}
              {p.fakten.instagram && (<><dt className="text-text-muted">Social</dt><dd className="m-0"><a href={p.fakten.instagram} rel={REL_PARTNER} target="_blank" className="text-brand-gold hover:text-text-light">Instagram ↗</a></dd></>)}
            </dl>
            {p.fakten.route && (
              <a
                href={p.fakten.route}
                rel={REL_PARTNER}
                target="_blank"
                className="self-start inline-flex items-center gap-2 border border-brand-gold text-text-light font-sans text-sm font-bold tracking-widest px-5 py-3.5 hover:bg-brand-gold/10 transition-colors no-underline"
              >
                <MapPin size={14} aria-hidden="true" /> ROUTE PLANEN ↗
              </a>
            )}
            <p className="font-sans text-xs leading-relaxed text-text-muted">Externe Links öffnen die Seiten des Partners in einem neuen Fenster.</p>
          </div>
          {p.faq.length > 0 && (
            <div className="flex flex-col gap-7">
              <span className="font-sans text-xs font-bold tracking-[0.18em] text-brand-fire">GUT ZU WISSEN</span>
              {p.faq.map((f, i) => (
                <div key={f.frage} className={`flex flex-col gap-2 ${i < p.faq.length - 1 ? 'pb-6 border-b border-border-subtle' : ''}`}>
                  <h3 className="font-serif text-xl text-text-light m-0">{f.frage}</h3>
                  <p className="font-body text-base sm:text-lg leading-relaxed text-text-primary m-0">{f.antwort}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Drei Aufrufe */}
        <section className="bg-surface-card border-y border-border-subtle" aria-label="Weiter">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14 grid gap-8 md:grid-cols-3">
            <div className="flex flex-col gap-3">
              <span className="font-sans text-xs font-bold tracking-[0.18em] text-brand-gold">KOCHEN</span>
              <h3 className="font-serif text-2xl text-text-light m-0">Rezepte von {p.name} kochen</h3>
              <p className="font-body text-text-secondary leading-relaxed m-0">Die Rezepte dieses Partners, grammgenau — mit Garzeiten und Kerntemperaturen.</p>
              <a href="#signature" className="self-start bg-brand-gold text-ink font-sans text-xs font-bold tracking-widest px-4 py-3.5 no-underline hover:bg-[#D9992F] transition-colors">ZU DEN REZEPTEN</a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="font-sans text-xs font-bold tracking-[0.18em] text-brand-gold">MITMACHEN</span>
              <h3 className="font-serif text-2xl text-text-light m-0">Selbst ein Rezept einreichen</h3>
              <p className="font-body text-text-secondary leading-relaxed m-0">Für Mitglieder: eigene Premium-Rezepte mit Namensnennung bei der Steakakademie.</p>
              <Link href="/rezepte/community" className="self-start border border-brand-gold text-text-light font-sans text-xs font-bold tracking-widest px-4 py-3.5 no-underline hover:bg-brand-gold/10 transition-colors">REZEPT EINREICHEN</Link>
            </div>
            <div className="flex flex-col gap-3">
              <span className="font-sans text-xs font-bold tracking-[0.18em] text-brand-gold">KÜCHENPARTNER</span>
              <h3 className="font-serif text-2xl text-text-light m-0">Nur auf Einladung</h3>
              <p className="font-body text-text-secondary leading-relaxed m-0">Profis mit eigener Küche, die regelmäßig Premium-Rezepte liefern, können an den Tisch eingeladen werden.</p>
              <Link href="/chefs-table#weg" className="self-start font-sans text-xs font-bold tracking-widest text-brand-gold py-3.5 no-underline hover:text-text-light transition-colors">SO KOMMT MAN AN DEN TISCH →</Link>
            </div>
          </div>
        </section>

        {/* Weitere Partner */}
        {weitere.length > 0 && (
          <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col gap-8" aria-label="Mehr vom Chefs’ Table">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-serif text-3xl text-text-light m-0">Mehr vom Chefs’ Table</h2>
              <Link href="/chefs-table" className="font-sans text-xs font-bold tracking-widest text-brand-gold no-underline hover:text-text-light">ALLE KÜCHENPARTNER →</Link>
            </div>
            <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 list-none p-0 m-0">
              {weitere.slice(0, 3).map((w) => (
                <li key={w.slug}>
                  <Link href={`/chefs-table/${w.slug}`} className="flex flex-col gap-2 no-underline">
                    <Bildfeld src={w.bilder.kueche} alt={w.name} hinweis="Foto Partner" ratio="aspect-[4/3]" />
                    <span className="font-sans text-[11px] font-bold tracking-widest uppercase text-brand-fire">{PARTNER_ARTEN[w.art]} · {w.ort}</span>
                    <span className="font-serif text-xl text-text-light">{w.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
