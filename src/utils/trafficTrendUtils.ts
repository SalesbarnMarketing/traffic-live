// South African Highway Corridor Speed Variation & Traffic Trend Engine (1-Hour Analysis)
import { IncidentReport, EmergencySOS, FeedItem } from '../types';
import { parseDateToMillis } from './dateParser';
import { getDistanceKm } from './routeUtils';

export type SpeedCategory = 'free_flow' | 'moderate' | 'heavy' | 'gridlock';

export interface CorridorSegment {
  id: string;
  name: string;
  highway: string;
  province: 'Gauteng' | 'KwaZulu-Natal' | 'Western Cape' | 'Free State' | 'Mpumalanga' | 'Eastern Cape' | 'Limpopo' | 'North West' | 'Northern Cape';
  path: [number, number][]; // [lat, lng] array
  freeFlowSpeedKmh: number;
  directionLabel?: string;
}

export interface SegmentSpeedTimeline {
  segmentId: string;
  name: string;
  highway: string;
  province: string;
  path: [number, number][];
  freeFlowSpeed: number;
  currentSpeed: number; // T-0 (Live)
  speedsAtTimeline: number[]; // Speeds at [T-60m, T-45m, T-30m, T-15m, T-0m]
  trendPercent: number; // Positive = improving, negative = deteriorating
  activeIncidentTitle?: string;
  activeIncidentCategory?: string;
  congestionLevel: SpeedCategory;
}

export interface TrafficTrendData {
  timeLabels: string[]; // e.g. ["-60m", "-45m", "-30m", "-15m", "LIVE"]
  timeStamps: number[]; // absolute epoch millis for each step
  segments: SegmentSpeedTimeline[];
  averageSpeedKmh: number;
  averageTrendChangeKmh: number; // e.g. -8 km/h
  criticalBottlenecks: {
    segmentId: string;
    name: string;
    highway: string;
    speed: number;
    dropPercent: number;
    lat: number;
    lng: number;
    incidentDesc?: string;
  }[];
  overallStatus: 'Fluid Flow' | 'Moderate Slowdowns' | 'Corridor Delays' | 'Severe Gridlock';
}

