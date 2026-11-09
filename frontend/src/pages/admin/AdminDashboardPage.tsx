import { useEffect, useState } from 'react';
import { AdminSalesPage } from './AdminSalesPage';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
export const AdminDashboardPage = () => {
  const [metrics, setMetrics] = useState<any>(null), [error, setError] = useState('');
  const admin = ['ADMIN', 'MANAGER'].includes(useAuthStore(s => s.user?.role || ''));
  useEffect(() => { api.getAdminDashboard().then(r => setMetrics(r.data)).catch(e => setError(e.message)); }, []);
  return <div className="space-y-6"><h1 className="text-2xl font-bold">Dashboard</h1>{error && <p role="alert">{error}</p>}{metrics && <div className="grid grid-cols-2 gap-4 md:grid-cols-5">{Object.entries(metrics).map(([key, value]) => <div key={key} className="rounded-xl border bg-white p-4"><p className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</p><strong className="text-xl">{String(value)}</strong></div>)}</div>}{admin && <AdminSalesPage />}</div>;
};
