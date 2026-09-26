import React, { useState, useRef, useEffect } from 'react';
import { ReportType, RegisteredUser, IncidentCategoryConfig } from '../types';
import { 
  X, Camera, MapPin, CheckCircle2, RefreshCw, Zap, Megaphone,
  Shield, Calendar, LocateFixed, Trash2, Sparkles, Navigation, AlertCircle,
  ClipboardPaste, Check, Compass, Link2, Ban, Layers, Timer, Gauge,
  Car, Truck, AlertTriangle, ShieldAlert, Flame, Waves, PackageX,
  Users, Construction, Disc, Radio, AlertOctagon, Info, Clock, CheckCircle,
  Edit3, MapPinOff, Activity, ArrowLeftRight, Hourglass, Split, OctagonX,
  CloudFog, CarFront, Wrench, ShieldX, Milestone, ChevronDown, ChevronUp, Map as MapIcon,
  Search, Eye, Tag, Siren, CloudRain, Wind, Octagon, ShieldCheck, Image as ImageIcon,
  SlidersHorizontal, HeartHandshake, User
} from 'lucide-react';
import { verifyUserLocation, clearLocationCache, getLastKnownUserPosition, getExactDeviceGps } from '../utils/locationChecker';
import { getCategoryDefaultImage, getCategoryConfig, getAllCategoryConfigs, subscribeCategoryImages, isActualAttachedImage, fetchCategoryDefaultImages } from '../utils/categoryImageHelper';
import { SARegionId, detectRegionFromCoords } from '../utils/regionUtils';
import { isPermittedAdminRole, getAdminSession } from '../utils/authUtils';
import { reverseGeocodeLocation, searchAddress, RouteSearchResult } from '../utils/routeUtils';
import { parseLocationInput, parseRemoteMapLink } from '../utils/coordinateParser';
import { ReportLocationPickerMap } from './ReportLocationPickerMap';

export type PostKind = 'live_alert' | 'advisory';
export type TrafficImpactType = 'road_closed' | 'lanes_blocked' | 'stop_and_go' | 'slow_moving' | 'low_visibility' | 'contra_flow' | 'no_impact';
export type AuthoritiesStatus = 'yes' | 'no' | 'not_sure' | null;

// Province center coordinates for map view centering when reporting remotely
const PROVINCE_CENTROIDS: Record<SARegionId, { lat: number; lng: number }> = {
  Gauteng: { lat: -25.9895, lng: 28.1284 }, // Midrand/Centurion corridor (central corridor between JHB & PTA)
  'KwaZulu-Natal': { lat: -29.8587, lng: 31.0218 },
  'Western Cape': { lat: -33.9249, lng: 18.4241 },
  'Eastern Cape': { lat: -33.9608, lng: 25.6022 },
  'Free State': { lat: -29.0852, lng: 26.1596 },
  Mpumalanga: { lat: -25.4753, lng: 30.9694 },
  Limpopo: { lat: -23.9045, lng: 29.4688 },
  'North West': { lat: -25.8560, lng: 25.6403 },
  'Northern Cape': { lat: -28.7282, lng: 24.7499 },
  all: { lat: -25.9895, lng: 28.1284 }
};

// Key highway corridors per province for quick selection
const POPULAR_PROVINCE_HIGHWAYS: Record<SARegionId, string[]> = {
  Gauteng: ['N1 North', 'N1 South', 'N3 South', 'N4 East', 'N12', 'N14', 'R21', 'M1', 'R24'],
  'KwaZulu-Natal': ['N2 North', 'N2 South', 'N3 North', 'N3 South', 'M4', 'M7', 'M13', 'M19'],
  'Western Cape': ['N1 North', 'N2 East', 'N7', 'M3', 'M5', 'R300', 'Atlantic Seaboard'],
  'Eastern Cape': ['N2', 'N6', 'N10', 'R72', 'M4', 'Old Cape Rd'],
  'Free State': ['N1 North', 'N1 South', 'N3', 'N5', 'N8'],
  Mpumalanga: ['N4 East', 'N4 West', 'N11', 'N12', 'R40', 'Schoemanskloof'],
  Limpopo: ['N1 North', 'N1 South', 'N11', 'R71', 'R81'],
  'North West': ['N4', 'N12', 'N14', 'R24', 'R30'],
  'Northern Cape': ['N1', 'N7', 'N8', 'N10', 'N12', 'N14'],
  all: ['N1', 'N2', 'N3', 'N4', 'N7', 'N12', 'N14', 'R21']
};

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitReport: (reportData: any) => Promise<void>;
  currentUser?: RegisteredUser | null;
  prefilledLat?: number;
  prefilledLng?: number;
  prefilledType?: ReportType;
  prefilledTitle?: string;
  prefilledOnScene?: boolean;
  autoDetectGps?: boolean;
}

// 9 South African Provinces with Short Code & Full Name
const SA_PROVINCES: Array<{ id: SARegionId; code: string; label: string; flagName: string }> = [
  { id: 'Eastern Cape', code: 'EC', label: 'Eastern Cape', flagName: 'Eastern Cape' },
  { id: 'Free State', code: 'FS', label: 'Free State', flagName: 'Free State' },
  { id: 'Gauteng', code: 'GP', label: 'Gauteng', flagName: 'Gauteng' },
  { id: 'KwaZulu-Natal', code: 'KZN', label: 'KwaZulu-Natal', flagName: 'KwaZulu-Natal' },
  { id: 'Limpopo', code: 'LP', label: 'Limpopo', flagName: 'Limpopo' },
  { id: 'Mpumalanga', code: 'MP', label: 'Mpumalanga', flagName: 'Mpumalanga' },
  { id: 'Northern Cape', code: 'NC', label: 'Northern Cape', flagName: 'Northern Cape' },
  { id: 'North West', code: 'NW', label: 'North West', flagName: 'North West' },
  { id: 'Western Cape', code: 'WC', label: 'Western Cape', flagName: 'Western Cape' },
];

// Driver-friendly category cards with dedicated modern Lucide icons
interface CategoryItemDef {
  id: ReportType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  subtitle: string;
  iconColor: string;
  badgeBg: string;
}

const CATEGORY_ITEMS: CategoryItemDef[] = [
  { id: 'crash', label: 'Crash / Collision', icon: CarFront, subtitle: 'Multi-vehicle crash, rollover or collision', iconColor: 'text-rose-400', badgeBg: 'bg-rose-500/20 border-rose-500/30' },
  { id: 'fatal_crash', label: 'Fatal Crash', icon: AlertTriangle, subtitle: 'Fatal collision, critical scene investigation & road closure', iconColor: 'text-rose-500', badgeBg: 'bg-rose-500/20 border-rose-500/30' },
  { id: 'protest', label: 'Protest / Road Blockade', icon: Users, subtitle: 'Civil action, barricades & unrest', iconColor: 'text-pink-400', badgeBg: 'bg-pink-500/20 border-pink-500/30' },
  { id: 'congestion', label: 'Traffic Congestion', icon: Car, subtitle: 'Severe backlog, gridlock queue, bottleneck delay', iconColor: 'text-cyan-400', badgeBg: 'bg-cyan-500/20 border-cyan-500/30' },
  { id: 'spillage', label: 'Cargo / Diesel Spillage', icon: PackageX, subtitle: 'Lost loads, diesel spill & debris', iconColor: 'text-yellow-400', badgeBg: 'bg-yellow-500/20 border-yellow-500/30' },
  { id: 'roadworks', label: 'Road Works / Construction', icon: Construction, subtitle: 'Resurfacing, paving & lane shifts', iconColor: 'text-amber-400', badgeBg: 'bg-amber-500/20 border-amber-500/30' },
  { id: 'pothole', label: 'Pothole / Road Damage', icon: Disc, subtitle: 'Severe tyre hazards & sinkholes', iconColor: 'text-slate-400', badgeBg: 'bg-slate-500/20 border-slate-500/30' },
  { id: 'spiking', label: 'Spike Trap / Road Hazard', icon: AlertOctagon, subtitle: 'Spikes, rocks, nails or traps on highway', iconColor: 'text-red-400', badgeBg: 'bg-red-500/20 border-red-500/30' },
  { id: 'breakdown', label: 'Breakdown / Stalls', icon: Truck, subtitle: 'Stationary truck, bus, or flat tyre', iconColor: 'text-amber-400', badgeBg: 'bg-amber-500/20 border-amber-500/30' },
  { id: 'stationary', label: 'Stationary / Disabled Vehicle', icon: ShieldAlert, subtitle: 'Vehicle obstructing travel lane or roadway shoulder', iconColor: 'text-orange-400', badgeBg: 'bg-orange-500/20 border-orange-500/30' },
  { id: 'veld_fire', label: 'Veld Fire / Heavy Smoke', icon: Flame, subtitle: 'Fire or thick smoke blowing across lanes reducing visibility', iconColor: 'text-orange-500', badgeBg: 'bg-orange-500/20 border-orange-500/30' },
  { id: 'traffic_lights', label: 'Traffic Lights Out / Broken', icon: Octagon, subtitle: 'Robot / traffic light failure, offline, or flashing red', iconColor: 'text-indigo-400', badgeBg: 'bg-indigo-500/20 border-indigo-500/30' },
  { id: 'crime', label: 'Crime / Hijacking', icon: ShieldX, subtitle: 'Armed robbery, hijacking & threats', iconColor: 'text-purple-400', badgeBg: 'bg-purple-500/20 border-purple-500/30' },
  { id: 'gbv_assist', label: 'GBV / Vulnerable Motorist Assist', icon: HeartHandshake, subtitle: 'Confidential emergency help, domestic safety & urgent patrol escort', iconColor: 'text-purple-400', badgeBg: 'bg-purple-500/20 border-purple-500/40' },
  { id: 'flood', label: 'Flooding / Water Hazard', icon: Waves, subtitle: 'Submerged roads & flash floods', iconColor: 'text-cyan-400', badgeBg: 'bg-cyan-500/20 border-cyan-500/30' },
  { id: 'weather', label: 'Weather / Storm Hazard', icon: CloudRain, subtitle: 'Heavy rain, hail, gale winds & low visibility', iconColor: 'text-sky-400', badgeBg: 'bg-sky-500/20 border-sky-500/30' },
  { id: 'other', label: 'Other Hazard / Alert', icon: Radio, subtitle: 'Animals on road, outages & general', iconColor: 'text-blue-400', badgeBg: 'bg-blue-500/20 border-blue-500/30' },
];

