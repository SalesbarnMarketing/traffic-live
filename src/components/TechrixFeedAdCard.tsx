import React, { useState, useEffect } from 'react';
import { Sparkles, ExternalLink, Code2, Globe, ShieldCheck, X } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { safeOpenAdUrl } from '../utils/adUrlHelper';

interface TechrixFeedAdCardProps {
  variant?: 'card' | 'compact' | 'minimal';
  className?: string;
  onDismiss?: () => void;
}

export const TechrixFeedAdCard: React.FC<TechrixFeedAdCardProps> = ({
  variant = 'card',
  className = '',
  onDismiss
}) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isVisibleInCycle, setIsVisibleInCycle] = useState<boolean>(true);
  const [isAttentionShrunk, setIsAttentionShrunk] = useState<boolean>(false);
  const techrixAdId = 'ad-adv-1787747490904';
  const targetUrl = 'https://techrix365.com';
  const whatsappUrl = 'https://wa.me/27608645692?text=Hello%2C%20I%20would%20like%20to%20discuss%20building%20a%20custom%20system%20with%20Techrix365';

  // Continuous visibility cycle: Visible for 2 minutes (120s), then hidden for 5 minutes (300s) as long as feed is open
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const runCycle = (showing: boolean) => {
      setIsVisibleInCycle(showing);
      const durationMs = showing ? 2 * 60 * 1000 : 5 * 60 * 1000;
      timeoutId = setTimeout(() => {
        runCycle(!showing);
      }, durationMs);
    };

    // Starts visible for 2 minutes
    setIsVisibleInCycle(true);
    timeoutId = setTimeout(() => {
      runCycle(false);
    }, 2 * 60 * 1000);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

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

  // Track impression once per mount
  useEffect(() => {
    fetch(`/api/ads/${techrixAdId}/view`, { method: 'POST' }).catch(() => {});
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Track click
    fetch(`/api/ads/${techrixAdId}/click`, { method: 'POST' }).catch(() => {});
    fetch('/api/ads/techrix365/click', { method: 'POST' }).catch(() => {});
    safeOpenAdUrl(targetUrl);
  };

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fetch('/api/ads/techrix365/whatsapp', { method: 'POST' }).catch(() => {});
    fetch(`/api/ads/${techrixAdId}/click`, { method: 'POST' }).catch(() => {});
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDismissed(true);
    if (onDismiss) onDismiss();
  };

  if (isDismissed || !isVisibleInCycle) return null;

  if (variant === 'minimal' || variant === 'compact') {
    return (
      <div 
        id={`feed-ad-techrix365-${variant}`}
        onClick={handleClick}
        className={`bg-gradient-to-r from-[#05150E] via-[#091D14] to-[#05150E] border-2 border-emerald-500 rounded-xl p-3.5 sm:p-4 shadow-lg cursor-pointer hover:border-emerald-400 group animate-green-flash relative origin-center will-change-transform transform-gpu ${
          isAttentionShrunk
            ? 'animate-attention-shrink-emerald z-30'
            : ''
        } ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0 mt-0.5 sm:mt-0">
              <Code2 className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="text-sm font-black text-white group-hover:text-emerald-300 transition-colors">
                  Need a custom system for your business?
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                  FEATURED PARTNER
                </span>
              </div>
              <p className="text-xs text-slate-200 font-medium leading-relaxed">
                We build web portals, mobile apps, and high-performance websites. Tap the WhatsApp button to discuss what we can build for you.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleWhatsAppClick}
              className="bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1da850] text-white p-2 rounded-lg transition-all flex items-center justify-center shadow-md shadow-emerald-950/50 cursor-pointer shrink-0 hover:scale-105 active:scale-95"
              title="Chat on WhatsApp (+27 60 864 5692)"
              aria-label="Chat on WhatsApp (+27 60 864 5692)"
            >
              <WhatsAppIcon variant="monochrome" className="w-4 h-4 text-white shrink-0" />
            </button>
            <button
              type="button"
              onClick={handleClick}
              className="bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center space-x-1.5 shadow-md shadow-emerald-950/50 cursor-pointer whitespace-nowrap"
            >
              <span>Find out more.</span>
              <ExternalLink className="w-3 h-3" />
            </button>
            {onDismiss && (
              <button
                type="button"
                onClick={handleDismiss}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-black/40 transition cursor-pointer"
                title="Dismiss ad"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full / Grid Card Variant
  return (
    <div 
      id="feed-ad-techrix365-card"
      onClick={handleClick}
      className={`bg-gradient-to-br from-[#061710] via-[#0A2016] to-[#061710] border-2 border-emerald-500 rounded-2xl p-4 sm:p-5 shadow-xl hover:border-emerald-400 group cursor-pointer animate-green-flash relative overflow-hidden flex flex-col justify-between origin-center will-change-transform transform-gpu ${
        isAttentionShrunk
          ? 'animate-attention-shrink-emerald z-30'
          : ''
      } ${className}`}
    >
      {/* Ambient background glow accent */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

      <div className="space-y-3 relative z-10">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-inner">
              <Code2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-base sm:text-lg font-black text-white tracking-tight group-hover:text-emerald-300 transition-colors">
                  Techrix365.com
                </h4>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Featured Partner</span>
                </span>
              </div>
              <span className="text-[11px] text-emerald-400/90 font-semibold">
                Creator of the Live Traffic NPC App
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex items-center space-x-1 text-[10px] text-slate-400 bg-black/40 px-2 py-1 rounded-lg border border-slate-800">
              <Globe className="w-3 h-3 text-emerald-400" />
              <span>techrix365.com</span>
            </div>
            {onDismiss && (
              <button
                type="button"
                onClick={handleDismiss}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-black/40 transition cursor-pointer"
                title="Dismiss ad"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Text Message */}
        <div className="bg-[#050D09]/80 border border-emerald-500/20 rounded-xl p-3.5 sm:p-4 space-y-1.5">
          <p className="text-sm sm:text-base font-black text-white leading-snug">
            Need a custom system for your business?
          </p>
          <p className="text-xs sm:text-sm font-semibold text-emerald-300 leading-relaxed">
            We build web portals, mobile apps, and high-performance websites. Tap the WhatsApp button to discuss what we can build for you.
          </p>
          <div className="flex items-center space-x-2 pt-2 text-xs text-emerald-300/90 font-semibold flex-wrap gap-y-1">
            <span className="inline-flex items-center space-x-1 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
              ✓ Custom Web & Mobile Apps
            </span>
            <span className="inline-flex items-center space-x-1 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
              ✓ Enterprise Portals
            </span>
            <span className="inline-flex items-center space-x-1 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
              ✓ High-Performance Websites
            </span>
          </div>
        </div>
      </div>

      {/* CTA Footer Row */}
      <div className="pt-3.5 sm:pt-4 mt-2 border-t border-emerald-500/20 flex items-center justify-between gap-3 relative z-10 flex-wrap">
        <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Verified Development Studio</span>
          <span className="sm:hidden">Verified Partner</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleWhatsAppClick}
            className="bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1da850] text-white p-2.5 sm:p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg shadow-emerald-950/60 hover:scale-105 active:scale-95 cursor-pointer shrink-0"
            title="Chat on WhatsApp (+27 60 864 5692)"
            aria-label="Chat on WhatsApp (+27 60 864 5692)"
          >
            <WhatsAppIcon variant="monochrome" className="w-4 h-4 sm:w-5 sm:h-5 text-white shrink-0" />
          </button>
          <button
            type="button"
            onClick={handleClick}
            className="bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black text-xs sm:text-sm px-4 sm:px-5 py-2 rounded-xl transition-all duration-200 flex items-center space-x-2 shadow-lg shadow-emerald-950/60 group-hover:shadow-emerald-500/20 cursor-pointer shrink-0"
          >
            <span>Find out more.</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
