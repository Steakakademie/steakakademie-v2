'use client';

import { useState, useMemo } from 'react';
import { calculateDE, calculateNL, type TaxResult } from '@/services/taxCalculator';
import { calculateES } from '@/services/esEvaluator';
import { calculateFR } from '@/services/frEvaluator';
import { calculateIT } from '@/services/itEvaluator';
import { calculatePT } from '@/services/ptEvaluator';
import { calculateAT } from '@/services/atEvaluator';
import { calculateCH } from '@/services/chEvaluator';
import { calculateGB } from '@/services/gbEvaluator';
import { calculateEE } from '@/services/eeEvaluator';
import { calculateAE } from '@/services/aeEvaluator';
import { ChevronDown, Info } from 'lucide-react';

// ─── Typen ────────────────────────────────────────────────────────────────────

type CountryCode = 'DE' | 'NL' | 'FR' | 'ES' | 'IT' | 'PT' | 'AT' | 'CH' | 'GB' | 'EE' | 'AE';

const COUNTRIES: { code: CountryCode; name: string; flag: string; system: string; group: string }[] = [
  // DACH
  { code: 'DE', name: 'Deutschland',  flag: '🇩🇪', system: 'Einzelunternehmer', group: 'DACH' },
  { code: 'AT', name: 'Österreich',   flag: '🇦🇹', system: 'Einzelunternehmer / SVS', group: 'DACH' },
  { code: 'CH', name: 'Schweiz',      flag: '🇨🇭', system: 'Selbstständigerwerbende', group: 'DACH' },
  // EU Süd
  { code: 'NL', name: 'Niederlande',  flag: '🇳🇱', system: 'ZZP (Zelfstandige)', group: 'EU' },
  { code: 'FR', name: 'Frankreich',   flag: '🇫🇷', system: 'Auto-entrepreneur (BNC)', group: 'EU' },
  { code: 'ES', name: 'Spanien',      flag: '🇪🇸', system: 'Autónomo', group: 'EU' },
  { code: 'IT', name: 'Italien',      flag: '🇮🇹', system: 'Regime Forfettario', group: 'EU' },
  { code: 'PT', name: 'Portugal',     flag: '🇵🇹', system: 'Recibos Verdes', group: 'EU' },
  { code: 'EE', name: 'Estland',      flag: '🇪🇪', system: 'OÜ (e-Residency)', group: 'EU' },
  // Englischsprachig
  { code: 'GB', name: 'UK',           flag: '🇬🇧', system: 'Sole Trader', group: 'EN' },
  // Steueroasen / Special
  { code: 'AE', name: 'UAE/Dubai',    flag: '🇦🇪', system: 'Freelance Visa · 0 % ESt', group: 'Special' },
];

const GROSS_PRESETS = [2000, 3000, 4000, 5000, 6000, 8000, 10000];

// ─── Helfer ───────────────────────────────────────────────────────────────────

function eur(n: number) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(n);
}

function pct(n: number) {
  return `${Math.round(n * 100)} %`;
}

function calcFor(code: CountryCode, gross: number): TaxResult {
  switch (code) {
    case 'DE': return calculateDE(gross);
    case 'NL': return calculateNL(gross);
    case 'FR': return calculateFR(gross);
    case 'ES': return calculateES(gross);
    case 'IT': return calculateIT(gross);
    case 'PT': return calculatePT(gross);
    case 'AT': return calculateAT(gross);
    case 'CH': return calculateCH(gross);
    case 'GB': return calculateGB(gross);
    case 'EE': return calculateEE(gross);
    case 'AE': return calculateAE(gross);
  }
}

// ─── Haupt-Komponente ─────────────────────────────────────────────────────────

