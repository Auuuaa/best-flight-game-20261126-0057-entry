// Alpine Courier — synthesized sound, no audio files. A tiny WebAudio engine
// hum, a chime for rings, a thud for terrain and a jingle for landings.
// Everything is guarded: with no user gesture yet (or no audio device) the
// game stays silent and never throws.

export function makeAudio() {
  return {
    context: null,
    engineOsc: null,
    engineGain: null,
    muted: false,
  };
}

function ensureContext(audio) {
  if (audio.context) return audio.context;
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    audio.context = new Ctor();
    // The engine is a low sawtooth whose pitch follows the throttle.
    audio.engineOsc = audio.context.createOscillator();
    audio.engineOsc.type = 'sawtooth';
    audio.engineOsc.frequency.value = 55;
    const filter = audio.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    audio.engineGain = audio.context.createGain();
    audio.engineGain.gain.value = 0;
    audio.engineOsc.connect(filter);
    filter.connect(audio.engineGain);
    audio.engineGain.connect(audio.context.destination);
    audio.engineOsc.start();
  } catch (error) {
    audio.context = null;
  }
  return audio.context;
}

// Call once per frame: the hum tracks the throttle and fades on the ground.
export function updateEngineSound(audio, throttle, airborne) {
  if (audio.muted) return;
  const ctx = ensureContext(audio);
  if (!ctx || !audio.engineOsc) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  const target = airborne || throttle > 0.05 ? 0.028 + throttle * 0.05 : 0;
  audio.engineGain.gain.setTargetAtTime(target, ctx.currentTime, 0.1);
  audio.engineOsc.frequency.setTargetAtTime(52 + throttle * 88, ctx.currentTime, 0.08);
}

function blip(audio, frequency, startAt, duration, type, volume) {
  const ctx = ensureContext(audio);
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0, ctx.currentTime + startAt);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startAt + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + startAt);
    osc.stop(ctx.currentTime + startAt + duration + 0.05);
  } catch (error) {
    // A failed blip is never worth crashing the game over.
  }
}

export function playRingChime(audio) {
  blip(audio, 880, 0, 0.35, 'sine', 0.16);
  blip(audio, 1318, 0.08, 0.4, 'sine', 0.12);
}

export function playThud(audio) {
  const ctx = ensureContext(audio);
  if (!ctx) return;
  try {
    const length = Math.floor(ctx.sampleRate * 0.18);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    const gain = ctx.createGain();
    gain.gain.value = 0.35;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  } catch (error) {
    // Silence is acceptable; a crash is not.
  }
}

export function playLandingJingle(audio) {
  blip(audio, 523, 0, 0.22, 'triangle', 0.14);
  blip(audio, 659, 0.1, 0.22, 'triangle', 0.14);
  blip(audio, 784, 0.2, 0.4, 'triangle', 0.14);
}
