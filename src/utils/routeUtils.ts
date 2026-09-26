// Route Calculation, Geocoding & On-Route Hazard Detection Utilities for LiveTrafficNPC
import { IncidentReport, EmergencySOS } from '../types';

export interface RouteSearchResult {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  type?: string;
  city?: string;
  province?: string;
}

export interface RouteStep {
  instruction: string;
  distanceKm: number;
  durationMin: number;
  name?: string;
}

export interface CalculatedRoute {
  start: { lat: number; lng: number; name?: string };
  destination: { lat: number; lng: number; name: string };
  distanceKm: number;
  durationMin: number;
  geometry: [number, number][]; // [lat, lng] array
  steps: RouteStep[];
}

export interface OnRouteHazard {
  report: IncidentReport;
  distanceFromStartKm: number;
  distanceToRouteKm: number;
  approachingDistanceKm?: number;
  warningText: string;
}

// Comprehensive South African Landmark, Town & Suburb Presets
export const POPULAR_SA_DESTINATIONS: RouteSearchResult[] = [
  // Gauteng Key Destinations
  { id: 'dest-sandton', name: 'Sandton City & Mall', displayName: 'Sandton City, Rivonia Rd, Sandton, Johannesburg, Gauteng', lat: -26.1076, lng: 28.0567, city: 'Johannesburg', province: 'Gauteng' },
  { id: 'dest-menlyn', name: 'Menlyn Park (Pretoria East)', displayName: 'Menlyn Park Shopping Centre, Atterbury Rd, Pretoria East, Gauteng', lat: -25.7824, lng: 28.2755, city: 'Pretoria', province: 'Gauteng' },
  { id: 'dest-pta-east', name: 'Pretoria East', displayName: 'Pretoria East (Faerie Glen / Menlyn / Garsfontein), City of Tshwane, Gauteng', lat: -25.8255, lng: 28.3251, city: 'Pretoria', province: 'Gauteng' },
  { id: 'dest-wonderpark', name: 'Wonderpark Shopping Centre', displayName: 'Wonderpark Shopping Centre, Heinrich Ave, Karenpark, Akasia, Pretoria', lat: -25.6636, lng: 28.1099, city: 'Pretoria', province: 'Gauteng' },
  { id: 'dest-ortambo', name: 'OR Tambo International Airport', displayName: 'O.R. Tambo Airport (JNB), Kempton Park, Ekurhuleni, Gauteng', lat: -26.1367, lng: 28.2411, city: 'Ekurhuleni', province: 'Gauteng' },
  { id: 'dest-mallofafrica', name: 'Mall of Africa', displayName: 'Mall of Africa, Magwa Cres, Midrand Waterfall, Gauteng', lat: -26.0152, lng: 28.1065, city: 'Midrand', province: 'Gauteng' },
  { id: 'dest-pretoriacbd', name: 'Pretoria CBD (Church Square)', displayName: 'Church Square, Pretoria Central, Tshwane, Gauteng', lat: -25.7461, lng: 28.1881, city: 'Pretoria', province: 'Gauteng' },
  { id: 'dest-jhbcbd', name: 'Johannesburg CBD', displayName: 'Johannesburg Central, Gauteng', lat: -26.2041, lng: 28.0473, city: 'Johannesburg', province: 'Gauteng' },
  { id: 'dest-centurion', name: 'Centurion Mall', displayName: 'Centurion Mall, Heuwel Ave, Centurion, Gauteng', lat: -25.8576, lng: 28.1906, city: 'Centurion', province: 'Gauteng' },
  { id: 'dest-lanseria', name: 'Lanseria International Airport', displayName: 'Lanseria Airport (HLA), Airport Rd, Gauteng', lat: -25.9385, lng: 27.9261, city: 'Johannesburg', province: 'Gauteng' },
  { id: 'dest-midrand', name: 'Midrand Central', displayName: 'Midrand, City of Johannesburg Metropolitan Municipality, Gauteng', lat: -25.9984, lng: 28.1263, city: 'Midrand', province: 'Gauteng' },
  { id: 'dest-soweto', name: 'Soweto (Vilakazi Street)', displayName: 'Soweto, Orlando West, Johannesburg, Gauteng', lat: -26.2365, lng: 27.9048, city: 'Johannesburg', province: 'Gauteng' },

  // Limpopo Destinations
  { id: 'dest-tzaneen', name: 'Tzaneen', displayName: 'Tzaneen, Greater Tzaneen, Mopani, Limpopo', lat: -23.8319, lng: 30.1611, city: 'Tzaneen', province: 'Limpopo' },
  { id: 'dest-polokwane', name: 'Polokwane (Pietersburg)', displayName: 'Polokwane Central / Mall of the North, Limpopo', lat: -23.9045, lng: 29.4689, city: 'Polokwane', province: 'Limpopo' },
  { id: 'dest-magoebaskloof', name: 'Magoebaskloof Pass', displayName: 'Magoebaskloof Pass (R71), Haenertsburg / Tzaneen, Limpopo', lat: -23.8647, lng: 29.9875, city: 'Tzaneen', province: 'Limpopo' },
  { id: 'dest-belabela', name: 'Bela-Bela (Warmbaths)', displayName: 'Bela-Bela (Warmbaths), Waterberg, Limpopo', lat: -24.8856, lng: 28.2917, city: 'Bela-Bela', province: 'Limpopo' },
  { id: 'dest-mokopane', name: 'Mokopane (Potgietersrus)', displayName: 'Mokopane, Mogalakwena, Limpopo', lat: -24.1833, lng: 29.0167, city: 'Mokopane', province: 'Limpopo' },

  // Mpumalanga Destinations
  { id: 'dest-mbombela', name: 'Mbombela (Nelspruit)', displayName: 'Mbombela (Nelspruit) / Riverside Mall, Mpumalanga', lat: -25.4753, lng: 30.9694, city: 'Mbombela', province: 'Mpumalanga' },
  { id: 'dest-witbank', name: 'eMalahleni (Witbank)', displayName: 'eMalahleni (Witbank), Highveld Mall, Mpumalanga', lat: -25.8728, lng: 29.2272, city: 'eMalahleni', province: 'Mpumalanga' },
  { id: 'dest-middelburg', name: 'Middelburg', displayName: 'Middelburg, Steve Tshwete, Mpumalanga', lat: -25.7751, lng: 29.4648, city: 'Middelburg', province: 'Mpumalanga' },

  // North West Destinations
  { id: 'dest-rustenburg', name: 'Rustenburg (Waterfall Mall)', displayName: 'Rustenburg, Waterfall Mall, North West', lat: -25.6667, lng: 27.2417, city: 'Rustenburg', province: 'North West' },
  { id: 'dest-potchefstroom', name: 'Potchefstroom (Mooirivier Mall)', displayName: 'Potchefstroom, JB Marks, North West', lat: -26.7145, lng: 27.0970, city: 'Potchefstroom', province: 'North West' },
  { id: 'dest-klerksdorp', name: 'Klerksdorp', displayName: 'Klerksdorp, Matlosana, North West', lat: -26.8667, lng: 26.6667, city: 'Klerksdorp', province: 'North West' },

  // KwaZulu-Natal Destinations
  { id: 'dest-dbncbd', name: 'Durban Beachfront & CBD', displayName: 'Durban Central, eThekwini, KwaZulu-Natal', lat: -29.8587, lng: 31.0218, city: 'Durban', province: 'KwaZulu-Natal' },
  { id: 'dest-gateway', name: 'Gateway Theatre of Shopping (Umhlanga)', displayName: 'Gateway Theatre, Umhlanga Rocks, Durban, KwaZulu-Natal', lat: -29.7258, lng: 31.0664, city: 'Durban', province: 'KwaZulu-Natal' },
  { id: 'dest-ballito', name: 'Ballito (Dolphin Coast)', displayName: 'Ballito Lifestyle Centre, KwaDukuza, KwaZulu-Natal', lat: -29.5390, lng: 31.2144, city: 'Ballito', province: 'KwaZulu-Natal' },
  { id: 'dest-pmb', name: 'Pietermaritzburg', displayName: 'Pietermaritzburg (Msunduzi), Midlands, KwaZulu-Natal', lat: -29.6006, lng: 30.3794, city: 'Pietermaritzburg', province: 'KwaZulu-Natal' },
  { id: 'dest-richardsbay', name: 'Richards Bay', displayName: 'Richards Bay, City of uMhlathuze, KwaZulu-Natal', lat: -28.7807, lng: 32.0383, city: 'Richards Bay', province: 'KwaZulu-Natal' },

  // Western Cape Destinations
  { id: 'dest-ctwaterfront', name: 'V&A Waterfront Cape Town', displayName: 'Victoria & Alfred Waterfront, Cape Town, Western Cape', lat: -33.9036, lng: 18.4205, city: 'Cape Town', province: 'Western Cape' },
  { id: 'dest-ctcbd', name: 'Cape Town CBD', displayName: 'Cape Town City Centre, Western Cape', lat: -33.9249, lng: 18.4241, city: 'Cape Town', province: 'Western Cape' },
  { id: 'dest-stellenbosch', name: 'Stellenbosch', displayName: 'Stellenbosch, Cape Winelands, Western Cape', lat: -33.9321, lng: 18.8602, city: 'Stellenbosch', province: 'Western Cape' },
  { id: 'dest-george', name: 'George (Garden Route Mall)', displayName: 'George, Garden Route, Western Cape', lat: -33.9631, lng: 22.4617, city: 'George', province: 'Western Cape' },
  { id: 'dest-knysna', name: 'Knysna Waterfront', displayName: 'Knysna Waterfront, Garden Route, Western Cape', lat: -34.0356, lng: 23.0471, city: 'Knysna', province: 'Western Cape' },

  // Free State & Eastern Cape Destinations
  { id: 'dest-bloem', name: 'Bloemfontein (Mimosa Mall)', displayName: 'Bloemfontein, Mangaung, Free State', lat: -29.1167, lng: 26.2167, city: 'Bloemfontein', province: 'Free State' },
  { id: 'dest-kimberley', name: 'Kimberley (Big Hole)', displayName: 'Kimberley, Sol Plaatje, Northern Cape', lat: -28.7282, lng: 24.7499, city: 'Kimberley', province: 'Northern Cape' },
  { id: 'dest-gqeberha', name: 'Gqeberha (Port Elizabeth)', displayName: 'Gqeberha (Port Elizabeth), Nelson Mandela Bay, Eastern Cape', lat: -33.9608, lng: 25.6022, city: 'Gqeberha', province: 'Eastern Cape' },
  { id: 'dest-eastlondon', name: 'East London (Beacon Bay)', displayName: 'East London, Buffalo City, Eastern Cape', lat: -32.9734, lng: 27.9076, city: 'East London', province: 'Eastern Cape' }
];

