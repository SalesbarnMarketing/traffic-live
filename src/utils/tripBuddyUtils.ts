import { TripBuddyPlan, TripEmergencyContact, TripBuddyPricingPass } from '../types';

export const LOCAL_STORAGE_ACTIVE_TRIP_KEY = 'live_traffic_active_trip_v1';
export const LOCAL_STORAGE_SAVED_CONTACTS_KEY = 'live_traffic_emergency_contacts_v1';
export const LOCAL_STORAGE_PASS_WALLET_KEY = 'live_traffic_trip_passes_v1';

// South African Major Highway Corridors & City Pairs
export interface CorridorPreset {
  id: string;
  name: string;
  from: string;
  fromCoords: { lat: number; lng: number };
  to: string;
  toCoords: { lat: number; lng: number };
  routeVia: string;
  distanceKm: number;
  estimatedHours: number;
  majorHazardsNote: string;
}

export const SA_CORRIDOR_PRESETS: CorridorPreset[] = [
  {
    id: 'n1-r71-tzaneen',
    name: 'Pretoria / JHB ➔ Tzaneen (N1 North & R71 Magoebaskloof)',
    from: 'Pretoria East, Gauteng',
    fromCoords: { lat: -25.8255, lng: 28.3251 },
    to: 'Tzaneen, Limpopo',
    toCoords: { lat: -23.8319, lng: 30.1611 },
    routeVia: 'N1 North via Polokwane, then R71 via Haenertsburg & Magoebaskloof Pass',
    distanceKm: 380,
    estimatedHours: 4.2,
    majorHazardsNote: 'Magoebaskloof Pass steep gradient / mist / heavy logging trucks, N1 Pumulani toll holiday queues'
  },
  {
    id: 'n4-pta-wonderpark',
    name: 'Pretoria East ➔ Wonderpark / Akasia (N4 West & R80)',
    from: 'Pretoria East (Menlyn / Faerie Glen), Gauteng',
    fromCoords: { lat: -25.8255, lng: 28.3251 },
    to: 'Wonderpark Shopping Centre (Karenpark / Akasia), Gauteng',
    toCoords: { lat: -25.6636, lng: 28.1099 },
    routeVia: 'N4 Platinum Highway West / R80 Mabopane Freeway via Zambesi & Rosslyn links',
    distanceKm: 35,
    estimatedHours: 0.6,
    majorHazardsNote: 'Rosslyn intersection heavy vehicle flow, peak commuter bottlenecks @ Heinrich Ave'
  },
  {
    id: 'n3-jhb-dbn',
    name: 'Johannesburg ➔ Durban (N3 Corridor)',
    from: 'Johannesburg, Gauteng',
    fromCoords: { lat: -26.2041, lng: 28.0473 },
    to: 'Durban, KwaZulu-Natal',
    toCoords: { lat: -29.8587, lng: 31.0218 },
    routeVia: 'N3 via Heidelberg, Villiers, Harrismith, Van Reenen, Pietermaritzburg',
    distanceKm: 570,
    estimatedHours: 6.0,
    majorHazardsNote: 'Van Reenen Pass weather/trucks, Tugela Plaza, Town Hill mist'
  },
  {
    id: 'n1-jhb-cpt',
    name: 'Johannesburg ➔ Cape Town (N1 Trans-Karoo)',
    from: 'Johannesburg, Gauteng',
    fromCoords: { lat: -26.2041, lng: 28.0473 },
    to: 'Cape Town, Western Cape',
    toCoords: { lat: -33.9249, lng: 18.4241 },
    routeVia: 'N1 via Kroonstad, Bloemfontein, Colesberg, Beaufort West, Worcester',
    distanceKm: 1400,
    estimatedHours: 14.5,
    majorHazardsNote: 'Karoo night driver fatigue, livestock crossings, Hex River Pass'
  },
  {
    id: 'n1-pta-plk',
    name: 'Pretoria ➔ Polokwane (N1 North)',
    from: 'Pretoria, Gauteng',
    fromCoords: { lat: -25.7479, lng: 28.2293 },
    to: 'Polokwane, Limpopo',
    toCoords: { lat: -23.9045, lng: 29.4689 },
    routeVia: 'N1 via Hammanskraal, Bela-Bela, Modimolle, Mokopane',
    distanceKm: 260,
    estimatedHours: 2.8,
    majorHazardsNote: 'Pothole & spiking alerts near Hammanskraal, heavy holiday volume'
  },
  {
    id: 'n4-jhb-mbombela',
    name: 'Pretoria / JHB ➔ Mbombela / Nelspruit (N4 East)',
    from: 'Johannesburg, Gauteng',
    fromCoords: { lat: -26.2041, lng: 28.0473 },
    to: 'Mbombela (Nelspruit), Mpumalanga',
    toCoords: { lat: -25.4753, lng: 30.9694 },
    routeVia: 'N4 via Witbank, Middelburg, Machadodorp, Schoemanskloof',
    distanceKm: 340,
    estimatedHours: 3.5,
    majorHazardsNote: 'Coal trucks on Witbank/Middelburg stretch, steep mountain passes'
  },
  {
    id: 'n2-cpt-george',
    name: 'Cape Town ➔ George / Knysna (N2 Garden Route)',
    from: 'Cape Town, Western Cape',
    fromCoords: { lat: -33.9249, lng: 18.4241 },
    to: 'George, Western Cape',
    toCoords: { lat: -33.9631, lng: 22.4617 },
    routeVia: 'N2 via Sir Lowry Pass, Caledon, Swellendam, Mossel Bay',
    distanceKm: 430,
    estimatedHours: 4.8,
    majorHazardsNote: 'Sir Lowry Pass wind, seasonal traffic near Hermanus/Mossel Bay'
  },
  {
    id: 'n12-jhb-kby',
    name: 'Johannesburg ➔ Kimberley (N12 / N14)',
    from: 'Johannesburg, Gauteng',
    fromCoords: { lat: -26.2041, lng: 28.0473 },
    to: 'Kimberley, Northern Cape',
    toCoords: { lat: -28.7282, lng: 24.7499 },
    routeVia: 'N12 via Potchefstroom, Klerksdorp, Wolmaransstad, Christiana',
    distanceKm: 480,
    estimatedHours: 5.2,
    majorHazardsNote: 'Heavy truck traffic on single carriageways, stray animals'
  },
  {
    id: 'n2-dbn-plz',
    name: 'Durban ➔ Port Elizabeth / Gqeberha (N2 South)',
    from: 'Durban, KwaZulu-Natal',
    fromCoords: { lat: -29.8587, lng: 31.0218 },
    to: 'Gqeberha (Port Elizabeth), Eastern Cape',
    toCoords: { lat: -33.9608, lng: 25.6022 },
    routeVia: 'N2 via Port Shepstone, Kokstad, Mthatha, East London',
    distanceKm: 910,
    estimatedHours: 11.0,
    majorHazardsNote: 'Mthatha congestion, winding Kei Cuttings, livestock'
  }
];

