import { IncidentCategoryConfig } from '../types';
import { getAdminSession } from './authUtils';

export function sanitizeImageUrl(url?: any): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (
    trimmed.includes('unsplash.com') ||
    trimmed.includes('images.unsplash.com') ||
    trimmed.includes('via.placeholder.com') ||
    trimmed.includes('placeholder.com') ||
    trimmed.includes('picsum.photos')
  ) {
    return '';
  }
  return trimmed;
}

/**
 * Checks whether an image URL is an external stubbed/placeholder/AI photo
 */
export function isDefaultCategoryPhoto(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  // Strictly disallow external stubbed or AI placeholder domains
  if (
    trimmed.includes('unsplash.com') ||
    trimmed.includes('images.unsplash.com') ||
    trimmed.includes('via.placeholder.com') ||
    trimmed.includes('placeholder.com') ||
    trimmed.includes('picsum.photos')
  ) {
    return true;
  }

  return false;
}

/**
 * Validates if an incident or category has a valid image from the live database or user upload
 */
export function isActualAttachedImage(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (isDefaultCategoryPhoto(trimmed)) return false;
  return (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('/api/category-images/') ||
    trimmed.startsWith('/photo/') ||
    trimmed.startsWith('/photos/') ||
    trimmed.startsWith('/api/photo/') ||
    trimmed.startsWith('/api/reports/') ||
    trimmed.startsWith('/api/feed/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/')
  );
}

/**
 * Resolves the display image for a feed item or incident, checking mediaUrl, imageUrl, and live database category banners.
 */
export function getItemMediaImage(item?: { mediaUrl?: string; imageUrl?: string; category?: string; eventSubType?: string; type?: string } | null): string {
  if (!item) return '';
  if (item.mediaUrl && isActualAttachedImage(item.mediaUrl)) return item.mediaUrl.trim();
  if (item.imageUrl && isActualAttachedImage(item.imageUrl)) return item.imageUrl.trim();
  const cat = item.category || item.eventSubType || item.type;
  if (cat) {
    const catImage = getCategoryDefaultImage(cat);
    if (catImage && isActualAttachedImage(catImage)) return catImage.trim();
  }
  return '';
}

