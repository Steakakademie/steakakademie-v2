/**
 * Kopfzelle für Tabellen aus MDX.
 *
 * Eine Kreuztabelle beginnt in Markdown mit einer leeren Eckzelle (`| | A | B |`).
 * Als <th> wäre das eine Spaltenüberschrift ohne Namen (axe: empty-table-header) —
 * Screenreader sagen dann „leer" als Überschrift an. Die leere Zelle wird deshalb
 * als <td> ausgegeben; sie sieht gleich aus und behauptet keine Überschrift.
 */
export default function MdxTh({
  children,
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  const leer =
    children == null ||
    (typeof children === 'string' && children.trim() === '') ||
    (Array.isArray(children) && children.length === 0);
  if (leer) return <td className={className} {...props} />;
  return (
    <th className={className} {...props}>
      {children}
    </th>
  );
}
