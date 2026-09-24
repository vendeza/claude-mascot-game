// Renders each in-game music track to a lossless WAV by capturing the game's own audio output.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const OUT = process.argv[2] || __dirname;
const TRACKS = [ // order the Track button cycles through
  { id: 'calm', file: 'night-shift', loops: 4, loopSec: 32 * 60 / 96 / 2 },
  { id: 'upbeat', file: 'ship-it', loops: 5, loopSec: 32 * 60 / 128 / 2 },
  { id: 'battle', file: 'merge-rush', loops: 6, loopSec: 32 * 60 / 160 / 2 },
  { id: 'boss', file: 'legacy-monolith', loops: 6, loopSec: 32 * 60 / 150 / 2 },
];
const TAP = `(() => {
  const orig = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dest, ...a) {
    if (dest instanceof AudioDestinationNode && !this.__noTap) {
      const ctx = dest.context;
      if (!ctx.__tap) ctx.__tap = ctx.createGain();
      orig.call(this, ctx.__tap, ...a);
    }
    return orig.call(this, dest, ...a);
  };
  try { localStorage.setItem('cw-mute', '1'); localStorage.setItem('cw-music', '1'); localStorage.setItem('cw-musvol', '100'); } catch (e) {}
})();`;
function wav(chL, chR, rate) {
  const n = chL.length, buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(chL[i] * 32767))), 44 + i * 4);
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(chR[i] * 32767))), 46 + i * 4);
  }
  return buf;
}
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage();
  await p.addInitScript(TAP);
  await p.goto('file://' + path.resolve(__dirname, '../../index.html'));
  await p.mouse.click(5, 5); // unlocks audio; the menu starts Night Shift
  await p.waitForTimeout(500);
  for (const t of TRACKS) {
    // music off, pin the track while silent, then turn music on inside the capture so step 0 is recorded
    if ((await p.evaluate(() => !!window.__cw.music.track))) { await p.keyboard.press('KeyN'); await p.waitForTimeout(500); }
    for (let i = 0; i < 6 && (await p.evaluate(() => window.__cw.music.want)) !== t.id; i++) { await p.keyboard.press('KeyT'); await p.waitForTimeout(40); }
    if ((await p.evaluate(() => window.__cw.music.want)) !== t.id) throw new Error('could not select ' + t.id);
    const dur = t.loops * t.loopSec + 1.5;
    const data = await p.evaluate(async (dur) => {
      const ctx = window.__cw.actx, L = [], R = [];
      const sp = ctx.createScriptProcessor(4096, 2, 2);
      const mute = ctx.createGain(); mute.gain.value = 0; mute.__noTap = true;
      sp.__noTap = true;
      sp.onaudioprocess = e => { L.push(new Float32Array(e.inputBuffer.getChannelData(0))); R.push(new Float32Array(e.inputBuffer.getChannelData(1))); };
      ctx.__tap.connect(sp); sp.connect(mute); mute.connect(ctx.destination);
      await new Promise(r => setTimeout(r, 300));
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyN', key: 'n' }));
      await new Promise(r => setTimeout(r, dur * 1000));
      ctx.__tap.disconnect(sp); sp.disconnect();
      const join = a => { const out = new Float32Array(a.reduce((s, x) => s + x.length, 0)); let o = 0; for (const x of a) { out.set(x, o); o += x.length; } return out; };
      const enc = f => { const u = new Uint8Array(f.buffer); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
      return { rate: ctx.sampleRate, L: enc(join(L)), R: enc(join(R)) };
    }, dur);
    const f = s => { const bb = Buffer.from(s, 'base64'); return new Float32Array(bb.buffer, bb.byteOffset, bb.length / 4); };
    const L = f(data.L), R = f(data.R);
    let peak = 0; for (let i = 0; i < L.length; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
    fs.writeFileSync(path.join(OUT, `${t.file}.wav`), wav(L, R, data.rate));
    console.log(t.file, (L.length / data.rate).toFixed(1) + 's', 'rate', data.rate, 'peak', peak.toFixed(3));
  }
  await b.close();
})();
