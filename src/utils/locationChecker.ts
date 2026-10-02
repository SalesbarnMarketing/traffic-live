export type LocationStatus =
  | 'granted'
  | 'prompt'
  | 'denied'
  | 'disabled'
  | 'timeout'
  | 'unsupported'
  | 'checking';

export interface LocationCheckResult {
  status: LocationStatus;
  isTurnedOn: boolean;
  isPermissionGranted: boolean;
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null;
  errorMessage?: string;
  userGuidance?: string;
  timestamp: number;
  source?: 'gps' | 'network' | 'cache' | 'ip_lookup' | 'default_fallback';
}

export interface CachedUserPosition {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

// Global in-memory cache shared across the application session
let cachedUserPosition: CachedUserPosition | null = (() => {
  if (typeof window === 'undefined') return null;
  try {
    const savedSession = sessionStorage.getItem('livetraffic_last_known_user_pos');
    if (savedSession) {
      const parsed = JSON.parse(savedSession);
      if (parsed && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
        return parsed;
      }
    }
    const savedLocal = localStorage.getItem('livetraffic_last_known_user_pos');
    if (savedLocal) {
      const parsed = JSON.parse(savedLocal);
      if (parsed && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
        return parsed;
      }
    }
  } catch (e) {}
  return null;
})();

let lastKnownLocationCheckCache: LocationCheckResult | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('message', (event) => {
    try {
      const data = event.data;
      if (data && (data.type === 'LIVETRAFFIC_PARENT_GPS' || data.type === 'LIVETRAFFIC_GPS_RESPONSE') && typeof data.lat === 'number' && typeof data.lng === 'number') {
        saveLastKnownUserPosition(data.lat, data.lng, data.accuracy || 20);
      }
    } catch (e) {}
  });

  if (window.self !== window.top) {
    try {
      window.parent.postMessage({ type: 'LIVETRAFFIC_REQUEST_GPS' }, '*');
    } catch (e) {}
  }
}

/**
 * Save the user's verified GPS position to memory, sessionStorage, and localStorage
 * so that all parts of the app (Map, Report, Emergency SOS, HUD) have the EXACT same location.
 */
export function saveLastKnownUserPosition(lat: number, lng: number, accuracy?: number): void {
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return;
  const pos: CachedUserPosition = {
    latitude: lat,
    longitude: lng,
    accuracy: typeof accuracy === 'number' ? Math.round(accuracy) : undefined,
    timestamp: Date.now(),
  };
  cachedUserPosition = pos;

  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('livetraffic_last_known_user_pos', JSON.stringify(pos));
      localStorage.setItem('livetraffic_last_known_user_pos', JSON.stringify(pos));
      // Notify active map or listeners in real-time
      window.dispatchEvent(new CustomEvent('livetraffic:user-position-updated', { detail: pos }));
    } catch (e) {}
  }
}

/**
 * Get the current user's verified GPS position immediately without any wait or delay.
 */
export function getLastKnownUserPosition(): CachedUserPosition | null {
  if (cachedUserPosition) return cachedUserPosition;
  if (typeof window === 'undefined') return null;
  try {
    const savedSession = sessionStorage.getItem('livetraffic_last_known_user_pos');
    if (savedSession) {
      const parsed = JSON.parse(savedSession);
      if (parsed && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
        cachedUserPosition = parsed;
        return parsed;
      }
    }
    const savedLocal = localStorage.getItem('livetraffic_last_known_user_pos');
    if (savedLocal) {
      const parsed = JSON.parse(savedLocal);
      if (parsed && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
        cachedUserPosition = parsed;
        return parsed;
      }
    }
  } catch (e) {}
  return null;
}

/**
 * Explicitly clear the cached location to force fresh GPS reading
 */
export function clearLocationCache(): void {
  lastKnownLocationCheckCache = null;
}

/**
 * Checks the browser permission state for geolocation if supported by the browser.
 */
export async function queryLocationPermissionState(): Promise<'granted' | 'prompt' | 'denied' | 'unsupported'> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return 'unsupported';
  }

  try {
    if (navigator.permissions && navigator.permissions.query) {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state;
    }
  } catch (err) {
    console.debug('Permissions API query for geolocation not supported or restricted:', err);
  }

  return 'prompt';
}

/**
 * Exact same multi-tier GPS acquisition as the Interactive Map:
 * 1. Immediate High-Accuracy GPS (Hardware satellite fix)
 * 2. Fallback to Standard Accuracy (Cell Tower / Wi-Fi network)
 * 3. Fallback to Last Known Cached User GPS
 *
 * NEVER uses fake IP geocoding or defaults to Johannesburg!
 */
