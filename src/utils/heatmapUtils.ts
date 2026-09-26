// Traffic Density Heatmap & 24-Hour Congestion Hotspot Processing Utilities
import { IncidentReport, EmergencySOS, FeedItem } from '../types';
import { parseDateToMillis } from './dateParser';
import { getDistanceKm } from './routeUtils';

export type HeatmapTimeWindow = 6 | 12 | 24 | 48;
export type HeatmapCategoryFilter = 'all' | 'congestion_crash' | 'spiking_security' | 'roadworks';

export interface HeatmapFilterOptions {
  timeWindowHours?: HeatmapTimeWindow;
  categoryFilter?: HeatmapCategoryFilter;
  radiusPreset?: 'standard' | 'focused' | 'radiant';
  intensityMultiplier?: number;
}

export type HeatPoint = [number, number, number]; // [lat, lng, intensity (0.1 - 1.0)]

export interface CongestionHotspot {
  id: string;
  name: string;
  roadName: string;
  lat: number;
  lng: number;
  incidentCount: number;
  peakSeverity: 'critical' | 'high' | 'medium' | 'low';
  topCategories: string[];
  congestionLevel: 'Severe Gridlock' | 'Heavy Congestion' | 'Moderate Delay' | 'Advisory';
  lastReportedTime?: string;
  sampleTitles: string[];
}

/**
 * Filter and extract weighted coordinate heat points from the last 24 hours (or specified window)
 */
