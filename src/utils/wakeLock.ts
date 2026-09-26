// Screen Wake Lock API utility to keep the display awake during navigation and live map viewing

let wakeLockSentinel: any = null;
let isRequested = false;
let listeners: Array<(active: boolean) => void> = [];

/**
 * Checks if the Screen Wake Lock API is supported in the current browser/device.
 */
export function isWakeLockSupported(): boolean {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
}

/**
 * Returns whether the screen wake lock is currently active.
 */
export function isScreenWakeLockActive(): boolean {
  return Boolean(wakeLockSentinel && !wakeLockSentinel.released);
}

/**
 * Subscribe to wake lock status changes.
 */
export function subscribeToWakeLock(callback: (active: boolean) => void): () => void {
  listeners.push(callback);
  callback(isScreenWakeLockActive());
  return () => {
    listeners = listeners.filter(cb => cb !== callback);
  };
}

function notifyListeners(active: boolean) {
  listeners.forEach(cb => {
    try {
      cb(active);
    } catch (e) {
      console.debug('Wake lock listener error:', e);
    }
  });
}

/**
 * Requests the screen to stay on (prevent display sleep/timeout).
 * Safe across all browsers; handles re-acquisition on tab visibility changes.
 */
export async function requestScreenWakeLock(): Promise<boolean> {
  isRequested = true;

  if (!isWakeLockSupported()) {
    notifyListeners(false);
    return false;
  }

  try {
    if (wakeLockSentinel && !wakeLockSentinel.released) {
      notifyListeners(true);
      return true;
    }

    // @ts-ignore
    wakeLockSentinel = await navigator.wakeLock.request('screen');

    wakeLockSentinel.addEventListener('release', () => {
      notifyListeners(false);
      // If user still wants screen awake and document is visible, re-acquire automatically
      if (isRequested && typeof document !== 'undefined' && document.visibilityState === 'visible') {
        requestScreenWakeLock().catch(() => {});
      }
    });

    notifyListeners(true);
    return true;
  } catch (err: any) {
    console.debug('Screen Wake Lock request notice:', err?.message || err);
    notifyListeners(false);
    return false;
  }
}

/**
 * Releases the screen wake lock so the device display can sleep normally.
 */
export async function releaseScreenWakeLock(): Promise<void> {
  isRequested = false;
  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
    } catch (e) {}
    wakeLockSentinel = null;
  }
  notifyListeners(false);
}

// Global visibility change handler: re-acquire wake lock when tab returns to foreground
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isRequested) {
      requestScreenWakeLock().catch(() => {});
    }
  });
}