export const DEFAULT_CATEGORY_CONFIGS: IncidentCategoryConfig[] = [
  {
    id: 'crash',
    label: 'Vehicle Crash / Collision',
    badge: 'INCIDENT',
    subtitle: 'Multi-vehicle collision or major highway crash',
    imageUrl: '',
    iconName: 'AlertTriangle',
    isSystemDefault: true
  },
  {
    id: 'spiking',
    label: 'Spike Trap Hazard',
    badge: 'HIGH RISK',
    subtitle: 'Road spikes and tyre traps placed by criminals on highways',
    imageUrl: '',
    iconName: 'AlertOctagon',
    isSystemDefault: true
  },
  {
    id: 'fatal_crash',
    label: 'Fatal Crash / Fatal Collision',
    badge: 'FATAL CRASH',
    subtitle: 'Critical high-impact collision with fatalities, scene investigation & road closure',
    imageUrl: '',
    iconName: 'AlertTriangle',
    isSystemDefault: true
  },
  {
    id: 'stationary',
    label: 'Stationary / Disabled Vehicle',
    badge: 'OBSTRUCTION',
    subtitle: 'Broken down vehicle obstructing highway lane or shoulder',
    imageUrl: '',
    iconName: 'ShieldAlert',
    isSystemDefault: true
  },
  {
    id: 'veld_fire',
    label: 'Veld Fire / Heavy Smoke',
    badge: 'VISIBILITY',
    subtitle: 'Fire or thick smoke blowing across lanes reducing visibility',
    imageUrl: '',
    iconName: 'Flame',
    isSystemDefault: true
  },
  {
    id: 'congestion',
    label: 'Severe Traffic Congestion',
    badge: 'DELAY',
    subtitle: 'Heavy gridlock, bumper-to-bumper queue or highway backlog',
    imageUrl: '',
    iconName: 'Car',
    isSystemDefault: true
  },
  {
    id: 'pothole',
    label: 'Pothole / Road Surface Damage',
    badge: 'HAZARD',
    subtitle: 'Severe road surface damage, crater or hazardous pothole',
    imageUrl: '',
    iconName: 'Construction',
    isSystemDefault: true
  },
  {
    id: 'roadworks',
    label: 'Roadworks / Lane Maintenance',
    badge: 'ROADWORKS',
    subtitle: 'Active road construction, lane closures, or resurfacing',
    imageUrl: '',
    iconName: 'Wrench',
    isSystemDefault: true
  },
  {
    id: 'traffic_lights',
    label: 'Traffic Lights Out / Broken',
    badge: 'OUTAGE',
    subtitle: 'Robot / traffic light failure, load shedding flashing or offline',
    imageUrl: '',
    iconName: 'Octagon',
    isSystemDefault: true
  },
  {
    id: 'hazard',
    label: 'General Road Hazard / Debris',
    badge: 'HAZARD',
    subtitle: 'Fallen cargo, animals on road, missing manhole covers or debris',
    imageUrl: '',
    iconName: 'AlertTriangle',
    isSystemDefault: true
  },
  {
    id: 'general',
    label: 'General Patrol Bulletin',
    badge: 'BULLETIN',
    subtitle: 'Official safety advisory, corridor status, or patrol notice',
    imageUrl: '',
    iconName: 'Megaphone',
    isSystemDefault: true
  },
  {
    id: 'sos',
    label: 'Emergency SOS / Motorist Assistance',
    badge: 'EMERGENCY',
    subtitle: 'Immediate responder dispatch for stranded motorists or danger',
    imageUrl: '',
    iconName: 'AlertOctagon',
    isSystemDefault: true
  },
  {
    id: 'gbv_assist',
    label: 'GBV / Vulnerable Motorist Assist',
    badge: 'GBV ASSIST',
    subtitle: 'Confidential emergency help, domestic safety & urgent patrol escort',
    imageUrl: '',
    iconName: 'HeartHandshake',
    isSystemDefault: true
  },
  {
    id: 'crime',
    label: 'Crime / Hijacking / Police Assist',
    badge: 'SECURITY',
    subtitle: 'Crime threat, robbery, hijacking in progress or SAPS dispatch request',
    imageUrl: '',
    iconName: 'ShieldAlert',
    isSystemDefault: true
  }
];

// In-memory cache & listeners
let deletedCategoryIdsCache: string[] = (() => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('deleted_category_ids_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.map((s: string) => String(s).toLowerCase().trim());
      }
    } catch (e) { /* ignore */ }
  }
  return ['police_checkpoint', 'checkpoint'];
})();

let cachedCategoryConfigs: Record<string, IncidentCategoryConfig> = (() => {
  const initial: Record<string, IncidentCategoryConfig> = {};
  for (const def of DEFAULT_CATEGORY_CONFIGS) {
    if (!deletedCategoryIdsCache.includes(def.id)) {
      initial[def.id] = { ...def };
    }
  }
  return initial;
})();

// Restore any local cache if available on boot, preserving all categories and admin images
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('incident_category_photos_cache');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        for (const [key, val] of Object.entries(parsed)) {
          const normKey = key.toLowerCase().trim();
          if (!deletedCategoryIdsCache.includes(normKey) && val && typeof val === 'object') {
            const valObj = val as IncidentCategoryConfig;
            const validUrl = sanitizeImageUrl(valObj.imageUrl);
            cachedCategoryConfigs[normKey] = {
              ...(cachedCategoryConfigs[normKey] || {}),
              ...valObj,
              id: normKey,
              imageUrl: validUrl
            };
          }
        }
      }
    }
  } catch (e) {
    // Ignore local storage error
  }
}
delete cachedCategoryConfigs.police_checkpoint;
delete cachedCategoryConfigs.checkpoint;

