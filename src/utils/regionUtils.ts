export type SARegionId = 
  | 'all'
  | 'Gauteng'
  | 'KwaZulu-Natal'
  | 'Western Cape'
  | 'Eastern Cape'
  | 'Free State'
  | 'Mpumalanga'
  | 'Limpopo'
  | 'North West'
  | 'Northern Cape';

export interface RegionInfo {
  id: SARegionId;
  shortCode: string;
  name: string;
  popularCities: string[];
  majorCorridors: Array<{ id: string; label: string }>;
  center: { lat: number; lng: number; zoom: number };
  bounds?: { minLat: number; maxLat: number; minLng: number; maxLng: number };
}

export const SA_REGIONS: Record<SARegionId, RegionInfo> = {
  all: {
    id: 'all',
    shortCode: 'ALL',
    name: 'All Regions (National)',
    popularCities: ['National Highway Network'],
    majorCorridors: [
      { id: 'all', label: 'All Corridors' },
      { id: 'N1', label: 'N1' },
      { id: 'N2', label: 'N2' },
      { id: 'N3', label: 'N3' },
      { id: 'N4', label: 'N4' },
      { id: 'N7', label: 'N7 (Cape Town - Malmesbury - Namibia)' },
      { id: 'N12', label: 'N12' },
      { id: 'N14', label: 'N14' },
      { id: 'N17', label: 'N17' },
      { id: 'R21', label: 'R21' },
      { id: 'R24', label: 'R24' },
      { id: 'R59', label: 'R59' },
      { id: 'M1', label: 'M1' },
      { id: 'M4', label: 'M4' },
      { id: 'M7', label: 'M7' },
    ],
    center: { lat: -28.4793, lng: 24.6727, zoom: 6 }
  },
  'Gauteng': {
    id: 'Gauteng',
    shortCode: 'GP',
    name: 'Gauteng',
    popularCities: ['Johannesburg', 'Pretoria', 'Centurion', 'Midrand', 'Sandton', 'Ekurhuleni', 'Roodepoort', 'Kempton Park'],
    majorCorridors: [
      { id: 'all', label: 'All GP Corridors' },
      { id: 'N1', label: 'N1 (Ben Schoeman / Danie Joubert)' },
      { id: 'N3', label: 'N3 (Eastern Bypass)' },
      { id: 'N4', label: 'N4 (Magalies Toll / Platinum)' },
      { id: 'N12', label: 'N12 (Southern / East Rand Bypass)' },
      { id: 'N14', label: 'N14 (Krugersdorp - Pretoria)' },
      { id: 'N17', label: 'N17 (Johannesburg - Springs)' },
      { id: 'R21', label: 'R21 (Airport Highway)' },
      { id: 'R24', label: 'R24 (Albertina Sisulu)' },
      { id: 'R59', label: 'R59 (Sybrand van Niekerk)' },
      { id: 'M1', label: 'M1 (De Villiers Graaff)' },
      { id: 'M2', label: 'M2 (Francois Oberholzer)' },
    ],
    center: { lat: -26.0500, lng: 28.1200, zoom: 11 },
    bounds: { minLat: -27.0, maxLat: -25.1, minLng: 27.1, maxLng: 29.1 }
  },
  'KwaZulu-Natal': {
    id: 'KwaZulu-Natal',
    shortCode: 'KZN',
    name: 'KwaZulu-Natal',
    popularCities: ['Durban', 'Pietermaritzburg', 'Umhlanga', 'Ballito', 'Pinetown', 'Amanzimtoti', 'Richards Bay', 'Howick'],
    majorCorridors: [
      { id: 'all', label: 'All KZN Corridors' },
      { id: 'N3', label: 'N3 (Durban - PMB - Van Reenen)' },
      { id: 'N2', label: 'N2 (North & South Coast)' },
      { id: 'M4', label: 'M4 (Ruth First / Southern Freeway)' },
      { id: 'M7', label: 'M7 (Solomon Mahlangu / Bayhead)' },
      { id: 'M13', label: 'M13 (Fields Hill / Kloof)' },
      { id: 'M19', label: 'M19 (Umgeni Road / Pinetown)' },
      { id: 'N11', label: 'N11 (Ladysmith - Newcastle)' }
    ],
    center: { lat: -29.8587, lng: 30.8000, zoom: 10 },
    bounds: { minLat: -31.2, maxLat: -26.8, minLng: 28.8, maxLng: 33.0 }
  },
  'Western Cape': {
    id: 'Western Cape',
    shortCode: 'WC',
    name: 'Western Cape',
    popularCities: ['Cape Town', 'Stellenbosch', 'Somerset West', 'Paarl', 'George', 'Hermanus', 'Worcester'],
    majorCorridors: [
      { id: 'all', label: 'All WC Corridors' },
      { id: 'N1', label: 'N1 (Table Bay - Paarl - Du Toitskloof)' },
      { id: 'N2', label: 'N2 (Settlers Way - Sir Lowry\'s Pass)' },
      { id: 'N7', label: 'N7 (Cape Town - Malmesbury)' },
      { id: 'M3', label: 'M3 (Philip Kgosana / Blue Route)' },
      { id: 'M5', label: 'M5 (Black River Parkway)' },
      { id: 'R300', label: 'R300 (Kuils River Freeway)' },
    ],
    center: { lat: -33.9249, lng: 18.5241, zoom: 11 },
    bounds: { minLat: -35.0, maxLat: -30.4, minLng: 17.7, maxLng: 24.3 }
  },
  'Eastern Cape': {
    id: 'Eastern Cape',
    shortCode: 'EC',
    name: 'Eastern Cape',
    popularCities: ['Gqeberha', 'Port Elizabeth', 'East London', 'Mthatha', 'Makhanda', 'Jeffreys Bay'],
    majorCorridors: [
      { id: 'all', label: 'All EC Corridors' },
      { id: 'N2', label: 'N2 (Garden Route - Gqeberha - East London)' },
      { id: 'N10', label: 'N10 (Port Elizabeth - Cradock)' },
      { id: 'N6', label: 'N6 (East London - Queenstown)' },
      { id: 'R72', label: 'R72 (Coastal Route)' }
    ],
    center: { lat: -33.9608, lng: 25.6022, zoom: 10 },
    bounds: { minLat: -34.3, maxLat: -30.0, minLng: 22.6, maxLng: 30.2 }
  },
  'Free State': {
    id: 'Free State',
    shortCode: 'FS',
    name: 'Free State',
    popularCities: ['Bloemfontein', 'Welkom', 'Sasolburg', 'Harrismith', 'Kroonstad', 'Bethlehem'],
    majorCorridors: [
      { id: 'all', label: 'All FS Corridors' },
      { id: 'N1', label: 'N1 (Colesberg - Bloemfontein - Kroonstad)' },
      { id: 'N3', label: 'N3 (Harrismith Corridor)' },
      { id: 'N5', label: 'N5 (Harrismith - Winburg)' },
      { id: 'N8', label: 'N8 (Kimberley - Bloemfontein - Maseru)' }
    ],
    center: { lat: -29.0852, lng: 26.1596, zoom: 9 },
    bounds: { minLat: -30.8, maxLat: -26.6, minLng: 24.2, maxLng: 29.9 }
  },
  'Mpumalanga': {
    id: 'Mpumalanga',
    shortCode: 'MP',
    name: 'Mpumalanga',
    popularCities: ['Mbombela', 'Nelspruit', 'Witbank', 'eMalahleni', 'Middelburg', 'Secunda'],
    majorCorridors: [
      { id: 'all', label: 'All MP Corridors' },
      { id: 'N4', label: 'N4 (Maputo Corridor - Witbank - Nelspruit)' },
      { id: 'N12', label: 'N12 (Delmas - Witbank)' },
      { id: 'N17', label: 'N17 (Leandra - Ermelo - Oshoek)' },
      { id: 'N11', label: 'N11 (Middelburg - Ermelo)' }
    ],
    center: { lat: -25.5653, lng: 30.5279, zoom: 9 },
    bounds: { minLat: -27.6, maxLat: -23.9, minLng: 28.4, maxLng: 32.1 }
  },
  'Limpopo': {
    id: 'Limpopo',
    shortCode: 'LP',
    name: 'Limpopo',
    popularCities: ['Polokwane', 'Bela-Bela', 'Mokopane', 'Tzaneen', 'Musina', 'Thohoyandou'],
    majorCorridors: [
      { id: 'all', label: 'All LP Corridors' },
      { id: 'N1', label: 'N1 (Warmbaths - Polokwane - Beitbridge)' },
      { id: 'N11', label: 'N11 (Mokopane - Groblersdal)' },
      { id: 'R71', label: 'R71 (Polokwane - Tzaneen)' },
      { id: 'R101', label: 'R101 (Old Warmbaths Road)' }
    ],
    center: { lat: -23.9045, lng: 29.4688, zoom: 9 },
    bounds: { minLat: -25.1, maxLat: -22.1, minLng: 26.3, maxLng: 31.9 }
  },
  'North West': {
    id: 'North West',
    shortCode: 'NW',
    name: 'North West',
    popularCities: ['Rustenburg', 'Potchefstroom', 'Klerksdorp', 'Mahikeng', 'Brits'],
    majorCorridors: [
      { id: 'all', label: 'All NW Corridors' },
      { id: 'N4', label: 'N4 (Platinum Highway - Rustenburg)' },
      { id: 'N12', label: 'N12 (Potchefstroom - Klerksdorp)' },
      { id: 'N14', label: 'N14 (Ventersdorp - Vryburg)' },
      { id: 'R24', label: 'R24 (Magaliesburg - Rustenburg)' }
    ],
    center: { lat: -25.6544, lng: 27.2434, zoom: 9 },
    bounds: { minLat: -28.2, maxLat: -24.5, minLng: 22.5, maxLng: 28.4 }
  },
  'Northern Cape': {
    id: 'Northern Cape',
    shortCode: 'NC',
    name: 'Northern Cape',
    popularCities: ['Kimberley', 'Upington', 'Springbok', 'De Aar', 'Kuruman'],
    majorCorridors: [
      { id: 'all', label: 'All NC Corridors' },
      { id: 'N1', label: 'N1 (Colesberg - Richmond)' },
      { id: 'N7', label: 'N7 (Garies - Springbok - Namibia)' },
      { id: 'N8', label: 'N8 (Kimberley - Groblershoop)' },
      { id: 'N14', label: 'N14 (Kuruman - Upington - Springbok)' }
    ],
    center: { lat: -28.7282, lng: 24.7499, zoom: 8 },
    bounds: { minLat: -33.0, maxLat: -25.4, minLng: 16.4, maxLng: 25.6 }
  }
};

