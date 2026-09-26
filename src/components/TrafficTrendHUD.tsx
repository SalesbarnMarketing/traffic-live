// Traffic Trend 1-Hour Speed Animation & Situational Awareness HUD
import React from 'react';
import { 
  Play, Pause, RotateCcw, FastForward, Activity, AlertTriangle, 
  TrendingDown, TrendingUp, Gauge, Zap, ChevronRight, X, Info
} from 'lucide-react';
import { TrafficTrendData, getSpeedColor } from '../utils/trafficTrendUtils';

interface TrafficTrendHUDProps {
  trendData: TrafficTrendData;
  activeTimeIndex: number; // 0 to 4 (0: -60m, 1: -45m, 2: -30m, 3: -15m, 4: LIVE)
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (index: number) => void;
  onReset: () => void;
  playbackSpeed: 1 | 2 | 4;
  onChangePlaybackSpeed: (speed: 1 | 2 | 4) => void;
  onClose: () => void;
  onSelectBottleneck?: (lat: number, lng: number, name: string) => void;
}

export const TrafficTrendHUD: React.FC<TrafficTrendHUDProps> = ({
  trendData,
  activeTimeIndex,
  isPlaying,
  onTogglePlay,
  onSeek,
  onReset,
  playbackSpeed,
  onChangePlaybackSpeed,
  onClose,
  onSelectBottleneck,
}) => {
  const currentLabel = trendData.timeLabels[activeTimeIndex] || 'LIVE';
  const isLive = activeTimeIndex === 4;

  // Calculate speed for the active timeline step across all segments
  const activeStepSpeeds = trendData.segments.map(s => s.speedsAtTimeline[activeTimeIndex] || s.currentSpeed);
  const activeStepAvgSpeed = activeStepSpeeds.length > 0 
    ? Math.round(activeStepSpeeds.reduce((a, b) => a + b, 0) / activeStepSpeeds.length)
    : trendData.averageSpeedKmh;

  const trendIsImproving = trendData.averageTrendChangeKmh >= 0;

  return (
    <div className="absolute bottom-6 left-3 right-3 sm:left-6 sm:right-auto sm:w-[420px] z-[1000] animate-fade-in font-sans pointer-events-auto">
      <div className="bg-[#0A0D12]/95 border-2 border-cyan-500/60 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden text-slate-100 flex flex-col">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-cyan-950 px-3.5 py-2.5 border-b border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 relative">
              <Gauge className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  Traffic Trend & Speed Variations
                </span>
                <span className="bg-cyan-500/20 text-cyan-300 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-cyan-500/40 uppercase">
                  1H Flow
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                Visualizing corridor velocity fluctuations & shockwaves
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer border border-slate-700"
            title="Close Traffic Trend Overlay"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Real-Time Telemetry Stats Row */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950/60 border-b border-slate-800 text-center">
          <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 flex flex-col items-center justify-center">
            <span className="text-[9px] uppercase font-bold text-slate-400">Avg Speed</span>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span className={`text-base font-black font-mono ${
                activeStepAvgSpeed >= 85 ? 'text-emerald-400' : activeStepAvgSpeed >= 55 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {activeStepAvgSpeed}
              </span>
              <span className="text-[10px] text-slate-400 font-bold">km/h</span>
            </div>
          </div>

          <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 flex flex-col items-center justify-center">
            <span className="text-[9px] uppercase font-bold text-slate-400">1h Momentum</span>
            <div className="flex items-center space-x-1 mt-0.5">
              {trendIsImproving ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span className={`text-xs font-mono font-extrabold ${trendIsImproving ? 'text-emerald-400' : 'text-rose-400'}`}>
                {trendData.averageTrendChangeKmh >= 0 ? `+${trendData.averageTrendChangeKmh}` : trendData.averageTrendChangeKmh} km/h
              </span>
            </div>
          </div>

          <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 flex flex-col items-center justify-center">
            <span className="text-[9px] uppercase font-bold text-slate-400">Corridor Status</span>
            <span className={`text-[10px] font-black uppercase mt-0.5 px-1.5 py-0.5 rounded truncate max-w-full ${
              trendData.overallStatus === 'Fluid Flow'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : trendData.overallStatus === 'Moderate Slowdowns'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse'
            }`}>
              {trendData.overallStatus}
            </span>
          </div>
        </div>

        {/* Timeline Player & Scrubber */}
        <div className="p-3.5 space-y-3 bg-[#0A0D12]">
          
          {/* Time Step Indicator & Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Timeline Slice:</span>
              <span className={`px-2 py-0.5 rounded-lg text-xs font-mono font-black ${
                isLive
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              }`}>
                {currentLabel === 'LIVE' ? '🔴 LIVE NOW' : `T ${currentLabel}`}
              </span>
            </div>

            {/* Playback Speed Pill */}
            <button
              onClick={() => onChangePlaybackSpeed(playbackSpeed === 1 ? 2 : playbackSpeed === 2 ? 4 : 1)}
              className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] font-mono font-bold text-cyan-400 border border-cyan-500/30 transition cursor-pointer"
              title="Change animation speed"
            >
              {playbackSpeed}x Speed
            </button>
          </div>

          {/* Scrubber Bar */}
          <div className="space-y-1.5">
            <input
              type="range"
              min="0"
              max="4"
              step="1"
              value={activeTimeIndex}
              onChange={(e) => onSeek(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
            />
            
            {/* Step markers */}
            <div className="flex justify-between text-[9px] font-mono font-bold text-slate-400 px-0.5">
              {trendData.timeLabels.map((lbl, idx) => (
                <button
                  key={lbl}
                  onClick={() => onSeek(idx)}
                  className={`hover:text-cyan-300 transition cursor-pointer ${
                    activeTimeIndex === idx ? 'text-cyan-400 font-black underline' : ''
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-2">
              <button
                onClick={onTogglePlay}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer shadow-md ${
                  isPlaying
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                }`}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isPlaying ? 'Pause' : 'Play 1h Trend'}</span>
              </button>

              <button
                onClick={onReset}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
                title="Reset to 60m ago"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => onSeek(4)}
              disabled={isLive}
              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                isLive
                  ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                  : 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/40'
              }`}
            >
              Jump to Live
            </button>
          </div>

          {/* Speed Legend */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[9px] font-bold text-slate-400">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm shadow-emerald-500/50" />
              <span>85-120 km/h</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-sm shadow-amber-500/50" />
              <span>55-84 km/h</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block shadow-sm shadow-orange-500/50" />
              <span>25-54 km/h</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block shadow-sm shadow-red-600/50 animate-pulse" />
              <span>&lt;25 km/h</span>
            </span>
          </div>

          {/* Critical Bottlenecks Section if any */}
          {trendData.criticalBottlenecks.length > 0 && (
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-300">
                <span className="flex items-center space-x-1 text-red-400 font-extrabold uppercase">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Bottlenecks ({trendData.criticalBottlenecks.length})</span>
                </span>
                <span className="text-[9px] text-slate-500">Tap to focus</span>
              </div>

              <div className="max-h-24 overflow-y-auto space-y-1 pr-1 [scrollbar-width:thin]">
                {trendData.criticalBottlenecks.slice(0, 3).map((bn) => (
                  <button
                    key={bn.segmentId}
                    onClick={() => onSelectBottleneck && onSelectBottleneck(bn.lat, bn.lng, bn.name)}
                    className="w-full text-left bg-slate-900/90 hover:bg-slate-800 p-1.5 rounded-lg border border-red-500/30 flex items-center justify-between text-[10px] transition cursor-pointer group"
                  >
                    <div className="truncate mr-2">
                      <div className="font-bold text-slate-200 group-hover:text-white truncate">{bn.name}</div>
                      {bn.incidentDesc && (
                        <div className="text-[9px] text-red-400 truncate">{bn.incidentDesc}</div>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 shrink-0 font-mono">
                      <span className="bg-red-600/20 text-red-400 font-bold px-1 py-0.5 rounded border border-red-500/40 text-[9px]">
                        {bn.speed} km/h
                      </span>
                      <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-white" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