const listeners: Set<() => void> = new Set();

function notifyListeners() {
  listeners.forEach(listener => {
    try {
      listener();
    } catch (e) {
      console.warn('Category image listener error:', e);
    }
  });
}

export function subscribeCategoryImages(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Normalizes category IDs and aliases (e.g. 'accident' -> 'crash')
 */
export function normalizeCategoryId(category?: string, subType?: string): string {
  if (!category && !subType) return 'general';
  
  const directId = (category || '').toLowerCase().trim();
  
  // 1. Direct ID match in active cached configurations
  if (directId && cachedCategoryConfigs[directId]) {
    return directId;
  }

  // 2. Exact Label match in active configurations
  const labelMatch = Object.values(cachedCategoryConfigs).find(
    c => c.label && c.label.toLowerCase().trim() === directId
  );
  if (labelMatch) {
    return labelMatch.id;
  }

  // 3. Heuristic & Alias resolution for legacy records or search queries
  const raw = `${category || ''} ${subType || ''}`.toLowerCase();
  
  if (raw.includes('spike') || raw.includes('trap')) return 'spiking';
  if (raw.includes('fatal')) return 'fatal_crash';
  if (raw.includes('crash') || raw.includes('accident') || raw.includes('collision')) return 'crash';
  if (raw.includes('stationary') || raw.includes('broken') || raw.includes('breakdown') || raw.includes('disabled') || raw.includes('towing')) return 'stationary';
  if (raw.includes('fire') || raw.includes('smoke') || raw.includes('veld')) return 'veld_fire';
  if (raw.includes('pothole') || raw.includes('crater') || raw.includes('road surface')) return 'pothole';
  if (raw.includes('roadwork') || raw.includes('construction') || raw.includes('maintenance')) return 'roadworks';
  if (raw.includes('traffic light') || raw.includes('robot') || raw.includes('lights out')) return 'traffic_lights';
  if (raw.includes('congestion') || raw.includes('jam') || raw.includes('gridlock') || raw.includes('queue') || raw.includes('delay') || raw.includes('backlog')) return 'congestion';
  if (raw.includes('sos') || raw.includes('emergency') || raw.includes('distress')) return 'sos';
  if (raw.includes('hazard') || raw.includes('debris') || raw.includes('obstruction')) return 'hazard';
  
  return directId || 'general';
}

/**
 * Gets the active default photo URL for an incident category (Returns real image or empty string, no stubbed/AI images)
 */
export function getCategoryDefaultImage(category?: string, subType?: string): string {
  const cleanId = (category || '').toLowerCase().trim();
  if (cleanId && cachedCategoryConfigs[cleanId]?.imageUrl) {
    const url = sanitizeImageUrl(cachedCategoryConfigs[cleanId].imageUrl);
    if (url && (url.startsWith('data:image/') || url.startsWith('http://') || url.startsWith('https://'))) return url;
  }

  const normId = normalizeCategoryId(category, subType);
  const cfg = cachedCategoryConfigs[normId];
  if (cfg && cfg.imageUrl) {
    const url = sanitizeImageUrl(cfg.imageUrl);
    if (url && (url.startsWith('data:image/') || url.startsWith('http://') || url.startsWith('https://'))) return url;
  }
  return '';
}

/**
 * Gets full configuration object for a specific category
 */
export function getCategoryConfig(categoryId: string): IncidentCategoryConfig {
  const cleanId = (categoryId || '').toLowerCase().trim();
  
  if (cleanId && cachedCategoryConfigs[cleanId]) {
    const cfg = cachedCategoryConfigs[cleanId];
    const validUrl = sanitizeImageUrl(cfg.imageUrl);
    return {
      ...cfg,
      id: cleanId,
      imageUrl: (validUrl && (validUrl.startsWith('data:image/') || validUrl.startsWith('http://') || validUrl.startsWith('https://'))) ? validUrl : ''
    };
  }

  const normId = normalizeCategoryId(categoryId);
  const cfg = cachedCategoryConfigs[normId];
  if (cfg) {
    const validUrl = sanitizeImageUrl(cfg.imageUrl);
    return {
      ...cfg,
      id: normId,
      imageUrl: (validUrl && (validUrl.startsWith('data:image/') || validUrl.startsWith('http://') || validUrl.startsWith('https://'))) ? validUrl : ''
    };
  }

  const defFallback = DEFAULT_CATEGORY_CONFIGS.find(d => d.id === cleanId || d.id === normId);
  if (defFallback) {
    return {
      ...defFallback,
      imageUrl: sanitizeImageUrl(defFallback.imageUrl)
    };
  }

  return {
    id: cleanId || 'general',
    label: cleanId || 'Incident Category',
    badge: 'ALERT',
    subtitle: '',
    imageUrl: '',
    iconName: 'AlertTriangle'
  };
}

/**
 * Gets all category configurations across defaults and live database updates
 */
export function getAllCategoryConfigs(): IncidentCategoryConfig[] {
  const configs: Record<string, IncidentCategoryConfig> = {};

  // 1. Seed system defaults
  for (const def of DEFAULT_CATEGORY_CONFIGS) {
    if (!deletedCategoryIdsCache.includes(def.id)) {
      configs[def.id] = { ...def };
    }
  }

  // 2. Overlay cached categories (which preserves admin updates and banner images)
  for (const [id, cfg] of Object.entries(cachedCategoryConfigs)) {
    if (!deletedCategoryIdsCache.includes(id) && cfg) {
      const existing: Partial<IncidentCategoryConfig> = configs[id] || {};
      const cfgObj = cfg as any;
      const validUrl = sanitizeImageUrl(cfgObj.imageUrl);
      configs[id] = {
        ...existing,
        ...cfgObj,
        id,
        label: cfgObj.label || existing.label || id,
        badge: cfgObj.badge || existing.badge || 'ALERT',
        subtitle: cfgObj.subtitle !== undefined ? cfgObj.subtitle : (existing.subtitle || ''),
        imageUrl: validUrl,
        iconName: cfgObj.iconName || existing.iconName || 'AlertTriangle'
      } as IncidentCategoryConfig;
    }
  }

  return Object.values(configs);
}

/**
 * Updates the cached category configurations in-memory and in localStorage
 */
export function setCachedCategoryDefaultImages(incoming: Record<string, any>, deletedIds?: string[]) {
  if (Array.isArray(deletedIds)) {
    deletedCategoryIdsCache = Array.from(new Set([...deletedCategoryIdsCache, ...deletedIds.map((s: string) => String(s).toLowerCase().trim())]));
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('deleted_category_ids_cache', JSON.stringify(deletedCategoryIdsCache));
      } catch (e) { /* ignore */ }
    }
  }

  const merged: Record<string, IncidentCategoryConfig> = {};

  // 1. Start with system defaults
  for (const def of DEFAULT_CATEGORY_CONFIGS) {
    if (!deletedCategoryIdsCache.includes(def.id)) {
      merged[def.id] = { ...def };
    }
  }

  // 2. Overlay current cache
  for (const [k, v] of Object.entries(cachedCategoryConfigs)) {
    if (!deletedCategoryIdsCache.includes(k) && v) {
      merged[k] = { ...merged[k], ...v };
    }
  }

  // 3. Merge incoming backend categories and photos
  if (incoming && typeof incoming === 'object') {
    for (const [k, v] of Object.entries(incoming)) {
      const normKey = k.toLowerCase().trim();
      if (!deletedCategoryIdsCache.includes(normKey) && v && typeof v === 'object') {
        const vObj = v as IncidentCategoryConfig;
        const validUrl = sanitizeImageUrl(vObj.imageUrl);
        merged[normKey] = {
          ...(merged[normKey] || {}),
          ...vObj,
          id: normKey,
          label: vObj.label || merged[normKey]?.label || normKey,
          badge: vObj.badge || merged[normKey]?.badge || 'ALERT',
          subtitle: vObj.subtitle !== undefined ? vObj.subtitle : (merged[normKey]?.subtitle || ''),
          imageUrl: validUrl,
          iconName: vObj.iconName || merged[normKey]?.iconName || 'AlertTriangle'
        };
      }
    }
  }

  for (const delId of deletedCategoryIdsCache) {
    delete merged[delId];
  }

  cachedCategoryConfigs = merged;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('incident_category_photos_cache', JSON.stringify(cachedCategoryConfigs));
    } catch (e) { /* ignore */ }
  }
  notifyListeners();
}

