import path from "path";
import fs from "fs";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAllPostRelatedIds } from "../utils/idUtils.ts";
import {
  initializeFirestore,
  getFirestore,
  setLogLevel,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  onSnapshot,
  Firestore,
  deleteDoc,
  collection,
  getDocs
} from "firebase/firestore";

interface FirebaseConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
  oAuthClientId?: string;
  recaptchaSiteKey?: string;
}

export function repairAdImageUrl(imageUrl?: string | null, bannerId?: string | null, title?: string | null): string {
  const normTitle = (title || '').toLowerCase();
  const id = bannerId || '';

  const getLocalAsset = (): string => {
    if (id === 'ad-1789199776018' || normTitle.includes('prostar') || normTitle.includes('electrical')) {
      return '/ads/banner-ad-1789199776018.jpg';
    }
    if (id === 'ad-1788602701946' || id === 'ad-adv-1788163429245' || normTitle.includes('raf claim') || normTitle.includes('need help with raf')) {
      return '/ads/banner-ad-adv-1788163429245.jpg';
    }
    if (id === 'ad-adv-1787747490904' || normTitle.includes('techrix')) {
      return '/ads/banner-techrix365.jpg';
    }
    if (id === 'ad-adv-1787747922672' || id === 'ad-adv-1787744318721' || normTitle.includes('auto check')) {
      return '/ads/banner-auto-check.jpg';
    }
    if (id === 'ad-default-2' || normTitle.includes('tyre') || normTitle.includes('pothole') || normTitle.includes('wheel')) {
      return '/ads/banner-tyre-fitment.jpg';
    }
    if (id === 'ad-1789458493209' || id === 'ad-default-1' || normTitle.includes('roadside') || normTitle.includes('towing') || normTitle.includes('aa')) {
      return '/ads/banner-roadside-assist.jpg';
    }
    return '/ads/banner-roadside-assist.jpg';
  };

  // 1. If a local image path or uploaded data URI is provided, evaluate it
  if (typeof imageUrl === 'string') {
    const trimmed = imageUrl.trim();

    // Preserve valid web URLs from live database (e.g. Firebase storage, CDN, advertiser image)
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }

    // Preserve valid local server paths (e.g., /ads/...)
    if (trimmed.startsWith('/ads/') || trimmed.startsWith('/')) {
      return trimmed;
    }

    // Preserve uploaded local base64/data images (unless it's an old truncated string)
    if (trimmed.startsWith('data:image/')) {
      if (trimmed.length >= 24900 && trimmed.length <= 25100) {
        return getLocalAsset();
      }
      return trimmed;
    }
  }

  // 2. Fallbacks for missing or empty images
  return getLocalAsset();
}

let dbInstance: Firestore | null = null;
let isInitialized = false;
let isApplyingRemoteChange = false;

function loadFirebaseConfig(): FirebaseConfig | null {
  const candidatePaths = [
    path.join(process.cwd(), "firebase-applet-config.json"),
    path.join(process.cwd(), "dist", "firebase-applet-config.json"),
    typeof __dirname !== "undefined" ? path.join(__dirname, "firebase-applet-config.json") : null,
    typeof __dirname !== "undefined" ? path.join(__dirname, "..", "firebase-applet-config.json") : null
  ].filter(Boolean) as string[];

  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && parsed.apiKey && parsed.projectId) {
          return parsed;
        }
      }
    } catch {
      // Continue to next path
    }
  }
  return null;
}

export function initFirebaseFirestore(): Firestore | null {
  if (dbInstance) return dbInstance;

  try {
    const config = loadFirebaseConfig();
    if (!config || !config.apiKey || !config.projectId) {
      console.warn("[FirebaseSync] No valid Firebase configuration found in firebase-applet-config.json");
      return null;
    }

    const app = getApps().length === 0 ? initializeApp(config) : getApp();
    const databaseId = config.firestoreDatabaseId || "(default)";
    try {
      setLogLevel('silent');
    } catch {}
    try {
      dbInstance = initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
        ignoreUndefinedProperties: true
      }, databaseId);
    } catch {
      dbInstance = getFirestore(app, databaseId);
    }
    isInitialized = true;
    console.log(`[FirebaseSync] Connected to Firestore project: ${config.projectId}, database: ${databaseId}`);
    return dbInstance;
  } catch (err) {
    console.error("[FirebaseSync] Failed to initialize Firebase Firestore:", err);
    return null;
  }
}

export async function testFirebaseConnection(): Promise<boolean> {
  const db = initFirebaseFirestore();
  if (!db) return false;
  try {
    await getDocFromServer(doc(db, "app_state", "connection_test"));
    return true;
  } catch (err: any) {
    if (isQuotaExhaustedError(err)) {
      handleQuotaError(err, "testFirebaseConnection");
      return false;
    }
    // A not-found error still confirms the server reached Firestore successfully
    if (err && (err.code === "not-found" || err.message?.includes("No document to update"))) {
      return true;
    }
    console.warn("[FirebaseSync] Connection test notice:", err?.message || err);
    return false;
  }
}

export async function fetchRemoteUsersOnce(): Promise<any[]> {
  const db = initFirebaseFirestore();
  if (!db) return [];
  try {
    const snap = await getDocFromServer(doc(db, "app_state", "users"));
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data?.registeredUsers)) {
        return data.registeredUsers;
      }
    }
  } catch (err: any) {
    handleQuotaError(err, "fetchRemoteUsersOnce");
  }
  return [];
}

export async function fetchSingleUserFromFirestore(email: string): Promise<any | null> {
  if (!email) return null;
  const db = initFirebaseFirestore();
  if (!db) return null;
  try {
    const cleanId = email.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "_");
    const userDocSnap = await getDoc(doc(db, "users", cleanId));
    if (userDocSnap.exists()) {
      return userDocSnap.data();
    }
    const stateSnap = await getDoc(doc(db, "app_state", "users"));
    if (stateSnap.exists()) {
      const users = stateSnap.data()?.registeredUsers;
      if (Array.isArray(users)) {
        const found = users.find((u: any) => u.email && u.email.toLowerCase() === email.trim().toLowerCase());
        if (found) return found;
      }
    }
  } catch (err: any) {
    handleQuotaError(err, `fetchSingleUserFromFirestore (${email})`);
  }
  return null;
}

export async function saveSingleUserToFirestore(user: any): Promise<void> {
  if (!user || !user.email || Date.now() < quotaExhaustedUntil) return;
  const db = initFirebaseFirestore();
  if (!db) return;
  try {
    const cleanId = user.email.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "_");
    await withTimeout(setDoc(doc(db, "users", cleanId), sanitizeForFirestore(user), { merge: true }), 4000);
  } catch (err: any) {
    handleQuotaError(err, `saveSingleUserToFirestore (${user.email})`);
  }
}

export async function saveHeroProfileToFirestore(hero: any): Promise<void> {
  if (!hero || !hero.email || Date.now() < quotaExhaustedUntil) return;
  const db = initFirebaseFirestore();
  if (!db) return;
  try {
    const cleanId = hero.email.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "_");
    await withTimeout(setDoc(doc(db, "community_heroes", cleanId), sanitizeForFirestore(hero), { merge: true }), 4000);
  } catch (err: any) {
    handleQuotaError(err, `saveHeroProfileToFirestore (${hero.email})`);
  }
}

export async function syncCommunityHeroesToFirestore(heroes: any[]): Promise<boolean> {
  if (!Array.isArray(heroes) || heroes.length === 0 || Date.now() < quotaExhaustedUntil) return false;
  const db = initFirebaseFirestore();
  if (!db) return false;
  try {
    const payload = {
      communityHeroes: sanitizeForFirestore(heroes),
      lastUpdated: new Date().toISOString()
    };
    await withTimeout(setDoc(doc(db, "app_state", "community_heroes"), payload, { merge: true }), 8000);
    return true;
  } catch (err: any) {
    handleQuotaError(err, "syncCommunityHeroesToFirestore");
    return false;
  }
}

