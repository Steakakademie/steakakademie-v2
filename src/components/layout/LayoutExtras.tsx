'use client';

import dynamic from 'next/dynamic';
import DeferredMount from './DeferredMount';
import { istTuwasHost } from '@/lib/marken-host';

// Beide Widgets sind rein clientseitig und erst nach einer Nutzeraktion sichtbar.
// next/dynamic legt sie in eigene Chunks; DeferredMount lädt diese Chunks erst
// nach dem ersten Paint (Idle) oder bei der ersten Interaktion. Vorher hingen
// ai/react, das Chat-Panel und das Newsletter-Formular am kritischen Pfad
// jeder einzelnen Seite (Perf-Audit 02.09.2026).
const MarcoWidget = dynamic(() => import('@/components/ai/MarcoWidget'), { ssr: false });
const ExitIntent = dynamic(() => import('@/components/ui/ExitIntent'), { ssr: false });

// Auf tuwasduwillst.de (eigene Marke) kein Steakakademie-Chat und kein Newsletter-Popup.
// DeferredMount rendert erst im Browser — die Host-Pruefung laeuft also nie auf dem Server.
function NurSteakakademie({ children }: { children: React.ReactNode }) {
  return istTuwasHost() ? null : <>{children}</>;
}

export default function LayoutExtras() {
  return (
    <DeferredMount>
      <NurSteakakademie>
        <MarcoWidget />
        <ExitIntent />
      </NurSteakakademie>
    </DeferredMount>
  );
}
