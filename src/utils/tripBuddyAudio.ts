// Web Audio API Sound Generator for Trip Buddy (Driver-safe audible alerts without external files)

class TripBuddySoundEngine {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private activeOscillators: OscillatorNode[] = [];
  private activeGains: GainNode[] = [];
  private isSilenced: boolean = false;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopAll();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public silence() {
    this.isSilenced = true;
    this.stopAll();
  }

  public resetSilence() {
    this.isSilenced = false;
  }

  public isSoundSilenced(): boolean {
    return this.isSilenced;
  }

  public stopAll() {
    try {
      this.activeOscillators.forEach(osc => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {}
      });
      this.activeGains.forEach(gain => {
        try {
          gain.gain.setValueAtTime(0, this.audioCtx?.currentTime || 0);
          gain.disconnect();
        } catch {}
      });
      this.activeOscillators = [];
      this.activeGains = [];
    } catch (e) {
      console.warn('TripBuddy stopAll warning:', e);
    }
  }

  // 1. Gentle Check-in Reminder Chime (Dual tone, pleasant bell)
  public playCheckinReminderChime() {
    if (this.isMuted || this.isSilenced) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      
      // Tone 1: 587.33 Hz (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      this.activeOscillators.push(osc1);
      this.activeGains.push(gain1);

      osc1.onended = () => {
        this.activeOscillators = this.activeOscillators.filter(o => o !== osc1);
        this.activeGains = this.activeGains.filter(g => g !== gain1);
      };

      osc1.start(now);
      osc1.stop(now + 0.5);

      // Tone 2: 880 Hz (A5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.15);
      gain2.gain.setValueAtTime(0, now + 0.15);
      gain2.gain.linearRampToValueAtTime(0.25, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      this.activeOscillators.push(osc2);
      this.activeGains.push(gain2);

      osc2.onended = () => {
        this.activeOscillators = this.activeOscillators.filter(o => o !== osc2);
        this.activeGains = this.activeGains.filter(g => g !== gain2);
      };

      osc2.start(now + 0.15);
      osc2.stop(now + 0.7);

      // Also trigger device haptic vibration if available
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([150, 100, 150]);
      }
    } catch (e) {
      console.warn('TripBuddy audio chime warning:', e);
    }
  }

  // 2. Success Check-in Confirmed Ping (Quick upbeat double-beep)
  public playCheckinSuccessPing() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);

      this.activeOscillators.push(osc);
      this.activeGains.push(gain);

      osc.onended = () => {
        this.activeOscillators = this.activeOscillators.filter(o => o !== osc);
        this.activeGains = this.activeGains.filter(g => g !== gain);
      };

      osc.start(now);
      osc.stop(now + 0.35);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(80);
      }
    } catch (e) {
      console.warn('TripBuddy audio ping warning:', e);
    }
  }

  // 3. Urgent Alert Siren (Overdue safety check-in or SOS trigger)
  public playEmergencyAlertTone() {
    if (this.isMuted || this.isSilenced) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const startTime = now + (i * 0.25);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, startTime);
        osc.frequency.linearRampToValueAtTime(1200, startTime + 0.12);
        osc.frequency.linearRampToValueAtTime(800, startTime + 0.24);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.3, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.24);

        osc.connect(gain);
        gain.connect(ctx.destination);

        this.activeOscillators.push(osc);
        this.activeGains.push(gain);

        osc.onended = () => {
          this.activeOscillators = this.activeOscillators.filter(o => o !== osc);
          this.activeGains = this.activeGains.filter(g => g !== gain);
        };

        osc.start(startTime);
        osc.stop(startTime + 0.25);
      }

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([300, 100, 300, 100, 500]);
      }
    } catch (e) {
      console.warn('TripBuddy emergency siren warning:', e);
    }
  }
}

export const tripBuddyAudio = new TripBuddySoundEngine();