export async function fetchCommunityHeroesFromFirestore(): Promise<any[] | null> {
  if (Date.now() < quotaExhaustedUntil) return null;
  const db = initFirebaseFirestore();
  if (!db) return null;
  try {
    const snap = await withTimeout(getDoc(doc(db, "app_state", "community_heroes")), 3500);
    if (snap.exists()) {
      const d = snap.data();
      if (Array.isArray(d?.communityHeroes)) {
        return d.communityHeroes;
      }
    }
  } catch (err: any) {
    handleQuotaError(err, "fetchCommunityHeroesFromFirestore");
  }
  return null;
}

export interface SyncStoreCallbacks {
  onUsersUpdate?: (users: any[]) => void;
  onCommunityHeroesUpdate?: (heroes: any[]) => void;
  onAdvertsUpdate?: (adSettings: any, orders: any[]) => void;
  onBannersUpdate?: (banners: any[]) => void;
  onOrdersUpdate?: (orders: any[]) => void;
  onSOSUpdate?: (sosRequests: any[]) => void;
  onGeneralUpdate?: (generalData: any) => void;
  onCategoriesUpdate?: (categories: Record<string, any>) => void;
  onFeedUpdate?: (feedItems: any[]) => void;
  onReportsUpdate?: (reports: any[]) => void;
  onVisitorStatsUpdate?: (stats: any) => void;
}

export function setupFirestoreRealtimeSync(callbacks: SyncStoreCallbacks) {
  const db = initFirebaseFirestore();
  if (!db) return () => {};

  console.log("[FirebaseSync] Setting up real-time snapshot listeners for adverts, SOS requests, settings, categories, users, and visitor telemetry...");

  // 1. Listen to app_state/users
  const unsubscribeUsers = onSnapshot(
    doc(db, "app_state", "users"),
    (snapshot) => {
      if (isApplyingRemoteChange) return;
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (Array.isArray(data?.registeredUsers) && callbacks.onUsersUpdate) {
          isApplyingRemoteChange = true;
          try {
            callbacks.onUsersUpdate(data.registeredUsers);
          } finally {
            isApplyingRemoteChange = false;
          }
        }
      }
    },
    (err) => handleQuotaError(err, "Users snapshot listener")
  );

  // 1b. Listen to app_state/visitor_stats (Persistent Platform Views and Reach Counter)
  const unsubscribeVisitorStats = onSnapshot(
    doc(db, "app_state", "visitor_stats"),
    (snapshot) => {
      if (isApplyingRemoteChange) return;
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (callbacks.onVisitorStatsUpdate && data && typeof data.totalVisitors === 'number') {
          isApplyingRemoteChange = true;
          try {
            callbacks.onVisitorStatsUpdate(data);
          } finally {
            isApplyingRemoteChange = false;
          }
        }
      }
    },
    (err) => handleQuotaError(err, "Visitor stats snapshot listener")
  );

  // 1c. Listen to app_state/community_heroes (Live Traffic Community Heroes reputation & badges)
  const unsubscribeCommunityHeroes = onSnapshot(
    doc(db, "app_state", "community_heroes"),
    (snapshot) => {
      if (isApplyingRemoteChange) return;
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (callbacks.onCommunityHeroesUpdate && Array.isArray(data?.communityHeroes)) {
          isApplyingRemoteChange = true;
          try {
            callbacks.onCommunityHeroesUpdate(data.communityHeroes);
          } finally {
            isApplyingRemoteChange = false;
          }
        }
      }
    },
    (err) => handleQuotaError(err, "Community heroes snapshot listener")
  );

  // 2. Listen to app_state/adverts (consolidated adverts settings document)
  const unsubscribeAdverts = onSnapshot(
    doc(db, "app_state", "adverts"),
    (snapshot) => {
      if (isApplyingRemoteChange) return;
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (callbacks.onAdvertsUpdate && (data?.feedAdSettings || data?.advertisingOrders)) {
          isApplyingRemoteChange = true;
          try {
            callbacks.onAdvertsUpdate(data.feedAdSettings, data.advertisingOrders || []);
          } finally {
            isApplyingRemoteChange = false;
          }
        }
      }
    },
    (err) => handleQuotaError(err, "Adverts snapshot listener")
  );

  // 2b. Listen to individual persistent ad_banners collection
  const unsubscribeBanners = onSnapshot(
    collection(db, "ad_banners"),
    (snapshot) => {
      if (isApplyingRemoteChange) return;
      const banners: any[] = [];
      snapshot.forEach((d) => {
        if (d.exists()) {
          banners.push(d.data());
        }
      });
      if (callbacks.onBannersUpdate) {
        isApplyingRemoteChange = true;
        try {
          callbacks.onBannersUpdate(banners);
        } finally {
          isApplyingRemoteChange = false;
        }
      }
    },
    (err) => handleQuotaError(err, "Ad Banners collection listener")
  );

  // 2b-2. Listen to individual persistent adverts collection
  const unsubscribeAdvertsCollection = onSnapshot(
    collection(db, "adverts"),
    (snapshot) => {
      if (isApplyingRemoteChange) return;
      const banners: any[] = [];
      snapshot.forEach((d) => {
        if (d.exists()) {
          banners.push(d.data());
        }
      });
      if (callbacks.onBannersUpdate && banners.length > 0) {
        isApplyingRemoteChange = true;
        try {
          callbacks.onBannersUpdate(banners);
        } finally {
          isApplyingRemoteChange = false;
        }
      }
    },
    (err) => handleQuotaError(err, "Adverts collection listener")
  );

  // 2c. Listen to individual persistent ad_orders collection
  const unsubscribeOrders = onSnapshot(
    collection(db, "ad_orders"),
    (snapshot) => {
      if (isApplyingRemoteChange) return;
      const orders: any[] = [];
      snapshot.forEach((d) => {
        if (d.exists()) {
          orders.push(d.data());
        }
      });
      if (callbacks.onOrdersUpdate) {
        isApplyingRemoteChange = true;
        try {
          callbacks.onOrdersUpdate(orders);
        } finally {
          isApplyingRemoteChange = false;
        }
      }
    },
    (err) => handleQuotaError(err, "Ad Orders collection listener")
  );

  // 2c-2. Listen to individual persistent advertising_orders collection
  const unsubscribeAdvertisingOrders = onSnapshot(
    collection(db, "advertising_orders"),
    (snapshot) => {
      if (isApplyingRemoteChange) return;
      const orders: any[] = [];
      snapshot.forEach((d) => {
        if (d.exists()) {
          orders.push(d.data());
        }
      });
      if (callbacks.onOrdersUpdate && orders.length > 0) {
        isApplyingRemoteChange = true;
        try {
          callbacks.onOrdersUpdate(orders);
        } finally {
          isApplyingRemoteChange = false;
        }
      }
    },
    (err) => handleQuotaError(err, "Advertising Orders collection listener")
  );

  // 3. Listen to app_state/sos (Emergency SOS distress calls & patrol dispatches)
  const unsubscribeSOS = onSnapshot(
    doc(db, "app_state", "sos"),
    (snapshot) => {
      if (isApplyingRemoteChange) return;
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (callbacks.onSOSUpdate && Array.isArray(data?.sosRequests)) {
          isApplyingRemoteChange = true;
          try {
            callbacks.onSOSUpdate(data.sosRequests);
          } finally {
            isApplyingRemoteChange = false;
          }
        }
      }
    },
    (err) => handleQuotaError(err, "SOS snapshot listener")
  );

  // 4. Listen to app_state/general
  const unsubscribeGeneral = onSnapshot(
    doc(db, "app_state", "general"),
    (snapshot) => {
      if (isApplyingRemoteChange) return;
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (callbacks.onGeneralUpdate && data) {
          isApplyingRemoteChange = true;
          try {
            callbacks.onGeneralUpdate(data);
          } finally {
            isApplyingRemoteChange = false;
          }
        }
      }
    },
    (err) => handleQuotaError(err, "General snapshot listener")
  );

  // 5. Listen to individual category configs collection for robust real-time updates
  const unsubscribeCategories = onSnapshot(
    collection(db, "category_configs"),
    (snapshot) => {
      if (isApplyingRemoteChange) return;
      if (callbacks.onCategoriesUpdate) {
        const catMap: Record<string, any> = {};
        snapshot.forEach((d) => {
          const data = d.data();
          if (data && data.id) {
            catMap[String(data.id).toLowerCase().trim()] = data;
          }
        });
        isApplyingRemoteChange = true;
        try {
          callbacks.onCategoriesUpdate(catMap);
        } finally {
          isApplyingRemoteChange = false;
        }
      }
    },
    (err) => handleQuotaError(err, "Categories snapshot listener")
  );

  // 6. Listen to posts collection for real-time feed updates
  const unsubscribePosts = onSnapshot(
    collection(db, "posts"),
    (snapshot) => {
      if (isApplyingRemoteChange) return;
      const items: any[] = [];
      snapshot.forEach((d) => {
        if (d.exists()) {
          items.push(d.data());
        }
      });
      if (callbacks.onFeedUpdate && items.length > 0) {
        isApplyingRemoteChange = true;
        try {
          callbacks.onFeedUpdate(items);
        } finally {
          isApplyingRemoteChange = false;
        }
      }
    },
    (err) => handleQuotaError(err, "Posts snapshot listener")
  );

  // 6b. Listen to app_state/feed doc for aggregate feed updates
  const unsubscribeFeedDoc = onSnapshot(
    doc(db, "app_state", "feed"),
    (snapshot) => {
      if (isApplyingRemoteChange) return;
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (Array.isArray(data?.feedItems) && callbacks.onFeedUpdate && data.feedItems.length > 0) {
          isApplyingRemoteChange = true;
          try {
            callbacks.onFeedUpdate(data.feedItems);
          } finally {
            isApplyingRemoteChange = false;
          }
        }
      }
    },
    (err) => handleQuotaError(err, "Feed doc snapshot listener")
  );

  // 7. Listen to reports collection
  const unsubscribeReports = onSnapshot(
    collection(db, "reports"),
    (snapshot) => {
      if (isApplyingRemoteChange) return;
      const reports: any[] = [];
      snapshot.forEach((d) => {
        if (d.exists()) {
          reports.push(d.data());
        }
      });
      if (callbacks.onReportsUpdate && reports.length > 0) {
        isApplyingRemoteChange = true;
        try {
          callbacks.onReportsUpdate(reports);
        } finally {
          isApplyingRemoteChange = false;
        }
      }
    },
    (err) => handleQuotaError(err, "Reports snapshot listener")
  );

  return () => {
    unsubscribeUsers();
    unsubscribeVisitorStats();
    unsubscribeCommunityHeroes();
    unsubscribeAdverts();
    unsubscribeBanners();
    unsubscribeAdvertsCollection();
    unsubscribeOrders();
    unsubscribeAdvertisingOrders();
    unsubscribeSOS();
    unsubscribeGeneral();
    unsubscribeCategories();
    unsubscribePosts();
    unsubscribeFeedDoc();
    unsubscribeReports();
  };
}

