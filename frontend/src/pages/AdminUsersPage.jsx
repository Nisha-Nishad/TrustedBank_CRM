import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';

export default function AdminUsersPage({ onNotify }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create User Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'Password@123',
    role: 'SALES_REP',
  });
  const [formLoading, setFormLoading] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.getUsers();
      setUsers(res.users || []);
    } catch (err) {
      onNotify?.(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleUserStatus = async (user) => {
    try {
      await api.updateUser(user.id, { isActive: !user.isActive });
      onNotify?.(`User status updated to ${!user.isActive ? 'Active' : 'Disabled'}`, 'success');
      fetchUsers();
    } catch (err) {
      onNotify?.(err.message, 'error');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await api.createUser(formData);
      onNotify?.('New user created successfully!', 'success');
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: 'Password@123', role: 'SALES_REP' });
      fetchUsers();
    } catch (err) {
      onNotify?.(err.message, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const roleBadgeVariant = {
    ADMIN: 'danger',
    MANAGER: 'primary',
    SALES_REP: 'warning',
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs text-[#64748B]">System Administration &bull; Access Control</div>
          <h2 className="text-lg sm:text-xl font-bold text-[#0F172A]">User & Role Management</h2>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto justify-center">
          + Create New User
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs min-w-[650px]">
          <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E2E8F0]">
            <tr>
              <th className="py-3 px-4 font-semibold">User Name</th>
              <th className="py-3 px-4 font-semibold">Email ID</th>
              <th className="py-3 px-4 font-semibold">Role</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold">Registered On</th>
              <th className="py-3 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A]">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#64748B]">Loading users...</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-[#F8FAFC]">
                  <td className="py-3.5 px-4 font-bold">{u.name}</td>
                  <td className="py-3.5 px-4 text-[#64748B]">{u.email}</td>
                  <td className="py-3.5 px-4">
                    <Badge variant={roleBadgeVariant[u.role] || 'neutral'}>{u.role}</Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={u.isActive ? 'success' : 'neutral'}>
                      {u.isActive ? 'Active' : 'Disabled'}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-[#64748B]">
                    {new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button
                      variant={u.isActive ? 'secondary' : 'success'}
                      size="sm"
                      onClick={() => handleToggleUserStatus(u)}
                    >
                      {u.isActive ? 'Disable User' : 'Enable User'}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Portal User">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">Employee Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs"
              placeholder="e.g. Sunil Gavaskar"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">Work Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs"
              placeholder="name@trustbank.in"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">System Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs bg-white"
              >
                <option value="SALES_REP">Sales Rep / RM</option>
                <option value="MANAGER">Branch Manager</option>
                <option value="ADMIN">System Administrator</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">Initial Password</label>
              <input
                type="text"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={formLoading}>Create User</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
