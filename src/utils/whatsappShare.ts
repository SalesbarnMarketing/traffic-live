import { FeedItem, IncidentReport, SocialHashtagSettings } from '../types';
import { formatSATime, formatWhatsAppDateTime } from './dateParser';
import { getCategoryDefaultImage, normalizeCategoryId, sanitizeImageUrl } from './categoryImageHelper';
import { resolveItemRegion } from './regionUtils';

export const WHATSAPP_CHANNEL_URL = 'https://whatsapp.com/channel/0029Va91KckDzgTGXcqt3I2I';

export const DEFAULT_HASHTAG_SETTINGS: SocialHashtagSettings = {
  defaultTags: ['#Livetraffic', '#ArriveAlive'],
  excludedTags: ['#Gautengtraffic', '#GautengTraffic', '#RoadSafety', '#EasterWeekend', '#MothersDay', '#FestiveSeason'],
  quickAddPresets: [],
  customKeywordRules: [],
  whatsappFooterText: '🚨 Powered by LiveTraffic NPC | 24/7 Highway Patrol Watch',
  xPostFooterText: 'via @LiveTrafficNPC',
  autoTagCorridors: false,
  autoTagLandmarks: false
};

const STORAGE_KEY = 'livetraffic_hashtag_settings_v3';

export function getLocalSocialHashtagSettings(): SocialHashtagSettings {
  if (typeof window === 'undefined') return DEFAULT_HASHTAG_SETTINGS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const rawDefaults: string[] = Array.isArray(parsed.defaultTags) ? parsed.defaultTags : DEFAULT_HASHTAG_SETTINGS.defaultTags;
      // Filter out any legacy tags from default tags
      const cleanedDefaults = rawDefaults.filter(t => {
        const lower = t.toLowerCase();
        return !lower.includes('gautengtraffic') && !lower.includes('easter') && !lower.includes('mothersday');
      });
      if (cleanedDefaults.length === 0) {
        cleanedDefaults.push('#Livetraffic', '#ArriveAlive');
      }

      const rawExcluded: string[] = Array.isArray(parsed.excludedTags) ? parsed.excludedTags : DEFAULT_HASHTAG_SETTINGS.excludedTags;
      const cleanedExcluded = Array.from(new Set([...rawExcluded, '#Gautengtraffic', '#GautengTraffic', '#EasterWeekend', '#RoadSafety']));

      return {
        ...DEFAULT_HASHTAG_SETTINGS,
        ...parsed,
        defaultTags: cleanedDefaults,
        excludedTags: cleanedExcluded,
        quickAddPresets: Array.isArray(parsed.quickAddPresets) ? parsed.quickAddPresets : [],
        customKeywordRules: []
      };
    }
  } catch (err) {
    console.warn('Could not read hashtag settings from storage:', err);
  }
  return DEFAULT_HASHTAG_SETTINGS;
}

export function saveLocalSocialHashtagSettings(settings: SocialHashtagSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('livetraffic_hashtag_settings_updated', { detail: settings }));
  } catch (err) {
    console.warn('Could not write hashtag settings to storage:', err);
  }
}

export const DEFAULT_PRODUCTION_DOMAIN = 'https://trafficlive.co.za';
export const CANONICAL_PUBLIC_APP_URL = 'https://trafficlive.co.za/app/';

/**
 * Returns current public server origin or live domain.
 * Ensures shares always link to official trafficlive.co.za production domain rather than internal dev/preview containers.
 */
export function getPublicOrigin(): string {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    const hostname = window.location.hostname;
    if (hostname === 'trafficlive.co.za' || hostname === 'www.trafficlive.co.za') {
      return window.location.origin;
    }
  }
  return DEFAULT_PRODUCTION_DOMAIN;
}

export function getPublicAppUrl(): string {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    const hostname = window.location.hostname;
    if (hostname === 'trafficlive.co.za' || hostname === 'www.trafficlive.co.za') {
      return `${window.location.origin}/app/`;
    }
  }
  return CANONICAL_PUBLIC_APP_URL;
}

export const APP_BASE_URL = typeof window !== 'undefined' && window.location?.origin && (window.location.hostname === 'trafficlive.co.za' || window.location.hostname === 'www.trafficlive.co.za')
  ? window.location.origin
  : DEFAULT_PRODUCTION_DOMAIN;

export const APP_PUBLIC_URL = CANONICAL_PUBLIC_APP_URL;

