import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { IncidentReport, EmergencySOS, RegisteredUser, FeedItem, TripBuddyPlan } from '../types';
import { formatSATime, formatReadableDateTime, getTimeAgo, getSOSTimingBreakdown, parseDateToMillis } from '../utils/dateParser';
import { 
  AlertTriangle, Car, Construction, AlertOctagon, Layers, Compass, PlusCircle, 
  ExternalLink, ChevronLeft, ChevronRight, ChevronUp, Globe, Building2, FileText, 
  Volume2, VolumeX, Copy, RefreshCw, X, Sparkles, Check, ChevronDown, MapPin, 
  Flame, ShieldAlert, Zap, Trash2, Radio, Sliders, Navigation, Maximize2, Minimize2,
  Search, Route, Crosshair, ArrowRight, Clock, Milestone, CheckCircle2, AlertCircle,
  Activity, TrendingUp, TrendingDown, Gauge, Shield, ShieldCheck, CloudRain, CircleDot, Wrench,
  HeartHandshake
} from 'lucide-react';
import { 
  SARegionId, 
  SA_REGIONS, 
  SA_PROVINCES_LIST, 
  autoDetectUserRegion, 
  getSavedRegion, 
  saveSelectedRegion, 
  getSavedDetectedRegion 
} from '../utils/regionUtils';
import {
  RouteSearchResult,
  CalculatedRoute,
  OnRouteHazard,
  POPULAR_SA_DESTINATIONS,
  searchAddress,
  fetchDrivingRoute,
  detectHazardsOnRoute,
  getDistanceKm,
  reverseGeocodeLocation
} from '../utils/routeUtils';
import {
  compute1HourTrafficTrend,
  TrafficTrendData,
  getSpeedCategory,
  getSpeedColor,
} from '../utils/trafficTrendUtils';
import { TrafficTrendHUD } from './TrafficTrendHUD';
import { isPermittedAdminRole, getAdminSession, getAdminRequestHeaders, canUserDeletePost } from '../utils/authUtils';
import { getCategoryDefaultImage, isActualAttachedImage } from '../utils/categoryImageHelper';
import { getAllPostRelatedIds, isPostDeleted, registerDeletedPostId, isGloballyDeleted, extractCleanPostId } from '../utils/idUtils';
import { clearAllPostCaches } from '../utils/apiClient';

export interface CityOption {
  name: string;
  region: string;
  provinceKey?: SARegionId;
  lat: number;
  lng: number;
  zoom: number;
  popular?: boolean;
}

export const CITY_OPTIONS: CityOption[] = [
  // Gauteng
  { name: 'Johannesburg', region: 'Gauteng', provinceKey: 'Gauteng', lat: -26.2041, lng: 28.0473, zoom: 13, popular: true },
  { name: 'Pretoria', region: 'Gauteng (Tshwane)', provinceKey: 'Gauteng', lat: -25.7479, lng: 28.2293, zoom: 13, popular: true },
  { name: 'Sandton', region: 'Gauteng', provinceKey: 'Gauteng', lat: -26.1076, lng: 28.0567, zoom: 13, popular: true },
  { name: 'Centurion', region: 'Gauteng', provinceKey: 'Gauteng', lat: -25.8603, lng: 28.1894, zoom: 13, popular: true },
  { name: 'Midrand', region: 'Gauteng', provinceKey: 'Gauteng', lat: -25.9964, lng: 28.1267, zoom: 13, popular: true },
  { name: 'Randburg', region: 'Gauteng', provinceKey: 'Gauteng', lat: -26.0936, lng: 27.9947, zoom: 13 },
  { name: 'Roodepoort', region: 'Gauteng', provinceKey: 'Gauteng', lat: -26.1625, lng: 27.8725, zoom: 13 },
  { name: 'Ekurhuleni (East Rand)', region: 'Gauteng', provinceKey: 'Gauteng', lat: -26.1715, lng: 28.2323, zoom: 12, popular: true },
  { name: 'Kempton Park (OR Tambo)', region: 'Gauteng', provinceKey: 'Gauteng', lat: -26.1000, lng: 28.2333, zoom: 13 },
  { name: 'Benoni', region: 'Gauteng', provinceKey: 'Gauteng', lat: -26.1883, lng: 28.3206, zoom: 13 },
  { name: 'Boksburg', region: 'Gauteng', provinceKey: 'Gauteng', lat: -26.2131, lng: 28.2575, zoom: 13 },
  { name: 'Soweto', region: 'Gauteng', provinceKey: 'Gauteng', lat: -26.2485, lng: 27.8540, zoom: 13 },
  { name: 'Krugersdorp', region: 'Gauteng', provinceKey: 'Gauteng', lat: -26.1030, lng: 27.7719, zoom: 13 },
  // KwaZulu-Natal
  { name: 'Durban', region: 'KwaZulu-Natal', provinceKey: 'KwaZulu-Natal', lat: -29.8587, lng: 31.0218, zoom: 12, popular: true },
  { name: 'Umhlanga', region: 'KwaZulu-Natal', provinceKey: 'KwaZulu-Natal', lat: -29.7289, lng: 31.0844, zoom: 13, popular: true },
  { name: 'Ballito', region: 'KwaZulu-Natal', provinceKey: 'KwaZulu-Natal', lat: -29.5392, lng: 31.2144, zoom: 13, popular: true },
  { name: 'Pietermaritzburg', region: 'KwaZulu-Natal', provinceKey: 'KwaZulu-Natal', lat: -29.6006, lng: 30.3794, zoom: 13, popular: true },
  { name: 'Pinetown', region: 'KwaZulu-Natal', provinceKey: 'KwaZulu-Natal', lat: -29.8188, lng: 30.8542, zoom: 13 },
  { name: 'Amanzimtoti', region: 'KwaZulu-Natal', provinceKey: 'KwaZulu-Natal', lat: -30.0500, lng: 30.8833, zoom: 13 },
  // Western Cape
  { name: 'Cape Town', region: 'Western Cape', provinceKey: 'Western Cape', lat: -33.9249, lng: 18.4241, zoom: 12, popular: true },
  { name: 'Bellville / Northern Suburbs', region: 'Western Cape', provinceKey: 'Western Cape', lat: -33.9004, lng: 18.6300, zoom: 13, popular: true },
  { name: 'Stellenbosch', region: 'Western Cape', provinceKey: 'Western Cape', lat: -33.9321, lng: 18.8602, zoom: 13 },
  { name: 'Somerset West / Helderberg', region: 'Western Cape', provinceKey: 'Western Cape', lat: -34.0833, lng: 18.8500, zoom: 13 },
  { name: 'Paarl', region: 'Western Cape', provinceKey: 'Western Cape', lat: -33.7342, lng: 18.9622, zoom: 13 },
  { name: 'George', region: 'Western Cape', provinceKey: 'Western Cape', lat: -33.9630, lng: 22.4617, zoom: 13 },
  // Eastern Cape
  { name: 'Gqeberha (PE)', region: 'Eastern Cape', provinceKey: 'Eastern Cape', lat: -33.9608, lng: 25.6022, zoom: 12, popular: true },
  { name: 'East London', region: 'Eastern Cape', provinceKey: 'Eastern Cape', lat: -33.0153, lng: 27.9116, zoom: 12 },
  // Free State
  { name: 'Bloemfontein', region: 'Free State', provinceKey: 'Free State', lat: -29.0852, lng: 26.1596, zoom: 12, popular: true },
  // Mpumalanga
  { name: 'Mbombela (Nelspruit)', region: 'Mpumalanga', provinceKey: 'Mpumalanga', lat: -25.4753, lng: 30.9694, zoom: 13, popular: true },
  { name: 'eMalahleni (Witbank)', region: 'Mpumalanga', provinceKey: 'Mpumalanga', lat: -25.8728, lng: 29.2332, zoom: 13 },
  // Limpopo
  { name: 'Polokwane', region: 'Limpopo', provinceKey: 'Limpopo', lat: -23.9045, lng: 29.4688, zoom: 13, popular: true },
  // North West
  { name: 'Rustenburg', region: 'North West', provinceKey: 'North West', lat: -25.6544, lng: 27.2434, zoom: 13, popular: true },
  { name: 'Potchefstroom', region: 'North West', provinceKey: 'North West', lat: -26.7145, lng: 27.0970, zoom: 13 },
  // Northern Cape
  { name: 'Kimberley', region: 'Northern Cape', provinceKey: 'Northern Cape', lat: -28.7282, lng: 24.7499, zoom: 13, popular: true }
];

/**
 * Returns the closest South African city option from a given latitude and longitude.
 */
export function findClosestCityOption(lat: number, lng: number): CityOption {
  let closest = CITY_OPTIONS[0];
  let minDistance = Infinity;

  for (const city of CITY_OPTIONS) {
    const dLat = city.lat - lat;
    const dLng = (city.lng - lng) * Math.cos((lat * Math.PI) / 180);
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < minDistance) {
      minDistance = distSq;
      closest = city;
    }
  }
  return closest;
}

interface InteractiveMapProps {
  reports: IncidentReport[];
  sosRequests: EmergencySOS[];
  feedItems?: FeedItem[];
  onSelectReport: (report: IncidentReport) => void;
  onSelectLocationForReport: (lat: number, lng: number) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  onSubmitReport?: (reportData: any) => Promise<void>;
  onRefreshReports?: () => Promise<void>;
  onRefreshFeed?: () => Promise<void>;
  currentUser?: RegisteredUser | null;
  onClearAllMapHazards?: () => Promise<void>;
  onOpenShareToX?: (options?: any) => void;
  onDeleteReport?: (id: string) => Promise<void> | void;
  onDeleteFeedItem?: (id: string) => Promise<void> | void;
  onDeleteSOS?: (id: string) => Promise<void> | void;
  onUpvoteReport?: (id: string) => Promise<void> | void;
  onDenyReport?: (id: string) => Promise<void> | void;
  showLiveTrafficNpc?: boolean;
  onToggleLiveTrafficNpc?: () => void;
  activeTrip?: TripBuddyPlan | null;
  onOpenTripBuddy?: () => void;
  onOpenSOSModal?: (options?: any) => void;
  onSubmitSOS?: (sosData: Partial<EmergencySOS>) => Promise<void>;
}

export type MapProvider = 
  | 'google_traffic'
  | 'google_sat_traffic'
  | 'google_roadmap'
  | 'google_terrain'
  | 'esri_streets'
  | 'esri_imagery'
  | 'osm'
  | 'osm_hot'
  | 'carto_dark'
  | 'carto_light';

// -------------------------------------------------------------
// USER LOCATION PERSISTENCE & POSITION CACHE
// Uses unified high-accuracy GPS engine shared across Map, Reports, & SOS
// -------------------------------------------------------------
import {
  CachedUserPosition,
  saveLastKnownUserPosition,
  getLastKnownUserPosition,
  getExactDeviceGps,
  startContinuousGpsWatch
} from '../utils/locationChecker';
import {
  requestScreenWakeLock,
  releaseScreenWakeLock,
  isScreenWakeLockActive,
  subscribeToWakeLock,
  isWakeLockSupported
} from '../utils/wakeLock';

