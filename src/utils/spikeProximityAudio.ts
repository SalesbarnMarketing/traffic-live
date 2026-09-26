// Distance calculation using Haversine formula
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Format distance nicely
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

// Generate urgent 2-tone radar warning chime using Web Audio API
export function playSpikeWarningChime(urgent: boolean = true) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sine';

    if (urgent) {
      // Urgent siren pulse: 880Hz -> 587Hz -> 880Hz
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.setValueAtTime(587, now + 0.12);
      osc1.frequency.setValueAtTime(880, now + 0.24);
      osc1.frequency.setValueAtTime(1046, now + 0.36);

      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(293, now + 0.12);
      osc2.frequency.setValueAtTime(440, now + 0.24);
    } else {
      // Advisory alert chime: 659Hz -> 880Hz
      osc1.frequency.setValueAtTime(659, now);
      osc1.frequency.setValueAtTime(880, now + 0.15);
      osc2.frequency.setValueAtTime(330, now);
      osc2.frequency.setValueAtTime(440, now + 0.15);
    }

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.55);
    osc2.stop(now + 0.55);
  } catch (err) {
    console.warn('Could not play audio warning chime:', err);
  }
}

// Speak the automated spike hazard warning
export function speakSpikeHazardWarning(options: {
  roadName?: string;
  locationName?: string;
  title?: string;
  distanceKm: number;
  speechRate?: number;
  onStart?: () => void;
  onEnd?: () => void;
}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  const { roadName, locationName, title, distanceKm, speechRate = 1.05, onStart, onEnd } = options;

  // Cancel any prior speech
  try {
    window.speechSynthesis.cancel();
  } catch {}

  // Play audio chime first
  playSpikeWarningChime(distanceKm < 1.5);

  const loc = roadName || locationName || 'your driving corridor';
  const distText = distanceKm < 1 ? `${Math.round(distanceKm * 1000)} metres` : `${distanceKm.toFixed(1)} kilometres`;

  let alertMessage = '';
  if (distanceKm <= 1.5) {
    alertMessage = `Emergency Warning! Critical spike trap hazard directly ahead in ${distText} on ${loc}. Reduce speed immediately, watch road surface for sharp debris, and do not stop on dark shoulders!`;
  } else if (distanceKm <= 3.5) {
    alertMessage = `Attention Driver! Approaching active verified spike trap hazard ahead on ${loc}. Distance: ${distText}. Maintain safe speed and keep clear of roadside shoulders.`;
  } else {
    alertMessage = `Safety Advisory: Verified road spike hazard reported within ${distText} along ${loc}. Stay vigilant.`;
  }

  // Delay utterance slightly so chime finishes
  setTimeout(() => {
    try {
      const utterance = new SpeechSynthesisUtterance(alertMessage);
      utterance.rate = speechRate;
      utterance.pitch = 1.1; // slightly higher pitch for urgency
      utterance.volume = 1.0;

      // Prefer English voice if available
      const voices = window.speechSynthesis.getVoices();
      const engVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Female') || v.name.includes('Enhanced')));
      if (engVoice) utterance.voice = engVoice;

      if (onStart) utterance.onstart = onStart;
      if (onEnd) utterance.onend = onEnd;
      utterance.onerror = () => {
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      if (onEnd) onEnd();
    }
  }, 350);
}