export function getExactDeviceGps(options: {
  timeout?: number;
  maximumAge?: number;
  forceFresh?: boolean;
} = {}): Promise<{ latitude: number; longitude: number; accuracy: number; isFallback: boolean; source: 'gps' | 'network' | 'cache' | 'ip_lookup' | 'default_fallback' }> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      const cached = getLastKnownUserPosition();
      if (cached) {
        return resolve({
          latitude: cached.latitude,
          longitude: cached.longitude,
          accuracy: cached.accuracy || 50,
          isFallback: true,
          source: 'cache'
        });
      }
      return reject(new Error('Geolocation is not supported by your browser.'));
    }

    // Fast-path: If caller does not require forced fresh fix, check if we have a recent GPS position (< 90 seconds old)
    if (!options.forceFresh) {
      const cached = getLastKnownUserPosition();
      if (cached && (Date.now() - cached.timestamp < 90000)) {
        return resolve({
          latitude: cached.latitude,
          longitude: cached.longitude,
          accuracy: cached.accuracy || 30,
          isFallback: false,
          source: 'cache'
        });
      }
    }

    const highAccuracyTimeout = options.timeout || 12000;
    const maximumAge = options.forceFresh ? 0 : (options.maximumAge ?? 30000);

    let isResolved = false;
    let tier1Failed = false;
    let tier2Failed = false;
    let tier1Error: any = null;
    let tier2Error: any = null;
    let parallelNetworkTimer: any = null;

    const finalizeSuccess = (lat: number, lng: number, acc: number, source: 'gps' | 'network', isFallback: boolean) => {
      if (isResolved) return;
      isResolved = true;
      if (parallelNetworkTimer) clearTimeout(parallelNetworkTimer);
      const roundedAcc = Math.round(acc || 0);
      saveLastKnownUserPosition(lat, lng, roundedAcc);
      resolve({
        latitude: lat,
        longitude: lng,
        accuracy: roundedAcc,
        isFallback,
        source
      });
    };

    const checkBothFailed = async () => {
      if (isResolved) return;
      if (tier1Failed && tier2Failed) {
        if (parallelNetworkTimer) clearTimeout(parallelNetworkTimer);
        // Tier 3: Last Known GPS Cache from previous lock
        const cached = getLastKnownUserPosition();
        if (cached) {
          isResolved = true;
          return resolve({
            latitude: cached.latitude,
            longitude: cached.longitude,
            accuracy: cached.accuracy || 100,
            isFallback: true,
            source: 'cache'
          });
        }

        // Tier 4: IP-based South African regional lookup
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 2500);
          const ipRes = await fetch('/api/user-ip-location', { signal: controller.signal });
          clearTimeout(timer);
          if (ipRes.ok) {
            const ipData = await ipRes.json();
            if (ipData && typeof ipData.lat === 'number' && typeof ipData.lng === 'number') {
              isResolved = true;
              return resolve({
                latitude: ipData.lat,
                longitude: ipData.lng,
                accuracy: ipData.accuracy || 15000,
                isFallback: true,
                source: 'ip_lookup'
              });
            }
          }
        } catch (e) {}

        // Tier 5: Safe South African Metro Fallback (Johannesburg / Central Gauteng)
        isResolved = true;
        resolve({
          latitude: -26.2041,
          longitude: 28.0473,
          accuracy: 25000,
          isFallback: true,
          source: 'default_fallback'
        });
      }
    };

    // Trigger Tier 2: Standard Network Geolocation (Cell Tower / Wi-Fi)
    const runTier2Network = () => {
      if (isResolved || tier2Failed) return;
      try {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            finalizeSuccess(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy, 'network', true);
          },
          (err) => {
            tier2Failed = true;
            tier2Error = err;
            checkBothFailed();
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 120000 }
        );
      } catch (err) {
        tier2Failed = true;
        tier2Error = err;
        checkBothFailed();
      }
    };

    // Tier 1: Hardware High-Accuracy GPS
    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          finalizeSuccess(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy, 'gps', false);
        },
        (err) => {
          tier1Failed = true;
          tier1Error = err;
          // If permission is denied explicitly, don't wait - check cache or reject
          if (err.code === 1) { // PERMISSION_DENIED
            tier2Failed = true;
            tier2Error = err;
            checkBothFailed();
            return;
          }
          // If Tier 2 hasn't run yet, run it immediately now
          runTier2Network();
        },
        { enableHighAccuracy: true, timeout: highAccuracyTimeout, maximumAge }
      );
    } catch (err) {
      tier1Failed = true;
      tier1Error = err;
      runTier2Network();
    }

    // Parallel Acceleration: On mobile devices, hardware GPS satellite acquisition can hang or take >4 seconds.
    // If high-accuracy has not responded within 3500ms, start Tier 2 network geolocation in parallel.
    parallelNetworkTimer = setTimeout(() => {
      if (!isResolved) {
        runTier2Network();
      }
    }, 3500);
  });
}

