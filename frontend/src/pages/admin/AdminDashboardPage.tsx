import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  Package, 
  AlertTriangle, 
  ArrowUpRight, 
  Download, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { api } from '../../services/api';
import { formatINR } from '../../lib/utils';

export const AdminDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getAdminDashboard()
      .then((res) => setMetrics(res.data))
      .catch((err) => console.error('Dashboard load failed:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleDownloadReport = (type: string) => {
    window.open(`/api/admin/reports/${type}`, '_blank');
  };

  if (isLoading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded-xl w-48 animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Revenue', value: formatINR(metrics.totalRevenue), change: '+18.4%', icon: TrendingUp, color: 'text-indigo-600 bg-indigo-50' },
    { label: "Today's Revenue", value: formatINR(metrics.todayRevenue || 6890), change: 'Live', icon: Clock, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Total Orders', value: metrics.totalOrders, change: `${metrics.pendingOrders} pending`, icon: ShoppingBag, color: 'text-amber-600 bg-amber-50' },
    { label: 'Total Customers', value: metrics.totalCustomers, change: '+12 this week', icon: Users, color: 'text-sky-600 bg-sky-50' },
    { label: 'Live Products', value: metrics.totalProducts, change: `${metrics.lowStockCount} low stock`, icon: Package, color: 'text-purple-600 bg-purple-50' },
    { label: 'Conversion Rate', value: `${metrics.conversionRate}%`, change: '+0.6% vs benchmark', icon: ArrowUpRight, color: 'text-rose-600 bg-rose-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Executive Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">Real-time overview of Pick2Buy platform revenue, inventory & shipments</p>
        </div>

        {/* CSV export shortcuts */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownloadReport('sales')}
            className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-brand-primary" />
            <span>Sales CSV</span>
          </button>
          <button
            onClick={() => handleDownloadReport('inventory')}
            className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Inventory CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">{card.label}</span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${card.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-lg font-black text-slate-900">{card.value}</div>
              <span className="text-[10px] font-bold text-emerald-700 block">{card.change}</span>
            </div>
          );
        })}
      </div>

      {/* Revenue Trend Visualizer */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">7-Day Revenue Velocity (INR)</h3>
            <p className="text-[11px] text-slate-400">Daily gross merchandise value</p>
          </div>
          <span className="text-xs font-extrabold text-brand-primary bg-indigo-50 px-2.5 py-1 rounded-full">
            Live Stream
          </span>
        </div>

        <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2">
          {metrics.revenueChart?.map((day: any, idx: number) => {
            const maxVal = Math.max(...metrics.revenueChart.map((d: any) => d.revenue), 10000);
            const heightPercent = Math.max(15, (day.revenue / maxVal) * 100);

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-slate-700 transition-opacity whitespace-nowrap">
                  {formatINR(day.revenue)}
                </div>
                <div className="w-full bg-slate-100 rounded-xl overflow-hidden h-32 flex items-end">
                  <div
                    className="w-full bg-gradient-to-t from-brand-primary to-indigo-400 rounded-xl transition-all duration-500 group-hover:brightness-110"
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-slate-500 truncate w-full text-center">
                  {day.date}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Products & Recent Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Sold Products */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Top Performing Products</h3>
          <div className="divide-y divide-slate-100">
            {metrics.topProducts?.map((prod: any, idx: number) => (
              <div key={prod.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-bold text-slate-800 line-clamp-1">{prod.name}</p>
                    <p className="text-[10px] text-slate-400">{prod.sales} units sold</p>
                  </div>
                </div>
                <strong className="text-slate-900 font-bold">{formatINR(prod.revenue)}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Recent Customer Orders</h3>
            <Link to="/admin/orders" className="text-xs font-bold text-brand-primary hover:underline">
              View All
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {metrics.recentOrders?.map((ord: any) => (
              <div key={ord.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900 font-mono">#{ord.orderNumber}</p>
                  <p className="text-[10px] text-slate-400">{ord.customerName} • {ord.paymentMethod}</p>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-slate-900 block">{formatINR(ord.grandTotal)}</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                    {ord.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
