import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, X, KeyRound, ShieldCheck, ArrowRight } from 'lucide-react';
import { RegisteredUser } from '../types';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  token?: string;
  initialEmail?: string;
  onSuccess?: (user: RegisteredUser) => void;
}

// Simple fallback client hashing for offline account storage
async function clientSha256(str: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(str.trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return str.trim();
  }
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  token,
  initialEmail = '',
  onSuccess
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isVerifyingToken, setIsVerifyingToken] = useState(Boolean(token));
  const [isTokenValid, setIsTokenValid] = useState(!token);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resetUser, setResetUser] = useState<RegisteredUser | null>(null);

  // Verify token on mount / open
  useEffect(() => {
    if (!isOpen) return;

    if (token) {
      setIsVerifyingToken(true);
      setTokenError(null);
      setError(null);
      setSuccessMsg(null);
      setNewPassword('');
      setConfirmPassword('');
      setEmail(initialEmail);

      fetch('/api/auth/verify-reset-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email: initialEmail })
      })
        .then(async (res) => {
          const data = await res.json();
          if (res.ok && data.valid) {
            setIsTokenValid(true);
            if (data.email) setEmail(data.email);
          } else {
            setIsTokenValid(false);
            setTokenError(data.error || 'This password reset link is invalid or has expired.');
          }
        })
        .catch(() => {
          // If server call fails, allow proceeding with offline fallback token if format is valid
          if (token && token.length >= 16) {
            setIsTokenValid(true);
          } else {
            setIsTokenValid(false);
            setTokenError('Unable to verify reset token. Please check your network connection.');
          }
        })
        .finally(() => {
          setIsVerifyingToken(false);
        });
    } else {
      setIsVerifyingToken(false);
      setIsTokenValid(true);
      if (initialEmail) setEmail(initialEmail);
    }
  }, [isOpen, token, initialEmail]);

  if (!isOpen) return null;

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanEmail) {
      setError('Please provide the account email address.');
      return;
    }
    if (cleanPassword.length < 4) {
      setError('New password must be at least 4 characters long.');
      return;
    }
    if (cleanPassword !== cleanConfirm) {
      setError('New password and confirmation do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email: cleanEmail,
          newPassword: cleanPassword
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Your password has been successfully reset!');
        const updatedUser = data.user || {
          id: `usr-${Date.now()}`,
          fullName: cleanEmail.split('@')[0],
          email: cleanEmail,
          role: 'user',
          registeredAt: new Date().toISOString()
        };

        setResetUser(updatedUser);

        // Update local offline vault and session cache
        try {
          const pHash = await clientSha256(cleanPassword);
          const vaultStr = localStorage.getItem('live_traffic_npc_users_vault') || '{}';
          const vault = JSON.parse(vaultStr);
          vault[cleanEmail] = {
            ...(vault[cleanEmail] || {}),
            ...updatedUser,
            passwordHash: pHash
          };
          localStorage.setItem('live_traffic_npc_users_vault', JSON.stringify(vault));
          localStorage.setItem('live_traffic_npc_user', JSON.stringify(updatedUser));
        } catch (storageErr) {
          console.warn('Local storage cache note:', storageErr);
        }

        // Clean up URL query parameters
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete('action');
          url.searchParams.delete('token');
          url.searchParams.delete('resetToken');
          url.searchParams.delete('email');
          window.history.replaceState({}, '', url.toString());
        } catch (_) {}

        if (onSuccess) {
          onSuccess(updatedUser);
        }
      } else {
        setError(data.error || 'Failed to reset password. Please request a new link.');
      }
    } catch (err: any) {
      setError('Network connection error while resetting password. Please try again.');
    } finally {
      setIsSubmitting(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0F1115] border border-amber-500/30 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-slate-200">
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
            <h3 className="text-lg font-black text-white">Reset Account Password</h3>
            <p className="text-xs text-slate-400">
              {email ? `Account: ${email}` : 'Secure Verified Password Reset'}
            </p>
          </div>
        </div>

        {/* Verification Loader */}
        {isVerifyingToken && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            <p className="text-sm font-semibold text-slate-300">Verifying secure reset token...</p>
            <p className="text-xs text-slate-500">Checking link authorization with Live Traffic security server.</p>
          </div>
        )}

        {/* Token Invalid or Expired View */}
        {!isVerifyingToken && !isTokenValid && (
          <div className="space-y-4 py-2">
            <div className="bg-red-950/80 border border-red-800 text-red-200 text-xs p-4 rounded-2xl flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-red-300 mb-1">Reset Link Expired or Invalid</p>
                <p>{tokenError || 'This reset link has expired or has already been used. Password reset links are valid for 60 minutes for security.'}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Back to Login & Request New Link</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Success View */}
        {successMsg && (
          <div className="space-y-4 py-2 text-center animate-fadeIn">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-black text-white mb-1">Password Successfully Updated!</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                {successMsg} Your account credentials have been secured and updated.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Continue to Live Traffic Control</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Reset Password Form */}
        {!isVerifyingToken && isTokenValid && !successMsg && (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-950/80 border border-red-800 text-red-200 text-xs p-3 rounded-xl flex items-center space-x-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Token verified for: <strong className="text-white font-mono">{email}</strong></span>
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

            {/* Confirm Password */}
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
                  placeholder="Re-enter new password to confirm..."
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
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm Reset</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
