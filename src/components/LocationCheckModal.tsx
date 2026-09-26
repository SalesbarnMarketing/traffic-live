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
  ExternalLink
} from 'lucide-react';
import { verifyUserLocation, LocationCheckResult, queryLocationPermissionState } from '../utils/locationChecker';

interface LocationCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationVerified?: (coords: { latitude: number; longitude: number; accuracy: number }) => void;
}

export const LocationCheckModal: React.FC<LocationCheckModalProps> = ({
  isOpen,
  onClose,
  onLocationVerified
}) => {
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [result, setResult] = useState<LocationCheckResult | null>(null);

  const runLocationCheck = useCallback(async () => {
    setIsChecking(true);
    const res = await verifyUserLocation({ enableHighAccuracy: true, timeout: 9000 });
    setResult(res);
    setIsChecking(false);

    if (res.status === 'granted' && res.coords && onLocationVerified) {
      onLocationVerified(res.coords);
    }
  }, [onLocationVerified]);

  useEffect(() => {
    if (isOpen) {
      runLocationCheck();
    }
  }, [isOpen, runLocationCheck]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-[#0A0F1A] border border-[#D4A237]/40 rounded-2xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 text-white relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#D4A237]/10 border border-[#D4A237]/30 flex items-center justify-center text-[#D4A237]">
              <Compass className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wide">
                Location & GPS Check
              </h3>
              <p className="text-xs text-slate-400">Verifying real-time device location</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diagnostic Status Card */}
        {isChecking ? (
          <div className="bg-[#05080E] border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center space-y-3 text-center">
            <RefreshCw className="w-8 h-8 text-[#D4A237] animate-spin" />
            <div>
              <p className="text-sm font-bold text-slate-200">Pinging Device GPS & Permissions...</p>
              <p className="text-xs text-slate-400 mt-0.5">Checking satellite link & accuracy</p>
            </div>
          </div>
        ) : result?.status === 'granted' && result.coords ? (
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4 space-y-3 text-left">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-black text-emerald-300 uppercase tracking-wide">
                  GPS Location is Active
                </h4>
                <p className="text-xs text-emerald-200/90 mt-0.5">
                  Your device location is turned ON with high-accuracy satellite positioning.
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
          <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 space-y-3 text-left">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-black text-amber-300 uppercase tracking-wide">
                  {result?.status === 'denied'
                    ? 'Location Access Blocked'
                    : result?.status === 'timeout'
                    ? 'GPS Signal Timed Out'
                    : 'Location / GPS Is Turned OFF'}
                </h4>
                <p className="text-xs text-amber-200/90 mt-1">
                  {result?.errorMessage || 'Unable to access your live position.'}
                </p>
              </div>
            </div>

            {/* Quick Step Guide */}
            <div className="bg-black/50 border border-amber-500/20 rounded-lg p-3 text-xs space-y-2 text-slate-300">
              <div className="flex items-center space-x-1.5 text-amber-300 font-bold text-[11px] uppercase tracking-wider">
                <Smartphone className="w-3.5 h-3.5" />
                <span>How to turn on GPS:</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px] leading-relaxed">
                {result?.status === 'denied' ? (
                  <>
                    <li>
                      Tap the <strong>Lock / Settings icon</strong> in your browser address bar.
                    </li>
                    <li>
                      Change <strong>Location</strong> permission to <strong>Allow</strong>.
                    </li>
                    <li>Refresh this page or tap the "Retry Location Check" button below.</li>
                  </>
                ) : (
                  <>
                    <li>
                      <strong>Android:</strong> Pull down top notification shade & tap the <strong>Location / GPS</strong> tile to turn it ON.
                    </li>
                    <li>
                      <strong>iPhone:</strong> Open <em>Settings &gt; Privacy &amp; Security &gt; Location Services</em> & switch ON.
                    </li>
                    <li>
                      <strong>High Accuracy:</strong> Ensure browser has permission in app settings.
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-2 flex items-center space-x-2">
          <button
            onClick={runLocationCheck}
            disabled={isChecking}
            className="flex-1 bg-[#D4A237] hover:bg-amber-400 text-black font-black text-xs sm:text-sm py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition shadow-lg disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Checking...' : 'Double-Check Location'}</span>
          </button>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm py-2.5 px-4 rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
