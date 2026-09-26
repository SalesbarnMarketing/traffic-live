import React, { useState } from 'react';
import { IncidentReport, RegisteredUser } from '../types';
import { X, ThumbsUp, ShieldCheck, MapPin, AlertTriangle, Sparkles, Navigation, Share2, Send, Copy, Check, MessageSquare, Trash2, AlertOctagon, RefreshCw, Edit3 } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { formatReportForWhatsApp, copyToClipboard, openWhatsAppShare } from '../utils/whatsappShare';
import { EditIncidentModal } from './EditIncidentModal';
import { ImageLightboxModal, ImageLightboxData } from './ImageLightboxModal';
import { AdminAuditBadge } from './AdminAuditBadge';
import { isActualAttachedImage, getCategoryDefaultImage } from '../utils/categoryImageHelper';
import { canUserDeletePost, getAdminRequestHeaders, isPermittedAdminRole } from '../utils/authUtils';

interface ReportDetailModalProps {
  report: IncidentReport | null;
  onClose: () => void;
  onUpvote: (id: string) => Promise<void>;
  onDeny?: (id: string) => Promise<void>;
  onShareToFeed?: (report: IncidentReport) => void;
  onOpenShareToX?: (options?: any) => void;
  onOpenShareToWhatsApp?: (options?: { report?: IncidentReport }) => void;
  onDeleteReport?: (id: string) => Promise<void> | void;
  onEditReport?: (id: string, updatedFields: Partial<IncidentReport>) => Promise<void>;
  currentUser?: RegisteredUser | null;
  isAdmin?: boolean;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  onClose,
  onUpvote,
  onDeny,
  onShareToFeed,
  onOpenShareToX,
  onOpenShareToWhatsApp,
  onDeleteReport,
  onEditReport,
  currentUser,
  isAdmin
}) => {
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [isCopiedForWhatsApp, setIsCopiedForWhatsApp] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDenying, setIsDenying] = useState<boolean>(false);
  const [deniedToast, setDeniedToast] = useState<string | null>(null);
  
  // Deletion States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Lightbox State
  const [lightboxData, setLightboxData] = useState<ImageLightboxData | null>(null);

  if (!report) return null;

  const isSpiking = report.type === 'spiking';

  const now = Date.now();
  const reportTime = new Date(report.createdAt).getTime();
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
  const ageMs = now - reportTime;
  const minutesLeft = Math.max(0, Math.ceil((TWO_HOURS_MS - ageMs) / 60000));
  const isExpiringSoon = minutesLeft <= 15;
  const formattedTimeLeft = minutesLeft >= 60 
    ? `${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}m` 
    : `${minutesLeft}m`;

  const handleDenyAction = async () => {
    if (isDenying) return;
    setIsDenying(true);
    try {
      if (onDeny) {
        await onDeny(report.id);
      } else {
        await fetch(`/api/reports/${encodeURIComponent(report.id)}/deny`, { method: 'POST' });
      }
      setDeniedToast("❌ Marked as denied / clear");
      setTimeout(() => {
        setDeniedToast(null);
        onClose();
      }, 1500);
    } catch (e) {
      console.warn("Deny error:", e);
    } finally {
      setIsDenying(false);
    }
  };

  const handlePostToWhatsApp = async () => {
    if (!report) return;
    const formatted = formatReportForWhatsApp(report);
    await copyToClipboard(formatted);
    setIsCopiedForWhatsApp(true);
    setTimeout(() => setIsCopiedForWhatsApp(false), 3000);
    openWhatsAppShare(formatted);
  };

  const handleCopyForWhatsApp = handlePostToWhatsApp;

  const isUserAdmin = Boolean(
    isAdmin || 
    (currentUser && isPermittedAdminRole(currentUser.role, currentUser?.email)) ||
    (typeof window !== 'undefined' && Boolean(sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken')))
  );
  const canDelete = canUserDeletePost(report, currentUser, isUserAdmin);

  const handleShareToFeed = async () => {
    if (!isUserAdmin) return;
    const adminToken = typeof window !== 'undefined' ? (sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken')) : null;
    setIsSharing(true);
    setShareSuccess(null);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user-role': currentUser?.role || 'super_admin'
      };
      if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }
      if (currentUser?.email) {
        headers['x-user-email'] = currentUser.email;
      }

      const res = await fetch(`/api/reports/${report.id}/share-to-feed`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ sharedBy: currentUser?.fullName ? `${currentUser.fullName} (${currentUser.role || 'Admin'})` : 'Patrol Admin' })
      });
      if (res.ok) {
        setShareSuccess('✓ Broadcasted to Feed!');
        if (onShareToFeed) onShareToFeed(report);
        setTimeout(() => setShareSuccess(null), 3500);
      } else {
        const err = await res.json().catch(() => ({}));
        setShareSuccess(err.error || 'Failed to share');
        setTimeout(() => setShareSuccess(null), 3500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSharing(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete) {
      setDeleteError("Permission denied: Only administrators or the original composer can delete this report.");
      return;
    }
    setIsDeleting(true);
    setDeleteError(null);
    try {
      if (onDeleteReport) {
        await onDeleteReport(report.id);
      } else {
        const headers = getAdminRequestHeaders(currentUser);
        await fetch(`/api/reports/${encodeURIComponent(report.id)}`, { method: 'DELETE', headers });
      }

      onClose();
    } catch (err: any) {
      console.error("Error deleting report:", err);
      setDeleteError(err?.message || 'Failed to delete report. Please try again.');
      setIsDeleting(false);
    }
  };

  const displayImage = (report.imageUrl && isActualAttachedImage(report.imageUrl) ? report.imageUrl : undefined) || getCategoryDefaultImage(report.type || (report as any).category);
  const hasValidImage = Boolean(displayImage && isActualAttachedImage(displayImage));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pb-24 sm:pb-6 bg-[#0A0B0D]/85 backdrop-blur-sm overflow-hidden animate-fadeIn">
      <div className="bg-[#0F1115] border border-slate-800 rounded-2xl w-full max-w-xl max-h-[78vh] sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-300 relative">
        {/* Modal Header */}
        <div 
          onClick={() => {
            if (hasValidImage && displayImage) {
              setLightboxData({
                imageUrl: displayImage,
                title: report.title,
                location: [report.locationName, report.roadName].filter(Boolean).join(' • ') || 'No Location',
                description: report.description,
                timestamp: report.createdAt,
                category: report.type,
                author: report.reporterName
              });
            }
          }}
          className={`relative h-40 sm:h-48 bg-[#0A0B0D] overflow-hidden shrink-0 ${hasValidImage ? 'cursor-pointer group' : ''}`}
        >
          {hasValidImage && displayImage ? (
            <>
              <img src={displayImage || undefined} alt={report.title} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition duration-300" />
              <div className="absolute top-3 left-3 bg-slate-950/80 hover:bg-slate-900 text-cyan-300 border border-cyan-500/40 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center space-x-1 shadow-lg z-10">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Tap to Zoom Photo</span>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#0A0B0D]">
              <AlertTriangle className="w-16 h-16 text-amber-500/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F1115] via-[#0F1115]/40 to-transparent pointer-events-none" />

          {/* Top Right Header Controls: Delete Pin & Close */}
          <div className="absolute top-3 right-3 flex items-center space-x-2 z-20" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              disabled={!canDelete}
              onClick={() => {
                if (canDelete) setShowDeleteConfirm(true);
              }}
              className={`p-2 rounded-full transition shadow-lg flex items-center justify-center ${
                canDelete
                  ? 'bg-rose-950/80 hover:bg-rose-900/90 text-rose-300 hover:text-rose-100 border border-rose-500/50 cursor-pointer'
                  : 'bg-slate-900/70 text-slate-600 border border-slate-800 cursor-not-allowed opacity-40'
              }`}
              title={canDelete ? "Delete this Map Pin" : "Delete disabled for motorists: Only administrators or the original composer can delete this post"}
              aria-label={canDelete ? "Delete this Map Pin" : "Delete disabled for motorists"}
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="bg-slate-950/80 hover:bg-slate-900 text-white p-2 rounded-full hover:bg-slate-950 transition border border-slate-700/60 shadow-lg cursor-pointer flex items-center justify-center"
              title="Close modal"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="absolute bottom-3 left-4 right-4">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isSpiking ? 'bg-red-600 text-white' : 'bg-amber-500 text-slate-950'}`}>
                {report.type.toUpperCase()}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 ${isExpiringSoon ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}`}>
                <span>⏱️</span>
                <span>{minutesLeft > 0 ? `Expires in ${formattedTimeLeft}` : 'Expired'}</span>
              </span>
              {report.verifiedByAdmin ? (
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded flex items-center space-x-1 uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Admin Verified</span>
                </span>
              ) : (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/50 text-[10px] font-bold px-2 py-0.5 rounded flex items-center space-x-1 uppercase tracking-wider shadow-sm">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span>⚠️ Not Verified • User Post</span>
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-white leading-tight uppercase tracking-wide">{report.title}</h3>
          </div>
        </div>

        {/* Denied Toast Feedback */}
        {deniedToast && (
          <div className="bg-rose-600 text-white font-bold px-4 py-2 text-xs flex items-center justify-center space-x-2 animate-fadeIn">
            <span>{deniedToast}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto">
          {report.verifiedByAdmin ? (
            <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-xl p-3 flex items-start space-x-2.5 text-xs text-emerald-200 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-300 uppercase tracking-wider">🛡️ ADMIN VERIFIED: </span>
                This road alert has been verified and confirmed by patrol command. Active on monitoring network.
              </div>
            </div>
          ) : (
            <div className="bg-amber-950/40 border border-amber-500/50 rounded-xl p-3 flex items-start space-x-2.5 text-xs text-amber-200 shadow-sm">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="font-bold text-amber-300 uppercase tracking-wider">⚠️ NOT VERIFIED • USER POST: </span>
                This road report was submitted directly by a community motorist and has not yet been verified by patrol command. Exercise caution.
              </div>
            </div>
          )}
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold border-b border-slate-800 pb-3">
            <span>
              {report.locationName || report.roadName
                ? `📍 ${[report.locationName, report.roadName].filter(Boolean).join(' • ')}`
                : '📢 General Advisory (No Location)'}
            </span>
            <span>{new Date(report.createdAt).toLocaleDateString()}</span>
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Description & Details</h4>
            <p className="text-xs text-slate-300 leading-relaxed bg-[#0A0B0D] p-3.5 rounded-xl border border-slate-800">
              {report.description}
            </p>
          </div>

          {/* AI Analysis */}
          {report.aiAnalysis && (
            <div className="bg-[#0A0B0D] border border-amber-500/30 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-amber-400">
                <span className="flex items-center space-x-1 uppercase tracking-wider text-[11px]">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>AI Threat Analysis & Guidance</span>
                </span>
                <span className="bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded text-[10px]">
                  Risk: {report.aiAnalysis.riskScore}/100
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">{report.aiAnalysis.summary}</p>
              {report.aiAnalysis.warningText && (
                <p className="text-amber-400 font-bold bg-amber-500/10 p-2 rounded border border-amber-500/30 text-[11px]">
                  ⚠️ {report.aiAnalysis.warningText}
                </p>
              )}
            </div>
          )}

          {/* Resolution Proof & Admin Feedback Section */}
          {(report.status === 'resolved' || report.resolvedImageUrl || report.resolutionNotes) && (
            <div className="bg-emerald-950/40 border-2 border-emerald-500/50 p-4 rounded-xl space-y-3 text-xs">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold uppercase tracking-wider text-xs">
                <ShieldCheck className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                <span>{report.type === 'pothole' ? '🔨 Pothole Fixed & Verified' : '✅ Hazard Resolved'}</span>
                {report.resolvedAt && (
                  <span className="text-[10px] text-slate-400 font-normal ml-auto">
                    {new Date(report.resolvedAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              {report.resolutionNotes && (
                <p className="text-slate-200 text-xs italic bg-slate-950/80 p-2.5 rounded-lg border border-emerald-500/30">
                  💬 Admin Feedback: "{report.resolutionNotes}"
                </p>
              )}

              {/* Before & After Photo Comparison */}
              {report.resolvedImageUrl && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                    📷 Before & After Repair Visual Proof
                  </span>
                  <div className="grid grid-cols-1 min-[450px]:grid-cols-2 gap-2">
                    {isActualAttachedImage(report.imageUrl) && (
                      <div 
                        onClick={() => setLightboxData({
                          imageUrl: report.imageUrl!,
                          title: `Before Repair: ${report.title}`,
                          location: report.locationName,
                          description: report.description,
                          timestamp: report.createdAt,
                          category: report.type
                        })}
                        className="space-y-1 cursor-pointer group"
                      >
                        <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider block bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30 flex items-center justify-between">
                          <span>BEFORE: Reported Issue</span>
                          <span className="text-[8px] text-cyan-300 group-hover:underline">Zoom 🔍</span>
                        </span>
                        <img
                          src={report.imageUrl}
                          alt="Before Report"
                          className="w-full h-32 object-cover rounded-lg border border-slate-800 group-hover:border-amber-400 transition"
                        />
                      </div>
                    )}
                    <div 
                      onClick={() => setLightboxData({
                        imageUrl: report.resolvedImageUrl!,
                        title: `Fixed & Verified Proof: ${report.title}`,
                        location: report.locationName,
                        description: report.resolutionNotes || 'Official resolution proof photo',
                        timestamp: report.resolvedAt || report.createdAt,
                        category: 'Resolution Proof'
                      })}
                      className="space-y-1 cursor-pointer group"
                    >
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40 flex items-center justify-between">
                        <span>AFTER: Admin Fixed Photo</span>
                        <span className="text-[8px] text-cyan-300 group-hover:underline">Zoom 🔍</span>
                      </span>
                      <img
                        src={report.resolvedImageUrl}
                        alt="Resolution Proof"
                        className="w-full h-32 object-cover rounded-lg border-2 border-emerald-500/60 shadow-md group-hover:border-emerald-400 transition"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reporter Info */}
          <div className="text-xs text-slate-400 flex items-center justify-between pt-1">
            <span>Reported by: <strong className="text-slate-200">{report.reporterSurname && !report.reporterName.toLowerCase().includes(report.reporterSurname.toLowerCase()) ? `${report.reporterName} ${report.reporterSurname}` : report.reporterName}</strong></span>
            <span>Severity: <strong className="text-amber-500 uppercase font-bold">{report.severity}</strong></span>
          </div>

          {/* Admin Verification & Audit Attribution */}
          <AdminAuditBadge 
            isAdmin={isUserAdmin} 
            report={report} 
            variant="full" 
          />

          {/* Actions Bar */}
          <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onUpvote(report.id)}
                className="flex items-center space-x-1.5 bg-[#0A0B0D] hover:bg-slate-800 text-amber-500 font-bold px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition border border-slate-800 cursor-pointer"
                title="Confirm hazard is active"
              >
                <ThumbsUp className="w-4 h-4" />
                <span>Confirm ({report.upvotes || 1})</span>
              </button>

              {/* Deny / Mark Cleared Button */}
              <button
                type="button"
                onClick={handleDenyAction}
                disabled={isDenying}
                className="flex items-center space-x-1.5 bg-[#0A0B0D] hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 font-bold px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition border border-slate-800 hover:border-rose-500/40 cursor-pointer"
                title="Deny / Mark hazard as false or cleared"
              >
                <AlertOctagon className="w-4 h-4 text-rose-500" />
                <span>{isDenying ? 'Denying...' : `Deny / Clear (${report.downvotes || 0})`}</span>
              </button>

              {/* Post to WhatsApp */}
              <button
                type="button"
                onClick={handlePostToWhatsApp}
                className={`flex items-center space-x-1.5 font-bold px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition shadow-md cursor-pointer ${
                  isCopiedForWhatsApp
                    ? 'bg-[#25D366] text-slate-950 font-black'
                    : 'bg-[#071910] hover:bg-[#0c291b] text-emerald-300 hover:text-white'
                }`}
                title="Post formatted hazard report with #Tags to WhatsApp"
              >
                {isCopiedForWhatsApp ? (
                  <>
                    <Check className="w-4 h-4 text-slate-950" />
                    <span>✓ Opening WhatsApp...</span>
                  </>
                ) : (
                  <>
                    <WhatsAppIcon className="w-4 h-4 shrink-0" />
                    <span>Post to WhatsApp</span>
                  </>
                )}
              </button>

              {onOpenShareToWhatsApp && (
                <button
                  type="button"
                  onClick={() => onOpenShareToWhatsApp({ report })}
                  className="flex items-center space-x-1 bg-[#050608] hover:bg-emerald-950/60 text-emerald-300 font-bold px-3 py-2.5 rounded-xl text-xs uppercase tracking-wider transition border border-slate-700/80 hover:border-emerald-500/40 shadow-md cursor-pointer"
                  title="Open WhatsApp customize modal"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>
              )}

              {onOpenShareToX && (
                <button
                  type="button"
                  onClick={() => onOpenShareToX({ report })}
                  className="flex items-center space-x-1.5 bg-[#050608] hover:bg-black text-white font-bold px-3 py-2.5 rounded-xl text-xs uppercase tracking-wider transition border border-slate-700/80 hover:border-slate-500 shadow-md cursor-pointer"
                  title="Share this hazard report to X.com"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span>X</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Admin Edit Incident Report Info Button */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex items-center space-x-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-white font-bold px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition border border-amber-500/40 hover:border-amber-400 shadow-lg cursor-pointer"
                  title="Edit report details, fix typos or update location"
                >
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <span>Edit Info</span>
                </button>
              )}

              {/* Delete / Remove Pin Button (Disabled for motorists, enabled for admin or author) */}
              <button
                type="button"
                disabled={!canDelete}
                onClick={() => {
                  if (canDelete) setShowDeleteConfirm(true);
                }}
                className={`flex items-center space-x-1.5 font-bold px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition border shadow-lg ${
                  canDelete
                    ? 'bg-rose-950/70 hover:bg-rose-900 text-rose-300 hover:text-white border-rose-500/40 hover:border-rose-400 cursor-pointer'
                    : 'bg-slate-900/70 text-slate-600 border border-slate-800 cursor-not-allowed opacity-40'
                }`}
                title={canDelete ? "Delete this hazard map pin" : "Delete disabled for motorists: Only administrators or the original composer can delete this post"}
              >
                <Trash2 className="w-4 h-4 text-rose-400/60" />
                <span>Delete Pin</span>
              </button>

              {/* Share to Feed Button (Admin Only) */}
              {isUserAdmin && (
                <button
                  type="button"
                  onClick={handleShareToFeed}
                  disabled={isSharing}
                  className={`flex items-center space-x-1.5 font-bold px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition shadow-lg cursor-pointer ${
                    shareSuccess
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  <Share2 className="w-4 h-4 text-amber-400" />
                  <span>{isSharing ? 'Sharing...' : shareSuccess || 'Share to Feed'}</span>
                </button>
              )}

              {report.latitude !== undefined && report.longitude !== undefined && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition shadow-lg"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Google Maps</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Edit Report Modal */}
        {isEditModalOpen && (
          <EditIncidentModal
            report={report}
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSave={async (id, fields) => {
              if (onEditReport) {
                await onEditReport(id, fields);
              } else {
                await fetch(`/api/reports/${encodeURIComponent(id)}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-user-role': currentUser?.role || '',
                    'x-user-email': currentUser?.email || '',
                    'Authorization': `Bearer ${sessionStorage.getItem('adminToken') || ''}`
                  },
                  body: JSON.stringify(fields)
                });
              }
              setIsEditModalOpen(false);
              onClose();
            }}
            isPending={report.status === 'pending'}
          />
        )}

        {/* Delete Confirmation Overlay Modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 z-50 bg-[#0A0B0D]/95 backdrop-blur-md p-6 flex flex-col justify-center items-center text-center animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 border-2 border-rose-500/40 flex items-center justify-center text-rose-400 mb-4 shadow-lg">
              <Trash2 className="w-7 h-7" />
            </div>

            <h4 className="text-base sm:text-lg font-black text-white uppercase tracking-wide mb-2">
              Delete Map Pin?
            </h4>

            <p className="text-xs sm:text-sm text-slate-300 max-w-md mb-2 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">"{report.title}"</strong>{report.locationName ? <> at <strong className="text-amber-400">{report.locationName}</strong></> : ''}?
            </p>
            <p className="text-xs text-rose-400 font-semibold mb-6">
              ⚠️ This will permanently remove the hazard pin from the live map for all drivers.
            </p>

            {deleteError && (
              <div className="bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs p-3 rounded-xl mb-4 max-w-md flex items-center space-x-2">
                <AlertOctagon className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center space-x-3 w-full max-w-xs">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition border border-slate-700 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Full-Resolution Interactive Image Lightbox Modal */}
      {lightboxData && (
        <ImageLightboxModal
          isOpen={Boolean(lightboxData)}
          data={lightboxData}
          onClose={() => setLightboxData(null)}
          onShareToWhatsApp={onOpenShareToWhatsApp ? () => {
            onOpenShareToWhatsApp({ report });
          } : undefined}
        />
      )}
    </div>
  );
};

