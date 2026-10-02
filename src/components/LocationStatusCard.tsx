import React, { useState, useEffect, useCallback } from 'react';
import {
  Compass,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Navigation,
  ShieldCheck,
  Globe,
  ChevronRight,
  X
} from 'lucide-react';
import { verifyUserLocation, LocationCheckResult, saveLastKnownUserPosition } from '../utils/locationChecker';
import { getSavedRegion, SA_REGIONS } from '../utils/regionUtils';

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
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('livetraffic_location_card_dismissed') === 'true';
    } catch {
      return false;
    }
  });

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
    checkLocation(false);
  }, [checkLocation]);

  const handleTurnOnLocation = async () => {
    setIsChecking(true);
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const acc = Math.round(pos.coords.accuracy || 0);
          saveLastKnownUserPosition(lat, lng, acc);
          setResult({
            status: 'granted',
            isTurnedOn: true,
            isPermissionGranted: true,
            coords: {
              latitude: lat,
              longitude: lng,
              accuracy: acc
            },
            userGuidance: 'Location is active and GPS is calibrated.',
            timestamp: Date.now()
          });
          setIsChecking(false);
        },
        async () => {
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

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem('livetraffic_location_card_dismissed', 'true');
    } catch {}
  };

  const isLocationOn = result?.status === 'granted' && !!result.coords;
  const currentSavedRegion = getSavedRegion() || 'Gauteng';
  const regionInfo = SA_REGIONS[currentSavedRegion] || SA_REGIONS['Gauteng'];

  if (isDismissed && !isLocationOn) {
    return null;
  }

  return (
    <div
      className={`rounded-2xl sm:rounded-3xl border transition-all duration-300 overflow-hidden shadow-xl ${
        isChecking
          ? 'bg-[#0A0F1A] border-[#D4A237]/40'
          : isLocationOn
          ? 'bg-gradient-to-r from-[#071912] via-[#091E16] to-[#0A261C] border-emerald-500/50 shadow-emerald-950/40'
          : 'bg-[#0A0F1A] border-slate-800 shadow-slate-950/40'
      } ${className}`}
    >
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 relative">
        {/* Dismiss Button if GPS off */}
        {!isLocationOn && (
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            title="Dismiss location card"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Left Side: Status Icon & Info */}
        <div className="flex items-start sm:items-center space-x-3.5 min-w-0 flex-1 pr-6 sm:pr-0">
          {/* Status Indicator Icon */}
          <div
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-md ${
              isChecking
                ? 'bg-[#D4A237]/15 border-[#D4A237]/50 text-[#D4A237]'
                : isLocationOn
                ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400'
                : 'bg-slate-800/80 border-slate-700 text-[#D4A237]'
            }`}
          >
            {isChecking ? (
              <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
            ) : isLocationOn ? (
              <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" />
            ) : (
              <Globe className="w-6 h-6 sm:w-7 sm:h-7 text-[#D4A237]" />
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
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {isChecking
                  ? 'CHECKING GPS...'
                  : isLocationOn
                  ? 'GPS LOCATION ACTIVE'
                  : `MANUAL REGION: ${regionInfo.name.toUpperCase()}`}
              </span>

              {isLocationOn && result?.coords ? (
                <span className="text-[10px] font-bold text-emerald-400/90 bg-black/40 px-2 py-0.5 rounded-md border border-emerald-500/30">
                  ±{result.coords.accuracy}m Accuracy
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 bg-black/40 px-2 py-0.5 rounded-md border border-slate-800">
                  GPS Inactive
                </span>
              )}
            </div>

            <h4 className="text-sm sm:text-base font-black text-white uppercase tracking-tight truncate">
              {isChecking
                ? 'Pinging Device Satellite Link...'
                : isLocationOn
                ? 'Device GPS Connected & Calibrated'
                : `Active Area: ${regionInfo.name}`}
            </h4>

            <p className="text-xs text-slate-300 font-medium line-clamp-1 mt-0.5">
              {isChecking
                ? 'Verifying browser permissions & hardware sensors...'
                : isLocationOn
                ? 'Ready for Driver Mode radar, spike proximity alerts & quick dispatch.'
                : 'Showing regional traffic feeds, cameras & corridors. Enable GPS for automatic radar alerts.'}
            </p>
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
          {/* Settings / Pick Region Button */}
          <button
            type="button"
            onClick={onOpenDiagnostics}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-[#090E17] hover:bg-[#121B2C] border border-[#D4A237]/50 text-[#D4A237] hover:text-amber-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition shadow-sm active:scale-95 cursor-pointer"
            title="Configure location or select region"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{isLocationOn ? 'GPS Info' : 'Location Settings'}</span>
          </button>

          {/* Turn On or Test Button */}
          {!isLocationOn ? (
            <button
              type="button"
              onClick={handleTurnOnLocation}
              disabled={isChecking}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition shadow-lg shadow-emerald-950/50 active:scale-95 cursor-pointer"
              title="Turn on device GPS"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Enable GPS</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => checkLocation(true)}
              disabled={isChecking}
              className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 text-emerald-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
              title="Refresh GPS fix"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
