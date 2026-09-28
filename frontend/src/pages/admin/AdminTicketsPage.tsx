import React, { useState, useEffect } from 'react';
import { LifeBuoy, Send, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

export const AdminTicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('WAITING_CUSTOMER');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTickets = () => {
    api.getAdminTickets()
      .then((res) => {
        setTickets(res.data || []);
        if (res.data?.length && !activeTicket) {
          setActiveTicket(res.data[0]);
        }
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;

    setIsSubmitting(true);
    try {
      await api.replyTicket(activeTicket.id, replyText, replyStatus);
      setReplyText('');
      loadTickets();
    } catch (err: any) {
      alert(err.message || 'Failed to send reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Support Tickets & Agent Console</h1>
        <p className="text-xs text-slate-500 mt-1">Answer customer inquiries, process exchanges, and resolve disputes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-2 h-[600px] overflow-y-auto">
          {tickets.map((t) => (
            <div
              key={t.id}
              onClick={() => setActiveTicket(t)}
              className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                activeTicket?.id === t.id
                  ? 'border-brand-primary bg-indigo-50/50 shadow-sm'
                  : 'border-slate-100 hover:border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-mono font-bold text-slate-500">{t.ticketNumber}</span>
                <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  {t.status}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{t.subject}</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">From: {t.customer?.name}</p>
            </div>
          ))}
        </div>

        {/* Conversation Thread */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between h-[600px]">
          {activeTicket ? (
            <>
              <div className="pb-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-brand-primary">{activeTicket.ticketNumber}</span>
                  <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-md font-bold text-slate-700">
                    Priority: {activeTicket.priority}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 mt-1">{activeTicket.subject}</h3>
                <p className="text-xs text-slate-500">
                  Customer: <strong>{activeTicket.customer?.name}</strong> ({activeTicket.customer?.email})
                </p>
                <div className="mt-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-700">
                  {activeTicket.description}
                </div>
              </div>

              {/* Message thread */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3">
                {activeTicket.messages?.map((m: any) => (
                  <div key={m.id} className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-indigo-950">
                      <span>Pick2Buy Support Desk</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-800 leading-relaxed">{m.message}</p>
                  </div>
                ))}
              </div>

              {/* Reply box */}
              <form onSubmit={handleSendReply} className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Agent Response:</span>
                  <select
                    value={replyStatus}
                    onChange={(e) => setReplyStatus(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs"
                  >
                    <option value="WAITING_CUSTOMER">Waiting for Customer</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type official reply to customer..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-primary"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Reply</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Select a ticket to inspect and reply
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
