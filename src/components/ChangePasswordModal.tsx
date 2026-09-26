import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, X, KeyRound, Shield } from 'lucide-react';
import { RegisteredUser } from '../types';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
  onSuccess?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  userEmail = '',
  userName = '',
  onSuccess
}) => {
  const [emailInput, setEmailInput] = useState(userEmail);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setEmailInput(userEmail);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, userEmail]);

  if (!isOpen) return null;

  const targetEmail = (userEmail || emailInput).trim().toLowerCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!targetEmail) {
      setError('Please provide the account email address.');
      return;
    }
    if (!currentPassword) {
      setError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 4) {
      setError('New password must be at least 4 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('The new password and confirmation do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('The new password must be different from your current password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          currentPassword,
          newPassword
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Password successfully updated!');
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(data.error || 'Failed to change password. Please check your current password.');
      }
    } catch (err) {
      setError('Network error updating password. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength check
  const getStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 8) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return Math.min(score, 4);
  };

  const strength = getStrength(newPassword);
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-cyan-400'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0F1115] border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-slate-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center shrink-0">
            <KeyRound className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Change Password</h3>
            <p className="text-xs text-slate-400">
              {userName ? `Account: ${userName}` : targetEmail ? `Account: ${targetEmail}` : 'Secure Account Update'}
            </p>
          </div>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="mb-4 bg-red-950/80 border border-red-800 text-red-200 text-xs p-3 rounded-xl flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs p-3 rounded-xl flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          data-lpignore="true"
          data-form-type="other"
          className="space-y-4"
        >
          {/* Dummy hidden inputs to absorb browser autofill */}
          <div className="hidden" aria-hidden="true" style={{ display: 'none' }}>
            <input type="text" tabIndex={-1} autoComplete="off" />
            <input type="password" tabIndex={-1} autoComplete="off" />
          </div>

          {!userEmail && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Account Email
              </label>
              <input
                type="email"
                required
                autoComplete="off"
                data-lpignore="true"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="you@domain.com"
                className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          )}

          {/* Current Password */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password..."
                className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                New Password
              </label>
              {newPassword && (
                <span className="text-[10px] font-bold text-slate-400">
                  Strength: <span className="text-amber-400">{strengthLabels[strength]}</span>
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 4 characters)..."
                className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Strength Bar */}
            {newPassword.length > 0 && (
              <div className="flex space-x-1 mt-1.5">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      strength > idx ? strengthColors[strength] : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password..."
                className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition border border-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !!successMsg}
              className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Save Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