/**
 * Renders an appropriate Lucide icon component based on iconName or category ID
 */
export function renderCategoryIcon(iconName?: string, id?: string, className = "w-5 h-5"): React.ReactNode {
  const key = (iconName || id || '').toLowerCase();
  if (key.includes('flame') || key === 'veld_fire' || key === 'fire') return <Flame className={`${className} text-orange-500`} />;
  if (key.includes('spik') || key === 'spiking') return <AlertOctagon className={`${className} text-rose-400`} />;
  if (key.includes('fatal') || key === 'fatal_crash') return <AlertTriangle className={`${className} text-red-500`} />;
  if (key.includes('crash') || key.includes('accident') || key === 'crash') return <CarFront className={`${className} text-amber-400`} />;
  if (key.includes('car') || key === 'congestion' || key === 'traffic') return <Car className={`${className} text-cyan-400`} />;
  if (key.includes('pothole') || key.includes('damage')) return <Disc className={`${className} text-slate-400`} />;
  if (key.includes('construction') || key === 'roadworks') return <Construction className={`${className} text-amber-400`} />;
  if (key.includes('wrench')) return <Wrench className={`${className} text-yellow-400`} />;
  if (key.includes('shieldalert') || key === 'stationary') return <ShieldAlert className={`${className} text-orange-400`} />;
  if (key.includes('shieldx') || key === 'crime') return <ShieldX className={`${className} text-purple-400`} />;
  if (key.includes('heart') || key.includes('gbv') || key === 'gbv_assist') return <HeartHandshake className={`${className} text-purple-400`} />;
  if (key.includes('octagon') || key === 'traffic_lights') return <Octagon className={`${className} text-indigo-400`} />;
  if (key.includes('megaphone') || key === 'general') return <Megaphone className={`${className} text-cyan-300`} />;
  if (key.includes('sos') || key.includes('siren')) return <Siren className={`${className} text-red-400`} />;
  if (key.includes('rain') || key.includes('storm')) return <CloudRain className={`${className} text-sky-400`} />;
  if (key.includes('wave') || key.includes('flood')) return <Waves className={`${className} text-blue-400`} />;
  if (key.includes('zap') || key.includes('light') || key.includes('power')) return <Zap className={`${className} text-yellow-400`} />;
  if (key.includes('wind')) return <Wind className={`${className} text-teal-400`} />;
  if (key.includes('truck') || key.includes('heavy') || key === 'breakdown') return <Truck className={`${className} text-amber-300`} />;
  if (key.includes('package') || key === 'spillage') return <PackageX className={`${className} text-yellow-400`} />;
  if (key.includes('users') || key === 'protest') return <Users className={`${className} text-pink-400`} />;
  if (key.includes('sparkle')) return <Sparkles className={`${className} text-emerald-400`} />;
  return <AlertTriangle className={`${className} text-amber-400`} />;
}

/**
 * Returns stylish badge color classes matching the Incident Categories & Alert Banners design
 */
export function getCategoryBadgeClass(badge?: string): string {
  const b = (badge || '').toUpperCase();
  if (b.includes('FATAL') || b.includes('DANGER') || b.includes('CRITICAL')) {
    return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  }
  if (b.includes('HAZARD')) {
    return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  }
  if (b.includes('VISIBILITY') || b.includes('FIRE')) {
    return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
  }
  if (b.includes('HIGH RISK')) {
    return 'bg-red-500/20 text-red-300 border-red-500/40';
  }
  if (b.includes('OBSTRUCTION')) {
    return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  }
  if (b.includes('ROADWORKS')) {
    return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  }
  if (b.includes('OUTAGE')) {
    return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
  }
  if (b.includes('GBV')) {
    return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
  }
  if (b.includes('DELAY')) {
    return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
  }
  if (b.includes('EMERGENCY') || b.includes('SOS')) {
    return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  }
  return 'bg-slate-800 text-slate-300 border-slate-700';
}

// Traffic Impact Choices with modern Lucide icons & distinct custom styling
interface ImpactChoiceDef {
  id: TrafficImpactType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
  themeColor: string;
  badgeBg: string;
  borderActive: string;
}

