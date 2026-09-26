import React from 'react';
import { Mail, Smartphone, ExternalLink, Sparkles, RefreshCw } from 'lucide-react';
import { getBadgeVersionString } from '../version';

interface BetaNoticeCardProps {
  className?: string;
}

export const BetaNoticeCard: React.FC<BetaNoticeCardProps> = ({ 
  className = ''
}) => {
  const handleCheckUpdates = () => {
    window.dispatchEvent(new CustomEvent('check-app-version'));
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#0D1526] via-[#0A0F1A] to-[#05080E] border-2 border-[#D4A237]/40 hover:border-[#D4A237]/70 shadow-2xl p-5 sm:p-6 text-center transition-all duration-300 ${className}`}
    >
      {/* Decorative Subtle Background Glow */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-[#D4A237]/10 rounded-full blur-2xl pointer-events-none" />

      {/* Beta Badge & Version */}
      <div className="flex items-center justify-center space-x-2 mb-2.5">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#D4A237]/15 border border-[#D4A237]/60 text-[#D4A237] shadow-inner">
          <span className="w-2 h-2 rounded-full bg-[#D4A237] animate-pulse" />
          <span className="font-black text-xs sm:text-sm tracking-widest uppercase">
            {getBadgeVersionString()}
          </span>
        </div>
      </div>

      {/* Main Beta Statement */}
      <h4 className="text-sm sm:text-base font-bold text-white tracking-wide mb-1">
        This is a live beta test version.
      </h4>

      {/* Built by Techrix365.com attribution */}
      <p className="text-xs sm:text-sm text-slate-300 font-medium mb-3.5">
        <a
          href="https://techrix365.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#D4A237] hover:text-amber-300 font-black underline decoration-[#D4A237]/50 hover:decoration-amber-300 transition inline-flex items-center space-x-1"
        >
          <span>Techrix365.com</span>
          <ExternalLink className="w-3 h-3 inline ml-0.5 opacity-80" />
        </a>
        <span> created the Live Traffic NPC app. We can build your apps, enterprise portals and websites.</span>
      </p>

      {/* Contact Cards & Check for Updates Button */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 text-xs">
        {/* Email Link */}
        <a
          href="mailto:info@techrix365.com"
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-[#070D18] hover:bg-[#101C33] border border-sky-500/40 text-sky-300 hover:text-sky-200 transition shadow-md active:scale-95 group font-semibold"
        >
          <Mail className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition" />
          <span>info@techrix365.com</span>
        </a>

        {/* WhatsApp Link */}
        <a
          href="https://wa.me/27608645692?text=Hello%2C%20I%20would%20like%20to%20inquire%20about%20getting%20an%20app%20developed%20by%20Techrix365"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-[#070D18] hover:bg-[#0E261C] border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 transition shadow-md active:scale-95 group font-semibold"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition" />
          <span>WhatsApp: +27 60 864 5692</span>
        </a>

        {/* Check for Updates Action */}
        <button
          type="button"
          onClick={handleCheckUpdates}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-[#D4A237]/50 text-[#D4A237] hover:text-amber-200 transition shadow-md active:scale-95 cursor-pointer font-bold"
          title="Check if a newer version of the app is available"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#D4A237]" />
          <span>Check for Updates</span>
        </button>
      </div>
    </div>
  );
};

