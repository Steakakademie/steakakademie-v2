import type React from 'react';
import { Schnelluebersicht, Achtung, ProTipp, Leitfrage, Umweg, Werkzeug, Ergebnis, Rechtlich } from '@/components/mdx/Callouts';

/** MDX-Bausteine der Eigenregie-Module (Server-Komponenten). */
export const eigenregieMdx = {
  Schnelluebersicht, Achtung, ProTipp, Leitfrage, Umweg, Werkzeug, Ergebnis, Rechtlich,
  h2: (p: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text-primary mt-10 mb-4 leading-tight border-b border-border-subtle pb-3" {...p} />
  ),
  h3: (p: React.HTMLAttributes<HTMLHeadingElement>) => <h3 className="font-serif text-xl font-bold text-text-primary mt-8 mb-3" {...p} />,
  h4: (p: React.HTMLAttributes<HTMLHeadingElement>) => <h4 className="font-sans text-base font-bold text-text-primary mt-6 mb-2" {...p} />,
  p: (p: React.HTMLAttributes<HTMLParagraphElement>) => <p className="font-body text-[1.0625rem] leading-[1.8] text-text-primary mb-5" {...p} />,
  ul: (p: React.HTMLAttributes<HTMLUListElement>) => <ul className="list-disc list-outside ml-5 space-y-2 mb-5 font-body text-[1.0625rem]" {...p} />,
  ol: (p: React.HTMLAttributes<HTMLOListElement>) => <ol className="list-decimal list-outside ml-5 space-y-2 mb-5 font-body text-[1.0625rem]" {...p} />,
  blockquote: (p: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote className="border-l-4 border-brand-gold pl-5 my-6 font-body text-base text-text-secondary" {...p} />
  ),
  strong: (p: React.HTMLAttributes<HTMLElement>) => <strong className="font-bold text-text-primary" {...p} />,
  a: (p: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a className="text-brand-fire underline hover:no-underline" {...p} />,
  table: (p: React.TableHTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto my-6"><table className="w-full text-sm font-body border-collapse" {...p} /></div>
  ),
  th: (p: React.ThHTMLAttributes<HTMLTableCellElement>) => <th className="text-left font-sans font-bold text-text-primary border-b-2 border-border-subtle py-2 pr-4 align-top" {...p} />,
  td: (p: React.TdHTMLAttributes<HTMLTableCellElement>) => <td className="border-b border-border-subtle py-2 pr-4 text-text-secondary align-top" {...p} />,
  pre: (p: React.HTMLAttributes<HTMLPreElement>) => (
    <pre className="my-6 overflow-x-auto bg-[#1b1714] text-[#f6f1e2] p-4 text-[0.85rem] leading-relaxed rounded-sm" {...p} />
  ),
  code: (p: React.HTMLAttributes<HTMLElement>) => <code className="font-mono text-[0.9em]" {...p} />,
  hr: () => <hr className="border-border-subtle my-8" />,
};
