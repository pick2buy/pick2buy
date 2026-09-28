import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Boxes, 
  Users, 
  Tag, 
  LifeBuoy, 
  ShieldAlert, 
  ArrowLeft,
  FileText
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'Orders & Shipments', icon: ShoppingBag, path: '/admin/orders' },
    { label: 'Products Catalog', icon: Package, path: '/admin/products' },
    { label: 'Inventory & Alerts', icon: Boxes, path: '/admin/inventory' },
    { label: 'CRM Leads Pipeline', icon: Users, path: '/admin/crm' },
    { label: 'Support Tickets', icon: LifeBuoy, path: '/admin/tickets' },
    { label: 'Promos & Coupons', icon: Tag, path: '/admin/coupons' },
    { label: 'Security & Audit Logs', icon: ShieldAlert, path: '/admin/audit' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col fixed inset-y-0 left-0 z-30 shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-primary text-white font-black flex items-center justify-center text-sm">
              P2B
            </div>
            <div>
              <h2 className="font-extrabold text-white text-sm tracking-tight leading-none">Pick2Buy</h2>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Admin Control</span>
            </div>
          </div>
        </div>

        {/* Demo banner */}
        <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-[10px] text-amber-300 font-medium">
          Logged in as: <strong>{user?.name || 'Administrator'}</strong>
        </div>

        {/* Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-brand-primary text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Return to storefront */}
        <div className="p-3 border-t border-slate-800">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Storefront</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};
