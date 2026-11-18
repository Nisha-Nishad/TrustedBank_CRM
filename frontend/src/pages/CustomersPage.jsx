import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';

export default function CustomersPage({ onViewCustomer360, onNotify }) {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  // Add Customer Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    type: 'INDIVIDUAL',
  });
  const [formLoading, setFormLoading] = useState(false);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (typeFilter) params.type = typeFilter;
      if (search) params.search = search;

      const res = await api.getCustomers(params);
      setCustomers(res.customers || []);
    } catch (err) {
      onNotify?.(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [typeFilter]);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await api.createCustomer(formData);
      onNotify?.('Customer created successfully!', 'success');
      setIsModalOpen(false);
      setFormData({ name: '', phone: '', email: '', city: '', type: 'INDIVIDUAL' });
      fetchCustomers();
    } catch (err) {
      onNotify?.(err.message, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs text-[#64748B]">Customer Master &bull; Phase 1</div>
          <h2 className="text-lg sm:text-xl font-bold text-[#0F172A]">Customer Directory</h2>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto justify-center">
          + Add Customer
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchCustomers();
          }}
          className="flex items-center gap-2 flex-1 w-full sm:max-w-sm"
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone..."
            className="w-full border border-[#CBD5E1] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
          />
          <Button type="submit" variant="secondary" size="sm">Search</Button>
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-auto border border-[#CBD5E1] rounded-lg px-3 py-1.5 bg-white text-[#0F172A]"
          >
            <option value="">All Customer Types</option>
            <option value="INDIVIDUAL">Individual / Salaried</option>
            <option value="BUSINESS">Corporate / MSME</option>
          </select>
        </div>
      </div>

      {/* Table with Horizontal Scroll for Mobile */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs min-w-[680px]">
          <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E2E8F0]">
            <tr>
              <th className="py-3 px-4 font-semibold">Customer Details</th>
              <th className="py-3 px-4 font-semibold">Contact Info</th>
              <th className="py-3 px-4 font-semibold">City</th>
              <th className="py-3 px-4 font-semibold">Type</th>
              <th className="py-3 px-4 font-semibold">KYC Status</th>
              <th className="py-3 px-4 font-semibold">Created Date</th>
              <th className="py-3 px-4 font-semibold text-right">360 View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A]">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#64748B]">Loading customers...</td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#64748B]">No customers found.</td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="hover:bg-[#F8FAFC]">
                  <td className="py-3.5 px-4 font-bold">
                    <div className="text-[#0F172A]">{c.name}</div>
                    <div className="text-[10px] text-[#64748B] font-mono">#{c.id.slice(0, 8)}</div>
                  </td>
                  <td className="py-3.5 px-4 text-[#64748B]">
                    <div>{c.email}</div>
                    <div className="text-[11px] text-[#0F172A]">{c.phone}</div>
                  </td>
                  <td className="py-3.5 px-4">{c.city || 'N/A'}</td>
                  <td className="py-3.5 px-4">
                    <Badge variant={c.type === 'BUSINESS' ? 'purple' : 'primary'}>{c.type}</Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant="success">✓ Verified</Badge>
                  </td>
                  <td className="py-3.5 px-4 text-[#64748B]">
                    {new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button size="sm" onClick={() => onViewCustomer360(c.id)}>
                      View 360 &rarr;
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Customer Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New Customer">
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">Customer / Entity Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs"
              placeholder="e.g. Ramesh Chandra / Apex Corp"
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
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">Email Address</label>
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
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">Customer Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs bg-white"
              >
                <option value="INDIVIDUAL">Individual / Salaried</option>
                <option value="BUSINESS">Corporate / MSME</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs"
                placeholder="e.g. New Delhi"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={formLoading}>Register Customer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