// -------------------------------------------------------------
// SOUTH AFRICAN CRITICAL HIGHWAY CORRIDOR GEOMETRIES
// -------------------------------------------------------------
export const MAJOR_SA_CORRIDORS: CorridorSegment[] = [
  // N1 GAUTENG (Pretoria -> Midrand -> Buccleuch -> Johannesburg)
  {
    id: 'n1-pta-fountains-centurion',
    name: 'N1 South (Fountains to Centurion John Vorster)',
    highway: 'N1 South',
    province: 'Gauteng',
    freeFlowSpeedKmh: 120,
    directionLabel: 'Southbound',
    path: [
      [-25.7765, 28.2045],
      [-25.8050, 28.2000],
      [-25.8350, 28.1900],
      [-25.8603, 28.1894]
    ]
  },
  {
    id: 'n1-centurion-brakfontein',
    name: 'N1 South (Centurion to Brakfontein I/C)',
    highway: 'N1 South',
    province: 'Gauteng',
    freeFlowSpeedKmh: 120,
    directionLabel: 'Southbound',
    path: [
      [-25.8603, 28.1894],
      [-25.8850, 28.1750],
      [-25.9030, 28.1620],
      [-25.9250, 28.1480]
    ]
  },
  {
    id: 'n1-samrand-midrand',
    name: 'N1 South (Samrand to New Road / Midrand)',
    highway: 'N1 South',
    province: 'Gauteng',
    freeFlowSpeedKmh: 120,
    directionLabel: 'Southbound',
    path: [
      [-25.9250, 28.1480],
      [-25.9550, 28.1360],
      [-25.9800, 28.1280],
      [-25.9964, 28.1267]
    ]
  },
  {
    id: 'n1-allandale-buccleuch',
    name: 'N1 South (Allandale / Mall of Africa to Buccleuch I/C)',
    highway: 'N1 South',
    province: 'Gauteng',
    freeFlowSpeedKmh: 120,
    directionLabel: 'Southbound',
    path: [
      [-25.9964, 28.1267],
      [-26.0150, 28.1200],
      [-26.0350, 28.1050],
      [-26.0580, 28.0850]
    ]
  },
  {
    id: 'n1-buccleuch-rivonia',
    name: 'N1 West (Buccleuch I/C to Rivonia / William Nicol)',
    highway: 'N1 West',
    province: 'Gauteng',
    freeFlowSpeedKmh: 120,
    directionLabel: 'Westbound',
    path: [
      [-26.0580, 28.0850],
      [-26.0550, 28.0550],
      [-26.0480, 28.0250],
      [-26.0460, 27.9950]
    ]
  },
  {
    id: 'n1-western-bypass-14th',
    name: 'N1 South (Malibongwe to 14th Ave / Maraisburg)',
    highway: 'N1 South',
    province: 'Gauteng',
    freeFlowSpeedKmh: 120,
    directionLabel: 'Southbound',
    path: [
      [-26.0460, 27.9950],
      [-26.0850, 27.9650],
      [-26.1280, 27.9400],
      [-26.1680, 27.9450]
    ]
  },

  // M1 JOHANNESBURG
  {
    id: 'm1-sandton-melrose',
    name: 'M1 South (Woodmead / Sandton to Melrose Arch)',
    highway: 'M1 South',
    province: 'Gauteng',
    freeFlowSpeedKmh: 100,
    directionLabel: 'Southbound',
    path: [
      [-26.0620, 28.0820],
      [-26.0950, 28.0720],
      [-26.1320, 28.0620]
    ]
  },
  {
    id: 'm1-rosebank-jhbcbd',
    name: 'M1 South (Houghton / Empire Rd to JHB CBD & Crown)',
    highway: 'M1 South',
    province: 'Gauteng',
    freeFlowSpeedKmh: 100,
    directionLabel: 'Southbound',
    path: [
      [-26.1320, 28.0620],
      [-26.1750, 28.0400],
      [-26.2041, 28.0350],
      [-26.2250, 28.0200]
    ]
  },

  // N3 GAUTENG -> KZN
  {
    id: 'n3-gilloolys-bedfordview',
    name: 'N3 South (Gillooly’s I/C to Geldenhuys & Spruitview)',
    highway: 'N3 South',
    province: 'Gauteng',
    freeFlowSpeedKmh: 120,
    directionLabel: 'Southbound',
    path: [
      [-26.1720, 28.1360],
      [-26.1950, 28.1320],
      [-26.2350, 28.1550],
      [-26.2850, 28.1850]
    ]
  },
  {
    id: 'n3-heidelberg-corridor',
    name: 'N3 South (Vosloorus to Heidelberg)',
    highway: 'N3 South',
    province: 'Gauteng',
    freeFlowSpeedKmh: 120,
    directionLabel: 'Southbound',
    path: [
      [-26.2850, 28.1850],
      [-26.3550, 28.2500],
      [-26.4350, 28.3200],
      [-26.5050, 28.3600]
    ]
  },

  // R21 AIRPORT HIGHWAY
  {
    id: 'r21-fountains-irene',
    name: 'R21 South (Pretoria Fountains to Irene & Olifantsfontein)',
    highway: 'R21 South',
    province: 'Gauteng',
    freeFlowSpeedKmh: 120,
    directionLabel: 'Southbound',
    path: [
      [-25.7820, 28.2250],
      [-25.8450, 28.2380],
      [-25.9050, 28.2450],
      [-25.9650, 28.2420]
    ]
  },
  {
    id: 'r21-ortambo-boksburg',
    name: 'R21 South (O.R. Tambo Airport to Boksburg / N12)',
    highway: 'R21 South',
    province: 'Gauteng',
    freeFlowSpeedKmh: 120,
    directionLabel: 'Southbound',
    path: [
      [-25.9650, 28.2420],
      [-26.0450, 28.2380],
      [-26.1367, 28.2411],
      [-26.1850, 28.2450]
    ]
  },

  // N12 SOUTHERN CORRIDOR
  {
    id: 'n12-reading-alberton',
    name: 'N12 East (Reading I/C / Soweto to Alberton)',
    highway: 'N12 East',
    province: 'Gauteng',
    freeFlowSpeedKmh: 120,
    directionLabel: 'Eastbound',
    path: [
      [-26.2550, 27.9950],
      [-26.2650, 28.0500],
      [-26.2550, 28.1150],
      [-26.2250, 28.1750]
    ]
  },

  // N4 MPUMALANGA / NORTH WEST
  {
    id: 'n4-pretoria-rosslyn',
    name: 'N4 West (Pretoria West / Brits Toll corridor)',
    highway: 'N4 West',
    province: 'Gauteng',
    freeFlowSpeedKmh: 120,
    directionLabel: 'Westbound',
    path: [
      [-25.6950, 28.1450],
      [-25.6750, 28.0350],
      [-25.6450, 27.9150]
    ]
  },

  // KWAZULU-NATAL (N3 & N2)
  {
    id: 'n3-kzn-pmb-keyridge',
    name: 'N3 South (Pietermaritzburg to Key Ridge M13 West)',
    highway: 'N3 South',
    province: 'KwaZulu-Natal',
    freeFlowSpeedKmh: 110,
    directionLabel: 'Southbound',
    path: [
      [-29.6006, 30.3794],
      [-29.6750, 30.4950],
      [-29.7450, 30.6550],
      [-29.7850, 30.7650]
    ]
  },
  {
    id: 'n3-kzn-marianhill-durban',
    name: 'N3 East (Marianhill Toll to Pinetown & Durban CBD)',
    highway: 'N3 East',
    province: 'KwaZulu-Natal',
    freeFlowSpeedKmh: 110,
    directionLabel: 'Eastbound',
    path: [
      [-29.7850, 30.7650],
      [-29.8188, 30.8542],
      [-29.8350, 30.9350],
      [-29.8587, 31.0218]
    ]
  },
  {
    id: 'n2-kzn-durban-umhlanga',
    name: 'N2 North (Durban Port to Umhlanga & Ballito)',
    highway: 'N2 North',
    province: 'KwaZulu-Natal',
    freeFlowSpeedKmh: 120,
    directionLabel: 'Northbound',
    path: [
      [-29.8587, 31.0218],
      [-29.7850, 31.0450],
      [-29.7289, 31.0844],
      [-29.5392, 31.2144]
    ]
  },

  // WESTERN CAPE (N1, N2, N7, M3)
  {
    id: 'n1-wc-bellville-ctcbd',
    name: 'N1 South (Paarl / Bellville to Cape Town Foreshore)',
    highway: 'N1 West',
    province: 'Western Cape',
    freeFlowSpeedKmh: 120,
    directionLabel: 'Westbound',
    path: [
      [-33.8950, 18.6350],
      [-33.9100, 18.5450],
      [-33.9220, 18.4750],
      [-33.9249, 18.4241]
    ]
  },
  {
    id: 'n2-wc-airport-ctcbd',
    name: 'N2 West (Cape Town Airport / Settlers Way to CBD)',
    highway: 'N2 West',
    province: 'Western Cape',
    freeFlowSpeedKmh: 120,
    directionLabel: 'Westbound',
    path: [
      [-33.9750, 18.6050],
      [-33.9550, 18.5250],
      [-33.9420, 18.4650],
      [-33.9249, 18.4241]
    ]
  },
  {
    id: 'n7-wc-malmesbury-ct',
    name: 'N7 South (Malmesbury / Dunoon to N1 Wingfield Interchange)',
    highway: 'N7 South',
    province: 'Western Cape',
    freeFlowSpeedKmh: 110,
    directionLabel: 'Southbound',
    path: [
      [-33.4600, 18.7200],
      [-33.6500, 18.6000],
      [-33.7800, 18.5500],
      [-33.8850, 18.5150]
    ]
  },
  {
    id: 'n7-wc-ct-malmesbury',
    name: 'N7 North (N1 Wingfield / Dunoon to Malmesbury)',
    highway: 'N7 North',
    province: 'Western Cape',
    freeFlowSpeedKmh: 110,
    directionLabel: 'Northbound',
    path: [
      [-33.8850, 18.5150],
      [-33.7800, 18.5500],
      [-33.6500, 18.6000],
      [-33.4600, 18.7200]
    ]
  }
];

