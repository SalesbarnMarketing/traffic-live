export const SA_TIMEZONE = 'Africa/Johannesburg';

/**
 * Format a time in South Africa Standard Time (SAST, UTC+2)
 * e.g. "09:44" or "14:30"
 */
export function formatSATime(dateOrMillis?: string | number | Date | null, withSeconds: boolean = false): string {
  if (!dateOrMillis) return '';
  const millis = typeof dateOrMillis === 'object' && dateOrMillis instanceof Date ? (dateOrMillis as Date).getTime() : parseDateToMillis(dateOrMillis);
  if (!millis) return '';
  const d = new Date(millis);
  return d.toLocaleTimeString('en-GB', {
    timeZone: SA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: withSeconds ? '2-digit' : undefined,
    hour12: false
  });
}

/**
 * Format timestamp specifically for WhatsApp & social broadcasts in South Africa Standard Time (SAST, UTC+2):
 * - If today: "Today (30 Aug), 09:22"
 * - If yesterday: "Yesterday (29 Aug), 08:07"
 * - If other date this year: "29 Aug, 08:07"
 * - If another year: "29 Aug 2025, 08:07"
 * Guarantees 24h format with 2-digit zero padding and never leaks raw ISO strings or unparsed tokens.
 */
export function formatWhatsAppDateTime(dateOrMillis?: string | number | Date | null): string {
  if (!dateOrMillis) return formatSATime(new Date());

  const millis = typeof dateOrMillis === 'object' && dateOrMillis instanceof Date 
    ? dateOrMillis.getTime() 
    : parseDateToMillis(dateOrMillis);

  if (!millis || isNaN(millis)) {
    if (typeof dateOrMillis === 'string' && dateOrMillis.trim() && !dateOrMillis.includes('T') && !dateOrMillis.includes('Z')) {
      return dateOrMillis.trim();
    }
    return formatSATime(new Date());
  }

  const d = new Date(millis);
  const now = new Date();

  // Get YYYY-MM-DD in South Africa time
  const dDateStr = d.toLocaleDateString('en-CA', { timeZone: SA_TIMEZONE });
  const nowDateStr = now.toLocaleDateString('en-CA', { timeZone: SA_TIMEZONE });

  // Calculate yesterday in SAST
  const nowSaTime = new Date(now.toLocaleString('en-US', { timeZone: SA_TIMEZONE }));
  const yesterdaySa = new Date(nowSaTime);
  yesterdaySa.setDate(yesterdaySa.getDate() - 1);
  const yesterdayDateStr = yesterdaySa.toLocaleDateString('en-CA');

  const timeStr = d.toLocaleTimeString('en-GB', {
    timeZone: SA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const day = d.toLocaleDateString('en-GB', { timeZone: SA_TIMEZONE, day: 'numeric' });
  const month = d.toLocaleDateString('en-GB', { timeZone: SA_TIMEZONE, month: 'short' });
  const dYear = d.toLocaleDateString('en-GB', { timeZone: SA_TIMEZONE, year: 'numeric' });
  const nowYear = now.toLocaleDateString('en-GB', { timeZone: SA_TIMEZONE, year: 'numeric' });

  if (dDateStr === nowDateStr) {
    return `Today (${day} ${month}), ${timeStr}`;
  }

  if (dDateStr === yesterdayDateStr) {
    return `Yesterday (${day} ${month}), ${timeStr}`;
  }

  if (dYear === nowYear) {
    return `${day} ${month}, ${timeStr}`;
  }

  return `${day} ${month} ${dYear}, ${timeStr}`;
}

/**
 * Get current South Africa date components (SAST, UTC+2)
 */
function getNowSA(): { year: number; month: number; day: number; hour: number; minute: number; second: number } {
  const now = new Date();
  const dtf = new Intl.DateTimeFormat('en-GB', {
    timeZone: SA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = dtf.formatToParts(now);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  return {
    year: parseInt(map.year, 10),
    month: parseInt(map.month, 10) - 1,
    day: parseInt(map.day, 10),
    hour: parseInt(map.hour, 10),
    minute: parseInt(map.minute, 10),
    second: parseInt(map.second, 10)
  };
}

/**
 * Convert South African local date/time components to UTC epoch milliseconds.
 * SAST has no Daylight Saving Time and is strictly UTC+2.
 */
function sastToUtcMillis(year: number, month: number, day: number, hour: number, minute: number, second: number = 0): number {
  return Date.UTC(year, month, day, hour - 2, minute, second);
}

/**
 * Comprehensive parser for date strings from i-Traffic, SANRAL, ISO, and standard formats.
 * Correctly handles South Africa Standard Time (SAST, UTC+2).
 */
export function parseDateToMillis(dateStr: string | number | undefined | null): number {
  if (!dateStr) return 0;

  if (typeof dateStr === 'number') {
    return isNaN(dateStr) ? 0 : (dateStr < 1e11 ? dateStr * 1000 : dateStr);
  }

  const s = String(dateStr).trim();
  if (!s) return 0;

  // 1. Pure unix timestamp string
  if (/^\d{10,13}$/.test(s)) {
    const num = parseInt(s, 10);
    return s.length === 10 ? num * 1000 : num;
  }

  // 2. Handle "Today, 14:30" or "Today at 14:30"
  const todayMatch = s.match(/^today(?:[,\s]+(?:at\s+)?)(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?(?:\s*(am|pm))?/i);
  if (todayMatch) {
    const saNow = getNowSA();
    let hour = parseInt(todayMatch[1], 10);
    const minute = parseInt(todayMatch[2], 10);
    const second = todayMatch[3] ? parseInt(todayMatch[3], 10) : 0;
    const ampm = todayMatch[4]?.toLowerCase();
    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;

    let targetMillis = sastToUtcMillis(saNow.year, saNow.month, saNow.day, hour, minute, second);
    // If future by > 3 mins, roll back to yesterday
    if (targetMillis > Date.now() + 3 * 60 * 1000) {
      targetMillis -= 24 * 3600 * 1000;
    }
    return targetMillis;
  }

  // 3. Handle "Yesterday, 14:30" or "Yesterday at 14:30"
  const yesterdayMatch = s.match(/^yesterday(?:[,\s]+(?:at\s+)?)(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?(?:\s*(am|pm))?/i);
  if (yesterdayMatch) {
    const saNow = getNowSA();
    let hour = parseInt(yesterdayMatch[1], 10);
    const minute = parseInt(yesterdayMatch[2], 10);
    const second = yesterdayMatch[3] ? parseInt(yesterdayMatch[3], 10) : 0;
    const ampm = yesterdayMatch[4]?.toLowerCase();
    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;

    return sastToUtcMillis(saNow.year, saNow.month, saNow.day, hour, minute, second) - 24 * 3600 * 1000;
  }

  // 4. Handle time-only strings: "12:49 PM", "12:49", "12:49:00", "08:30"
  const timeOnlyMatch = s.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?(?:\s*(am|pm))?$/i);
  if (timeOnlyMatch) {
    const saNow = getNowSA();
    let hour = parseInt(timeOnlyMatch[1], 10);
    const minute = parseInt(timeOnlyMatch[2], 10);
    const second = timeOnlyMatch[3] ? parseInt(timeOnlyMatch[3], 10) : 0;
    const ampm = timeOnlyMatch[4]?.toLowerCase();
    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;

    let candidate = sastToUtcMillis(saNow.year, saNow.month, saNow.day, hour, minute, second);
    if (candidate > Date.now() + 3 * 60 * 1000) {
      candidate -= 24 * 3600 * 1000;
    }
    return candidate;
  }

  // 5. Match DD/MM/YY or DD/MM/YYYY with optional comma and time (e.g. "19/8/26, 21:15", "19/08/2026 21:15:00")
  const dmyMatch = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})(?:[,\s]+|T)(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?(?:\s*(am|pm))?/i);
  if (dmyMatch) {
    const first = parseInt(dmyMatch[1], 10);
    const second = parseInt(dmyMatch[2], 10);
    const rawYear = parseInt(dmyMatch[3], 10);
    const year = rawYear < 100 ? (rawYear < 70 ? 2000 + rawYear : 1900 + rawYear) : rawYear;
    let hour = parseInt(dmyMatch[4], 10);
    const minute = parseInt(dmyMatch[5], 10);
    const sec = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0;
    const ampm = dmyMatch[7]?.toLowerCase();
    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;

    let day = first;
    let month = second - 1; // 0-indexed

    // If second number is > 12, then first must be month and second must be day (e.g. 08/19/2026)
    if (second > 12 && first <= 12) {
      month = first - 1;
      day = second;
    }

    const targetMillis = sastToUtcMillis(year, month, day, hour, minute, sec);
    if (!isNaN(targetMillis)) {
      const now = Date.now();
      if (targetMillis > now + 10 * 1000) {
        return now;
      }
      return targetMillis;
    }
  }

  // 6. Match DD/MM without year (e.g. "19/08 21:15", "19/8, 12:49")
  const dmNoYearMatch = s.match(/^(\d{1,2})[-/.](\d{1,2})(?:[,\s]+|T)(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?(?:\s*(am|pm))?/i);
  if (dmNoYearMatch) {
    const saNow = getNowSA();
    const day = parseInt(dmNoYearMatch[1], 10);
    const month = parseInt(dmNoYearMatch[2], 10) - 1;
    let hour = parseInt(dmNoYearMatch[3], 10);
    const minute = parseInt(dmNoYearMatch[4], 10);
    const sec = dmNoYearMatch[5] ? parseInt(dmNoYearMatch[5], 10) : 0;
    const ampm = dmNoYearMatch[6]?.toLowerCase();
    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;

    let year = saNow.year;
    let targetMillis = sastToUtcMillis(year, month, day, hour, minute, sec);
    if (targetMillis > Date.now() + 24 * 3600 * 1000) {
      targetMillis = sastToUtcMillis(year - 1, month, day, hour, minute, sec);
    }
    if (!isNaN(targetMillis)) {
      const now = Date.now();
      if (targetMillis > now + 10 * 1000) {
        return now;
      }
      return targetMillis;
    }
  }

  // 7. Match YYYY-MM-DD or YYYY/MM/DD with optional comma and time (e.g. "2026-08-19 21:15:00")
  const ymdMatch = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[,\s]+|T)(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?(?:\s*(am|pm))?/i);
  if (ymdMatch && !s.includes('Z') && !/[+-]\d{2}:?\d{2}/.test(s)) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    let hour = parseInt(ymdMatch[4], 10);
    const minute = parseInt(ymdMatch[5], 10);
    const sec = ymdMatch[6] ? parseInt(ymdMatch[6], 10) : 0;
    const ampm = ymdMatch[7]?.toLowerCase();
    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;

    const targetMillis = sastToUtcMillis(year, month, day, hour, minute, sec);
    if (!isNaN(targetMillis)) {
      const now = Date.now();
      if (targetMillis > now + 10 * 1000) {
        return now;
      }
      return targetMillis;
    }
  }

  // 8. Direct standard Date parse (covers ISO-8601 UTC like "2026-08-21T07:44:00.000Z", RFC2822)
  const direct = new Date(s).getTime();
  if (!isNaN(direct) && direct > 0) {
    return direct;
  }

  return 0;
}

/**
 * Format timestamp string or raw date into a clean readable date & time badge string in SAST (UTC+2):
 * e.g. "Today, 17:45", "Yesterday, 09:30", or "19 Aug 2026, 17:45"
 */
export function formatReadableDateTime(dateStr: string | number | undefined | null): string {
  if (!dateStr) return 'Just now';

  const millis = parseDateToMillis(dateStr);
  if (!millis) {
    if (typeof dateStr === 'string' && dateStr.trim()) return dateStr.trim();
    return 'Just now';
  }

  const d = new Date(millis);
  const now = new Date();

  // Get YYYY-MM-DD in South Africa time
  const dDateStr = d.toLocaleDateString('en-CA', { timeZone: SA_TIMEZONE });
  const nowDateStr = now.toLocaleDateString('en-CA', { timeZone: SA_TIMEZONE });

  // Calculate yesterday in SAST
  const nowSaTime = new Date(now.toLocaleString('en-US', { timeZone: SA_TIMEZONE }));
  const yesterdaySa = new Date(nowSaTime);
  yesterdaySa.setDate(yesterdaySa.getDate() - 1);
  const yesterdayDateStr = yesterdaySa.toLocaleDateString('en-CA');

  const timeStr = d.toLocaleTimeString('en-GB', {
    timeZone: SA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  // If today in SAST
  if (dDateStr === nowDateStr) {
    return `Today, ${timeStr}`;
  }

  // If yesterday in SAST
  if (dDateStr === yesterdayDateStr) {
    return `Yesterday, ${timeStr}`;
  }

  // If same year in SAST
  const day = d.toLocaleDateString('en-GB', { timeZone: SA_TIMEZONE, day: 'numeric' });
  const month = d.toLocaleDateString('en-GB', { timeZone: SA_TIMEZONE, month: 'short' });
  const dYear = d.toLocaleDateString('en-GB', { timeZone: SA_TIMEZONE, year: 'numeric' });
  const nowYear = now.toLocaleDateString('en-GB', { timeZone: SA_TIMEZONE, year: 'numeric' });

  if (dYear === nowYear) {
    return `${day} ${month}, ${timeStr}`;
  }

  return `${day} ${month} ${dYear}, ${timeStr}`;
}

/**
 * Clean relative time ago string that prevents negative seconds or incorrect future calculation
 * e.g. "Just now", "5m ago", "2h ago", "Yesterday, 12:49", "19 Aug, 12:49"
 */
export function getTimeAgo(dateStr: string | number | undefined | null): string {
  if (!dateStr) return 'Just now';

  const millis = parseDateToMillis(dateStr);
  if (!millis) return 'Recently';

  const now = Date.now();
  const diffSeconds = Math.floor((now - millis) / 1000);

  // If timestamp is recent or clock skew causes slight negative diff
  if (diffSeconds < 45) {
    return 'Just now';
  }

  if (diffSeconds < 3600) {
    const mins = Math.max(1, Math.floor(diffSeconds / 60));
    return `${mins}m ago`;
  }

  if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return `${hours}h ago`;
  }

  const days = Math.floor(diffSeconds / 86400);
  if (days === 1) {
    const d = new Date(millis);
    const timeStr = d.toLocaleTimeString('en-GB', {
      timeZone: SA_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return `Yesterday, ${timeStr}`;
  }

  if (days < 7) {
    return `${days}d ago`;
  }

  return formatReadableDateTime(millis);
}

/**
 * Format duration in milliseconds into clean human-readable text
 * e.g. "45s", "3m 12s", "14 mins", "1h 25m", "2d 4h"
 */
export function formatDuration(msOrDiff: number, format: 'compact' | 'detailed' | 'verbose' = 'detailed'): string {
  const ms = Math.max(0, msOrDiff);
  const totalSeconds = Math.floor(ms / 1000);

  if (totalSeconds < 60) {
    if (format === 'compact') return `${Math.max(1, totalSeconds)}s`;
    if (format === 'verbose') return `${Math.max(1, totalSeconds)} seconds`;
    return `${Math.max(1, totalSeconds)}s`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const remSeconds = totalSeconds % 60;

  if (minutes < 60) {
    if (format === 'compact') return `${minutes}m`;
    if (format === 'verbose') {
      return remSeconds > 0 ? `${minutes} min ${remSeconds} sec` : `${minutes} mins`;
    }
    return remSeconds > 5 ? `${minutes}m ${remSeconds}s` : `${minutes} min${minutes === 1 ? '' : 's'}`;
  }

  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;

  if (hours < 24) {
    if (format === 'compact') return `${hours}h ${remMinutes}m`;
    if (format === 'verbose') {
      return remMinutes > 0 ? `${hours} hour${hours === 1 ? '' : 's'} ${remMinutes} min${remMinutes === 1 ? '' : 's'}` : `${hours} hour${hours === 1 ? '' : 's'}`;
    }
    return remMinutes > 0 ? `${hours}h ${remMinutes}m` : `${hours} hr${hours === 1 ? '' : 's'}`;
  }

  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  if (format === 'compact') return `${days}d ${remHours}h`;
  return remHours > 0 ? `${days}d ${remHours}h` : `${days} day${days === 1 ? '' : 's'}`;
}

/**
 * Calculate response & resolution timing metrics for an Emergency SOS call
 */
export function getSOSTimingBreakdown(sos: {
  createdAt: string;
  dispatchedAt?: string;
  resolvedAt?: string;
  status?: string;
}) {
  const createdMs = parseDateToMillis(sos.createdAt) || Date.now();
  const dispatchedMs = sos.dispatchedAt ? parseDateToMillis(sos.dispatchedAt) : null;
  const resolvedMs = sos.resolvedAt ? parseDateToMillis(sos.resolvedAt) : null;
  const isResolved = sos.status === 'resolved' || Boolean(resolvedMs);
  const endMs = resolvedMs || Date.now();

  const totalDurationMs = Math.max(0, endMs - createdMs);
  const totalDurationText = formatDuration(totalDurationMs, 'detailed');

  let dispatchLatencyMs: number | null = null;
  let dispatchLatencyText: string | null = null;
  if (dispatchedMs && dispatchedMs >= createdMs) {
    dispatchLatencyMs = dispatchedMs - createdMs;
    dispatchLatencyText = formatDuration(dispatchLatencyMs, 'detailed');
  }

  let onSceneDurationMs: number | null = null;
  let onSceneDurationText: string | null = null;
  if (dispatchedMs) {
    onSceneDurationMs = Math.max(0, endMs - dispatchedMs);
    onSceneDurationText = formatDuration(onSceneDurationMs, 'detailed');
  }

  let summary = '';
  if (isResolved) {
    if (dispatchLatencyText && onSceneDurationText) {
      summary = `Resolved in ${totalDurationText} (Dispatch: ${dispatchLatencyText} • Response: ${onSceneDurationText})`;
    } else {
      summary = `Resolved in ${totalDurationText}`;
    }
  } else if (sos.status === 'dispatched' && dispatchedMs) {
    if (dispatchLatencyText) {
      summary = `Dispatched in ${dispatchLatencyText} • On scene / En route for ${onSceneDurationText || '0s'}`;
    } else {
      summary = `En route for ${onSceneDurationText || '0s'}`;
    }
  } else {
    summary = `Pending dispatch for ${totalDurationText}`;
  }

  return {
    isResolved,
    totalDurationMs,
    totalDurationText,
    dispatchLatencyMs,
    dispatchLatencyText,
    onSceneDurationMs,
    onSceneDurationText,
    summary
  };
}

/**
 * Calculate resolution duration for an incident report
 */
export function getReportResolutionTiming(report: {
  createdAt?: string;
  timestamp?: string;
  resolvedAt?: string;
  status?: string;
}) {
  const startStr = report.createdAt || report.timestamp;
  if (!startStr) return null;
  const startMs = parseDateToMillis(startStr);
  if (!startMs) return null;

  const isResolved = report.status === 'resolved' || Boolean(report.resolvedAt);
  const endMs = report.resolvedAt ? parseDateToMillis(report.resolvedAt) : Date.now();
  const durationMs = Math.max(0, endMs - startMs);

  return {
    isResolved,
    durationMs,
    durationText: formatDuration(durationMs, 'detailed')
  };
}
