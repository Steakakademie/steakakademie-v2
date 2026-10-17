import { allDiplomLektions } from 'contentlayer/generated';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import RoadmapClient, { type LektionenByStufe, type LektionLink } from './RoadmapClient';
import { diplomZugang } from '@/lib/diplome/zugang';
import { redirect } from 'next/navigation';
import { geraeteZiel } from '@/lib/auth/geraete-limit';

// Login-/Diplomstatus wird serverseitig ermittelt → die Route ist dynamisch.
// Der Client nutzt beides nur fuer Hinweise und das Sperrbild der Bezahl-
// Pruefungen; verbindlich prueft /api/diplome/pruefung bei jedem Versuch.
export const dynamic = 'force-dynamic';

// Server Component: contentlayer bleibt hier (Build-Zeit, kein Client-Bundle).
// Der Client bekommt nur den serialisierbaren Ausschnitt, den er wirklich rendert.
function lektionenNachStufe(): LektionenByStufe {
  const byStufe: Record<number, LektionLink[]> = {};
  for (const l of allDiplomLektions) {
    (byStufe[l.stufe] ??= []).push({
      lektionSlug: l.lektionSlug,
      title: l.title,
      order: l.order,
      url: l.url,
    });
  }
  for (const list of Object.values(byStufe)) list.sort((a, b) => a.order - b.order);
  return byStufe;
}

export default async function DiplomeRoadmapPage() {
  const lektionen = lektionenNachStufe();
  const zugang = await diplomZugang();
  if (zugang.geraeteLimit) redirect(geraeteZiel('/diplome/roadmap'));
  return (
    <>
      <Header />
      <RoadmapClient lektionen={lektionen} eingeloggt={zugang.userId !== null} hatDiplom={zugang.zugang} />
      <Footer />
    </>
  );
}