export type { CachedUserPosition };
export { saveLastKnownUserPosition, getLastKnownUserPosition };

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  reports,
  sosRequests,
  feedItems = [],
  onSelectReport,
  onSelectLocationForReport,
  selectedCategory,
  setSelectedCategory,
  onSubmitReport,
  onRefreshReports,
  onRefreshFeed,
  currentUser,
  onClearAllMapHazards,
  onOpenShareToX,
  onDeleteReport,
  onDeleteFeedItem,
  onDeleteSOS,
  onUpvoteReport,
  onDenyReport,
  showLiveTrafficNpc = true,
  onToggleLiveTrafficNpc,
  activeTrip,
  onOpenTripBuddy,
  onOpenSOSModal,
  onSubmitSOS,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const tripBuddyLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const trafficTrendLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const pinnedLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const userLocationMarkerRef = useRef<L.Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const topBarScrollRef = useRef<HTMLDivElement>(null);

  const scrollTopBar = (direction: 'left' | 'right') => {
    if (topBarScrollRef.current) {
      const amount = direction === 'left' ? -220 : 220;
      topBarScrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const adminSession = getAdminSession(currentUser);
  const isUserAdmin = Boolean(
    adminSession ||
    (currentUser && isPermittedAdminRole(currentUser.role))
  );

  const [pinModeActive, setPinModeActive] = useState(false);
  const [mapProvider, setMapProvider] = useState<MapProvider>(() => {
    try {
      const saved = localStorage.getItem('livetraffic_map_provider');
      const validProviders: MapProvider[] = [
        'google_traffic',
        'google_sat_traffic',
        'google_roadmap',
        'google_terrain',
        'esri_streets',
        'esri_imagery',
        'osm',
        'osm_hot',
        'carto_dark',
        'carto_light'
      ];
      if (saved && validProviders.includes(saved as MapProvider)) {
        return saved as MapProvider;
      }
    } catch (e) {}
    return 'google_traffic';
  });

  const handleSelectMapProvider = (provider: MapProvider) => {
    setMapProvider(provider);
    try {
      localStorage.setItem('livetraffic_map_provider', provider);
    } catch (e) {}
  };
  const [showClearMapConfirmModal, setShowClearMapConfirmModal] = useState(false);
  const [isClearingMap, setIsClearingMap] = useState(false);
  const hasCenteredToLiveUserRef = useRef<boolean>(false);
  const [isLocatingUser, setIsLocatingUser] = useState<boolean>(false);
  const [hasLocatedGPS, setHasLocatedGPS] = useState<boolean>(false);

  // Screen Wake Lock state: prevents screen timeout while viewing map / driving
  const [isScreenAwake, setIsScreenAwake] = useState<boolean>(false);

  useEffect(() => {
    const unsub = subscribeToWakeLock((active) => {
      setIsScreenAwake(active);
    });
    // Request screen wake lock as soon as map mounts
    requestScreenWakeLock().catch(() => {});

    return () => {
      unsub();
      releaseScreenWakeLock().catch(() => {});
    };
  }, []);

  const handleToggleWakeLock = async () => {
    if (isScreenWakeLockActive()) {
      await releaseScreenWakeLock();
      setQuickToast({ message: '💤 Screen Timeout: Normal (Screen can sleep)' });
    } else {
      const ok = await requestScreenWakeLock();
      if (ok) {
        setQuickToast({ message: '⚡ Screen Awake: ON (Display will not sleep)' });
      } else {
        setQuickToast({ message: '⚠️ Wake Lock not supported by this browser' });
      }
    }
    setTimeout(() => setQuickToast(null), 3500);
  };

  // Auto-Recenter map as the user moves (Follow Me mode)
  const [autoRecenter, setAutoRecenter] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('livetraffic_auto_recenter');
      if (saved !== null) return saved === 'true';
    } catch (e) {}
    return true; // Default ON so map automatically follows user movement
  });
  const autoRecenterRef = useRef<boolean>(autoRecenter);

  useEffect(() => {
    autoRecenterRef.current = autoRecenter;
    try {
      localStorage.setItem('livetraffic_auto_recenter', String(autoRecenter));
    } catch (e) {}
  }, [autoRecenter]);

  const handleToggleAutoRecenter = () => {
    const next = !autoRecenter;
    setAutoRecenter(next);
    autoRecenterRef.current = next;
    if (next) {
      const pos = getLastKnownUserPosition();
      if (pos && mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([pos.latitude, pos.longitude], 15, { duration: 0.8 });
      } else if (mapInstanceRef.current) {
        locateUserPosition(mapInstanceRef.current, true, true);
      }
      setQuickToast({ message: '🎯 Auto-Recenter: ON (Following your movement)' });
    } else {
      setQuickToast({ message: '✋ Auto-Recenter: Paused (Free map browse)' });
    }
    setTimeout(() => setQuickToast(null), 3500);
  };

  // Top Menu 1-Line Dropdown States
  const [openDropdown, setOpenDropdown] = useState<'city' | 'hazards' | 'bulletins' | 'layers' | 'tools' | null>(null);

  const toggleDropdown = (name: 'city' | 'hazards' | 'bulletins' | 'layers' | 'tools') => {
    setOpenDropdown(prev => prev === name ? null : name);
  };

  const closeDropdowns = () => {
    setOpenDropdown(null);
  };

  // Traffic Trend 1-Hour Speed Variations & Timeline Overlay State
  const [showTrafficTrend, setShowTrafficTrend] = useState(false);
  const [trendActiveTimeIndex, setTrendActiveTimeIndex] = useState(4); // 0 to 4 (default 4 = LIVE)
  const [trendIsPlaying, setTrendIsPlaying] = useState(false);
  const [trendPlaybackSpeed, setTrendPlaybackSpeed] = useState<1 | 2 | 4>(1);

  // Driver Quick 1-Tap Report state
  const [showQuickReportModal, setShowQuickReportModal] = useState(false);

  const activeDeletingPinsRef = useRef<Set<string>>(new Set());

  // Global map pin deletion hook
  useEffect(() => {
    (window as any).__triggerDeleteMapPin = async (e: any, id: string, type: 'feed' | 'report' | 'sos') => {
      if (e) {
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
        if (typeof e.preventDefault === 'function') e.preventDefault();
      }

      if (!id || activeDeletingPinsRef.current.has(id)) return;

      // Verify deletion authorization: only admin or original composer can delete
      const cleanTargetId = extractCleanPostId(id);
      const targetRep = reports.find(r => r && (r.id === id || r.id === cleanTargetId));
      const targetFeed = feedItems.find(f => f && (f.id === id || f.id === cleanTargetId));
      const targetSos = sosRequests.find(s => s && s.id === id);
      const targetItem = targetRep || targetFeed || targetSos;

      if (targetItem && !canUserDeletePost(targetItem, currentUser, isUserAdmin)) {
        console.warn('Unauthorized: The delete button is disabled for motorists. Only administrators or the original composer can delete this post.');
        return;
      }

      activeDeletingPinsRef.current.add(id);

      registerDeletedPostId(id);
      clearAllPostCaches();

      const btn = document.getElementById(`del-${type}-${id}`) || 
                  document.getElementById(`del-rep-${id}`) || 
                  document.getElementById(`del-feed-${id}`) || 
                  document.getElementById(`del-${id}`);
      if (btn) {
        btn.innerHTML = '<span>⏳ Deleting...</span>';
        (btn as HTMLButtonElement).disabled = true;
      }

      // Immediately remove matching layers from the map canvas so pin vanishes without lag
      if (markersGroupRef.current) {
        try {
          const related = getAllPostRelatedIds(id);
          markersGroupRef.current.eachLayer((layer: any) => {
            if (layer && layer._pinId) {
              if (layer._pinId === id || isGloballyDeleted(layer._pinId) || isPostDeleted(layer._pinId, related, related)) {
                markersGroupRef.current?.removeLayer(layer);
              }
            }
          });
        } catch (err) {}
      }

      // Immediately close popup
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.closePopup();
        } catch (err) {}
      }

      const headers = getAdminRequestHeaders(currentUser);

      try {
        const cleanId = extractCleanPostId(id);
        const related = getAllPostRelatedIds(id);

        if (type === 'feed' || id.startsWith('feed-')) {
          if (onDeleteFeedItem) await onDeleteFeedItem(id);
          if (onDeleteReport) await onDeleteReport(id);

          const urls = [
            `/api/feed/${encodeURIComponent(id)}`,
            `/api/feed/${encodeURIComponent(id)}/delete`,
            `/api/reports/${encodeURIComponent(id)}`
          ];
          if (cleanId) {
            urls.push(
              `/api/feed/${encodeURIComponent(cleanId)}`,
              `/api/feed/${encodeURIComponent(cleanId)}/delete`,
              `/api/reports/${encodeURIComponent(cleanId)}`,
              `/api/reports/${encodeURIComponent(`rep-${cleanId}`)}`
            );
          }
          related.forEach(rid => {
            urls.push(`/api/feed/${encodeURIComponent(rid)}`, `/api/reports/${encodeURIComponent(rid)}`);
          });

          await Promise.allSettled(
            Array.from(new Set(urls)).map(url =>
              fetch(url, {
                method: url.endsWith('/delete') ? 'POST' : 'DELETE',
                headers
              }).catch(() => null)
            )
          );
        } else if (type === 'report' || id.startsWith('rep-') || id.startsWith('report-')) {
          if (onDeleteReport) await onDeleteReport(id);
          if (onDeleteFeedItem) await onDeleteFeedItem(id);

          const urls = [
            `/api/reports/${encodeURIComponent(id)}`,
            `/api/feed/${encodeURIComponent(id)}`,
            `/api/feed/${encodeURIComponent(id)}/delete`
          ];
          if (cleanId) {
            urls.push(
              `/api/reports/${encodeURIComponent(cleanId)}`,
              `/api/reports/${encodeURIComponent(`rep-${cleanId}`)}`,
              `/api/feed/${encodeURIComponent(cleanId)}`,
              `/api/feed/${encodeURIComponent(`feed-${cleanId}`)}`,
              `/api/feed/${encodeURIComponent(`feed-rep-${cleanId}`)}`
            );
          }
          related.forEach(rid => {
            urls.push(`/api/reports/${encodeURIComponent(rid)}`, `/api/feed/${encodeURIComponent(rid)}`);
          });

          await Promise.allSettled(
            Array.from(new Set(urls)).map(url =>
              fetch(url, {
                method: url.endsWith('/delete') ? 'POST' : 'DELETE',
                headers
              }).catch(() => null)
            )
          );
        } else if (type === 'sos') {
          if (onDeleteSOS) await onDeleteSOS(id);
          await fetch(`/api/sos/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
          await fetch(`/api/sos/${encodeURIComponent(id)}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'resolved' })
          }).catch(() => {});
        }
      } catch (err) {
        console.error('Failed to delete map pin:', err);
      } finally {
        activeDeletingPinsRef.current.delete(id);
        if (onRefreshFeed) await onRefreshFeed();
        if (onRefreshReports) await onRefreshReports();
      }
    };
  }, [onDeleteFeedItem, onDeleteReport, onDeleteSOS, onRefreshFeed, onRefreshReports, currentUser]);

  // Local record of confirmed pin IDs
  const [confirmedPinIds, setConfirmedPinIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('livetraffic_confirmed_pins');
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch (e) {}
    return new Set();
  });

  // Local record of denied pin IDs
  const [deniedPinIds, setDeniedPinIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('livetraffic_denied_pins');
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch (e) {}
    return new Set();
  });

  // Periodic ticker for 2-hour expiration calculation (every 30 seconds)
  const [currentMapTime, setCurrentMapTime] = useState<number>(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMapTime(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Global map pin confirmation hook
  useEffect(() => {
    (window as any).__triggerConfirmMapPin = async (e: any, id: string, type: 'feed' | 'report') => {
      if (e) {
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
        if (typeof e.preventDefault === 'function') e.preventDefault();
      }

      const cleanId = id.replace(/^feed-/, '').replace(/^report-/, '').replace(/^rep-/, '');
      const isAlreadyConfirmed = confirmedPinIds.has(id) || confirmedPinIds.has(cleanId) || confirmedPinIds.has(`rep-${cleanId}`);

      // Optimistically update DOM button and count immediately
      const btn = (document.getElementById(`confirm-btn-${type}-${id}`) || document.getElementById(`confirm-btn-${id}`)) as HTMLButtonElement | null;
      const countEl = document.getElementById(`confirm-count-${type}-${id}`) || document.getElementById(`confirm-count-${id}`);

      let currentCount = 1;
      if (countEl) {
        const textMatch = countEl.textContent?.match(/\d+/);
        if (textMatch) {
          currentCount = parseInt(textMatch[0], 10);
        }
        const newCount = isAlreadyConfirmed ? currentCount : currentCount + 1;
        countEl.textContent = `👍 ${newCount} Confirmations`;
      }

      if (btn) {
        btn.innerHTML = '<span>✅ Confirmed (+1)</span>';
        btn.className = 'bg-emerald-700 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg flex items-center space-x-1 shadow-inner cursor-default';
        btn.disabled = true;
      }

      // Update confirmed set
      setConfirmedPinIds(prev => {
        const updated = new Set(prev);
        updated.add(id);
        updated.add(cleanId);
        updated.add(`rep-${cleanId}`);
        try {
          localStorage.setItem('livetraffic_confirmed_pins', JSON.stringify(Array.from(updated)));
        } catch (err) {}
        return updated;
      });

      // Notification Toast & Audio Speech
      setQuickToast({
        message: "👍 Hazard confirmed! Thank you for validating this alert."
      });
      setTimeout(() => setQuickToast(null), 4000);

      if ('speechSynthesis' in window) {
        try {
          const speech = new SpeechSynthesisUtterance("Hazard confirmed. Thank you.");
          speech.rate = 1.1;
          window.speechSynthesis.speak(speech);
        } catch (err) {}
      }

      // Send to backend
      try {
        if (onUpvoteReport) {
          await onUpvoteReport(id);
        } else {
          await fetch(`/api/reports/${encodeURIComponent(id)}/upvote`, { method: 'POST' }).catch(() => {});
          await fetch(`/api/feed/${encodeURIComponent(id)}/upvote`, { method: 'POST' }).catch(() => {});
        }
      } catch (err) {
        console.warn('Confirm error:', err);
      } finally {
        if (onRefreshReports) onRefreshReports().catch(() => {});
        if (onRefreshFeed) onRefreshFeed().catch(() => {});
      }
    };

    (window as any).__triggerDenyMapPin = async (e: any, id: string, type: 'feed' | 'report') => {
      if (e) {
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
        if (typeof e.preventDefault === 'function') e.preventDefault();
      }

      const cleanId = id.replace(/^feed-/, '').replace(/^report-/, '').replace(/^rep-/, '');

      const btn = (document.getElementById(`deny-btn-${type}-${id}`) || document.getElementById(`deny-btn-${id}`)) as HTMLButtonElement | null;
      if (btn) {
        btn.innerHTML = '<span>❌ Denied</span>';
        btn.className = 'bg-rose-900 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg flex items-center space-x-1 shadow-inner cursor-default';
        btn.disabled = true;
      }

      setDeniedPinIds(prev => {
        const updated = new Set(prev);
        updated.add(id);
        updated.add(cleanId);
        updated.add(`rep-${cleanId}`);
        try {
          localStorage.setItem('livetraffic_denied_pins', JSON.stringify(Array.from(updated)));
        } catch (err) {}
        return updated;
      });

      setQuickToast({
        message: "❌ Hazard marked as denied / cleared by community."
      });
      setTimeout(() => setQuickToast(null), 4000);

      if ('speechSynthesis' in window) {
        try {
          const speech = new SpeechSynthesisUtterance("Hazard marked as cleared or denied.");
          speech.rate = 1.1;
          window.speechSynthesis.speak(speech);
        } catch (err) {}
      }

      try {
        if (onDenyReport) {
          await onDenyReport(id);
        } else {
          await fetch(`/api/reports/${encodeURIComponent(id)}/deny`, { method: 'POST' }).catch(() => {});
          await fetch(`/api/feed/${encodeURIComponent(id)}/downvote`, { method: 'POST' }).catch(() => {});
        }
      } catch (err) {
        console.warn('Deny error:', err);
      } finally {
        if (onRefreshReports) onRefreshReports().catch(() => {});
        if (onRefreshFeed) onRefreshFeed().catch(() => {});
      }
    };
  }, [confirmedPinIds, deniedPinIds, onUpvoteReport, onDenyReport, onRefreshReports, onRefreshFeed]);

  // City Selection, Region & 30-Min Intelligence Report state
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(() => {
    try {
      const savedCityName = localStorage.getItem('livetraffic_selected_city');
      if (savedCityName) {
        const found = CITY_OPTIONS.find(c => c.name.toLowerCase() === savedCityName.toLowerCase());
        if (found) return found;
      }
    } catch (e) {}
    const cachedGps = getLastKnownUserPosition();
    if (cachedGps && typeof cachedGps.latitude === 'number' && typeof cachedGps.longitude === 'number') {
      return findClosestCityOption(cachedGps.latitude, cachedGps.longitude);
    }
    const savedReg = getSavedRegion();
    if (savedReg && savedReg !== 'all') {
      const found = CITY_OPTIONS.find(c => c.provinceKey === savedReg);
      if (found) return found;
    }
    return CITY_OPTIONS[0];
  });
  const [modalProvinceFilter, setModalProvinceFilter] = useState<SARegionId>('all');
  const [detectedMapRegion, setDetectedMapRegion] = useState<SARegionId | null>(() => getSavedDetectedRegion());
  const [isDetectingMapRegion, setIsDetectingMapRegion] = useState(false);

  const [citySummary, setCitySummary] = useState<string | null>(null);
  const [summaryTitle, setSummaryTitle] = useState<string>('30-Minute City Report');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [showSummaryPanel, setShowSummaryPanel] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);

  const [pinnedCoords, setPinnedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pinnedRoadName, setPinnedRoadName] = useState<string>('');
  const [pinnedLocationName, setPinnedLocationName] = useState<string>('');
  const [isGeocodingPin, setIsGeocodingPin] = useState<boolean>(false);
  const lastQuickSubmitTimeRef = useRef<number>(0);
  const [isSubmittingQuickReport, setIsSubmittingQuickReport] = useState(false);
  const [quickToast, setQuickToast] = useState<{ message: string } | null>(null);

  // Auto-reverse geocode pinnedCoords for pinpoint road accuracy
  useEffect(() => {
    if (!pinnedCoords) {
      setPinnedRoadName('');
      setPinnedLocationName('');
      return;
    }
    let isMounted = true;
    setIsGeocodingPin(true);
    reverseGeocodeLocation(pinnedCoords.lat, pinnedCoords.lng)
      .then((geo) => {
        if (!isMounted) return;
        if (geo && geo.success) {
          setPinnedRoadName(geo.road || '');
          setPinnedLocationName(geo.locationName || '');
        } else {
          setPinnedRoadName(selectedCity ? `${selectedCity.name} Corridor` : 'Active Road Corridor');
          setPinnedLocationName(`GPS (${pinnedCoords.lat.toFixed(4)}, ${pinnedCoords.lng.toFixed(4)})`);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPinnedRoadName(selectedCity ? `${selectedCity.name} Corridor` : 'Active Road Corridor');
          setPinnedLocationName(`GPS (${pinnedCoords.lat.toFixed(4)}, ${pinnedCoords.lng.toFixed(4)})`);
        }
      })
      .finally(() => {
        if (isMounted) setIsGeocodingPin(false);
      });

    return () => {
      isMounted = false;
    };
  }, [pinnedCoords, selectedCity]);

  const triggerQuickSubmit = (hazardType: 'spiking' | 'fatal_crash' | 'crash' | 'stationary' | 'veld_fire' | 'congestion' | 'pothole' | 'roadworks' | 'weather') => {
    const now = Date.now();
    if (now - lastQuickSubmitTimeRef.current < 250) return;
    lastQuickSubmitTimeRef.current = now;
    handleQuickSubmit(hazardType);
  };

  const handleQuickSubmit = async (hazardType: 'spiking' | 'fatal_crash' | 'crash' | 'stationary' | 'veld_fire' | 'congestion' | 'pothole' | 'roadworks' | 'weather') => {
    // 1. CAPTURE COORDINATES & DETAILS SYNCHRONOUSLY (Live GPS takes absolute precedence over city centroids)
    const liveGps = getLastKnownUserPosition();
    const pos = pinnedCoords || (liveGps ? { lat: liveGps.latitude, lng: liveGps.longitude } : (selectedCity ? { lat: selectedCity.lat, lng: selectedCity.lng } : { lat: -25.7479, lng: 28.2293 }));
    const currentAdminSession = getAdminSession(currentUser);
    const isActualAdmin = Boolean(currentAdminSession || isUserAdmin);

    const labels: Record<string, { title: string; severity: string; icon: string }> = {
      spiking: { title: 'Spike Trap Hazard Reported', severity: 'critical', icon: '🚨' },
      fatal_crash: { title: 'Fatal Crash / Major Fatal Collision Alert', severity: 'critical', icon: '💥' },
      crash: { title: 'Vehicle Crash / Collision Alert', severity: 'high', icon: '💥' },
      stationary: { title: 'Stationary / Broken Vehicle', severity: 'medium', icon: '🛑' },
      veld_fire: { title: 'Veld Fire & Smoke Hazard', severity: 'high', icon: '🔥' },
      congestion: { title: 'Heavy Traffic Congestion Delay', severity: 'medium', icon: '🚗' },
      pothole: { title: 'Dangerous Road Pothole', severity: 'medium', icon: '🕳️' },
      roadworks: { title: 'Roadworks / Lane Maintenance', severity: 'medium', icon: '🚧' },
      weather: { title: 'Flooding / Heavy Storm Weather', severity: 'high', icon: '🌧️' },
    };

    const meta = labels[hazardType] || { title: 'Road Hazard', severity: 'medium', icon: '⚠️' };

    const resolvedRoad = pinnedRoadName || (selectedCity ? `${selectedCity.name} Corridor` : 'Active Transit Route');
    const resolvedLocation = pinnedLocationName || (pinnedCoords ? `Pinned Pin (${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)})` : `GPS (${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)})`);

    // 2. DISMISS POPUP AND CLEAR PIN STATE INSTANTLY (ZERO DELAY ON CLICK)
    setShowQuickReportModal(false);
    setPinnedCoords(null);
    setPinModeActive(false);
    setIsSubmittingQuickReport(false);

    // 3. SHOW INSTANT TOAST & PLAY SPEECH FEEDBACK IMMEDIATELY
    setQuickToast({
      message: isActualAdmin
        ? `📍 ${meta.icon} ${meta.title} is now live on the map!`
        : `📍 ${meta.icon} ${meta.title} dispatched to map! (User Report • Not Verified)`
    });

    setTimeout(() => {
      setQuickToast(null);
    }, 5000);

    if ('speechSynthesis' in window) {
      try {
        const spokenText = isActualAdmin
          ? `${meta.title} placed and live on map.`
          : `${meta.title} placed on map. User report, not verified.`;
        const speech = new SpeechSynthesisUtterance(spokenText);
        speech.rate = 1.1;
        window.speechSynthesis.speak(speech);
      } catch (e) {
        // ignore
      }
    }

    // 4. DISPATCH IN BACKGROUND NON-BLOCKINGLY
    const reporterName = isActualAdmin
      ? (currentAdminSession?.name || (currentUser ? `${currentUser.fullName} ${currentUser.surname || ''}`.trim() : '🛡️ Admin Patrol'))
      : (currentUser ? `${currentUser.fullName} ${currentUser.surname || ''}`.trim() : 'Community Driver');

    const reporterEmail = isActualAdmin
      ? (currentAdminSession?.email || currentUser?.email || 'charlesodendaal43@gmail.com')
      : (currentUser?.email || undefined);

    const userRole = isActualAdmin
      ? (currentAdminSession?.role || currentUser?.role || 'super_admin')
      : 'user';

    const reportData = {
      type: hazardType,
      title: `${resolvedRoad} - ${meta.title}`,
      description: isActualAdmin 
        ? `Official Admin Patrol Hazard Pin placed at ${resolvedLocation} (${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}).`
        : `Community Driver hazard pin placed at ${resolvedLocation} (${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}). (User Report - Not Verified)`,
      latitude: pos.lat,
      longitude: pos.lng,
      locationName: resolvedLocation,
      roadName: resolvedRoad,
      severity: meta.severity,
      reporterName,
      reporterEmail,
      status: 'approved',
      verifiedByAdmin: isActualAdmin,
      isUserPost: !isActualAdmin,
      autoApprove: true,
      isAdmin: isActualAdmin,
      imageUrl: getCategoryDefaultImage(hazardType) || undefined,
      userRole
    };

    try {
      if (onSubmitReport) {
        await onSubmitReport(reportData);
      } else {
        const headers = getAdminRequestHeaders(currentUser);
        await fetch('/api/reports', {
          method: 'POST',
          headers,
          body: JSON.stringify(reportData)
        });
      }

      if (onRefreshReports) {
        onRefreshReports().catch(() => {});
      }
    } catch (err) {
      console.error('Quick report dispatch error:', err);
    }
  };

  // Full Screen Map Mode State
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  // Address Search & Live Route Navigation State
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RouteSearchResult[]>(POPULAR_SA_DESTINATIONS);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [activeRoute, setActiveRoute] = useState<CalculatedRoute | null>(null);
  const [onRouteHazards, setOnRouteHazards] = useState<OnRouteHazard[]>([]);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [showRouteHazardsPanel, setShowRouteHazardsPanel] = useState(true);
  const [isRouteSpeaking, setIsRouteSpeaking] = useState(false);
  const [showTurnSteps, setShowTurnSteps] = useState(false);
  const [isRouteHUDMinimized, setIsRouteHUDMinimized] = useState(true);

  // Address Search Debounce Effect
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults(POPULAR_SA_DESTINATIONS);
      return;
    }
    setIsSearchingAddress(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchAddress(searchQuery);
        setSearchResults(results.length > 0 ? results : POPULAR_SA_DESTINATIONS);
      } catch (e) {
        console.warn('Address search failed:', e);
      } finally {
        setIsSearchingAddress(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Recalculate route hazards whenever live reports or route updates
  useEffect(() => {
    if (activeRoute) {
      const hazards = detectHazardsOnRoute(activeRoute, reports, 0.85);
      setOnRouteHazards(hazards);
    }
  }, [reports, activeRoute]);

  // Voice announcements for route hazards
  const speakRouteWarning = (route: CalculatedRoute, hazards: OnRouteHazard[]) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      let hazardSummary = '';
      if (hazards.length === 0) {
        hazardSummary = 'All clear. No active spike traps or road hazards detected along this corridor.';
      } else if (hazards.length === 1) {
        hazardSummary = `Warning: 1 hazard reported on route. ${hazards[0].report.title} in ${hazards[0].distanceFromStartKm} kilometers.`;
      } else {
        hazardSummary = `Caution: ${hazards.length} hazards detected on route corridor. First is ${hazards[0].report.title} in ${hazards[0].distanceFromStartKm} kilometers.`;
      }
      const text = `Navigation route active to ${route.destination.name}. Distance: ${route.distanceKm} km, estimated ${route.durationMin} minutes. ${hazardSummary}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsRouteSpeaking(false);
      utterance.onerror = () => setIsRouteSpeaking(false);
      setIsRouteSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  const stopRouteVoice = () => {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    setIsRouteSpeaking(false);
  };

  // Start Navigation to chosen address
  const handleStartNavigation = async (dest: RouteSearchResult | { lat: number; lng: number; name: string }) => {
    setIsCalculatingRoute(true);
    setShowSearchModal(false);

    try {
      const userPos = getLastKnownUserPosition();
      let startLat = userPos ? userPos.latitude : (selectedCity ? selectedCity.lat : -25.7479);
      let startLng = userPos ? userPos.longitude : (selectedCity ? selectedCity.lng : 28.2293);
      let startName = userPos ? 'My GPS Position' : (selectedCity ? `${selectedCity.name} Hub` : 'Origin');

      const route = await fetchDrivingRoute(
        { lat: startLat, lng: startLng, name: startName },
        { lat: dest.lat, lng: dest.lng, name: dest.name }
      );

      setActiveRoute(route);
      const hazards = detectHazardsOnRoute(route, reports, 0.85);
      setOnRouteHazards(hazards);
      setShowRouteHazardsPanel(true);
      setIsRouteHUDMinimized(true);

      speakRouteWarning(route, hazards);
    } catch (err) {
      console.error('Failed to compute route:', err);
      alert('Could not compute driving route. Please check connection and try again.');
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const handleFitRoute = () => {
    if (!mapInstanceRef.current || !activeRoute || !activeRoute.geometry || activeRoute.geometry.length < 2) return;
    try {
      const routeLine = L.polyline(activeRoute.geometry);
      mapInstanceRef.current.fitBounds(routeLine.getBounds(), { padding: [40, 40], maxZoom: 15 });
    } catch (e) {}
  };

  const handleClearRoute = () => {
    stopRouteVoice();
    setActiveRoute(null);
    setOnRouteHazards([]);
    if (routeLayerGroupRef.current) {
      routeLayerGroupRef.current.clearLayers();
    }
  };

  const handleFocusHazardOnMap = (hazard: OnRouteHazard) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([hazard.report.latitude, hazard.report.longitude], 15, {
      duration: 1.2
    });
  };

  // Keyboard Escape listener to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // When fullscreen changes, trigger map invalidateSize to prevent any rendering tiles mismatch
  useEffect(() => {
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.invalidateSize();
      } catch (e) {}
    }
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.invalidateSize();
        } catch (e) {}
      }
    }, 100);
    const timer2 = setTimeout(() => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.invalidateSize();
        } catch (e) {}
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [isFullscreen]);

  // Auto-detect user region on map mount
  useEffect(() => {
    let isMounted = true;
    const initMapRegion = async () => {
      const savedCityName = localStorage.getItem('livetraffic_selected_city');
      const saved = getSavedRegion();
      if (savedCityName) {
        const found = CITY_OPTIONS.find(c => c.name.toLowerCase() === savedCityName.toLowerCase());
        if (found) setSelectedCity(found);
      } else if (saved && saved !== 'all') {
        const matchingCity = CITY_OPTIONS.find(c => c.provinceKey === saved);
        if (matchingCity) {
          setSelectedCity(matchingCity);
        }
      }

      setIsDetectingMapRegion(true);
      try {
        const detected = await autoDetectUserRegion();
        if (isMounted && detected && detected.regionId) {
          setDetectedMapRegion(detected.regionId);
          if (detected.coords) {
            saveLastKnownUserPosition(detected.coords.lat, detected.coords.lng);
            const closest = findClosestCityOption(detected.coords.lat, detected.coords.lng);
            setSelectedCity(closest);
            try {
              localStorage.setItem('livetraffic_selected_city', closest.name);
            } catch (e) {}

            if (mapInstanceRef.current) {
              renderOrUpdateUserMarker(mapInstanceRef.current, detected.coords.lat, detected.coords.lng);
              if (!hasCenteredToLiveUserRef.current) {
                hasCenteredToLiveUserRef.current = true;
                try {
                  mapInstanceRef.current.flyTo([detected.coords.lat, detected.coords.lng], 14, {
                    duration: 1.2,
                    easeLinearity: 0.25
                  });
                } catch (e) {
                  try {
                    mapInstanceRef.current.setView([detected.coords.lat, detected.coords.lng], 14);
                  } catch (err) {}
                }
              }
            }
          } else if (!savedCityName && (!saved || saved === 'all')) {
            const match = CITY_OPTIONS.find(c => c.provinceKey === detected.regionId);
            if (match) {
              setSelectedCity(match);
              if (mapInstanceRef.current && !hasCenteredToLiveUserRef.current && !getLastKnownUserPosition()) {
                mapInstanceRef.current.flyTo([match.lat, match.lng], match.zoom, {
                  duration: 1.5,
                  easeLinearity: 0.25
                });
              }
            }
          }
        }
      } catch (err) {
        console.warn('Map auto-detect region error:', err);
      } finally {
        if (isMounted) setIsDetectingMapRegion(false);
      }
    };

    initMapRegion();
    return () => { isMounted = false; };
  }, []);

  const handleManualMapAutoDetect = async () => {
    setIsDetectingMapRegion(true);
    try {
      const detected = await autoDetectUserRegion();
      if (detected) {
        if (detected.coords) {
          const closest = findClosestCityOption(detected.coords.lat, detected.coords.lng);
          handleSelectCity(closest);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([detected.coords.lat, detected.coords.lng], 15, { duration: 1.2 });
            renderOrUpdateUserMarker(mapInstanceRef.current, detected.coords.lat, detected.coords.lng);
          }
        } else if (detected.regionId && detected.regionId !== 'all') {
          setDetectedMapRegion(detected.regionId);
          saveSelectedRegion(detected.regionId);
          const match = CITY_OPTIONS.find(c => c.provinceKey === detected.regionId);
          if (match) {
            handleSelectCity(match);
          }
        }
      }
    } catch (err) {
      console.warn('Manual map auto-detect failed:', err);
    } finally {
      setIsDetectingMapRegion(false);
    }
  };

  const handleSelectCity = (city: CityOption) => {
    setSelectedCity(city);
    try {
      localStorage.setItem('livetraffic_selected_city', city.name);
    } catch (e) {}
    if (city.provinceKey) {
      saveSelectedRegion(city.provinceKey);
    }
    setOpenDropdown(null);

    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.flyTo([city.lat, city.lng], city.zoom, {
          duration: 1.5,
          easeLinearity: 0.25
        });
      } catch (e) {
        console.error("Map pan error:", e);
      }
    }

    fetchCitySummary(city);
  };

  const handleSelectBottleneck = (lat: number, lng: number, name: string) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 14, {
        duration: 1.2,
        easeLinearity: 0.25,
      });
      setQuickToast({ message: `Focused corridor bottleneck: ${name}` });
      setTimeout(() => setQuickToast(null), 3500);
    }
  };

  const fetchCitySummary = async (city: CityOption) => {
    setIsLoadingSummary(true);
    setShowSummaryPanel(true);
    setSummaryTitle(`${city.name} 30-Min Report`);

    try {
      const res = await fetch('/api/city-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cityName: city.name,
          lat: city.lat,
          lng: city.lng
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCitySummary(data.summary);
      } else {
        throw new Error('Server returned ' + res.status);
      }
    } catch (error) {
      console.warn("Falling back to client-side city summary:", error);
      const cityLower = city.name.toLowerCase();
      const approved = reports.filter(r => r.status === 'approved' || r.status === 'pending' || r.status === 'resolved');
      const cityReports = approved.filter(r => {
        const locMatch = ((r.locationName || '') + ' ' + (r.roadName || '') + ' ' + (r.description || '') + ' ' + (r.title || '')).toLowerCase().includes(cityLower);
        if (locMatch) return true;
        if (typeof r.latitude === 'number' && typeof r.longitude === 'number' && !isNaN(r.latitude) && !isNaN(r.longitude)) {
          const dLat = Math.abs(r.latitude - city.lat);
          const dLng = Math.abs(r.longitude - city.lng);
          return dLat < 0.28 && dLng < 0.28;
        }
        return false;
      });

      const fallbackText = `🚦 30-MINUTE TRAFFIC & SAFETY SUMMARY FOR ${city.name.toUpperCase()}
Generated: ${new Date().toLocaleTimeString()} (Live NPC Intelligence)

1. 🚦 OVERALL CORRIDOR RISK
Risk Level: ${cityReports.length > 2 ? 'HIGH' : cityReports.length > 0 ? 'MODERATE' : 'LOW'}
Monitoring ${cityReports.length} verified active hazard report(s) in the ${city.name} area.

2. 🚨 ACTIVE HAZARDS & SPIKE TRAP ALERTS
${cityReports.length > 0 
  ? cityReports.map(r => `• [${r.severity.toUpperCase()}] ${r.title} @ ${r.locationName} (${r.roadName}): ${r.description}`).join('\n')
  : `✅ No critical spike traps or severe road hazard blockades reported in ${city.name} in the last 30 minutes.`}

3. ⏱️ 30-MINUTE TRAVEL DELAY ESTIMATE
Primary arterials operating with ${cityReports.length > 1 ? '10-20 min minor traffic delays' : '0-5 min minimal delays'}.

4. 🛡️ ACTIONABLE DRIVER ADVICE
• Keep doors locked and maintain safe follow distance on primary routes through ${city.name}.
• Activate live audio warnings on LiveTrafficNPC map while driving.`;

      setCitySummary(fallbackText);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const fetchViewportSummary = async () => {
    setIsLoadingSummary(true);
    setShowSummaryPanel(true);
    setSummaryTitle('Current Map View Bulletin');

    let bounds: any = null;
    let center: any = null;
    let zoom = 12;

    if (mapInstanceRef.current) {
      try {
        const b = mapInstanceRef.current.getBounds();
        bounds = {
          south: b.getSouth(),
          north: b.getNorth(),
          west: b.getWest(),
          east: b.getEast()
        };
        const c = mapInstanceRef.current.getCenter();
        center = { lat: c.lat, lng: c.lng };
        zoom = mapInstanceRef.current.getZoom();
      } catch (e) {
        console.warn("Could not get map bounds:", e);
      }
    }

    try {
      const res = await fetch('/api/viewport-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bounds,
          center,
          zoom,
          activeTileProvider: mapProvider === 'google_traffic' ? 'Google Live Traffic' : mapProvider === 'google_sat_traffic' ? 'Google Satellite Traffic' : mapProvider === 'carto_dark' ? 'Dark Mode Map' : 'OpenStreetMap'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCitySummary(data.summary);
      } else {
        throw new Error('Server returned ' + res.status);
      }
    } catch (error) {
      console.warn("Fallback to client viewport summary:", error);
      const approved = reports.filter(r => r.status === 'approved' || r.status === 'pending' || r.status === 'resolved');
      let visible = approved;
      if (bounds) {
        visible = approved.filter(r => typeof r.latitude === 'number' && typeof r.longitude === 'number' && !isNaN(r.latitude) && !isNaN(r.longitude) && r.latitude >= bounds.south && r.latitude <= bounds.north && r.longitude >= bounds.west && r.longitude <= bounds.east);
      }

      const fallbackText = `🔴 LIVE MAP VIEWPORT TRAFFIC & RED ZONE BULLETIN
Generated: ${new Date().toLocaleTimeString()} (Active Map Frame Analysis)

1. 🛑 RED TRAFFIC CONGESTION & BOTTLENECKS
• Red traffic congestion lines visible in this viewport reflect localized traffic bottlenecks and high-density corridor slowdowns.
• Drive cautiously along major arterial intersections visible in this frame.

2. ⚠️ SPIKE TRAPS & HIGH-RISK ZONES IN VIEW
${visible.length > 0 
  ? visible.map(r => `• [${r.severity.toUpperCase()}] ${r.title} @ ${r.locationName} (${r.roadName}): ${r.description}`).join('\n')
  : `✅ No verified community spike trap markers in this immediate visible map frame.`}

3. ⏱️ REAL-TIME DELAY ESTIMATE
Estimated travel delay for visible roads in view: ${visible.length > 1 ? '10-20 minutes' : '2-8 minutes'}.

4. 🛡️ RECOMMENDED ALTERNATE ROUTES & SAFEST DRIVING INSTRUCTIONS
• Use Google Live Traffic overlay to bypass heavy red traffic congestion points.
• Stay alert for stationary or unlit vehicles on shoulder lanes.`;

      setCitySummary(fallbackText);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') return;
    try {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else if (citySummary) {
        const cleanText = citySummary.replace(/[*#_]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.warn('Speech synthesis toggle error:', err);
      setIsSpeaking(false);
    }
  };

  const handleCopySummary = () => {
    if (citySummary) {
      navigator.clipboard.writeText(citySummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getTileConfig = (provider: MapProvider) => {
    switch (provider) {
      case 'google_traffic':
        return {
          url: 'https://{s}.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}',
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          attribution: '&copy; Google Maps Live Traffic',
          maxZoom: 20,
        };
      case 'google_sat_traffic':
        return {
          url: 'https://{s}.google.com/vt/lyrs=s,traffic&x={x}&y={y}&z={z}',
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          attribution: '&copy; Google Maps Satellite + Traffic',
          maxZoom: 20,
        };
      case 'google_roadmap':
        return {
          url: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          attribution: '&copy; Google Maps Standard Roadmap',
          maxZoom: 20,
        };
      case 'google_terrain':
        return {
          url: 'https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          attribution: '&copy; Google Maps Topo Terrain',
          maxZoom: 20,
        };
      case 'esri_streets':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
          subdomains: [],
          attribution: 'Tiles &copy; Esri &mdash; High-Precision World Street Map',
          maxZoom: 19,
        };
      case 'esri_imagery':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          subdomains: [],
          attribution: 'Tiles &copy; Esri &mdash; High-Resolution Satellite Imagery',
          maxZoom: 19,
        };
      case 'osm_hot':
        return {
          url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
          subdomains: ['a', 'b', 'c'],
          attribution: '&copy; OpenStreetMap contributors, Humanitarian style',
          maxZoom: 19,
        };
      case 'carto_light':
        return {
          url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
          subdomains: ['a', 'b', 'c', 'd'],
          attribution: '&copy; CARTO &copy; OpenStreetMap',
          maxZoom: 20,
        };
      case 'carto_dark':
        return {
          url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          subdomains: ['a', 'b', 'c', 'd'],
          attribution: '&copy; CARTO &copy; OpenStreetMap',
          maxZoom: 20,
        };
      case 'osm':
      default:
        return {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          subdomains: ['a', 'b', 'c'],
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        };
    }
  };

  const createUserLocationIcon = () => {
    return L.divIcon({
      className: 'custom-user-location-marker',
      html: `
        <div class="relative flex items-center justify-center w-7 h-7">
          <span class="absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75 animate-ping"></span>
          <span class="relative inline-flex rounded-full h-4 w-4 bg-sky-500 border-2 border-white shadow-xl"></span>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  };

  const renderOrUpdateUserMarker = (map: L.Map, latitude: number, longitude: number) => {
    if (!map) return;
    saveLastKnownUserPosition(latitude, longitude);

    if (userLocationMarkerRef.current) {
      try {
        userLocationMarkerRef.current.setLatLng([latitude, longitude]);
        userLocationMarkerRef.current.setPopupContent(`
          <div class="p-1 text-center font-sans">
            <div class="font-bold text-xs text-sky-900">📍 You Are Here</div>
            <div class="text-[10px] text-slate-600 mt-0.5">${latitude.toFixed(4)}, ${longitude.toFixed(4)}</div>
          </div>
        `);
      } catch (e) {
        userLocationMarkerRef.current = null;
      }
    }

    if (!userLocationMarkerRef.current) {
      try {
        const marker = L.marker([latitude, longitude], {
          icon: createUserLocationIcon(),
          title: 'Your Current Location',
          zIndexOffset: 1000,
        }).bindPopup(`
          <div class="p-1 text-center font-sans">
            <div class="font-bold text-xs text-sky-900">📍 You Are Here</div>
            <div class="text-[10px] text-slate-600 mt-0.5">${latitude.toFixed(4)}, ${longitude.toFixed(4)}</div>
          </div>
        `);
        marker.addTo(map);
        userLocationMarkerRef.current = marker;
      } catch (e) {
        console.warn('Error creating user location marker:', e);
      }
    }
  };

  const locateUserPosition = (map: L.Map, shouldSetView = true, isManualTrigger = false) => {
    if (!map) return;
    setIsLocatingUser(true);

    // 1. Immediately render and center on cached position if available so there is no delay
    const cached = getLastKnownUserPosition();
    if (cached) {
      renderOrUpdateUserMarker(map, cached.latitude, cached.longitude);
      if (shouldSetView && !hasCenteredToLiveUserRef.current) {
        try {
          map.setView([cached.latitude, cached.longitude], 14);
        } catch (e) {}
      }
    }

    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setIsLocatingUser(false);
      return;
    }

    let positionHandled = false;

    const handlePositionSuccess = (pos: GeolocationPosition, isFallback = false) => {
      if (!mapInstanceRef.current || mapInstanceRef.current !== map) return;
      const { latitude, longitude, accuracy } = pos.coords;
      positionHandled = true;
      setIsLocatingUser(false);
      setHasLocatedGPS(true);

      renderOrUpdateUserMarker(map, latitude, longitude);
      saveLastKnownUserPosition(latitude, longitude, accuracy);

      const closest = findClosestCityOption(latitude, longitude);
      setSelectedCity(closest);
      try {
        localStorage.setItem('livetraffic_selected_city', closest.name);
      } catch (e) {}
      if (closest.provinceKey) {
        setDetectedMapRegion(closest.provinceKey);
        saveSelectedRegion(closest.provinceKey);
      }

      if (shouldSetView || !hasCenteredToLiveUserRef.current) {
        hasCenteredToLiveUserRef.current = true;
        try {
          const targetZoom = isManualTrigger ? Math.max(map.getZoom() || 15, 15) : 14;
          map.flyTo([latitude, longitude], targetZoom, {
            duration: 1.2,
            easeLinearity: 0.25
          });
        } catch (e) {
          try {
            map.setView([latitude, longitude], 15);
          } catch (err) {}
        }
      }

      if (isManualTrigger) {
        autoRecenterRef.current = true;
        setAutoRecenter(true);
        setQuickToast({ message: `📍 GPS Centered & Auto-Recenter ON (${latitude.toFixed(4)}, ${longitude.toFixed(4)})` });
        setTimeout(() => setQuickToast(null), 3000);
      }
    };

    // 2. High-accuracy immediate fetch with 10s timeout for Android GPS chip lock
    navigator.geolocation.getCurrentPosition(
      (pos) => handlePositionSuccess(pos, false),
      (err) => {
        const isPermissionBlocked = err?.code === 1 || (err?.message || '').toLowerCase().includes('permission') || (err?.message || '').toLowerCase().includes('policy');
        console.warn('GPS auto-locate notice:', err?.message || 'GPS fallback');

        if (isPermissionBlocked) {
          setIsLocatingUser(false);
          const existingCache = getLastKnownUserPosition();
          if (existingCache && mapInstanceRef.current === map) {
            renderOrUpdateUserMarker(map, existingCache.latitude, existingCache.longitude);
            if (isManualTrigger) {
              map.flyTo([existingCache.latitude, existingCache.longitude], 14, { duration: 0.8 });
              setQuickToast({ message: '📍 Centered on last verified location' });
              setTimeout(() => setQuickToast(null), 3500);
            }
          } else if (isManualTrigger) {
            setQuickToast({ message: '📍 GPS permission not enabled — tap anywhere on the map to place a pin' });
            setTimeout(() => setQuickToast(null), 4000);
          }
          return;
        }

        // 3. Fallback to network geolocation (Cell Tower / Wi-Fi)
        navigator.geolocation.getCurrentPosition(
          (fallbackPos) => handlePositionSuccess(fallbackPos, true),
          async (fallbackErr) => {
            console.warn('Fallback geolocation notice:', fallbackErr.message);
            
            // Try IP-based location fallback before showing toast
            try {
              const controller = new AbortController();
              const timer = setTimeout(() => controller.abort(), 2500);
              const res = await fetch('/api/user-ip-location', { signal: controller.signal });
              clearTimeout(timer);
              if (res.ok) {
                const ipData = await res.json();
                if (ipData && typeof ipData.lat === 'number' && typeof ipData.lng === 'number' && mapInstanceRef.current === map) {
                  setIsLocatingUser(false);
                  renderOrUpdateUserMarker(map, ipData.lat, ipData.lng);
                  const closest = findClosestCityOption(ipData.lat, ipData.lng);
                  setSelectedCity(closest);
                  try {
                    localStorage.setItem('livetraffic_selected_city', closest.name);
                  } catch (e) {}
                  if (shouldSetView) {
                    map.flyTo([ipData.lat, ipData.lng], 13, { duration: 1.2 });
                  }
                  if (isManualTrigger) {
                    setQuickToast({ message: `📍 Positioned near ${ipData.city || closest.name} (via Network IP)` });
                    setTimeout(() => setQuickToast(null), 3500);
                  }
                  return;
                }
              }
            } catch (e) {}

            setIsLocatingUser(false);
            // Ensure cached marker remains rendered even if all network geo attempts fail
            const existingCache = getLastKnownUserPosition();
            if (existingCache && mapInstanceRef.current === map) {
              renderOrUpdateUserMarker(map, existingCache.latitude, existingCache.longitude);
            }
            if (isManualTrigger) {
              const errMsg = (fallbackErr?.message || '').toLowerCase();
              if (errMsg.includes('permissions policy') || errMsg.includes('permission') || errMsg.includes('disabled')) {
                setQuickToast({ message: '📍 Device GPS permission disabled — tap on the map to place location pin' });
              } else {
                setQuickToast({ message: '📍 GPS unavailable — tap on the map to place location pin' });
              }
              setTimeout(() => setQuickToast(null), 4000);
            }
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // Location-aware map pinning: when on map, pin where the user is on the map!
  const pinUserLocationOnMap = async (coords?: { lat: number; lng: number }, openQuickReport = false) => {
    closeDropdowns();
    setPinModeActive(false);
    if (openQuickReport) {
      setShowQuickReportModal(true);
    } else {
      setShowQuickReportModal(false);
    }

    if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number') {
      const cleanLat = Number(coords.lat.toFixed(6));
      const cleanLng = Number(coords.lng.toFixed(6));
      setPinnedCoords({ lat: cleanLat, lng: cleanLng });
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([cleanLat, cleanLng], 16, { duration: 0.8 });
      }
      if (openQuickReport) {
        setShowQuickReportModal(true);
      }
      return;
    }

    let targetLat: number | null = null;
    let targetLng: number | null = null;

    // 1. Check if user marker is currently placed on map
    if (userLocationMarkerRef.current) {
      try {
        const markerPos = userLocationMarkerRef.current.getLatLng();
        if (markerPos && typeof markerPos.lat === 'number' && typeof markerPos.lng === 'number') {
          targetLat = Number(markerPos.lat.toFixed(6));
          targetLng = Number(markerPos.lng.toFixed(6));
        }
      } catch (err) {}
    }

    // 2. Check cached verified GPS position
    if (targetLat === null || targetLng === null) {
      const cached = getLastKnownUserPosition();
      if (cached && typeof cached.latitude === 'number' && typeof cached.longitude === 'number') {
        targetLat = Number(cached.latitude.toFixed(6));
        targetLng = Number(cached.longitude.toFixed(6));
      }
    }

    // 3. If immediate location exists, drop pin and fly without delay (<1ms response)
    if (targetLat !== null && targetLng !== null) {
      setPinnedCoords({ lat: targetLat, lng: targetLng });
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([targetLat, targetLng], 16, { duration: 0.8 });
      }
      setQuickToast({ message: '📍 Pinned to your verified location' });
      setTimeout(() => setQuickToast(null), 3500);
      if (openQuickReport) {
        setShowQuickReportModal(true);
      }
    } else {
      // Announce GPS acquisition in progress
      setQuickToast({ message: '📍 Acquiring device GPS location...' });
      setTimeout(() => setQuickToast(null), 3000);
    }

    // 4. Concurrently request high-accuracy GPS hardware fix to verify/refine position
    try {
      const freshGps = await getExactDeviceGps({ timeout: 12000 });
      if (freshGps) {
        const freshLat = Number(freshGps.latitude.toFixed(6));
        const freshLng = Number(freshGps.longitude.toFixed(6));
        setPinnedCoords({ lat: freshLat, lng: freshLng });
        saveLastKnownUserPosition(freshLat, freshLng, freshGps.accuracy);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([freshLat, freshLng], 16, { duration: 0.8 });
          renderOrUpdateUserMarker(mapInstanceRef.current, freshLat, freshLng);
        }
        setQuickToast({ message: '📍 Pinned to your verified GPS location' });
        setTimeout(() => setQuickToast(null), 3500);
        if (openQuickReport) {
          setShowQuickReportModal(true);
        }
        return;
      }
    } catch (err) {
      console.debug('Device GPS acquisition error during pin:', err);
    }

    // 5. If no GPS at all (e.g. permission blocked in browser), drop pin at current map center
    if (targetLat === null || targetLng === null) {
      if (mapInstanceRef.current) {
        const center = mapInstanceRef.current.getCenter();
        const centerLat = Number(center.lat.toFixed(6));
        const centerLng = Number(center.lng.toFixed(6));
        setPinnedCoords({ lat: centerLat, lng: centerLng });
        setQuickToast({ message: '📍 GPS unavailable: Pinned to map center (drag pin to adjust)' });
        setTimeout(() => setQuickToast(null), 4000);
        if (openQuickReport) {
          setShowQuickReportModal(true);
        }
      }
    }
  };

  // Listen for drop-pin or quick-report triggers from App bar / VoiceAssistantHUD / voice commands
  useEffect(() => {
    const handleTriggerDropPin = (e: any) => {
      closeDropdowns();
      const shouldOpenReport = e?.detail?.openQuickReport ?? true;
      if (e?.detail?.coords) {
        pinUserLocationOnMap(e.detail.coords, shouldOpenReport);
      } else {
        pinUserLocationOnMap(undefined, shouldOpenReport);
      }
    };
    window.addEventListener('livetraffic:open-drop-pin', handleTriggerDropPin);
    window.addEventListener('livetraffic:open-quick-report', handleTriggerDropPin);
    return () => {
      window.removeEventListener('livetraffic:open-drop-pin', handleTriggerDropPin);
      window.removeEventListener('livetraffic:open-quick-report', handleTriggerDropPin);
    };
  }, []);


  // Initialize Map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    if ((container as any)._leaflet_id) {
      delete (container as any)._leaflet_id;
    }

    let map: L.Map | null = null;
    let resizeObserver: ResizeObserver | null = null;

    try {
      const initialPos = getLastKnownUserPosition();
      const defaultCenter: [number, number] = initialPos 
        ? [initialPos.latitude, initialPos.longitude] 
        : [-25.7600904, 28.2462372];
      const initialZoom = initialPos ? 14 : 12;

      map = L.map(container, {
        center: defaultCenter,
        zoom: initialZoom,
        zoomControl: false,
      });

      const initialConfig = getTileConfig(mapProvider);
      const initialLayer = L.tileLayer(initialConfig.url, {
        attribution: initialConfig.attribution,
        subdomains: initialConfig.subdomains,
        maxZoom: 20,
      }).addTo(map);

      tileLayerRef.current = initialLayer;

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
      markersGroupRef.current = L.layerGroup().addTo(map);
      routeLayerGroupRef.current = L.layerGroup().addTo(map);
      tripBuddyLayerGroupRef.current = L.layerGroup().addTo(map);
      trafficTrendLayerGroupRef.current = L.layerGroup().addTo(map);
      pinnedLayerGroupRef.current = L.layerGroup().addTo(map);

      // Immediately render cached marker on initial mount if available (instant restore)
      if (initialPos) {
        renderOrUpdateUserMarker(map, initialPos.latitude, initialPos.longitude);
      }

      // Start continuous watchPosition so the marker tracks accurately and auto-recenters as user moves
      if ('geolocation' in navigator) {
        try {
          const watchId = navigator.geolocation.watchPosition(
            (pos) => {
              if (!mapInstanceRef.current || mapInstanceRef.current !== map) return;
              const { latitude, longitude, accuracy } = pos.coords;
              renderOrUpdateUserMarker(map, latitude, longitude);
              saveLastKnownUserPosition(latitude, longitude, accuracy);

              // Auto-recenter map as the user moves
              if (autoRecenterRef.current) {
                hasCenteredToLiveUserRef.current = true;
                try {
                  const currentZoom = map.getZoom() || 15;
                  map.panTo([latitude, longitude], {
                    animate: true,
                    duration: 0.8,
                    easeLinearity: 0.25
                  });
                } catch (e) {
                  try {
                    map.setView([latitude, longitude], map.getZoom() || 15);
                  } catch (err) {}
                }
              } else if (!hasCenteredToLiveUserRef.current) {
                hasCenteredToLiveUserRef.current = true;
                try {
                  map.setView([latitude, longitude], 14);
                } catch (e) {}
              }
            },
            (err) => {
              // Silently ignore watch jitter
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
          );
          watchIdRef.current = watchId;
        } catch (e) {
          console.warn('Geolocation watch start notice:', e);
        }
      }

      // If user manually drags/pans the map to explore hazards elsewhere, pause auto-recenter
      map.on('dragstart', () => {
        if (autoRecenterRef.current) {
          autoRecenterRef.current = false;
          setAutoRecenter(false);
        }
      });

      // 1. Trigger immediate location centering
      locateUserPosition(map, true);

      // Listen for parent window GPS bridge messages & user-position updates
      const handleGpsBridgeMessage = (event: MessageEvent) => {
        try {
          const data = event.data;
          if (data && (data.type === 'LIVETRAFFIC_PARENT_GPS' || data.type === 'LIVETRAFFIC_GPS_RESPONSE') && typeof data.lat === 'number' && typeof data.lng === 'number') {
            if (!mapInstanceRef.current || mapInstanceRef.current !== map) return;
            const { lat, lng, accuracy } = data;
            renderOrUpdateUserMarker(map, lat, lng);
            saveLastKnownUserPosition(lat, lng, accuracy || 15);
            const closest = findClosestCityOption(lat, lng);
            setSelectedCity(closest);
            try {
              localStorage.setItem('livetraffic_selected_city', closest.name);
            } catch (e) {}

            if (autoRecenterRef.current || !hasCenteredToLiveUserRef.current) {
              hasCenteredToLiveUserRef.current = true;
              try {
                map.panTo([lat, lng], { animate: true, duration: 0.8 });
              } catch (e) {
                try {
                  map.setView([lat, lng], map.getZoom() || 15);
                } catch (err) {}
              }
            }
          }
        } catch (e) {}
      };

      const handleUserPosEvent = (e: Event) => {
        try {
          const customEvt = e as CustomEvent<{ latitude: number; longitude: number; accuracy?: number }>;
          if (customEvt.detail && typeof customEvt.detail.latitude === 'number' && typeof customEvt.detail.longitude === 'number') {
            if (!mapInstanceRef.current || mapInstanceRef.current !== map) return;
            renderOrUpdateUserMarker(map, customEvt.detail.latitude, customEvt.detail.longitude);
            const closest = findClosestCityOption(customEvt.detail.latitude, customEvt.detail.longitude);
            setSelectedCity(closest);
          }
        } catch (err) {}
      };

      window.addEventListener('message', handleGpsBridgeMessage);
      window.addEventListener('livetraffic:user-position-updated', handleUserPosEvent);

      // 2. Setup ResizeObserver for Android container / 100dvh responsiveness
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          if (mapInstanceRef.current === map && map) {
            try {
              map.invalidateSize();
            } catch (e) {}
          }
        });
        resizeObserver.observe(container);
      }

      // 3. Staggered invalidation & location verification for mobile Android webview layout passes
      const timer1 = setTimeout(() => {
        if (mapInstanceRef.current === map && map) {
          try {
            map.invalidateSize();
            if (!hasCenteredToLiveUserRef.current) {
              locateUserPosition(map, true);
            }
          } catch (e) {}
        }
      }, 100);

      const timer2 = setTimeout(() => {
        if (mapInstanceRef.current === map && map) {
          try {
            map.invalidateSize();
          } catch (e) {}
        }
      }, 400);

      const timer3 = setTimeout(() => {
        if (mapInstanceRef.current === map && map) {
          try {
            map.invalidateSize();
          } catch (e) {}
        }
      }, 1000);

      return () => {
        window.removeEventListener('message', handleGpsBridgeMessage);
        window.removeEventListener('livetraffic:user-position-updated', handleUserPosEvent);
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        if (map) {
          try {
            map.closePopup();
            map.off();
            map.remove();
          } catch (e) {
            console.warn('Leaflet cleanup notice:', e);
          }
        }
        mapInstanceRef.current = null;
        markersGroupRef.current = null;
        routeLayerGroupRef.current = null;
        tripBuddyLayerGroupRef.current = null;
        trafficTrendLayerGroupRef.current = null;
        pinnedLayerGroupRef.current = null;
        tileLayerRef.current = null;
        userLocationMarkerRef.current = null;
        if (container) {
          delete (container as any)._leaflet_id;
        }
      };
    } catch (err) {
      console.warn('Error initializing Leaflet map:', err);
    }
  }, []);

  // Change Tile Layer when mapProvider changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      try {
        map.removeLayer(tileLayerRef.current);
      } catch (e) {
        // ignore
      }
    }

    const config = getTileConfig(mapProvider);
    const newLayer = L.tileLayer(config.url, {
      attribution: config.attribution,
      subdomains: config.subdomains,
      maxZoom: 20,
    }).addTo(map);

    tileLayerRef.current = newLayer;
  }, [mapProvider]);

  // Draw Pinned Spot marker and pulse radius on map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const pinnedGroup = pinnedLayerGroupRef.current;
    if (!map || !pinnedGroup) return;

    pinnedGroup.clearLayers();

    if (!pinnedCoords) return;

    const pinnedDivIcon = L.divIcon({
      className: 'custom-pinned-location-marker',
      html: `
        <div style="position: relative; width: 40px; height: 52px; display: flex; flex-direction: column; align-items: center; cursor: grab;">
          <!-- Pin ground radar pulse -->
          <div style="position: absolute; bottom: 0; left: 50%; transform: translate(-50%, 50%); width: 26px; height: 26px; border-radius: 9999px; background-color: rgba(245, 158, 11, 0.45); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; pointer-events: none;"></div>
          <!-- Label -->
          <div style="background-color: #050608; color: #fbbf24; border: 1.5px solid #fbbf24; border-radius: 9999px; font-size: 8px; font-weight: 900; padding: 1.5px 6px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.6); white-space: nowrap; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.05em; z-index: 2;">
            📍 PINNED SPOT
          </div>
          <!-- Pin Circle -->
          <div style="width: 32px; height: 32px; border-radius: 9999px; background: linear-gradient(135deg, #f59e0b, #d97706); border: 2.5px solid #ffffff; box-shadow: 0 6px 14px rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; font-size: 16px; z-index: 2;">
            📍
          </div>
          <!-- Pointer Tip -->
          <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 9px solid #d97706; margin-top: -3px; z-index: 1;"></div>
          <!-- Ground Target Dot -->
          <div style="position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 6px; height: 4px; border-radius: 9999px; background: rgba(0, 0, 0, 0.85); z-index: 3;"></div>
        </div>
      `,
      iconSize: [40, 52],
      iconAnchor: [20, 52],
    });

    const marker = L.marker([pinnedCoords.lat, pinnedCoords.lng], {
      icon: pinnedDivIcon,
      draggable: true,
      zIndexOffset: 3000,
    });

    const circle = L.circle([pinnedCoords.lat, pinnedCoords.lng], {
      radius: 35,
      color: '#f59e0b',
      fillColor: '#fbbf24',
      fillOpacity: 0.25,
      weight: 1.5,
    }).addTo(pinnedGroup);

    marker.on('drag', (e: any) => {
      const pos = e.target.getLatLng();
      circle.setLatLng(pos);
    });

    marker.on('dragend', (e: any) => {
      const newPos = e.target.getLatLng();
      const cleanLat = Number(newPos.lat.toFixed(6));
      const cleanLng = Number(newPos.lng.toFixed(6));
      setPinnedCoords({ lat: cleanLat, lng: cleanLng });
    });

    marker.addTo(pinnedGroup);
  }, [pinnedCoords]);

  // Handle responsive map click & tap-to-pin events
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const cleanLat = Number(e.latlng.lat.toFixed(6));
      const cleanLng = Number(e.latlng.lng.toFixed(6));
      if (pinModeActive) {
        setPinnedCoords({ lat: cleanLat, lng: cleanLng });
        setPinModeActive(false);
      } else if (pinnedCoords) {
        // If pin already placed, tap moves pin to new spot
        setPinnedCoords({ lat: cleanLat, lng: cleanLng });
      }
    };

    const handleContextMenu = (e: L.LeafletMouseEvent) => {
      // Long-press on mobile touch or right-click drops pin instantly
      e.originalEvent?.preventDefault();
      const cleanLat = Number(e.latlng.lat.toFixed(6));
      const cleanLng = Number(e.latlng.lng.toFixed(6));
      setPinnedCoords({ lat: cleanLat, lng: cleanLng });
      setPinModeActive(false);
    };

    map.on('click', handleMapClick);
    map.on('contextmenu', handleContextMenu);

    const container = map.getContainer();
    if (container) {
      container.style.cursor = pinModeActive ? 'crosshair' : '';
    }

    return () => {
      map.off('click', handleMapClick);
      map.off('contextmenu', handleContextMenu);
      if (container) {
        container.style.cursor = '';
      }
    };
  }, [pinModeActive, pinnedCoords]);

  // Draw Navigation Route Polyline and On-Route Hazards
  useEffect(() => {
    const map = mapInstanceRef.current;
    const routeGroup = routeLayerGroupRef.current;
    if (!map || !routeGroup) return;

    try {
      routeGroup.clearLayers();
    } catch (e) {
      console.warn('Error clearing route layers:', e);
    }

    if (!activeRoute || !activeRoute.geometry || activeRoute.geometry.length < 2) {
      return;
    }

    // 1. Draw outer boundary casing for polyline
    const outline = L.polyline(activeRoute.geometry, {
      color: '#0f172a',
      weight: 9,
      opacity: 0.85,
      lineCap: 'round',
      lineJoin: 'round'
    });
    outline.addTo(routeGroup);

    // 2. Draw inner primary navigation polyline
    const routeLine = L.polyline(activeRoute.geometry, {
      color: '#0284c7', // Sky-600 vibrant route
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    });
    routeLine.addTo(routeGroup);

    // 3. Start Point Icon (A)
    const startIcon = L.divIcon({
      className: 'custom-start-marker',
      html: `
        <div class="flex items-center justify-center w-8 h-8 bg-emerald-500 text-slate-950 font-black rounded-full border-2 border-white shadow-2xl text-xs">
          <span>A</span>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    L.marker([activeRoute.start.lat, activeRoute.start.lng], {
      icon: startIcon,
      zIndexOffset: 1200,
      title: `Start: ${activeRoute.start.name || 'Origin'}`
    }).bindPopup(`<b>Start Point</b><br/>${activeRoute.start.name || 'Current Position'}`).addTo(routeGroup);

    // 4. Destination Point Icon (B / Flag)
    const destIcon = L.divIcon({
      className: 'custom-dest-marker',
      html: `
        <div class="flex items-center justify-center w-9 h-9 bg-amber-500 text-slate-950 font-black rounded-2xl border-2 border-white shadow-2xl text-sm">
          <span>🏁</span>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
    L.marker([activeRoute.destination.lat, activeRoute.destination.lng], {
      icon: destIcon,
      zIndexOffset: 1250,
      title: `Destination: ${activeRoute.destination.name}`
    }).bindPopup(`<b>Destination</b><br/>${activeRoute.destination.name}<br/>${activeRoute.distanceKm} km • ~${activeRoute.durationMin} min`).addTo(routeGroup);

    // 5. Place On-Route Hazard Markers along the corridor
    onRouteHazards.forEach(hazard => {
      const isSpike = hazard.report.type === 'spiking';
      const isCrash = hazard.report.type === 'crash';
      const isStationary = hazard.report.type === 'stationary';
      const isVeldFire = hazard.report.type === 'veld_fire';
      
      let emoji = '⚠️';
      if (isSpike) emoji = '🚨';
      else if (isCrash) emoji = '💥';
      else if (isStationary) emoji = '🛑';
      else if (isVeldFire) emoji = '🔥';

      const hazardDivIcon = L.divIcon({
        className: 'on-route-hazard-badge',
        html: `
          <div class="relative flex items-center justify-center w-10 h-10 cursor-pointer">
            <span class="absolute inline-flex h-full w-full rounded-full ${isSpike ? 'bg-red-500' : 'bg-amber-500'} opacity-75 animate-ping"></span>
            <div class="relative flex items-center justify-center w-8 h-8 ${isSpike ? 'bg-red-600' : 'bg-amber-600'} text-white rounded-full border-2 border-white shadow-2xl text-sm font-bold">
              ${emoji}
            </div>
            <div class="absolute -bottom-2.5 bg-slate-950 text-amber-300 font-black text-[9px] px-1 py-0.2 rounded border border-amber-400/60 whitespace-nowrap shadow-xl">
              KM ${hazard.distanceFromStartKm}
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const hazardMarker = L.marker([hazard.report.latitude, hazard.report.longitude], {
        icon: hazardDivIcon,
        zIndexOffset: 1300
      }).bindPopup(`
        <div class="p-1 font-sans text-slate-900">
          <div class="font-bold text-red-600 text-xs">${emoji} ON-ROUTE HAZARD (KM ${hazard.distanceFromStartKm})</div>
          <div class="font-extrabold text-sm text-slate-900 mt-0.5">${hazard.report.title}</div>
          <div class="text-xs text-slate-600 mt-1">${hazard.report.description}</div>
          <div class="text-[10px] text-amber-700 font-bold mt-1.5">📍 ${hazard.report.roadName || hazard.report.locationName}</div>
        </div>
      `);
      hazardMarker.addTo(routeGroup);
    });

    try {
      map.fitBounds(routeLine.getBounds(), { padding: [60, 60], maxZoom: 15 });
    } catch (e) {}
  }, [activeRoute, onRouteHazards]);

  // Render Active Trip Buddy Navigation & Moving Motorist Marker on Main Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const tripGroup = tripBuddyLayerGroupRef.current;
    if (!map || !tripGroup) return;

    try {
      tripGroup.clearLayers();
    } catch (e) {
      console.warn('Error clearing trip buddy layer:', e);
    }

    if (!activeTrip || (activeTrip.status !== 'active' && activeTrip.status !== 'emergency')) {
      return;
    }

    const depLat = activeTrip.departureCoords?.lat || -25.7479;
    const depLng = activeTrip.departureCoords?.lng || 28.2293;
    const destLat = activeTrip.destinationCoords?.lat || -23.8319;
    const destLng = activeTrip.destinationCoords?.lng || 30.1611;
    const currentLat = activeTrip.currentLat || depLat;
    const currentLng = activeTrip.currentLng || depLng;
    const isEmergency = activeTrip.status === 'emergency';
    const speed = activeTrip.currentSpeedKmh || 0;

    // 1. Draw glowing active trip route polyline
    const tripRouteLine = L.polyline(
      [
        [depLat, depLng],
        [currentLat, currentLng],
        [destLat, destLng]
      ],
      {
        color: isEmergency ? '#ef4444' : '#06b6d4',
        weight: 6,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: isEmergency ? '8, 8' : undefined
      }
    );
    tripRouteLine.addTo(tripGroup);

    // 2. Start Marker (A / Flag)
    const startIcon = L.divIcon({
      className: 'trip-start-icon',
      html: `
        <div class="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-600 border-2 border-white shadow-lg text-white font-bold text-xs">
          🏁
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    L.marker([depLat, depLng], { icon: startIcon })
      .bindPopup(`<b>Trip Origin:</b> ${activeTrip.departure}`)
      .addTo(tripGroup);

    // 3. Destination Marker (Target)
    const destIcon = L.divIcon({
      className: 'trip-dest-icon',
      html: `
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-rose-600 border-2 border-white shadow-lg text-white font-bold text-xs">
          🎯
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    L.marker([destLat, destLng], { icon: destIcon })
      .bindPopup(`<b>Destination:</b> ${activeTrip.destination}`)
      .addTo(tripGroup);

    // 4. Moving Motorist Vehicle Marker with Pulsing Radar Ping & Speed
    const carIcon = L.divIcon({
      className: 'trip-driver-car-marker',
      html: `
        <div class="relative flex items-center justify-center cursor-pointer">
          <div class="absolute w-12 h-12 rounded-full ${isEmergency ? 'bg-rose-500/40' : 'bg-cyan-500/30'} animate-ping pointer-events-none"></div>
          <div class="relative w-9 h-9 rounded-full ${isEmergency ? 'bg-rose-600 ring-4 ring-rose-400' : 'bg-gradient-to-tr from-cyan-600 to-teal-400 ring-4 ring-cyan-300'} border-2 border-white shadow-2xl flex items-center justify-center text-white text-sm">
            🚗
          </div>
          <div class="absolute -bottom-4 bg-slate-950 text-cyan-300 border border-cyan-500/50 font-mono text-[9px] font-black px-1.5 py-0.2 rounded-full shadow whitespace-nowrap">
            ${speed} km/h
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    const driverMarker = L.marker([currentLat, currentLng], {
      icon: carIcon,
      zIndexOffset: 1500
    }).bindPopup(`
      <div class="p-1 text-xs">
        <div class="font-black text-slate-900">${activeTrip.driverName}</div>
        <div class="text-slate-600">${activeTrip.vehicleDetails?.makeModel || 'Vehicle en route'}</div>
        <div class="text-cyan-700 font-mono font-bold mt-1">${speed} km/h • ~${activeTrip.distanceTravelledKm || 0} km travelled</div>
        <div class="text-slate-500 text-[10px] mt-0.5">${activeTrip.departure} ➔ ${activeTrip.destination}</div>
      </div>
    `);
    driverMarker.addTo(tripGroup);

  }, [activeTrip?.id, activeTrip?.currentLat, activeTrip?.currentLng, activeTrip?.currentSpeedKmh, activeTrip?.status, activeTrip?.distanceTravelledKm, activeTrip?.departure, activeTrip?.destination]);

  // Update Markers when reports, sosRequests, selectedCategory, or showLiveTrafficNpc changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    try {
      map.closePopup();
      markersGroup.clearLayers();
    } catch (e) {
      console.warn('Error clearing map layers:', e);
    }

    // If LIVETRAFFICNPC overlay is toggled OFF (default), do not render markers
    if (!showLiveTrafficNpc) {
      return;
    }

    // Filter reports (only show approved and resolved incident reports on live map, within 2-hour TTL and not denied)
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
    const approvedReportsList = reports.filter((r) => {
      if (!r || !r.id || isGloballyDeleted(r.id)) return false;
      if (r.status !== 'approved' && r.status !== 'resolved') return false;
      if (typeof r.latitude !== 'number' || typeof r.longitude !== 'number' || isNaN(r.latitude) || isNaN(r.longitude)) return false;
      const ageMs = currentMapTime - new Date(r.createdAt).getTime();
      if (!isNaN(ageMs) && ageMs >= TWO_HOURS_MS) return false;
      const downvotes = (r as any).downvotes || 0;
      const upvotes = r.upvotes || 1;
      if (downvotes >= 3 && downvotes > upvotes) return false;
      return true;
    });

    const filteredReports = approvedReportsList.filter((r) => {
      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'gbv') return r.type === 'gbv_assist' || r.type === 'gbv';
      return r.type === selectedCategory;
    });

    // Add Incident Report Markers
    filteredReports.forEach((rep) => {
      if (!rep || !rep.id || isGloballyDeleted(rep.id)) return;
      const isGbv = rep.type === 'gbv_assist' || rep.type === 'gbv';
      const isSpiking = !isGbv && rep.type === 'spiking';
      const isCrash = !isGbv && rep.type === 'crash';
      const isStationary = !isGbv && rep.type === 'stationary';
      const isVeldFire = !isGbv && rep.type === 'veld_fire';
      const isCongestion = !isGbv && (rep.type === 'congestion' || rep.type === 'traffic');
      const isPothole = !isGbv && rep.type === 'pothole';

      let bgClass = 'bg-red-600 text-white';
      let iconHtml = '🚨';
      if (isGbv) {
        bgClass = 'bg-purple-700 text-white ring-2 ring-purple-400 shadow-purple-500/50 animate-pulse';
        iconHtml = '💜';
      } else if (isSpiking) {
        bgClass = 'bg-red-600 text-white animate-pulse';
        iconHtml = '🚨';
      } else if (isCrash) {
        bgClass = 'bg-rose-700 text-white';
        iconHtml = '💥';
      } else if (isStationary) {
        bgClass = 'bg-amber-500 text-slate-950';
        iconHtml = '🛑';
      } else if (isVeldFire) {
        bgClass = 'bg-orange-600 text-white';
        iconHtml = '🔥';
      } else if (isCongestion) {
        bgClass = 'bg-yellow-500 text-slate-950';
        iconHtml = '🚗';
      } else if (isPothole) {
        bgClass = 'bg-[#C5A059] text-slate-900';
        iconHtml = '🕳️';
      } else if (rep.type === 'hazard') {
        bgClass = 'bg-amber-600 text-white';
        iconHtml = '⚠️';
      }

      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div class="relative flex items-center justify-center w-10 h-10 ${bgClass} rounded-full shadow-lg border-2 border-white transform hover:scale-110 transition duration-200">
            <span class="text-base font-bold">${iconHtml}</span>
            ${rep.verifiedByAdmin 
              ? '<span class="absolute -top-1 -right-1 bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold border border-white shadow">✓</span>' 
              : '<span class="absolute -top-1.5 -right-2 bg-amber-500 text-slate-950 font-black rounded-full px-1 text-[8px] border border-white shadow tracking-tight" title="User Pin • Not Verified">USER</span>'}
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([rep.latitude, rep.longitude], { icon: customIcon });
      (marker as any)._pinId = rep.id;

      const cleanRepId = rep.id.replace(/^feed-/, '').replace(/^report-/, '').replace(/^rep-/, '');
      const isConfirmed = confirmedPinIds.has(rep.id) || confirmedPinIds.has(cleanRepId) || confirmedPinIds.has(`rep-${cleanRepId}`);
      const isDenied = deniedPinIds.has(rep.id) || deniedPinIds.has(cleanRepId) || deniedPinIds.has(`rep-${cleanRepId}`);

      const repAgeMs = currentMapTime - new Date(rep.createdAt).getTime();
      const minutesLeft = Math.max(0, Math.ceil((TWO_HOURS_MS - repAgeMs) / 60000));
      const formattedTimeLeft = minutesLeft >= 60 
        ? `${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}m` 
        : `${minutesLeft}m`;

      const popupHtml = `
        <div class="p-2.5 max-w-xs font-sans text-slate-900">
          <div class="flex items-center justify-between space-x-1.5 mb-1.5">
            <span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${isGbv ? 'bg-purple-100 text-purple-800' : isSpiking ? 'bg-red-100 text-red-700' : isPothole ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}">
              ${isGbv ? 'GBV ASSIST' : rep.type.toUpperCase()}
            </span>
            <div class="flex items-center space-x-1">
              <span class="bg-amber-100 text-amber-900 font-black text-[10px] px-1.5 py-0.5 rounded border border-amber-300">
                ⏱️ ${formattedTimeLeft} left
              </span>
              ${rep.verifiedByAdmin ? '<span class="text-emerald-700 bg-emerald-50 border border-emerald-300 text-[10px] font-black px-1.5 py-0.5 rounded">✓ Verified Admin</span>' : '<span class="text-amber-950 bg-amber-100 border border-amber-300 text-[10px] font-black px-1.5 py-0.5 rounded">👤 User • Not Verified</span>'}
            </div>
          </div>
          <h4 class="font-bold text-sm text-slate-900 mb-1 leading-snug">${rep.title}</h4>
          <p class="text-xs text-slate-600 mb-1.5 line-clamp-2">${rep.description}</p>
          <div class="text-[11px] text-slate-500 mb-1.5 font-medium">📍 ${rep.locationName}</div>

          ${!rep.verifiedByAdmin ? `
            <div class="bg-amber-50 border border-amber-300 text-amber-900 text-[10px] px-2 py-1 rounded-md font-bold mb-1.5 flex items-center justify-between">
              <span class="flex items-center gap-1">⚠️ <span>User Report (Not Verified)</span></span>
              <span class="text-[9px] bg-amber-200 text-amber-950 px-1 py-0.2 rounded font-mono uppercase font-black">Unverified</span>
            </div>
          ` : ''}

          ${(() => {
            const popupImg = (rep.imageUrl && isActualAttachedImage(rep.imageUrl) ? rep.imageUrl : undefined) || getCategoryDefaultImage(rep.type);
            if (popupImg && isActualAttachedImage(popupImg)) {
              return `
                <div class="mb-2 rounded-lg overflow-hidden border border-slate-200 aspect-[3/1] bg-slate-950 flex items-center justify-center">
                  <img src="${popupImg}" alt="${rep.title}" class="w-full h-full object-cover" />
                </div>
              `;
            }
            return '';
          })()}

          ${(rep.postedByUserName || rep.reporterName || rep.createdByAdminName) ? `
            <div class="bg-slate-50 border border-slate-200 text-slate-800 text-[10px] px-2 py-1 rounded-md font-medium mb-1.5 flex items-center justify-between">
              <div class="flex items-center space-x-1">
                <span class="font-bold text-slate-900">${rep.verifiedByAdmin ? '🛡️ Admin Dispatch:' : '👤 Reported by User:'}</span>
                <span class="font-semibold text-slate-800">${(() => {
                  const fName = (rep.postedByUserName || rep.createdByAdminName || rep.reporterName || '').trim();
                  const sName = (rep.postedByUserSurname || rep.reporterSurname || '').trim();
                  if (sName && !fName.toLowerCase().includes(sName.toLowerCase())) {
                    return `${fName} ${sName}`;
                  }
                  return fName;
                })()}</span>
              </div>
              ${rep.verifiedByAdmin ? '<span class="bg-emerald-100 text-emerald-800 text-[9px] px-1 py-0.2 rounded font-black uppercase">Verified</span>' : '<span class="bg-amber-100 text-amber-900 text-[9px] px-1 py-0.2 rounded font-black uppercase">Not Verified</span>'}
            </div>
          ` : ''}

          ${rep.approvedByAdminName ? `
            <div class="bg-emerald-50 border border-emerald-200 text-emerald-900 text-[10px] px-2 py-1 rounded-md font-medium mb-1.5 flex items-center space-x-1">
              <span class="font-bold">✅ Approved by:</span>
              <span>${rep.approvedByAdminName}</span>
              ${rep.approvedByAdminRole ? `<span class="bg-emerald-200/80 text-emerald-950 text-[9px] px-1 py-0.2 rounded font-bold uppercase">${rep.approvedByAdminRole.replace('_', ' ')}</span>` : ''}
            </div>
          ` : ''}

          <div class="bg-amber-50/90 border border-amber-200/90 rounded-lg px-2.5 py-1 mb-2 flex items-center justify-between">
            <span id="confirm-count-report-${rep.id}" class="text-xs font-black text-amber-900">
              👍 ${rep.upvotes || 1} Confirm • ❌ ${(rep as any).downvotes || 0} Deny
            </span>
            <span class="text-[10px] text-amber-700 font-bold uppercase tracking-wider">1-Hr Live Pin</span>
          </div>

          <div class="flex flex-wrap items-center justify-between border-t border-slate-200 pt-2 gap-1.5">
            <div class="flex items-center space-x-1">
              <button
                id="confirm-btn-report-${rep.id}"
                onclick="window.__triggerConfirmMapPin(event, '${rep.id}', 'report')"
                class="${isConfirmed ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white'} text-xs px-2.5 py-1.5 rounded-lg font-bold transition shadow-sm flex items-center space-x-1 cursor-pointer"
                title="Confirm hazard is active (+1)"
              >
                <span>${isConfirmed ? '✅ Confirmed' : '👍 Confirm'}</span>
              </button>

              <button
                id="deny-btn-report-${rep.id}"
                onclick="window.__triggerDenyMapPin(event, '${rep.id}', 'report')"
                class="${isDenied ? 'bg-rose-100 text-rose-800 border border-rose-300 cursor-default' : 'bg-slate-100 hover:bg-rose-100 text-rose-700 border border-rose-300 active:scale-95'} text-xs px-2.5 py-1.5 rounded-lg font-bold transition shadow-sm flex items-center space-x-1 cursor-pointer"
                title="Deny / Mark hazard as cleared"
              >
                <span>${isDenied ? '❌ Denied' : '❌ Deny'}</span>
              </button>
            </div>

            <div class="flex items-center space-x-1">
              ${(() => {
                const canDeleteRep = canUserDeletePost(rep, currentUser, isUserAdmin);
                if (canDeleteRep) {
                  return `
                    <button
                      id="del-rep-${rep.id}"
                      onclick="window.__triggerDeleteMapPin(event, '${rep.id}', 'report')"
                      class="flex items-center space-x-1 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs px-2 py-1.5 rounded-lg font-bold transition shadow-sm cursor-pointer"
                      title="Delete Map Pin"
                    >
                      <span>🗑️</span>
                    </button>
                  `;
                }
                return `
                  <button
                    id="del-rep-${rep.id}"
                    disabled
                    class="flex items-center space-x-1 bg-slate-200 text-slate-400 text-xs px-2 py-1.5 rounded-lg font-bold cursor-not-allowed opacity-40 border border-slate-300"
                    title="Delete disabled: Only administrators or the original composer can delete this post"
                  >
                    <span>🗑️</span>
                  </button>
                `;
              })()}
              <button id="view-rep-${rep.id}" class="bg-slate-900 hover:bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-lg font-semibold cursor-pointer">
                Details →
              </button>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-rep-${rep.id}`);
        if (btn) {
          btn.onclick = () => onSelectReport(rep);
        }
        const delBtn = document.getElementById(`del-rep-${rep.id}`);
        if (delBtn) {
          const canDeleteRep = canUserDeletePost(rep, currentUser, isUserAdmin);
          if (canDeleteRep) {
            delBtn.onclick = (e) => {
              if ((window as any).__triggerDeleteMapPin) {
                (window as any).__triggerDeleteMapPin(e, rep.id, 'report');
              }
            };
          }
        }
      });

      markersGroupRef.current?.addLayer(marker);
    });

    // Add Emergency SOS Markers
    if (selectedCategory === 'all' || selectedCategory === 'sos' || selectedCategory === 'gbv') {
      sosRequests.forEach((sos) => {
        if (!sos || !sos.id || isGloballyDeleted(sos.id) || sos.status === 'resolved') return;

        const isGbv = sos.emergencyType === 'gbv_assist';
        if (selectedCategory === 'gbv' && !isGbv) return;
        const sosIcon = L.divIcon({
          className: 'custom-sos-marker',
          html: `
            <div class="relative flex items-center justify-center w-12 h-12 ${isGbv ? 'bg-purple-700' : 'bg-red-600'} text-white rounded-full shadow-2xl border-2 border-white animate-bounce">
              <span class="absolute inline-flex h-full w-full rounded-full ${isGbv ? 'bg-purple-400' : 'bg-red-400'} opacity-75 animate-ping"></span>
              <span class="relative font-black text-sm">${isGbv ? '💜' : '🆘'}</span>
            </div>
          `,
          iconSize: [48, 48],
          iconAnchor: [24, 24],
        });

        const marker = L.marker([sos.latitude, sos.longitude], { icon: sosIcon });
        (marker as any)._pinId = sos.id;
        const formattedDate = formatReadableDateTime(sos.createdAt);
        const elapsed = getTimeAgo(sos.createdAt);
        const timing = getSOSTimingBreakdown(sos);
        const durationHtml = `<div class="bg-slate-950 text-amber-300 border border-amber-500/30 text-[10px] p-1.5 rounded font-mono font-bold mt-1 flex items-center justify-between">
               <span>⏱️ ${timing.isResolved ? 'Resolved in:' : 'Elapsed:'} ${timing.totalDurationText}</span>
               ${timing.dispatchLatencyText ? `<span class="text-slate-400 font-sans text-[9px]">Disp: ${timing.dispatchLatencyText}</span>` : ''}
             </div>`;
        const responderHtml = sos.responderName
          ? `<div class="bg-amber-50 border border-amber-200 text-amber-900 text-[10px] p-1.5 rounded font-medium mt-1">
               <span class="font-bold">🛡️ Responding Unit:</span> ${sos.responderName}${sos.responderCallsign ? ` (${sos.responderCallsign})` : ''}
             </div>`
          : '';
        const adminNotesHtml = sos.adminNotes
          ? `<div class="bg-slate-100 border border-slate-200 text-slate-800 text-[10px] p-1.5 rounded mt-1">
               <span class="font-bold text-slate-900">📝 Admin Notes:</span> ${sos.adminNotes}
             </div>`
          : '';

        marker.bindPopup(`
          <div class="p-2.5 max-w-xs font-sans text-slate-900 space-y-1">
            <div class="flex items-center justify-between gap-1 mb-1">
              <span class="${isGbv ? 'bg-purple-700' : 'bg-red-600'} text-white px-2 py-0.5 rounded text-[10px] font-black uppercase">
                ${isGbv ? 'GBV ASSIST' : 'EMERGENCY SOS'}
              </span>
              <span class="text-[10px] font-mono text-slate-600 font-bold">
                ${sos.callRef || 'REF #' + sos.id} • ${elapsed}
              </span>
            </div>
            <h4 class="font-bold text-sm ${isGbv ? 'text-purple-800' : 'text-red-700'}">${sos.name}</h4>
            <p class="text-[11px] font-bold ${isGbv ? 'text-purple-900 bg-purple-50 border-purple-200' : 'text-red-800 bg-red-50 border-red-200'} border px-1.5 py-0.5 rounded uppercase">
              ${isGbv ? '💜 GBV EMERGENCY ASSIST' : sos.emergencyType.replace(/_/g, ' ')}
            </p>
            <p class="text-xs text-slate-700 font-medium">${sos.vehicleInfo}</p>
            <div class="text-[11px] font-bold text-slate-800">📞 ${sos.phone}</div>
            <div class="text-[10px] text-slate-600">📍 ${sos.locationName}</div>
            ${durationHtml}
            ${responderHtml}
            ${adminNotesHtml}
            <div class="text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-200 mt-1">
              🕒 Reported: ${formattedDate}
            </div>
            <div class="pt-2 border-t border-slate-200 flex items-center justify-end">
              <button
                id="del-sos-${sos.id}"
                onclick="window.__triggerDeleteMapPin(event, '${sos.id}', 'sos')"
                class="w-full flex items-center justify-center space-x-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs py-1.5 px-3 rounded-lg font-bold transition shadow-sm cursor-pointer"
                title="Resolve or Remove SOS Pin"
              >
                <span>🗑️ Delete / Resolve SOS</span>
              </button>
            </div>
          </div>
        `);

        marker.on('popupopen', () => {
          const delSosBtn = document.getElementById(`del-sos-${sos.id}`);
          if (delSosBtn) {
            delSosBtn.onclick = (e) => {
              if ((window as any).__triggerDeleteMapPin) {
                (window as any).__triggerDeleteMapPin(e, sos.id, 'sos');
              }
            };
          }
        });

        markersGroupRef.current?.addLayer(marker);
      });
    }

    // Add Live i-Traffic Scraped Markers
    if (feedItems && feedItems.length > 0) {
      feedItems.forEach((feed) => {
        if (!feed || !feed.id || isGloballyDeleted(feed.id)) {
          return;
        }
        // Map: Don't show WhatsApp or post feed items on the map
        if (feed.source === 'whatsapp' || (feed as any).source === 'post' || (feed as any).source === 'social_post') {
          return;
        }
        // Strict 2-Hour Auto-Clear Rule: Exclude expired pins (>2 hours) or cleared/resolved items from live map
        const feedTime = parseDateToMillis(feed.timestamp) || parseDateToMillis(feed.startTime) || parseDateToMillis(feed.lastUpdated) || 0;
        const feedAgeMs = currentMapTime - feedTime;
        if (feedTime > 0 && !isNaN(feedAgeMs) && feedAgeMs >= TWO_HOURS_MS) {
          return;
        }
        if (feed.isCleared || feed.cleared || feed.status === 'cleared' || feed.status === 'resolved' || (feed as any).isOlderData) {
          return;
        }
        if (feed.latitude === undefined || feed.longitude === undefined || isNaN(feed.latitude) || isNaN(feed.longitude)) {
          return;
        }

        const isGbv = feed.category === 'gbv' || feed.category === 'gbv_assist' || feed.eventSubType?.toLowerCase().includes('gbv') || feed.content?.toLowerCase().includes('gbv') || feed.author?.toLowerCase().includes('gbv');
        const isCrash = !isGbv && (feed.category === 'crash' || feed.eventSubType?.toLowerCase().includes('crash') || feed.eventSubType?.toLowerCase().includes('accident'));
        const isRoadworks = !isGbv && (feed.category === 'roadworks' || feed.eventSubType?.toLowerCase().includes('roadwork'));
        const isStationary = !isGbv && (feed.category === 'stationary' || feed.eventSubType?.toLowerCase().includes('stationary'));
        const isSpiking = !isGbv && (feed.category === 'spiking' || feed.eventSubType?.toLowerCase().includes('spiking'));
        const isAdmin = !isGbv && feed.source === 'admin_dispatch';
        const isCommunity = feed.source === 'community';

        // Check category filtering
        if (selectedCategory !== 'all') {
          if (selectedCategory === 'gbv' && !isGbv) return;
          if (selectedCategory === 'crash' && !isCrash) return;
          if (selectedCategory === 'stationary' && !isStationary) return;
          if (selectedCategory === 'spiking' && !isSpiking) return;
          if (selectedCategory === 'pothole' && feed.category !== 'pothole') return;
          if (selectedCategory === 'congestion' && feed.category !== 'congestion' && feed.category !== 'traffic') return;
        }

        let bgClass = 'bg-cyan-600 text-white';
        let iconSymbol = '🛣️';
        let badgeText = 'Live Feed';

        if (isGbv) {
          bgClass = 'bg-purple-700 text-white ring-2 ring-purple-400 shadow-purple-500/50 animate-pulse';
          iconSymbol = '💜';
          badgeText = 'GBV Assist';
        } else if (isAdmin) {
          bgClass = 'bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 ring-2 ring-amber-400 shadow-amber-500/50';
          iconSymbol = '🛡️';
          badgeText = 'ADMIN DISPATCH';
        } else if (isCrash) {
          bgClass = 'bg-rose-600 text-white';
          iconSymbol = '💥';
          badgeText = 'Crash';
        } else if (isRoadworks) {
          bgClass = 'bg-amber-600 text-white';
          iconSymbol = '🚧';
          badgeText = 'Roadworks';
        } else if (isStationary) {
          bgClass = 'bg-orange-500 text-slate-950';
          iconSymbol = '🛑';
          badgeText = 'Hazard';
        } else if (isSpiking) {
          bgClass = 'bg-red-600 text-white animate-pulse';
          iconSymbol = '🚨';
          badgeText = 'Spiking';
        }

        const itrafficIcon = L.divIcon({
          className: 'custom-itraffic-marker',
          html: `
            <div class="relative flex items-center justify-center w-9 h-9 ${bgClass} rounded-xl shadow-xl border-2 border-white transform hover:scale-110 transition duration-200">
              <span class="text-sm font-bold">${iconSymbol}</span>
              <span class="absolute -top-1.5 -right-1.5 ${isAdmin ? 'bg-amber-400 text-slate-950' : 'bg-sky-500 text-white'} text-[8px] font-black px-1 rounded-full border border-white">${isAdmin ? 'ADMIN' : 'LIVE'}</span>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const itrafficMarker = L.marker([feed.latitude, feed.longitude], { icon: itrafficIcon });
        (itrafficMarker as any)._pinId = feed.id;
        
        const cleanFeedId = feed.id.replace(/^feed-/, '').replace(/^report-/, '').replace(/^rep-/, '');
        const isFeedConfirmed = confirmedPinIds.has(feed.id) || confirmedPinIds.has(cleanFeedId) || confirmedPinIds.has(`rep-${cleanFeedId}`);
        const isFeedDenied = deniedPinIds.has(feed.id) || deniedPinIds.has(cleanFeedId) || deniedPinIds.has(`rep-${cleanFeedId}`);
        const feedUpvotes = (feed as any).upvotes || 1;
        const feedDownvotes = (feed as any).downvotes || 0;

        const popupContent = `
          <div class="p-2.5 max-w-xs font-sans text-slate-900">
            <div class="flex items-center space-x-1 mb-1.5">
              <span class="${isAdmin ? 'bg-amber-100 text-amber-950 border border-amber-400' : 'bg-cyan-100 text-cyan-900'} text-[10px] font-black px-2 py-0.5 rounded uppercase">
                ${isAdmin ? '🛡️ OFFICIAL ADMIN ALERT' : 'Live Traffic Alert'}
              </span>
              <span class="bg-slate-100 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                ${badgeText}
              </span>
            </div>
            <h4 class="font-bold text-xs text-slate-900 mb-1 leading-snug">
              ${feed.roadwayName ? `${feed.roadwayName} ${feed.direction ? `(${feed.direction})` : ''}` : (feed.location || (feed.region === 'KwaZulu-Natal' ? 'KZN Corridor' : 'Highway Corridor'))}
            </h4>
            <p class="text-[11px] text-slate-700 mb-1.5 leading-relaxed">${feed.content}</p>
            ${feed.eventSubType ? `<div class="text-[10px] text-amber-800 font-semibold mb-1">⚠️ ${feed.eventSubType}</div>` : ''}
            
            ${feed.postedByAdminName ? `
              <div class="bg-blue-50 border border-blue-200 text-blue-900 text-[10px] px-2 py-1 rounded-md font-medium mb-1.5 flex items-center space-x-1">
                <span class="font-bold">🛡️ Dispatched by:</span>
                <span>${feed.postedByAdminName}</span>
                ${feed.postedByAdminRole ? `<span class="bg-blue-200/80 text-blue-950 text-[9px] px-1 py-0.2 rounded font-bold uppercase">${feed.postedByAdminRole.replace('_', ' ')}</span>` : ''}
              </div>
            ` : ''}

            ${feed.approvedByAdminName ? `
              <div class="bg-emerald-50 border border-emerald-200 text-emerald-900 text-[10px] px-2 py-1 rounded-md font-medium mb-1.5 flex items-center space-x-1">
                <span class="font-bold">✅ Approved by:</span>
                <span>${feed.approvedByAdminName}</span>
                ${feed.approvedByAdminRole ? `<span class="bg-emerald-200/80 text-emerald-950 text-[9px] px-1 py-0.2 rounded font-bold uppercase">${feed.approvedByAdminRole.replace('_', ' ')}</span>` : ''}
              </div>
            ` : ''}

            <div class="text-[10px] text-slate-500 mb-2">
              🕒 ${formatSATime(feed.timestamp)} • GPS: ${feed.latitude.toFixed(4)}, ${feed.longitude.toFixed(4)}
            </div>

            <div class="bg-amber-50/90 border border-amber-200/90 rounded-lg px-2.5 py-1 mb-2 flex items-center justify-between">
              <span id="confirm-count-feed-${feed.id}" class="text-xs font-black text-amber-900">
                👍 ${feedUpvotes} Confirm • ❌ ${feedDownvotes} Deny
              </span>
              <span class="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Live Verified</span>
            </div>

            <div class="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-1.5">
              <div class="flex items-center space-x-1">
                <button
                  id="confirm-btn-feed-${feed.id}"
                  onclick="window.__triggerConfirmMapPin(event, '${feed.id}', 'feed')"
                  class="${isFeedConfirmed ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white'} text-xs px-2.5 py-1.5 rounded-lg font-bold transition shadow flex items-center space-x-1 cursor-pointer"
                  title="Confirm this hazard pin"
                >
                  <span>${isFeedConfirmed ? '✅ Confirmed' : '👍 Confirm'}</span>
                </button>

                <button
                  id="deny-btn-feed-${feed.id}"
                  onclick="window.__triggerDenyMapPin(event, '${feed.id}', 'feed')"
                  class="${isFeedDenied ? 'bg-rose-100 text-rose-800 border border-rose-300 cursor-default' : 'bg-slate-100 hover:bg-rose-100 text-rose-700 border border-rose-300 active:scale-95'} text-xs px-2.5 py-1.5 rounded-lg font-bold transition shadow-sm flex items-center space-x-1 cursor-pointer"
                  title="Deny / Clear this alert"
                >
                  <span>${isFeedDenied ? '❌ Denied' : '❌ Deny'}</span>
                </button>
              </div>

              ${(() => {
                const canDeleteFeed = canUserDeletePost(feed, currentUser, isUserAdmin);
                if (canDeleteFeed) {
                  return `
                    <button
                      id="del-feed-${feed.id}"
                      onclick="window.__triggerDeleteMapPin(event, '${feed.id}', 'feed')"
                      class="flex items-center justify-center space-x-1 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs py-1.5 px-2.5 rounded-lg font-bold transition shadow cursor-pointer"
                      title="Delete this Map Pin"
                    >
                      <span>🗑️</span>
                    </button>
                  `;
                }
                return `
                  <button
                    id="del-feed-${feed.id}"
                    disabled
                    class="flex items-center justify-center space-x-1 bg-slate-200 text-slate-400 text-xs py-1.5 px-2.5 rounded-lg font-bold cursor-not-allowed opacity-40 border border-slate-300"
                    title="Delete disabled: Only administrators or the original composer can delete this post"
                  >
                    <span>🗑️</span>
                  </button>
                `;
              })()}
            </div>
          </div>
        `;

        itrafficMarker.bindPopup(popupContent);

        itrafficMarker.on('popupopen', () => {
          const delBtn = document.getElementById(`del-feed-${feed.id}`);
          if (delBtn) {
            const canDeleteFeed = canUserDeletePost(feed, currentUser, isUserAdmin);
            if (canDeleteFeed) {
              delBtn.onclick = (e) => {
                if ((window as any).__triggerDeleteMapPin) {
                  (window as any).__triggerDeleteMapPin(e, feed.id, 'feed');
                }
              };
            }
          }
        });

        markersGroupRef.current?.addLayer(itrafficMarker);
      });
    }
  }, [reports, sosRequests, feedItems, selectedCategory, onSelectReport, onDeleteReport, onDeleteFeedItem, onDeleteSOS, onRefreshReports, onRefreshFeed, showLiveTrafficNpc, confirmedPinIds, onUpvoteReport]);

  // 1-Hour Traffic Trend & Speed Variation Engine
  const trendData = useMemo(() => {
    return compute1HourTrafficTrend(
      reports,
      sosRequests,
      feedItems,
      selectedCity?.provinceKey
    );
  }, [reports, sosRequests, feedItems, selectedCity]);

  // Traffic Trend Animation Scrubber Interval (Auto-advances through timeline)
  useEffect(() => {
    if (!trendIsPlaying || !showTrafficTrend) return;
    const intervalMs = Math.round(1400 / trendPlaybackSpeed);
    const timer = setInterval(() => {
      setTrendActiveTimeIndex((prev) => (prev >= 4 ? 0 : prev + 1));
    }, intervalMs);
    return () => clearInterval(timer);
  }, [trendIsPlaying, trendPlaybackSpeed, showTrafficTrend]);

  // Traffic Trend Corridor Polylines Rendering Effect on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const trendGroup = trafficTrendLayerGroupRef.current;
    if (!map || !trendGroup) return;

    trendGroup.clearLayers();
    if (!showTrafficTrend) return;

    const currentTimelineLabel = trendData.timeLabels[trendActiveTimeIndex] || 'LIVE';

    trendData.segments.forEach((segment) => {
      const speed = segment.speedsAtTimeline[trendActiveTimeIndex] ?? segment.currentSpeed;
      const category = getSpeedCategory(speed, segment.freeFlowSpeed);
      const color = getSpeedColor(category);
      const isGridlock = category === 'gridlock';
      const isHeavy = category === 'heavy';

      // Background ambient glow polyline
      const glowLine = L.polyline(segment.path, {
        color: color,
        weight: isGridlock ? 14 : isHeavy ? 11 : 8,
        opacity: isGridlock ? 0.45 : 0.25,
        lineCap: 'round',
        lineJoin: 'round',
      });
      glowLine.addTo(trendGroup);

      // Foreground crisp speed polyline
      const mainLine = L.polyline(segment.path, {
        color: color,
        weight: isGridlock ? 6 : 5,
        opacity: 0.95,
        dashArray: isGridlock ? '8, 8' : undefined,
        lineCap: 'round',
        lineJoin: 'round',
      });

      const popupContent = `
        <div class="p-2.5 min-w-[220px] font-sans text-slate-900">
          <div class="flex items-center justify-between gap-1 mb-1.5">
            <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase text-white ${
              isGridlock ? 'bg-red-600' : isHeavy ? 'bg-orange-600' : category === 'moderate' ? 'bg-amber-500' : 'bg-emerald-600'
            }">
              ${category.replace('_', ' ').toUpperCase()} FLOW
            </span>
            <span class="text-[10px] font-mono font-black text-cyan-800 bg-cyan-100 px-1.5 py-0.5 rounded">
              ${currentTimelineLabel}
            </span>
          </div>
          <h4 class="font-extrabold text-xs text-slate-900 leading-snug">${segment.name}</h4>
          <div class="flex items-baseline space-x-2 my-1.5">
            <span class="text-xl font-black font-mono ${
              speed < 30 ? 'text-red-600' : speed < 60 ? 'text-orange-600' : speed < 85 ? 'text-amber-600' : 'text-emerald-600'
            }">${speed} km/h</span>
            <span class="text-[11px] text-slate-500 font-bold">(Baseline ${segment.freeFlowSpeed} km/h)</span>
          </div>
          ${segment.activeIncidentTitle ? `
            <div class="text-[10px] bg-red-50 border border-red-200 text-red-700 p-1.5 rounded-lg mt-1 font-semibold">
              🚨 ${segment.activeIncidentTitle}
            </div>
          ` : ''}
          <div class="text-[10px] text-slate-500 mt-1 font-mono">
            Corridor: ${segment.highway} • 1h Variation: ${segment.trendPercent >= 0 ? `+${segment.trendPercent}%` : `${segment.trendPercent}%`}
          </div>
        </div>
      `;

      mainLine.bindPopup(popupContent);
      mainLine.addTo(trendGroup);
    });
  }, [showTrafficTrend, trendActiveTimeIndex, trendData]);

  const approvedReports = reports.filter((r) => r.status === 'approved' || r.status === 'pending' || r.status === 'resolved');

  const categories = [
    { id: 'all', label: 'All Hazards', icon: Layers, count: approvedReports.length + sosRequests.filter(s => s.status !== 'resolved').length },
    { id: 'gbv', label: 'GBV Assist', icon: HeartHandshake, count: sosRequests.filter(s => s.status !== 'resolved' && s.emergencyType === 'gbv_assist').length + approvedReports.filter(r => r.type === 'gbv_assist' || r.type === 'gbv').length },
    { id: 'spiking', label: 'Spike Traps', icon: AlertOctagon, count: approvedReports.filter((r) => r.type === 'spiking').length },
    { id: 'crash', label: 'Crashes', icon: AlertTriangle, count: approvedReports.filter((r) => r.type === 'crash').length },
    { id: 'stationary', label: 'Stationary', icon: ShieldAlert, count: approvedReports.filter((r) => r.type === 'stationary').length },
    { id: 'veld_fire', label: 'Veld Fire', icon: Flame, count: approvedReports.filter((r) => r.type === 'veld_fire').length },
    { id: 'congestion', label: 'Congestion', icon: Car, count: approvedReports.filter((r) => r.type === 'congestion' || r.type === 'traffic').length },
    { id: 'pothole', label: 'Potholes', icon: Construction, count: approvedReports.filter((r) => r.type === 'pothole').length },
    { id: 'sos', label: 'Emergency SOS', icon: AlertOctagon, count: sosRequests.filter(s => s.status !== 'resolved').length },
  ];

  const handleLocateMe = () => {
    if (mapInstanceRef.current) {
      locateUserPosition(mapInstanceRef.current, true, true);
    }
  };

  return (
    <div className={`relative w-full h-full bg-[#0A0B0D] flex flex-col overflow-hidden ${
      isFullscreen ? 'fixed inset-0 z-[100] w-screen h-screen' : ''
    }`}>
      {/* 1 Small Floating Exit Fullscreen Icon Button (Visible ONLY in Fullscreen mode to restore normal view) */}
      {isFullscreen && (
        <button
          type="button"
          onClick={toggleFullscreen}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-[110] p-2.5 sm:p-3 bg-slate-950/95 hover:bg-amber-500 text-amber-400 hover:text-slate-950 rounded-2xl border-2 border-amber-500/80 shadow-2xl backdrop-blur-md transition cursor-pointer flex items-center justify-center active:scale-90 group"
          title="Exit Full Screen & Restore Menus"
          aria-label="Exit Full Screen and restore normal view"
        >
          <Minimize2 className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" />
        </button>
      )}

      {/* Top Menu Bar - Strictly 1 Line with Integrated Dropdowns */}
      {!isFullscreen && !showSearchModal && !showQuickReportModal && !showClearMapConfirmModal && (
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 right-2 sm:right-3 z-30 pointer-events-none">
          {/* Backdrop for closing open dropdown when clicking outside */}
          {openDropdown && (
            <div 
              className="fixed inset-0 z-40 pointer-events-auto bg-slate-950/40" 
              onClick={closeDropdowns} 
            />
          )}

          <div className="relative z-40 max-w-7xl mx-auto w-full pointer-events-auto">
            {/* The 1-Line Top Menu Bar */}
            <div className="flex items-center justify-between gap-1 sm:gap-2 bg-[#0F1115]/95 backdrop-blur-md px-1.5 sm:px-3 py-1.5 rounded-2xl border border-slate-800/90 shadow-2xl overflow-visible">
              
              {/* Left Section: Fullscreen, City Hub, Route, Pin */}
              <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
                {/* 1. Full Screen Toggle */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="p-2 sm:px-2.5 sm:py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl border border-amber-400 shadow-xl transition cursor-pointer shrink-0 flex items-center justify-center active:scale-95 group"
                  title="Full Screen Map"
                  aria-label="Full Screen"
                >
                  <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950 shrink-0 group-hover:scale-110 transition-transform" />
                </button>

                {/* 2. City Selector Dropdown Trigger */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDropdown('city');
                    }}
                    className={`flex items-center space-x-1 sm:space-x-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl border shadow-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer shrink-0 ${
                      openDropdown === 'city'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
                        : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-700/80'
                    }`}
                    title={`City: ${selectedCity ? selectedCity.name : 'Select City'}`}
                    aria-label="Select City / Region Hub"
                  >
                    <Building2 className={`w-3.5 h-3.5 shrink-0 ${openDropdown === 'city' ? 'text-slate-950' : 'text-amber-400'}`} />
                    <span className="hidden sm:inline max-w-[100px] md:max-w-[130px] truncate">{selectedCity ? selectedCity.name : 'City'}</span>
                    <ChevronDown className={`hidden sm:inline w-3 h-3 transition-transform ${openDropdown === 'city' ? 'rotate-180 text-slate-950' : 'opacity-70'}`} />
                  </button>

                  {/* City Hub Dropdown Menu */}
                  {openDropdown === 'city' && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="fixed top-14 left-2 right-2 max-w-sm mx-auto sm:absolute sm:top-full sm:left-0 sm:right-auto sm:mt-2 sm:w-80 sm:mx-0 bg-[#0F1115]/98 border-2 border-amber-500/70 rounded-2xl shadow-2xl p-3 z-50 text-slate-100 animate-in fade-in zoom-in-95 duration-150"
                    >
                      <div className="text-[11px] font-black text-amber-400 uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center justify-between">
                        <span className="flex items-center space-x-1.5">
                          <Building2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Select City / Region Hub</span>
                        </span>
                        <button
                          type="button"
                          onClick={closeDropdowns}
                          className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* GPS Auto-Detect Bar */}
                      <div className="mt-2 flex items-center justify-between bg-slate-900/90 border border-slate-800 p-2 rounded-xl">
                        <div className="flex items-center space-x-1.5 text-xs">
                          <Navigation className={`w-3.5 h-3.5 ${isDetectingMapRegion ? 'animate-spin text-cyan-400' : 'text-emerald-400'}`} />
                          <span className="text-slate-300 font-medium text-[11px]">
                            {isDetectingMapRegion 
                              ? 'Scanning GPS...' 
                              : detectedMapRegion 
                                ? `Detected: ${SA_REGIONS[detectedMapRegion]?.name}` 
                                : 'Auto-detect region'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleManualMapAutoDetect}
                          disabled={isDetectingMapRegion}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-lg shadow transition cursor-pointer"
                        >
                          {isDetectingMapRegion ? 'Locating...' : 'Auto-GPS'}
                        </button>
                      </div>

                      {/* Province Filter Pills */}
                      <div className="flex items-center space-x-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-1.5">
                        <button
                          type="button"
                          onClick={() => setModalProvinceFilter('all')}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition cursor-pointer ${
                            modalProvinceFilter === 'all'
                              ? 'bg-amber-500 text-slate-950 font-black shadow'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          All SA
                        </button>
                        {SA_PROVINCES_LIST.map((provKey) => {
                          const reg = SA_REGIONS[provKey];
                          const isSelected = modalProvinceFilter === provKey;
                          const isDetected = detectedMapRegion === provKey;
                          return (
                            <button
                              key={provKey}
                              type="button"
                              onClick={() => setModalProvinceFilter(provKey)}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition cursor-pointer flex items-center space-x-0.5 ${
                                isSelected
                                  ? 'bg-amber-500 text-slate-950 font-black shadow'
                                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                              }`}
                              title={reg.name}
                            >
                              {isDetected && <span className="text-[8px]">📍</span>}
                              <span>{reg.shortCode}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="max-h-52 overflow-y-auto space-y-1 pt-1 [scrollbar-width:thin]">
                        {CITY_OPTIONS
                          .filter(city => modalProvinceFilter === 'all' || city.provinceKey === modalProvinceFilter)
                          .map((city) => {
                            const isCurrent = selectedCity?.name === city.name;
                            const isAutoDetected = detectedMapRegion && city.provinceKey === detectedMapRegion;
                            return (
                              <button
                                key={city.name}
                                onClick={() => {
                                  handleSelectCity(city);
                                  closeDropdowns();
                                }}
                                className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between font-bold transition cursor-pointer ${
                                  isCurrent ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-200 hover:bg-slate-800 border border-slate-800/80'
                                }`}
                              >
                                <div className="flex items-center space-x-2 min-w-0">
                                  <MapPin className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-slate-950' : 'text-amber-500'}`} />
                                  <div className="truncate">
                                    <div className="flex items-center space-x-1">
                                      <span className="block text-xs font-bold leading-tight">{city.name}</span>
                                      {isAutoDetected && (
                                        <span className={`text-[7px] px-1 py-0.2 rounded font-black uppercase ${
                                          isCurrent ? 'bg-slate-950 text-cyan-300' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                        }`}>
                                          Auto
                                        </span>
                                      )}
                                    </div>
                                    <span className={`block text-[9px] ${isCurrent ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
                                      {city.region}
                                    </span>
                                  </div>
                                </div>
                                {city.popular && (
                                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase ${
                                    isCurrent ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  }`}>
                                    HUB
                                  </span>
                                )}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Search & Navigate Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowSearchModal(true);
                    closeDropdowns();
                  }}
                  className="flex items-center space-x-1 sm:space-x-1.5 p-2 sm:px-3 sm:py-1.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black rounded-xl border border-sky-400/80 shadow-xl text-xs uppercase tracking-wider transition cursor-pointer shrink-0"
                  title="Search South Africa Address & Navigate"
                  aria-label="Route & Navigation"
                >
                  <Navigation className="w-3.5 h-3.5 shrink-0 text-white" />
                  <span className="hidden sm:inline">Route</span>
                </button>

                {/* 4. Drop 'n Pin Button */}
                <button
                  type="button"
                  onClick={() => {
                    closeDropdowns();
                    setShowQuickReportModal(false);
                    if (pinnedCoords) {
                      setPinnedCoords(null);
                      setPinModeActive(false);
                    } else {
                      pinUserLocationOnMap();
                    }
                  }}
                  className={`flex items-center space-x-1 sm:space-x-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-xl transition border shrink-0 cursor-pointer ${
                    pinnedCoords
                      ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400 animate-pulse'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400'
                  }`}
                  title={pinnedCoords ? 'Click to clear pinned spot' : 'Pin My Location: Pin where you are on the map'}
                  aria-label="Pin My Location"
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-950" />
                  <span className="hidden sm:inline">{pinnedCoords ? 'Clear Pin' : 'Pin Location'}</span>
                </button>

                {/* 5. Screen Awake Toggle (Prevent Screen Timeout) */}
                <button
                  type="button"
                  onClick={handleToggleWakeLock}
                  className={`flex items-center space-x-1 sm:space-x-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-xl transition border shrink-0 cursor-pointer ${
                    isScreenAwake
                      ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400/60'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                  }`}
                  title={isScreenAwake ? 'Screen Awake: ON (Display will not sleep - click to toggle)' : 'Keep Screen Awake: Click to prevent display timeout'}
                  aria-label="Keep Screen Awake"
                >
                  <Zap className={`w-3.5 h-3.5 shrink-0 ${isScreenAwake ? 'text-slate-950 fill-slate-950 animate-pulse' : 'text-amber-400'}`} />
                  <span className="hidden md:inline">{isScreenAwake ? 'Awake' : 'Sleep'}</span>
                </button>

                {/* 6. Auto-Recenter / Follow Me Toggle */}
                <button
                  type="button"
                  onClick={handleToggleAutoRecenter}
                  className={`flex items-center space-x-1 sm:space-x-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-xl transition border shrink-0 cursor-pointer ${
                    autoRecenter
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 ring-2 ring-emerald-400/60'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                  }`}
                  title={autoRecenter ? 'Auto-Recenter: ON (Following your movement - click to pause)' : 'Auto-Recenter: OFF (Free map browse - click to follow)'}
                  aria-label="Toggle Auto-Recenter"
                >
                  <Navigation className={`w-3.5 h-3.5 shrink-0 ${autoRecenter ? 'text-slate-950 animate-pulse' : 'text-emerald-400'}`} />
                  <span className="hidden md:inline">{autoRecenter ? 'Follow' : 'Follow: Off'}</span>
                </button>
              </div>

              {/* Middle & Right Section: Hazards, Bulletins, Layers, Tools Dropdowns */}
              <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
                {/* 5. Hazards Filter Dropdown */}
                {showLiveTrafficNpc && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDropdown('hazards');
                      }}
                      className={`flex items-center space-x-1 sm:space-x-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl border shadow-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer shrink-0 ${
                        openDropdown === 'hazards' || selectedCategory !== 'all'
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
                          : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-700/80'
                      }`}
                      title={`Filter Hazards (${categories.find(c => c.id === selectedCategory)?.count || reports.length})`}
                      aria-label="Filter Hazards"
                    >
                      <Layers className={`w-3.5 h-3.5 shrink-0 ${openDropdown === 'hazards' || selectedCategory !== 'all' ? 'text-slate-950' : 'text-amber-400'}`} />
                      <span className="hidden sm:inline">Hazards</span>
                      <span className={`hidden sm:inline text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                        openDropdown === 'hazards' || selectedCategory !== 'all' ? 'bg-slate-950 text-amber-400 font-bold' : 'bg-slate-950/80 text-amber-400 font-bold border border-slate-800'
                      }`}>
                        {categories.find(c => c.id === selectedCategory)?.count || reports.length}
                      </span>
                      <ChevronDown className={`hidden sm:inline w-3 h-3 transition-transform ${openDropdown === 'hazards' ? 'rotate-180 text-slate-950' : 'opacity-70'}`} />
                    </button>

                    {/* Hazards Dropdown Popover */}
                    {openDropdown === 'hazards' && (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="fixed top-14 left-2 right-2 max-w-sm mx-auto sm:absolute sm:top-full sm:left-auto sm:right-0 md:sm:left-0 sm:mt-2 sm:w-64 sm:mx-0 bg-[#0F1115]/98 border-2 border-amber-500/70 rounded-2xl shadow-2xl p-2.5 z-50 text-slate-100 animate-in fade-in zoom-in-95 duration-150"
                      >
                        <div className="text-[11px] font-black text-amber-400 uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center justify-between">
                          <span>Filter Map Hazards</span>
                          <span className="text-[10px] text-slate-400">{reports.length} Total Verified</span>
                        </div>
                        <div className="space-y-1 pt-1.5 max-h-60 overflow-y-auto [scrollbar-width:thin]">
                          {categories.map((cat) => {
                            const Icon = cat.icon;
                            const active = selectedCategory === cat.id;
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                  setSelectedCategory(cat.id);
                                  closeDropdowns();
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                                  active
                                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                                    : 'text-slate-200 hover:bg-slate-800/80 border border-slate-800/60'
                                }`}
                              >
                                <div className="flex items-center space-x-2">
                                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-slate-950' : 'text-amber-400'}`} />
                                  <span>{cat.label}</span>
                                </div>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                  active ? 'bg-slate-950 text-amber-400 font-bold' : 'bg-slate-900 text-slate-400'
                                }`}>
                                  {cat.count}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 6. Bulletins & Trend Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDropdown('bulletins');
                    }}
                    className={`flex items-center space-x-1 sm:space-x-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl border shadow-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer shrink-0 ${
                      openDropdown === 'bulletins' || showTrafficTrend
                        ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white border-amber-400 font-extrabold'
                        : 'bg-slate-900/90 hover:bg-slate-800 text-amber-400 border-amber-500/40'
                    }`}
                    title="Intelligence Bulletins & 1h Trend"
                    aria-label="Intelligence Bulletins"
                  >
                    <Sparkles className={`w-3.5 h-3.5 shrink-0 ${openDropdown === 'bulletins' || showTrafficTrend ? 'text-white' : 'text-amber-400 animate-pulse'}`} />
                    <span className="hidden sm:inline">Bulletins</span>
                    <ChevronDown className={`hidden sm:inline w-3 h-3 transition-transform ${openDropdown === 'bulletins' ? 'rotate-180' : 'opacity-70'}`} />
                  </button>

                  {/* Bulletins Dropdown Popover */}
                  {openDropdown === 'bulletins' && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="fixed top-14 left-2 right-2 max-w-sm mx-auto sm:absolute sm:top-full sm:left-auto sm:right-0 sm:mt-2 sm:w-72 sm:mx-0 bg-[#0F1115]/98 border-2 border-amber-500/70 rounded-2xl shadow-2xl p-2.5 z-50 text-slate-100 space-y-2 animate-in fade-in zoom-in-95 duration-150"
                    >
                      <div className="text-[11px] font-black text-amber-400 uppercase tracking-wider pb-1.5 border-b border-slate-800">
                        Traffic Intelligence & Bulletins
                      </div>

                      {/* City 30-Min Report */}
                      <button
                        type="button"
                        onClick={() => {
                          closeDropdowns();
                          if (!showSummaryPanel && selectedCity) {
                            fetchCitySummary(selectedCity);
                          } else {
                            setShowSummaryPanel(!showSummaryPanel);
                          }
                        }}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 transition flex items-center space-x-3 cursor-pointer group"
                      >
                        <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg group-hover:bg-amber-500 group-hover:text-slate-950 transition">
                          <Sparkles className="w-4 h-4 shrink-0" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center space-x-1">
                            <span>City 30-Min Intelligence</span>
                            <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1 py-0.2 rounded font-mono">AI</span>
                          </div>
                          <div className="text-[10px] text-slate-400">Briefing for {selectedCity?.name || 'Selected City'}</div>
                        </div>
                      </button>

                      {/* Viewport & Red Zone Bulletin */}
                      <button
                        type="button"
                        onClick={() => {
                          closeDropdowns();
                          fetchViewportSummary();
                        }}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 transition flex items-center space-x-3 cursor-pointer group"
                      >
                        <div className="p-2 bg-red-500/20 text-red-400 rounded-lg group-hover:bg-red-500 group-hover:text-white transition">
                          <FileText className="w-4 h-4 shrink-0" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center space-x-1">
                            <span>Viewport & Red Zone Report</span>
                            <span className="text-[9px] bg-red-500/20 text-red-400 px-1 py-0.2 rounded font-mono">LIVE</span>
                          </div>
                          <div className="text-[10px] text-slate-400">Current bounds & heavy congestion</div>
                        </div>
                      </button>

                      {/* 1-Hour Traffic Trend Animation Toggle */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowTrafficTrend(!showTrafficTrend);
                          closeDropdowns();
                        }}
                        className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                          showTrafficTrend
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50'
                            : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${showTrafficTrend ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-cyan-400'}`}>
                            <Activity className="w-4 h-4 shrink-0" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">1-Hour Traffic Trend</div>
                            <div className="text-[10px] text-slate-400">Speed variation & corridor flow</div>
                          </div>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                          showTrafficTrend ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {showTrafficTrend ? 'ON' : 'OFF'}
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 7. Layers Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDropdown('layers');
                    }}
                    className={`flex items-center space-x-1 sm:space-x-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl border shadow-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer shrink-0 ${
                      openDropdown === 'layers'
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-extrabold'
                        : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-700/80'
                    }`}
                    title="Map Layers & High-Precision Providers"
                    aria-label="Map Layers"
                  >
                    <Globe className={`w-3.5 h-3.5 shrink-0 ${openDropdown === 'layers' ? 'text-slate-950' : 'text-cyan-400'}`} />
                    <span className="hidden sm:inline">
                      {mapProvider === 'google_traffic' ? 'Traffic' :
                       mapProvider === 'google_sat_traffic' ? 'Sat Traffic' :
                       mapProvider === 'esri_streets' ? 'Esri Roads' :
                       mapProvider === 'esri_imagery' ? 'Esri Satellite' :
                       mapProvider === 'google_roadmap' ? 'Roadmap' :
                       mapProvider === 'carto_dark' ? 'Dark' :
                       mapProvider === 'carto_light' ? 'Light' :
                       mapProvider === 'osm_hot' ? 'OSM Emergency' :
                       mapProvider === 'google_terrain' ? 'Terrain' : 'OSM'}
                    </span>
                    <ChevronDown className={`hidden sm:inline w-3 h-3 transition-transform ${openDropdown === 'layers' ? 'rotate-180 text-slate-950' : 'opacity-70'}`} />
                  </button>

                  {/* Layers Dropdown Popover */}
                  {openDropdown === 'layers' && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="fixed top-14 left-2 right-2 max-w-sm mx-auto sm:absolute sm:top-full sm:left-auto sm:right-0 sm:mt-2 sm:w-72 sm:mx-0 bg-[#0F1115]/98 border-2 border-cyan-500/70 rounded-2xl shadow-2xl p-2.5 z-50 text-slate-100 space-y-2 animate-in fade-in zoom-in-95 duration-150 max-h-[80vh] overflow-y-auto"
                    >
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                        <span className="text-[11px] font-black text-cyan-400 uppercase tracking-wider">Map Providers & Accuracy</span>
                        <span className="text-[9px] font-mono text-slate-400">10 High-Precision Styles</span>
                      </div>
                      
                      {/* Section 1: Live Traffic & GIS */}
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase px-1">Live Traffic & GIS</div>
                        <button
                          onClick={() => { handleSelectMapProvider('google_traffic'); closeDropdowns(); }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between font-bold transition text-xs cursor-pointer ${
                            mapProvider === 'google_traffic' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-200 hover:bg-slate-800 border border-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-base">🚦</span>
                            <span>Google Live Traffic</span>
                          </div>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950/40 font-mono text-cyan-300">Live Flow</span>
                        </button>

                        <button
                          onClick={() => { handleSelectMapProvider('google_sat_traffic'); closeDropdowns(); }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between font-bold transition text-xs cursor-pointer ${
                            mapProvider === 'google_sat_traffic' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-200 hover:bg-slate-800 border border-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-base">🛰️</span>
                            <span>Satellite + Traffic</span>
                          </div>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950/40 font-mono text-cyan-300">Aerial</span>
                        </button>

                        <button
                          onClick={() => { handleSelectMapProvider('esri_streets'); closeDropdowns(); }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between font-bold transition text-xs cursor-pointer ${
                            mapProvider === 'esri_streets' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-200 hover:bg-slate-800 border border-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-base">📍</span>
                            <span>Esri High-Precision GIS</span>
                          </div>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950/40 font-mono text-amber-300">High Acc</span>
                        </button>
                      </div>

                      {/* Section 2: Detailed Roads & Emergency */}
                      <div className="space-y-1 pt-1 border-t border-slate-800/80">
                        <div className="text-[10px] font-bold text-slate-400 uppercase px-1">Detailed Roads & Emergency</div>
                        <button
                          onClick={() => { handleSelectMapProvider('google_roadmap'); closeDropdowns(); }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between font-bold transition text-xs cursor-pointer ${
                            mapProvider === 'google_roadmap' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-200 hover:bg-slate-800 border border-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-base">🗺️</span>
                            <span>Google Standard Roadmap</span>
                          </div>
                        </button>

                        <button
                          onClick={() => { handleSelectMapProvider('osm_hot'); closeDropdowns(); }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between font-bold transition text-xs cursor-pointer ${
                            mapProvider === 'osm_hot' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-200 hover:bg-slate-800 border border-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-base">🚑</span>
                            <span>OSM Humanitarian / Emergency</span>
                          </div>
                        </button>

                        <button
                          onClick={() => { handleSelectMapProvider('osm'); closeDropdowns(); }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between font-bold transition text-xs cursor-pointer ${
                            mapProvider === 'osm' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-200 hover:bg-slate-800 border border-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-base">🌍</span>
                            <span>OpenStreetMap Standard</span>
                          </div>
                        </button>
                      </div>

                      {/* Section 3: Satellite & Contrast */}
                      <div className="space-y-1 pt-1 border-t border-slate-800/80">
                        <div className="text-[10px] font-bold text-slate-400 uppercase px-1">Satellite & Contrast</div>
                        <button
                          onClick={() => { handleSelectMapProvider('esri_imagery'); closeDropdowns(); }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between font-bold transition text-xs cursor-pointer ${
                            mapProvider === 'esri_imagery' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-200 hover:bg-slate-800 border border-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-base">🛰️</span>
                            <span>Esri High-Res Satellite</span>
                          </div>
                        </button>

                        <button
                          onClick={() => { handleSelectMapProvider('carto_dark'); closeDropdowns(); }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between font-bold transition text-xs cursor-pointer ${
                            mapProvider === 'carto_dark' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-200 hover:bg-slate-800 border border-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-base">🌙</span>
                            <span>Carto Dark Matter (Night)</span>
                          </div>
                        </button>

                        <button
                          onClick={() => { handleSelectMapProvider('carto_light'); closeDropdowns(); }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between font-bold transition text-xs cursor-pointer ${
                            mapProvider === 'carto_light' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-200 hover:bg-slate-800 border border-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-base">☀️</span>
                            <span>Carto Positron (Daylight)</span>
                          </div>
                        </button>

                        <button
                          onClick={() => { handleSelectMapProvider('google_terrain'); closeDropdowns(); }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between font-bold transition text-xs cursor-pointer ${
                            mapProvider === 'google_terrain' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-200 hover:bg-slate-800 border border-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-base">⛰️</span>
                            <span>Google Topo Terrain</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 8. More Tools Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDropdown('tools');
                    }}
                    className={`flex items-center space-x-1 sm:space-x-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl border shadow-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer shrink-0 ${
                      openDropdown === 'tools'
                        ? 'bg-slate-200 text-slate-950 border-white font-extrabold'
                        : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-700/80'
                    }`}
                    title="More Tools & GPS"
                    aria-label="Map Tools"
                  >
                    <Sliders className="w-3.5 h-3.5 shrink-0 text-slate-300" />
                    <span className="hidden sm:inline">Tools</span>
                    <ChevronDown className={`hidden sm:inline w-3 h-3 transition-transform ${openDropdown === 'tools' ? 'rotate-180' : 'opacity-70'}`} />
                  </button>

                  {/* More Tools Dropdown Popover */}
                  {openDropdown === 'tools' && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="fixed top-14 left-2 right-2 max-w-sm mx-auto sm:absolute sm:top-full sm:left-auto sm:right-0 sm:mt-2 sm:w-56 sm:mx-0 bg-[#0F1115]/98 border-2 border-slate-700 rounded-2xl shadow-2xl p-2.5 z-50 text-slate-100 space-y-1.5 animate-in fade-in zoom-in-95 duration-150"
                    >
                      <div className="text-[11px] font-black text-amber-400 uppercase tracking-wider pb-1.5 border-b border-slate-800">
                        Map & Driver Tools
                      </div>

                      {/* Screen Awake Toggle */}
                      <button
                        type="button"
                        onClick={() => {
                          closeDropdowns();
                          handleToggleWakeLock();
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs font-bold transition cursor-pointer ${
                          isScreenAwake
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60'
                            : 'text-slate-200 hover:bg-slate-800 border border-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Zap className={`w-4 h-4 shrink-0 ${isScreenAwake ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
                          <span>Screen Awake (No Sleep)</span>
                        </div>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                          isScreenAwake ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {isScreenAwake ? 'ON' : 'OFF'}
                        </span>
                      </button>

                      {/* Auto-Recenter Toggle */}
                      <button
                        type="button"
                        onClick={() => {
                          closeDropdowns();
                          handleToggleAutoRecenter();
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs font-bold transition cursor-pointer ${
                          autoRecenter
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/60'
                            : 'text-slate-200 hover:bg-slate-800 border border-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Navigation className={`w-4 h-4 shrink-0 ${autoRecenter ? 'text-emerald-400' : 'text-slate-400'}`} />
                          <span>Auto-Recenter as You Move</span>
                        </div>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                          autoRecenter ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {autoRecenter ? 'ON' : 'OFF'}
                        </span>
                      </button>

                      {/* Recenter GPS */}
                      <button
                        type="button"
                        onClick={() => {
                          closeDropdowns();
                          handleLocateMe();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl flex items-center space-x-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800 border border-slate-800/80 transition cursor-pointer"
                      >
                        <Compass className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>Recenter My GPS</span>
                      </button>

                      {/* Share to X */}
                      {onOpenShareToX && (
                        <button
                          type="button"
                          onClick={() => {
                            closeDropdowns();
                            onOpenShareToX({
                              text: `🗺️ LIVE TRAFFIC MAP STATUS: Active hazard monitoring in ${selectedCity?.name || 'Gauteng'}. ${reports.length} road incidents verified. Stay vigilant!`,
                              category: 'map'
                            });
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl flex items-center space-x-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800 border border-slate-800/80 transition cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5 fill-current text-white shrink-0" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                          <span>Share to X.com</span>
                        </button>
                      )}

                      {/* Clear Map (Admin Only) */}
                      {isUserAdmin && onClearAllMapHazards && (
                        <button
                          type="button"
                          onClick={() => {
                            closeDropdowns();
                            setShowClearMapConfirmModal(true);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl flex items-center space-x-2.5 text-xs font-black text-red-400 hover:bg-red-600/20 border border-red-500/40 transition cursor-pointer uppercase"
                        >
                          <Trash2 className="w-4 h-4 text-red-400 shrink-0" />
                          <span>Clear Map Hazards</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* Floating Auto-Recenter Resume Pill (appears when user manually dragged map away) */}
      {!autoRecenter && (
        <div className="absolute top-20 sm:top-16 left-1/2 transform -translate-x-1/2 z-20 pointer-events-auto">
          <button
            type="button"
            onClick={() => {
              setAutoRecenter(true);
              autoRecenterRef.current = true;
              const pos = getLastKnownUserPosition();
              if (pos && mapInstanceRef.current) {
                mapInstanceRef.current.flyTo([pos.latitude, pos.longitude], 15, { duration: 0.8 });
              } else if (mapInstanceRef.current) {
                locateUserPosition(mapInstanceRef.current, true, true);
              }
              setQuickToast({ message: '🎯 Auto-Recenter: Resumed (Following your movement)' });
              setTimeout(() => setQuickToast(null), 3000);
            }}
            className="px-3.5 py-1.5 rounded-full bg-slate-950/95 hover:bg-emerald-600 text-emerald-400 hover:text-white border-2 border-emerald-500 shadow-2xl backdrop-blur-md flex items-center space-x-2 text-[11px] font-black uppercase tracking-wider transition active:scale-95 cursor-pointer animate-pulse"
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
            <span>Resume Auto-Recenter</span>
          </button>
        </div>
      )}

      {/* Pin Mode Banner Overlay if active */}
      {pinModeActive && (
        <div className="absolute top-28 sm:top-20 left-1/2 transform -translate-x-1/2 z-30 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-slate-950 border-2 border-slate-950 text-[11px] sm:text-xs font-black uppercase tracking-wider px-3 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-2xl flex items-center justify-between space-x-2 sm:space-x-3 animate-bounce w-[94%] sm:w-auto text-center pointer-events-auto">
          <div className="flex items-center space-x-1.5 sm:space-x-2 truncate">
            <MapPin className="w-4 h-4 shrink-0 text-slate-950 animate-pulse" />
            <span className="truncate">
              📍 Tap road or drag pin to exact spot
            </span>
          </div>
          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  const fix = await getExactDeviceGps({ timeout: 6000, forceFresh: true });
                  if (fix) {
                    const lat = Number(fix.latitude.toFixed(6));
                    const lng = Number(fix.longitude.toFixed(6));
                    setPinnedCoords({ lat, lng });
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 0.8 });
                    }
                  }
                } catch (err) {}
              }}
              className="px-2.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider cursor-pointer shadow flex items-center space-x-1"
            >
              <Crosshair className="w-3 h-3" />
              <span>Snap GPS</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPinModeActive(false);
              }}
              className="px-2.5 py-1 rounded-full bg-slate-950 text-amber-400 hover:bg-slate-900 text-[10px] font-black uppercase tracking-wider cursor-pointer shadow"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Leaflet Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Techrix365 & Charles Odendaal Creator Attribution Pill on Map */}
      <div className="absolute bottom-1 right-2 z-20 pointer-events-auto hidden md:flex items-center space-x-2 bg-[#020408]/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#D4A237]/50 text-[10px] text-slate-300 shadow-lg select-none">
        <span>App by <strong className="text-white">Charles Odendaal</strong></span>
        <span>•</span>
        <a 
          href="https://techrix365.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-[#D4A237] hover:text-amber-300 hover:underline font-bold"
        >
          techrix365.com
        </a>
      </div>

      {/* On-Map Quick 1-Tap Hazard Dispatch Bar for Pinned Spot (Direct 1-Tap on Map, No Modal Required) */}
      {pinnedCoords && !showQuickReportModal && (
        <div 
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="absolute bottom-6 left-2 right-2 sm:left-4 sm:right-auto sm:max-w-xl z-30 bg-[#0F1115]/95 backdrop-blur-xl border-2 border-amber-500 rounded-3xl shadow-2xl p-3 sm:p-4 text-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header with road name, GPS coords & actions */}
          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
                <MapPin className="w-4 h-4 animate-bounce" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black text-amber-400 uppercase tracking-wide truncate flex items-center gap-1.5">
                  <span>{isGeocodingPin ? 'Identifying road...' : (pinnedRoadName || 'Pinned Map Spot')}</span>
                  {pinnedLocationName && (
                    <span className="text-[10px] text-slate-400 font-normal truncate hidden sm:inline">({pinnedLocationName})</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">
                  GPS: {pinnedCoords.lat.toFixed(5)}, {pinnedCoords.lng.toFixed(5)} • <span className="text-amber-300 font-bold">Tap map or drag pin to adjust</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                type="button"
                style={{ touchAction: 'manipulation' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowQuickReportModal(true);
                }}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer active:scale-95"
                title="Open Modal Form"
              >
                Expand
              </button>
              <button
                type="button"
                style={{ touchAction: 'manipulation' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setPinnedCoords(null);
                  setPinModeActive(false);
                }}
                className="p-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                title="Clear Pin"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick 1-Tap Hazard Buttons Grid */}
          <div className="text-[10px] font-black text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <span>⚡ 1-Tap Hazard Dispatch</span>
            </span>
            <span className="text-amber-400 font-mono text-[9px]">
              {isUserAdmin ? '🛡️ Admin Live Broadcast' : '👤 User Pin (Unverified)'}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            {/* 1. Spiking */}
            <button
              type="button"
              style={{ touchAction: 'manipulation' }}
              onClick={(e) => { e.stopPropagation(); triggerQuickSubmit('spiking'); }}
              disabled={isSubmittingQuickReport}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-b from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold border border-red-400 shadow transition active:scale-95 cursor-pointer text-center"
            >
              <AlertOctagon className="w-4 h-4 shrink-0 mb-0.5" />
              <span className="text-[10px] uppercase font-black tracking-tight leading-tight">Spiking</span>
            </button>

            {/* 2. Crash */}
            <button
              type="button"
              style={{ touchAction: 'manipulation' }}
              onClick={(e) => { e.stopPropagation(); triggerQuickSubmit('crash'); }}
              disabled={isSubmittingQuickReport}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-b from-rose-700 to-orange-700 hover:from-rose-600 hover:to-orange-600 text-white font-bold border border-rose-400 shadow transition active:scale-95 cursor-pointer text-center"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mb-0.5" />
              <span className="text-[10px] uppercase font-black tracking-tight leading-tight">Crash</span>
            </button>

            {/* 3. Fatal Crash */}
            <button
              type="button"
              style={{ touchAction: 'manipulation' }}
              onClick={(e) => { e.stopPropagation(); triggerQuickSubmit('fatal_crash'); }}
              disabled={isSubmittingQuickReport}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-b from-red-950 to-slate-900 hover:from-red-900 hover:to-slate-800 text-white font-bold border border-red-500 shadow transition active:scale-95 cursor-pointer text-center"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mb-0.5 text-red-400 animate-pulse" />
              <span className="text-[10px] uppercase font-black tracking-tight leading-tight text-red-200">Fatal Crash</span>
            </button>

            {/* 4. Stationary */}
            <button
              type="button"
              style={{ touchAction: 'manipulation' }}
              onClick={(e) => { e.stopPropagation(); triggerQuickSubmit('stationary'); }}
              disabled={isSubmittingQuickReport}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black border border-amber-300 shadow transition active:scale-95 cursor-pointer text-center"
            >
              <ShieldAlert className="w-4 h-4 shrink-0 mb-0.5 text-slate-950" />
              <span className="text-[10px] uppercase font-black tracking-tight leading-tight">Stationary</span>
            </button>

            {/* 5. Veld Fire */}
            <button
              type="button"
              style={{ touchAction: 'manipulation' }}
              onClick={(e) => { e.stopPropagation(); triggerQuickSubmit('veld_fire'); }}
              disabled={isSubmittingQuickReport}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-b from-orange-600 to-amber-700 hover:from-orange-500 hover:to-amber-600 text-white font-bold border border-orange-400 shadow transition active:scale-95 cursor-pointer text-center"
            >
              <Flame className="w-4 h-4 shrink-0 mb-0.5 text-amber-300" />
              <span className="text-[10px] uppercase font-black tracking-tight leading-tight">Veld Fire</span>
            </button>

            {/* 6. Congestion */}
            <button
              type="button"
              style={{ touchAction: 'manipulation' }}
              onClick={(e) => { e.stopPropagation(); triggerQuickSubmit('congestion'); }}
              disabled={isSubmittingQuickReport}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-b from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-black border border-yellow-300 shadow transition active:scale-95 cursor-pointer text-center"
            >
              <Car className="w-4 h-4 shrink-0 mb-0.5 text-slate-950" />
              <span className="text-[10px] uppercase font-black tracking-tight leading-tight">Traffic Jam</span>
            </button>

            {/* 7. Pothole */}
            <button
              type="button"
              style={{ touchAction: 'manipulation' }}
              onClick={(e) => { e.stopPropagation(); triggerQuickSubmit('pothole'); }}
              disabled={isSubmittingQuickReport}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-b from-slate-700 to-zinc-800 hover:from-slate-600 hover:to-zinc-700 text-white font-bold border border-slate-500 shadow transition active:scale-95 cursor-pointer text-center"
            >
              <CircleDot className="w-4 h-4 shrink-0 mb-0.5 text-amber-400" />
              <span className="text-[10px] uppercase font-black tracking-tight leading-tight">Pothole</span>
            </button>

            {/* 8. Roadworks */}
            <button
              type="button"
              style={{ touchAction: 'manipulation' }}
              onClick={(e) => { e.stopPropagation(); triggerQuickSubmit('roadworks'); }}
              disabled={isSubmittingQuickReport}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-b from-amber-600 to-yellow-700 hover:from-amber-500 hover:to-yellow-600 text-white font-bold border border-yellow-400 shadow transition active:scale-95 cursor-pointer text-center"
            >
              <Wrench className="w-4 h-4 shrink-0 mb-0.5 text-yellow-300" />
              <span className="text-[10px] uppercase font-black tracking-tight leading-tight">Roadworks</span>
            </button>

            {/* 9. Weather */}
            <button
              type="button"
              style={{ touchAction: 'manipulation' }}
              onClick={(e) => { e.stopPropagation(); triggerQuickSubmit('weather'); }}
              disabled={isSubmittingQuickReport}
              className="col-span-1 sm:col-span-2 flex flex-col sm:flex-row items-center justify-center p-2 rounded-xl bg-gradient-to-b sm:bg-gradient-to-r from-cyan-700 to-teal-800 hover:from-cyan-600 hover:to-teal-700 text-white font-bold border border-cyan-400 shadow transition active:scale-95 cursor-pointer text-center gap-1"
            >
              <CloudRain className="w-4 h-4 shrink-0 text-cyan-300" />
              <span className="text-[10px] uppercase font-black tracking-tight leading-tight">Flood / Storm</span>
            </button>
          </div>
        </div>
      )}

      {/* 30-Minute City Intelligence Summary Bulletin Panel */}
      {showSummaryPanel && !isFullscreen && selectedCity && (
        <div className="fixed sm:absolute top-16 bottom-24 sm:top-20 sm:bottom-28 left-2 right-2 sm:left-auto sm:right-6 sm:w-[480px] z-40 bg-[#0F1115]/95 backdrop-blur-xl border-2 border-amber-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200 transition-all duration-200">
          {/* Header */}
          <div className="bg-[#050608] px-3.5 sm:px-4 py-2.5 sm:py-3 border-b border-slate-800 flex items-center justify-between shrink-0 sticky top-0 z-10">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="bg-amber-500/20 text-amber-400 p-1.5 sm:p-2 rounded-xl border border-amber-500/30 shrink-0">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-xs sm:text-sm text-white truncate tracking-tight uppercase">
                    {summaryTitle}
                  </h3>
                  <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                    LIVE BULLETIN
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">
                  AI & Live Patrol Intelligence • {selectedCity.region}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowSummaryPanel(false);
                if (isSpeaking && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                  setIsSpeaking(false);
                }
              }}
              className="p-2 bg-slate-900 hover:bg-red-600 text-amber-400 hover:text-white rounded-xl border border-slate-700 transition shrink-0 cursor-pointer shadow-lg"
              title="Close Bulletin"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-3 sm:p-4 overflow-y-auto flex-1 min-h-0 space-y-3 text-xs leading-relaxed font-sans [scrollbar-width:thin]">
            {isLoadingSummary ? (
              <div className="py-8 text-center space-y-3">
                <RefreshCw className="w-7 h-7 text-amber-500 animate-spin mx-auto" />
                <p className="font-bold text-slate-300 text-xs">Generating Intelligence Bulletin for {selectedCity.name}...</p>
                <p className="text-[10px] text-slate-500">Synthesizing verified hazard reports, spike traps, and regional patrol metrics...</p>
              </div>
            ) : citySummary ? (
              <div className="bg-[#050608] border border-slate-800/80 p-3 sm:p-3.5 rounded-xl whitespace-pre-wrap font-mono text-slate-200 text-[11px] sm:text-xs leading-relaxed selection:bg-amber-500 selection:text-slate-950">
                {citySummary}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-6">No summary available.</p>
            )}
          </div>

          {/* Footer Toolbar */}
          <div className="bg-[#050608] px-3.5 sm:px-4 py-2 sm:py-2.5 border-t border-slate-800 flex items-center justify-between gap-2 text-xs shrink-0">
            <button
              onClick={() => fetchCitySummary(selectedCity)}
              disabled={isLoadingSummary}
              className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] font-bold transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isLoadingSummary ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Data</span>
              <span className="sm:hidden">Refresh</span>
            </button>

            <div className="flex items-center space-x-2">
              {onOpenShareToX && (
                <button
                  type="button"
                  onClick={() => onOpenShareToX({
                    text: `🚨 ${summaryTitle || 'TRAFFIC BULLETIN'} (${selectedCity?.name || 'Gauteng'}):\n${citySummary ? (citySummary.length > 200 ? citySummary.slice(0, 195) + '...' : citySummary) : 'Live traffic updates.'}`,
                    category: 'map'
                  })}
                  disabled={!citySummary || isLoadingSummary}
                  className="flex items-center space-x-1.5 bg-[#050608] hover:bg-black text-white px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-700/80 text-[11px] font-bold transition cursor-pointer disabled:opacity-50"
                  title="Share this Bulletin to X.com"
                >
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span className="hidden sm:inline">Share</span>
                </button>
              )}

              <button
                onClick={handleToggleSpeech}
                disabled={!citySummary || isLoadingSummary}
                className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
                  isSpeaking
                    ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
                title="Read Summary Aloud"
              >
                {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-sky-400" />}
                <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
              </button>

              <button
                onClick={handleCopySummary}
                disabled={!citySummary || isLoadingSummary}
                className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3 py-1.5 rounded-lg text-[11px] shadow-md transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Driver Quick 1-Tap Report Modal / Drawer */}
      {showQuickReportModal && (
        <div 
          onClick={() => {
            setShowQuickReportModal(false);
          }}
          className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="bg-[#0F1115] border-2 border-amber-500/60 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]"
          >
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500 p-4 sm:p-5 text-slate-950 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="bg-slate-950 text-amber-400 p-2.5 rounded-2xl shadow-lg border border-amber-400/40 shrink-0">
                  <MapPin className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-950 leading-tight">
                    📍 Drop 'n Pin / Hazard Dispatch
                  </h3>
                  <p className="text-xs font-extrabold text-slate-900 mt-0.5">
                    1-Tap Instant Dispatch or Custom Map Pin
                  </p>
                </div>
              </div>
              <button
                type="button"
                style={{ touchAction: 'manipulation' }}
                onClick={() => {
                  setShowQuickReportModal(false);
                }}
                className="p-1.5 rounded-xl bg-slate-950/20 hover:bg-slate-950/40 text-slate-950 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Pinned Coords & Road Name Notice */}
            {pinnedCoords && (
              <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between text-xs text-amber-400 shrink-0">
                <div className="flex items-center space-x-2 min-w-0">
                  <MapPin className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                  <div className="truncate">
                    <span className="font-bold text-amber-300">
                      {isGeocodingPin ? 'Identifying road...' : (pinnedRoadName || 'Pinned Spot')}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400 ml-1.5 hidden sm:inline">
                      ({pinnedCoords.lat.toFixed(4)}, {pinnedCoords.lng.toFixed(4)})
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  style={{ touchAction: 'manipulation' }}
                  onClick={() => {
                    setPinnedCoords(null);
                    setPinnedRoadName(null);
                    setPinnedLocationName(null);
                  }}
                  className="text-[10px] uppercase font-bold text-slate-400 hover:text-white underline cursor-pointer shrink-0 ml-2"
                >
                  Use Live GPS
                </button>
              </div>
            )}

            {/* Instant Live Pin Notice */}
            <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 flex items-center space-x-2 text-xs text-amber-300 shrink-0">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-medium">
                {isUserAdmin
                  ? <strong>🛡️ Admin Dispatch: Pins broadcast live immediately to highway patrol and driver monitors.</strong>
                  : <strong>📍 Community Pin: Submitted reports require admin verification before publishing to public feed.</strong>}
              </span>
            </div>

            {/* 1-Tap Hazard Buttons */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              <p className="text-xs text-slate-300 font-semibold text-center uppercase tracking-wide">
                Tap hazard icon to dispatch instantly at {pinnedCoords ? (pinnedRoadName || 'pinned map spot') : 'your GPS location'}:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 1. Spiking */}
                <button
                  type="button"
                  style={{ touchAction: 'manipulation' }}
                  onClick={(e) => { e.stopPropagation(); triggerQuickSubmit('spiking'); }}
                  disabled={isSubmittingQuickReport}
                  className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-2xl border-2 border-red-400 shadow-lg transition active:scale-95 cursor-pointer text-left min-h-[58px]"
                >
                  <div className="p-2.5 bg-slate-950/40 rounded-xl transition shrink-0">
                    <AlertOctagon className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-black uppercase tracking-wider leading-none">🚨 Spiking</div>
                    <div className="text-[10px] text-red-100 font-medium mt-1 truncate">Spike traps / tire spikes</div>
                  </div>
                </button>

                {/* 2. Crash */}
                <button
                  type="button"
                  style={{ touchAction: 'manipulation' }}
                  onClick={(e) => { e.stopPropagation(); triggerQuickSubmit('crash'); }}
                  disabled={isSubmittingQuickReport}
                  className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-rose-700 to-orange-700 hover:from-rose-600 hover:to-orange-600 text-white rounded-2xl border-2 border-rose-400 shadow-lg transition active:scale-95 cursor-pointer text-left min-h-[58px]"
                >
                  <div className="p-2.5 bg-slate-950/40 rounded-xl transition shrink-0">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-black uppercase tracking-wider leading-none">💥 Crash</div>
                    <div className="text-[10px] text-rose-100 font-medium mt-1 truncate">Vehicle crash / collision</div>
                  </div>
                </button>

                {/* 3. Fatal Crash */}
                <button
                  type="button"
                  style={{ touchAction: 'manipulation' }}
                  onClick={(e) => { e.stopPropagation(); triggerQuickSubmit('fatal_crash'); }}
                  disabled={isSubmittingQuickReport}
                  className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-red-950 via-rose-950 to-slate-900 hover:from-red-900 hover:to-rose-900 text-white rounded-2xl border-2 border-red-500 shadow-lg shadow-red-950/50 transition active:scale-95 cursor-pointer text-left min-h-[58px]"
                >
                  <div className="p-2.5 bg-red-950/80 rounded-xl transition shrink-0 border border-red-500/50">
                    <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-black uppercase tracking-wider leading-none text-red-100 flex items-center gap-1.5">
                      <span>💀 Fatal Crash</span>
                      <span className="text-[9px] bg-red-500/30 text-red-300 px-1 py-0.2 rounded border border-red-500/50 font-bold uppercase">Critical</span>
                    </div>
                    <div className="text-[10px] text-red-300 font-bold mt-1 truncate">Fatality / Major Scene Closure</div>
                  </div>
                </button>

                {/* 4. Stationary */}
                <button
                  type="button"
                  style={{ touchAction: 'manipulation' }}
                  onClick={(e) => { e.stopPropagation(); triggerQuickSubmit('stationary'); }}
                  disabled={isSubmittingQuickReport}
                  className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-2xl border-2 border-amber-300 shadow-lg transition active:scale-95 cursor-pointer text-left min-h-[58px]"
                >
                  <div className="p-2.5 bg-slate-950/20 rounded-xl transition shrink-0">
                    <ShieldAlert className="w-5 h-5 text-slate-950" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-black uppercase tracking-wider leading-none text-slate-950">🛑 Stationary</div>
                    <div className="text-[10px] text-slate-900 font-bold mt-1 truncate">Broken down / obstruction</div>
                  </div>
                </button>

                {/* 4. Veld fire */}
                <button
                  type="button"
                  style={{ touchAction: 'manipulation' }}
                  onClick={(e) => { e.stopPropagation(); triggerQuickSubmit('veld_fire'); }}
                  disabled={isSubmittingQuickReport}
                  className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-orange-600 to-amber-700 hover:from-orange-500 hover:to-amber-600 text-white rounded-2xl border-2 border-orange-400 shadow-lg transition active:scale-95 cursor-pointer text-left min-h-[58px]"
                >
                  <div className="p-2.5 bg-slate-950/40 rounded-xl transition shrink-0">
                    <Flame className="w-5 h-5 text-amber-300 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-black uppercase tracking-wider leading-none">🔥 Veld Fire</div>
                    <div className="text-[10px] text-orange-100 font-medium mt-1 truncate">Roadside fire & smoke</div>
                  </div>
                </button>

                {/* 5. Congestion */}
                <button
                  type="button"
                  style={{ touchAction: 'manipulation' }}
                  onClick={(e) => { e.stopPropagation(); triggerQuickSubmit('congestion'); }}
                  disabled={isSubmittingQuickReport}
                  className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 rounded-2xl border-2 border-yellow-300 shadow-lg transition active:scale-95 cursor-pointer text-left min-h-[58px]"
                >
                  <div className="p-2.5 bg-slate-950/20 rounded-xl transition shrink-0">
                    <Car className="w-5 h-5 text-slate-950" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-black uppercase tracking-wider leading-none text-slate-950">🚗 Congestion</div>
                    <div className="text-[10px] text-slate-900 font-bold mt-1 truncate">Heavy traffic jam delay</div>
                  </div>
                </button>

                {/* 6. Pothole */}
                <button
                  type="button"
                  style={{ touchAction: 'manipulation' }}
                  onClick={(e) => { e.stopPropagation(); triggerQuickSubmit('pothole'); }}
                  disabled={isSubmittingQuickReport}
                  className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-slate-700 to-zinc-800 hover:from-slate-600 hover:to-zinc-700 text-white rounded-2xl border-2 border-slate-500 shadow-lg transition active:scale-95 cursor-pointer text-left min-h-[58px]"
                >
                  <div className="p-2.5 bg-slate-950/40 rounded-xl transition shrink-0">
                    <CircleDot className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-black uppercase tracking-wider leading-none">🕳️ Pothole</div>
                    <div className="text-[10px] text-slate-300 font-medium mt-1 truncate">Deep pothole / road defect</div>
                  </div>
                </button>

                {/* 7. Roadworks / Maintenance */}
                <button
                  type="button"
                  style={{ touchAction: 'manipulation' }}
                  onClick={(e) => { e.stopPropagation(); triggerQuickSubmit('roadworks'); }}
                  disabled={isSubmittingQuickReport}
                  className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-amber-600 to-yellow-700 hover:from-amber-500 hover:to-yellow-600 text-white rounded-2xl border-2 border-yellow-400 shadow-lg transition active:scale-95 cursor-pointer text-left min-h-[58px]"
                >
                  <div className="p-2.5 bg-slate-950/40 rounded-xl transition shrink-0">
                    <Wrench className="w-5 h-5 text-yellow-300" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-black uppercase tracking-wider leading-none">🚧 Roadworks</div>
                    <div className="text-[10px] text-yellow-100 font-medium mt-1 truncate">Lane maintenance & work zone</div>
                  </div>
                </button>

                {/* 8. Weather / Flooding */}
                <button
                  type="button"
                  style={{ touchAction: 'manipulation' }}
                  onClick={(e) => { e.stopPropagation(); triggerQuickSubmit('weather'); }}
                  disabled={isSubmittingQuickReport}
                  className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-cyan-700 to-teal-800 hover:from-cyan-600 hover:to-teal-700 text-white rounded-2xl border-2 border-cyan-400 shadow-lg transition active:scale-95 cursor-pointer text-left min-h-[58px]"
                >
                  <div className="p-2.5 bg-slate-950/40 rounded-xl transition shrink-0">
                    <CloudRain className="w-5 h-5 text-cyan-300" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-black uppercase tracking-wider leading-none">🌧️ Storm / Flood</div>
                    <div className="text-[10px] text-cyan-100 font-medium mt-1 truncate">Flooding & severe storm</div>
                  </div>
                </button>
              </div>

              {/* Pin Specific Location or Detailed Modal */}
              <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <button
                  type="button"
                  style={{ touchAction: 'manipulation' }}
                  onClick={() => {
                    setShowQuickReportModal(false);
                    setPinModeActive(true);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span>📍 Tap Map to Place Custom Pin</span>
                </button>

                <button
                  type="button"
                  style={{ touchAction: 'manipulation' }}
                  onClick={() => {
                    setShowQuickReportModal(false);
                    const lat = pinnedCoords ? pinnedCoords.lat : (selectedCity ? selectedCity.lat : -25.7479);
                    const lng = pinnedCoords ? pinnedCoords.lng : (selectedCity ? selectedCity.lng : 28.2293);
                    onSelectLocationForReport(lat, lng);
                  }}
                  className="text-xs text-slate-400 hover:text-white font-semibold underline cursor-pointer"
                >
                  Open Full Form Options →
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-[#050608] px-4 py-3 border-t border-slate-800 text-[11px] text-slate-400 text-center font-medium shrink-0">
              🛡️ Safe Driving Notice: 1-Tap dispatches directly to Live Traffic Patrol.
            </div>

          </div>
        </div>
      )}

      {/* Quick Report Success Toast */}
      {quickToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 font-black px-5 py-3 rounded-2xl shadow-2xl border-2 border-emerald-300 text-sm flex items-center space-x-2 animate-bounce">
          <Check className="w-5 h-5 text-slate-950 shrink-0" />
          <span>{quickToast.message}</span>
        </div>
      )}

      {/* Map Legend (Bottom Left - Positioned just above the first button bar) */}
      {showLiveTrafficNpc && !isFullscreen && (
        <div className="absolute bottom-2.5 sm:bottom-3 left-3 sm:left-4 z-20 bg-[#0F1115]/95 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-slate-800 shadow-2xl text-xs text-white max-w-xs hidden sm:block">
          <div className="flex items-center justify-between mb-2 gap-2">
            <h4 className="font-bold text-slate-400 text-[10px] uppercase tracking-widest">LiveTrafficNPC Hotspot Legend</h4>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded border text-emerald-400 bg-emerald-500/10 border-emerald-500/30">
              Hazards ON
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span>
              <span className="text-slate-300 text-xs">Spike Trap</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C5A059] inline-block"></span>
              <span className="text-slate-300 text-xs">Pothole</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
              <span className="text-slate-300 text-xs">Traffic Jam</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping inline-block"></span>
              <span className="text-slate-300 font-bold text-red-400 text-xs">Emergency SOS</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Quick GPS Recenter Action Button (Mobile Android / Driver Quick Locate) */}
      {!isFullscreen && (
        <button
          type="button"
          onClick={handleLocateMe}
          className={`absolute bottom-20 right-3.5 sm:bottom-24 sm:right-4 z-20 p-3 rounded-2xl shadow-2xl border-2 transition active:scale-90 cursor-pointer flex items-center justify-center group backdrop-blur-md ${
            isLocatingUser
              ? 'bg-amber-500 text-slate-950 border-amber-300 animate-pulse'
              : hasLocatedGPS
              ? 'bg-[#0F1115]/95 hover:bg-amber-500 text-emerald-400 hover:text-slate-950 border-emerald-500/60 hover:border-amber-400'
              : 'bg-[#0F1115]/95 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border-amber-500/70'
          }`}
          title="Center Map to My GPS Location"
          aria-label="Center Map to My GPS Location"
        >
          {isLocatingUser ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Crosshair className="w-5 h-5 transition-transform group-hover:scale-110 group-hover:rotate-45" />
          )}
        </button>
      )}

      {/* Address Search & Navigation Destination Modal */}
      {showSearchModal && (
        <div 
          className="fixed inset-0 z-[1000] flex items-start justify-center pt-16 sm:pt-20 px-3 sm:px-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
          onClick={() => setShowSearchModal(false)}
        >
          <div 
            className="bg-[#0F1115] border-2 border-sky-500/60 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Modal Header */}
            <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="bg-slate-950 text-sky-400 p-2.5 rounded-2xl shadow-lg border border-sky-400/40 shrink-0">
                  <Navigation className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white leading-tight">
                    Search Address & Route Navigation
                  </h3>
                  <p className="text-xs font-extrabold text-sky-100 mt-0.5">
                    Live Route Calculation with On-Route Hazard Detection
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSearchModal(false)}
                className="p-1.5 rounded-xl bg-slate-950/20 hover:bg-slate-950/40 text-white transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search Input Box */}
            <div className="p-4 sm:p-5 border-b border-slate-800 space-y-3 shrink-0">
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter street address, suburb, mall, airport or city in South Africa..."
                  autoFocus
                  className="w-full pl-11 pr-10 py-3 bg-slate-900/90 border-2 border-slate-700 focus:border-sky-500 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-hidden transition"
                />
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : isSearchingAddress ? (
                  <div className="absolute right-3.5">
                    <RefreshCw className="w-4 h-4 text-sky-400 animate-spin" />
                  </div>
                ) : null}
              </div>

              {/* Preset South Africa Hotspots */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Popular:</span>
                {POPULAR_SA_DESTINATIONS.slice(0, 6).map((dest) => (
                  <button
                    key={dest.name}
                    onClick={() => handleStartNavigation(dest)}
                    className="text-xs font-bold px-2.5 py-1 bg-slate-900 hover:bg-sky-950 text-slate-300 hover:text-sky-300 border border-slate-800 hover:border-sky-500/50 rounded-xl whitespace-nowrap transition cursor-pointer shrink-0"
                  >
                    📍 {dest.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Results List */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                <span>{searchQuery ? 'Search Results' : 'Suggested South Africa Destinations'}</span>
                {isSearchingAddress && <span className="text-sky-400 animate-pulse">Searching OSM...</span>}
              </div>

              {searchResults.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No destinations found for "{searchQuery}". Try searching by suburb or landmark.
                </div>
              ) : (
                searchResults.map((res, idx) => {
                  const userPos = getLastKnownUserPosition();
                  const originLat = userPos ? userPos.latitude : (selectedCity ? selectedCity.lat : -25.7479);
                  const originLng = userPos ? userPos.longitude : (selectedCity ? selectedCity.lng : 28.2293);
                  const distKm = getDistanceKm(originLat, originLng, res.lat, res.lng).toFixed(1);

                  return (
                    <button
                      key={`${res.name}-${idx}`}
                      disabled={isCalculatingRoute}
                      onClick={() => handleStartNavigation(res)}
                      className="w-full text-left p-3.5 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-sky-500/60 rounded-2xl transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-start space-x-3 min-w-0 pr-3">
                        <div className="p-2 bg-sky-500/10 group-hover:bg-sky-500 group-hover:text-slate-950 text-sky-400 rounded-xl transition shrink-0 mt-0.5">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 truncate">
                          <div className="text-sm font-extrabold text-white group-hover:text-sky-300 truncate">
                            {res.name}
                          </div>
                          <div className="text-xs text-slate-400 truncate mt-0.5">
                            {res.formattedAddress || 'South Africa'}
                          </div>
                          <div className="text-[11px] font-bold text-amber-400 mt-1">
                            📍 ~{distKm} km from current location
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 px-3 py-2 bg-sky-600 group-hover:bg-sky-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shrink-0 shadow-md">
                        <span>Navigate</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-[#050608] px-4 py-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
              <span className="flex items-center space-x-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>On-route hazard radar automatically scans within an 850m road buffer</span>
              </span>
              <span className="text-sky-400 font-mono font-bold">OSRM & OSM</span>
            </div>
          </div>
        </div>
      )}

      {/* Calculating Route Loading Toast */}
      {isCalculatingRoute && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-sky-600 text-white font-black px-6 py-3 rounded-2xl shadow-2xl border-2 border-sky-300 text-sm flex items-center space-x-3 animate-bounce">
          <RefreshCw className="w-5 h-5 text-white animate-spin shrink-0" />
          <span>Calculating driving route & scanning on-route hazards...</span>
        </div>
      )}

      {/* 1. Minimized Mini Navigation HUD Pill - Maximizes map visibility to 95%+ */}
      {activeRoute && !isFullscreen && isRouteHUDMinimized && (
        <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-4 right-2 sm:right-auto sm:max-w-md z-30 pointer-events-auto animate-fade-in">
          <div className="bg-[#0F1115]/95 backdrop-blur-md rounded-2xl border-2 border-sky-500/80 shadow-2xl p-2 sm:p-2.5 flex items-center justify-between gap-2 text-white">
            {/* Tap to expand destination & ETA */}
            <button
              type="button"
              onClick={() => setIsRouteHUDMinimized(false)}
              className="flex items-center space-x-2 min-w-0 flex-1 text-left cursor-pointer group"
              title="Click to expand full navigation details and turn-by-turn directions"
            >
              <div className="p-1.5 bg-sky-500 text-slate-950 rounded-xl shrink-0 group-hover:scale-105 transition-transform shadow-md">
                <Navigation className="w-4 h-4" />
              </div>
              <div className="min-w-0 truncate">
                <div className="text-xs font-black text-white group-hover:text-sky-300 truncate">
                  {activeRoute.destination.name}
                </div>
                <div className="text-[11px] font-bold text-sky-400 flex items-center space-x-1.5 mt-0.5">
                  <span>{activeRoute.distanceKm} km</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-amber-400">~{activeRoute.durationMin} min</span>
                  <span className="text-slate-600">•</span>
                  <span className={onRouteHazards.length > 0 ? 'text-red-400 font-extrabold' : 'text-emerald-400 font-bold'}>
                    {onRouteHazards.length > 0 ? `🚨 ${onRouteHazards.length} on route` : '✅ All Clear'}
                  </span>
                </div>
              </div>
            </button>

            {/* Quick Action Controls */}
            <div className="flex items-center space-x-1 shrink-0">
              {/* Voice alert toggle */}
              <button
                type="button"
                onClick={() => {
                  if (isRouteSpeaking) {
                    stopRouteVoice();
                  } else {
                    speakRouteWarning(activeRoute, onRouteHazards);
                  }
                }}
                className={`p-1.5 rounded-xl transition cursor-pointer ${
                  isRouteSpeaking ? 'bg-amber-500 text-slate-950 animate-pulse' : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
                title="Voice Alert On-Route Hazards"
              >
                {isRouteSpeaking ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              {/* Fit whole route corridor on map */}
              <button
                type="button"
                onClick={handleFitRoute}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white transition cursor-pointer"
                title="Fit full route corridor on map"
              >
                <Crosshair className="w-3.5 h-3.5" />
              </button>

              {/* Expand Details Button */}
              <button
                type="button"
                onClick={() => setIsRouteHUDMinimized(false)}
                className="px-2 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-[10px] sm:text-[11px] uppercase tracking-wider transition cursor-pointer flex items-center space-x-0.5 shadow-md"
                title="Expand Route Hazard Details"
              >
                <span>Details</span>
                <ChevronUp className="w-3 h-3" />
              </button>

              {/* Clear / Exit Route Button */}
              <button
                type="button"
                onClick={handleClearRoute}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white transition cursor-pointer"
                title="Exit Route Navigation"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Expanded Navigation & On-Route Hazard HUD Floating Card (Positioned bottom-left over Hotspot Legend) */}
      {activeRoute && !isFullscreen && !isRouteHUDMinimized && (
        <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-4 right-2 sm:right-auto sm:w-[420px] sm:max-w-md z-30 pointer-events-auto bg-[#0F1115]/95 backdrop-blur-md rounded-3xl border-2 border-sky-500/80 shadow-2xl text-slate-100 overflow-hidden flex flex-col animate-fade-in max-h-[65vh]">
          {/* HUD Header */}
          <div className="bg-gradient-to-r from-sky-600 to-blue-700 p-3 sm:p-3.5 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2 min-w-0 pr-2">
              <div className="p-1.5 bg-slate-950/40 rounded-xl text-white shrink-0">
                <Navigation className="w-4 h-4" />
              </div>
              <div className="min-w-0 truncate">
                <div className="text-[10px] font-black uppercase tracking-wider text-sky-200">
                  Active Route Navigation
                </div>
                <div className="text-sm font-black truncate leading-tight text-white">
                  {activeRoute.destination.name}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1 shrink-0">
              {/* Voice Alert Button */}
              <button
                type="button"
                onClick={() => {
                  if (isRouteSpeaking) {
                    stopRouteVoice();
                  } else {
                    speakRouteWarning(activeRoute, onRouteHazards);
                  }
                }}
                className={`p-1.5 rounded-xl transition cursor-pointer ${
                  isRouteSpeaking ? 'bg-amber-500 text-slate-950 animate-pulse' : 'bg-slate-950/40 hover:bg-slate-950/60 text-white'
                }`}
                title="Voice Alert On-Route Hazards"
              >
                {isRouteSpeaking ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Minimize / View Map Button */}
              <button
                type="button"
                onClick={() => setIsRouteHUDMinimized(true)}
                className="p-1.5 rounded-xl bg-slate-950/40 hover:bg-sky-500 text-white transition cursor-pointer flex items-center space-x-1"
                title="Minimize HUD to see full map"
              >
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Close / Clear Route Button */}
              <button
                type="button"
                onClick={handleClearRoute}
                className="p-1.5 rounded-xl bg-slate-950/40 hover:bg-red-600 text-white transition cursor-pointer"
                title="Exit Navigation & Clear Route"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Route Metric Stats Bar */}
          <div className="grid grid-cols-3 gap-1.5 p-2.5 bg-slate-900/90 border-b border-slate-800 text-center shrink-0">
            <div className="bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
              <div className="text-[9px] text-slate-400 font-bold uppercase">Distance</div>
              <div className="text-xs sm:text-sm font-black text-sky-400">{activeRoute.distanceKm} km</div>
            </div>
            <div className="bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
              <div className="text-[9px] text-slate-400 font-bold uppercase">Est. Duration</div>
              <div className="text-xs sm:text-sm font-black text-amber-400">~{activeRoute.durationMin} min</div>
            </div>
            <div className="bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
              <div className="text-[9px] text-slate-400 font-bold uppercase">Hazards</div>
              <div className={`text-xs sm:text-sm font-black ${onRouteHazards.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {onRouteHazards.length} on route
              </div>
            </div>
          </div>

          {/* On-Route Hazards Notification Section */}
          <div className="p-2.5 sm:p-3 overflow-y-auto space-y-2 flex-1">
            {onRouteHazards.length > 0 ? (
              <div className="space-y-1.5">
                <div className="bg-red-500/15 border border-red-500/40 rounded-2xl p-2.5 text-xs flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 animate-bounce" />
                    <span className="font-extrabold text-red-300 text-[11px]">
                      ⚠️ {onRouteHazards.length} Road Hazard{onRouteHazards.length > 1 ? 's' : ''} on Route!
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => speakRouteWarning(activeRoute, onRouteHazards)}
                    className="text-[9px] font-black uppercase text-amber-400 hover:text-white underline cursor-pointer"
                  >
                    🔊 Read Aloud
                  </button>
                </div>

                {/* List of Hazards along route */}
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                  {onRouteHazards.map((hazard, index) => {
                    const isSpiking = hazard.report.type === 'spiking';
                    const isCrash = hazard.report.type === 'crash';
                    const isStationary = hazard.report.type === 'stationary';
                    const isVeldFire = hazard.report.type === 'veld_fire';

                    let badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                    let icon = '⚠️';
                    if (isSpiking) {
                      badgeColor = 'bg-red-600/30 text-red-300 border-red-500';
                      icon = '🚨';
                    } else if (isCrash) {
                      badgeColor = 'bg-rose-600/30 text-rose-300 border-rose-500';
                      icon = '💥';
                    } else if (isStationary) {
                      badgeColor = 'bg-amber-500/30 text-amber-300 border-amber-500';
                      icon = '🛑';
                    } else if (isVeldFire) {
                      badgeColor = 'bg-orange-600/30 text-orange-300 border-orange-500';
                      icon = '🔥';
                    }

                    return (
                      <div
                        key={`${hazard.report.id}-${index}`}
                        className={`p-2 rounded-xl border ${badgeColor} flex items-center justify-between gap-2`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs">{icon}</span>
                            <span className="font-extrabold text-xs text-white truncate">
                              {hazard.report.title}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-300 mt-0.5 truncate">
                            📍 {hazard.report.roadName || hazard.report.locationName}
                          </div>
                          <div className="text-[10px] font-mono font-bold text-amber-400 mt-0.5">
                            Corridor Distance: {hazard.distanceFromStartKm} km from start
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            handleFocusHazardOnMap(hazard);
                            setIsRouteHUDMinimized(true);
                          }}
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-white rounded-xl text-[9px] font-bold uppercase border border-slate-700 shrink-0 cursor-pointer"
                        >
                          Focus Map →
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-2.5 text-xs flex items-center space-x-2 text-emerald-300 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-[11px]">
                  All Clear! No active spike traps, crashes, or severe hazards reported along this corridor.
                </span>
              </div>
            )}

            {/* Turn-by-Turn Guidance Toggle */}
            {activeRoute.steps && activeRoute.steps.length > 0 && (
              <div className="pt-1.5 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTurnSteps(!showTurnSteps)}
                  className="w-full text-left flex items-center justify-between py-1 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  <span className="flex items-center space-x-1.5">
                    <Milestone className="w-3.5 h-3.5 text-sky-400" />
                    <span>Turn Directions ({activeRoute.steps.length} steps)</span>
                  </span>
                  {showTurnSteps ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showTurnSteps && (
                  <div className="space-y-1 pt-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                    {activeRoute.steps.map((step, sIdx) => (
                      <div
                        key={sIdx}
                        className="text-[10px] p-1.5 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-300 flex items-start space-x-2"
                      >
                        <span className="text-sky-400 font-mono font-bold shrink-0">{sIdx + 1}.</span>
                        <div className="min-w-0">
                          <div className="font-semibold text-white">{step.instruction}</div>
                          {step.road && <div className="text-[9px] text-slate-400 font-mono">{step.road}</div>}
                          <div className="text-[9px] text-amber-500 font-bold">
                            {(step.distanceMeters / 1000).toFixed(1)} km
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* HUD Footer Action Buttons */}
          <div className="bg-[#050608] p-2.5 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsRouteHUDMinimized(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center space-x-1"
            >
              <Minimize2 className="w-3 h-3 text-sky-400" />
              <span>Minimize to Map</span>
            </button>

            <button
              type="button"
              onClick={handleClearRoute}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition cursor-pointer"
            >
              Exit Navigation
            </button>
          </div>
        </div>
      )}
      {showClearMapConfirmModal && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0F1115] border-2 border-red-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-red-500/20 border border-red-500/40 rounded-full flex items-center justify-center mx-auto text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider">Clear All Map Hazards?</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                This action will resolve and clear all active road hazards, spike trap alerts, and emergency SOS pins currently displayed on the map.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearMapConfirmModal(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isClearingMap}
                onClick={async () => {
                  setIsClearingMap(true);
                  if (onClearAllMapHazards) {
                    await onClearAllMapHazards();
                  }
                  setIsClearingMap(false);
                  setShowClearMapConfirmModal(false);
                  setQuickToast({ message: 'All active map hazards and SOS pins cleared!' });
                  setTimeout(() => setQuickToast(null), 3000);
                }}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg transition cursor-pointer flex items-center space-x-1.5"
              >
                {isClearingMap ? (
                  <span>Clearing...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Clear All Map Pins</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1-Hour Traffic Trend & Speed Variation Animated Floating HUD */}
      {showTrafficTrend && (
        <TrafficTrendHUD
          trendData={trendData}
          activeTimeIndex={trendActiveTimeIndex}
          isPlaying={trendIsPlaying}
          onTogglePlay={() => setTrendIsPlaying(!trendIsPlaying)}
          onSeek={(index) => {
            setTrendActiveTimeIndex(index);
            setTrendIsPlaying(false);
          }}
          onReset={() => {
            setTrendActiveTimeIndex(4);
            setTrendIsPlaying(false);
          }}
          playbackSpeed={trendPlaybackSpeed}
          onChangePlaybackSpeed={(speed) => setTrendPlaybackSpeed(speed)}
          onClose={() => setShowTrafficTrend(false)}
          onSelectBottleneck={handleSelectBottleneck}
        />
      )}

      {/* Floating Active Trip Buddy Navigation HUD & Emergency SOS Bar */}
      {activeTrip && (activeTrip.status === 'active' || activeTrip.status === 'emergency') && (
        <div className="absolute top-20 left-2 right-2 sm:left-auto sm:right-4 sm:w-96 z-20 bg-slate-950/90 backdrop-blur-md border-2 border-cyan-500/60 rounded-2xl shadow-2xl p-3 text-slate-100 animate-fadeIn">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider block">
                  TRIP BUDDY LIVE NAVIGATION
                </span>
                <h4 className="text-xs sm:text-sm font-black text-white truncate">
                  {activeTrip.departure} ➔ {activeTrip.destination}
                </h4>
              </div>
            </div>

            <span className="text-xs font-mono font-black text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-lg border border-cyan-800 shrink-0">
              {activeTrip.currentSpeedKmh || 0} km/h
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-[11px] text-slate-300 font-semibold">
              <span>Driver: <strong className="text-white">{activeTrip.driverName}</strong></span>
              <span className="text-cyan-300 font-mono">~{activeTrip.distanceTravelledKm || 0} / {activeTrip.estimatedDistanceKm || 100} km</span>
            </div>

            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(5, ((activeTrip.distanceTravelledKm || 0) / (activeTrip.estimatedDistanceKm || 100)) * 100))}%`
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 mt-2.5 pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                if (mapInstanceRef.current) {
                  const lat = activeTrip.currentLat || activeTrip.departureCoords?.lat || -25.7479;
                  const lng = activeTrip.currentLng || activeTrip.departureCoords?.lng || 28.2293;
                  mapInstanceRef.current.setView([lat, lng], 14, { animate: true });
                }
              }}
              className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Center Car</span>
            </button>

            <button
              onClick={onOpenTripBuddy}
              className="px-2 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-[11px] font-bold border border-cyan-800 flex items-center justify-center gap-1 transition cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>HUD Details</span>
            </button>

            <button
              onClick={() => {
                if (onOpenSOSModal) {
                  onOpenSOSModal({
                    emergencyType: 'spiking_puncture',
                    locationName: activeTrip.currentLocationName || `En route to ${activeTrip.destination}`,
                    notes: `🚨 URGENT MOTORIST SOS: Driver ${activeTrip.driverName} triggered panic en route to ${activeTrip.destination}.`
                  });
                } else if (onOpenTripBuddy) {
                  onOpenTripBuddy();
                }
              }}
              className="px-2 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-[11px] font-black shadow-lg shadow-red-600/30 flex items-center justify-center gap-1 transition animate-pulse cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>🚨 SOS</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