/**
 * Calculate Great-Circle distance between two coordinates in kilometers (Haversine formula)
 */
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate shortest perpendicular distance from a point to a line segment in km
 */
function pointToSegmentDistanceKm(
  pLat: number,
  pLng: number,
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): { distanceKm: number; projectionFraction: number } {
  const avgLatRad = ((aLat + bLat) / 2) * (Math.PI / 180);
  const cosLat = Math.cos(avgLatRad);

  const px = (pLng - aLng) * cosLat * 111.32;
  const py = (pLat - aLat) * 110.574;

  const bx = (bLng - aLng) * cosLat * 111.32;
  const by = (bLat - aLat) * 110.574;

  const segLenSq = bx * bx + by * by;
  if (segLenSq === 0) {
    const d = Math.sqrt(px * px + py * py);
    return { distanceKm: d, projectionFraction: 0 };
  }

  let t = (px * bx + py * by) / segLenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = t * bx;
  const projY = t * by;

  const dx = px - projX;
  const dy = py - projY;

  return {
    distanceKm: Math.sqrt(dx * dx + dy * dy),
    projectionFraction: t
  };
}

/**
 * Search for South African addresses / destinations via local dictionary + server geocoder API
 */
export async function searchAddress(query: string): Promise<RouteSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  const queryLower = trimmed.toLowerCase();

  // Match predefined destinations first for instant responses
  const matchedPresets = POPULAR_SA_DESTINATIONS.filter(p => {
    const nameMatch = p.name.toLowerCase().includes(queryLower);
    const dispMatch = p.displayName.toLowerCase().includes(queryLower);
    const cityMatch = p.city?.toLowerCase().includes(queryLower);
    return nameMatch || dispMatch || cityMatch;
  });

  try {
    const res = await fetch(`/api/navigation/search-address?q=${encodeURIComponent(trimmed)}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // Merge preset matches with remote results
        const remoteCoords = new Set(data.map(d => `${d.lat.toFixed(3)},${d.lng.toFixed(3)}`));
        const filteredPresets = matchedPresets.filter(p => !remoteCoords.has(`${p.lat.toFixed(3)},${p.lng.toFixed(3)}`));
        return [...filteredPresets, ...data];
      }
    }
  } catch (e) {
    console.warn("Geocoding fetch error:", e);
  }

  return matchedPresets;
}

/**
 * Geocode a place name into coordinates with multi-tier fallback
 */
export async function geocodeLocation(query: string): Promise<{ lat: number; lng: number; displayName: string; name: string } | null> {
  if (!query || !query.trim()) return null;
  const q = query.trim().toLowerCase();

  // 1. Exact or partial match on popular SA list
  const preset = POPULAR_SA_DESTINATIONS.find(p => 
    p.name.toLowerCase() === q || 
    p.displayName.toLowerCase().includes(q) ||
    q.includes(p.name.toLowerCase())
  );
  if (preset) {
    return { lat: preset.lat, lng: preset.lng, displayName: preset.displayName, name: preset.name };
  }

  // 2. Fetch via search-address
  const results = await searchAddress(query);
  if (results.length > 0) {
    return {
      lat: results[0].lat,
      lng: results[0].lng,
      displayName: results[0].displayName,
      name: results[0].name
    };
  }

  return null;
}

export interface ReverseGeocodeResult {
  success: boolean;
  road: string;
  locationName: string;
  suburb?: string;
  city?: string;
  province?: string;
  displayName?: string;
}

/**
 * Reverse-geocode latitude and longitude into road and suburb/city names
 */
export async function reverseGeocodeLocation(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  try {
    const res = await fetch(`/api/navigation/reverse-geocode?lat=${lat}&lng=${lng}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        return data;
      }
    }
  } catch (e) {
    console.warn("Reverse geocode fetch error:", e);
  }

  return {
    success: false,
    road: '',
    locationName: `GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    province: 'Gauteng'
  };
}

/**
 * Request driving route between start and destination coordinates
 */
export async function fetchDrivingRoute(
  start: { lat: number; lng: number; name?: string },
  destination: { lat: number; lng: number; name: string }
): Promise<CalculatedRoute> {
  try {
    const res = await fetch(
      `/api/navigation/route?startLat=${start.lat}&startLng=${start.lng}&endLat=${destination.lat}&endLng=${destination.lng}`
    );
    if (res.ok) {
      const data = await res.json();
      if (data.geometry && data.geometry.length > 0) {
        return {
          start,
          destination,
          distanceKm: data.distanceKm || getDistanceKm(start.lat, start.lng, destination.lat, destination.lng),
          durationMin: data.durationMin || Math.round(data.distanceKm * 1.2),
          geometry: data.geometry,
          steps: data.steps || []
        };
      }
    }
  } catch (err) {
    console.warn("Route API error, falling back to interpolated line:", err);
  }

  // Fallback Great-Circle Interpolation with highway winding factor (1.2x)
  const straightDist = getDistanceKm(start.lat, start.lng, destination.lat, destination.lng);
  const roadDist = parseFloat((straightDist * 1.22).toFixed(1));
  const speedAvgKmh = straightDist > 100 ? 95 : straightDist > 30 ? 70 : 50;
  const estMins = Math.max(10, Math.round((roadDist / speedAvgKmh) * 60));

  const numSteps = Math.max(10, Math.min(60, Math.round(straightDist * 2)));
  const geometry: [number, number][] = [];

  for (let i = 0; i <= numSteps; i++) {
    const f = i / numSteps;
    const lat = start.lat + (destination.lat - start.lat) * f;
    const lng = start.lng + (destination.lng - start.lng) * f;
    geometry.push([lat, lng]);
  }

  return {
    start,
    destination,
    distanceKm: roadDist,
    durationMin: estMins,
    geometry,
    steps: [
      { instruction: `Depart from ${start.name || 'Start Location'}`, distanceKm: 0, durationMin: 0 },
      { instruction: `Proceed towards ${destination.name}`, distanceKm: roadDist, durationMin: estMins },
      { instruction: `Arrive at ${destination.name}`, distanceKm: roadDist, durationMin: estMins }
    ]
  };
}

/**
 * Intelligent Route Analyzer for Trip Buddy: Computes distance, time, highway corridor & waypoints
 */
export async function calculateTripBuddyRouteSummary(
  departureName: string,
  departureCoords: { lat: number; lng: number } | null,
  destinationName: string,
  destinationCoords: { lat: number; lng: number } | null
): Promise<{
  distanceKm: number;
  durationMins: number;
  routeVia: string;
  depCoords: { lat: number; lng: number };
  destCoords: { lat: number; lng: number };
  geometry?: [number, number][];
}> {
  // 1. Resolve coordinates if missing
  let dep = departureCoords;
  if (!dep) {
    const geocoded = await geocodeLocation(departureName);
    dep = geocoded ? { lat: geocoded.lat, lng: geocoded.lng } : { lat: -26.2041, lng: 28.0473 };
  }

  let dest = destinationCoords;
  if (!dest) {
    const geocoded = await geocodeLocation(destinationName);
    dest = geocoded ? { lat: geocoded.lat, lng: geocoded.lng } : { lat: -25.7479, lng: 28.2293 };
  }

  // 2. Fetch driving route
  const route = await fetchDrivingRoute(
    { lat: dep.lat, lng: dep.lng, name: departureName },
    { lat: dest.lat, lng: dest.lng, name: destinationName }
  );

  // 3. Formulate highway route description based on coordinates and names
  let suggestedCorridor = '';
  const depLower = departureName.toLowerCase();
  const destLower = destinationName.toLowerCase();

  if (destLower.includes('tzaneen')) {
    suggestedCorridor = 'N1 North towards Polokwane, then R71 via Magoebaskloof / Haenertsburg';
  } else if (destLower.includes('wonderpark') || destLower.includes('akasia')) {
    if (depLower.includes('pretoria east') || depLower.includes('menlyn')) {
      suggestedCorridor = 'N4 Platinum Highway West / R80 Mabopane Freeway to Wonderpark';
    } else {
      suggestedCorridor = 'N1 / N4 Platinum Highway towards Brits / Akasia / Wonderpark';
    }
  } else if (destLower.includes('durban') || depLower.includes('durban')) {
    suggestedCorridor = 'N3 Freeway via Heidelberg, Harrismith, Van Reenen Pass, Pietermaritzburg';
  } else if (destLower.includes('cape town') || depLower.includes('cape town')) {
    suggestedCorridor = 'N1 National Highway via Bloemfontein, Beaufort West, Worcester';
  } else if (destLower.includes('polokwane')) {
    suggestedCorridor = 'N1 North via Hammanskraal, Bela-Bela, Mokopane';
  } else if (destLower.includes('mbombela') || destLower.includes('nelspruit')) {
    suggestedCorridor = 'N4 East via Witbank, Middelburg, Machadodorp';
  } else if (destLower.includes('rustenburg')) {
    suggestedCorridor = 'N4 West / R512 via Brits & Magaliesburg';
  } else if (route.steps && route.steps.length > 2) {
    const roadNames = Array.from(new Set(route.steps.map(s => s.name).filter(Boolean)));
    if (roadNames.length > 0) {
      suggestedCorridor = roadNames.slice(0, 3).join(' ➔ ');
    }
  }

  if (!suggestedCorridor) {
    suggestedCorridor = `Direct Highway Corridor (~${route.distanceKm} km)`;
  }

  return {
    distanceKm: Math.round(route.distanceKm),
    durationMins: Math.round(route.durationMin),
    routeVia: suggestedCorridor,
    depCoords: dep,
    destCoords: dest,
    geometry: route.geometry
  };
}

/**
 * Detect all hazards and reports located along or near the route corridor (default buffer = 0.8 km)
 */
export function detectHazardsOnRoute(
  route: CalculatedRoute,
  reports: IncidentReport[],
  corridorBufferKm = 0.85
): OnRouteHazard[] {
  if (!route.geometry || route.geometry.length < 2) return [];

  // Compute cumulative distance array along the route
  const cumulativeDistances: number[] = [0];
  for (let i = 1; i < route.geometry.length; i++) {
    const prev = route.geometry[i - 1];
    const curr = route.geometry[i];
    const segDist = getDistanceKm(prev[0], prev[1], curr[0], curr[1]);
    cumulativeDistances.push(cumulativeDistances[i - 1] + segDist);
  }

  const activeReports = reports.filter(r => r.status === 'approved' || r.status === 'resolved');
  const onRouteHazards: OnRouteHazard[] = [];

  for (const report of activeReports) {
    if (typeof report.latitude !== 'number' || typeof report.longitude !== 'number') continue;

    let minDistanceToRoute = Infinity;
    let closestKmOnRoute = 0;

    for (let i = 0; i < route.geometry.length - 1; i++) {
      const a = route.geometry[i];
      const b = route.geometry[i + 1];
      const res = pointToSegmentDistanceKm(report.latitude, report.longitude, a[0], a[1], b[0], b[1]);

      if (res.distanceKm < minDistanceToRoute) {
        minDistanceToRoute = res.distanceKm;
        const segStartDist = cumulativeDistances[i];
        const segLen = cumulativeDistances[i + 1] - cumulativeDistances[i];
        closestKmOnRoute = segStartDist + res.projectionFraction * segLen;
      }
    }

    if (minDistanceToRoute <= corridorBufferKm) {
      let warningPrefix = '⚠️';
      if (report.type === 'fatal_crash') warningPrefix = '💀 FATAL CRASH / ROAD CLOSED:';
      else if (report.type === 'spiking') warningPrefix = '🚨 SPIKE TRAP HAZARD:';
      else if (report.type === 'crash') warningPrefix = '💥 CRASH:';
      else if (report.type === 'stationary') warningPrefix = '🛑 STATIONARY VEHICLE:';
      else if (report.type === 'veld_fire') warningPrefix = '🔥 VELD FIRE / SMOKE:';
      else if (report.type === 'pothole') warningPrefix = '🕳️ SEVERE POTHOLE:';
      else if (report.type === 'congestion') warningPrefix = '🚗 HEAVY TRAFFIC SLOWDOWN:';

      const warningText = `${warningPrefix} ${report.title} located at KM ${closestKmOnRoute.toFixed(1)} of your ${route.distanceKm.toFixed(1)} km route (${report.roadName || report.locationName}).`;

      onRouteHazards.push({
        report,
        distanceFromStartKm: parseFloat(closestKmOnRoute.toFixed(1)),
        distanceToRouteKm: parseFloat(minDistanceToRoute.toFixed(2)),
        warningText
      });
    }
  }

  // Sort hazards by chronological order along the route
  onRouteHazards.sort((a, b) => a.distanceFromStartKm - b.distanceFromStartKm);

  return onRouteHazards;
}
