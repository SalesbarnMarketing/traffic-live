import React, { useState, useEffect } from 'react';
import { AdvertisementBanner } from '../types';
import { 
  Sparkles, 
  ExternalLink, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Globe, 
  Copy,
  Check,
  Building2,
  Info,
  Layers,
  HelpCircle
} from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { sanitizeAdUrl, safeOpenAdUrl, isValidWebUrl, repairAdImageUrl } from '../utils/adUrlHelper';
import { getFullVersionString } from '../version';

const BETA_ROTATION_MESSAGES = [
  `LiveTrafficNPC ${getFullVersionString()} • Public Beta Test Build • Real-Time Highway Watch & Active Incident Feeds`,
  "🧪 BETA TEST VERSION: Validating real-time hazard alerts, highway spiking monitors & emergency dispatch",
  `🛡️ System Build ${getFullVersionString()}: Real-time community reports, verified camera nodes & traffic alert radar active`,
  "💬 We value your input! Report issues or suggest new features via the App Suggestions tab"
];

interface FeedAdBannerProps {
  banner: AdvertisementBanner;
  variant?: 'top' | 'inline';
  showSponsoredBadge?: boolean;
  allowDismiss?: boolean;
  onDismiss?: (id: string) => void;
  // Carousel / multi-banner controls
  totalBanners?: number;
  currentIndex?: number;
  onPrevBanner?: () => void;
  onNextBanner?: () => void;
  onSelectBannerIndex?: (index: number) => void;
  isAutoRotating?: boolean;
  onToggleAutoRotate?: () => void;
  onNavigateToAdvertiser?: () => void;
}

// Session cache of tracked banner impressions to prevent request spam during rotation
const trackedBannerImpressions = new Set<string>();

