// Coordinate and Map Pin Parsing Utilities for LiveTrafficNPC Admin & Dispatch

export interface ParsedLocationResult {
  success: boolean;
  latitude?: number;
  longitude?: number;
  extractedText?: string;
  sourceType: 'coords_pair' | 'dms' | 'google_maps_url' | 'waze_url' | 'apple_maps_url' | 'whatsapp_text' | 'unknown';
  error?: string;
}

/**
 * Parses Degrees, Minutes, Seconds (DMS) string into Decimal Degrees
 * e.g., 26°07'25.4"S 28°14'32.1"E or 26 07 25.4 S, 28 14 32.1 E
 */
export function parseDMS(dmsStr: string): { latitude: number; longitude: number } | null {
  try {
    const clean = dmsStr.trim();
    // Match patterns like: 26°07'25.4"S, 28°14'32.1"E or 26 07 25 S
    const dmsRegex = /([0-9]{1,2})[°\s]+([0-9]{1,2})['\s]+([0-9]{1,2}(?:\.[0-9]+)?)["]?\s*([NSEWnsew])/g;
    const matches = [...clean.matchAll(dmsRegex)];

    if (matches.length >= 2) {
      let lat: number | null = null;
      let lng: number | null = null;

      for (const match of matches) {
        const deg = parseFloat(match[1]);
        const min = parseFloat(match[2]);
        const sec = parseFloat(match[3]);
        const dir = match[4].toUpperCase();

        let dd = deg + min / 60 + sec / 3600;
        if (dir === 'S' || dir === 'W') {
          dd = -dd;
        }

        if (dir === 'N' || dir === 'S') {
          lat = dd;
        } else if (dir === 'E' || dir === 'W') {
          lng = dd;
        }
      }

      if (lat !== null && lng !== null && isValidCoordinate(lat, lng)) {
        return { latitude: lat, longitude: lng };
      }
    }
  } catch (err) {
    console.warn('DMS parse failed:', err);
  }
  return null;
}

/**
 * Validates whether latitude and longitude are within realistic Earth / South Africa ranges
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return false;
  }
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Checks if coordinates are roughly in or around South Africa / Southern Africa
 * (Latitude ~ -35 to -20, Longitude ~ 15 to 35)
 */
export function isSouthAfricaCoordinate(lat: number, lng: number): boolean {
  return lat >= -36 && lat <= -20 && lng >= 14 && lng <= 36;
}

/**
 * Comprehensive parser for any coordinate format, Google Maps URL, Waze link, WhatsApp text, or raw pin input
 */
export function parseLocationInput(rawInput: string): ParsedLocationResult {
  if (!rawInput || !rawInput.trim()) {
    return { success: false, sourceType: 'unknown', error: 'Input is empty' };
  }

  const input = rawInput.trim();

  // 1. Google Maps / Short URL format: maps.google.com, goo.gl/maps, maps.app.goo.gl
  if (input.includes('maps.google.') || input.includes('google.com/maps') || input.includes('goo.gl/maps') || input.includes('maps.app.goo.gl')) {
    // Pattern A: ?q=-26.12345,28.12345 or &q=-26.12345,28.12345 or query=-26.12345,28.12345
    const qMatch = input.match(/[?&](?:q|query|ll|center)=(-?[0-9]{1,2}\.[0-9]+)[,\s]+(-?[0-9]{1,3}\.[0-9]+)/i);
    if (qMatch) {
      const lat = parseFloat(qMatch[1]);
      const lng = parseFloat(qMatch[2]);
      if (isValidCoordinate(lat, lng)) {
        return { success: true, latitude: lat, longitude: lng, sourceType: 'google_maps_url' };
      }
    }

    // Pattern B: /@-26.12345,28.12345,17z
    const atMatch = input.match(/@(-?[0-9]{1,2}\.[0-9]+)[,\s]+(-?[0-9]{1,3}\.[0-9]+)/);
    if (atMatch) {
      const lat = parseFloat(atMatch[1]);
      const lng = parseFloat(atMatch[2]);
      if (isValidCoordinate(lat, lng)) {
        return { success: true, latitude: lat, longitude: lng, sourceType: 'google_maps_url' };
      }
    }

    // Pattern C: /place/.../data=...!3d-26.12345!4d28.12345
    const dataMatch = input.match(/!3d(-?[0-9]{1,2}\.[0-9]+)!4d(-?[0-9]{1,3}\.[0-9]+)/);
    if (dataMatch) {
      const lat = parseFloat(dataMatch[1]);
      const lng = parseFloat(dataMatch[2]);
      if (isValidCoordinate(lat, lng)) {
        return { success: true, latitude: lat, longitude: lng, sourceType: 'google_maps_url' };
      }
    }

    // Pattern D: /dir//-26.12345,28.12345
    const dirMatch = input.match(/\/dir\/[^\/]*\/(-?[0-9]{1,2}\.[0-9]+)[,\s]+(-?[0-9]{1,3}\.[0-9]+)/);
    if (dirMatch) {
      const lat = parseFloat(dirMatch[1]);
      const lng = parseFloat(dirMatch[2]);
      if (isValidCoordinate(lat, lng)) {
        return { success: true, latitude: lat, longitude: lng, sourceType: 'google_maps_url' };
      }
    }
  }

  // 2. Waze URL format: waze.com/ul?ll=-26.12345,28.12345
  if (input.includes('waze.com')) {
    const wazeMatch = input.match(/ll=(-?[0-9]{1,2}\.[0-9]+)[,\s%2C]+(-?[0-9]{1,3}\.[0-9]+)/i);
    if (wazeMatch) {
      const lat = parseFloat(wazeMatch[1]);
      const lng = parseFloat(wazeMatch[2]);
      if (isValidCoordinate(lat, lng)) {
        return { success: true, latitude: lat, longitude: lng, sourceType: 'waze_url' };
      }
    }
  }

  // 3. Apple Maps format: maps.apple.com/?ll=-26.12345,28.12345 or ?q=-26.12345,28.12345
  if (input.includes('maps.apple.com')) {
    const appleMatch = input.match(/[?&](?:ll|q|sll)=(-?[0-9]{1,2}\.[0-9]+)[,\s%2C]+(-?[0-9]{1,3}\.[0-9]+)/i);
    if (appleMatch) {
      const lat = parseFloat(appleMatch[1]);
      const lng = parseFloat(appleMatch[2]);
      if (isValidCoordinate(lat, lng)) {
        return { success: true, latitude: lat, longitude: lng, sourceType: 'apple_maps_url' };
      }
    }
  }

  // 4. DMS Degrees Minutes Seconds pattern: 26°07'25.4"S 28°14'32.1"E
  if (input.includes('°') || input.includes('"') || /[0-9]+\s+[0-9]+\s+[0-9]+(\.[0-9]+)?\s*[NSEWnsew]/.test(input)) {
    const dmsResult = parseDMS(input);
    if (dmsResult) {
      return {
        success: true,
        latitude: dmsResult.latitude,
        longitude: dmsResult.longitude,
        sourceType: 'dms'
      };
    }
  }

  // 5. Standard decimal coordinate pairs:
  // Examples:
  // -26.12345, 28.12345
  // -26.12345 28.12345
  // 26.12345 S, 28.12345 E
  // Lat: -26.12345, Lng: 28.12345
  // WhatsApp: "Accident reported at -25.9912, 28.1154 please dispatch"
  
  // Look for coordinate pairs with S/N and E/W direction letters
  const dirPairMatch = input.match(/([0-9]{1,2}(?:\.[0-9]+)?)\s*([SsNn])[\s,;]+([0-9]{1,3}(?:\.[0-9]+)?)\s*([EeWw])/);
  if (dirPairMatch) {
    let lat = parseFloat(dirPairMatch[1]);
    if (dirPairMatch[2].toUpperCase() === 'S') lat = -lat;
    let lng = parseFloat(dirPairMatch[3]);
    if (dirPairMatch[4].toUpperCase() === 'W') lng = -lng;
    if (isValidCoordinate(lat, lng)) {
      return { success: true, latitude: lat, longitude: lng, sourceType: 'coords_pair' };
    }
  }

  // Look for standard decimal pairs (with optional commas, semicolons, or spaces)
  const decimalMatches = [...input.matchAll(/(-?[0-9]{1,2}\.[0-9]{3,12})[\s,;]+(-?[0-9]{1,3}\.[0-9]{3,12})/g)];
  if (decimalMatches.length > 0) {
    // Pick the first valid coordinate match
    for (const match of decimalMatches) {
      let lat = parseFloat(match[1]);
      let lng = parseFloat(match[2]);

      // South African auto-correction: if someone pasted positive 26.xxx instead of -26.xxx for South Africa
      if (lat > 20 && lat < 36 && lng > 14 && lng < 36) {
        // In South Africa, latitude is negative (South). If reporter omitted the minus sign, fix it.
        lat = -lat;
      }

      if (isValidCoordinate(lat, lng)) {
        return {
          success: true,
          latitude: lat,
          longitude: lng,
          sourceType: input.length > 35 ? 'whatsapp_text' : 'coords_pair'
        };
      }
    }
  }

  // 6. Generic decimal numbers regex fallback: e.g. "-26.12, 28.12" (fewer decimals)
  const shortDecimalMatch = input.match(/(-?[0-9]{1,2}(?:\.[0-9]+)?)[\s,;]+(-?[0-9]{1,3}(?:\.[0-9]+)?)/);
  if (shortDecimalMatch) {
    let lat = parseFloat(shortDecimalMatch[1]);
    let lng = parseFloat(shortDecimalMatch[2]);
    if (lat > 20 && lat < 36 && lng > 14 && lng < 36) {
      lat = -lat;
    }
    if (isValidCoordinate(lat, lng) && (lat !== 0 || lng !== 0)) {
      return {
        success: true,
        latitude: lat,
        longitude: lng,
        sourceType: 'coords_pair'
      };
    }
  }

  return {
    success: false,
    sourceType: 'unknown',
    error: 'Could not extract valid GPS coordinates from the provided text or link.'
  };
}

/**
 * Expands short Google Maps links (e.g. maps.app.goo.gl) via the backend server parser
 */
export async function parseRemoteMapLink(url: string): Promise<ParsedLocationResult> {
  const cleanUrl = url.trim();
  // First attempt local regex parse
  const localResult = parseLocationInput(cleanUrl);
  if (localResult.success) {
    return localResult;
  }

  try {
    const res = await fetch(`/api/navigation/parse-location-input?input=${encodeURIComponent(cleanUrl)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        return {
          success: true,
          latitude: data.latitude,
          longitude: data.longitude,
          extractedText: data.locationName || data.road || '',
          sourceType: 'google_maps_url'
        };
      }
    }
  } catch (e) {
    console.warn('Remote map link parse error:', e);
  }

  return {
    success: false,
    sourceType: 'unknown',
    error: 'Could not resolve coordinates from this map link.'
  };
}
