import React, { useState, useEffect } from 'react';
import {
  Building2,
  Shield,
  KeyRound,
  Bell,
  CheckCircle,
  AlertTriangle,
  Lock,
  Clock,
  Save,
  RefreshCw,
  User,
  Eye,
  EyeOff,
} from 'lucide-react';
import { api } from '../services/api';

export default function SettingsPage({ user, onNotify }) {
  const [activeTab, setActiveTab] = useState('branch');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Branch Settings State
  const [branch, setBranch] = useState({
    bankName: 'TrustBank India Ltd.',
    branchName: 'Nariman Point Flagship Branch',
    branchCode: 'TB-MUM-042',
    ifscCode: 'TRST0001042',
    region: 'West Zone - Mumbai Circle',
    currency: 'INR (₹)',
    makerCheckerThreshold: 2500000,
    dailyCutoffTime: '17:00 IST',
  });

  // Security Settings State
  const [security, setSecurity] = useState({
    twoFactorAuth: true,
    sessionTimeoutMinutes: 15,
    passwordExpiryDays: 90,
    piiMaskingEnabled: true,
    ipWhitelistingEnabled: false,
    auditLogRetentionYears: 7,
  });

  // Notification Rules State
  const [notifications, setNotifications] = useState({
    notifyHighValueDeals: true,
    highValueThreshold: 5000000,
    notifyKycStatusChange: true,
    dailyTaskDigest: true,
    digestTime: '08:30 AM',
    overdueTaskEscalation: true,
  });

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getSettings();
      if (res?.branch) setBranch(res.branch);
      if (res?.security) setSecurity(res.security);
      if (res?.notifications) setNotifications(res.notifications);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveBranch = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateBranchSettings(branch);
      onNotify?.('Branch operational settings updated successfully', 'success');
    } catch (err) {
      onNotify?.(err.message || 'Failed to update branch settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSecurity = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateSecuritySettings(security);
      onNotify?.('Security & compliance policies updated successfully', 'success');
    } catch (err) {
      onNotify?.(err.message || 'Failed to update security settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateNotificationSettings(notifications);
      onNotify?.('Alert notification preferences saved', 'success');
    } catch (err) {
      onNotify?.(err.message || 'Failed to update notification rules', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      onNotify?.('New passwords do not match', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      onNotify?.('Password must be at least 8 characters long', 'error');
      return;
    }

    try {
      setSaving(true);
      await api.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      onNotify?.('Password changed successfully', 'success');
    } catch (err) {
      onNotify?.(err.message || 'Failed to change password', 'error');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'branch', label: 'Branch Profile', icon: Building2 },
    { id: 'security', label: 'Security & Compliance', icon: Shield },
    { id: 'profile', label: 'My Profile & Password', icon: KeyRound },
    { id: 'notifications', label: 'Alert Routing', icon: Bell },
  ];

  return (
    <div className="p-8 space-y-6 bg-[#F8FAFC]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
              Bank CRM Settings & Compliance Configuration
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#EFF6FF] text-[#0F357E] border border-[#BFDBFE]">
              RBI Compliant
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Manage branch operations, security policies, Maker-Checker threshold, and notification preferences.
          </p>
        </div>

        {user?.role === 'ADMIN' && (
          <span className="px-3 py-1 bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] text-xs font-semibold rounded-lg">
            🛡️ Admin Privileges Active
          </span>
        )}
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 -mb-px ${
                isActive
                  ? 'border-[#0F357E] text-[#0F357E] bg-white shadow-2xs'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Branch & Operational Profile */}
      {activeTab === 'branch' && (
        <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm max-w-4xl space-y-6">
          <div>
            <h2 className="text-sm font-bold text-[#0F172A]">Bank Branch Operational Profile</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Official branch identifiers, regional hub parameters, and clearing cutoff hours.
            </p>
          </div>

          <form onSubmit={handleSaveBranch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Bank Organization Name
                </label>
                <input
                  type="text"
                  value={branch.bankName}
                  disabled
                  className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#64748B] cursor-not-allowed font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Branch Name
                </label>
                <input
                  type="text"
                  value={branch.branchName}
                  onChange={(e) => setBranch({ ...branch, branchName: e.target.value })}
                  disabled={user?.role !== 'ADMIN'}
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#0F172A] focus:ring-1 focus:ring-[#0F357E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Branch Code (Internal)
                </label>
                <input
                  type="text"
                  value={branch.branchCode}
                  onChange={(e) => setBranch({ ...branch, branchCode: e.target.value })}
                  disabled={user?.role !== 'ADMIN'}
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#0F172A] font-mono focus:ring-1 focus:ring-[#0F357E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  RBI IFSC Code
                </label>
                <input
                  type="text"
                  value={branch.ifscCode}
                  onChange={(e) => setBranch({ ...branch, ifscCode: e.target.value })}
                  disabled={user?.role !== 'ADMIN'}
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#0F172A] font-mono uppercase focus:ring-1 focus:ring-[#0F357E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Regional Zone / Circle
                </label>
                <input
                  type="text"
                  value={branch.region}
                  onChange={(e) => setBranch({ ...branch, region: e.target.value })}
                  disabled={user?.role !== 'ADMIN'}
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#0F172A] focus:ring-1 focus:ring-[#0F357E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Maker-Checker Loan Threshold (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-[#64748B]">₹</span>
                  <input
                    type="number"
                    value={branch.makerCheckerThreshold}
                    onChange={(e) => setBranch({ ...branch, makerCheckerThreshold: e.target.value })}
                    disabled={user?.role !== 'ADMIN'}
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg pl-7 pr-3 py-2 text-xs text-[#0F172A] font-semibold focus:ring-1 focus:ring-[#0F357E]"
                  />
                </div>
                <span className="text-[10px] text-[#64748B]">
                  Loans above ₹25 Lakh require secondary Branch Manager sign-off.
                </span>
              </div>
            </div>

            {user?.role === 'ADMIN' && (
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F357E] hover:bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Branch Profile'}</span>
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Tab 2: Security & Regulatory Policies */}
      {activeTab === 'security' && (
        <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm max-w-4xl space-y-6">
          <div>
            <h2 className="text-sm font-bold text-[#0F172A]">
              Security Controls & Banking Compliance (RBI Mandated)
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Enforce authentication protocols, customer PII masking, session timeouts, and audit policies.
            </p>
          </div>

          <form onSubmit={handleSaveSecurity} className="space-y-4">
            <div className="space-y-3.5">
              {/* 2FA Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]">
                <div>
                  <div className="text-xs font-semibold text-[#0F172A]">
                    Two-Factor Authentication (2FA)
                  </div>
                  <div className="text-[11px] text-[#64748B]">
                    Mandatory OTP verification on login for all Relationship Managers and Branch Managers.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={security.twoFactorAuth}
                    onChange={(e) => setSecurity({ ...security, twoFactorAuth: e.target.checked })}
                    disabled={user?.role !== 'ADMIN'}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#CBD5E1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0F357E]"></div>
                </label>
              </div>

              {/* PII Masking */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]">
                <div>
                  <div className="text-xs font-semibold text-[#0F172A]">
                    Customer PII Data Masking (Aadhaar / PAN)
                  </div>
                  <div className="text-[11px] text-[#64748B]">
                    Automatically mask sensitive identifiers on customer tables (e.g. XXXX-XXXX-4921).
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={security.piiMaskingEnabled}
                    onChange={(e) => setSecurity({ ...security, piiMaskingEnabled: e.target.checked })}
                    disabled={user?.role !== 'ADMIN'}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#CBD5E1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0F357E]"></div>
                </label>
              </div>

              {/* Session Timeout */}
              <div className="p-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[#0F172A]">
                    Automatic Inactivity Session Timeout
                  </div>
                  <div className="text-[11px] text-[#64748B]">
                    Forces logout after inactive period to prevent unauthorized terminal access.
                  </div>
                </div>
                <select
                  value={security.sessionTimeoutMinutes}
                  onChange={(e) =>
                    setSecurity({ ...security, sessionTimeoutMinutes: Number(e.target.value) })
                  }
                  disabled={user?.role !== 'ADMIN'}
                  className="text-xs bg-white border border-[#CBD5E1] rounded-lg px-3 py-1.5 font-semibold text-[#0F172A]"
                >
                  <option value={15}>15 Minutes (RBI Standard)</option>
                  <option value={30}>30 Minutes</option>
                  <option value={60}>60 Minutes</option>
                </select>
              </div>

              {/* Password Expiry Rotation */}
              <div className="p-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[#0F172A]">
                    Mandatory Password Rotation Cycle
                  </div>
                  <div className="text-[11px] text-[#64748B]">
                    Forces users to change password every 90 days.
                  </div>
                </div>
                <select
                  value={security.passwordExpiryDays}
                  onChange={(e) =>
                    setSecurity({ ...security, passwordExpiryDays: Number(e.target.value) })
                  }
                  disabled={user?.role !== 'ADMIN'}
                  className="text-xs bg-white border border-[#CBD5E1] rounded-lg px-3 py-1.5 font-semibold text-[#0F172A]"
                >
                  <option value={60}>Every 60 Days</option>
                  <option value={90}>Every 90 Days (Recommended)</option>
                  <option value={180}>Every 180 Days</option>
                </select>
              </div>

              {/* Immutable Audit Trail */}
              <div className="p-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[#0F172A]">
                    Regulatory Audit Log Retention
                  </div>
                  <div className="text-[11px] text-[#64748B]">
                    Immutable audit logs retained for 7 years per RBI cyber security framework.
                  </div>
                </div>
                <span className="text-xs font-bold text-[#16A34A] bg-[#DCFCE7] px-2.5 py-1 rounded">
                  7 Years (Active)
                </span>
              </div>
            </div>

            {user?.role === 'ADMIN' && (
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F357E] hover:bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Update Security Policies'}</span>
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Tab 3: My Profile & Password */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {/* User Profile Card */}
          <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <User className="w-4 h-4 text-[#0F357E]" />
              <span>User Profile Details</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-[#64748B]">Full Name</label>
                <div className="font-bold text-[#0F172A] mt-0.5">{user?.name}</div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#64748B]">Official Email</label>
                <div className="font-bold text-[#0F172A] mt-0.5">{user?.email}</div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#64748B]">Assigned Role</label>
                <div className="mt-1">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#EFF6FF] text-[#0F357E] border border-[#BFDBFE]">
                    {user?.role === 'ADMIN' ? 'System Administrator' : user?.role === 'SALES_REP' ? 'Relationship Manager' : 'Branch Manager'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#64748B]">Assigned Branch</label>
                <div className="font-semibold text-[#334155] mt-0.5">Nariman Point Flagship (TB-MUM-042)</div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#64748B]">Employee ID</label>
                <div className="font-mono text-[#334155] mt-0.5">TB-EMP-8924</div>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#0F357E]" />
              <span>Change Account Password</span>
            </h2>

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Current Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#0F172A] focus:ring-1 focus:ring-[#0F357E]"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#0F172A] focus:ring-1 focus:ring-[#0F357E]"
                  placeholder="Min 8 characters with symbol & number"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#0F172A] focus:ring-1 focus:ring-[#0F357E]"
                  placeholder="Re-enter new password"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-[#0F357E] hover:underline flex items-center gap-1"
                >
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showPassword ? 'Hide password' : 'Show password'}</span>
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#0F357E] hover:bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 4: Alert & Notification Routing */}
      {activeTab === 'notifications' && (
        <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm max-w-4xl space-y-6">
          <div>
            <h2 className="text-sm font-bold text-[#0F172A]">Notification & SLA Escalation Rules</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Configure automatic email and in-app alert triggers for deal progress and task breaches.
            </p>
          </div>

          <form onSubmit={handleSaveNotifications} className="space-y-4">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between p-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]">
                <div>
                  <div className="text-xs font-semibold text-[#0F172A]">
                    High-Value Deal Instant Notification
                  </div>
                  <div className="text-[11px] text-[#64748B]">
                    Alert Branch Manager whenever a deal exceeding ₹50 Lakh is created or moved to Approved stage.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.notifyHighValueDeals}
                    onChange={(e) =>
                      setNotifications({ ...notifications, notifyHighValueDeals: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#CBD5E1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0F357E]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]">
                <div>
                  <div className="text-xs font-semibold text-[#0F172A]">
                    KYC Verification Status Changes
                  </div>
                  <div className="text-[11px] text-[#64748B]">
                    Notify assigned Relationship Manager when compliance desk approves or rejects customer documents.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.notifyKycStatusChange}
                    onChange={(e) =>
                      setNotifications({ ...notifications, notifyKycStatusChange: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#CBD5E1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0F357E]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]">
                <div>
                  <div className="text-xs font-semibold text-[#0F172A]">
                    Daily Morning Task Digest (08:30 AM)
                  </div>
                  <div className="text-[11px] text-[#64748B]">
                    Send daily summary email to each RM with pending follow-ups and scheduled customer visits.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.dailyTaskDigest}
                    onChange={(e) =>
                      setNotifications({ ...notifications, dailyTaskDigest: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#CBD5E1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0F357E]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]">
                <div>
                  <div className="text-xs font-semibold text-[#0F172A]">
                    SLA Breach Auto-Escalation
                  </div>
                  <div className="text-[11px] text-[#64748B]">
                    Escalate tasks and loan applications pending &gt; 48 hours directly to the Branch Manager.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.overdueTaskEscalation}
                    onChange={(e) =>
                      setNotifications({ ...notifications, overdueTaskEscalation: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#CBD5E1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0F357E]"></div>
                </label>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F357E] hover:bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Notification Preferences'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