const IMPACT_CHOICES: ImpactChoiceDef[] = [
  { 
    id: 'road_closed', 
    label: 'Road Closed', 
    icon: Ban, 
    desc: 'Total closure / detour in effect', 
    themeColor: 'text-rose-400', 
    badgeBg: 'bg-rose-500/20 border-rose-500/40 text-rose-300',
    borderActive: 'border-rose-500 bg-rose-950/40 ring-2 ring-rose-500/40 shadow-rose-950/50'
  },
  { 
    id: 'lanes_blocked', 
    label: 'Lanes Blocked', 
    icon: Split, 
    desc: '1 or more lanes obstructed', 
    themeColor: 'text-amber-400', 
    badgeBg: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
    borderActive: 'border-amber-400 bg-amber-950/40 ring-2 ring-amber-400/40 shadow-amber-950/50'
  },
  { 
    id: 'stop_and_go', 
    label: 'Stop-and-Go', 
    icon: Hourglass, 
    desc: 'Heavy stop & go delays', 
    themeColor: 'text-orange-400', 
    badgeBg: 'bg-orange-500/20 border-orange-500/40 text-orange-300',
    borderActive: 'border-orange-400 bg-orange-950/40 ring-2 ring-orange-400/40 shadow-orange-950/50'
  },
  { 
    id: 'slow_moving', 
    label: 'Slow Moving', 
    icon: Activity, 
    desc: 'Crawling traffic / bumper-to-bumper', 
    themeColor: 'text-cyan-400', 
    badgeBg: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300',
    borderActive: 'border-cyan-400 bg-cyan-950/40 ring-2 ring-cyan-400/40 shadow-cyan-950/50'
  },
  { 
    id: 'contra_flow', 
    label: 'Contra-Flow / Shift', 
    icon: ArrowLeftRight, 
    desc: 'Lanes diverted / temporary flow', 
    themeColor: 'text-indigo-400', 
    badgeBg: 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300',
    borderActive: 'border-indigo-400 bg-indigo-950/40 ring-2 ring-indigo-400/40 shadow-indigo-950/50'
  },
  { 
    id: 'no_impact', 
    label: 'Normal Traffic Flow', 
    icon: CheckCircle2, 
    desc: 'Off-road shoulder / minor impact', 
    themeColor: 'text-emerald-400', 
    badgeBg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
    borderActive: 'border-emerald-400 bg-emerald-950/40 ring-2 ring-emerald-400/40 shadow-emerald-950/50'
  },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  onSubmitReport,
  currentUser,
  prefilledLat,
  prefilledLng,
  prefilledType,
  prefilledTitle,
  prefilledOnScene = true,
  autoDetectGps = true,
}) => {
  // Step 0: "What would you like to post?" (Live Alert vs Advisory)
  // Step 1: Type
  // Step 2: Province
  // Step 3: Location & Impact
  // Step 4: Details, Authorities & Media
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [postKind, setPostKind] = useState<PostKind>('live_alert');

  // Form state
  const [type, setType] = useState<ReportType | null>(prefilledType || null);
  const [province, setProvince] = useState<SARegionId>('Gauteng');
  const [suggestedProvince, setSuggestedProvince] = useState<SARegionId>('Gauteng');
  
  // Location & Scene Status
  const [isOnScene, setIsOnScene] = useState<'yes' | 'no' | 'none' | null>(null);
  const [hasExplicitPin, setHasExplicitPin] = useState<boolean>(Boolean(prefilledLat && prefilledLng));
  const [roadLocation, setRoadLocation] = useState<string>('');
  const [additionalRoads, setAdditionalRoads] = useState<string[]>([]);
  const [latitude, setLatitude] = useState<number | null>(prefilledLat || null);
  const [longitude, setLongitude] = useState<number | null>(prefilledLng || null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsSource, setGpsSource] = useState<'gps' | 'network' | 'cache' | 'ip' | null>(null);
  const [showLocationPickerMap, setShowLocationPickerMap] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsStatusText, setGpsStatusText] = useState<string>('');

  // Road search & corridor suggestions state
  const [roadSuggestions, setRoadSuggestions] = useState<RouteSearchResult[]>([]);
  const [showRoadSuggestions, setShowRoadSuggestions] = useState<boolean>(false);
  const [isSearchingRoad, setIsSearchingRoad] = useState<boolean>(false);
  const roadSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Traffic Impact
  const [trafficImpact, setTrafficImpact] = useState<TrafficImpactType>('lanes_blocked');

  // Details
  const [description, setDescription] = useState<string>('');
  const [authoritiesOnScene, setAuthoritiesOnScene] = useState<AuthoritiesStatus>(null);
  const [googleMapsLink, setGoogleMapsLink] = useState<string>('');
  const [mapLinkStatus, setMapLinkStatus] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');
  const [advisoryStartDate, setAdvisoryStartDate] = useState<string>('');
  const [advisoryEndDate, setAdvisoryEndDate] = useState<string>('');

  // Incident Category & Alert Banner States (strictly loaded from the live database)
  const [allCategories, setAllCategories] = useState<IncidentCategoryConfig[]>(() => getAllCategoryConfigs());
  const [selectedCategoryConfig, setSelectedCategoryConfig] = useState<IncidentCategoryConfig | null>(() => {
    if (prefilledType) {
      const available = getAllCategoryConfigs();
      return available.find(c => c.id === prefilledType) || getCategoryConfig(prefilledType);
    }
    return null;
  });
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState<boolean>(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState<string>('');
  const [categoryFilterTab, setCategoryFilterTab] = useState<'all' | 'hazards' | 'with-banner' | 'custom'>('all');
  const [bannerPreference, setBannerPreference] = useState<'official_banner' | 'uploaded_photo'>('official_banner');

  // Admin Priority & Broadcast Flags
  const [broadcastTopRed, setBroadcastTopRed] = useState<boolean>(false);
  const [highlightGold, setHighlightGold] = useState<boolean>(false);

  // Reporter Identity (First Name & Surname)
  const [reporterFirstName, setReporterFirstName] = useState<string>(() => currentUser?.fullName || '');
  const [reporterSurname, setReporterSurname] = useState<string>(() => currentUser?.surname || '');

  // Submission & UI States
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [isUserAdmin, setIsUserAdmin] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.fullName) setReporterFirstName(currentUser.fullName);
      if (currentUser.surname) setReporterSurname(currentUser.surname);
    }
  }, [currentUser, isOpen]);

  const isOnSceneRef = useRef<'yes' | 'no' | 'none' | null>(isOnScene);
  useEffect(() => {
    isOnSceneRef.current = isOnScene;
  }, [isOnScene]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Admin role
  useEffect(() => {
    const isAdmin = Boolean(
      (currentUser && (
        isPermittedAdminRole(currentUser.role, currentUser.email) ||
        currentUser.email?.toLowerCase().trim() === 'charlesodendaal43@gmail.com'
      )) ||
      (!currentUser && (
        getAdminSession(null) ||
        (typeof window !== 'undefined' && Boolean(sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken')))
      ))
    );
    setIsUserAdmin(isAdmin);
  }, [currentUser, isOpen]);

  // Subscribe to category images & load real configs strictly from live database
  // Listen for dynamic category image updates or load categories
  useEffect(() => {
    if (!isOpen) return;

    const refreshCategories = () => {
      const configs = getAllCategoryConfigs();
      setAllCategories(configs);
    };

    refreshCategories();
    fetchCategoryDefaultImages().then(refreshCategories).catch(() => {});
    const unsub = subscribeCategoryImages(refreshCategories);
    return unsub;
  }, [isOpen]);

  const detectUserLocation = async (forceFresh = true) => {
    setIsLocating(true);
    setGpsStatusText('Acquiring GPS...');
    try {
      // Use exact same high-accuracy -> standard -> cached GPS flow as the interactive map
      const fix = await getExactDeviceGps({
        timeout: 10000,
        forceFresh
      });

      if (isOnSceneRef.current === 'none') return;

      if (fix) {
        const lat = fix.latitude;
        const lng = fix.longitude;
        const acc = fix.accuracy || null;
        setLatitude(lat);
        setLongitude(lng);
        setGpsAccuracy(acc);
        setGpsSource(fix.source);
        setIsOnScene('yes');
        isOnSceneRef.current = 'yes';

        const detected = detectRegionFromCoords(lat, lng);
        if (detected && detected !== 'all') {
          setProvince(detected);
          setSuggestedProvince(detected);
        }

        // Populate coordinate link preview
        setGoogleMapsLink(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        setMapLinkStatus(`✓ GPS Pin Locked (${lat.toFixed(4)}, ${lng.toFixed(4)})`);

        // Reverse geocode
        try {
          const geo = await reverseGeocodeLocation(lat, lng);
          if (isOnSceneRef.current === 'none') return;
          if (geo && geo.success) {
            setRoadLocation(geo.road || geo.locationName || '');
            if (geo.province) {
              const matched = SA_PROVINCES.find(
                (p) => p.label.toLowerCase() === geo.province?.toLowerCase() || p.id.toLowerCase() === geo.province?.toLowerCase()
              );
              if (matched) {
                setProvince(matched.id);
                setSuggestedProvince(matched.id);
              }
            }
          }
        } catch (geoErr) {
          console.debug('Reverse geocode error:', geoErr);
        }

        if (acc && acc <= 50) {
          setGpsStatusText(`GPS Locked (±${acc}m) ✓`);
        } else {
          setGpsStatusText(`GPS ±${acc || 0}m ✓`);
        }
      }
    } catch (e: any) {
      if (isOnSceneRef.current === 'none') return;
      console.warn('GPS detection failed:', e);
      const cached = getLastKnownUserPosition();
      if (cached && isOnSceneRef.current === 'yes') {
        setLatitude(cached.latitude);
        setLongitude(cached.longitude);
        setGpsAccuracy(cached.accuracy || null);
        setGpsSource('cache');
        setIsOnScene('yes');
        setGoogleMapsLink(`${cached.latitude.toFixed(5)}, ${cached.longitude.toFixed(5)}`);
        setMapLinkStatus(`✓ GPS Pin Locked (${cached.latitude.toFixed(4)}, ${cached.longitude.toFixed(4)})`);
        setGpsStatusText(`GPS Locked (±${cached.accuracy || 30}m) ✓`);
      } else if (e && e.code === 1) {
        setGpsStatusText('GPS Blocked');
      } else if (e && (e.code === 3 || e.message === 'TIMEOUT_EXCEEDED')) {
        setGpsStatusText('GPS Timeout');
      } else {
        setGpsStatusText('Detect GPS');
      }
    } finally {
      setIsLocating(false);
    }
  };

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      setSubmittedSuccess(false);
      setIsSubmitting(false);
      setShowLocationPickerMap(false);
      setIsCategoryPickerOpen(false);
      setCategorySearchQuery('');

      if (prefilledType) {
        const available = getAllCategoryConfigs();
        setType(prefilledType);
        const targetCfg = available.find(c => c.id === prefilledType) || getCategoryConfig(prefilledType);
        setSelectedCategoryConfig(targetCfg);
        setCurrentStep(2);
      } else {
        // Do not select anything when this screen opens
        setType(null);
        setSelectedCategoryConfig(null);
        setCurrentStep(0);
      }

      if (prefilledTitle) {
        setRoadLocation(prefilledTitle);
      } else {
        setRoadLocation('');
      }

      if (prefilledLat && prefilledLng) {
        setIsOnScene('yes');
        isOnSceneRef.current = 'yes';
        setLatitude(prefilledLat);
        setLongitude(prefilledLng);
        setHasExplicitPin(true);
        setGoogleMapsLink(`${prefilledLat.toFixed(5)}, ${prefilledLng.toFixed(5)}`);
        setMapLinkStatus(`✓ Pin Locked (${prefilledLat.toFixed(4)}, ${prefilledLng.toFixed(4)})`);
        setGpsStatusText('GPS Locked ✓');
        const detected = detectRegionFromCoords(prefilledLat, prefilledLng);
        if (detected && detected !== 'all') {
          setProvince(detected);
          setSuggestedProvince(detected);
        }
      } else if (autoDetectGps || prefilledOnScene) {
        // Automatically acquire GPS location on scene for fast reporting
        setIsOnScene('yes');
        isOnSceneRef.current = 'yes';
        setHasExplicitPin(true);
        const cached = getLastKnownUserPosition();
        if (cached && typeof cached.latitude === 'number' && typeof cached.longitude === 'number') {
          setLatitude(cached.latitude);
          setLongitude(cached.longitude);
          setGpsAccuracy(cached.accuracy || null);
          setGpsSource('cache');
          setGoogleMapsLink(`${cached.latitude.toFixed(5)}, ${cached.longitude.toFixed(5)}`);
          setMapLinkStatus(`✓ GPS Pin Locked (${cached.latitude.toFixed(4)}, ${cached.longitude.toFixed(4)})`);
          setGpsStatusText(cached.accuracy && cached.accuracy <= 50 ? `GPS Locked (±${cached.accuracy}m) ✓` : 'GPS Locked ✓');
          const detected = detectRegionFromCoords(cached.latitude, cached.longitude);
          if (detected && detected !== 'all') {
            setProvince(detected);
            setSuggestedProvince(detected);
          }
        }
        detectUserLocation(true);
      } else {
        // Remote reporting
        setIsOnScene('no');
        isOnSceneRef.current = 'no';
        setHasExplicitPin(false);
        setGpsStatusText('');
        setGoogleMapsLink('');
        setMapLinkStatus('');
        setLatitude(null);
        setLongitude(null);
        setGpsAccuracy(null);
        setGpsSource(null);

        const cached = getLastKnownUserPosition();
        if (cached) {
          const detected = detectRegionFromCoords(cached.latitude, cached.longitude);
          if (detected && detected !== 'all') {
            setProvince(detected);
            setSuggestedProvince(detected);
          }
        }
      }
    }
  }, [isOpen, prefilledType, prefilledTitle, prefilledLat, prefilledLng, autoDetectGps, prefilledOnScene]);

  const handleSetOnScene = (choice: 'yes' | 'no' | 'none') => {
    setIsOnScene(choice);
    isOnSceneRef.current = choice;
    if (choice === 'yes') {
      // User explicitly clicked that they are on scene: lock device GPS position
      const cached = getLastKnownUserPosition();
      if (cached) {
        setLatitude(cached.latitude);
        setLongitude(cached.longitude);
        setGpsAccuracy(cached.accuracy || null);
        setGpsSource('gps');
        setHasExplicitPin(true);
        setGoogleMapsLink(`${cached.latitude.toFixed(5)}, ${cached.longitude.toFixed(5)}`);
        setMapLinkStatus(`✓ GPS Pin Locked (${cached.latitude.toFixed(4)}, ${cached.longitude.toFixed(4)})`);
        setGpsStatusText(cached.accuracy && cached.accuracy <= 50 ? `GPS Locked (±${cached.accuracy}m) ✓` : 'GPS Locked ✓');
      }
      detectUserLocation(true);
    } else if (choice === 'none') {
      // User explicitly selected NO location:
      // Completely wipe out any road name, GPS, coordinates, pin, and links!
      setRoadLocation('');
      setAdditionalRoads([]);
      setHasExplicitPin(false);
      setGpsStatusText('');
      setGpsAccuracy(null);
      setGpsSource(null);
      setGoogleMapsLink('');
      setMapLinkStatus('');
      setLatitude(null);
      setLongitude(null);
      setShowRoadSuggestions(false);
      setRoadSuggestions([]);
    } else {
      // Not on scene: Remote reporting.
      // Clear GPS lock badge so it doesn't falsely display on-scene GPS.
      setGpsStatusText('');
      setGpsAccuracy(null);
      setGpsSource(null);
      // If no explicit pin has been dropped, leave coordinates empty so none are allocated
      if (!hasExplicitPin) {
        setLatitude(null);
        setLongitude(null);
      }
    }
  };

  const handleSelectProvince = (pId: SARegionId) => {
    setProvince(pId);
  };

  const handleRoadLocationChange = (val: string) => {
    setRoadLocation(val);
    if (roadSearchTimeoutRef.current) {
      clearTimeout(roadSearchTimeoutRef.current);
    }
    if (!val.trim() || val.trim().length < 3) {
      setRoadSuggestions([]);
      setShowRoadSuggestions(false);
      setIsSearchingRoad(false);
      return;
    }
    setIsSearchingRoad(true);
    roadSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const query = `${val.trim()}, ${province}`;
        const results = await searchAddress(query);
        if (results && results.length > 0) {
          setRoadSuggestions(results.slice(0, 5));
          setShowRoadSuggestions(true);
        } else {
          // Fallback search with broader terms
          const broader = await searchAddress(val.trim());
          if (broader && broader.length > 0) {
            setRoadSuggestions(broader.slice(0, 5));
            setShowRoadSuggestions(true);
          } else {
            setRoadSuggestions([]);
            setShowRoadSuggestions(false);
          }
        }
      } catch (err) {
        setRoadSuggestions([]);
        setShowRoadSuggestions(false);
      } finally {
        setIsSearchingRoad(false);
      }
    }, 350);
  };

  const handleSelectRoadSuggestion = (item: RouteSearchResult) => {
    setRoadLocation(item.name || item.displayName);
    setLatitude(item.lat);
    setLongitude(item.lng);
    setHasExplicitPin(true);
    setGoogleMapsLink(`${item.lat.toFixed(5)}, ${item.lng.toFixed(5)}`);
    setMapLinkStatus(`✓ Location Pinned (${item.lat.toFixed(4)}, ${item.lng.toFixed(4)})`);
    setShowRoadSuggestions(false);
    
    const detected = detectRegionFromCoords(item.lat, item.lng);
    if (detected && detected !== 'all') {
      setProvince(detected);
      setSuggestedProvince(detected);
    }
  };

  const handleSelectHighwayChip = (highway: string) => {
    if (!roadLocation.trim()) {
      setRoadLocation(highway + ' ');
    } else if (!roadLocation.toLowerCase().includes(highway.toLowerCase())) {
      setRoadLocation(highway + ' ' + roadLocation.trim());
    }
    handleRoadLocationChange(highway);
  };

  const handleLocationChangedFromMap = (
    lat: number,
    lng: number,
    reverseRoad?: string,
    detectedProv?: SARegionId
  ) => {
    if (isOnSceneRef.current === 'none') return;
    setLatitude(lat);
    setLongitude(lng);
    setHasExplicitPin(true);
    setGoogleMapsLink(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    setMapLinkStatus(`✓ Pin Adjusted (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    if (reverseRoad) {
      setRoadLocation(reverseRoad);
    }
    if (detectedProv && detectedProv !== 'all') {
      setProvince(detectedProv);
      setSuggestedProvince(detectedProv);
    }
    setGpsSource('cache');
    setGpsAccuracy(10);
    setGpsStatusText('Pin Set ✓');
  };

  const handleClearLocationPin = () => {
    setHasExplicitPin(false);
    setLatitude(null);
    setLongitude(null);
    setGoogleMapsLink('');
    setMapLinkStatus('');
    setGpsStatusText('');
    setGpsAccuracy(null);
    setGpsSource(null);
  };

  const handleSelectCategory = (catId: ReportType, config?: IncidentCategoryConfig) => {
    const isAlreadySelected = type === catId;
    setType(catId);
    const targetConfig = config || allCategories.find((c) => c.id === catId) || getCategoryConfig(catId);
    if (targetConfig) {
      setSelectedCategoryConfig(targetConfig);
    }
    if (isAlreadySelected) {
      setCurrentStep(2);
    }
  };

  const handleDirectSelectCategoryConfig = (config: IncidentCategoryConfig) => {
    setType(config.id as ReportType);
    setSelectedCategoryConfig(config);
    setIsCategoryPickerOpen(false);
  };

  // Filtered categories for search and tab filters (as seen in Image 2)
  const filteredCategories = allCategories.filter((cat) => {
    // Tab filter
    if (categoryFilterTab === 'with-banner') {
      if (!cat.imageUrl) return false;
    } else if (categoryFilterTab === 'hazards') {
      const isHazard = cat.id === 'crash' || cat.id === 'fatal_crash' || cat.id === 'spiking' || cat.id === 'pothole' || cat.id === 'veld_fire' || cat.badge?.includes('HAZARD') || cat.badge?.includes('CRITICAL');
      if (!isHazard) return false;
    } else if (categoryFilterTab === 'custom') {
      if (cat.isSystemDefault) return false;
    }

    // Search query filter
    if (!categorySearchQuery.trim()) return true;
    const q = categorySearchQuery.toLowerCase().trim();
    return (
      cat.label.toLowerCase().includes(q) ||
      cat.id.toLowerCase().includes(q) ||
      (cat.subtitle && cat.subtitle.toLowerCase().includes(q)) ||
      (cat.badge && cat.badge.toLowerCase().includes(q))
    );
  });

  const handleImageUpload = (file: File) => {
    if (!file) return;
    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const maxDimension = 1200;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.8);
          setImagePreview(compressed);
          setImageUrl(compressed);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageUrl('');
    setImageFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddAnotherRoad = () => {
    setAdditionalRoads([...additionalRoads, '']);
  };

  const handleUpdateAdditionalRoad = (index: number, val: string) => {
    const next = [...additionalRoads];
    next[index] = val;
    setAdditionalRoads(next);
  };

  const handleRemoveAdditionalRoad = (index: number) => {
    setAdditionalRoads(additionalRoads.filter((_, i) => i !== index));
  };

  const handleProcessMapLinkOrCoords = async (rawVal: string) => {
    setGoogleMapsLink(rawVal);
    if (!rawVal.trim()) {
      setMapLinkStatus('');
      return;
    }

    let parsed = parseLocationInput(rawVal);
    if (!parsed.success && (rawVal.includes('http://') || rawVal.includes('https://') || rawVal.includes('goo.gl') || rawVal.includes('maps.app'))) {
      parsed = await parseRemoteMapLink(rawVal);
    }

    if (parsed.success && parsed.latitude !== undefined && parsed.longitude !== undefined) {
      setLatitude(parsed.latitude);
      setLongitude(parsed.longitude);
      setHasExplicitPin(true);
      setMapLinkStatus(`✓ Pin Coordinates: ${parsed.latitude.toFixed(4)}, ${parsed.longitude.toFixed(4)}`);

      const detected = detectRegionFromCoords(parsed.latitude, parsed.longitude);
      if (detected && detected !== 'all') {
        setProvince(detected);
        setSuggestedProvince(detected);
      }

      try {
        const geo = await reverseGeocodeLocation(parsed.latitude, parsed.longitude);
        if (geo && geo.success && (geo.road || geo.locationName)) {
          setRoadLocation(geo.road || geo.locationName || '');
        } else if (parsed.extractedText) {
          setRoadLocation(parsed.extractedText);
        }
      } catch (e) {
        console.warn('Reverse geocode failed:', e);
        if (parsed.extractedText) {
          setRoadLocation(parsed.extractedText);
        }
      }
    } else {
      if (rawVal.includes('maps.google.') || rawVal.includes('goo.gl') || rawVal.includes('maps.app.goo.gl')) {
        setMapLinkStatus('✓ Map Link Attached');
      } else {
        setMapLinkStatus('');
      }
    }
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator?.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          handleProcessMapLinkOrCoords(text);
        }
      }
    } catch (e) {
      console.warn('Clipboard read error:', e);
    }
  };

  const handleSubmit = async () => {
    if (!type) {
      setCurrentStep(1);
      return;
    }
    const activeCategoryConfig = selectedCategoryConfig || allCategories.find((c) => c.id === type) || getCategoryConfig(type);
    const selectedCatLabel = activeCategoryConfig?.label || (CATEGORY_ITEMS.find((c) => c.id === type)?.label || 'Traffic Incident');
    const selectedCatBadge = activeCategoryConfig?.badge || 'HAZARD';
    const isNoLoc = isOnScene === 'none';

    let finalLat: number | undefined = undefined;
    let finalLng: number | undefined = undefined;
    let roadText: string | undefined = undefined;
    let locationText: string | undefined = undefined;

    if (!isNoLoc) {
      const userRoad = roadLocation.trim();
      // Only assign latitude/longitude if:
      // 1. User is on scene with verified GPS:
      if (isOnScene === 'yes' && typeof latitude === 'number' && typeof longitude === 'number') {
        finalLat = latitude;
        finalLng = longitude;
      } else if (hasExplicitPin && typeof latitude === 'number' && typeof longitude === 'number') {
        // 2. User explicitly pinned a position:
        finalLat = latitude;
        finalLng = longitude;
      } else if (isOnScene === 'no' && userRoad) {
        // 3. User entered a specific road remotely, attempt geocoding
        try {
          const matches = await searchAddress(`${userRoad}, ${province}`);
          if (matches && matches.length > 0) {
            finalLat = matches[0].lat;
            finalLng = matches[0].lng;
          } else {
            const broadMatches = await searchAddress(userRoad);
            if (broadMatches && broadMatches.length > 0) {
              finalLat = broadMatches[0].lat;
              finalLng = broadMatches[0].lng;
            }
          }
        } catch (e) {
          console.debug('Geocode on submit error:', e);
        }
      }

      if (userRoad) {
        roadText = userRoad;
        locationText = userRoad;
      } else if (googleMapsLink.trim() && hasExplicitPin && finalLat !== undefined && finalLng !== undefined) {
        roadText = `Map Pin (${finalLat.toFixed(4)}, ${finalLng.toFixed(4)})`;
        locationText = roadText;
      }
    }

    // Title construction:
    // If NO location selected, do NOT prepend any road/location. Keep title strictly clean!
    const finalTitle = isNoLoc
      ? (postKind === 'advisory' ? `Advisory: ${selectedCatLabel}` : selectedCatLabel)
      : roadText
      ? `${roadText} • ${selectedCatLabel}`
      : `${selectedCatLabel}`;

    // Additional roads formatting
    const extraRoads = isNoLoc ? [] : additionalRoads.map((r) => r.trim()).filter(Boolean);
    let finalDesc = description.trim();
    if (extraRoads.length > 0) {
      finalDesc = `[Also affects: ${extraRoads.join(', ')}]\n` + finalDesc;
    }

    const impactChoice = IMPACT_CHOICES.find((i) => i.id === trafficImpact);
    const impactLabel = impactChoice?.label || 'Lanes Blocked';
    let impactNote = `Traffic Impact: ${impactLabel}`;
    if (authoritiesOnScene) {
      impactNote += ` | Emergency Services: ${authoritiesOnScene === 'yes' ? 'On Scene' : authoritiesOnScene === 'no' ? 'None Yet' : 'En Route / Unknown'}`;
    }

    // Photo selection honoring user preference
    const categoryBanner = activeCategoryConfig?.imageUrl || selectedCategoryConfig?.imageUrl || getCategoryDefaultImage(activeCategoryConfig?.id || type);
    let finalPhoto: string | undefined = undefined;
    if (imagePreview && isActualAttachedImage(imagePreview)) {
      finalPhoto = imagePreview;
    } else if (imageUrl && isActualAttachedImage(imageUrl)) {
      finalPhoto = imageUrl;
    } else if (categoryBanner && isActualAttachedImage(categoryBanner)) {
      finalPhoto = categoryBanner;
    }

    const adminSession = getAdminSession(currentUser);
    const firstName = reporterFirstName.trim() || (currentUser?.fullName || '').trim();
    const surname = reporterSurname.trim() || (currentUser?.surname || '').trim();
    const combinedName = surname && !firstName.toLowerCase().includes(surname.toLowerCase())
      ? `${firstName} ${surname}`.trim()
      : (firstName || surname);
    const finalReporter = combinedName || (adminSession?.name) || (isUserAdmin ? '🛡️ Admin Dispatch' : 'Live Traffic SA Member');
    const userRole = isUserAdmin ? (currentUser?.role || adminSession?.role || 'admin') : (currentUser?.role || 'user');
    const userEmail = currentUser?.email || adminSession?.email || undefined;

    setIsSubmitting(true);
    try {
      await onSubmitReport({
        type,
        category: activeCategoryConfig?.id || type,
        categoryLabel: selectedCatLabel,
        categoryBadge: selectedCatBadge,
        title: finalTitle,
        description: finalDesc ? `${finalDesc}\n\n(${impactNote})` : `${finalTitle} (${impactNote})`,
        roadName: roadText || undefined,
        locationName: locationText || undefined,
        latitude: finalLat,
        longitude: finalLng,
        severity: type === 'fatal_crash' ? 'critical' : (type === 'crash' || type === 'crime' || type === 'spiking' ? 'high' : 'medium'),
        reporterName: finalReporter,
        reporterSurname: surname || undefined,
        postedByUserName: finalReporter,
        postedByUserSurname: surname || undefined,
        reporterPhone: currentUser?.cellNumber || undefined,
        imageUrl: finalPhoto,
        status: 'approved',
        autoApprove: true,
        verifiedByAdmin: isUserAdmin,
        isUserPost: !isUserAdmin,
        isAdmin: isUserAdmin,
        userRole,
        reporterEmail: userEmail,
        province,
        trafficImpact,
        authoritiesOnScene,
        additionalRoads: extraRoads,
        googleMapsLink: isNoLoc ? undefined : (googleMapsLink.trim() || undefined),
        advisoryStartDate: postKind === 'advisory' ? advisoryStartDate : undefined,
        advisoryEndDate: postKind === 'advisory' ? advisoryEndDate : undefined,
        broadcastTopRed: isUserAdmin ? broadcastTopRed : undefined,
        highlightGold: isUserAdmin ? highlightGold : undefined,
      });

      setSubmittedSuccess(true);
      setTimeout(() => {
        setSubmittedSuccess(false);
        setIsSubmitting(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Submit report error:', err);
      alert('Failed to submit alert. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-2.5 sm:p-4 pt-3 sm:pt-6 pb-6 sm:pb-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleImageUpload(e.target.files[0]);
          }
        }}
      />

      {/* Main Container - Dark Blue Theme matching Live Traffic SA */}
      <div className="bg-[#0B111E] text-slate-100 border border-slate-700/80 rounded-3xl w-full max-w-2xl sm:max-w-3xl h-auto max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] flex flex-col shadow-2xl overflow-hidden relative my-auto shrink-0">
        
        {/* Subtle top glowing ambient accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-amber-500 to-orange-500 opacity-80 z-10" />

        {/* ========================================================================= */}
        {/* SUCCESS STATE */}
        {/* ========================================================================= */}
        {submittedSuccess && (
          <div className="p-8 text-center space-y-4 flex-1 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <h3 className="text-xl font-black text-white">
              {isUserAdmin ? 'Alert Published Live!' : 'Report Queued for Admin Approval!'}
            </h3>
            <p className="text-sm text-slate-300 max-w-xs leading-relaxed">
              {isUserAdmin
                ? 'Thank you for keeping fellow motorists informed and safe on South African roads.'
                : 'Thank you! Your report has been submitted to the moderation queue for admin verification.'}
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 0: "What would you like to post?" */}
        {/* ========================================================================= */}
        {!submittedSuccess && currentStep === 0 && (
          <div className="p-6 sm:p-8 flex flex-col flex-1 overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-400">Live Traffic SA</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                  What would you like to post?
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Select incident category to broadcast to South African road users
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 my-auto py-2">
              {/* Option 1: Live Alert */}
              <button
                type="button"
                onClick={() => {
                  setPostKind('live_alert');
                  setCurrentStep(1);
                }}
                className="w-full text-left p-5 sm:p-6 rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-[#121C2F] to-[#17233B] hover:border-amber-400 hover:from-[#17243C] hover:to-[#1E2E4E] transition-all cursor-pointer flex items-center space-x-4 sm:space-x-5 shadow-lg group hover:scale-[1.01]"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/30 group-hover:scale-105 transition-transform">
                  <Zap className="w-7 h-7 fill-white stroke-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2.5">
                    <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
                      Live Alert
                    </h3>
                    <span className="bg-amber-500/20 text-amber-300 text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-500/30 uppercase tracking-wider">
                      Immediate
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                    For active crashes, hazards, spike traps, flooding or blockades currently affecting traffic.
                  </p>
                </div>
              </button>

              {/* Option 2: Traffic Advisory */}
              <button
                type="button"
                onClick={() => {
                  setPostKind('advisory');
                  setCurrentStep(1);
                }}
                className="w-full text-left p-5 sm:p-6 rounded-2xl border-2 border-purple-500/40 bg-gradient-to-br from-[#121C2F] to-[#1B1A38] hover:border-purple-400 hover:from-[#17243C] hover:to-[#222146] transition-all cursor-pointer flex items-center space-x-4 sm:space-x-5 shadow-lg group hover:scale-[1.01]"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/30 group-hover:scale-105 transition-transform">
                  <Megaphone className="w-7 h-7 stroke-[2.2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2.5">
                    <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
                      Traffic Advisory
                    </h3>
                    <span className="bg-purple-500/20 text-purple-300 text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-full border border-purple-500/30 uppercase tracking-wider">
                      Planned
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                    Planned roadworks, weekend closures, marathons, maintenance or scheduled road repairs.
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEPS 1 to 4: POST WIZARD */}
        {/* ========================================================================= */}
        {!submittedSuccess && currentStep >= 1 && (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            
            {/* Header with Title & Stepper Tracker */}
            <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-3.5 border-b border-slate-800 bg-[#0F1626] shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                  <h2 className="text-lg font-black text-white tracking-tight leading-tight">
                    {postKind === 'advisory' ? 'Post Traffic Advisory' : 'Post Live Alert'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modern Stepper Pill Indicators */}
              <div className="grid grid-cols-4 gap-1 sm:gap-2 mt-3 text-xs font-bold">
                {[
                  { step: 1, label: '1. Type' },
                  { step: 2, label: '2. Province' },
                  { step: 3, label: '3. Location' },
                  { step: 4, label: '4. Details' },
                ].map((s) => {
                  const isActive = currentStep === s.step;
                  const isDone = currentStep > s.step;
                  return (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => {
                        if (currentStep > s.step) setCurrentStep(s.step);
                      }}
                      className={`py-1.5 px-1 sm:px-2 rounded-lg text-center transition cursor-pointer text-[10px] sm:text-xs truncate ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                          : isDone
                          ? 'bg-slate-800/80 text-cyan-300 hover:bg-slate-800 hover:text-white'
                          : 'bg-slate-900/60 text-slate-500'
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step Body */}
            <div className="p-3.5 sm:p-6 flex-1 overflow-y-auto min-h-0 space-y-4">
              
              {/* =================================================================== */}
              {/* STEP 1: What happened? (Incident Types from Image 2) */}
              {/* =================================================================== */}
              {currentStep === 1 && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm sm:text-base font-black text-white">
                        What happened? <span className="text-amber-400">*</span>
                      </label>
                      <span className="text-xs text-slate-400">Select incident type to report</span>
                    </div>
                    <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-lg">
                      {CATEGORY_ITEMS.length} Types
                    </span>
                  </div>

                  {/* 2-Column Grid of Incident Types with robust overflow prevention */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-2.5 pt-1">
                    {CATEGORY_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const isSelected = type === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectCategory(item.id)}
                          className={`p-2.5 sm:p-3.5 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between shadow-sm relative min-h-[96px] sm:min-h-[105px] w-full min-w-0 overflow-hidden group ${
                            isSelected
                              ? 'bg-[#132338] border-cyan-400 text-white shadow-md ring-2 ring-cyan-400/30 shadow-cyan-950/40'
                              : 'bg-[#101827] border-slate-800 hover:border-slate-700 text-slate-200 hover:bg-[#152136]'
                          }`}
                        >
                          <div className="flex items-start gap-2 sm:gap-2.5 w-full min-w-0">
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl ${item.badgeBg} border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${item.iconColor}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="font-black text-[11px] sm:text-xs md:text-sm text-white leading-tight block break-words [overflow-wrap:anywhere] hyphens-auto">
                                {item.label}
                              </span>
                            </div>
                          </div>
                          <p className="text-[10px] sm:text-[11px] text-slate-400 line-clamp-2 mt-2 leading-tight w-full min-w-0 break-words">
                            {item.subtitle}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* =================================================================== */}
              {/* STEP 2: Province */}
              {/* =================================================================== */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm sm:text-base font-black text-white">
                      Select Province <span className="text-amber-400">*</span>
                    </label>
                    <span className="text-xs text-slate-400">South Africa</span>
                  </div>

                  {/* 2-Column Grid of 9 Provinces with Code & Full Name */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5 pt-1">
                    {SA_PROVINCES.map((p) => {
                      const isSelected = province === p.id;
                      return (
                        <button
                          key={p.code}
                          type="button"
                          onClick={() => handleSelectProvince(p.id)}
                          className={`py-2.5 px-3 sm:py-3 sm:px-3.5 rounded-2xl border-2 transition cursor-pointer text-left flex items-center justify-between shadow-sm min-w-0 overflow-hidden ${
                            isSelected
                              ? 'bg-gradient-to-r from-cyan-950/80 to-[#122744] border-cyan-400 text-white shadow-md ring-2 ring-cyan-400/30'
                              : 'bg-[#101827] border-slate-800 hover:border-slate-700 text-slate-200 hover:bg-[#152136]'
                          }`}
                        >
                          <div className="min-w-0 flex-1 pr-1">
                            <span className="font-black text-xs sm:text-sm block leading-none">{p.code}</span>
                            <span className="text-[10px] sm:text-[11px] text-slate-400 mt-1 block truncate">{p.label}</span>
                          </div>
                          {isSelected && (
                            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Suggested from Preferences / GPS */}
                  <div className="pt-2 px-4 py-3 bg-[#121B2B] rounded-2xl border border-slate-800 flex items-center justify-between text-xs text-slate-300">
                    <div className="flex items-center space-x-2 truncate">
                      <LocateFixed className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="text-slate-400">GPS Detected Province:</span>
                      <strong className="text-white font-bold">{suggestedProvince}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectProvince(suggestedProvince)}
                      className="bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition shrink-0 ml-2"
                    >
                      Use GPS
                    </button>
                  </div>
                </div>
              )}

              {/* =================================================================== */}
              {/* STEP 3: Location & Impact */}
              {/* =================================================================== */}
              {currentStep === 3 && (
                <div className="space-y-5 animate-fadeIn">
                  
                  {/* Location & GPS Card */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#0F172A]/70 border border-slate-800/90 space-y-4 shadow-inner">
                    
                    {/* "Are you on scene?" Interactive Selector */}
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-[#111A2E] border border-slate-700/80 space-y-2.5 shadow-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Radio className="w-4 h-4 text-cyan-400" />
                          <label className="block text-xs sm:text-sm font-black text-white">
                            Are you on scene? <span className="text-amber-400">*</span>
                          </label>
                        </div>
                        {isOnScene === 'yes' ? (
                          <span className="bg-emerald-500/20 text-emerald-300 text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Live GPS Geo</span>
                          </span>
                        ) : isOnScene === 'none' ? (
                          <span className="bg-sky-500/15 text-sky-300 text-[10.5px] font-bold px-2 py-0.5 rounded-full border border-sky-500/30 flex items-center space-x-1">
                            <MapPinOff className="w-3 h-3 text-sky-400" />
                            <span>No Location Selected</span>
                          </span>
                        ) : isOnScene === 'no' ? (
                          <span className="bg-amber-500/15 text-amber-300 text-[10.5px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center space-x-1">
                            <Edit3 className="w-3 h-3 text-amber-400" />
                            <span>Manual Entry</span>
                          </span>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {/* Yes Button */}
                        <button
                          type="button"
                          onClick={() => handleSetOnScene('yes')}
                          disabled={isLocating}
                          className={`p-3 rounded-xl border-2 text-left transition cursor-pointer flex items-center space-x-3 shadow-sm group ${
                            isOnScene === 'yes'
                              ? 'bg-emerald-950/40 border-emerald-500 text-white ring-2 ring-emerald-500/30 shadow-emerald-500/10'
                              : 'bg-[#101827] border-slate-800 hover:border-slate-600 text-slate-300 hover:bg-[#152136]'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                            isOnScene === 'yes' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                          }`}>
                            <LocateFixed className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-extrabold text-xs sm:text-sm leading-tight text-white">
                              Yes, on scene
                            </div>
                            <div className="text-[10.5px] text-slate-400 truncate mt-0.5">
                              Use device GPS
                            </div>
                          </div>
                        </button>

                        {/* No Button */}
                        <button
                          type="button"
                          onClick={() => handleSetOnScene('no')}
                          className={`p-3 rounded-xl border-2 text-left transition cursor-pointer flex items-center space-x-3 shadow-sm group ${
                            isOnScene === 'no'
                              ? 'bg-amber-950/30 border-amber-400 text-white ring-2 ring-amber-400/30 shadow-amber-500/10'
                              : 'bg-[#101827] border-slate-800 hover:border-slate-600 text-slate-300 hover:bg-[#152136]'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                            isOnScene === 'no' ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                          }`}>
                            <Edit3 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-extrabold text-xs sm:text-sm leading-tight text-white">
                              No, not on scene
                            </div>
                            <div className="text-[10.5px] text-slate-400 truncate mt-0.5">
                              Map Pin / Coordinates
                            </div>
                          </div>
                        </button>

                        {/* No Location Selected Button */}
                        <button
                          type="button"
                          onClick={() => handleSetOnScene('none')}
                          className={`p-3 rounded-xl border-2 text-left transition cursor-pointer flex items-center space-x-3 shadow-sm group ${
                            isOnScene === 'none'
                              ? 'bg-sky-950/40 border-sky-400 text-white ring-2 ring-sky-400/30 shadow-sky-500/10'
                              : 'bg-[#101827] border-slate-800 hover:border-slate-600 text-slate-300 hover:bg-[#152136]'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                            isOnScene === 'none' ? 'bg-sky-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                          }`}>
                            <MapPinOff className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-extrabold text-xs sm:text-sm leading-tight text-white">
                              No location selected
                            </div>
                            <div className="text-[10.5px] text-slate-400 truncate mt-0.5">
                              General / Province wide
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {isOnScene === 'none' ? (
                      /* No Location Selected: Provide a friendly notification */
                      <div className="space-y-3 pt-1 animate-fadeIn">
                        <div className="p-4 bg-sky-950/30 border border-sky-500/40 rounded-2xl space-y-2 shadow-inner">
                          <div className="flex items-center space-x-2 text-sky-300 font-extrabold text-xs sm:text-sm">
                            <MapPinOff className="w-4 h-4 text-sky-400 shrink-0" />
                            <span>No Location Selected</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            This post will be published without a map location, GPS pin, or coordinates. The location will not be shown on the post or the map.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 pt-1 animate-fadeIn">
                        {/* Road / Location Input */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-cyan-400" />
                              <label className="block text-sm font-black text-white">
                                {isOnScene === 'no' ? 'Road / Incident Location' : 'Road / Location'} <span className="text-amber-400">*</span>
                              </label>
                            </div>

                            {/* GPS detection button only when on scene */}
                            {isOnScene === 'yes' && (
                              <button
                                type="button"
                                onClick={detectUserLocation}
                                disabled={isLocating}
                                className={`text-xs font-bold cursor-pointer flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border transition shadow-sm ${
                                  isLocating
                                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                                    : latitude && longitude
                                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40'
                                    : 'bg-cyan-950/40 border-cyan-800/60 text-cyan-400 hover:bg-cyan-900/40 hover:text-cyan-300'
                                }`}
                                title="Click to detect current GPS location"
                              >
                                <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-amber-400' : 'text-emerald-400'}`} />
                                <span>{gpsStatusText || 'GPS Locked ✓'}</span>
                              </button>
                            )}
                          </div>

                          <div className="relative">
                            <input
                              type="text"
                              value={roadLocation}
                              onChange={(e) => handleRoadLocationChange(e.target.value)}
                              placeholder={
                                isOnScene === 'no'
                                  ? `e.g. N1 Northbound before Rigel, R21 South, or William Nicol`
                                  : `e.g. N3 southbound after PMB, before Peter Brown`
                              }
                              className="w-full bg-[#101827] border border-slate-700/80 rounded-xl px-4 py-3 text-white text-sm font-medium placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition shadow-inner"
                            />

                            {/* Road search suggestions dropdown */}
                            {showRoadSuggestions && roadSuggestions.length > 0 && (
                              <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-[#0F172A] border border-cyan-500/40 rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-800">
                                <div className="px-3 py-1.5 bg-slate-900/90 text-[10.5px] font-bold text-cyan-400 flex items-center justify-between">
                                  <span>Suggested Locations ({province}):</span>
                                  <button
                                    type="button"
                                    onClick={() => setShowRoadSuggestions(false)}
                                    className="text-slate-400 hover:text-white"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                {roadSuggestions.map((item, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleSelectRoadSuggestion(item)}
                                    className="w-full text-left px-3.5 py-2.5 hover:bg-cyan-950/50 cursor-pointer transition flex items-center space-x-2.5 text-xs text-slate-200"
                                  >
                                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                    <span className="truncate flex-1 font-medium">{item.displayName || item.name}</span>
                                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">Pin Spot →</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Quick Highway / Route Chips for Selected Province */}
                          {POPULAR_PROVINCE_HIGHWAYS[province] && POPULAR_PROVINCE_HIGHWAYS[province].length > 0 && (
                            <div className="pt-1">
                              <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mb-1.5">
                                <Navigation className="w-3 h-3 text-cyan-400" />
                                <span>Quick Corridors in {province}:</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {POPULAR_PROVINCE_HIGHWAYS[province].map((hwy) => (
                                  <button
                                    key={hwy}
                                    type="button"
                                    onClick={() => handleSelectHighwayChip(hwy)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                                      roadLocation.toLowerCase().includes(hwy.toLowerCase())
                                        ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-500/20'
                                        : 'bg-[#121B2B] border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                                    }`}
                                  >
                                    {hwy}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Location status badge */}
                          {isOnScene === 'yes' && latitude !== null && longitude !== null && (
                            <div className="flex items-center justify-between px-3 py-2 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
                              <div className="flex items-center space-x-1.5 truncate">
                                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span className="font-semibold">GPS Coordinates Attached:</span>
                                <span className="font-mono text-[11px] text-emerald-200">
                                  {latitude.toFixed(4)}, {longitude.toFixed(4)}
                                </span>
                                {gpsAccuracy && (
                                  <span className="text-[10.5px] text-emerald-400/90 font-mono">
                                    (±{gpsAccuracy}m)
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-wider shrink-0 ml-2">Live Geo</span>
                            </div>
                          )}

                          {isOnScene === 'no' && (
                            <div className="space-y-2 pt-1">
                              {hasExplicitPin ? (
                                <div className="flex items-center justify-between px-3 py-2 bg-cyan-950/40 border border-cyan-500/40 rounded-xl text-xs text-cyan-300">
                                  <div className="flex items-center space-x-2 truncate">
                                    <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                    <span className="font-semibold">Map Pin Position Set:</span>
                                    <span className="font-mono text-[11px] text-cyan-200">
                                      {latitude.toFixed(4)}, {longitude.toFixed(4)}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={handleClearLocationPin}
                                    className="text-[11px] text-rose-400 hover:text-rose-300 font-bold px-2 py-0.5 rounded bg-rose-950/40 border border-rose-800/40 cursor-pointer ml-2 shrink-0"
                                  >
                                    Clear Pin
                                  </button>
                                </div>
                              ) : (
                                <div className="p-2.5 rounded-xl bg-[#121B2B] border border-slate-800 text-[11.5px] text-slate-300 flex items-center justify-between space-x-2">
                                  <div className="flex items-start space-x-2 min-w-0">
                                    <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                                    <p className="leading-snug text-slate-300">
                                      {roadLocation.trim()
                                        ? `Posting remotely for ${roadLocation.trim()}.`
                                        : `No location set. If left blank, this post will have no map location allocated.`}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleSetOnScene('none')}
                                    className="text-[10.5px] text-sky-400 hover:text-sky-300 font-bold px-2 py-1 rounded bg-sky-950/40 border border-sky-800/40 cursor-pointer shrink-0 transition"
                                  >
                                    No Location
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Interactive Map & Highway Pinpoint Picker */}
                        <div className="pt-2 border-t border-slate-800/80">
                          <div 
                            onClick={() => setShowLocationPickerMap(!showLocationPickerMap)}
                            className="flex items-center justify-between mb-2 p-1.5 -mx-1.5 rounded-xl hover:bg-slate-800/40 cursor-pointer transition select-none group"
                          >
                            <div className="flex items-center space-x-2">
                              <div className="p-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 group-hover:bg-cyan-900/60 transition">
                                <MapIcon className="w-3.5 h-3.5 text-cyan-400" />
                              </div>
                              <span className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition">
                                Pinpoint Incident on Map
                              </span>
                              <span className="hidden sm:inline text-[11px] text-slate-400 font-normal">
                                (drag pin or click to adjust exact spot)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowLocationPickerMap(!showLocationPickerMap);
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-200 bg-cyan-950/50 hover:bg-cyan-900/70 border border-cyan-500/30 rounded-lg cursor-pointer transition flex items-center space-x-1 shadow-sm"
                            >
                              <span>{showLocationPickerMap ? 'Hide Map' : 'Show Map'}</span>
                              {showLocationPickerMap ? (
                                <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                              )}
                            </button>
                          </div>

                          {showLocationPickerMap && (
                            <div className="mt-1">
                              <ReportLocationPickerMap
                                latitude={latitude ?? (PROVINCE_CENTROIDS[province]?.lat || -25.9895)}
                                longitude={longitude ?? (PROVINCE_CENTROIDS[province]?.lng || 28.1284)}
                                accuracy={gpsAccuracy}
                                source={gpsSource}
                                province={province}
                                roadLocation={roadLocation}
                                onChangeLocation={handleLocationChangedFromMap}
                                onDetectGps={() => detectUserLocation(true)}
                                isLocating={isLocating}
                                onClearLocation={handleClearLocationPin}
                              />
                            </div>
                          )}
                        </div>

                        {/* Additional Affected Roads / Offramps */}
                        {additionalRoads.map((road, idx) => (
                          <div key={idx} className="flex items-center space-x-2 pt-1">
                            <input
                              type="text"
                              value={road}
                              onChange={(e) => handleUpdateAdditionalRoad(idx, e.target.value)}
                              placeholder="e.g. R103 alternate route"
                              className="flex-1 bg-[#101827] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveAdditionalRoad(idx)}
                              className="p-2 text-slate-400 hover:text-rose-400 cursor-pointer transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}

                        <div className="pt-0.5">
                          <button
                            type="button"
                            onClick={handleAddAnotherRoad}
                            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer flex items-center space-x-1"
                          >
                            <span>+ Add another affected road / offramp</span>
                          </button>
                        </div>

                        {/* Google Maps Link or GPS Coordinates */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                          <div className="flex items-center justify-between">
                            <label className="flex items-center space-x-1.5 text-xs font-bold text-slate-300">
                              <Link2 className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Google Maps Link or Pin Coordinates</span>
                              <span className="text-slate-500 font-normal">(optional)</span>
                            </label>
                            <button
                              type="button"
                              onClick={handlePasteClipboard}
                              className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer flex items-center space-x-1 bg-cyan-950/60 hover:bg-cyan-900/60 px-2 py-0.5 rounded-lg border border-cyan-800/60 transition"
                              title="Paste from clipboard"
                            >
                              <ClipboardPaste className="w-3 h-3" />
                              <span>Paste</span>
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              value={googleMapsLink}
                              onChange={(e) => handleProcessMapLinkOrCoords(e.target.value)}
                              placeholder="e.g. -26.1234, 28.1234 or https://maps.app.goo.gl/..."
                              className="w-full bg-[#101827] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white text-xs sm:text-sm font-medium placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition font-mono shadow-inner"
                            />
                          </div>

                          {mapLinkStatus ? (
                            <div className="flex items-center justify-between px-3 py-1.5 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-xs text-cyan-300">
                              <div className="flex items-center space-x-1.5 truncate">
                                <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                <span className="font-semibold">{mapLinkStatus}</span>
                              </div>
                              <span className="text-[10px] text-slate-400">Province & coordinates synced</span>
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400 leading-tight">
                              Paste a Google Maps share link, WhatsApp pin location, or Lat/Lng coords to pin the live map.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Traffic Impact Selection - Redesigned with custom icons & spacious cards */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm sm:text-base font-black text-white">
                        Traffic Impact <span className="text-amber-400">*</span>
                      </label>
                      <span className="text-xs text-slate-400">Select lane & flow condition</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {IMPACT_CHOICES.map((choice) => {
                        const isSelected = trafficImpact === choice.id;
                        const ImpactIcon = choice.icon;
                        return (
                          <button
                            key={choice.id}
                            type="button"
                            onClick={() => setTrafficImpact(choice.id)}
                            className={`p-3.5 sm:p-4 rounded-2xl border-2 text-left transition cursor-pointer flex items-center space-x-3.5 shadow-sm group relative ${
                              isSelected
                                ? `${choice.borderActive} shadow-lg`
                                : 'bg-[#101827] border-slate-800 hover:border-slate-700 hover:bg-[#152136]'
                            }`}
                          >
                            <div className={`w-11 h-11 rounded-xl ${choice.badgeBg} border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                              <ImpactIcon className={`w-6 h-6 ${choice.themeColor}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-black text-sm text-white block leading-tight">
                                  {choice.label}
                                </span>
                                {isSelected && (
                                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
                                )}
                              </div>
                              <span className="text-xs text-slate-400 block mt-1 leading-snug">
                                {choice.desc}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================================== */}
              {/* STEP 4: Details, Authorities & Media */}
              {/* =================================================================== */}
              {currentStep === 4 && (
                <div className="space-y-3.5 animate-fadeIn">
                  
                  {/* Reporter Identity (Name and Surname displayed on the Live Feed) */}
                  <div className="p-3.5 rounded-2xl border border-slate-800 bg-[#101827] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-200">
                        <User className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Reporter Details (Name & Surname on Feed)</span>
                      </div>
                      <span className="text-[10px] text-cyan-300 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                        Feed Attribution
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">First Name</label>
                        <input
                          type="text"
                          value={reporterFirstName}
                          onChange={(e) => setReporterFirstName(e.target.value)}
                          placeholder="e.g. Charles"
                          className="w-full bg-[#152136] border border-slate-700/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Surname</label>
                        <input
                          type="text"
                          value={reporterSurname}
                          onChange={(e) => setReporterSurname(e.target.value)}
                          placeholder="e.g. Odendaal"
                          className="w-full bg-[#152136] border border-slate-700/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes / Description */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Description / Notes <span className="text-slate-500 font-normal">(optional)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. 2 vehicles involved, heavy delays, traffic moving slowly..."
                      className="w-full bg-[#101827] border border-slate-700/80 rounded-2xl p-3 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-400 transition"
                    />
                  </div>

                  {/* Authorities on scene */}
                  <div className="p-3.5 rounded-2xl border border-slate-800 bg-[#101827] space-y-2">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-200">
                      <Shield className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Are emergency authorities / SAPS on scene?</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'yes', label: 'Yes' },
                        { id: 'no', label: 'No' },
                        { id: 'not_sure', label: 'Not sure' },
                      ].map((auth) => {
                        const isSelected = authoritiesOnScene === auth.id;
                        return (
                          <button
                            key={auth.id}
                            type="button"
                            onClick={() => setAuthoritiesOnScene(auth.id as AuthoritiesStatus)}
                            className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition cursor-pointer shadow-sm text-center ${
                              isSelected
                                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400'
                                : 'bg-[#152136] border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                          >
                            {auth.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Media / Photos */}
                  <div className="p-3.5 rounded-2xl border border-slate-800 bg-[#101827] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">Scene photo or video</span>
                      <span className="text-slate-500 text-[11px]">(optional)</span>
                    </div>

                    {imagePreview && imagePreview.trim() ? (
                      <div className="flex items-center justify-between p-2.5 bg-[#152136] border border-slate-700 rounded-xl shadow-sm">
                        <div className="flex items-center space-x-3 min-w-0">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-12 h-12 rounded-lg object-cover border border-slate-700 shrink-0"
                          />
                          <span className="text-xs font-mono text-slate-300 truncate max-w-[180px]">
                            {imageFileName || 'photo_upload.jpg'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg cursor-pointer transition"
                          title="Remove photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-slate-700 hover:border-cyan-400 bg-[#121B2B] hover:bg-cyan-950/30 text-cyan-300 text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition cursor-pointer shadow-sm"
                      >
                        <Camera className="w-4 h-4 text-cyan-400" />
                        <span>Add scene photos or dashcam capture</span>
                      </button>
                    )}
                  </div>

                  {/* Incident Category & Alert Banner Selection (From Incident Categories & Alert Banners seen in Image 2) */}
                  <div className="p-3.5 rounded-2xl border border-slate-800 bg-[#101827] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 rounded-lg bg-cyan-950/70 border border-cyan-500/30 text-cyan-400">
                          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">
                            Incident Category & Alert Banner
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            Select from live categories with 3.2:1 alert banners
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsCategoryPickerOpen(!isCategoryPickerOpen)}
                        className="px-2.5 py-1 text-xs font-bold text-cyan-300 hover:text-white bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 rounded-xl cursor-pointer transition flex items-center space-x-1.5 shadow-sm"
                      >
                        <Tag className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{isCategoryPickerOpen ? 'Hide Picker' : 'Change Category'}</span>
                        {isCategoryPickerOpen ? (
                          <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                      </button>
                    </div>

                    {/* Active Selected Category Card (Matches the design in Image 2) */}
                    <div className="p-3 rounded-xl border border-slate-700/80 bg-[#0B111E] shadow-sm space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center shrink-0">
                            {renderCategoryIcon(selectedCategoryConfig?.iconName, selectedCategoryConfig?.id || type, "w-4 h-4")}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2 flex-wrap">
                              <span className="font-bold text-white text-xs sm:text-sm truncate">
                                {selectedCategoryConfig?.label || (CATEGORY_ITEMS.find(c => c.id === type)?.label || 'Incident')}
                              </span>
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border tracking-wider ${getCategoryBadgeClass(selectedCategoryConfig?.badge)}`}>
                                {selectedCategoryConfig?.badge || 'HAZARD'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {selectedCategoryConfig?.subtitle || (CATEGORY_ITEMS.find(c => c.id === type)?.subtitle || '')}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 3.2:1 Aspect Ratio Panoramic Alert Banner Preview (Matching Image 2) */}
                      <div className="relative aspect-[3.2/1] rounded-xl overflow-hidden border border-slate-800 bg-[#050608] shadow-inner group">
                        {Boolean(selectedCategoryConfig?.imageUrl || getCategoryDefaultImage(selectedCategoryConfig?.id || type)) && (
                          <img
                            src={selectedCategoryConfig?.imageUrl || getCategoryDefaultImage(selectedCategoryConfig?.id || type) || undefined}
                            alt={selectedCategoryConfig?.label || 'Alert Banner'}
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              const target = e.currentTarget;
                              const fallback = `/photo/${encodeURIComponent(selectedCategoryConfig?.id || type || 'general')}`;
                              if (target.src !== fallback && !target.src.endsWith(fallback)) {
                                target.src = fallback;
                              }
                            }}
                          />
                        )}
                        
                        {/* Dark gradient overlay for text legibility */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/25 pointer-events-none" />

                        {/* Top-left pill: CUSTOM ALERT BANNER with Sparkles (Matching Image 2) */}
                        <div className="absolute top-2 left-2 flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold shadow-md backdrop-blur-sm">
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                          <span>CUSTOM ALERT BANNER</span>
                        </div>

                        {/* Centered Category Title & Subtitle overlay (Matching Image 2) */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center pointer-events-none">
                          <h4 className="text-white font-black text-sm sm:text-base tracking-wide drop-shadow-md">
                            {selectedCategoryConfig?.label || 'Incident Alert'}
                          </h4>
                          <p className="text-[10.5px] text-slate-200/90 font-medium max-w-sm line-clamp-1 drop-shadow-sm mt-0.5">
                            {selectedCategoryConfig?.subtitle || 'Live Traffic SA Emergency Alert'}
                          </p>
                        </div>

                        {/* Bottom-left tag: 3.2 : 1 Panoramic Banner (Matching Image 2) */}
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 border border-slate-700/60 text-[9.5px] font-mono text-slate-300 backdrop-blur-sm">
                          3.2 : 1 Panoramic Banner
                        </div>
                      </div>
                    </div>

                    {/* Expandable Category Picker Modal / Tray (Displays all categories seen in Image 2) */}
                    {isCategoryPickerOpen && (
                      <div className="mt-2 p-3 sm:p-4 rounded-xl border border-cyan-500/40 bg-[#0B111E] space-y-3 animate-fadeIn shadow-2xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs sm:text-sm font-black text-white flex items-center space-x-1.5">
                              <Layers className="w-4 h-4 text-cyan-400" />
                              <span>Select Incident Category</span>
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Choose an incident category with its badge and 3.2:1 alert banner from Image 2
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsCategoryPickerOpen(false)}
                            className="text-slate-400 hover:text-white p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Search Input */}
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={categorySearchQuery}
                            onChange={(e) => setCategorySearchQuery(e.target.value)}
                            placeholder="Search categories (fatal crash, veld fire, spiking, congestion...)"
                            className="w-full bg-[#101827] border border-slate-700 rounded-xl pl-8 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                          />
                          {categorySearchQuery && (
                            <button
                              type="button"
                              onClick={() => setCategorySearchQuery('')}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* Category Filter Tabs */}
                        <div className="flex flex-wrap gap-1.5 text-[11px]">
                          {[
                            { id: 'all', label: 'All Categories' },
                            { id: 'hazards', label: 'Hazards & Crashes' },
                            { id: 'with-banner', label: 'With 3.2:1 Banner' },
                            { id: 'custom', label: 'Custom' },
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setCategoryFilterTab(tab.id as any)}
                              className={`px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                                categoryFilterTab === tab.id
                                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                                  : 'bg-[#101827] border-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        {/* Grid of categories matching the cards in Image 2 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                          {filteredCategories.map((cat) => {
                            const isSelected = (selectedCategoryConfig?.id || type) === cat.id;
                            const bannerUrl = cat.imageUrl || getCategoryDefaultImage(cat.id);
                            return (
                              <div
                                key={cat.id}
                                onClick={() => handleDirectSelectCategoryConfig(cat)}
                                className={`p-2.5 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-2 group relative ${
                                  isSelected
                                    ? 'bg-[#15233D] border-cyan-400 ring-2 ring-cyan-400/40'
                                    : 'bg-[#101827] border-slate-800 hover:border-slate-700 hover:bg-[#131E30]'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-1.5">
                                  <div className="flex items-center space-x-2 min-w-0">
                                    <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                                      {renderCategoryIcon(cat.iconName, cat.id, "w-3.5 h-3.5")}
                                    </div>
                                    <div className="min-w-0">
                                      <span className="font-bold text-xs text-white truncate block">
                                        {cat.label}
                                      </span>
                                      <span className="text-[10px] text-slate-400 truncate block">
                                        {cat.subtitle}
                                      </span>
                                    </div>
                                  </div>
                                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border shrink-0 ${getCategoryBadgeClass(cat.badge)}`}>
                                    {cat.badge || 'HAZARD'}
                                  </span>
                                </div>

                                {/* Mini banner preview in 3.2:1 aspect */}
                                <div className="relative aspect-[3.2/1] rounded-lg overflow-hidden border border-slate-800 bg-black/40">
                                  {bannerUrl && bannerUrl.trim() ? (
                                    <img
                                      src={bannerUrl}
                                      alt={cat.label}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-950 text-slate-500 text-[10px]">
                                      No Banner
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-black/30 pointer-events-none" />
                                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-slate-300">
                                    3.2:1
                                  </div>
                                  {isSelected && (
                                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-cyan-500 text-slate-950 text-[9px] font-bold">
                                      ✓ SELECTED
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* If Traffic Advisory: Start & End Dates */}
                  {postKind === 'advisory' && (
                    <div className="p-3.5 rounded-2xl border border-purple-500/40 bg-purple-950/20 space-y-2">
                      <span className="text-xs font-bold text-purple-300 flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-purple-400" />
                        <span>Advisory Schedule (Dates)</span>
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Start Date</label>
                          <input
                            type="datetime-local"
                            value={advisoryStartDate}
                            onChange={(e) => setAdvisoryStartDate(e.target.value)}
                            className="w-full bg-[#101827] border border-purple-500/40 rounded-xl p-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">End Date</label>
                          <input
                            type="datetime-local"
                            value={advisoryEndDate}
                            onChange={(e) => setAdvisoryEndDate(e.target.value)}
                            className="w-full bg-[#101827] border border-purple-500/40 rounded-xl p-2 text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Admin Broadcast & Highlighting Options - strictly rendered for admins only */}
                  {isUserAdmin && (
                    <div className="p-3.5 rounded-2xl border transition-all border-amber-500/40 bg-gradient-to-br from-amber-950/25 via-[#0D1525] to-[#0A0E18] shadow-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                            <Radio className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-black text-amber-400 uppercase tracking-wider block">
                              Admin Broadcast & Highlighting Controls
                            </span>
                            <span className="text-[10.5px] text-slate-400 block">
                              Special alert visibility flags for verified patrol dispatch
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          PATROL PRIORITY
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* Broadcast on Top Red */}
                        <label className={`flex items-start space-x-2.5 p-3 rounded-xl border cursor-pointer transition select-none ${
                          broadcastTopRed
                            ? 'bg-red-950/40 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                            : 'bg-[#101827] border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}>
                          <input
                            type="checkbox"
                            checked={broadcastTopRed}
                            onChange={(e) => setBroadcastTopRed(e.target.checked)}
                            className="mt-0.5 rounded border-red-600 text-red-600 focus:ring-red-500 w-4 h-4 bg-slate-900 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-black text-red-400 flex items-center space-x-1">
                              <span>🔴 Broadcast on Top Red</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                              Shows in red emergency broadcast bar at the top of the live feed. Clicking it navigates directly to this post.
                            </p>
                          </div>
                        </label>

                        {/* Highlight with Gold / Yellow Ring */}
                        <label className={`flex items-start space-x-2.5 p-3 rounded-xl border cursor-pointer transition select-none ${
                          highlightGold
                            ? 'bg-amber-950/40 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                            : 'bg-[#101827] border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}>
                          <input
                            type="checkbox"
                            checked={highlightGold}
                            onChange={(e) => setHighlightGold(e.target.checked)}
                            className="mt-0.5 rounded border-amber-500 text-amber-500 focus:ring-amber-500 w-4 h-4 bg-slate-900 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-black text-amber-400 flex items-center space-x-1">
                              <span>🟡 Post Highlight (Yellow / Gold Ring)</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                              Pins post to the top as the first post for this area and wraps it with a glowing gold/yellow ring border.
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>

            {/* Bottom Navigation Buttons Bar */}
            <div className="p-4 border-t border-slate-800 bg-[#0F1626] grid grid-cols-2 gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (currentStep > 1) {
                    setCurrentStep(currentStep - 1);
                  } else {
                    setCurrentStep(0);
                  }
                }}
                className="py-3 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-sm sm:text-base transition cursor-pointer text-center"
              >
                Back
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={
                    (currentStep === 1 && !type) ||
                    (currentStep === 3 && (
                      isOnScene === 'none'
                        ? false
                        : isOnScene === 'no'
                        ? (!googleMapsLink.trim() && !roadLocation.trim())
                        : !roadLocation.trim()
                    ))
                  }
                  className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-sm sm:text-base transition cursor-pointer shadow-lg shadow-orange-500/20 text-center"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-slate-950 font-black text-sm sm:text-base transition cursor-pointer shadow-lg shadow-orange-500/20 flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Posting...</span>
                    </>
                  ) : (
                    <span>Post Alert</span>
                  )}
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
