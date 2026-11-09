import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { formatINR } from '../lib/utils';

export const ReceiptPage: React.FC = () => {
  const { orderNumber = '' } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<any>(null);
  useEffect(() => { api.getOrderByNumber(orderNumber).then(r => setOrder(r.data)).catch(() => setOrder(null)); }, [orderNumber]);
  const [downloadError, setDownloadError] = useState('');
  if (!order) return <div className="p-10 text-center">Loading receipt…</div>;
  return <main className="min-h-screen bg-slate-100 p-4 sm:p-10 print:bg-white print:p-0"><article className="mx-auto max-w-3xl bg-white p-6 sm:p-10 shadow-xl print:max-w-none print:shadow-none">
    <div className="mb-5 print:hidden"><button onClick={() => api.download('/orders/' + encodeURIComponent(orderNumber) + '/invoice', orderNumber + '.pdf').catch(e => setDownloadError(e.message))} className="rounded-lg bg-orange-700 px-4 py-2 text-white">Download invoice PDF</button>{downloadError && <p role="alert">{downloadError}</p>}</div>
    <header className="flex items-start justify-between border-b-2 border-slate-900 pb-6"><div><h1 className="text-2xl font-black text-slate-900">pick2buy</h1><p className="text-xs text-slate-500">India's store · Payment receipt</p></div><div className="text-right text-xs"><p className="font-bold">Receipt</p><p>{order.orderNumber}</p><p>{new Date(order.createdAt).toLocaleDateString('en-IN')}</p></div></header>
    <section className="grid grid-cols-2 gap-6 border-b py-6 text-sm"><div><h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Billed to</h2><p className="font-bold">{order.customerName}</p><p>{order.customerEmail}</p><p>{order.customerPhone}</p></div><div><h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Shipping address</h2><p>{order.shippingAddress?.addressLine}</p><p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p></div></section>
    <table className="my-6 w-full text-sm"><thead><tr className="border-b text-left text-xs uppercase text-slate-500"><th className="py-2">Item</th><th className="py-2 text-center">Qty</th><th className="py-2 text-right">Amount</th></tr></thead><tbody>{order.items?.map((item: any) => <tr key={item.id} className="border-b"><td className="py-3 font-medium">{item.productName}</td><td className="py-3 text-center">{item.quantity}</td><td className="py-3 text-right">{formatINR(item.total)}</td></tr>)}</tbody></table>
    <div className="ml-auto max-w-xs space-y-2 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{formatINR(order.subtotal)}</span></div><div className="flex justify-between"><span>Shipping</span><span>{order.shippingFee ? formatINR(order.shippingFee) : 'FREE'}</span></div>{order.discountAmount > 0 && <div className="flex justify-between text-emerald-700"><span>Discount</span><span>-{formatINR(order.discountAmount)}</span></div>}<div className="flex justify-between border-t-2 border-slate-900 pt-3 text-base font-black"><span>Total paid</span><span>{formatINR(order.grandTotal)}</span></div></div>
    <footer className="mt-10 border-t pt-5 text-center text-xs text-slate-500">Thank you for shopping with Pick2Buy · Keep this receipt for your records.</footer>
  </article></main>;
};
