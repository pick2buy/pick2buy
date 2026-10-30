import { ChevronDown } from 'lucide-react';
import { parseProductDetails } from '../../lib/productDetails';

type Props = { name: string; description?: string; highlights?: string[]; specifications?: Record<string, unknown> };

export function ProductOverview({ name, description = '', highlights = [], specifications = {} }: Props) {
  const { details, paragraphs } = parseProductDetails(name, description, specifications);
  const highlightItems = (highlights || []).filter(text => text.trim()).map(text => {
    const separator = text.indexOf(':');
    return separator > 0
      ? { label: text.slice(0, separator).trim(), value: text.slice(separator + 1).trim() }
      : { label: '', value: text.trim() };
  });
  const preview = highlightItems.length ? highlightItems.slice(0, 4) : details.filter(detail => detail.label !== 'Product name').slice(0, 4);

  return (
    <section aria-labelledby="product-overview-heading" className="min-w-0 space-y-4">
      <h2 id="product-overview-heading" className="text-lg font-bold tracking-tight text-slate-900">Product Highlights</h2>
      {preview.length > 0 ? <dl className="space-y-4">
        {preview.map(({ label, value }, index) => <div key={index} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-4 text-sm leading-6">
          <dt className="break-words text-slate-500">{label || `Feature ${index + 1}`}</dt>
          <dd className="break-words text-slate-800">{value}</dd>
        </div>)}
      </dl> : <dl className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-4 text-sm leading-6">
        <dt className="text-slate-500">Product name</dt>
        <dd className="break-words text-slate-800">{name}</dd>
      </dl>}
      <details className="group border-t border-slate-100 pt-1">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-base font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
          Additional Details
          <ChevronDown className="h-5 w-5 shrink-0 text-slate-500 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="space-y-5 pb-2 pt-2">
        <dl className="space-y-4">
          {details.map(({ label, value }, index) => (
            <div key={index} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-4 text-sm leading-6">
              <dt className="break-words text-slate-500">{label}</dt>
              <dd className="break-words font-medium text-slate-800">{value}</dd>
            </div>
          ))}
        </dl>
        {highlightItems.length > 4 && <dl className="space-y-4">
          {highlightItems.slice(4).map(({ label, value }, index) => <div key={index} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-4 text-sm leading-6">
            <dt className="break-words text-slate-500">{label || `Feature ${index + 5}`}</dt>
            <dd className="break-words text-slate-800">{value}</dd>
          </div>)}
        </dl>}
        {paragraphs.length > 0 && <dl className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-4 text-sm leading-6">
          <dt className="text-slate-500">Description</dt>
          <dd className="space-y-3 break-words text-slate-800">
            {paragraphs.flatMap(text => text.split('|')).map((text, index) => <p key={index}>{text.trim()}</p>)}
          </dd>
        </dl>}
        </div>
      </details>
    </section>
  );
}
