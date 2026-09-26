import React, { useState } from 'react';
import {
  LayoutGrid,
  MapPin,
  Radio,
  Heart,
  Lock,
  Volume2,
  AlertOctagon,
  PhoneCall,
  X,
  ShieldCheck
} from 'lucide-react';
import { IncidentReport } from '../types';
import { useSpikeProximityWarning } from '../hooks/useSpikeProximityWarning';
import { formatDistance } from '../utils/spikeProximityAudio';

interface BottomNavProps {
  activeTab: 'dashboard' | 'map' | 'feed' | 'trafficcams' | 'traveltimes' | 'report' | 'admin' | 'donations' | 'pricing' | 'course' | 'advertiser';
  setActiveTab: (tab: any) => void;
  pendingCount: number;
  openReportModal?: () => void;
  reports?: IncidentReport[];
  onOpenSOSModal?: () => void;
  onOpenDriverMode?: () => void;
  showLiveTrafficNpc?: boolean;
  onToggleLiveTrafficNpc?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  pendingCount,
  openReportModal,
  reports = [],
  onOpenSOSModal,
  onOpenDriverMode,
  showLiveTrafficNpc = true,
  onToggleLiveTrafficNpc
}) => {
  const {
    nearestSpike,
    warningThresholdKm,
    triggerVoiceAlert
  } = useSpikeProximityWarning(reports);

  const [isAlertDismissed, setIsAlertDismissed] = useState(false);

  const isHazardApproaching = Boolean(
    nearestSpike && nearestSpike.distanceKm <= warningThresholdKm
  );
  const isCritical = Boolean(nearestSpike && nearestSpike.distanceKm <= 1.5);

  return (
    <nav className="w-full shrink-0 z-40 bg-[#020408]/98 backdrop-blur-xl border-t-2 border-[#D4A237]/70 shadow-[0_-12px_45px_rgba(0,0,0,0.98)] select-none">
      {/* ========================================================================= */}
      {/* 1. CRITICAL APPROACHING SPIKE HAZARD URGENT POPUP DRAWER                   */}
      {/* ========================================================================= */}
      {isHazardApproaching && nearestSpike && !isAlertDismissed && (
        <div
          className={`px-3.5 py-2.5 border-b transition-all animate-pulse ${
            isCritical
              ? 'bg-gradient-to-r from-red-950 via-red-900 to-black border-red-500 text-white'
              : 'bg-gradient-to-r from-amber-950 via-orange-950 to-black border-amber-500 text-white'
          }`}
        >
          <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-black shrink-0 ${
                  isCritical ? 'bg-red-600 text-white animate-bounce' : 'bg-[#FAF4EA] text-slate-950 border border-[#D4A237]'
                }`}
              >
                <AlertOctagon className="w-5 h-5 text-red-600" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2 flex-wrap">
                  <span
                    className={`font-black text-xs uppercase px-2 py-0.5 rounded ${
                      isCritical ? 'bg-red-600 text-white' : 'bg-[#FAF4EA] text-slate-950 border border-[#D4A237]'
                    }`}
                  >
                    {isCritical ? '🚨 CRITICAL SPIKE' : '⚠️ SPIKE AHEAD'}
                  </span>
                  <span className="font-extrabold text-xs text-yellow-300">
                    {formatDistance(nearestSpike.distanceKm)} AWAY
                  </span>
                </div>
                <p className="text-xs font-bold text-white truncate mt-0.5">
                  {nearestSpike.locationName}: {nearestSpike.title}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => triggerVoiceAlert(nearestSpike, true)}
                className="bg-[#FAF4EA] hover:bg-white text-[#070A10] border border-[#D4A237] px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer shadow-md"
                title="Replay Voice Warning"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#070A10]" />
                <span className="hidden sm:inline">Replay Alert</span>
              </button>

              {onOpenSOSModal && (
                <button
                  type="button"
                  onClick={onOpenSOSModal}
                  className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer shadow-md"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>SOS</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsAlertDismissed(true)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
                title="Dismiss banner"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation Row */}

      {/* ========================================================================= */}
      {/* 5. MAIN NAVIGATION / ON MAP: LIVETRAFFICNPC TOGGLE & CLOSE MAP            */}
      {/* ========================================================================= */}
      {activeTab === 'map' ? (
        <div className="w-full max-w-2xl mx-auto px-2.5 sm:px-4 py-2.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] flex items-center justify-between gap-2.5 sm:gap-4">
          {/* Button 1: LIVETRAFFICNPC Toggle Button */}
          <button
            type="button"
            onClick={onToggleLiveTrafficNpc}
            className="flex-1 min-w-0 flex items-center justify-center space-x-2 py-3 px-3 rounded-2xl bg-[#000000] hover:bg-[#070D18] active:scale-95 text-[#D4A237] hover:text-white font-black text-xs sm:text-sm shadow-md border border-[#D4A237]/65 transition cursor-pointer tracking-wider uppercase"
            title={showLiveTrafficNpc ? 'LiveTrafficNPC Hazards: ON (Click to turn OFF)' : 'LiveTrafficNPC Hazards: OFF (Click to turn ON)'}
          >
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${showLiveTrafficNpc ? 'bg-[#D4A237] shadow-[0_0_8px_rgba(212,162,55,0.8)] animate-pulse' : 'bg-slate-600'}`} />
            <span className="truncate">
              <span className="sm:hidden">{showLiveTrafficNpc ? 'NPC: ON' : 'NPC: OFF'}</span>
              <span className="hidden sm:inline">LIVETRAFFIC: {showLiveTrafficNpc ? 'ON' : 'OFF'}</span>
            </span>
          </button>

          {/* Button 2: CLOSE MAP Button */}
          <button
            type="button"
            onClick={() => setActiveTab('feed')}
            className="flex-1 min-w-0 flex items-center justify-center space-x-2 py-3 px-3 rounded-2xl bg-[#000000] hover:bg-[#070D18] active:scale-95 text-[#D4A237] hover:text-white font-black text-xs sm:text-sm shadow-md border border-[#D4A237]/65 transition cursor-pointer tracking-wider uppercase"
            title="Close Map and return to Live Feeds"
          >
            <X className="w-4 h-4 text-[#D4A237] shrink-0 stroke-[2.5]" />
            <span className="truncate">CLOSE MAP</span>
          </button>
        </div>
      ) : (
        <div className="w-full max-w-xl mx-auto grid grid-cols-5 gap-0.5 sm:gap-1 text-center px-1 sm:px-3 pt-1.5 pb-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] items-end">
          
          {/* OPTIONS (DASHBOARD) */}
          <button
            id="bottom-nav-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition cursor-pointer min-w-0 hover:bg-[#060B14] active:bg-[#0A1220] ${
              activeTab === 'dashboard'
                ? 'text-[#FAF4EA] font-black bg-[#060B14]/80'
                : 'text-[#B59D7E] hover:text-[#FAF4EA]'
            }`}
          >
            <LayoutGrid className={`w-5 h-5 sm:w-5.5 sm:h-5.5 mb-1 shrink-0 ${activeTab === 'dashboard' ? 'text-[#D4A237] stroke-[2.4]' : 'text-[#B59D7E] stroke-[1.9]'}`} />
            <span className="text-[9.5px] sm:text-[11px] font-bold uppercase tracking-tight whitespace-nowrap">Options</span>
          </button>

          {/* MAP */}
          <button
            id="bottom-nav-map"
            onClick={() => setActiveTab('map')}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition cursor-pointer min-w-0 hover:bg-[#060B14] active:bg-[#0A1220] ${
              activeTab === 'map'
                ? 'text-[#FAF4EA] font-black bg-[#060B14]/80'
                : 'text-[#B59D7E] hover:text-[#FAF4EA]'
            }`}
          >
            <MapPin className={`w-5 h-5 sm:w-5.5 sm:h-5.5 mb-1 shrink-0 ${activeTab === 'map' ? 'text-[#D4A237] stroke-[2.4]' : 'text-[#B59D7E] stroke-[1.9]'}`} />
            <span className="text-[9.5px] sm:text-[11px] font-bold uppercase tracking-tight whitespace-nowrap">Map</span>
          </button>

          {/* FEEDS (STANDOUT HERO TAB) */}
          <button
            id="bottom-nav-feeds"
            onClick={() => setActiveTab('feed')}
            className="flex flex-col items-center justify-center -mt-3.5 sm:-mt-4 py-0.5 px-0.5 cursor-pointer min-w-0 group relative focus:outline-none"
            title="Live Traffic Feeds"
          >
            <div
              className={`w-12 h-12 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-2xl relative ${
                activeTab === 'feed'
                  ? 'bg-gradient-to-b from-[#E6B74A] via-[#D4A237] to-[#A87919] text-[#070A10] border-2 border-[#FAF4EA] shadow-[0_0_26px_rgba(212,162,55,0.75),0_6px_18px_rgba(0,0,0,0.95)] scale-105'
                  : 'bg-gradient-to-b from-[#111827] via-[#080D17] to-[#000000] border-2 border-[#D4A237]/85 text-[#D4A237] hover:border-[#D4A237] hover:text-[#FAF4EA] shadow-[0_0_16px_rgba(212,162,55,0.4)] group-hover:scale-105'
              }`}
            >
              {/* Pulsing live radar beacon ring */}
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 border border-[#020408]"></span>
              </span>

              <Radio className={`w-6 h-6 sm:w-6.5 sm:h-6.5 shrink-0 ${activeTab === 'feed' ? 'stroke-[2.6]' : 'stroke-[2.2]'}`} />
            </div>
            <span
              className={`mt-1 text-[10px] sm:text-[11.5px] font-black uppercase tracking-wider whitespace-nowrap transition-colors ${
                activeTab === 'feed' ? 'text-[#FAF4EA]' : 'text-[#D4A237] group-hover:text-[#FAF4EA]'
              }`}
            >
              Feeds
            </span>
          </button>

          {/* SUPPORT */}
          <button
            id="bottom-nav-support"
            onClick={() => setActiveTab('donations')}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition cursor-pointer min-w-0 hover:bg-[#060B14] active:bg-[#0A1220] ${
              activeTab === 'donations'
                ? 'text-[#FAF4EA] font-black bg-[#060B14]/80'
                : 'text-[#B59D7E] hover:text-[#FAF4EA]'
            }`}
          >
            <Heart className={`w-5 h-5 sm:w-5.5 sm:h-5.5 mb-1 shrink-0 ${activeTab === 'donations' ? 'text-[#D4A237] stroke-[2.4]' : 'text-[#B59D7E] stroke-[1.9]'}`} />
            <span className="text-[9.5px] sm:text-[11px] font-bold uppercase tracking-tight whitespace-nowrap">Support</span>
          </button>

          {/* ADMIN */}
          <button
            id="bottom-nav-admin"
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl relative transition cursor-pointer min-w-0 hover:bg-[#060B14] active:bg-[#0A1220] ${
              activeTab === 'admin'
                ? 'text-[#FAF4EA] font-black bg-[#060B14]/80'
                : 'text-[#B59D7E] hover:text-[#FAF4EA]'
            }`}
          >
            <Lock className={`w-5 h-5 sm:w-5.5 sm:h-5.5 mb-1 shrink-0 ${activeTab === 'admin' ? 'text-[#D4A237] stroke-[2.4]' : 'text-[#B59D7E] stroke-[1.9]'}`} />
            <span className="text-[9.5px] sm:text-[11px] font-bold uppercase tracking-tight whitespace-nowrap">Admin</span>
            {pendingCount > 0 && (
              <span className="absolute top-0.5 right-1 bg-red-600 text-white text-[9px] sm:text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>

        </div>
      )}
    </nav>
  );
};

function calculateDistKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
