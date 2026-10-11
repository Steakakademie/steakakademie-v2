import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PrintButton from '@/components/gutschein/PrintButton';
import GutscheinPersonalisieren from '@/components/gutschein/GutscheinPersonalisieren';
import { Gift, Flame, CheckCircle2, XCircle, Mail } from 'lucide-react';
import { MOTIVE, motivOderStandard, schluesselGleich, versandZeitText } from '@/lib/gutschein-personalisierung';
import { mailVersandVerfuegbar } from '@/lib/gutschein-versand';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dein Geschenkgutschein',
  robots: { index: false, follow: false },
  // Der Link der Käufer-Mail trägt den Schlüssel (?k=…) — er soll nicht als Referrer weiterwandern.
  referrer: 'same-origin',
};

interface VoucherRow {
  code: string;
  status: 'issued' | 'redeemed' | 'revoked';
  valid_until: string;
  gift_message: string | null;
  redeemed_at: string | null;
  courses: { title: string; slug: string } | null;
  // Personalisierung (Migration …_gutschein_personalisierung, 11.10.2026)
  schenker_token?: string | null;
  empfaenger_name?: string | null;
  schenker_name?: string | null;
  motiv?: string | null;
  empfaenger_email?: string | null;
  empfaenger_hinweis?: string | null;
  versand_status?: string | null;
  versand_am?: string | null;
  versendet_am?: string | null;
}

const BASIS = 'code, status, valid_until, gift_message, redeemed_at, courses(title, slug)';
const PERSONALISIERUNG =
  'schenker_token, empfaenger_name, schenker_name, motiv, empfaenger_email, empfaenger_hinweis, versand_status, versand_am, versendet_am';

async function getVoucher(code: string): Promise<VoucherRow | null> {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  const { data, error } = await admin
    .from('vouchers')
    .select(`${BASIS}, ${PERSONALISIERUNG}`)
    .eq('code', code.toUpperCase())
    .maybeSingle();
  if (!error) return (data as unknown as VoucherRow) ?? null;
  // Spalten fehlen (Migration noch nicht angewendet): Seite zeigt den Gutschein ohne
  // Personalisierung, statt ihn als „nicht gefunden" zu melden.
  console.error('[gutschein] Personalisierung nicht lesbar, Rückfall auf Grunddaten', error.message);
  const { data: basis } = await admin.from('vouchers').select(BASIS).eq('code', code.toUpperCase()).maybeSingle();
  return (basis as unknown as VoucherRow) ?? null;
}