export const SA_PROVINCES_LIST: SARegionId[] = [
  'Gauteng',
  'KwaZulu-Natal',
  'Western Cape',
  'Eastern Cape',
  'Free State',
  'Mpumalanga',
  'Limpopo',
  'North West',
  'Northern Cape'
];

/**
 * Detects the South African region from latitude and longitude coordinates.
 */
export function detectRegionFromCoords(lat: number, lng: number): SARegionId {
  // Gauteng (tightest bounding box check)
  if (lat >= -26.95 && lat <= -25.10 && lng >= 27.15 && lng <= 29.10) {
    return 'Gauteng';
  }

  // KwaZulu-Natal
  if (lat >= -31.20 && lat <= -26.80 && lng >= 28.80 && lng <= 33.10) {
    return 'KwaZulu-Natal';
  }

  // Western Cape
  if (lat >= -35.00 && lat <= -30.40 && lng >= 17.70 && lng <= 24.30) {
    return 'Western Cape';
  }

  // Eastern Cape
  if (lat >= -34.30 && lat <= -30.00 && lng >= 22.60 && lng <= 30.20) {
    return 'Eastern Cape';
  }

  // Free State
  if (lat >= -30.80 && lat <= -26.60 && lng >= 24.20 && lng <= 29.90) {
    return 'Free State';
  }

  // Mpumalanga
  if (lat >= -27.60 && lat <= -23.90 && lng >= 28.40 && lng <= 32.10) {
    return 'Mpumalanga';
  }

  // Limpopo
  if (lat >= -25.10 && lat <= -22.00 && lng >= 26.30 && lng <= 31.90) {
    return 'Limpopo';
  }

  // North West
  if (lat >= -28.20 && lat <= -24.50 && lng >= 22.50 && lng <= 28.40) {
    return 'North West';
  }

  // Northern Cape
  if (lat >= -33.00 && lat <= -25.40 && lng >= 16.40 && lng <= 25.60) {
    return 'Northern Cape';
  }

  // Fallback to closest region center
  let closestRegion: SARegionId = 'Gauteng';
  let minDistance = Infinity;

  for (const regionId of SA_PROVINCES_LIST) {
    const rInfo = SA_REGIONS[regionId];
    const dist = Math.hypot(lat - rInfo.center.lat, lng - rInfo.center.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestRegion = regionId;
    }
  }

  return closestRegion;
}

