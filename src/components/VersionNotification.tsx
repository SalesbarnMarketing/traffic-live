import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Sparkles, X, ArrowUpCircle, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { apiFetch } from '../utils/apiClient';
import { APP_VERSION } from '../version';
import { RegisteredUser } from '../types';

interface VersionInfo {
  version: string;
  buildId: string;
  bootTime?: number;
  releaseNotes?: string;
  appName?: string;
}

interface VersionNotificationProps {
  currentVersion?: string;
  currentUser?: RegisteredUser | null;
  onBeforeReload?: () => void;
  onOpenReleaseNotes?: () => void;
}

// Helper to parse semantic version numbers (e.g. "2.13.0" -> [2, 13, 0])
function parseSemver(v: string): number[] {
  const clean = v.replace(/^v/i, '').trim();
  const parts = clean.split('.').map(p => parseInt(p, 10) || 0);
  while (parts.length < 3) parts.push(0);
  return parts.slice(0, 3);
}

function isVersionNewer(remoteVersion: string, localVersion: string): boolean {
  if (!remoteVersion || !localVersion) return false;
  if (remoteVersion === localVersion) return false;
  const [rMaj, rMin, rPat] = parseSemver(remoteVersion);
  const [lMaj, lMin, lPat] = parseSemver(localVersion);
  if (rMaj > lMaj) return true;
  if (rMaj < lMaj) return false;
  if (rMin > lMin) return true;
  if (rMin < lMin) return false;
  return rPat > lPat;
}

