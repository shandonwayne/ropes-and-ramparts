const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioCtx();
  return ctx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.12) {
  const c = getCtx();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(g);
  g.connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + duration);
}

function playNoise(duration: number, gain = 0.06) {
  const c = getCtx();
  const bufferSize = c.sampleRate * duration;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = c.createBufferSource();
  source.buffer = buffer;
  const g = c.createGain();
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 800;
  filter.Q.value = 0.5;
  g.gain.setValueAtTime(gain, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  source.connect(filter);
  filter.connect(g);
  g.connect(c.destination);
  source.start();
  source.stop(c.currentTime + duration);
}

export const sounds = {
  diceRoll() {
    playNoise(0.15, 0.08);
    setTimeout(() => playNoise(0.1, 0.06), 80);
    setTimeout(() => playNoise(0.08, 0.04), 150);
  },

  step() {
    playTone(440 + Math.random() * 200, 0.08, 'sine', 0.06);
  },

  chute() {
    const c = getCtx();
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, c.currentTime + 0.5);
    g.gain.setValueAtTime(0.1, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5);
    osc.connect(g);
    g.connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + 0.5);
  },

  ladder() {
    [0, 80, 160, 240].forEach((delay, i) => {
      setTimeout(() => playTone(400 + i * 100, 0.12, 'triangle', 0.1), delay);
    });
  },

  victory() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.3, 'triangle', 0.12), i * 150);
    });
    setTimeout(() => {
      [1047, 1175, 1319].forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.5, 'triangle', 0.1), i * 100);
      });
    }, 600);
  },

  click() {
    playTone(800, 0.05, 'square', 0.04);
  },
};

let muted = false;

export function isMuted() {
  return muted;
}

export function setMuted(v: boolean) {
  muted = v;
}

export function playSound(name: keyof typeof sounds) {
  if (muted) return;
  try {
    sounds[name]();
  } catch {
    // audio not available
  }
}
