import React, { useState, useEffect } from 'react';
import { ArrowRight, UserPlus, LogIn, Award, X, ShieldAlert, ExternalLink } from 'lucide-react';
import { LiveTrafficLogo } from './LiveTrafficLogo';
import { WhatsAppIcon } from './WhatsAppIcon';
import { WHATSAPP_CHANNEL_URL } from '../utils/whatsappShare';

interface WelcomeScreenProps {
  onOpenRegister: () => void;
  onOpenLogin: () => void;
  onOpenOnboarding?: () => void;
  onClose?: () => void;
  autoCloseSeconds?: number;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onOpenRegister,
  onOpenLogin,
  onOpenOnboarding,
  onClose,
  autoCloseSeconds = 5,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(autoCloseSeconds);

  useEffect(() => {
    if (!autoCloseSeconds || autoCloseSeconds <= 0) return;
    setSecondsRemaining(autoCloseSeconds);

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [autoCloseSeconds]);

  useEffect(() => {
    if (autoCloseSeconds > 0 && secondsRemaining === 0) {
      if (onClose) {
        onClose();
      }
    }
  }, [secondsRemaining, autoCloseSeconds, onClose]);

  const progressPercent = autoCloseSeconds > 0 
    ? Math.min(100, Math.max(0, ((autoCloseSeconds - secondsRemaining) / autoCloseSeconds) * 100))
    : 100;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-[#0D1422] via-[#0E1B2C] to-[#080E18] text-slate-100 flex flex-col items-center justify-between p-6 sm:p-10 select-none animate-fadeIn">
      
      {/* Background Subtle Radial Gold Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] sm:w-[520px] sm:h-[520px] bg-[#D4A237]/12 rounded-full blur-[110px] pointer-events-none" />

      {/* Top Bar / Status */}
      <div className="w-full max-w-sm flex items-center justify-between z-10 pt-2">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#D4A237] animate-ping" />
          <span className="text-[10px] font-black text-[#D4A237] uppercase tracking-widest">LIVE TRAFFIC NPC</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest bg-[#122033] border border-[#D4A237]/30 px-3 py-1 rounded-full shadow-sm">
            Gauteng Network
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-[#122033] text-slate-400 hover:text-white border border-[#D4A237]/40 hover:border-[#D4A237] transition cursor-pointer"
              title="Close and enter dashboard immediately"
              aria-label="Close welcome screen"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Center Content */}
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-7 z-10 my-auto py-6">
        
        {/* Official Metallic Gold Shield Crest Badge */}
        <div className="relative group flex items-center justify-center">
          <LiveTrafficLogo size="xl" showText={true} withGlow={true} animateBeacon={true} />
        </div>

        {/* Big Bold Headline */}
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase leading-none font-sans drop-shadow-md">
            SAFE ROADS
          </h1>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#D4A237] uppercase leading-none font-sans drop-shadow-lg">
            SAVE LIVES
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-medium pt-3 max-w-xs mx-auto leading-relaxed">
            Your choices behind the wheel can protect lives.
          </p>
        </div>

        {/* Auto-loading 5-second progress indicator */}
        {autoCloseSeconds > 0 && (
          <div className="w-full space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-1">
              <span className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4A237] animate-pulse" />
                <span>Loading radar feed...</span>
              </span>
              <span className="text-[#D4A237] font-bold">Auto-entering in {secondsRemaining}s</span>
            </div>
            <div className="w-full h-1.5 bg-[#122033] rounded-full overflow-hidden border border-[#D4A237]/30">
              <div
                className="h-full bg-gradient-to-r from-[#8C6218] via-[#D4A237] to-[#FFF2B2] transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full space-y-3.5 pt-1">
          
          {/* Primary Gold Pill Continue Button */}
          <button
            onClick={() => {
              if (onClose) onClose();
              else onOpenLogin();
            }}
            className="w-full bg-gradient-to-r from-[#D4A237] via-[#D4A237] to-[#8E6516] hover:brightness-105 active:scale-98 text-slate-950 font-black text-sm uppercase py-4 px-6 rounded-full shadow-2xl shadow-[#D4A237]/30 tracking-wider flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <span>Enter Radar System</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>

          {/* Safety Tour Link Button */}
          {onOpenOnboarding && (
            <button
              onClick={onOpenOnboarding}
              className="w-full py-2.5 px-4 rounded-full bg-[#122033]/80 hover:bg-[#122033] border border-[#D4A237]/30 text-[#D4A237] text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Explore Safety Guidelines & Tips</span>
            </button>
          )}

          {/* Official WhatsApp Channel Link */}
          <a
            href={WHATSAPP_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-full bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/50 text-[#25D366] text-xs font-black transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
          >
            <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0" />
            <span>Join WhatsApp Alerts Channel</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          {/* Secondary Link under button */}
          <div className="pt-1 flex items-center justify-center space-x-4 text-xs font-semibold">
            <button
              onClick={onOpenRegister}
              className="text-slate-300 hover:text-[#D4A237] transition underline underline-offset-4 cursor-pointer"
            >
              New user? Register
            </button>
            <span className="text-slate-600">•</span>
            <button
              onClick={onOpenLogin}
              className="text-[#D4A237] hover:text-amber-300 transition font-bold underline underline-offset-4 cursor-pointer"
            >
              Already registered? Login
            </button>
          </div>

        </div>

      </div>

      {/* Footer Info */}
      <div className="w-full max-w-sm text-center z-10 pb-2">
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold">
          Powered By Rik's Social Media Manager
        </p>
      </div>

    </div>
  );
};
