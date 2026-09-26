import React, { useState, useEffect } from 'react';
import {
  BellRing,
  BellOff,
  Radio,
  Smartphone,
  Laptop,
  CheckCircle,
  AlertTriangle,
  Send,
  Trash2,
  RefreshCw,
  Sliders,
  ShieldAlert,
  Volume2,
  VolumeX,
  Vibrate,
  Info,
  Power,
  Flame,
  Ambulance,
  PhoneCall,
  UserPlus
} from 'lucide-react';
import { AdminPushSubscription, PushSettings } from '../types';
import {
  isPushNotificationSupported,
  registerAdminPushSubscription,
  testPushAlert,
  getExistingPushSubscription
} from '../utils/pushNotification';

interface AdminPushNotificationsTabProps {
  currentUser?: {
    email: string;
    role: string;
    fullName?: string;
  };
}

export const AdminPushNotificationsTab: React.FC<AdminPushNotificationsTabProps> = ({
  currentUser
}) => {
  const [subscriptions, setSubscriptions] = useState<AdminPushSubscription[]>([]);
  const [settings, setSettings] = useState<PushSettings>({
    enabled: true,
    notifyOnSOS: true,
    notifyOnSpiking: true,
    notifyOnCriticalHazard: true,
    soundAlert: true,
    vibrationAlert: true
  });
  const [loading, setLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isThisDeviceSubscribed, setIsThisDeviceSubscribed] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [supported, setSupported] = useState(true);
  const [customDeviceName, setCustomDeviceName] = useState('');

  const adminHeaders = {
    'Content-Type': 'application/json',
    'x-user-role': currentUser?.role || 'admin',
    'x-user-email': currentUser?.email || 'admin@livetrafficnpc.co.za'
  };

  const checkLocalSubscription = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
    }
    const sub = await getExistingPushSubscription();
    setIsThisDeviceSubscribed(Boolean(sub));
  };

  const fetchPushData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Subscriptions
      const subRes = await fetch('/api/admin/push/subscriptions', {
        headers: adminHeaders
      });
      if (subRes.ok) {
        const data = await subRes.json();
        setSubscriptions(data.subscriptions || []);
      }

      // 2. Fetch Settings
      const setRes = await fetch('/api/admin/push/settings', {
        headers: adminHeaders
      });
      if (setRes.ok) {
        const data = await setRes.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }

      await checkLocalSubscription();
    } catch (err) {
      console.error('Error fetching push notification data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSupported(isPushNotificationSupported());
    fetchPushData();
  }, []);

  const handleSubscribeThisDevice = async () => {
    setIsSubscribing(true);
    setTestResult(null);
    try {
      const result = await registerAdminPushSubscription({
        userEmail: currentUser?.email,
        role: currentUser?.role,
        deviceName: customDeviceName.trim() || undefined
      });

      if (!result.success) {
        setTestResult({
          success: false,
          message: result.error || 'Failed to subscribe this device.'
        });
      } else {
        setTestResult({
          success: true,
          message: 'Device successfully registered! You will now receive alerts even when the app is closed.'
        });
        await fetchPushData();
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'An error occurred during registration.'
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleTriggerTest = async (subId?: string) => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testPushAlert(subId, {
        role: currentUser?.role,
        email: currentUser?.email
      });
      setTestResult({
        success: true,
        message: result.message || 'Test notification dispatched! Check your screen/lockscreen.'
      });
      await fetchPushData();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to dispatch test notification.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    if (!confirm('Remove this device subscription? It will no longer receive emergency alerts.')) return;
    try {
      const res = await fetch(`/api/admin/push/subscriptions/${id}`, {
        method: 'DELETE',
        headers: adminHeaders
      });
      if (res.ok) {
        setSubscriptions((prev) => prev.filter((s) => s.id !== id));
        await checkLocalSubscription();
      }
    } catch (err) {
      console.error('Error deleting push subscription:', err);
    }
  };

  const handleUpdateSetting = async (key: keyof PushSettings, val: boolean) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    try {
      await fetch('/api/admin/push/settings', {
        method: 'PUT',
        headers: adminHeaders,
        body: JSON.stringify({
          [key]: val,
          updatedBy: currentUser?.fullName || currentUser?.email || 'Admin'
        })
      });
    } catch (err) {
      console.error('Error updating push settings:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 border border-red-800/40 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-600/30 border border-red-500/40 rounded-xl text-red-400 mt-1">
              <Radio className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  Emergency Push & FCM Dispatch Engine
                </h2>
                <span className="bg-red-500/20 text-red-300 border border-red-500/30 text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
                  Background Wakeup Active
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                Automatically triggers immediate sound, vibration, and push notifications to all registered
                admin smartphones and desktops when an <strong className="text-red-300 font-semibold">Emergency SOS (Ambulance, Spiking, Collision)</strong> is submitted, even if the browser is minimized or the app is completely closed.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchPushData()}
              disabled={loading}
              className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs rounded-xl flex items-center gap-2 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => handleTriggerTest()}
              disabled={isTesting || subscriptions.length === 0}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-red-900/30 transition disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              Broadcast Test Alert
            </button>
          </div>
        </div>
      </div>

      {/* Test Result Message */}
      {testResult && (
        <div
          className={`p-4 rounded-xl text-sm border flex items-start gap-3 transition ${
            testResult.success
              ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
              : 'bg-red-950/40 border-red-800/50 text-red-300'
          }`}
        >
          {testResult.success ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
          )}
          <div>
            <p className="font-medium">{testResult.message}</p>
          </div>
        </div>
      )}

      {/* Main Grid: Device Registration & Trigger Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: This Device Registration Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-400" />
                This Device Status
              </h3>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  isThisDeviceSubscribed
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : permissionState === 'denied'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {isThisDeviceSubscribed
                  ? 'Subscribed & Active'
                  : permissionState === 'denied'
                  ? 'Permission Blocked'
                  : 'Not Subscribed'}
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-300 mb-6">
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Push API Supported:</span>
                <span className={supported ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>
                  {supported ? 'Yes (W3C Push + Service Worker)' : 'Not Supported'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Browser Permission:</span>
                <span
                  className={
                    permissionState === 'granted'
                      ? 'text-emerald-400 font-medium'
                      : permissionState === 'denied'
                      ? 'text-red-400 font-medium'
                      : 'text-amber-400 font-medium'
                  }
                >
                  {permissionState.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Admin Account:</span>
                <span className="text-slate-200 truncate max-w-[150px]">
                  {currentUser?.email || 'admin@livetrafficnpc.co.za'}
                </span>
              </div>
            </div>

            {!isThisDeviceSubscribed && (
              <div className="mb-4">
                <label className="block text-xs text-slate-400 mb-1">Device Label (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. Charles iPhone 15 / Office PC"
                  value={customDeviceName}
                  onChange={(e) => setCustomDeviceName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>
            )}
          </div>

          <div>
            <button
              onClick={handleSubscribeThisDevice}
              disabled={isSubscribing || !supported}
              className={`w-full py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition shadow-md ${
                isThisDeviceSubscribed
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  : 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/30'
              }`}
            >
              {isSubscribing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Registering Device...
                </>
              ) : isThisDeviceSubscribed ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Re-Sync / Update Subscription
                </>
              ) : (
                <>
                  <BellRing className="w-4 h-4" />
                  Enable Push Alerts on this Device
                </>
              )}
            </button>
            <p className="text-[11px] text-slate-400 text-center mt-2">
              Requires clicking "Allow" on your browser permission prompt.
            </p>
          </div>
        </div>

        {/* Right Column (2 spans): Push Alert Trigger Policies & Audio Settings */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-red-400" />
              Automated Push Trigger Rules
            </h3>
            <span className="text-xs text-slate-400">
              {subscriptions.length} active device{subscriptions.length === 1 ? '' : 's'} registered
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Rule 1: Emergency SOS */}
            <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-500/20 text-red-400 rounded-lg">
                  <Ambulance className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Emergency SOS Requests</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Medical, Ambulance, Collision, or Hostile threat distress calls.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleUpdateSetting('notifyOnSOS', !settings.notifyOnSOS)}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-1 ${
                  settings.notifyOnSOS ? 'bg-red-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.notifyOnSOS ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Rule 2: Spiking Hazards */}
            <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Spiking & Trap Hazards</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Alerts on spikes, rocks on highway, or robbery traps.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleUpdateSetting('notifyOnSpiking', !settings.notifyOnSpiking)}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-1 ${
                  settings.notifyOnSpiking ? 'bg-red-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.notifyOnSpiking ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Rule 3: Critical Hazards */}
            <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Critical Severity Reports</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Reports tagged as Critical Severity by motorists or AI.
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  handleUpdateSetting('notifyOnCriticalHazard', !settings.notifyOnCriticalHazard)
                }
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-1 ${
                  settings.notifyOnCriticalHazard ? 'bg-red-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.notifyOnCriticalHazard ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Rule 4: New User & Responder Signups */}
            <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">New User & Responder Signups</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Alerts when a new motorist, responder, SAPS officer, or advertiser creates an account.
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  handleUpdateSetting('notifyOnNewUserSignup', settings.notifyOnNewUserSignup === false ? true : false)
                }
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-1 ${
                  settings.notifyOnNewUserSignup !== false ? 'bg-red-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.notifyOnNewUserSignup !== false ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Rule 5: Siren Sound & Vibration */}
            <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                  <Vibrate className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Sound & Vibration Siren</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Triggers urgent alert vibration pattern and audio chime.
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  handleUpdateSetting('vibrationAlert', !settings.vibrationAlert)
                }
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-1 ${
                  settings.vibrationAlert ? 'bg-red-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.vibrationAlert ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-800/40 border border-slate-700/40 rounded-xl text-xs text-slate-300 flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              <strong>Service Worker Background Sync:</strong> The server delivers push payloads via W3C WebPush & FCM protocols. Tapping an incoming notification opens the live Emergency Dispatch console with 1-click caller dialing.
            </span>
          </div>
        </div>
      </div>

      {/* Subscribed Devices Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Laptop className="w-5 h-5 text-slate-400" />
              Registered Admin Dispatch Devices ({subscriptions.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              These devices will receive instant background push alerts when incidents or distress calls arrive.
            </p>
          </div>
        </div>

        {subscriptions.length === 0 ? (
          <div className="p-12 text-center">
            <BellOff className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-white">No Admin Devices Registered Yet</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
              Click the "Enable Push Alerts on this Device" button above on each phone or laptop you use for dispatch to start receiving emergency notifications.
            </p>
            <button
              onClick={handleSubscribeThisDevice}
              disabled={isSubscribing}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 transition"
            >
              <BellRing className="w-4 h-4" />
              Subscribe This Device Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3">Device Label</th>
                  <th className="px-6 py-3">User / Admin</th>
                  <th className="px-6 py-3">Registered Date</th>
                  <th className="px-6 py-3">Last Active</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-2.5">
                      {sub.deviceName?.toLowerCase().includes('phone') ||
                      sub.deviceName?.toLowerCase().includes('android') ||
                      sub.deviceName?.toLowerCase().includes('ios') ? (
                        <Smartphone className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Laptop className="w-4 h-4 text-blue-400" />
                      )}
                      <span>{sub.deviceName || 'Admin Browser Device'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-200">{sub.userEmail || 'admin@livetrafficnpc.co.za'}</div>
                      <div className="text-[11px] text-slate-400 uppercase font-mono">{sub.role || 'admin'}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(sub.createdAt).toLocaleDateString('en-ZA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(sub.lastActiveAt).toLocaleTimeString('en-ZA', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleTriggerTest(sub.id)}
                        disabled={isTesting}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs transition inline-flex items-center gap-1.5"
                        title="Send test alert to this device"
                      >
                        <Send className="w-3 h-3 text-red-400" />
                        Ping
                      </button>
                      <button
                        onClick={() => handleDeleteSubscription(sub.id)}
                        className="px-2.5 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 rounded-lg text-xs transition inline-flex items-center gap-1.5"
                        title="Delete subscription"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