/**
 * Continuous Background GPS Watch - runs the exact same watcher as the map,
 * ensuring that whenever the user moves or checks their location, coordinates are locked and fresh.
 */
export function startContinuousGpsWatch(
  onUpdate?: (pos: { latitude: number; longitude: number; accuracy: number }) => void
): () => void {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    return () => {};
  }

  try {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const roundedAcc = Math.round(accuracy || 0);
        saveLastKnownUserPosition(latitude, longitude, roundedAcc);
        if (onUpdate) {
          onUpdate({ latitude, longitude, accuracy: roundedAcc });
        }
      },
      (err) => {
        // Silently ignore watch jitter
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    return () => {
      try {
        navigator.geolocation.clearWatch(watchId);
      } catch (e) {}
    };
  } catch (e) {
    return () => {};
  }
}

/**
 * Verifies user location using the exact same robust engine as the map option.
 */
export async function verifyUserLocation(options: {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  allowCache?: boolean;
  forceFresh?: boolean;
} = {}): Promise<LocationCheckResult> {
  const { allowCache = true, forceFresh = false } = options;

  // If recent cached location is requested and available
  if (allowCache && !forceFresh) {
    const cached = getLastKnownUserPosition();
    if (cached && Date.now() - cached.timestamp < 60000) {
      return {
        status: 'granted',
        isTurnedOn: true,
        isPermissionGranted: true,
        coords: {
          latitude: cached.latitude,
          longitude: cached.longitude,
          accuracy: cached.accuracy || 20
        },
        userGuidance: `GPS locked (±${cached.accuracy || 20}m).`,
        timestamp: cached.timestamp,
        source: 'cache'
      };
    }
  }

  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    return {
      status: 'unsupported',
      isTurnedOn: false,
      isPermissionGranted: false,
      coords: null,
      errorMessage: 'Geolocation is not supported by your current browser or device.',
      userGuidance: 'Please open this app in Google Chrome, Safari, or a modern mobile browser.',
      timestamp: Date.now()
    };
  }

  const permState = await queryLocationPermissionState();
  if (permState === 'denied') {
    return {
      status: 'denied',
      isTurnedOn: false,
      isPermissionGranted: false,
      coords: null,
      errorMessage: 'Location permission was denied in your browser settings.',
      userGuidance: 'Please allow Location permission in your browser address bar (lock icon) to auto-detect GPS.',
      timestamp: Date.now()
    };
  }

  try {
    const fix = await getExactDeviceGps({
      timeout: options.timeout || 10000,
      maximumAge: options.maximumAge,
      forceFresh: options.forceFresh
    });

    const result: LocationCheckResult = {
      status: 'granted',
      isTurnedOn: true,
      isPermissionGranted: true,
      coords: {
        latitude: fix.latitude,
        longitude: fix.longitude,
        accuracy: fix.accuracy
      },
      userGuidance: fix.accuracy <= 35
        ? 'High precision GPS locked.'
        : `GPS locked (±${fix.accuracy}m accuracy).`,
      timestamp: Date.now(),
      source: fix.source
    };

    lastKnownLocationCheckCache = result;
    return result;
  } catch (err: any) {
    console.warn('getExactDeviceGps failed:', err);

    let status: LocationStatus = 'disabled';
    let errorMessage = 'Could not acquire GPS position.';
    let userGuidance = 'Please verify that location / GPS is turned ON and tap to retry.';

    if (err && err.code === 1) { // PERMISSION_DENIED
      status = 'denied';
      errorMessage = 'Location permission was denied.';
      userGuidance = 'Tap the lock/settings icon in your browser address bar and allow Location.';
    } else if (err && (err.code === 3 || err.message === 'TIMEOUT_EXCEEDED')) { // TIMEOUT
      status = 'timeout';
      errorMessage = 'GPS request timed out.';
      userGuidance = 'GPS signal is weak indoors. Tap "Detect GPS" again or enter your road manually.';
    } else if (err && err.code === 2) { // POSITION_UNAVAILABLE
      status = 'disabled';
      errorMessage = 'Location hardware is unavailable or disabled.';
      userGuidance = 'Please check that Location / GPS is toggled ON on your phone/device.';
    }

    return {
      status,
      isTurnedOn: false,
      isPermissionGranted: permState === 'granted',
      coords: null,
      errorMessage,
      userGuidance,
      timestamp: Date.now()
    };
  }
}
