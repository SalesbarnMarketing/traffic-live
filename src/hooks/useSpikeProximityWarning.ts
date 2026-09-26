import { useState, useEffect, useRef, useCallback } from 'react';
import { IncidentReport, FeedItem } from '../types';
import { calculateDistanceKm, speakSpikeHazardWarning, playSpikeWarningChime } from '../utils/spikeProximityAudio';
import { getLastKnownUserPosition } from '../utils/locationChecker';

export interface NearestSpikeHazard {
  report: IncidentReport | null;
  distanceKm: number;
  isUrgent: boolean;
  locationName: string;
  roadName: string;
  title: string;
  description: string;
}

export interface SpikeProximityState {
  userLocation: { lat: number; lng: number } | null;
  nearestSpike: NearestSpikeHazard | null;
  activeSpikesCount: number;
  isVoiceEnabled: boolean;
  warningThresholdKm: number;
  isSpeaking: boolean;
  isSimulating: boolean;
  gpsActive: boolean;
  lastAnnouncedAt: number | null;
}

const STORAGE_KEY_VOICE = 'livetraffic_spike_voice_enabled';
const STORAGE_KEY_DIST = 'livetraffic_spike_warning_dist';

export function useSpikeProximityWarning(reports: IncidentReport[], feedItems: FeedItem[] = []) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(() => {
    const cached = getLastKnownUserPosition();
    return cached ? { lat: cached.latitude, lng: cached.longitude } : null;
  });
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VOICE);
      return saved !== null ? saved === 'true' : true; // Default ON for driver safety
    } catch {
      return true;
    }
  });
  const [warningThresholdKm, setWarningThresholdKm] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DIST);
      return saved ? parseFloat(saved) : 3.5; // Default 3.5 km early warning
    } catch {
      return 3.5;
    }
  });

  const [nearestSpike, setNearestSpike] = useState<NearestSpikeHazard | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [gpsActive, setGpsActive] = useState(false);
  const [lastAnnouncedAt, setLastAnnouncedAt] = useState<number | null>(null);

  const announcedHazardsRef = useRef<Map<string, { time: number; tier: 'far' | 'close' }>>(new Map());
  const simIntervalRef = useRef<any>(null);

  // Save preferences
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_VOICE, String(isVoiceEnabled));
    } catch {}
  }, [isVoiceEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DIST, String(warningThresholdKm));
    } catch {}
  }, [warningThresholdKm]);

  // Find all active, approved spike hazards with valid coordinates
  const getActiveSpikeReports = useCallback((): IncidentReport[] => {
    return reports.filter((r) => {
      const isApproved = r.status === 'approved' || r.status === 'resolved';
      if (!isApproved) return false;
      const typeMatches = r.type === 'spiking';
      const textMatches =
        (r.title + ' ' + r.description + ' ' + (r.roadName || '') + ' ' + (r.locationName || '')).toLowerCase().includes('spike');
      return (typeMatches || textMatches) && typeof r.latitude === 'number' && typeof r.longitude === 'number';
    });
  }, [reports]);

  // Trigger voice alert with cooldown guard
  const triggerVoiceAlert = useCallback(
    (hazard: NearestSpikeHazard, force: boolean = false) => {
      if (!isVoiceEnabled && !force) return;

      const hazardId = hazard.report?.id || hazard.title;
      const now = Date.now();
      const currentTier = hazard.distanceKm <= 1.5 ? 'close' : 'far';

      if (!force) {
        const lastAnnounce = announcedHazardsRef.current.get(hazardId);
        if (lastAnnounce) {
          // If announced recently (within 2.5 minutes) and tier has not upgraded to close, skip
          const elapsed = now - lastAnnounce.time;
          if (elapsed < 150000 && lastAnnounce.tier === currentTier) {
            return;
          }
          if (elapsed < 60000 && lastAnnounce.tier === 'close') {
            return;
          }
        }
      }

      announcedHazardsRef.current.set(hazardId, { time: now, tier: currentTier });
      setLastAnnouncedAt(now);

      speakSpikeHazardWarning({
        roadName: hazard.roadName,
        locationName: hazard.locationName,
        title: hazard.title,
        distanceKm: hazard.distanceKm,
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false)
      });
    },
    [isVoiceEnabled]
  );

  // Evaluate proximity against user location
  useEffect(() => {
    if (!userLocation) {
      setNearestSpike(null);
      return;
    }

    const spikeHazards = getActiveSpikeReports();
    if (spikeHazards.length === 0) {
      setNearestSpike(null);
      return;
    }

    let closest: NearestSpikeHazard | null = null;
    let minDistance = Infinity;

    for (const spike of spikeHazards) {
      const dist = calculateDistanceKm(
        userLocation.lat,
        userLocation.lng,
        spike.latitude,
        spike.longitude
      );

      if (dist < minDistance) {
        minDistance = dist;
        closest = {
          report: spike,
          distanceKm: dist,
          isUrgent: dist <= 1.5,
          locationName: spike.locationName || 'Highway corridor',
          roadName: spike.roadName || spike.locationName || 'Highway Route',
          title: spike.title,
          description: spike.description
        };
      }
    }

    setNearestSpike(closest);

    // If closest is within warning threshold, trigger automated voice
    if (closest && closest.distanceKm <= warningThresholdKm) {
      triggerVoiceAlert(closest);
    }
  }, [userLocation, getActiveSpikeReports, warningThresholdKm, triggerVoiceAlert]);

  // Real Geolocation Tracking & Global GPS Event Listener
  useEffect(() => {
    if (isSimulating) return; // Don't override simulator

    const handlePositionUpdated = (e: any) => {
      const pos = e.detail;
      if (pos && typeof pos.latitude === 'number' && typeof pos.longitude === 'number') {
        setUserLocation({ lat: pos.latitude, lng: pos.longitude });
        setGpsActive(true);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('livetraffic:user-position-updated', handlePositionUpdated);
    }

    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setGpsActive(false);
      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('livetraffic:user-position-updated', handlePositionUpdated);
        }
      };
    }

    let watchId: number | null = null;

    try {
      const cached = getLastKnownUserPosition();
      if (cached) {
        setUserLocation({ lat: cached.latitude, lng: cached.longitude });
        setGpsActive(true);
      }

      // First quick fetch
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsActive(true);
        },
        (err) => {
          console.warn('Initial geolocation warning:', err.message);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
      );

      // Continuous watch
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsActive(true);
        },
        (err) => {
          console.warn('Geolocation watch error:', err.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    } catch (e) {
      console.warn('Could not initialize geolocation watch:', e);
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('livetraffic:user-position-updated', handlePositionUpdated);
      }
    };
  }, [isSimulating]);

  // Test Simulation Mode: Simulate approaching N1 Pumulani spike trap from 5km to 0.8km
  const startSimulation = useCallback(() => {
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);

    setIsSimulating(true);
    // Spike trap at N1 North near Pumulani: Lat: -25.6200, Lng: 28.2800 (approx)
    const targetSpike = getActiveSpikeReports()[0] || {
      latitude: -25.6200,
      longitude: 28.2800,
      title: 'Spike Trap Reported on N1 Northbound near Pumulani Toll',
      roadName: 'N1 Northbound (Pumulani Corridor)',
      locationName: 'Pumulani Toll Plaza Corridor'
    };

    let step = 0;
    const totalSteps = 6;
    // Start approx 5.2 km south and move closer each tick
    const startLat = targetSpike.latitude - 0.046;
    const startLng = targetSpike.longitude - 0.025;

    setUserLocation({ lat: startLat, lng: startLng });
    setGpsActive(true);

    simIntervalRef.current = setInterval(() => {
      step++;
      const progress = Math.min(step / totalSteps, 1);
      const curLat = startLat + (targetSpike.latitude - startLat) * (progress * 0.88);
      const curLng = startLng + (targetSpike.longitude - startLng) * (progress * 0.88);

      setUserLocation({ lat: curLat, lng: curLng });

      if (step >= totalSteps) {
        clearInterval(simIntervalRef.current);
      }
    }, 2800);
  }, [getActiveSpikeReports]);

  const stopSimulation = useCallback(() => {
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    setIsSimulating(false);
    // Reset to real geolocation
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsActive(true);
        },
        () => {},
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // Manual Test Voice Trigger
  const testVoiceWarning = useCallback(() => {
    const active = getActiveSpikeReports();
    const sample = active[0] || {
      roadName: 'N1 Northbound near Pumulani Toll',
      locationName: 'Pumulani Toll Plaza Corridor',
      title: 'Active Spike Trap Threat Verified'
    };

    const mockHazard: NearestSpikeHazard = {
      report: null,
      distanceKm: 2.1,
      isUrgent: false,
      locationName: sample.locationName || 'N1 Northbound Corridor',
      roadName: sample.roadName || 'N1 Highway',
      title: sample.title || 'Spike Trap Hazard',
      description: 'Metal road spikes hidden under cardboard boxes on carriageway.'
    };

    triggerVoiceAlert(mockHazard, true);
  }, [getActiveSpikeReports, triggerVoiceAlert]);

  const toggleVoiceEnabled = useCallback(() => {
    setIsVoiceEnabled((prev) => !prev);
  }, []);

  const activeSpikesCount = getActiveSpikeReports().length;

  return {
    userLocation,
    nearestSpike,
    activeSpikesCount,
    isVoiceEnabled,
    warningThresholdKm,
    isSpeaking,
    isSimulating,
    gpsActive,
    lastAnnouncedAt,
    setIsVoiceEnabled,
    setWarningThresholdKm,
    toggleVoiceEnabled,
    triggerVoiceAlert,
    testVoiceWarning,
    startSimulation,
    stopSimulation
  };
}
