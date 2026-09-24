// Injected into the game page: builds a 1280x720 frame (game + side panel + captions),
// records it together with all game audio, and exposes scripting helpers for scenarios.
(() => {
  const W = 1280, H = 720;
  const cw = window.__cw;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  cv.style.cssText = 'position:fixed;left:-99999px;top:0';
  document.body.appendChild(cv);
  const c = cv.getContext('2d');
  const game = document.getElementById('game');
  const portrait = document.getElementById('portrait');

  const C = {
    bg: '#171411', panel: '#201b17', line: '#372e27', text: '#efe6dc', muted: '#a39487',
    clawd: '#d77757', tool: '#e2b457', noise: '#e0605a', ok: '#8fbf73', sys: '#6b5f55', blue: '#9fc4d8',
  };
  const S = { cap: null, capT: 0, card: null, cardT: 0, pulse: 0 };
  window.__demo = S;

  function wrap(text, x, y, maxW, lh) {
    const words = text.split(' ');
    let line = '', yy = y;
    for (const w of words) {
      const t = line ? line + ' ' + w : w;
      if (c.measureText(t).width > maxW && line) { c.fillText(line, x, yy); line = w; yy += lh; }
      else line = t;
    }
    if (line) c.fillText(line, x, yy);
    return yy + lh;
  }

  function drawPanel(now) {
    const G = cw.G;
    const x0 = 808, w = 436;
    c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    c.fillStyle = C.clawd; c.font = '34px Silkscreen, monospace';
    c.fillText('CONTEXT WINDOW', x0, 104);
    c.fillStyle = C.muted; c.font = '17px "IBM Plex Mono", monospace';
    c.fillText(`Floor ${G.floor} · ${cw.theme}   Score ${G.score}`, x0, 136);

    // context bar
    const items = G.items.reduce((s, it) => s + 0, 0);
    const tot = cw.total();
    const itemsK = tot - 12 - G.output - G.noise;
    const by = 182;
    c.fillStyle = C.text; c.font = '18px "IBM Plex Mono", monospace';
    c.fillText(`Context ${Math.min(tot, 200)}k / 200k`, x0, by - 12);
    const pulse = S.pulse > 0 ? 0.5 + 0.5 * Math.sin(now / 90) : 0;
    c.fillStyle = '#120f0d'; c.fillRect(x0, by, w, 22);
    c.strokeStyle = pulse ? `rgba(215,119,87,${0.4 + 0.6 * pulse})` : C.line; c.lineWidth = pulse ? 3 : 1;
    c.strokeRect(x0 + 0.5, by + 0.5, w - 1, 21);
    let xx = x0 + 1; let rest = w - 2;
    for (const [v, col] of [[12, C.sys], [itemsK, C.clawd], [G.output, C.tool], [G.noise, C.noise]]) {
      const ww = Math.min(rest, Math.round((v / 200) * (w - 2)));
      c.fillStyle = col; c.fillRect(xx, by + 1, ww, 20); xx += ww; rest -= ww;
    }
    c.font = '14px "IBM Plex Mono", monospace';
    const leg = [['system', C.sys, 12], ['items', C.clawd, itemsK], ['output', C.tool, G.output], ['noise', C.noise, G.noise]];
    let lx = x0;
    for (const [n, col, v] of leg) {
      c.fillStyle = col; c.fillRect(lx, by + 36, 10, 10);
      c.fillStyle = C.muted; const t = `${n} ${v}k`; c.fillText(t, lx + 15, by + 46); lx += c.measureText(t).width + 30;
    }
    const eff = Math.round(Math.max(0.4, 0.7 - 0.08 * G.stats.compactions) * 100);
    c.fillStyle = G.cd ? C.muted : C.ok;
    c.fillText(G.cd ? `/compact in ${G.cd} turns · ${eff}%` : `/compact ready · ${eff}%`, x0, by + 72);

    // caption
    if (S.cap) {
      const a = Math.min(1, (now - S.capT) / 250);
      c.globalAlpha = a;
      const dy = Math.round((1 - a) * 10);
      c.fillStyle = C.text; c.font = '500 34px "IBM Plex Mono", monospace';
      let y = wrap(S.cap.title, x0, 360 + dy, w, 44);
      if (S.cap.sub) { c.fillStyle = C.muted; c.font = '21px "IBM Plex Mono", monospace'; wrap(S.cap.sub, x0, y + 8, w, 30); }
      c.globalAlpha = 1;
    }
    c.fillStyle = '#6f635a'; c.font = '14px "IBM Plex Mono", monospace';
    c.fillText('Fan game · not affiliated with Anthropic', x0, 684);
  }

  function drawDialog(gx, gy, gw, gh) {
    const d = cw.dialog;
    if (!d.open) return;
    const bx = gx + 14, bw = gw - 28;
    c.font = '19px "IBM Plex Mono", monospace';
    let lines = 1, line = '';
    for (const w of d.text.split(' ')) { const t = line ? line + ' ' + w : w; if (c.measureText(t).width > bw - 130 && line) { lines++; line = w; } else line = t; }
    const bh = Math.max(112, 64 + lines * 26), byy = gy + gh - bh - 14;
    c.fillStyle = 'rgba(24,20,17,0.96)'; c.fillRect(bx, byy, bw, bh);
    c.strokeStyle = '#5a7385'; c.lineWidth = 2; c.strokeRect(bx + 1, byy + 1, bw - 2, bh - 2);
    c.imageSmoothingEnabled = false;
    c.fillStyle = '#1f2830'; c.fillRect(bx + 14, byy + 14, 84, 84);
    c.drawImage(portrait, bx + 14, byy + 14, 84, 84);
    c.fillStyle = C.blue; c.font = '18px Silkscreen, monospace';
    c.fillText('The Maintainer' + (d.pages > 1 ? ` · ${d.page + 1}/${d.pages}` : ''), bx + 114, byy + 36);
    c.fillStyle = C.text; c.font = '19px "IBM Plex Mono", monospace';
    wrap(d.text.slice(0, d.shown), bx + 114, byy + 64, bw - 130, 26);
  }

  function drawCard(now) {
    if (!S.card) return;
    const t = (now - S.cardT) / 1000;
    const a = Math.min(1, t / 0.35);
    c.globalAlpha = 0.86 * a; c.fillStyle = '#0d0b0a'; c.fillRect(0, 0, W, H); c.globalAlpha = a;
    c.textAlign = 'center';
    const k = S.card;
    c.fillStyle = k.color || C.clawd; c.font = `${k.size || 72}px Silkscreen, monospace`;
    c.fillText(k.title, W / 2, H / 2 - 20 + Math.round((1 - a) * 16));
    c.fillStyle = C.text; c.font = '26px "IBM Plex Mono", monospace';
    if (k.sub) c.fillText(k.sub, W / 2, H / 2 + 36);
    c.fillStyle = C.muted; c.font = '20px "IBM Plex Mono", monospace';
    if (k.foot) c.fillText(k.foot, W / 2, H / 2 + 80);
    c.textAlign = 'left'; c.globalAlpha = 1;
  }

  function frame(now) {
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    const gh = 632, gw = Math.round(gh * 264 / 216), gx = 36, gy = 44;
    c.imageSmoothingEnabled = false;
    c.drawImage(game, gx, gy, gw, gh);
    c.strokeStyle = C.line; c.lineWidth = 2; c.strokeRect(gx - 1, gy - 1, gw + 2, gh + 2);
    drawDialog(gx, gy, gw, gh);
    drawPanel(now);
    drawCard(now);
    if (S.pulse > 0) S.pulse -= 1 / 60;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---- helpers for scenarios ----
  const H_ = {
    sleep: ms => new Promise(r => setTimeout(r, ms)),
    cap(title, sub) { S.cap = { title, sub }; S.capT = performance.now(); },
    card(k) { S.card = k; S.cardT = performance.now(); },
    noCard() { S.card = null; },
    pulse(sec) { S.pulse = sec; },
    async step(dir, ms = 210) { cw.act('move', dir); await H_.sleep(ms); },
    async act(k, a, ms = 450) { cw.act(k, a); await H_.sleep(ms); },
    freeNear(x, y, rMin, rMax) {
      const out = [];
      for (let dy = -rMax; dy <= rMax; dy++) for (let dx = -rMax; dx <= rMax; dx++) {
        const d = Math.abs(dx) + Math.abs(dy);
        if (d < rMin || d > rMax) continue;
        const X = x + dx, Y = y + dy;
        if (!cw.isFloor(X, Y)) continue;
        if (cw.P.x === X && cw.P.y === Y) continue;
        if (cw.ents.some(e => e.x === X && e.y === Y)) continue;
        if (cw.npc && cw.npc.x === X && cw.npc.y === Y) continue;
        out.push([X, Y]);
      }
      return out;
    },
    async walkTo(x, y, ms = 210, maxSteps = 30) {
      for (let i = 0; i < maxSteps; i++) {
        const P = cw.P;
        if (Math.abs(P.x - x) + Math.abs(P.y - y) <= 1) return;
        const d = cw.bfsFrom(x, y);
        let best = null, bd = 1e9;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const X = P.x + dx, Y = P.y + dy, v = d[cw.idx(X, Y)];
          if (v < 0 || cw.ents.some(e => e.x === X && e.y === Y)) continue;
          if (cw.npc && cw.npc.x === X && cw.npc.y === Y) continue;
          if (v < bd) { bd = v; best = [dx, dy]; }
        }
        if (!best) return;
        await H_.step(best, ms);
      }
    },
    teleport(x, y) { const P = cw.P; P.x = P.px = x; P.y = P.py = y; P.moveT = 1; cw.computeFOV(); cw.computeIntents(); },
  };
  window.__h = H_;

  // ---- recorder ----
  window.__rec = {
    start() {
      const stream = cv.captureStream(30);
      const ac = cw.actx;
      if (ac && ac.__tap) ac.__tap.stream.getAudioTracks().forEach(t => stream.addTrack(t));
      const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m));
      const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 9e6, audioBitsPerSecond: 192000 });
      const chunks = [];
      rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      rec.start(500);
      this.rec = rec; this.chunks = chunks; this.audio = !!(ac && ac.__tap); this.mime = mime;
      return { mime, audio: this.audio };
    },
    stop() {
      return new Promise(res => {
        this.rec.onstop = async () => {
          const buf = new Uint8Array(await new Blob(this.chunks).arrayBuffer());
          let bin = '';
          for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
          res(btoa(bin));
        };
        this.rec.stop();
      });
    },
  };
})();
