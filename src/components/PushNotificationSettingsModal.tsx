import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellOff, 
  BellRing, 
  Volume2, 
  VolumeX, 
  Play, 
  Check, 
  X, 
  ShieldAlert, 
  Sliders, 
  Sparkles,
  MapPin,
  Flame,
  Radio,
  ExternalLink
} from 'lucide-react';
import { 
  checkNotificationPermission, 
  subscribeUserToPushNotifications, 
  isPushNotificationSupported,
  showLocalEmergencyNotification,
  isIosDevice,
  isStandalonePwa
} from '../utils/pushNotification';
import { playTrafficAlertSound } from '../utils/voiceAudioFeedback';
import { RegisteredUser } from '../types';

interface PushNotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: RegisteredUser | null;
}

export const PushNotificationSettingsModal: React.FC<PushNotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  // Permission state
  const [permission, setPermission] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('default');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }
  }, []);

  // Notification sound settings (stored in localStorage)
  const [playSound, setPlaySound] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('livetraffic_sound_enabled');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  const [selectedSound, setSelectedSound] = useState<string>(() => {
    try {
      return localStorage.getItem('livetraffic_notification_sound') || 'car_horn';
    } catch {
      return 'car_horn';
    }
  });

  // Sound options
  const soundOptions = [
    { id: 'car_horn', label: 'Car horn 🚗', desc: 'Dual-tone automotive horn' },
    { id: 'police_siren', label: 'Police siren 🚨', desc: 'High-low emergency wail' },
    { id: 'alert_chime', label: 'Alert chime 🔔', desc: 'Warm ascending 3-tone chime' },
    { id: 'traffic_whistle', label: 'Traffic whistle 📯', desc: 'Sharp traffic warden whistle' },
    { id: 'radar_beep', label: 'Radar beep 📡', desc: 'High-frequency telemetry chirp' },
    { id: 'two_tone', label: 'Two-tone emergency 🚨', desc: 'Urgent 880Hz / 660Hz alert' },
    { id: 'subtle_ping', label: 'Subtle ping 💬', desc: 'Soft ambient notification' }
  ];

  // Selected provinces for push notifications
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('livetraffic_push_provinces');
      return saved ? JSON.parse(saved) : ['all'];
    } catch {
      return ['all'];
    }
  });

  // Alert types
  const [alertTypes, setAlertTypes] = useState<{
    crashes: boolean;
    spiking: boolean;
    sos: boolean;
    roadworks: boolean;
    scans: boolean;
  }>(() => {
    try {
      const saved = localStorage.getItem('livetraffic_push_alert_types');
      return saved ? JSON.parse(saved) : {
        crashes: true,
        spiking: true,
        sos: true,
        roadworks: true,
        scans: false
      };
    } catch {
      return { crashes: true, spiking: true, sos: true, roadworks: true, scans: false };
    }
  });

  useEffect(() => {
    if (isOpen) {
      setPermission(checkNotificationPermission());
    }
  }, [isOpen]);

  const handleToggleSound = (enabled: boolean) => {
    setPlaySound(enabled);
    try {
      localStorage.setItem('livetraffic_sound_enabled', String(enabled));
    } catch {}
    if (enabled) {
      playTrafficAlertSound(selectedSound);
    }
  };

  const handleChangeSound = (soundId: string) => {
    setSelectedSound(soundId);
    try {
      localStorage.setItem('livetraffic_notification_sound', soundId);
    } catch {}
    if (playSound) {
      playTrafficAlertSound(soundId);
    }
  };

  const handleTestSound = () => {
    playTrafficAlertSound(selectedSound);
  };

  const handleEnablePush = async () => {
    setIsSubscribing(true);
    setStatusMessage(null);
    try {
      const res = await subscribeUserToPushNotifications({
        userEmail: currentUser?.email,
        role: currentUser?.role || 'motorist',
        deviceName: navigator.userAgent || 'LiveTraffic App'
      });

      const currentPerm = checkNotificationPermission();
      setPermission(currentPerm);

      if (res.success || currentPerm === 'granted') {
        setStatusMessage({
          type: 'success',
          text: 'Push notifications are enabled! You will receive live highway alerts and emergency broadcasts.'
        });
        if (playSound) {
          playTrafficAlertSound(selectedSound);
        }
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || 'Notification permission was denied. Please allow notifications in your browser/device settings.'
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to enable push notifications.'
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleSendTestNotification = async () => {
    if (playSound) {
      playTrafficAlertSound(selectedSound);
    }

    if (permission === 'granted') {
      try {
        await showLocalEmergencyNotification({
          title: '🚨 LiveTraffic SA: Test Alert',
          body: 'N1 Northbound: Spiking hazard cleared past Pumulani Toll. All lanes open with normal flow.',
          emergencyType: 'traffic_hazard',
          location: 'Pretoria • Pumulani Toll Plaza'
        });
        setStatusMessage({
          type: 'success',
          text: 'Test notification and sound triggered successfully!'
        });
      } catch (err: any) {
        setStatusMessage({
          type: 'info',
          text: 'Sound played! System notification requires browser permissions.'
        });
      }
    } else {
      setStatusMessage({
        type: 'info',
        text: 'Sound preview played! Click "Enable" above to also receive lockscreen and background push banners.'
      });
    }
  };

  const toggleProvince = (prov: string) => {
    let updated: string[];
    if (prov === 'all') {
      updated = ['all'];
    } else {
      const withoutAll = selectedProvinces.filter(p => p !== 'all');
      if (withoutAll.includes(prov)) {
        updated = withoutAll.filter(p => p !== prov);
        if (updated.length === 0) updated = ['all'];
      } else {
        updated = [...withoutAll, prov];
      }
    }
    setSelectedProvinces(updated);
    try {
      localStorage.setItem('livetraffic_push_provinces', JSON.stringify(updated));
    } catch {}
  };

  const toggleAlertType = (key: keyof typeof alertTypes) => {
    const updated = { ...alertTypes, [key]: !alertTypes[key] };
    setAlertTypes(updated);
    try {
      localStorage.setItem('livetraffic_push_alert_types', JSON.stringify(updated));
    } catch {}
  };

  if (!isOpen) return null;

  const isGranted = permission === 'granted';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div 
        className="relative w-full max-w-lg bg-[#070C16] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto text-slate-100 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header matching reference screen */}
        <div className="bg-[#0A1222] border-b border-slate-800 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <span className="text-xl sm:text-2xl animate-pulse">🚦</span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide font-sans flex items-center space-x-2">
                <span>Traffic Alerts SA</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/40 px-1.5 py-0.5 rounded font-black tracking-widest uppercase">
                  NPC
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">National Road Safety & Live Broadcast Network</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {currentUser && (
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-300 font-bold text-xs uppercase shadow">
                {currentUser.fullName ? currentUser.fullName.slice(0, 2) : 'SA'}
              </div>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              title="Close Settings"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Status Message */}
          {statusMessage && (
            <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-start space-x-2 animate-fadeIn border relative ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300'
                : statusMessage.type === 'error'
                ? 'bg-red-950/80 border-red-500/70 text-red-200'
                : 'bg-cyan-950/70 border-cyan-500/60 text-cyan-300'
            }`}>
              <span className="text-sm shrink-0 mt-0.5">
                {statusMessage.type === 'success' ? '✅' : statusMessage.type === 'error' ? '⚠️' : 'ℹ️'}
              </span>
              <div className="flex-1 space-y-1.5 pr-5">
                <div className="leading-relaxed">{statusMessage.text}</div>
                {statusMessage.type === 'error' && (
                  <div className="pt-2 border-t border-red-800/60 space-y-2 text-[11px] text-red-300 font-medium">
                    {isIosDevice() ? (
                      !isStandalonePwa() ? (
                        <div className="space-y-1.5 bg-red-900/40 p-2.5 rounded-lg border border-red-500/30">
                          <p className="font-bold text-red-200">📱 How to enable on iPhone (iOS):</p>
                          <ol className="list-decimal list-inside space-y-1 text-slate-200 leading-normal pl-0.5">
                            <li>Tap the Safari <strong>Share button (⬆️)</strong> at the bottom of your screen.</li>
                            <li>Scroll down and tap <strong>'Add to Home Screen' (➕)</strong>.</li>
                            <li>Open <strong>LiveTraffic</strong> from your Home Screen, then tap <strong>Enable</strong>!</li>
                          </ol>
                        </div>
                      ) : (
                        <div className="space-y-1 bg-red-900/40 p-2 rounded-lg border border-red-500/30">
                          <p className="font-bold text-red-200">📱 iPhone Settings:</p>
                          <p className="text-slate-200">Open <strong>iPhone Settings ➔ Notifications ➔ LiveTraffic</strong> and toggle <strong>Allow Notifications</strong> ON.</p>
                        </div>
                      )
                    ) : (
                      <p className="leading-relaxed">
                        <strong>How to enable:</strong> In your browser URL address bar, click the <strong>🔒 Padlock / Site Settings icon</strong> ➔ Change <strong>Notifications</strong> to <strong>"Allow"</strong> ➔ Refresh the page.
                      </p>
                    )}
                    {isInIframe && (
                      <div className="pt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => window.open(window.location.href, '_blank')}
                          className="px-3 py-1.5 bg-red-900/80 hover:bg-red-800 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 border border-red-400/50 transition cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open in Standalone Tab</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setStatusMessage(null)}
                className="absolute top-2.5 right-2.5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition cursor-pointer"
                title="Dismiss message"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Section 1: PUSH NOTIFICATIONS */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <span>PUSH NOTIFICATIONS</span>
            </h3>

            {/* Main Push Banner Card */}
            <div className="bg-[#0D1829] border border-slate-700/80 rounded-xl p-4 sm:p-5 shadow-lg relative overflow-hidden group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3 min-w-0">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    isGranted 
                      ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-400'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400'
                  }`}>
                    {isGranted ? (
                      <BellRing className="w-5 h-5 text-emerald-400 animate-pulse" />
                    ) : (
                      <BellOff className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm sm:text-base font-bold text-white">Push Notifications</h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Enable push notifications to stay updated on traffic alerts even when the app is closed.
                    </p>
                  </div>
                </div>

                {/* Orange/Gold Enable Action Button */}
                <button
                  onClick={handleEnablePush}
                  disabled={isSubscribing}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wide flex items-center space-x-1.5 shrink-0 transition shadow-md cursor-pointer active:scale-95 ${
                    isGranted
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400'
                      : 'bg-[#F25C05] hover:bg-[#E05202] text-white border border-orange-400'
                  }`}
                  title={isGranted ? 'Notifications already enabled' : 'Click to enable push notifications'}
                >
                  {isGranted ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Active</span>
                    </>
                  ) : (
                    <>
                      <Bell className="w-3.5 h-3.5 text-white" />
                      <span>{isSubscribing ? 'Enabling...' : 'Enable'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Explanatory Caption */}
            <p className="text-[11px] text-slate-400 leading-normal px-1">
              In-app notification preferences are managed from the Notifications page. Use the bell menu option to mute or follow specific alerts.
            </p>
          </div>

          {/* Section 2: NOTIFICATION SOUND */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-[#F25C05]" />
              <span>NOTIFICATION SOUND</span>
            </h3>

            {/* Sound Toggle Box */}
            <div className="bg-[#0D1829] border border-slate-700/80 rounded-xl p-4 sm:p-5 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Play sound on notifications</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Use a sound when you receive traffic alerts.</p>
                </div>
                
                {/* On/Off Checkbox */}
                <label className="flex items-center space-x-2 cursor-pointer select-none bg-slate-800/80 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg transition">
                  <input
                    type="checkbox"
                    checked={playSound}
                    onChange={e => handleToggleSound(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-[#F25C05] focus:ring-[#F25C05] accent-[#F25C05] cursor-pointer"
                  />
                  <span className={`text-xs font-bold ${playSound ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {playSound ? 'On' : 'Off'}
                  </span>
                </label>
              </div>

              {/* Sound Selector Dropdown & Test Sound Button */}
              {playSound && (
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5 animate-fadeIn min-w-0 w-full">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Sound
                  </label>
                  <div className="flex items-center gap-2 w-full min-w-0">
                    <select
                      value={selectedSound}
                      onChange={e => handleChangeSound(e.target.value)}
                      className="min-w-0 flex-1 w-full bg-slate-900/90 border border-slate-700 hover:border-slate-600 rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-[#F25C05] cursor-pointer shadow-inner truncate"
                    >
                      {soundOptions.map(opt => (
                        <option key={opt.id} value={opt.id} className="bg-slate-900 text-slate-100 py-1">
                          {opt.label} — {opt.desc}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={handleTestSound}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-amber-400 hover:text-amber-300 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
                      title="Preview this sound effect"
                    >
                      <Play className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>Preview</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: REGIONAL PREFERENCES & ALERT PRIORITY */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>ALERT REGIONS & HIGHWAYS</span>
            </h3>

            <div className="bg-[#0D1829] border border-slate-700/80 rounded-xl p-4 space-y-3 shadow-lg">
              <p className="text-xs text-slate-400">Choose which provincial corridors you want real-time push alerts for:</p>
              
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: 'All South Africa (National)' },
                  { id: 'GP', label: 'Gauteng (N1, M1, R21, N3, N12)' },
                  { id: 'KZN', label: 'KwaZulu-Natal (N3, N2)' },
                  { id: 'WC', label: 'Western Cape (N1, N2, N7)' },
                  { id: 'LP', label: 'Limpopo (N1, R81, R71)' },
                  { id: 'MP', label: 'Mpumalanga (N4, N12, N11)' },
                  { id: 'EC', label: 'Eastern Cape (N2, N10, R72)' },
                  { id: 'FS', label: 'Free State (N1, N3, N8)' },
                  { id: 'NW', label: 'North West (N4, N14, R503)' },
                  { id: 'NC', label: 'Northern Cape (N1, N7, N14)' }
                ].map(prov => {
                  const isSelected = selectedProvinces.includes(prov.id);
                  return (
                    <button
                      key={prov.id}
                      type="button"
                      onClick={() => toggleProvince(prov.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer border ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500/80 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-amber-400" />}
                      <span>{prov.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Alert Priority Toggles */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Broadcast Categories
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center space-x-2 cursor-pointer bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <input
                      type="checkbox"
                      checked={alertTypes.crashes}
                      onChange={() => toggleAlertType('crashes')}
                      className="rounded text-amber-500 accent-amber-500"
                    />
                    <span className="text-slate-200 font-medium">🚨 Serious Crashes</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <input
                      type="checkbox"
                      checked={alertTypes.spiking}
                      onChange={() => toggleAlertType('spiking')}
                      className="rounded text-amber-500 accent-amber-500"
                    />
                    <span className="text-slate-200 font-medium">⚠️ Spiking Hazards</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <input
                      type="checkbox"
                      checked={alertTypes.sos}
                      onChange={() => toggleAlertType('sos')}
                      className="rounded text-amber-500 accent-amber-500"
                    />
                    <span className="text-slate-200 font-medium">🆘 Emergency SOS</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <input
                      type="checkbox"
                      checked={alertTypes.roadworks}
                      onChange={() => toggleAlertType('roadworks')}
                      className="rounded text-amber-500 accent-amber-500"
                    />
                    <span className="text-slate-200 font-medium">🚧 SANRAL Roadworks</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="bg-[#0A1222] border-t border-slate-800 px-4 py-3 sm:px-6 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSendTestNotification}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Send Test Alert</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow cursor-pointer active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
