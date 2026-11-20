import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import {
  ArrowLeft,
  FileCheck2,
  AlertCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Plus,
  Send,
  LifeBuoy,
  CreditCard,
  DollarSign,
} from 'lucide-react';

export default function CustomerDetailPage({ customerId, onBack, onNotify }) {
  const [customer, setCustomer] = useState(null);
  const [notes, setNotes] = useState([]);
  const [kycData, setKycData] = useState({ documents: [], overallKycStatus: 'PENDING' });
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Current logged in user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('crm_user') || '{}');
  const isManagerOrAdmin = currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN';

  // Notes state
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // KYC Modal state
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [kycForm, setKycForm] = useState({
    documentType: 'PAN',
    documentNumber: '',
  });
  const [isUploadingKyc, setIsUploadingKyc] = useState(false);

  // Ticket Modal state
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    title: '',
    description: '',
    category: 'GENERAL',
    priority: 'MEDIUM',
  });
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  // Active sub-tab in Customer 360
  const [activeTab, setActiveTab] = useState('loans'); // 'loans', 'kyc', 'tickets', 'notes'

  const fetchCustomer360 = async () => {
    setIsLoading(true);
    try {
      const [custRes, notesRes, kycRes, ticketRes] = await Promise.all([
        api.getCustomerById(customerId),
        api.getNotes({ relatedType: 'CUSTOMER', relatedId: customerId }),
        api.getKycDocuments(customerId).catch(() => ({ documents: [], overallKycStatus: 'PENDING' })),
        api.getTickets({ customerId }).catch(() => ({ tickets: [] })),
      ]);

      setCustomer(custRes.customer);
      setNotes(notesRes.notes || []);
      setKycData(kycRes || { documents: [], overallKycStatus: 'PENDING' });
      setTickets(ticketRes.tickets || []);
    } catch (err) {
      onNotify?.(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchCustomer360();
    }
  }, [customerId]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    setIsAddingNote(true);
    try {
      await api.createNote({
        content: newNoteContent,
        relatedType: 'CUSTOMER',
        relatedId: customerId,
      });
      onNotify?.('Note added successfully!', 'success');
      setNewNoteContent('');
      const notesRes = await api.getNotes({ relatedType: 'CUSTOMER', relatedId: customerId });
      setNotes(notesRes.notes || []);
    } catch (err) {
      onNotify?.(err.message, 'error');
    } finally {
      setIsAddingNote(false);
    }
  };

  // Upload KYC Document
  const handleUploadKyc = async (e) => {
    e.preventDefault();
    if (!kycForm.documentNumber.trim()) return;

    setIsUploadingKyc(true);
    try {
      await api.addKycDocument(customerId, kycForm);
      onNotify?.(`${kycForm.documentType} document submitted for verification!`, 'success');
      setIsKycModalOpen(false);
      setKycForm({ documentType: 'PAN', documentNumber: '' });
      fetchCustomer360();
    } catch (err) {
      onNotify?.(err.message, 'error');
    } finally {
      setIsUploadingKyc(false);
    }
  };

  // Verify KYC Document (Manager / Admin)
  const handleVerifyKyc = async (docId) => {
    try {
      const res = await api.verifyKycDocument(docId);
      onNotify?.('Document verified! Overall customer KYC updated.', 'success');
      fetchCustomer360();
    } catch (err) {
      onNotify?.(err.message, 'error');
    }
  };

  // Reject KYC Document (Manager / Admin)
  const handleRejectKyc = async (docId) => {
    const reason = prompt('Please enter the regulatory rejection reason (e.g. Document expired / illegible):');
    if (!reason || !reason.trim()) return;

    try {
      await api.rejectKycDocument(docId, reason.trim());
      onNotify?.('Document rejected. Customer overall KYC marked as REJECTED.', 'warning');
      fetchCustomer360();
    } catch (err) {
      onNotify?.(err.message, 'error');
    }
  };

  // Submit Deal for Approval (Maker)
  const handleSubmitDealApproval = async (dealId) => {
    try {
      await api.submitDealApproval(dealId);
      onNotify?.('Deal submitted for Credit Committee approval!', 'success');
      fetchCustomer360();
    } catch (err) {
      onNotify?.(err.message, 'error');
    }
  };

  // Approve Deal (Checker: Manager / Admin)
  const handleApproveDeal = async (deal) => {
    // Check KYC status on client first for friendly UX
    if (kycData.overallKycStatus === 'REJECTED') {
      alert('❌ Cannot approve deal: Customer KYC status is REJECTED. KYC compliance verification must pass before sanction.');
      return;
    }

    if (deal.ownerId === currentUser.id) {
      alert('❌ Maker-Checker Violation: You are the owner (Maker) of this deal. A separate Manager (Checker) must review and sanction it.');
      return;
    }

    const notes = prompt('Enter Credit Committee approval notes / Sanction terms:', 'Approved per Credit Policy');
    if (notes === null) return;

    try {
      await api.approveDeal(deal.id, notes);
      onNotify?.('Deal sanctioned and approved successfully! 🎉', 'success');
      fetchCustomer360();
    } catch (err) {
      onNotify?.(err.message, 'error');
    }
  };

  // Reject Deal (Checker)
  const handleRejectDeal = async (deal) => {
    const reason = prompt('Enter rejection reason for Credit File:', 'Underwriting debt-service limits exceeded');
    if (!reason || !reason.trim()) return;

    try {
      await api.rejectDeal(deal.id, reason.trim());
      onNotify?.('Deal marked as rejected.', 'warning');
      fetchCustomer360();
    } catch (err) {
      onNotify?.(err.message, 'error');
    }
  };

  // Create Support Ticket
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setIsCreatingTicket(true);
    try {
      await api.createTicket({ ...ticketForm, customerId });
      onNotify?.('Support ticket registered with SLA tracking!', 'success');
      setIsTicketModalOpen(false);
      setTicketForm({ title: '', description: '', category: 'GENERAL', priority: 'MEDIUM' });
      fetchCustomer360();
    } catch (err) {
      onNotify?.(err.message, 'error');
    } finally {
      setIsCreatingTicket(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-[#64748B]">Loading Customer 360 Full Banking View...</div>;
  }

  if (!customer) {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="text-xs text-[#DC2626]">Customer profile not found.</div>
        <Button size="sm" onClick={onBack}>&larr; Back to Customers</Button>
      </div>
    );
  }

  const kycStatusVariant = {
    VERIFIED: 'success',
    PENDING: 'warning',
    REJECTED: 'danger',
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
      {/* Back button & quick action */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E3A8A] hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Customers List
        </button>
        <span className="text-[11px] font-semibold text-[#64748B]">
          TrustBank 360° Banking View
        </span>
      </div>

      {/* Customer 360 Header Profile Card */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0F357E] text-white flex items-center justify-center text-xl font-bold shadow-md shrink-0">
            {customer.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-[#0F172A]">{customer.name}</h2>
              <Badge variant={kycStatusVariant[kycData.overallKycStatus] || 'warning'}>
                {kycData.overallKycStatus === 'VERIFIED' ? '✓ KYC Verified' : kycData.overallKycStatus === 'REJECTED' ? '❌ KYC Rejected' : '⏳ KYC Pending'}
              </Badge>
              <Badge variant="primary">{customer.type}</Badge>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#0F357E] border border-[#BFDBFE]">
                CIBIL Score: 785 (Prime)
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#64748B] mt-1.5">
              <span>Customer ID: <strong className="text-[#0F172A] font-mono">#{customer.id.slice(0, 8)}</strong></span>
              <span>&bull;</span>
              <span>Phone: <strong className="text-[#0F172A]">{customer.phone}</strong></span>
              <span>&bull;</span>
              <span>Email: <strong className="text-[#0F172A]">{customer.email}</strong></span>
              <span>&bull;</span>
              <span>City: <strong className="text-[#0F172A]">{customer.city || 'India'}</strong></span>
            </div>
          </div>
        </div>

        <div className="text-xs text-[#64748B] sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F1F5F9] shrink-0">
          <div>Assigned Relationship Manager</div>
          <div className="font-bold text-[#0F172A] text-sm">{customer.createdBy?.name || 'Assigned RM'}</div>
          <div className="text-[11px] text-[#16A34A] font-semibold mt-0.5">● Portfolio in Good Standing</div>
        </div>
      </div>

      {/* Customer 360 Tab Navigation */}
      <div className="border-b border-[#E2E8F0] flex gap-4 sm:gap-6 text-xs font-semibold overflow-x-auto custom-scrollbar flex-nowrap -mx-4 sm:mx-0 px-4 sm:px-0">
        {[
          { key: 'loans', label: `Loan Deals (${customer.deals?.length || 0})`, icon: CreditCard },
          { key: 'kyc', label: `KYC Documents (${kycData.documents?.length || 0})`, icon: FileCheck2 },
          { key: 'tickets', label: `Support Tickets (${tickets.length || 0})`, icon: LifeBuoy },
          { key: 'notes', label: `Interaction Notes (${notes.length})`, icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 pb-3 transition shrink-0 ${
                activeTab === tab.key
                  ? 'text-[#0F357E] border-b-2 border-[#0F357E] font-bold'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: LOAN DEALS & MAKER-CHECKER APPROVAL */}
      {activeTab === 'loans' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0F172A]">Loan Accounts & Underwriting Pipeline</h3>
            <span className="text-xs text-[#64748B]">Maker-Checker Dual Control Enabled</span>
          </div>

          {customer.deals && customer.deals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customer.deals.map((deal) => (
                <div key={deal.id} className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F357E] bg-[#EFF6FF] px-2 py-0.5 rounded">
                        {deal.loanType || 'PERSONAL_LOAN'}
                      </span>
                      <h4 className="text-sm font-bold text-[#0F172A] mt-1">{deal.title}</h4>
                      <div className="text-lg font-bold text-[#16A34A] mt-0.5">
                        ₹{deal.amount.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={deal.approvalStatus === 'APPROVED' ? 'success' : deal.approvalStatus === 'REJECTED' ? 'danger' : 'warning'}>
                        {deal.approvalStatus}
                      </Badge>
                      <div className="text-[10px] text-[#64748B] mt-1">Stage: <strong>{deal.stage}</strong></div>
                    </div>
                  </div>

                  {/* Loan Parameters & Eligibility */}
                  <div className="p-3 bg-[#F8FAFC] rounded-lg text-xs space-y-1.5 border border-[#E2E8F0]">
                    <div className="flex justify-between text-[#475569]">
                      <span>Tenure: <strong>{deal.tenureMonths || 36} Months</strong></span>
                      <span>Interest: <strong>{deal.interestRate || 10.5}% p.a.</strong></span>
                      <span>Eligibility: <strong className={deal.eligibilityStatus === 'ELIGIBLE' ? 'text-[#16A34A]' : deal.eligibilityStatus === 'INELIGIBLE' ? 'text-[#DC2626]' : 'text-[#D97706]'}>{deal.eligibilityStatus || 'ELIGIBLE'}</strong></span>
                    </div>
                    {deal.eligibilityNotes && (
                      <p className="text-[11px] text-[#64748B] italic border-t border-[#E2E8F0] pt-1">
                        {deal.eligibilityNotes}
                      </p>
                    )}
                  </div>

                  {/* Maker-Checker Workflow Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F1F5F9]">
                    <div className="text-[10px] text-[#64748B]">
                      Owner: {deal.owner?.name || 'Self'}
                      {deal.approvedBy && ` • Sanctioned by: ${deal.approvedBy.name}`}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Maker: Submit for Approval */}
                      {deal.approvalStatus === 'DRAFT' && (
                        <button
                          onClick={() => handleSubmitDealApproval(deal.id)}
                          className="px-2.5 py-1 bg-[#0F357E] text-white text-[11px] font-semibold rounded hover:bg-[#1E3A8A] transition flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>Submit for Approval</span>
                        </button>
                      )}

                      {/* Checker: Approve or Reject (Manager/Admin) */}
                      {deal.approvalStatus === 'SUBMITTED_FOR_APPROVAL' && isManagerOrAdmin && (
                        <>
                          <button
                            onClick={() => handleApproveDeal(deal)}
                            className="px-2.5 py-1 bg-[#16A34A] text-white text-[11px] font-semibold rounded hover:bg-[#15803D] transition flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approve & Sanction</span>
                          </button>
                          <button
                            onClick={() => handleRejectDeal(deal)}
                            className="px-2.5 py-1 bg-[#DC2626] text-white text-[11px] font-semibold rounded hover:bg-[#B91C1C] transition flex items-center gap-1"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}

                      {deal.approvalStatus === 'APPROVED' && (
                        <span className="text-[11px] font-bold text-[#16A34A] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Sanctioned</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-xl border border-[#E2E8F0] text-xs text-[#64748B]">
              No loan deals registered for this customer yet.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: KYC DOCUMENTS & VERIFICATION */}
      {activeTab === 'kyc' && (
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0F357E]" />
                <span>KYC Identification & Compliance Vault</span>
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Official regulatory identification records per RBI KYC Master Direction.
              </p>
            </div>
            <Button size="sm" onClick={() => setIsKycModalOpen(true)}>
              + Upload Document
            </Button>
          </div>

          {/* Documents Table */}
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs min-w-[600px]">
              <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-2.5 px-3">Document Type</th>
                  <th className="py-2.5 px-3">Document Number (Masked)</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Verified By</th>
                  <th className="py-2.5 px-3 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {kycData.documents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-[#64748B]">
                      No KYC documents uploaded yet. Upload PAN or Aadhaar to verify account.
                    </td>
                  </tr>
                ) : (
                  kycData.documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-3 px-3 font-bold text-[#0F172A]">
                        {doc.documentType}
                      </td>
                      <td className="py-3 px-3 font-mono text-[#0F357E] font-semibold">
                        {doc.maskedNumber || doc.documentNumber}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={doc.status === 'VERIFIED' ? 'success' : doc.status === 'REJECTED' ? 'danger' : 'warning'}>
                          {doc.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-[#64748B]">
                        {doc.verifiedBy?.name ? (
                          <span>{doc.verifiedBy.name} ({new Date(doc.verifiedAt).toLocaleDateString()})</span>
                        ) : (
                          'Awaiting Review'
                        )}
                        {doc.rejectionReason && (
                          <div className="text-[10px] text-[#DC2626] font-semibold mt-0.5">
                            Reason: {doc.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {doc.status === 'PENDING' && isManagerOrAdmin ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleVerifyKyc(doc.id)}
                              className="px-2 py-0.5 rounded bg-[#DCFCE7] text-[#16A34A] hover:bg-[#BBF7D0] font-semibold text-[11px] transition"
                            >
                              Verify ✓
                            </button>
                            <button
                              onClick={() => handleRejectKyc(doc.id)}
                              className="px-2 py-0.5 rounded bg-[#FEE2E2] text-[#DC2626] hover:bg-[#FECACA] font-semibold text-[11px] transition"
                            >
                              Reject ✗
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#94A3B8]">
                            {doc.status === 'VERIFIED' ? 'Compliant' : doc.status === 'REJECTED' ? 'Rejected' : 'Pending review'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SUPPORT TICKETS & COMPLAINTS */}
      {activeTab === 'tickets' && (
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-[#0F357E]" />
                <span>Customer Complaints & Service Requests</span>
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Regulatory grievance resolution with automated priority SLA tracking.
              </p>
            </div>
            <Button size="sm" onClick={() => setIsTicketModalOpen(true)}>
              + Raise New Ticket
            </Button>
          </div>

          <div className="space-y-3">
            {tickets.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#64748B]">
                No customer complaints or support tickets on record.
              </div>
            ) : (
              tickets.map((t) => (
                <div key={t.id} className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#0F357E]">{t.ticketNumber}</span>
                      <Badge variant={t.priority === 'URGENT' ? 'danger' : t.priority === 'HIGH' ? 'warning' : 'primary'}>
                        {t.priority}
                      </Badge>
                      <span className="font-semibold text-[#0F172A]">{t.title}</span>
                    </div>
                    <p className="text-[11px] text-[#475569] mt-1">{t.description}</p>
                    <div className="text-[10px] text-[#64748B] mt-1 flex items-center gap-3">
                      <span>Category: <strong>{t.category}</strong></span>
                      <span>Assigned to: <strong>{t.assignedTo?.name || 'Unassigned'}</strong></span>
                      {t.dueDate && (
                        <span>SLA Due: <strong className="text-[#DC2626]">{new Date(t.dueDate).toLocaleString()}</strong></span>
                      )}
                    </div>
                  </div>

                  <Badge variant={t.status === 'RESOLVED' ? 'success' : t.status === 'IN_PROGRESS' ? 'primary' : 'warning'}>
                    {t.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: INTERACTION NOTES & TIMELINE */}
      {activeTab === 'notes' && (
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[#0F172A]">Interaction Notes & Relationship Timeline</h3>

          <form onSubmit={handleAddNote} className="space-y-2">
            <textarea
              rows="2"
              required
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Log phone calls, client visits, loan requirement discussion..."
              className="w-full border border-[#CBD5E1] rounded-lg p-3 text-xs focus:ring-1 focus:ring-[#0F357E]"
            ></textarea>
            <div className="flex justify-end">
              <Button type="submit" size="sm" isLoading={isAddingNote}>+ Add Note</Button>
            </div>
          </form>

          <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
            {notes.length === 0 ? (
              <div className="text-xs text-[#94A3B8] text-center py-6">No interaction notes recorded yet.</div>
            ) : (
              notes.map((n) => (
                <div key={n.id} className="border-l-2 border-[#0F357E] pl-3 py-1 space-y-0.5 text-xs">
                  <div className="text-[#0F172A] font-medium leading-relaxed">{n.content}</div>
                  <div className="text-[10px] text-[#64748B]">
                    By {n.createdBy?.name || 'User'} &bull; {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Upload KYC Document Modal */}
      <Modal isOpen={isKycModalOpen} onClose={() => setIsKycModalOpen(false)} title="Upload Customer KYC Document">
        <form onSubmit={handleUploadKyc} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">Document Type</label>
            <select
              value={kycForm.documentType}
              onChange={(e) => setKycForm({ ...kycForm, documentType: e.target.value })}
              className="w-full border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs"
            >
              <option value="PAN">PAN Card (Permanent Account Number)</option>
              <option value="AADHAAR">Aadhaar Card (UIDAI)</option>
              <option value="PASSPORT">Passport</option>
              <option value="SALARY_SLIP">Salary Slip (Last 3 Months)</option>
              <option value="BANK_STATEMENT">Bank Statement (6 Months)</option>
              <option value="ITR">Income Tax Return (ITR-V)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">Document Number / Identification Key</label>
            <input
              type="text"
              required
              value={kycForm.documentNumber}
              onChange={(e) => setKycForm({ ...kycForm, documentNumber: e.target.value })}
              placeholder={kycForm.documentType === 'PAN' ? 'e.g. ABCDE1234F' : kycForm.documentType === 'AADHAAR' ? 'e.g. 1234 5678 9012' : 'e.g. Z1234567'}
              className="w-full border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs uppercase"
            />
            <p className="text-[10px] text-[#64748B] mt-1">
              🔒 Numbers will be automatically masked per RBI data protection guidelines.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsKycModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isUploadingKyc}>Register Document</Button>
          </div>
        </form>
      </Modal>

      {/* Create Support Ticket Modal */}
      <Modal isOpen={isTicketModalOpen} onClose={() => setIsTicketModalOpen(false)} title="Register Customer Support Ticket">
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">Ticket Title / Subject</label>
            <input
              type="text"
              required
              value={ticketForm.title}
              onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
              placeholder="e.g. Transaction Failed - ATM Withdrawal debited but not dispensed"
              className="w-full border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">Category</label>
              <select
                value={ticketForm.category}
                onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                className="w-full border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs"
              >
                <option value="GENERAL">General Inquiries</option>
                <option value="TRANSACTION_ISSUE">Failed / Disputed Transaction</option>
                <option value="CARD_ISSUE">Debit/Credit Card Issue</option>
                <option value="LOAN_DISPUTE">Loan Sanction / Interest Dispute</option>
                <option value="KYC_ISSUE">KYC Verification Grievance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">Priority (SLA)</label>
              <select
                value={ticketForm.priority}
                onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                className="w-full border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs"
              >
                <option value="LOW">Low (5 Days SLA)</option>
                <option value="MEDIUM">Medium (72h SLA)</option>
                <option value="HIGH">High (48h SLA)</option>
                <option value="URGENT">Urgent (24h Critical SLA)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">Detailed Description</label>
            <textarea
              rows="3"
              required
              value={ticketForm.description}
              onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
              placeholder="Provide exact details, dates, transaction reference numbers..."
              className="w-full border border-[#CBD5E1] rounded-lg p-2.5 text-xs"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsTicketModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isCreatingTicket}>Open Ticket</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
