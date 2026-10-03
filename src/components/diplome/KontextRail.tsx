import Link from 'next/link';
import { Wrench, Lightbulb, ChevronRight } from 'lucide-react';

// Kontext-Rail gegen tote Seitenränder: EIN passender Werkzeug-Tipp (themen-
// abhängig, Link auf die interne Vergleichsseite) + „Mehr Wissen"-Links.
// Bewusst kein Banner; native, nutzwertig.
// 03.10.2026: Die Ziele sind Marktübersichten nach Herstellerangaben, kein
// Gerätetest — Linktext und Fußzeile sagen das (src/lib/vergleich-seite.ts).

type Tool = { label: string; href: string; why: string };

const DEFAULT_TOOL: Tool = {
  label: 'Fleischthermometer',
  href: '/vergleich/premium-fleischthermometer',
  why: 'Die wichtigste Investition — macht aus jedem Grill ein präzises Werkzeug.',
};

// Themen-Erkennung über Titel/Slug-Stichwörter
function toolFor(text: string): Tool {
  const t = text.toLowerCase();
  if (/(thermomet|kerntemperat|temperatur|garstuf|gargrad)/.test(t)) return DEFAULT_TOOL;
  if (/(reverse|sear|kruste|maillard|hitzekontroll|searing)/.test(t))
    return { label: 'Oberhitzegrill', href: '/vergleich/oberhitzegrill-vergleich', why: 'Für die perfekte Kruste bei 800 °C Oberhitze.' };
  if (/(aging|reifung|dry-ag|dry ag|lagern|lagerung|reif)/.test(t))
    return { label: 'Dry-Ager', href: '/vergleich/dry-aging-kuehlschrank-vergleich', why: 'Kontrollierte Fleischreifung zuhause.' };
  return DEFAULT_TOOL;
}

const WISSEN = [
  { label: 'Kerntemperatur-Guide', href: '/temperatur-guide' },
  { label: 'Alle Grilltechniken', href: '/methoden' },
  { label: 'Cuts & Fleischkunde', href: '/cuts' },
];

export default function KontextRail({ text, color }: { text: string; color: string }) {
  const tool = toolFor(text);
  const wissen = WISSEN.filter((w) => !text.toLowerCase().includes(w.label.toLowerCase().split('-')[0]));

  return (
    <div className="mt-5 space-y-5">
      {/* Werkzeug-Tipp */}
      <div className="bg-surface-elevated border border-border-subtle p-5 transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-brand-gold/30">
        <div className="flex items-center gap-2 mb-2">
          <Wrench size={14} style={{ color }} />
          <span className="font-sans text-[11px] font-bold tracking-[0.14em] uppercase" style={{ color }}>
            Passendes Werkzeug
          </span>
        </div>
        <Link href={tool.href} className="group block">
          <span className="font-serif text-base font-bold text-text-primary group-hover:text-brand-fire transition-colors">
            {tool.label}
          </span>
          <span className="block text-[13px] font-body text-text-secondary leading-snug mt-1">{tool.why}</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-sans font-bold uppercase tracking-wider mt-2" style={{ color }}>
            Zum Vergleich <ChevronRight size={12} />
          </span>
        </Link>
        <p className="text-[10px] font-sans text-text-muted mt-3 leading-snug">
          Marktübersicht nach Herstellerangaben — kein eigener Gerätetest.
        </p>
      </div>

      {/* Mehr Wissen */}
      <div className="bg-surface-elevated border border-border-subtle p-5 transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-brand-gold/30">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={14} style={{ color }} />
          <span className="font-sans text-[11px] font-bold tracking-[0.14em] uppercase" style={{ color }}>
            Mehr Wissen
          </span>
        </div>
        <ul className="space-y-1.5">
          {wissen.map((w) => (
            <li key={w.href}>
              <Link
                href={w.href}
                className="flex items-center justify-between text-sm font-sans text-text-secondary hover:text-brand-fire transition-colors group py-1 border-b border-border-subtle/50 last:border-0"
              >
                {w.label}
                <ChevronRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color }} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
