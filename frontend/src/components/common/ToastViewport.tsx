import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useToastStore } from '../../store/useToastStore';

const styles = {
  success: { icon: CheckCircle2, iconClass: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500' },
  error: { icon: AlertCircle, iconClass: 'bg-rose-100 text-rose-700', bar: 'bg-rose-500' },
  info: { icon: Info, iconClass: 'bg-blue-100 text-brand-primary', bar: 'bg-brand-primary' },
};

export function ToastViewport() {
  const { items, dismiss, confirmation, answer } = useToastStore();
  return <>
    <div aria-live="polite" aria-atomic="false" className="pointer-events-none fixed inset-x-3 top-3 z-[120] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-5 sm:top-5 sm:w-[min(24rem,calc(100vw-2rem))]">
      {items.map(item => {
        const visual = styles[item.kind];
        const Icon = visual.icon;
        return <div key={item.id} role={item.kind === 'error' ? 'alert' : 'status'} className="toast-enter pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 pr-10 shadow-[0_16px_45px_rgba(15,23,42,0.18)]">
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${visual.iconClass}`}><Icon size={19} /></span>
          <div className="min-w-0 pt-0.5"><p className="text-sm font-bold text-slate-900">{item.kind === 'success' ? 'Success' : item.kind === 'error' ? 'Something went wrong' : 'Pick2Buy'}</p><p className="mt-0.5 text-xs leading-5 text-slate-600">{item.message}</p></div>
          <button type="button" onClick={() => dismiss(item.id)} aria-label="Dismiss notification" className="absolute right-3 top-3 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={16} /></button>
          <span className={`absolute inset-x-0 bottom-0 h-0.5 ${visual.bar}`} />
        </div>;
      })}
    </div>
    {confirmation && <div className="fixed inset-0 z-[130] grid place-items-center bg-slate-950/50 p-4" onMouseDown={event => { if (event.target === event.currentTarget) answer(false); }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message" className="toast-enter w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
        <div className={`mb-4 grid h-11 w-11 place-items-center rounded-2xl ${confirmation.destructive ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-brand-primary'}`}>{confirmation.destructive ? <AlertCircle size={22} /> : <Info size={22} />}</div>
        <h2 id="confirm-title" className="text-lg font-black text-slate-900">{confirmation.title}</h2>
        <p id="confirm-message" className="mt-2 text-sm leading-6 text-slate-600">{confirmation.message}</p>
        <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => answer(false)} autoFocus className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50">Cancel</button><button type="button" onClick={() => answer(true)} className={`rounded-xl px-4 py-2.5 text-xs font-bold text-white ${confirmation.destructive ? 'bg-rose-600 hover:bg-rose-700' : 'bg-brand-primary hover:bg-brand-hover'}`}>{confirmation.confirmLabel}</button></div>
      </div>
    </div>}
  </>;
}
