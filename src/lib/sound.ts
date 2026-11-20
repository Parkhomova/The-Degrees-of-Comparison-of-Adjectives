"use client";

let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(v: boolean) {
  muted = v;
  if (typeof window !== "undefined") localStorage.setItem("cmp_muted", v ? "1" : "0");
}

export function loadMuted(): boolean {
  if (typeof window === "undefined") return false;
  muted = localStorage.getItem("cmp_muted") === "1";
  return muted;
}

export function getMuted() {
  return muted;
}

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (muted) return null;
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

type ToneOpts = {
  freq: number;
  dur?: number;
  type?: OscillatorType;
  gain?: number;
  to?: number;
  delay?: number;
};

function tone({ freq, dur = 0.14, type = "triangle", gain = 0.16, to, delay = 0 }: ToneOpts) {
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime + delay;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(40, to), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(dur = 0.18, gain = 0.1) {
  const a = ac();
  if (!a) return;
  const frames = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, frames, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const src = a.createBufferSource();
  src.buffer = buf;
  const g = a.createGain();
  g.gain.value = gain;
  const filt = a.createBiquadFilter();
  filt.type = "bandpass";
  filt.frequency.value = 900;
  src.connect(filt).connect(g).connect(a.destination);
  src.start();
}

export const sfx = {
  click: () => tone({ freq: 420, dur: 0.05, type: "square", gain: 0.05 }),
  hover: () => tone({ freq: 660, dur: 0.03, type: "sine", gain: 0.025 }),
  correct: (combo = 1) => {
    const base = 523.25 * Math.pow(1.0595, Math.min(combo, 8) * 2);
    tone({ freq: base, dur: 0.1, type: "triangle", gain: 0.16 });
    tone({ freq: base * 1.5, dur: 0.14, type: "triangle", gain: 0.12, delay: 0.07 });
  },
  wrong: () => {
    tone({ freq: 190, to: 90, dur: 0.28, type: "sawtooth", gain: 0.13 });
    noise(0.14, 0.05);
  },
  tick: () => tone({ freq: 1200, dur: 0.03, type: "square", gain: 0.035 }),
  warn: () => tone({ freq: 880, to: 620, dur: 0.1, type: "square", gain: 0.08 }),
  start: () => {
    [392, 523, 659].forEach((f, i) =>
      tone({ freq: f, dur: 0.16, type: "triangle", gain: 0.13, delay: i * 0.08 }),
    );
  },
  win: () => {
    [523, 659, 784, 1046].forEach((f, i) =>
      tone({ freq: f, dur: 0.24, type: "triangle", gain: 0.14, delay: i * 0.1 }),
    );
    noise(0.5, 0.04);
  },
  lose: () => {
    [440, 392, 330, 262].forEach((f, i) =>
      tone({ freq: f, dur: 0.22, type: "sine", gain: 0.12, delay: i * 0.11 }),
    );
  },
  coin: () => tone({ freq: 1180, to: 1760, dur: 0.09, type: "square", gain: 0.07 }),
  whoosh: () => noise(0.25, 0.06),
};
