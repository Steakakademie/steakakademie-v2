'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { trackEvent } from '@/components/analytics/PlausibleScript';

/**
 * Link eines Angebots-Hinweises mit Klick-Messung (Plausible, ohne Cookies).
 * Ereignis `Angebot_Klick` mit Angebot, Stelle und Seitentyp — ohne diese Zahl
 * ist nicht zu erkennen, welcher Satz an welcher Stelle trägt (Regel 10).
 *
 * Nur der Link ist ein Client-Baustein; Auswahl und Texte bleiben auf dem Server.
 */
export default function AngebotLink({
  href, angebot, stelle, seite, className, children,
}: {
  href: string;
  angebot: string;
  stelle: 'text' | 'regal';
  seite: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => trackEvent('Angebot_Klick', { angebot, stelle, seite })}
    >
      {children}
    </Link>
  );
}