/**
 * Fetches the latest category default photos from the backend
 */
export async function fetchCategoryDefaultImages(): Promise<Record<string, IncidentCategoryConfig>> {
  try {
    const res = await fetch('/api/category-images', {
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    if (res.ok) {
      const data = await res.json();
      setCachedCategoryDefaultImages(data?.categoryImages || {}, data?.deletedCategoryIds || []);
    }
  } catch (err) {
    console.warn('Could not fetch category default images:', err);
  }
  return cachedCategoryConfigs;
}

/**
 * Updates a category's default photo (Admin operation)
 */
export async function saveCategoryDefaultImage(
  category: Partial<IncidentCategoryConfig> & { id: string },
  adminToken?: string,
  userEmail?: string,
  userRole?: string
): Promise<{ success: boolean; message?: string; category?: IncidentCategoryConfig }> {
  try {
    const session = getAdminSession();
    const token = adminToken || session?.token || (typeof window !== 'undefined' ? (sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken') || '') : '');
    const cleanEmail = userEmail || session?.email || 'charlesodendaal43@gmail.com';
    const cleanRole = userRole || session?.role || 'super_admin';
    const cleanId = category.id.toLowerCase().trim();

    // If previously deleted, un-delete it
    deletedCategoryIdsCache = deletedCategoryIdsCache.filter(id => id !== cleanId);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('deleted_category_ids_cache', JSON.stringify(deletedCategoryIdsCache));
      } catch (e) { /* ignore */ }
    }
    
    const sanitizedUrl = sanitizeImageUrl(category.imageUrl);

    // Optimistic update
    const current = cachedCategoryConfigs[cleanId] || getCategoryConfig(cleanId);
    const updated: IncidentCategoryConfig = {
      ...current,
      ...category,
      id: cleanId,
      imageUrl: sanitizedUrl,
      isSystemDefault: false,
      updatedAt: new Date().toISOString(),
      updatedBy: cleanEmail
    };
    cachedCategoryConfigs[cleanId] = updated;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('incident_category_photos_cache', JSON.stringify(cachedCategoryConfigs));
      } catch (e) { /* ignore */ }
    }
    notifyListeners();

    const res = await fetch('/api/admin/category-images', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-email': cleanEmail,
        'x-user-role': cleanRole,
        'x-admin-email': cleanEmail,
        'x-admin-role': cleanRole
      },
      body: JSON.stringify({ category: updated })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.categoryImages) {
        const cleaned: Record<string, IncidentCategoryConfig> = {};
        for (const [k, v] of Object.entries(data.categoryImages)) {
          const normK = k.toLowerCase().trim();
          if (!deletedCategoryIdsCache.includes(normK)) {
            cleaned[normK] = {
              ...(v as IncidentCategoryConfig),
              imageUrl: sanitizeImageUrl((v as any).imageUrl)
            };
          }
        }
        cachedCategoryConfigs = cleaned;
        notifyListeners();
      }
      return { success: true, category: updated };
    } else {
      const err = await res.json().catch(() => ({}));
      return { success: false, message: err.error || 'Server rejected update' };
    }
  } catch (err: any) {
    console.error('Error saving category default image:', err);
    return { success: false, message: err?.message || 'Network error updating category photo' };
  }
}

