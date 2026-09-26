import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Play,
  Pause,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Eye,
  MousePointerClick,
  Sliders,
  Layers,
  Sparkles,
  Zap,
  Image as ImageIcon,
  Activity,
  Globe
} from 'lucide-react';
import { AdvertisementBanner } from '../types';

interface AdRotationEngineViewerProps {
  banners: AdvertisementBanner[];
  onTestClick?: (bannerId: string, targetUrl?: string) => void;
  onLaunchNewAd?: () => void;
}

export const AdRotationEngineViewer: React.FC<AdRotationEngineViewerProps> = ({
  banners,
  onTestClick,
  onLaunchNewAd
}) => {
  const activeBanners = banners.filter(b => b.enabled);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [previewPlacement, setPreviewPlacement] = useState<'top' | 'inline'>('top');
  const [cycleSeconds, setCycleSeconds] = useState<number>(8);
  const [countdown, setCountdown] = useState<number>(cycleSeconds);

  // Auto-rotation timer
  useEffect(() => {
    if (!isPlaying || activeBanners.length <= 1) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCurrentIndex((curr) => (curr + 1) % activeBanners.length);
          return cycleSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, activeBanners.length, cycleSeconds]);

  // Keep index in bounds
  useEffect(() => {
    if (currentIndex >= activeBanners.length && activeBanners.length > 0) {
      setCurrentIndex(0);
    }
    setCountdown(cycleSeconds);
  }, [activeBanners.length, cycleSeconds]);

  const currentAd = activeBanners[currentIndex] || activeBanners[0];

  const handleNext = () => {
    if (activeBanners.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    setCountdown(cycleSeconds);
  };

  const handlePrev = () => {
    if (activeBanners.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
    setCountdown(cycleSeconds);
  };

  return (
    <div className="bg-[#0A101D] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-6 text-white">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-black uppercase text-[#D4A237] tracking-wider">
              Live Rotation & Delivery Engine
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
            Real-Time Feed & Header Ad Simulator
          </h3>
          <p className="text-xs text-slate-400">
            Preview how your campaigns cycle across driver map screens and traffic alert feeds.
          </p>
        </div>

        {/* Engine status pills */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <div className="flex items-center space-x-1.5 bg-[#05080E] border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-slate-400 font-medium">Rotation Pool:</span>
            <span className="font-bold text-[#D4A237]">{activeBanners.length} Active</span>
          </div>

          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center space-x-1 transition cursor-pointer ${
              isPlaying
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/60'
            }`}
            title={isPlaying ? 'Pause auto-cycle' : 'Resume auto-cycle'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isPlaying ? 'Cycling' : 'Paused'}</span>
          </button>
        </div>
      </div>

      {/* Simulator Viewport Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#05080E] p-3 rounded-2xl border border-slate-800 text-xs">
        
        {/* Placement Switcher */}
        <div className="flex items-center space-x-1 bg-[#090E17] p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setPreviewPlacement('top')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              previewPlacement === 'top'
                ? 'bg-[#D4A237] text-[#070A10] shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Map Header Banner</span>
          </button>

          <button
            type="button"
            onClick={() => setPreviewPlacement('inline')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              previewPlacement === 'inline'
                ? 'bg-[#D4A237] text-[#070A10] shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Traffic Stream Card</span>
          </button>
        </div>

        {/* Rotation Cycle Speed & Manual Prev/Next */}
        <div className="flex items-center space-x-3">
          {isPlaying && activeBanners.length > 1 && (
            <div className="text-[11px] text-slate-400 font-mono flex items-center space-x-1.5">
              <span>Next cycle in:</span>
              <span className="font-bold text-[#D4A237] bg-[#0A101D] px-1.5 py-0.5 rounded border border-slate-800">
                {countdown}s
              </span>
            </div>
          )}

          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={handlePrev}
              disabled={activeBanners.length <= 1}
              className="p-1.5 bg-[#090E17] hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono px-2 text-slate-400">
              {activeBanners.length > 0 ? `${currentIndex + 1}/${activeBanners.length}` : '0/0'}
            </span>
            <button
              type="button"
              onClick={handleNext}
              disabled={activeBanners.length <= 1}
              className="p-1.5 bg-[#090E17] hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Simulator Display Screen */}
      {activeBanners.length === 0 ? (
        <div className="text-center py-12 bg-[#05080E] border border-dashed border-slate-800 rounded-2xl p-6">
          <Layers className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">No Active Banners in Rotation</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
            There are currently no live campaigns activated in the rotation engine. Create or activate a campaign to see it live.
          </p>
          {onLaunchNewAd && (
            <button
              type="button"
              onClick={onLaunchNewAd}
              className="px-5 py-2.5 bg-[#D4A237] hover:bg-[#F5D061] text-[#070A10] font-black text-xs rounded-xl uppercase tracking-wider shadow-lg cursor-pointer"
            >
              + Launch First Ad Campaign
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* SIMULATION CONTAINER */}
          <div className="bg-[#05080E] border-2 border-[#D4A237]/40 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-2xl">
            
            {/* Top Bar Status of the ad */}
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3 border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-[11px] text-[#D4A237] font-bold">
                  Slot #{currentIndex + 1}
                </span>
                <span>•</span>
                <span className="truncate max-w-[200px] text-slate-300 font-medium">
                  {currentAd.sponsorName || 'Live Traffic NPC Partner'}
                </span>
              </div>

              <div className="flex items-center space-x-3 text-[11px]">
                <span className="text-slate-400">
                  Views: <strong className="text-white">{(currentAd.impressions || 0).toLocaleString()}</strong>
                </span>
                <span className="text-emerald-400">
                  Clicks: <strong className="text-emerald-300">{(currentAd.clicks || 0).toLocaleString()}</strong>
                </span>
              </div>
            </div>

            {/* FORMAT 1: MAP TOP HEADER STRIP */}
            {previewPlacement === 'top' && (
              <div className="bg-[#0A101D] border border-[#D4A237]/60 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl transition-all duration-300">
                <div className="flex items-center space-x-3.5 min-w-0 w-full sm:w-auto">
                  {currentAd.imageUrl ? (
                    <img
                      src={currentAd.imageUrl}
                      alt={currentAd.title}
                      className="w-16 h-14 rounded-xl object-cover border border-slate-700 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-16 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                      <ImageIcon className="w-6 h-6 text-slate-500" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 mb-1 flex-wrap gap-y-1">
                      <span className="bg-[#D4A237]/20 border border-[#D4A237]/60 text-[#D4A237] text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                        {currentAd.sponsorBadge || 'Sponsored'}
                      </span>
                      <span className="text-xs text-slate-400 font-bold truncate">
                        {currentAd.sponsorName || 'Live Partner'}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-white truncate">{currentAd.title}</h4>
                    {currentAd.subtitle && (
                      <p className="text-xs text-slate-300 truncate">{currentAd.subtitle}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end shrink-0">
                  <button
                    type="button"
                    onClick={() => onTestClick && onTestClick(currentAd.id, currentAd.targetUrl)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-[#D4A237] hover:bg-[#F5D061] text-[#070A10] font-black text-xs rounded-xl shadow-lg flex items-center justify-center space-x-1.5 transition cursor-pointer uppercase tracking-wider"
                  >
                    <span>{currentAd.ctaText || 'Learn More'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* FORMAT 2: INLINE TRAFFIC STREAM CARD */}
            {previewPlacement === 'inline' && (
              <div className="bg-[#0A101D] border border-amber-500/40 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase flex items-center space-x-1">
                      <Zap className="w-3 h-3" />
                      <span>{currentAd.sponsorBadge || 'Roadside Partner'}</span>
                    </span>
                    <span className="text-xs text-slate-400 font-bold">{currentAd.sponsorName}</span>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono">Stream Placement #3</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  {currentAd.imageUrl && (
                    <img
                      src={currentAd.imageUrl}
                      alt={currentAd.title}
                      className="w-full sm:w-36 h-24 rounded-xl object-cover border border-slate-700 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  )}

                  <div className="space-y-1.5 flex-1 min-w-0 text-center sm:text-left">
                    <h4 className="text-base font-black text-white">{currentAd.title}</h4>
                    {currentAd.subtitle && (
                      <p className="text-xs text-slate-300 leading-relaxed">{currentAd.subtitle}</p>
                    )}
                    {currentAd.notes && (
                      <p className="text-[11px] text-slate-400 italic">"{currentAd.notes}"</p>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Verified Road Safety Sponsor</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onTestClick && onTestClick(currentAd.id, currentAd.targetUrl)}
                    className="px-4 py-2 bg-[#FAF4EA] hover:bg-white text-[#070A10] font-black text-xs rounded-xl shadow flex items-center space-x-1.5 cursor-pointer uppercase tracking-wider"
                  >
                    <span>{currentAd.ctaText || 'Contact Provider'}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#070A10]" />
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Direct link testing notice */}
          <div className="flex items-center justify-between text-xs bg-[#05080E] p-3 rounded-xl border border-slate-800 text-slate-400">
            <span className="flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-[#D4A237]" />
              <span>Clicking the CTA button simulates a live outbound driver engagement and logs analytics.</span>
            </span>
            {currentAd.targetUrl && (
              <span className="font-mono text-[11px] text-slate-500 truncate max-w-[200px]">
                {currentAd.targetUrl}
              </span>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