// Timeout helper to guarantee Firestore async calls never hang server requests
export async function withTimeout<T>(promise: Promise<T>, ms = 12000): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Firestore operation timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

// Helper to deeply strip undefined values so Firestore setDoc never fails
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined) return null as unknown as T;
  if (data === null || typeof data !== "object") return data;
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (value !== undefined) {
      result[key] = sanitizeForFirestore(value);
    }
  }
  return result as T;
}

// Rate-limiting backoff for free-tier write quota exhaustion
const QUOTA_STATUS_FILE = path.join(process.cwd(), ".firestore_quota_status.json");

let quotaExhaustedUntil = (() => {
  try {
    if (fs.existsSync(QUOTA_STATUS_FILE)) {
      const raw = fs.readFileSync(QUOTA_STATUS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (typeof parsed?.quotaExhaustedUntil === "number" && parsed.quotaExhaustedUntil > Date.now()) {
        return parsed.quotaExhaustedUntil;
      }
    }
  } catch (e) {
    // Ignore read errors
  }
  return 0;
})();

let hasLoggedQuotaWarning = false;

function setQuotaExhaustedBackoff(durationMs: number = 2 * 60 * 1000) {
  quotaExhaustedUntil = Date.now() + durationMs;
  try {
    fs.writeFileSync(QUOTA_STATUS_FILE, JSON.stringify({
      quotaExhaustedUntil,
      updatedAt: new Date().toISOString(),
      reason: "Daily free-tier write units exceeded"
    }), "utf-8");
  } catch (e) {
    // Ignore write errors
  }
}

// Cached hashes of the last synced payloads to avoid duplicate writes
const lastSyncedHashes = new Map<string, string>();

function isQuotaExhaustedError(err: any): boolean {
  if (!err) return false;
  const code = err.code || "";
  const msg = err.message || String(err);
  return (
    code === "resource-exhausted" ||
    code === 8 ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("Quota limit exceeded") ||
    msg.includes("Quota exceeded") ||
    msg.includes("quota metric") ||
    msg.includes("Free daily write units") ||
    msg.includes("Free daily read units") ||
    msg.includes("free tier database") ||
    msg.includes("cannot exceed free quota limits") ||
    msg.includes("quota limits are reset")
  );
}

function isTransientStreamError(err: any): boolean {
  if (!err) return false;
  const msg = err.message || String(err);
  const code = err.code || "";
  return (
    code === 1 ||
    code === 13 ||
    code === "cancelled" ||
    code === "internal" ||
    msg.includes("INTERNAL: Received RST_STREAM") ||
    msg.includes("GrpcConnection RPC 'Listen' stream") ||
    msg.includes("RST_STREAM with code 2") ||
    msg.includes("Disconnecting idle stream") ||
    msg.includes("Timed out waiting for new targets") ||
    msg.includes("CANCELLED")
  );
}

function handleQuotaError(err: any, context: string) {
  if (isQuotaExhaustedError(err)) {
    // 15-minute backoff so the server does not hammer Firestore when daily read/write quota is reached
    setQuotaExhaustedBackoff(15 * 60 * 1000);
    if (!hasLoggedQuotaWarning) {
      console.warn(
        `[FirebaseSync] Firestore daily free-tier quota limit reached (${context}). Operating smoothly on local storage cache until quota window resets.`
      );
      hasLoggedQuotaWarning = true;
    }
  } else if (isTransientStreamError(err)) {
    // Expected normal gRPC / WebChannel stream lifecycle (e.g. idle timeout / auto-reconnect)
    return;
  } else {
    console.warn(`[FirebaseSync] Notice during ${context}:`, err?.message || err);
  }
}

let cachedAdverts: { feedAdSettings?: any; advertisingOrders?: any[] } | null = null;
let lastAdvertsFetch = 0;
const ADVERTS_CACHE_TTL = 30000; // 30-second cache to prevent quota exhaustion while keeping fresh

export async function fetchRemoteAdvertsOnce(force = false): Promise<{ feedAdSettings?: any; advertisingOrders?: any[] } | null> {
  const now = Date.now();
  if (now < quotaExhaustedUntil) {
    return cachedAdverts;
  }
  if (!force && cachedAdverts && (now - lastAdvertsFetch) < ADVERTS_CACHE_TTL) {
    return cachedAdverts;
  }
  const db = initFirebaseFirestore();
  if (!db) return cachedAdverts;
  try {
    let feedAdSettingsResult: any = null;
    let advertisingOrdersResult: any[] = [];
    let deletedBannerIds: string[] = ['ad-default-1', 'ad-default-2'];
    const bannersMap = new Map<string, any>();
    const ordersMap = new Map<string, any>();

    // 1. Fetch aggregate adverts settings doc
    try {
      const snap = await getDoc(doc(db, "app_state", "adverts"));
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data?.deletedBannerIds)) {
          deletedBannerIds = Array.from(new Set([...deletedBannerIds, ...data.deletedBannerIds]));
        }
        feedAdSettingsResult = data?.feedAdSettings || null;
        if (Array.isArray(feedAdSettingsResult?.banners)) {
          for (const b of feedAdSettingsResult.banners) {
            if (b && b.id && !deletedBannerIds.includes(b.id)) {
              bannersMap.set(b.id, {
                ...b,
                imageUrl: repairAdImageUrl(b.imageUrl, b.id, b.title)
              });
            }
          }
        }
        if (Array.isArray(data?.advertisingOrders)) {
          for (const o of data.advertisingOrders) {
            if (o && o.id) ordersMap.set(o.id, o);
          }
        }
      }
    } catch (docErr) {
      if (isQuotaExhaustedError(docErr)) {
        handleQuotaError(docErr, "fetching app_state/adverts");
        return cachedAdverts;
      }
      console.warn("[FirebaseSync] Notice fetching app_state/adverts:", docErr);
    }

    // 2. Fetch individual persistent banner documents from `ad_banners` collection
    try {
      const bannerColSnap = await getDocs(collection(db, "ad_banners"));
      if (!bannerColSnap.empty) {
        bannerColSnap.forEach((docSnap) => {
          if (docSnap.exists()) {
            const b = docSnap.data();
            if (b && b.id && !deletedBannerIds.includes(b.id)) {
              const existing = bannersMap.get(b.id);
              bannersMap.set(b.id, {
                ...existing,
                ...b,
                impressions: Math.max(existing?.impressions || 0, b.impressions || 0),
                clicks: Math.max(existing?.clicks || 0, b.clicks || 0),
                imageUrl: repairAdImageUrl(b.imageUrl || existing?.imageUrl, b.id, b.title || existing?.title)
              });
            }
          }
        });
      }
    } catch (colErr) {
      if (isQuotaExhaustedError(colErr)) {
        handleQuotaError(colErr, "fetching ad_banners collection");
        return cachedAdverts;
      }
      console.warn("[FirebaseSync] Notice fetching ad_banners collection:", colErr);
    }

    // 2b. Also fetch from `adverts` collection (source of truth specified in blueprint)
    try {
      const advertsColSnap = await getDocs(collection(db, "adverts"));
      if (!advertsColSnap.empty) {
        advertsColSnap.forEach((docSnap) => {
          if (docSnap.exists()) {
            const b = docSnap.data();
            if (b && b.id && !deletedBannerIds.includes(b.id)) {
              const existing = bannersMap.get(b.id);
              bannersMap.set(b.id, {
                ...existing,
                ...b,
                impressions: Math.max(existing?.impressions || 0, b.impressions || 0),
                clicks: Math.max(existing?.clicks || 0, b.clicks || 0),
                imageUrl: repairAdImageUrl(b.imageUrl || existing?.imageUrl, b.id, b.title || existing?.title)
              });
            }
          }
        });
      }
    } catch (advColErr) {
      if (isQuotaExhaustedError(advColErr)) {
        handleQuotaError(advColErr, "fetching adverts collection");
        return cachedAdverts;
      }
      console.warn("[FirebaseSync] Notice fetching adverts collection:", advColErr);
    }

    // 3. Fetch individual persistent order documents from `ad_orders` collection
    try {
      const orderColSnap = await getDocs(collection(db, "ad_orders"));
      if (!orderColSnap.empty) {
        orderColSnap.forEach((docSnap) => {
          if (docSnap.exists()) {
            const o = docSnap.data();
            if (o && o.id) {
              const existing = ordersMap.get(o.id);
              ordersMap.set(o.id, { ...existing, ...o });
            }
          }
        });
      }
    } catch (orderColErr) {
      if (isQuotaExhaustedError(orderColErr)) {
        handleQuotaError(orderColErr, "fetching ad_orders collection");
        return cachedAdverts;
      }
      console.warn("[FirebaseSync] Notice fetching ad_orders collection:", orderColErr);
    }

    // 3b. Also fetch from `advertising_orders` collection
    try {
      const advOrderColSnap = await getDocs(collection(db, "advertising_orders"));
      if (!advOrderColSnap.empty) {
        advOrderColSnap.forEach((docSnap) => {
          if (docSnap.exists()) {
            const o = docSnap.data();
            if (o && o.id) {
              const existing = ordersMap.get(o.id);
              ordersMap.set(o.id, { ...existing, ...o });
            }
          }
        });
      }
    } catch (advOrderColErr) {
      if (isQuotaExhaustedError(advOrderColErr)) {
        handleQuotaError(advOrderColErr, "fetching advertising_orders collection");
        return cachedAdverts;
      }
      console.warn("[FirebaseSync] Notice fetching advertising_orders collection:", advOrderColErr);
    }

    const mergedBanners = Array.from(bannersMap.values())
      .filter((b: any) => b && b.id && !deletedBannerIds.includes(b.id))
      .map((b: any) => {
        return {
          ...b,
          imageUrl: repairAdImageUrl(b.imageUrl, b.id, b.title),
          targetUrl: b.targetUrl || ''
        };
      });

    const mergedOrders = Array.from(ordersMap.values()).map((o: any) => {
      return {
        ...o,
        adImageUrl: repairAdImageUrl(o.adImageUrl, o.bannerId, o.businessName),
        website: o.website || ''
      };
    });

    if (!feedAdSettingsResult) {
      feedAdSettingsResult = {
        isEnabled: true,
        showSponsoredBadge: true,
        allowDismiss: true,
        autoRotateTopBanners: true,
        rotationIntervalSeconds: 10,
        showOnDashboard: true,
        banners: mergedBanners
      };
    } else {
      feedAdSettingsResult.banners = mergedBanners;
    }

    advertisingOrdersResult = mergedOrders;

    const res = {
      feedAdSettings: feedAdSettingsResult,
      advertisingOrders: advertisingOrdersResult,
      deletedBannerIds
    };
    cachedAdverts = res;
    lastAdvertsFetch = Date.now();
    return res;
  } catch (err: any) {
    if (isQuotaExhaustedError(err)) {
      handleQuotaError(err, "fetchRemoteAdvertsOnce");
    } else {
      console.warn("[FirebaseSync] Notice fetching remote adverts once:", err?.message || err);
    }
  }
  return cachedAdverts;
}

