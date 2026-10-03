'use client';

import { useState } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { X, ChefHat, Plus, Trash2, ChevronDown, Award, Clock, AlertCircle, LogIn, ExternalLink } from 'lucide-react';
import { z } from 'zod';

// ─── Design-Token-Klassen ─────────────────────────────────────────────────────

const inputCls =
  'w-full bg-surface-elevated border border-border-subtle px-3 py-2.5 text-sm font-body ' +
  'text-text-primary placeholder:text-text-muted/55 focus:border-brand-gold ' +
  'focus:ring-1 focus:ring-brand-gold/25 transition-colors';

const selectCls =
  'bg-surface-elevated border border-border-subtle px-3 py-2.5 text-sm font-body ' +
  'text-text-primary focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/25 ' +
  'transition-colors appearance-none cursor-pointer';

const labelCls = 'block text-[10px] font-sans font-bold tracking-[0.15em] uppercase text-text-muted mb-1.5';
const errorCls = 'text-xs font-sans text-brand-fire mt-1 leading-snug';

// ─── Zod-Schema ───────────────────────────────────────────────────────────────

const EINHEITEN = ['g', 'kg', 'ml', 'l', 'EL', 'TL', 'Stück', 'Bund', 'Prise', 'Msp.'] as const;
type Einheit = (typeof EINHEITEN)[number];

const ZutatSchema = z.object({
  menge:   z.string().min(1, { message: 'Ein Meister vergisst keine Mengenangabe.' }),
  einheit: z.enum(EINHEITEN, { errorMap: () => ({ message: 'Bitte eine Einheit wählen.' }) }),
  name:    z.string().min(2, { message: 'Zutaten verdienen ihren vollen Namen — mindestens 2 Zeichen.' }),
});

const SchrittSchema = z.object({
  beschreibung: z.string().min(10, {
    message: 'Ein Schritt braucht Substanz — Temperatur, Zeit, Technik.',
  }),
});

const RezeptSchema = z.object({
  titel: z
    .string()
    .min(3, { message: 'Jedes Meisterwerk braucht einen würdigen Titel.' })
    .max(70, { message: 'Ein Titel ist kein Aufsatz — maximal 70 Zeichen.' }),
  beschreibung: z
    .string()
    .min(20, { message: 'Verführe uns mit mehr als 20 Zeichen.' })
    .max(200, { message: 'Die Essenz in 200 Zeichen — nicht mehr.' }),
  portionen:       z.string().min(1, { message: 'Für wie viele Seelen kochst du?' }),
  zubereitungszeit: z.string().min(1, { message: 'Zeit ist Respekt — wie lange dauert es?' }),
  zutaten: z.array(ZutatSchema).min(1, {
    message: 'Ein Rezept ohne Zutaten ist eine Fantasie, kein Gericht.',
  }),
  schritte: z.array(SchrittSchema).min(1, {
    message: 'Führe uns Schritt für Schritt — mindestens einer ist Pflicht.',
  }),
  einwilligung: z.literal(true, {
    errorMap: () => ({ message: 'Bitte bestätige die Rechte- und Datenschutz-Hinweise, um einzureichen.' }),
  }),
});

type FieldErrors = Partial<Record<string, string>>;

// ─── Initial State ────────────────────────────────────────────────────────────

