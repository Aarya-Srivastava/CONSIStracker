// Web Audio API Synthesizer for Consistracker
let audioCtx = null;

function getContext(isMuted) {
  if (isMuted) return null;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    return null;
  }
}

function tone(freq, startTime, duration, volume, isMuted) {
  const ctx = getContext(isMuted);
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const s = ctx.currentTime + startTime;

  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, s);
  gain.gain.linearRampToValueAtTime(volume, s + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, s + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(s);
  osc.stop(s + duration + 0.05);
}

function whoosh(isMuted) {
  const ctx = getContext(isMuted);
  if (!ctx) return;
  const n = Math.floor(ctx.sampleRate * 0.7);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const data = buf.getChannelData(0);

  for (let i = 0; i < n; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / n);
  }

  const src = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  src.buffer = buf;
  filter.type = 'bandpass';
  filter.frequency.value = 900;
  gain.gain.value = 0.1;

  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start();
}

export function playSfx(type, isMuted = false) {
  if (isMuted) return;
  if (type === 'start') {
    tone(392, 0, 1.2, 0.07, isMuted);
    tone(587, 0.18, 1.4, 0.06, isMuted);
  } else if (type === 'end') {
    [523, 659, 784].forEach((f, i) => tone(f, i * 0.22, 2, 0.06, isMuted));
  } else if (type === 'blow') {
    whoosh(isMuted);
    tone(196, 0.5, 2.5, 0.05, isMuted);
    tone(147, 0.5, 3, 0.04, isMuted);
  } else if (type === 'beep') {
    tone(523, 0, 0.8, 0.05, isMuted);
  } else if (type === 'check') {
    tone(587, 0, 0.12, 0.05, isMuted);
    tone(880, 0.08, 0.2, 0.05, isMuted);
  } else if (type === 'celebrate') {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.1, 0.35, 0.05, isMuted));
  }
}
