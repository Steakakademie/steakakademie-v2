import type { ReactNode } from 'react';
import { Flame, Wine, ExternalLink } from 'lucide-react';

interface BBQPairingProps {
  meatType: string;
  whiskeyName?: string | null;
  whiskeyProfile?: string | null;
  affiliateLinkWhiskey?: string | null;
  wineName?: string | null;
  wineProfile?: string | null;
  affiliateLinkWine?: string | null;
  whiskeyType?: string | null;
  wineType?: string | null;
}

// Platzhalter, die im Frontmatter fuer „gibt es nicht“ stehen (03.10.2026).
// Zwei Rezepte tragen `whiskeyName/Type/Profile/Link: Leer`. Weil das kein
// leerer Text ist, stand „Leer“ als Karte mit totem Knopf (`href="Leer"`) auf
// der Seite. Die Komponente entscheidet deshalb selbst, was ein Wert ist.
const PLATZHALTER = new Set(['leer', '-', '–', '—', 'n/a', 'keine']);

/** Getrimmter Wert — oder `null`, wenn er leer oder ein Platzhalter ist. */
export function pairingWert(wert: unknown): string | null {
  if (typeof wert !== 'string') return null;
  const text = wert.trim();
  if (text === '' || PLATZHALTER.has(text.toLowerCase())) return null;
  return text;
}

/** Ein Link gilt nur, wenn er mit `https://` beginnt — alles andere ist tot. */
export function pairingLink(wert: unknown): string | null {
  const link = pairingWert(wert);
  return link && link.startsWith('https://') ? link : null;
}

function PairingKarte({
  icon,
  rubrik,
  typ,
  name,
  profil,
  link,
}: {
  icon: ReactNode;
  rubrik: string;
  typ: string | null;
  name: string;
  profil: string | null;
  link: string | null;
}) {
  return (
    <div className="p-6 flex flex-col">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-[10px] font-sans font-bold tracking-[0.15em] uppercase text-brand-gold">
            {rubrik}
          </span>
        </div>
        {/* Werbekennzeichnung (03.10.2026): Die Links sind Amazon-Suchlinks mit
            Partner-Tag. „Anzeige“ muss lesbar an der Karte stehen, VOR dem
            Klick — die Sternchen-Fusszeile allein reicht nicht (CLAUDE.md §2
            Regel 1). Gestaltung wie in affiliate/ProductCard.tsx. Ohne Link
            keine Werbung, also auch kein Etikett. */}
        {link && (
          <span className="text-[9px] font-sans font-bold tracking-[0.15em] uppercase text-text-muted shrink-0">
            Anzeige
          </span>
        )}
      </div>

      {typ && (
        <span className="text-[10px] font-sans font-bold tracking-[0.12em] uppercase text-text-muted mb-1">
          {typ}
        </span>
      )}
      <h3 className="font-serif text-lg font-bold text-text-primary mb-3 leading-snug">
        {name}
      </h3>
      {profil && (
        <p className="font-body text-sm text-text-secondary leading-relaxed mb-6 flex-1">
          {profil}
        </p>
      )}

      {link && (
        <a
          href={link}
          className="btn-affiliate w-full justify-center mt-auto"
          rel="sponsored nofollow noopener noreferrer"
          target="_blank"
        >
          <ExternalLink size={14} />
          Jetzt ansehen
        </a>
      )}
    </div>
  );
}

export default function BBQPairing({
  meatType,
  whiskeyName,
  whiskeyProfile,
  affiliateLinkWhiskey,
  wineName,
  wineProfile,
  affiliateLinkWine,
  whiskeyType = 'Bourbon',
  wineType = 'Rotwein',
}: BBQPairingProps) {
  const spirituose = pairingWert(whiskeyName);
  const wein = pairingWert(wineName);
  // Eine Karte ohne Namen wird nicht gerendert; ohne jede Karte gibt es
  // keinen Pairing-Block.
  if (!spirituose && !wein) return null;

  const linkSpirituose = spirituose ? pairingLink(affiliateLinkWhiskey) : null;
  const linkWein = wein ? pairingLink(affiliateLinkWine) : null;
  const beideKarten = Boolean(spirituose && wein);

  return (
    <aside
      className="my-10 not-prose bg-surface-elevated border border-brand-fire/30 overflow-hidden"
      aria-label={`Getränk-Pairing für ${meatType}`}
    >
      {/* Glut-orange top accent + header */}
      <div className="border-t-2 border-brand-fire px-6 pt-5 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Flame size={11} className="text-brand-fire" />
          <span className="text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire">
            Steakakademie · Pairing-Empfehlung
          </span>
        </div>
        <p className="font-serif text-base font-bold text-text-light leading-snug">
          Das perfekte Getränk zum {meatType}
        </p>
      </div>

      <div className="border-t border-border-subtle" />

      {/* Zwei Spalten nur, wenn es zwei Karten gibt */}
      <div
        className={
          beideKarten
            ? 'grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border-subtle'
            : 'grid grid-cols-1'
        }
      >
        {spirituose && (
          <PairingKarte
            icon={<Flame size={13} className="text-brand-gold shrink-0" />}
            rubrik="Der Spirituosen-Tipp"
            typ={pairingWert(whiskeyType)}
            name={spirituose}
            profil={pairingWert(whiskeyProfile)}
            link={linkSpirituose}
          />
        )}
        {wein && (
          <PairingKarte
            icon={<Wine size={13} className="text-brand-gold shrink-0" />}
            rubrik="Die Wein-Empfehlung"
            typ={pairingWert(wineType)}
            name={wein}
            profil={pairingWert(wineProfile)}
            link={linkWein}
          />
        )}
      </div>

      {/* Affiliate disclosure — nur, wenn tatsaechlich ein Link gerendert wird */}
      {(linkSpirituose || linkWein) && (
        <div className="border-t border-border-subtle px-6 py-3">
          <p className="text-[10px] font-sans text-text-muted text-center">
            * Affiliate-Links — Preis für dich unverändert · Offenlegungspflicht gemäß §5a UWG
          </p>
        </div>
      )}
    </aside>
  );
}
