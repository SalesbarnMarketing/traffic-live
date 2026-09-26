import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Shield,
  Navigation,
  Compass,
  MapPin,
  Clock,
  Battery,
  Phone,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  Share2,
  Copy,
  Plus,
  Trash2,
  Play,
  Square,
  Volume2,
  VolumeX,
  CreditCard,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Car,
  RefreshCw,
  Eye,
  Info,
  Fuel,
  Sparkles,
  ArrowRight,
  Gift,
  Tag,
  Crosshair,
  LocateFixed,
  Route,
  Lock,
  Radio,
  Gauge
} from 'lucide-react';
import {
  TripBuddyPlan,
  TripEmergencyContact,
  TripCheckinLog,
  TripBuddyPricingPass,
  RegisteredUser,
  UserTripPassWallet
} from '../types';
import {
  SA_CORRIDOR_PRESETS,
  TRIP_BUDDY_PRICING_PASSES,
  LOCAL_STORAGE_ACTIVE_TRIP_KEY,
  LOCAL_STORAGE_SAVED_CONTACTS_KEY,
  LOCAL_STORAGE_PASS_WALLET_KEY,
  createWhatsAppDirectUrl,
  formatTripStartMessage,
  formatTripCheckinMessage,
  formatTripSOSMessage,
  formatTripArrivalMessage,
  getDeviceBatteryLevel,
  calculateDistanceKm,
  cleanWhatsAppNumber
} from '../utils/tripBuddyUtils';
import { reverseGeocodeLocation, searchAddress, geocodeLocation, calculateTripBuddyRouteSummary, RouteSearchResult } from '../utils/routeUtils';
import { tripBuddyAudio } from '../utils/tripBuddyAudio';
import { submitPayFastForm } from '../utils/payfast';
import { TripBuddyLiveMap } from './TripBuddyLiveMap';
import { EmergencySOS } from '../types';

interface TripBuddyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: RegisteredUser | null;
  activeTrip: TripBuddyPlan | null;
  onTripUpdated: (trip: TripBuddyPlan | null) => void;
  initialTrackingToken?: string | null;
  onSubmitSOS?: (sosData: Partial<EmergencySOS>) => Promise<void>;
}