export async function fetchRemoteGeneralOnce(): Promise<any | null> {
  const db = initFirebaseFirestore();
  if (!db) return null;
  try {
    const snap = await getDocFromServer(doc(db, "app_state", "general"));
    if (snap.exists()) {
      return snap.data();
    }
  } catch (err: any) {
    handleQuotaError(err, "fetchRemoteGeneralOnce");
  }
  return null;
}

export async function fetchRemoteCategoriesOnce(): Promise<{
  categoryImages: Record<string, any>;
  deletedCategoryIds: string[];
}> {
  if (Date.now() < quotaExhaustedUntil) {
    return { categoryImages: {}, deletedCategoryIds: [] };
  }
  const db = initFirebaseFirestore();
  if (!db) return { categoryImages: {}, deletedCategoryIds: [] };
  const categoryImages: Record<string, any> = {};
  let deletedCategoryIds: string[] = [];

  try {
    // 1. Fetch individual category documents from category_configs collection
    try {
      const snapshot = await getDocs(collection(db, "category_configs"));
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && data.id) {
          const normId = String(data.id).toLowerCase().trim();
          const cleanImg = (data.imageUrl && typeof data.imageUrl === 'string' && !data.imageUrl.includes('unsplash.com')) ? data.imageUrl.trim() : '';
          categoryImages[normId] = {
            id: normId,
            label: data.label || normId,
            badge: data.badge || 'ALERT',
            subtitle: data.subtitle || '',
            imageUrl: cleanImg,
            iconName: data.iconName || 'AlertTriangle',
            isSystemDefault: !!data.isSystemDefault,
            updatedAt: data.updatedAt || new Date().toISOString(),
            updatedBy: data.updatedBy || 'Super Admin'
          };
        }
      });
    } catch (colErr) {
      if (isQuotaExhaustedError(colErr)) {
        handleQuotaError(colErr, "fetchRemoteCategoriesOnce (category_configs)");
        return { categoryImages, deletedCategoryIds };
      }
      console.warn("[FirebaseSync] Notice fetching category_configs collection:", colErr);
    }

    // 2. Also check app_state/general for deletedCategoryIds & categoryDefaultImages backup
    try {
      const genSnap = await getDocFromServer(doc(db, "app_state", "general"));
      if (genSnap.exists()) {
        const genData = genSnap.data();
        if (Array.isArray(genData?.deletedCategoryIds)) {
          deletedCategoryIds = genData.deletedCategoryIds.map((s: string) => String(s).toLowerCase().trim());
        }
        if (genData?.categoryDefaultImages && typeof genData.categoryDefaultImages === 'object') {
          const rawMap = genData.categoryDefaultImages;
          // Check for images stored under alias keys
          const aliasImgMap: Record<string, string> = {
            veld_fire: rawMap['veld_fire_alert']?.imageUrl || '',
            stationary: rawMap['stationary_vehicle_alert']?.imageUrl || '',
            pothole: rawMap['pothole_alert']?.imageUrl || '',
            roadworks: rawMap['roadworks_alert']?.imageUrl || '',
          };

          for (const [k, v] of Object.entries(rawMap)) {
            const normKey = k.toLowerCase().trim();
            if (!deletedCategoryIds.includes(normKey) && v && typeof v === 'object') {
              const vObj = v as any;
              const aliasImg = aliasImgMap[normKey] || '';
              const rawImg = (vObj.imageUrl && typeof vObj.imageUrl === 'string' && !vObj.imageUrl.includes('unsplash.com')) ? vObj.imageUrl.trim() : '';
              const cleanUrl = rawImg || aliasImg;
              
              // Retain category configuration with sanitized image URL
              categoryImages[normKey] = {
                ...(categoryImages[normKey] || {}),
                ...vObj,
                id: normKey,
                imageUrl: (cleanUrl && (cleanUrl.startsWith('data:image/') || cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://'))) ? cleanUrl : ''
              };
            }
          }
        }
      }
    } catch (genErr) {
      if (isQuotaExhaustedError(genErr)) {
        handleQuotaError(genErr, "fetchRemoteCategoriesOnce (app_state/general)");
      }
    }
  } catch (err: any) {
    handleQuotaError(err, "fetchRemoteCategoriesOnce");
  }

  // Purge explicitly deleted categories
  for (const delId of deletedCategoryIds) {
    delete categoryImages[delId];
  }

  return { categoryImages, deletedCategoryIds };
}