export function extract24HourHeatPoints(
  reports: IncidentReport[] = [],
  sosRequests: EmergencySOS[] = [],
  feedItems: FeedItem[] = [],
  options: HeatmapFilterOptions = {}
): { heatPoints: HeatPoint[]; totalIncidents: number; hotspots: CongestionHotspot[] } {
  const timeWindowHours = options.timeWindowHours || 24;
  const categoryFilter = options.categoryFilter || 'all';
  const intensityMult = options.intensityMultiplier || 1.0;

  const now = Date.now();
  const maxAgeMillis = timeWindowHours * 60 * 60 * 1000;

  const heatPoints: HeatPoint[] = [];
  const validIncidents: { lat: number; lng: number; weight: number; title: string; category: string; severity: string; timeMillis: number; roadName: string }[] = [];

  // 1. Process Incident Reports
  reports.forEach((rep) => {
    if (typeof rep.latitude !== 'number' || typeof rep.longitude !== 'number' || isNaN(rep.latitude) || isNaN(rep.longitude)) {
      return;
    }

    // Check category filter
    const isCongestionOrCrash = rep.type === 'congestion' || rep.type === 'traffic' || rep.type === 'crash' || rep.type === 'fatal_crash' || rep.type === 'stationary';
    const isSpikingOrCrime = rep.type === 'spiking';
    const isRoadworksOrHazard = rep.type === 'pothole' || rep.type === 'hazard' || rep.type === 'veld_fire';

    if (categoryFilter === 'congestion_crash' && !isCongestionOrCrash) return;
    if (categoryFilter === 'spiking_security' && !isSpikingOrCrime) return;
    if (categoryFilter === 'roadworks' && !isRoadworksOrHazard) return;

    // Check timestamp against 24-hour window
    const timeMillis = parseDateToMillis(rep.updatedAt || rep.createdAt);
    const ageMillis = timeMillis > 0 ? now - timeMillis : 0;

    // If timestamp is recognized and older than window, filter out
    if (timeMillis > 0 && ageMillis > maxAgeMillis && ageMillis < 30 * 24 * 3600 * 1000) {
      return;
    }

    // Base weight by type
    let baseWeight = 0.65;
    if (rep.type === 'fatal_crash') baseWeight = 1.0;
    else if (rep.type === 'crash') baseWeight = 0.95;
    else if (rep.type === 'congestion' || rep.type === 'traffic') baseWeight = 0.9;
    else if (rep.type === 'spiking') baseWeight = 0.95;
    else if (rep.type === 'stationary') baseWeight = 0.8;
    else if (rep.type === 'veld_fire') baseWeight = 0.85;
    else if (rep.type === 'pothole') baseWeight = 0.55;

    // Severity modifier
    let sevBonus = 0;
    if (rep.severity === 'critical') sevBonus = 0.2;
    else if (rep.severity === 'high') sevBonus = 0.1;
    else if (rep.severity === 'medium') sevBonus = 0.05;

    // Upvote community confirmation bonus
    const upvoteBonus = Math.min(0.2, (rep.upvotes || 0) * 0.04);

    // Recency decay: incidents that happened very recently have max punch, 24h incidents taper slightly
    const recencyFactor = timeMillis > 0 ? Math.max(0.6, 1 - (ageMillis / maxAgeMillis) * 0.35) : 0.9;

    const finalWeight = Math.min(1.0, (baseWeight + sevBonus + upvoteBonus) * recencyFactor * intensityMult);

    heatPoints.push([rep.latitude, rep.longitude, finalWeight]);
    // Also push a slight halo point if high density to give realistic heat diffusion along highway corridors
    if (finalWeight > 0.75) {
      heatPoints.push([rep.latitude + 0.0008, rep.longitude + 0.0008, finalWeight * 0.7]);
      heatPoints.push([rep.latitude - 0.0008, rep.longitude - 0.0008, finalWeight * 0.7]);
    }

    validIncidents.push({
      lat: rep.latitude,
      lng: rep.longitude,
      weight: finalWeight,
      title: rep.title,
      category: rep.type,
      severity: rep.severity || 'medium',
      timeMillis: timeMillis || now,
      roadName: rep.roadName || rep.locationName || 'Highway Corridor'
    });
  });

  // 2. Process Emergency SOS Requests (High impact road emergencies)
  if (categoryFilter === 'all' || categoryFilter === 'congestion_crash' || categoryFilter === 'spiking_security') {
    sosRequests.forEach((sos) => {
      if (typeof sos.latitude !== 'number' || typeof sos.longitude !== 'number' || isNaN(sos.latitude) || isNaN(sos.longitude)) {
        return;
      }
      const timeMillis = parseDateToMillis(sos.createdAt);
      const ageMillis = timeMillis > 0 ? now - timeMillis : 0;
      if (timeMillis > 0 && ageMillis > maxAgeMillis && ageMillis < 30 * 24 * 3600 * 1000) return;

      const weight = Math.min(1.0, 0.95 * intensityMult);
      heatPoints.push([sos.latitude, sos.longitude, weight]);

      validIncidents.push({
        lat: sos.latitude,
        lng: sos.longitude,
        weight,
        title: `SOS: ${sos.emergencyType.replace('_', ' ').toUpperCase()} (${sos.locationName})`,
        category: 'sos',
        severity: 'critical',
        timeMillis: timeMillis || now,
        roadName: sos.locationName || 'Emergency Location'
      });
    });
  }

  // 3. Process Live i-Traffic Feed Items with GPS Coordinates
  if (feedItems && feedItems.length > 0) {
    feedItems.forEach((feed) => {
      if (typeof feed.latitude !== 'number' || typeof feed.longitude !== 'number' || isNaN(feed.latitude) || isNaN(feed.longitude)) {
        return;
      }

      const isCrash = feed.category === 'crash' || feed.category === 'accident' || feed.eventSubType?.toLowerCase().includes('crash') || feed.eventSubType?.toLowerCase().includes('accident');
      const isCongestion = feed.category === 'traffic' || feed.category === 'congestion' || feed.eventSubType?.toLowerCase().includes('stationary') || feed.eventSubType?.toLowerCase().includes('congestion');
      const isSpiking = feed.category === 'spiking';
      const isRoadworks = feed.category === 'roadworks';

      if (categoryFilter === 'congestion_crash' && !isCrash && !isCongestion) return;
      if (categoryFilter === 'spiking_security' && !isSpiking) return;
      if (categoryFilter === 'roadworks' && !isRoadworks) return;

      const timeMillis = parseDateToMillis(feed.lastUpdated || feed.timestamp || feed.startTime);
      const ageMillis = timeMillis > 0 ? now - timeMillis : 0;
      if (timeMillis > 0 && ageMillis > maxAgeMillis && ageMillis < 30 * 24 * 3600 * 1000) return;

      let baseWeight = 0.7;
      if (isCrash) baseWeight = 0.92;
      else if (isCongestion) baseWeight = 0.85;
      else if (isSpiking) baseWeight = 0.95;

      const weight = Math.min(1.0, baseWeight * intensityMult);
      heatPoints.push([feed.latitude, feed.longitude, weight]);

      validIncidents.push({
        lat: feed.latitude,
        lng: feed.longitude,
        weight,
        title: feed.content.slice(0, 70),
        category: feed.category || 'traffic',
        severity: isCrash || isSpiking ? 'high' : 'medium',
        timeMillis: timeMillis || now,
        roadName: feed.roadwayName || feed.location || 'Major Corridor'
      });
    });
  }

  // 4. Cluster incidents to identify Top Historical Hotspots
  const hotspots = clusterIncidentsIntoHotspots(validIncidents);

  return {
    heatPoints,
    totalIncidents: validIncidents.length,
    hotspots
  };
}

