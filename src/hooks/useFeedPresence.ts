import { useState, useEffect, useRef, useCallback } from 'react';
import { FeedPresenceData, RegisteredUser } from '../types';

interface UseFeedPresenceOptions {
  currentTab?: string;
  viewMode?: string;
  feedFilter?: string;
  activeRegion?: string;
  currentUser?: RegisteredUser | null;
  heartbeatIntervalMs?: number; // default 10000ms (10s)
  isFeedActive?: boolean; // true if feed is currently mounted and active
}

function getOrCreateSessionId(): string {
  try {
    if (typeof window === 'undefined') return 'sess-ssr';
    let id = sessionStorage.getItem('livetraffic_feed_presence_session_id');
    if (!id) {
      id = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('livetraffic_feed_presence_session_id', id);
    }
    return id;
  } catch {
    return `sess-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

export function useFeedPresence({
  currentTab = 'feed',
  viewMode = 'bullets',
  feedFilter = 'all',
  activeRegion = 'all',
  currentUser = null,
  heartbeatIntervalMs = 240000, // Extended to 4 minutes to conserve proxy limits
  isFeedActive = true
}: UseFeedPresenceOptions = {}) {
  const [presenceData, setPresenceData] = useState<FeedPresenceData | null>(null);
  const [feedOpenCount, setFeedOpenCount] = useState<number>(1);
  const [totalActiveViewers, setTotalActiveViewers] = useState<number>(1);
  const [activeUsersOnline, setActiveUsersOnline] = useState<number>(1);
  const [totalVisitors, setTotalVisitors] = useState<number>(() => {
    try {
      if (typeof window === 'undefined') return 73000;
      const saved = localStorage.getItem('livetraffic_total_visitors_cache');
      return saved ? Math.max(73000, parseInt(saved, 10) || 73000) : 73000;
    } catch {
      return 73000;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const sessionIdRef = useRef<string>(getOrCreateSessionId());

  // Heartbeat sender
  const sendHeartbeat = useCallback(async () => {
    if (!isFeedActive) return;
    // Skip heartbeat if document is hidden to conserve edge proxy rate limits
    if (typeof document !== 'undefined' && document.hidden) return;
    try {
      const sessionId = sessionIdRef.current;
      const screenRes = typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : undefined;
      const tz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined;

      const payload = {
        sessionId,
        currentTab,
        feedViewMode: viewMode,
        feedFilter,
        activeRegion,
        screenResolution: screenRes,
        timezone: tz,
        userName: currentUser ? `${currentUser.fullName}${currentUser.surname ? ' ' + currentUser.surname : ''}`.trim() : undefined,
        userRole: currentUser?.role || undefined
      };

      const res = await fetch('/api/feed/presence/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (typeof data.feedOpenCount === 'number') {
          setFeedOpenCount(data.feedOpenCount);
        }
        if (typeof data.totalActiveViewers === 'number') {
          setTotalActiveViewers(data.totalActiveViewers);
          setActiveUsersOnline(data.totalActiveViewers);
        }
        if (typeof data.activeUsersOnline === 'number') {
          setActiveUsersOnline(data.activeUsersOnline);
        }
        if (typeof data.totalVisitors === 'number') {
          setTotalVisitors(data.totalVisitors);
          try {
            localStorage.setItem('livetraffic_total_visitors_cache', String(data.totalVisitors));
          } catch {}
        }

        // Check if anonymous connection is running on an outdated build
        if (typeof window !== 'undefined' && !currentUser && data.buildId) {
          try {
            const storedBuild = sessionStorage.getItem('client_app_build_id');
            const lastReloadTs = parseInt(sessionStorage.getItem('livetraffic_last_anon_reload_ts') || '0', 10);
            if (!storedBuild) {
              sessionStorage.setItem('client_app_build_id', data.buildId);
            } else if (storedBuild !== data.buildId && Date.now() - lastReloadTs > 30000) {
              console.log('[Presence] Anonymous connection detected outdated version. Enforcing reload...');
              sessionStorage.setItem('client_app_build_id', data.buildId);
              sessionStorage.setItem('livetraffic_last_anon_reload_ts', String(Date.now()));
              setTimeout(() => {
                window.location.reload();
              }, 1200);
            }
          } catch {}
        }
      }
    } catch {
      // Non-critical network error
    }
  }, [isFeedActive, currentTab, viewMode, feedFilter, activeRegion, currentUser]);

  // Fetch full detailed presence list (for inspector modal / admin views)
  const fetchPresenceDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/feed/presence');
      if (res.ok) {
        const data: FeedPresenceData = await res.json();
        setPresenceData(data);
        if (typeof data.feedOpenCount === 'number') {
          setFeedOpenCount(data.feedOpenCount);
        }
        if (typeof data.totalActiveViewers === 'number') {
          setTotalActiveViewers(data.totalActiveViewers);
          setActiveUsersOnline(data.totalActiveViewers);
        }
        if (typeof data.activeUsersOnline === 'number') {
          setActiveUsersOnline(data.activeUsersOnline);
        }
        if (typeof data.totalVisitors === 'number') {
          setTotalVisitors(data.totalVisitors);
          try {
            localStorage.setItem('livetraffic_total_visitors_cache', String(data.totalVisitors));
          } catch {}
        }
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.warn('Failed to fetch full presence data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set up periodic heartbeat and cleanup on unmount / window unload
  useEffect(() => {
    if (!isFeedActive) return;

    // Send immediate initial ping
    sendHeartbeat();

    const interval = setInterval(sendHeartbeat, heartbeatIntervalMs);

    const handleBeforeUnload = () => {
      try {
        const sessionId = sessionIdRef.current;
        const payload = JSON.stringify({ sessionId });
        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: 'application/json' });
          navigator.sendBeacon('/api/feed/presence/leave', blob);
        } else {
          fetch('/api/feed/presence/leave', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true
          }).catch(() => {});
        }
      } catch {}
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      // Send leave on unmount
      try {
        const sessionId = sessionIdRef.current;
        fetch('/api/feed/presence/leave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
          keepalive: true
        }).catch(() => {});
      } catch {}
    };
  }, [isFeedActive, sendHeartbeat, heartbeatIntervalMs]);

  return {
    sessionId: sessionIdRef.current,
    feedOpenCount: Math.max(1, feedOpenCount),
    totalActiveViewers: Math.max(1, totalActiveViewers),
    activeUsersOnline: Math.max(1, activeUsersOnline || totalActiveViewers),
    totalVisitors: Math.max(1, totalVisitors),
    presenceData,
    isLoading,
    lastUpdated,
    refreshPresence: fetchPresenceDetails,
    sendHeartbeat
  };
}

