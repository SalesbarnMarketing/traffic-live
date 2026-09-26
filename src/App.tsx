import React, { useState, useEffect, useMemo, useRef } from 'react';
import { IncidentReport, EmergencySOS, FeedItem, Donation, DonationStats, ReportStatus, ReportType, RegisteredUser, TripBuddyPlan } from './types';
import { INITIAL_FEED_ITEMS } from './data/initialData';
import { scrapeLiveITrafficInBrowser } from './utils/browserITrafficScraper';
import { apiFetch, isCurrentlyRateLimited, clearAllPostCaches } from './utils/apiClient';
import { InteractiveMap } from './components/InteractiveMap';
import { MainDashboard } from './components/MainDashboard';
import { ReportModal } from './components/ReportModal';
import { EmergencySOSModal } from './components/EmergencySOSModal';
import { LiveFeedSection } from './components/LiveFeedSection';
import { HighwayTravelTimesSection } from './components/HighwayTravelTimesSection';
import { TrafficCamsSection } from './components/TrafficCamsSection';
import { AdminPortal } from './components/AdminPortal';
import { DonationsSection } from './components/DonationsSection';
import { PricingSection } from './components/PricingSection';
import { ReportDetailModal } from './components/ReportDetailModal';
import { AuthModal } from './components/AuthModal';
import { WelcomeScreen } from './components/WelcomeScreen';
import { MarketingPage } from './components/MarketingPage';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { DriverBulletinMode } from './components/DriverBulletinMode';
import { ShareToXModal } from './components/ShareToXModal';
import { ShareToWhatsAppModal } from './components/ShareToWhatsAppModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { FeedbackModal } from './components/FeedbackModal';
import { UserProfileModal } from './components/UserProfileModal';
import { OnboardingTourModal } from './components/OnboardingTourModal';
import { LocationCheckModal } from './components/LocationCheckModal';
import { DrivingCourseSection } from './components/DrivingCourseSection';
import { AdvertiserPortal } from './components/AdvertiserPortal';
import { InstallAppModal } from './components/InstallAppModal';
import { WallOfHeroesModal } from './components/WallOfHeroesModal';
import { CommunityHeroesModal } from './components/CommunityHeroesModal';
import { TripBuddyModal } from './components/TripBuddyModal';
import { LOCAL_STORAGE_ACTIVE_TRIP_KEY } from './utils/tripBuddyUtils';
import { awardReputationPoints } from './utils/communityHeroesUtils';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import { VoiceAssistantHUD } from './components/VoiceAssistantHUD';
import { VoiceCommandsModal } from './components/VoiceCommandsModal';
import { GettingStartedModal } from './components/GettingStartedModal';
import { ReleaseNotesModal } from './components/ReleaseNotesModal';
import { VersionNotification } from './components/VersionNotification';
import { AppFooter } from './components/AppFooter';
import { APP_VERSION } from './version';
import { isPermittedAdminRole, getAdminSession, getAdminRequestHeaders } from './utils/authUtils';
import { fetchCategoryDefaultImages, setCachedCategoryDefaultImages, isActualAttachedImage } from './utils/categoryImageHelper';
import { startContinuousGpsWatch, getExactDeviceGps, getLastKnownUserPosition } from './utils/locationChecker';
import { EmergencySOSAlertBanner } from './components/EmergencySOSAlertBanner';
import { playEmergencySOSAlertSound, playTrafficAlertSound } from './utils/voiceAudioFeedback';
import { showLocalEmergencyNotification, subscribeUserToPushNotifications } from './utils/pushNotification';
import { PushNotificationSettingsModal } from './components/PushNotificationSettingsModal';
import { getAllPostRelatedIds, isPostDeleted, registerDeletedPostId, isGloballyDeleted } from './utils/idUtils';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'feed' | 'trafficcams' | 'traveltimes' | 'report' | 'admin' | 'donations' | 'pricing' | 'course' | 'advertiser'>('feed');
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isDriverModeOpen, setIsDriverModeOpen] = useState<boolean>(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState<boolean>(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isLocationCheckOpen, setIsLocationCheckOpen] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState<boolean>(true);
  const [activeIncomingSos, setActiveIncomingSos] = useState<EmergencySOS | null>(null);
  const knownSosIdsRef = React.useRef<Set<string>>(new Set());
  const isInitialSosFetchRef = React.useRef<boolean>(true);
  const [isWallOfHeroesOpen, setIsWallOfHeroesOpen] = useState<boolean>(false);
  const [isCommunityHeroesOpen, setIsCommunityHeroesOpen] = useState<boolean>(false);
  const [isGettingStartedOpen, setIsGettingStartedOpen] = useState<boolean>(false);
  const [isReleaseNotesOpen, setIsReleaseNotesOpen] = useState<boolean>(false);
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState<boolean>(false);
  const [isTripBuddyOpen, setIsTripBuddyOpen] = useState<boolean>(false);
  const [initialTrackingToken, setInitialTrackingToken] = useState<string | null>(null);
  const [activeTrip, setActiveTrip] = useState<TripBuddyPlan | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_ACTIVE_TRIP_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Check URL query parameters for direct family tracking links or camera deep-links
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const trackToken = urlParams.get('track') || urlParams.get('trip');
      if (trackToken) {
        setInitialTrackingToken(trackToken);
        setIsTripBuddyOpen(true);
      }

      const tabParam = urlParams.get('tab');
      if (tabParam === 'trafficcams' || tabParam === 'cams' || tabParam === 'cameras') {
        setActiveTab('trafficcams');
        const camParam = urlParams.get('cam');
        if (camParam) {
          setSelectedCameraId(camParam);
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Sync active trip state to localStorage
  const handleTripUpdated = (trip: TripBuddyPlan | null) => {
    setActiveTrip(trip);
    try {
      if (trip && trip.status === 'active') {
        localStorage.setItem(LOCAL_STORAGE_ACTIVE_TRIP_KEY, JSON.stringify(trip));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_ACTIVE_TRIP_KEY);
      }
    } catch (e) {
      // ignore
    }
  };

  // User Auth State
  const [currentUser, setCurrentUser] = useState<RegisteredUser | null>(() => {
    const saved = localStorage.getItem('live_traffic_npc_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [authIntent, setAuthIntent] = useState<string>('access Live Traffic Control');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [sosRequests, setSosRequests] = useState<EmergencySOS[]>([]);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [donationStats, setDonationStats] = useState<DonationStats>({
    totalRaised: 1850,
    goalAmount: 3000,
    coffeeCount: 142,
    fuelLiters: 420,
    equipmentItemsFunded: 18,
    backersCount: 64
  });
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Modal States
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [prefilledReportType, setPrefilledReportType] = useState<ReportType | undefined>(undefined);
  const [prefilledReportTitle, setPrefilledReportTitle] = useState<string | undefined>(undefined);

  const [isSOSModalOpen, setIsSOSModalOpen] = useState(false);
  const [prefilledSOSType, setPrefilledSOSType] = useState<EmergencySOS['emergencyType'] | undefined>(undefined);
  const [prefilledSOSNotes, setPrefilledSOSNotes] = useState<string | undefined>(undefined);

  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);
  const [pinnedCoords, setPinnedCoords] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [reportModalPrefilledOnScene, setReportModalPrefilledOnScene] = useState<boolean>(true);
  const [reportModalAutoDetectGps, setReportModalAutoDetectGps] = useState<boolean>(true);
  const [showLiveTrafficNpc, setShowLiveTrafficNpc] = useState<boolean>(true);
  const [focusedAlertQuery, setFocusedAlertQuery] = useState<string | null>(null);

  // Build rotating alerts list from live feed items, i-Traffic events, and approved hazard reports
  const rotatingAlerts = useMemo(() => {
    const alerts: string[] = [];

    // 0. Priority broadcastTopRed admin posts on top red alert ticker
    feedItems.filter(f => Boolean(f.broadcastTopRed)).forEach(item => {
      const loc = item.roadwayName || item.location ? `${item.roadwayName || item.location}: ` : '';
      const text = `🔴 BROADCAST: ${loc}${item.content.replace(/\s+/g, ' ')}`;
      if (!alerts.includes(text)) alerts.push(text);
    });

    // 1. Explicitly pinned live watch dispatches / priority alerts
    feedItems.filter(f => f.showOnLiveWatch === true && !f.broadcastTopRed).forEach(item => {
      const loc = item.roadwayName || item.location ? `${item.roadwayName || item.location}: ` : '';
      const text = `${loc}${item.content.replace(/\s+/g, ' ')}`;
      if (!alerts.includes(text)) alerts.push(text);
    });

    // 2. Urgent approved and active reports (e.g. spiking, active crashes)
    reports.filter(r => (r.status === 'approved' || r.status === 'pending') && (r.type === 'spiking' || r.type === 'accident' || r.type === 'hazard')).slice(0, 5).forEach(rep => {
      const text = `🚨 ${rep.title} (${rep.roadName})`;
      if (!alerts.includes(text)) alerts.push(text);
    });

    // 3. Live i-Traffic Gauteng and Dispatch items
    feedItems.slice(0, 15).forEach(item => {
      const loc = item.roadwayName || item.location ? `${item.roadwayName || item.location}: ` : '';
      const text = `${loc}${item.content.replace(/\s+/g, ' ')}`;
      if (!alerts.includes(text)) alerts.push(text);
    });

    return alerts.length > 0 ? alerts : [
      "N1 North: Spiking hazard reported past Pumulani Toll. Drive with extreme caution.",
      "R21 Corridor: Marked Patrol Units active. Report road hazards via LiveTrafficNPC.",
      "N3 Gilloolys: Heavy congestion. Maintain safe following distance."
    ];
  }, [feedItems, reports]);

  // Share to X.com (Twitter) State
  const [isShareToXOpen, setIsShareToXOpen] = useState(false);
  const [shareToXConfig, setShareToXConfig] = useState<{
    initialText?: string;
    initialHashtags?: string[];
    report?: IncidentReport | null;
    feedItem?: FeedItem | null;
    latestAlert?: string;
  }>({});

  const handleOpenShareToX = (options?: {
    text?: string;
    hashtags?: string[];
    report?: IncidentReport | null;
    feedItem?: FeedItem | null;
    latestAlert?: string;
  }) => {
    setShareToXConfig({
      initialText: options?.text,
      initialHashtags: options?.hashtags,
      report: options?.report,
      feedItem: options?.feedItem,
      latestAlert: options?.latestAlert || rotatingAlerts[0]
    });
    setIsShareToXOpen(true);
  };

  // Share to WhatsApp State
  const [isShareToWhatsAppOpen, setIsShareToWhatsAppOpen] = useState(false);
  const [shareToWhatsAppConfig, setShareToWhatsAppConfig] = useState<{
    feedItem?: FeedItem | null;
    report?: IncidentReport | null;
    customText?: string;
  }>({});

  const handleOpenShareToWhatsApp = (options?: {
    feedItem?: FeedItem | null;
    report?: IncidentReport | null;
    customText?: string;
  }) => {
    setShareToWhatsAppConfig({
      feedItem: options?.feedItem,
      report: options?.report,
      customText: options?.customText
    });
    setIsShareToWhatsAppOpen(true);
  };

  // Require Auth guard
  const requireAuth = (intent: string, action: () => void) => {
    if (currentUser) {
      action();
    } else {
      setAuthIntent(intent);
      setAuthInitialMode('login');
      setPendingAction(() => action);
      setIsAuthModalOpen(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('live_traffic_npc_user');
    localStorage.removeItem('live_traffic_npc_users_vault');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('adminToken');
      sessionStorage.removeItem('adminUser');
      sessionStorage.removeItem('live_traffic_npc_user');
    }
    setCurrentUser(null);
  };

  // Rate limit cooldown tracker to prevent hammering if edge proxy returns 429
  const rateLimitCooldownRef = useRef<number>(0);

  // Helper for safe JSON fetching with rate-limit protection, deduplication, and caching
  const safeFetchJson = async (url: string, options?: RequestInit & { forceFresh?: boolean }) => {
    return await apiFetch(url, {
      ...options,
      cacheTtlMs: options?.forceFresh ? 0 : 20000,
      forceFresh: options?.forceFresh
    });
  };

  // Fetch Reports (Public or Admin)
  const fetchReports = async (options?: { forceFresh?: boolean }) => {
    const data = await safeFetchJson(`/api/reports?all=true`, { forceFresh: options?.forceFresh });
    if (data && Array.isArray(data.reports)) {
      const validReports = data.reports.filter((r: any) => r && r.id && !isGloballyDeleted(r.id));
      setReports(validReports);
      setPendingCount(data.totalPending || 0);
    }
  };

  // Fetch SOS Requests
  const fetchSOS = async () => {
    const data = await safeFetchJson('/api/sos');
    if (data && Array.isArray(data.sosRequests)) {
      const activeList: EmergencySOS[] = data.sosRequests.filter((s: any) => s && s.id && !isGloballyDeleted(s.id));
      setSosRequests(activeList);

      if (isInitialSosFetchRef.current) {
        activeList.forEach((s) => knownSosIdsRef.current.add(s.id));
        isInitialSosFetchRef.current = false;
      } else {
        // Detect brand-new active emergency SOS calls posted by motorists
        const brandNewSOS = activeList.find(
          (s) => s.status === 'active' && !knownSosIdsRef.current.has(s.id)
        );

        if (brandNewSOS) {
          activeList.forEach((s) => knownSosIdsRef.current.add(s.id));
          // 1. Play immediate urgent alert sound
          playEmergencySOSAlertSound();
          // 2. Display high-visibility top alert banner
          setActiveIncomingSos(brandNewSOS);
          // 3. Dispatch native browser/PWA push notification
          showLocalEmergencyNotification(brandNewSOS).catch(() => {});
        } else {
          activeList.forEach((s) => knownSosIdsRef.current.add(s.id));
        }
      }
    }
  };

  // Fetch Feed with browser-side fallback when /api/feed 404s on static hosting
  const fetchFeed = async (options?: { forceFresh?: boolean }) => {
    try {
      const data = await safeFetchJson('/api/feed', { forceFresh: options?.forceFresh });
      if (data && Array.isArray(data.feed)) {
        const seenIds = new Set<string>();
        const uniqueFeed = data.feed.filter((item: any) => {
          if (!item || !item.id) return false;
          if (isGloballyDeleted(item.id)) return false;
          if (seenIds.has(item.id)) return false;
          seenIds.add(item.id);
          return true;
        });
        setFeedItems(uniqueFeed);
        return;
      }
    } catch {
      // Backend not available or 404
    }

    // Direct Browser Scraping (runs only if backend is completely unavailable)
    try {
      const browserScraped = await scrapeLiveITrafficInBrowser();
      if (browserScraped.length > 0) {
        setFeedItems(prev => {
          // Keep existing local dispatches if any, merge scraped, strictly deduplicate
          const seenIds = new Set<string>();
          const nonITraffic = prev.filter(p => p.source !== 'itraffic' && !isGloballyDeleted(p.id));
          const combined = [...nonITraffic, ...browserScraped.filter((b: any) => !isGloballyDeleted(b.id))];
          return combined.filter((item: any) => {
            if (!item || !item.id) return false;
            if (isGloballyDeleted(item.id)) return false;
            if (seenIds.has(item.id)) return false;
            seenIds.add(item.id);
            return true;
          });
        });
      }
    } catch (err) {
      console.warn("Direct browser scraper attempt completed:", err);
    }
  };

  // Fetch Donations
  const fetchDonations = async () => {
    const data = await safeFetchJson('/api/donations');
    if (data) {
      if (Array.isArray(data.donations)) {
        setDonations(data.donations);
      }
      if (data.stats) setDonationStats(data.stats);
    }
  };

  // Consolidated Bootstrap Loader (Fetches reports, sos, donations, category images, and feed in 1 request)
  const fetchBootstrap = async (options?: { forceFresh?: boolean }) => {
    const data = await safeFetchJson('/api/bootstrap', { forceFresh: options?.forceFresh });
    if (data && data.success) {
      if (Array.isArray(data.reports)) {
        const validReports = data.reports.filter((r: any) => r && r.id && !isGloballyDeleted(r.id));
        setReports(validReports);
        setPendingCount(data.totalPending || 0);
      }
      if (Array.isArray(data.sosRequests)) {
        const validSos = data.sosRequests.filter((s: any) => s && s.id && !isGloballyDeleted(s.id));
        setSosRequests(validSos);
        validSos.forEach((s: any) => knownSosIdsRef.current.add(s.id));
        isInitialSosFetchRef.current = false;
      }
      if (Array.isArray(data.donations)) {
        setDonations(data.donations);
      }
      if (data.donationStats) {
        setDonationStats(data.donationStats);
      }
      if (data.categoryImages && typeof data.categoryImages === 'object') {
        setCachedCategoryDefaultImages(data.categoryImages, data.deletedCategoryIds || []);
      }
      if (Array.isArray(data.feedItems) && data.feedItems.length > 0) {
        const validFeed = data.feedItems.filter((f: any) => f && f.id && !isGloballyDeleted(f.id));
        setFeedItems(validFeed);
      }
    } else {
      // Graceful fallback to individual endpoints only if bootstrap failed
      fetchReports({ forceFresh: options?.forceFresh });
      fetchSOS();
      fetchDonations();
      fetchCategoryDefaultImages();
      fetchFeed({ forceFresh: options?.forceFresh });
    }
  };

  useEffect(() => {
    fetchBootstrap();

    // Refresh user profile and privileges with backend database ONLY if currently logged in
    if (currentUser?.email) {
      fetch('/api/auth/sync-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: currentUser })
      })
      .then(res => res.json())
      .then(data => {
        if (data?.user && currentUser && currentUser.email.toLowerCase() === data.user.email.toLowerCase()) {
          setCurrentUser(data.user);
          localStorage.setItem('live_traffic_npc_user', JSON.stringify(data.user));
        }
      })
      .catch(() => {});
    }

    // Check for direct SOS notification click / payment redirect / map in URL
    const searchParams = new URLSearchParams(window.location.search);
    const categoryParam = searchParams.get('category');
    const tabParam = searchParams.get('tab');
    const sosIdParam = searchParams.get('sosId');
    if (sosIdParam || tabParam === 'map') {
      setActiveTab('map');
    } else if (tabParam === 'pricing' || categoryParam === 'advertising' || categoryParam === 'advertising_package') {
      setActiveTab('pricing');
    }

    // Auto-refresh feeds and bootstrap every 45 seconds ONLY when tab is visible
    let lastRefreshTime = Date.now();
    const interval = setInterval(() => {
      // Never poll in background tabs to conserve edge-proxy rate limits
      if (typeof document !== 'undefined' && document.hidden) return;
      if (Date.now() < rateLimitCooldownRef.current) return;
      fetchBootstrap();
      lastRefreshTime = Date.now();
    }, 45000);

    // Refresh immediately once when user focuses back on the tab (if more than 30s has elapsed)
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        if (Date.now() - lastRefreshTime > 30000 && Date.now() >= rateLimitCooldownRef.current) {
          fetchBootstrap();
          lastRefreshTime = Date.now();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Warm up and continuously watch high-accuracy device GPS so coordinates are immediately
    // identical and accurate across InteractiveMap, ReportModal, and EmergencySOSModal
    const stopGpsWatch = startContinuousGpsWatch();
    getExactDeviceGps({ timeout: 10000 }).catch(() => {});

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopGpsWatch();
    };
  }, []);

  // Removed requireAuth blocking for public users so the app is completely open to everyone.
  // Only the Admin Portal tab is protected with password authentication.
  const handleSelectLocationForReport = (lat: number, lng: number) => {
    setPinnedCoords({ lat, lng });
    setPrefilledReportType(undefined);
    setPrefilledReportTitle(undefined);
    setIsReportModalOpen(true);
  };

  const handleOpenReportModalWithOptions = (options?: {
    type?: string;
    title?: string;
    forceFullModal?: boolean;
    coords?: { lat: number; lng: number };
    onScene?: boolean;
    autoDetectGps?: boolean;
  }) => {
    if (activeTab === 'map' && !options?.forceFullModal) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('livetraffic:open-drop-pin', {
          detail: { ...options, openQuickReport: true }
        }));
      }
      return;
    }

    let resolvedCoords = options?.coords;
    if (!resolvedCoords) {
      const cached = getLastKnownUserPosition();
      if (cached && typeof cached.latitude === 'number' && typeof cached.longitude === 'number') {
        resolvedCoords = {
          lat: Number(cached.latitude.toFixed(6)),
          lng: Number(cached.longitude.toFixed(6))
        };
      }
    }

    setPinnedCoords(resolvedCoords);
    setPrefilledReportType((options?.type as ReportType) || undefined);
    setPrefilledReportTitle(options?.title || undefined);
    setReportModalPrefilledOnScene(options?.onScene ?? true);
    setReportModalAutoDetectGps(options?.autoDetectGps ?? true);
    setIsReportModalOpen(true);
  };

  const handleOpenSOSModalWithOptions = (options?: { emergencyType?: string; notes?: string }) => {
    setPrefilledSOSType((options?.emergencyType as EmergencySOS['emergencyType']) || undefined);
    setPrefilledSOSNotes(options?.notes || undefined);
    setIsSOSModalOpen(true);
  };

  const isUserAdmin = Boolean(
    getAdminSession(currentUser) ||
    (currentUser && isPermittedAdminRole(currentUser.role))
  );

  useEffect(() => {
    const handleOpenReleaseNotesEvent = () => {
      if (isUserAdmin) {
        setIsReleaseNotesOpen(true);
      }
    };
    window.addEventListener('open-release-notes', handleOpenReleaseNotesEvent);
    return () => window.removeEventListener('open-release-notes', handleOpenReleaseNotesEvent);
  }, [isUserAdmin]);

  const handleSubmitReport = async (reportData: any) => {
    try {
      const adminSession = getAdminSession(currentUser);
      const isPostAdmin = Boolean(
        adminSession ||
        (currentUser && isPermittedAdminRole(currentUser.role))
      );

      const headers = getAdminRequestHeaders(currentUser);
      const userFirstName = (currentUser?.fullName || '').trim();
      const userSurname = (currentUser?.surname || '').trim();
      const userFullName = currentUser
        ? (userSurname && !userFirstName.toLowerCase().includes(userSurname.toLowerCase())
            ? `${userFirstName} ${userSurname}`.trim()
            : userFirstName || userSurname)
        : '';

      const reportFirstName = (reportData.reporterName || reportData.postedByUserName || '').trim();
      const reportSurname = (reportData.reporterSurname || reportData.postedByUserSurname || '').trim();

      const chosenFirstName = reportFirstName || userFirstName || (adminSession?.name) || (isPostAdmin ? 'Admin Dispatch' : 'Community Motorist');
      const chosenSurname = reportSurname || userSurname;

      const fullCombinedName = chosenSurname && !chosenFirstName.toLowerCase().includes(chosenSurname.toLowerCase())
        ? `${chosenFirstName} ${chosenSurname}`.trim()
        : chosenFirstName;

      const reporterName = isPostAdmin
        ? (fullCombinedName.includes('🛡️') ? fullCombinedName : `🛡️ ${fullCombinedName} (Admin)`)
        : fullCombinedName;

      const reporterEmail = reportData.reporterEmail || currentUser?.email || adminSession?.email || undefined;
      const userRole = isPostAdmin
        ? (adminSession?.role || currentUser?.role || 'admin')
        : (currentUser?.role || 'user');

      if (fullCombinedName) {
        (headers as any)['x-user-name'] = fullCombinedName;
        (headers as any)['x-admin-name'] = fullCombinedName;
      }
      if (chosenSurname) {
        (headers as any)['x-user-surname'] = chosenSurname;
      }
      if (reporterEmail) {
        (headers as any)['x-user-email'] = reporterEmail;
        (headers as any)['x-admin-email'] = reporterEmail;
      }

      const cleanImageUrl = isActualAttachedImage(reportData.imageUrl) ? reportData.imageUrl : undefined;

      const payload = {
        ...reportData,
        imageUrl: cleanImageUrl,
        isAdmin: isPostAdmin,
        status: 'approved',
        autoApprove: true,
        verifiedByAdmin: isPostAdmin,
        isUserPost: !isPostAdmin,
        reporterEmail,
        reporterName,
        reporterSurname: chosenSurname || undefined,
        postedByUserName: fullCombinedName,
        postedByUserSurname: chosenSurname || undefined,
        postedByUserEmail: reporterEmail,
        userRole
      };

      // OPTIMISTIC UPDATE: Pin appears immediately on the live map and feed without any latency
      const tempId = `rep-temp-${Date.now()}`;
      const optimisticReport: IncidentReport = {
        id: tempId,
        type: reportData.type,
        title: reportData.title,
        description: reportData.description || 'Community incident report.',
        latitude: reportData.latitude,
        longitude: reportData.longitude,
        locationName: reportData.locationName || 'Reported Location',
        roadName: reportData.roadName || 'Active Road Corridor',
        imageUrl: cleanImageUrl,
        status: 'approved',
        severity: reportData.severity || 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reporterName,
        reporterSurname: chosenSurname || undefined,
        reporterEmail,
        reporterRole: userRole,
        postedByUserName: fullCombinedName,
        postedByUserSurname: chosenSurname || undefined,
        postedByUserEmail: reporterEmail,
        upvotes: 1,
        downvotes: 0,
        verifiedByAdmin: isPostAdmin,
        isUserPost: !isPostAdmin,
      };

      setReports(prev => [optimisticReport, ...prev]);

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.report) {
          // Replace temporary optimistic report with authoritative server report
          setReports(prev => [data.report, ...prev.filter(r => r.id !== tempId && r.id !== data.report.id)]);
        }
        // Add live feed item immediately (admin verified or unverified user post)
        if (data.feedItem) {
          setFeedItems(prev => [data.feedItem, ...prev.filter(f => f.id !== data.feedItem.id)]);
        }

        // Award Community Heroes Points (+10 for approved report)
        if (currentUser) {
          awardReputationPoints(
            currentUser,
            'approved_report',
            `Reported road hazard: ${reportData.title || reportData.roadName || 'Road Hazard'}`,
            data.report?.id || tempId
          ).catch(() => {});
        }
      }
    } catch (e) {
      console.warn("Submit report error:", e);
    }
    // Background parallel refresh
    Promise.all([fetchReports(), fetchFeed()]).catch(() => {});
  };

  const handleDenyReport = async (id: string) => {
    try {
      await fetch(`/api/reports/${encodeURIComponent(id)}/deny`, { method: 'POST' });
      await fetchReports();
      if (selectedReport && selectedReport.id === id) {
        setSelectedReport(prev => prev ? { ...prev, downvotes: (prev.downvotes || 0) + 1 } : null);
      }
    } catch (e) {
      console.warn("Deny report error:", e);
    }
  };

  const handleUpdateReportStatus = async (
    id: string,
    status: ReportStatus,
    adminNotes?: string,
    resolvedImageUrl?: string,
    resolutionNotes?: string
  ) => {
    // 1. Resolve active admin session
    const adminSession = getAdminSession(currentUser);
    const token = adminSession?.token || (typeof window !== 'undefined' ? (sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken') || '') : '') || 'admin-auth-token-charlesodendaal43';
    
    let parsedAdmin: any = null;
    if (typeof window !== 'undefined') {
      try {
        const storedAdmin = sessionStorage.getItem('adminUser') || localStorage.getItem('adminUser');
        if (storedAdmin) parsedAdmin = JSON.parse(storedAdmin);
      } catch {}
    }

    const isCurrentUserPermittedAdmin = currentUser && isPermittedAdminRole(currentUser.role, currentUser.email);
    const adminEmail = (isCurrentUserPermittedAdmin ? currentUser?.email : (adminSession?.email || parsedAdmin?.email)) || 'charlesodendaal43@gmail.com';
    const adminName = (isCurrentUserPermittedAdmin ? `${currentUser?.fullName} ${currentUser?.surname || ''}`.trim() : (adminSession?.name || parsedAdmin?.fullName || parsedAdmin?.name)) || 'Charles Odendaal';
    const adminRole = (isCurrentUserPermittedAdmin ? currentUser?.role : (adminSession?.role || parsedAdmin?.role)) || 'super_admin';

    // 2. Optimistic local state update so the UI updates instantly
    setReports(prev => prev.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status,
          verifiedByAdmin: status === 'approved' ? true : r.verifiedByAdmin,
          approvedByAdminName: status === 'approved' ? adminName : r.approvedByAdminName,
          approvedByAdminEmail: status === 'approved' ? adminEmail : r.approvedByAdminEmail,
          approvedByAdminRole: status === 'approved' ? adminRole : r.approvedByAdminRole,
          approvedAt: status === 'approved' ? new Date().toISOString() : r.approvedAt,
          adminNotes: adminNotes !== undefined ? adminNotes : r.adminNotes,
          resolvedImageUrl: resolvedImageUrl !== undefined ? resolvedImageUrl : r.resolvedImageUrl,
          resolutionNotes: resolutionNotes !== undefined ? resolutionNotes : r.resolutionNotes,
          resolvedAt: status === 'resolved' ? new Date().toISOString() : r.resolvedAt,
          resolvedByAdminName: status === 'resolved' ? adminName : r.resolvedByAdminName,
          resolvedByAdminEmail: status === 'resolved' ? adminEmail : r.resolvedByAdminEmail,
          resolvedByAdminRole: status === 'resolved' ? adminRole : r.resolvedByAdminRole
        };
      }
      return r;
    }));

    // 3. Make the API request with robust admin credentials
    const res = await fetch(`/api/reports/${encodeURIComponent(id)}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': adminRole,
        'x-admin-role': adminRole,
        'x-user-email': adminEmail,
        'x-admin-email': adminEmail,
        'x-user-name': adminName,
        'x-admin-name': adminName,
        'x-admin-authorized': 'true',
        'x-admin-token': token,
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        status, 
        adminNotes, 
        resolvedImageUrl, 
        resolutionNotes,
        adminName,
        adminEmail,
        adminRole
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error('Status update failed:', errData);
      await fetchReports();
      throw new Error(errData.error || `Failed to update report status (HTTP ${res.status})`);
    }

    // 4. Re-fetch from server to ensure database sync
    await Promise.all([fetchReports(), fetchFeed()]);
  };

  const handleUpvoteReport = async (id: string) => {
    await fetch(`/api/reports/${id}/upvote`, { method: 'POST' });
    await fetchReports();
    if (selectedReport && selectedReport.id === id) {
      setSelectedReport({ ...selectedReport, upvotes: selectedReport.upvotes + 1 });
    }
  };

  const handleDeleteReport = async (id: string) => {
    try {
      registerDeletedPostId(id);
      clearAllPostCaches();
      const relatedIds = getAllPostRelatedIds(id);

      // Optimistically remove all related variants from state immediately
      setReports((prev) => prev.filter((r) => !isGloballyDeleted(r.id) && !isPostDeleted(r.id, relatedIds, relatedIds)));
      setFeedItems((prev) => prev.filter((f) => !isGloballyDeleted(f.id) && !isPostDeleted(f.id, relatedIds, relatedIds)));
      if (selectedReport && (isGloballyDeleted(selectedReport.id) || isPostDeleted(selectedReport.id, relatedIds, relatedIds))) {
        setSelectedReport(null);
      }

      const adminHeaders = getAdminRequestHeaders(currentUser);

      await Promise.allSettled([
        fetch(`/api/reports/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...adminHeaders
          }
        }),
        fetch(`/api/feed/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...adminHeaders
          }
        }),
        fetch(`/api/feed/${encodeURIComponent(id)}/delete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...adminHeaders
          }
        })
      ]);

      await Promise.allSettled([fetchReports({ forceFresh: true }), fetchFeed({ forceFresh: true })]);
    } catch (err) {
      console.error('Error deleting report:', err);
    }
  };

  const handleDeleteFeedItem = async (id: string) => {
    try {
      registerDeletedPostId(id);
      clearAllPostCaches();
      const relatedIds = getAllPostRelatedIds(id);

      // Optimistically remove all related variants from state immediately
      setFeedItems((prev) => prev.filter((f) => !isGloballyDeleted(f.id) && !isPostDeleted(f.id, relatedIds, relatedIds)));
      setReports((prev) => prev.filter((r) => !isGloballyDeleted(r.id) && !isPostDeleted(r.id, relatedIds, relatedIds)));
      if (selectedReport && (isGloballyDeleted(selectedReport.id) || isPostDeleted(selectedReport.id, relatedIds, relatedIds))) {
        setSelectedReport(null);
      }

      const adminHeaders = getAdminRequestHeaders(currentUser);

      await Promise.allSettled([
        fetch(`/api/feed/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...adminHeaders
          }
        }),
        fetch(`/api/feed/${encodeURIComponent(id)}/delete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...adminHeaders
          }
        }),
        fetch(`/api/reports/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...adminHeaders
          }
        })
      ]);

      await Promise.allSettled([fetchFeed({ forceFresh: true }), fetchReports({ forceFresh: true })]);
    } catch (err) {
      console.error('Error deleting feed item:', err);
    }
  };

  const handleEditReport = async (reportId: string, updatedFields: Partial<IncidentReport>) => {
    const adminSession = getAdminSession(currentUser);
    const token = adminSession?.token || (typeof window !== 'undefined' ? (sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken') || '') : '') || 'admin-auth-token-charlesodendaal43';
    let parsedAdmin: any = null;
    if (typeof window !== 'undefined') {
      try {
        const storedAdmin = sessionStorage.getItem('adminUser') || localStorage.getItem('adminUser');
        if (storedAdmin) parsedAdmin = JSON.parse(storedAdmin);
      } catch {}
    }

    const isCurrentUserPermittedAdmin = currentUser && isPermittedAdminRole(currentUser.role, currentUser.email);
    const adminEmail = (isCurrentUserPermittedAdmin ? currentUser?.email : (adminSession?.email || parsedAdmin?.email)) || 'charlesodendaal43@gmail.com';
    const adminName = (isCurrentUserPermittedAdmin ? `${currentUser?.fullName} ${currentUser?.surname || ''}`.trim() : (adminSession?.name || parsedAdmin?.fullName || parsedAdmin?.name)) || 'Charles Odendaal';
    const adminRole = (isCurrentUserPermittedAdmin ? currentUser?.role : (adminSession?.role || parsedAdmin?.role)) || 'super_admin';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-admin-token': token,
      'x-admin-authorized': 'true',
      'x-user-role': adminRole,
      'x-admin-role': adminRole,
      'x-user-email': adminEmail,
      'x-admin-email': adminEmail,
      'x-user-name': adminName,
      'x-admin-name': adminName
    };

    const res = await fetch(`/api/reports/${encodeURIComponent(reportId)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        ...updatedFields,
        adminName,
        adminEmail,
        adminRole
      })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to update report');
    }
    await fetchReports();
    await fetchFeed();
  };

  const handleEditFeedItem = async (itemId: string, updatedFields: Partial<FeedItem>) => {
    const token = typeof window !== 'undefined'
      ? (sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken') || '')
      : '';
    const storedAdmin = typeof window !== 'undefined'
      ? (sessionStorage.getItem('adminUser') || localStorage.getItem('adminUser'))
      : null;
    let parsedAdmin: any = null;
    try {
      if (storedAdmin) parsedAdmin = JSON.parse(storedAdmin);
    } catch {}

    const adminEmail = currentUser?.email || parsedAdmin?.email || (token.includes('charles') ? 'charlesodendaal43@gmail.com' : 'admin@livetraffic.co.za');
    const adminName = currentUser?.fullName 
      ? `${currentUser.fullName} ${currentUser.surname || ''}`.trim() 
      : (parsedAdmin?.fullName ? `${parsedAdmin.fullName} ${parsedAdmin.surname || ''}`.trim() : (adminEmail.includes('charles') ? 'Charles Odendaal' : 'Admin Officer'));
    const adminRole = currentUser?.role || parsedAdmin?.role || 'admin';

    const effectiveToken = token || (adminEmail.includes('charles') ? 'admin-auth-token-charlesodendaal43' : 'admin-authenticated-secret');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${effectiveToken}`,
      'x-admin-authorized': 'true',
      'x-user-role': adminRole,
      'x-admin-role': adminRole,
      'x-user-email': adminEmail,
      'x-admin-email': adminEmail,
      'x-user-name': adminName,
      'x-admin-name': adminName
    };

    const nowIso = new Date().toISOString();
    const payload = {
      ...updatedFields,
      timestamp: nowIso,
      lastUpdated: nowIso,
      adminName,
      adminEmail,
      adminRole
    };

    const res = await fetch(`/api/feed/${encodeURIComponent(itemId)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || data.message || `Failed to update feed post (${res.status})`);
    }

    const resData = await res.json().catch(() => ({}));
    const returnedFeedItem = resData?.feedItem;

    const cleanId = itemId
      .replace(/^feed-report-rep-/, '')
      .replace(/^feed-report-/, '')
      .replace(/^feed-auto-/, '')
      .replace(/^feed-rep-/, '')
      .replace(/^feed-/, '')
      .replace(/^report-/, '')
      .replace(/^rep-/, '');

    setFeedItems(prev => prev.map(item => (
      item.id === itemId || 
      item.id === `feed-${itemId}` || 
      item.id === cleanId || 
      item.id === `feed-${cleanId}` ||
      item.id === `feed-report-${cleanId}` ||
      (cleanId.length >= 4 && item.id.includes(cleanId))
    ) ? {
      ...item,
      ...payload,
      ...(returnedFeedItem || {}),
      views: updatedFields.views !== undefined ? updatedFields.views : (returnedFeedItem?.views !== undefined ? returnedFeedItem.views : item.views),
      upvotes: updatedFields.upvotes !== undefined ? updatedFields.upvotes : (returnedFeedItem?.upvotes !== undefined ? returnedFeedItem.upvotes : item.upvotes),
      downvotes: (updatedFields as any).downvotes !== undefined ? (updatedFields as any).downvotes : (item as any).downvotes,
      confirmations: (updatedFields as any).confirmations !== undefined ? (updatedFields as any).confirmations : (item as any).confirmations,
      mediaUrl: updatedFields.mediaUrl !== undefined ? updatedFields.mediaUrl : (returnedFeedItem?.mediaUrl !== undefined ? returnedFeedItem.mediaUrl : item.mediaUrl),
      imageUrl: updatedFields.imageUrl !== undefined ? updatedFields.imageUrl : (returnedFeedItem?.imageUrl !== undefined ? returnedFeedItem.imageUrl : item.imageUrl),
      timestamp: nowIso,
      lastUpdated: nowIso
    } : item));
    await fetchFeed();
    await fetchReports();
  };

  const handleSubmitSOS = async (sosData: Partial<EmergencySOS>) => {
    try {
      const res = await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sosData)
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.sos?.id) {
          knownSosIdsRef.current.add(data.sos.id);
        }
        // Automatically register user device push subscription if supported so they receive response dispatches
        subscribeUserToPushNotifications({
          userEmail: currentUser?.email || sosData.phone,
          role: currentUser?.role || 'motorist',
          deviceName: 'Motorist Device'
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('Error submitting SOS:', err);
    }
    await fetchSOS();
    await fetchFeed();
  };

  const handleClearAllMapHazards = async () => {
    if (!isUserAdmin) {
      console.warn('Unauthorized: Only administrators can clear map hazards.');
      return;
    }
    try {
      await fetch('/api/admin/clear-map', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || '',
          'x-user-email': currentUser?.email || '',
          'Authorization': `Bearer ${sessionStorage.getItem('adminToken') || ''}`
        }
      });
      await fetchReports();
      await fetchSOS();
      await fetchFeed();
    } catch (err) {
      console.error('Failed to clear map hazards:', err);
    }
  };

  const handleUpdateSOSStatus = async (
    id: string,
    statusOrUpdates: EmergencySOS['status'] | Partial<EmergencySOS>,
    notes?: string,
    resolvedImageUrl?: string,
    resolutionNotes?: string
  ) => {
    const payload = typeof statusOrUpdates === 'string'
      ? { status: statusOrUpdates, notes, resolvedImageUrl, resolutionNotes }
      : statusOrUpdates;

    const adminSession = getAdminSession(currentUser);
    const token = adminSession?.token || (typeof window !== 'undefined' ? (sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken') || '') : '') || 'admin-auth-token-charlesodendaal43';
    const adminRole = adminSession?.role || 'super_admin';
    const adminEmail = adminSession?.email || 'charlesodendaal43@gmail.com';

    await fetch(`/api/sos/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': adminRole,
        'x-admin-role': adminRole,
        'x-user-email': adminEmail,
        'x-admin-email': adminEmail,
        'x-admin-authorized': 'true',
        'x-admin-token': token,
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    await fetchSOS();
    await fetchFeed();
  };

  const handleDeleteSOS = async (id: string) => {
    const adminSession = getAdminSession(currentUser);
    const token = adminSession?.token || (typeof window !== 'undefined' ? (sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken') || '') : '') || 'admin-auth-token-charlesodendaal43';
    const adminRole = adminSession?.role || 'super_admin';
    const adminEmail = adminSession?.email || 'charlesodendaal43@gmail.com';

    await fetch(`/api/sos/${id}`, {
      method: 'DELETE',
      headers: {
        'x-user-role': adminRole,
        'x-admin-role': adminRole,
        'x-user-email': adminEmail,
        'x-admin-email': adminEmail,
        'x-admin-authorized': 'true',
        'x-admin-token': token,
        'Authorization': `Bearer ${token}`
      }
    });
    await fetchSOS();
    await fetchFeed();
  };

  const handleClearSOS = async (filter: 'resolved' | 'all' = 'resolved') => {
    const adminSession = getAdminSession(currentUser);
    const token = adminSession?.token || (typeof window !== 'undefined' ? (sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken') || '') : '') || 'admin-auth-token-charlesodendaal43';
    const adminRole = adminSession?.role || 'super_admin';
    const adminEmail = adminSession?.email || 'charlesodendaal43@gmail.com';

    await fetch(`/api/sos?filter=${filter}`, {
      method: 'DELETE',
      headers: {
        'x-user-role': adminRole,
        'x-admin-role': adminRole,
        'x-user-email': adminEmail,
        'x-admin-email': adminEmail,
        'x-admin-authorized': 'true',
        'x-admin-token': token,
        'Authorization': `Bearer ${token}`
      }
    });
    await fetchSOS();
    await fetchFeed();
  };

  const handleSimulateITraffic = async () => {
    await fetch('/api/feed/simulate-itraffic', { method: 'POST' });
    await fetchFeed();
  };

  const handleSimulateXLiveTraffic = async () => {
    await fetch('/api/feed/simulate-x-livetraffic', { method: 'POST' });
    await fetchFeed();
  };

  const handleFetchAISummary = async (): Promise<string> => {
    const data = await safeFetchJson('/api/feed/ai-summary', { method: 'POST' });
    return data?.summary || 'Road corridor clear.';
  };

  const handleSubmitDonation = async (donationData: Partial<Donation>) => {
    let serverSuccess = false;
    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(donationData)
      });
      if (res.ok) {
        serverSuccess = true;
        await Promise.all([
          fetchDonations(),
          fetchReports(),
          fetchFeed()
        ]);
      }
    } catch (err) {
      console.warn("Server POST /api/donations unavailable, using local fallback:", err);
    }

    // Prepare local donation object
    const holesCount = donationData.category === 'pothole_repair' ? Math.max(1, Math.floor((donationData.amount || 350) / 350)) : 0;
    const newDonation: Donation = {
      id: `don-${Date.now()}`,
      donorName: donationData.donorName || 'Anonymous Hero',
      amount: donationData.amount || 350,
      category: donationData.category || 'pothole_repair',
      message: donationData.message,
      timestamp: new Date().toISOString(),
      isAnonymous: donationData.isAnonymous || false,
      potholesCount: holesCount,
      potholeLocation: donationData.potholeLocation,
      potholeImageUrl: donationData.potholeImageUrl,
      potholeLat: donationData.potholeLat,
      potholeLng: donationData.potholeLng
    };

    // Update state if server wasn't reachable
    if (!serverSuccess) {
      setDonations(prev => [newDonation, ...prev]);
      setDonationStats(prev => ({
        totalRaised: (prev?.totalRaised || 0) + newDonation.amount,
        goalAmount: prev?.goalAmount || 50000,
        coffeeCount: prev?.coffeeCount || 142,
        fuelLiters: prev?.fuelLiters || 420,
        equipmentItemsFunded: prev?.equipmentItemsFunded || 18,
        backersCount: (prev?.backersCount || 0) + 1,
        potholesFunded: (prev?.potholesFunded || 0) + holesCount
      }));
    }

    // Auto-create funded pothole report pin for the map
    if (donationData.category === 'pothole_repair') {
      const potholeReport: IncidentReport = {
        id: `pothole-don-${Date.now()}`,
        type: "pothole",
        title: `🔨 FUNDED POTHOLE PATCH: ${holesCount} Hole(s) Sponsored`,
        description: `Sponsored by ${newDonation.donorName}: ${donationData.message || `Sponsored ${holesCount} pothole repair patch(es) @ R350 each. Location: ${donationData.potholeLocation || 'Corridor Hotspot'}`}`,
        latitude: donationData.potholeLat !== undefined && !isNaN(Number(donationData.potholeLat)) ? Number(donationData.potholeLat) : -25.7479,
        longitude: donationData.potholeLng !== undefined && !isNaN(Number(donationData.potholeLng)) ? Number(donationData.potholeLng) : 28.2293,
        locationName: donationData.potholeLocation || "Corridor Pothole Hotspot",
        roadName: donationData.potholeLocation || "Community Corridor Road",
        imageUrl: donationData.potholeImageUrl,
        status: "approved",
        severity: "high",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reporterName: newDonation.donorName,
        upvotes: 1,
        verifiedByAdmin: true
      };

      if (!serverSuccess) {
        setReports(prev => [potholeReport, ...prev]);
      }
    }
  };

  // Hands-Free Voice Commands & AI Assistant
  const voiceAssistant = useVoiceAssistant({
    reports,
    latestAlert: rotatingAlerts[0] || "Drive with extreme caution across all monitored corridors.",
    activeTab,
    setActiveTab,
    openSOSModal: (options) => handleOpenSOSModalWithOptions(options),
    openReportModal: (options) => handleOpenReportModalWithOptions(options),
    openDriverMode: () => setIsDriverModeOpen(true),
    closeDriverMode: () => setIsDriverModeOpen(false),
    isDriverModeOpen,
    openLocationCheck: () => setIsLocationCheckOpen(true),
    openOnboarding: () => setIsOnboardingOpen(true),
    openFeedback: () => setIsFeedbackModalOpen(true),
    openUserProfile: () => setIsUserProfileOpen(true),
    openWallOfHeroes: () => setIsWallOfHeroesOpen(true)
  });

  const handleSelectLiveAlert = (alertText: string) => {
    setActiveTab('feed');
    setFocusedAlertQuery(alertText);
  };

  // If the user is not logged in, display the full marketing and conversion landing page.
  // The user must log in or register before accessing the full radar application.
  if (!currentUser) {
    return (
      <div className="fixed inset-0 h-full h-[100dvh] w-full bg-[#070A10] text-slate-100 font-sans antialiased overflow-y-auto overflow-x-hidden selection:bg-[#D4A237] selection:text-slate-950 overscroll-y-contain z-10 touch-scroll">
        <MarketingPage
          onOpenLogin={() => {
            setAuthIntent('sign in to access Live Traffic Control');
            setAuthInitialMode('login');
            setIsAuthModalOpen(true);
          }}
          onOpenRegister={() => {
            setAuthIntent('create your account to access Live Traffic Control');
            setAuthInitialMode('register');
            setIsAuthModalOpen(true);
          }}
          onOpenOnboarding={() => setIsOnboardingOpen(true)}
        />

        {/* Auth Modal (Login / Register) */}
        <AuthModal
          isOpen={isAuthModalOpen}
          initialMode={authInitialMode}
          onClose={() => {
            setIsAuthModalOpen(false);
            setPendingAction(null);
          }}
          onSuccess={(user) => {
            setCurrentUser(user);
            setIsAuthModalOpen(false);
            if (pendingAction) {
              pendingAction();
              setPendingAction(null);
            }
          }}
          actionIntentName={authIntent}
        />

        {/* Onboarding Safety Tour Modal */}
        <OnboardingTourModal
          isOpen={isOnboardingOpen}
          onClose={() => setIsOnboardingOpen(false)}
          onOpenMap={() => {
            setIsOnboardingOpen(false);
            setAuthInitialMode('login');
            setIsAuthModalOpen(true);
          }}
          onOpenDriverMode={() => {
            setIsOnboardingOpen(false);
            setAuthInitialMode('login');
            setIsAuthModalOpen(true);
          }}
        />

        {/* Real-time App Version Notification & Reload Prompt */}
        <VersionNotification currentVersion={APP_VERSION} />
      </div>
    );
  }

  // Render the full application when the user is authenticated.
  return (
    <div className="fixed inset-0 h-full h-[100dvh] w-full bg-[#070A10] text-slate-100 font-sans flex flex-col antialiased overflow-hidden text-[15px]">
      {/* Real-Time Emergency SOS Broadcast Alert Banner */}
      <EmergencySOSAlertBanner
        sos={activeIncomingSos}
        onDismiss={() => setActiveIncomingSos(null)}
        onViewOnMap={(sos) => {
          setActiveTab('map');
          setActiveIncomingSos(null);
        }}
      />

      {/* Navigation Header Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingCount}
        openSOSModal={(options) => handleOpenSOSModalWithOptions(options)}
        openGBVModal={() => handleOpenSOSModalWithOptions({
          emergencyType: 'gbv_assist',
          notes: 'GBV / Gender-Based Violence & Vulnerable Motorist Assistance Requested'
        })}
        openReportModal={() => handleOpenReportModalWithOptions()}
        onOpenDriverMode={() => setIsDriverModeOpen(true)}
        alerts={rotatingAlerts}
        currentUser={currentUser}
        onOpenAuthModal={(intent, mode) => {
          setAuthIntent(intent || 'access Live Traffic Control');
          setAuthInitialMode(mode || 'login');
          setIsAuthModalOpen(true);
        }}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        onLogout={handleLogout}
        onOpenShareToX={handleOpenShareToX}
        onOpenUserProfile={() => setIsUserProfileOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onOpenFeedback={() => setIsFeedbackModalOpen(true)}
        onOpenLocationCheck={() => setIsLocationCheckOpen(true)}
        onOpenWelcomeScreen={() => setIsWelcomeModalOpen(true)}
        onOpenVoiceAssistant={() => voiceAssistant.setIsVoiceCommandModalOpen(true)}
        isVoiceListening={voiceAssistant.isListening}
        onSelectLiveAlert={handleSelectLiveAlert}
        onOpenGettingStarted={() => setIsGettingStartedOpen(true)}
        onOpenNotificationSettings={() => setIsNotificationSettingsOpen(true)}
        onOpenCommunityHeroes={() => setIsCommunityHeroesOpen(true)}
        onOpenTripBuddy={() => setIsTripBuddyOpen(true)}
        isTripActive={Boolean(activeTrip && activeTrip.status === 'active')}
      />

      {/* Main Tab Content View */}
      <main className={`flex-1 min-h-0 relative ${activeTab === 'map' ? 'overflow-hidden pb-0' : 'overflow-y-auto overscroll-contain pb-28 sm:pb-20'}`}>
        {activeTab === 'dashboard' && (
          <MainDashboard
            reports={reports}
            sosRequests={sosRequests}
            pendingCount={pendingCount}
            currentUser={currentUser}
            onOpenAuthModal={(intent, mode) => {
              setAuthIntent(intent || 'access Live Traffic Control');
              setAuthInitialMode(mode || 'login');
              setIsAuthModalOpen(true);
            }}
            onOpenUserProfile={() => setIsUserProfileOpen(true)}
            onOpenChangePassword={() => setIsChangePasswordOpen(true)}
            onLogout={handleLogout}
            onOpenReportModal={handleOpenReportModalWithOptions}
            onOpenSOSModal={handleOpenSOSModalWithOptions}
            onOpenDonationModal={() => setActiveTab('donations')}
            onSwitchTab={(tab) => setActiveTab(tab)}
            onSelectCategoryFilter={(cat) => setSelectedCategory(cat)}
            onOpenDriverMode={() => setIsDriverModeOpen(true)}
            onOpenLocationCheck={() => setIsLocationCheckOpen(true)}
            onOpenShareToX={handleOpenShareToX}
            onOpenFeedback={() => setIsFeedbackModalOpen(true)}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            onOpenInstallApp={() => setIsInstallModalOpen(true)}
            onShowWelcomeScreen={() => setIsWelcomeModalOpen(true)}
            onOpenVoiceCommands={() => voiceAssistant.setIsVoiceCommandModalOpen(true)}
            onOpenWallOfHeroes={() => setIsWallOfHeroesOpen(true)}
            onOpenGettingStarted={() => setIsGettingStartedOpen(true)}
            onOpenNotificationSettings={() => setIsNotificationSettingsOpen(true)}
            onOpenTripBuddy={() => setIsTripBuddyOpen(true)}
            isTripActive={Boolean(activeTrip && activeTrip.status === 'active')}
          />
        )}

        {activeTab === 'map' && (
          <InteractiveMap
            reports={reports.filter(r => r.status === 'approved' || r.status === 'pending')}
            sosRequests={sosRequests.filter(s => s.status === 'active')}
            feedItems={feedItems}
            onSelectReport={(rep) => setSelectedReport(rep)}
            onSelectLocationForReport={handleSelectLocationForReport}
            onUpvoteReport={handleUpvoteReport}
            onDenyReport={handleDenyReport}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            onSubmitReport={handleSubmitReport}
            onRefreshReports={fetchReports}
            onRefreshFeed={fetchFeed}
            currentUser={currentUser}
            onClearAllMapHazards={isUserAdmin ? handleClearAllMapHazards : undefined}
            onOpenShareToX={handleOpenShareToX}
            onDeleteReport={handleDeleteReport}
            onDeleteFeedItem={handleDeleteFeedItem}
            onDeleteSOS={handleDeleteSOS}
            showLiveTrafficNpc={showLiveTrafficNpc}
            onToggleLiveTrafficNpc={() => setShowLiveTrafficNpc(prev => !prev)}
            activeTrip={activeTrip}
            onOpenTripBuddy={() => setIsTripBuddyOpen(true)}
            onOpenSOSModal={handleOpenSOSModalWithOptions}
            onSubmitSOS={handleSubmitSOS}
          />
        )}

        {activeTab === 'feed' && (
          <LiveFeedSection
            feedItems={feedItems}
            currentUser={currentUser}
            onSimulateITraffic={handleSimulateITraffic}
            onSimulateXLiveTraffic={handleSimulateXLiveTraffic}
            onFetchAISummary={handleFetchAISummary}
            onOpenDriverMode={() => setIsDriverModeOpen(true)}
            onRefreshFeed={fetchFeed}
            onRefreshReports={fetchReports}
            onAddFeedItem={(item) => {
              setFeedItems(prev => [item, ...prev.filter(f => f.id !== item.id)]);
            }}
            onDeleteFeedItem={handleDeleteFeedItem}
            onEditFeedItem={handleEditFeedItem}
            onOpenShareToX={handleOpenShareToX}
            onOpenShareToWhatsApp={handleOpenShareToWhatsApp}
            focusedAlertQuery={focusedAlertQuery}
            onClearFocusedAlert={() => setFocusedAlertQuery(null)}
            onNavigateToAdvertiser={() => setActiveTab('advertiser')}
            onSwitchTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'trafficcams' && (
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4">
            <TrafficCamsSection
              initialCameraId={selectedCameraId}
              onSelectLocationOnMap={(lat, lng) => {
                setActiveTab('map');
                handleSelectLocationForReport(lat, lng);
              }}
              onOpenReportModal={(options) => handleOpenReportModalWithOptions(options)}
            />
          </div>
        )}

        {activeTab === 'traveltimes' && (
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4">
            <HighwayTravelTimesSection
              initialRegion="Gauteng"
              onNavigateToFeed={() => setActiveTab('feed')}
            />
          </div>
        )}

        {activeTab === 'admin' && (
          <AdminPortal
            reports={reports}
            sosRequests={sosRequests}
            donations={donations}
            donationStats={donationStats}
            feedItems={feedItems}
            onUpdateReportStatus={handleUpdateReportStatus}
            onEditReport={handleEditReport}
            onEditFeedItem={handleEditFeedItem}
            onUpdateSOSStatus={handleUpdateSOSStatus}
            onDeleteSOS={handleDeleteSOS}
            onClearSOS={handleClearSOS}
            onSelectReport={(rep) => setSelectedReport(rep)}
            onClearAllMapHazards={isUserAdmin ? handleClearAllMapHazards : undefined}
            onRefreshDonations={fetchDonations}
            onUpdateDonations={(updated, stats) => {
              setDonations(updated);
              if (stats) setDonationStats(stats);
            }}
            onRefreshFeed={fetchFeed}
            onAddFeedItem={(item) => setFeedItems(prev => [item, ...prev.filter(f => f.id !== item.id)])}
            onDeleteFeedItem={handleDeleteFeedItem}
            onDeleteReport={handleDeleteReport}
            currentUser={currentUser}
            onSwitchTab={(tab) => setActiveTab(tab)}
            onLogout={handleLogout}
          />
        )}

        {activeTab === 'donations' && (
          <DonationsSection
            stats={donationStats}
            donations={donations}
            onSubmitDonation={handleSubmitDonation}
            currentUser={currentUser}
            onSwitchTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'pricing' && (
          <PricingSection
            currentUser={currentUser}
            onSwitchTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'course' && (
          <DrivingCourseSection
            currentUser={currentUser}
            onSwitchTab={(tab) => setActiveTab(tab)}
            onOpenSOSModal={() => handleOpenSOSModalWithOptions()}
          />
        )}

        {activeTab === 'advertiser' && (
          <AdvertiserPortal
            onClose={() => setActiveTab('pricing')}
            onNavigateToPricing={() => setActiveTab('pricing')}
            currentUser={currentUser}
            onUserUpdate={(u) => setCurrentUser(u)}
          />
        )}

        {/* Global Footer on all scrollable pages */}
        {activeTab !== 'map' && (
          <AppFooter onNavigateToTab={(tab) => setActiveTab(tab as any)} />
        )}
      </main>

      {/* Fixed Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingCount}
        openReportModal={() => handleOpenReportModalWithOptions({ autoDetectGps: true, onScene: true })}
        reports={reports}
        onOpenSOSModal={() => handleOpenSOSModalWithOptions()}
        onOpenDriverMode={() => setIsDriverModeOpen(true)}
        showLiveTrafficNpc={showLiveTrafficNpc}
        onToggleLiveTrafficNpc={() => setShowLiveTrafficNpc(prev => !prev)}
      />

      {/* Driver Mode Bulletin & Live Traffic Map View */}
      <DriverBulletinMode
        reports={reports}
        sosRequests={sosRequests}
        feedItems={feedItems}
        isOpen={isDriverModeOpen}
        onClose={() => setIsDriverModeOpen(false)}
        onOpenReportModal={(options) => {
          setIsDriverModeOpen(false);
          handleOpenReportModalWithOptions(options);
        }}
        onOpenSOSModal={() => {
          setIsDriverModeOpen(false);
          handleOpenSOSModalWithOptions();
        }}
        onSelectReport={(rep) => setSelectedReport(rep)}
        onSelectLocationForReport={handleSelectLocationForReport}
        onSubmitReport={handleSubmitReport}
        onRefreshReports={fetchReports}
        onRefreshFeed={fetchFeed}
        onDeleteReport={handleDeleteReport}
        onDeleteFeedItem={handleDeleteFeedItem}
        currentUser={currentUser}
        onOpenShareToX={handleOpenShareToX}
        onOpenVoiceCommands={() => voiceAssistant.setIsVoiceCommandModalOpen(true)}
        isVoiceListening={voiceAssistant.isListening}
      />

      {/* Floating Hands-Free Voice Assistant HUD */}
      <VoiceAssistantHUD
        isSupported={voiceAssistant.isSupported}
        isListening={voiceAssistant.isListening}
        isContinuousMode={voiceAssistant.isContinuousMode}
        wakeWordDetected={voiceAssistant.wakeWordDetected}
        liveTranscript={voiceAssistant.liveTranscript}
        lastExecutedCommand={voiceAssistant.lastExecutedCommand}
        isProcessing={voiceAssistant.isProcessing}
        errorMessage={voiceAssistant.errorMessage}
        activeTab={activeTab}
        onStartListening={voiceAssistant.startListening}
        onStopListening={voiceAssistant.stopListening}
        onToggleContinuousMode={voiceAssistant.toggleContinuousMode}
        onOpenVoiceCommandsModal={() => voiceAssistant.setIsVoiceCommandModalOpen(true)}
        onOpenReportModal={(opts) => handleOpenReportModalWithOptions(opts || { autoDetectGps: true, onScene: true })}
      />

      {/* Voice Commands Interactive Directory Modal */}
      <VoiceCommandsModal
        isOpen={voiceAssistant.isVoiceCommandModalOpen}
        onClose={() => voiceAssistant.setIsVoiceCommandModalOpen(false)}
        commands={voiceAssistant.commands}
        onExecuteCommand={voiceAssistant.executeCommandById}
        isContinuousMode={voiceAssistant.isContinuousMode}
        onToggleContinuousMode={voiceAssistant.toggleContinuousMode}
        isListening={voiceAssistant.isListening}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authInitialMode}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingAction(null);
        }}
        onSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthModalOpen(false);
          if (pendingAction) {
            pendingAction();
            setPendingAction(null);
          }
        }}
        actionIntentName={authIntent}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmitReport={handleSubmitReport}
        currentUser={currentUser}
        prefilledLat={pinnedCoords?.lat}
        prefilledLng={pinnedCoords?.lng}
        prefilledType={prefilledReportType}
        prefilledTitle={prefilledReportTitle}
        prefilledOnScene={reportModalPrefilledOnScene}
        autoDetectGps={reportModalAutoDetectGps}
      />

      {/* Emergency SOS Modal */}
      <EmergencySOSModal
        isOpen={isSOSModalOpen}
        onClose={() => setIsSOSModalOpen(false)}
        onSubmitSOS={handleSubmitSOS}
        currentUser={currentUser}
        prefilledType={prefilledSOSType}
        prefilledNotes={prefilledSOSNotes}
      />

      {/* Report Detail Modal */}
      <ReportDetailModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
        onUpvote={handleUpvoteReport}
        onDeny={handleDenyReport}
        onDeleteReport={handleDeleteReport}
        onEditReport={handleEditReport}
        onOpenShareToX={handleOpenShareToX}
        onOpenShareToWhatsApp={handleOpenShareToWhatsApp}
        currentUser={currentUser}
        isAdmin={isUserAdmin}
      />

      {/* Share to X.com (Twitter) Modal */}
      <ShareToXModal
        isOpen={isShareToXOpen}
        onClose={() => setIsShareToXOpen(false)}
        initialText={shareToXConfig.initialText}
        initialHashtags={shareToXConfig.initialHashtags}
        report={shareToXConfig.report}
        feedItem={shareToXConfig.feedItem}
        latestAlert={shareToXConfig.latestAlert}
      />

      {/* Share to WhatsApp Channel / Chat Modal */}
      <ShareToWhatsAppModal
        isOpen={isShareToWhatsAppOpen}
        onClose={() => setIsShareToWhatsAppOpen(false)}
        feedItem={shareToWhatsAppConfig.feedItem}
        report={shareToWhatsAppConfig.report}
        customText={shareToWhatsAppConfig.customText}
        onOpenAdminHashtags={() => setActiveTab('admin')}
      />

      {/* User Account / Profile Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        userEmail={currentUser?.cellNumber || ''}
        userName={currentUser ? `${currentUser.fullName} ${currentUser.surname}` : ''}
      />

      {/* Community Suggestions & Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        currentUser={currentUser}
      />

      {/* User Profile & Driving Stats Modal */}
      <UserProfileModal
        isOpen={isUserProfileOpen}
        onClose={() => setIsUserProfileOpen(false)}
        currentUser={currentUser}
        onOpenAuthModal={(intent, mode) => {
          setAuthIntent(intent || 'access profile features');
          setAuthInitialMode(mode || 'login');
          setIsAuthModalOpen(true);
        }}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onOpenInstallApp={() => setIsInstallModalOpen(true)}
        onOpenCommunityHeroes={() => setIsCommunityHeroesOpen(true)}
        onLogout={handleLogout}
      />

      {/* Trip Buddy In-App Live Journey Monitoring Modal */}
      <TripBuddyModal
        isOpen={isTripBuddyOpen}
        onClose={() => {
          setIsTripBuddyOpen(false);
          setInitialTrackingToken(null);
        }}
        currentUser={currentUser}
        activeTrip={activeTrip}
        onTripUpdated={handleTripUpdated}
        initialTrackingToken={initialTrackingToken}
        onSubmitSOS={handleSubmitSOS}
      />

      {/* Community Heroes Recognition & Leaderboard Hub Modal */}
      <CommunityHeroesModal
        isOpen={isCommunityHeroesOpen}
        onClose={() => setIsCommunityHeroesOpen(false)}
        currentUser={currentUser}
        onOpenReportModal={() => {
          setIsCommunityHeroesOpen(false);
          handleOpenReportModalWithOptions();
        }}
        onOpenAuthModal={(intent, mode) => {
          setIsCommunityHeroesOpen(false);
          setAuthIntent(intent || 'participate in Live Traffic Community Heroes');
          setAuthInitialMode(mode || 'login');
          setIsAuthModalOpen(true);
        }}
      />

      {/* Onboarding Tour Modal */}
      <OnboardingTourModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onOpenMap={() => setActiveTab('map')}
        onOpenDriverMode={() => setIsDriverModeOpen(true)}
      />

      {/* GPS & Location Diagnostic Double-Check Modal */}
      <LocationCheckModal
        isOpen={isLocationCheckOpen}
        onClose={() => setIsLocationCheckOpen(false)}
      />

      {/* Add to Home Screen & Desktop Shortcut PWA Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* Community Wall of Heroes Modal */}
      <WallOfHeroesModal
        isOpen={isWallOfHeroesOpen}
        onClose={() => setIsWallOfHeroesOpen(false)}
        donations={donations}
        stats={donationStats}
        onOpenDonate={(cat) => {
          setIsWallOfHeroesOpen(false);
          setActiveTab('donations');
        }}
      />

      {/* Getting Started & Functions Guide Modal */}
      <GettingStartedModal
        isOpen={isGettingStartedOpen}
        onClose={() => setIsGettingStartedOpen(false)}
        isAdmin={isUserAdmin}
        onNavigateToTab={(tab) => {
          setIsGettingStartedOpen(false);
          setActiveTab(tab as any);
        }}
      />

      {/* Push Notification Preferences & Sound Settings Modal */}
      <PushNotificationSettingsModal
        isOpen={isNotificationSettingsOpen}
        onClose={() => setIsNotificationSettingsOpen(false)}
        currentUser={currentUser}
      />

      {/* What's New & Release Notes Modal - Restricted to Authenticated Admins */}
      {isUserAdmin && (
        <ReleaseNotesModal
          isOpen={isReleaseNotesOpen}
          onClose={() => setIsReleaseNotesOpen(false)}
          onOpenFeedback={() => setIsFeedbackModalOpen(true)}
        />
      )}

      {/* Official Welcome Screen / Splash Badge */}
      {isWelcomeModalOpen && (
        <WelcomeScreen
          onOpenRegister={() => {
            setIsWelcomeModalOpen(false);
            setAuthIntent('register for Live Traffic Control');
            setAuthInitialMode('register');
            setIsAuthModalOpen(true);
          }}
          onOpenLogin={() => {
            setIsWelcomeModalOpen(false);
            setAuthIntent('access Live Traffic Control');
            setAuthInitialMode('login');
            setIsAuthModalOpen(true);
          }}
          onOpenOnboarding={() => {
            setIsWelcomeModalOpen(false);
            setIsOnboardingOpen(true);
          }}
          onClose={() => setIsWelcomeModalOpen(false)}
        />
      )}

      {/* Real-time App Version Notification & Reload Prompt (with Enforced Auto-Reload for Anonymous Connections) */}
      <VersionNotification currentVersion={APP_VERSION} currentUser={currentUser} />
    </div>
  );
}