/**
 * Resets/clears a single category's banner photo
 */
export async function resetCategoryDefaultImage(
  categoryId: string,
  adminToken?: string,
  userEmail?: string,
  userRole?: string
): Promise<boolean> {
  const cleanId = categoryId.toLowerCase().trim();
  const base = DEFAULT_CATEGORY_CONFIGS.find(c => c.id === cleanId);
  if (!base) return false;

  deletedCategoryIdsCache = deletedCategoryIdsCache.filter(id => id !== cleanId);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('deleted_category_ids_cache', JSON.stringify(deletedCategoryIdsCache));
    } catch (e) { /* ignore */ }
  }

  return (await saveCategoryDefaultImage({
    id: cleanId,
    imageUrl: '',
    isSystemDefault: false
  }, adminToken, userEmail, userRole)).success;
}

/**
 * Clears all uploaded category banners across all categories
 */
export async function clearAllCategoryBanners(
  adminToken?: string,
  userEmail?: string,
  userRole?: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const session = getAdminSession();
    const token = adminToken || session?.token || (typeof window !== 'undefined' ? (sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken') || '') : '');
    const cleanEmail = userEmail || session?.email || 'charlesodendaal43@gmail.com';
    const cleanRole = userRole || session?.role || 'super_admin';

    // Clear all in memory
    for (const key of Object.keys(cachedCategoryConfigs)) {
      cachedCategoryConfigs[key] = {
        ...cachedCategoryConfigs[key],
        imageUrl: '',
        updatedAt: new Date().toISOString(),
        updatedBy: cleanEmail
      };
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('incident_category_photos_cache', JSON.stringify(cachedCategoryConfigs));
      } catch (e) { /* ignore */ }
    }
    notifyListeners();

    const res = await fetch('/api/admin/category-images/clear-all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-email': cleanEmail,
        'x-user-role': cleanRole,
        'x-admin-email': cleanEmail,
        'x-admin-role': cleanRole
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.categoryImages) {
        setCachedCategoryDefaultImages(data.categoryImages, data.deletedCategoryIds || []);
      }
      return { success: true, message: data.message || 'All category alert banners cleared successfully.' };
    } else {
      const err = await res.json().catch(() => ({}));
      return { success: false, message: err.error || 'Server failed to clear all category banners.' };
    }
  } catch (err: any) {
    console.error('Error clearing all category banners:', err);
    return { success: false, message: err?.message || 'Network error clearing banners' };
  }
}

