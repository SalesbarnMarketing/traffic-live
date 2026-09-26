import React, { useState } from 'react';
import {
  AlertOctagon,
  Volume2,
  VolumeX,
  Radio,
  Navigation,
  Compass,
  AlertTriangle,
  Play,
  RotateCcw,
  Sliders,
  X,
  PhoneCall,
  ShieldAlert,
  Car,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  Flame,
  Info
} from 'lucide-react';
import { IncidentReport } from '../types';
import { formatDistance } from '../utils/spikeProximityAudio';
import { useSpikeProximityWarning } from '../hooks/useSpikeProximityWarning';

interface SpikeProximityRadarProps {
  reports: IncidentReport[];
  onOpenSOSModal?: () => void;
  onOpenReportModal?: (options?: { type?: string; title?: string }) => void;
  className?: string;
  compact?: boolean;
}

export const SpikeProximityRadar: React.FC<SpikeProximityRadarProps> = ({
  reports,
  onOpenSOSModal,
  onOpenReportModal,
  className = '',
  compact = false
}) => {
  const {
    userLocation,
    nearestSpike,
    activeSpikesCount,
    isVoiceEnabled,
    warningThresholdKm,
    isSpeaking,
    isSimulating,
    gpsActive,
    toggleVoiceEnabled,
    setWarningThresholdKm,
    testVoiceWarning,
    startSimulation,
    stopSimulation,
    triggerVoiceAlert
  } = useSpikeProximityWarning(reports);

  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const isHazardApproaching =
    nearestSpike && nearestSpike.distanceKm <= warningThresholdKm;
  const isCritical = nearestSpike && nearestSpike.distanceKm <= 1.5;

  return (
    <div className={`relative z-30 transition-all duration-300 ${className}`}>
      {/* ========================================================================= */}
      {/* 1. CRITICAL / APPROACHING HAZARD ALERT BANNER (High Visibility)           */}
      {/* ========================================================================= */}
      {isHazardApproaching && !isDismissed && (
        <div
          className={`mb-3 rounded-2xl p-3.5 sm:p-4 shadow-2xl border-2 transition-all animate-pulse ${
            isCritical
              ? 'bg-gradient-to-r from-red-950 via-red-900 to-black border-red-500 shadow-red-600/40 text-white'
              : 'bg-gradient-to-r from-amber-950 via-orange-950 to-black border-amber-500 shadow-amber-500/30 text-white'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3 min-w-0">
              <div
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-black shrink-0 shadow-lg ${
                  isCritical
                    ? 'bg-red-600 text-white animate-bounce'
                    : 'bg-amber-500 text-slate-950 animate-pulse'
                }`}
              >
                <AlertOctagon className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span
                    className={`font-black text-xs sm:text-sm px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isCritical
                        ? 'bg-red-600 text-white animate-pulse'
                        : 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    {isCritical ? '🚨 CRITICAL SPIKE HAZARD' : '⚠️ SPIKE TRAP AHEAD'}
                  </span>
                  <span className="font-extrabold text-xs sm:text-sm text-yellow-300">
                    {formatDistance(nearestSpike.distanceKm)} AWAY
                  </span>
                  {isSpeaking && (
                    <span className="flex items-center space-x-1 text-[10px] font-bold bg-sky-500/30 text-sky-300 border border-sky-400/40 px-2 py-0.5 rounded-full animate-pulse">
                      <Volume2 className="w-3 h-3 animate-spin" />
                      <span>ANNOUNCING VOICE ALERT...</span>
                    </span>
                  )}
                </div>

                <h4 className="font-black text-sm sm:text-base text-white mt-1 leading-tight line-clamp-1">
                  {nearestSpike.title}
                </h4>

                <p className="text-xs text-slate-200 mt-0.5 line-clamp-2 leading-relaxed">
                  📍 <strong>{nearestSpike.locationName}</strong>: {nearestSpike.description}
                </p>

                <div className="mt-2 text-[11px] font-bold text-yellow-300 bg-black/40 border border-yellow-500/30 rounded-lg px-2.5 py-1 flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                  <span>
                    DEFENSIVE PROTOCOL: Do not stop on unlit shoulder. Maintain safe following distance.
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsDismissed(true)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition shrink-0"
              title="Dismiss warning banner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action Bar for Approaching Danger */}
          <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => triggerVoiceAlert(nearestSpike, true)}
                className="flex items-center space-x-1.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition shadow-md cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Replay Voice Alert</span>
              </button>

              <button
                onClick={toggleVoiceEnabled}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition border cursor-pointer ${
                  isVoiceEnabled
                    ? 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                    : 'bg-red-900/60 hover:bg-red-800 text-red-200 border-red-500/50'
                }`}
              >
                {isVoiceEnabled ? <Volume2 className="w-3.5 h-3.5 text-green-400" /> : <VolumeX className="w-3.5 h-3.5 text-red-400" />}
                <span>{isVoiceEnabled ? 'Voice Warnings: ON' : 'Muted'}</span>
              </button>
            </div>

            {onOpenSOSModal && (
              <button
                onClick={onOpenSOSModal}
                className="flex items-center space-x-1.5 bg-red-600 hover:bg-red-500 text-white px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-red-700/50 transition cursor-pointer animate-pulse"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Emergency SOS</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PERSISTENT SPIKE RADAR CONTROL BAR & STATUS HUD                        */}
      {/* ========================================================================= */}
      <div className="bg-[#0B0F19]/95 backdrop-blur-md border border-slate-700/80 hover:border-yellow-500/50 rounded-2xl p-2.5 sm:p-3 shadow-xl transition">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Live Radar Status */}
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="relative">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-black transition ${
                  isHazardApproaching
                    ? 'bg-red-600 text-white animate-bounce'
                    : isVoiceEnabled
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Radio className={`w-4 h-4 ${isVoiceEnabled ? 'animate-pulse' : ''}`} />
              </div>
              {gpsActive && (
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0B0F19]"></span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-1">
                  <span>Spike Voice Radar</span>
                  {gpsActive ? (
                    <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.2 rounded-full">
                      GPS ACTIVE
                    </span>
                  ) : (
                    <span className="text-[9px] text-amber-400 font-bold bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.2 rounded-full">
                      INITIALIZING GPS
                    </span>
                  )}
                </span>
              </div>

              <p className="text-[11px] text-slate-300 font-medium truncate">
                {isHazardApproaching ? (
                  <span className="text-amber-400 font-bold">
                    ⚠️ Spike trap hazard {formatDistance(nearestSpike.distanceKm)} away on {nearestSpike.roadName}
                  </span>
                ) : nearestSpike ? (
                  <span>
                    Nearest verified spike: <strong className="text-white">{formatDistance(nearestSpike.distanceKm)}</strong> away ({nearestSpike.roadName})
                  </span>
                ) : (
                  <span>
                    Scanning active corridors • <strong className="text-amber-400">{activeSpikesCount} verified hazards</strong> monitored
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Right Controls: Voice Toggle, Test Audio, Settings */}
          <div className="flex items-center space-x-1.5 shrink-0">
            {/* Quick Voice Toggle Button */}
            <button
              type="button"
              onClick={toggleVoiceEnabled}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 border cursor-pointer ${
                isVoiceEnabled
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-600'
              }`}
              title={isVoiceEnabled ? 'Voice Warnings Enabled (Click to Mute)' : 'Voice Warnings Muted (Click to Enable)'}
            >
              {isVoiceEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              <span className="hidden sm:inline">{isVoiceEnabled ? 'Voice ON' : 'Muted'}</span>
            </button>

            {/* Settings Dropdown Toggle */}
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                showSettings ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title="Radar Settings & Distance Threshold"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Expand / Details Toggle */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-slate-400 hover:text-white transition rounded-xl hover:bg-slate-800"
              title={isExpanded ? 'Collapse Radar Details' : 'Expand Radar Details'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. SETTINGS DRAWER                                                        */}
        {/* ========================================================================= */}
        {showSettings && (
          <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-200 space-y-3 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-bold text-white uppercase tracking-wider block">
                  Warning Proximity Radius
                </span>
                <span className="text-[11px] text-slate-400">
                  Trigger automatic voice alert when approaching within:
                </span>
              </div>

              <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-700">
                {[1.5, 3.5, 5.0].map((dist) => (
                  <button
                    key={dist}
                    type="button"
                    onClick={() => setWarningThresholdKm(dist)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                      warningThresholdKm === dist
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {dist} km {dist === 3.5 ? '(Auto)' : ''}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center space-x-2">
                {isSimulating ? (
                  <button
                    type="button"
                    onClick={stopSimulation}
                    className="flex items-center space-x-1.5 bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Stop Simulator</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startSimulation}
                    className="flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>🚗 Simulate Approaching N1 Spike Hazard</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={testVoiceWarning}
                  className="flex items-center space-x-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Preview Audio Announcement</span>
                </button>
              </div>

              <span className="text-[10px] text-slate-400 italic">
                Voice triggers automatically via Web Speech API and GPS watch.
              </span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. EXPANDED RADAR DETAILS (ACTIVE SPIKE HOTSPOTS)                         */}
        {/* ========================================================================= */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-yellow-300 uppercase tracking-wider flex items-center space-x-1.5">
                <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                <span>Active Verified Spike Hazards in System ({activeSpikesCount})</span>
              </span>
              <span className="text-[10px] text-slate-400">
                Sorted by distance from your current GPS
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {reports
                .filter(
                  (r) =>
                    (r.type === 'spiking' ||
                      (r.title + ' ' + r.description).toLowerCase().includes('spike')) &&
                    (r.status === 'approved' || r.status === 'resolved')
                )
                .map((spike) => {
                  const dist = userLocation
                    ? calculateDist(userLocation.lat, userLocation.lng, spike.latitude, spike.longitude)
                    : null;
                  return (
                    <div
                      key={spike.id}
                      className="bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 p-2 rounded-xl flex items-center justify-between text-xs transition"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-red-400 font-black">🚨</span>
                          <span className="font-bold text-white truncate">{spike.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {spike.roadName || spike.locationName}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {dist !== null && (
                          <span
                            className={`font-black text-xs px-2 py-0.5 rounded-lg ${
                              dist <= 1.5
                                ? 'bg-red-600 text-white'
                                : dist <= 3.5
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {formatDistance(dist)}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            triggerVoiceAlert(
                              {
                                report: spike,
                                distanceKm: dist || 2.5,
                                isUrgent: (dist || 2.5) <= 1.5,
                                locationName: spike.locationName,
                                roadName: spike.roadName || spike.locationName,
                                title: spike.title,
                                description: spike.description
                              },
                              true
                            );
                          }}
                          className="p-1 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20 rounded-lg transition"
                          title="Speak this hazard"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function calculateDist(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
