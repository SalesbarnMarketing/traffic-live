import React, { useState } from 'react';
import { 
  X, Sparkles, Clock, ListFilter, ShieldCheck, Layers, 
  ExternalLink, CheckCircle2, ChevronRight, RefreshCw, MessageSquare, HeartHandshake,
  Bell, Volume2, Smartphone, Radio
} from 'lucide-react';
import { APP_VERSION, getFullVersionString } from '../version';

interface ReleaseNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFeedback?: () => void;
}

export const ReleaseNotesModal: React.FC<ReleaseNotesModalProps> = ({ 
  isOpen, 
  onClose,
  onOpenFeedback 
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'notifications' | 'feed' | 'persistence' | 'visuals'>('all');

  if (!isOpen) return null;

  const changes = [
    {
      id: 'pwa_icons',
      category: 'visuals',
      badge: 'PWA & Mobile',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: Smartphone,
      iconColor: 'text-amber-400 bg-amber-950/40 border-amber-500/30',
      title: 'Local High-Resolution PWA Icons & Launcher Assets',
      description: 'Replaced external third-party icons with fully self-hosted, offline-ready application assets. Added standard 192x192 and 512x512 app icons, Android adaptive maskable launcher icons with safe margins, Apple Touch icons (180x180), and favicons to ensure the app displays a crisp, branded icon when installed on any phone, tablet, or desktop.'
    },
    {
      id: 'push_sounds',
      category: 'notifications',
      badge: 'Audio & Push',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      icon: Volume2,
      iconColor: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30',
      title: 'Synthesized Alert Sound Profiles & Audio Engine',
      description: 'Introduced Web Audio API synthesized alert chimes with zero audio latency. Motorists and responders can choose between Authentic Car Horns, Police Siren wails, Alert Chimes, Radar Beeps, Traffic Whistles, and Dual-Tone SOS Sirens with instant in-modal preview.'
    },
    {
      id: 'push_prefs',
      category: 'notifications',
      badge: 'Alerts Control',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      icon: Bell,
      iconColor: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30',
      title: 'Granular Notification Preferences & Provincial Filters',
      description: 'Added a dedicated Push Notification Preferences center accessible via the top-bar Bell icon and Dashboard. Users can configure province-specific corridors (Gauteng, Western Cape, KZN, etc.), toggle hazard types (Spike traps, SOS dispatches, traffic alerts), and test notification delivery.'
    },
    {
      id: 'gbv_assist',
      category: 'feed',
      badge: 'Safety Priority',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      icon: HeartHandshake,
      iconColor: 'text-purple-300 bg-purple-950/60 border-purple-500/40',
      title: 'GBV (Gender-Based Violence) Emergency Assist in Top Nav',
      description: 'Added a dedicated, confidential GBV Assist button in the top navigation bar right before the Emergency SOS button. Features priority dispatching, instant hotline dialing to the National GBV Command Centre (0800 428 428) and SAPS (10111), and high-visibility map routing for vulnerable motorists.'
    },
    {
      id: 'window',
      category: 'feed',
      badge: 'Feed Freshness',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: Clock,
      iconColor: 'text-amber-400 bg-amber-950/40 border-amber-500/30',
      title: '6-Hour Rolling Feed Window (Replaces 24 Hours)',
      description: 'Incident highlights, broadcast notices, and community reports now strictly observe a 6-hour operational window across the entire app. Posts older than 6 hours are automatically cleared, ensuring only current, active road conditions are shown at the top of your feed.'
    },
    {
      id: 'bullets',
      category: 'visuals',
      badge: 'Interface Default',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      icon: ListFilter,
      iconColor: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30',
      title: 'Default View Set to "Bullet Points"',
      description: 'The live incident feed now opens in Bullet Points mode by default. Motorists can quickly scan highway hazards, lane obstructions, and spiking alerts without scrolling through extensive card content. View toggles remain available to switch to Cards or Compact mode anytime.'
    },
    {
      id: 'badges',
      category: 'visuals',
      badge: 'Layout Polish',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      icon: Layers,
      iconColor: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30',
      title: 'Stacked Incident Badges & Headlines',
      description: 'Badges like "Highlight" and "Broadcast" now sit neatly stacked directly above the headline and description. This prevents text displacement, uneven wrapping, and awkward line breaks on mobile phones and widescreen displays.'
    },
    {
      id: 'carousel',
      category: 'feed',
      badge: 'Partner Carousel',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      icon: Sparkles,
      iconColor: 'text-indigo-400 bg-indigo-950/40 border-indigo-500/30',
      title: 'Streamlined In-Feed Partner Banner',
      description: 'Removed the shuffle button from the partner banner header to declutter the feed. Partner ads now rotate automatically on a timed 6-second cycle with smooth left/right arrow controls for manual browsing.'
    },
    {
      id: 'persistence',
      category: 'persistence',
      badge: 'Cloud Resilience',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      icon: ShieldCheck,
      iconColor: 'text-blue-400 bg-blue-950/40 border-blue-500/30',
      title: 'Zero User Loss Guarantee & Cloud Firestore Hardening',
      description: 'All 392 registered accounts and advertiser profiles are synchronized with Google Cloud Firestore. We added on-boot cloud hydration, on-demand query fallback during authentication, and immediate per-user syncing so no accounts are ever lost when publishing or restarting containers.'
    }
  ];

  const filteredChanges = activeFilter === 'all' 
    ? changes 
    : changes.filter(c => c.category === activeFilter);

  return (
    <div 
      id="release-notes-modal-backdrop"
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden animate-fadeIn"
      onClick={onClose}
    >
      <div 
        id="release-notes-modal-content"
        className="bg-[#0B111E] text-slate-100 border-2 border-[#D4A237]/50 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-[#D4A237] to-cyan-500 opacity-90" />

        {/* Modal Header */}
        <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-slate-800 bg-[#0F1626] shrink-0 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20 font-black">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-black tracking-wider uppercase text-amber-400">Live Traffic NPC</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold px-2 py-0.5 rounded-full">
                  {getFullVersionString()} Release
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                What's New in Version {APP_VERSION}
              </h2>
              <p className="text-[11px] text-slate-400">
                Fresh live traffic updates, UI refinements, and cloud persistence hardening
              </p>
            </div>
          </div>

          <button
            id="close-release-notes-modal-btn"
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
            aria-label="Close Release Notes Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Filter Navigation Tabs */}
        <div className="px-5 py-2.5 bg-[#080D17] border-b border-slate-800/80 flex items-center space-x-2 overflow-x-auto text-xs shrink-0 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-full font-bold transition whitespace-nowrap cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            All Updates ({changes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('notifications')}
            className={`px-3 py-1 rounded-full font-bold transition whitespace-nowrap cursor-pointer ${
              activeFilter === 'notifications'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            Push & Audio
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('feed')}
            className={`px-3 py-1 rounded-full font-bold transition whitespace-nowrap cursor-pointer ${
              activeFilter === 'feed'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            Feed & Alerts
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('visuals')}
            className={`px-3 py-1 rounded-full font-bold transition whitespace-nowrap cursor-pointer ${
              activeFilter === 'visuals'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            Design & Layout
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('persistence')}
            className={`px-3 py-1 rounded-full font-bold transition whitespace-nowrap cursor-pointer ${
              activeFilter === 'persistence'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            User Persistence
          </button>
        </div>

        {/* Changes Body List */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-4">
          {filteredChanges.map((item) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.id}
                className="bg-[#0D1524] border border-slate-800/90 hover:border-slate-700 rounded-2xl p-4 sm:p-5 transition-all shadow-md group"
              >
                <div className="flex items-start space-x-3.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${item.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{getFullVersionString()}</span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition mb-1.5">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Quick Notice Banner */}
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-xs text-amber-200/90 flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="leading-snug">
              <strong>Seamless Auto-Sync:</strong> All road updates and incident broadcasts sync live in real time. No manual cache clearing is required.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-800 bg-[#0A101C] shrink-0 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active Release Build {getFullVersionString()}</span>
          </div>

          <div className="flex items-center space-x-2">
            {onOpenFeedback && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFeedback();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                <span>Give Feedback</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs transition shadow cursor-pointer active:scale-95"
            >
              Got It
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
