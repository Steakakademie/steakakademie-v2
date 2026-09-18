import type { Metadata } from 'next';
import { allDiplomLektions } from 'contentlayer/generated';
import DiplomeClient, { type LektionLink } from './DiplomeClient';
import { getPlattformPuls } from '@/lib/plattform-puls';
import { courseSchema, breadcrumbSchema } from '@/lib/schema';

// Server Component: contentlayer bleibt hier (Build-Zeit, kein Client-Bundle).
// Der Client bekommt nur den serialisierbaren Ausschnitt, den er rendert —
// dasselbe Muster wie in /diplome/roadmap.
//
// Warum ueberhaupt: Stufe 1 ist fertig und oeffentlich (isPaidTier = stufe >= 2
// in der Lektionsseite), war von dieser Seite aus aber nur ueber Roadmap →
// Stufe anklicken → Tab „Lerninhalte" erreichbar — vier Schritte tief, waehrend
// die Seite darueber „in Vorbereitung" behauptete.
function stufeEinsLektionen(): LektionLink[] {
  return allDiplomLektions
    .filter((l) => l.stufe === 1)
    .map((l) => ({
      lektionSlug: l.lektionSlug,
      title: l.title,
      order: l.order,
      level: l.level,
      url: l.url,
    }))
    .sort((a, b) => a.order - b.order);
}

export const metadata: Metadata = {
  title: 'Grillmeister-Diplom: 10 Level BBQ-Ausbildung',
  description: 'Das strukturierte BBQ-Diplom-System auf Deutsch: 10 Level von Bronze bis Grillmeister. Lerne systematisch, schalte Level frei, erhalte echte Urkunden per Post.',
  alternates: { canonical: 'https://steakakademie.de/diplome' },
  openGraph: {
    title: 'Grillmeister-Diplom: 10 Level BBQ-Ausbildung',
    description: 'Systematisch zum Grillmeister: 10 Level, echte Urkunden, klare Progression.',
    url: 'https://steakakademie.de/diplome',
    images: [{ url: '/api/og', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image', creator: '@steakakademie' },
};

export default function DiplomePage() {
  // Schema.org — Course (ohne Offer: Kursinhalt in Vorbereitung) + Breadcrumb
  const courseSch = courseSchema({
    name: 'Grillmeister-Ausbildung',
    // „Das einzige" entfernt (08.09.2026): Spitzenstellungsbehauptung, die wir nicht
    // beweisen koennen — § 5 UWG. Die Websuche vom selben Tag fand Online-Grillkurse
    // vor uns; ob es kein vergleichbares Stufen-Diplom gibt, ist ungeprueft.
    description:
      'Das strukturierte BBQ-Diplom-System auf Deutsch: 10 Level von Bronze bis Grillmeister. Lerne systematisch, schalte Level frei, erhalte echte Urkunden per Post.',
    url: '/diplome',
  });
  const breadcrumbSch = breadcrumbSchema([{ name: 'Diplome', url: '/diplome' }]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSch) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSch) }}
      />
      <DiplomeClient puls={getPlattformPuls()} stufe1={stufeEinsLektionen()} />
    </>
  );
}
