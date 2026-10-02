import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Compass,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  X,
  Smartphone,
  Navigation,
  ShieldCheck,
  Globe,
  Settings,
  HelpCircle,
  Check
} from 'lucide-react';
import { verifyUserLocation, LocationCheckResult, saveLastKnownUserPosition } from '../utils/locationChecker';
import { SA_REGIONS, SARegionId, saveSelectedRegion } from '../utils/regionUtils';

interface LocationCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationVerified?: (coords: { latitude: number; longitude: number; accuracy: number }) => void;
  onSelectManualRegion?: (regionId: SARegionId) => void;
}

type DeviceGuideTab = 'android' | 'iphone' | 'other';

const QUICK_REGIONS: Array<{ id: SARegionId; label: string; sub: string; lat: number; lng: number }> = [
  { id: 'Gauteng', label: 'Gauteng', sub: 'Johannesburg & Pretoria', lat: -26.0500, lng: 28.1200 },
  { id: 'Western Cape', label: 'Western Cape', sub: 'Cape Town & Boland', lat: -33.9249, lng: 18.4241 },
  { id: 'KwaZulu-Natal', label: 'KZN', sub: 'Durban & PMB', lat: -29.8587, lng: 30.8000 },
  { id: 'Free State', label: 'Free State', sub: 'Bloemfontein & N1', lat: -29.0852, lng: 26.1596 },
  { id: 'Mpumalanga', label: 'Mpumalanga', sub: 'Mbombela & N4', lat: -25.5653, lng: 30.5276 },
  { id: 'Eastern Cape', label: 'Eastern Cape', sub: 'Gqeberha & N2', lat: -33.9608, lng: 25.6022 }
];

