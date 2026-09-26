/**
 * Web Audio API synthesizer sound effects for Voice Activation & Assistant Feedback
 */

export function playVoiceActivationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Ascending chime: 523.25Hz (C5) -> 659.25Hz (E5) -> 783.99Hz (G5)
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + 0.08);
    osc.frequency.setValueAtTime(783.99, now + 0.16);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch (e) {
    // AudioContext autoplay restrictions or unsupported
  }
}

export function playVoiceSuccessChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    // Futuristic confirmation sound (E5 -> B5)
    osc1.frequency.setValueAtTime(659.25, now);
    osc1.frequency.setValueAtTime(987.77, now + 0.1);

    osc2.frequency.setValueAtTime(329.63, now);
    osc2.frequency.setValueAtTime(493.88, now + 0.1);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.4);
    osc2.stop(now + 0.4);
  } catch (e) {
    // AudioContext autoplay restrictions or unsupported
  }
}

export function playVoiceErrorChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    // Gentle low bonk (220Hz -> 164Hz)
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.setValueAtTime(164, now + 0.12);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  } catch (e) {
    // AudioContext error
  }
}

/**
 * Text to Speech Voice Response with natural English voice selection
 */
export function speakVoiceAssistantResponse(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Google') ||
          v.name.includes('Natural') ||
          v.name.includes('Neural') ||
          v.name.includes('Female') ||
          v.name.includes('Samantha') ||
          v.name.includes('Karen'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Voice speech synthesis error:', err);
    if (onEnd) onEnd();
  }
}

/**
 * Dual-tone emergency siren sound effect for incoming SOS dispatches
 */
export function playEmergencySOSAlertSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'square';

    // Alternating Hi-Lo siren pattern
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.setValueAtTime(659.25, now + 0.15);
    osc1.frequency.setValueAtTime(880, now + 0.3);
    osc1.frequency.setValueAtTime(659.25, now + 0.45);

    osc2.frequency.setValueAtTime(440, now);
    osc2.frequency.setValueAtTime(329.63, now + 0.15);
    osc2.frequency.setValueAtTime(440, now + 0.3);
    osc2.frequency.setValueAtTime(329.63, now + 0.45);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.exponentialRampToValueAtTime(0.28, now + 0.03);
    gain.gain.setValueAtTime(0.28, now + 0.55);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.65);
    osc2.stop(now + 0.65);
  } catch (e) {
    // AudioContext autoplay restrictions or unsupported
  }
}

/**
 * Authentic automotive dual-tone car horn sound
 */
export function playCarHornSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Dual-tone harmonic car horn (F4 + A4 / 349Hz + 440Hz)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(349.23, now);
    osc2.frequency.setValueAtTime(440.0, now);

    // Filter to give it an authentic automotive acoustic body
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.Q.setValueAtTime(1.5, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.03);
    gain.gain.setValueAtTime(0.25, now + 0.28);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.42);
    osc2.stop(now + 0.42);
  } catch (e) {}
}

export function playPoliceSirenSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';

    // High-low European emergency siren wail
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.linearRampToValueAtTime(950, now + 0.25);
    osc.frequency.linearRampToValueAtTime(650, now + 0.5);
    osc.frequency.linearRampToValueAtTime(950, now + 0.75);
    osc.frequency.linearRampToValueAtTime(650, now + 1.0);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.05);
    gain.gain.setValueAtTime(0.22, now + 0.95);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 1.05);
  } catch (e) {}
}

export function playAlertChimeSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const notes = [587.33, 739.99, 880.0]; // D5 -> F#5 -> A5
    notes.forEach((freq, idx) => {
      const noteTime = now + idx * 0.1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.2, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.45);
    });
  } catch (e) {}
}

export function playTrafficWhistleSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2600, now);

    // LFO frequency wobble for authentic metal pea whistle sound
    lfo.frequency.setValueAtTime(22, now);
    lfoGain.gain.setValueAtTime(150, now);
    lfo.connect(osc.frequency);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.03);
    gain.gain.setValueAtTime(0.18, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    lfo.start(now);
    osc.start(now);
    lfo.stop(now + 0.45);
    osc.stop(now + 0.45);
  } catch (e) {}
}

export function playRadarBeepSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch (e) {}
}

export function playSubtlePingSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.15, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  } catch (e) {}
}

export function playTrafficAlertSound(soundType: string = 'car_horn') {
  switch (soundType) {
    case 'car_horn':
      playCarHornSound();
      break;
    case 'police_siren':
      playPoliceSirenSound();
      break;
    case 'alert_chime':
      playAlertChimeSound();
      break;
    case 'traffic_whistle':
      playTrafficWhistleSound();
      break;
    case 'radar_beep':
      playRadarBeepSound();
      break;
    case 'two_tone':
      playEmergencySOSAlertSound();
      break;
    case 'subtle_ping':
      playSubtlePingSound();
      break;
    default:
      playCarHornSound();
      break;
  }
}