export const FeedAdBanner: React.FC<FeedAdBannerProps> = ({
  banner,
  variant = 'inline',
  showSponsoredBadge = true,
  allowDismiss = true,
  onDismiss,
  totalBanners = 1,
  currentIndex = 0,
  onPrevBanner,
  onNextBanner,
  onSelectBannerIndex,
  isAutoRotating,
  onToggleAutoRotate,
  onNavigateToAdvertiser
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [betaMessageIndex, setBetaMessageIndex] = useState(0);

  // Reset image error state whenever banner image or ID changes so newly uploaded images load immediately
  useEffect(() => {
    setImageError(false);
  }, [banner?.imageUrl, banner?.id]);

  // Rotate beta test version messages under the ad every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setBetaMessageIndex((prev) => (prev + 1) % BETA_ROTATION_MESSAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Compute clean, sanitized destination URL (falling back to scanning notes/subtitles if needed)
  const cleanTargetUrl = sanitizeAdUrl(banner?.targetUrl, `${banner?.subtitle || ''} ${banner?.title || ''}`);
  const hasValidExternalLink = Boolean(cleanTargetUrl && isValidWebUrl(cleanTargetUrl));
  const resolvedImageUrl = banner?.imageData || repairAdImageUrl(banner?.imageUrl, banner?.id, banner?.title);
  const localSpecificFallback = repairAdImageUrl(null, banner?.id, banner?.title) || '/ads/banner-roadside-assist.jpg';
  const displayImageUrl = (imageError ? localSpecificFallback : (resolvedImageUrl || localSpecificFallback)) || '/ads/banner-roadside-assist.jpg';

  // Track impression silently once per banner per session
  useEffect(() => {
    if (banner?.id && !trackedBannerImpressions.has(banner.id)) {
      trackedBannerImpressions.add(banner.id);
      fetch(`/api/ads/${banner.id}/view`, { method: 'POST' }).catch(() => {});
    }
  }, [banner?.id]);

  const handleTrackClick = () => {
    if (banner?.id) {
      fetch(`/api/ads/${banner.id}/click`, { method: 'POST' }).catch(() => {});
    }
  };

  const handleCtaClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleTrackClick();

    if (hasValidExternalLink) {
      safeOpenAdUrl(cleanTargetUrl);
    } else {
      // Open Sponsor Contact & Offer Modal if no external URL is configured
      setShowDetailsModal(true);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Sponsor Details / Contact Modal
  const renderDetailsModal = () => {
    if (!showDetailsModal) return null;

    const phoneClean = banner.contactPhone?.replace(/[^0-9+]/g, '') || '';
    const whatsappLink = phoneClean ? `https://wa.me/${phoneClean.replace('+', '')}` : null;

    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
        onClick={() => setShowDetailsModal(false)}
      >
        <div 
          className="bg-[#11141E] border border-amber-500/50 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl space-y-4 animate-scaleUp text-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative h-36 sm:h-44 bg-[#080A0F] overflow-hidden flex items-center justify-center border-b border-amber-500/20">
            {/* Ambient background */}
            <img 
              src={displayImageUrl}
              alt=""
              aria-hidden="true"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
              className="absolute inset-0 w-full h-full object-cover opacity-25 blur-md scale-110 pointer-events-none select-none"
            />
            {/* Foreground image */}
            <img 
              src={displayImageUrl}
              alt={banner.title}
              referrerPolicy="no-referrer"
              onError={(e) => {
                if (!imageError && displayImageUrl !== localSpecificFallback) {
                  setImageError(true);
                } else {
                  (e.target as HTMLImageElement).src = '/ads/banner-roadside-assist.jpg';
                }
              }}
              className="relative z-10 w-full h-full object-contain p-2"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#11141E] via-transparent to-transparent pointer-events-none z-10" />

            <button 
              onClick={() => setShowDetailsModal(false)}
              className="absolute top-3 right-3 bg-black/80 hover:bg-black text-slate-300 hover:text-white p-1.5 rounded-full transition cursor-pointer z-20 border border-slate-700"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="absolute bottom-2 left-4 text-xs sm:text-sm font-bold text-white flex items-center space-x-1.5 z-20 drop-shadow-md">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>{banner.sponsorName}</span>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4 pt-1">
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-white leading-snug">
                {banner.title}
              </h3>
              {banner.subtitle && (
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  {banner.subtitle}
                </p>
              )}
            </div>

            {/* Contact & Interaction Buttons */}
            <div className="space-y-2.5 pt-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Info className="w-3.5 h-3.5 text-amber-400" />
                <span>Sponsor Contact & Direct Channels</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {hasValidExternalLink && (
                  <button
                    onClick={() => safeOpenAdUrl(cleanTargetUrl)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer"
                  >
                    <span className="flex items-center space-x-1.5">
                      <Globe className="w-4 h-4" />
                      <span>Visit Website</span>
                    </span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}

                {banner.contactPhone && (
                  <a
                    href={`tel:${banner.contactPhone}`}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition"
                  >
                    <span className="flex items-center space-x-1.5">
                      <Phone className="w-4 h-4 text-emerald-400" />
                      <span>Call {banner.contactPhone}</span>
                    </span>
                  </a>
                )}

                {whatsappLink && (
                  <button
                    onClick={() => safeOpenAdUrl(whatsappLink)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1da850] text-white font-bold text-xs transition cursor-pointer shadow-md shadow-emerald-950/40"
                  >
                    <span className="flex items-center space-x-1.5">
                      <WhatsAppIcon className="w-4 h-4 text-white shrink-0" />
                      <span>WhatsApp Direct</span>
                    </span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}

                {banner.contactEmail && (
                  <a
                    href={`mailto:${banner.contactEmail}?subject=Inquiry%20via%20Live%20Traffic%20NPC`}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition"
                  >
                    <span className="flex items-center space-x-1.5 truncate">
                      <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                      <span className="truncate">Email {banner.contactEmail}</span>
                    </span>
                  </a>
                )}
              </div>
            </div>

            {/* Footer Notice */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-[10px] text-slate-400">
              <span className="flex items-center space-x-1 text-amber-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Live Traffic NPC Verified Sponsor</span>
              </span>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (variant === 'top') {
    return (
      <>
        {renderDetailsModal()}
        <div
          className="relative bg-gradient-to-r from-[#11141E] via-[#0E1017] to-[#12151F] border border-amber-500/40 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 hover:border-amber-400 group flex flex-col md:h-[220px]"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Main Top Ad Content - Fixed Height on Desktop and Mobile to prevent feed jumping */}
          <div className="flex flex-col md:flex-row md:items-stretch justify-between flex-1 min-h-0">
            {/* Left / Top Image Cover */}
            <div className="md:w-5/12 h-40 sm:h-44 md:h-full relative overflow-hidden bg-[#07090E] shrink-0 flex items-center justify-center border-b md:border-b-0 md:border-r border-amber-500/20">
              {/* Subtle ambient blurred background glow */}
              {Boolean(displayImageUrl) && (
                <img
                  src={displayImageUrl || undefined}
                  alt=""
                  aria-hidden="true"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                  className="absolute inset-0 w-full h-full object-cover opacity-20 blur-md scale-110 pointer-events-none select-none"
                />
              )}

              {/* Main Ad Banner Graphic - object-contain ensures top text and full graphics never get cut off */}
              {Boolean(displayImageUrl) && (
                <img
                  key={displayImageUrl}
                  src={displayImageUrl || undefined}
                  alt={banner.title}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    if (!imageError && displayImageUrl !== localSpecificFallback) {
                      setImageError(true);
                    } else {
                      (e.target as HTMLImageElement).src = '/ads/banner-roadside-assist.jpg';
                    }
                  }}
                  className="relative z-10 w-full h-full object-contain object-center p-1.5 sm:p-2 group-hover:scale-[1.02] transition-transform duration-500 animate-fadeIn cursor-pointer"
                  onClick={handleCtaClick}
                />
              )}

              {/* Carousel navigation arrows over image */}
              {totalBanners > 1 && (
                <div className="absolute bottom-2 right-2 flex items-center space-x-1 bg-black/80 backdrop-blur-md p-1 rounded-lg border border-amber-500/30 z-20 shadow-lg">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPrevBanner?.();
                    }}
                    className="p-1 rounded text-slate-300 hover:text-amber-400 hover:bg-slate-800 transition cursor-pointer"
                    title="Previous ad"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono text-amber-400 px-1 font-bold">
                    {currentIndex + 1}/{totalBanners}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNextBanner?.();
                    }}
                    className="p-1 rounded text-slate-300 hover:text-amber-400 hover:bg-slate-800 transition cursor-pointer"
                    title="Next ad"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Right Details - Fixed height and slot clamping so all ads have identical dimensions */}
            <div className="p-3.5 sm:p-4 md:p-4 flex-1 flex flex-col justify-between min-w-0 h-[145px] sm:h-[150px] md:h-full">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center justify-between gap-2 h-5 shrink-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center space-x-1 truncate">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{banner.sponsorBadge || 'Motorist Safety Offer'}</span>
                  </span>

                  <div className="flex items-center space-x-2 shrink-0">
                    {totalBanners > 1 && onSelectBannerIndex && (
                      <div className="flex items-center space-x-1 mr-1">
                        {Array.from({ length: totalBanners }).map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => onSelectBannerIndex(idx)}
                            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                              idx === currentIndex
                                ? 'w-4 bg-amber-400'
                                : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                            }`}
                            title={`Go to ad ${idx + 1}`}
                          />
                        ))}
                      </div>
                    )}

                    {allowDismiss && onDismiss && (
                      <button
                        type="button"
                        onClick={() => onDismiss(banner.id)}
                        className="text-slate-500 hover:text-slate-300 p-1 rounded-lg transition cursor-pointer"
                        title="Dismiss ad"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="h-10 sm:h-11 flex items-center">
                  <h4 
                    onClick={handleCtaClick}
                    className="text-xs sm:text-sm md:text-base font-black text-white leading-tight tracking-tight animate-fadeIn cursor-pointer hover:text-amber-300 transition line-clamp-2"
                    title={banner.title}
                  >
                    {banner.title}
                  </h4>
                </div>
                
                <div className="h-8 sm:h-9 overflow-hidden">
                  <p className="text-xs text-slate-400 leading-snug line-clamp-2">
                    {banner.subtitle || 'Verified South African roadside partner, safety product, or community service sponsor.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 h-8 shrink-0">
                <div className="flex items-center space-x-2 min-w-0 mr-2">
                  <span className="text-[10px] text-slate-500 font-medium truncate">
                    {banner.sponsorName ? `${banner.sponsorName} • Live Traffic Network` : 'Verified Advertiser • Live Traffic Network'}
                  </span>
                  {totalBanners > 1 && (
                    <span className="hidden lg:inline text-[9px] text-amber-400/80 bg-amber-950/40 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono shrink-0">
                      Auto-Rotating
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleCtaClick}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider transition flex items-center space-x-1 shadow-md shadow-amber-950/40 cursor-pointer shrink-0"
                >
                  <span>{banner.ctaText || (hasValidExternalLink ? 'Visit Partner' : 'View Offer')}</span>
                  {hasValidExternalLink ? (
                    <ExternalLink className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Internal Rotation Line for Version Number & BETA TEST Status (Directly Under Top Ad - Fixed Height) */}
          <div className="bg-[#070A10] border-t border-amber-500/25 px-3.5 h-9 shrink-0 flex items-center justify-between text-xs gap-2">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <span className="inline-flex items-center space-x-1 font-black uppercase text-[9px] sm:text-[10px] bg-amber-500/20 text-[#D4A237] border border-[#D4A237]/50 px-2 py-0.5 rounded shrink-0 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4A237] animate-pulse"></span>
                <span>BETA TEST VERSION</span>
              </span>
              <span className="font-mono text-[10px] sm:text-[11px] font-bold text-amber-400 bg-black/60 border border-slate-800 px-1.5 py-0.5 rounded shrink-0">
                {getFullVersionString()}
              </span>
              <div className="overflow-hidden relative min-w-0 flex-1 h-5 flex items-center">
                <span
                  key={betaMessageIndex}
                  className="truncate text-slate-300 hover:text-amber-200 text-xs font-medium min-w-0 transition-all duration-300 animate-fadeIn"
                >
                  {BETA_ROTATION_MESSAGES[betaMessageIndex]}
                </span>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 hidden md:inline font-mono shrink-0">
              Build #242 • Safe Travel
            </span>
          </div>
        </div>
      </>
    );
  }

  // Inline Variant (Nested between feed cards - Fixed height across all rotated ads)
  return (
    <>
      {renderDetailsModal()}
      <div className="my-3 bg-[#0B0D12] border border-amber-500/30 hover:border-amber-500/60 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 group flex flex-col">
        {/* Banner Image - Fixed Height */}
        <div className="relative h-48 sm:h-52 w-full shrink-0 bg-[#07090E] overflow-hidden cursor-pointer flex items-center justify-center border-b border-amber-500/20" onClick={handleCtaClick}>
          {/* Ambient blurred glow backdrop */}
          {Boolean(displayImageUrl) && (
            <img
              src={displayImageUrl || undefined}
              alt=""
              aria-hidden="true"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
              className="absolute inset-0 w-full h-full object-cover opacity-20 blur-md scale-110 pointer-events-none select-none"
            />
          )}

          {/* Full Graphic without cutoff */}
          {Boolean(displayImageUrl) && (
            <img
              key={displayImageUrl}
              src={displayImageUrl || undefined}
              alt={banner.title}
              referrerPolicy="no-referrer"
              onError={(e) => {
                if (!imageError && displayImageUrl !== localSpecificFallback) {
                  setImageError(true);
                } else {
                  (e.target as HTMLImageElement).src = '/ads/banner-roadside-assist.jpg';
                }
              }}
              className="relative z-10 w-full h-full object-contain p-1.5 sm:p-2 group-hover:scale-[1.02] transition-transform duration-500"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D12]/60 via-transparent to-transparent pointer-events-none z-10" />

          {allowDismiss && onDismiss && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(banner.id);
              }}
              className="absolute top-3 right-3 bg-black/80 hover:bg-black text-slate-400 hover:text-white p-1 rounded-full backdrop-blur-md transition cursor-pointer z-20 border border-slate-700"
              title="Dismiss ad"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="absolute bottom-2 left-3 text-xs font-bold text-white/90 drop-shadow-md z-20">
            {banner.sponsorName || 'Live Traffic NPC Partner'}
          </div>
        </div>

        {/* Body Details - Fixed Height */}
        <div className="p-4 sm:p-4.5 h-[145px] sm:h-[152px] flex flex-col justify-between shrink-0">
          <div className="space-y-1">
            <div className="h-11 sm:h-12 flex items-center">
              <h4 
                onClick={handleCtaClick}
                className="text-sm sm:text-base font-black text-white leading-tight tracking-tight cursor-pointer hover:text-amber-300 transition line-clamp-2"
                title={banner.title}
              >
                {banner.title}
              </h4>
            </div>
            <div className="h-8 sm:h-9 overflow-hidden">
              <p className="text-xs sm:text-sm text-slate-400 leading-snug line-clamp-2">
                {banner.subtitle || 'Verified South African road safety and motorist support service.'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 h-9 shrink-0">
            <span className="text-[11px] text-slate-500 font-medium truncate">
              Partnered Road Safety Ad
            </span>

            <button
              type="button"
              onClick={handleCtaClick}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center space-x-1.5 shadow-lg shadow-amber-950/40 cursor-pointer shrink-0"
            >
              <span>{banner.ctaText || (hasValidExternalLink ? 'Learn More' : 'View Offer')}</span>
              {hasValidExternalLink ? (
                <ExternalLink className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Internal Rotation Line for Version Number & BETA TEST Status (Directly Under Inline Ad - Fixed Height) */}
        <div className="bg-[#06080F] border-t border-amber-500/20 px-3.5 h-8 shrink-0 flex items-center justify-between text-xs gap-2">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <span className="inline-flex items-center space-x-1 font-black uppercase text-[9px] bg-amber-500/20 text-[#D4A237] border border-[#D4A237]/40 px-1.5 py-0.5 rounded shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4A237] animate-pulse"></span>
              <span>BETA TEST</span>
            </span>
            <span className="font-mono text-[10px] font-bold text-amber-400 bg-black/60 border border-slate-800 px-1 py-0.5 rounded shrink-0">
              {getFullVersionString()}
            </span>
            <div className="overflow-hidden relative min-w-0 flex-1 h-4 flex items-center">
              <span
                key={betaMessageIndex}
                className="truncate text-slate-400 text-[11px] min-w-0 animate-fadeIn"
              >
                {BETA_ROTATION_MESSAGES[betaMessageIndex]}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