/**
 * Resolves a public, clickable image URL for sharing on WhatsApp
 */
export function resolveShareableImageUrl(options: {
  directUrl?: string;
  category?: string;
  subType?: string;
  itemId?: string;
  reportId?: string;
}): string {
  const { directUrl, category, subType, itemId, reportId } = options;
  const origin = getPublicOrigin();

  // 1. Direct photo on the item/report (direct HTTP/HTTPS or local data URI)
  const cleanDirect = sanitizeImageUrl(directUrl);
  if (cleanDirect) {
    if (cleanDirect.startsWith('http://') || cleanDirect.startsWith('https://') || cleanDirect.startsWith('data:image/')) {
      return cleanDirect;
    }
  }

  // 2. Direct item or report ID
  if (itemId) {
    return `${origin}/photo/${encodeURIComponent(itemId)}`;
  }
  if (reportId) {
    return `${origin}/photo/${encodeURIComponent(reportId)}`;
  }

  // 3. Fallback to category default image if configured by Admin
  const normCatId = normalizeCategoryId(category, subType);
  const catImg = sanitizeImageUrl(getCategoryDefaultImage(category, subType));
  if (catImg) {
    if (catImg.startsWith('http://') || catImg.startsWith('https://') || catImg.startsWith('data:image/')) {
      return catImg;
    }
  }

  // 4. Fallback to category photo endpoint so dynamic branded alert banner is rendered
  if (normCatId) {
    return `${origin}/photo/${encodeURIComponent(normCatId)}`;
  }

  return '';
}

/**
 * Downloads an image file to the user's device (Mobile Gallery/Downloads or Desktop).
 * Handles data URIs, cross-origin URLs, blobs, and canvas rendering.
 */
export async function downloadImageFile(imageUrl: string, filename?: string): Promise<boolean> {
  if (typeof window === 'undefined' || !imageUrl) return false;

  const defaultFilename = filename || `livetraffic_incident_${Date.now()}.png`;

  try {
    // 1. Base64 / Data URI
    if (imageUrl.startsWith('data:image/')) {
      const match = imageUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (match) {
        const mime = `image/${match[1]}`;
        const bstr = atob(match[2]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = defaultFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 2500);
        return true;
      }
    }

    // 2. Direct fetch with CORS mode
    try {
      const res = await fetch(imageUrl, { mode: 'cors' });
      if (res.ok) {
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = defaultFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 2500);
        return true;
      }
    } catch (e) {
      console.warn('Direct fetch for download failed, attempting Canvas fallback:', e);
    }

    // 3. Canvas conversion fallback
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Image failed to load on canvas'));
      img.src = imageUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || 1200;
    canvas.height = img.naturalHeight || 630;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/png');
      });
      if (blob) {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = defaultFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 2500);
        return true;
      }
    }

    // 4. Direct Anchor click fallback
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = defaultFilename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } catch (err) {
    console.error('Failed to download image:', err);
    try {
      window.open(imageUrl, '_blank');
      return true;
    } catch (_) {
      return false;
    }
  }
}

/**
 * Copies an image directly to the system clipboard as a PNG blob so the user
 * can paste (Ctrl+V) directly into WhatsApp Web, WhatsApp Desktop, or mobile chats.
 */
export async function copyImageToClipboard(imageUrl: string): Promise<boolean> {
  if (typeof window === 'undefined' || !imageUrl) return false;

  try {
    let blob: Blob | null = null;

    // Case 1: Data URL
    if (imageUrl.startsWith('data:image/')) {
      const match = imageUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (match) {
        const bstr = atob(match[2]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        blob = new Blob([u8arr], { type: 'image/png' });
      }
    }

    // Case 2: Fetch
    if (!blob) {
      try {
        const res = await fetch(imageUrl, { mode: 'cors' });
        if (res.ok) {
          blob = await res.blob();
        }
      } catch (_) {}
    }

    // Case 3: Canvas
    if (!blob) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image for clipboard'));
        img.src = imageUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 1200;
      canvas.height = img.naturalHeight || 630;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), 'image/png');
        });
      }
    }

    if (!blob) return false;

    if (navigator.clipboard && window.isSecureContext && typeof ClipboardItem !== 'undefined') {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      return true;
    }
  } catch (err) {
    console.warn('Could not copy image to clipboard:', err);
  }

  return false;
}

