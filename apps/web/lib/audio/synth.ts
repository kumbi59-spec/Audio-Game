/**
 * Web Audio API synthesizer — no audio files required.
 *
 * Ambient tracks are looping procedural soundscapes built from filtered
 * noise and oscillators.  Sound cues are short synthesized bursts with
 * ADSR envelopes.  Everything runs inside a single shared AudioContext
 * that is lazily created on the first user gesture.
 */

import type { SoundCue } from "@/types/game";
import type { AmbientTrack } from "@/types/audio";

// ─── Context ─────────────────────────────────────────────────────────────────

let _ctx: AudioContext | null = null;

// If the context is suspended when ambient is requested, remember what to play
// so we can start it after the first user gesture unlocks the context.
let _pendingAmbient: { track: AmbientTrack; volume: number } | null = null;

function ctx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext();
  return _ctx;
}

/**
 * Call this from any user-gesture handler (click, keydown, touchstart).
 * It resumes a suspended AudioContext and starts any queued ambient track.
 */
export function unlockAudioContext(): void {
  if (!_ctx) return;
  if (_ctx.state !== "suspended") return;
  _ctx.resume().then(() => {
    if (_pendingAmbient) {
      const { track, volume } = _pendingAmbient;
      _pendingAmbient = null;
      synthPlayAmbient(track, volume);
    }
  }).catch(() => {});
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function gain(ac: AudioContext, value: number): GainNode {
  const g = ac.createGain();
  g.gain.value = value;
  return g;
}

function osc(
  ac: AudioContext,
  type: OscillatorType,
  freq: number,
  detune = 0,
): OscillatorNode {
  const o = ac.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  o.detune.value = detune;
  return o;
}

function lpf(ac: AudioContext, freq: number, q = 1): BiquadFilterNode {
  const f = ac.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}

function hpf(ac: AudioContext, freq: number): BiquadFilterNode {
  const f = ac.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = freq;
  return f;
}

function bpf(ac: AudioContext, freq: number, q = 1): BiquadFilterNode {
  const f = ac.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}

/** White-noise buffer (2 s, loops). */
function whiteNoise(ac: AudioContext): AudioBufferSourceNode {
  const frames = ac.sampleRate * 2;
  const buf = ac.createBuffer(1, frames, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) d[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  return src;
}

/** Pink noise via Paul Kellett's method. */
function pinkNoise(ac: AudioContext): AudioBufferSourceNode {
  const frames = ac.sampleRate * 2;
  const buf = ac.createBuffer(1, frames, ac.sampleRate);
  const d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < frames; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.96900 * b2 + w * 0.1538520;
    b3 = 0.86650 * b3 + w * 0.3104856;
    b4 = 0.55000 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.0168980;
    d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
  }
  const src = ac.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  return src;
}

/** LFO that modulates a GainNode's gain (tremolo). */
function lfoTremolo(
  ac: AudioContext,
  target: GainNode,
  rate: number,
  depth: number,
  center: number,
): OscillatorNode {
  const l = osc(ac, "sine", rate);
  const depthG = gain(ac, depth);
  target.gain.value = center;
  l.connect(depthG);
  depthG.connect(target.gain);
  return l;
}

/** Schedule a gain ramp to silence over `dur` seconds, then disconnect all nodes. */
function fadeAndStop(g: GainNode, dur: number, nodes: AudioNode[]): void {
  const ac = g.context as AudioContext;
  const t = ac.currentTime;
  g.gain.setTargetAtTime(0, t, dur / 5);
  setTimeout(() => nodes.forEach((n) => { try { n.disconnect(); } catch { /* already gone */ } }), (dur + 0.2) * 1000);
}

// ─── Ambient engine ──────────────────────────────────────────────────────────

interface AmbientHandle {
  masterGain: GainNode;
  nodes: AudioNode[];
}

let _ambient: AmbientHandle | null = null;

function buildAmbient(ac: AudioContext, track: AmbientTrack): AmbientHandle | null {
  const master = gain(ac, 0);
  const nodes: AudioNode[] = [master];

  function add(...n: AudioNode[]) { nodes.push(...n); }

  switch (track) {
    case "forest_day": {
      // Rustling leaves: pink noise through a band-pass, tremolo
      const pink = pinkNoise(ac);
      const bp = bpf(ac, 2800, 0.6);
      const g1 = gain(ac, 0.35);
      pink.connect(bp); bp.connect(g1); g1.connect(master);
      const lfo = lfoTremolo(ac, g1, 0.15, 0.08, 0.3);
      // Distant bird-like high oscillators
      const bird1 = osc(ac, "sine", 1800);
      const bg1 = gain(ac, 0.012);
      const lfo2 = lfoTremolo(ac, bg1, 0.4, 0.008, 0.01);
      bird1.connect(bg1); bg1.connect(master);
      // High shimmer
      const bird2 = osc(ac, "sine", 2400);
      const bg2 = gain(ac, 0.008);
      bird2.connect(bg2); bg2.connect(master);
      add(pink, bp, g1, lfo, bird1, bg1, lfo2, bird2, bg2);
      [pink, bird1, bird2, lfo, lfo2].forEach((n) => (n as AudioScheduledSourceNode).start());
      break;
    }

    case "forest_night": {
      const pink = pinkNoise(ac);
      const bp = bpf(ac, 1200, 0.5);
      const g1 = gain(ac, 0.18);
      pink.connect(bp); bp.connect(g1); g1.connect(master);
      // Slow cricket-like pulse
      const cricket = osc(ac, "sine", 3200);
      const cg = gain(ac, 0.006);
      const lfo = lfoTremolo(ac, cg, 6, 0.004, 0.004);
      cricket.connect(cg); cg.connect(master);
      // Low wind
      const wind = pinkNoise(ac);
      const wlp = lpf(ac, 180);
      const wg = gain(ac, 0.12);
      wind.connect(wlp); wlp.connect(wg); wg.connect(master);
      add(pink, bp, g1, cricket, cg, lfo, wind, wlp, wg);
      [pink, wind, cricket, lfo].forEach((n) => (n as AudioScheduledSourceNode).start());
      break;
    }

    case "dungeon": {
      // Deep pink noise
      const pink = pinkNoise(ac);
      const lp = lpf(ac, 220, 0.8);
      const g1 = gain(ac, 0.3);
      pink.connect(lp); lp.connect(g1); g1.connect(master);
      // Low ominous drone
      const drone = osc(ac, "sine", 55);
      const dg = gain(ac, 0.28);
      const lfoDrone = lfoTremolo(ac, dg, 0.08, 0.04, 0.26);
      drone.connect(dg); dg.connect(master);
      // Upper harmonic drone
      const drone2 = osc(ac, "triangle", 110);
      const dg2 = gain(ac, 0.07);
      drone2.connect(dg2); dg2.connect(master);
      add(pink, lp, g1, drone, dg, lfoDrone, drone2, dg2);
      [pink, drone, drone2, lfoDrone].forEach((n) => (n as AudioScheduledSourceNode).start());
      break;
    }

    case "cave": {
      // Very dark, resonant
      const pink = pinkNoise(ac);
      const lp = lpf(ac, 140, 1.2);
      const g1 = gain(ac, 0.22);
      pink.connect(lp); lp.connect(g1); g1.connect(master);
      // Sub rumble
      const sub = osc(ac, "sine", 38);
      const sg = gain(ac, 0.18);
      sub.connect(sg); sg.connect(master);
      // Slow tremolo on sub to simulate dripping sensation
      const lfo = lfoTremolo(ac, sg, 0.06, 0.06, 0.16);
      add(pink, lp, g1, sub, sg, lfo);
      [pink, sub, lfo].forEach((n) => (n as AudioScheduledSourceNode).start());
      break;
    }

    case "ocean": {
      // Wave noise: white noise, LFO on volume simulates wave rhythm
      const white = whiteNoise(ac);
      const lp = lpf(ac, 380, 0.7);
      const wg = gain(ac, 0);
      white.connect(lp); lp.connect(wg); wg.connect(master);
      const lfo = lfoTremolo(ac, wg, 0.14, 0.28, 0.3);
      // Deeper undertow noise
      const white2 = whiteNoise(ac);
      const lp2 = lpf(ac, 120);
      const wg2 = gain(ac, 0.12);
      white2.connect(lp2); lp2.connect(wg2); wg2.connect(master);
      add(white, lp, wg, lfo, white2, lp2, wg2);
      [white, white2, lfo].forEach((n) => (n as AudioScheduledSourceNode).start());
      break;
    }

    case "tavern": {
      // Warm murmur: band-pass pink noise + low floor
      const pink = pinkNoise(ac);
      const bp = bpf(ac, 500, 0.35);
      const g1 = gain(ac, 0.25);
      pink.connect(bp); bp.connect(g1); g1.connect(master);
      const lfo = lfoTremolo(ac, g1, 0.25, 0.06, 0.22);
      // Low warmth
      const floor = osc(ac, "triangle", 90);
      const fg = gain(ac, 0.06);
      floor.connect(fg); fg.connect(master);
      // High chatter texture
      const pink2 = pinkNoise(ac);
      const hp = hpf(ac, 1800);
      const hg = gain(ac, 0.05);
      pink2.connect(hp); hp.connect(hg); hg.connect(master);
      add(pink, bp, g1, lfo, floor, fg, pink2, hp, hg);
      [pink, pink2, floor, lfo].forEach((n) => (n as AudioScheduledSourceNode).start());
      break;
    }

    case "city_day": {
      // Traffic rumble + distant activity
      const pink = pinkNoise(ac);
      const hp = hpf(ac, 400);
      const g1 = gain(ac, 0.18);
      pink.connect(hp); hp.connect(g1); g1.connect(master);
      const drone = osc(ac, "sawtooth", 62);
      const dlp = lpf(ac, 150);
      const dg = gain(ac, 0.04);
      drone.connect(dlp); dlp.connect(dg); dg.connect(master);
      const lfo = lfoTremolo(ac, g1, 0.35, 0.05, 0.16);
      add(pink, hp, g1, drone, dlp, dg, lfo);
      [pink, drone, lfo].forEach((n) => (n as AudioScheduledSourceNode).start());
      break;
    }

    case "city_night": {
      const pink = pinkNoise(ac);
      const lp = lpf(ac, 280);
      const g1 = gain(ac, 0.11);
      pink.connect(lp); lp.connect(g1); g1.connect(master);
      const hum = osc(ac, "sine", 60);
      const hg = gain(ac, 0.07);
      hum.connect(hg); hg.connect(master);
      add(pink, lp, g1, hum, hg);
      [pink, hum].forEach((n) => (n as AudioScheduledSourceNode).start());
      break;
    }

    case "throne_room": {
      // Grand stone resonance
      const pink = pinkNoise(ac);
      const lp = lpf(ac, 90, 1.5);
      const g1 = gain(ac, 0.1);
      pink.connect(lp); lp.connect(g1); g1.connect(master);
      const drone = osc(ac, "sine", 70);
      const dg = gain(ac, 0.14);
      drone.connect(dg); dg.connect(master);
      const drone2 = osc(ac, "sine", 140);
      const dg2 = gain(ac, 0.04);
      drone2.connect(dg2); dg2.connect(master);
      add(pink, lp, g1, drone, dg, drone2, dg2);
      [pink, drone, drone2].forEach((n) => (n as AudioScheduledSourceNode).start());
      break;
    }

    case "market": {
      // Busy, layered
      const pink = pinkNoise(ac);
      const bp = bpf(ac, 700, 0.25);
      const g1 = gain(ac, 0.28);
      pink.connect(bp); bp.connect(g1); g1.connect(master);
      const lfo = lfoTremolo(ac, g1, 0.45, 0.07, 0.24);
      const pink2 = pinkNoise(ac);
      const hp = hpf(ac, 2200);
      const hg = gain(ac, 0.07);
      pink2.connect(hp); hp.connect(hg); hg.connect(master);
      const lfo2 = lfoTremolo(ac, hg, 0.6, 0.03, 0.06);
      add(pink, bp, g1, lfo, pink2, hp, hg, lfo2);
      [pink, pink2, lfo, lfo2].forEach((n) => (n as AudioScheduledSourceNode).start());
      break;
    }

    default:
      return null;
  }

  master.connect(ac.destination);
  return { masterGain: master, nodes };
}

export function synthPlayAmbient(track: AmbientTrack, volume: number): void {
  if (typeof window === "undefined") return;
  synthStopAmbient();
  if (track === "none") return;

  const ac = ctx();

  // Mobile browsers suspend AudioContext until a user gesture. Queue the track
  // and let unlockAudioContext() start it on the first interaction.
  if (ac.state === "suspended") {
    _pendingAmbient = { track, volume };
    return;
  }

  _pendingAmbient = null;
  const handle = buildAmbient(ac, track);
  if (!handle) return;

  // Fade in
  handle.masterGain.gain.setValueAtTime(0, ac.currentTime);
  handle.masterGain.gain.linearRampToValueAtTime(volume, ac.currentTime + 1.5);
  _ambient = handle;
}

export function synthStopAmbient(): void {
  if (!_ambient) return;
  const { masterGain, nodes } = _ambient;
  fadeAndStop(masterGain, 1.2, nodes);
  _ambient = null;
}

export function synthSetAmbientVolume(volume: number): void {
  if (!_ambient) return;
  _ambient.masterGain.gain.setTargetAtTime(
    Math.max(0, Math.min(1, volume)),
    (_ctx?.currentTime ?? 0),
    0.1,
  );
}

// ─── Sound cues ──────────────────────────────────────────────────────────────

/** ADSR envelope on a GainNode. */
function adsr(
  g: GainNode,
  attack: number,
  decay: number,
  sustain: number,
  release: number,
  peak = 1,
): number {
  const ac = g.context as AudioContext;
  const t = ac.currentTime;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.linearRampToValueAtTime(sustain * peak, t + attack + decay);
  const releaseStart = t + attack + decay;
  g.gain.setValueAtTime(sustain * peak, releaseStart);
  g.gain.linearRampToValueAtTime(0, releaseStart + release);
  return releaseStart + release; // total duration
}

/** Play a single oscillator tone with ADSR and auto-cleanup. */
function tone(
  ac: AudioContext,
  type: OscillatorType,
  freq: number,
  vol: number,
  a: number,
  d: number,
  s: number,
  r: number,
  dest: AudioNode = ac.destination,
): void {
  const o = osc(ac, type, freq);
  const g = gain(ac, 0);
  const end = adsr(g, a, d, s, r, vol);
  o.connect(g); g.connect(dest);
  o.start(ac.currentTime);
  o.stop(ac.currentTime + end + 0.05);
}

/** Glide a tone from startFreq to endFreq. */
function glide(
  ac: AudioContext,
  type: OscillatorType,
  startFreq: number,
  endFreq: number,
  vol: number,
  dur: number,
  dest: AudioNode = ac.destination,
): void {
  const o = osc(ac, type, startFreq);
  const g = gain(ac, vol);
  const t = ac.currentTime;
  o.frequency.setValueAtTime(startFreq, t);
  o.frequency.linearRampToValueAtTime(endFreq, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.linearRampToValueAtTime(0, t + dur);
  o.connect(g); g.connect(dest);
  o.start(t);
  o.stop(t + dur + 0.05);
}

/** Play a burst of noise with envelope. */
function noiseBurst(
  ac: AudioContext,
  filterFreq: number,
  vol: number,
  dur: number,
  filterType: BiquadFilterType = "bandpass",
  dest: AudioNode = ac.destination,
): void {
  const frames = Math.ceil(ac.sampleRate * (dur + 0.1));
  const buf = ac.createBuffer(1, frames, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) d[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const f = ac.createBiquadFilter();
  f.type = filterType;
  f.frequency.value = filterFreq;
  const g = gain(ac, vol);
  const t = ac.currentTime;
  g.gain.setValueAtTime(vol, t);
  g.gain.linearRampToValueAtTime(0, t + dur);
  src.connect(f); f.connect(g); g.connect(dest);
  src.start(t);
  src.stop(t + dur + 0.1);
}

const CUE_FNS: Record<SoundCue, (ac: AudioContext) => void> = {
  // ── Combat ───────────────────────────────────────────────────────────────
  combat_start(ac) {
    // Distorted rising hit
    glide(ac, "sawtooth", 110, 220, 0.22, 0.12);
    noiseBurst(ac, 800, 0.18, 0.25, "highpass");
    tone(ac, "square", 220, 0.12, 0.01, 0.06, 0.2, 0.25);
  },
  combat_end(ac) {
    // Resolution — C major chord fade
    const t = ac.currentTime;
    for (const [freq, delay] of [[261.6, 0], [329.6, 0.05], [392, 0.1]] as [number, number][]) {
      const o = osc(ac, "sine", freq);
      const g = gain(ac, 0);
      o.connect(g); g.connect(ac.destination);
      g.gain.setValueAtTime(0, t + delay);
      g.gain.linearRampToValueAtTime(0.14, t + delay + 0.08);
      g.gain.linearRampToValueAtTime(0, t + delay + 1.2);
      o.start(t + delay);
      o.stop(t + delay + 1.3);
    }
  },

  // ── Progression ──────────────────────────────────────────────────────────
  level_up(ac) {
    // Classic ascending arpeggio C4-E4-G4-C5
    const notes = [261.6, 329.6, 392, 523.3];
    notes.forEach((freq, i) => {
      const t = ac.currentTime + i * 0.14;
      const o = osc(ac, "sine", freq);
      const g = gain(ac, 0);
      o.connect(g); g.connect(ac.destination);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.22, t + 0.03);
      g.gain.linearRampToValueAtTime(0, t + 0.3);
      o.start(t); o.stop(t + 0.35);
    });
    // Sparkle on top
    setTimeout(() => noiseBurst(ac, 4000, 0.08, 0.3, "highpass"), 550);
  },

  quest_complete(ac) {
    // Short triumphant fanfare: G4-C5-E5
    const notes: [number, number][] = [[392, 0], [523.3, 0.18], [659.3, 0.36]];
    notes.forEach(([freq, delay]) => {
      const t = ac.currentTime + delay;
      const o = osc(ac, "triangle", freq);
      const g = gain(ac, 0);
      o.connect(g); g.connect(ac.destination);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.18, t + 0.04);
      g.gain.linearRampToValueAtTime(0.12, t + 0.15);
      g.gain.linearRampToValueAtTime(0, t + 0.55);
      o.start(t); o.stop(t + 0.6);
    });
  },

  quest_fail(ac) {
    const notes: [number, number][] = [[392, 0], [349.2, 0.15], [293.7, 0.32]];
    notes.forEach(([freq, delay]) => {
      const t = ac.currentTime + delay;
      const o = osc(ac, "triangle", freq);
      const g = gain(ac, 0);
      o.connect(g); g.connect(ac.destination);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.15, t + 0.02);
      g.gain.linearRampToValueAtTime(0, t + 0.38);
      o.start(t); o.stop(t + 0.45);
    });
  },

  discovery(ac) {
    // Rising magical sparkle: 440→880→1760 Hz
    const notes: [number, number][] = [[440, 0], [880, 0.2], [1760, 0.4]];
    notes.forEach(([freq, delay]) => {
      const t = ac.currentTime + delay;
      const o = osc(ac, "sine", freq);
      const g = gain(ac, 0);
      o.connect(g); g.connect(ac.destination);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.16, t + 0.03);
      g.gain.linearRampToValueAtTime(0, t + 0.25);
      o.start(t); o.stop(t + 0.3);
    });
    noiseBurst(ac, 5000, 0.07, 0.4, "highpass");
  },

  treasure_found(ac) {
    // Shimmer: C5-E5-G5-C6 rapid arpeggio
    const notes = [523.3, 659.3, 784, 1046.5];
    notes.forEach((freq, i) => {
      const t = ac.currentTime + i * 0.1;
      const o = osc(ac, "sine", freq);
      const g = gain(ac, 0);
      o.connect(g); g.connect(ac.destination);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.2, t + 0.02);
      g.gain.linearRampToValueAtTime(0, t + 0.3);
      o.start(t); o.stop(t + 0.35);
    });
    // High jingle
    noiseBurst(ac, 6000, 0.06, 0.5, "highpass");
  },

  // ── Items / Doors ─────────────────────────────────────────────────────────
  item_pickup(ac) {
    glide(ac, "sine", 660, 1320, 0.18, 0.15);
    noiseBurst(ac, 3000, 0.06, 0.1, "highpass");
  },

  door_open(ac) {
    glide(ac, "sawtooth", 80, 180, 0.14, 0.9);
    noiseBurst(ac, 400, 0.12, 0.8, "bandpass");
  },

  door_locked(ac) {
    // Two dull thuds
    noiseBurst(ac, 200, 0.22, 0.15, "lowpass");
    setTimeout(() => noiseBurst(ac, 150, 0.18, 0.15, "lowpass"), 200);
    glide(ac, "sine", 200, 100, 0.12, 0.3);
  },

  // ── Magic ─────────────────────────────────────────────────────────────────
  magic_cast(ac) {
    glide(ac, "sine", 300, 1200, 0.15, 0.5);
    noiseBurst(ac, 3500, 0.1, 0.5, "highpass");
    tone(ac, "sine", 880, 0.1, 0.05, 0.1, 0.3, 0.35);
  },

  spell_fail(ac) {
    glide(ac, "sawtooth", 440, 110, 0.2, 0.6);
    noiseBurst(ac, 600, 0.14, 0.5, "bandpass");
  },

  // ── NPC ───────────────────────────────────────────────────────────────────
  npc_friendly(ac) {
    // Warm two-tone rise C4→G4
    tone(ac, "sine", 261.6, 0.14, 0.03, 0.1, 0.6, 0.4);
    const t = ac.currentTime + 0.25;
    const o = osc(ac, "sine", 392);
    const g = gain(ac, 0);
    o.connect(g); g.connect(ac.destination);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.14, t + 0.05);
    g.gain.linearRampToValueAtTime(0, t + 0.5);
    o.start(t); o.stop(t + 0.6);
  },

  npc_hostile(ac) {
    glide(ac, "sawtooth", 440, 220, 0.2, 0.4);
    noiseBurst(ac, 500, 0.15, 0.3, "bandpass");
  },

  // ── Danger ────────────────────────────────────────────────────────────────
  danger_near(ac) {
    // Low pulsing rumble
    const o = osc(ac, "sine", 58);
    const g = gain(ac, 0);
    const lfo = osc(ac, "sine", 3.5);
    const ld = gain(ac, 0.12);
    g.gain.value = 0.14;
    lfo.connect(ld); ld.connect(g.gain);
    o.connect(g); g.connect(ac.destination);
    const t = ac.currentTime;
    g.gain.setValueAtTime(0.14, t);
    g.gain.linearRampToValueAtTime(0, t + 1.5);
    o.start(t); lfo.start(t);
    o.stop(t + 1.6); lfo.stop(t + 1.6);
  },

  death_nearby(ac) {
    glide(ac, "sine", 55, 28, 0.22, 1.2);
    noiseBurst(ac, 150, 0.15, 1.0, "lowpass");
  },

  // ── UI ────────────────────────────────────────────────────────────────────
  success(ac) {
    // G→C bright chime
    tone(ac, "sine", 392, 0.18, 0.01, 0.05, 0.6, 0.3);
    const t = ac.currentTime + 0.18;
    const o = osc(ac, "sine", 523.3);
    const g = gain(ac, 0);
    o.connect(g); g.connect(ac.destination);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.2, t + 0.02);
    g.gain.linearRampToValueAtTime(0, t + 0.4);
    o.start(t); o.stop(t + 0.45);
  },

  error(ac) {
    // Harsh buzzer — two descending semitones
    tone(ac, "square", 311, 0.18, 0.005, 0.05, 0.5, 0.2);
    setTimeout(() => tone(ac, "square", 277.2, 0.16, 0.005, 0.04, 0.4, 0.2), 160);
  },

  click(ac) {
    noiseBurst(ac, 1500, 0.2, 0.04, "bandpass");
  },
};

export function synthPlayCue(cue: SoundCue, volume = 0.7): void {
  if (typeof window === "undefined") return;
  const ac = ctx();

  // Route all cue output through a master gain so we can honour volume
  const master = gain(ac, volume);
  master.connect(ac.destination);

  const fn = CUE_FNS[cue];
  if (!fn) return;

  // Temporarily patch ac.destination for this cue so all internal
  // tone() / glide() / noiseBurst() calls route through master gain.
  // We do this by calling each fn with a custom proxy context object.
  const proxy = new Proxy(ac, {
    get(target, prop) {
      if (prop === "destination") return master;
      const v = target[prop as keyof AudioContext];
      return typeof v === "function" ? (v as Function).bind(target) : v;
    },
  });

  try {
    fn(proxy as AudioContext);
  } catch {
    fn(ac);
  }

  // Clean up master gain node after 3 s (longest cue)
  setTimeout(() => { try { master.disconnect(); } catch { /* gone */ } }, 3000);
}
