/** @type {import('tailwindcss').Config} */
module.exports = {
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './content/**/*.{md,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ─ Premium Magazin — Full Dark Mode ──────────────────────────────
        'brand-gold':       '#C8882A',   // Whiskey-Gold — accents, stars, borders
        'brand-fire':       '#E85018',   // Glut-Orange — primary CTA / affiliate
        'ink':              '#17100B',

        // Surfaces — ALL DARK now
        'surface-base':     '#17100B',   // global page background
        'surface-card':     '#1E1410',   // card backgrounds
        'surface-elevated': '#2D2218',   // elevated panels
        'surface-dark':     '#0F0A06',   // header/footer

        // Text — warm on dark
        'text-primary':     '#E6D5C3',   // main body text
        'text-secondary':   '#C4A882',   // secondary text
        'text-muted':       '#9F8A7B',   // captions/meta — WCAG AA: 4,72:1 auf surface-elevated, 5,5:1+ auf den übrigen Flächen (04.10.2026; war #947D6C = 4,00:1 auf elevated)
        'text-light':       '#F0E8D8',   // headings/emphasis on dark

        // Borders — subtle on dark
        'border-subtle':    '#3A2A1E',   // subtle border
        'border-strong':    '#C8882A',   // gold border
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        body:  ['Source Serif 4', 'Georgia', 'serif'],
        sans:  ['DM Sans', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        editorial: '1280px',
        content:   '720px',
      },
      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-body':          '#C4A882',
            '--tw-prose-headings':      '#E6D5C3',
            '--tw-prose-links':         '#E85018',
            '--tw-prose-bold':          '#F0E8D8',
            '--tw-prose-counters':      '#9F8A7B',
            '--tw-prose-bullets':       '#C8882A',
            '--tw-prose-hr':            '#3A2A1E',
            '--tw-prose-quotes':        '#E6D5C3',
            '--tw-prose-quote-borders': '#C8882A',
            '--tw-prose-captions':      '#9F8A7B',
            '--tw-prose-code':          '#E85018',
            '--tw-prose-pre-bg':        '#1E1410',
            fontFamily:  'Source Serif 4, Georgia, serif',
            fontSize:    '1.125rem',
            lineHeight:  '1.8',
            h2: {
              fontFamily: 'Playfair Display, Georgia, serif',
              fontWeight: '700',
              color: '#E6D5C3',
            },
            h3: {
              fontFamily: 'Playfair Display, Georgia, serif',
              fontWeight: '600',
              color: '#E6D5C3',
            },
            a: {
              textDecoration: 'underline',
              textDecorationColor: '#C8882A',
              textDecorationThickness: '2px',
              textUnderlineOffset: '3px',
            },
            blockquote: {
              borderLeftWidth: '3px',
              borderLeftColor: '#C8882A',
              fontStyle: 'italic',
              color: '#E6D5C3',   // WCAG-Fix: war #4A3728 (Light-Theme-Relikt) = 1.58:1 auf dunklem Grund
              paddingLeft: '1.5rem',
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
              backgroundColor: 'rgba(200, 136, 42, 0.05)',
            },
            // Tabellen: Light-Theme-Relikte auf Dark-Theme umgestellt (WCAG-Fix)
            'thead tr': {
              backgroundColor: '#2D2218',
            },
            'thead th': {
              color: '#C8882A',
              fontWeight: '700',
            },
            'tbody td': {
              borderBottomColor: '#3A2A1E',
              color: '#C4A882',
            },
            'tbody tr:nth-child(even)': {
              backgroundColor: 'rgba(240, 232, 216, 0.06)',
            },
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