export default function TaxCalculator() {
  const [gross, setGross] = useState(4000);
  const [inputRaw, setInputRaw] = useState('4000');
  const [selectedCountries, setSelectedCountries] = useState<CountryCode[]>(['DE', 'AT', 'CH', 'AE']);
  const [showNotes, setShowNotes] = useState<CountryCode | null>(null);

  const results = useMemo(() =>
    selectedCountries
      .map((code) => ({ code, result: calcFor(code, gross) }))
      .sort((a, b) => b.result.monthlyNet - a.result.monthlyNet),
    [gross, selectedCountries],
  );

  const deResult = useMemo(() => calcFor('DE', gross), [gross]);

  function toggleCountry(code: CountryCode) {
    setSelectedCountries((prev) =>
      prev.includes(code)
        ? prev.length > 1 ? prev.filter((c) => c !== code) : prev
        : [...prev, code],
    );
  }

  function handleGrossInput(val: string) {
    setInputRaw(val);
    const n = parseInt(val.replace(/\D/g, ''), 10);
    if (!isNaN(n) && n >= 500 && n <= 30000) setGross(n);
  }

  return (
    <div className="space-y-8">

      {/* ── Eingabe ──────────────────────────────────────────────────────────── */}
      <div className="bg-surface-card border border-border-subtle p-6">
        <h2 className="font-serif text-xl font-bold text-text-primary mb-5">
          Monatlicher Bruttoumsatz
        </h2>

        {/* Slider */}
        <div className="mb-4">
          <input
            type="range"
            min={500}
            max={15000}
            step={250}
            value={gross}
            onChange={(e) => {
              const v = Number(e.target.value);
              setGross(v);
              setInputRaw(String(v));
            }}
            className="w-full h-1.5 bg-surface-base rounded-full appearance-none cursor-pointer accent-brand-gold"
          />
          <div className="flex justify-between text-[10px] font-sans text-text-muted mt-1">
            <span>500 €</span><span>15.000 €</span>
          </div>
        </div>

        {/* Direkt-Eingabe + Presets */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-surface-base border border-border-subtle px-3 py-2">
            <input
              type="text"
              inputMode="numeric"
              value={inputRaw}
              onChange={(e) => handleGrossInput(e.target.value)}
              className="w-24 bg-transparent font-serif text-xl font-bold text-brand-gold"
            />
            <span className="font-sans text-sm text-text-muted">€ / Monat</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {GROSS_PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => { setGross(p); setInputRaw(String(p)); }}
                className={`text-[11px] font-sans font-bold px-2.5 py-1 border transition-colors ${
                  gross === p
                    ? 'border-brand-gold text-brand-gold bg-brand-gold/10'
                    : 'border-border-subtle text-text-muted hover:border-brand-gold/40'
                }`}
              >
                {eur(p)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Länder-Auswahl ───────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-sans font-bold tracking-[0.14em] uppercase text-text-muted mb-3">
          Länder vergleichen ({selectedCountries.length} ausgewählt)
        </p>
        {(['DACH', 'EU', 'EN', 'Special'] as const).map((group) => {
          const groupLabel: Record<string, string> = {
            DACH: 'DACH', EU: 'EU', EN: 'Englischsprachig', Special: 'Steuervorteil',
          };
          const groupCountries = COUNTRIES.filter((c) => c.group === group);
          return (
            <div key={group} className="mb-3">
              <span className="text-[10px] font-sans font-bold tracking-[0.12em] uppercase text-text-muted mr-2">
                {groupLabel[group]}
              </span>
              <div className="inline-flex flex-wrap gap-1.5 mt-1">
                {groupCountries.map(({ code, name, flag }) => (
                  <button
                    key={code}
                    onClick={() => toggleCountry(code)}
                    className={`flex items-center gap-1.5 text-sm font-sans px-2.5 py-1 border transition-colors ${
                      selectedCountries.includes(code)
                        ? 'border-brand-gold text-text-primary bg-brand-gold/8'
                        : 'border-border-subtle text-text-muted hover:border-brand-gold/40'
                    }`}
                  >
                    <span>{flag}</span>
                    <span>{name}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Ergebnis-Karten ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map(({ code, result }, idx) => {
          const country = COUNTRIES.find((c) => c.code === code)!;
          const vsDE = result.monthlyNet - deResult.monthlyNet;
          const isBest = idx === 0;
          const isDE = code === 'DE';

          return (
            <div
              key={code}
              className={`bg-surface-card border p-5 relative transition-colors ${
                isBest && !isDE
                  ? 'border-brand-gold/60'
                  : 'border-border-subtle'
              }`}
            >
              {isBest && !isDE && (
                <div className="absolute -top-px left-0 right-0 h-px bg-brand-gold" />
              )}

              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-2xl">{country.flag}</span>
                  <div className="font-sans text-xs text-text-muted mt-0.5">{country.system}</div>
                </div>
                {isBest && !isDE && (
                  <span className="text-[10px] font-sans font-bold tracking-[0.12em] uppercase bg-brand-gold/15 text-brand-gold px-2 py-0.5">
                    Höchstes Netto
                  </span>
                )}
              </div>

              {/* Netto */}
              <div className="mb-4">
                <div className="text-[10px] font-sans font-bold tracking-[0.12em] uppercase text-text-muted mb-0.5">
                  Netto / Monat
                </div>
                <div className="font-serif text-3xl font-bold text-text-primary">
                  {eur(result.monthlyNet)}
                </div>
                {!isDE && (
                  <div className={`text-sm font-sans font-bold mt-1 ${vsDE > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {vsDE > 0 ? '+' : ''}{eur(vsDE)} vs. DE
                  </div>
                )}
              </div>

              {/* Abzüge-Tabelle */}
              <div className="space-y-1.5 border-t border-border-subtle pt-4 mb-4">
                {[
                  { label: 'Brutto', val: result.monthlyGross, bold: false },
                  { label: 'Krankenversicherung', val: -result.deductions.healthInsurance, bold: false },
                  { label: 'Einkommensteuer', val: -result.deductions.incomeTax, bold: false },
                  { label: 'Tech-Stack', val: -result.deductions.techStack, bold: false },
                  { label: 'Kammer/Register', val: -result.deductions.chamber, bold: false },
                  { label: 'Netto', val: result.monthlyNet, bold: true },
                ].map(({ label, val, bold }) => (
                  <div key={label} className={`flex justify-between text-xs font-sans ${bold ? 'font-bold text-text-primary border-t border-border-subtle pt-1.5 mt-1.5' : 'text-text-secondary'}`}>
                    <span>{label}</span>
                    <span className={val < 0 ? 'text-red-400/80' : ''}>{val < 0 ? `-${eur(-val)}` : eur(val)}</span>
                  </div>
                ))}
              </div>

              {/* Abgabenquote */}
              <div className="flex items-center justify-between text-xs font-sans text-text-muted mb-3">
                <span>Effektive Abgabenquote</span>
                <span className="font-bold text-text-secondary">{pct(result.effectiveRate)}</span>
              </div>

              {/* Abgabenquote Bar */}
              <div className="h-1.5 bg-surface-base rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-brand-gold rounded-full transition-[width] duration-500"
                  style={{ width: `${Math.round(result.effectiveRate * 100)}%` }}
                />
              </div>

              {/* Rechtliche Hinweise Toggle */}
              <button
                onClick={() => setShowNotes(showNotes === code ? null : code)}
                className="flex items-center gap-1.5 text-[11px] font-sans text-text-muted hover:text-brand-gold transition-colors"
              >
                <Info size={12} />
                Annahmen & Rechtsgrundlagen
                <ChevronDown size={11} className={`transition-transform ${showNotes === code ? 'rotate-180' : ''}`} />
              </button>
              {showNotes === code && (
                <ul className="mt-3 space-y-1">
                  {result.notes.map((note, i) => (
                    <li key={i} className="text-[11px] font-sans text-text-muted leading-relaxed">
                      · {note}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Jahres-Zusammenfassung ───────────────────────────────────────────── */}
      <div className="bg-surface-dark border border-border-subtle p-6">
        <h3 className="font-serif text-lg font-bold text-text-light mb-5">Jahresübersicht</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-sans">
            <thead>
              <tr className="text-[10px] font-bold tracking-[0.12em] uppercase text-text-muted border-b border-border-subtle">
                <th className="text-left pb-3">Land</th>
                <th className="text-right pb-3">Brutto / Jahr</th>
                <th className="text-right pb-3">Abzüge / Jahr</th>
                <th className="text-right pb-3">Netto / Jahr</th>
                <th className="text-right pb-3">Quote</th>
              </tr>
            </thead>
            <tbody>
              {results.map(({ code, result }) => {
                const country = COUNTRIES.find((c) => c.code === code)!;
                return (
                  <tr key={code} className="border-b border-border-subtle/40 last:border-0">
                    <td className="py-2.5 text-text-light/80">{country.flag} {country.name}</td>
                    <td className="text-right py-2.5 text-text-light/80">{eur(result.monthlyGross * 12)}</td>
                    <td className="text-right py-2.5 text-red-400/80">−{eur(result.totalDeductions * 12)}</td>
                    <td className="text-right py-2.5 font-bold text-brand-gold">{eur(result.monthlyNet * 12)}</td>
                    <td className="text-right py-2.5 text-text-muted">{pct(result.effectiveRate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-5 text-[11px] font-sans text-text-muted leading-relaxed">
          ⚠️ Diese Berechnung ist eine vereinfachte Entscheidungshilfe — keine Steuerberatung.
          Individuelle Situation, Betriebsausgaben und steuerliche Sonderregeln können das
          Ergebnis erheblich verändern. Konsultieren Sie immer einen Steuerberater.
        </p>
      </div>

    </div>
  );
}
