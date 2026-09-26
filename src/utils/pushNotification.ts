// Web Push & FCM Client Utility for Emergency SOS Dispatch Alerts

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isIosDevice(): boolean {
  return typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent || '');
}

export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
}

export function isPushNotificationSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export async function getVapidPublicKey(): Promise<string | null> {
  try {
    const res = await fetch('/api/push/vapid-public-key').catch(() => fetch('/api/admin/push/vapid-public-key'));
    if (!res.ok) throw new Error('Failed to fetch VAPID key');
    const data = await res.json();
    return data.publicKey || null;
  } catch (err) {
    console.error('Error fetching VAPID public key:', err);
    return null;
  }
}

export function checkNotificationPermission(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (typeof window === 'undefined' || typeof Notification === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    return Notification.permission;
  } catch (_) {
    return 'unsupported';
  }
}

export async function getExistingPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (err) {
    console.warn('Error checking existing push subscription:', err);
    return null;
  }
}

export async function subscribeUserToPushNotifications(options?: {
  userEmail?: string;
  role?: string;
  deviceName?: string;
}): Promise<{ success: boolean; subscription?: any; error?: string }> {
  const isIos = isIosDevice();
  const isPwa = isStandalonePwa();

  if (!isPushNotificationSupported()) {
    if (isIos && !isPwa) {
      return {
        success: false,
        error: 'On iPhone, Apple requires adding the app to your Home Screen first to enable push notifications.'
      };
    }
    return {
      success: false,
      error: 'Push notifications are not supported by this browser or device.'
    };
  }

  try {
    // 1. Request Browser Notification Permission
    let permission: NotificationPermission = Notification.permission;
    if (permission !== 'granted') {
      try {
        permission = await Notification.requestPermission();
      } catch (permErr: any) {
        console.warn('Direct requestPermission error:', permErr);
      }
    }

    if (permission !== 'granted') {
      if (isIos) {
        return {
          success: false,
          error: isPwa 
            ? 'Notification permission is blocked in iOS Settings. Open iPhone Settings ➔ Notifications ➔ LiveTraffic ➔ Allow Notifications.'
            : 'On iPhone, Apple requires installing the app to your Home Screen first: Tap Safari Share (⬆️) ➔ "Add to Home Screen".'
        };
      }
      return {
        success: false,
        error: 'Notification permission was denied. Please allow notifications in your browser settings to receive emergency SOS alerts.'
      };
    }

    // 2. Fetch server VAPID key
    const vapidKey = await getVapidPublicKey();
    if (!vapidKey) {
      return {
        success: false,
        error: 'Could not obtain VAPID public key from server.'
      };
    }

    // 3. Register or get Service Worker
    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      registration = await navigator.serviceWorker.register('/sw.js');
    }
    await navigator.serviceWorker.ready;

    // 4. Subscribe to Push Manager
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const convertedVapidKey = urlBase64ToUint8Array(vapidKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
    }

    // Determine readable device name
    const ua = navigator.userAgent;
    let deviceDesc = 'Community Responder Device';
    if (/android/i.test(ua)) deviceDesc = 'Android Mobile Device';
    else if (/iphone|ipad|ipod/i.test(ua)) deviceDesc = 'iOS / Apple Device';
    else if (/macintosh|mac os x/i.test(ua)) deviceDesc = 'Mac OS Desktop';
    else if (/windows/i.test(ua)) deviceDesc = 'Windows PC';
    else if (/linux/i.test(ua)) deviceDesc = 'Linux Device';

    const subJson = subscription.toJSON();

    // 5. Send subscription to server
    let response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscription: subJson,
        deviceName: options?.deviceName || deviceDesc,
        userEmail: options?.userEmail || 'user@livetrafficnpc.co.za',
        role: options?.role || 'community_responder'
      })
    }).catch(() => null);

    if (!response || !response.ok) {
      // Fallback to admin route if push route failed
      response = await fetch('/api/admin/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': options?.role || 'community',
          'x-user-email': options?.userEmail || 'user@livetrafficnpc.co.za'
        },
        body: JSON.stringify({
          subscription: subJson,
          deviceName: options?.deviceName || deviceDesc,
          userEmail: options?.userEmail,
          role: options?.role || 'community'
        })
      });
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to register subscription on server');
    }

    const data = await response.json();
    return { success: true, subscription: data.subscription };
  } catch (err: any) {
    console.error('Error subscribing to push notifications:', err);
    return {
      success: false,
      error: err.message || 'An unexpected error occurred while enabling push notifications.'
    };
  }
}