export const LocationCheckModal: React.FC<LocationCheckModalProps> = ({
  isOpen,
  onClose,
  onLocationVerified,
  onSelectManualRegion
}) => {
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [result, setResult] = useState<LocationCheckResult | null>(null);
  const [activeGuideTab, setActiveGuideTab] = useState<DeviceGuideTab>(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) return 'iphone';
      if (/android/.test(ua)) return 'android';
    }
    return 'android';
  });
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(false);
  const [selectedManualRegion, setSelectedManualRegion] = useState<SARegionId | null>(null);

  const runLocationCheck = useCallback(async () => {
    setIsChecking(true);
    try {
      const res = await verifyUserLocation({ enableHighAccuracy: true, timeout: 9000, forceFresh: true });
      setResult(res);

      if (res.status === 'granted' && res.coords) {
        saveLastKnownUserPosition(res.coords.latitude, res.coords.longitude, res.coords.accuracy);
        if (onLocationVerified) {
          onLocationVerified(res.coords);
        }
      }
    } catch (err) {
      console.warn('Location verification failed:', err);
    } finally {
      setIsChecking(false);
    }
  }, [onLocationVerified]);

  useEffect(() => {
    if (isOpen) {
      runLocationCheck();
    }
  }, [isOpen, runLocationCheck]);

  const handleManualRegionPick = (reg: typeof QUICK_REGIONS[number]) => {
    setSelectedManualRegion(reg.id);
    saveLastKnownUserPosition(reg.lat, reg.lng, 100);
    saveSelectedRegion(reg.id);
    if (onSelectManualRegion) {
      onSelectManualRegion(reg.id);
    }
    if (onLocationVerified) {
      onLocationVerified({ latitude: reg.lat, longitude: reg.lng, accuracy: 100 });
    }
    if (dontShowAgain) {
      try {
        localStorage.setItem('livetraffic_gps_dismissed', 'true');
      } catch (e) {}
    }
    onClose();
  };

  const handleCloseAndDismiss = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('livetraffic_gps_dismissed', 'true');
      } catch (e) {}
    }
    onClose();
  };

  if (!isOpen) return null;

  const isLocationGranted = result?.status === 'granted' && !!result.coords;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div
        className="bg-[#0A0F1A] border border-[#D4A237]/40 rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 text-white relative my-auto max-h-[90vh] flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#D4A237]/10 border border-[#D4A237]/30 flex items-center justify-center text-[#D4A237]">
              <Compass className={`w-5 h-5 ${isChecking ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wide">
                Location & GPS Settings
              </h3>
              <p className="text-xs text-slate-400">Manage real-time GPS alerts & regional traffic</p>
            </div>
          </div>
          <button
            onClick={handleCloseAndDismiss}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="space-y-4 overflow-y-auto pr-1">
          {/* Diagnostic Status Card */}
          {isChecking ? (
            <div className="bg-[#05080E] border border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center space-y-3 text-center">
              <RefreshCw className="w-7 h-7 text-[#D4A237] animate-spin" />
              <div>
                <p className="text-sm font-bold text-slate-200">Checking Device GPS & Permissions...</p>
                <p className="text-xs text-slate-400 mt-0.5">Contacting browser geolocation service</p>
              </div>
            </div>
          ) : isLocationGranted && result?.coords ? (
            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4 space-y-3 text-left">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-black text-emerald-300 uppercase tracking-wide">
                    GPS Location is Active
                  </h4>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    Your real-time device location is connected with high-accuracy satellite positioning.
                  </p>
                </div>
              </div>

              <div className="bg-black/50 border border-emerald-500/20 rounded-lg p-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Latitude</span>
                  <span className="font-mono text-emerald-300 font-semibold">{result.coords.latitude.toFixed(5)}°</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Longitude</span>
                  <span className="font-mono text-emerald-300 font-semibold">{result.coords.longitude.toFixed(5)}°</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Accuracy Radius</span>
                  <span className="font-mono text-emerald-300 font-semibold">±{result.coords.accuracy} meters</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Informative Status Banner */}
              <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3.5 space-y-2 text-left">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wide">
                      {result?.status === 'denied'
                        ? 'Location Permission is Blocked'
                        : result?.status === 'timeout'
                        ? 'GPS Signal Timed Out'
                        : 'GPS Location Is Currently Turned Off'}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {result?.status === 'denied'
                        ? 'Your browser has blocked location access. You can either unblock it below or select your region manually.'
                        : 'LiveTraffic can still work seamlessly! You can enable GPS or pick your province below.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Option A: Quick Fallback to Province / City */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-[#D4A237]" />
                    <span className="text-xs font-black uppercase text-slate-200 tracking-wider">
                      Option 1: Pick Your Area Manually
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-400/90 font-medium">No GPS needed</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Select your primary region to view local traffic cameras, highway times & corridor alerts without GPS permissions:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
                  {QUICK_REGIONS.map((reg) => (
                    <button
                      key={reg.id}
                      type="button"
                      onClick={() => handleManualRegionPick(reg)}
                      className={`p-2 rounded-lg border text-left transition flex flex-col justify-center cursor-pointer active:scale-95 ${
                        selectedManualRegion === reg.id
                          ? 'bg-[#D4A237]/20 border-[#D4A237] text-white'
                          : 'bg-[#05080E] hover:bg-slate-800 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <span className="text-xs font-black truncate">{reg.label}</span>
                      <span className="text-[9px] text-slate-400 truncate">{reg.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Option B: Step-by-Step Guide to Enable GPS */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Settings className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-black uppercase text-slate-200 tracking-wider">
                      Option 2: How to Enable Live GPS
                    </span>
                  </div>
                </div>

                {/* Device Selector Tabs */}
                <div className="flex p-1 bg-black/50 rounded-lg border border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setActiveGuideTab('android')}
                    className={`flex-1 py-1.5 px-2 rounded-md font-bold transition flex items-center justify-center space-x-1 cursor-pointer ${
                      activeGuideTab === 'android'
                        ? 'bg-[#D4A237] text-black shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Android / Chrome</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveGuideTab('iphone')}
                    className={`flex-1 py-1.5 px-2 rounded-md font-bold transition flex items-center justify-center space-x-1 cursor-pointer ${
                      activeGuideTab === 'iphone'
                        ? 'bg-[#D4A237] text-black shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>iPhone / Safari</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveGuideTab('other')}
                    className={`flex-1 py-1.5 px-2 rounded-md font-bold transition flex items-center justify-center space-x-1 cursor-pointer ${
                      activeGuideTab === 'other'
                        ? 'bg-[#D4A237] text-black shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Other / Desktop</span>
                  </button>
                </div>

                {/* Instructions by Device */}
                <div className="text-slate-300 text-xs leading-relaxed space-y-2 bg-black/40 p-3 rounded-lg border border-slate-800/80">
                  {activeGuideTab === 'android' && (
                    <ol className="list-decimal pl-4 space-y-1.5 text-[11px]">
                      <li>
                        Tap the <strong>Tune / Lock icon</strong> on the left of your address bar (next to <code>trafficlive.co.za</code>).
                      </li>
                      <li>
                        Tap <strong>Permissions</strong> and switch <strong>Location</strong> to <strong>Allow</strong>.
                      </li>
                      <li>
                        Ensure phone GPS is on: Swipe down your top notification shade and check that the <strong>Location</strong> tile is turned ON.
                      </li>
                    </ol>
                  )}

                  {activeGuideTab === 'iphone' && (
                    <ol className="list-decimal pl-4 space-y-1.5 text-[11px]">
                      <li>
                        Tap the <strong>aA</strong> or <strong>Settings</strong> icon on the left side of your Safari address bar.
                      </li>
                      <li>
                        Select <strong>Website Settings</strong> &rarr; change <strong>Location</strong> to <strong>Allow</strong>.
                      </li>
                      <li>
                        (If still blocked) Open iPhone <em>Settings &gt; Privacy & Security &gt; Location Services &gt; Safari Websites</em> and set to <em>While Using the App</em>.
                      </li>
                    </ol>
                  )}

                  {activeGuideTab === 'other' && (
                    <ol className="list-decimal pl-4 space-y-1.5 text-[11px]">
                      <li>
                        Click the <strong>Lock / Sliders icon</strong> next to the website URL in your browser bar.
                      </li>
                      <li>
                        Set <strong>Location</strong> permission to <strong>Allow</strong> or <strong>Reset Permissions</strong>.
                      </li>
                      <li>
                        Refresh this webpage or tap <strong>Double-Check Location</strong> below.
                      </li>
                    </ol>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Don't show again checkbox */}
          {!isLocationGranted && (
            <label className="flex items-center space-x-2 text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer pt-1 select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-[#D4A237] focus:ring-[#D4A237]/40 w-4 h-4"
              />
              <span>Remember my choice & don't show this location check again</span>
            </label>
          )}
        </div>

        {/* Action Controls */}
        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2">
          {/* Retry / Double Check Button */}
          <button
            type="button"
            onClick={runLocationCheck}
            disabled={isChecking}
            className="flex-1 min-w-[140px] bg-[#D4A237] hover:bg-amber-400 text-black font-black text-xs sm:text-sm py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition shadow-lg disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Testing GPS...' : 'Double-Check Location'}</span>
          </button>

          {/* Continue / Dismiss Button */}
          <button
            type="button"
            onClick={handleCloseAndDismiss}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm py-2.5 px-4 rounded-xl transition cursor-pointer"
          >
            {isLocationGranted ? 'Done' : 'Continue Without GPS'}
          </button>
        </div>
      </div>
    </div>
  );
};
