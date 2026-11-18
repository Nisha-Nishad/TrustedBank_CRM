import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { ArrowLeft } from 'lucide-react';

export default function CustomerDetailPage({ customerId, onBack, onNotify }) {
  const [customer, setCustomer] = useState(null);
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  const fetchCustomerDetails = async () => {
    setIsLoading(true);
    try {
      const [custRes, notesRes] = await Promise.all([
        api.getCustomerById(customerId),
        api.getNotes({ relatedType: 'CUSTOMER', relatedId: customerId }),
      ]);
      setCustomer(custRes.customer);
      setNotes(notesRes.notes || []);
    } catch (err) {
      onNotify?.(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchCustomerDetails();
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
      fetchCustomerDetails();
    } catch (err) {
      onNotify?.(err.message, 'error');
    } finally {
      setIsAddingNote(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-[#64748B]">Loading Customer 360 View...</div>;
  }

  if (!customer) {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="text-xs text-[#DC2626]">Customer profile not found.</div>
        <Button size="sm" onClick={onBack}>&larr; Back to Customers</Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
      {/* Back button & title */}
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E3A8A] hover:underline">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Customers List
      </button>

      {/* Profile Header Card */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#1E3A8A] text-white flex items-center justify-center text-lg sm:text-xl font-bold shadow-md shrink-0">
            {customer.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#0F172A]">{customer.name}</h2>
              <Badge variant="success">✓ KYC Verified</Badge>
              <Badge variant="primary">{customer.type}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#64748B] mt-1">
              <span>Customer ID: <strong className="text-[#0F172A] font-mono">#{customer.id.slice(0, 8)}</strong></span>
              <span>&bull;</span>
              <span>Phone: <strong className="text-[#0F172A]">{customer.phone}</strong></span>
              <span>&bull;</span>
              <span>Email: <strong className="text-[#0F172A]">{customer.email}</strong></span>
              <span>&bull;</span>
              <span>City: <strong className="text-[#0F172A]">{customer.city || 'N/A'}</strong></span>
            </div>
          </div>
        </div>

        <div className="text-xs text-[#64748B] sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F1F5F9]">
          <div>Relationship Manager</div>
          <div className="font-bold text-[#0F172A]">{customer.createdBy?.name || 'Assigned RM'}</div>
        </div>
      </div>

      {/* Main Grid: Linked Deals & Activity/Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Linked Deals (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm">
            <h3 className="text-sm font-bold text-[#0F172A] mb-3">Linked Loan Accounts & Deals</h3>
            {customer.deals && customer.deals.length > 0 ? (
              <div className="space-y-3">
                {customer.deals.map((deal) => (
                  <div key={deal.id} className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#0F172A]">{deal.title}</div>
                      <div className="text-xs font-bold text-[#1E3A8A] mt-0.5">
                        ₹{deal.amount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-[#64748B] mt-1">
                        Created: {new Date(deal.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant="primary">{deal.stage}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-[#64748B] py-4 text-center">No deals currently linked to this customer.</div>
            )}
          </div>
        </div>

        {/* Notes & Activity Timeline (1 col) */}
        <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] mb-3">Notes & Meeting History</h3>

            {/* Add note input */}
            <form onSubmit={handleAddNote} className="mb-4 space-y-2">
              <textarea
                rows="2"
                required
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Log a client call, visit note or document status..."
                className="w-full border border-[#CBD5E1] rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-[#1E3A8A]"
              ></textarea>
              <div className="flex justify-end">
                <Button type="submit" size="sm" isLoading={isAddingNote}>+ Add Note</Button>
              </div>
            </form>

            {/* Notes List */}
            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
              {notes.length === 0 ? (
                <div className="text-[11px] text-[#94A3B8] text-center py-4">No notes logged yet.</div>
              ) : (
                notes.map((n) => (
                  <div key={n.id} className="border-l-2 border-[#1E3A8A] pl-3 py-1 space-y-0.5 text-xs">
                    <div className="text-[#0F172A] font-medium leading-relaxed">{n.content}</div>
                    <div className="text-[10px] text-[#64748B]">
                      By {n.createdBy?.name || 'User'} &bull; {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
