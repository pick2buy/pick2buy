import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Package, 
  MapPin, 
  LifeBuoy, 
  LogOut, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  Send,
  Plus,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import { formatINR } from '../lib/utils';
import { ProfileSection } from '../components/account/ProfileSection';
import { Avatar } from '../components/common/Avatar';
import { toast } from '../store/useToastStore';

type AddressDraft = {
  fullName: string; mobile: string; email: string; addressLine: string; apartment: string;
  landmark: string; city: string; state: string; pincode: string; type: 'HOME' | 'WORK' | 'OTHER'; isDefault: boolean;
};
const emptyAddress = (user?: { name?: string; email?: string; phone?: string | null }): AddressDraft => ({
  fullName: user?.name || '', mobile: user?.phone || '', email: user?.email || '', addressLine: '', apartment: '',
  landmark: '', city: '', state: '', pincode: '', type: 'HOME', isDefault: false,
});

export const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, fetchMe, hasCheckedAuth } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'addresses' | 'support'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [addressDraft, setAddressDraft] = useState<AddressDraft | null>(null);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressError, setAddressError] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);
  const [pendingDeleteAddressId, setPendingDeleteAddressId] = useState<string | null>(null);
  const [deletingAddress, setDeletingAddress] = useState(false);

  // New ticket state
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  const submitTicket = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmittingTicket) return;
    setIsSubmittingTicket(true);
    try {
      const response = await api.createSupportTicket(ticketSubject.trim(), ticketDesc.trim());
      setTickets(current => [response.data, ...current]);
      setTicketSubject('');
      setTicketDesc('');
      toast.success(`Support ticket ${response.data.ticketNumber} submitted.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not submit your support ticket.'); }
    finally { setIsSubmittingTicket(false); }
  };

  useEffect(() => {
    if (!hasCheckedAuth) return;
    if (!user) {
      navigate('/login');
      return;
    }
    setIsLoading(true);

    api.getOrders()
      .then((res: any) => setOrders(res.data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [user?.id, hasCheckedAuth, navigate]);

  useEffect(() => {
    if (activeTab !== 'support' || !user) return;
    setTicketsLoading(true);
    setTicketsError('');
    api.getMySupportTickets()
      .then((response: any) => setTickets(response.data || []))
      .catch((error: any) => setTicketsError(error instanceof Error ? error.message : 'Could not load your tickets.'))
      .finally(() => setTicketsLoading(false));
  }, [activeTab, user?.id]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const beginAddress = (existing?: any) => {
    setEditingAddressId(existing?.id || null);
    setAddressDraft(existing ? {
      fullName: existing.fullName || '', mobile: existing.mobile || '', email: existing.email || '',
      addressLine: existing.addressLine || '', apartment: existing.apartment || '', landmark: existing.landmark || '',
      city: existing.city || '', state: existing.state || '', pincode: existing.pincode || '',
      type: existing.type || 'HOME', isDefault: Boolean(existing.isDefault),
    } : emptyAddress(user || undefined));
    setAddressError('');
  };

  const saveAddress = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!addressDraft) return;
    const draft = { ...addressDraft, fullName: addressDraft.fullName.trim(), mobile: addressDraft.mobile.trim(),
      email: addressDraft.email.trim(), addressLine: addressDraft.addressLine.trim(), apartment: addressDraft.apartment.trim(),
      landmark: addressDraft.landmark.trim(), city: addressDraft.city.trim(), state: addressDraft.state.trim(), pincode: addressDraft.pincode.trim() };
    if (draft.fullName.length < 2 || !/^[6-9]\d{9}$/.test(draft.mobile) || draft.addressLine.length < 5 ||
      draft.city.length < 2 || draft.state.length < 2 || !/^\d{6}$/.test(draft.pincode)) {
      setAddressError('Complete the required fields with a valid 10-digit mobile number and 6-digit PIN code.');
      return;
    }
    setSavingAddress(true);
    setAddressError('');
    try {
      if (editingAddressId) await api.updateAddress(editingAddressId, draft);
      else await api.createAddress(draft);
      await fetchMe();
      setAddressDraft(null);
      toast.success(editingAddressId ? 'Address updated.' : 'Address added.');
    } catch (error) { setAddressError(error instanceof Error ? error.message : 'Could not save address.'); }
    finally { setSavingAddress(false); }
  };

  const deleteAddress = async (id: string) => {
    setDeletingAddress(true);
    setAddressError('');
    try {
      await api.deleteAddress(id);
      if (editingAddressId === id) setAddressDraft(null);
      await fetchMe();
      setPendingDeleteAddressId(null);
      toast.success('Address deleted.');
    } catch (error) { setAddressError(error instanceof Error ? error.message : 'Could not delete address.'); }
    finally { setDeletingAddress(false); }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24">
      {/* Account Hero Banner */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-indigo-50 text-brand-primary font-black text-2xl flex items-center justify-center border border-indigo-100">
            <Avatar src={user.avatarUrl} name={user.name} alt="Your profile" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">{user.name}</h1>
              {user.role === 'ADMIN' && (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">{user.email} • {user.phone ? `+91 ${user.phone}` : 'Phone not provided'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user.role === 'ADMIN' && (
            <Link
              to="/admin"
              className="bg-brand-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm hover:bg-brand-hover transition-colors"
            >
              Open Admin Dashboard
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-4 py-2.5 rounded-xl transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Tabs */}
        <aside className="space-y-1">
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
              activeTab === 'orders'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>My Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
              activeTab === 'profile'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-100'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile & Account</span>
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
              activeTab === 'addresses'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-100'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Saved Addresses</span>
          </button>

          <button
            onClick={() => setActiveTab('support')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
              activeTab === 'support'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-100'
            }`}
          >
            <LifeBuoy className="w-4 h-4" />
            <span>Support & Help Tickets</span>
          </button>
        </aside>

        {/* Tab Content Panels */}
        <main className="lg:col-span-3">
          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900">Your Order History</h2>

              {orders.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center space-y-3">
                  <Package className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">No orders placed yet</p>
                  <p className="text-xs text-slate-400">Your order history and live delivery tracking will show here.</p>
                  <Link to="/shop" className="inline-block bg-brand-primary text-white text-xs font-bold px-4 py-2 rounded-xl">
                    Start Shopping
                  </Link>
                </div>
              ) : (
                orders.map((ord) => (
                  <div key={ord.id} className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                      <div>
                        <span className="text-xs font-mono font-bold text-brand-primary">
                          #{ord.orderNumber}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Placed on {new Date(ord.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-full">
                          {ord.status}
                        </span>
                        <Link
                          to={`/account/orders/${ord.orderNumber}`}
                          className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-brand-primary"
                        >
                          <span>Track Order</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-50">
                      {ord.items?.map((item: any) => (
                        <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                          <span className="text-slate-800 font-medium">
                            {item.productName} × {item.quantity}
                          </span>
                          <span className="font-bold text-slate-900">{formatINR(item.total)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Payment: <strong className="text-slate-800">{ord.paymentMethod}</strong></span>
                      <span className="text-sm font-black text-slate-900">Total: {formatINR(ord.grandTotal)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <ProfileSection user={user} refreshUser={fetchMe} />
          )}

          {/* ADDRESSES TAB */}
          {activeTab === 'addresses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-bold text-slate-900">Saved Addresses</h2>
                <button type="button" onClick={() => beginAddress()} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-primary px-3 py-2 text-xs font-bold text-white hover:bg-brand-hover"><Plus size={15} /> Add address</button>
              </div>
              {addressError && !addressDraft && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-xs text-rose-700">{addressError}</p>}
              {addressDraft && <form onSubmit={saveAddress} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-bold text-slate-900">{editingAddressId ? 'Edit address' : 'Add address'}</h3><button type="button" onClick={() => setAddressDraft(null)} aria-label="Close address form" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><X size={17} /></button></div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {([
                    ['fullName', 'Full name *'], ['mobile', 'Mobile number *'], ['email', 'Email (optional)'],
                    ['addressLine', 'House / street address *'], ['apartment', 'Apartment (optional)'], ['landmark', 'Landmark (optional)'],
                    ['city', 'City *'], ['state', 'State *'], ['pincode', '6-digit PIN code *'],
                  ] as const).map(([field, label]) => <label key={field} className={`text-xs font-semibold text-slate-700 ${field === 'addressLine' ? 'sm:col-span-2' : ''}`}>{label}
                    <input type={field === 'email' ? 'email' : field === 'mobile' ? 'tel' : 'text'} required={['fullName', 'mobile', 'addressLine', 'city', 'state', 'pincode'].includes(field)} maxLength={field === 'mobile' ? 10 : field === 'pincode' ? 6 : undefined} value={addressDraft[field]} onChange={event => setAddressDraft(current => current && ({ ...current, [field]: field === 'mobile' || field === 'pincode' ? event.target.value.replace(/\D/g, '') : event.target.value }))} className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand-primary" />
                  </label>)}
                  <label className="text-xs font-semibold text-slate-700">Address type<select value={addressDraft.type} onChange={event => setAddressDraft(current => current && ({ ...current, type: event.target.value as AddressDraft['type'] }))} className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"><option value="HOME">Home</option><option value="WORK">Work</option><option value="OTHER">Other</option></select></label>
                  <label className="flex items-center gap-2 self-end rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700"><input type="checkbox" checked={addressDraft.isDefault} onChange={event => setAddressDraft(current => current && ({ ...current, isDefault: event.target.checked }))} /> Set as default</label>
                </div>
                {addressError && <p role="alert" className="mt-3 text-xs text-rose-600">{addressError}</p>}
                <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setAddressDraft(null)} className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">Cancel</button><button type="submit" disabled={savingAddress} className="rounded-xl bg-brand-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{savingAddress ? 'Saving…' : 'Save address'}</button></div>
              </form>}
              {user.addresses && user.addresses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {user.addresses.map((addr: any) => (
                    <div key={addr.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{addr.fullName}</span>
                        {addr.isDefault && (
                          <span className="bg-indigo-50 text-brand-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600">{addr.mobile}</p>
                      <p className="text-slate-600">{addr.addressLine}</p>
                      {addr.apartment && <p className="text-slate-600">{addr.apartment}</p>}
                      {addr.landmark && <p className="text-slate-600">Near {addr.landmark}</p>}
                      <p className="text-slate-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                      {pendingDeleteAddressId === addr.id ? <div className="mt-3 rounded-xl bg-rose-50 p-3 text-rose-800"><p className="font-semibold">Delete this address?</p><div className="mt-2 flex gap-2"><button type="button" disabled={deletingAddress} onClick={() => deleteAddress(addr.id)} className="rounded-lg bg-rose-600 px-3 py-1.5 font-bold text-white disabled:opacity-50">{deletingAddress ? 'Deleting…' : 'Delete'}</button><button type="button" disabled={deletingAddress} onClick={() => setPendingDeleteAddressId(null)} className="rounded-lg px-3 py-1.5 font-bold text-slate-700 hover:bg-white">Cancel</button></div></div> : <div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={() => beginAddress(addr)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 font-bold text-brand-primary hover:bg-indigo-50"><Pencil size={13} /> Edit address</button><button type="button" onClick={() => { setPendingDeleteAddressId(addr.id); setAddressError(''); }} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 font-bold text-rose-600 hover:bg-rose-50"><Trash2 size={13} /> Delete address</button></div>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-xs text-slate-500">
                  No saved addresses yet. Addresses are saved automatically when you place an order.
                </div>
              )}
            </div>
          )}

          {/* SUPPORT TAB */}
          {activeTab === 'support' && (
            <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">Customer Support Desk</h2>
                <p className="text-xs text-slate-500 mt-0.5">Need help with an order, return, or invoice? Submit a ticket below.</p>
              </div>

              <form onSubmit={submitTicket} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={150}
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="e.g. Delivery status inquiry for order #P2B-2026-..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                  <textarea
                    required
                    minLength={10}
                    maxLength={5000}
                    rows={4}
                    value={ticketDesc}
                    onChange={(e) => setTicketDesc(e.target.value)}
                    placeholder="Provide details about your query..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-brand-primary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingTicket}
                  className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingTicket ? 'Submitting…' : 'Submit Ticket'}</span>
                </button>
              </form>

              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-sm font-bold text-slate-900">Your tickets</h3>
                <p className="mt-1 text-xs text-slate-500">Replies from Pick2Buy support appear here.</p>
                {ticketsLoading && <p className="mt-4 text-xs text-slate-500">Loading tickets…</p>}
                {ticketsError && <p role="alert" className="mt-4 text-xs text-rose-600">{ticketsError}</p>}
                {!ticketsLoading && !ticketsError && tickets.length === 0 && <p className="mt-4 rounded-xl bg-slate-50 p-4 text-xs text-slate-500">No support tickets yet.</p>}
                <div className="mt-4 space-y-3">
                  {tickets.map((ticket: any) => <details key={ticket.id} className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 open:bg-white">
                    <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 text-xs marker:hidden">
                      <span className="font-bold text-slate-900">{ticket.subject}</span>
                      <span className="flex items-center gap-2"><span className="font-mono text-slate-500">{ticket.ticketNumber}</span><span className="rounded-full bg-indigo-50 px-2 py-1 font-bold text-brand-primary">{ticket.status.replaceAll('_', ' ')}</span></span>
                    </summary>
                    <p className="mt-3 whitespace-pre-wrap text-xs leading-5 text-slate-700">{ticket.description}</p>
                    <p className="mt-2 text-[11px] text-slate-400">Sent {new Date(ticket.createdAt).toLocaleString('en-IN')}</p>
                    {ticket.messages?.map((message: any) => <div key={message.id} className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-xs">
                      <p className="font-bold text-brand-primary">Pick2Buy Support • {new Date(message.createdAt).toLocaleString('en-IN')}</p>
                      <p className="mt-1 whitespace-pre-wrap leading-5 text-slate-700">{message.message}</p>
                    </div>)}
                  </details>)}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
