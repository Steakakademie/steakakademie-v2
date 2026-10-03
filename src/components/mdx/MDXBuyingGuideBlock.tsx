import BuyingGuideBlock from '@/components/affiliate/BuyingGuideBlock';
import { getProductById } from '@/lib/products';

interface MDXBuyingGuideBlockProps {
  id: string;
  title: string;
  summary: string;
}

/**
 * MDX-friendly wrapper around BuyingGuideBlock.
 * Usage in MDX:
 *   <MDXBuyingGuideBlock
 *     id="meater-plus"
 *     title="Unsere Auswahl für Long Cooks"
 *     summary="Das MEATER Plus passt nach Datenlage zu den meisten Grillern."
 *   />
 */
export default function MDXBuyingGuideBlock({ id, title, summary }: MDXBuyingGuideBlockProps) {
  const product = getProductById(id);
  if (!product) return null;
  return <BuyingGuideBlock product={product} title={title} summary={summary} />;
}