// ----------------------------------------------------
// 📰 REMOTE FEEDS PERSISTENCE & REAL-TIME SYNC
// ----------------------------------------------------
let cachedFeeds: any[] | null = null;
let lastFeedsFetch = 0;
const FEEDS_CACHE_TTL = 30000; // 30 seconds cache to protect quota limits

export async function fetchRemoteFeedItemsOnce(force = false): Promise<any[]> {
  const now = Date.now();
  if (now < quotaExhaustedUntil) {
    return cachedFeeds || [];
  }
  if (!force && cachedFeeds && (now - lastFeedsFetch) < FEEDS_CACHE_TTL) {
    return cachedFeeds;
  }
  const db = initFirebaseFirestore();
  if (!db) return cachedFeeds || [];
  try {
    const feedsMap = new Map<string, any>();

    // 1. Fetch from app_state/feed doc
    try {
      const feedSnap = await getDoc(doc(db, "app_state", "feed"));
      if (feedSnap.exists()) {
        const data = feedSnap.data();
        if (Array.isArray(data?.feedItems)) {
          for (const item of data.feedItems) {
            if (item && item.id) feedsMap.set(item.id, item);
          }
        }
      }
    } catch (docErr) {
      if (isQuotaExhaustedError(docErr)) {
        handleQuotaError(docErr, "fetchRemoteFeedItemsOnce (app_state/feed)");
        return cachedFeeds || [];
      }
      console.warn("[FirebaseSync] Notice fetching app_state/feed:", docErr);
    }

    // 2. Fetch from posts collection
    try {
      const postsSnap = await getDocs(collection(db, "posts"));
      if (!postsSnap.empty) {
        postsSnap.forEach((docSnap) => {
          if (docSnap.exists()) {
            const p = docSnap.data();
            if (p && p.id) {
              const existing = feedsMap.get(p.id);
              feedsMap.set(p.id, { ...existing, ...p });
            }
          }
        });
      }
    } catch (colErr) {
      if (isQuotaExhaustedError(colErr)) {
        handleQuotaError(colErr, "fetchRemoteFeedItemsOnce (posts)");
        return cachedFeeds || [];
      }
      console.warn("[FirebaseSync] Notice fetching posts collection:", colErr);
    }

    const merged = Array.from(feedsMap.values());
    if (merged.length > 0) {
      cachedFeeds = merged;
      lastFeedsFetch = Date.now();
      return merged;
    }
    return cachedFeeds || [];
  } catch (err: any) {
    if (isQuotaExhaustedError(err)) {
      handleQuotaError(err, "fetchRemoteFeedItemsOnce");
    } else {
      console.warn("[FirebaseSync] Notice fetching remote feed items once:", err?.message || err);
    }
    return cachedFeeds || [];
  }
}

export async function saveFeedItemToFirestore(feedItem: any): Promise<boolean> {
  if (!feedItem || !feedItem.id || Date.now() < quotaExhaustedUntil) return false;
  const db = initFirebaseFirestore();
  if (!db) return false;
  try {
    cachedFeeds = null; // Invalidate cache
    const sanitized = sanitizeForFirestore(feedItem);
    await withTimeout(setDoc(doc(db, "posts", feedItem.id), sanitized, { merge: true }), 4000);
    // Also update aggregated app_state/feed list
    try {
      const feedDocSnap = await withTimeout(getDoc(doc(db, "app_state", "feed")), 2500);
      const existingItems = (feedDocSnap.exists() && Array.isArray(feedDocSnap.data()?.feedItems))
        ? feedDocSnap.data().feedItems
        : [];
      const updatedList = [sanitized, ...existingItems.filter((f: any) => f.id !== feedItem.id)].slice(0, 80);
      await withTimeout(setDoc(doc(db, "app_state", "feed"), {
        feedItems: updatedList,
        updatedAt: new Date().toISOString()
      }, { merge: true }), 4000);
    } catch (_) {}
    console.log(`[FirebaseSync] Feed item saved to Firestore (/posts/${feedItem.id}): ${feedItem.headline || feedItem.title || feedItem.content?.slice(0, 30)}`);
    return true;
  } catch (err: any) {
    handleQuotaError(err, `saveFeedItemToFirestore (${feedItem.id})`);
    return false;
  }
}

export async function deleteFeedItemFromFirestore(feedId: string): Promise<void> {
  if (Date.now() < quotaExhaustedUntil) return;
  const db = initFirebaseFirestore();
  if (!db || !feedId) return;
  try {
    cachedFeeds = null;
    const relatedIds = getAllPostRelatedIds(feedId);
    for (const rid of relatedIds) {
      await withTimeout(deleteDoc(doc(db, "posts", rid)), 3000).catch(() => {});
    }
    // Also remove all related IDs from app_state/feed doc
    try {
      const feedDocSnap = await withTimeout(getDoc(doc(db, "app_state", "feed")), 2500);
      if (feedDocSnap.exists()) {
        const currentItems = feedDocSnap.data()?.feedItems || [];
        const filtered = currentItems.filter((f: any) => !relatedIds.includes(f.id));
        await withTimeout(setDoc(doc(db, "app_state", "feed"), {
          feedItems: filtered,
          updatedAt: new Date().toISOString()
        }, { merge: true }), 4000);
      }
    } catch (_) {}
    console.log(`[FirebaseSync] Feed item and related IDs deleted from Firestore: ${feedId}`);
  } catch (err: any) {
    handleQuotaError(err, `deleteFeedItemFromFirestore (${feedId})`);
  }
}

export async function syncFeedItemsToFirestore(items: any[]): Promise<boolean> {
  if (!Array.isArray(items) || Date.now() < quotaExhaustedUntil) return false;
  const db = initFirebaseFirestore();
  if (!db) return false;
  try {
    const sanitizedItems = items.slice(0, 80).map(item => sanitizeForFirestore(item));
    await withTimeout(setDoc(doc(db, "app_state", "feed"), {
      feedItems: sanitizedItems,
      updatedAt: new Date().toISOString()
    }, { merge: true }), 4000);
    for (const item of sanitizedItems.slice(0, 25)) {
      if (item && item.id) {
        await withTimeout(setDoc(doc(db, "posts", item.id), item, { merge: true }), 3000);
      }
    }
    return true;
  } catch (err: any) {
    handleQuotaError(err, "syncFeedItemsToFirestore");
    return false;
  }
}

