/**
 * Consolidated API Client with Request Deduplication, SWR In-Memory Caching,
 * Automatic 429 Rate-Limit Backoff, and Visibility Throttling.
 */

interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<any>>();
let rateLimitCooldownUntil = 0;

// Rate limit listeners to update UI if needed
const rateLimitListeners = new Set<(isRateLimited: boolean) => void>();

export function isCurrentlyRateLimited(): boolean {
  return Date.now() < rateLimitCooldownUntil;
}

export function subscribeToRateLimitState(cb: (isRateLimited: boolean) => void) {
  rateLimitListeners.add(cb);
  return () => rateLimitListeners.delete(cb);
}

function notifyRateLimit(limited: boolean) {
  rateLimitListeners.forEach(cb => {
    try { cb(limited); } catch {}
  });
}

export interface ApiFetchOptions extends RequestInit {
  cacheTtlMs?: number;       // Default 15,000ms (15s) for GET requests
  forceFresh?: boolean;       // Bypass read cache
  background?: boolean;       // True if this is a background polling interval
}

/**
 * Invalidate in-memory cache for matching endpoints
 */
export function invalidateApiCache(prefix?: string) {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix) || key.includes(prefix)) {
      cache.delete(key);
    }
  }
}

/**
 * Explicitly clear all post, report, feed, and SOS caches
 */
export function clearAllPostCaches() {
  invalidateApiCache('/api/reports');
  invalidateApiCache('/api/feed');
  invalidateApiCache('/api/sos');
  invalidateApiCache('/api/bootstrap');
  invalidateApiCache('/api/admin/posts');
}

/**
 * Robust fetch wrapper with deduplication and caching
 */
export async function apiFetch<T = any>(
  url: string,
  options: ApiFetchOptions = {}
): Promise<T | null> {
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';
  const isRealtimeEndpoint = url.includes('/bootstrap') || url.includes('/feed') || url.includes('/reports') || url.includes('/sos');
  const defaultTtl = isRealtimeEndpoint ? 5000 : 30000;
  const cacheTtlMs = options.cacheTtlMs ?? (isGet ? defaultTtl : 0);

  // 1. Visibility Check: If this is a background poll and the page is hidden, skip entirely
  if (options.background && typeof document !== 'undefined' && document.hidden) {
    return null;
  }

  // 2. Cooldown check: If we've hit 429, prevent spamming the edge proxy.
  // Local system endpoints like /api/version and explicit forceFresh requests bypass cooldown
  const isLocalSystemCheck = url.includes('/api/version');
  if (Date.now() < rateLimitCooldownUntil && !isLocalSystemCheck && !options.forceFresh) {
    // For GETs, return stale cached data if we have it
    if (isGet && cache.has(url)) {
      return cache.get(url)!.data as T;
    }
    return null;
  }

  // 3. For GET requests: Check in-memory TTL cache
  if (isGet && !options.forceFresh && cacheTtlMs > 0) {
    const cached = cache.get(url);
    if (cached && (Date.now() - cached.timestamp) < cacheTtlMs) {
      return cached.data as T;
    }
  }

  // 4. In-Flight Request Deduplication (prevents 2 components firing same GET simultaneously)
  if (isGet && inFlightRequests.has(url) && !options.forceFresh) {
    return inFlightRequests.get(url) as Promise<T | null>;
  }

  // 5. Dispatch Fetch
  const fetchPromise = (async (): Promise<T | null> => {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json',
          ...(options.headers || {})
        }
      });

      // Handle 429 Too Many Requests (Rate exceeded) from Edge Proxy
      if (res.status === 429) {
        console.warn(`[ApiClient] 429 Rate exceeded on ${url}. Entering 60-second backoff.`);
        rateLimitCooldownUntil = Date.now() + 60000;
        notifyRateLimit(true);
        setTimeout(() => notifyRateLimit(false), 60000);

        // If we have stale cache, gracefully fall back to it
        if (isGet && cache.has(url)) {
          return cache.get(url)!.data as T;
        }
        return null;
      }

      if (!res.ok) {
        return null;
      }

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return null;
      }

      const data = await res.json();

      // Store in read cache
      if (isGet && cacheTtlMs > 0) {
        cache.set(url, {
          data,
          timestamp: Date.now()
        });
      }

      // If mutation (POST/PUT/DELETE), invalidate relevant cache entries
      if (!isGet) {
        if (url.includes('/api/reports')) invalidateApiCache('/api/reports');
        if (url.includes('/api/feed')) invalidateApiCache('/api/feed');
        if (url.includes('/api/sos')) invalidateApiCache('/api/sos');
        if (url.includes('/api/donations')) invalidateApiCache('/api/donations');
        if (url.includes('/api/ads')) invalidateApiCache('/api/ads');
        invalidateApiCache('/api/bootstrap');
      }

      return data as T;
    } catch (err) {
      // Return cached fallback if available
      if (isGet && cache.has(url)) {
        return cache.get(url)!.data as T;
      }
      return null;
    } finally {
      inFlightRequests.delete(url);
    }
  })();

  if (isGet) {
    inFlightRequests.set(url, fetchPromise);
  }

  return fetchPromise;
}
