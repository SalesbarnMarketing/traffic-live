import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Share2, 
  Copy, 
  Check, 
  X, 
  Heart, 
  Sparkles 
} from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { copyToClipboard } from '../utils/whatsappShare';

export const CANONICAL_SHARE_APP_URL = 'https://trafficlive.co.za/app/';

interface ShareAppFeedCardProps {
  variant?: 'card' | 'compact' | 'minimal';
  className?: string;
  isBubbledToTop?: boolean;
  onDismiss?: () => void;
}

export const ShareAppFeedCard: React.FC<ShareAppFeedCardProps> = ({
  variant = 'card',
  className = '',
  isBubbledToTop = false,
  onDismiss
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isAttentionShrunk, setIsAttentionShrunk] = useState<boolean>(false);

  // Attention-grabbing animation: smooth scale and neon pulse every 1 minute (60,000ms)
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAttentionShrunk(true);
      const timeout = setTimeout(() => {
        setIsAttentionShrunk(false);
      }, 2400);
      return () => clearTimeout(timeout);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  if (isDismissed) {
    return null;
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  const shareUrl = CANONICAL_SHARE_APP_URL;
  const shareText = "🚗 Stay safe on the road! Check real-time highway alerts, accidents, and route hazards across South Africa on Live Traffic: " + shareUrl + " — Share with family & friends to arrive alive! 🇿🇦";

  const handleWhatsAppShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const encoded = encodeURIComponent(shareText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Live Traffic South Africa',
          text: 'Real-time road alerts, highway incidents, and safety updates across South Africa.',
          url: shareUrl
        });
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          handleCopyLink(e);
        }
      }
    } else {
      handleCopyLink(e);
    }
  };

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  // MINIMAL & COMPACT VARIANTS
  if (variant === 'minimal' || variant === 'compact') {
    return (
      <div
        id={`feed-share-card-${variant}`}
        className={`bg-gradient-to-r from-[#0C151D] via-[#0F141C] to-[#0A1017] rounded-xl p-3 sm:px-3.5 sm:py-2.5 shadow-md relative origin-center will-change-transform transform-gpu ${
          isAttentionShrunk
            ? 'animate-attention-shrink-cyan z-30'
            : isBubbledToTop
              ? 'border-2 border-cyan-400/90 ring-2 ring-cyan-500/40 shadow-xl shadow-cyan-950/40 bg-gradient-to-r from-[#0B1E2B] via-[#0D1824] to-[#0A121A]'
              : 'border border-cyan-500/40 animate-cyan-pulse'
        } ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Left info */}
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-inner ${
                isBubbledToTop 
                  ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-300' 
                  : 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-400'
              }`}>
                <Users className="w-4 h-4" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                {isBubbledToTop && (
                  <span className="bg-gradient-to-r from-amber-500/25 to-cyan-500/25 text-amber-300 border border-amber-400/50 text-[9px] font-black uppercase px-1.5 py-0.5 rounded flex items-center gap-1 animate-pulse shrink-0">
                    <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                    <span>Top Spotlight</span>
                  </span>
                )}
                <span className="text-xs sm:text-sm font-bold text-white truncate">
                  Share Live Traffic with Family & Friends
                </span>
                <span className="bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>trafficlive.co.za/app/</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate mt-0.5">
                Help loved ones avoid highway hazards, jams, and arrive alive.
              </p>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
            <button
              type="button"
              id="feed-share-whatsapp-btn-compact"
              onClick={handleWhatsAppShare}
              className="bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1da850] text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-md shadow-emerald-950/50 hover:scale-105 active:scale-95"
              title="Share via WhatsApp"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 text-white shrink-0" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              id="feed-share-copy-btn-compact"
              onClick={handleCopyLink}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                copied
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Copy app link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-slate-950" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {hasNativeShare && (
              <button
                type="button"
                id="feed-share-native-btn-compact"
                onClick={handleNativeShare}
                className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 p-1.5 rounded-lg text-xs transition cursor-pointer"
                title="More sharing options"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              id="feed-share-dismiss-btn-compact"
              onClick={handleDismiss}
              className="text-slate-500 hover:text-slate-300 p-1 rounded-lg transition cursor-pointer ml-0.5"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // DETAILED / GRID CARD VARIANT
  return (
    <div
      id="feed-share-card-detailed"
      className={`bg-gradient-to-br from-[#0B151F] via-[#0E1520] to-[#0A1017] rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden flex flex-col justify-between origin-center will-change-transform transform-gpu ${
        isAttentionShrunk
          ? 'animate-attention-shrink-cyan z-30'
          : isBubbledToTop
            ? 'border-2 border-cyan-400 ring-2 ring-cyan-500/40 shadow-2xl shadow-cyan-950/50 bg-gradient-to-br from-[#0C202F] via-[#0F1A28] to-[#0A121A]'
            : 'border border-cyan-500/40 animate-cyan-pulse'
      } ${className}`}
    >
      {/* Subtle ambient background glow */}
      <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none -mr-12 -mt-12 ${
        isBubbledToTop ? 'bg-cyan-400/25 animate-pulse' : 'bg-cyan-500/15'
      }`} />

      <div className="relative z-10 space-y-2.5">
        {/* Top meta row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="relative shrink-0">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-inner ${
                isBubbledToTop
                  ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-300'
                  : 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-400'
              }`}>
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                {isBubbledToTop && (
                  <span className="bg-gradient-to-r from-amber-500/25 to-cyan-500/25 text-amber-300 border border-amber-400/50 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>BUBBLED TO TOP</span>
                  </span>
                )}
                <span className="bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>COMMUNITY ROAD SAFETY</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono flex items-center space-x-1">
                  <Heart className="w-3 h-3 text-rose-400 fill-rose-400/30" />
                  <span>Arrive Alive</span>
                </span>
                <span className="text-[10px] text-cyan-300 font-mono bg-cyan-950/60 border border-cyan-500/30 px-1.5 py-0.5 rounded font-bold">
                  trafficlive.co.za/app/
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                Share Live Traffic with Family & Friends
              </h3>
            </div>
          </div>

          <button
            type="button"
            id="feed-share-dismiss-btn-detailed"
            onClick={handleDismiss}
            className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800/60 transition cursor-pointer shrink-0"
            title="Dismiss card"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description body */}
        <p className="text-xs sm:text-[13px] text-slate-200 leading-relaxed font-normal">
          Know someone commuting or taking a road trip today? Share Live Traffic to help family and friends steer clear of major highway crashes, severe congestion, and unexpected road hazards.
        </p>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-slate-800/80">
          <button
            type="button"
            id="feed-share-whatsapp-btn-detailed"
            onClick={handleWhatsAppShare}
            className="bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1da850] text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-all flex items-center space-x-2 cursor-pointer shadow-md shadow-emerald-950/50 hover:scale-[1.02] active:scale-[0.98]"
            title="Share via WhatsApp"
          >
            <WhatsAppIcon className="w-4 h-4 text-white shrink-0" />
            <span>Share on WhatsApp</span>
          </button>

          <button
            type="button"
            id="feed-share-copy-btn-detailed"
            onClick={handleCopyLink}
            className={`font-bold px-3.5 py-2 rounded-xl text-xs transition-all flex items-center space-x-2 cursor-pointer border ${
              copied
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-slate-600'
            }`}
            title="Copy app link to clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4 text-cyan-400" />}
            <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
          </button>

          {hasNativeShare && (
            <button
              type="button"
              id="feed-share-native-btn-detailed"
              onClick={handleNativeShare}
              className="bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-bold px-3 py-2 rounded-xl text-xs transition flex items-center space-x-1.5 cursor-pointer"
              title="More sharing options"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden xs:inline">More</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
