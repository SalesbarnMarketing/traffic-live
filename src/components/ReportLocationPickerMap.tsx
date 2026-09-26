import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { 
  MapPin, Crosshair, Search, RefreshCw, AlertTriangle, Check, 
  Compass, X, Navigation, LocateFixed, CheckCircle2, ChevronRight, Layers
} from 'lucide-react';
import { SARegionId, detectRegionFromCoords } from '../utils/regionUtils';
import { searchAddress, reverseGeocodeLocation, RouteSearchResult } from '../utils/routeUtils';
import { getLastKnownUserPosition } from '../utils/locationChecker';

interface ReportLocationPickerMapProps {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  source?: 'gps' | 'network' | 'cache' | 'ip' | null;
  province?: SARegionId;
  roadLocation?: string;
  onChangeLocation: (
    lat: number, 
    lng: number, 
    reverseGeocodedRoad?: string, 
    detectedProvince?: SARegionId
  ) => void;
  onDetectGps: () => void;
  isLocating?: boolean;
  onClearLocation?: () => void;
}

export const ReportLocationPickerMap: React.FC<ReportLocationPickerMapProps> = ({
  latitude,
  longitude,
  accuracy,
  source,
  province,
  roadLocation,
  onChangeLocation,
  onDetectGps,
  isLocating = false,
  onClearLocation
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<RouteSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Handle outside click to close search suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Create custom pulsing pin icon with pixel-exact coordinate tip alignment
  const createPinIcon = useCallback(() => {
    return L.divIcon({
      className: 'custom-pinpoint-marker',
      html: `
        <div style="position: relative; width: 36px; height: 48px; display: flex; flex-direction: column; align-items: center; cursor: grab;">
          <!-- Pulse radar ring anchored at tip -->
          <div style="position: absolute; bottom: 0; left: 50%; transform: translate(-50%, 50%); width: 22px; height: 22px; border-radius: 9999px; background: rgba(244, 63, 94, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; pointer-events: none;"></div>
          <!-- Pin body -->
          <div style="width: 32px; height: 32px; border-radius: 9999px; background: linear-gradient(135deg, #f43f5e, #dc2626); border: 2.5px solid #ffffff; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 2;">
            <svg style="width: 16px; height: 16px; fill: white;" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/>
            </svg>
          </div>
          <!-- Needle tip extending to bottom edge -->
          <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 10px solid #dc2626; margin-top: -3px; z-index: 1;"></div>
          <!-- Ground pin anchor dot -->
          <div style="position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 6px; height: 4px; border-radius: 9999px; background: rgba(0, 0, 0, 0.8); z-index: 3;"></div>
        </div>
      `,
      iconSize: [36, 48],
      iconAnchor: [18, 48],
      popupAnchor: [0, -48]
    });
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    if ((container as any)._leaflet_id) {
      delete (container as any)._leaflet_id;
    }

    try {
      const cached = getLastKnownUserPosition();
      const initialLat = typeof latitude === 'number' && !isNaN(latitude) 
        ? latitude 
        : (cached ? cached.latitude : -25.7479);
      const initialLng = typeof longitude === 'number' && !isNaN(longitude) 
        ? longitude 
        : (cached ? cached.longitude : 28.2293);

      const map = L.map(container, {
        center: [initialLat, initialLng],
        zoom: 15,
        zoomControl: false,
        attributionControl: false
      });

      // Add clean dark/standard tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      // Create draggable marker
      const marker = L.marker([initialLat, initialLng], {
        icon: createPinIcon(),
        draggable: true
      }).addTo(map);

      // Marker Drag End Listener
      marker.on('dragend', async () => {
        const pos = marker.getLatLng();
        handlePositionChanged(pos.lat, pos.lng);
      });

      // Map Click Listener
      map.on('click', async (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        handlePositionChanged(e.latlng.lat, e.latlng.lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Invalidate size after modal render animation completes
      const timer = setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);

      return () => {
        clearTimeout(timer);
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.off();
            mapInstanceRef.current.remove();
          } catch (err) {
            console.debug('Error cleaning up map:', err);
          }
        }
        mapInstanceRef.current = null;
        markerRef.current = null;
        accuracyCircleRef.current = null;
        if (container) {
          delete (container as any)._leaflet_id;
        }
      };
    } catch (err) {
      console.warn('Location picker map initialization error:', err);
    }
  }, []);

  // Update marker & view when coordinates change from outside (e.g. GPS detect)
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return;
    if (typeof latitude !== 'number' || typeof longitude !== 'number' || isNaN(latitude) || isNaN(longitude)) return;

    const currentPos = markerRef.current.getLatLng();
    const dist = Math.hypot(currentPos.lat - latitude, currentPos.lng - longitude);
    
    // If coordinate moved noticeably (> 10 meters)
    if (dist > 0.0001) {
      markerRef.current.setLatLng([latitude, longitude]);
      mapInstanceRef.current.setView([latitude, longitude], Math.max(mapInstanceRef.current.getZoom(), 15), {
        animate: true
      });
    }

    // Update accuracy circle if accuracy is known
    if (accuracy && accuracy > 30 && accuracy < 10000) {
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.setLatLng([latitude, longitude]);
        accuracyCircleRef.current.setRadius(accuracy);
      } else {
        accuracyCircleRef.current = L.circle([latitude, longitude], {
          radius: accuracy,
          color: source === 'gps' ? '#10b981' : '#f59e0b',
          fillColor: source === 'gps' ? '#10b981' : '#f59e0b',
          fillOpacity: 0.12,
          weight: 1.5,
          dashArray: '4, 6'
        }).addTo(mapInstanceRef.current);
      }
    } else if (accuracyCircleRef.current) {
      try {
        mapInstanceRef.current.removeLayer(accuracyCircleRef.current);
      } catch (e) {
        // ignore
      }
      accuracyCircleRef.current = null;
    }
  }, [latitude, longitude, accuracy, source]);

  // Handle position change: updates parent & triggers reverse geocode
  const handlePositionChanged = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    let roadName: string | undefined = undefined;
    let detectedProv: SARegionId | undefined = undefined;

    try {
      const geo = await reverseGeocodeLocation(lat, lng);
      if (geo && geo.success) {
        roadName = geo.road || geo.locationName;
        if (geo.province) {
          const detected = detectRegionFromCoords(lat, lng);
          if (detected && detected !== 'all') {
            detectedProv = detected;
          }
        }
      }
    } catch (e) {
      console.debug('Reverse geocoding error:', e);
    } finally {
      setIsGeocoding(false);
    }

    if (!detectedProv) {
      const detected = detectRegionFromCoords(lat, lng);
      if (detected && detected !== 'all') {
        detectedProv = detected;
      }
    }

    onChangeLocation(lat, lng, roadName, detectedProv);
  };

  // Search Address / Road with debounce
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchAddress(query.trim());
        setSearchResults(results);
        setShowSearchResults(true);
      } catch (err) {
        console.warn('Search address error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  // Select Search Result
  const handleSelectSearchResult = (result: RouteSearchResult) => {
    setSearchQuery('');
    setShowSearchResults(false);

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([result.lat, result.lng], 16, { animate: true });
      markerRef.current.setLatLng([result.lat, result.lng]);
    }

    let detectedProv: SARegionId | undefined = undefined;
    const detected = detectRegionFromCoords(result.lat, result.lng);
    if (detected && detected !== 'all') {
      detectedProv = detected;
    }

    onChangeLocation(result.lat, result.lng, result.name, detectedProv);
  };

  // Recenter map on current coordinates
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([latitude, longitude], 16, { animate: true });
    }
  };

  // Determine accuracy display
  const isHighAccuracyGps = source === 'gps' && accuracy !== null && accuracy !== undefined && accuracy <= 50;
  const isCoarseLocation = (!accuracy || accuracy > 60 || source === 'ip' || source === 'network');

  return (
    <div className="space-y-2.5">
      {/* Top Bar: Search Highway / Street & Quick GPS Buttons */}
      <div className="relative" ref={searchContainerRef}>
        <div className="flex items-center space-x-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {isSearching ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              ) : (
                <Search className="w-3.5 h-3.5 text-cyan-400" />
              )}
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setShowSearchResults(true);
              }}
              placeholder="Search highway, offramp, or landmark (e.g. N1 Allandale, Rigel, R21)..."
              className="w-full bg-[#0d1524] border border-slate-700/80 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchResults(false);
                }}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Recenter Map Button */}
          <button
            type="button"
            onClick={handleRecenter}
            className="p-2 bg-[#101a2e] hover:bg-[#16243d] border border-slate-700 text-slate-300 hover:text-white rounded-xl transition shrink-0"
            title="Recenter map on pinpoint"
          >
            <Crosshair className="w-4 h-4 text-cyan-400" />
          </button>

          {/* Force Fresh GPS Button */}
          <button
            type="button"
            onClick={onDetectGps}
            disabled={isLocating}
            className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center space-x-1.5 transition shrink-0 ${
              isLocating
                ? 'bg-amber-950/50 border-amber-500/50 text-amber-300'
                : 'bg-cyan-950/60 hover:bg-cyan-900/60 border-cyan-700/60 text-cyan-300 hover:text-cyan-200'
            }`}
            title="Force fresh device GPS fix"
          >
            <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-amber-400' : 'text-cyan-400'}`} />
            <span className="hidden sm:inline">{isLocating ? 'Fixing GPS...' : 'Re-detect GPS'}</span>
          </button>
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-[#0e1726] border border-cyan-500/40 rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto">
            <div className="px-3 py-1.5 bg-[#0a101d] border-b border-slate-800 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Matching Roads & Interchanges ({searchResults.length})</span>
              <span className="text-cyan-400 lowercase font-normal">tap to place pin</span>
            </div>
            {searchResults.map((item, idx) => (
              <button
                key={`${item.lat}-${item.lng}-${idx}`}
                type="button"
                onClick={() => handleSelectSearchResult(item)}
                className="w-full text-left px-3.5 py-2.5 hover:bg-[#16233b] border-b border-slate-800/60 last:border-0 flex items-center justify-between group transition cursor-pointer"
              >
                <div className="flex items-center space-x-2.5 min-w-0 flex-1 pr-2">
                  <MapPin className="w-4 h-4 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-cyan-300">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {item.city || item.province}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5 shrink-0">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                    {item.province || 'SA'}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Map Canvas */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-slate-700/80 bg-[#090d16] shadow-xl">
        <div 
          ref={mapContainerRef} 
          className="h-56 sm:h-64 w-full z-10"
        />

        {/* Draggable Guidance Badge (Overlay on Map) */}
        <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
          <div className="bg-[#0b1322]/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/80 shadow-lg text-[11px] font-medium text-slate-200 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span>Drag pin or tap map to adjust exact spot</span>
          </div>
        </div>

        {/* Bottom Coordinates & Geocode Indicator */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-20 flex flex-wrap items-center justify-between gap-1.5 pointer-events-none">
          {/* Coordinates Tag */}
          <div className="bg-[#0b1322]/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/80 text-[11px] font-mono text-cyan-300 shadow-md flex items-center space-x-1.5">
            <Navigation className="w-3 h-3 text-cyan-400" />
            <span>{latitude.toFixed(5)}, {longitude.toFixed(5)}</span>
            {isGeocoding && (
              <span className="text-[10px] text-amber-400 animate-pulse ml-1">
                (Resolving road...)
              </span>
            )}
          </div>

          {/* Accuracy Badge */}
          {accuracy !== undefined && accuracy !== null && (
            <div className={`backdrop-blur-md px-2.5 py-1 rounded-lg border text-[10.5px] font-bold shadow-md flex items-center space-x-1.5 ${
              isHighAccuracyGps
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
                : 'bg-amber-950/90 border-amber-500/50 text-amber-300'
            }`}>
              {isHighAccuracyGps ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>GPS ±{accuracy}m (High Precision)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span>±{accuracy}m {source === 'ip' ? '(Network IP)' : '(Network)'}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Map Zoom Controls */}
        <div className="absolute top-2.5 right-2.5 z-20 flex flex-col space-y-1">
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-7 h-7 bg-[#0f172a]/90 hover:bg-[#1e293b] border border-slate-700 rounded-lg text-white font-black text-sm flex items-center justify-center transition shadow-md cursor-pointer"
            title="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-7 h-7 bg-[#0f172a]/90 hover:bg-[#1e293b] border border-slate-700 rounded-lg text-white font-black text-sm flex items-center justify-center transition shadow-md cursor-pointer"
            title="Zoom out"
          >
            −
          </button>
        </div>
      </div>

      {/* Helpful Warning if Coarse / Inaccurate GPS was returned */}
      {isCoarseLocation && (
        <div className="flex items-start space-x-2.5 p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 leading-snug">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold text-amber-300">Coarse or Approximate Location: </span>
            <span>
              Your browser returned a network/cell estimated location (±{accuracy || 'unknown'}m). 
              Please drag the red pin on the map above or search the exact highway/intersection to place it correctly.
            </span>
          </div>
          {onClearLocation && (
            <button
              type="button"
              onClick={onClearLocation}
              className="text-[11px] font-bold text-amber-300 underline hover:text-white shrink-0 ml-1 cursor-pointer"
            >
              Clear Pin
            </button>
          )}
        </div>
      )}
    </div>
  );
};
