/**
 * Unified identifier utility for Feed Items, Reports, and Admin Posts.
 * Ensures consistent cleaning, prefix matching, and cascaded deletions across
 * in-memory stores, state hooks, and Firestore collections.
 */

export function extractCleanPostId(rawId: string | number | undefined | null): string {
  if (rawId === undefined || rawId === null) return '';
  return String(rawId)
    .trim()
    .replace(/^feed-dispatch-rep-/, '')
    .replace(/^feed-dispatch-/, '')
    .replace(/^dispatch-/, '')
    .replace(/^feed-pothole-don-/, '')
    .replace(/^feed-pothole-/, '')
    .replace(/^pothole-don-/, '')
    .replace(/^pothole-/, '')
    .replace(/^feed-report-rep-/, '')
    .replace(/^feed-report-/, '')
    .replace(/^feed-auto-rep-/, '')
    .replace(/^feed-auto-/, '')
    .replace(/^feed-admin-/, '')
    .replace(/^feed-shared-/, '')
    .replace(/^feed-resolved-/, '')
    .replace(/^feed-rep-/, '')
    .replace(/^feed-temp-/, '')
    .replace(/^feed-/, '')
    .replace(/^report-rep-/, '')
    .replace(/^report-/, '')
    .replace(/^rep-temp-/, '')
    .replace(/^temp-/, '')
    .replace(/^rep-gmap-/, '')
    .replace(/^gmap-/, '')
    .replace(/^rep-/, '')
    .replace(/^post-/, '');
}

export function getAllPostRelatedIds(rawId: string | number | undefined | null): string[] {
  if (rawId === undefined || rawId === null) return [];
  const strId = String(rawId).trim();
  if (!strId) return [];

  const clean = extractCleanPostId(strId);
  const ids = new Set<string>();

  ids.add(strId);

  if (clean) {
    ids.add(clean);
    ids.add(`rep-${clean}`);
    ids.add(`report-${clean}`);
    ids.add(`post-${clean}`);
    ids.add(`feed-${clean}`);
    ids.add(`feed-rep-${clean}`);
    ids.add(`feed-report-${clean}`);
    ids.add(`feed-report-rep-${clean}`);
    ids.add(`feed-auto-${clean}`);
    ids.add(`feed-auto-rep-${clean}`);
    ids.add(`feed-admin-${clean}`);
    ids.add(`feed-shared-${clean}`);
    ids.add(`feed-resolved-${clean}`);
    ids.add(`feed-dispatch-${clean}`);
    ids.add(`feed-dispatch-rep-${clean}`);
    ids.add(`rep-dispatch-${clean}`);
    ids.add(`dispatch-${clean}`);
    ids.add(`pothole-${clean}`);
    ids.add(`feed-pothole-${clean}`);
    ids.add(`rep-pothole-${clean}`);
    ids.add(`feed-pothole-don-${clean}`);
    ids.add(`gmap-${clean}`);
    ids.add(`rep-gmap-${clean}`);
    ids.add(`feed-gmap-${clean}`);
  }

  // Also include direct feed prefix if not already present
  if (!strId.startsWith('feed-')) {
    ids.add(`feed-${strId}`);
  }
  if (!strId.startsWith('rep-')) {
    ids.add(`rep-${strId}`);
  }

  return Array.from(ids);
}

export function isPostIdMatch(idA: string | undefined | null, idB: string | undefined | null): boolean {
  if (!idA || !idB) return false;
  if (idA === idB) return true;
  const cleanA = extractCleanPostId(idA);
  const cleanB = extractCleanPostId(idB);
  return Boolean(cleanA && cleanB && cleanA === cleanB);
}

export function isPostDeleted(
  id: string | undefined | null,
  deletedFeedIds: string[] = [],
  deletedReportIds: string[] = []
): boolean {
  if (!id) return false;
  const strId = String(id).trim();

  // Fast direct lookup
  if (deletedFeedIds.includes(strId) || deletedReportIds.includes(strId)) {
    return true;
  }

  const clean = extractCleanPostId(strId);
  if (!clean) return false;

  // Direct clean match
  if (deletedFeedIds.includes(clean) || deletedReportIds.includes(clean)) {
    return true;
  }

  // Variant checks
  const commonPrefixes = [
    `rep-${clean}`,
    `report-${clean}`,
    `post-${clean}`,
    `feed-${clean}`,
    `feed-rep-${clean}`,
    `feed-report-${clean}`,
    `feed-report-rep-${clean}`,
    `feed-auto-${clean}`,
    `feed-auto-rep-${clean}`,
    `feed-admin-${clean}`,
    `feed-shared-${clean}`,
    `feed-resolved-${clean}`,
    `feed-dispatch-${clean}`,
    `feed-dispatch-rep-${clean}`,
    `rep-dispatch-${clean}`,
    `dispatch-${clean}`,
    `pothole-${clean}`,
    `feed-pothole-${clean}`,
    `rep-pothole-${clean}`,
    `feed-pothole-don-${clean}`,
    `gmap-${clean}`,
    `rep-gmap-${clean}`,
    `feed-gmap-${clean}`
  ];

  for (const prefix of commonPrefixes) {
    if (deletedFeedIds.includes(prefix) || deletedReportIds.includes(prefix)) {
      return true;
    }
  }

  // Check if any registered deleted ID shares the same core clean identifier
  for (const del of deletedFeedIds) {
    if (del === strId || extractCleanPostId(del) === clean) {
      return true;
    }
  }
  for (const del of deletedReportIds) {
    if (del === strId || extractCleanPostId(del) === clean) {
      return true;
    }
  }

  return false;
}

// Client-side persistent set of deleted items to ensure deleted pins/posts never resurrect
const clientDeletedIds = new Set<string>();

if (typeof window !== 'undefined') {
  try {
    const s = sessionStorage.getItem('livetraffic_deleted_ids');
    if (s) {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) {
        parsed.forEach((id) => clientDeletedIds.add(String(id)));
      }
    }
  } catch (_) {}
}

export function registerDeletedPostId(rawId: string | number | undefined | null): void {
  if (!rawId) return;
  const related = getAllPostRelatedIds(rawId);
  related.forEach((id) => clientDeletedIds.add(id));
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('livetraffic_deleted_ids', JSON.stringify(Array.from(clientDeletedIds).slice(-500)));
    } catch (_) {}
  }
}

export function isGloballyDeleted(rawId: string | number | undefined | null): boolean {
  if (!rawId) return false;
  const strId = String(rawId).trim();
  if (clientDeletedIds.has(strId)) return true;
  const deletedArr = Array.from(clientDeletedIds);
  if (deletedArr.length === 0) return false;
  return isPostDeleted(strId, deletedArr, deletedArr);
}

export function getGloballyDeletedIds(): string[] {
  return Array.from(clientDeletedIds);
}
