import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { TripBuddyPlan, EmergencySOS, RegisteredUser } from '../types';
import { fetchDrivingRoute, CalculatedRoute, OnRouteHazard } from '../utils/routeUtils';
import { calculateDistanceKm, cleanWhatsAppNumber, formatTripSOSMessage, createWhatsAppDirectUrl } from '../utils/tripBuddyUtils';
import { playEmergencySOSAlertSound } from '../utils/voiceAudioFeedback';
import { tripBuddyAudio } from '../utils/tripBuddyAudio';
import { AnalogSpeedometer } from './AnalogSpeedometer';
import {
  ShieldAlert, Navigation, Play, Pause, FastForward, RotateCcw, AlertTriangle,
  Car, Flame, Activity, PhoneCall, CheckCircle2, Battery, Gauge, MapPin, 
  Share2, Shield, Radio, Volume2, X, Compass, ExternalLink, RefreshCw
} from 'lucide-react';

interface TripBuddyLiveMapProps {
  trip: TripBuddyPlan;
  isDriverView?: boolean;
  currentUser?: RegisteredUser | null;
  onTripUpdated?: (updatedTrip: TripBuddyPlan) => void;
  onSubmitSOS?: (sosData: Partial<EmergencySOS>) => Promise<void>;
  onTriggerSOSNotification?: () => void;
}