export async function saveReportToFirestore(report: any): Promise<boolean> {
  if (!report || !report.id || Date.now() < quotaExhaustedUntil) return false;
  const db = initFirebaseFirestore();
  if (!db) return false;
  try {
    const sanitized = sanitizeForFirestore(report);
    await withTimeout(setDoc(doc(db, "reports", report.id), sanitized, { merge: true }), 4000);
    return true;
  } catch (err: any) {
    handleQuotaError(err, `saveReportToFirestore (${report.id})`);
    return false;
  }
}

export async function deleteReportFromFirestore(reportId: string): Promise<void> {
  if (Date.now() < quotaExhaustedUntil) return;
  const db = initFirebaseFirestore();
  if (!db || !reportId) return;
  try {
    const relatedIds = getAllPostRelatedIds(reportId);
    for (const rid of relatedIds) {
      await withTimeout(deleteDoc(doc(db, "reports", rid)), 3000).catch(() => {});
      await withTimeout(deleteDoc(doc(db, "posts", rid)), 3000).catch(() => {});
    }
    // Also clean up from app_state/feed
    try {
      const feedDocSnap = await withTimeout(getDoc(doc(db, "app_state", "feed")), 2500);
      if (feedDocSnap.exists()) {
        const currentItems = feedDocSnap.data()?.feedItems || [];
        const filtered = currentItems.filter((f: any) => !relatedIds.includes(f.id));
        await withTimeout(setDoc(doc(db, "app_state", "feed"), {
          feedItems: filtered,
          updatedAt: new Date().toISOString()
        }, { merge: true }), 4000);
      }
    } catch (_) {}
  } catch (err: any) {
    handleQuotaError(err, `deleteReportFromFirestore (${reportId})`);
  }
}

export async function saveCategoryToFirestore(category: any): Promise<boolean> {
  if (!category || !category.id || Date.now() < quotaExhaustedUntil) return false;
  const db = initFirebaseFirestore();
  if (!db) return false;
  try {
    const normId = String(category.id).toLowerCase().trim();
    const docRef = doc(db, "category_configs", normId);
    await withTimeout(setDoc(docRef, sanitizeForFirestore({
      ...category,
      id: normId,
      updatedAt: category.updatedAt || new Date().toISOString()
    }), { merge: true }), 4000);
    return true;
  } catch (err: any) {
    handleQuotaError(err, `saveCategoryToFirestore (${category.id})`);
    return false;
  }
}

export async function deleteCategoryFromFirestore(categoryId: string): Promise<boolean> {
  if (!categoryId || Date.now() < quotaExhaustedUntil) return false;
  const db = initFirebaseFirestore();
  if (!db) return false;
  try {
    const normId = String(categoryId).toLowerCase().trim();
    await withTimeout(deleteDoc(doc(db, "category_configs", normId)), 4000);
    return true;
  } catch (err: any) {
    handleQuotaError(err, `deleteCategoryFromFirestore (${categoryId})`);
    return false;
  }
}

export async function saveAdBannerToFirestore(banner: any): Promise<boolean> {
  if (!banner || !banner.id || Date.now() < quotaExhaustedUntil) return false;
  const db = initFirebaseFirestore();
  if (!db) return false;
  try {
    cachedAdverts = null; // Invalidate cache
    const sanitized = sanitizeForFirestore(banner);
    // 1. Save to ad_banners collection
    await withTimeout(setDoc(doc(db, "ad_banners", banner.id), sanitized, { merge: true }), 10000);
    // 2. Save to adverts collection
    await withTimeout(setDoc(doc(db, "adverts", banner.id), sanitized, { merge: true }), 10000);

    console.log(`[FirebaseSync] Ad banner synced to Firestore (ad_banners & adverts / ${banner.id}): ${banner.title} [Impressions: ${banner.impressions || 0}, Clicks: ${banner.clicks || 0}]`);
    return true;
  } catch (err: any) {
    handleQuotaError(err, `saveAdBannerToFirestore (${banner.id})`);
    return false;
  }
}

export async function deleteAdBannerFromFirestore(bannerId: string): Promise<void> {
  if (Date.now() < quotaExhaustedUntil) return;
  const db = initFirebaseFirestore();
  if (!db || !bannerId) return;
  try {
    cachedAdverts = null; // Invalidate cache
    await withTimeout(deleteDoc(doc(db, "ad_banners", bannerId)), 4000);
    await withTimeout(deleteDoc(doc(db, "adverts", bannerId)), 4000);

    // Also update app_state/adverts to purge the banner and record tombstone
    try {
      const stateDocRef = doc(db, "app_state", "adverts");
      const stateSnap = await getDoc(stateDocRef);
      if (stateSnap.exists()) {
        const data = stateSnap.data();
        const existingBanners = Array.isArray(data?.feedAdSettings?.banners) ? data.feedAdSettings.banners : [];
        const updatedBanners = existingBanners.filter((b: any) => b && b.id !== bannerId);
        const existingSummaries = Array.isArray(data?.feedAdSettings?.bannerSummaries) ? data.feedAdSettings.bannerSummaries : [];
        const updatedSummaries = existingSummaries.filter((b: any) => b && b.id !== bannerId);
        const existingDeleted = Array.isArray(data?.deletedBannerIds) ? data.deletedBannerIds : [];
        const updatedDeleted = Array.from(new Set(['ad-default-1', 'ad-default-2', ...existingDeleted, bannerId]));
        await withTimeout(setDoc(stateDocRef, {
          ...data,
          feedAdSettings: {
            ...data.feedAdSettings,
            banners: updatedBanners,
            bannerSummaries: updatedSummaries,
            bannerCount: updatedBanners.length
          },
          deletedBannerIds: updatedDeleted
        }, { merge: true }), 4000);
      }
    } catch (stErr) {
      console.warn("[FirebaseSync] Warning updating app_state/adverts on banner deletion:", stErr);
    }

    console.log(`[FirebaseSync] Ad banner deleted from Firestore (ad_banners & adverts & app_state / ${bannerId}).`);
  } catch (err: any) {
    handleQuotaError(err, `deleteAdBannerFromFirestore (${bannerId})`);
  }
}

export async function saveAdOrderToFirestore(order: any): Promise<boolean> {
  if (!order || !order.id || Date.now() < quotaExhaustedUntil) return false;
  const db = initFirebaseFirestore();
  if (!db) return false;
  try {
    cachedAdverts = null; // Invalidate cache
    const sanitized = sanitizeForFirestore(order);
    await withTimeout(setDoc(doc(db, "ad_orders", order.id), sanitized, { merge: true }), 4000);
    await withTimeout(setDoc(doc(db, "advertising_orders", order.id), sanitized, { merge: true }), 4000);
    console.log(`[FirebaseSync] Ad order saved to Firestore (ad_orders & advertising_orders / ${order.id}): ${order.packageName || order.businessName}`);
    return true;
  } catch (err: any) {
    handleQuotaError(err, `saveAdOrderToFirestore (${order.id})`);
    return false;
  }
}

export async function deleteAdOrderFromFirestore(orderId: string): Promise<void> {
  if (Date.now() < quotaExhaustedUntil) return;
  const db = initFirebaseFirestore();
  if (!db || !orderId) return;
  try {
    cachedAdverts = null; // Invalidate cache
    await withTimeout(deleteDoc(doc(db, "ad_orders", orderId)), 4000);
    await withTimeout(deleteDoc(doc(db, "advertising_orders", orderId)), 4000);
    console.log(`[FirebaseSync] Ad order deleted from Firestore (ad_orders & advertising_orders / ${orderId}).`);
  } catch (err: any) {
    handleQuotaError(err, `deleteAdOrderFromFirestore (${orderId})`);
  }
}