/**
 * Calculates distance from a point to a corridor's polyline
 */
function getDistanceToCorridorKm(lat: number, lng: number, corridor: CorridorSegment): number {
  let minDistance = 9999;
  for (let i = 0; i < corridor.path.length - 1; i++) {
    const p1 = corridor.path[i];
    const p2 = corridor.path[i + 1];
    
    // Check endpoints
    const d1 = getDistanceKm(lat, lng, p1[0], p1[1]);
    const d2 = getDistanceKm(lat, lng, p2[0], p2[1]);
    const midLat = (p1[0] + p2[0]) / 2;
    const midLng = (p1[1] + p2[1]) / 2;
    const dMid = getDistanceKm(lat, lng, midLat, midLng);

    const localMin = Math.min(d1, d2, dMid);
    if (localMin < minDistance) {
      minDistance = localMin;
    }
  }
  return minDistance;
}

/**
 * Categorize speed into visual grade
 */
export function getSpeedCategory(speedKmh: number, freeFlowKmh: number = 120): SpeedCategory {
  const ratio = speedKmh / freeFlowKmh;
  if (ratio >= 0.75 || speedKmh >= 85) return 'free_flow';
  if (ratio >= 0.50 || speedKmh >= 55) return 'moderate';
  if (ratio >= 0.25 || speedKmh >= 25) return 'heavy';
  return 'gridlock';
}

