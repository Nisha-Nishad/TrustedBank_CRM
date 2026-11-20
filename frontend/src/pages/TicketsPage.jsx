import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  Plus,
  Search,
  Filter,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  User,
  Building,
  Calendar,
  X,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../services/api';

export default function TicketsPage({ onNotify, onViewCustomer360 }) {
  const [tickets, setTickets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // New ticket form
  const [formData, setFormData] = useState({
    customerId: '',
    title: '',
    description: '',
    priority: 'MEDIUM',
    category: 'GENERAL',
  });

  const currentUser = JSON.parse(localStorage.getItem('crm_user') || '{}');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ticketRes, customerRes] = await Promise.all([
        api.getTickets(),
        api.getCustomers(),
      ]);
      setTickets(ticketRes.tickets || []);
      setCustomers(customerRes.customers || []);
    } catch (err) {
      onNotify?.(err.message || 'Failed to load tickets', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!formData.customerId || !formData.title.trim()) {
      onNotify?.('Please select a customer and enter a title', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.createTicket(formData);
      onNotify?.('Support ticket created with automated SLA timer', 'success');
      setIsCreateModalOpen(false);
      setFormData({
        customerId: '',
        title: '',
        description: '',
        priority: 'MEDIUM',
        category: 'GENERAL',
      });
      loadData();
    } catch (err) {
      onNotify?.(err.message || 'Failed to create ticket', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (ticket, newStatus) => {
    if (newStatus === 'RESOLVED') {
      setSelectedTicket(ticket);
      setResolutionNotes('');
      setIsResolveModalOpen(true);
      return;
    }

    try {
      await api.updateTicketStatus(ticket.id, newStatus);
      onNotify?.(`Ticket marked as ${newStatus.replace('_', ' ')}`, 'success');
      loadData();
    } catch (err) {
      onNotify?.(err.message || 'Failed to update ticket status', 'error');
    }
  };

  const handleConfirmResolve = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setSubmitting(true);
    try {
      await api.updateTicketStatus(selectedTicket.id, 'RESOLVED', resolutionNotes);
      onNotify?.('Ticket marked as Resolved with audit note', 'success');
      setIsResolveModalOpen(false);
      setSelectedTicket(null);
      loadData();
    } catch (err) {
      onNotify?.(err.message || 'Failed to resolve ticket', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    const titleText = t.title || t.subject || '';
    const matchSearch =
      searchQuery === '' ||
      t.ticketNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      titleText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchPriority && matchSearch;
  });

  // Calculate Metrics
  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED').length;

  // SLA calculations helper
  const getSlaBadge = (ticket) => {
    if (ticket.status === 'RESOLVED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
        </span>
      );
    }

    const dueField = ticket.dueDate || ticket.slaDueDate;
    if (!dueField) return null;
    const due = new Date(dueField).getTime();
    const now = Date.now();
    const diffHours = (due - now) / (1000 * 60 * 60);

    if (diffHours < 0) {
      const overdueHours = Math.abs(Math.round(diffHours));
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
          <AlertCircle className="w-3.5 h-3.5" /> SLA Breached ({overdueHours}h ago)
        </span>
      );
    } else if (diffHours <= 12) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3.5 h-3.5" /> {Math.round(diffHours)}h left (Critical)
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <Clock className="w-3.5 h-3.5" /> {Math.round(diffHours)}h SLA left
        </span>
      );
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'URGENT':
        return <span className="px-2 py-0.5 text-xs font-bold bg-rose-100 text-rose-800 rounded">URGENT (24h)</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 rounded">HIGH (48h)</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">MEDIUM (72h)</span>;
      case 'LOW':
      default:
        return <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded">LOW (5d)</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-700 rounded-full border border-rose-200">OPEN</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-700 rounded-full border border-amber-200">IN PROGRESS</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">RESOLVED</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight flex items-center gap-2.5">
            <LifeBuoy className="w-6 h-6 text-[#0F357E]" />
            Complaints & Service Tickets
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Automated SLA monitoring, priority assignment, and resolution audit trail.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F357E] text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-[#0B2559] transition"
        >
          <Plus className="w-4 h-4" />
          Raise Support Ticket
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm">
          <p className="text-xs font-medium text-[#64748B]">Total Registered</p>
          <p className="text-2xl font-bold text-[#0F172A] mt-1">{totalCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm">
          <p className="text-xs font-medium text-rose-600">Pending Action (Open)</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{openCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm">
          <p className="text-xs font-medium text-amber-600">Under Investigation</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{inProgressCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm">
          <p className="text-xs font-medium text-emerald-600">Resolved & Closed</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{resolvedCount}</p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search by ticket #, subject, or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#0F357E] focus:border-transparent"
            />
          </div>

          <div className="flex gap-2 shrink-0 overflow-x-auto">
            {/* Status Pills */}
            {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition shrink-0 ${
                  statusFilter === st
                    ? 'bg-[#0F357E] text-white shadow-sm'
                    : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#F1F5F9] text-xs text-[#64748B]">
          <span className="font-semibold text-[#334155]">Priority:</span>
          {['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((pr) => (
            <button
              key={pr}
              onClick={() => setPriorityFilter(pr)}
              className={`px-2.5 py-1 rounded-md transition ${
                priorityFilter === pr
                  ? 'bg-[#1E293B] text-white font-bold'
                  : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              {pr}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets List / Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#64748B] text-sm">
            <div className="w-8 h-8 border-2 border-[#0F357E] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading support tickets...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-12 text-center text-[#64748B]">
            <LifeBuoy className="w-12 h-12 mx-auto text-[#CBD5E1] mb-3" />
            <p className="text-base font-semibold text-[#0F172A]">No support tickets found</p>
            <p className="text-xs text-[#64748B] mt-1">
              {searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
                ? 'Try adjusting your filters or search keywords'
                : 'Click "Raise Support Ticket" to log a customer complaint or request'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F1F5F9]">
            {filteredTickets.map((t) => (
              <div
                key={t.id}
                className="p-4 sm:p-5 hover:bg-[#F8FAFC] transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#0F357E] bg-blue-50 px-2 py-0.5 rounded">
                      {t.ticketNumber}
                    </span>
                    {getPriorityBadge(t.priority)}
                    {getStatusBadge(t.status)}
                    {getSlaBadge(t)}
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-[#0F172A] truncate">
                    {t.title || t.subject}
                  </h3>

                  {t.description && (
                    <p className="text-xs text-[#475569] line-clamp-2 max-w-2xl">
                      {t.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#64748B] pt-1">
                    {t.customer && (
                      <button
                        onClick={() => onViewCustomer360?.(t.customer.id)}
                        className="inline-flex items-center gap-1 font-semibold text-[#0F357E] hover:underline"
                      >
                        <User className="w-3.5 h-3.5" />
                        {t.customer.name}
                      </button>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Building className="w-3.5 h-3.5" />
                      Category: {t.category}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Created: {new Date(t.createdAt).toLocaleDateString()}
                    </span>
                    {t.assignedTo && (
                      <span>Assignee: {t.assignedTo.name}</span>
                    )}
                  </div>

                  {t.resolutionNotes && (
                    <div className="mt-2 text-xs bg-emerald-50 text-emerald-800 p-2.5 rounded-lg border border-emerald-200">
                      <strong>Resolution Note:</strong> {t.resolutionNotes}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#F1F5F9]">
                  {t.status === 'OPEN' && (
                    <button
                      onClick={() => handleStatusChange(t, 'IN_PROGRESS')}
                      className="px-3 py-1.5 text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg border border-amber-200 transition"
                    >
                      Start Work
                    </button>
                  )}
                  {t.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleStatusChange(t, 'RESOLVED')}
                      className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition"
                    >
                      Resolve Ticket
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Raise Ticket Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#E2E8F0] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-[#0F357E]" />
                Raise Service Request / Complaint
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#94A3B8] hover:text-[#0F172A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">
                  Customer *
                </label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-[#CBD5E1] focus:ring-2 focus:ring-[#0F357E] focus:outline-none"
                  required
                >
                  <option value="">Select Customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email || c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">
                  Ticket Title / Subject *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Loan Disbursal Query / Cheque Book Delayed"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-[#CBD5E1] focus:ring-2 focus:ring-[#0F357E] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">
                    Priority (Auto-SLA)
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-[#CBD5E1] focus:ring-2 focus:ring-[#0F357E] focus:outline-none"
                  >
                    <option value="URGENT">URGENT (24h SLA)</option>
                    <option value="HIGH">HIGH (48h SLA)</option>
                    <option value="MEDIUM">MEDIUM (72h SLA)</option>
                    <option value="LOW">LOW (5 Days SLA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-[#CBD5E1] focus:ring-2 focus:ring-[#0F357E] focus:outline-none"
                  >
                    <option value="GENERAL">General Banking</option>
                    <option value="LOAN_DISPUTE">Loan / Disbursal Dispute</option>
                    <option value="TRANSACTION_ISSUE">Transaction Discrepancy</option>
                    <option value="CARD_ISSUE">Card Services</option>
                    <option value="KYC_ISSUE">KYC Verification</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">
                  Description / Remarks
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide detailed information regarding the customer's grievance or request..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-[#CBD5E1] focus:ring-2 focus:ring-[#0F357E] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F1F5F9]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#0F357E] text-white text-xs font-bold rounded-lg hover:bg-[#0B2559] disabled:opacity-50 transition"
                >
                  {submitting ? 'Creating...' : 'Log Ticket & Start SLA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Ticket Modal */}
      {isResolveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E2E8F0] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <h3 className="text-base font-bold text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Resolve Ticket #{selectedTicket?.ticketNumber}
              </h3>
              <button
                onClick={() => setIsResolveModalOpen(false)}
                className="text-[#94A3B8] hover:text-[#0F172A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmResolve} className="space-y-4">
              <p className="text-xs text-[#64748B]">
                Please enter the resolution summary provided to the customer. This will be permanently recorded in the bank audit log.
              </p>

              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">
                  Resolution Summary *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Issue resolved after contacting backend payment ops. Customer informed via SMS."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-[#CBD5E1] focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F1F5F9]">
                <button
                  type="button"
                  onClick={() => setIsResolveModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                  {submitting ? 'Resolving...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
