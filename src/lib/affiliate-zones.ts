// ════════════════════════════════════════════════════════════════════════════
// 3-Zonen-Affiliate-Modell pro Methoden-Artikel (Single Source of Truth)
// Quelle: Steakakademie_Affiliate-Verlinkstrategie.md
//
//   🟠 HERO   → 1 Big-Ticket (Grill/Smoker/Beefer), sticky in der Sidebar,
//               „Marcos Empfehlung". Genau EINE klare Empfehlung pro Artikel.
//   ⚪ INLINE  → kontextuelle Amazon-Textlinks IM Schritt (manuell via
//               <InlineAffiliate> im MDX gesetzt — gehören in den Kontext).
//   🔵 FOOTER  → „Marcos Equipment für [Methode]" — Komplettliste als Tabelle.
//
// Regel: pro Artikel max. 1 Hero. Hero + Footer werden vom Methoden-Template
// AUTOMATISCH gerendert, sobald hier ein Eintrag für den Slug existiert.
// Produkt-IDs verweisen auf products/registry.yaml (graceful: fehlt ein Produkt,
// wird der Slot einfach ausgelassen).
// ════════════════════════════════════════════════════════════════════════════

export interface MethodAffiliateZones {
  /** 🟠 Big-Ticket-Empfehlung (1 Produkt) + Marcos Pitch (Stimme „Marco"). */
  hero?: { productId: string; pitch: string };
  /** 🔵 Equipment-Komplettliste (Produkt-IDs in Anzeige-Reihenfolge). */
  footer?: { title?: string; productIds: string[] };
}

// Hinweis: Hero nutzt vorerst Amazon-Grills (provider amazon, aktiv). Sobald Santos
// Grills (AWIN) live ist, Hero-productId auf das passende Santos-Produkt umstellen
// (höhere Marge) — Ziel-URLs je Gerät kommen aus dem AWIN-Backend.
export const METHOD_ZONES: Record<string, MethodAffiliateZones> = {
  'reverse-sear': {
    hero: {
      productId: 'weber-master-touch-57',
      pitch:
        'Reverse Sear braucht eine stabile, indirekte Zone und einen Deckel, der die Hitze hält. Mit dem Weber Master-Touch ziehst du das Steak sanft auf Kerntemperatur und finishst es scharf über der Glut — ein Kugelgrill, der ein Grillerleben lang hält.',
    },
    footer: {
      title: 'Marcos Equipment für Reverse Sear',
      productIds: ['weber-master-touch-57', 'thermapen-one', 'guede-alpha-olive-steakmesser-set'],
    },
  },

  // ── Vorverdrahtet (Matrix aus der Affiliate-MD) — greift automatisch, sobald
  //    der jeweilige Methoden-Artikel existiert. ──────────────────────────────
  oberhitzegrillen: {
    hero: {
      productId: 'beefer-pro-ii',
      pitch:
        '800 °C Oberhitze sind der einzige Weg zur perfekten Kruste in 60 Sekunden. Der Beefer Pro II liefert genau diese kompromisslose Strahlungshitze — gebaut für Steaks, nichts anderes.',
    },
    footer: {
      title: 'Marcos Equipment fürs Oberhitzegrillen',
      productIds: ['beefer-pro-ii', 'thermapen-one', 'guede-alpha-olive-steakmesser-set'],
    },
  },

  'sous-vide': {
    hero: {
      productId: 'anova-precision-cooker-3',
      pitch:
        'Sous-vide lebt von gradgenauer Temperatur über Stunden. Der Anova Precision Cooker hält den Punkt zuverlässig — danach nur noch scharf abgrillen, fertig.',
    },
    footer: {
      title: 'Marcos Equipment für Sous-vide',
      productIds: ['anova-precision-cooker-3', 'thermapen-one'],
    },
  },

  caveman: {
    hero: {
      productId: 'kamado-joe-classic-iii',
      pitch:
        'Caveman heißt: das Steak direkt in die Glut. Ein Kamado wie der Classic III liefert die dichte, gleichmäßige Holzkohleglut, die diese Technik braucht — und hält die Hitze stundenlang.',
    },
    footer: {
      title: 'Marcos Equipment für Caveman / Dirty Steak',
      productIds: ['kamado-joe-classic-iii', 'thermapen-one'],
    },
  },

  smoken: {
    hero: {
      productId: 'kamado-joe-classic-iii',
      pitch:
        'Low & Slow gelingt nur mit stabiler, niedriger Temperatur über viele Stunden. Der Kamado Joe hält 110 °C mühelos den ganzen Tag — keramische Isolierung, kaum Nachlegen.',
    },
    footer: {
      title: 'Marcos Equipment fürs Smoken',
      productIds: ['kamado-joe-classic-iii', 'inkbird-ibbq-4t', 'thermapen-one'],
    },
  },
};

export function getMethodZones(slug: string): MethodAffiliateZones {
  return METHOD_ZONES[slug] ?? {};
}
