import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';

export default function DealsPage({ onNotify }) {
  const [groupedDeals, setGroupedDeals] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // New Deal Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    stage: 'NEW',
  });
  const [formLoading, setFormLoading] = useState(false);

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
      const res = await api.getDeals({ groupBy: 'stage' });
      setGroupedDeals(res.grouped || {});
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
      });
      onNotify?.('Deal created successfully!', 'success');
      setIsModalOpen(false);
      setFormData({ title: '', amount: '', stage: 'NEW' });
      fetchDeals();
    } catch (err) {
      onNotify?.(err.message, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-[#64748B]">Pipeline Management &bull; Phase 1</div>
          <h2 className="text-xl font-bold text-[#0F172A]">Deals & Loan Pipeline</h2>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="primary">Kanban Board View</Badge>
          <Button onClick={() => setIsModalOpen(true)}>+ New Deal</Button>
        </div>
      </div>

      {/* Kanban Board Columns Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3.5 min-w-[1100px] overflow-x-auto pb-6">
        {STAGES.map((st) => {
          const columnData = groupedDeals[st.key] || { count: 0, totalAmount: 0, deals: [] };
          return (
            <div
              key={st.key}
              className={`bg-[#F1F5F9] p-3 rounded-xl border border-[#E2E8F0] border-t-4 ${st.color} flex flex-col min-h-[500px]`}
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
                  columnData.deals.map((deal) => (
                    <div
                      key={deal.id}
                      className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-sm hover:shadow transition space-y-2"
                    >
                      <div className="text-xs font-bold text-[#0F172A] leading-snug">{deal.title}</div>
                      <div className="text-xs font-bold text-[#1E3A8A]">
                        ₹{deal.amount.toLocaleString('en-IN')}
                      </div>

                      <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[10px] text-[#64748B]">
                        <span>RM: {deal.owner?.name?.split(' ')[0] || 'Rep'}</span>
                        
                        {/* Quick Stage Mover Dropdown */}
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
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Deal Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Pipeline Deal">
        <form onSubmit={handleCreateDeal} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">Deal Title / Application</label>
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
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">Deal Value (₹)</label>
              <input
                type="number"
                required
                min="1"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs"
                placeholder="e.g. 5000000"
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
            <Button type="submit" size="sm" isLoading={formLoading}>Create Deal</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