/**
 * Normalizes a word or phrase into a clean camelCase or single-word hashtag
 */
export function toHashtag(str: string): string {
  const cleaned = str
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
  return cleaned ? `#${cleaned}` : '';
}

/**
 * Extracts and generates intelligent South African traffic #hashtags from i-Traffic info,
 * corridor data, location landmarks, and event categories.
 */
export function generateITrafficHashtags(
  item: Partial<FeedItem> | {
    roadwayName?: string;
    direction?: string;
    location?: string;
    content?: string;
    eventSubType?: string;
    category?: string;
  },
  customSettings?: SocialHashtagSettings
): string[] {
  const settings = customSettings || getLocalSocialHashtagSettings();
  const tags = new Set<string>();

  // 1. Include foundational brand & admin-configured default tags
  if (Array.isArray(settings.defaultTags) && settings.defaultTags.length > 0) {
    for (const tag of settings.defaultTags) {
      const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
      if (cleanTag.length > 1) tags.add(cleanTag);
    }
  } else {
    tags.add('#Livetraffic');
    tags.add('#ArriveAlive');
  }

  const roadway = (item.roadwayName || '').toUpperCase().trim();
  const direction = (item.direction || '').toLowerCase().trim();
  const location = (item.location || '').toLowerCase();
  const content = (item.content || '').toLowerCase();
  const subType = (item.eventSubType || item.category || '').toLowerCase();
  const fullText = `${roadway} ${direction} ${location} ${content} ${subType}`.toLowerCase();

  // 2. Province tag
  const province = resolveItemRegion(item as any);
  if (province) {
    const cleanProv = province.replace(/[^a-zA-Z0-9]/g, '');
    tags.add(`#${cleanProv}`);
    tags.add(`#${cleanProv}Traffic`);
  }

  // 3. Roadway tags (only if autoTagCorridors is enabled)
  if (settings.autoTagCorridors === true && roadway) {
    const mainRoad = roadway.replace(/\s+/g, '');
    tags.add(`#${mainRoad}`);

    let dirSuffix = '';
    if (direction.includes('north') || fullText.includes('northbound') || fullText.includes('nb')) dirSuffix = 'North';
    else if (direction.includes('south') || fullText.includes('southbound') || fullText.includes('sb')) dirSuffix = 'South';
    else if (direction.includes('east') || fullText.includes('eastbound') || fullText.includes('eb')) dirSuffix = 'East';
    else if (direction.includes('west') || fullText.includes('westbound') || fullText.includes('wb')) dirSuffix = 'West';

    if (dirSuffix) {
      tags.add(`#${mainRoad}${dirSuffix}`);
    }
  }

  // 3. Key Landmark / Interchange Tags (only if autoTagLandmarks is enabled)
  if (settings.autoTagLandmarks === true) {
    const landmarkKeywords: Array<{ key: string; tag: string }> = [
      { key: 'buccleuch', tag: '#Buccleuch' },
      { key: 'gilloolys', tag: '#Gilloolys' },
      { key: 'allandale', tag: '#Allandale' },
      { key: 'rigel', tag: '#Rigel' },
      { key: 'centurion', tag: '#Centurion' },
      { key: 'midrand', tag: '#Midrand' }
    ];

    for (const lm of landmarkKeywords) {
      if (fullText.includes(lm.key)) {
        tags.add(lm.tag);
      }
    }
  }

  // 4. Custom Keyword Rules configured by Admin
  if (Array.isArray(settings.customKeywordRules)) {
    for (const rule of settings.customKeywordRules) {
      if (rule.enabled && rule.keyword && rule.tag) {
        const kw = rule.keyword.trim().toLowerCase();
        if (kw && fullText.includes(kw)) {
          const formattedTag = rule.tag.startsWith('#') ? rule.tag : `#${rule.tag}`;
          tags.add(formattedTag);
        }
      }
    }
  }

  // 5. Filter out Excluded / Blacklisted Hashtags (case-insensitive)
  const excludedSet = new Set(
    (settings.excludedTags || []).map(t => t.trim().toLowerCase().replace(/^#/, ''))
  );

  const finalTags: string[] = [];
  for (const t of tags) {
    const rawName = t.trim().toLowerCase().replace(/^#/, '');
    if (!excludedSet.has(rawName) && rawName.length > 0) {
      finalTags.push(t.startsWith('#') ? t : `#${t}`);
    }
  }

  return finalTags.length > 0 ? finalTags : ['#Livetraffic', '#ArriveAlive'];
}

/**
 * Formats multi-part details into clean, readable paragraphs with double line feeds
 */
export function formatDetailsForWhatsApp(rawContent: string): string {
  if (!rawContent) return '';
  let text = rawContent.trim();

  // If already contains multiple newlines, normalize excessive newlines
  if (text.includes('\n')) {
    return text.replace(/\n{3,}/g, '\n\n');
  }

  // 1. Break after title/headline (e.g. "...Krugersdorp) Southwest. +11 min delay")
  text = text.replace(/(\))\s+(Southwest\.|Northwest\.|Southeast\.|Northeast\.|Northbound\.|Southbound\.|Eastbound\.|Westbound\.|North\.|South\.|East\.|West\.)/gi, '$1\n\n$2');

  // 2. Break before alternate route recommendations (e.g. "...Brakfontein West. Use Hendrik...")
  text = text.replace(/(\.)\s+(Use\s+[A-Z]|Alternative\s+route|Detour:|Avoid\s+the\s+area|Expect\s+heavy\s+delays)/gi, '$1\n\n$2');

  // 3. Break before verification / live watch / source attribution
  text = text.replace(/(\.)\s+(Verified\s+via|Source:|Monitored\s+via|Live\s+Watch)/gi, '$1\n\n$2');

  return text;
}

/**
 * Formats an i-Traffic incident or feed item for clean WhatsApp Channel & Group posting
 */
export function formatITrafficForWhatsApp(item: FeedItem): string {
  const isCrash = item.category === 'accident' || item.category === 'crash' || item.content.toLowerCase().includes('crash');
  const isSpiking = item.category === 'spiking' || item.content.toLowerCase().includes('spike');
  const isRoadworks = item.category === 'roadworks' || item.content.toLowerCase().includes('roadwork');
  const isHazard = item.category === 'hazard' || item.category === 'stationary' || item.content.toLowerCase().includes('stationary');

  const alertIcon = isSpiking ? '🚨' : isCrash ? '💥' : isRoadworks ? '🚧' : isHazard ? '⚠️' : '🚦';
  const typeLabel = item.eventSubType || (isCrash ? 'CRASH / COLLISION' : isRoadworks ? 'ROADWORKS' : isSpiking ? 'SPIKE TRAP / HAZARD' : 'TRAFFIC INCIDENT');

  const hashtags = generateITrafficHashtags(item);
  const timeStr = formatWhatsAppDateTime(item.startTime || item.timestamp || item.lastUpdated);
  const appUrl = getPublicAppUrl();
  const formattedDetails = formatDetailsForWhatsApp(item.content);

  // Attached Image or Category Alert Banner
  const sharePhotoUrl = resolveShareableImageUrl({
    directUrl: item.mediaUrl || item.imageUrl,
    category: item.category,
    subType: item.eventSubType,
    itemId: item.id
  });

  const province = resolveItemRegion(item);
  const provTag = province ? `[${province.toUpperCase()}] ` : '';

  let msg = `*${alertIcon} ${provTag}TRAFFIC ALERT | LiveTrafficNPC*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  
  const locationText = item.location 
    ? item.location 
    : (item.roadwayName ? `${item.roadwayName}${item.direction ? ` (${item.direction})` : ''}` : '');

  if (locationText) {
    msg += `📍 *Location:* ${locationText}\n`;
  }
  if (province) {
    msg += `🏛️ *Province:* ${province}\n`;
  }
  msg += `⚠️ *Event Type:* ${typeLabel}\n`;
  msg += `🕒 *Reported Time:* ${timeStr}\n\n`;

  msg += `📝 *Details:*\n${formattedDetails}\n\n`;

  if (item.endTime) {
    const clearTimeStr = formatWhatsAppDateTime(item.endTime);
    msg += `⏱️ *Expected Clear:* ${clearTimeStr}\n\n`;
  }

  if (item.latitude !== undefined && item.longitude !== undefined) {
    msg += `🌐 *GPS Pin:* https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}\n\n`;
  }

  msg += `🗺️ *Track Live & Report Hazards:* ${appUrl}\n\n`;
  msg += `${hashtags.join(' ')}`;

  return msg;
}

/**
 * Formats a user incident report for WhatsApp Channel posting
 */
export function formatReportForWhatsApp(report: IncidentReport): string {
  const isSpiking = report.type === 'spiking';
  const isFatal = report.type === 'fatal_crash';
  const icon = isFatal ? '💀' : isSpiking ? '🚨' : report.type === 'crash' ? '💥' : report.type === 'pothole' ? '🔨' : '⚠️';
  const appUrl = getPublicAppUrl();
  const province = resolveItemRegion(report);

  const hashtags = generateITrafficHashtags({
    roadwayName: report.roadName,
    location: report.locationName,
    content: report.description,
    category: report.type,
    eventSubType: report.type
  });

  // Attached Image or Category Alert Banner
  const sharePhotoUrl = resolveShareableImageUrl({
    directUrl: report.imageUrl || report.resolvedImageUrl,
    category: report.type,
    reportId: report.id
  });

  const provTag = province ? `[${province.toUpperCase()}] ` : '';
  let msg = `*${icon} ${provTag}${isFatal ? 'FATAL CRASH ALERT' : isSpiking ? 'SPIKING HAZARD ALERT' : 'ROAD SAFETY ALERT'} | LiveTrafficNPC*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📍 *Location:* ${report.locationName} (${report.roadName})\n`;
  if (province) {
    msg += `🏛️ *Province:* ${province}\n`;
  }
  msg += `⚠️ *Severity:* ${report.severity.toUpperCase()}\n`;
  msg += `🕒 *Time:* ${formatWhatsAppDateTime(report.createdAt)}\n\n`;

  const detailsBody = report.title !== report.description 
    ? `${report.title}\n\n${formatDetailsForWhatsApp(report.description)}`
    : formatDetailsForWhatsApp(report.title);

  msg += `📝 *Incident Details:*\n${detailsBody}\n\n`;

  if (report.aiAnalysis && report.aiAnalysis.warningText) {
    msg += `🛡️ *Patrol Guidance:* ${report.aiAnalysis.warningText}\n\n`;
  }

  if (report.latitude && report.longitude) {
    msg += `🌐 *Map Location:* https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}\n\n`;
  }

  msg += `🗺️ *Track Live & Report Hazards:* ${appUrl}\n\n`;
  msg += `${hashtags.join(' ')}`;

  return msg;
}

/**
 * Copies any text to clipboard with graceful fallbacks
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback to execCommand
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Failed to copy text:', err);
    return false;
  }
}

/**
 * Opens WhatsApp sharing link
 */
export function openWhatsAppShare(text: string): void {
  if (typeof window === 'undefined') return;
  const encoded = encodeURIComponent(text);
  const url = `https://api.whatsapp.com/send?text=${encoded}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Helper to share via Web Share API with optional attached image file
 */
export async function shareToWhatsAppWithMedia(options: {
  text: string;
  imageUrl?: string;
  title?: string;
}): Promise<boolean> {
  const { text, imageUrl, title = 'Traffic Alert | LiveTrafficNPC' } = options;

  if (typeof navigator !== 'undefined' && navigator.share) {
    // If imageUrl exists, try to prepare a File object for rich media sharing
    if (imageUrl) {
      try {
        let blob: Blob | null = null;
        if (imageUrl.startsWith('data:image/')) {
          const match = imageUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
          if (match) {
            const mime = `image/${match[1]}`;
            const bstr = atob(match[2]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
              u8arr[n] = bstr.charCodeAt(n);
            }
            blob = new Blob([u8arr], { type: mime });
          }
        } else if (imageUrl.startsWith('http')) {
          const response = await fetch(imageUrl, { mode: 'cors' }).catch(() => null);
          if (response && response.ok) {
            blob = await response.blob();
          }
        }

        if (blob) {
          const ext = blob.type.split('/')[1] || 'jpg';
          const file = new File([blob], `livetraffic_alert_${Date.now()}.${ext}`, { type: blob.type });

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title,
              text,
              files: [file]
            });
            return true;
          }
        }
      } catch (err) {
        console.warn('Native file share failed, falling back to text share:', err);
      }
    }

    // Fallback to text share with navigator.share
    try {
      if (navigator.canShare ? navigator.canShare({ text }) : true) {
        await navigator.share({
          title,
          text
        });
        return true;
      }
    } catch (err) {
      console.warn('Native text share failed:', err);
    }
  }

  // Default fallback: open WhatsApp URL
  openWhatsAppShare(text);
  return true;
}