/**
 * Resolves the region of any incident, feed item, or report.
 */
export function resolveItemRegion(item: {
  region?: string;
  roadwayName?: string;
  location?: string;
  locationName?: string;
  roadName?: string;
  title?: string;
  content?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
}): SARegionId {
  // 1. Explicit Region field
  if (item.region) {
    const regLower = item.region.toLowerCase().trim();
    if (regLower.includes('gauteng') || regLower === 'gp') return 'Gauteng';
    if (regLower.includes('natal') || regLower.includes('kzn')) return 'KwaZulu-Natal';
    if (regLower.includes('western') || regLower === 'wc') return 'Western Cape';
    if (regLower.includes('eastern') || regLower === 'ec') return 'Eastern Cape';
    if (regLower.includes('free state') || regLower === 'fs') return 'Free State';
    if (regLower.includes('mpumalanga') || regLower === 'mp') return 'Mpumalanga';
    if (regLower.includes('limpopo') || regLower === 'lp') return 'Limpopo';
    if (regLower.includes('north west') || regLower === 'nw') return 'North West';
    if (regLower.includes('northern cape') || regLower === 'nc') return 'Northern Cape';
  }

  // 2. Exact Coordinates Check
  if (item.latitude && item.longitude && !isNaN(item.latitude) && !isNaN(item.longitude)) {
    return detectRegionFromCoords(item.latitude, item.longitude);
  }

  // 3. Textual keywords in Roadway, Location, Title, and Description
  const text = [
    item.roadwayName || '',
    item.location || '',
    item.locationName || '',
    item.roadName || '',
    item.title || '',
    item.content || '',
    item.description || ''
  ].join(' ').toLowerCase();

  // KZN Check
  if (
    text.includes('durban') ||
    text.includes('pietermaritzburg') ||
    text.includes('pmb') ||
    text.includes('ethekwini') ||
    text.includes('umhlanga') ||
    text.includes('ballito') ||
    text.includes('pinetown') ||
    text.includes('amanzimtoti') ||
    text.includes('westville') ||
    text.includes('marianhill') ||
    text.includes('mariannhill') ||
    text.includes('townhill') ||
    text.includes('howick') ||
    text.includes('cedara') ||
    text.includes('mooi river') ||
    text.includes('richards bay') ||
    text.includes('empangeni') ||
    text.includes('estcourt') ||
    text.includes('ladysmith') ||
    text.includes('camperdown') ||
    text.includes('cato ridge') ||
    text.includes('umgeni') ||
    text.includes('umlaas') ||
    text.includes('hammarsdale') ||
    text.includes('shongweni') ||
    text.includes('key ridge') ||
    text.includes('alverstone') ||
    text.includes('gillitts') ||
    text.includes('hillcrest') ||
    text.includes('kloof') ||
    text.includes('ksia') ||
    text.includes('king shaka') ||
    text.includes('m13') ||
    text.includes('m19') ||
    text.includes('eb cloete') ||
    text.includes('spaghetti junction') ||
    text.includes('kzn') ||
    text.includes('kwazulu')
  ) {
    return 'KwaZulu-Natal';
  }

  // Western Cape Check
  if (
    text.includes('cape town') ||
    text.includes('capetown') ||
    text.includes('stellenbosch') ||
    text.includes('somerset west') ||
    text.includes('somerset mall') ||
    text.includes('de beers') ||
    text.includes('paarl') ||
    text.includes('bellville') ||
    text.includes('table bay') ||
    text.includes('foreshore') ||
    text.includes('christiaan barnard') ||
    text.includes('mike pienaar') ||
    text.includes('karl bremer') ||
    text.includes('century city') ||
    text.includes('durbanville') ||
    text.includes('brackenfell') ||
    text.includes('kraaifontein') ||
    text.includes('khayelitsha') ||
    text.includes('spine rd') ||
    text.includes('spine road') ||
    text.includes('van riebeeck') ||
    text.includes('swartklip') ||
    text.includes('hospital bend') ||
    text.includes('settlers way') ||
    text.includes('borcherds quarry') ||
    text.includes('george') ||
    text.includes('kaaimans') ||
    text.includes('knysna') ||
    text.includes('plettenberg') ||
    text.includes('garden route') ||
    text.includes('worcester') ||
    text.includes('huguenot') ||
    text.includes('du toitskloof') ||
    text.includes('dutoitskloof') ||
    text.includes('macassar') ||
    text.includes('broadway') ||
    text.includes('strand') ||
    text.includes('gordons bay') ||
    text.includes('sir lowry') ||
    text.includes('r300') ||
    text.includes('m3 ') ||
    text.includes('m5 ') ||
    text.includes('m16') ||
    text.includes('m32') ||
    text.includes('m60') ||
    text.includes('n7 ') ||
    text.includes('n7 highway') ||
    text.includes('n7 corridor') ||
    text.includes('malmesbury') ||
    text.includes('moorreesburg') ||
    text.includes('piketberg') ||
    text.includes('citrusdal') ||
    text.includes('clanwilliam') ||
    text.includes('dunoon') ||
    text.includes('morningstar') ||
    text.includes('bosmansdam') ||
    text.includes('wingfield') ||
    text.includes('western cape') ||
    text.includes('westerncape')
  ) {
    return 'Western Cape';
  }

  // Eastern Cape Check
  if (
    text.includes('gqeberha') ||
    text.includes('port elizabeth') ||
    text.includes('east london') ||
    text.includes('mthatha') ||
    text.includes('eastern cape') ||
    text.includes('makhanda') ||
    text.includes('jeffreys bay')
  ) {
    return 'Eastern Cape';
  }

  // Free State Check
  if (
    text.includes('bloemfontein') ||
    text.includes('welkom') ||
    text.includes('sasolburg') ||
    text.includes('harrismith') ||
    text.includes('kroonstad') ||
    text.includes('free state') ||
    text.includes('freestate')
  ) {
    return 'Free State';
  }

  // Mpumalanga Check
  if (
    text.includes('mbombela') ||
    text.includes('nelspruit') ||
    text.includes('witbank') ||
    text.includes('emalahleni') ||
    text.includes('middelburg') ||
    text.includes('secunda') ||
    text.includes('mpumalanga')
  ) {
    return 'Mpumalanga';
  }

  // Limpopo Check
  if (
    text.includes('polokwane') ||
    text.includes('bela-bela') ||
    text.includes('warmbaths') ||
    text.includes('mokopane') ||
    text.includes('tzaneen') ||
    text.includes('musina') ||
    text.includes('limpopo')
  ) {
    return 'Limpopo';
  }

  // North West Check
  if (
    text.includes('rustenburg') ||
    text.includes('potchefstroom') ||
    text.includes('klerksdorp') ||
    text.includes('mahikeng') ||
    text.includes('brits') ||
    text.includes('north west') ||
    text.includes('northwest')
  ) {
    return 'North West';
  }

  // Northern Cape Check
  if (
    text.includes('kimberley') ||
    text.includes('upington') ||
    text.includes('springbok') ||
    text.includes('garies') ||
    text.includes('kamieskroon') ||
    text.includes('namakwaland') ||
    text.includes('namaqualand') ||
    text.includes('kuruman') ||
    text.includes('de aar') ||
    text.includes('northern cape')
  ) {
    return 'Northern Cape';
  }

  // Gauteng Check
  if (
    text.includes('gauteng') ||
    text.includes('johannesburg') ||
    text.includes('joburg') ||
    text.includes('jhb') ||
    text.includes('pretoria') ||
    text.includes('tshwane') ||
    text.includes('centurion') ||
    text.includes('midrand') ||
    text.includes('sandton') ||
    text.includes('ekurhuleni') ||
    text.includes('roodepoort') ||
    text.includes('kempton') ||
    text.includes('soweto') ||
    text.includes('benoni') ||
    text.includes('springs') ||
    text.includes('randburg') ||
    text.includes('alberton') ||
    text.includes('buccleuch') ||
    text.includes('gillooly') ||
    text.includes('pumulani') ||
    text.includes('allandale') ||
    text.includes('brakfontein') ||
    text.includes('samrand') ||
    text.includes('olifantsfontein') ||
    text.includes('new road') ||
    text.includes('rivonia') ||
    text.includes('woodmead') ||
    text.includes('william nicol') ||
    text.includes('winnie mandela') ||
    text.includes('malibongwe') ||
    text.includes('beyers naude') ||
    text.includes('14th ave') ||
    text.includes('maraisburg') ||
    text.includes('golden highway') ||
    text.includes('crown') ||
    text.includes('selby') ||
    text.includes('edenvale') ||
    text.includes('boksburg') ||
    text.includes('germiston') ||
    text.includes('krugersdorp') ||
    text.includes('vereeniging') ||
    text.includes('vanderbijlpark') ||
    text.includes('meyerton') ||
    text.includes('kliprivier') ||
    text.includes('n14') ||
    text.includes('n17') ||
    text.includes('r21') ||
    text.includes('r24') ||
    text.includes('r59') ||
    text.includes('r28') ||
    text.includes('r55') ||
    text.includes('r101') ||
    text.includes('r511') ||
    text.includes('m1 ') ||
    text.includes('m2 ')
  ) {
    return 'Gauteng';
  }

  // If no specific region matches, return 'all' (National)
  return 'all';
}

