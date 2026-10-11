'use client';

import { useEffect, useState } from 'react';
import AktionsTeaserKarten from './AktionsTeaserKarten';
import { AKTIONEN_NAV } from '@/lib/aktionen/nav';
import { liesVorschau, mitVorschau } from '@/lib/aktionen/vorschau';

/**
 * Vorschau des Aktions-Teasers außerhalb des Saisonfensters (Uwe, 11.10.2026).
 * Rendert auf dem Server nichts; nach dem Hydrieren prüft er den Schalter
 * (`?vorschau=1` bzw. Sitzung, src/lib/aktionen/vorschau.ts) und zeigt dann ALLE
 * Aktionsseiten aus nav.ts — mit Hinweisleiste und Links samt `?vorschau=1`.
 */
export default function AktionsTeaserVorschau() {
  const [an, setAn] = useState(false);
  useEffect(() => {
    setAn(liesVorschau(window.location.search));
  }, []);
  if (!an) return null;
  return (
    <AktionsTeaserKarten
      vorschau
      eintraege={AKTIONEN_NAV.map((a) => ({ slug: a.slug, href: mitVorschau(a.url), titel: a.titel, untertitel: a.untertitel }))}
    />
  );
}
