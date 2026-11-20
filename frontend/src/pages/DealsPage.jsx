import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import {
  ShieldCheck,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  Calculator,
} from 'lucide-react';

export default function DealsPage({ onNotify }) {
  const [groupedDeals, setGroupedDeals] = useState({});
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Current logged in user
  const currentUser = JSON.parse(localStorage.getItem('crm_user') || '{}');

  // New Deal Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    stage: 'NEW',
    customerId: '',
    loanType: 'HOME_LOAN',
    tenureMonths: 240,
    interestRate: 8.5,
    monthlyIncome: '',
  });
  const [formLoading, setFormLoading] = useState(false);

  // Approval note / reject reason modals
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: '', // 'APPROVE' | 'REJECT'
    deal: null,
    reason: '',
  });
  const [actionLoading, setActionLoading] = useState(false);

  const STAGES = [
    { key: 'NEW', label: 'New', color: 'border-t-blue-500' },
    { key: 'CONTACTED', label: 'Contacted', color: 'border-t-indigo-500' },
    { key: 'DOCUMENTS', label: 'Documents', color: 'border-t-amber-500' },
    { key: 'VERIFICATION', label: 'Verification', color: 'border-t-purple-500' },
    { key: 'APPROVED', label: 'Approved', color: 'border-t-emerald-500' },
    { key: 'WON', label: 'Won / Disbursed', color: 'border-t-green-600' },
  ];

  const fetchDeals = async () => {
    setIsLoading(true);
    try {
      const [dealsRes, customersRes] = await Promise.all([
        api.getDeals({ groupBy: 'stage' }),
        api.getCustomers(),
      ]);
      setGroupedDeals(dealsRes.grouped || {});
      setCustomers(customersRes.customers || []);
    } catch (err) {
      onNotify?.(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const handleStageChange = async (dealId, newStage) => {
    try {
      await api.updateDealStage(dealId, newStage);
      onNotify?.(`Stage moved to ${newStage}`, 'success');
      fetchDeals();
    } catch (err) {
      onNotify?.(err.message, 'error');
    }
  };

  const handleCreateDeal = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await api.createDeal({
        title: formData.title,
        amount: parseFloat(formData.amount),
        stage: formData.stage,
        customerId: formData.customerId || undefined,
        loanType: formData.loanType,
        tenureMonths: parseInt(formData.tenureMonths, 10),
        interestRate: parseFloat(formData.interestRate),
        monthlyIncome: formData.monthlyIncome ? parseFloat(formData.monthlyIncome) : undefined,
      });
      onNotify?.('Loan deal created with automated banking eligibility check!', 'success');
      setIsModalOpen(false);
      setFormData({
        title: '',
        amount: '',
        stage: 'NEW',
        customerId: '',
        loanType: 'HOME_LOAN',
        tenureMonths: 240,
        interestRate: 8.5,
        monthlyIncome: '',
      });
      fetchDeals();
    } catch (err) {
      onNotify?.(err.message, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmitForApproval = async (dealId) => {
    try {
      await api.submitDealApproval(dealId);
      onNotify?.('Deal submitted for Checker approval!', 'success');
      fetchDeals();
    } catch (err) {
      onNotify?.(err.message, 'error');
    }
  };

  const handleConfirmAction = async (e) => {
    e.preventDefault();
    if (!actionModal.deal) return;

    setActionLoading(true);
    try {
      if (actionModal.type === 'APPROVE') {
        await api.approveDeal(actionModal.deal.id, actionModal.reason);
        onNotify?.('Deal approved successfully by Checker!', 'success');
      } else {
        await api.rejectDeal(actionModal.deal.id, actionModal.reason);
        onNotify?.('Deal rejected by Checker with formal reason.', 'info');
      }
      setActionModal({ isOpen: false, type: '', deal: null, reason: '' });
      fetchDeals();
    } catch (err) {
      onNotify?.(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getApprovalBadge = (deal) => {
    const status = deal.approvalStatus || 'DRAFT';
    switch (status) {
      case 'SUBMITTED_FOR_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
            <Clock className="w-3 h-3" /> Awaiting Checker
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Sanctioned
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs text-[#64748B]">Banking Pipeline &bull; Maker-Checker Compliant</div>
          <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] flex items-center gap-2">
            Deals & Loan Sanction Pipeline
          </h2>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <Badge variant="primary">Kanban View</Badge>
          <Button onClick={() => setIsModalOpen(true)}>+ New Loan Deal</Button>
        </div>
      </div>

      {/* Kanban Board Columns Container */}
      <div className="overflow-x-auto custom-scrollbar pb-6 -mx-4 sm:mx-0 px-4 sm:px-0">
        <div className="flex gap-3.5 min-w-[1050px] lg:grid lg:grid-cols-6 lg:min-w-0">
          {STAGES.map((st) => {
            const columnData = groupedDeals[st.key] || { count: 0, totalAmount: 0, deals: [] };
            return (
              <div
                key={st.key}
                className={`w-[280px] lg:w-auto shrink-0 lg:shrink bg-[#F1F5F9] p-3 rounded-xl border border-[#E2E8F0] border-t-4 ${st.color} flex flex-col min-h-[500px]`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E2E8F0]">
                  <div>
                    <div className="text-xs font-bold text-[#0F172A]">{st.label}</div>
                    <div className="text-[10px] text-[#64748B]">
                      ₹{(columnData.totalAmount || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-white text-[#0F172A] px-2 py-0.5 rounded-full border border-[#CBD5E1]">
                    {columnData.count}
                  </span>
                </div>

                {/* Deal Cards */}
                <div className="space-y-2.5 flex-1 overflow-y-auto custom-scrollbar">
                  {isLoading ? (
                    <div className="text-[11px] text-[#64748B] text-center py-4">Loading...</div>
                  ) : columnData.deals.length === 0 ? (
                    <div className="text-[10px] text-[#94A3B8] text-center py-8">No deals in this stage</div>
                  ) : (
                    columnData.deals.map((deal) => {
                      const isOwner = deal.ownerId === currentUser.id;
                      const isChecker = currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN';
                      const canApprove = isChecker && !isOwner && deal.approvalStatus === 'SUBMITTED_FOR_APPROVAL';

                      return (
                        <div
                          key={deal.id}
                          className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-sm hover:shadow transition space-y-2"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold bg-blue-50 text-[#0F357E] px-1.5 py-0.5 rounded">
                              {deal.loanType || 'LOAN'}
                            </span>
                            {getApprovalBadge(deal)}
                          </div>

                          <div className="text-xs font-bold text-[#0F172A] leading-snug">{deal.title}</div>
                          
                          <div className="flex items-baseline justify-between">
                            <div className="text-xs font-bold text-[#1E3A8A]">
                              ₹{deal.amount.toLocaleString('en-IN')}
                            </div>
                            {deal.interestRate && (
                              <span className="text-[10px] text-[#64748B]">
                                @{deal.interestRate}% ({deal.tenureMonths}m)
                              </span>
                            )}
                          </div>

                          {/* Customer & Eligibility Indicator */}
                          {deal.customer && (
                            <div className="text-[10px] text-[#475569] flex items-center justify-between bg-[#F8FAFC] p-1.5 rounded">
                              <span className="truncate font-semibold">{deal.customer.name}</span>
                              <span className={`text-[9px] font-bold px-1 rounded ${
                                deal.customer.kycStatus === 'VERIFIED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : deal.customer.kycStatus === 'REJECTED'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                KYC: {deal.customer.kycStatus || 'PENDING'}
                              </span>
                            </div>
                          )}

                          {/* Maker-Checker Workflow Action Area */}
                          <div className="pt-2 border-t border-[#F1F5F9] space-y-1.5">
                            {/* Maker Submit Button */}
                            {(deal.approvalStatus === 'DRAFT' || deal.approvalStatus === 'REJECTED') && (
                              <button
                                onClick={() => handleSubmitForApproval(deal.id)}
                                className="w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded bg-blue-50 hover:bg-blue-100 text-[#0F357E] text-[10px] font-bold border border-blue-200 transition"
                              >
                                <Send className="w-3 h-3" /> Submit for Sanction
                              </button>
                            )}

                            {/* Checker Approve / Reject Buttons */}
                            {deal.approvalStatus === 'SUBMITTED_FOR_APPROVAL' && (
                              <div className="flex items-center gap-1.5">
                                {canApprove ? (
                                  <>
                                    <button
                                      onClick={() => setActionModal({ isOpen: true, type: 'APPROVE', deal, reason: '' })}
                                      className="flex-1 py-1 px-1.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200 transition text-center"
                                    >
                                      ✓ Sanction
                                    </button>
                                    <button
                                      onClick={() => setActionModal({ isOpen: true, type: 'REJECT', deal, reason: '' })}
                                      className="flex-1 py-1 px-1.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold border border-rose-200 transition text-center"
                                    >
                                      ✕ Reject
                                    </button>
                                  </>
                                ) : isOwner ? (
                                  <div className="w-full text-center text-[9px] text-[#94A3B8] italic py-0.5">
                                    Maker cannot check own deal
                                  </div>
                                ) : (
                                  <div className="w-full text-center text-[9px] text-[#94A3B8] italic py-0.5">
                                    Requires Manager / Admin Checker
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Quick Stage Mover */}
                            <div className="flex items-center justify-between text-[10px] text-[#64748B] pt-1">
                              <span>RM: {deal.owner?.name?.split(' ')[0] || 'Rep'}</span>
                              <select
                                value={deal.stage}
                                onChange={(e) => handleStageChange(deal.id, e.target.value)}
                                className="bg-[#F8FAFC] border border-[#CBD5E1] rounded px-1.5 py-0.5 text-[10px] font-semibold text-[#0F172A]"
                              >
                                {STAGES.map((s) => (
                                  <option key={s.key} value={s.key}>
                                    &rarr; {s.label}
                                  </option>
                                ))}
                                <option value="LOST">&rarr; Lost</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Deal Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Loan / Pipeline Deal">
        <form onSubmit={handleCreateDeal} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">Deal Title / Application *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs"
              placeholder="e.g. Ramesh Chandra - Home Loan Sanction"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">Customer</label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs bg-white"
              >
                <option value="">Select Customer (Optional)...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">Loan Product Type</label>
              <select
                value={formData.loanType}
                onChange={(e) => setFormData({ ...formData, loanType: e.target.value })}
                className="w-full border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs bg-white"
              >
                <option value="HOME_LOAN">Home Loan</option>
                <option value="PERSONAL_LOAN">Personal Loan</option>
                <option value="BUSINESS_LOAN">Business Loan</option>
                <option value="AUTO_LOAN">Auto / Vehicle Loan</option>
                <option value="GOLD_LOAN">Gold Loan</option>
                <option value="EDUCATION_LOAN">Education Loan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">Sanction Value (₹) *</label>
              <input
                type="number"
                required
                min="1000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs"
                placeholder="e.g. 5000000"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">Tenure (Months)</label>
              <input
                type="number"
                value={formData.tenureMonths}
                onChange={(e) => setFormData({ ...formData, tenureMonths: e.target.value })}
                className="w-full border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs"
                placeholder="240"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">Interest Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.interestRate}
                onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                className="w-full border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs"
                placeholder="8.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">Monthly Income (₹)</label>
              <input
                type="number"
                value={formData.monthlyIncome}
                onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
                className="w-full border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs"
                placeholder="e.g. 120000 (For EMI Check)"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">Initial Stage</label>
              <select
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                className="w-full border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs bg-white"
              >
                {STAGES.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={formLoading}>Create Loan Deal</Button>
          </div>
        </form>
      </Modal>

      {/* Checker Action Confirmation Modal */}
      {actionModal.isOpen && (
        <Modal
          isOpen={actionModal.isOpen}
          onClose={() => setActionModal({ isOpen: false, type: '', deal: null, reason: '' })}
          title={actionModal.type === 'APPROVE' ? 'Checker Approval & Sanction' : 'Checker Rejection Notice'}
        >
          <form onSubmit={handleConfirmAction} className="space-y-4">
            <p className="text-xs text-[#64748B]">
              {actionModal.type === 'APPROVE'
                ? `You are sanctioning deal "${actionModal.deal?.title}" for ₹${actionModal.deal?.amount?.toLocaleString('en-IN')}. Please provide approval notes.`
                : `You are rejecting deal "${actionModal.deal?.title}". Enter the formal compliance rejection reason.`}
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                {actionModal.type === 'APPROVE' ? 'Sanction Notes' : 'Rejection Reason *'}
              </label>
              <textarea
                rows={3}
                required={actionModal.type === 'REJECT'}
                value={actionModal.reason}
                onChange={(e) => setActionModal({ ...actionModal, reason: e.target.value })}
                className="w-full border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs"
                placeholder={
                  actionModal.type === 'APPROVE'
                    ? 'e.g. All documents verified, income eligibility satisfied, approved.'
                    : 'e.g. Inadequate CIBIL score or FOIR exceeds 50% limit.'
                }
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActionModal({ isOpen: false, type: '', deal: null, reason: '' })}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                variant={actionModal.type === 'APPROVE' ? 'success' : 'danger'}
                isLoading={actionLoading}
              >
                {actionModal.type === 'APPROVE' ? 'Confirm Sanction' : 'Confirm Rejection'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
