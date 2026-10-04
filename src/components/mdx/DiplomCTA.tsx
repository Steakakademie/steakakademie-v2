import Link from 'next/link';
import { ChevronRight, GraduationCap } from 'lucide-react';
import { allDiplomLektions } from 'contentlayer/generated';
import { LEVELS, stufeByNr } from '@/lib/diplome/stufen';

// ─────────────────────────────────────────────────────────────────────────────
// DiplomCTA — Conversion-Block im Fliesstext (MDX)
//
// Aufruf aus content/: <DiplomCTA modul="fleischkunde" headline="…" text="…"
// cta="Modul ansehen" />
//
// WOHIN VERLINKT WIRD (12.09.2026): auf die ERSTE LEKTION des Levels, das zum
// Modul gehoert. Vorher zeigten alle Module auf /diplome — ein Platzhalter aus
// der Zeit, als es die Bezahl-Lektionen noch nicht gab. check-links.mjs hat das
// zu Recht als Mehrfachziel gemeldet: drei Beschriftungen, ein Ziel.
//
// Die Lektionsseite ist fuer Bezahlstufen oeffentlich erreichbar (Anreisser +
// Kaufhinweis + Stufen-Inhaltsverzeichnis, src/app/diplome/lernen/[stufe]/
// [lektion]/page.tsx) — der Nutzer sieht also genau den Inhalt, den der Block
// verspricht, plus den Weg zum Diplom. Eine Stufen-Landingpage gibt es weiterhin
// nicht; der Einsprung ueber die erste Lektion ist dasselbe Muster wie
// „Lektionen lesen" in DiplomeClient.
//
// Die Lektion wird zur Bauzeit aus contentlayer ermittelt, nicht von Hand
// eingetragen: Wird eine Lektion umbenannt oder umsortiert, folgt der Link.
// Level-Name und Stufe kommen aus src/lib/diplome/stufen.ts, der einen Quelle —
// die alten Labels hatten Level (3, 4) mit Stufe verwechselt („Stufe 3 ·
// Onglet-Kenner"), tatsaechlich liegen beide Level in Stufe 2.
//
// Unbekanntes `modul` oder ein Level ohne Lektionen faellt auf /diplome — ein
// Tippfehler im Frontmatter soll den Block nicht verschwinden lassen, sondern
// ihn nur unspezifischer machen. Ein toter Link entsteht so nie.
// ─────────────────────────────────────────────────────────────────────────────

/** Modul-Schluessel → Level (src/lib/diplome/stufen.ts) und Themen-Zusatz im Label. */
const MODULE: Record<string, { level: number; thema: string }> = {
  fleischkunde: { level: 3, thema: 'Cuts & Anatomie' },
  reifung: { level: 4, thema: 'Reifung & Lagerung' },
};

const FALLBACK = { label: 'Grillmeister-Diplom', href: '/diplome' } as const;

/** Erste Lektion (niedrigste `order`) eines Levels, oder null. */
function ersteLektion(level: number) {
  return (
    allDiplomLektions
      .filter((l) => l.level === level)
      .sort((a, b) => a.order - b.order)[0] ?? null
  );
}

function zielFuer(modul?: string): { label: string; href: string } {
  const m = modul ? MODULE[modul] : undefined;
  if (!m) return FALLBACK;
  const level = LEVELS.find((l) => l.id === m.level);
  const lektion = ersteLektion(m.level);
  if (!level || !lektion) return FALLBACK;
  // Stufe aus der Level-Zuordnung, nie aus dem Modul-Schluessel geraten.
  const stufeNr = stufeByNr(level.stufe)?.nr ?? level.stufe;
  return {
    label: `Stufe ${stufeNr} · Level ${level.id} · ${level.name} — ${m.thema}`,
    href: lektion.url,
  };
}

interface DiplomCTAProps {
  /** Schluessel aus MODULE. Unbekannte Werte landen auf der Uebersicht. */
  modul?: string;
  headline: string;
  text: string;
  /** Beschriftung des Buttons. */
  cta?: string;
}

export function DiplomCTA({ modul, headline, text, cta = 'Zum Diplom' }: DiplomCTAProps) {
  const ziel = zielFuer(modul);

  return (
    <aside
      className="my-12 p-7"
      style={{
        background:
          'linear-gradient(135deg, rgba(232,80,24,0.10) 0%, rgba(200,136,42,0.06) 55%, transparent 100%)',
        border: '1px solid rgba(232,80,24,0.32)',
      }}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <GraduationCap size={18} className="text-brand-fire shrink-0" />
        <span className="font-sans text-[11px] font-bold tracking-[0.14em] uppercase text-brand-fire">
          {ziel.label}
        </span>
      </div>

      <p className="font-serif text-xl sm:text-2xl font-bold text-text-light leading-snug mb-3">
        {headline}
      </p>
      <p className="font-body text-[1.0625rem] leading-[1.75] text-text-light/75 mb-6">{text}</p>

      <Link
        href={ziel.href}
        className="inline-flex items-center gap-2 px-5 py-3 font-sans text-sm font-bold text-ink transition-opacity hover:opacity-85"
        style={{ backgroundColor: '#E85018' }}
      >
        {cta}
        <ChevronRight size={16} />
      </Link>
    </aside>
  );
}

export default DiplomCTA;