// Pricing Passes
export const TRIP_BUDDY_PRICING_PASSES: TripBuddyPricingPass[] = [
  {
    id: 'single',
    title: 'Single Journey Pass',
    priceZAR: 39,
    periodLabel: 'Per Trip',
    tripsIncluded: 1,
    description: 'Perfect for a single long-distance holiday drive or business commute.',
    features: [
      '1 Full Long-Distance Journey',
      'Real-time GPS Speed & Corridor Tracking',
      'Driver Safety Check-in Timer (15-60m)',
      '1-Click WhatsApp Direct Emergency Link',
      'Shareable Family Live Tracking Map URL',
      'Zero monthly commitments'
    ]
  },
  {
    id: 'commuter_pack',
    title: '5-Trip Commuter Pack',
    priceZAR: 149,
    periodLabel: '5 Journeys (Save 25%)',
    badge: 'POPULAR VALUE',
    recommended: true,
    tripsIncluded: 5,
    description: 'Ideal for regular corridor drivers, weekend commuters, and family getaways.',
    features: [
      '5 Complete Monitored Journeys (R29.80 / trip)',
      'No Expiry on Unused Trips',
      'Multi-Contact WhatsApp Broadcasting',
      'Automatic Spiking Radar Warning Integration',
      'Live Route Hazard & Delay Alerts',
      'Priority Support & Emergency Dispatch Pin'
    ]
  },
  {
    id: 'monthly_unlimited',
    title: 'Monthly Unlimited Safe Travel',
    priceZAR: 249,
    periodLabel: 'Per Month',
    badge: 'BEST FOR FLEETS & REPS',
    tripsIncluded: 'unlimited',
    description: 'Unlimited 24/7 journey monitoring for sales reps, courier drivers, and frequent travellers.',
    features: [
      'Unlimited Journeys for 30 Days',
      'Cover up to 2 Registered Vehicles',
      'Instant WhatsApp Distress Dispatch',
      'Family Safety Dashboard Access',
      'Complete Trip Analytics & Mileage Log',
      'Cancel or Renew anytime'
    ]
  }
];

// Calculate Haversine distance in KM
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Clean phone number for WhatsApp international format
export function cleanWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '27' + cleaned.substring(1);
  }
  return cleaned;
}

// Read Device Battery Level
export async function getDeviceBatteryLevel(): Promise<number | undefined> {
  try {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      const battery: any = await (navigator as any).getBattery();
      if (battery && typeof battery.level === 'number') {
        return Math.round(battery.level * 100);
      }
    }
  } catch (e) {
    // Battery API might be restricted
  }
  return undefined;
}

