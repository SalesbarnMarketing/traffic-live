import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  MessageSquare, 
  Hash, 
  Plus, 
  Sparkles, 
  MapPin, 
  Clock, 
  Send,
  Radio,
  Share2,
  Settings,
  Image as ImageIcon,
  Download,
  Info
} from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { FeedItem, IncidentReport } from '../types';
import { formatSATime, formatWhatsAppDateTime } from '../utils/dateParser';
import { resolveItemRegion } from '../utils/regionUtils';
import { 
  generateITrafficHashtags, 
  formatITrafficForWhatsApp, 
  formatReportForWhatsApp, 
  copyToClipboard, 
  copyImageToClipboard,
  downloadImageFile,
  openWhatsAppShare, 
  shareToWhatsAppWithMedia,
  resolveShareableImageUrl,
  toHashtag,
  getLocalSocialHashtagSettings,
  getPublicAppUrl,
  APP_PUBLIC_URL,
  WHATSAPP_CHANNEL_URL
} from '../utils/whatsappShare';

interface ShareToWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedItem?: FeedItem | null;
  report?: IncidentReport | null;
  customText?: string;
  bulletinTitle?: string;
  onOpenAdminHashtags?: () => void;
}

export const ShareToWhatsAppModal: React.FC<ShareToWhatsAppModalProps> = ({
  isOpen,
  onClose,
  feedItem,
  report,
  customText,
  bulletinTitle,
  onOpenAdminHashtags
}) => {
  const currentSettings = getLocalSocialHashtagSettings();

  // Resolve attached image or category banner photo URL
  const sharePhotoUrl = feedItem
    ? resolveShareableImageUrl({
        directUrl: feedItem.mediaUrl || feedItem.imageUrl,
        category: feedItem.category,
        subType: feedItem.eventSubType,
        itemId: feedItem.id
      })
    : report
    ? resolveShareableImageUrl({
        directUrl: report.imageUrl || report.resolvedImageUrl,
        category: report.type,
        reportId: report.id
      })
    : '';

  // Extract initial hashtags from either feedItem or report
  const initialGeneratedTags = feedItem 
    ? generateITrafficHashtags(feedItem, currentSettings)
    : report 
    ? generateITrafficHashtags({
        roadwayName: report.roadName,
        location: report.locationName,
        content: report.description,
        category: report.type
      }, currentSettings)
    : currentSettings.defaultTags && currentSettings.defaultTags.length > 0
    ? currentSettings.defaultTags
    : ['#Livetraffic', '#ArriveAlive'];

  const [hashtags, setHashtags] = useState<string[]>(initialGeneratedTags);
  const [newTagInput, setNewTagInput] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [imageCopied, setImageCopied] = useState<boolean>(false);
  const [isDownloadingImage, setIsDownloadingImage] = useState<boolean>(false);
  const [imageDownloaded, setImageDownloaded] = useState<boolean>(false);
  const [activeTemplate, setActiveTemplate] = useState<'standard' | 'urgent' | 'minimal'>('standard');
  const [isSharingMedia, setIsSharingMedia] = useState<boolean>(false);

  // Build the message based on template and current hashtags
  const generateMessageBody = () => {
    const liveAppUrl = getPublicAppUrl();
    if (customText) {
      return `${customText}\n\n${hashtags.join(' ')}`;
    }

    if (feedItem) {
      const province = resolveItemRegion(feedItem);
      if (activeTemplate === 'urgent') {
        const isCrash = feedItem.category === 'accident' || feedItem.category === 'crash';
        const icon = isCrash ? '💥' : '🚨';
        let msg = `*${icon} URGENT TRAFFIC ALERT | ${feedItem.roadwayName || 'Highway Alert'}*\n` +
          `*Location:* ${feedItem.location || 'Corridor'}\n` +
          (province ? `*Province:* ${province}\n` : '') +
          `*Alert:* ${feedItem.content}\n` +
          `*Time:* ${formatWhatsAppDateTime(feedItem.startTime || feedItem.timestamp || feedItem.lastUpdated)}\n\n`;

        msg += `🗺️ Track Live & Report Hazards: ${liveAppUrl}\n\n` +
          `${hashtags.join(' ')}`;
        return msg;
      } else if (activeTemplate === 'minimal') {
        const loc = feedItem.location || (feedItem.roadwayName ? `${feedItem.roadwayName}${feedItem.direction ? ` (${feedItem.direction})` : ''}` : 'Highway');
        let msg = `🚨 *TRAFFIC (${province}):* ${loc} - ${feedItem.content} [${formatWhatsAppDateTime(feedItem.startTime || feedItem.timestamp || feedItem.lastUpdated)}]\n\n`;
        msg += `🗺️ Track Live: ${liveAppUrl}\n\n${hashtags.join(' ')}`;
        return msg;
      }
      return formatITrafficForWhatsApp({ ...feedItem });
    }

    if (report) {
      const province = resolveItemRegion(report);
      if (activeTemplate === 'urgent') {
        const icon = report.type === 'spiking' ? '🚨' : report.type === 'crash' ? '💥' : '⚠️';
        let msg = `*${icon} URGENT ALERT | ${report.title}*\n` +
          `*Location:* ${report.locationName} (${report.roadName})\n` +
          (province ? `*Province:* ${province}\n` : '') +
          `*Severity:* ${report.severity.toUpperCase()}\n` +
          `*Time:* ${formatWhatsAppDateTime(report.createdAt)}\n\n` +
          `*Details:* ${report.description}\n\n` +
          `🗺️ Track Live & Report Hazards: ${liveAppUrl}\n\n` +
          `${hashtags.join(' ')}`;
        return msg;
      }
      return formatReportForWhatsApp(report);
    }

    return `*🚨 LIVE TRAFFIC ALERT | LiveTrafficNPC*\n\nReal-time highway watch, spiking trap warnings, road hazards & live traffic updates.\n\n🗺️ Track Live & Report Hazards: ${liveAppUrl}\n\n${hashtags.join(' ')}`;
  };

  const [messageText, setMessageText] = useState<string>(generateMessageBody());

  // Sync state when modal opens or target item changes
  useEffect(() => {
    if (isOpen) {
      const tags = feedItem 
        ? generateITrafficHashtags(feedItem, currentSettings)
        : report 
        ? generateITrafficHashtags({
            roadwayName: report.roadName,
            location: report.locationName,
            content: report.description,
            category: report.type
          }, currentSettings)
        : currentSettings.defaultTags && currentSettings.defaultTags.length > 0
        ? currentSettings.defaultTags
        : ['#Livetraffic', '#ArriveAlive'];
      setHashtags(tags);
    }
  }, [isOpen, feedItem, report]);

  // Update message when hashtags or template change
  useEffect(() => {
    setMessageText(generateMessageBody());
  }, [activeTemplate, hashtags, customText, feedItem, report, sharePhotoUrl]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    const success = await copyToClipboard(messageText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCopyImage = async () => {
    if (!sharePhotoUrl) return;
    const success = await copyImageToClipboard(sharePhotoUrl);
    if (success) {
      setImageCopied(true);
      setTimeout(() => setImageCopied(false), 3000);
    } else {
      await handleDownloadImage();
    }
  };

  const handleShareWhatsApp = async () => {
    setIsSharingMedia(true);
    try {
      await shareToWhatsAppWithMedia({
        text: messageText,
        imageUrl: sharePhotoUrl || undefined,
        title: 'Traffic Alert | LiveTrafficNPC'
      });
    } finally {
      setIsSharingMedia(false);
    }
  };

  const handleOpenWhatsAppWeb = () => {
    openWhatsAppShare(messageText);
  };

  const handleDownloadImage = async () => {
    if (!sharePhotoUrl) return;
    setIsDownloadingImage(true);
    try {
      const cleanId = (feedItem?.id || report?.id || 'alert').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `livetraffic_${cleanId}_${Date.now()}.png`;
      const ok = await downloadImageFile(sharePhotoUrl, filename);
      if (ok) {
        setImageDownloaded(true);
        setTimeout(() => setImageDownloaded(false), 3000);
      }
    } finally {
      setIsDownloadingImage(false);
    }
  };

  const handleAddTag = (e?: React.FormEvent, tagToAdd?: string) => {
    if (e) e.preventDefault();
    const raw = tagToAdd || newTagInput;
    if (!raw.trim()) return;
    const formatted = raw.trim().startsWith('#') ? raw.trim() : toHashtag(raw.trim());
    if (formatted && !hashtags.includes(formatted)) {
      setHashtags(prev => [...prev, formatted]);
    }
    if (!tagToAdd) setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setHashtags(prev => prev.filter(t => t.toLowerCase() !== tagToRemove.toLowerCase()));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0A0B0D]/85 backdrop-blur-md overflow-hidden animate-fadeIn">
      <div className="bg-[#0F1115] border border-emerald-500/40 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-[#0C1713] via-[#0F1D17] to-[#0C1713] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  Copy for WhatsApp Channel
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Channel Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Formatted with bold headers, live GPS coordinates, photo links, and corridor #tags
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Format Template Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Message Format Style
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setActiveTemplate('standard')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border flex flex-col items-center justify-center text-center ${
                  activeTemplate === 'standard'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                    : 'bg-[#050608] text-slate-400 hover:text-white border-slate-800'
                }`}
              >
                <span>📋 Full Report</span>
                <span className="text-[10px] text-slate-500 font-normal">Details + GPS</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTemplate('urgent')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border flex flex-col items-center justify-center text-center ${
                  activeTemplate === 'urgent'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
                    : 'bg-[#050608] text-slate-400 hover:text-white border-slate-800'
                }`}
              >
                <span>🚨 Urgent Alert</span>
                <span className="text-[10px] text-slate-500 font-normal">High Priority / Crash</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTemplate('minimal')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border flex flex-col items-center justify-center text-center ${
                  activeTemplate === 'minimal'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                    : 'bg-[#050608] text-slate-400 hover:text-white border-slate-800'
                }`}
              >
                <span>⚡ Quick Ticker</span>
                <span className="text-[10px] text-slate-500 font-normal">Single Line + Tags</span>
              </button>
            </div>
          </div>

          {/* Attached Photo / Banner Preview Card */}
          {sharePhotoUrl && (
            <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/40 rounded-2xl p-3 sm:p-4 space-y-3 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-emerald-500/40 bg-black shrink-0 relative shadow-md">
                    <img 
                      src={sharePhotoUrl} 
                      alt="Alert Banner" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-black border border-emerald-500/40 uppercase tracking-wider flex items-center space-x-1">
                        <ImageIcon className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>Incident Photo / Banner</span>
                      </span>
                    </div>
                    <div className="text-xs text-white font-bold truncate mt-1">
                      {feedItem?.roadwayName || report?.roadName || report?.title || 'Verified Incident Image'}
                    </div>
                    <div className="text-[10.5px] text-slate-400 truncate">
                      {feedItem?.location || report?.locationName || 'Ready for WhatsApp Channel & Groups'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <button
                    type="button"
                    onClick={handleCopyImage}
                    className={`flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer border shadow-sm ${
                      imageCopied
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border-emerald-500/40'
                    }`}
                    title="Copy photo directly to clipboard to paste (Ctrl+V) into WhatsApp"
                  >
                    {imageCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{imageCopied ? 'Photo Copied!' : 'Copy Photo'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isDownloadingImage}
                    onClick={handleDownloadImage}
                    className={`flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer border shadow-sm ${
                      imageDownloaded
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                    title="Save image to your device (Gallery / Downloads)"
                  >
                    {isDownloadingImage ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : imageDownloaded ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-slate-950" />
                        <span>Saved!</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Save Image</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Helpful instructions for WhatsApp image display */}
              <div className="bg-[#050608]/70 border border-emerald-500/20 rounded-lg p-2.5 flex items-start space-x-2 text-[10.5px] text-slate-300 leading-relaxed">
                <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-emerald-300 font-bold">How to display image in WhatsApp:</span>
                  <ul className="list-disc list-inside mt-0.5 text-slate-400 space-y-0.5">
                    <li><strong className="text-slate-200">Mobile Phone:</strong> Tap <strong className="text-emerald-300">Save Image</strong> to save to your Gallery or tap <strong className="text-emerald-300">Share to WhatsApp</strong> below.</li>
                    <li><strong className="text-slate-200">WhatsApp Web/PC:</strong> Click <strong className="text-emerald-300">Copy Photo</strong>, click your WhatsApp chat, and press <strong className="text-white">Ctrl+V</strong> to paste the image.</li>
                    <li><strong className="text-slate-200">Channels:</strong> When you paste the link, WhatsApp unfurls the official LiveTraffic banner card.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* i-Traffic Extracted #Tags Section */}
          <div className="bg-[#050608] border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Hash className="w-3.5 h-3.5 text-amber-400" />
                <span>Active Broadcast #Tags ({hashtags.length})</span>
              </span>
              {onOpenAdminHashtags && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdminHashtags();
                  }}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1 cursor-pointer transition hover:underline"
                >
                  <Settings className="w-3 h-3" />
                  <span>Configure Defaults in Admin</span>
                </button>
              )}
            </div>

            {/* Tag Pills with 1-Click Remove */}
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {hashtags.length === 0 ? (
                <span className="text-[11px] text-slate-500 italic p-1">No tags selected. Add from presets or type below.</span>
              ) : (
                hashtags.map(tag => (
                  <span
                    key={tag}
                    className="bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-sm group hover:border-red-500/40 hover:bg-red-950/30 transition"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-emerald-400 group-hover:text-red-400 ml-1 p-0.5 rounded transition cursor-pointer"
                      title={`Remove ${tag}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Quick-Add Preset Chips (e.g. #MothersDay, #WeekendTraffic, #SevereRain) */}
            {currentSettings.quickAddPresets && currentSettings.quickAddPresets.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Quick Add Presets:</span>
                  </span>
                  <span className="text-[9px] text-slate-500">1-click to toggle</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {currentSettings.quickAddPresets.map(preset => {
                    const isAdded = hashtags.includes(preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          if (isAdded) {
                            handleRemoveTag(preset);
                          } else {
                            handleAddTag(undefined, preset);
                          }
                        }}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition flex items-center space-x-1 cursor-pointer ${
                          isAdded
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                            : 'bg-[#0F1115] text-slate-400 hover:text-amber-300 hover:border-amber-500/40 border-slate-800'
                        }`}
                      >
                        <span>{isAdded ? '✓' : '+'}</span>
                        <span>{preset}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add Custom Tag Input */}
            <form onSubmit={handleAddTag} className="flex items-center space-x-2 pt-1 border-t border-slate-800/80">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">#</span>
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value.replace(/^#/, ''))}
                  placeholder="Add custom tag (e.g. MothersDay, FestiveTraffic, N1South)..."
                  className="w-full bg-[#0F1115] border border-slate-700/80 rounded-xl pl-6 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1 transition cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tag</span>
              </button>
            </form>
          </div>

          {/* Official WhatsApp Channel Join Card */}
          <div className="bg-gradient-to-r from-emerald-950/30 via-slate-900 to-[#0B1510] border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#25D366]/20 border border-[#25D366]/60 flex items-center justify-center shrink-0">
                <WhatsAppIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate flex items-center space-x-1.5">
                  <span>Official Live Traffic Channel</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30 uppercase">Broadcast</span>
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  Follow for instant 24/7 verified highway alerts
                </div>
              </div>
            </div>
            <a
              href={WHATSAPP_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-[#25D366]/20 hover:bg-[#25D366] hover:text-slate-950 text-[#25D366] border border-[#25D366]/40 rounded-lg text-xs font-bold transition flex items-center space-x-1 shrink-0"
            >
              <span>Join</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* WhatsApp Formatted Preview Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                WhatsApp Channel Message Preview (Editable)
              </label>
              <span className="text-[10px] text-emerald-400 font-mono">
                {messageText.length} characters
              </span>
            </div>
            <textarea
              rows={8}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full bg-[#050608] border border-slate-700/80 rounded-xl p-3.5 text-xs text-slate-100 font-mono leading-relaxed focus:outline-none focus:border-emerald-500 resize-y"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-[#050608] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2">
            {copied && (
              <span className="text-emerald-400 font-bold text-xs flex items-center space-x-1 animate-fadeIn">
                <Check className="w-4 h-4" />
                <span>Text copied! Paste into WhatsApp Channel.</span>
              </span>
            )}
            {imageCopied && (
              <span className="text-emerald-400 font-bold text-xs flex items-center space-x-1 animate-fadeIn">
                <Check className="w-4 h-4" />
                <span>Photo copied! Press Ctrl+V in WhatsApp.</span>
              </span>
            )}
            {imageDownloaded && (
              <span className="text-emerald-400 font-bold text-xs flex items-center space-x-1 animate-fadeIn">
                <Check className="w-4 h-4" />
                <span>Image saved to device!</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2.5 ml-auto">
            {sharePhotoUrl && (
              <button
                type="button"
                onClick={handleCopyImage}
                className="bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition cursor-pointer border border-emerald-500/30"
                title="Copy photo to clipboard"
              >
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span>{imageCopied ? '✓ PHOTO COPIED' : 'COPY PHOTO'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopy}
              className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center space-x-2 transition cursor-pointer shadow-lg ${
                copied
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '✓ COPIED TEXT' : 'COPY TEXT'}</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              disabled={isSharingMedia}
              className="bg-[#25D366] hover:bg-[#20ba5a] text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-lg shadow-emerald-500/20"
              title="Share directly to WhatsApp"
            >
              <WhatsAppIcon variant="monochrome" className="w-4 h-4 text-slate-950" />
              <span>{isSharingMedia ? 'SHARING...' : 'SHARE TO WHATSAPP'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
