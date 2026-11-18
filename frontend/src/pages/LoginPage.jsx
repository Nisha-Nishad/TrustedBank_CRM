import React, { useState, useEffect } from 'react';
import { Lock, Mail, Eye, EyeOff, Shield, KeyRound, CheckCircle, ArrowLeft } from 'lucide-react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { api } from '../services/api';

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('ernishanishad@gmail.com');
  const [password, setPassword] = useState('#dev@Free');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successAlert, setSuccessAlert] = useState('');

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState('');

  // Reset Password State (when token is provided via URL or direct test)
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  // Check URL query parameters on load for ?resetToken=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('resetToken');
    const emailFromUrl = params.get('email');
    if (tokenFromUrl) {
      setResetToken(tokenFromUrl);
      if (emailFromUrl) setEmail(emailFromUrl);
      setIsResetMode(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessAlert('');
    setIsLoading(true);

    try {
      const data = await api.login(email, password);
      localStorage.setItem('crm_token', data.token);
      localStorage.setItem('crm_user', JSON.stringify(data.user));
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setError('');
    setForgotSuccessMessage('');

    try {
      const targetEmail = forgotEmail || email;
      const res = await api.forgotPassword(targetEmail);
      setForgotSuccessMessage(
        res.message || `Password reset link has been dispatched to ${targetEmail}. Please check your email inbox.`
      );
    } catch (err) {
      setError(err.message || 'Failed to send password reset request');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match. Please re-enter both passwords identically.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    setResetLoading(true);
    setError('');
    setSuccessAlert('');

    try {
      const res = await api.resetPassword(resetToken, newPassword);

      // Clean up URL query parameters (?resetToken=...&email=...)
      window.history.replaceState({}, document.title, window.location.pathname);

      // Switch back to Login screen (DO NOT direct login)
      setIsResetMode(false);
      setIsForgotModalOpen(false);
      setPassword(''); // Blank password so user manually enters their new password
      setNewPassword('');
      setConfirmNewPassword('');
      setResetToken('');
      setResetSuccessMessage('');

      // Display prominent success banner on login form
      setSuccessAlert(
        res.message || 'Password has been successfully updated! Please sign in with your new credentials.'
      );
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setResetLoading(false);
    }
  };

  const setDemoAccount = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setSuccessAlert('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-[#F8FAFC] to-[#EEF2F6]">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-8">
        
        {/* Bank Brand Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-[#1E3A8A] items-center justify-center text-white text-2xl shadow-md mb-3">
            🏛️
          </div>
          <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">TrustBank Portal</h2>
          <p className="text-xs text-[#64748B] mt-0.5">Enterprise Relationship Management Platform</p>
        </div>

        {/* Success Alert Banner (e.g. after password reset) */}
        {successAlert && (
          <div className="mb-4 p-3 rounded-lg bg-[#DCFCE7] border border-[#BBF7D0] text-xs font-semibold text-[#16A34A] flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-[#16A34A]" />
            <span>{successAlert}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[#FEE2E2] border border-[#FECACA] text-xs font-semibold text-[#DC2626]">
            {error}
          </div>
        )}

        {/* Regular Login Form */}
        {!isResetMode ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">Official Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@domain.com"
                  className="w-full bg-white border border-[#CBD5E1] text-xs rounded-lg pl-9 pr-3 py-2.5 text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#0F172A]">Password</label>
                {/* Replaced demo password with Forgot Password */}
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotSuccessMessage('');
                    setError('');
                    setIsForgotModalOpen(true);
                  }}
                  className="text-xs text-[#1E3A8A] font-semibold hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-white border border-[#CBD5E1] text-xs rounded-lg pl-9 pr-10 py-2.5 text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#94A3B8] hover:text-[#0F172A]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" isLoading={isLoading} className="w-full py-2.5 mt-2">
              Sign In to Portal
            </Button>
          </form>
        ) : (
          /* Reset Password Form (triggered via link in email or direct token) */
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            <div className="text-center mb-2">
              <div className="inline-flex w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#0F357E] items-center justify-center text-lg font-bold mb-1 border border-[#BFDBFE]">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#0F172A]">Set New Password</h3>
              <p className="text-xs text-[#64748B]">
                Updating credentials for: <strong className="text-[#0F172A]">{email}</strong>
              </p>
            </div>

            {resetSuccessMessage && (
              <div className="p-3 bg-[#DCFCE7] border border-[#BBF7D0] rounded-lg text-xs font-semibold text-[#16A34A] flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{resetSuccessMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters (e.g. #dev@Free)"
                  className="w-full border border-[#CBD5E1] rounded-lg px-3 py-2 pr-10 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5 text-[#94A3B8] hover:text-[#0F172A]"
                >
                  {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Confirm New Password
              </label>
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Re-type new password"
                className="w-full border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>

            <Button type="submit" isLoading={resetLoading} className="w-full py-2.5">
              Update Password & Enter CRM Portal
            </Button>

            <button
              type="button"
              onClick={() => {
                setIsResetMode(false);
                setError('');
                window.history.replaceState({}, document.title, window.location.pathname);
              }}
              className="w-full text-center text-xs text-[#64748B] hover:underline pt-1"
            >
              Cancel and Return to Login
            </button>
          </form>
        )}

        {/* Quick Testing Accounts */}
        <div className="mt-6 pt-5 border-t border-[#E2E8F0] text-xs">
          <div className="font-bold text-[#0F172A] mb-2 flex items-center justify-between">
            <span>Quick-Select Testing Role:</span>
            <span className="text-[10px] text-[#64748B]">1-Click Fill</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setDemoAccount('ernishanishad@gmail.com', '#dev@Free')}
              className="px-2 py-1.5 rounded-lg border border-[#1E3A8A] bg-[#EFF6FF] text-[11px] font-bold text-[#1E3A8A] text-center truncate hover:bg-[#DBEAFE]"
              title="Nisha Nishad (Admin)"
            >
              👑 Admin (Nisha)
            </button>
            <button
              type="button"
              onClick={() => setDemoAccount('manager@trustbank.in', 'Password@123')}
              className="px-2 py-1.5 rounded-lg border border-[#CBD5E1] text-[11px] font-semibold text-[#0F172A] hover:bg-[#F1F5F9] text-center truncate"
            >
              👔 Manager
            </button>
            <button
              type="button"
              onClick={() => setDemoAccount('rep1@trustbank.in', 'Password@123')}
              className="px-2 py-1.5 rounded-lg border border-[#CBD5E1] text-[11px] font-semibold text-[#0F172A] hover:bg-[#F1F5F9] text-center truncate"
            >
              💼 RM-1 (Amit)
            </button>
          </div>

          <div className="mt-2 text-[10px] text-[#64748B] text-center">
            Total 10 Relationship Managers available for practice & testing
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-5 text-center text-[10px] text-[#94A3B8] flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-[#16A34A]" />
          <span>Bank-grade 256-bit SSL &bull; Strict Role-Based Access Control</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Reset Account Password"
      >
        {!forgotSuccessMessage ? (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            <p className="text-xs text-[#64748B] leading-relaxed">
              Enter your registered official email address. We will send you a secure password reset link to choose a new password.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">Your Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@trustbank.in / gmail.com"
                  className="w-full border border-[#CBD5E1] rounded-lg pl-9 pr-3 py-2 text-xs text-[#0F172A]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
              <Button variant="outline" size="sm" onClick={() => setIsForgotModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={forgotLoading}>
                Send Reset Link to Email
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-center py-3">
            <div className="w-14 h-14 bg-[#DCFCE7] text-[#16A34A] rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold border border-[#BBF7D0] shadow-sm">
              ✉️
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#0F172A]">Password Reset Link Dispatched!</h4>
              <p className="text-xs text-[#334155] mt-2 leading-relaxed px-2">
                A secure password reset verification link has been sent to your registered email:
              </p>
              <div className="mt-1.5 inline-block px-3 py-1 bg-[#EFF6FF] text-[#0F357E] font-bold text-xs rounded-full border border-[#BFDBFE]">
                {forgotEmail || email}
              </div>
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-left space-y-1.5 text-xs text-[#475569]">
              <div className="font-semibold text-[#0F172A] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>Security Instructions:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-[#64748B]">
                <li>Please open your registered Email Inbox (or Spam folder).</li>
                <li>Click the <strong>"Reset My Password"</strong> button inside the email.</li>
                <li>The password cannot be changed from this window directly without opening the link from your email.</li>
                <li>The link is cryptographically signed and valid for <strong>1 hour</strong>.</li>
              </ul>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsForgotModalOpen(false);
                setForgotSuccessMessage('');
              }}
              className="w-full mt-2"
            >
              Back to Login
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
