import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { formatINR } from '../../lib/utils';
export const AdminSalesPage = () => {
  const [filters, setFilters] = useState({ period: 'month', from: '', to: '' }), [report, setReport] = useState<any>(null), [error, setError] = useState(''), [loading, setLoading] = useState(false);
  const query = new URLSearchParams(filters).toString();
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    api.commerce('/admin/sales-report?' + query).then(r => { if (active) setReport(r.data); }).catch(e => { if (active) { setError(e.message); setReport(null); } }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [query]);
  return <section className="space-y-6"><h1 className="text-2xl font-bold">Sales reports & analytics</h1><div className="flex flex-wrap gap-3">
    <select aria-label="Report period" className="rounded border p-2" value={filters.period} onChange={e => setFilters({ ...filters, period: e.target.value })}>{[['day', 'Today'], ['week', 'Last 7 days'], ['month', 'This month'], ['year', 'This year'], ['custom', 'Custom dates']].map(([v, label]) => <option value={v} key={v}>{label}</option>)}</select>
    {filters.period === 'custom' && <><input aria-label="From date" type="date" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} /><input aria-label="To date" type="date" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} /></>}
    <button disabled={loading || !report || Boolean(error)} onClick={() => api.download('/admin/ledger?' + query + '&format=xlsx', 'pick2buy-ledger.xlsx').catch(e => setError(e.message))} className="rounded border bg-white px-3">Ledger Excel</button>
    <button disabled={loading || !report || Boolean(error)} onClick={() => api.download('/admin/ledger?' + query + '&format=pdf', 'pick2buy-ledger.pdf').catch(e => setError(e.message))} className="rounded border bg-white px-3">Ledger PDF</button>
    {['pdf', 'xlsx'].map(format => <button key={format} disabled={loading || !report || Boolean(error)} onClick={() => api.download('/admin/sales-report?' + query + '&format=' + format, 'pick2buy-sales.' + format).catch(e => setError(e.message))} className="rounded-lg border bg-white px-3 py-2 disabled:opacity-40">Download {format === 'xlsx' ? 'Excel' : 'PDF'}</button>)}</div>
    {error && <p role="alert" className="text-red-600">{error}</p>}{loading && <p role="status">Loading report…</p>}
    {report && !loading && <><p className="text-sm text-slate-500">{report.range.from} to {report.range.to} · India time. Paid/refunded orders by order date. Refunds include pending obligations.</p><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{Object.entries(report.summary).map(([key, value]) => <div key={key} className="rounded-xl border bg-white p-4"><p className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</p><strong>{key === 'salesCount' ? String(value) : formatINR(Number(value))}</strong></div>)}</div>
    <section className="rounded-xl border bg-white p-5"><h2 className="font-bold">Net revenue</h2><div className="flex h-52 items-end gap-2 overflow-x-auto pt-6">{report.revenueChart.map((d: any) => <div key={d.date} className="min-w-12 flex-1 text-center text-xs"><div title={formatINR(d.revenue)} className="mx-auto bg-orange-600 w-8" style={{ height: Math.max(0, d.revenue) / Math.max(1, ...report.revenueChart.map((x: any) => x.revenue)) * 140 }} /><p>{d.date}</p><p>{formatINR(d.revenue)}</p></div>)}</div>{!report.rows.length && <p>No sales in this period.</p>}</section>
    <div className="grid gap-4 lg:grid-cols-3">{[['topProducts', 'Top 10 products'], ['topCategories', 'Top 10 categories'], ['topBrands', 'Top 10 brands']].map(([key, title]) => <section key={key} className="rounded-xl border bg-white p-4"><h2 className="font-bold">{title}</h2><ol className="mt-3 space-y-3">{report[key].map((p: any, i: number) => <li key={p.id}><span>{i + 1}. {p.name}</span><p className="text-xs text-slate-500">{p.sales} units · {formatINR(p.revenue)}</p></li>)}</ol></section>)}</div>
    <div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-sm"><thead><tr>{['Order', 'Date', 'Amount', 'Product discount', 'Coupon', 'Refund', 'Net'].map(t => <th key={t} className="p-3 text-left">{t}</th>)}</tr></thead><tbody>{report.rows.map((r: any) => <tr key={r.orderNumber} className="border-t"><td className="p-3">{r.orderNumber}</td><td>{r.date}</td>{['gross', 'productDiscount', 'couponDiscount', 'refunds', 'net'].map(k => <td key={k}>{formatINR(r[k])}</td>)}</tr>)}</tbody></table></div></>}
  </section>;
};