export async function syncAdvertsToFirestore(feedAdSettings: any, advertisingOrders: any[] = [], deletedBannerIds: string[] = []): Promise<boolean> {
  if (Date.now() < quotaExhaustedUntil) return false;
  const db = initFirebaseFirestore();
  if (!db) return false;
  try {
    const now = new Date().toISOString();
    const effectiveDeletedBannerIds = Array.from(new Set(['ad-default-1', 'ad-default-2', ...(deletedBannerIds || [])]));

    const rawBanners = Array.isArray(feedAdSettings?.banners) ? feedAdSettings.banners : [];
    const cleanBanners = rawBanners
      .filter((b: any) => b && b.id && !effectiveDeletedBannerIds.includes(b.id))
      .map((b: any) => {
        return {
          ...b,
          imageUrl: repairAdImageUrl(b.imageUrl, b.id, b.title),
          targetUrl: b.targetUrl || ''
        };
      });

    // Sync global settings and consolidated banners to app_state/adverts
    const cleanSettings = {
      isEnabled: feedAdSettings?.isEnabled ?? true,
      feedAdPlacement: feedAdSettings?.feedAdPlacement || 'random',
      showSponsoredBadge: feedAdSettings?.showSponsoredBadge ?? true,
      allowDismiss: feedAdSettings?.allowDismiss ?? true,
      autoRotateTopBanners: feedAdSettings?.autoRotateTopBanners ?? true,
      rotationIntervalSeconds: feedAdSettings?.rotationIntervalSeconds ?? 10,
      showOnDashboard: feedAdSettings?.showOnDashboard ?? true,
      lastExpirationCheckAt: feedAdSettings?.lastExpirationCheckAt,
      updatedAt: feedAdSettings?.updatedAt || now,
      updatedBy: feedAdSettings?.updatedBy || 'System',
      bannerCount: cleanBanners.length,
      bannerSummaries: cleanBanners.map((b: any) => ({
        id: b.id,
        title: b.title,
        targetUrl: b.targetUrl,
        enabled: b.enabled,
        status: b.status,
        updatedAt: b.updatedAt
      })),
      banners: cleanBanners
    };

    const advertsPayload = {
      feedAdSettings: cleanSettings,
      deletedBannerIds: effectiveDeletedBannerIds,
      advertisingOrders: (advertisingOrders || []).map((o: any) => {
        let adImg = o.adImageUrl;
        if (o.id === 'AD-ORD-1787747490904' && (!adImg || adImg.length === 25000)) {
          adImg = '/ads/banner-techrix365.jpg';
        } else if (o.id === 'AD-ORD-1788163429245' && (!adImg || adImg.length === 25000)) {
          adImg = '/ads/banner-need-help-raf.jpg';
        } else if (o.id === 'AD-ORD-1787744318721' && (!adImg || adImg.length === 25000)) {
          adImg = '/ads/banner-auto-check.jpg';
        }
        let web = o.website;
        if (o.id === 'AD-ORD-1787747490904' && (!web || web === 'https://livetraffic.co.za')) {
          web = 'https://techrix365.com';
        }
        return {
          ...o,
          website: web,
          adImageUrl: adImg
        };
      }),
      updatedAt: now
    };

    await withTimeout(setDoc(doc(db, "app_state", "adverts"), sanitizeForFirestore(advertsPayload), { merge: true }), 10000);
    cachedAdverts = null; // Invalidate cache
    console.log(`[FirebaseSync] Adverts synchronized to Firestore app_state/adverts (${cleanBanners.length} banners, ${advertisingOrders?.length || 0} orders).`);
    return true;
  } catch (err: any) {
    handleQuotaError(err, "syncAdvertsToFirestore");
    return false;
  }
}

// Debounce state writes to Firestore so rapid edits don't produce unnecessary write costs
let saveTimeout: NodeJS.Timeout | null = null;
let pendingSyncState: {
  reports?: any[];
  feedItems?: any[];
  registeredUsers?: any[];
  feedAdSettings?: any;
  advertisingOrders?: any[];
  visitorStats?: any;
  sosRequests?: any[];
  donations?: any[];
  donationStats?: any;
  socialHashtagSettings?: any;
  categoryDefaultImages?: any;
  deletedCategoryIds?: string[];
  deletedFeedIds?: string[];
  deletedReportIds?: string[];
  deletedBannerIds?: string[];
  drivingCourseSettings?: any;
  drivingCourseRegistrations?: any[];
  partnerApiKeys?: any[];
} = {};

