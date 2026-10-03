import type { Metadata } from 'next';
import Image from 'next/image';
import { getAuthorBySlug } from '@/lib/authors';

export const metadata: Metadata = {
  title: 'Über uns — Bevor ein Steak auf den Rost kommt',
  description: 'Wer hinter der Steakakademie steht: Die Weide, die Reifung, das Handwerk — und eine Redaktion, die Fragen stellt.',
};

/**
 * Über uns (Handoff, Ansicht 8): dunkler Kopf mit Titel auf der 88px-Stufe,
 * danach Lesetext auf 760px in drei Kapiteln, zwei Bilder, ein hervorgehobenes
 * Zitat auf dunklem Grund, am Ende die Redaktionsliste.
 *
 * Text 1:1 aus dem Prototyp (README: Inhalte sind echt und übernehmbar).
 * Bildmotiv Reifekammer fehlt (Handoff, offener Punkt 6) — das Ersatzbild
 * trägt den Hinweis „Vorläufig · Reifekammer-Motiv folgt", bis ein echtes da ist.
 *
 * Redaktion: Die Rollen aus dem Prototyp, ergänzt um die Kennzeichnung
 * „KI-Persona · fachlich verantwortet von Uwe Yendell" aus src/lib/authors.ts —
 * die steht auf jeder Autorenseite und darf hier nicht fehlen (Transparenz,
 * Art. 50 KI-VO). Profilbilder: neutrale Kreise wie im Prototyp.
 */
const REDAKTION: { slug: string; rolle: string }[] = [
  // 06.09.2026: Uwe zeichnet keine Fachartikel mehr als Autor (Entscheidung Uwe).
  // Seine Rolle ist die fachliche Verantwortung — die Personas schreiben.
  { slug: 'uwe-yendell', rolle: 'Gründer · fachliche Verantwortung' },
  { slug: 'marco', rolle: 'Pitmaster, Ausrüstung, Texas' },
  { slug: 'elena', rolle: 'USA-Expedition, Carolinas' },
  { slug: 'jonas', rolle: 'USA-Expedition, Memphis' },
];

export default function UeberUnsSeite() {
  return (
    <>
      <section className="sk-d" style={{ padding: 'clamp(56px, 8vw, 120px) 20px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div className="sk-kicker sk-kicker--warm" style={{ marginBottom: 14 }}>Über uns · Philosophie</div>
          <h1 className="sk-h" style={{ fontWeight: 900, fontSize: 'clamp(44px, 6.5vw, 88px)', lineHeight: .92, textWrap: 'balance' }}>
            Bevor ein Steak auf den Rost kommt, hat es zwei Jahre gelebt.
          </h1>
        </div>
      </section>

      <div className="sk-ueber-text">
        <p className="sk-lead sk-lead--xl" style={{ maxWidth: 'none' }}>
          Wir sind keine Grillseite. Wir sind Leute, die irgendwann aufgehört haben, sich mit „ganz okay&ldquo; zufriedenzugeben — und angefangen haben, Fragen zu stellen. Beim Metzger. Beim Züchter. Am eigenen Smoker um drei Uhr nachts.
        </p>

        <figure>
          <div className="sk-ueber-bild" style={{ height: 320 }}>
            <Image src="/images/relaunch/weide-gras-abend.jpg" alt="Rinder auf der Weide im Abendlicht, Gras im Vordergrund — KI-generiertes Symbolbild" fill sizes="(min-width: 800px) 760px, 100vw" style={{ objectFit: 'cover', objectPosition: '50% 60%' }} />
          </div>
          <figcaption className="sk-meta sk-meta--14" style={{ marginTop: 10, fontStyle: 'italic' }}>
            Spätes Licht, hohes Gras — Zeit ist die erste Zutat. <a href="/ki-disclaimer">KI-Symbolbild</a>
          </figcaption>
        </figure>

        <h2 className="sk-h sk-h--sub">Die Weide</h2>
        <p>Ein gutes Steak beginnt nicht in der Pfanne. Es beginnt damit, ob ein Tier Zeit hatte. Zeit zu wachsen, Zeit, Fett anzusetzen, das später als Marmorierung in der Kruste schmilzt. Wir besuchen die Betriebe, deren Fleisch wir empfehlen, und wir schreiben auf, was wir sehen: Wie lange die Tiere draußen sind. Was sie fressen. Wie der Transport läuft. Das ist keine Romantik — das ist der Unterschied zwischen 52 °C, die zart sind, und 52 °C, die zäh sind.</p>

        <h2 className="sk-h sk-h--sub">Die Reifung</h2>
        <p>Dann die Kammer. Vier Wochen bei einem Grad und hoher Luftfeuchte, Salzblöcke an der Wand, ein Ventilator, der nie stillsteht. Dry Aging ist Kontrolle über Verlust: Das Fleisch gibt Wasser ab, Enzyme zerlegen Bindegewebe, der Geschmack konzentriert sich. Wer einmal in einer Reifekammer gestanden hat, versteht, warum ein gutes Ribeye kostet, was es kostet — und warum man es nicht durchgaren sollte.</p>

        <div className="sk-ueber-bild" style={{ height: 440 }}>
          <Image src="/images/relaunch/schwenkgrill-glut.jpg" alt="Schwenkgrill über offener Glut" fill sizes="(min-width: 800px) 760px, 100vw" style={{ objectFit: 'cover', objectPosition: '50% 38%', filter: 'brightness(1.5) contrast(1.08)' }} />
          <div className="sk-ueber-bild__hinweis">Vorläufig · Reifekammer-Motiv folgt</div>
        </div>

        <h2 className="sk-h sk-h--sub">Das Handwerk</h2>
        <p>Und dann erst das Feuer. Dreißig Jahre Lehrerfahrung stecken in der Methodik der Akademie — nicht am Grill, sondern im Erklären. Wir haben gelernt, dass die meisten Fehler nicht aus Faulheit passieren, sondern aus falschen Regeln, die jemand irgendwann weitergegeben hat. Deshalb die Streitfälle. Deshalb die Temperaturen statt Faustregeln. Deshalb ein Diplom, das man sich verdient.</p>

        <blockquote className="sk-zitat">
          Wir verkaufen kein Fleisch. Wir verkaufen nicht mal Kurse. Wir wollen, dass du am Sonntag ein Steak auf den Tisch stellst, für das du dich nicht entschuldigen musst.
          <div className="sk-zitat__by">Marco, der Pitmaster</div>
        </blockquote>

        <div className="sk-redaktion">
          <div className="sk-kicker sk-kicker--13 sk-kicker--muted" style={{ marginBottom: 14 }}>Redaktion</div>
          <div className="sk-redaktion__grid">
            {REDAKTION.map((r) => {
              const a = getAuthorBySlug(r.slug);
              return (
                <div key={r.slug}>
                  <div className="sk-redaktion__kreis" aria-hidden="true" />
                  <div style={{ fontWeight: 600 }}>{a?.name ?? r.slug}</div>
                  <div className="sk-meta sk-meta--14">{r.rolle}</div>
                  {a?.statsLabel?.startsWith('KI-Persona') && <div className="sk-meta">{a.statsLabel}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
