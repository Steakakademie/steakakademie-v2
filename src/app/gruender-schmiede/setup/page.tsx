import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ChevronRight, Sparkles, Megaphone, Search, ChefHat, Code, Users, Palette,
  ClipboardList, Database, Cloud, Image as ImageIcon, Mail, Globe, CreditCard,
  Github, FileCode, Plug, BarChart3, Terminal, ShieldCheck, Bot,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { breadcrumbSchema } from '@/lib/schema';

export const metadata: Metadata = {
  // Uwe, 02.09.2026: noindex — Gruender-Bereich ist aus der Steakakademie ausgebaut
  // (Nav/Footer seit 641b346, Sitemap seit heute). CLAUDE.md Abschnitt 10.
  robots: { index: false, follow: false },
  title: 'Mein Setup — KI-Agenten und Werkzeuge',
  description:
    'Die KI-Agenten, Konnektoren und Werkzeuge, mit denen die Steakakademie als Ein-Personen-Betrieb läuft — kein Theorie-Modell, sondern das laufende System.',
  alternates: { canonical: 'https://steakakademie.de/gruender-schmiede/setup' },
};

type Item = { name: string; role: string; Icon: typeof Sparkles };

const AGENTS: Item[] = [
  { name: 'Senior-Marketing-Manager', role: 'Positionierung, Angebote, Funnels, Umsatz', Icon: Megaphone },
  { name: 'SEO/GEO-Manager', role: 'Sichtbar in Google — und in KI-Suchen (ChatGPT, Perplexity)', Icon: Search },
  { name: 'Content-Culinary-Expert', role: 'Rezepte, Lektionen, Fachtiefe — die Pitmaster-Doktrin', Icon: ChefHat },
  { name: 'Tech-Automation-Engineer', role: 'Code, Pipelines, Infrastruktur, Bug-Fixes', Icon: Code },
  { name: 'Community-Manager', role: 'Austausch, Moderation, Bindung', Icon: Users },
  { name: 'Brand/UX-Designer', role: 'Look, Markenstimme, Avatare', Icon: Palette },
  { name: 'Projekt-Manager', role: 'Orchestriert alles über Jira + Confluence', Icon: ClipboardList },
];

const STACK: Item[] = [
  { name: 'Next.js', role: 'Das Website-Framework — schnell, modern, SEO-stark', Icon: FileCode },
  { name: 'Supabase', role: 'Datenbank, Login & Speicher', Icon: Database },
  { name: 'Vercel', role: 'Hosting & automatisches Deployment', Icon: Cloud },
  { name: 'fal.ai (FLUX)', role: 'Bildgenerierung — der einzige Bildgenerator', Icon: ImageIcon },
  { name: 'Loops.so', role: 'Transaktions-Mails & Newsletter', Icon: Mail },
  { name: 'Cloudflare', role: 'DNS & E-Mail-Routing', Icon: Globe },
  { name: 'Digistore24', role: 'Zahlungsabwicklung (DE-konform)', Icon: CreditCard },
  { name: 'GitHub', role: 'Code-Ownership + automatische Workflows', Icon: Github },
];

const CONNECTORS: Item[] = [
  { name: 'Atlassian / Rovo', role: 'Jira + Confluence — das KI-Projekt-Backbone', Icon: ClipboardList },
  { name: 'Supabase-MCP', role: 'Datenbank direkt per KI steuern', Icon: Database },
  { name: 'GoDaddy Domains', role: 'Domains prüfen & sichern', Icon: Globe },
  { name: 'fal.ai', role: 'Bilder on demand', Icon: ImageIcon },
  { name: 'Gmail', role: 'Posteingang-Triage bis zum Entwurf', Icon: Mail },
  { name: 'Analytics & Search Console', role: 'Zahlen, die Entscheidungen tragen', Icon: BarChart3 },
];

const TOOLS: Item[] = [
  { name: 'Claude Code', role: 'Der KI-Mitgründer im Terminal — baut, fixt, steuert', Icon: Terminal },
  { name: 'Build-Guard', role: 'Fängt stille Defekte, bevor sie live gehen', Icon: ShieldCheck },
  { name: 'Ops-Hooks', role: 'Fehler werden automatisch zu Jira-Tickets', Icon: Bot },
];