export const TripBuddyModal: React.FC<TripBuddyModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  activeTrip,
  onTripUpdated,
  initialTrackingToken,
  onSubmitSOS
}) => {
  // Navigation tabs: 'hud' (if trip active), 'plan', 'passes', 'viewer'
  const [activeTab, setActiveTab] = useState<'hud' | 'plan' | 'passes' | 'viewer'>(
    activeTrip ? 'hud' : initialTrackingToken ? 'viewer' : 'plan'
  );

  // Form State for planning new trip
  const [driverName, setDriverName] = useState<string>(
    currentUser ? `${currentUser.fullName || ''} ${currentUser.surname || ''}`.trim() : ''
  );
  const [driverPhone, setDriverPhone] = useState<string>(currentUser?.phone || '');
  const [driverEmail, setDriverEmail] = useState<string>(currentUser?.email || '');
  const [departure, setDeparture] = useState<string>('Pretoria East, Gauteng');
  const [departureCoords, setDepartureCoords] = useState<{ lat: number; lng: number } | null>({ lat: -25.8255, lng: 28.3251 });
  const [destination, setDestination] = useState<string>('');
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [routeVia, setRouteVia] = useState<string>('');
  const [estimatedKm, setEstimatedKm] = useState<number>(0);
  const [estimatedMins, setEstimatedMins] = useState<number>(0);
  const [checkinInterval, setCheckinInterval] = useState<number>(30); // minutes
  const [vehicleMake, setVehicleMake] = useState<string>('');
  const [vehicleColor, setVehicleColor] = useState<string>('');
  const [vehiclePlate, setVehiclePlate] = useState<string>('');
  const [selectedPassType, setSelectedPassType] = useState<'single' | 'commuter_pack' | 'monthly_unlimited'>('single');

  // Live Geocoding & Route Calculation States
  const [isCalculatingRoute, setIsCalculatingRoute] = useState<boolean>(false);
  const [routeCalculationNotice, setRouteCalculationNotice] = useState<string | null>(null);

  // Autocomplete Suggestions State
  const [departureSuggestions, setDepartureSuggestions] = useState<RouteSearchResult[]>([]);
  const [isSearchingDeparture, setIsSearchingDeparture] = useState<boolean>(false);
  const [showDepartureSuggestions, setShowDepartureSuggestions] = useState<boolean>(false);

  const [destinationSuggestions, setDestinationSuggestions] = useState<RouteSearchResult[]>([]);
  const [isSearchingDestination, setIsSearchingDestination] = useState<boolean>(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState<boolean>(false);

  // GPS Location Auto-Detection State
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [detectedLocationInfo, setDetectedLocationInfo] = useState<{ name: string; lat: number; lng: number } | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('custom');
  const [corridorHazardNotice, setCorridorHazardNotice] = useState<string>('');

  // Emergency Contacts
  const [contacts, setContacts] = useState<TripEmergencyContact[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SAVED_CONTACTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [
      {
        id: 'contact-1',
        name: 'Family WhatsApp',
        phone: '0821234567',
        relationship: 'Family',
        notifyOnStart: true,
        notifyOnCheckin: true,
        notifyOnArrival: true
      }
    ];
  });

  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRelation, setNewContactRelation] = useState('Family');
  const [showAddContact, setShowAddContact] = useState(false);

  // User Pass Wallet
  const [wallet, setWallet] = useState<UserTripPassWallet>({
    userId: currentUser?.id || 'guest',
    email: currentUser?.email || '',
    activePassType: 'none',
    remainingTrips: 1, // 1 complimentary trial trip
    totalTripsCompleted: 0
  });

  // HUD Real-time states
  const [secondsUntilCheckin, setSecondsUntilCheckin] = useState<number>(1800);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [customCheckinNote, setCustomCheckinNote] = useState<string>('');
  const [isCheckinLoading, setIsCheckinLoading] = useState<boolean>(false);
  const [showSOSConfirm, setShowSOSConfirm] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [isFinishingTrip, setIsFinishingTrip] = useState<boolean>(false);

  // Promo / Voucher Code States
  const [promoCodeInput, setPromoCodeInput] = useState<string>('');
  const [isRedeemingPromo, setIsRedeemingPromo] = useState<boolean>(false);
  const [promoStatus, setPromoStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // PayFast Payment & QR Code Modal States
  const [showPayfastModal, setShowPayfastModal] = useState<boolean>(false);
  const [selectedPayfastPass, setSelectedPayfastPass] = useState<TripBuddyPricingPass | null>(null);
  const [payfastPaymentId, setPayfastPaymentId] = useState<string>('');
  const [payfastProcessUrl, setPayfastProcessUrl] = useState<string>('');
  const [payfastPaymentFields, setPayfastPaymentFields] = useState<Record<string, string>>({});
  const [payfastEmail, setPayfastEmail] = useState<string>('');
  const [payfastPhone, setPayfastPhone] = useState<string>('');
  const [isInitializingPayfast, setIsInitializingPayfast] = useState<boolean>(false);
  const [isVerifyingPayfast, setIsVerifyingPayfast] = useState<boolean>(false);

  // Public Tracking Viewer state
  const [viewerToken, setViewerToken] = useState<string>(initialTrackingToken || activeTrip?.trackingToken || '');
  const [viewerTrip, setViewerTrip] = useState<any | null>(null);
  const [isViewerLoading, setIsViewerLoading] = useState<boolean>(false);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [lastViewerSyncAt, setLastViewerSyncAt] = useState<Date | null>(null);

  // Active Trip Ref to prevent stale closures in geolocation intervals
  const activeTripRef = useRef<TripBuddyPlan | null>(activeTrip);
  useEffect(() => {
    activeTripRef.current = activeTrip;
  }, [activeTrip]);

  // Tabs scroll container ref & helper for mobile arrow buttons
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const scrollAmount = direction === 'left' ? -150 : 150;
      tabsContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Auto-switch tabs when activeTrip or initialTrackingToken changes
  useEffect(() => {
    if (activeTrip && activeTrip.status === 'active') {
      if (!viewerToken && activeTrip.trackingToken) {
        setViewerToken(activeTrip.trackingToken);
      }
    } else if (initialTrackingToken) {
      setActiveTab('viewer');
      setViewerToken(initialTrackingToken);
      fetchViewerData(initialTrackingToken);
    }
  }, [activeTrip, initialTrackingToken]);

  // Auto-poll Family Live Tracker every 5 seconds when viewer tab is open
  useEffect(() => {
    if (!isOpen || activeTab !== 'viewer') return;

    const tokenToUse = viewerToken.trim() || activeTrip?.trackingToken || '';
    if (!tokenToUse) return;

    // Immediate fetch
    fetchViewerData(tokenToUse, false);

    // Periodic polling every 5 seconds
    const interval = setInterval(() => {
      fetchViewerData(tokenToUse, true);
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen, activeTab, viewerToken, activeTrip?.trackingToken]);

  // Compute live visual corridor progress & distance remaining for Active Trip
  const activeTripProgress = useMemo(() => {
    if (!activeTrip) return null;
    const totalKm = Math.max(1, activeTrip.estimatedDistanceKm || 50);
    const travelledKm = Math.max(0, Math.round((activeTrip.distanceTravelledKm || 0) * 10) / 10);

    let directRemaining: number | null = null;
    if (activeTrip.currentLat && activeTrip.currentLng && activeTrip.destinationCoords?.lat && activeTrip.destinationCoords?.lng) {
      directRemaining = calculateDistanceKm(
        activeTrip.currentLat,
        activeTrip.currentLng,
        activeTrip.destinationCoords.lat,
        activeTrip.destinationCoords.lng
      );
    }

    const remainingKm = directRemaining !== null
      ? Math.max(0, Math.round(directRemaining * 10) / 10)
      : Math.max(0, Math.round((totalKm - travelledKm) * 10) / 10);

    const percent = Math.min(100, Math.max(0, Math.round(((totalKm - remainingKm) / totalKm) * 100)));

    const currentSpeed = activeTrip.currentSpeedKmh && activeTrip.currentSpeedKmh > 15
      ? activeTrip.currentSpeedKmh
      : 80;
    const etaMinutes = Math.max(1, Math.round((remainingKm / currentSpeed) * 60));

    return {
      totalKm,
      travelledKm,
      remainingKm,
      percent,
      etaMinutes,
      currentSpeed
    };
  }, [activeTrip]);

  // Compute live visual corridor progress & distance remaining for Family Viewer
  const viewerTripProgress = useMemo(() => {
    if (!viewerTrip) return null;
    const totalKm = Math.max(1, viewerTrip.estimatedDistanceKm || 50);
    const travelledKm = Math.max(0, Math.round((viewerTrip.distanceTravelledKm || 0) * 10) / 10);

    let directRemaining: number | null = null;
    if (viewerTrip.currentLat && viewerTrip.currentLng && viewerTrip.destinationCoords?.lat && viewerTrip.destinationCoords?.lng) {
      directRemaining = calculateDistanceKm(
        viewerTrip.currentLat,
        viewerTrip.currentLng,
        viewerTrip.destinationCoords.lat,
        viewerTrip.destinationCoords.lng
      );
    }

    const remainingKm = directRemaining !== null
      ? Math.max(0, Math.round(directRemaining * 10) / 10)
      : Math.max(0, Math.round((totalKm - travelledKm) * 10) / 10);

    const percent = Math.min(100, Math.max(0, Math.round(((totalKm - remainingKm) / totalKm) * 100)));

    const currentSpeed = viewerTrip.currentSpeedKmh && viewerTrip.currentSpeedKmh > 15
      ? viewerTrip.currentSpeedKmh
      : 80;
    const etaMinutes = Math.max(1, Math.round((remainingKm / currentSpeed) * 60));

    return {
      totalKm,
      travelledKm,
      remainingKm,
      percent,
      etaMinutes,
      currentSpeed
    };
  }, [viewerTrip]);

  // Sync contacts to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_SAVED_CONTACTS_KEY, JSON.stringify(contacts));
    } catch (_) {}
  }, [contacts]);

  // Load User Wallet on load or user change
  useEffect(() => {
    const userMail = currentUser?.email || driverEmail;
    if (userMail) {
      fetch(`/api/trip-buddy/user-pass?email=${encodeURIComponent(userMail)}`)
        .then(res => res.json())
        .then(data => {
          if (data.wallet) {
            setWallet(data.wallet);
          }
        })
        .catch(() => {});
    }
  }, [currentUser, driverEmail]);

  // Safety Timer Interval for HUD
  useEffect(() => {
    if (!activeTrip || activeTrip.status !== 'active' || !activeTrip.nextCheckinDueAt) return;

    const calculateRemainingSeconds = () => {
      const due = new Date(activeTrip.nextCheckinDueAt!).getTime();
      const diff = Math.max(0, Math.floor((due - Date.now()) / 1000));
      setSecondsUntilCheckin(diff);

      // Trigger audio reminder when 5 minutes or 1 minute remaining
      if (diff === 300 || diff === 60) {
        tripBuddyAudio.playCheckinReminderChime();
      } else if (diff === 0) {
        tripBuddyAudio.playEmergencyAlertTone();
      }
    };

    calculateRemainingSeconds();
    const interval = setInterval(calculateRemainingSeconds, 1000);
    return () => clearInterval(interval);
  }, [activeTrip]);

  // Live Geolocation Watcher & Periodic Telemetry Sync when trip is active
  useEffect(() => {
    if (!activeTrip || activeTrip.status !== 'active') return;

    let watchId: number | null = null;

    const pushTelemetry = async (lat: number, lng: number, speedKmh?: number) => {
      const current = activeTripRef.current;
      if (!current || current.status !== 'active') return;

      const battery = await getDeviceBatteryLevel();
      let travelled = current.distanceTravelledKm || 0;
      if (current.currentLat && current.currentLng) {
        const step = calculateDistanceKm(current.currentLat, current.currentLng, lat, lng);
        if (step > 0.05 && step < 50) {
          travelled = Math.round((travelled + step) * 10) / 10;
        }
      }

      fetch('/api/trip-buddy/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: current.id,
          lat,
          lng,
          speedKmh,
          distanceTravelledKm: travelled,
          batteryLevel: battery
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.trip) {
            onTripUpdated(data.trip);
          }
        })
        .catch(() => {});
    };

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const speedKmh = position.coords.speed !== null && position.coords.speed >= 0
            ? Math.round(position.coords.speed * 3.6)
            : undefined;
          pushTelemetry(lat, lng, speedKmh);
        },
        (err) => {
          console.warn('[TripBuddy] Geolocation error:', err);
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
      );
    }

    // Fallback periodic sync every 10s to keep server & viewer updated
    const periodicTimer = setInterval(async () => {
      const current = activeTripRef.current;
      if (!current || current.status !== 'active') return;

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const speed = pos.coords.speed !== null && pos.coords.speed >= 0
              ? Math.round(pos.coords.speed * 3.6)
              : undefined;
            pushTelemetry(pos.coords.latitude, pos.coords.longitude, speed);
          },
          () => {
            // Ping heartbeat even without fresh coordinates
            getDeviceBatteryLevel().then(battery => {
              fetch('/api/trip-buddy/ping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  tripId: current.id,
                  batteryLevel: battery
                })
              })
                .then(res => res.json())
                .then(data => {
                  if (data.trip) onTripUpdated(data.trip);
                })
                .catch(() => {});
            });
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 20000 }
        );
      }
    }, 10000);

    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
      clearInterval(periodicTimer);
    };
  }, [activeTrip?.id, activeTrip?.status]);

  // GPS Current Location Detection
  const handleDetectCurrentLocation = async () => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      alert('Geolocation is not supported by your browser or device.');
      return;
    }

    setIsDetectingLocation(true);

    try {
      const pos: any = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 30000
        });
      });

      if (pos?.coords) {
        const { latitude, longitude } = pos.coords;
        const geoResult = await reverseGeocodeLocation(latitude, longitude);

        let locName = geoResult.locationName || '';
        if (geoResult.suburb && geoResult.city) {
          locName = `${geoResult.suburb}, ${geoResult.city}`;
        } else if (geoResult.road && geoResult.city) {
          locName = `${geoResult.road}, ${geoResult.city}`;
        } else if (!locName || locName.startsWith('GPS')) {
          locName = `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
        }

        if (geoResult.province && !locName.includes(geoResult.province)) {
          locName = `${locName}, ${geoResult.province}`;
        }

        setDeparture(locName);
        setDepartureCoords({ lat: latitude, lng: longitude });
        setDetectedLocationInfo({ name: locName, lat: latitude, lng: longitude });
        if (destination) {
          recalculateRoute({ lat: latitude, lng: longitude }, destinationCoords, locName, destination);
        }
      }
    } catch (err: any) {
      console.warn('[TripBuddy] Primary GPS detection failed, attempting network fallback:', err);
      try {
        const posFallback: any = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 6000
          });
        });
        if (posFallback?.coords) {
          const { latitude, longitude } = posFallback.coords;
          const geoResult = await reverseGeocodeLocation(latitude, longitude);
          const locName = geoResult.locationName || `Current GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
          setDeparture(locName);
          setDepartureCoords({ lat: latitude, lng: longitude });
          setDetectedLocationInfo({ name: locName, lat: latitude, lng: longitude });
          if (destination) {
            recalculateRoute({ lat: latitude, lng: longitude }, destinationCoords, locName, destination);
          }
        }
      } catch (_) {
        alert('Could not automatically determine your GPS coordinates. Please ensure location permissions are granted or enter your departure location manually.');
      }
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Search Departure Address with debounce
  useEffect(() => {
    if (!departure || departure.length < 2 || !showDepartureSuggestions) {
      setDepartureSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingDeparture(true);
      try {
        const results = await searchAddress(departure);
        setDepartureSuggestions(results.slice(0, 6));
      } catch {
        setDepartureSuggestions([]);
      } finally {
        setIsSearchingDeparture(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [departure, showDepartureSuggestions]);

  // Search Destination Address with debounce
  useEffect(() => {
    if (!destination || destination.length < 2 || !showDestinationSuggestions) {
      setDestinationSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingDestination(true);
      try {
        const results = await searchAddress(destination);
        setDestinationSuggestions(results.slice(0, 6));
      } catch {
        setDestinationSuggestions([]);
      } finally {
        setIsSearchingDestination(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [destination, showDestinationSuggestions]);

  // Recalculate Route and Driving Matrix
  const recalculateRoute = async (
    depC: { lat: number; lng: number } | null,
    destC: { lat: number; lng: number } | null,
    depName: string,
    destName: string
  ) => {
    if (!depName.trim() || !destName.trim()) return;
    setIsCalculatingRoute(true);
    setRouteCalculationNotice(null);
    try {
      const summary = await calculateTripBuddyRouteSummary(depName, depC, destName, destC);
      setDepartureCoords(summary.depCoords);
      setDestinationCoords(summary.destCoords);
      setEstimatedKm(summary.distanceKm);
      setEstimatedMins(summary.durationMins);
      if (summary.routeVia) {
        setRouteVia(summary.routeVia);
      }
      setRouteCalculationNotice(`📍 Route Computed: ~${summary.distanceKm} km • ~${Math.round((summary.durationMins / 60) * 10) / 10} hrs via ${summary.routeVia}`);
    } catch (e) {
      console.warn('Route calculation error:', e);
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const handleSelectDepartureSuggestion = (item: RouteSearchResult) => {
    setDeparture(item.displayName || item.name);
    setDepartureCoords({ lat: item.lat, lng: item.lng });
    setShowDepartureSuggestions(false);
    setSelectedPresetId('custom');
    recalculateRoute({ lat: item.lat, lng: item.lng }, destinationCoords, item.displayName || item.name, destination);
  };

  const handleSelectDestinationSuggestion = (item: RouteSearchResult) => {
    setDestination(item.displayName || item.name);
    setDestinationCoords({ lat: item.lat, lng: item.lng });
    setShowDestinationSuggestions(false);
    setSelectedPresetId('custom');
    recalculateRoute(departureCoords, { lat: item.lat, lng: item.lng }, departure, item.displayName || item.name);
  };

  // Add Contact Handler
  const handleAddContact = () => {
    if (!newContactName.trim() || !newContactPhone.trim()) return;
    const newC: TripEmergencyContact = {
      id: `contact-${Date.now()}`,
      name: newContactName.trim(),
      phone: newContactPhone.trim(),
      relationship: newContactRelation,
      notifyOnStart: true,
      notifyOnCheckin: true,
      notifyOnArrival: true
    };
    setContacts(prev => [...prev, newC]);
    setNewContactName('');
    setNewContactPhone('');
    setShowAddContact(false);
  };

  const handleRemoveContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  // Start Journey Action
  const handleStartJourney = async () => {
    if (!driverName.trim()) {
      alert('Please enter your name as the driver.');
      return;
    }
    if (!departure.trim() || !destination.trim()) {
      alert('Please provide both Departure and Destination.');
      return;
    }

    const battery = await getDeviceBatteryLevel();

    let startLat = departureCoords?.lat || -25.8255;
    let startLng = departureCoords?.lng || 28.3251;
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        const pos: any = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        );
        if (pos?.coords) {
          startLat = pos.coords.latitude;
          startLng = pos.coords.longitude;
        }
      } catch (_) {}
    }

    const newTripData: Partial<TripBuddyPlan> = {
      driverName: driverName.trim(),
      driverPhone: driverPhone.trim(),
      driverEmail: driverEmail.trim().toLowerCase(),
      departure: departure.trim(),
      departureCoords: departureCoords || { lat: startLat, lng: startLng },
      destination: destination.trim(),
      destinationCoords: destinationCoords || { lat: -26.2041, lng: 28.0473 },
      routeVia: routeVia.trim() || 'Direct Corridor Route',
      estimatedDistanceKm: estimatedKm > 0 ? estimatedKm : 50,
      estimatedDurationMins: estimatedMins > 0 ? estimatedMins : 45,
      checkinIntervalMins: checkinInterval,
      vehicleDetails: {
        makeModel: vehicleMake.trim() || 'Unspecified Vehicle',
        color: vehicleColor.trim() || '',
        licensePlate: vehiclePlate.trim() || ''
      },
      emergencyContacts: contacts,
      currentLat: startLat,
      currentLng: startLng,
      currentLocationName: departure.trim(),
      batteryLevel: battery,
      paidPassType: selectedPassType,
      paidStatus: 'paid_active'
    };

    try {
      const res = await fetch('/api/trip-buddy/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trip: newTripData })
      });
      const data = await res.json();
      if (data.success && data.trip) {
        onTripUpdated(data.trip);
        tripBuddyAudio.playCheckinSuccessPing();
        setActiveTab('hud');

        // Automatically prompt to send start message to first WhatsApp contact
        if (contacts.length > 0 && contacts[0].phone) {
          const startMsg = formatTripStartMessage(data.trip);
          const url = createWhatsAppDirectUrl(contacts[0].phone, startMsg);
          window.open(url, '_blank');
        }
      } else {
        alert(data.error || 'Could not start trip.');
      }
    } catch (err) {
      alert('Network error starting journey. Please retry.');
    }
  };

  // Check-in Action ("I'm Safe", "Fuel Stop", etc.)
  const handlePerformCheckin = async (status: 'safe' | 'stopped_fuel' | 'delayed', noteText?: string) => {
    if (!activeTrip) return;
    setIsCheckinLoading(true);

    const battery = await getDeviceBatteryLevel();
    let curLat = activeTrip.currentLat;
    let curLng = activeTrip.currentLng;

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        const pos: any = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 6000 })
        );
        if (pos?.coords) {
          curLat = pos.coords.latitude;
          curLng = pos.coords.longitude;
        }
      } catch (_) {}
    }

    try {
      const res = await fetch('/api/trip-buddy/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: activeTrip.id,
          status,
          notes: noteText || customCheckinNote,
          lat: curLat,
          lng: curLng,
          locationName: activeTrip.currentLocationName,
          batteryLevel: battery
        })
      });

      const data = await res.json();
      if (data.success && data.trip) {
        onTripUpdated(data.trip);
        setCustomCheckinNote('');
        tripBuddyAudio.playCheckinSuccessPing();
      }
    } catch (err) {
      console.warn('Checkin error:', err);
    } finally {
      setIsCheckinLoading(false);
    }
  };

  // WhatsApp Broadcast Helper for current state
  const handleSendWhatsAppUpdate = (type: 'checkin' | 'fuel' | 'delay' | 'start' | 'sos' | 'arrival', targetContact?: TripEmergencyContact) => {
    if (!activeTrip) return;

    let message = '';
    const locationStr = activeTrip.currentLocationName || 'En Route';

    if (type === 'start') {
      message = formatTripStartMessage(activeTrip);
    } else if (type === 'checkin') {
      message = formatTripCheckinMessage(activeTrip, 'safe', locationStr, activeTrip.currentLat, activeTrip.currentLng, customCheckinNote);
    } else if (type === 'fuel') {
      message = formatTripCheckinMessage(activeTrip, 'stopped_fuel', locationStr, activeTrip.currentLat, activeTrip.currentLng, 'Refueling / Rest Area');
    } else if (type === 'delay') {
      message = formatTripCheckinMessage(activeTrip, 'delayed', locationStr, activeTrip.currentLat, activeTrip.currentLng, 'Encountered traffic delay');
    } else if (type === 'sos') {
      message = formatTripSOSMessage(activeTrip, activeTrip.currentLat, activeTrip.currentLng, locationStr, 'URGENT: Motorist SOS Triggered on Live Traffic');
    } else if (type === 'arrival') {
      message = formatTripArrivalMessage(activeTrip, locationStr);
    }

    const phone = targetContact?.phone || (activeTrip.emergencyContacts[0]?.phone ?? '');
    const url = createWhatsAppDirectUrl(phone, message);
    window.open(url, '_blank');
  };

  // Trigger Emergency SOS Action
  const handleTriggerSOS = async () => {
    if (!activeTrip) return;
    tripBuddyAudio.playEmergencyAlertTone();

    const callRef = `SOS-TB-${Date.now().toString().slice(-4)}`;
    const vehicleText = activeTrip.vehicleDetails 
      ? `${activeTrip.vehicleDetails.color || ''} ${activeTrip.vehicleDetails.makeModel || 'Vehicle'} (${activeTrip.vehicleDetails.licensePlate || 'Plate Unlogged'})`.trim()
      : 'Motorist en route';

    const sosPayload: Partial<EmergencySOS> = {
      name: activeTrip.driverName,
      phone: activeTrip.driverPhone || '0820000000',
      vehicleInfo: vehicleText,
      latitude: activeTrip.currentLat || activeTrip.departureCoords?.lat || -25.7479,
      longitude: activeTrip.currentLng || activeTrip.departureCoords?.lng || 28.2293,
      locationName: activeTrip.currentLocationName || `En route to ${activeTrip.destination}`,
      emergencyType: 'spiking_puncture',
      notes: `🚨 URGENT MOTORIST SOS [${callRef}]: Driver triggered emergency panic during live trip to ${activeTrip.destination}. Immediate responder dispatch requested!`,
      callRef
    };

    if (onSubmitSOS) {
      await onSubmitSOS(sosPayload);
    } else {
      try {
        await fetch('/api/sos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sosPayload)
        });
      } catch (e) {
        console.warn('Direct SOS post failed:', e);
      }
    }

    await handlePerformCheckin('safe', `EMERGENCY SOS DISTRESS TRIGGERED [${callRef}]`);

    // Open WhatsApp SOS for primary contact
    handleSendWhatsAppUpdate('sos');
    setShowSOSConfirm(false);
  };

  // Complete Journey Action
  const handleCompleteJourney = async () => {
    if (!activeTrip) return;
    setIsFinishingTrip(true);
    try {
      const res = await fetch('/api/trip-buddy/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: activeTrip.id,
          finalLocationName: activeTrip.destination,
          notes: 'Journey completed safely'
        })
      });
      const data = await res.json();
      if (data.success) {
        tripBuddyAudio.playCheckinSuccessPing();
        // Send arrival WhatsApp
        handleSendWhatsAppUpdate('arrival');
        onTripUpdated(null);
        setActiveTab('plan');
      }
    } catch (err) {
      console.warn('Complete trip error:', err);
    } finally {
      setIsFinishingTrip(false);
    }
  };

  // Public Viewer Fetcher
  const fetchViewerData = async (token: string, silent = false) => {
    if (!token.trim()) return;
    if (!silent) setIsViewerLoading(true);
    setViewerError(null);
    try {
      const res = await fetch(`/api/trip-buddy/track/${encodeURIComponent(token.trim())}`);
      const data = await res.json();
      if (data.success && data.trip) {
        setViewerTrip(data.trip);
        setLastViewerSyncAt(new Date());
      } else {
        if (!silent) setViewerError(data.error || 'Tracking link not found or expired.');
      }
    } catch (err) {
      if (!silent) setViewerError('Network error loading live tracking map.');
    } finally {
      if (!silent) setIsViewerLoading(false);
    }
  };

  // Simulate Trip Progress for stationary testing / corridor demonstrations
  const handleSimulateTripProgress = async (kmDelta: number = 25) => {
    if (!activeTrip || activeTrip.status !== 'active') return;
    const currentTravelled = activeTrip.distanceTravelledKm || 0;
    const newTravelled = Math.round((currentTravelled + kmDelta) * 10) / 10;
    
    // Interpolate coordinates between departure and destination
    const depLat = activeTrip.departureCoords?.lat || -26.2041;
    const depLng = activeTrip.departureCoords?.lng || 28.0473;
    const destLat = activeTrip.destinationCoords?.lat || -29.8587;
    const destLng = activeTrip.destinationCoords?.lng || 31.0218;
    const totalEst = activeTrip.estimatedDistanceKm || 100;
    const fraction = Math.min(0.99, newTravelled / totalEst);
    
    const simLat = Number((depLat + (destLat - depLat) * fraction).toFixed(4));
    const simLng = Number((depLng + (destLng - depLng) * fraction).toFixed(4));
    const simSpeed = Math.floor(95 + Math.random() * 25);
    
    try {
      const res = await fetch('/api/trip-buddy/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: activeTrip.id,
          lat: simLat,
          lng: simLng,
          speedKmh: simSpeed,
          distanceTravelledKm: newTravelled,
          locationName: `En Route (~${newTravelled} km / ${totalEst} km)`
        })
      });
      const data = await res.json();
      if (data.trip) {
        onTripUpdated(data.trip);
        tripBuddyAudio.playCheckinSuccessPing();
        if (viewerToken === activeTrip.trackingToken) {
          setViewerTrip(data.trip);
          setLastViewerSyncAt(new Date());
        }
      }
    } catch (err) {
      console.warn('Simulation progress error:', err);
    }
  };

  // Purchase / Activate Pass via PayFast
  const handlePurchasePass = async (passId: 'single' | 'commuter_pack' | 'monthly_unlimited') => {
    const targetPass = TRIP_BUDDY_PRICING_PASSES.find(p => p.id === passId) || TRIP_BUDDY_PRICING_PASSES[0];
    setSelectedPayfastPass(targetPass);
    const emailToUse = currentUser?.email || driverEmail || 'driver@trafficlive.co.za';
    setPayfastEmail(emailToUse);
    setPayfastPhone(driverPhone || '');
    setIsInitializingPayfast(true);
    setShowPayfastModal(true);

    try {
      const res = await fetch('/api/trip-buddy/payfast/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailToUse,
          passType: passId,
          driverPhone: driverPhone || '',
          driverName: driverName || 'Driver'
        })
      });
      const data = await res.json();
      if (data.success && data.paymentId) {
        setPayfastPaymentId(data.paymentId);
        setPayfastProcessUrl(data.processUrl);
        setPayfastPaymentFields(data.paymentFields || {});
      }
    } catch (err) {
      console.warn('PayFast init error:', err);
    } finally {
      setIsInitializingPayfast(false);
    }
  };

  // Launch PayFast Direct Form Submission (Opens in new secure tab or window)
  const launchPayfastCheckout = async () => {
    if (!selectedPayfastPass) return;
    setIsInitializingPayfast(true);

    try {
      const emailToUse = (payfastEmail || currentUser?.email || driverEmail || 'driver@trafficlive.co.za').trim();
      const phoneToUse = (payfastPhone || driverPhone || '0820000000').trim();

      const res = await fetch('/api/trip-buddy/payfast/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailToUse,
          passType: selectedPayfastPass.id,
          driverPhone: phoneToUse,
          driverName: driverName || 'Driver'
        })
      });
      const data = await res.json();
      if (data.success && data.paymentId && data.processUrl && data.paymentFields) {
        setPayfastPaymentId(data.paymentId);
        setPayfastProcessUrl(data.processUrl);
        setPayfastPaymentFields(data.paymentFields);
        submitPayFastForm(data.processUrl, data.paymentFields, true);
      } else if (payfastProcessUrl && payfastPaymentFields) {
        submitPayFastForm(payfastProcessUrl, payfastPaymentFields, true);
      }
    } catch (err) {
      console.warn('PayFast submit error:', err);
      if (payfastProcessUrl && payfastPaymentFields) {
        submitPayFastForm(payfastProcessUrl, payfastPaymentFields, true);
      }
    } finally {
      setIsInitializingPayfast(false);
    }
  };

  // Redeem Promo / Voucher Code (Only 2 Free Promo Codes Allowed)
  const handleRedeemPromo = async (overrideCode?: string) => {
    const rawCode = (overrideCode || promoCodeInput).trim().toUpperCase();
    if (!rawCode) {
      setPromoStatus({ type: 'error', message: 'Please enter a promo code.' });
      return;
    }

    const userMail = currentUser?.email || driverEmail || prompt('Please enter your email to attach the promo credits:') || 'driver@trafficlive.co.za';
    if (!userMail) return;

    setIsRedeemingPromo(true);
    setPromoStatus(null);

    try {
      const res = await fetch('/api/trip-buddy/redeem-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userMail, promoCode: rawCode })
      });
      const data = await res.json();
      if (res.ok && data.success && data.wallet) {
        setWallet(data.wallet);
        try {
          localStorage.setItem(LOCAL_STORAGE_PASS_WALLET_KEY, JSON.stringify(data.wallet));
        } catch (e) {}
        tripBuddyAudio.playCheckinSuccessPing();
        setPromoStatus({ type: 'success', message: data.message || `Code ${rawCode} redeemed successfully!` });
        setPromoCodeInput('');
      } else {
        setPromoStatus({ type: 'error', message: data.error || 'Invalid promo code. Only "FREEBUDDY" or "SAFEDRIVE" are eligible for free promotional trips.' });
      }
    } catch (err) {
      // Resilient local offline fallback restricted strictly to the 2 promo codes
      const cleanCode = rawCode.replace(/\s+/g, '');
      const prevRedeemed = wallet.redeemedPromoCodes || [];
      if (prevRedeemed.includes(cleanCode)) {
        setPromoStatus({ type: 'error', message: `Promo code "${cleanCode}" has already been redeemed.` });
      } else if (['FREEBUDDY', 'FREE-BUDDY', 'FREE_BUDDY', 'BUDDYFREE', 'SAFEDRIVE', 'SAFE-DRIVE'].includes(cleanCode)) {
        const added = 2;
        const updatedWallet = {
          ...wallet,
          remainingTrips: (wallet.remainingTrips || 0) + added,
          redeemedPromoCodes: [...prevRedeemed, cleanCode],
          lastPromoRedeemed: cleanCode,
          activePassType: (!wallet.activePassType || wallet.activePassType === 'none') ? 'single' : wallet.activePassType
        };
        setWallet(updatedWallet);
        try {
          localStorage.setItem(LOCAL_STORAGE_PASS_WALLET_KEY, JSON.stringify(updatedWallet));
        } catch (e) {}
        tripBuddyAudio.playCheckinSuccessPing();
        setPromoStatus({ type: 'success', message: `🎉 Success! Promo code ${cleanCode} activated! +${added} Free Trips added to your safety wallet.` });
        setPromoCodeInput('');
      } else {
        setPromoStatus({ type: 'error', message: 'Invalid promo code. Only "FREEBUDDY" or "SAFEDRIVE" are eligible for free trial trips. For all other passes, please use PayFast checkout.' });
      }
    } finally {
      setIsRedeemingPromo(false);
    }
  };

  // Copy tracking link helper
  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/?trackTrip=${token}`;
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  // Format timer minutes:seconds
  const timerDisplay = useMemo(() => {
    const mins = Math.floor(secondsUntilCheckin / 60);
    const secs = secondsUntilCheckin % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [secondsUntilCheckin]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm overflow-hidden animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl text-slate-100 flex flex-col h-[94vh] max-h-[94vh] overflow-hidden my-auto">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-3.5 py-3 sm:px-5 sm:py-3.5 border-b border-slate-800 bg-slate-950/90 shrink-0 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold shrink-0">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap">
                  TRIP BUDDY
                </h2>
                <span className="hidden xs:inline-block text-emerald-400 text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 whitespace-nowrap">
                  Journey Monitor
                </span>
                {activeTrip && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    LIVE
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate hidden xs:block mt-0.5">
                Real-time route monitoring, driver safety check-ins & WhatsApp updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                const nextMute = !isAudioMuted;
                setIsAudioMuted(nextMute);
                tripBuddyAudio.setMuted(nextMute);
              }}
              title={isAudioMuted ? 'Unmute Audio Chimes' : 'Mute Audio Chimes'}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition"
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs with Left/Right Arrow Buttons for Mobile */}
        <div className="relative flex items-center border-b border-slate-800 bg-slate-900/95 px-1.5 sm:px-4 py-1.5 sm:py-2 shrink-0">
          {/* Left Arrow Button (Mobile/Small Screen) */}
          <button
            type="button"
            onClick={() => scrollTabs('left')}
            className="flex sm:hidden items-center justify-center w-7 h-8 rounded-lg bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 shadow-sm shrink-0 active:scale-90 transition mr-1 z-10"
            title="Scroll Tabs Left"
            aria-label="Previous Tabs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Scrollable Tabs List */}
          <div
            ref={tabsContainerRef}
            className="flex-1 flex items-center gap-1.5 sm:gap-2 overflow-x-auto scroll-smooth scrollbar-none py-0.5"
          >
            {activeTrip && (
              <button
                onClick={() => setActiveTab('hud')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition shrink-0 ${
                  activeTab === 'hud'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Navigation className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Active HUD</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              </button>
            )}

            <button
              onClick={() => setActiveTab('plan')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition shrink-0 ${
                activeTab === 'plan'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{activeTrip ? 'Setup' : 'Plan Trip'}</span>
            </button>

            <button
              onClick={() => setActiveTab('viewer')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition shrink-0 ${
                activeTab === 'viewer'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Family Tracker</span>
            </button>

            <button
              onClick={() => setActiveTab('passes')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition shrink-0 ${
                activeTab === 'passes'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Passes</span>
              {wallet.remainingTrips > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950">
                  {wallet.remainingTrips} Left
                </span>
              )}
            </button>
          </div>

          {/* Right Arrow Button (Mobile/Small Screen) */}
          <button
            type="button"
            onClick={() => scrollTabs('right')}
            className="flex sm:hidden items-center justify-center w-7 h-8 rounded-lg bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 shadow-sm shrink-0 active:scale-90 transition ml-1 z-10"
            title="Scroll Tabs Right"
            aria-label="Next Tabs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body with proper min-h-0 flex-1 overflow-y-auto */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3.5 sm:p-6 space-y-5">

          {/* ==================================================== */}
          {/* TAB 1: ACTIVE JOURNEY HEADS-UP DISPLAY (HUD)         */}
          {/* ==================================================== */}
          {activeTab === 'hud' && activeTrip && (
            <div className="space-y-6">
              {/* Emergency Banner if Active in Emergency State */}
              {activeTrip.status === 'emergency' && (
                <div className="p-4 rounded-xl bg-rose-950/90 border-2 border-rose-500 animate-pulse text-white flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-8 h-8 text-rose-400 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-base">EMERGENCY DISTRESS ACTIVE</h4>
                      <p className="text-xs text-rose-200">
                        Emergency contacts have been prompted with your exact GPS pin ({activeTrip.currentLat?.toFixed(4)}, {activeTrip.currentLng?.toFixed(4)}).
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePerformCheckin('safe', 'Motorist canceled emergency distress.')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg"
                  >
                    I Am Now Safe
                  </button>
                </div>
              )}

              {/* LIVE TRIP ROAD CORRIDOR NAVIGATION & PANIC HUD (Matching Flyer Design) */}
              <TripBuddyLiveMap
                trip={activeTrip}
                isDriverView={true}
                currentUser={currentUser}
                onTripUpdated={onTripUpdated}
                onSubmitSOS={onSubmitSOS}
              />

              {/* VISUAL JOURNEY PROGRESS & DISTANCE REMAINING INDICATOR */}
              {activeTripProgress && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-emerald-500/50 shadow-2xl space-y-4 animate-fadeIn">
                  {/* Header Title & Distance Remaining Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                        <Navigation className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm sm:text-base font-black text-white">Corridor Journey Progress</h4>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono font-bold">
                            {activeTripProgress.percent}% Completed
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Tracking live highway progress to <strong className="text-slate-200">{activeTrip.destination}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-center bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800">
                      <div className="text-right">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Distance Remaining</span>
                        <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono leading-tight">
                          {activeTripProgress.remainingKm} <span className="text-xs font-semibold text-slate-300">km</span>
                        </div>
                      </div>
                      <div className="h-7 w-px bg-slate-800" />
                      <div className="text-left">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Est. Time Left</span>
                        <div className="text-sm sm:text-base font-black text-cyan-300 font-mono leading-tight">
                          {activeTripProgress.etaMinutes >= 60
                            ? `${Math.floor(activeTripProgress.etaMinutes / 60)}h ${activeTripProgress.etaMinutes % 60}m`
                            : `${activeTripProgress.etaMinutes} mins`}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Animated Visual Progress Track with moving Vehicle Pin */}
                  <div className="space-y-2 pt-1">
                    <div className="relative h-4 bg-slate-950 rounded-full border border-slate-700/80 overflow-visible p-0.5">
                      {/* Filled Progress Gradient Bar */}
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-md transition-all duration-700"
                        style={{ width: `${Math.min(100, Math.max(3, activeTripProgress.percent))}%` }}
                      />

                      {/* Moving Car Pin Indicator */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-700 flex flex-col items-center pointer-events-none"
                        style={{ left: `${Math.min(97, Math.max(3, activeTripProgress.percent))}%` }}
                      >
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 border-2 border-white shadow-xl flex items-center justify-center text-white ring-4 ring-cyan-500/20">
                          <Car className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>

                    {/* Milestone Nodes (Departure, Current GPS, Destination) */}
                    <div className="flex justify-between items-start text-xs text-slate-400 pt-1.5 gap-2">
                      <div className="max-w-[32%]">
                        <div className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shrink-0"></span>
                          <span>ORIGIN</span>
                        </div>
                        <div className="text-xs font-semibold text-white truncate mt-0.5" title={activeTrip.departure}>
                          {activeTrip.departure}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">0 km</div>
                      </div>

                      <div className="text-center max-w-[36%] px-1">
                        <div className="flex items-center justify-center gap-1 text-cyan-300 font-bold text-[11px]">
                          <Radio className="w-3 h-3 animate-pulse text-cyan-400 shrink-0" />
                          <span>CURRENT GPS</span>
                        </div>
                        <div className="text-xs font-semibold text-cyan-200 truncate mt-0.5" title={activeTrip.currentLocationName || 'En Route Corridor'}>
                          {activeTrip.currentLocationName || 'En Route Corridor'}
                        </div>
                        <div className="text-[10px] text-cyan-400 font-mono font-bold">
                          {activeTripProgress.travelledKm} km travelled
                        </div>
                      </div>

                      <div className="text-right max-w-[32%]">
                        <div className="flex items-center justify-end gap-1 text-amber-400 font-bold text-[11px]">
                          <span>DESTINATION</span>
                          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block shrink-0"></span>
                        </div>
                        <div className="text-xs font-semibold text-white truncate mt-0.5" title={activeTrip.destination}>
                          {activeTrip.destination}
                        </div>
                        <div className="text-[10px] text-amber-300 font-mono font-bold">
                          {activeTripProgress.totalKm} km total
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4-Column Live Metric Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-800/80">
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase block">Distance Covered</span>
                      <span className="text-sm sm:text-base font-black text-emerald-400 font-mono">
                        {activeTripProgress.travelledKm} km
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-amber-500/30 text-center">
                      <span className="text-[10px] font-semibold text-amber-300 uppercase block">Distance Remaining</span>
                      <span className="text-sm sm:text-base font-black text-amber-400 font-mono">
                        {activeTripProgress.remainingKm} km
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase block">Estimated Duration</span>
                      <span className="text-sm sm:text-base font-black text-cyan-300 font-mono">
                        ~{Math.round((activeTrip.estimatedDurationMins || 45) / 60 * 10) / 10} hrs
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase block">Live Speed</span>
                      <span className="text-sm sm:text-base font-black text-white font-mono">
                        {activeTrip.currentSpeedKmh !== undefined ? `${activeTrip.currentSpeedKmh} km/h` : '80 km/h avg'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Driver Safety Check-in Master Card */}
              <div className={`p-4 sm:p-6 rounded-2xl border text-center transition-all ${
                secondsUntilCheckin <= 120
                  ? 'bg-rose-950/40 border-rose-500/60 shadow-xl shadow-rose-900/20'
                  : secondsUntilCheckin <= 300
                  ? 'bg-amber-950/40 border-amber-500/60 shadow-xl shadow-amber-900/20'
                  : 'bg-gradient-to-b from-slate-800 to-slate-900 border-slate-700/80 shadow-xl'
              }`}>
                <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 gap-1.5 mb-2">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                    Interval: Every {activeTrip.checkinIntervalMins}m
                  </span>
                  <span className="font-mono text-slate-300">
                    Last: {activeTrip.lastCheckinAt ? new Date(activeTrip.lastCheckinAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just started'}
                  </span>
                </div>

                <div className="my-2 sm:my-3">
                  <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Next Safety Check-in Due In
                  </span>
                  <div className={`text-4xl sm:text-6xl font-black font-mono tracking-tight my-1 ${
                    secondsUntilCheckin <= 120
                      ? 'text-rose-400 animate-pulse'
                      : secondsUntilCheckin <= 300
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}>
                    {timerDisplay}
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-400 max-w-md mx-auto">
                    {secondsUntilCheckin <= 120
                      ? '⚠️ Overdue prompt! Tap the button below to confirm you are safe.'
                      : 'Tap "I AM SAFE" at any time while driving or at stops to reset timer.'}
                  </p>
                </div>

                {/* Big Driver-Safe "I AM SAFE" Button */}
                <button
                  disabled={isCheckinLoading}
                  onClick={() => handlePerformCheckin('safe')}
                  className="w-full max-w-md px-6 py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base sm:text-lg tracking-wide shadow-xl shadow-emerald-600/30 active:scale-95 transition flex items-center justify-center gap-2.5 mx-auto"
                >
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                  <span>{isCheckinLoading ? 'UPDATING...' : "I AM SAFE (RESET TIMER)"}</span>
                </button>

                {/* Quick Action Milestones (Fuel, Traffic Delay & Simulation Demo) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-2xl mx-auto mt-3.5 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-700/60">
                  <button
                    onClick={() => handlePerformCheckin('stopped_fuel', 'Refueling / Rest Area')}
                    className="flex items-center justify-center gap-1.5 p-2 sm:p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                  >
                    <Fuel className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Fuel Stop</span>
                  </button>
                  <button
                    onClick={() => handlePerformCheckin('delayed', 'Heavy traffic congestion delay')}
                    className="flex items-center justify-center gap-1.5 p-2 sm:p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                  >
                    <Clock className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    <span>Traffic Delay</span>
                  </button>
                  <button
                    onClick={() => handleSimulateTripProgress(25)}
                    title="Simulate driving +25 km along corridor"
                    className="flex items-center justify-center gap-1.5 p-2 sm:p-2.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 text-xs font-bold border border-purple-700/50 transition"
                  >
                    <Play className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>+25km Demo</span>
                  </button>
                  <button
                    onClick={() => handleSendWhatsAppUpdate('checkin')}
                    className="flex items-center justify-center gap-1.5 p-2 sm:p-2.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 text-xs font-bold border border-emerald-700/50 transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Route & Telemetry Live Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Departure</span>
                  <div className="text-sm font-bold text-white truncate mt-0.5">{activeTrip.departure}</div>
                  <span className="text-[11px] text-emerald-400 font-mono">Started {activeTrip.startedAt ? new Date(activeTrip.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Destination</span>
                  <div className="text-sm font-bold text-white truncate mt-0.5">{activeTrip.destination}</div>
                  <span className="text-[11px] text-slate-300">~{activeTrip.estimatedDistanceKm} km Total</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Current Speed & GPS</span>
                  <div className="text-lg font-black text-cyan-400 font-mono mt-0.5">
                    {activeTrip.currentSpeedKmh !== undefined ? `${activeTrip.currentSpeedKmh} km/h` : '0 km/h'}
                  </div>
                  <span className="text-[11px] text-slate-400 truncate block">
                    {activeTrip.currentLat?.toFixed(4)}, {activeTrip.currentLng?.toFixed(4)}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Device & Battery</span>
                  <div className="flex items-center gap-1.5 text-sm font-bold text-white mt-0.5">
                    <Battery className="w-4 h-4 text-emerald-400" />
                    {activeTrip.batteryLevel !== undefined ? `${activeTrip.batteryLevel}%` : 'Monitoring'}
                  </div>
                  <span className="text-[11px] text-slate-400 truncate block">
                    {activeTrip.vehicleDetails?.makeModel || 'Vehicle Logged'}
                  </span>
                </div>
              </div>

              {/* Shareable Family Link & WhatsApp Broadcasting Bar */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-bold text-white">Live Family Tracking Map Link</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    Token: <span className="text-purple-300 font-bold">{activeTrip.trackingToken}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleCopyLink(activeTrip.trackingToken)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-white transition"
                  >
                    {copySuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copySuccess ? 'Copied Link!' : 'Copy Link'}
                  </button>
                  <button
                    onClick={() => handleSendWhatsAppUpdate('start')}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Send on WhatsApp
                  </button>
                </div>
              </div>

              {/* Emergency Contacts Direct Access */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  Emergency Contacts Configured ({activeTrip.emergencyContacts.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeTrip.emergencyContacts.map(c => (
                    <div key={c.id} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">{c.name} ({c.relationship})</div>
                        <div className="text-[11px] text-slate-400 font-mono">{c.phone}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleSendWhatsAppUpdate('checkin', c)}
                          title="Send Check-in to this WhatsApp contact"
                          className="p-1.5 rounded-md bg-emerald-950 text-emerald-400 hover:bg-emerald-900 border border-emerald-800 transition"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={`tel:${c.phone}`}
                          title="Direct Call"
                          className="p-1.5 rounded-md bg-slate-700 text-slate-200 hover:bg-slate-600 transition"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Controls: SOS Distress & Complete Trip */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
                {showSOSConfirm ? (
                  <div className="w-full sm:w-auto p-3 rounded-xl bg-rose-950 border border-rose-500 flex items-center gap-3">
                    <span className="text-xs font-bold text-rose-200">Confirm SOS WhatsApp Dispatch?</span>
                    <button
                      onClick={handleTriggerSOS}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg"
                    >
                      YES, TRIGGER SOS
                    </button>
                    <button
                      onClick={() => setShowSOSConfirm(false)}
                      className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowSOSConfirm(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    EMERGENCY SOS DISTRESS
                  </button>
                )}

                <button
                  disabled={isFinishingTrip}
                  onClick={handleCompleteJourney}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 transition"
                >
                  <Square className="w-4 h-4 text-emerald-400" />
                  {isFinishingTrip ? 'Finalizing...' : 'Complete & End Journey'}
                </button>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: PLAN & CONFIGURE NEW JOURNEY                  */}
          {/* ==================================================== */}
          {activeTab === 'plan' && (
            <div className="space-y-6">

              {/* STEP 1: CURRENT LOCATION & DEPARTURE POINT (PRIMARY ON SCREEN) */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-emerald-500/40 shadow-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">
                      1
                    </div>
                    <div>
                      <label className="text-sm font-bold text-white flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-emerald-400" />
                        Starting Location / Departure Point *
                      </label>
                      <p className="text-xs text-slate-400">
                        First specify your departure origin or click below to detect your current live location.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isDetectingLocation}
                    onClick={handleDetectCurrentLocation}
                    className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-900/30 active:scale-95 transition shrink-0"
                    title="Detect Current GPS Location"
                  >
                    {isDetectingLocation ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Detecting GPS...</span>
                      </>
                    ) : (
                      <>
                        <LocateFixed className="w-3.5 h-3.5 text-white" />
                        <span>📍 Use Current Location</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-emerald-400" />
                  <input
                    type="text"
                    value={departure}
                    onFocus={() => setShowDepartureSuggestions(true)}
                    onChange={e => {
                      setDeparture(e.target.value);
                      setShowDepartureSuggestions(true);
                      setSelectedPresetId('custom');
                      if (detectedLocationInfo && e.target.value !== detectedLocationInfo.name) {
                        setDetectedLocationInfo(null);
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowDepartureSuggestions(false), 250);
                      if (destination) {
                        recalculateRoute(departureCoords, destinationCoords, departure, destination);
                      }
                    }}
                    placeholder="e.g. Pretoria East, Johannesburg, Sandton, Centurion"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:outline-none shadow-inner"
                  />

                  {/* Autocomplete Dropdown for Departure */}
                  {showDepartureSuggestions && departureSuggestions.length > 0 && (
                    <div className="absolute z-30 left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden divide-y divide-slate-800">
                      {departureSuggestions.map((item) => (
                        <div
                          key={item.id}
                          onMouseDown={() => handleSelectDepartureSuggestion(item)}
                          className="p-2.5 px-3.5 hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="font-semibold text-white">{item.name}</span>
                            <span className="text-slate-400 text-[11px] truncate max-w-[200px] sm:max-w-xs">{item.displayName}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">Select</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Departure Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                  <span className="text-[11px] font-semibold text-slate-400">Quick Origin:</span>
                  {[
                    { label: '📍 Pretoria East', coords: { lat: -25.8255, lng: 28.3251 } },
                    { label: '📍 Johannesburg', coords: { lat: -26.2041, lng: 28.0473 } },
                    { label: '📍 Centurion', coords: { lat: -25.8576, lng: 28.1906 } },
                    { label: '📍 Sandton', coords: { lat: -26.1076, lng: 28.0567 } }
                  ].map(chip => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => {
                        const name = chip.label.replace('📍 ', '');
                        setDeparture(name);
                        setDepartureCoords(chip.coords);
                        setSelectedPresetId('custom');
                        if (destination) {
                          recalculateRoute(chip.coords, destinationCoords, name, destination);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-950/80 hover:bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-800 transition"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {detectedLocationInfo && (
                  <div className="flex items-center justify-between p-2 px-3 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-xs text-emerald-300">
                    <span className="flex items-center gap-1.5 truncate">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>GPS Fixed: {detectedLocationInfo.lat.toFixed(4)}, {detectedLocationInfo.lng.toFixed(4)} ({detectedLocationInfo.name})</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleDetectCurrentLocation}
                      className="text-[11px] underline text-emerald-400 hover:text-emerald-200 font-semibold shrink-0 ml-2"
                    >
                      Re-detect
                    </button>
                  </div>
                )}
              </div>

              {/* STEP 2: DESTINATION & ROUTE DETAILS */}
              <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/80 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-sm shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Route className="w-4 h-4 text-blue-400" />
                      Destination & Route Details
                    </h3>
                    <p className="text-xs text-slate-400">
                      Enter any South African city, town, address, or landmark destination.
                    </p>
                  </div>
                </div>

                {/* Destination & Waypoints Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="relative">
                    <label className="text-xs font-bold text-slate-300 mb-1 block">Destination Point *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-emerald-400" />
                      <input
                        type="text"
                        value={destination}
                        onFocus={() => setShowDestinationSuggestions(true)}
                        onChange={e => {
                          setDestination(e.target.value);
                          setShowDestinationSuggestions(true);
                          setSelectedPresetId('custom');
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowDestinationSuggestions(false), 250);
                          if (departure && destination) {
                            recalculateRoute(departureCoords, destinationCoords, departure, destination);
                          }
                        }}
                        placeholder="e.g. Tzaneen, Durban, Cape Town, Wonderpark, Polokwane"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-medium shadow-inner"
                      />
                    </div>

                    {/* Autocomplete Dropdown for Destination */}
                    {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                      <div className="absolute z-30 left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden divide-y divide-slate-800 max-h-56 overflow-y-auto">
                        {destinationSuggestions.map((item) => (
                          <div
                            key={item.id}
                            onMouseDown={() => handleSelectDestinationSuggestion(item)}
                            className="p-2.5 px-3.5 hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                              <span className="font-semibold text-white">{item.name}</span>
                              <span className="text-slate-400 text-[11px] truncate max-w-[180px] sm:max-w-xs">{item.displayName}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">Select</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-1 block">Estimated Distance (km)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={estimatedKm || ''}
                        placeholder="e.g. 380"
                        onChange={e => setEstimatedKm(Number(e.target.value))}
                        className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-medium font-mono"
                      />
                      {isCalculatingRoute && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Destination Chips */}
                  <div className="sm:col-span-2 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-[11px] font-semibold text-slate-400">Popular Destinations:</span>
                    {[
                      { label: 'Tzaneen 🍋', name: 'Tzaneen, Limpopo', coords: { lat: -23.8319, lng: 30.1611 } },
                      { label: 'Wonderpark Mall 🛍️', name: 'Wonderpark Shopping Centre (Karenpark / Akasia), Pretoria', coords: { lat: -25.6636, lng: 28.1099 } },
                      { label: 'Pretoria East 🏙️', name: 'Pretoria East (Menlyn / Faerie Glen), Gauteng', coords: { lat: -25.8255, lng: 28.3251 } },
                      { label: 'Polokwane 🦁', name: 'Polokwane, Limpopo', coords: { lat: -23.9045, lng: 29.4689 } },
                      { label: 'Durban 🌊', name: 'Durban, KwaZulu-Natal', coords: { lat: -29.8587, lng: 31.0218 } },
                      { label: 'Mbombela 🐆', name: 'Mbombela (Nelspruit), Mpumalanga', coords: { lat: -25.4753, lng: 30.9694 } },
                      { label: 'Cape Town ⛰️', name: 'Cape Town, Western Cape', coords: { lat: -33.9249, lng: 18.4241 } }
                    ].map(chip => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => {
                          setDestination(chip.name);
                          setDestinationCoords(chip.coords);
                          setSelectedPresetId('custom');
                          if (departure) {
                            recalculateRoute(departureCoords, chip.coords, departure, chip.name);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700 transition active:scale-95"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>

                  {/* Route Status & Calculated Metrics Strip */}
                  {destination ? (
                    <div className="sm:col-span-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
                      <div className="flex items-center gap-2">
                        <Route className="w-4 h-4 text-cyan-400 shrink-0" />
                        <div className="space-y-0.5">
                          <span className="font-semibold text-white">
                            {departure || 'Current Location'} ➔ {destination}
                          </span>
                          <div className="text-[11px] text-cyan-300 font-mono">
                            ~{estimatedKm} km {estimatedMins > 0 ? `• ~${Math.round((estimatedMins / 60) * 10) / 10} hours estimated` : ''}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isCalculatingRoute}
                        onClick={() => recalculateRoute(departureCoords, destinationCoords, departure, destination)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 font-semibold text-xs flex items-center gap-1.5 transition shrink-0 self-end sm:self-center"
                      >
                        <RefreshCw className={`w-3 h-3 ${isCalculatingRoute ? 'animate-spin' : ''}`} />
                        <span>{isCalculatingRoute ? 'Calculating...' : 'Recalculate Route'}</span>
                      </button>
                    </div>
                  ) : null}

                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-300 mb-1 block">Route Waypoints / Highway Name</label>
                    <input
                      type="text"
                      value={routeVia}
                      onChange={e => setRouteVia(e.target.value)}
                      placeholder="e.g. N1 North, N3, R71, N4 Highway, M1 South"
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-300 mb-1 block">Safety Check-in Interval</label>
                    <select
                      value={checkinInterval}
                      onChange={e => setCheckinInterval(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value={15}>Every 15 Minutes (High alert / Night driving / Pass roads)</option>
                      <option value={30}>Every 30 Minutes (Recommended Standard)</option>
                      <option value={45}>Every 45 Minutes</option>
                      <option value={60}>Every 60 Minutes (Long open highway stretch)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Driver & Vehicle Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-slate-800/40 border border-slate-700/80">
                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1 block">Driver Full Name *</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={e => setDriverName(e.target.value)}
                    placeholder="Driver Name"
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1 block">Driver Mobile (WhatsApp)</label>
                  <input
                    type="text"
                    value={driverPhone}
                    onChange={e => setDriverPhone(e.target.value)}
                    placeholder="e.g. 082 123 4567"
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1 block">Vehicle (Make & Model)</label>
                  <input
                    type="text"
                    value={vehicleMake}
                    onChange={e => setVehicleMake(e.target.value)}
                    placeholder="e.g. Toyota Hilux / VW Polo"
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1 block">Vehicle Color</label>
                  <input
                    type="text"
                    value={vehicleColor}
                    onChange={e => setVehicleColor(e.target.value)}
                    placeholder="e.g. White / Silver"
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1 block">Registration / Number Plate</label>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={e => setVehiclePlate(e.target.value)}
                    placeholder="e.g. CA 123-456 / GP"
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1 block">Notification Email</label>
                  <input
                    type="email"
                    value={driverEmail}
                    onChange={e => setDriverEmail(e.target.value)}
                    placeholder="email@domain.co.za"
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* WhatsApp Emergency Contacts Section */}
              <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-400" />
                      WhatsApp Emergency Contacts
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      These contacts will receive pre-formatted WhatsApp trip departure, safety check-in and SOS pins.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddContact(!showAddContact)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Contact
                  </button>
                </div>

                {/* Add Contact Row */}
                {showAddContact && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/40 grid grid-cols-1 sm:grid-cols-4 gap-2 animate-fadeIn">
                    <input
                      type="text"
                      value={newContactName}
                      onChange={e => setNewContactName(e.target.value)}
                      placeholder="Contact Name (e.g. Spouse)"
                      className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                    />
                    <input
                      type="text"
                      value={newContactPhone}
                      onChange={e => setNewContactPhone(e.target.value)}
                      placeholder="WhatsApp Phone (082...)"
                      className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                    />
                    <select
                      value={newContactRelation}
                      onChange={e => setNewContactRelation(e.target.value)}
                      className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                    >
                      <option value="Family">Family</option>
                      <option value="Spouse">Spouse / Partner</option>
                      <option value="Parent">Parent</option>
                      <option value="Friend">Friend</option>
                      <option value="Colleague">Colleague / Fleet</option>
                      <option value="Security">Security Company</option>
                    </select>
                    <button
                      onClick={handleAddContact}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg"
                    >
                      Save Contact
                    </button>
                  </div>
                )}

                {/* Contacts List */}
                <div className="space-y-2">
                  {contacts.map(c => (
                    <div key={c.id} className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center font-bold text-xs">
                          {c.relationship[0] || 'C'}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{c.name} <span className="text-slate-400 font-normal">({c.relationship})</span></div>
                          <div className="text-[11px] text-emerald-400 font-mono">{c.phone}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveContact(c.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {contacts.length === 0 && (
                    <p className="text-xs text-slate-500 italic text-center py-2">
                      No emergency contacts added yet. Add at least one WhatsApp contact for trip notifications.
                    </p>
                  )}
                </div>
              </div>

              {/* Wallet & Promo Shortcut Banner */}
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-slate-300">
                    Driver Passes: <strong className="text-amber-300 font-mono">{wallet.activePassType === 'monthly_unlimited' ? 'Unlimited Pass' : `${wallet.remainingTrips} trips available`}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('passes')}
                  className="flex items-center gap-1.5 text-indigo-300 hover:text-indigo-200 font-bold underline text-xs cursor-pointer"
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>Have a Promo Code? Redeem Free Trips</span>
                </button>
              </div>

              {/* Action: Launch Trip Buddy */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-white text-base">Ready to Start Your Journey?</h3>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Live GPS tracking and safety check-in countdown will activate immediately.
                  </p>
                </div>

                <button
                  onClick={handleStartJourney}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm tracking-wide shadow-xl shadow-emerald-500/30 active:scale-95 transition flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  START TRIP BUDDY JOURNEY
                </button>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 3: FAMILY & PUBLIC LIVE TRACKER VIEWER           */}
          {/* ==================================================== */}
          {activeTab === 'viewer' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  value={viewerToken}
                  onChange={e => setViewerToken(e.target.value)}
                  placeholder="Enter Journey Tracking Token (e.g. TRIP-M24...)"
                  className="w-full sm:flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white font-mono uppercase focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={() => fetchViewerData(viewerToken)}
                  disabled={isViewerLoading}
                  className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isViewerLoading ? 'animate-spin' : ''}`} />
                  View Journey Status
                </button>
              </div>

              {viewerError && (
                <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-600/60 text-rose-300 text-xs text-center">
                  {viewerError}
                </div>
              )}

              {viewerTrip && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Live Auto-Sync Status Bar */}
                  <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      Live Family Radar Tracking
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {lastViewerSyncAt ? `Last synced: ${lastViewerSyncAt.toLocaleTimeString()}` : 'Connecting...'}
                    </span>
                  </div>

                  {/* LIVE ROAD NAVIGATION RADAR MAP FOR FAMILY */}
                  <TripBuddyLiveMap
                    trip={viewerTrip}
                    isDriverView={false}
                    currentUser={currentUser}
                  />

                  {/* Driver Status Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-950 border border-purple-600 flex items-center justify-center text-purple-300 font-bold text-lg">
                          <Car className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-white">{viewerTrip.driverName}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              viewerTrip.status === 'active'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : viewerTrip.status === 'emergency'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-slate-700 text-slate-300'
                            }`}>
                              {viewerTrip.status?.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            {viewerTrip.departure} ➔ {viewerTrip.destination}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {viewerTrip.currentSpeedKmh !== undefined && (
                          <div className="px-2.5 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-700/60 text-xs font-mono font-bold text-cyan-300">
                            {viewerTrip.currentSpeedKmh} km/h
                          </div>
                        )}
                        {viewerTrip.batteryLevel !== undefined && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200">
                            <Battery className="w-4 h-4 text-emerald-400" />
                            {viewerTrip.batteryLevel}% Battery
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Corridor Progress Bar & Distance Remaining Indicator */}
                    {viewerTripProgress && (
                      <div className="mt-5 space-y-3 pt-3 border-t border-slate-700/60">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Navigation className="w-3.5 h-3.5 text-purple-400" />
                            <span className="font-bold text-white">Route Progress:</span>
                            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold">
                              {viewerTripProgress.percent}% Completed
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-amber-400 font-mono font-black text-xs sm:text-sm">
                              {viewerTripProgress.remainingKm} km remaining
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              (~{viewerTripProgress.etaMinutes >= 60 ? `${Math.floor(viewerTripProgress.etaMinutes / 60)}h ${viewerTripProgress.etaMinutes % 60}m` : `${viewerTripProgress.etaMinutes}m`} ETA)
                            </span>
                          </div>
                        </div>

                        {/* Visual Progress Track with moving Vehicle Pin */}
                        <div className="relative h-3.5 bg-slate-950 rounded-full border border-slate-700 overflow-visible p-0.5">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-400 to-emerald-400 transition-all duration-700"
                            style={{
                              width: `${Math.min(100, Math.max(3, viewerTripProgress.percent))}%`
                            }}
                          />
                          <div
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-700 flex flex-col items-center pointer-events-none"
                            style={{ left: `${Math.min(97, Math.max(3, viewerTripProgress.percent))}%` }}
                          >
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 border-2 border-white shadow-lg flex items-center justify-center text-white ring-2 ring-purple-400/30">
                              <Car className="w-3 h-3" />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between text-[11px] text-slate-400 pt-0.5">
                          <span className="truncate max-w-[33%]">{viewerTrip.departure}</span>
                          <span className="text-purple-300 font-bold font-mono">{viewerTripProgress.travelledKm} km covered</span>
                          <span className="truncate max-w-[33%] text-right">{viewerTrip.destination}</span>
                        </div>
                      </div>
                    )}

                    {/* Coordinates & Google Maps Pin */}
                    <div className="mt-4 pt-4 border-t border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] text-slate-400 uppercase font-semibold">Current Reported Location</span>
                        <div className="text-sm font-bold text-white flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-emerald-400" />
                          {viewerTrip.currentLat?.toFixed(4)}, {viewerTrip.currentLng?.toFixed(4)} ({viewerTrip.currentLocationName || 'En Route'})
                        </div>
                      </div>

                      {viewerTrip.currentLat && viewerTrip.currentLng && (
                        <a
                          href={`https://maps.google.com/?q=${viewerTrip.currentLat},${viewerTrip.currentLng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open in Google Maps
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Recent Check-in Logs */}
                  {Array.isArray(viewerTrip.recentCheckins) && viewerTrip.recentCheckins.length > 0 && (
                    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                        Recent Safety Check-in Log
                      </h4>
                      <div className="space-y-2">
                        {viewerTrip.recentCheckins.map((chk: any) => (
                          <div key={chk.id} className="p-2.5 rounded-lg bg-slate-900 text-xs flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              <span className="font-semibold text-white">{chk.notes || 'Safe Check-in'}</span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {chk.timestamp ? new Date(chk.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 4: PASSES & PRICING (PAID SERVICE GATING)        */}
          {/* ==================================================== */}
          {activeTab === 'passes' && (
            <div className="space-y-6">
              <div className="text-center max-w-lg mx-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold mb-2">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Secured by PayFast South Africa</span>
                </div>
                <h3 className="text-xl font-bold text-white">Trip Buddy Journey Passes</h3>
                <p className="text-xs text-slate-400 mt-1">
                  100% In-App Driver Safety Monitoring. Pay securely via PayFast with Capitec Pay, Instant EFT, Cards, or Scan QR Code.
                </p>
              </div>

              {/* Pricing Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {TRIP_BUDDY_PRICING_PASSES.map(pass => (
                  <div
                    key={pass.id}
                    className={`relative p-5 rounded-2xl flex flex-col justify-between transition-all ${
                      pass.recommended
                        ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-amber-500 shadow-xl shadow-amber-900/20'
                        : 'bg-slate-800/60 border border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {pass.badge && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-md">
                        {pass.badge}
                      </span>
                    )}

                    <div>
                      <h4 className="text-base font-bold text-white">{pass.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{pass.description}</p>

                      <div className="my-4">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs text-slate-400 font-bold">R</span>
                          <span className="text-3xl font-black text-white font-mono">{pass.priceZAR}</span>
                          <span className="text-xs text-slate-400">/{pass.periodLabel}</span>
                        </div>
                      </div>

                      <div className="space-y-2 my-4 pt-4 border-t border-slate-700/60">
                        {pass.features.map((feat, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                            <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handlePurchasePass(pass.id)}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                        pass.recommended
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                          : 'bg-red-600 hover:bg-red-500 text-white shadow-md'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Buy via PayFast (R{pass.priceZAR})</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Promo Code & Voucher Redemption Section (STRICTLY 2 FREE PROMO CODES) */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950/70 border border-indigo-500/40 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/50 flex items-center justify-center shrink-0">
                      <Gift className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Have a Free Promo Code?</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-full font-mono uppercase font-black">
                          2 FREE TRIAL CODES
                        </span>
                      </h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Redeem one of the 2 official promotional trial codes for complimentary trips. All other tokens require PayFast.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Promo Input Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleRedeemPromo();
                  }}
                  className="flex flex-col sm:flex-row items-stretch gap-2.5"
                >
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={promoCodeInput}
                      onChange={(e) => {
                        setPromoCodeInput(e.target.value.toUpperCase());
                        if (promoStatus) setPromoStatus(null);
                      }}
                      placeholder="ENTER PROMO CODE (e.g. FREEBUDDY or SAFEDRIVE)"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-indigo-500/50 rounded-xl text-xs sm:text-sm text-white font-mono uppercase tracking-wider placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isRedeemingPromo || !promoCodeInput.trim()}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 active:scale-95 transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    {isRedeemingPromo ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Apply Code</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Status Message */}
                {promoStatus && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2.5 animate-fadeIn ${
                      promoStatus.type === 'success'
                        ? 'bg-emerald-950/80 border border-emerald-500/70 text-emerald-200'
                        : 'bg-rose-950/80 border border-rose-500/70 text-rose-200'
                    }`}
                  >
                    {promoStatus.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span className="flex-1 font-medium">{promoStatus.message}</span>
                  </div>
                )}

                {/* STRICTLY The 2 Official Free Promo Codes */}
                <div className="pt-2 border-t border-slate-700/60">
                  <span className="text-[11px] text-slate-400 block mb-2 font-semibold">
                    Official Free Promotional Codes (Limit 2 Codes):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Code 1 */}
                    <button
                      type="button"
                      onClick={() => {
                        setPromoCodeInput('FREEBUDDY');
                        handleRedeemPromo('FREEBUDDY');
                      }}
                      className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-indigo-900/60 border border-indigo-500/40 text-left transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-black text-xs">
                          🎁
                        </div>
                        <div>
                          <div className="font-mono font-bold text-white text-xs group-hover:text-indigo-300">
                            FREEBUDDY
                          </div>
                          <div className="text-[10px] text-slate-400">First-Time Trial Grant</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                        +2 Free Trips
                      </span>
                    </button>

                    {/* Code 2 */}
                    <button
                      type="button"
                      onClick={() => {
                        setPromoCodeInput('SAFEDRIVE');
                        handleRedeemPromo('SAFEDRIVE');
                      }}
                      className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-indigo-900/60 border border-indigo-500/40 text-left transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-black text-xs">
                          🛡️
                        </div>
                        <div>
                          <div className="font-mono font-bold text-white text-xs group-hover:text-indigo-300">
                            SAFEDRIVE
                          </div>
                          <div className="text-[10px] text-slate-400">Road Safety Initiative</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                        +2 Free Trips
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Wallet Status Box */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-950 text-amber-400 border border-amber-800 flex items-center justify-center font-bold shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">Driver Safety Wallet:</span>
                      <span className="text-amber-300 font-black font-mono text-sm">
                        {wallet.activePassType === 'monthly_unlimited' ? 'Unlimited Travel' : `${wallet.remainingTrips} Journeys Available`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {wallet.activePassType === 'monthly_unlimited'
                        ? 'Active 30-day VIP Unlimited Pass'
                        : wallet.remainingTrips > 0
                        ? `${wallet.remainingTrips} safe trips loaded and ready to use.`
                        : 'No active tokens. Purchase a journey pass with PayFast or apply an official promo code above.'}
                    </p>
                  </div>
                </div>
                {wallet.lastPromoRedeemed && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/50 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-400" />
                    Active Code: {wallet.lastPromoRedeemed}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* PAYFAST OFFICIAL PAYMENT & QR CODE CHECKOUT MODAL    */}
          {/* ==================================================== */}
          {showPayfastModal && selectedPayfastPass && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="relative w-full max-w-lg bg-slate-900 border-2 border-emerald-500/80 rounded-3xl p-5 sm:p-6 text-slate-100 shadow-2xl space-y-5 overflow-hidden">
                
                {/* Header with PayFast Badge */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-black text-sm">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-white">PayFast Official Checkout</h4>
                      <p className="text-[11px] text-slate-400">South Africa's #1 Encrypted Payment Gateway</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowPayfastModal(false)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Selected Item Summary */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">Selected Journey Pass:</span>
                    <span className="text-sm font-bold text-white">{selectedPayfastPass.title}</span>
                    <span className="text-[11px] text-emerald-400 block font-mono">
                      {selectedPayfastPass.tripsIncluded} Trips Included • Instant Wallet Credit
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Total Due</span>
                    <span className="text-2xl font-black text-white font-mono">
                      R{selectedPayfastPass.priceZAR}.00
                    </span>
                  </div>
                </div>

                {/* Driver Contact for Receipt */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Email for PayFast Receipt
                    </label>
                    <input
                      type="email"
                      value={payfastEmail}
                      onChange={(e) => setPayfastEmail(e.target.value)}
                      placeholder="driver@example.co.za"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Mobile Number (SMS Alert)
                    </label>
                    <input
                      type="tel"
                      value={payfastPhone}
                      onChange={(e) => setPayfastPhone(e.target.value)}
                      placeholder="082 123 4567"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>

                {/* Primary Action: Launch PayFast Secure Checkout */}
                <div className="space-y-2.5 pt-1">
                  <button
                    onClick={launchPayfastCheckout}
                    disabled={isInitializingPayfast}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-900/40 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isInitializingPayfast ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Opening PayFast Gateway...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Proceed to PayFast Gateway (R{selectedPayfastPass.priceZAR}.00)</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-center text-slate-400 leading-relaxed px-2">
                    🔒 You will be securely transferred to the official <strong>PayFast South Africa</strong> payment gateway. Supported: <span className="text-slate-300 font-semibold">Instant EFT, Credit/Debit Card, Capitec Pay & Masterpass</span>.
                  </p>
                </div>

                {/* Live Traffic Safe Corridor Guarantee */}
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center gap-2.5 text-xs text-slate-400">
                  <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-[11px]">
                    Upon successful transaction completion, your safety wallet tokens are verified and credited automatically.
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
