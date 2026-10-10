// Web Audio API Synthesizer - 100% self-contained biblical ambient audio & SFX
class SoundSystem {
  constructor() {
    this.ctx = null;
    this.bgmPlaying = false;
    this.isMuted = false;
    this.bgmTimer = null;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      this.ctx = new AudioContext();
    }
  }

  ensureContext() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Soft Middle-Eastern / Lyre ambient melody
  startMusic() {
    this.ensureContext();
    if (this.bgmPlaying || !this.ctx) return;
    this.bgmPlaying = true;
    this.playMelodicPhrase();
  }

  playMelodicPhrase() {
    if (!this.bgmPlaying || !this.ctx || this.isMuted) return;

    // Ancient Dorian / Phrygian scale frequencies (A3 base)
    // A3, B3, C4, D4, E4, F4, G4, A4, B4, C5
    const scale = [220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
    const phraseLength = 6 + Math.floor(Math.random() * 4);
    let delay = 0;

    for (let i = 0; i < phraseLength; i++) {
      const note = scale[Math.floor(Math.random() * scale.length)];
      const dur = 0.6 + Math.random() * 0.8;
      setTimeout(() => {
        if (this.bgmPlaying && !this.isMuted) {
          this.pluckLyre(note, dur * 1.5, 0.08);
        }
      }, delay * 1000);
      delay += dur;
    }

    // Play next phrase after a contemplative pause
    const nextPhraseDelay = (delay + 3 + Math.random() * 4) * 1000;
    this.bgmTimer = setTimeout(() => {
      this.playMelodicPhrase();
    }, nextPhraseDelay);
  }

  // Stylized ancient harp/lyre plucked string tone
  pluckLyre(freq, duration = 1.2, volume = 0.12) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    // Subtle overtone
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 4, now);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.2, now + duration);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + duration);
    osc2.stop(now + duration);
  }

  // Footstep rustling on sand/stone
  playFootstep(surface = 'sand') {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const dur = 0.08;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(surface === 'stone' ? 180 : 90, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + dur);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(surface === 'stone' ? 800 : 400, now);

    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + dur);
  }

  // Jump jump/whoosh sound
  playJump() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.18);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Roll dodge sound
  playRoll() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.25);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Cute stylized sheep "Baa"
  playSheepBaa() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const dur = 0.55;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    const pitch = 260 + (Math.random() * 40 - 20);
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.linearRampToValueAtTime(pitch * 1.08, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.85, now + dur);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.Q.setValueAtTime(3.5, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + dur);
  }

  // Radiant "Light of Faith" spiritual ability hum and chime
  playFaithLight() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Chime sweep
    const chords = [523.25, 659.25, 783.99, 1046.50]; // C Major arpeggio
    chords.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.07, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 1.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 1.4);
    });

    // Deep warm resonant hum
    const hum = this.ctx.createOscillator();
    const humGain = this.ctx.createGain();
    hum.type = 'triangle';
    hum.frequency.setValueAtTime(130.81, now);
    humGain.gain.setValueAtTime(0.12, now);
    humGain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
    hum.connect(humGain);
    humGain.connect(this.ctx.destination);
    hum.start(now);
    hum.stop(now + 1.6);
  }

  // Discovery / Quest complete glorious fanfare
  playQuestComplete() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [
      { f: 392.00, t: 0.0, d: 0.18 }, // G4
      { f: 523.25, t: 0.16, d: 0.18 }, // C5
      { f: 659.25, t: 0.32, d: 0.22 }, // E5
      { f: 783.99, t: 0.50, d: 0.65 }  // G5 (held)
    ];

    notes.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, now + n.t);

      gain.gain.setValueAtTime(0.12, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d);
    });
  }

  // Scroll discovery chime
  playScrollPickup() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const chords = [659.25, 783.99, 987.77, 1318.51];
    chords.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.09, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.8);
    });
  }

  // Water well splash / refill sound
  playWaterSplash() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const dur = 0.8;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + dur);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + dur);
  }

  // Dialogue blip
  playDialogueBlip() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(380 + Math.random() * 60, now);

    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }
}

export const sounds = new SoundSystem();