function Section({ kicker, title, blurb, items, color }: {
  kicker: string; title: string; blurb: string; items: Item[]; color: string;
}) {
  return (
    <section className="border-b border-border-subtle">
      <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase mb-3" style={{ color }}>
          {kicker}
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text-light mb-2">{title}</h2>
        <p className="font-body text-text-light/60 max-w-2xl mb-8">{blurb}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(({ name, role, Icon }) => (
            <div key={name} className="flex items-start gap-3 p-5 border border-border-subtle bg-surface-elevated">
              <div className="shrink-0 w-9 h-9 flex items-center justify-center" style={{ background: `${color}1A`, border: `1px solid ${color}40` }}>
                <Icon size={16} style={{ color }} />
              </div>
              <div className="min-w-0">
                <p className="font-sans text-sm font-bold text-text-light leading-snug">{name}</p>
                <p className="font-body text-xs text-text-light/55 leading-snug mt-0.5">{role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function SetupShowcasePage() {
  const breadcrumb = breadcrumbSchema([
    { name: 'Gründer-Schmiede', url: '/gruender-schmiede' },
    { name: 'Mein Setup', url: '/gruender-schmiede/setup' },
  ]);

  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <main className="bg-surface-base">
        {/* Hero */}
        <section className="bg-surface-dark border-b border-brand-gold/15">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
            <nav className="flex items-center gap-1.5 text-xs font-sans text-text-light/55 mb-8" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
              <ChevronRight size={12} />
              <Link href="/gruender-schmiede" className="hover:text-brand-gold transition-colors">Gründer-Schmiede</Link>
              <ChevronRight size={12} />
              <span className="text-text-light/65">Mein Setup</span>
            </nav>

            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                <Sparkles size={12} /> Eröffnung — volle Transparenz
              </span>
              <h1 className="font-serif text-4xl lg:text-5xl font-bold text-text-light leading-tight mb-5">
                So baue ich das hier wirklich.
              </h1>
              <p className="font-serif text-xl text-text-light/80 leading-relaxed mb-4">
                Bevor du irgendetwas lernst, zeige ich dir mein komplettes System — offen, ohne Vorhang.
              </p>
              <p className="font-body text-base text-text-light/55 leading-relaxed max-w-2xl">
                Die Steakakademie läuft als Ein-Personen-Betrieb — getragen von einem Team aus KI-Agenten,
                einem schlanken Stack und ein paar klug gewählten Konnektoren. Genau dieses laufende System
                bekommst du in der Gründer-Schmiede an die Hand. Kein Theorie-Modell. Das echte Werkzeug.
              </p>
            </div>
          </div>
        </section>

        <Section
          kicker="Das Team"
          title="KI-Agenten — jeder mit klarer Aufgabe"
          blurb="Kein Generalist, der alles halb macht. Sieben Rollen, jede mit eigenem Auftrag — orchestriert über ein gemeinsames Projekt-Backbone."
          items={AGENTS}
          color="#E85018"
        />
        <Section
          kicker="Die Programme"
          title="Der Stack — schlank, modern, DE-konform"
          blurb="Jedes Werkzeug erfüllt genau einen Zweck. Zusammen tragen sie eine vollwertige Plattform — ohne Agentur, ohne Investoren."
          items={STACK}
          color="#C8882A"
        />
        <Section
          kicker="Die Verbindungen"
          title="Konnektoren & MCPs — wo die KI direkt zugreift"
          blurb="Über diese Schnittstellen steuert die KI reale Systeme: Projektboard, Datenbank, Domains, Bilder, Posteingang."
          items={CONNECTORS}
          color="#7CB342"
        />
        <Section
          kicker="Die Werkzeuge"
          title="Plugins & Schutzmechanismen"
          blurb="Das, was im Hintergrund läuft, damit nichts Stilles kaputtgeht."
          items={TOOLS}
          color="#9aa0a5"
        />

        {/* CTA zurück */}
        <section className="bg-surface-dark">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
            <p className="font-serif text-2xl font-bold text-text-light mb-3">
              Du kaufst kein Theorie-Modell. Du bekommst mein laufendes System.
            </p>
            <Link href="/gruender-schmiede" className="inline-flex items-center gap-2 px-7 py-3.5 bg-brand-gold text-ink font-sans font-bold text-sm tracking-[0.1em] uppercase">
              Zur Gründer-Schmiede <ChevronRight size={15} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
