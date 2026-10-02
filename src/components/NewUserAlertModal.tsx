import React, { useState } from 'react';
import { NewUserRegistrationAlert } from '../types';
import { 
  UserCheck, Shield, Phone, Mail, MapPin, Building2, 
  ExternalLink, X, Volume2, Check, ArrowRight, MessageSquare, AlertTriangle 
} from 'lucide-react';
import { playAlertChimeSound } from '../utils/voiceAudioFeedback';

interface NewUserAlertModalProps {
  alert: NewUserRegistrationAlert | null;
  queueCount?: number;
  onDismiss: () => void;
  onViewInUserManagement: (alert: NewUserRegistrationAlert) => void;
}

export const NewUserAlertModal: React.FC<NewUserAlertModalProps> = ({
  alert,
  queueCount = 1,
  onDismiss,
  onViewInUserManagement
}) => {
  const [copiedEmail, setCopiedEmail] = useState(false);

  if (!alert) return null;

  const handleCopyEmail = () => {
    if (!alert.email) return;
    navigator.clipboard.writeText(alert.email).then(() => {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2500);
    });
  };

  const isResponder = alert.userCategory === 'responder';
  const isLaw = alert.userCategory === 'law_enforcement';
  const isAdvertiser = alert.userCategory === 'advertiser';
  const isPendingApproval = alert.responderApprovalStatus === 'pending';

  // Format phone number for WhatsApp wa.me link
  const rawDigits = alert.cellNumber ? alert.cellNumber.replace(/\D/g, '') : '';
  let waNumber = rawDigits;
  if (waNumber.startsWith('0') && waNumber.length === 10) {
    waNumber = `27${waNumber.substring(1)}`;
  } else if (!waNumber.startsWith('27') && waNumber.length === 9) {
    waNumber = `27${waNumber}`;
  }

  const categoryLabel = isLaw
    ? '👮 Law Enforcement / SAPS'
    : isResponder
    ? '🚨 Emergency Responder'
    : isAdvertiser
    ? '💼 Business Advertiser'
    : '🚗 Community Motorist';

  const categoryColor = isLaw
    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
    : isResponder
    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    : isAdvertiser
    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-user-modal-title"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-[#0A0D14] border-2 border-amber-500/60 rounded-3xl shadow-2xl shadow-amber-950/40 overflow-hidden divide-y divide-slate-800/80">
        
        {/* Glow Header bar */}
        <div className="bg-gradient-to-r from-amber-950/60 via-[#141A26] to-amber-950/40 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/20 animate-pulse">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full shadow-sm">
                  ADMIN POPUP
                </span>
                {queueCount > 1 && (
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded-full">
                    +{queueCount - 1} more in queue
                  </span>
                )}
              </div>
              <h3 id="new-user-modal-title" className="text-base sm:text-lg font-black text-white mt-0.5 tracking-tight flex items-center gap-1.5">
                New User Registered!
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => playAlertChimeSound()}
              className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 transition cursor-pointer"
              title="Replay Alert Chime"
              aria-label="Replay Alert Chime"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
              title="Close Popup"
              aria-label="Close Popup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* Main User Card */}
          <div className="bg-[#05070B] border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Account Holder</div>
                <div className="text-lg sm:text-xl font-black text-white mt-0.5">
                  {alert.fullName} {alert.surname || ''}
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider border shadow-sm ${categoryColor}`}>
                {categoryLabel}
              </span>
            </div>

            {/* Verification Alert Banner if Responder */}
            {isPendingApproval && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 flex items-start space-x-2 text-xs text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-amber-300">Awaiting Verification:</strong> This responder requested official badge status and is awaiting admin approval.
                </div>
              </div>
            )}

            {/* Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
              
              {/* Email */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center space-x-2 min-w-0">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate text-slate-200 font-medium select-all" title={alert.email}>
                    {alert.email}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="ml-2 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold shrink-0 transition"
                  title="Copy Email Address"
                >
                  {copiedEmail ? <Check className="w-3 h-3 text-emerald-400" /> : 'Copy'}
                </button>
              </div>

              {/* Cell Number */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center space-x-2 min-w-0">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate text-slate-200 font-mono font-bold select-all">
                    {alert.cellNumber}
                  </span>
                </div>
                <a
                  href={`tel:${alert.cellNumber}`}
                  className="ml-2 px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded text-[10px] font-bold shrink-0 transition"
                >
                  Call
                </a>
              </div>

              {/* Organization / Affiliation if provided */}
              {(alert.organizationName || alert.companyName) && (
                <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 sm:col-span-2">
                  <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-slate-400 font-medium">Affiliation:</span>
                  <span className="text-white font-bold truncate">
                    {alert.organizationName || alert.companyName}
                  </span>
                </div>
              )}

              {/* Coverage Area if provided */}
              {alert.coverageArea && (
                <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 sm:col-span-2">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="text-slate-400 font-medium">Coverage Area:</span>
                  <span className="text-cyan-200 font-bold truncate">
                    {alert.coverageArea}
                  </span>
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
              <span>User ID: <code className="font-mono text-slate-400">{alert.userId}</code></span>
              <span>{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {/* Review in User Management */}
            <button
              type="button"
              onClick={() => onViewInUserManagement(alert)}
              className="w-full sm:col-span-2 py-3 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 uppercase tracking-wider cursor-pointer active:scale-98"
            >
              <Shield className="w-4 h-4" />
              <span>Review in User & Admin Management</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Direct WhatsApp Chat */}
            {waNumber && (
              <a
                href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hello ${alert.fullName}, welcome to Live Traffic NPC!`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer active:scale-98"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp User</span>
              </a>
            )}

            {/* Dismiss */}
            <button
              type="button"
              onClick={onDismiss}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer active:scale-98"
            >
              Dismiss Notification
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
