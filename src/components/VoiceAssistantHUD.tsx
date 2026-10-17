import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Volume2,
  Sparkles,
  HelpCircle,
  X,
  ChevronUp,
  ChevronDown,
  AlertOctagon,
  Check,
  Plus,
  AlertTriangle,
  MapPin
} from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { VoiceCommandAction } from '../hooks/useVoiceAssistant';

interface VoiceAssistantHUDProps {
  isSupported: boolean;
  isListening: boolean;
  isContinuousMode: boolean;
  wakeWordDetected: boolean;
  liveTranscript: string;
  lastExecutedCommand: {
    text: string;
    actionLabel: string;
    timestamp: number;
    success: boolean;
  } | null;
  isProcessing: boolean;
  errorMessage: string | null;
  activeTab?: string;
  onStartListening: () => void;
  onStopListening: () => void;
  onToggleContinuousMode: () => void;
  onOpenVoiceCommandsModal: () => void;
  onOpenReportModal?: (options?: {
    type?: string;
    title?: string;
    coords?: { lat: number; lng: number };
    onScene?: boolean;
    autoDetectGps?: boolean;
    forceFullModal?: boolean;
  }) => void;
}

export const VoiceAssistantHUD: React.FC<VoiceAssistantHUDProps> = ({
  isSupported,
  isListening,
  isContinuousMode,
  wakeWordDetected,
  liveTranscript,
  lastExecutedCommand,
  isProcessing,
  errorMessage,
  activeTab,
  onStartListening,
  onStopListening,
  onToggleContinuousMode,
  onOpenVoiceCommandsModal,
  onOpenReportModal
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  if (!isSupported) {
    return null;
  }

  // Only display on the Map and Feeds pages as requested
  if (activeTab !== 'map' && activeTab !== 'feed') {
    return null;
  }

  const isRecentCommand =
    lastExecutedCommand && Date.now() - lastExecutedCommand.timestamp < 5000;

  return (
    <aside
      aria-label="Voice Assistant Controls"
      className="fixed right-3 sm:right-6 bottom-22 sm:bottom-26 z-40 flex flex-col items-end space-y-2 pointer-events-none select-none transition-all duration-300"
    >
      {/* 1. Live Transcript / Last Action Notification Pill */}
      {(liveTranscript || isRecentCommand || wakeWordDetected || errorMessage) && (
        <div className="pointer-events-auto bg-[#070A10]/95 backdrop-blur-md border-2 border-[#D4A237] text-white p-3 rounded-2xl shadow-2xl max-w-xs sm:max-w-sm animate-fadeIn text-xs space-y-1.5 ring-4 ring-black/40">
          {wakeWordDetected && (
            <div className="flex items-center space-x-1.5 text-[#D4A237] font-black uppercase text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-[#D4A237] animate-spin" />
              <span>Wake Word Detected! Listening for command...</span>
            </div>
          )}

          {errorMessage && (
            <div className="text-red-400 font-bold flex items-center space-x-1.5">
              <AlertOctagon className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {liveTranscript && (
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <p className="text-slate-200 font-medium italic truncate">
                "{liveTranscript}"
              </p>
            </div>
          )}

          {isRecentCommand && lastExecutedCommand && (
            <div
              className={`flex items-center space-x-1.5 font-bold pt-1 border-t border-slate-800 ${
                lastExecutedCommand.success ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{lastExecutedCommand.actionLabel}</span>
            </div>
          )}
        </div>
      )}

      {/* 2. Expanded Quick Voice Controls Drawer */}
      {activeTab !== 'feed' && isExpanded && (
        <div className="pointer-events-auto bg-[#070A10]/95 backdrop-blur-md border-2 border-[#D4A237] rounded-3xl p-3.5 shadow-2xl w-64 sm:w-72 space-y-3 animate-fadeIn text-xs text-slate-200 ring-4 ring-black/50">
          <div className="flex items-center justify-between border-b border-[#D4A237]/30 pb-2">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-[#D4A237] text-slate-950 flex items-center justify-center font-black">
                <Mic className="w-3.5 h-3.5 text-[#070A10]" />
              </div>
              <span className="font-black text-white text-xs uppercase tracking-wider">
                Hands-Free Voice HUD
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Continuous Mode Switch */}
          <div className="flex items-center justify-between gap-2 bg-[#0C1626] p-2.5 rounded-2xl border border-[#D4A237]/30">
            <div>
              <span className="font-extrabold text-white block">"Hey NPC" Mode</span>
              <span className="text-[10px] text-slate-400">Always-on wake word</span>
            </div>
            <button
              onClick={onToggleContinuousMode}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-black uppercase transition cursor-pointer border ${
                isContinuousMode
                  ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {isContinuousMode ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* View All Voice Commands Guide */}
          <button
            onClick={() => {
              setIsExpanded(false);
              onOpenVoiceCommandsModal();
            }}
            className="w-full bg-[#FAF4EA] hover:bg-white text-[#070A10] border border-[#D4A237] font-black py-2 px-3 rounded-2xl flex items-center justify-center space-x-1.5 transition cursor-pointer shadow active:scale-95"
          >
            <HelpCircle className="w-4 h-4 text-[#070A10]" />
            <span className="uppercase tracking-wider">View All Voice Commands</span>
          </button>
        </div>
      )}

      {/* 3. Floating WhatsApp Direct Chat Action Button (+27 67 708 3048) - Hidden on Map screen */}
      {activeTab !== 'map' && (
        <div className="pointer-events-auto relative group">
          <a
            href="https://wa.me/27677083048?text=Hello%20Live%20Traffic%20NPC"
            target="_blank"
            rel="noopener noreferrer"
            className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center font-black transition-all duration-200 cursor-pointer shadow-2xl border-2 active:scale-95 bg-[#25D366] hover:bg-[#20bd5a] text-white border-emerald-200/90 shadow-emerald-950/80 hover:scale-105"
            title="Chat with Live Traffic NPC on WhatsApp (+27 67 708 3048)"
            aria-label="Chat with Live Traffic NPC on WhatsApp (+27 67 708 3048)"
          >
            <WhatsAppIcon variant="monochrome" className="w-6 h-6 sm:w-6.5 sm:h-6.5 text-white fill-current" />
            
            {/* Subtle online pulse indicator beacon */}
            <span className="absolute top-0 right-0 flex h-3.5 w-3.5 -mt-0.5 -mr-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border-2 border-[#070A10]"></span>
            </span>
          </a>

          {/* Hover Tooltip on Desktop */}
          <div className="absolute right-full mr-2.5 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center px-2.5 py-1 bg-[#070A10]/95 border border-emerald-500/50 rounded-xl text-white text-[11px] font-bold shadow-xl whitespace-nowrap pointer-events-none">
            <span className="text-emerald-400 font-extrabold mr-1">WhatsApp:</span> +27 67 708 3048
          </div>
        </div>
      )}

      {/* 4. Floating Action Controls: Dedicated Voice Orb + Primary Plus Action */}
      <div className="pointer-events-auto flex items-center space-x-2">
        {/* Dedicated Voice Assistant / Mic Orb (Hidden on Feeds Screen) */}
        {activeTab !== 'feed' && (
          <button
            type="button"
            onClick={() => {
              if (isListening && !isContinuousMode) {
                onStopListening();
              } else {
                onStartListening();
              }
            }}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold transition cursor-pointer shadow-xl border active:scale-95 ${
              isListening
                ? 'bg-emerald-500 text-slate-950 border-emerald-300 ring-2 ring-emerald-400 animate-pulse'
                : 'bg-[#0A0F1A]/95 hover:bg-[#121B2D] text-[#D4A237] hover:text-white border-[#D4A237]/60'
            }`}
            title={isListening ? 'Stop Voice Assistant' : 'Voice Assistant / Hey NPC (Hands-Free)'}
            aria-label="Toggle Voice Assistant"
          >
            {isListening ? (
              <div className="flex flex-col items-center justify-center">
                <Mic className="w-4 h-4 text-slate-950 animate-bounce" />
                <div className="flex items-center space-x-0.5 mt-0.5">
                  <span className="w-0.5 h-1 bg-slate-950 rounded-full animate-bounce [animation-delay:0ms]"></span>
                  <span className="w-0.5 h-1.5 bg-slate-950 rounded-full animate-bounce [animation-delay:150ms]"></span>
                  <span className="w-0.5 h-1 bg-slate-950 rounded-full animate-bounce [animation-delay:300ms]"></span>
                </div>
              </div>
            ) : (
              <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4A237]" />
            )}
          </button>
        )}

        {/* Primary PLUS / Post Hazard Button: Hidden on Map screen as requested */}
        {activeTab !== 'map' && (
          <div className="relative group">
            <button
              type="button"
              onClick={() => {
                if (onOpenReportModal) {
                  onOpenReportModal({ autoDetectGps: true, onScene: true, forceFullModal: true });
                }
              }}
              className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-black transition cursor-pointer shadow-2xl border-2 active:scale-95 bg-gradient-to-tr from-[#D4A237] via-amber-400 to-yellow-200 text-[#070A10] border-amber-200 shadow-[#D4A237]/40 hover:brightness-110"
              title="Report Road Hazard (Normal report routine)"
              aria-label="Report Road Hazard"
            >
              <Plus className="w-6 h-6 sm:w-7 sm:h-7 text-[#070A10] stroke-[3]" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
