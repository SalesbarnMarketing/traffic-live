import React from 'react';
import {
  Mic,
  Volume2,
  X,
  ShieldAlert,
  MapPin,
  AlertTriangle,
  Radio,
  Sliders,
  CheckCircle2,
  PhoneCall,
  Sparkles,
  HelpCircle,
  Play,
  Navigation
} from 'lucide-react';
import { VoiceCommandAction } from '../hooks/useVoiceAssistant';

interface VoiceCommandsModalProps {
  isOpen: boolean;
  onClose: () => void;
  commands: VoiceCommandAction[];
  onExecuteCommand: (commandId: string) => void;
  isContinuousMode: boolean;
  onToggleContinuousMode: () => void;
  isListening: boolean;
}

export const VoiceCommandsModal: React.FC<VoiceCommandsModalProps> = ({
  isOpen,
  onClose,
  commands,
  onExecuteCommand,
  isContinuousMode,
  onToggleContinuousMode,
  isListening
}) => {
  if (!isOpen) return null;

  const safetyCommands = commands.filter((c) => c.category === 'safety');
  const navCommands = commands.filter((c) => c.category === 'navigation');
  const reportCommands = commands.filter((c) => c.category === 'reports');
  const systemCommands = commands.filter((c) => c.category === 'system');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#070A10] border-2 border-[#D4A237] rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(212,162,55,0.25)] overflow-hidden text-slate-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#121E33] via-[#070A10] to-[#121E33] p-4 sm:p-5 border-b border-[#D4A237]/40 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-[#D4A237] to-amber-200 text-[#070A10] flex items-center justify-center font-black shadow-lg shrink-0">
              <Mic className="w-6 h-6 text-[#070A10]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                  Voice Commands & Hands-Free Assistant
                </h2>
                <span className="bg-[#D4A237]/20 text-[#D4A237] border border-[#D4A237]/60 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline-block">
                  AI VOICE
                </span>
              </div>
              <p className="text-xs text-[#D4A237]/90 font-medium truncate">
                Control LiveTrafficNPC completely hands-free while driving
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#0C1626] hover:bg-[#122238] border border-[#D4A237]/40 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
            title="Close voice guide"
          >
            <X className="w-5 h-5 text-[#D4A237]" />
          </button>
        </div>

        {/* Wake Word Banner */}
        <div className="bg-[#0C1626] border-b border-[#D4A237]/30 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2.5 text-xs sm:text-sm">
            <span className="relative flex h-3 w-3 shrink-0">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isListening ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  isListening ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              ></span>
            </span>
            <div className="text-slate-200">
              <strong className="text-[#D4A237] font-black uppercase">Wake Word:</strong> Say{' '}
              <span className="bg-[#070A10] border border-[#D4A237]/60 text-white font-mono px-2 py-0.5 rounded font-bold">
                "Hey NPC"
              </span>{' '}
              or{' '}
              <span className="bg-[#070A10] border border-[#D4A237]/60 text-white font-mono px-2 py-0.5 rounded font-bold">
                "Live Traffic"
              </span>{' '}
              followed by your command.
            </div>
          </div>

          <button
            onClick={onToggleContinuousMode}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer border shrink-0 flex items-center space-x-1.5 shadow ${
              isContinuousMode
                ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-emerald-950/50'
                : 'bg-[#FAF4EA] text-[#070A10] border-[#D4A237] hover:bg-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{isContinuousMode ? '✓ Hands-Free: ACTIVE' : 'Enable Hands-Free Always-On'}</span>
          </button>
        </div>

        {/* Scrollable Command Sections */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Section 1: Emergency & Safety */}
          <div className="space-y-2.5">
            <div className="flex items-center space-x-2 text-red-400 font-black text-xs sm:text-sm uppercase tracking-wider border-b border-red-900/50 pb-1.5">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>🚨 Emergency, Safety & Radar Radar Hotspots</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {safetyCommands.map((cmd) => (
                <div
                  key={cmd.id}
                  className="bg-[#0C1626]/80 hover:bg-[#122238] border border-red-500/40 hover:border-red-400 rounded-2xl p-3 flex flex-col justify-between space-y-2 transition group shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-white text-xs sm:text-sm">{cmd.label}</span>
                      <span className="text-[10px] text-red-400 font-black uppercase px-2 py-0.2 bg-red-950/80 rounded border border-red-800">
                        SAFETY
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{cmd.description}</p>
                    <div className="bg-[#070A10] border border-slate-800 rounded-lg p-1.5 mt-2 text-xs font-mono text-[#D4A237] truncate">
                      {cmd.example}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onExecuteCommand(cmd.id);
                      onClose();
                    }}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-1.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer shadow active:scale-95"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Test Command Now</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Reporting Hazards Hands-Free */}
          <div className="space-y-2.5">
            <div className="flex items-center space-x-2 text-amber-400 font-black text-xs sm:text-sm uppercase tracking-wider border-b border-amber-900/50 pb-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>⚠️ Hands-Free Road Hazard Reporting</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {reportCommands.map((cmd) => (
                <div
                  key={cmd.id}
                  className="bg-[#0C1626]/80 hover:bg-[#122238] border border-amber-500/40 hover:border-amber-400 rounded-2xl p-3 flex flex-col justify-between space-y-2 transition group shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-white text-xs sm:text-sm">{cmd.label}</span>
                      <span className="text-[10px] text-amber-400 font-black uppercase px-2 py-0.2 bg-amber-950/80 rounded border border-amber-800">
                        REPORT
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{cmd.description}</p>
                    <div className="bg-[#070A10] border border-slate-800 rounded-lg p-1.5 mt-2 text-xs font-mono text-[#D4A237] truncate">
                      {cmd.example}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onExecuteCommand(cmd.id);
                      onClose();
                    }}
                    className="w-full bg-[#FAF4EA] hover:bg-white text-[#070A10] border border-[#D4A237] font-black py-1.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer shadow active:scale-95"
                  >
                    <Play className="w-3 h-3 fill-current text-[#070A10]" />
                    <span>Test Command Now</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Navigation & Tabs */}
          <div className="space-y-2.5">
            <div className="flex items-center space-x-2 text-[#D4A237] font-black text-xs sm:text-sm uppercase tracking-wider border-b border-[#D4A237]/30 pb-1.5">
              <Navigation className="w-4 h-4 text-[#D4A237]" />
              <span>🗺️ Navigation & Views</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {navCommands.map((cmd) => (
                <div
                  key={cmd.id}
                  className="bg-[#0C1626]/80 hover:bg-[#122238] border border-[#D4A237]/30 hover:border-[#D4A237]/60 rounded-2xl p-3 flex flex-col justify-between space-y-2 transition group shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-white text-xs sm:text-sm">{cmd.label}</span>
                      <span className="text-[10px] text-[#D4A237] font-black uppercase px-2 py-0.2 bg-[#D4A237]/10 rounded border border-[#D4A237]/30">
                        NAV
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{cmd.description}</p>
                    <div className="bg-[#070A10] border border-slate-800 rounded-lg p-1.5 mt-2 text-xs font-mono text-[#D4A237] truncate">
                      {cmd.example}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onExecuteCommand(cmd.id);
                      onClose();
                    }}
                    className="w-full bg-[#070A10] hover:bg-[#0E1A2C] text-[#D4A237] hover:text-white border border-[#D4A237]/50 font-bold py-1.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer shadow active:scale-95"
                  >
                    <Play className="w-3 h-3 fill-current text-[#D4A237]" />
                    <span>Switch Now</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: System & Audio */}
          <div className="space-y-2.5">
            <div className="flex items-center space-x-2 text-sky-400 font-black text-xs sm:text-sm uppercase tracking-wider border-b border-sky-900/50 pb-1.5">
              <Sliders className="w-4 h-4 text-sky-400" />
              <span>🔊 Audio, Mute & GPS Telemetry</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {systemCommands.map((cmd) => (
                <div
                  key={cmd.id}
                  className="bg-[#0C1626]/80 hover:bg-[#122238] border border-sky-500/30 hover:border-sky-400/60 rounded-2xl p-3 flex flex-col justify-between space-y-2 transition group shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-white text-xs sm:text-sm">{cmd.label}</span>
                      <span className="text-[10px] text-sky-400 font-black uppercase px-2 py-0.2 bg-sky-950/80 rounded border border-sky-800">
                        SYSTEM
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{cmd.description}</p>
                    <div className="bg-[#070A10] border border-slate-800 rounded-lg p-1.5 mt-2 text-xs font-mono text-sky-300 truncate">
                      {cmd.example}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onExecuteCommand(cmd.id);
                      onClose();
                    }}
                    className="w-full bg-[#070A10] hover:bg-slate-800 text-sky-300 hover:text-white border border-sky-500/40 font-bold py-1.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer shadow active:scale-95"
                  >
                    <Play className="w-3 h-3 fill-current text-sky-400" />
                    <span>Execute</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#0C1626] border-t border-[#D4A237]/30 p-3 sm:p-4 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-[#D4A237] shrink-0" />
            <span>Driver tip: Keep the phone mounted on your dashboard with volume audible for speech feedback.</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#FAF4EA] hover:bg-white text-[#070A10] border border-[#D4A237] font-black text-xs uppercase tracking-wider transition cursor-pointer shadow shrink-0 active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
