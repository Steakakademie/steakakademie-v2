import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PrintButton from '@/components/gutschein/PrintButton';
import { Gift, Flame, CheckCircle2, XCircle } from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dein Geschenkgutschein',
  robots: { index: false, follow: false },
};

interface VoucherRow {
  code: string;
  status: 'issued' | 'redeemed' | 'revoked';
  valid_until: string;
  gift_message: string | null;
  redeemed_at: string | null;
  courses: { title: string; slug: string } | null;
}

async function getVoucher(code: string): Promise<VoucherRow | null> {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  const { data } = await admin
    .from('vouchers')
    .select('code, status, valid_until, gift_message, redeemed_at, courses(title, slug)')
    .eq('code', code.toUpperCase())
    .maybeSingle();
  return (data as unknown as VoucherRow) ?? null;
}

export default async function VoucherPage(props: { params: Promise<{ code: string }> }) {
  const params = await props.params;
  const code = decodeURIComponent(params.code).toUpperCase();
  const voucher = await getVoucher(code);

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
              <div className="absolute inset-0 pointer-events-none opacity-[0.06]"
                style={{ background: 'radial-gradient(circle at 50% 0%, #E85018 0%, transparent 60%)' }} />

              <span className="category-label text-brand-gold mb-4 block">Steakakademie · Geschenkgutschein</span>
              <Gift size={40} className="text-brand-gold mx-auto mb-5" />

              <p className="font-body text-text-secondary mb-1">Dieser Gutschein schaltet frei:</p>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-text-light mb-6 leading-tight">
                {voucher.courses?.title ?? 'Steakakademie-Produkt'}
              </h1>

              <div className="inline-block bg-surface-base border border-border-subtle px-6 py-4 mb-6">
                <p className="text-[10px] font-sans uppercase tracking-widest text-text-muted mb-1">Code</p>
                <p className="font-mono text-2xl sm:text-3xl tracking-[0.2em] text-brand-gold font-bold">{voucher.code}</p>
              </div>

              {voucher.gift_message && (
                <p className="font-body italic text-text-secondary max-w-md mx-auto mb-6">„{voucher.gift_message}&quot;</p>
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
