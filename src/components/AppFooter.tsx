import React from 'react';
import { ExternalLink, Code2, Sparkles, MessageCircle, Heart, ShieldCheck } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';

interface AppFooterProps {
  className?: string;
  onNavigateToTab?: (tab: string) => void;
}

export const AppFooter: React.FC<AppFooterProps> = ({
  className = '',
  onNavigateToTab
}) => {
  const targetUrl = 'https://techrix365.com';
  const whatsappUrl = 'https://wa.me/27608645692?text=Hello%20Charles%2C%20I%20saw%20LiveTraffic%20and%20would%20like%20to%20inquire%20about%20getting%20an%20app%20developed%20by%20Techrix365';

  return (
    <footer 
      id="app-global-footer"
      className={`w-full bg-[#020408] border-t-2 border-[#D4A237]/40 text-slate-300 py-8 px-4 sm:px-6 lg:px-8 mt-12 select-none relative overflow-hidden ${className}`}
    >
      {/* Ambient background glow accents */}
      <div className="absolute top-0 left-1/4 w-96 h-32 bg-[#D4A237]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        
        {/* Left: Creator Attribution & Techrix365 Branding */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0B1526] to-[#040810] border border-[#D4A237]/60 flex items-center justify-center shrink-0 shadow-lg shadow-amber-950/40">
            <Code2 className="w-6 h-6 text-[#D4A237]" />
          </div>
          
          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-white font-black text-sm tracking-wide">
                LiveTraffic NPC
              </span>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-[#D4A237]/20 text-[#D4A237] border border-[#D4A237]/50">
                Community Road Safety
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium leading-relaxed">
              Created by{' '}
              <span className="text-[#FAF4EA] font-bold">Charles Odendaal</span>{' '}
              from{' '}
              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#D4A237] hover:text-amber-300 font-bold underline underline-offset-2 transition inline-flex items-center gap-1 group"
                title="Visit Techrix365.com - Web & Mobile App Development"
              >
                techrix365.com
                <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </p>

            <p className="text-xs text-slate-400 mt-0.5">
              Need a custom web or mobile app developed? Let us know!
            </p>
          </div>
        </div>

        {/* Right: Quick Action Buttons (WhatsApp Inquiry + Visit Techrix365) */}
        <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
          {/* WhatsApp Direct Inquiry Button */}
          <a
            id="footer-techrix-whatsapp-btn"
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-950/60 hover:shadow-emerald-500/25 transition cursor-pointer group"
            title="Chat on WhatsApp with Charles Odendaal at Techrix365"
            aria-label="Inquire about app development on WhatsApp"
          >
            <WhatsAppIcon className="w-4 h-4 text-slate-950 shrink-0" />
            <span>Need an App? Chat with Us</span>
          </a>

          {/* Techrix365 Website Link Button */}
          <a
            id="footer-techrix-website-btn"
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#081220] hover:bg-[#0E1F36] active:scale-95 text-[#D4A237] hover:text-amber-300 border border-[#D4A237]/60 hover:border-[#D4A237] font-black text-xs sm:text-sm shadow-md transition cursor-pointer group"
            title="Explore Techrix365.com Solutions"
            aria-label="Visit Techrix365.com website"
          >
            <Sparkles className="w-4 h-4 text-[#D4A237] shrink-0 group-hover:scale-110 transition-transform" />
            <span>techrix365.com</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>
      </div>

      {/* Bottom Sub-bar */}
      <div className="max-w-7xl mx-auto mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
        <p className="text-center sm:text-left">
          © {new Date().getFullYear()} LiveTraffic NPC • All rights reserved • Powered by <a href={targetUrl} target="_blank" rel="noopener noreferrer" className="text-[#D4A237]/90 hover:underline">Techrix365</a>
        </p>
        <div className="flex items-center space-x-4">
          <a 
            href={targetUrl}
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-slate-300 transition"
          >
            Techrix365 Development
          </a>
          <span>•</span>
          <a 
            href={whatsappUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-emerald-400 transition"
          >
            WhatsApp Developer
          </a>
        </div>
      </div>
    </footer>
  );
};