export function syncDataToFirestore(state: {
  reports?: any[];
  feedItems?: any[];
  registeredUsers?: any[];
  feedAdSettings?: any;
  advertisingOrders?: any[];
  visitorStats?: any;
  sosRequests?: any[];
  donations?: any[];
  donationStats?: any;
  socialHashtagSettings?: any;
  categoryDefaultImages?: any;
  deletedCategoryIds?: string[];
  deletedFeedIds?: string[];
  deletedReportIds?: string[];
  deletedBannerIds?: string[];
  drivingCourseSettings?: any;
  drivingCourseRegistrations?: any[];
  partnerApiKeys?: any[];
}) {
  if (isApplyingRemoteChange) return;

  // Merge state into pendingSyncState accumulator
  pendingSyncState = {
    ...pendingSyncState,
    ...state
  };

  // If we are in a temporary rate limit cooldown period, skip immediate dispatch
  if (Date.now() < quotaExhaustedUntil) {
    return;
  }

  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(async () => {
    if (Date.now() < quotaExhaustedUntil) return;

    const db = initFirebaseFirestore();
    if (!db) return;

    const currentState = { ...pendingSyncState };

    try {
      const now = new Date().toISOString();

      // 1. Sync Users document if changed
      if (currentState.registeredUsers && Array.isArray(currentState.registeredUsers) && currentState.registeredUsers.length > 0) {
        if (Date.now() < quotaExhaustedUntil) return;
        const usersPayload = {
          registeredUsers: currentState.registeredUsers,
          count: currentState.registeredUsers.length,
          updatedAt: now
        };
        const usersHash = JSON.stringify(currentState.registeredUsers);
        if (lastSyncedHashes.get("users") !== usersHash) {
          try {
            await setDoc(doc(db, "app_state", "users"), sanitizeForFirestore(usersPayload), { merge: true });
            lastSyncedHashes.set("users", usersHash);
          } catch (uErr: any) {
            if (isQuotaExhaustedError(uErr)) {
              handleQuotaError(uErr, "syncDataToFirestore (users)");
              return;
            }
            console.warn("[FirebaseSync] Users sync warning:", uErr?.message || uErr);
          }
        }
      }

      // 2. Sync Adverts & Orders document if changed
      if (currentState.feedAdSettings || currentState.advertisingOrders) {
        if (Date.now() >= quotaExhaustedUntil) {
          try {
            await syncAdvertsToFirestore(currentState.feedAdSettings, currentState.advertisingOrders);
          } catch (aggErr: any) {
            if (isQuotaExhaustedError(aggErr)) {
              handleQuotaError(aggErr, "syncDataToFirestore (adverts)");
              return;
            }
            console.warn("[FirebaseSync] Adverts sync warning:", aggErr?.message || aggErr);
          }
        }
      }

      // 3. Sync Emergency SOS Distress Calls & Patrol Dispatches if changed
      if (currentState.sosRequests && Array.isArray(currentState.sosRequests)) {
        if (Date.now() < quotaExhaustedUntil) return;
        const sosPayload = {
          sosRequests: currentState.sosRequests,
          count: currentState.sosRequests.length,
          updatedAt: now
        };
        const sosHash = JSON.stringify(currentState.sosRequests);
        if (lastSyncedHashes.get("sos") !== sosHash) {
          try {
            await setDoc(doc(db, "app_state", "sos"), sanitizeForFirestore(sosPayload), { merge: true });
            lastSyncedHashes.set("sos", sosHash);
          } catch (sErr: any) {
            if (isQuotaExhaustedError(sErr)) {
              handleQuotaError(sErr, "syncDataToFirestore (sos)");
              return;
            }
            console.warn("[FirebaseSync] SOS sync warning:", sErr?.message || sErr);
          }
        }
      }

      // 4. Sync Visitor Stats document if changed (Ensuring monotonic increase - never overwrite with smaller numbers)
      if (currentState.visitorStats && typeof currentState.visitorStats === 'object') {
        if (Date.now() < quotaExhaustedUntil) {
          const currentTotal = typeof currentState.visitorStats.totalVisitors === 'number' ? currentState.visitorStats.totalVisitors : 73000;
          const currentSessions = typeof currentState.visitorStats.uniqueSessionsCount === 'number' ? currentState.visitorStats.uniqueSessionsCount : 7389;
          
          const visitorPayload = {
            totalVisitors: Math.max(currentTotal, 73000),
            uniqueSessionsCount: Math.max(currentSessions, 7389),
            lastUpdated: currentState.visitorStats.lastUpdated || now
          };
          const visitorHash = JSON.stringify(visitorPayload);
          if (lastSyncedHashes.get("visitor_stats") !== visitorHash) {
            try {
              // Safety: Fetch remote snapshot to prevent overwriting with stale / smaller counts
              let remoteTotal = 0;
              let remoteSessions = 0;
              try {
                const snap = await withTimeout(getDoc(doc(db, "app_state", "visitor_stats")), 2500);
                if (snap.exists()) {
                  const d = snap.data();
                  remoteTotal = typeof d?.totalVisitors === 'number' ? d.totalVisitors : 0;
                  remoteSessions = typeof d?.uniqueSessionsCount === 'number' ? d.uniqueSessionsCount : 0;
                }
              } catch {}

              visitorPayload.totalVisitors = Math.max(visitorPayload.totalVisitors, remoteTotal, 73000);
              visitorPayload.uniqueSessionsCount = Math.max(visitorPayload.uniqueSessionsCount, remoteSessions, 7389);

              // Update in-memory state if remote was higher
              if (visitorPayload.totalVisitors > currentState.visitorStats.totalVisitors) {
                currentState.visitorStats.totalVisitors = visitorPayload.totalVisitors;
              }
              if (visitorPayload.uniqueSessionsCount > currentState.visitorStats.uniqueSessionsCount) {
                currentState.visitorStats.uniqueSessionsCount = visitorPayload.uniqueSessionsCount;
              }

              await setDoc(doc(db, "app_state", "visitor_stats"), sanitizeForFirestore(visitorPayload), { merge: true });
              lastSyncedHashes.set("visitor_stats", JSON.stringify(visitorPayload));
            } catch (vErr: any) {
              if (isQuotaExhaustedError(vErr)) {
                handleQuotaError(vErr, "syncDataToFirestore (visitor_stats)");
                return;
              }
              console.warn("[FirebaseSync] Visitor stats sync warning:", vErr?.message || vErr);
            }
          }
        }
      }

      // 5. Sync General settings document if changed
      if (Date.now() < quotaExhaustedUntil) return;
      const generalPayload = {
        socialHashtagSettings: currentState.socialHashtagSettings || null,
        categoryDefaultImages: currentState.categoryDefaultImages || null,
        deletedCategoryIds: currentState.deletedCategoryIds || [],
        deletedFeedIds: currentState.deletedFeedIds || [],
        deletedReportIds: currentState.deletedReportIds || [],
        deletedBannerIds: currentState.deletedBannerIds || ['ad-default-1', 'ad-default-2'],
        drivingCourseSettings: currentState.drivingCourseSettings || null,
        drivingCourseRegistrations: currentState.drivingCourseRegistrations || [],
        donations: currentState.donations || [],
        donationStats: currentState.donationStats || null,
        visitorStats: currentState.visitorStats || null,
        partnerApiKeys: currentState.partnerApiKeys || [],
        updatedAt: now
      };
      const generalHash = JSON.stringify({
        s: currentState.socialHashtagSettings,
        cat: currentState.categoryDefaultImages,
        delCat: currentState.deletedCategoryIds,
        delFeed: currentState.deletedFeedIds?.length || 0,
        delRep: currentState.deletedReportIds?.length || 0,
        delBan: currentState.deletedBannerIds?.length || 0,
        d: currentState.drivingCourseSettings,
        reg: currentState.drivingCourseRegistrations?.length || 0,
        don: currentState.donations?.length || 0,
        dst: currentState.donationStats,
        v: currentState.visitorStats?.totalVisitors,
        pk: currentState.partnerApiKeys?.length || 0
      });
      if (lastSyncedHashes.get("general") !== generalHash) {
        try {
          await setDoc(doc(db, "app_state", "general"), sanitizeForFirestore(generalPayload), { merge: true });
          lastSyncedHashes.set("general", generalHash);
        } catch (gErr: any) {
          if (isQuotaExhaustedError(gErr)) {
            handleQuotaError(gErr, "syncDataToFirestore (general)");
            return;
          }
          console.warn("[FirebaseSync] General sync warning:", gErr?.message || gErr);
        }
      }

      hasLoggedQuotaWarning = false;
    } catch (err: any) {
      handleQuotaError(err, "syncDataToFirestore");
    }
  }, 800);
}

export async function deleteDocFromFirestore(collectionName: string, docId: string) {
  if (Date.now() < quotaExhaustedUntil) return;
  const db = initFirebaseFirestore();
  if (!db || !docId) return;
  try {
    await deleteDoc(doc(db, collectionName, docId));
  } catch (err: any) {
    handleQuotaError(err, `deleteDocFromFirestore (${collectionName}/${docId})`);
  }
}

export async function syncVisitorStatsToFirestore(visitorStats: any): Promise<boolean> {
  if (!visitorStats || Date.now() < quotaExhaustedUntil) return false;
  const db = initFirebaseFirestore();
  if (!db) return false;
  try {
    // Read current remote stats first to strictly prevent overwriting with a smaller count
    let remoteTotal = 0;
    let remoteSessions = 0;
    try {
      const snap = await withTimeout(getDoc(doc(db, "app_state", "visitor_stats")), 3500);
      if (snap.exists()) {
        const d = snap.data();
        remoteTotal = typeof d?.totalVisitors === 'number' ? d.totalVisitors : 0;
        remoteSessions = typeof d?.uniqueSessionsCount === 'number' ? d.uniqueSessionsCount : 0;
      }
    } catch {}

    const incomingTotal = typeof visitorStats.totalVisitors === 'number' ? visitorStats.totalVisitors : 73000;
    const incomingSessions = typeof visitorStats.uniqueSessionsCount === 'number' ? visitorStats.uniqueSessionsCount : 7389;

    const finalTotal = Math.max(incomingTotal, remoteTotal, 73000);
    const finalSessions = Math.max(incomingSessions, remoteSessions, 7389);

    // Update local object so caller memory is in sync with highest count
    if (finalTotal > visitorStats.totalVisitors) {
      visitorStats.totalVisitors = finalTotal;
    }
    if (finalSessions > visitorStats.uniqueSessionsCount) {
      visitorStats.uniqueSessionsCount = finalSessions;
    }

    const payload = {
      totalVisitors: finalTotal,
      uniqueSessionsCount: finalSessions,
      lastUpdated: visitorStats.lastUpdated || new Date().toISOString()
    };
    await withTimeout(setDoc(doc(db, "app_state", "visitor_stats"), sanitizeForFirestore(payload), { merge: true }), 10000);
    return true;
  } catch (err: any) {
    handleQuotaError(err, "syncVisitorStatsToFirestore");
    return false;
  }
}

export async function fetchVisitorStatsFromFirestore(): Promise<any> {
  if (Date.now() < quotaExhaustedUntil) return null;
  const db = initFirebaseFirestore();
  if (!db) return null;
  try {
    const snap = await withTimeout(getDoc(doc(db, "app_state", "visitor_stats")), 3500);
    if (snap.exists()) {
      return snap.data();
    }
    const genSnap = await withTimeout(getDoc(doc(db, "app_state", "general")), 3500);
    if (genSnap.exists()) {
      return genSnap.data()?.visitorStats || null;
    }
    return null;
  } catch (err: any) {
    handleQuotaError(err, "fetchVisitorStatsFromFirestore");
    return null;
  }
}


