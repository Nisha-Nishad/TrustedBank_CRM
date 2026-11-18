import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';

export default function LeadsPage({ onNotify }) {
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [search, setSearch] = useState('');

  // Add Lead Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'WEBSITE',
    productInterest: 'Home Loan (₹50 Lakh)',
  });
  const [formLoading, setFormLoading] = useState(false);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (sourceFilter) params.source = sourceFilter;
      if (search) params.search = search;

      const res = await api.getLeads(params);
      setLeads(res.leads || []);
    } catch (err) {
      onNotify?.(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter, sourceFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLeads();
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await api.createLead(formData);
      onNotify?.('Lead created successfully!', 'success');
      setIsModalOpen(false);
      setFormData({
        name: '',
        phone: '',
        email: '',
        source: 'WEBSITE',
        productInterest: 'Home Loan (₹50 Lakh)',
      });
      fetchLeads();
    } catch (err) {
      onNotify?.(err.message, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleConvertLead = async (leadId) => {
    if (!confirm('Are you sure you want to convert this lead to a registered Customer?')) return;
    try {
      await api.convertLead(leadId);
      onNotify?.('Lead converted to Customer successfully!', 'success');
      fetchLeads();
    } catch (err) {
      onNotify?.(err.message, 'error');
    }
  };

  const statusBadgeVariant = {
    NEW: 'primary',
    CONTACTED: 'warning',
    QUALIFIED: 'purple',
    CONVERTED: 'success',
    LOST: 'danger',
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs text-[#64748B]">Pipeline Management &bull; Phase 1</div>
          <h2 className="text-lg sm:text-xl font-bold text-[#0F172A]">Leads Management</h2>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto justify-center">
          + Add New Lead
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 w-full sm:max-w-sm">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search lead by name, phone, email..."
            className="w-full border border-[#CBD5E1] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
          />
          <Button type="submit" variant="secondary" size="sm">Search</Button>
        </form>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="flex-1 sm:flex-none border border-[#CBD5E1] rounded-lg px-3 py-1.5 bg-white text-[#0F172A]"
          >
            <option value="">All Sources</option>
            <option value="BRANCH">Branch Walk-in</option>
            <option value="WEBSITE">Website</option>
            <option value="REFERRAL">Referral</option>
            <option value="CALL">Inbound Call</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 sm:flex-none border border-[#CBD5E1] rounded-lg px-3 py-1.5 bg-white text-[#0F172A]"
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="CONVERTED">Converted</option>
            <option value="LOST">Lost</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs min-w-[700px]">
          <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E2E8F0]">
            <tr>
              <th className="py-3 px-4 font-semibold">Lead Name</th>
              <th className="py-3 px-4 font-semibold">Contact Info</th>
              <th className="py-3 px-4 font-semibold">Source</th>
              <th className="py-3 px-4 font-semibold">Product Interest</th>
              <th className="py-3 px-4 font-semibold">Assigned RM</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A]">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#64748B]">Loading leads...</td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#64748B]">No leads found matching criteria.</td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-[#F8FAFC]">
                  <td className="py-3.5 px-4 font-bold">{lead.name}</td>
                  <td className="py-3.5 px-4 text-[#64748B]">
                    <div>{lead.email}</div>
                    <div className="text-[11px] text-[#0F172A]">{lead.phone}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant="neutral">{lead.source}</Badge>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[#0F172A]">{lead.productInterest}</td>
                  <td className="py-3.5 px-4 text-[#64748B]">{lead.assignedTo?.name || 'Unassigned'}</td>
                  <td className="py-3.5 px-4">
                    <Badge variant={statusBadgeVariant[lead.status] || 'neutral'}>{lead.status}</Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1.5">
                    {lead.status !== 'CONVERTED' ? (
                      <Button
                        size="sm"
                        onClick={() => handleConvertLead(lead.id)}
                        className="bg-[#16A34A] hover:bg-[#15803D]"
                      >
                        Convert &rarr;
                      </Button>
                    ) : (
                      <Badge variant="success">Converted ✓</Badge>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Lead Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Capture New Lead">
        <form onSubmit={handleCreateLead} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs"
              placeholder="e.g. Vikram Malhotra"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">Phone Number</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs"
                placeholder="+91 98..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs"
                placeholder="email@domain.com"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">Lead Source</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs bg-white"
              >
                <option value="BRANCH">Branch Walk-in</option>
                <option value="WEBSITE">Website Inquiry</option>
                <option value="REFERRAL">Referral</option>
                <option value="CALL">Inbound Call</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">Product Interest</label>
              <input
                type="text"
                required
                value={formData.productInterest}
                onChange={(e) => setFormData({ ...formData, productInterest: e.target.value })}
                className="w-full border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs"
                placeholder="e.g. Home Loan (₹45 L)"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={formLoading}>Create Lead</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
