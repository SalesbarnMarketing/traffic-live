import React from 'react';
import { EmergencySOS } from '../types';
import { AlertOctagon, Phone, MapPin, X, Navigation, Volume2 } from 'lucide-react';
import { playEmergencySOSAlertSound } from '../utils/voiceAudioFeedback';

interface EmergencySOSAlertBannerProps {
  sos: EmergencySOS | null;
  onDismiss: () => void;
  onViewOnMap: (sos: EmergencySOS) => void;
}

export const EmergencySOSAlertBanner: React.FC<EmergencySOSAlertBannerProps> = ({
  sos,
  onDismiss,
  onViewOnMap
}) => {
  if (!sos) return null;

  const isGbv = sos.emergencyType === 'gbv_assist';

  const emergencyTypeLabel =
    sos.emergencyType === 'gbv_assist'
      ? '💜 GBV Emergency Priority Assist'
      : sos.emergencyType === 'medical'
      ? 'Paramedic / Medical Emergency'
      : sos.emergencyType === 'spiking_puncture'
      ? 'Highway Spike Trap / Puncture'
      : sos.emergencyType === 'crime_threat'
      ? 'Police & Armed Escort Needed'
      : sos.emergencyType === 'crash' || sos.emergencyType === 'accident'
      ? 'Major Collision Rescue'
      : 'Highway Emergency SOS';

  return (
    <div
      id="emergency-sos-global-banner"
      role="alert"
      aria-live="assertive"
      className="fixed top-2 left-2 right-2 sm:left-4 sm:right-4 z-[9999] max-w-4xl mx-auto shadow-2xl transition-all duration-300 animate-in slide-in-from-top-4"
    >
      <div className={`${
        isGbv
          ? 'bg-gradient-to-r from-purple-800 via-fuchsia-700 to-purple-900 border-purple-400'
          : 'bg-gradient-to-r from-red-700 via-red-600 to-rose-700 border-red-400'
      } text-white rounded-2xl border-2 p-3.5 sm:p-4 shadow-2xl backdrop-blur-md`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          
          {/* Left: Siren & Details */}
          <div className="flex items-start space-x-3 min-w-0">
            <div className="p-2.5 bg-black/30 rounded-xl shrink-0 border border-white/20 animate-pulse mt-0.5">
              <AlertOctagon className="w-6 h-6 text-white" />
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider bg-black/40 px-2.5 py-0.5 rounded-full text-red-200 border border-red-300/30">
                  🚨 LIVE EMERGENCY SOS DISPATCH
                </span>
                <span className="text-[11px] font-semibold text-red-100 flex items-center space-x-1">
                  <span>•</span>
                  <span>{emergencyTypeLabel}</span>
                </span>
              </div>

              <h4 className="text-sm sm:text-base font-black text-white mt-1 leading-snug">
                {sos.name} urgently requires assistance at{' '}
                <span className="underline decoration-red-300 underline-offset-2">{sos.locationName}</span>
              </h4>

              <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-red-100">
                {sos.vehicleInfo && (
                  <span className="truncate max-w-[250px]">
                    🚘 <strong className="text-white">{sos.vehicleInfo}</strong>
                  </span>
                )}
                {sos.phone && (
                  <span className="font-mono">
                    📞 <strong className="text-white">{sos.phone}</strong>
                  </span>
                )}
                {sos.notes && (
                  <span className="italic opacity-90 truncate max-w-[300px]">
                    "{sos.notes}"
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-red-500/40">
            <button
              id="sos-banner-sound-btn"
              onClick={() => playEmergencySOSAlertSound()}
              className="p-2 bg-black/30 hover:bg-black/50 text-white rounded-xl transition border border-white/20"
              title="Replay Siren Sound"
              aria-label="Replay siren alert sound"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            <button
              id="sos-banner-view-map-btn"
              onClick={() => onViewOnMap(sos)}
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-white hover:bg-red-50 text-red-700 text-xs font-black rounded-xl transition shadow-lg flex items-center justify-center space-x-1.5 uppercase tracking-wider cursor-pointer active:scale-95"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>View Map</span>
            </button>

            {sos.phone && (
              <a
                id="sos-banner-call-btn"
                href={`tel:${sos.phone}`}
                className="px-3.5 py-2 bg-black/40 hover:bg-black/60 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer active:scale-95"
                title={`Call ${sos.phone}`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call</span>
              </a>
            )}

            <button
              id="sos-banner-dismiss-btn"
              onClick={onDismiss}
              className="p-2 hover:bg-black/30 text-white/80 hover:text-white rounded-xl transition cursor-pointer"
              title="Dismiss alert banner"
              aria-label="Dismiss SOS alert banner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
