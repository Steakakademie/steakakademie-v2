import type { ReactNode } from 'react';
import { Zap, AlertTriangle, Lightbulb, Thermometer, HelpCircle, Hand } from 'lucide-react';

/**
 * Wiederverwendbare MDX-Callouts gegen „Textwüsten".
 * In MDX: <Schnelluebersicht>…</Schnelluebersicht>, <Achtung>…</Achtung>,
 * <ProTipp>…</ProTipp>, <TempBox>…</TempBox>, <Leitfrage>…</Leitfrage>,
 * <Handgriff>…</Handgriff>
 *
 * Leitfrage und Handgriff (08.09.2026, Rahmenlehrplan §2.2): Die sieben
 * Kurs-Produktionsbuecher beginnen jede Einheit mit einer Frage an die
 * Teilnehmer und lassen bei jedem wichtigen Schritt alle selbst Hand anlegen.
 * Online heisst das: eine Frage am Anfang, eine Aufgabe am eigenen Grill mit
 * Selbstkontrolle am Ende. Nie reiner Fliesstext.
 */

function Box({
  icon, label, accent, children,
}: { icon: ReactNode; label: string; accent: string; children: ReactNode }) {
  return (
    <aside
      className="not-prose my-7 border-l-[3px] pl-5 pr-5 py-4 rounded-r-sm"
      style={{ borderLeftColor: accent, background: `${accent}0F` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color: accent }} className="shrink-0">{icon}</span>
        <span className="font-sans text-[11px] font-bold tracking-[0.14em] uppercase" style={{ color: accent }}>
          {label}
        </span>
      </div>
      <div
        className="callout-body font-body text-[0.95rem] leading-relaxed [&>p]:mb-2 [&>p:last-child]:mb-0 [&_ul]:mt-1 [&_ul]:ml-4 [&_ul]:list-disc [&_li]:mb-0.5"
        style={{ color: 'var(--callout-text)' }}
      >
        {children}
      </div>
    </aside>
  );
}

export function Schnelluebersicht({ children }: { children: ReactNode }) {
  return <Box icon={<Zap size={15} />} label="Schnell-Überblick" accent="#C8882A">{children}</Box>;
}

export function Achtung({ children }: { children: ReactNode }) {
  return <Box icon={<AlertTriangle size={15} />} label="Häufiger Fehler" accent="#E85018">{children}</Box>;
}

export function ProTipp({ children }: { children: ReactNode }) {
  return <Box icon={<Lightbulb size={15} />} label="Profi-Tipp" accent="#C8882A">{children}</Box>;
}

export function TempBox({ children }: { children: ReactNode }) {
  return <Box icon={<Thermometer size={15} />} label="Kerntemperatur" accent="#C8882A">{children}</Box>;
}

/** Eroeffnet eine Lektion: die Frage, die der Lernende am Ende selbst beantworten kann. */
export function Leitfrage({ children }: { children: ReactNode }) {
  return <Box icon={<HelpCircle size={15} />} label="Leitfrage" accent="#C8882A">{children}</Box>;
}

/** Aufgabe am eigenen Grill, mit Selbstkontrolle — der Teil, den kein Text ersetzt. */
export function Handgriff({ children }: { children: ReactNode }) {
  return <Box icon={<Hand size={15} />} label="Handgriff — jetzt am Grill" accent="#E85018">{children}</Box>;
}
