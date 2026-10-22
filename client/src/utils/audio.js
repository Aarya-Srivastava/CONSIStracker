// Web Audio API Synthesizer & Procedural Ambient Sound Generator for Consistracker
let audioCtx = null;
let currentVolumeMultiplier = 0.8;

export function setVolumeLevel(level) {
  currentVolumeMultiplier = Math.max(0, Math.min(1, typeof level === 'number' ? level : 0.8));
  if (ambientGainNode && audioCtx) {
    ambientGainNode.gain.setTargetAtTime(ambientVolume * currentVolumeMultiplier * 0.45, audioCtx.currentTime, 0.05);
  }
}

export function getVolumeLevel() {
  return currentVolumeMultiplier;
}

function getContext(isMuted) {
  if (isMuted || currentVolumeMultiplier <= 0.01) return null;
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
  const scaledVol = volume * currentVolumeMultiplier;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const s = ctx.currentTime + startTime;

  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, s);
  gain.gain.linearRampToValueAtTime(scaledVol, s + 0.05);
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
  gain.gain.value = 0.1 * currentVolumeMultiplier;

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

// ---------------------------------------------------------------------------
// Continuous Procedural Ambient Noise Generator (Web Audio API)
// ---------------------------------------------------------------------------
let ambientNodes = [];
let ambientGainNode = null;
let currentAmbientType = 'off'; // 'off' | 'brown' | 'rain' | 'drone'
let ambientVolume = 0.5;

export function getAmbientState() {
  return {
    type: currentAmbientType,
    volume: ambientVolume
  };
}

export function setAmbientVolume(vol) {
  ambientVolume = Math.max(0, Math.min(1, vol));
  if (ambientGainNode && audioCtx) {
    const target = currentAmbientType === 'off' ? 0 : ambientVolume * currentVolumeMultiplier * 0.45;
    ambientGainNode.gain.setTargetAtTime(target, audioCtx.currentTime, 0.05);
  }
}

export function stopAmbient() {
  currentAmbientType = 'off';
  if (ambientNodes.length > 0) {
    ambientNodes.forEach((node) => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) {}
    });
    ambientNodes = [];
  }
  if (ambientGainNode) {
    try {
      ambientGainNode.disconnect();
    } catch (e) {}
    ambientGainNode = null;
  }
}

export function startAmbient(type, isMuted = false) {
  stopAmbient();
  if (type === 'off' || isMuted || currentVolumeMultiplier <= 0.01) {
    currentAmbientType = 'off';
    return;
  }

  const ctx = getContext(isMuted);
  if (!ctx) return;

  currentAmbientType = type;

  // Master ambient gain
  ambientGainNode = ctx.createGain();
  ambientGainNode.gain.setValueAtTime(ambientVolume * currentVolumeMultiplier * 0.45, ctx.currentTime);
  ambientGainNode.connect(ctx.destination);

  if (type === 'brown') {
    // 5-second seamless looped Brown Noise buffer
    const bufferSize = ctx.sampleRate * 5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.2;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;

    src.connect(filter);
    filter.connect(ambientGainNode);
    src.start();
    ambientNodes = [src, filter];
  } else if (type === 'rain') {
    // 5-second looped Rain Pink noise with subtle atmospheric filtering
    const bufferSize = ctx.sampleRate * 5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;
      data[i] = pink * 0.14;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1400;

    src.connect(filter);
    filter.connect(ambientGainNode);
    src.start();
    ambientNodes = [src, filter];
  } else if (type === 'drone') {
    // Dual Detuned Sine Oscillators for 432Hz harmonic meditation / deep focus drone
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();

    osc1.type = 'triangle';
    osc1.frequency.value = 108; // A2 harmonic

    osc2.type = 'sine';
    osc2.frequency.value = 108.6; // gentle 0.6Hz binaural wave

    filter.type = 'lowpass';
    filter.frequency.value = 350;

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(ambientGainNode);

    osc1.start();
    osc2.start();
    ambientNodes = [osc1, osc2, filter];
  }
}
