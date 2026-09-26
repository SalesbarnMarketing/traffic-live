import React, { useState, useEffect, useCallback } from 'react';
import {
  Compass,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Navigation,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { verifyUserLocation, LocationCheckResult, queryLocationPermissionState } from '../utils/locationChecker';

interface LocationStatusCardProps {
  onOpenDiagnostics?: () => void;
  className?: string;
}

export const LocationStatusCard: React.FC<LocationStatusCardProps> = ({
  onOpenDiagnostics,
  className = ''
}) => {
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [result, setResult] = useState<LocationCheckResult | null>(null);

  const checkLocation = useCallback(async (isUserTriggered: boolean = false) => {
    setIsChecking(true);
    try {
      const res = await verifyUserLocation({
        enableHighAccuracy: true,
        timeout: isUserTriggered ? 9000 : 6000
      });
      setResult(res);
    } catch (err) {
      console.warn('Location check failed:', err);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    // Initial check on mount
    checkLocation(false);
  }, [checkLocation]);

  const handleTurnOnLocation = async () => {
    setIsChecking(true);
    // Request position directly to trigger native browser prompt
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setResult({
            status: 'granted',
            isTurnedOn: true,
            isPermissionGranted: true,
            coords: {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: Math.round(pos.coords.accuracy || 0)
            },
            userGuidance: 'Location is active and GPS is calibrated.',
            timestamp: Date.now()
          });
          setIsChecking(false);
        },
        async () => {
          // If native prompt fails or was blocked, run full verification & optionally open diagnostics
          await checkLocation(true);
          if (onOpenDiagnostics) {
            onOpenDiagnostics();
          }
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      if (onOpenDiagnostics) {
        onOpenDiagnostics();
      }
      setIsChecking(false);
    }
  };

  const isLocationOn = result?.status === 'granted' && !!result.coords;
  const isDeniedOrDisabled = result?.status === 'denied' || result?.status === 'disabled' || result?.status === 'timeout';

  return (
    <div
      className={`rounded-2xl sm:rounded-3xl border transition-all duration-300 overflow-hidden shadow-xl ${
        isChecking
          ? 'bg-[#0A0F1A] border-[#D4A237]/40'
          : isLocationOn
          ? 'bg-gradient-to-r from-[#071912] via-[#091E16] to-[#0A261C] border-emerald-500/50 shadow-emerald-950/40'
          : isDeniedOrDisabled
          ? 'bg-gradient-to-r from-[#1C0D0D] via-[#240F0F] to-[#170A0A] border-red-500/60 shadow-red-950/40'
          : 'bg-[#0A0F1A] border-amber-500/50 shadow-amber-950/40'
      } ${className}`}
    >
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
        
        {/* Left Side: Status Icon & Info */}
        <div className="flex items-start sm:items-center space-x-3.5 min-w-0 flex-1">
          {/* Status Indicator Icon */}
          <div
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-md ${
              isChecking
                ? 'bg-[#D4A237]/15 border-[#D4A237]/50 text-[#D4A237]'
                : isLocationOn
                ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400'
                : isDeniedOrDisabled
                ? 'bg-red-500/20 border-red-500/60 text-red-400 animate-pulse'
                : 'bg-amber-500/20 border-amber-500/60 text-amber-400'
            }`}
          >
            {isChecking ? (
              <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
            ) : isLocationOn ? (
              <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" />
            ) : isDeniedOrDisabled ? (
              <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 text-red-400" />
            ) : (
              <Compass className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400" />
            )}
          </div>

          {/* Text Summary */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
              <span
                className={`font-black text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                  isChecking
                    ? 'bg-[#D4A237]/20 text-[#D4A237] border-[#D4A237]/40'
                    : isLocationOn
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                    : isDeniedOrDisabled
                    ? 'bg-red-950/80 text-red-300 border-red-500/50'
                    : 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                }`}
              >
                {isChecking
                  ? 'CHECKING GPS...'
                  : isLocationOn
                  ? 'GPS LOCATION IS ON'
                  : isDeniedOrDisabled
                  ? 'LOCATION IS TURNED OFF'
                  : 'LOCATION PERMISSION REQUIRED'}
              </span>

              {isLocationOn && result?.coords && (
                <span className="text-[10px] font-bold text-emerald-400/90 bg-black/40 px-2 py-0.5 rounded-md border border-emerald-500/30">
                  ±{result.coords.accuracy}m Accuracy
                </span>
              )}
            </div>

            <h4 className="text-sm sm:text-base font-black text-white uppercase tracking-tight truncate">
              {isChecking
                ? 'Pinging Device Satellite Link...'
                : isLocationOn
                ? 'Device GPS Connected & Calibrated'
                : isDeniedOrDisabled
                ? 'Location Is Disabled Or Blocked'
                : 'Enable GPS for Real-Time Highway Alerts'}
            </h4>

            <p className="text-xs text-slate-300 font-medium line-clamp-1 mt-0.5">
              {isChecking
                ? 'Verifying browser permissions & hardware sensors...'
                : isLocationOn
                ? 'Ready for Driver Mode radar, spike proximity alerts & quick dispatch.'
                : isDeniedOrDisabled
                ? 'Turn on device location to receive hands-free voice alerts and nearby hazards.'
                : 'Allow location access so we can warn you of spike traps along your route.'}
            </p>
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
          {/* Test Location Button */}
          <button
            type="button"
            onClick={() => checkLocation(true)}
            disabled={isChecking}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-[#090E17] hover:bg-[#121B2C] border border-[#D4A237]/50 text-[#D4A237] hover:text-amber-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
            title="Test real-time GPS accuracy"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>Test GPS</span>
          </button>

          {/* Turn On / Diagnostics Button */}
          {!isLocationOn ? (
            <button
              type="button"
              onClick={handleTurnOnLocation}
              disabled={isChecking}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition shadow-lg shadow-emerald-950/50 active:scale-95 cursor-pointer animate-pulse"
              title="Turn on location permissions"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Turn On Location</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenDiagnostics}
              className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 text-emerald-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1 transition shadow-sm active:scale-95 cursor-pointer"
              title="View full location diagnostics"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Diagnostics</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