const INITIAL: {
  titel: string;
  beschreibung: string;
  portionen: string;
  zubereitungszeit: string;
  zutaten: { menge: string; einheit: Einheit; name: string }[];
  schritte: { beschreibung: string }[];
  einwilligung: boolean;
} = {
  titel:            '',
  beschreibung:     '',
  portionen:        '',
  zubereitungszeit: '',
  zutaten:  [{ menge: '', einheit: 'g', name: '' }],
  schritte: [{ beschreibung: '' }],
  einwilligung: false,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionHeader({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="h-px flex-1 bg-border-subtle" />
      <div className="text-center shrink-0">
        <span className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-gold">
          {label}
        </span>
        <p className="text-[11px] font-sans text-text-muted mt-0.5">{sub}</p>
      </div>
      <div className="h-px flex-1 bg-border-subtle" />
    </div>
  );
}

// ─── Haupt-Komponente ─────────────────────────────────────────────────────────

export default function RecipeSubmitModal() {
  const [open, setOpen]           = useState(false);
  const [form, setForm]           = useState(INITIAL);
  const [errors, setErrors]       = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending]     = useState(false);
  const [result, setResult]       = useState<{ status: string; message: string } | null>(null);

  // ── Feld-Helfer ──

  function setField<K extends keyof typeof INITIAL>(key: K, val: (typeof INITIAL)[K]) {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: undefined }));
  }

  // ── Zutaten ──

  function updateZutat(i: number, key: keyof (typeof INITIAL.zutaten)[0], val: string) {
    setForm(f => {
      const next = [...f.zutaten];
      next[i] = { ...next[i], [key]: val } as typeof next[0];
      return { ...f, zutaten: next };
    });
    setErrors(e => ({ ...e, [`zutaten.${i}.${key}`]: undefined }));
  }

  function addZutat() {
    setForm(f => ({ ...f, zutaten: [...f.zutaten, { menge: '', einheit: 'g' as Einheit, name: '' }] }));
  }

  function removeZutat(i: number) {
    setForm(f => ({ ...f, zutaten: f.zutaten.filter((_, j) => j !== i) }));
  }

  // ── Schritte ──

  function updateSchritt(i: number, val: string) {
    setForm(f => {
      const next = [...f.schritte];
      next[i] = { beschreibung: val };
      return { ...f, schritte: next };
    });
    setErrors(e => ({ ...e, [`schritte.${i}.beschreibung`]: undefined }));
  }

  function addSchritt() {
    setForm(f => ({ ...f, schritte: [...f.schritte, { beschreibung: '' }] }));
  }

  function removeSchritt(i: number) {
    setForm(f => ({ ...f, schritte: f.schritte.filter((_, j) => j !== i) }));
  }

  // ── Submit ──

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = RezeptSchema.safeParse(form);
    if (!result.success) {
      const fe: FieldErrors = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        if (!fe[path]) fe[path] = issue.message;
      }
      setErrors(fe);
      // Ersten Fehler anspringen
      const firstKey = Object.keys(fe)[0];
      const el = document.getElementById(`field-${firstKey}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/rezept-einreichen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setResult({ status: 'login', message: data.error ?? 'Bitte melde dich an, um ein Rezept einzureichen.' });
      } else if (!res.ok) {
        setResult({ status: 'error', message: data.error ?? 'Etwas ist schiefgelaufen. Bitte später erneut.' });
      } else {
        setResult({ status: data.status, message: data.message });
      }
    } catch {
      setResult({ status: 'error', message: 'Netzwerkfehler — bitte später erneut versuchen.' });
    } finally {
      setSending(false);
      setSubmitted(true);
    }
  }

  function handleClose() {
    setOpen(false);
    setTimeout(() => {
      setForm(INITIAL);
      setErrors({});
      setSubmitted(false);
      setResult(null);
    }, 350);
  }

  return (
    <>
      {/* ── Sidebar Teaser-Box ─────────────────────────────────────────────── */}
      <div className="bg-surface-elevated border border-brand-gold/20 overflow-hidden">
        {/* Amber accent line */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-brand-gold to-transparent" />

        <div className="p-5">
          {/* Icon + Kicker */}
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 bg-brand-gold/10 border border-brand-gold/25 flex items-center justify-center shrink-0">
              <ChefHat size={14} className="text-brand-gold" />
            </div>
            <span className="text-[10px] font-sans font-bold tracking-[0.15em] uppercase text-brand-gold">
              Meister-Rezept
            </span>
          </div>

          {/* Copy */}
          <p className="text-sm font-body text-text-secondary leading-relaxed mb-4">
            Du hast ein Meister-Rezept? Werde Teil der Akademie und reiche deine Kreation ein.
          </p>

          {/* CTA */}
          <button
            onClick={() => setOpen(true)}
            className="w-full bg-brand-gold hover:bg-[#b07020] active:bg-[#9a6010] active:scale-[0.98] motion-reduce:active:scale-100 text-ink font-sans font-bold text-xs tracking-[0.14em] uppercase py-3 px-4 transition duration-200 ease-out"
          >
            REZEPT EINREICHEN
          </button>
        </div>
      </div>

      {/* ── Modal ─────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/78 z-[100] backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16, transition: { duration: 0.18 } }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="fixed inset-x-4 top-[4vh] bottom-[4vh] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-2xl z-[101] flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-label="Rezept einreichen"
            >
              <div className="flex flex-col h-full bg-surface-dark border border-brand-gold/18 shadow-[0_40px_100px_rgba(0,0,0,0.85)]">

                {/* Top accent */}
                <div className="h-px bg-gradient-to-r from-brand-fire/60 via-brand-gold to-brand-fire/60 shrink-0" />

                {/* Modal-Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center shrink-0">
                      <ChefHat size={15} className="text-brand-gold" />
                    </div>
                    <div>
                      <p className="text-[9px] font-sans font-bold tracking-[0.2em] uppercase text-brand-fire">
                        Steakakademie
                      </p>
                      <h2 className="font-serif text-lg font-bold text-text-primary leading-none mt-0.5">
                        Rezept einreichen
                      </h2>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="text-text-muted hover:text-text-primary transition duration-200 ease-out active:scale-[0.98] motion-reduce:active:scale-100 p-1 -mr-1"
                    aria-label="Schließen"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Scrollbarer Body */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-4">
                  {submitted ? (
                    /* ── Ergebnis-State (KI-Urteil) ── */
                    (() => {
                      const s = result?.status ?? 'error';
                      // Kein `approved` mehr (03.10.2026): Die KI-Vorprüfung gibt nichts frei,
                      // /api/rezept-einreichen antwortet nur noch mit needs_review oder rejected.
                      // Veröffentlicht wird erst nach Freigabe unter /admin/rezepte.
                      const cfgMap: Record<string, { Icon: typeof Award; color: string; title: string }> = {
                        needs_review: { Icon: Clock,       color: '#C8882A', title: 'Eingegangen — wird geprüft' },
                        rejected:     { Icon: AlertCircle, color: '#E85018', title: 'Noch nicht ganz' },
                        login:        { Icon: LogIn,       color: '#C8882A', title: 'Anmeldung nötig' },
                        error:        { Icon: AlertCircle, color: '#E85018', title: 'Etwas ist schiefgelaufen' },
                      };
                      const cfg = cfgMap[s] ?? { Icon: Award, color: '#C8882A', title: 'Eingegangen' };
                      const { Icon } = cfg;
                      return (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 }}
                          className="flex flex-col items-center justify-center min-h-[340px] text-center py-12"
                        >
                          <div className="w-16 h-16 flex items-center justify-center mb-6 border"
                            style={{ background: `${cfg.color}1A`, borderColor: `${cfg.color}4D` }}>
                            <Icon size={28} style={{ color: cfg.color }} />
                          </div>
                          <h3 className="font-serif text-2xl font-bold text-text-primary mb-3">{cfg.title}</h3>
                          <p className="text-sm font-body text-text-secondary max-w-sm leading-relaxed">
                            {result?.message ?? 'Deine Einreichung wurde verarbeitet.'}
                          </p>

                          {/* Aktionen je Ergebnis */}
                          {s === 'needs_review' && (
                            <a href="/diplome/profil"
                              className="mt-7 inline-flex items-center gap-2 px-6 py-3 bg-brand-gold text-ink font-sans font-bold text-xs tracking-[0.12em] uppercase hover:bg-[#b07020] transition duration-200 ease-out active:scale-[0.98] motion-reduce:active:scale-100">
                              Stand im Profil ansehen <ExternalLink size={13} />
                            </a>
                          )}
                          {s === 'login' && (
                            <a href="/auth/login?redirectTo=/rezepte"
                              className="mt-7 inline-flex items-center gap-2 px-6 py-3 bg-brand-gold text-ink font-sans font-bold text-xs tracking-[0.12em] uppercase hover:bg-[#b07020] transition duration-200 ease-out active:scale-[0.98] motion-reduce:active:scale-100">
                              Zum Login <LogIn size={13} />
                            </a>
                          )}
                          {(s === 'rejected' || s === 'error') && (
                            <button
                              onClick={() => { setSubmitted(false); setResult(null); }}
                              className="mt-7 inline-flex items-center gap-2 px-6 py-3 border border-brand-gold/40 text-brand-gold font-sans font-bold text-xs tracking-[0.12em] uppercase hover:bg-brand-gold/10 transition duration-200 ease-out active:scale-[0.98] motion-reduce:active:scale-100">
                              Rezept überarbeiten
                            </button>
                          )}

                          <button
                            onClick={handleClose}
                            className="mt-6 text-[11px] font-sans tracking-[0.12em] uppercase text-text-muted hover:text-text-primary transition-colors border-b border-text-muted/30 hover:border-text-primary/50 pb-px"
                          >
                            Fenster schließen
                          </button>
                        </motion.div>
                      );
                    })()
                  ) : (
                    /* ── Formular ── */
                    <form id="rezept-form" onSubmit={handleSubmit} noValidate>

                      {/* ── Bereich A — Basisdaten ── */}
                      <SectionHeader label="Bereich A" sub="Basisdaten" />

                      <div className="space-y-4">

                        {/* Titel */}
                        <div id="field-titel">
                          <label htmlFor="f-titel" className={labelCls}>Rezept-Titel *</label>
                          <input
                            id="f-titel"
                            type="text"
                            value={form.titel}
                            onChange={e => setField('titel', e.target.value)}
                            placeholder="z. B. Texas Brisket nach Aaron Franklin"
                            className={inputCls}
                          />
                          {errors.titel && <p className={errorCls}>{errors.titel}</p>}
                        </div>

                        {/* Beschreibung */}
                        <div id="field-beschreibung">
                          <label htmlFor="f-beschr" className={labelCls}>Kurzbeschreibung *</label>
                          <textarea
                            id="f-beschr"
                            value={form.beschreibung}
                            onChange={e => setField('beschreibung', e.target.value)}
                            placeholder="Was macht dieses Rezept besonders? (max. 200 Zeichen)"
                            rows={2}
                            className={`${inputCls} resize-none`}
                          />
                          <div className="flex justify-between items-start mt-1">
                            {errors.beschreibung
                              ? <p className={errorCls}>{errors.beschreibung}</p>
                              : <span />}
                            <span
                              className={`text-[10px] font-sans shrink-0 ${
                                form.beschreibung.length > 200 ? 'text-brand-fire' : 'text-text-muted'
                              }`}
                            >
                              {form.beschreibung.length}/200
                            </span>
                          </div>
                        </div>

                        {/* Portionen + Zeit */}
                        <div className="grid grid-cols-2 gap-3">
                          <div id="field-portionen">
                            <label htmlFor="f-port" className={labelCls}>Portionen *</label>
                            <div className="relative">
                              <select
                                id="f-port"
                                value={form.portionen}
                                onChange={e => setField('portionen', e.target.value)}
                                className={`${selectCls} w-full pr-8`}
                              >
                                <option value="" disabled>Wählen …</option>
                                {[1, 2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                                  <option key={n} value={String(n)}>
                                    {n} Portion{n > 1 ? 'en' : ''}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                            </div>
                            {errors.portionen && <p className={errorCls}>{errors.portionen}</p>}
                          </div>

                          <div id="field-zubereitungszeit">
                            <label htmlFor="f-zeit" className={labelCls}>Zubereitungszeit *</label>
                            <div className="relative">
                              <select
                                id="f-zeit"
                                value={form.zubereitungszeit}
                                onChange={e => setField('zubereitungszeit', e.target.value)}
                                className={`${selectCls} w-full pr-8`}
                              >
                                <option value="" disabled>Wählen …</option>
                                {[
                                  '15 Min.', '30 Min.', '45 Min.',
                                  '1 Std.', '1,5 Std.', '2 Std.',
                                  '3 Std.', '4 Std.', '6+ Std.', 'Overnight',
                                ].map(t => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                              <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                            </div>
                            {errors.zubereitungszeit && <p className={errorCls}>{errors.zubereitungszeit}</p>}
                          </div>
                        </div>
                      </div>

                      {/* ── Bereich B — Zutaten ── */}
                      <SectionHeader label="Bereich B" sub="Strukturierte Zutaten" />

                      <div className="space-y-2">
                        {/* Spaltenheader */}
                        <div className="grid grid-cols-[72px_96px_1fr_24px] gap-2 mb-0.5">
                          <span className={labelCls}>Menge</span>
                          <span className={labelCls}>Einheit</span>
                          <span className={labelCls}>Zutat</span>
                          <span />
                        </div>

                        {form.zutaten.map((z, i) => (
                          <div key={i} className="grid grid-cols-[72px_96px_1fr_24px] gap-2 items-start">
                            <div id={`field-zutaten.${i}.menge`}>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={z.menge}
                                onChange={e => updateZutat(i, 'menge', e.target.value)}
                                placeholder="500"
                                className={inputCls}
                              />
                              {errors[`zutaten.${i}.menge`] && (
                                <p className={errorCls}>{errors[`zutaten.${i}.menge`]}</p>
                              )}
                            </div>

                            <div className="relative" id={`field-zutaten.${i}.einheit`}>
                              <select
                                value={z.einheit}
                                onChange={e => updateZutat(i, 'einheit', e.target.value)}
                                className={`${selectCls} w-full pr-6`}
                              >
                                {EINHEITEN.map(u => <option key={u} value={u}>{u}</option>)}
                              </select>
                              <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                            </div>

                            <div id={`field-zutaten.${i}.name`}>
                              <input
                                type="text"
                                value={z.name}
                                onChange={e => updateZutat(i, 'name', e.target.value)}
                                placeholder="Rinderbrisket Packer Cut"
                                className={inputCls}
                              />
                              {errors[`zutaten.${i}.name`] && (
                                <p className={errorCls}>{errors[`zutaten.${i}.name`]}</p>
                              )}
                            </div>

                            <div className="flex items-center justify-center pt-2.5">
                              {form.zutaten.length > 1 ? (
                                <button
                                  type="button"
                                  onClick={() => removeZutat(i)}
                                  className="text-text-muted hover:text-brand-fire transition-colors"
                                  aria-label="Zutat entfernen"
                                >
                                  <Trash2 size={13} />
                                </button>
                              ) : null}
                            </div>
                          </div>
                        ))}

                        {errors.zutaten && (
                          <p className={errorCls}>{errors.zutaten}</p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={addZutat}
                        className="flex items-center gap-1.5 mt-3 mb-1 text-xs font-sans font-bold text-brand-gold hover:text-[#b07020] active:text-[#9a6010] transition-colors tracking-[0.12em] uppercase"
                      >
                        <Plus size={13} />
                        Zutat hinzufügen
                      </button>

                      {/* ── Bereich C — Schritte ── */}
                      <SectionHeader label="Bereich C" sub="Zubereitungsschritte" />

                      <div className="space-y-4">
                        {form.schritte.map((s, i) => (
                          <div key={i} id={`field-schritte.${i}.beschreibung`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className={labelCls}>Schritt {i + 1}</label>
                              {form.schritte.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeSchritt(i)}
                                  className="text-text-muted hover:text-brand-fire transition-colors"
                                  aria-label={`Schritt ${i + 1} entfernen`}
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                            <textarea
                              value={s.beschreibung}
                              onChange={e => updateSchritt(i, e.target.value)}
                              placeholder={`Beschreibe Schritt ${i + 1} präzise — Temperatur, Zeit, Technik.`}
                              rows={3}
                              className={`${inputCls} resize-none`}
                            />
                            {errors[`schritte.${i}.beschreibung`] && (
                              <p className={errorCls}>{errors[`schritte.${i}.beschreibung`]}</p>
                            )}
                          </div>
                        ))}

                        {errors.schritte && (
                          <p className={errorCls}>{errors.schritte}</p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={addSchritt}
                        className="flex items-center gap-1.5 mt-3 text-xs font-sans font-bold text-brand-gold hover:text-[#b07020] active:text-[#9a6010] transition-colors tracking-[0.12em] uppercase"
                      >
                        <Plus size={13} />
                        Schritt hinzufügen
                      </button>

                      {/* ── Bereich D — Rechte & Datenschutz (Pflicht) ── */}
                      <SectionHeader label="Bereich D" sub="Rechte & Veröffentlichung" />

                      <div id="field-einwilligung" className="bg-surface-elevated border border-border-subtle p-4">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.einwilligung}
                            onChange={e => setField('einwilligung', e.target.checked)}
                            className="mt-0.5 h-4 w-4 shrink-0 accent-brand-gold cursor-pointer"
                          />
                          <span className="text-xs font-body text-text-secondary leading-relaxed">
                            Ich bestätige, dass dieses Rezept von mir stammt bzw. ich die nötigen
                            Rechte daran habe und keine fremden Rechte verletze. Ich räume der
                            Steakakademie das Recht ein, es (samt automatisch generiertem KI-Bild)
                            kostenlos und dauerhaft auf der Plattform zu veröffentlichen, und willige
                            ein, dass mein gewählter Anzeigename als Autor angezeigt wird. Es besteht
                            kein Vergütungsanspruch; eine Entfernung kann ich jederzeit per E-Mail
                            verlangen. Details:{' '}
                            <a href="/agb#community" target="_blank" rel="noopener noreferrer" className="text-brand-gold hover:underline">AGB § 12</a>
                            {' '}·{' '}
                            <a href="/datenschutz#community" target="_blank" rel="noopener noreferrer" className="text-brand-gold hover:underline">Datenschutz</a>.
                          </span>
                        </label>
                        {errors.einwilligung && <p className={`${errorCls} mt-2`}>{errors.einwilligung}</p>}
                        <p className="mt-3 text-[10px] font-sans text-text-muted leading-relaxed">
                          Hinweis: Jede Einreichung wird automatisiert durch ein KI-System vorgeprüft;
                          veröffentlicht wird sie erst nach unserer Freigabe.
                          Bitte gib keine personenbezogenen Daten Dritter (Klarnamen, Adressen) in das Rezept ein.
                        </p>
                      </div>

                      {/* Unterer Abstand im Scroll-Bereich */}
                      <div className="h-4" />
                    </form>
                  )}
                </div>

                {/* Footer */}
                {!submitted && (
                  <div className="shrink-0 border-t border-border-subtle px-6 py-4 flex items-center justify-between gap-4">
                    <p className="text-[10px] font-sans text-text-muted leading-relaxed">
                      Nur qualitätsgeprüfte Rezepte<br className="hidden sm:block" />
                      erscheinen auf der Akademie.
                    </p>
                    <button
                      form="rezept-form"
                      type="submit"
                      disabled={sending}
                      className="shrink-0 bg-brand-gold hover:bg-[#b07020] active:bg-[#9a6010] active:scale-[0.98] motion-reduce:active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 text-ink font-sans font-bold text-xs tracking-[0.14em] uppercase px-7 py-3 transition duration-200 ease-out"
                    >
                      {sending ? 'Einreichen …' : 'EINREICHEN'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