/**
 * Clusters incidents within ~3.0 km to rank top congestion hotspots
 */
function clusterIncidentsIntoHotspots(
  incidents: { lat: number; lng: number; weight: number; title: string; category: string; severity: string; timeMillis: number; roadName: string }[]
): CongestionHotspot[] {
  if (incidents.length === 0) return [];

  const clusters: {
    latSum: number;
    lngSum: number;
    count: number;
    totalWeight: number;
    roadNames: Record<string, number>;
    categories: Record<string, number>;
    severities: Record<string, number>;
    titles: string[];
    latestMillis: number;
  }[] = [];

  const CLUSTER_DISTANCE_KM = 3.5;

  incidents.forEach((inc) => {
    let matchedCluster = null;
    for (const cluster of clusters) {
      const avgLat = cluster.latSum / cluster.count;
      const avgLng = cluster.lngSum / cluster.count;
      const dist = getDistanceKm(inc.lat, inc.lng, avgLat, avgLng);
      if (dist <= CLUSTER_DISTANCE_KM) {
        matchedCluster = cluster;
        break;
      }
    }

    if (matchedCluster) {
      matchedCluster.latSum += inc.lat;
      matchedCluster.lngSum += inc.lng;
      matchedCluster.count += 1;
      matchedCluster.totalWeight += inc.weight;
      matchedCluster.roadNames[inc.roadName] = (matchedCluster.roadNames[inc.roadName] || 0) + 1;
      matchedCluster.categories[inc.category] = (matchedCluster.categories[inc.category] || 0) + 1;
      matchedCluster.severities[inc.severity] = (matchedCluster.severities[inc.severity] || 0) + 1;
      matchedCluster.titles.push(inc.title);
      if (inc.timeMillis > matchedCluster.latestMillis) {
        matchedCluster.latestMillis = inc.timeMillis;
      }
    } else {
      clusters.push({
        latSum: inc.lat,
        lngSum: inc.lng,
        count: 1,
        totalWeight: inc.weight,
        roadNames: { [inc.roadName]: 1 },
        categories: { [inc.category]: 1 },
        severities: { [inc.severity]: 1 },
        titles: [inc.title],
        latestMillis: inc.timeMillis
      });
    }
  });

  // Convert clusters into formatted Hotspot objects
  const hotspotList: CongestionHotspot[] = clusters.map((cl, idx) => {
    const lat = cl.latSum / cl.count;
    const lng = cl.lngSum / cl.count;

    // Find most frequent road name
    const topRoadName = Object.entries(cl.roadNames).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Corridor';

    // Find peak severity
    let peakSeverity: 'critical' | 'high' | 'medium' | 'low' = 'low';
    if (cl.severities['critical']) peakSeverity = 'critical';
    else if (cl.severities['high']) peakSeverity = 'high';
    else if (cl.severities['medium']) peakSeverity = 'medium';

    // Calculate congestion level
    const score = cl.totalWeight + (cl.count * 0.4);
    let congestionLevel: 'Severe Gridlock' | 'Heavy Congestion' | 'Moderate Delay' | 'Advisory' = 'Advisory';
    if (score >= 3.0 || cl.count >= 4 || peakSeverity === 'critical') {
      congestionLevel = 'Severe Gridlock';
    } else if (score >= 1.8 || cl.count >= 2 || peakSeverity === 'high') {
      congestionLevel = 'Heavy Congestion';
    } else if (score >= 0.9) {
      congestionLevel = 'Moderate Delay';
    }

    const topCats = Object.entries(cl.categories)
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat)
      .slice(0, 3);

    return {
      id: `hotspot-${idx}-${Math.round(lat * 1000)}`,
      name: `${topRoadName} Zone`,
      roadName: topRoadName,
      lat,
      lng,
      incidentCount: cl.count,
      peakSeverity,
      topCategories: topCats,
      congestionLevel,
      lastReportedTime: new Date(cl.latestMillis).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      sampleTitles: cl.titles.slice(0, 3)
    };
  });

  // Sort by density score / incident count descending
  return hotspotList.sort((a, b) => {
    const weightA = a.incidentCount * 2 + (a.congestionLevel === 'Severe Gridlock' ? 5 : a.congestionLevel === 'Heavy Congestion' ? 3 : 1);
    const weightB = b.incidentCount * 2 + (b.congestionLevel === 'Severe Gridlock' ? 5 : b.congestionLevel === 'Heavy Congestion' ? 3 : 1);
    return weightB - weightA;
  });
}
