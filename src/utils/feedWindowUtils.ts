import { FeedItem } from '../types';
import { parseDateToMillis, formatReadableDateTime, formatSATime } from './dateParser';

export const isPermittedAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return (
    clean === 'charlesodendaal43@gmail.com' ||
    clean === 'admin@livetraffic.co.za' ||
    clean === 'charles@salesbarn.co.za' ||
    clean === 'charles2@salesbarn.co.za' ||
    clean === 'sylvester@trafficlive.co.za'
  );
};

/**
 * Check if a FeedItem is an official Administrator or Dispatch unit broadcast
 */
export const isItemAdminPost = (item: FeedItem | null | undefined): boolean => {
  if (!item) return false;
  // If explicitly flagged as user post, it is NEVER an admin post
  if ((item as any).isUserPost === true) {
    return false;
  }
  if ((item as any).displayAsAdmin === true || (item as any).forceAdminStyle === true) {
    return true;
  }
  // If posted by a normal user or driver role, it is strictly NOT an admin post
  if (
    (item as any).postedByAdminRole === 'user' ||
    (item as any).postedByAdminRole === 'driver' ||
    (item as any).postedByAdminRole === 'motorist' ||
    (item as any).postedByAdminRole === 'member'
  ) {
    return false;
  }
  // Community reports, driver reports, and official scraper feeds are NEVER admin posts
  if (item.source === 'community' || item.source === 'user' || item.source === 'itraffic' || item.source === 'twitter' || item.source === 'whatsapp') {
    return false;
  }
  if (item.source === 'admin_dispatch') {
    return true;
  }
  // If posted by a user email that is not an authorized admin email
  if (item.postedByUserEmail && !isPermittedAdminEmail(item.postedByUserEmail)) {
    return false;
  }
  const author = (item.author || '').toLowerCase();
  if (
    author.includes('admin patrol command') || 
    author.includes('admin dispatch') || 
    author.includes('patrol hq') || 
    author === '🛡️ admin post' ||
    author === 'admin post'
  ) {
    return true;
  }
  return false;
};

/**
 * Check if an item was submitted by a regular user / community motorist (not an official admin broadcast or official highway agency)
 */
export const isItemUserPost = (item: FeedItem | null | undefined): boolean => {
  if (!item) return false;
  if ((item as any).displayAsAdmin === true || (item as any).forceAdminStyle === true) return false;
  if ((item as any).isUserPost === true) return true;
  if (
    (item as any).postedByAdminRole === 'user' ||
    (item as any).postedByAdminRole === 'driver' ||
    (item as any).postedByAdminRole === 'motorist' ||
    (item as any).postedByAdminRole === 'member'
  ) {
    return true;
  }
  const src = (item.source as string) || '';
  if (src === 'community' || src === 'user' || src === 'user_post') return true;
  if (src === 'itraffic' || src === 'sanral' || src === 'n3tc' || src === 'official' || src === 'google_maps_scan') {
    return false;
  }
  if (isItemAdminPost(item)) return false;
  if (item.postedByUserEmail && !isPermittedAdminEmail(item.postedByUserEmail)) return true;
  if (item.postedByUserEmail && !item.postedByAdminEmail) return true;
  if (item.author && !item.author.toLowerCase().includes('admin') && !item.author.toLowerCase().includes('patrol') && (src === 'community' || !src)) return true;
  return false;
};

/**
 * Check if a user post or alert has been officially verified by an administrator/patrol
 */
export const isItemAdminVerified = (item: FeedItem | null | undefined): boolean => {
  if (!item) return false;
  if (item.adminVerified === true || item.verifiedByAdmin === true) return true;
  if (Boolean(item.approvedByAdminName || item.approvedByAdminId || item.approvedAt)) return true;
  if (typeof item.author === 'string' && (item.author.toLowerCase().includes('verified report') || item.author.toLowerCase().startsWith('verified report'))) return true;
  if (item.source === 'admin_dispatch' || Boolean(item.postedByAdminName)) return true;
  if (item.verified === true && (item.isUserPost === false || isItemAdminPost(item) || Boolean(item.approvedByAdminName))) {
    return true;
  }
  return false;
};

/**
 * Check if an item is a user post that has NOT yet been verified by an administrator
 */
export const isItemUnverifiedUserPost = (item: FeedItem | null | undefined): boolean => {
  if (!item) return false;
  if (!isItemUserPost(item)) return false;
  // If explicitly verified by admin or has admin approval attribution, it's verified
  if (isItemAdminVerified(item)) {
    return false;
  }
  if (item.verified && (item.approvedByAdminName || item.postedByAdminName || item.approvedByAdminId)) {
    return false;
  }
  // Otherwise, user post is unverified
  return true;
};