/**
 * Resets all categories (alias for clearing banners and restoring default active categories)
 */
export async function resetAllCategoryDefaultImages(
  adminToken?: string,
  userEmail?: string,
  userRole?: string
): Promise<boolean> {
  const result = await clearAllCategoryBanners(adminToken, userEmail, userRole);
  return result.success;
}

/**
 * Creates a brand new custom incident category
 */
export async function createCustomCategory(
  category: {
    id: string;
    label: string;
    badge: string;
    subtitle: string;
    imageUrl: string;
    iconName?: string;
  },
  adminToken?: string,
  userEmail?: string,
  userRole?: string
): Promise<{ success: boolean; message?: string; category?: IncidentCategoryConfig }> {
  try {
    const session = getAdminSession();
    const token = adminToken || session?.token || (typeof window !== 'undefined' ? (sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken') || '') : '');
    const cleanEmail = userEmail || session?.email || 'charlesodendaal43@gmail.com';
    const cleanRole = userRole || session?.role || 'super_admin';
    const cleanId = category.id.toLowerCase().replace(/[^a-z0-9_]/g, '_').trim();
    
    // Undelete if previously in deleted cache
    deletedCategoryIdsCache = deletedCategoryIdsCache.filter(id => id !== cleanId);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('deleted_category_ids_cache', JSON.stringify(deletedCategoryIdsCache));
      } catch (e) { /* ignore */ }
    }

    const newCat: IncidentCategoryConfig = {
      id: cleanId,
      label: category.label.trim(),
      badge: (category.badge || 'ALERT').toUpperCase().trim(),
      subtitle: (category.subtitle || '').trim(),
      imageUrl: sanitizeImageUrl(category.imageUrl),
      iconName: category.iconName || 'AlertTriangle',
      isSystemDefault: false,
      updatedAt: new Date().toISOString(),
      updatedBy: cleanEmail
    };

    cachedCategoryConfigs[cleanId] = newCat;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('incident_category_photos_cache', JSON.stringify(cachedCategoryConfigs));
      } catch (e) { /* ignore */ }
    }
    notifyListeners();

    const res = await fetch('/api/admin/category-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-email': cleanEmail,
        'x-user-role': cleanRole,
        'x-admin-email': cleanEmail,
        'x-admin-role': cleanRole
      },
      body: JSON.stringify({ category: newCat, ...newCat })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.categoryImages) {
        const cleaned: Record<string, IncidentCategoryConfig> = {};
        for (const [k, v] of Object.entries(data.categoryImages)) {
          const normK = k.toLowerCase().trim();
          if (!deletedCategoryIdsCache.includes(normK)) {
            cleaned[normK] = {
              ...(v as IncidentCategoryConfig),
              imageUrl: sanitizeImageUrl((v as any).imageUrl)
            };
          }
        }
        cachedCategoryConfigs = cleaned;
      }
      if (data.category) {
        cachedCategoryConfigs[data.category.id] = {
          ...data.category,
          imageUrl: sanitizeImageUrl(data.category.imageUrl)
        };
      }
      notifyListeners();
      return { success: true, message: data.message || `Category "${newCat.label}" created!`, category: data.category || newCat };
    } else {
      const err = await res.json().catch(() => ({}));
      return { success: false, message: err.error || err.message || 'Server rejected category creation' };
    }
  } catch (err: any) {
    console.error('Error creating custom category:', err);
    return { success: false, message: err?.message || 'Network error creating category' };
  }
}

