/**
 * Utility to sanitize traffic feed texts, removing internal database IDs,
 * ticket numbers (e.g. "26082200034:"), and preparing natural human speech.
 */

/**
 * Removes internal event IDs, timestamps, ticket numbers from display text.
 * e.g., "26082200034: Stationary Vehicle on N3..." -> "Stationary Vehicle on N3..."
 */
export function cleanTrafficText(text: string | null | undefined): string {
  if (!text) return '';

  let cleaned = String(text);

  // 1. Remove leading event/ticket numbers like "26082200034:", "20240822001: ", "123456789 - "
  cleaned = cleaned.replace(/^\s*(?:Event\s*(?:ID|#)?\s*[:#-]?\s*)?\d{6,16}\s*[:\-\.]\s*/gi, '');
  cleaned = cleaned.replace(/\b(?:Event\s*(?:ID|#)?\s*[:#-]?\s*)?\d{7,16}\s*[:\-\.]\s*/gi, '');
  cleaned = cleaned.replace(/^\s*Incident\s*(?:ID|#)?\s*[:#-]?\s*\d+\s*[:\-\.]\s*/gi, '');
  cleaned = cleaned.replace(/^\s*Ref\s*(?:ID|#)?\s*[:#-]?\s*\d+\s*[:\-\.]\s*/gi, '');

  // 2. Remove SANRAL / i-traffic.co.za / i-Traffic internal tags and URLs if present
  cleaned = cleaned.replace(/https?:\/\/(?:www\.)?i-traffic\.co\.za[^\s]*/gi, '');
  cleaned = cleaned.replace(/www\.i-traffic\.co\.za/gi, '');
  cleaned = cleaned.replace(/i-traffic\.co\.za/gi, '');
  cleaned = cleaned.replace(/SANRAL/gi, '').replace(/i-Traffic/gi, 'Live Traffic').replace(/itraffic/gi, 'Live Traffic');

  // 3. Remove HTML entities and tags
  cleaned = cleaned.replace(/<[^>]*>?/gm, ' ').replace(/&nbsp;/g, ' ');

  // 4. Remove redundant quotes or trailing brackets
  cleaned = cleaned.replace(/^["']|["']$/g, '');

  // 5. Normalize whitespaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Prepares text specifically for Natural Voice Speech Synthesis (TTS),
 * ensuring unnatural numbers, awkward brackets, and confusing abbreviations are spoken fluently.
 */
export function cleanTextForVoiceSpeech(text: string | null | undefined): string {
  if (!text) return '';

  let speech = cleanTrafficText(text);

  // Remove any remaining long digit sequences (like reference numbers)
  speech = speech.replace(/\b\d{6,16}\b/g, '');

  // Expand common road abbreviations for speech synthesis
  speech = speech.replace(/\bNB\b/gi, 'Northbound');
  speech = speech.replace(/\bSB\b/gi, 'Southbound');
  speech = speech.replace(/\bEB\b/gi, 'Eastbound');
  speech = speech.replace(/\bWB\b/gi, 'Westbound');
  speech = speech.replace(/\bN(\d+)\b/g, 'N $1');
  speech = speech.replace(/\bR(\d+)\b/g, 'R $1');
  speech = speech.replace(/\bM(\d+)\b/g, 'M $1');
  speech = speech.replace(/\bkm\b/gi, 'kilometres');
  speech = speech.replace(/\bSt\b/gi, 'Street');
  speech = speech.replace(/\bAve\b/gi, 'Avenue');
  speech = speech.replace(/\bRd\b/gi, 'Road');
  speech = speech.replace(/\bDr\b/gi, 'Drive');
  speech = speech.replace(/\bHwy\b/gi, 'Highway');
  speech = speech.replace(/1 lane\(s\) of (\d+) closed/gi, '1 of $1 lanes closed');
  speech = speech.replace(/(\d+) lane\(s\) of (\d+) closed/gi, '$1 of $2 lanes closed');
  speech = speech.replace(/lane\(s\)/gi, 'lanes');

  // Clean excess punctuation
  speech = speech.replace(/[•|*#@]/g, ' ');
  speech = speech.replace(/\s+/g, ' ').trim();

  return speech;
}