/**
 * Extract numeric epoch millisecond timestamp from any FeedItem
 */
export const getItemTimestampValue = (item: FeedItem | null | undefined): number => {
  if (!item) return 0;
  const ts = item.timestamp || item.lastUpdated || item.startTime || (item as any).createdAt || '';
  if (!ts) return 0;
  return parseDateToMillis(ts);
};

/**
 * Calculate the dynamic Live Feed Time Window.
 * The window represents the active operational horizon of the live feed stream
 * (past 6 hours rolling window up to current time).
 */
export interface LiveFeedWindowBounds {
  windowStart: number;
  windowEnd: number;
  windowHours: number;
  earliestLiveItemDate: string | null;
  activeWindowLabel: string;
}

export const getLiveFeedWindowBounds = (
  feedItems: FeedItem[] = [],
  defaultWindowHours: number = 2
): LiveFeedWindowBounds => {
  const now = Date.now();
  const windowStart = now - defaultWindowHours * 60 * 60 * 1000;

  return {
    windowStart,
    windowEnd: now + 5 * 60 * 1000, // 5 min future buffer for clock drifts
    windowHours: defaultWindowHours,
    earliestLiveItemDate: new Date(windowStart).toISOString(),
    activeWindowLabel: `Last ${defaultWindowHours}h (Live Feed Window)`
  };
};

/**
 * Check if a single FeedItem is within the active live feed time frame.
 * If no items fall in the window, permits older data so the feed is never empty.
 */
export const isItemInLiveFeedWindow = (
  item: FeedItem,
  allFeedItems: FeedItem[] = [],
  defaultWindowHours: number = 2
): boolean => {
  const itemTime = getItemTimestampValue(item);
  if (!itemTime) return true; // If no timestamp, default keep

  const { windowStart, windowEnd } = getLiveFeedWindowBounds(allFeedItems, defaultWindowHours);

  // If item is within the rolling 2-hour window
  if (itemTime >= windowStart && itemTime <= windowEnd) {
    return true;
  }

  // "Do not let the feed be empty, use older data":
  // If no items in the entire collection fall into the fresh window, keep older items!
  const hasAnyFresh = allFeedItems.some(i => {
    const t = getItemTimestampValue(i);
    return t >= windowStart && t <= windowEnd;
  });

  if (!hasAnyFresh) {
    return true;
  }

  return false;
};

/**
 * Filter a list of FeedItems with priority to the rolling live window,
 * but NEVER leaves the feed empty — seamlessly falls back to older data!
 */
export const filterFeedItemsInLiveWindow = (
  items: FeedItem[] = [],
  defaultWindowHours: number = 2
): FeedItem[] => {
  if (!items || items.length === 0) return [];

  const { windowStart } = getLiveFeedWindowBounds(items, defaultWindowHours);

  const withinWindow = items.filter((item) => {
    const itemTime = getItemTimestampValue(item);
    if (!itemTime) return true;
    return itemTime >= windowStart;
  });

  // "Do not let the feed be empty, use older data":
  // If no items fall inside the strict window, use older data sorted newest first!
  if (withinWindow.length === 0) {
    return [...items].sort((a, b) => getItemTimestampValue(b) - getItemTimestampValue(a));
  }

  // If there are fewer than 5 items in the fresh window, also append older items
  // so the feed is informative and never sparse!
  if (withinWindow.length < 5 && items.length > withinWindow.length) {
    const seen = new Set(withinWindow.map(i => i.id));
    const older = items
      .filter(i => !seen.has(i.id))
      .sort((a, b) => getItemTimestampValue(b) - getItemTimestampValue(a));
    return [...withinWindow, ...older.slice(0, 15 - withinWindow.length)];
  }

  return withinWindow;
};

/**
 * Split admin posts into active within live feed window and expired/dropped outside window.
 * If active is empty, uses older posts so admin channel is never empty.
 */
export const separateAdminPostsByWindow = (
  adminPosts: FeedItem[] = [],
  allFeedItems: FeedItem[] = [],
  defaultWindowHours: number = 2
): { activePosts: FeedItem[]; expiredPosts: FeedItem[] } => {
  const { windowStart } = getLiveFeedWindowBounds(allFeedItems, defaultWindowHours);

  const activePosts: FeedItem[] = [];
  const expiredPosts: FeedItem[] = [];

  for (const post of adminPosts) {
    const postTime = getItemTimestampValue(post);
    if (!postTime || postTime >= windowStart) {
      activePosts.push(post);
    } else {
      expiredPosts.push(post);
    }
  }

  // "Do not let the feed be empty, use older data":
  if (activePosts.length === 0 && expiredPosts.length > 0) {
    return { activePosts: [...expiredPosts], expiredPosts: [] };
  }

  return { activePosts, expiredPosts };
};
