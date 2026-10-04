'use client';

import { ChevronDown } from 'lucide-react';

// ─── Shared base classes ───────────────────────────────────────────────────────
// The label floats on the top border line; its background MUST match the
// surrounding page/panel background — default: surface-base (#17100B).
// Pass bgClass to override when used inside surface-elevated panels.

const FIELD_BASE =
  'peer w-full bg-transparent px-4 py-3.5 text-sm font-body text-text-primary ' +
  'border transition-colors duration-150 ';

const FIELD_NORMAL  = 'border-border-subtle hover:border-text-muted/60 focus:border-brand-gold focus:ring-0';
const FIELD_ERROR   = 'border-brand-fire hover:border-brand-fire focus:border-brand-fire';

const LABEL_BASE =
  'pointer-events-none absolute -top-2.5 left-3 px-1.5 ' +
  'text-[10px] font-sans font-bold tracking-[0.14em] uppercase ' +
  'transition-colors duration-150 ';

const LABEL_NORMAL = 'text-text-muted peer-focus:text-brand-gold';
const LABEL_ERROR  = 'text-brand-fire';

const ERROR_MSG  = 'mt-1.5 text-xs font-sans text-brand-fire leading-snug';
const HINT_MSG   = 'mt-1.5 text-xs font-sans text-text-muted leading-snug';

// ─── FloatingLabelInput ────────────────────────────────────────────────────────

export interface FloatingLabelInputProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  autoComplete?: string;
  readOnly?: boolean;
  /** Tailwind bg class for the label — must match surrounding panel bg */
  bgClass?: string;
}

export function FloatingLabelInput({
  id, label, type = 'text', value, onChange,
  placeholder, error, hint, autoComplete, readOnly,
  bgClass = 'bg-surface-base',
}: FloatingLabelInputProps) {
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? ' '}
        autoComplete={autoComplete}
        readOnly={readOnly}
        className={FIELD_BASE + (error ? FIELD_ERROR : FIELD_NORMAL)}
      />
      <label
        htmlFor={id}
        className={LABEL_BASE + (error ? LABEL_ERROR : LABEL_NORMAL) + ' ' + bgClass}
      >
        {label}
      </label>
      {error && <p className={ERROR_MSG}>{error}</p>}
      {hint && !error && <p className={HINT_MSG}>{hint}</p>}
    </div>
  );
}

// ─── FloatingLabelTextarea ─────────────────────────────────────────────────────

export interface FloatingLabelTextareaProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  error?: string;
  hint?: string;
  maxLength?: number;
  bgClass?: string;
}

export function FloatingLabelTextarea({
  id, label, value, onChange,
  placeholder, rows = 3, error, hint, maxLength,
  bgClass = 'bg-surface-base',
}: FloatingLabelTextareaProps) {
  const near = maxLength ? value.length > maxLength * 0.9 : false;

  return (
    <div className="relative">
      <textarea
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? ' '}
        rows={rows}
        maxLength={maxLength}
        className={FIELD_BASE + (error ? FIELD_ERROR : FIELD_NORMAL) + ' resize-none'}
      />
      <label
        htmlFor={id}
        className={LABEL_BASE + (error ? LABEL_ERROR : LABEL_NORMAL) + ' ' + bgClass}
      >
        {label}
      </label>
      {maxLength && (
        <span
          className={
            'absolute bottom-3 right-3.5 text-[10px] font-sans pointer-events-none ' +
            (near ? 'text-brand-fire' : 'text-text-muted')
          }
        >
          {value.length}/{maxLength}
        </span>
      )}
      {error && <p className={ERROR_MSG}>{error}</p>}
      {hint && !error && <p className={HINT_MSG}>{hint}</p>}
    </div>
  );
}

// ─── FloatingLabelSelect ───────────────────────────────────────────────────────

export interface SelectOption { value: string; label: string }

export interface FloatingLabelSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  bgClass?: string;
}

export function FloatingLabelSelect({
  id, label, value, onChange, options,
  placeholder = 'Wählen …', error,
  bgClass = 'bg-surface-base',
}: FloatingLabelSelectProps) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={
          FIELD_BASE.replace('bg-transparent', bgClass) +
          (error ? FIELD_ERROR : FIELD_NORMAL) +
          ' appearance-none cursor-pointer pr-10'
        }
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <label
        htmlFor={id}
        className={LABEL_BASE + (error ? LABEL_ERROR : LABEL_NORMAL) + ' ' + bgClass}
      >
        {label}
      </label>
      <ChevronDown
        size={13}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-text-muted"
      />
      {error && <p className={ERROR_MSG}>{error}</p>}
    </div>
  );
}
