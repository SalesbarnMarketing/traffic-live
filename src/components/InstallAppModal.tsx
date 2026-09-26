import React, { useState } from 'react';
import {
  Smartphone,
  Monitor,
  Download,
  CheckCircle2,
  X,
  ExternalLink,
  Share2,
  PlusSquare,
  MoreVertical,
  Layers,
  Sparkles,
  Shield,
  Copy,
  Check
} from 'lucide-react';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { LiveTrafficLogo } from './LiveTrafficLogo';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, browserInfo, promptInstall } = usePwaInstall();
  const [activeTab, setActiveTab] = useState<'auto' | 'chrome_desktop' | 'chrome_android' | 'safari_ios'>('auto');
  const [copied, setCopied] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  // Determine suggested guide tab based on device/browser
  const effectiveTab =
    activeTab === 'auto'
      ? browserInfo.isIos
        ? 'safari_ios'
        : browserInfo.isAndroid
        ? 'chrome_android'
        : 'chrome_desktop'
      : activeTab;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await promptInstall();
      if (outcome) {
        setInstallSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenStandalone = () => {
    window.open(window.location.origin, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-[#0A0F1A] border border-[#D4A237]/60 rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl relative text-slate-100 my-auto">
        
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="shrink-0 flex items-center justify-center">
              <LiveTrafficLogo size="xs" showText={false} withGlow={false} animateBeacon={true} className="w-10 h-12" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight truncate">
                  Add to Screen
                </h2>
                <span className="bg-[#D4A237]/20 text-[#D4A237] text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-[#D4A237]/50 whitespace-nowrap">
                  App / Shortcut
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 truncate">
                Desktop Shortcut & Mobile Home Icon
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Key App Benefits */}
        <div className="grid grid-cols-3 gap-2 bg-[#05080E] border border-slate-800 rounded-2xl p-2.5 mb-4 text-center text-[11px]">
          <div className="flex flex-col items-center">
            <Shield className="w-4 h-4 text-[#D4A237] mb-0.5" />
            <span className="font-bold text-white leading-tight">1-Tap Radar</span>
            <span className="text-[10px] text-slate-400">Instant access</span>
          </div>
          <div className="flex flex-col items-center border-x border-slate-800/80 px-1">
            <Sparkles className="w-4 h-4 text-emerald-400 mb-0.5" />
            <span className="font-bold text-white leading-tight">Full Screen</span>
            <span className="text-[10px] text-slate-400">No browser bar</span>
          </div>
          <div className="flex flex-col items-center">
            <Layers className="w-4 h-4 text-amber-400 mb-0.5" />
            <span className="font-bold text-white leading-tight">Zero Store Fees</span>
            <span className="text-[10px] text-slate-400">No download</span>
          </div>
        </div>

        {/* Installed State Notification */}
        {isInstalled && (
          <div className="bg-emerald-950/60 border border-emerald-500/60 rounded-2xl p-3 mb-4 flex items-center space-x-2.5 text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-white">App already installed!</span> You can launch LiveTrafficNPC directly from your desktop or home screen.
            </div>
          </div>
        )}

        {/* Direct One-Click Install Button (When Browser Supports prompt) */}
        {isInstallable && !isInstalled && (
          <div className="mb-4 bg-gradient-to-r from-amber-500/10 via-[#D4A237]/20 to-amber-500/10 border border-[#D4A237] rounded-2xl p-3 text-center">
            <p className="text-xs text-amber-200 mb-2 font-medium">
              Google Chrome / Edge is ready to install automatically:
            </p>
            <button
              onClick={handleInstallClick}
              className="w-full py-2.5 px-3 bg-[#D4A237] hover:bg-[#F3C644] text-[#070A10] font-black rounded-xl uppercase tracking-wider text-xs shadow-xl transition flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>⚡ Install LiveTrafficNPC Shortcut Now</span>
            </button>
          </div>
        )}

        {/* Platform Instruction Tabs Header & Selector */}
        <div className="space-y-2.5">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Select Your Device:
          </div>

          {/* Full-width responsive 3-column segment buttons */}
          <div className="grid grid-cols-3 gap-1.5 bg-[#05080E] p-1 rounded-xl border border-slate-800 text-[11px]">
            <button
              onClick={() => setActiveTab('chrome_desktop')}
              className={`py-1.5 px-1 rounded-lg font-bold transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                effectiveTab === 'chrome_desktop'
                  ? 'bg-[#D4A237] text-[#070A10] shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Desktop</span>
            </button>

            <button
              onClick={() => setActiveTab('chrome_android')}
              className={`py-1.5 px-1 rounded-lg font-bold transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                effectiveTab === 'chrome_android'
                  ? 'bg-[#D4A237] text-[#070A10] shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Android</span>
            </button>

            <button
              onClick={() => setActiveTab('safari_ios')}
              className={`py-1.5 px-1 rounded-lg font-bold transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                effectiveTab === 'safari_ios'
                  ? 'bg-[#D4A237] text-[#070A10] shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Share2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">iPhone</span>
            </button>
          </div>

          {/* TAB 1: Chrome Desktop (Windows / Mac / Chromebook) */}
          {effectiveTab === 'chrome_desktop' && (
            <div className="bg-[#05080E] border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-start space-x-2.5">
                <div className="w-5 h-5 rounded-full bg-[#D4A237]/20 border border-[#D4A237] text-[#D4A237] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div className="text-xs text-slate-200">
                  <p className="font-semibold text-white">In Google Chrome / Edge:</p>
                  Look at the right side of the address/URL bar for the <span className="text-[#D4A237] font-bold">Install App</span> icon (<Monitor className="inline w-3.5 h-3.5 mx-0.5 text-amber-300" />).
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <div className="w-5 h-5 rounded-full bg-[#D4A237]/20 border border-[#D4A237] text-[#D4A237] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div className="text-xs text-slate-200">
                  <p className="font-semibold text-white">Or use the 3-Dots Menu (⋮):</p>
                  Click Chrome menu <MoreVertical className="inline w-3.5 h-3.5 text-slate-400" /> → <span className="text-[#D4A237] font-bold">"Save and share"</span> → <span className="text-[#D4A237] font-bold">"Install LiveTrafficNPC..."</span>.
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <div className="w-5 h-5 rounded-full bg-[#D4A237]/20 border border-[#D4A237] text-[#D4A237] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div className="text-xs text-slate-200">
                  <p className="font-semibold text-white">Confirm Installation:</p>
                  Click <span className="text-emerald-400 font-bold">Install</span>. A desktop & taskbar shortcut will be created instantly.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Android (Chrome) */}
          {effectiveTab === 'chrome_android' && (
            <div className="bg-[#05080E] border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-start space-x-2.5">
                <div className="w-5 h-5 rounded-full bg-[#D4A237]/20 border border-[#D4A237] text-[#D4A237] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div className="text-xs text-slate-200">
                  <p className="font-semibold text-white">Open Chrome on Android:</p>
                  Tap the three-dots menu icon <MoreVertical className="inline w-3.5 h-3.5 text-slate-400" /> at the top-right corner.
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <div className="w-5 h-5 rounded-full bg-[#D4A237]/20 border border-[#D4A237] text-[#D4A237] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div className="text-xs text-slate-200">
                  <p className="font-semibold text-white">Select "Add to Home screen":</p>
                  Tap <span className="text-[#D4A237] font-bold">"Add to Home screen"</span> or <span className="text-[#D4A237] font-bold">"Install app"</span>.
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <div className="w-5 h-5 rounded-full bg-[#D4A237]/20 border border-[#D4A237] text-[#D4A237] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div className="text-xs text-slate-200">
                  <p className="font-semibold text-white">Confirm Installation:</p>
                  Tap <span className="text-emerald-400 font-bold">Install</span>. The icon will appear directly on your phone home screen.
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: iPhone / iPad (Safari) */}
          {effectiveTab === 'safari_ios' && (
            <div className="bg-[#05080E] border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-start space-x-2.5">
                <div className="w-5 h-5 rounded-full bg-[#D4A237]/20 border border-[#D4A237] text-[#D4A237] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div className="text-xs text-slate-200">
                  <p className="font-semibold text-white">Open in Safari:</p>
                  Tap the <span className="text-[#D4A237] font-bold">Share</span> button <Share2 className="inline w-3.5 h-3.5 mx-0.5 text-sky-400" /> at the bottom of Safari.
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <div className="w-5 h-5 rounded-full bg-[#D4A237]/20 border border-[#D4A237] text-[#D4A237] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div className="text-xs text-slate-200">
                  <p className="font-semibold text-white">Tap "Add to Home Screen":</p>
                  Scroll down and tap <PlusSquare className="inline w-3.5 h-3.5 mx-0.5 text-[#D4A237]" /> <span className="text-[#D4A237] font-bold">"Add to Home Screen"</span>.
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <div className="w-5 h-5 rounded-full bg-[#D4A237]/20 border border-[#D4A237] text-[#D4A237] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div className="text-xs text-slate-200">
                  <p className="font-semibold text-white">Tap "Add":</p>
                  Tap <span className="text-emerald-400 font-bold">Add</span> at the top-right to pin to your home screen.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Quick Actions */}
        <div className="mt-4 pt-3.5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2">
          <button
            onClick={handleCopyUrl}
            className="w-full sm:w-auto px-3 py-2 rounded-xl bg-[#05080E] hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? 'Link Copied!' : 'Copy App Link'}</span>
          </button>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={handleOpenStandalone}
              className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-[#05080E] hover:bg-slate-800 border border-[#D4A237]/50 text-xs font-bold text-[#D4A237] hover:text-white transition flex items-center justify-center space-x-1.5 cursor-pointer"
              title="Open full page in new tab for Chrome install icon"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open New Tab</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#D4A237] hover:bg-[#F3C644] text-[#070A10] text-xs font-black uppercase transition cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