/**
 * Color mapping for speed corridors
 */
export function getSpeedColor(category: SpeedCategory): string {
  switch (category) {
    case 'free_flow':
      return '#10B981'; // Emerald Green
    case 'moderate':
      return '#F59E0B'; // Amber
    case 'heavy':
      return '#EA580C'; // Vivid Orange
    case 'gridlock':
      return '#DC2626'; // Bright Red
  }
}

/**
 * Generates the 1-hour Traffic Trend data and speed timelines across all highway corridors
 */
export function compute1HourTrafficTrend(
  reports: IncidentReport[] = [],
  sosRequests: EmergencySOS[] = [],
  feedItems: FeedItem[] = [],
  activeProvinceFilter?: string
): TrafficTrendData {
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;

  // 5 timeline intervals: -60m, -45m, -30m, -15m, 0m (LIVE)
  const timeOffsetsMinutes = [-60, -45, -30, -15, 0];
  const timeStamps = timeOffsetsMinutes.map(m => now + m * 60 * 1000);
  const timeLabels = ['-60m', '-45m', '-30m', '-15m', 'LIVE'];

  // Normalize all real-time events with coordinate & timestamp info
  const events: {
    lat: number;
    lng: number;
    type: string;
    severity: string;
    title: string;
    timestamp: number;
  }[] = [];

  // Add Incident Reports
  reports.forEach(r => {
    if (typeof r.latitude === 'number' && typeof r.longitude === 'number') {
      const ts = parseDateToMillis(r.updatedAt || r.createdAt);
      events.push({
        lat: r.latitude,
        lng: r.longitude,
        type: r.type,
        severity: r.severity || 'medium',
        title: r.title,
        timestamp: ts > 0 ? ts : now - 20 * 60 * 1000 // default recent if unparsed
      });
    }
  });

  // Add SOS
  sosRequests.forEach(sos => {
    if (typeof sos.latitude === 'number' && typeof sos.longitude === 'number') {
      const ts = parseDateToMillis(sos.createdAt);
      events.push({
        lat: sos.latitude,
        lng: sos.longitude,
        type: 'sos',
        severity: 'critical',
        title: `SOS: ${sos.emergencyType}`,
        timestamp: ts > 0 ? ts : now - 15 * 60 * 1000
      });
    }
  });

  // Add Live Feed Items
  feedItems.forEach(item => {
    if (typeof item.latitude === 'number' && typeof item.longitude === 'number') {
      const ts = parseDateToMillis(item.lastUpdated || item.timestamp || item.startTime);
      events.push({
        lat: item.latitude,
        lng: item.longitude,
        type: item.category || 'traffic',
        severity: item.category === 'crash' || item.category === 'accident' ? 'high' : 'medium',
        title: item.content.slice(0, 60),
        timestamp: ts > 0 ? ts : now - 10 * 60 * 1000
      });
    }
  });

  // Filter corridors if province selected (or show all)
  const targetCorridors = (activeProvinceFilter && activeProvinceFilter !== 'all')
    ? MAJOR_SA_CORRIDORS.filter(c => c.province === activeProvinceFilter)
    : MAJOR_SA_CORRIDORS;

  const segments: SegmentSpeedTimeline[] = [];
  const bottlenecks: TrafficTrendData['criticalBottlenecks'] = [];

  targetCorridors.forEach(corridor => {
    const freeFlow = corridor.freeFlowSpeedKmh;

    // Calculate speed at each of the 5 time intervals
    const speedsAtTimeline: number[] = timeStamps.map((intervalTime) => {
      let speed = freeFlow;

      // Find nearby events within 3.5 km of this corridor
      events.forEach(evt => {
        const distKm = getDistanceToCorridorKm(evt.lat, evt.lng, corridor);
        if (distKm <= 3.2) {
          // Event influence timeline decay:
          // An event causes maximum slowdown near its timestamp and propagates outward for 45-90 minutes
          const timeDiffMin = (intervalTime - evt.timestamp) / (60 * 1000);

          // If interval is within range of the event occurrence
          if (timeDiffMin >= -15 && timeDiffMin <= 75) {
            let penalty = 0;
            if (evt.type === 'crash' || evt.type === 'accident' || evt.type === 'sos') {
              penalty = 88; // Drops 120 -> ~32 km/h
            } else if (evt.type === 'spiking') {
              penalty = 80;
            } else if (evt.type === 'stationary') {
              penalty = 62;
            } else if (evt.type === 'congestion' || evt.type === 'traffic') {
              penalty = 58;
            } else if (evt.type === 'roadworks' || evt.type === 'hazard') {
              penalty = 48;
            } else {
              penalty = 30;
            }

            // Proximity attenuation
            const proximityFactor = Math.max(0.3, 1 - (distKm / 3.2));
            // Time attenuation curve (peak slowdown 10-30 mins after report)
            const timeCurve = timeDiffMin < 0 ? 0.7 : Math.max(0.4, 1 - (timeDiffMin / 80));

            const finalPenalty = penalty * proximityFactor * timeCurve;
            speed = Math.max(12, speed - finalPenalty);
          }
        }
      });

      // Add mild organic time-of-day baseline fluctuation (e.g. natural variance ±3 km/h)
      const organicVariance = Math.sin((intervalTime / 1000000) + corridor.name.length) * 2;
      return Math.round(Math.min(freeFlow, Math.max(10, speed + organicVariance)));
    });

    const liveSpeed = speedsAtTimeline[4];
    const initialSpeed = speedsAtTimeline[0];
    const trendPercent = Math.round(((liveSpeed - initialSpeed) / initialSpeed) * 100);

    // Find if there is a primary active incident on this corridor
    let activeIncident: { title: string; category: string } | undefined;
    events.forEach(evt => {
      const dist = getDistanceToCorridorKm(evt.lat, evt.lng, corridor);
      if (dist <= 2.5) {
        activeIncident = { title: evt.title, category: evt.type };
      }
    });

    const congestionLevel = getSpeedCategory(liveSpeed, freeFlow);

    segments.push({
      segmentId: corridor.id,
      name: corridor.name,
      highway: corridor.highway,
      province: corridor.province,
      path: corridor.path,
      freeFlowSpeed: freeFlow,
      currentSpeed: liveSpeed,
      speedsAtTimeline,
      trendPercent,
      activeIncidentTitle: activeIncident?.title,
      activeIncidentCategory: activeIncident?.category,
      congestionLevel
    });

    // Check if critical bottleneck (< 40 km/h or > 50% drop)
    if (liveSpeed < 50 || (freeFlow - liveSpeed) >= 45) {
      const midPoint = corridor.path[Math.floor(corridor.path.length / 2)];
      bottlenecks.push({
        segmentId: corridor.id,
        name: corridor.name,
        highway: corridor.highway,
        speed: liveSpeed,
        dropPercent: Math.round(((freeFlow - liveSpeed) / freeFlow) * 100),
        lat: midPoint[0],
        lng: midPoint[1],
        incidentDesc: activeIncident?.title
      });
    }
  });

  // Calculate overall metrics
  const totalLiveSpeed = segments.reduce((sum, s) => sum + s.currentSpeed, 0);
  const avgSpeed = segments.length > 0 ? Math.round(totalLiveSpeed / segments.length) : 100;

  const total60mSpeed = segments.reduce((sum, s) => sum + s.speedsAtTimeline[0], 0);
  const avg60mSpeed = segments.length > 0 ? Math.round(total60mSpeed / segments.length) : 100;
  const avgTrendChange = avgSpeed - avg60mSpeed;

  let overallStatus: TrafficTrendData['overallStatus'] = 'Fluid Flow';
  if (bottlenecks.length >= 4 || avgSpeed < 55) {
    overallStatus = 'Severe Gridlock';
  } else if (bottlenecks.length >= 2 || avgSpeed < 75) {
    overallStatus = 'Corridor Delays';
  } else if (bottlenecks.length === 1 || avgSpeed < 90) {
    overallStatus = 'Moderate Slowdowns';
  }

  // Sort bottlenecks by severity
  bottlenecks.sort((a, b) => a.speed - b.speed);

  return {
    timeLabels,
    timeStamps,
    segments,
    averageSpeedKmh: avgSpeed,
    averageTrendChangeKmh: avgTrendChange,
    criticalBottlenecks: bottlenecks,
    overallStatus
  };
}
