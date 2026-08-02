// Synthesizes an original sci-fi "power-up" sound effect using the Web
// Audio API — oscillator sweeps, mechanical click transients, and a noise
// burst. No sampled/copyrighted audio involved, just generated waveforms.
function buildAndPlay(ctx) {
  const now = ctx.currentTime;

  // Rising engage sweep
  const sweep = ctx.createOscillator();
  sweep.type = 'sawtooth';
  sweep.frequency.setValueAtTime(80, now);
  sweep.frequency.exponentialRampToValueAtTime(820, now + 0.5);
  const sweepGain = ctx.createGain();
  sweepGain.gain.setValueAtTime(0.0001, now);
  sweepGain.gain.exponentialRampToValueAtTime(0.13, now + 0.15);
  sweepGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
  sweep.connect(sweepGain).connect(ctx.destination);
  sweep.start(now);
  sweep.stop(now + 0.6);

  // Mechanical latch clicks, like armor plates locking in
  [0.05, 0.18, 0.32, 0.5].forEach((t) => {
    const click = ctx.createOscillator();
    click.type = 'square';
    click.frequency.value = 220 + Math.random() * 80;
    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.07, now + t);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.04);
    click.connect(clickGain).connect(ctx.destination);
    click.start(now + t);
    click.stop(now + t + 0.05);
  });

  // Hydraulic hiss (filtered noise burst)
  const bufferSize = Math.floor(ctx.sampleRate * 0.4);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.value = 1500;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.05, now);
  noise.connect(noiseFilter).connect(noiseGain).connect(ctx.destination);
  noise.start(now);

  // Final low thump — the lock/clunk as the visor seals shut
  const thump = ctx.createOscillator();
  thump.type = 'sine';
  thump.frequency.setValueAtTime(150, now + 0.55);
  thump.frequency.exponentialRampToValueAtTime(40, now + 0.75);
  const thumpGain = ctx.createGain();
  thumpGain.gain.setValueAtTime(0.22, now + 0.55);
  thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
  thump.connect(thumpGain).connect(ctx.destination);
  thump.start(now + 0.55);
  thump.stop(now + 0.85);

  setTimeout(() => ctx.close(), 1000);
}

// Browsers only allow audio to actually produce sound once the page has
// registered a "user gesture" (click/tap/keypress) — a fresh page load
// (e.g. after restarting the server and reopening the tab) has no gesture
// yet, so a plain autoplay attempt gets silently suspended. This tries to
// play immediately, and if the browser blocks it, plays it the instant the
// person clicks/taps/types anywhere on the page instead of staying silent.
export function playBootSound() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  let ctx;
  try {
    ctx = new AudioCtx();
  } catch {
    return;
  }

  const tryPlay = () => {
    if (ctx.state === 'running') {
      try { buildAndPlay(ctx); } catch { /* ignore */ }
      return true;
    }
    return false;
  };

  ctx.resume().catch(() => {});

  // Give the resume() call a brief moment to settle, then check.
  setTimeout(() => {
    if (tryPlay()) return;

    const events = ['pointerdown', 'touchstart', 'keydown'];
    const onFirstInteraction = () => {
      ctx.resume().then(() => {
        buildAndPlay(ctx);
      }).catch(() => {});
      events.forEach((evt) => window.removeEventListener(evt, onFirstInteraction, true));
    };
    events.forEach((evt) => window.addEventListener(evt, onFirstInteraction, true));
  }, 50);
}
