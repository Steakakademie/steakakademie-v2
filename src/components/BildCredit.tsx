import Link from 'next/link';
import { Sparkles } from 'lucide-react';

/**
 * Bildnachweis und KI-Kennzeichnung fuer Hero-Bilder.
 *
 * Zwei rechtlich verschiedene Dinge, die nur zufaellig am selben Ort stehen:
 *
 *  1. ATTRIBUTION ist eine Lizenzbedingung. Bei Magnific/Freepik-Free ist die
 *     Namensnennung Voraussetzung der Nutzung — fehlt sie, ist das Bild
 *     unlizenziert genutzt. Sie muss deshalb sichtbar sein, nicht nur im
 *     Manifest. Pexels, Unsplash, Pixabay und Burst verlangen sie nicht;
 *     dort waere eine Credit-Zeile blosse Dekoration.
 *
 *  2. KI-KENNZEICHNUNG ist eine Transparenzpflicht (EU AI Act Art. 50 Abs. 4,
 *     verbindlich seit 02.08.2026) und haengt nicht an der Lizenz, sondern
 *     daran, ob der Inhalt erzeugt oder wesentlich veraendert wurde. Reine
 *     Farb- und Tonwertkorrektur loest sie nicht aus.
 *
 * Die Komponente rendert nur, was tatsaechlich Pflicht ist. Sie liest beides
 * aus dem Frontmatter — geschrieben von scripts/bild-ingest.mjs, das die
 * Herkunft im Format `Quelle · ID … · Autor · URL · Attribution pflichtig`
 * ablegt. Fehlt der Marker, gibt es keine Credit-Zeile.
 */

interface BildCreditProps {
  /** Frontmatter-Feld imageSource. */
  source?: string;
  /** Frontmatter-Feld imageAI. */
  ai?: boolean;
  /** 'hero' = Badge ueber dem Bild, 'inline' = Zeile darunter. */
  variant?: 'hero' | 'inline';
}

const ATTRIBUTIONS_MARKER = 'Attribution pflichtig';

/** Zerlegt den imageSource-String. Toleriert Altbestand ohne Trennzeichen. */
function parseSource(source?: string) {
  if (!source) return null;
  const pflichtig = source.includes(ATTRIBUTIONS_MARKER);
  if (!pflichtig) return null;

  const teile = source.split('·').map((t) => t.trim());
  const quelle = teile[0] || 'Magnific';
  const autor = teile.find((t) => !/^ID\s|^https?:|^Attribution/.test(t) && t !== quelle);
  const url = teile.find((t) => /^https?:/.test(t));

  return { quelle, autor, url };
}

export default function BildCredit({ source, ai = false, variant = 'hero' }: BildCreditProps) {
  const credit = parseSource(source);
  if (!credit && !ai) return null;

  if (variant === 'inline') {
    return (
      <p className="mt-2 text-[11px] font-sans text-text-muted">
        {credit && (
          <>
            designed by {credit.autor ?? 'unbekannt'}{' '}
            <a
              href={credit.url ?? 'https://www.magnific.com'}
              rel="nofollow noopener"
              target="_blank"
              className="underline underline-offset-2 hover:text-brand-gold transition-colors"
            >
              {credit.quelle}
            </a>
          </>
        )}
        {credit && ai && ' · '}
        {ai && (
          <Link href="/ki-disclaimer" className="underline underline-offset-2 hover:text-brand-gold transition-colors">
            KI-generiertes Symbolbild
          </Link>
        )}
      </p>
    );
  }

  // Hero-Variante: gleiche Optik wie das Rezept-Badge in RecipeTemplate.tsx,
  // damit die Kennzeichnung ueberall identisch aussieht und wiedererkannt wird.
  return (
    <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2">
      {credit && (
        <a
          href={credit.url ?? 'https://www.magnific.com'}
          rel="nofollow noopener"
          target="_blank"
          className="inline-flex items-center text-[10px] font-sans tracking-[0.06em] px-2 py-1 bg-black/65 backdrop-blur-sm border border-white/15 text-zinc-300 hover:text-white hover:border-white/30 transition-colors"
        >
          designed by {credit.autor ?? 'unbekannt'} — {credit.quelle}
        </a>
      )}
      {ai && (
        <Link
          href="/ki-disclaimer"
          className="inline-flex items-center gap-1.5 text-[10px] font-sans font-bold tracking-[0.1em] uppercase px-2 py-1 bg-black/65 backdrop-blur-sm border border-white/15 text-zinc-200 hover:text-white hover:border-white/30 transition-colors"
        >
          <Sparkles size={10} /> KI-Symbolbild
        </Link>
      )}
    </div>
  );
}