export default async function VoucherPage(props: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ k?: string | string[] }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const code = decodeURIComponent(params.code).toUpperCase();
  const voucher = await getVoucher(code);
  // Schlüssel des Schenkenden aus der Käufer-Mail: öffnet das Formular „persönlich machen".
  const k = typeof searchParams.k === 'string' ? searchParams.k : '';
  const istSchenker = Boolean(voucher && k && schluesselGleich(voucher.schenker_token ?? null, k));
  const motiv = MOTIVE[motivOderStandard(voucher?.motiv)];

  return (
    <>
      <Header />
      <main className="max-w-content mx-auto px-4 sm:px-6 py-16">
        {!voucher ? (
          <div className="text-center py-12">
            <XCircle size={44} className="text-text-muted mx-auto mb-4" />
            <h1 className="font-serif text-2xl font-bold text-text-primary mb-2">Gutschein nicht gefunden</h1>
            <p className="font-body text-text-secondary">
              Diesen Code kennen wir nicht. Prüfe die Schreibweise oder den Link aus deiner E-Mail.
            </p>
          </div>
        ) : (
          <>
            {/* ── Der Gutschein (druckbar) ── */}
            <div className="relative bg-surface-card border-2 border-brand-gold/60 p-8 sm:p-12 text-center overflow-hidden">
              <div className="absolute inset-0 pointer-events-none opacity-[0.10]"
                style={{ background: `radial-gradient(circle at 50% 0%, ${motiv.farbe} 0%, transparent 60%)` }} />

              <span className="category-label text-brand-gold mb-4 block">Steakakademie · Geschenkgutschein</span>
              <Gift size={40} className="text-brand-gold mx-auto mb-5" />

              {motiv.ueberschrift && (
                <p className="font-serif text-2xl sm:text-3xl font-bold text-brand-gold mb-3">{motiv.ueberschrift}</p>
              )}
              {voucher.empfaenger_name && (
                <p className="font-body text-lg text-text-light mb-4">Für {voucher.empfaenger_name}</p>
              )}

              <p className="font-body text-text-secondary mb-1">Dieser Gutschein schaltet frei:</p>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-text-light mb-6 leading-tight">
                {voucher.courses?.title ?? 'Steakakademie-Produkt'}
              </h1>

              <div className="inline-block bg-surface-base border border-border-subtle px-6 py-4 mb-6">
                <p className="text-[10px] font-sans uppercase tracking-widest text-text-muted mb-1">Code</p>
                <p className="font-mono text-2xl sm:text-3xl tracking-[0.2em] text-brand-gold font-bold">{voucher.code}</p>
              </div>

              {voucher.gift_message && (
                <p className="font-body italic text-text-secondary max-w-md mx-auto mb-2 whitespace-pre-line">„{voucher.gift_message}&quot;</p>
              )}
              {voucher.schenker_name ? (
                <p className="font-body text-text-secondary mb-6">— {voucher.schenker_name}</p>
              ) : (
                voucher.gift_message && <div className="mb-4" />
              )}

              <p className="text-xs font-sans text-text-muted">
                Gültig bis {new Date(voucher.valid_until).toLocaleDateString('de-DE')}
              </p>

              {/* Status */}
              {voucher.status === 'redeemed' && (
                <p className="mt-4 inline-flex items-center gap-2 text-sm font-sans text-green-500">
                  <CheckCircle2 size={15} /> Bereits eingelöst
                  {voucher.redeemed_at && ` am ${new Date(voucher.redeemed_at).toLocaleDateString('de-DE')}`}
                </p>
              )}
              {voucher.status === 'revoked' && (
                <p className="mt-4 inline-flex items-center gap-2 text-sm font-sans text-brand-fire">
                  <XCircle size={15} /> Nicht mehr gültig
                </p>
              )}
            </div>

            {/* ── Aktionen + Anleitung ── */}
            {voucher.status === 'issued' ? (
              <div className="mt-8 text-center">
                <Link href={`/gutschein/einloesen?code=${encodeURIComponent(voucher.code)}`} className="btn-affiliate inline-flex justify-center text-base px-8">
                  <Flame size={16} /> Jetzt einlösen
                </Link>
                <div className="mt-6 flex justify-center">
                  <PrintButton />
                </div>

                {istSchenker && voucher.versand_status === 'geplant' && voucher.versand_am && (
                  <p className="mt-6 inline-flex items-center gap-2 text-sm font-sans text-text-secondary print:hidden">
                    <Mail size={15} className="text-brand-gold" />
                    Geplant: Versand an {voucher.empfaenger_hinweis ?? 'die beschenkte Person'} am{' '}
                    {versandZeitText(voucher.versand_am).replace(', ', ' ab ')}
                  </p>
                )}
                {istSchenker && voucher.versand_status === 'versendet' && (
                  <p className="mt-6 inline-flex items-center gap-2 text-sm font-sans text-green-500 print:hidden">
                    <CheckCircle2 size={15} />
                    Verschickt an {voucher.empfaenger_hinweis ?? 'die beschenkte Person'}
                    {voucher.versendet_am && ` am ${versandZeitText(voucher.versendet_am)}`}
                  </p>
                )}
                {istSchenker && voucher.versand_status === 'fehlgeschlagen' && (
                  <p className="mt-6 text-sm font-sans text-brand-fire print:hidden">
                    Der Versand hat nicht geklappt. Prüf die Adresse unten und speichere erneut — oder schreib uns an
                    pitmaster@steakakademie.de.
                  </p>
                )}

                {istSchenker && voucher.versand_status !== 'versendet' && voucher.versand_status !== 'in_arbeit' && (
                  <GutscheinPersonalisieren
                    code={voucher.code}
                    k={k}
                    mailVerfuegbar={mailVersandVerfuegbar()}
                    start={{
                      empfaengerName: voucher.empfaenger_name ?? '',
                      schenkerName: voucher.schenker_name ?? '',
                      nachricht: voucher.gift_message ?? '',
                      motiv: motivOderStandard(voucher.motiv),
                      versandStatus: voucher.versand_status ?? 'keiner',
                      empfaengerEmail: voucher.empfaenger_email ?? '',
                      versandAmIso: voucher.versand_am ?? null,
                    }}
                  />
                )}
                <div className="mt-10 text-left bg-surface-base border border-border-subtle p-6 print:hidden">
                  <h2 className="font-sans font-bold text-sm text-text-primary mb-3">So löst du den Gutschein ein</h2>
                  <ol className="list-decimal list-outside ml-5 space-y-1.5 font-body text-sm text-text-secondary">
                    <li>Auf „Jetzt einlösen&quot; klicken.</li>
                    <li>Mit deiner E-Mail anmelden (kostenloses Konto, falls noch keins).</li>
                    <li>Fertig — dein Produkt ist sofort freigeschaltet und gehört dir dauerhaft.</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="mt-8 text-center">
                <Link href="/" className="text-sm font-sans text-text-secondary underline hover:text-brand-gold">
                  Zur Steakakademie
                </Link>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