/**
 * Storage helpers for user selected region
 */
const STORAGE_KEY_SELECTED_REGION = 'live_traffic_selected_region';
const STORAGE_KEY_DETECTED_REGION = 'live_traffic_detected_region';

export function getSavedRegion(): SARegionId | null {
  if (typeof window === 'undefined') return 'all';
  const saved = localStorage.getItem(STORAGE_KEY_SELECTED_REGION);
  if (saved && saved !== 'all' && (saved in SA_REGIONS)) {
    return saved as SARegionId;
  }
  return 'all';
}

export function saveSelectedRegion(regionId: SARegionId): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_SELECTED_REGION, regionId);
}

export function getSavedDetectedRegion(): SARegionId | null {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem(STORAGE_KEY_DETECTED_REGION);
  if (saved && (saved in SA_REGIONS)) {
    return saved as SARegionId;
  }
  return null;
}

export function saveDetectedRegion(regionId: SARegionId): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_DETECTED_REGION, regionId);
}

/**
 * Asynchronously detect user's current region using HTML5 Geolocation.
 */
export async function autoDetectUserRegion(): Promise<{
  regionId: SARegionId;
  coords?: { lat: number; lng: number };
  error?: string;
}> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return { regionId: 'all', error: 'Geolocation not supported by browser' };
  }

  return new Promise((resolve) => {
    let resolved = false;

    const handleSuccess = (position: GeolocationPosition) => {
      if (resolved) return;
      resolved = true;
      const { latitude, longitude } = position.coords;
      const detected = detectRegionFromCoords(latitude, longitude);
      saveDetectedRegion(detected);
      resolve({
        regionId: detected,
        coords: { lat: latitude, lng: longitude }
      });
    };

    // First attempt: High accuracy GPS fix
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      (err) => {
        console.warn('High-accuracy GPS auto-detect fallback:', err.message);
        // Fallback attempt: Cellular / Wifi tower cached fix (very fast & reliable on Android)
        navigator.geolocation.getCurrentPosition(
          handleSuccess,
          (fallbackErr) => {
            if (resolved) return;
            resolved = true;
            console.warn('Fallback geolocation notice:', fallbackErr.message);
            const fallback = getSavedRegion() || 'all';
            resolve({
              regionId: fallback,
              error: fallbackErr.message
            });
          },
          {
            enableHighAccuracy: false,
            timeout: 8000,
            maximumAge: 300000 // 5 minutes cache
          }
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 6000,
        maximumAge: 60000 // 1 minute cache
      }
    );
  });
}
