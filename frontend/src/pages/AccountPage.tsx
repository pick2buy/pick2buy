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
  Send 
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import { formatINR } from '../lib/utils';

export const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, fetchMe } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'addresses' | 'support'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // New ticket state
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchMe();
    setIsLoading(true);

    api.getOrders()
      .then((res: any) => setOrders(res.data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24">
      {/* Account Hero Banner */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-brand-primary font-black text-2xl flex items-center justify-center border border-indigo-100">
            {user.name.charAt(0).toUpperCase()}
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
            <p className="text-xs text-slate-500">{user.email} • {user.phone || '+91 Not provided'}</p>
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
            <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-base font-bold text-slate-900">Personal Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-500 block mb-1">Full Name</label>
                  <p className="font-bold text-slate-900 text-sm">{user.name}</p>
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">Email Address</label>
                  <p className="font-bold text-slate-900 text-sm">{user.email}</p>
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">Mobile Phone</label>
                  <p className="font-bold text-slate-900 text-sm">{user.phone || '+91 Not provided'}</p>
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">Account Role</label>
                  <p className="font-bold text-brand-primary text-sm">{user.role}</p>
                </div>
              </div>
            </div>
          )}

          {/* ADDRESSES TAB */}
          {activeTab === 'addresses' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900">Saved Addresses</h2>
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
                      <p className="text-slate-600">{addr.city}, {addr.state} - {addr.pincode}</p>
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

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  alert('Your support inquiry has been logged with Pick2Buy Customer Care.');
                  setTicketSubject('');
                  setTicketDesc('');
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    required
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
                    rows={4}
                    value={ticketDesc}
                    onChange={(e) => setTicketDesc(e.target.value)}
                    placeholder="Provide details about your query..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-brand-primary"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Ticket</span>
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