export const TripBuddyLiveMap: React.FC<TripBuddyLiveMapProps> = ({
  trip,
  isDriverView = true,
  currentUser,
  onTripUpdated,
  onSubmitSOS,
  onTriggerSOSNotification
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const hazardMarkersRef = useRef<L.Marker[]>([]);

  // Simulation & Route State
  const [calculatedRoute, setCalculatedRoute] = useState<CalculatedRoute | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(true);
  const [isAutoSimulating, setIsAutoSimulating] = useState<boolean>(false);
  const [simSpeedMultiplier, setSimSpeedMultiplier] = useState<number>(2); // 1x, 2x, 5x
  const [followDriver, setFollowDriver] = useState<boolean>(true);
  
  // Emergency SOS State
  const [showSOSConfirmation, setShowSOSConfirmation] = useState<boolean>(false);
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);
  const [sosDispatchedSuccess, setSosDispatchedSuccess] = useState<boolean>(false);
  const [activeSOSCallRef, setActiveSOSCallRef] = useState<string | null>(null);

  // Derive current position
  const currentLat = trip.currentLat || trip.departureCoords?.lat || -25.7479;
  const currentLng = trip.currentLng || trip.departureCoords?.lng || 28.2293;
  const depLat = trip.departureCoords?.lat || -25.7479;
  const depLng = trip.departureCoords?.lng || 28.2293;
  const destLat = trip.destinationCoords?.lat || -23.8319;
  const destLng = trip.destinationCoords?.lng || 30.1611;

  // 1. Fetch real driving road coordinates for the corridor
  useEffect(() => {
    let isMounted = true;
    const loadRoute = async () => {
      setIsLoadingRoute(true);
      try {
        const startPoint = {
          lat: depLat,
          lng: depLng,
          name: trip.departure || 'Departure'
        };
        const endPoint = {
          lat: destLat,
          lng: destLng,
          name: trip.destination || 'Destination'
        };
        const routeData = await fetchDrivingRoute(startPoint, endPoint);
        if (isMounted && routeData) {
          setCalculatedRoute(routeData);
        }
      } catch (err) {
        console.warn('[TripBuddyLiveMap] Error loading driving route:', err);
      } finally {
        if (isMounted) setIsLoadingRoute(false);
      }
    };

    loadRoute();
    return () => {
      isMounted = false;
    };
  }, [depLat, depLng, destLat, destLng, trip.departure, trip.destination]);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentLat, currentLng],
        zoom: 11,
        zoomControl: false,
        attributionControl: false
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Use the exact same Google Maps Live Traffic tile layer as the main map (no API key required)
      L.tileLayer('https://{s}.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}', {
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        maxZoom: 20,
        attribution: '&copy; Google Maps Live Traffic'
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 3. Render Route Polyline & Endpoints
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clean previous layers
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    if (startMarkerRef.current) {
      map.removeLayer(startMarkerRef.current);
      startMarkerRef.current = null;
    }
    if (destMarkerRef.current) {
      map.removeLayer(destMarkerRef.current);
      destMarkerRef.current = null;
    }
    hazardMarkersRef.current.forEach(m => map.removeLayer(m));
    hazardMarkersRef.current = [];

    // Construct route path coordinates
    let polylineCoords: [number, number][] = [];
    if (calculatedRoute && calculatedRoute.coordinates && calculatedRoute.coordinates.length > 0) {
      polylineCoords = calculatedRoute.coordinates;
    } else {
      polylineCoords = [
        [depLat, depLng],
        [destLat, destLng]
      ];
    }

    // Glowing cyan / blue navigation polyline
    const polyline = L.polyline(polylineCoords, {
      color: '#06b6d4',
      weight: 6,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
      dashArray: undefined
    }).addTo(map);

    routeLayerRef.current = polyline;

    // Start Pin Icon
    const startIcon = L.divIcon({
      className: 'custom-trip-start-pin',
      html: `
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 border-2 border-white shadow-lg text-white font-bold text-xs">
          🏁
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const startMarker = L.marker([depLat, depLng], { icon: startIcon })
      .addTo(map)
      .bindPopup(`<b>Start:</b> ${trip.departure}`);
    startMarkerRef.current = startMarker;

    // Destination Pin Icon
    const destIcon = L.divIcon({
      className: 'custom-trip-dest-pin',
      html: `
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-rose-600 border-2 border-white shadow-lg text-white font-bold text-xs">
          🎯
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const destMarker = L.marker([destLat, destLng], { icon: destIcon })
      .addTo(map)
      .bindPopup(`<b>Destination:</b> ${trip.destination}`);
    destMarkerRef.current = destMarker;

    // Render on-route hazards matching the flyer (Crash, Spiking, Congestion)
    if (calculatedRoute?.hazards && calculatedRoute.hazards.length > 0) {
      calculatedRoute.hazards.forEach((hazard) => {
        const isSpike = hazard.category === 'spiking' || hazard.type === 'spiking';
        const isCrash = hazard.category === 'accident' || hazard.type === 'accident';
        const badgeColor = isSpike ? 'bg-amber-500' : isCrash ? 'bg-red-600' : 'bg-orange-500';
        const emoji = isSpike ? '⚠️' : isCrash ? '🚗' : '🛑';

        const hazardIcon = L.divIcon({
          className: 'custom-hazard-pin',
          html: `
            <div class="flex items-center justify-center w-7 h-7 rounded-full ${badgeColor} border-2 border-white shadow-md text-white text-xs animate-pulse">
              ${emoji}
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const hMarker = L.marker([hazard.lat, hazard.lng], { icon: hazardIcon })
          .addTo(map)
          .bindPopup(`
            <div class="p-1 text-xs">
              <strong class="text-rose-600 font-bold">${hazard.title}</strong>
              <div class="text-slate-600 mt-0.5">${hazard.description || 'Reported on corridor'}</div>
              <div class="text-slate-400 text-[10px] mt-1">${hazard.distanceKmFromStart?.toFixed(1) || '0'} km ahead</div>
            </div>
          `);
        hazardMarkersRef.current.push(hMarker);
      });
    }

    // Fit bounds on first route load
    if (polylineCoords.length > 0) {
      const bounds = L.latLngBounds(polylineCoords);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [calculatedRoute, depLat, depLng, destLat, destLng, trip.departure, trip.destination]);

  // 4. Update Driver Car Marker on Coordinate Changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const isEmergency = trip.status === 'emergency';
    const carColor = isEmergency ? 'bg-rose-600 ring-4 ring-rose-400 animate-ping' : 'bg-cyan-500 ring-4 ring-cyan-300';
    const speed = trip.currentSpeedKmh || 0;

    const driverIcon = L.divIcon({
      className: 'custom-driver-vehicle-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <!-- Pulse Radar Ring -->
          <div class="absolute w-12 h-12 rounded-full ${isEmergency ? 'bg-rose-500/40' : 'bg-cyan-500/30'} animate-ping"></div>
          <!-- Vehicle Disc -->
          <div class="relative w-9 h-9 rounded-full ${isEmergency ? 'bg-rose-600' : 'bg-gradient-to-tr from-cyan-600 to-teal-400'} border-2 border-white shadow-2xl flex items-center justify-center text-white text-sm transform transition-transform duration-500">
            🚗
          </div>
          <!-- Speed Badge -->
          <div class="absolute -bottom-4 bg-slate-900/90 text-cyan-300 border border-cyan-500/40 font-mono text-[9px] font-black px-1.5 py-0.2 rounded-full shadow whitespace-nowrap">
            ${speed} km/h
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    if (!driverMarkerRef.current) {
      const marker = L.marker([currentLat, currentLng], { icon: driverIcon, zIndexOffset: 1000 }).addTo(map);
      marker.bindPopup(`
        <div class="p-1 text-xs">
          <strong>${trip.driverName}</strong>
          <div class="text-slate-600">${trip.vehicleDetails?.makeModel || 'Vehicle en route'}</div>
          <div class="text-cyan-700 font-mono font-bold mt-0.5">${speed} km/h • ~${trip.distanceTravelledKm || 0} km travelled</div>
        </div>
      `);
      driverMarkerRef.current = marker;
    } else {
      driverMarkerRef.current.setLatLng([currentLat, currentLng]);
      driverMarkerRef.current.setIcon(driverIcon);
    }

    if (followDriver) {
      map.panTo([currentLat, currentLng], { animate: true, duration: 0.8 });
    }
  }, [currentLat, currentLng, trip.currentSpeedKmh, trip.status, trip.driverName, trip.vehicleDetails, trip.distanceTravelledKm, followDriver]);

  // 5. Live Simulation / Auto-Drive Loop
  useEffect(() => {
    if (!isAutoSimulating || trip.status !== 'active') return;

    const interval = setInterval(async () => {
      const currentTravelled = trip.distanceTravelledKm || 0;
      const totalDist = trip.estimatedDistanceKm || 100;

      // Increment distance based on speed multiplier (~1.5 km step per interval)
      const stepKm = 1.2 * simSpeedMultiplier;
      const nextTravelled = Math.min(totalDist, Math.round((currentTravelled + stepKm) * 10) / 10);

      // Interpolate coordinates along route
      let nextLat = currentLat;
      let nextLng = currentLng;

      if (calculatedRoute?.coordinates && calculatedRoute.coordinates.length > 1) {
        const fraction = Math.min(0.999, nextTravelled / totalDist);
        const indexFloat = fraction * (calculatedRoute.coordinates.length - 1);
        const baseIdx = Math.floor(indexFloat);
        const nextIdx = Math.min(calculatedRoute.coordinates.length - 1, baseIdx + 1);
        const fracSegment = indexFloat - baseIdx;

        const p1 = calculatedRoute.coordinates[baseIdx];
        const p2 = calculatedRoute.coordinates[nextIdx];

        nextLat = Number((p1[0] + (p2[0] - p1[0]) * fracSegment).toFixed(4));
        nextLng = Number((p1[1] + (p2[1] - p1[1]) * fracSegment).toFixed(4));
      } else {
        const fraction = Math.min(0.999, nextTravelled / totalDist);
        nextLat = Number((depLat + (destLat - depLat) * fraction).toFixed(4));
        nextLng = Number((depLng + (destLng - depLng) * fraction).toFixed(4));
      }

      const simulatedSpeed = Math.floor(88 + Math.random() * 25);

      try {
        const res = await fetch('/api/trip-buddy/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tripId: trip.id,
            lat: nextLat,
            lng: nextLng,
            speedKmh: simulatedSpeed,
            distanceTravelledKm: nextTravelled,
            locationName: `En Route (~${nextTravelled} km / ${totalDist} km)`
          })
        });
        const data = await res.json();
        if (data.trip && onTripUpdated) {
          onTripUpdated(data.trip);
        }
      } catch (e) {
        console.warn('[TripBuddyLiveMap] Simulation ping error:', e);
      }

      if (nextTravelled >= totalDist) {
        setIsAutoSimulating(false);
      }
    }, 1800);

    return () => clearInterval(interval);
  }, [isAutoSimulating, simSpeedMultiplier, trip.id, trip.distanceTravelledKm, trip.estimatedDistanceKm, trip.status, currentLat, currentLng, calculatedRoute, depLat, depLng, destLat, destLng, onTripUpdated]);

  // Handle Manual Jump / Delta Step
  const handleManualAdvanceKm = async (deltaKm: number) => {
    const currentTravelled = trip.distanceTravelledKm || 0;
    const totalDist = trip.estimatedDistanceKm || 100;
    const nextTravelled = Math.min(totalDist, Math.max(0, Math.round((currentTravelled + deltaKm) * 10) / 10));

    const fraction = Math.min(0.999, nextTravelled / totalDist);
    let nextLat = depLat + (destLat - depLat) * fraction;
    let nextLng = depLng + (destLng - depLng) * fraction;

    if (calculatedRoute?.coordinates && calculatedRoute.coordinates.length > 1) {
      const indexFloat = fraction * (calculatedRoute.coordinates.length - 1);
      const baseIdx = Math.floor(indexFloat);
      const nextIdx = Math.min(calculatedRoute.coordinates.length - 1, baseIdx + 1);
      const fracSegment = indexFloat - baseIdx;
      const p1 = calculatedRoute.coordinates[baseIdx];
      const p2 = calculatedRoute.coordinates[nextIdx];
      nextLat = p1[0] + (p2[0] - p1[0]) * fracSegment;
      nextLng = p1[1] + (p2[1] - p1[1]) * fracSegment;
    }

    try {
      const res = await fetch('/api/trip-buddy/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: trip.id,
          lat: Number(nextLat.toFixed(4)),
          lng: Number(nextLng.toFixed(4)),
          speedKmh: Math.floor(95 + Math.random() * 20),
          distanceTravelledKm: nextTravelled,
          locationName: `En Route (~${nextTravelled} km / ${totalDist} km)`
        })
      });
      const data = await res.json();
      if (data.trip && onTripUpdated) {
        onTripUpdated(data.trip);
        tripBuddyAudio.playCheckinSuccessPing();
      }
    } catch (e) {
      console.warn('Advance error:', e);
    }
  };

  // Trigger Emergency SOS Action
  const handleExecuteEmergencySOS = async () => {
    setShowSOSConfirmation(false);
    playEmergencySOSAlertSound();

    const callRef = `SOS-TB-${Date.now().toString().slice(-4)}`;
    setActiveSOSCallRef(callRef);
    setSosDispatchedSuccess(true);

    const vehicleText = trip.vehicleDetails 
      ? `${trip.vehicleDetails.color || ''} ${trip.vehicleDetails.makeModel || 'Vehicle'} (${trip.vehicleDetails.licensePlate || 'Plate Unlogged'})`.trim()
      : 'Motorist en route';

    const sosPayload: Partial<EmergencySOS> = {
      name: trip.driverName,
      phone: trip.driverPhone || '0820000000',
      vehicleInfo: vehicleText,
      latitude: currentLat,
      longitude: currentLng,
      locationName: trip.currentLocationName || `En route to ${trip.destination}`,
      emergencyType: 'spiking_puncture',
      notes: `🚨 URGENT MOTORIST SOS [${callRef}]: Driver triggered emergency panic during live trip to ${trip.destination}. Immediate responder dispatch required!`,
      callRef
    };

    // 1. Submit to main SOS responder network
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

    // 2. Mark trip status as emergency
    try {
      const pingRes = await fetch('/api/trip-buddy/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: trip.id,
          status: 'safe',
          notes: `EMERGENCY SOS DISTRESS TRIGGERED: ${callRef}`,
          lat: currentLat,
          lng: currentLng,
          locationName: trip.currentLocationName
        })
      });
      const pingData = await pingRes.json();
      if (pingData.trip && onTripUpdated) {
        onTripUpdated({ ...pingData.trip, status: 'emergency' });
      }
    } catch (_) {}

    // 3. Open WhatsApp SOS for primary contact
    if (trip.emergencyContacts && trip.emergencyContacts.length > 0 && trip.emergencyContacts[0].phone) {
      const msg = formatTripSOSMessage(
        trip,
        currentLat,
        currentLng,
        trip.currentLocationName || 'En route',
        `EMERGENCY SOS DISTRESS TRIGGERED [Ref: ${callRef}]`
      );
      const url = createWhatsAppDirectUrl(trip.emergencyContacts[0].phone, msg);
      window.open(url, '_blank');
    }

    if (onTriggerSOSNotification) {
      onTriggerSOSNotification();
    }
  };

  const progressPercent = Math.min(
    100,
    Math.max(2, Math.round(((trip.distanceTravelledKm || 0) / (trip.estimatedDistanceKm || 100)) * 100))
  );

  const totalDistKm = trip.estimatedDistanceKm || 100;
  const travelledDistKm = trip.distanceTravelledKm || 0;
  const remainingDistKm = Math.max(0, Math.round((totalDistKm - travelledDistKm) * 10) / 10);
  
  // Estimate remaining travel time assuming average speed of ~85 km/h if moving, or 0 if arrived
  const avgSpeed = Math.max(60, trip.currentSpeedKmh || 85);
  const remainingMinsTotal = Math.round((remainingDistKm / avgSpeed) * 60);
  const remHours = Math.floor(remainingMinsTotal / 60);
  const remMins = remainingMinsTotal % 60;
  const etaTimestamp = new Date(Date.now() + remainingMinsTotal * 60000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="flex flex-col w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl text-slate-100 space-y-0">
      
      {/* Top Corridor Banner with Trip Header & Live Metrics */}
      <div className="p-3.5 sm:p-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#D4A237]/20 border border-[#D4A237]/40 flex items-center justify-center text-[#D4A237] shrink-0 shadow-inner">
            <Navigation className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm sm:text-base font-black text-white truncate">
                {trip.departure} ➔ {trip.destination}
              </h4>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                trip.status === 'emergency'
                  ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50 animate-pulse'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {trip.status === 'emergency' ? '🚨 EMERGENCY' : 'LIVE TRIP TRACKER'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              Traveler: <span className="text-slate-200 font-semibold">{trip.driverName}</span> • Via {trip.routeVia || 'Highway Corridor'}
            </p>
          </div>
        </div>

        {/* Live Gauges */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700/80 flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span>{trip.currentSpeedKmh || 0} km/h</span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700/80 flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-300">
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
            <span>{trip.batteryLevel !== undefined ? `${trip.batteryLevel}%` : 'OK'}</span>
          </div>

          <button
            onClick={() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.setView([currentLat, currentLng], 13, { animate: true });
                setFollowDriver(true);
              }
            }}
            title="Center Camera on Traveler"
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              followDriver ? 'bg-cyan-600/30 border-cyan-500 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. REAL-TIME LOCATION & TRAVEL DISTANCE TELEMETRY BAR */}
      <div className="bg-slate-900/95 border-b border-slate-800 p-3 sm:p-4 space-y-2.5">
        {/* Where is the person right now? */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-black/60 border border-slate-800 rounded-xl p-2.5 text-xs">
          <div className="flex items-start space-x-2.5 min-w-0">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/60 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                Live Current Location At This Moment:
              </span>
              <p className="text-white font-bold text-xs sm:text-sm truncate">
                {trip.currentLocationName || `En route (${currentLat.toFixed(4)}, ${currentLng.toFixed(4)})`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
            <span className="font-mono text-[10px] bg-slate-900 text-slate-300 px-2 py-1 rounded border border-slate-700">
              {currentLat.toFixed(4)}°, {currentLng.toFixed(4)}°
            </span>
            <a
              href={`https://maps.google.com/?q=${currentLat},${currentLng}`}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 font-semibold underline"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Google Maps Pin</span>
            </a>
          </div>
        </div>

        {/* How far is the person traveling? 4-Stat Live Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {/* 1. Distance Traveled */}
          <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Traveled So Far</span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-base sm:text-lg font-black font-mono text-cyan-400">
                {travelledDistKm}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase">KM</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold">{progressPercent}% Completed</span>
          </div>

          {/* 2. Remaining Distance */}
          <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Remaining Distance</span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-base sm:text-lg font-black font-mono text-amber-400">
                {remainingDistKm}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase">KM</span>
            </div>
            <span className="text-[10px] text-slate-400">to destination</span>
          </div>

          {/* 3. Total Trip Distance */}
          <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Route</span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-base sm:text-lg font-black font-mono text-white">
                {totalDistKm}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase">KM</span>
            </div>
            <span className="text-[10px] text-slate-400 truncate block">{trip.routeVia || 'Corridor'}</span>
          </div>

          {/* 4. Estimated Time / ETA */}
          <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Estimated Arrival</span>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span className="text-base sm:text-lg font-black font-mono text-emerald-400">
                {remainingDistKm <= 0 ? 'ARRIVED' : etaTimestamp}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              {remainingDistKm <= 0 ? 'Trip Completed' : `~${remHours}h ${remMins}m drive`}
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-1 pt-0.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
            <span className="truncate max-w-[130px] flex items-center space-x-1">
              <MapPin className="w-3 h-3 text-emerald-400 inline" />
              <span>{trip.departure}</span>
            </span>
            <span className="text-[#D4A237] font-mono font-bold">
              {travelledDistKm} of {totalDistKm} km ({progressPercent}%)
            </span>
            <span className="truncate max-w-[130px] text-right flex items-center justify-end space-x-1">
              <span>{trip.destination}</span>
              <MapPin className="w-3 h-3 text-red-400 inline" />
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-[#D4A237] transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Map Viewport with On-Route Hazard Badges matching the Flyer */}
      <div className="relative w-full h-[320px] sm:h-[420px] bg-slate-900 overflow-hidden">
        
        {/* Leaflet Map DOM Node */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Real-Time Speedometer HUD Dial (Compact Vertical Floating Analog Speedo) */}
        {(() => {
          const speed = trip.currentSpeedKmh || 0;
          const remainingRange = Math.max(0, Math.round((trip.estimatedDistanceKm || 100) - (trip.distanceTravelledKm || 0)));
          const speedStatus = speed > 120 ? '⚠️ OVER LIMIT' : speed > 60 ? 'HIGHWAY' : speed > 0 ? 'CRUISING' : 'STOPPED';
          const speedColor = speed > 120 ? 'text-rose-400' : speed > 60 ? 'text-amber-400' : speed > 0 ? 'text-cyan-400' : 'text-slate-400';

          return (
            <div className="absolute top-2.5 left-2.5 z-10 flex flex-col items-center p-2 rounded-2xl bg-slate-950/92 backdrop-blur-md border border-slate-700/80 shadow-2xl w-[118px]">
              {/* Compact Analog Speedometer Dial */}
              <AnalogSpeedometer
                currentSpeed={speed}
                maxSpeed={220}
                tripDistanceKm={trip.distanceTravelledKm || 0}
                speedLimit={120}
                size="xs"
              />

              {/* Text & Telemetry Stacked Directly Under the Dial */}
              <div className="flex flex-col items-center w-full mt-1.5 pt-1 border-t border-slate-800/80">
                {/* Digital Speed Number & Unit */}
                <div className="flex items-baseline gap-1">
                  <span className={`text-sm font-black font-mono leading-none ${speedColor}`}>
                    {speed}
                  </span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">
                    KM/H
                  </span>
                </div>

                {/* Status & Speed Limit Row */}
                <div className="flex items-center justify-between w-full mt-1 px-0.5">
                  <span className={`text-[8px] font-bold font-mono truncate max-w-[64px] ${speedColor}`}>
                    {speedStatus}
                  </span>
                  {/* SA 120 Limit Badge */}
                  <div
                    className="w-4 h-4 rounded-full bg-white border border-red-600 flex items-center justify-center text-[7px] font-black text-black shadow-sm shrink-0"
                    title="Limit: 120 km/h"
                  >
                    120
                  </div>
                </div>

                {/* Remaining Range */}
                <span className="text-[7.5px] text-slate-400 font-mono text-center mt-0.5">
                  Range: {remainingRange} km
                </span>
              </div>
            </div>
          );
        })()}

        {/* Loading Route Spinner */}
        {isLoadingRoute && (
          <div className="absolute top-20 left-3 z-10 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-xs text-cyan-300 flex items-center gap-2 shadow-lg backdrop-blur">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            <span>Computing corridor path...</span>
          </div>
        )}

        {/* On-Route Hazard Cards floating on the right matching the Flyer phone mockup */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 max-w-[170px] sm:max-w-[200px] pointer-events-none">
          <div className="px-2.5 py-1.5 rounded-xl bg-red-600/90 border border-red-400/50 shadow-xl backdrop-blur flex items-center gap-2 text-white">
            <div className="p-1 rounded-md bg-black/20 shrink-0">
              <Car className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs font-black leading-tight">Crash Ahead</div>
              <div className="text-[9px] text-red-100/90 font-mono">Radar Alert Active</div>
            </div>
          </div>

          <div className="px-2.5 py-1.5 rounded-xl bg-amber-500/95 border border-amber-300/60 shadow-xl backdrop-blur flex items-center gap-2 text-slate-950">
            <div className="p-1 rounded-md bg-black/15 shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 text-slate-950 font-bold" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs font-black leading-tight">Spiking Trap Alert</div>
              <div className="text-[9px] text-slate-900 font-semibold font-mono">High Vigilance</div>
            </div>
          </div>

          <div className="px-2.5 py-1.5 rounded-xl bg-rose-900/90 border border-rose-500/50 shadow-xl backdrop-blur flex items-center gap-2 text-white">
            <div className="p-1 rounded-md bg-black/20 shrink-0">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs font-black leading-tight">Congestion Zone</div>
              <div className="text-[9px] text-rose-200 font-mono">+8m Delay</div>
            </div>
          </div>
        </div>

        {/* Progress & Speed Overlay Strip at Bottom of Map */}
        <div className="absolute bottom-2 left-2 right-2 z-10 p-2.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 shadow-xl flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
            <span className="truncate max-w-[120px]">{trip.departure}</span>
            <span className="text-cyan-400 font-bold font-mono">
              {trip.distanceTravelledKm || 0} / {trip.estimatedDistanceKm || 100} km ({progressPercent}%)
            </span>
            <span className="truncate max-w-[120px] text-right">{trip.destination}</span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-amber-400 transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Auto-Drive Simulation & Motion Testing Bar */}
      {isDriverView && (
        <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAutoSimulating(!isAutoSimulating)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow ${
                isAutoSimulating
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 animate-pulse'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500'
              }`}
            >
              {isAutoSimulating ? <Pause className="w-3.5 h-3.5 shrink-0" /> : <Play className="w-3.5 h-3.5 shrink-0" />}
              <span>{isAutoSimulating ? 'Pause Auto-Drive' : '🚗 Auto-Drive Sim'}</span>
            </button>

            {isAutoSimulating && (
              <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-[10px] font-bold">
                <button
                  onClick={() => setSimSpeedMultiplier(1)}
                  className={`px-1.5 py-0.5 rounded ${simSpeedMultiplier === 1 ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
                >
                  1x
                </button>
                <button
                  onClick={() => setSimSpeedMultiplier(3)}
                  className={`px-1.5 py-0.5 rounded ${simSpeedMultiplier === 3 ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
                >
                  3x
                </button>
                <button
                  onClick={() => setSimSpeedMultiplier(8)}
                  className={`px-1.5 py-0.5 rounded ${simSpeedMultiplier === 8 ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
                >
                  8x
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleManualAdvanceKm(15)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1"
            >
              <FastForward className="w-3 h-3 text-cyan-400" />
              <span>+15km Hop</span>
            </button>
            <button
              onClick={() => handleManualAdvanceKm(-20)}
              className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs border border-slate-700 transition"
              title="Step Back"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* PROMINENT EMERGENCY SOS PANIC BUTTON matching the Flyer image mockup */}
      <div className="p-4 sm:p-5 bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col items-center justify-center text-center relative overflow-hidden">
        
        {/* Glow ambient background */}
        <div className="absolute -top-12 w-64 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />

        {!sosDispatchedSuccess ? (
          <div className="w-full flex flex-col items-center">
            {/* Big Circular Pulsing SOS Button from Flyer Mockup */}
            <button
              onClick={() => setShowSOSConfirmation(true)}
              className="group relative flex flex-col items-center justify-center w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-red-600 via-rose-700 to-red-800 text-white font-black shadow-2xl shadow-red-600/50 hover:shadow-red-500/80 active:scale-95 transition transform border-4 border-red-400/80 cursor-pointer"
            >
              {/* Radio Wave Pulse Rings */}
              <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping pointer-events-none" />
              <div className="absolute -inset-2 rounded-full border-2 border-red-500/40 animate-pulse pointer-events-none" />

              <span className="text-3xl sm:text-4xl tracking-widest font-black text-white drop-shadow-md">
                SOS
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold text-red-200 uppercase tracking-tight mt-0.5">
                PANIC ALERT
              </span>
            </button>

            <div className="mt-3">
              <h3 className="text-sm sm:text-base font-black text-white tracking-wide">
                PRESS FOR SOS PANIC
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 max-w-sm mx-auto mt-0.5">
                Instantly alerts emergency responders, police, CPF & dispatches live GPS pin with priority sirens.
              </p>
            </div>
          </div>
        ) : (
          /* Dispatched Active State */
          <div className="w-full max-w-md p-4 rounded-xl bg-rose-950/80 border-2 border-rose-500/80 shadow-2xl flex flex-col items-center text-center animate-fadeIn">
            <div className="w-10 h-10 rounded-full bg-rose-600 flex items-center justify-center text-white text-lg font-black animate-bounce shadow-lg">
              🚨
            </div>
            <h3 className="text-base font-black text-white mt-2">EMERGENCY RESPONDERS ALERTED</h3>
            <p className="text-xs text-rose-200 mt-1">
              Dispatch Ref: <span className="font-mono font-bold text-white bg-black/40 px-1.5 py-0.5 rounded">{activeSOSCallRef}</span>
            </p>
            <p className="text-[11px] text-slate-300 mt-1">
              Live GPS coordinates ({currentLat.toFixed(4)}, {currentLng.toFixed(4)}) broadcasted to nearby patrol units.
            </p>

            {/* Direct Responder Phone Calls */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full mt-3">
              <a
                href="tel:10111"
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-black shadow transition"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>10111 Police</span>
              </a>
              <a
                href="tel:112"
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-black shadow transition"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>112 Cell SOS</span>
              </a>
              <a
                href="tel:082911"
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow transition col-span-2 sm:col-span-1"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Netcare 911</span>
              </a>
            </div>

            <button
              onClick={() => setSosDispatchedSuccess(false)}
              className="mt-3 text-[11px] text-slate-400 hover:text-slate-200 underline"
            >
              Reset SOS Panel
            </button>
          </div>
        )}

        {/* SOS Confirmation Dialog */}
        {showSOSConfirmation && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border-2 border-red-500 p-5 shadow-2xl flex flex-col items-center text-center animate-scaleIn">
              <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center text-white text-2xl font-black shadow-lg animate-pulse">
                🆘
              </div>
              <h3 className="text-lg font-black text-white mt-3">CONFIRM EMERGENCY SOS?</h3>
              <p className="text-xs text-slate-300 mt-1">
                This will immediately broadcast a high-priority distress signal with your live location to emergency responders and WhatsApp emergency contacts.
              </p>

              <div className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 my-3 text-left text-xs space-y-1">
                <div className="text-slate-400">Driver: <span className="text-white font-bold">{trip.driverName}</span></div>
                <div className="text-slate-400">Location: <span className="text-cyan-300 font-mono">{currentLat.toFixed(4)}, {currentLng.toFixed(4)}</span></div>
                <div className="text-slate-400">Vehicle: <span className="text-amber-300">{trip.vehicleDetails?.makeModel || 'Logged Vehicle'}</span></div>
              </div>

              <div className="flex items-center gap-2 w-full">
                <button
                  onClick={() => setShowSOSConfirmation(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteEmergencySOS}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs shadow-lg shadow-red-600/40 transition flex items-center justify-center gap-1.5"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>DISPATCH SOS NOW</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
