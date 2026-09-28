import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Clock, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';

export const AdminAuditPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = () => {
    setIsLoading(true);
    api.getAdminAuditLogs()
      .then((res) => setLogs(res.data || []))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Security & Audit Trail</h1>
          <p className="text-xs text-slate-500 mt-1">Immutable administrative action ledger and compliance records</p>
        </div>

        <button
          onClick={loadLogs}
          className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Audit Logs</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Action Performed</th>
                <th className="py-3.5 px-4">Entity / Resource</th>
                <th className="py-3.5 px-4">User Email</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Audit Payload Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    No recent administrative mutations recorded.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-brand-primary bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {log.resource} {log.resourceId ? `(#${log.resourceId.substring(0, 8)})` : ''}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{log.userEmail || 'System / Admin'}</td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(log.createdAt).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-[10px] font-mono text-slate-500 max-w-xs truncate">
                      {log.newValue || log.oldValue || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
