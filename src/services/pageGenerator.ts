/**
 * AuthorityOS — NL Programmatic SEO Page Generator
 * ===================================================================
 * Nimmt einen Nischen-Slug und gibt ein vollständiges, strukturiertes
 * NLPageContent-Objekt zurück, das direkt als Datenquelle für eine
 * Next.js-Seite dient.
 *
 * Schleife für alle 60 Seiten:
 *   import niches from '../data/nlNiches.json';
 *   const pages = await Promise.all(niches.map(n => generateNLPage(n.slug)));
 * ===================================================================
 */

import { evaluateNLNiche, type NLEvaluation } from './nlEvaluator';
import type { NLNiche } from './nlEvaluator';
import rawNiches from '../data/nlNiches.json';

const NICHES = rawNiches as NLNiche[];

// ─── Content-Typen ────────────────────────────────────────────────────────────

export interface PageMeta {
  title:       string;
  description: string;
  keywords:    string[];
  canonical:   string;
  ogTitle:     string;
  ogDescription: string;
}

export interface PageHero {
  badge:    string;
  h1:       string;
  subtitle: string;
  ctaLabel: string;
  ctaHref:  string;
}

export type SectionId =
  | 'income-overview'
  | 'tax-breakdown'
  | 'market-validation'
  | 'tax-advantages'
  | 'faq';

export interface PageSection {
  id:      SectionId;
  heading: string;
  lead?:   string;
  items:   PageSectionItem[];
}

export interface PageSectionItem {
  label: string;
  value: string;
  note?: string;
}

export interface FaqItem {
  question: string;
  answer:   string;
}

export interface StructuredDataFAQ {
  '@context': 'https://schema.org';
  '@type':    'FAQPage';
  mainEntity: Array<{
    '@type':          'Question';
    name:             string;
    acceptedAnswer:   { '@type': 'Answer'; text: string };
  }>;
}

export interface NLPageContent {
  slug:          string;
  generatedAt:   string;
  meta:          PageMeta;
  hero:          PageHero;
  highlights:    string[];
  sections:      PageSection[];
  faq:           FaqItem[];
  structuredData: StructuredDataFAQ;
  evaluation:    NLEvaluation;
}

// ─── Formatierung ─────────────────────────────────────────────────────────────