// Backward-compatible alias for admin code
export const registerAdminPushSubscription = subscribeUserToPushNotifications;

/**
 * Display a high-visibility local browser notification when an active SOS alert or test is triggered
 */
export async function showLocalEmergencyNotification(payload: {
  id?: string;
  name?: string;
  locationName?: string;
  location?: string;
  emergencyType?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  vehicleInfo?: string;
  title?: string;
  body?: string;
}) {
  if (typeof window === 'undefined' || typeof Notification === 'undefined' || !('Notification' in window)) {
    return;
  }

  try {
    if (Notification.permission !== 'granted') {
      return;
    }
  } catch (_) {
    return;
  }

  const typeLabel =
    payload.emergencyType === 'gbv_assist'
      ? '💜 GBV Emergency Priority'
      : payload.emergencyType === 'medical'
      ? '🚑 Medical Emergency'
      : payload.emergencyType === 'spiking_puncture'
      ? '⚠️ Spike Trap / Puncture SOS'
      : payload.emergencyType === 'crime_threat'
      ? '🚨 Crime / Hostile Threat'
      : payload.emergencyType === 'crash' || payload.emergencyType === 'accident'
      ? '💥 Major Collision SOS'
      : payload.emergencyType === 'traffic_hazard'
      ? '⚠️ Live Traffic Hazard'
      : '🆘 Emergency Assistance';

  const title = payload.title || `🚨 EMERGENCY SOS: ${typeLabel}`;
  const locationText = payload.locationName || payload.location || 'South Africa';
  const body =
    payload.body ||
    `${payload.name || 'Motorist'} urgently needs help at ${locationText}. Vehicle: ${
      payload.vehicleInfo || 'Details on map'
    }. Tap to open map & dispatch.`;

  const tagId = payload.id || `alert-${Date.now()}`;
  const options: NotificationOptions = {
    body,
    icon: '/traffic-logo.png',
    badge: '/traffic-logo.png',
    tag: `sos-${tagId}`,
    requireInteraction: true,
    data: {
      url: `/?view=map&sosId=${payload.id || ''}&lat=${payload.latitude || -26.2041}&lng=${payload.longitude || 28.0473}`,
      sosId: payload.id,
      phone: payload.phone
    }
  };

  try {
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && typeof reg.showNotification === 'function') {
          await reg.showNotification(title, options);
          return;
        }
      } catch (_) {}
    }

    // Direct Notification constructor check (strictly avoid calling on mobile/Android where constructor is illegal)
    const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');
    if (!isMobile && typeof window !== 'undefined' && typeof window.Notification === 'function') {
      try {
        const notif = new Notification(title, options);
        notif.onclick = () => {
          window.focus();
          if (payload.id && payload.latitude && payload.longitude) {
            window.location.href = `/?view=map&sosId=${payload.id}&lat=${payload.latitude}&lng=${payload.longitude}`;
          }
          try { notif.close(); } catch (_) {}
        };
      } catch (_) {
        // Direct Notification constructor not permitted in current execution context
      }
    }
  } catch (err) {
    console.warn('Local notification dispatch note:', err);
  }
}

export async function testPushAlert(subscriptionId?: string, auth?: { role?: string; email?: string }) {
  const res = await fetch('/api/admin/push/test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': auth?.role || 'admin',
      'x-user-email': auth?.email || 'admin@livetrafficnpc.co.za'
    },
    body: JSON.stringify({ subscriptionId })
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to trigger test push alert');
  }

  return await res.json();
}
