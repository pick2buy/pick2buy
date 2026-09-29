import { useModal } from '../../hooks/useModal';
import React, { useState, useEffect } from 'react';
import { Users, Plus, MoveRight, Phone, Mail, DollarSign, Calendar } from 'lucide-react';
import { api } from '../../services/api';
import { formatINR } from '../../lib/utils';
import { LEAD_STATUSES } from '@pick2buy/shared';

const KANBAN_STAGES = [
  { key: 'NEW', title: 'New Leads', color: 'border-blue-400 bg-blue-50/40 text-blue-900' },
  { key: 'CONTACTED', title: 'Contacted', color: 'border-amber-400 bg-amber-50/40 text-amber-900' },
  { key: 'QUALIFIED', title: 'Qualified', color: 'border-purple-400 bg-purple-50/40 text-purple-900' },
  { key: 'CONVERTED', title: 'Converted', color: 'border-emerald-400 bg-emerald-50/40 text-emerald-900' },
  { key: 'LOST', title: 'Closed / Lost', color: 'border-slate-300 bg-slate-50 text-slate-700' },
];

export const AdminCrmPage: React.FC = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // New lead form
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'WEBSITE',
    productInterest: '',
    estimatedValue: 15000,
    notes: '',
  });

  const loadLeads = () => {
    setIsLoading(true);
    api.getAdminLeads()
      .then((res) => setLeads(res.data || []))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createLead(newLead);
      setIsModalOpen(false);
      setNewLead({
        name: '',
        email: '',
        phone: '',
        source: 'WEBSITE',
        productInterest: '',
        estimatedValue: 15000,
        notes: '',
      });
      loadLeads();
    } catch (err: any) {
      alert(err.message || 'Failed to create lead');
    }
  };

  const handleMoveStage = async (leadId: string, currentStage: string) => {
    const stageOrder = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'];
    const currentIndex = stageOrder.indexOf(currentStage);
    const nextStage = stageOrder[(currentIndex + 1) % stageOrder.length];

    try {
      await api.updateLeadStatus(leadId, nextStage, `Moved from ${currentStage} to ${nextStage}`);
      loadLeads();
    } catch (err: any) {
      alert(err.message || 'Failed to update stage');
    }
  };

  const modalRef = useModal(isModalOpen, () => setIsModalOpen(false));
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">CRM Leads Pipeline</h1>
          <p className="text-xs text-slate-500 mt-1">Manage B2B enquiries, high-value shoppers and conversion follow-ups</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Lead</span>
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-5 gap-4">
        {KANBAN_STAGES.map((stage) => {
          const stageLeads = leads.filter((l) => l.status === stage.key);
          const totalVal = stageLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

          return (
            <div key={stage.key} className="bg-slate-100/70 rounded-3xl p-3.5 flex flex-col min-h-[500px]">
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200 mb-3">
                <span className="font-bold text-xs text-slate-800">{stage.title}</span>
                <span className="bg-white text-slate-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-slate-200">
                  {stageLeads.length}
                </span>
              </div>

              {totalVal > 0 && (
                <div className="text-[10px] font-bold text-slate-500 mb-3 px-1">
                  Est. Value: <strong className="text-slate-800">{formatINR(totalVal)}</strong>
                </div>
              )}

              {/* Cards in column */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-900">{lead.name}</h4>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                        {lead.source}
                      </span>
                    </div>

                    {lead.productInterest && (
                      <p className="text-[11px] text-slate-600 font-medium line-clamp-1">
                        📦 {lead.productInterest}
                      </p>
                    )}

                    <div className="text-[10px] text-slate-500 space-y-0.5">
                      <p className="flex items-center gap-1"><Mail className="w-3 h-3" /> {lead.email}</p>
                      {lead.phone && <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {lead.phone}</p>}
                    </div>

                    {lead.estimatedValue && (
                      <div className="text-xs font-black text-slate-900 pt-1">
                        {formatINR(lead.estimatedValue)}
                      </div>
                    )}

                    {lead.notes && (
                      <p className="text-[10px] text-slate-400 italic bg-slate-50 p-2 rounded-lg">
                        "{lead.notes}"
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => handleMoveStage(lead.id, lead.status)}
                        className="flex items-center gap-1 text-[10px] font-bold text-brand-primary hover:underline"
                        title="Move to next stage"
                      >
                        <span>Advance Stage</span>
                        <MoveRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Lead Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div ref={modalRef} role="dialog" aria-modal="true" aria-label="Crm form" className="max-h-[calc(100dvh-2rem)] overflow-y-auto relative bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl z-10 space-y-4">
            <h3 className="text-base font-black text-slate-900">Add Lead to CRM</h3>

            <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  placeholder="ramesh@company.in"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  placeholder="9811223344"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Interest / SKU</label>
                <input
                  type="text"
                  value={newLead.productInterest}
                  onChange={(e) => setNewLead({ ...newLead, productInterest: e.target.value })}
                  placeholder="Bulk ANC Earbuds for Corporate Event"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Estimated Deal Value (₹)</label>
                <input
                  type="number"
                  value={newLead.estimatedValue}
                  onChange={(e) => setNewLead({ ...newLead, estimatedValue: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={newLead.notes}
                  onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                  placeholder="Discussed sample delivery dates..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand-primary text-white text-xs font-bold px-5 py-2 rounded-xl hover:bg-brand-hover shadow-sm"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
