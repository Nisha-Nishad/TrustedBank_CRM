import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Lock,
  Calendar,
  User,
  Activity,
  FileCheck,
  CheckCircle2,
  XCircle,
  KeyRound,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';

export default function AuditLogsPage({ onNotify }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getActivityLogs({ limit: 100 });
      setLogs(res.activityLogs || res.logs || []);
    } catch (err) {
      onNotify?.(err.message || 'Failed to fetch audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action) => {
    if (action.includes('LOGIN')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <KeyRound className="w-3 h-3" /> {action}
        </span>
      );
    }
    if (action.includes('KYC_VERIFY') || action.includes('APPROVED')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" /> {action}
        </span>
      );
    }
    if (action.includes('REJECT')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3 h-3" /> {action}
        </span>
      );
    }
    if (action.includes('ROLE') || action.includes('USER')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <ShieldAlert className="w-3 h-3" /> {action}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
        <Activity className="w-3 h-3" /> {action}
      </span>
    );
  };

  const filteredLogs = logs.filter((log) => {
    const matchAction = actionFilter === 'ALL' || log.action === actionFilter;
    const matchSearch =
      searchQuery === '' ||
      log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof log.details === 'string' && log.details.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchAction && matchSearch;
  });

  // Calculate metrics
  const totalLogs = logs.length;
  const loginCount = logs.filter((l) => l.action?.includes('LOGIN')).length;
  const kycApprovals = logs.filter((l) => l.action?.includes('KYC_VERIFY') || l.action?.includes('APPROVED')).length;
  const roleChanges = logs.filter((l) => l.action?.includes('ROLE') || l.action?.includes('USER')).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-[#0F357E]" />
            Regulatory Audit Trail (Admin)
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Immutable, tamper-evident log of banking actions under RBI Compliance standards.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-[#CBD5E1] text-[#334155] text-xs font-semibold rounded-lg shadow-sm hover:bg-[#F8FAFC] transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Logs
        </button>
      </div>

      {/* Immutability Security Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
        <Lock className="w-5 h-5 text-[#0F357E] shrink-0 mt-0.5" />
        <div className="text-xs text-[#1E3A8A] space-y-1">
          <p className="font-bold">Tamper-Proof Immutability Policy Active</p>
          <p className="text-[#3B82F6]">
            Every system authorization event, KYC verification decision, Maker-Checker loan status shift, and user role upgrade is permanently stamped with timestamp, user identity, and metadata. In compliance with RBI banking regulations, these records are append-only and cannot be modified or cleared by any role.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm">
          <p className="text-xs font-medium text-[#64748B]">Total Audit Events</p>
          <p className="text-2xl font-bold text-[#0F172A] mt-1">{totalLogs}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm">
          <p className="text-xs font-medium text-blue-600">Authentication / Logins</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{loginCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm">
          <p className="text-xs font-medium text-emerald-600">KYC & Loan Approvals</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{kycApprovals}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm">
          <p className="text-xs font-medium text-purple-600">Access & Role Changes</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{roleChanges}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Filter by user, action type, or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#0F357E] focus:border-transparent"
            />
          </div>

          <div className="flex gap-2 shrink-0 overflow-x-auto">
            {['ALL', 'LOGIN', 'KYC_VERIFY', 'KYC_REJECT', 'DEAL_SUBMITTED', 'DEAL_APPROVED'].map((act) => (
              <button
                key={act}
                onClick={() => setActionFilter(act)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition shrink-0 ${
                  actionFilter === act
                    ? 'bg-[#0F357E] text-white shadow-sm'
                    : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                }`}
              >
                {act.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#64748B] text-sm">
            <div className="w-8 h-8 border-2 border-[#0F357E] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading regulatory audit records...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-[#64748B]">
            <ShieldCheck className="w-12 h-12 mx-auto text-[#CBD5E1] mb-3" />
            <p className="text-base font-semibold text-[#0F172A]">No audit logs match criteria</p>
            <p className="text-xs text-[#64748B] mt-1">Try resetting your search query or action filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Timestamp (IST)</th>
                  <th className="py-3 px-4">Actor / User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Audit Details & Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredLogs.map((log) => {
                  const dateObj = new Date(log.createdAt);
                  const formattedTime = dateObj.toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <tr key={log.id} className="hover:bg-[#F8FAFC] transition">
                      <td className="py-3 px-4 whitespace-nowrap text-[#64748B] font-mono">
                        {formattedTime}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#E2E8F0] flex items-center justify-center font-bold text-[#0F357E] text-[10px]">
                            {log.user?.name?.[0] || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-[#0F172A]">{log.user?.name || 'System Actor'}</p>
                            <span className="text-[10px] text-[#64748B] bg-slate-100 px-1.5 py-0.5 rounded">
                              {log.user?.role || 'SYSTEM'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold text-[#334155]">
                          {log.entityType || 'SYSTEM'}
                        </span>
                        {log.entityId && (
                          <span className="block font-mono text-[10px] text-[#94A3B8] truncate max-w-[120px]">
                            #{log.entityId}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#475569]">
                        {typeof log.details === 'object' ? (
                          <pre className="text-[10px] font-mono bg-[#F8FAFC] p-1.5 rounded border border-[#E2E8F0] max-w-md overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        ) : (
                          <span className="text-xs">{log.details || '—'}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
