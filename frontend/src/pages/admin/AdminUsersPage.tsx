import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
export const AdminUsersPage = () => {
  const [users, setUsers] = useState<any[]>([]), [query, setQuery] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState('');
  const canEdit = ['ADMIN', 'MANAGER'].includes(useAuthStore(s => s.user?.role || ''));
  const load = () => api.commerce('/admin/users').then(r => setUsers(r.data)).catch(e => setError(e.message));
  useEffect(() => { void load(); }, []);
  const block = async (user: any) => {
    setBusy(user.id); setError('');
    try { await api.commerce(`/admin/users/${user.id}/block`, 'PATCH', { isBlocked: !user.isBlocked }); await load(); } catch (e: any) { setError(e.message); } finally { setBusy(''); }
  };
  return <section className="space-y-5"><h1 className="text-2xl font-bold">Customers</h1><input aria-label="Search customers" placeholder="Search name or email" value={query} onChange={e => setQuery(e.target.value)} className="rounded-xl border p-3 w-full" />{error && <p role="alert" className="text-red-600">{error}</p>}<div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-sm"><thead><tr>{['Customer', 'Email', 'Phone', 'Orders', 'Status', 'Action'].map(t => <th key={t} className="p-3 text-left">{t}</th>)}</tr></thead><tbody>{users.filter(u => (u.name + u.email).toLowerCase().includes(query.toLowerCase())).map(u => <tr key={u.id} className="border-t"><td className="p-3">{u.name}</td><td>{u.email}</td><td>{u.phone || '—'}</td><td>{u._count.orders}</td><td>{u.isBlocked ? 'Blocked' : 'Active'}</td><td>{canEdit && <button disabled={busy === u.id} onClick={() => void block(u)} className="rounded-lg border px-3 py-2">{u.isBlocked ? 'Unblock' : 'Block'}</button>}</td></tr>)}</tbody></table>{!users.length && <p className="p-5">No customers found.</p>}</div></section>;
};
