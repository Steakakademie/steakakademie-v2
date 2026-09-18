import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, MapPin, Clock, Globe, Phone, Beef, Leaf, ShieldCheck, Radar } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { hofPerSlug, nachbarn } from '@/lib/hoefe/db';
import { adresseZeile, entfernungLabel, fleischStatus, fleischartenLabel, hostAusUrl, sichereUrl } from '@/lib/hoefe/format';

// Kein generateStaticParams: ~6.000 Profile zur Bauzeit waeren 6.000 DB-Abfragen
// im Build-Gate (ohne Env leer). Profile entstehen beim ersten Aufruf (ISR).
export const revalidate = 3600;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const hof = await hofPerSlug(params.slug);
  // Kein "| Steakakademie" in den Titeln — das haengt das title.template im Root-Layout an.
  if (!hof) return { title: 'Hof nicht gefunden', robots: { index: false, follow: false } };
  const ort = hof.ort ? ` in ${hof.ort}` : '';
  return {
    title: `${hof.name}${ort} — Hofladen`,
    description: `${hof.name}${ort}: Hofladen und Direktvermarkter${hof.verkauft_fleisch ? ' mit Fleischangebot' : ''}${hof.bio ? ', Bio' : ''}. Adresse, Öffnungszeiten und Höfe in der Nähe im Hofladen-Radar.`,
    alternates: { canonical: `https://steakakademie.de/hoefe/${hof.slug}` },
    // Unbestaetigte OSM-Profile sind duenn (Name + Adresse) — erst indexieren,
    // wenn der Inhaber sie bestaetigt hat. Sonst 6.000 Thin-Content-Seiten.
    robots: hof.beansprucht ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function HofPage(props: Props) {
  const params = await props.params;
  const hof = await hofPerSlug(params.slug);
  if (!hof) notFound();

  const umgebung = await nachbarn(hof, 25, 6);
  const web = sichereUrl(hof.website);
  const status = fleischStatus(hof.verkauft_fleisch);
  const adresse = adresseZeile(hof);
  const radarHref = `/hoefe?lat=${hof.lat.toFixed(5)}&lng=${hof.lng.toFixed(5)}&km=25`;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-base">
        <div className="mx-auto max-w-editorial px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <nav className="mb-6 flex items-center gap-1.5 font-sans text-xs text-text-muted" aria-label="Breadcrumb">
            <Link href="/" className="transition-colors hover:text-brand-fire">Start</Link>
            <ChevronRight size={12} />
            <Link href="/hoefe" className="transition-colors hover:text-brand-fire">Hofladen-Radar</Link>
            <ChevronRight size={12} />
            <span className="truncate text-text-secondary">{hof.name}</span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-3">
            <article className="lg:col-span-2">
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {hof.verkauft_fleisch === true ? (
                  <span className="inline-flex items-center gap-1 rounded bg-brand-fire/15 px-2 py-0.5 font-semibold text-brand-fire"><Beef size={11} /> {status.text}</span>
                ) : (
                  <span className="rounded bg-surface-elevated px-2 py-0.5 text-text-muted">{status.text}</span>
                )}
                {hof.bio && <span className="inline-flex items-center gap-1 rounded bg-green-900/40 px-2 py-0.5 font-semibold text-green-300"><Leaf size={11} /> Bio{hof.bio_zertifikat ? ` · ${hof.bio_zertifikat}` : ''}</span>}
                {hof.beansprucht && <span className="inline-flex items-center gap-1 rounded bg-brand-gold/15 px-2 py-0.5 font-semibold text-brand-gold"><ShieldCheck size={11} /> Vom Hof bestätigt</span>}
              </div>
              <h1 className="mt-3 font-serif text-3xl leading-tight text-text-primary sm:text-4xl">{hof.name}</h1>
              {hof.ort && <p className="mt-1 font-sans text-sm text-text-secondary">Hofladen{hof.ort ? ` in ${hof.ort}` : ''}</p>}

              {hof.beschreibung && (
                <p className="mt-6 font-body text-[1rem] leading-relaxed text-text-secondary">{hof.beschreibung}</p>
              )}

              {hof.fleischarten.length > 0 && (
                <section className="mt-6">
                  <h2 className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-brand-gold">Fleisch laut Angabe des Hofs</h2>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {fleischartenLabel(hof.fleischarten).map((a) => (
                      <li key={a} className="rounded-lg border border-border-subtle bg-surface-card px-3 py-1.5 text-sm text-text-primary">{a}</li>
                    ))}
                  </ul>
                </section>
              )}

              <dl className="mt-8 divide-y divide-border-subtle rounded-xl border border-border-subtle bg-surface-card">
                {adresse && (
                  <div className="flex gap-3 p-4">
                    <dt className="shrink-0 text-brand-gold"><MapPin size={18} /><span className="sr-only">Adresse</span></dt>
                    <dd className="text-sm text-text-primary">{adresse}</dd>
                  </div>
                )}
                {hof.oeffnungszeiten && (
                  <div className="flex gap-3 p-4">
                    <dt className="shrink-0 text-brand-gold"><Clock size={18} /><span className="sr-only">Öffnungszeiten</span></dt>
                    <dd className="text-sm text-text-primary">
                      <span className="font-mono text-[13px]">{hof.oeffnungszeiten}</span>
                      <span className="mt-1 block text-xs text-text-muted">Angabe aus OpenStreetMap — vor dem Besuch prüfen.</span>
                    </dd>
                  </div>
                )}
                {web && (
                  <div className="flex gap-3 p-4">
                    <dt className="shrink-0 text-brand-gold"><Globe size={18} /><span className="sr-only">Website</span></dt>
                    <dd className="text-sm"><a href={web} target="_blank" rel="noopener noreferrer nofollow" className="text-text-primary underline hover:text-brand-fire">{hostAusUrl(web)}</a></dd>
                  </div>
                )}
                {hof.telefon && (
                  <div className="flex gap-3 p-4">
                    <dt className="shrink-0 text-brand-gold"><Phone size={18} /><span className="sr-only">Telefon</span></dt>
                    <dd className="text-sm"><a href={`tel:${hof.telefon.replace(/\s+/g, '')}`} className="text-text-primary hover:text-brand-fire">{hof.telefon}</a></dd>
                  </div>
                )}
              </dl>

              <Link href={radarHref} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-fire px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-ink hover:opacity-90">
                <Radar size={16} /> Auf der Karte zeigen
              </Link>

              <p className="mt-8 text-xs leading-relaxed text-text-muted">
                Daten: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-gold">© OpenStreetMap-Mitwirkende</a> (ODbL)
                {hof.letzter_import ? `, Stand ${new Date(hof.letzter_import).toLocaleDateString('de-DE')}` : ''}. Keine Geschäftsbeziehung zwischen Steakakademie und diesem Hof.
              </p>
            </article>

            <aside className="space-y-6">
              <div className="rounded-xl border border-brand-gold/25 bg-surface-card p-5">
                <div className="border-t-2 border-brand-gold -mt-5 mb-3 pt-4">
                  <h3 className="font-sans text-sm font-bold text-text-primary">Das ist dein Hof?</h3>
                </div>
                <p className="text-sm text-text-secondary">
                  Bestätige oder korrigiere die Angaben — bestätigte Höfe tragen das Siegel und stehen in der Suche vorn.
                </p>
                <Link href={`/kontakt?betreff=hofladen&hof=${encodeURIComponent(hof.slug)}`} className="mt-3 inline-flex items-center gap-1 text-sm font-bold uppercase tracking-wide text-brand-gold hover:text-brand-fire">
                  Angaben melden <ChevronRight size={14} />
                </Link>
              </div>

              {umgebung.length > 0 && (
                <div className="rounded-xl border border-border-subtle bg-surface-elevated p-5">
                  <div className="border-t-2 border-text-primary -mt-5 mb-3 pt-4">
                    <h3 className="font-sans text-sm font-bold text-text-primary">Höfe in der Nähe</h3>
                  </div>
                  <ul className="space-y-1">
                    {umgebung.map((n) => (
                      <li key={n.id}>
                        <Link href={`/hoefe/${n.slug}`} className="group flex items-center justify-between gap-2 border-b border-border-subtle/50 py-1.5 text-sm text-text-secondary hover:text-brand-fire">
                          <span className="truncate">{n.name}{n.verkauft_fleisch ? ' 🥩' : ''}</span>
                          <span className="shrink-0 text-xs text-text-muted">{entfernungLabel(n.entfernung_km)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-xl border border-border-subtle bg-surface-elevated p-5">
                <div className="border-t-2 border-brand-gold -mt-5 mb-3 pt-4">
                  <h3 className="font-sans text-sm font-bold text-text-primary">Vor dem Kauf</h3>
                </div>
                <ul className="space-y-1">
                  {[
                    { label: 'Cut-Atlas: Welches Stück wofür', href: '/cuts' },
                    { label: 'Kerntemperaturen', href: '/temperatur-guide' },
                    { label: 'Reifung verstehen', href: '/aging' },
                  ].map(({ label, href }) => (
                    <li key={href}>
                      <Link href={href} className="flex items-center justify-between border-b border-border-subtle/50 py-1.5 text-sm text-text-secondary hover:text-brand-fire">
                        {label} <ChevronRight size={13} className="text-brand-fire" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