export const VersionNotification: React.FC<VersionNotificationProps> = ({
  currentVersion = APP_VERSION,
  currentUser = null,
  onBeforeReload,
  onOpenReleaseNotes
}) => {
  const [initialBuildId, setInitialBuildId] = useState<string | null>(null);
  const [latestVersionInfo, setLatestVersionInfo] = useState<VersionInfo | null>(null);
  const [hasNewVersion, setHasNewVersion] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const [anonymousCountdown, setAnonymousCountdown] = useState<number | null>(null);
  const [manualCheckFeedback, setManualCheckFeedback] = useState<{ type: 'checking' | 'latest' | 'updated' | 'error'; message: string } | null>(null);
  const initialRecordedRef = useRef<boolean>(false);
  const lastCheckTimeRef = useRef<number>(0);
  const autoReloadTriggeredRef = useRef<boolean>(false);

  // Helper to execute clean reload
  const executeReload = useCallback((targetBuildId?: string) => {
    setIsReloading(true);
    if (onBeforeReload) {
      try {
        onBeforeReload();
      } catch (e) {
        console.error(e);
      }
    }

    if (targetBuildId) {
      try {
        sessionStorage.setItem('client_app_build_id', targetBuildId);
        sessionStorage.setItem('livetraffic_last_anon_reload_ts', String(Date.now()));
      } catch {}
    }

    setTimeout(() => {
      window.location.reload();
    }, 400);
  }, [onBeforeReload]);

  // Function to check version from server
  const checkVersion = useCallback(async (isManual: boolean = false) => {
    if (isManual) {
      setManualCheckFeedback({ type: 'checking', message: 'Checking for application updates...' });
    }

    try {
      // Direct fetch with cache-busting timestamp so neither browser nor proxy caches the check
      const res = await fetch(`/api/version?_t=${Date.now()}`, {
        headers: { 'Accept': 'application/json', 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: VersionInfo = await res.json();
      lastCheckTimeRef.current = Date.now();
      if (!data || !data.version) throw new Error('Invalid version response');

      const isAnonymous = !currentUser;

      if (!initialRecordedRef.current) {
        const storedInitial = sessionStorage.getItem('client_app_build_id');
        const activeBuild = storedInitial || data.buildId || `v${data.version}`;
        sessionStorage.setItem('client_app_build_id', activeBuild);
        setInitialBuildId(activeBuild);
        initialRecordedRef.current = true;
      }

      // Check whether remote version is newer or different from client bundle
      const isSemverHigher = isVersionNewer(data.version, currentVersion);
      const isDifferent = data.version !== currentVersion;
      const isUpdateAvailable = isSemverHigher || (isDifferent && Boolean(data.version));

      if (isUpdateAvailable) {
        setLatestVersionInfo(data);
        setHasNewVersion(true);
        setIsDismissed(false); // Re-open banner if dismissed previously

        if (isManual) {
          setManualCheckFeedback({
            type: 'updated',
            message: `New update v${data.version} available! Click Reload below.`
          });
        }

        // If anonymous connection detected: enforce an automated reload to guarantee newest version
        if (isAnonymous) {
          const lastReloadTs = parseInt(sessionStorage.getItem('livetraffic_last_anon_reload_ts') || '0', 10);
          if (Date.now() - lastReloadTs > 30000 && !autoReloadTriggeredRef.current) {
            autoReloadTriggeredRef.current = true;
            setAnonymousCountdown(2);
            setTimeout(() => {
              executeReload(data.buildId);
            }, 2000);
            return;
          }
        }
      } else {
        // Already on the latest version
        if (isManual) {
          setManualCheckFeedback({
            type: 'latest',
            message: `You are up to date! Running v${currentVersion}.`
          });
          setTimeout(() => setManualCheckFeedback(null), 4000);
        }
      }
    } catch (err) {
      console.warn('[VersionCheck] Check failed:', err);
      if (isManual) {
        setManualCheckFeedback({
          type: 'error',
          message: `Unable to verify version: ${err instanceof Error ? err.message : 'Network error'}`
        });
        setTimeout(() => setManualCheckFeedback(null), 4000);
      }
    }
  }, [currentVersion, currentUser, executeReload]);

  // Initial check on mount and periodic polling every 3 minutes (180s)
  useEffect(() => {
    checkVersion(false);

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      checkVersion(false);
    }, 180000);

    // Also check on tab focus or visibility change only if more than 2 minutes elapsed
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (Date.now() - lastCheckTimeRef.current > 120000) {
          checkVersion(false);
        }
      }
    };

    // Listen for manual update trigger event across the app
    const handleManualTrigger = () => {
      checkVersion(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    window.addEventListener('check-app-version', handleManualTrigger);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      window.removeEventListener('check-app-version', handleManualTrigger);
    };
  }, [checkVersion]);

  // Render manual check feedback toast
  const renderManualToast = () => {
    if (!manualCheckFeedback) return null;
    return (
      <div className="fixed top-5 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 z-[999999] w-[90%] sm:w-auto max-w-sm bg-slate-900/98 border border-[#D4A237] text-white rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-center space-x-3 animate-fadeIn">
        {manualCheckFeedback.type === 'checking' && (
          <RefreshCw className="w-5 h-5 text-[#D4A237] animate-spin shrink-0" />
        )}
        {manualCheckFeedback.type === 'latest' && (
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
        )}
        {manualCheckFeedback.type === 'updated' && (
          <ArrowUpCircle className="w-5 h-5 text-amber-400 shrink-0" />
        )}
        {manualCheckFeedback.type === 'error' && (
          <X className="w-5 h-5 text-rose-400 shrink-0" />
        )}
        <div className="text-xs font-semibold leading-relaxed">
          {manualCheckFeedback.message}
        </div>
      </div>
    );
  };

  // Render anonymous connection auto-reload enforcement banner
  if (anonymousCountdown !== null || (hasNewVersion && !currentUser)) {
    return (
      <>
        {renderManualToast()}
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] w-[92%] max-w-lg animate-bounce">
          <div className="bg-gradient-to-r from-amber-950 via-slate-950 to-amber-950 border-2 border-[#D4A237] rounded-2xl p-4 shadow-2xl backdrop-blur-xl text-white flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#D4A237]/20 border border-[#D4A237] flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5 text-[#D4A237] animate-spin" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="bg-[#D4A237] text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded font-mono">
                  AUTO-REFRESH
                </span>
                <span className="text-xs font-bold text-[#D4A237]">
                  Anonymous Connection Detected
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-0.5 leading-snug">
                Enforcing live reload to apply the latest updates and real-time corridor reports (v{latestVersionInfo?.version || currentVersion})...
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!hasNewVersion || isDismissed) {
    return renderManualToast();
  }

  return (
    <>
      {renderManualToast()}

      {/* Floating Modern New Version Notification Banner for logged-in users */}
      <div className="fixed bottom-20 sm:bottom-6 right-3 left-3 sm:left-auto sm:right-6 z-[9998] sm:max-w-md animate-slideUp">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-[#0E1726] to-slate-950 border-2 border-[#D4A237] shadow-[0_10px_35px_rgba(212,162,55,0.25)] p-4 sm:p-5 text-white backdrop-blur-lg">
          
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#D4A237]/20 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#D4A237]/20 border border-[#D4A237]/60 flex items-center justify-center text-[#D4A237] shrink-0 shadow-inner">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                    NEW VERSION AVAILABLE
                  </span>
                  {latestVersionInfo?.version && (
                    <span className="text-[11px] font-mono text-[#D4A237] font-bold">
                      v{latestVersionInfo.version}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-black text-white mt-0.5 tracking-tight">
                  Update Ready to Install
                </h4>
              </div>
            </div>

            {/* Close / Dismiss for 10 minutes */}
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition cursor-pointer"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300 font-medium mt-2.5 leading-relaxed relative z-10">
            {latestVersionInfo?.releaseNotes || 'Version 2.11.0 is ready with motorist endorsements ("You like Live Traffic!"), Wall of Heroes recognition, mobile shortcuts polish, and zero-data-loss cloud persistence.'}
          </p>

          {/* Action Buttons */}
          <div className="mt-3.5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2.5 relative z-10">
            <div>
              {onOpenReleaseNotes && (
                <button
                  type="button"
                  onClick={onOpenReleaseNotes}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 border border-amber-500/30 transition cursor-pointer flex items-center space-x-1"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>What's New</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
              >
                Later
              </button>

              <button
                type="button"
                disabled={isReloading}
                onClick={() => executeReload(latestVersionInfo?.buildId)}
                className="px-4 py-2 bg-gradient-to-r from-[#D4A237] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-black font-black rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-amber-950/60 hover:shadow-amber-500/20 active:scale-95 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin' : ''}`} />
                <span>{isReloading ? 'Reloading...' : 'Reload & Update Now'}</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};
