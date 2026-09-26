/**
 * Utility functions for sanitizing, formatting, and safely opening Advertisement URLs.
 * Prevents "about:blank#blocked" errors caused by invalid protocols, empty URLs, or iframe sandbox restrictions.
 */

/**
 * Validates whether a string is a legitimate web URL or domain.
 */
export function isValidWebUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();

  // Filter out dummy/empty protocol-only values
  if (
    trimmed === '' ||
    trimmed === '#' ||
    trimmed === 'https://' ||
    trimmed === 'http://' ||
    trimmed === 'about:blank' ||
    trimmed.startsWith('javascript:')
  ) {
    return false;
  }

  // Check if it has a valid domain structure (at least something.domain)
  const clean = trimmed.replace(/^https?:\/\//i, '');
  if (!clean || clean.length < 3) return false;

  // Must contain a dot for TLD or be localhost / IP
  return clean.includes('.') || clean.startsWith('localhost');
}

/**
 * Sanitizes and normalizes a destination URL.
 * Automatically adds 'https://' if missing, removes malformed protocols,
 * and optionally attempts to extract a valid URL from fallback text/notes if provided.
 */
export function sanitizeAdUrl(url?: string | null, fallbackText?: string | null): string {
  let candidate = (url || '').trim();

  // If candidate is empty or just protocol, attempt to extract URL from fallback text (e.g. notes)
  if (!isValidWebUrl(candidate) && fallbackText) {
    const extracted = extractUrlFromText(fallbackText);
    if (extracted) {
      candidate = extracted;
    }
  }

  if (!isValidWebUrl(candidate)) {
    return '';
  }

  // Clean leading/trailing spaces and slashes
  candidate = candidate.trim();

  // Fix double protocol issues like "https://https://" or "http://https://"
  candidate = candidate.replace(/^(https?:\/\/)+/i, 'https://');

  // If missing protocol, prepend https://
  if (!/^https?:\/\//i.test(candidate)) {
    // If it starts with mailto: or tel:, leave as is
    if (candidate.startsWith('mailto:') || candidate.startsWith('tel:') || candidate.startsWith('https://wa.me/')) {
      return candidate;
    }
    candidate = `https://${candidate}`;
  }

  return candidate;
}

/**
 * Extracts the first valid HTTP/HTTPS URL or domain from a free-text notes string.
 */
export function extractUrlFromText(text?: string | null): string | null {
  if (!text || typeof text !== 'string') return null;

  // Match https://... or http://...
  const urlMatch = text.match(/https?:\/\/[^\s,;'"()<>]+/i);
  if (urlMatch && isValidWebUrl(urlMatch[0])) {
    return urlMatch[0];
  }

  // Match domain.com / www.domain.com
  const domainMatch = text.match(/(?:www\.)?[a-zA-Z0-9-]+\.(?:co\.za|com|org|net|io|tech|co|app|africa|gov\.za|edu\.za)[^\s,;'"()<>.]*/i);
  if (domainMatch && isValidWebUrl(domainMatch[0])) {
    return `https://${domainMatch[0]}`;
  }

  return null;
}

/**
 * Safely opens a sanitized URL in a new browser tab with noopener/noreferrer.
 * Returns true if opened successfully, false otherwise.
 */
export function safeOpenAdUrl(url?: string | null, fallbackText?: string | null): boolean {
  const sanitized = sanitizeAdUrl(url, fallbackText);
  if (!sanitized) {
    return false;
  }

  try {
    const newWindow = window.open(sanitized, '_blank', 'noopener,noreferrer');
    if (newWindow) {
      newWindow.opener = null;
      return true;
    }
  } catch (err) {
    console.warn('Failed to open ad URL via window.open:', err);
  }

  // Fallback: create temporary invisible anchor and trigger click
  try {
    const a = document.createElement('a');
    a.href = sanitized;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } catch (err) {
    console.error('Safe link fallback failed:', err);
    return false;
  }
}

/**
 * Automatically repairs corrupted/truncated base64 JPEG images (e.g. legacy 25,000 character cutoff)
 * or resolves missing banner images to valid, accessible creatives.
 */
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