const EUR = (n: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

const PCT = (n: number) => `${(n * 100).toFixed(1)}%`;

// ─── Seiten-Baustein-Builder ──────────────────────────────────────────────────

function buildMeta(ev: NLEvaluation): PageMeta {
  const { niche, tax } = ev;
  const title = `ZZP ${niche.title}: Netto Inkomen & Belastingen (${new Date().getFullYear()})`;
  const description =
    `Als ZZP ${niche.title} in Nederland houd je gemiddeld ${EUR(tax.monthlyNet)} / maand netto over ` +
    `bij ${EUR(niche.averageGrossRevenue)} omzet. Bekijk de volledige belastingberekening, ` +
    `zelfstandigenaftrek en marktvalidatie voor ${niche.targetKeyword}.`;

  return {
    title,
    description,
    keywords: [niche.targetKeyword, ...niche.secondaryKeywords, `zzp belasting ${niche.category}`],
    // Eigene URL (03.10.2026): Hier stand steakakademie.nl. Der Canonical zeigt auf
    // die Adresse, unter der die Seite liegt; sie bleibt noindex (zzp-niche/[slug]/page.tsx).
    canonical: `https://steakakademie.de/zzp-niche/${niche.slug}`,
    ogTitle:   title,
    ogDescription: description,
  };
}

function buildHero(ev: NLEvaluation): PageHero {
  const { niche, tax, viabilityLabel } = ev;
  return {
    badge:    `Markt: ${viabilityLabel} · Score ${ev.marketScore}/100`,
    h1:       `ZZP ${niche.title}: ${EUR(tax.monthlyNet)} netto per maand`,
    subtitle:
      `Bij ${EUR(niche.averageGrossRevenue)} bruto-omzet per maand betaal je als ZZP ${niche.title} ` +
      `slechts ${PCT(tax.effectiveRate)} aan belastingen en premies — ` +
      `inclusief zelfstandigenaftrek en MKB-winstvrijstelling.`,
    ctaLabel: 'Bereken mijn netto inkomen',
    ctaHref:  '/zzp-calculator',
  };
}

function buildIncomeSection(ev: NLEvaluation): PageSection {
  const { niche, tax } = ev;
  return {
    id:      'income-overview',
    heading: `Wat verdient een ZZP ${niche.title} netto?`,
    lead:
      `Een ZZP ${niche.title} verdient in Nederland gemiddeld ${EUR(niche.averageGrossRevenue)} bruto per maand. ` +
      `Na belastingen, zorgverzekering en bedrijfskosten houd je ${EUR(tax.monthlyNet)} over — dat is ` +
      `${EUR(ev.annualNet)} per jaar.`,
    items: [
      { label: 'Bruto-omzet / maand',      value: EUR(niche.averageGrossRevenue) },
      { label: 'Netto inkomen / maand',     value: EUR(tax.monthlyNet),           note: 'Na alle aftrekposten' },
      { label: 'Netto inkomen / jaar',      value: EUR(ev.annualNet) },
      { label: 'Indicatief uurtarief',      value: `${EUR(niche.hourlyRate)} / uur` },
      { label: 'Typische opdrachtgever',    value: niche.typicalClient },
    ],
  };
}

function buildTaxSection(ev: NLEvaluation): PageSection {
  const { tax } = ev;
  return {
    id:      'tax-breakdown',
    heading: 'Volledige belastingberekening als ZZP',
    lead:
      `Onderstaande berekening is gebaseerd op het ZZP-belastingstelsel 2024 (Wet IB 2001, Zvw). ` +
      `Alle relevante aftrekposten zijn meegenomen.`,
    items: [
      { label: 'Bruto-omzet',                  value: EUR(tax.monthlyGross),                   note: 'Per maand' },
      { label: 'Zorgverzekering (incl. IAB)',   value: `- ${EUR(tax.deductions.healthInsurance)}`, note: 'Basispremie + 5,32% inkomensafhankelijk' },
      { label: 'Inkomstenbelasting Box 1',      value: `- ${EUR(tax.deductions.incomeTax)}`,    note: 'Na heffingskortingen' },
      { label: 'Tech-stack & tools',            value: `- ${EUR(tax.deductions.techStack)}`,    note: 'Aftrekbare bedrijfskosten' },
      { label: 'KVK-inschrijving',              value: `- ${EUR(tax.deductions.chamber)}`,      note: 'Jaarkosten, per maand' },
      { label: 'Totale lasten',                 value: `- ${EUR(tax.totalDeductions)}` },
      { label: 'Effectieve belastingdruk',      value: PCT(tax.effectiveRate) },
      { label: '★ Netto cash-in',               value: EUR(tax.monthlyNet),                     note: 'Jouw werkelijke inkomen' },
    ],
  };
}

function buildMarketSection(ev: NLEvaluation): PageSection {
  const { niche, savingsVsDE } = ev;
  const demandLabels: Record<NLNiche['demandLevel'], string> = {
    hoog:      'Hoge marktvraaag — weinig schaarste aan werk',
    gemiddeld: 'Gemiddelde marktvraag — stabiel segment',
    laag:      'Lage marktvraag — specialisatie loont',
  };
  return {
    id:      'market-validation',
    heading: `Is ZZP ${niche.title} een goede keuze?`,
    lead:    `Markscore: ${ev.marketScore}/100 (${ev.viabilityLabel}). ${demandLabels[niche.demandLevel]}.`,
    items: [
      { label: 'Marktvraag',          value: niche.demandLevel.charAt(0).toUpperCase() + niche.demandLevel.slice(1) },
      { label: 'Markscore',           value: `${ev.marketScore} / 100` },
      { label: 'Niche-omschrijving',  value: niche.description },
      ...(savingsVsDE > 0
        ? [{ label: 'Voordeel t.o.v. Duitsland', value: `+ ${EUR(savingsVsDE)} / maand netto`, note: 'ZZP NL vs. freelancer DE bij zelfde omzet' }]
        : []),
    ],
  };
}

function buildTaxAdvantagesSection(ev: NLEvaluation): PageSection {
  const { tax } = ev;
  return {
    id:      'tax-advantages',
    heading: 'Belastingvoordelen als ZZP in Nederland',
    lead:
      `Het Nederlandse ZZP-stelsel kent unieke fiscale voordelen die je effectieve belastingdruk ` +
      `sterk verlagen. Hieronder de voordelen die in deze berekening zijn verwerkt.`,
    items: [
      {
        label: 'Zelfstandigenaftrek',
        value: '€ 3.750 / jaar',
        note:  'Directe aftrek op winst (2024); daalt jaarlijks naar € 900 in 2027',
      },
      {
        label: 'MKB-winstvrijstelling',
        value: '13,31%',
        note:  'Van de resterende winst vrijgesteld van Box 1-belasting',
      },
      {
        label: 'Algemene heffingskorting',
        value: `${EUR(tax.taxableIncome <= 24_813 ? 3_362 : Math.max(0, Math.round(3_362 - ((tax.taxableIncome - 24_813) / (75_520 - 24_813)) * 3_362)))} / jaar`,
        note:  'Directe korting op te betalen belasting',
      },
      {
        label: 'Arbeidskorting',
        value: `t/m € 5.158 / jaar`,
        note:  'Extra korting voor werkenden, inclusief ZZP',
      },
      {
        label: 'Box 1-tarief t/m € 75.518',
        value: '36,97%',
        note:  'Lager dan het gecombineerde DE-tarief bij vergelijkbaar inkomen',
      },
    ],
  };
}

function buildFAQ(ev: NLEvaluation): FaqItem[] {
  const { niche, tax } = ev;
  return [
    {
      question: `Hoeveel verdient een ZZP ${niche.title} netto per maand?`,
      answer:
        `Bij een bruto-omzet van ${EUR(niche.averageGrossRevenue)} per maand houd je als ZZP ${niche.title} ` +
        `gemiddeld ${EUR(tax.monthlyNet)} netto over. Dat is een effectieve belastingdruk van ${PCT(tax.effectiveRate)}.`,
    },
    {
      question: `Wat is de zelfstandigenaftrek voor een ZZP ${niche.title}?`,
      answer:
        `De zelfstandigenaftrek bedraagt in 2024 € 3.750 per jaar. Deze aftrek verlaagt je belastbare winst ` +
        `direct, waardoor je minder inkomstenbelasting in Box 1 betaalt.`,
    },
    {
      question: `Hoeveel zorgverzekering betaalt een ZZP ${niche.title}?`,
      answer:
        `Als ZZP ${niche.title} betaal je een basispremie van circa € 150 / maand plus een ` +
        `inkomensafhankelijke bijdrage (IAB) van 5,32% over je belastbaar inkomen. ` +
        `In totaal komt dit op ${EUR(tax.deductions.healthInsurance)} / maand bij dit inkomensniveau.`,
    },
    {
      question: `Hoe werkt de MKB-winstvrijstelling voor ZZP?`,
      answer:
        `De MKB-winstvrijstelling (13,31% in 2024) stelt een deel van je winst vrij van Box 1-belasting. ` +
        `Na aftrek van de zelfstandigenaftrek wordt 13,31% van de resterende winst niet belast — ` +
        `dit verlaagt je effectieve tarief aanzienlijk.`,
    },
    {
      question: `Is ZZP ${niche.title} fiscaal aantrekkelijk in Nederland?`,
      answer:
        `Ja. De combinatie van zelfstandigenaftrek, MKB-winstvrijstelling en heffingskortingen maakt ` +
        `ZZP in Nederland fiscaal efficiënt. Bij ${EUR(niche.averageGrossRevenue)} omzet per maand ` +
        `bedraagt de effectieve belastingdruk slechts ${PCT(tax.effectiveRate)} — aanzienlijk lager dan ` +
        `bij vergelijkbaar inkomen in loondienst of als Freiberufler in Duitsland.`,
    },
  ];
}

function buildStructuredData(faq: FaqItem[]): StructuredDataFAQ {
  return {
    '@context': 'https://schema.org',
    '@type':    'FAQPage',
    mainEntity: faq.map(f => ({
      '@type': 'Question',
      name:    f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

// ─── Haupt-Export ──────────────────────────────────────────────────────────────

export function generateNLPage(nicheSlug: string): NLPageContent {
  const niche = NICHES.find(n => n.slug === nicheSlug);
  if (!niche) throw new Error(`Niche "${nicheSlug}" not found in nlNiches.json`);

  const evaluation = evaluateNLNiche(niche);
  const faq        = buildFAQ(evaluation);

  return {
    slug:         niche.slug,
    generatedAt:  new Date().toISOString(),
    meta:         buildMeta(evaluation),
    hero:         buildHero(evaluation),
    highlights:   evaluation.highlights,
    sections: [
      buildIncomeSection(evaluation),
      buildTaxSection(evaluation),
      buildMarketSection(evaluation),
      buildTaxAdvantagesSection(evaluation),
    ],
    faq,
    structuredData: buildStructuredData(faq),
    evaluation,
  };
}

/**
 * Generiert alle Seiten aus nlNiches.json in einem Durchlauf.
 * Verwendung: const allPages = generateAllNLPages();
 */
export function generateAllNLPages(): NLPageContent[] {
  return NICHES.map(n => generateNLPage(n.slug));
}