// Generate pre-composed WhatsApp URLs
export function createWhatsAppDirectUrl(phone: string, message: string): string {
  const cleanPhone = cleanWhatsAppNumber(phone);
  const encodedText = encodeURIComponent(message);
  if (!cleanPhone) {
    return `https://wa.me/?text=${encodedText}`;
  }
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

// 1. WhatsApp Message for Trip Start
export function formatTripStartMessage(trip: TripBuddyPlan): string {
  const trackingUrl = `${window.location.origin}/?trackTrip=${trip.trackingToken}`;
  const battery = trip.batteryLevel ? `🔋 Battery: ${trip.batteryLevel}%` : '';
  const vehicle = trip.vehicleDetails?.makeModel ? `🚙 Vehicle: ${trip.vehicleDetails.makeModel} (${trip.vehicleDetails.licensePlate || 'Reg'})` : '';

  return `🚗 *LIVE TRAFFIC TRIP BUDDY: JOURNEY STARTED*
👤 *Driver:* ${trip.driverName}
📍 *Departure:* ${trip.departure}
🏁 *Destination:* ${trip.destination}
🛣️ *Route:* ${trip.routeVia || 'Direct Highway'}
📏 *Distance:* ~${trip.estimatedDistanceKm} km (~${Math.round(trip.estimatedDurationMins / 60 * 10) / 10} hrs)
⏰ *Safety Check-ins:* Every ${trip.checkinIntervalMins} mins
${vehicle}
${battery}

🗺️ *Live Tracking Map:*
${trackingUrl}

_Monitored with Live Traffic NPC Trip Buddy_`;
}

// 2. WhatsApp Message for Check-in (Safe / Fuel / Delay)
export function formatTripCheckinMessage(
  trip: TripBuddyPlan,
  status: 'safe' | 'stopped_fuel' | 'delayed',
  locationName: string,
  lat?: number,
  lng?: number,
  notes?: string
): string {
  const statusEmoji = status === 'safe' ? '🟢' : status === 'stopped_fuel' ? '⛽' : '⏳';
  const statusText = status === 'safe' ? 'ALL GOOD & DRIVING' : status === 'stopped_fuel' ? 'FUEL / REST STOP' : 'TRAFFIC DELAY / SLOW';
  const mapLink = (lat && lng) ? `📍 Google Maps Pin: https://maps.google.com/?q=${lat},${lng}` : '';
  const trackingUrl = `${window.location.origin}/?trackTrip=${trip.trackingToken}`;
  const battery = trip.batteryLevel ? `🔋 Battery: ${trip.batteryLevel}%` : '';

  return `${statusEmoji} *TRIP BUDDY CHECK-IN: ${statusText}*
👤 *Driver:* ${trip.driverName}
📍 *Location:* ${locationName || 'En Route'}
🏁 *Heading To:* ${trip.destination}
${mapLink}
${notes ? `📝 Note: "${notes}"` : ''}
${battery}

🗺️ *Live Tracker:* ${trackingUrl}
_Live Traffic NPC Journey Monitor_`;
}

// 3. WhatsApp Message for Emergency SOS
export function formatTripSOSMessage(
  trip: TripBuddyPlan,
  lat?: number,
  lng?: number,
  locationName?: string,
  emergencyDetails?: string
): string {
  const mapLink = (lat && lng) ? `🚨 EXACT GPS PIN: https://maps.google.com/?q=${lat},${lng} (${lat.toFixed(5)}, ${lng.toFixed(5)})` : '';
  const vehicle = trip.vehicleDetails?.makeModel ? `🚙 Vehicle: ${trip.vehicleDetails.makeModel} (${trip.vehicleDetails.color || ''}) - Reg: ${trip.vehicleDetails.licensePlate || 'N/A'}` : '';
  const trackingUrl = `${window.location.origin}/?trackTrip=${trip.trackingToken}`;

  return `🚨 *URGENT SOS: TRIP BUDDY EMERGENCY ALERT* 🚨
👤 *Driver:* ${trip.driverName} (${trip.driverPhone})
⚠️ *Status: DISTRESS / ASSISTANCE NEEDED*
📍 *Reported Area:* ${locationName || 'En Route'}
${mapLink}
🏁 *Destination:* ${trip.destination}
${vehicle}
${emergencyDetails ? `⚠️ *Details:* ${emergencyDetails}` : '⚠️ Driver triggered manual emergency button on Live Traffic.'}

🗺️ *Live Tracking Route:* ${trackingUrl}

_Please call the driver immediately or contact SAPS / Highway Emergency._`;
}

// 4. WhatsApp Message for Safe Arrival
export function formatTripArrivalMessage(trip: TripBuddyPlan, locationName: string): string {
  return `🏁 *TRIP BUDDY: SAFELY ARRIVED!*
👤 *Driver:* ${trip.driverName}
🎉 *Destination:* ${trip.destination}
📍 *Arrival Area:* ${locationName || trip.destination}
🕒 *Completed:* ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}

_Thank you for monitoring with Live Traffic NPC Trip Buddy!_`;
}
