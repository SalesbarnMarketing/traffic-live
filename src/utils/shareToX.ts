import { IncidentReport, FeedItem } from '../types';
import { getPublicAppUrl } from './whatsappShare';

export interface ShareOptions {
  title?: string;
  location?: string;
  description?: string;
  category?: string;
  severity?: string;
  url?: string;
  hashtags?: string[];
  via?: string;
}

/**
 * Gets the current app base URL for sharing
 */
export function getAppShareUrl(): string {
  return getPublicAppUrl();
}

/**
 * Opens x.com (Twitter) intent composer in a new window or tab
 */
export function openXShareWindow(text: string, url?: string, hashtags?: string[]): void {
  const shareUrl = url || getAppShareUrl();
  const params = new URLSearchParams();
  
  params.set('text', text);
  if (shareUrl) {
    params.set('url', shareUrl);
  }
  if (hashtags && hashtags.length > 0) {
    params.set('hashtags', hashtags.map(h => h.replace(/^#/, '')).join(','));
  }
  params.set('via', 'LiveTrafficNPC');

  const fullIntentUrl = `https://x.com/intent/post?${params.toString()}`;
  
  if (typeof window !== 'undefined') {
    const width = 560;
    const height = 620;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    window.open(
      fullIntentUrl,
      'share-to-x',
      `width=${width},height=${height},left=${left},top=${top},toolbar=0,status=0,menubar=0,resizable=1`
    );
  }
}

/**
 * Shares the Live Traffic NPC app with live warning context
 */
export function shareAppToX(customMessage?: string): void {
  const message = customMessage || 
    '🚨 LIVE TRAFFIC ALERT: Real-time highway watch, spiking trap warnings, road hazards & live traffic updates in Gauteng. Stay safe on the road with Live Traffic NPC:';
  
  openXShareWindow(message, getAppShareUrl(), ['LiveTrafficNPC', 'GautengTraffic', 'RoadSafety', 'ArriveAlive']);
}

/**
 * Shares a specific incident report to X.com
 */
export function shareIncidentReportToX(report: IncidentReport): void {
  const isSpiking = report.type === 'spiking';
  const isFatal = report.type === 'fatal_crash';
  const icon = isFatal ? '💀' : isSpiking ? '🚨' : report.type === 'crash' ? '💥' : report.type === 'pothole' ? '🔨' : '⚠️';
  const severityTag = report.severity ? `[${report.severity.toUpperCase()}] ` : '';
  const road = report.roadName ? ` (${report.roadName})` : '';
  
  let tweet = `${icon} ${severityTag}${report.title.toUpperCase()} @ ${report.locationName}${road}\n\n`;
  
  if (report.description) {
    const cleanDesc = report.description.length > 120 
      ? `${report.description.substring(0, 117)}...` 
      : report.description;
    tweet += `Details: ${cleanDesc}\n\n`;
  }
  
  if (isFatal) {
    tweet += '🚨 CRITICAL FATALITY: Emergency services on scene. Expect severe delays & closures.\n';
  } else if (isSpiking) {
    tweet += '⚠️ Drive with caution! Avoid stopping on dark shoulders.\n';
  } else {
    tweet += '📍 Real-time hazard logged on Live Traffic NPC map:\n';
  }

  const tags = ['LiveTrafficNPC', 'GautengTraffic', isFatal ? 'FatalCrash' : isSpiking ? 'SpikingAlert' : 'RoadHazard', 'DriveSafe'];
  openXShareWindow(tweet, getAppShareUrl(), tags);
}

/**
 * Shares a live feed item (i-Traffic or Patrol dispatch) to X.com
 */
export function shareFeedItemToX(item: FeedItem): void {
  const isCrash = item.category === 'crash' || item.content.toLowerCase().includes('crash');
  const isSpiking = item.category === 'spiking' || item.content.toLowerCase().includes('spike');
  const icon = isSpiking ? '🚨' : isCrash ? '💥' : item.category === 'pothole' ? '🔨' : '🚦';
  
  let header = `${icon} TRAFFIC ALERT: `;
  if (item.roadwayName) {
    header += `[${item.roadwayName}] `;
  }
  if (item.location) {
    header += `${item.location}\n\n`;
  } else {
    header += `${item.author}\n\n`;
  }

  let body = item.content;
  if (body.length > 140) {
    body = `${body.substring(0, 137)}...`;
  }

  const tweet = `${header}${body}\n\nTrack live updates & report hazards:`;
  const tags = ['LiveTrafficNPC', 'iTraffic', 'GautengTraffic', 'RoadSafety'];
  
  openXShareWindow(tweet, item.link || getAppShareUrl(), tags);
}

/**
 * Opens Facebook share composer in a new window or tab
 */
export function openFacebookShareWindow(url?: string, quote?: string): void {
  const shareUrl = url || getAppShareUrl();
  const params = new URLSearchParams();
  params.set('u', shareUrl);
  if (quote) {
    params.set('quote', quote);
  }
  const fullUrl = `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
  
  if (typeof window !== 'undefined') {
    const width = 600;
    const height = 650;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    window.open(
      fullUrl,
      'share-to-facebook',
      `width=${width},height=${height},left=${left},top=${top},toolbar=0,status=0,menubar=0,resizable=1`
    );
  }
}

/**
 * Shares a specific incident report to Facebook
 */
export function shareIncidentReportToFacebook(report: IncidentReport): void {
  const isSpiking = report.type === 'spiking';
  const isFatal = report.type === 'fatal_crash';
  const icon = isFatal ? '💀' : isSpiking ? '🚨' : report.type === 'crash' ? '💥' : report.type === 'pothole' ? '🔨' : '⚠️';
  const road = report.roadName ? ` (${report.roadName})` : '';
  const desc = report.description ? `\n\n${report.description}` : '';
  const text = `${icon} ${isFatal ? 'CRITICAL FATAL CRASH' : 'ROAD HAZARD ALERT'}: ${report.title} @ ${report.locationName}${road}${desc}\n\nLive Traffic NPC Community Watch`;
  openFacebookShareWindow(getAppShareUrl(), text);
}

/**
 * Shares a feed item to Facebook
 */
export function shareFeedItemToFacebook(item: FeedItem): void {
  const isSpiking = item.category === 'spiking' || item.content.toLowerCase().includes('spike');
  const icon = isSpiking ? '🚨' : '🚦';
  const loc = item.location ? ` - ${item.location}` : '';
  const text = `${icon} TRAFFIC ALERT${loc}: ${item.content}\n\nLive Traffic NPC Community Watch`;
  openFacebookShareWindow(item.link || getAppShareUrl(), text);
}