/**
 * Deletes a category (Custom or default)
 */
export async function deleteCustomCategory(
  categoryId: string,
  adminToken?: string,
  userEmail?: string,
  userRole?: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const session = getAdminSession();
    const token = adminToken || session?.token || (typeof window !== 'undefined' ? (sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken') || '') : '');
    const cleanEmail = userEmail || session?.email || 'charlesodendaal43@gmail.com';
    const cleanRole = userRole || session?.role || 'super_admin';
    const cleanId = categoryId.toLowerCase().trim();

    if (!deletedCategoryIdsCache.includes(cleanId)) {
      deletedCategoryIdsCache.push(cleanId);
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('deleted_category_ids_cache', JSON.stringify(deletedCategoryIdsCache));
      } catch (e) { /* ignore */ }
    }

    delete cachedCategoryConfigs[cleanId];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('incident_category_photos_cache', JSON.stringify(cachedCategoryConfigs));
      } catch (e) { /* ignore */ }
    }
    notifyListeners();

    const res = await fetch(`/api/admin/category-images/${encodeURIComponent(cleanId)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-email': cleanEmail,
        'x-user-role': cleanRole,
        'x-admin-email': cleanEmail,
        'x-admin-role': cleanRole
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.categoryImages) {
        const cleaned: Record<string, IncidentCategoryConfig> = {};
        for (const [k, v] of Object.entries(data.categoryImages)) {
          const normK = k.toLowerCase().trim();
          if (!deletedCategoryIdsCache.includes(normK)) {
            cleaned[normK] = {
              ...(v as IncidentCategoryConfig),
              imageUrl: sanitizeImageUrl((v as any).imageUrl)
            };
          }
        }
        cachedCategoryConfigs = cleaned;
        notifyListeners();
      }
      return { success: true, message: data.message || 'Category deleted' };
    } else {
      const err = await res.json().catch(() => ({}));
      return { success: false, message: err.error || 'Failed to delete category' };
    }
  } catch (err: any) {
    console.error('Error deleting category:', err);
    return { success: false, message: err?.message || 'Network error deleting category' };
  }
}
