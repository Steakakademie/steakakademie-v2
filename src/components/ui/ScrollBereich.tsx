import { cn } from '@/lib/utils';

/**
 * Horizontal scrollbarer Bereich, der per Tastatur erreichbar ist.
 *
 * Ein `overflow-x-auto`-Container ohne fokussierbares Element lässt sich mit der
 * Tastatur nicht scrollen (axe: scrollable-region-focusable, WCAG 2.1.1). `tabIndex=0`
 * macht ihn fokussierbar; `role="group"` + `aria-label` benennt ihn. Bewusst KEIN
 * `role="region"`: mehrere Tabellen mit gleichem Label wären ein Landmark-Duplikat.
 */
export default function ScrollBereich({
  label = 'Tabelle, horizontal scrollbar',
  className,
  children,
}: {
  label?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      tabIndex={0}
      className={cn(
        'overflow-x-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold',
        className,
      )}
    >
      {children}
    </div>
  );
}
