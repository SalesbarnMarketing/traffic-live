import React from 'react';
import { ShieldCheck, UserCheck, Clock, Edit3, CheckCircle2, ShieldAlert } from 'lucide-react';
import { IncidentReport, FeedItem } from '../types';

interface AdminAuditBadgeProps {
  isAdmin?: boolean;
  report?: IncidentReport;
  feedItem?: FeedItem;
  variant?: 'compact' | 'inline' | 'full' | 'card';
  className?: string;
}

export const AdminAuditBadge: React.FC<AdminAuditBadgeProps> = ({
  isAdmin = false,
  report,
  feedItem,
  variant = 'compact',
  className = ''
}) => {
  // Extract administrative creator / approver / resolver fields
  const isDispatchItem = feedItem?.source === 'admin_dispatch' || feedItem?.author?.includes('Admin');
  const isVerifiedItem = feedItem?.verified || report?.verifiedByAdmin;

  const postedByName = feedItem?.postedByAdminName || report?.createdByAdminName || (isDispatchItem ? (feedItem?.author?.replace(/^[🛡️🔨📢\s]+/, '').trim() || 'Admin Officer') : undefined);
  const postedByEmail = feedItem?.postedByAdminEmail || report?.createdByAdminEmail;
  const postedByRole = feedItem?.postedByAdminRole || report?.createdByAdminRole || (isDispatchItem ? 'admin' : undefined);
  const postedAt = feedItem?.postedAt || report?.createdAt;

  const approvedByName = feedItem?.approvedByAdminName || report?.approvedByAdminName;
  const approvedByEmail = feedItem?.approvedByAdminEmail || report?.approvedByAdminEmail;
  const approvedByRole = feedItem?.approvedByAdminRole || report?.approvedByAdminRole;
  const approvedAt = feedItem?.approvedAt || report?.approvedAt;

  const resolvedByName = feedItem?.resolvedByAdminName || report?.resolvedByAdminName;
  const resolvedByEmail = feedItem?.resolvedByAdminEmail || report?.resolvedByAdminEmail;
  const resolvedByRole = feedItem?.resolvedByAdminRole || report?.resolvedByAdminRole;
  const resolvedAt = report?.resolvedAt;

  const editedByName = feedItem?.lastEditedByAdminName || report?.lastEditedByAdminName;
  const editedByEmail = feedItem?.lastEditedByAdminEmail || report?.lastEditedByAdminEmail;
  const editedAt = feedItem?.lastEditedAt || report?.lastEditedAt;

  // If no admin tracking fields exist on this item and it's not an admin post, nothing to display
  if (!postedByName && !approvedByName && !resolvedByName && !editedByName) {
    return null;
  }

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return iso;
    }
  };

  const getRoleBadge = (role?: string) => {
    if (!role) return null;
    const clean = role.toLowerCase();
    if (clean.includes('super')) {
      return <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">Super Admin</span>;
    }
    if (clean.includes('admin')) {
      return <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">Admin</span>;
    }
    if (clean.includes('patrol') || clean.includes('officer')) {
      return <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">Patrol</span>;
    }
    return <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-700 text-slate-300 font-bold">{role}</span>;
  };

  // --- PUBLIC / COMMUNITY VIEW (when viewer is not an admin) ---
  // Show clean, verified admin attribution without private emails or internal system IDs
  if (!isAdmin) {
    if (variant === 'full' || variant === 'card') {
      return (
        <div 
          id="admin-public-attribution-card"
          className={`rounded-xl bg-slate-900/90 border border-emerald-500/30 p-2.5 sm:p-3 text-xs text-slate-200 shadow-sm flex flex-col gap-1.5 ${className}`}
        >
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px] uppercase tracking-wide">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verified Administrative Dispatch</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {postedByName && (
              <span className="inline-flex items-center gap-1.5">
                <span className="text-slate-400 font-normal">Posted by:</span>
                <strong className="text-white font-bold">{postedByName}</strong>
                {postedByRole && getRoleBadge(postedByRole)}
              </span>
            )}

            {approvedByName && (
              <span className="inline-flex items-center gap-1.5 before:content-['•'] before:text-slate-600 before:mr-0.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span className="text-slate-400 font-normal">Approved by:</span>
                <strong className="text-emerald-300 font-bold">{approvedByName}</strong>
                {approvedByRole && getRoleBadge(approvedByRole)}
              </span>
            )}

            {resolvedByName && (
              <span className="inline-flex items-center gap-1.5 before:content-['•'] before:text-slate-600 before:mr-0.5">
                <span className="text-slate-400 font-normal">Resolved by:</span>
                <strong className="text-blue-300 font-bold">{resolvedByName}</strong>
              </span>
            )}
          </div>
        </div>
      );
    }

    // Default compact badge for public feed & lists
    return (
      <div 
        id="admin-public-attribution-badge" 
        className={`inline-flex flex-wrap items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[10px] sm:text-[11px] text-slate-200 shadow-sm ${className}`}
      >
        <div className="flex items-center gap-1 text-emerald-400 font-bold shrink-0">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>OFFICIAL:</span>
        </div>

        {postedByName && (
          <span className="inline-flex items-center gap-1 text-slate-300 font-medium">
            <span className="text-slate-400">Posted by</span>
            <strong className="text-white font-bold">{postedByName}</strong>
            {postedByRole && getRoleBadge(postedByRole)}
          </span>
        )}

        {approvedByName && (
          <span className="inline-flex items-center gap-1 text-slate-300 font-medium before:content-['•'] before:text-slate-600 before:mr-0.5">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
            <span className="text-slate-400">Approved by</span>
            <strong className="text-emerald-300 font-bold">{approvedByName}</strong>
            {approvedByRole && getRoleBadge(approvedByRole)}
          </span>
        )}

        {resolvedByName && (
          <span className="inline-flex items-center gap-1 text-slate-300 font-medium before:content-['•'] before:text-slate-600 before:mr-0.5">
            <span className="text-slate-400">Resolved by</span>
            <strong className="text-blue-300 font-bold">{resolvedByName}</strong>
          </span>
        )}
      </div>
    );
  }

  // --- INTERNAL STAFF AUDIT VIEW (when viewer is an admin) ---
  // 1. Compact mode (for feed cards & report list rows)
  if (variant === 'compact' || variant === 'inline') {
    return (
      <div 
        id="admin-audit-compact-badge" 
        className={`w-full max-w-full rounded-xl bg-gradient-to-r from-slate-900/90 via-[#0b1322] to-slate-900/90 border border-cyan-500/30 p-2 sm:p-2.5 text-slate-200 shadow-sm overflow-hidden ${className}`}
        title="Internal Admin Audit: Only visible to authenticated administrators"
      >
        <div className="flex items-center justify-between gap-2 border-b border-cyan-500/20 pb-1.5 mb-1.5">
          <div className="flex items-center gap-1.5 text-cyan-400 font-black tracking-wide">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold">Admin Audit</span>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 uppercase">
            Staff Log
          </span>
        </div>

        <div className="space-y-1 text-xs">
          {postedByName && (
            <div className="flex items-center justify-between gap-2 flex-wrap text-[11px]">
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-slate-400 shrink-0">Posted by:</span>
                <strong className="text-white font-bold truncate">{postedByName}</strong>
                {postedByRole && getRoleBadge(postedByRole)}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 ml-auto shrink-0 font-mono">
                {postedByEmail && <span className="text-cyan-300/80 truncate max-w-[140px] sm:max-w-[200px]" title={postedByEmail}>({postedByEmail})</span>}
                {postedAt && <span>@{formatTime(postedAt)}</span>}
              </div>
            </div>
          )}

          {approvedByName && (
            <div className="flex items-center justify-between gap-2 flex-wrap text-[11px]">
              <div className="flex items-center gap-1 min-w-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-slate-400 shrink-0">Approved by:</span>
                <strong className="text-emerald-300 font-bold truncate">{approvedByName}</strong>
                {approvedByRole && getRoleBadge(approvedByRole)}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 ml-auto shrink-0 font-mono">
                {approvedByEmail && <span className="text-cyan-300/80 truncate max-w-[140px] sm:max-w-[200px]" title={approvedByEmail}>({approvedByEmail})</span>}
                {approvedAt && <span>@{formatTime(approvedAt)}</span>}
              </div>
            </div>
          )}

          {resolvedByName && (
            <div className="flex items-center justify-between gap-2 flex-wrap text-[11px]">
              <div className="flex items-center gap-1 min-w-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="text-slate-400 shrink-0">Resolved by:</span>
                <strong className="text-blue-300 font-bold truncate">{resolvedByName}</strong>
                {resolvedByRole && getRoleBadge(resolvedByRole)}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 ml-auto shrink-0 font-mono">
                {resolvedByEmail && <span className="text-blue-300/80 truncate max-w-[140px] sm:max-w-[200px]" title={resolvedByEmail}>({resolvedByEmail})</span>}
                {resolvedAt && <span>@{formatTime(resolvedAt)}</span>}
              </div>
            </div>
          )}

          {editedByName && (
            <div className="flex items-center justify-between gap-2 flex-wrap text-[11px]">
              <div className="flex items-center gap-1 min-w-0">
                <Edit3 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-slate-400 shrink-0">Edited by:</span>
                <strong className="text-amber-200 font-bold truncate">{editedByName}</strong>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 ml-auto shrink-0 font-mono">
                {editedByEmail && <span className="text-amber-300/80 truncate max-w-[140px] sm:max-w-[200px]" title={editedByEmail}>({editedByEmail})</span>}
                {editedAt && <span>@{formatTime(editedAt)}</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. Full card mode (for ReportDetailModal and AdminPortal inspection drawers)
  return (
    <div 
      id="admin-audit-full-card" 
      className={`rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-500/40 p-3.5 sm:p-4 text-slate-200 shadow-md space-y-2.5 ${className}`}
    >
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-500/20 border border-cyan-500/40 rounded-lg text-cyan-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-white tracking-tight flex items-center gap-1.5">
              <span>Internal Admin Audit Trail</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                Staff Only
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Complete accountability record of administrative actions, author identity & approvals.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {/* Creator / Poster info */}
        {postedByName ? (
          <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Broadcast / Created By</span>
            </div>
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <span className="font-bold text-white text-sm">{postedByName}</span>
              {postedByRole && getRoleBadge(postedByRole)}
            </div>
            {postedByEmail && (
              <div className="text-[11px] font-mono text-cyan-300/90 truncate">
                {postedByEmail}
              </div>
            )}
            {postedAt && (
              <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-0.5">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{formatTime(postedAt)}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Submission Origin</span>
            </div>
            <span className="font-bold text-slate-200 text-sm">
              {report?.reporterName || 'Community Motorist'}
            </span>
            <div className="text-[10px] text-slate-400">
              Submitted via Public Portal
            </div>
            {report?.createdAt && (
              <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-0.5">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{formatTime(report.createdAt)}</span>
              </div>
            )}
          </div>
        )}

        {/* Approver info */}
        {approvedByName && (
          <div className="p-2.5 bg-slate-950/60 rounded-xl border border-emerald-900/40 space-y-1">
            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified & Approved By</span>
            </div>
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <span className="font-bold text-emerald-200 text-sm">{approvedByName}</span>
              {approvedByRole && getRoleBadge(approvedByRole)}
            </div>
            {approvedByEmail && (
              <div className="text-[11px] font-mono text-emerald-400/90 truncate">
                {approvedByEmail}
              </div>
            )}
            {approvedAt && (
              <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-0.5">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{formatTime(approvedAt)}</span>
              </div>
            )}
          </div>
        )}

        {/* Resolver info if present */}
        {resolvedByName && (
          <div className="p-2.5 bg-slate-950/60 rounded-xl border border-blue-900/40 space-y-1">
            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
              <span>Resolved By</span>
            </div>
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <span className="font-bold text-blue-200 text-sm">{resolvedByName}</span>
              {resolvedByRole && getRoleBadge(resolvedByRole)}
            </div>
            {resolvedByEmail && (
              <div className="text-[11px] font-mono text-blue-300 truncate">
                {resolvedByEmail}
              </div>
            )}
            {resolvedAt && (
              <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-0.5">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{formatTime(resolvedAt)}</span>
              </div>
            )}
          </div>
        )}

        {/* Editor info if modified */}
        {editedByName && (
          <div className="p-2.5 bg-slate-950/60 rounded-xl border border-amber-900/40 space-y-1">
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>Last Edited By</span>
            </div>
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <span className="font-bold text-amber-200 text-sm">{editedByName}</span>
            </div>
            {editedByEmail && (
              <div className="text-[11px] font-mono text-amber-300/80 truncate">
                {editedByEmail}
              </div>
            )}
            {editedAt && (
              <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-0.5">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{formatTime(editedAt)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
