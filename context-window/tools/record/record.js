// Records three 30-second gameplay demos (1280x720, game audio) into webm, then mp4 via ffmpeg.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const GAME = 'file://' + path.resolve(__dirname, '../../index.html');
const OUT = process.argv[2] || __dirname;
const FFMPEG = process.env.FFMPEG;
const ONLY = process.argv[3];
const COMPOSITOR = fs.readFileSync(path.join(__dirname, 'compositor.js'), 'utf8');

// Route every connection to the speakers into a MediaStream too, so MediaRecorder hears the game.
const AUDIO_TAP = `(() => {
  const orig = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dest, ...a) {
    if (dest instanceof AudioDestinationNode) {
      const ctx = dest.context;
      if (!ctx.__tap) ctx.__tap = ctx.createMediaStreamDestination();
      orig.call(this, ctx.__tap, ...a);
    }
    return orig.call(this, dest, ...a);
  };
  try { localStorage.setItem('cw-lang', 'en'); localStorage.setItem('cw-hints', JSON.stringify({enemy:1,item:1,ctx:1,stairs:1,mimic:1,boss:1,frozen:1,ally:1})); } catch (e) {}
})();`;

const PRELUDE = `const h = window.__h, cw = window.__cw, G = cw.G; const t0 = performance.now();
const until = async ms => { const d = ms - (performance.now() - t0); if (d > 0) await h.sleep(d); };
const adjFoes = () => cw.ents.filter(e => e.type !== 'mimic' && e.type !== 'module' && Math.abs(e.x - cw.P.x) + Math.abs(e.y - cw.P.y) === 1);
const nearFoes = () => cw.ents.filter(e => e.type !== 'mimic' && e.type !== 'module' && Math.abs(e.x - cw.P.x) <= 1 && Math.abs(e.y - cw.P.y) <= 1);`;

// ---------- boss choreography shared by two videos ----------
const BOSS_FIGHT = (pace, caps) => `
  const B = G.boss;
  cw.give('bash'); G.items.forEach(i => { i.sum = false; }); cw.hud();
  cw.ents.filter(e => e.type === 'module').forEach(m => { m.hp = 2; m.maxHp = 2; });
  B.maxHp = 8; B.deploys = 1; B.timer = 0;
  h.teleport(B.bx - 1, B.by);
  ${caps ? "h.cap('Bash hits two modules at once.', 'Stand right beside its side.');" : ''}
  await h.sleep(${pace});
  await h.act('tool', 'bash', ${pace + 250});
  ${caps ? "h.cap('Hit it while it\\u2019s busy.', '3 safe turns out of every 6.');" : ''}
  await h.act('move', [1, 0], ${pace});
  await h.act('move', [1, 0], ${pace});
  await h.act('move', [1, 0], ${pace + 150});
  ${caps ? "h.cap('Countdown\\u2026 step back!', 'The deploy hits every tile touching it.');" : "h.cap('Countdown\\u2026 step back!', 'Then come back and finish it.');"}
  await h.act('move', [-1, 0], ${pace + 250});
  await h.act('wait', null, ${pace + 350});
  ${caps ? "h.cap('Deploy missed.', 'Now finish the refactor.');" : ''}
  await h.act('move', [1, 0], ${pace});
  await h.act('tool', 'bash', ${pace + 500});
`;

const SCENARIOS = {
  trailer: {
    setup: `G.demo = true;`,
    run: `${PRELUDE}
      h.card({ title: 'CONTEXT WINDOW', sub: 'A roguelike where your HP is a context window', foot: 'starring Clawd' });
      await until(2800); h.noCard();
      h.cap('Meet Clawd.', 'The Claude Code mascot, rebuilt pixel by pixel.');
      await h.sleep(300);
      await h.walkTo(cw.npc.x, cw.npc.y, 230);
      if (!cw.dialog.open) cw.openDialog();
      await until(7400); cw.closeDialog();

      h.cap('Every hit fills your context.', 'No HP bar. Damage becomes noise.');
      cw.give('bash');
      h.freeNear(cw.P.x, cw.P.y, 2, 2).slice(0, 3).forEach(([x, y]) => cw.spawn('bug', x, y, { hp: 2, maxHp: 2 }));
      await h.act('wait', null, 420); await h.act('wait', null, 420);
      while (performance.now() - t0 < 12600) {
        const n = nearFoes(), a = adjFoes();
        if (n.length >= 2) await h.act('tool', 'bash', 420);
        else if (a.length) await h.act('move', [a[0].x - cw.P.x, a[0].y - cw.P.y], 330);
        else if (n.length || cw.ents.some(e => e.type === 'bug')) await h.act('wait', null, 330);
        else break;
      }
      cw.ents.filter(e => e.type === 'bug').forEach(e => cw.ents.splice(cw.ents.indexOf(e), 1));
      await until(12800);

      h.cap('Tools cost tokens too.', 'Grep reveals the whole floor.');
      cw.give('grep');
      await h.act('tool', 'grep', 1300);

      h.cap('/compact squeezes the context.', 'But every compaction is weaker than the last.');
      G.noise += 70; cw.hud(); h.pulse(1.2);
      await h.sleep(700);
      await h.act('compact', null, 1600);
      await until(17600);

      h.cap('git push to go deeper.', 'Every 5th floor holds a boss.');
      G.floor = 4;
      const [sx, sy] = h.freeNear(cw.P.x, cw.P.y, 1, 1)[0];
      cw.stairs.x = sx; cw.stairs.y = sy;
      await h.step([sx - cw.P.x, sy - cw.P.y], 2300);

      h.cap('Refactor the Legacy Monolith.', 'Hit it while it\\u2019s busy. Step back on the countdown.');
      ${BOSS_FIGHT(430, false)}
      h.cap('REFACTORED.', '+300 and the way down opens.');
      await until(27000);
      h.card({ title: 'CONTEXT WINDOW', sub: 'A fan-made roguelike about Clawd', foot: 'Built with Claude Code on the web' });
      await until(30000);`,
  },

  explainer: {
    setup: `G.demo = true; cw.toFloor(3);`,
    run: `${PRELUDE}
      h.cap('No health bar.', 'Clawd has something else.');
      for (const d of [[1, 0], [1, 0], [0, 1], [-1, 0]]) await h.step(d, 380);
      await until(3500);

      h.cap('A 200k-token context window.', 'Items, tool output and damage all share it.');
      h.pulse(4);
      for (const id of ['grep', 'bash', 'thinking']) { await h.sleep(700); cw.give(id); }
      await until(7800);

      h.cap('Damage is noise.', 'Every hit fills the window.');
      h.freeNear(cw.P.x, cw.P.y, 1, 1).slice(0, 2).forEach(([x, y]) => cw.spawn('bug', x, y, { hp: 3, maxHp: 3 }));
      for (let i = 0; i < 2; i++) await h.act('wait', null, 650);
      await h.act('tool', 'bash', 600);
      while (adjFoes().length && performance.now() - t0 < 12800) { const a = adjFoes()[0]; await h.act('move', [a.x - cw.P.x, a.y - cw.P.y], 360); }
      await until(13200);

      h.cap('Tools cost tokens too.', 'Grep, Read and Bash all add output.');
      await h.act('tool', 'grep', 1100);
      await h.act('tool', 'read', 1100);
      await h.act('tool', 'bash', 1100);
      await until(17000);

      h.cap('/compact squeezes it.', 'But weaker every time: 70%, then 62%, then 54%.');
      G.noise += 40; cw.hud(); h.pulse(1);
      await h.act('compact', null, 1900);
      G.cd = 0;
      await h.act('compact', null, 1900);
      await until(22000);

      h.cap('Overflow while /compact recharges\\u2026', '\\u2026and the session is over.');
      G.cd = 9; G.noise += Math.max(0, 196 - cw.total()); cw.hud(); h.pulse(1.5);
      const [bx, by] = h.freeNear(cw.P.x, cw.P.y, 1, 1)[0];
      cw.spawn('bug', bx, by);
      await h.sleep(900);
      await h.act('wait', null, 3200);
      await until(27000);
      h.card({ title: 'CONTEXT WINDOW', sub: 'Your HP is a context window.', foot: 'A fan-made roguelike about Clawd' });
      await until(30000);`,
  },

  boss: {
    setup: `G.demo = true; cw.toFloor(5);`,
    run: `${PRELUDE}
      h.card({ title: 'LEGACY MONOLITH', size: 64, color: '#e0605a', sub: 'Boss fight', foot: 'Context Window' });
      await until(2600); h.noCard();
      h.cap('Every boss floor has a guide.', 'The Maintainer explains the rhythm.');
      cw.openDialog();
      await until(5200);
      cw.advanceDialog(); cw.advanceDialog(); cw.advanceDialog(); cw.advanceDialog();
      await until(7700);
      cw.advanceDialog(); cw.advanceDialog();
      await until(11400);
      cw.closeDialog();
      ${BOSS_FIGHT(620, true)}
      h.cap('REFACTORED.', '+300 and the way down opens.');
      await h.sleep(1100);
      await h.act('move', [-1, 0], 450);
      await h.act('move', [1, 0], 2100);
      h.cap('Floor 6. The Maintainer is waiting.', 'Every boss you beat earns a piece of advice.');
      await h.sleep(300);
      if (cw.npc) await h.walkTo(cw.npc.x, cw.npc.y, 260);
      if (!cw.dialog.open && cw.npc) cw.openDialog();
      await until(27000);
      cw.closeDialog();
      h.card({ title: 'CONTEXT WINDOW', sub: 'Hit. Count. Step back. Refactor.', foot: 'A fan-made roguelike about Clawd' });
      await until(30000);`,
  },
};

(async () => {
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  for (const [name, sc] of Object.entries(SCENARIOS)) {
    if (ONLY && name !== ONLY) continue;
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, ignoreHTTPSErrors: true });
    await ctx.addInitScript(AUDIO_TAP);
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message + ' @ ' + (e.stack || '').split('\n')[1]));
    for (let attempt = 0; attempt < 4; attempt++) {
      await page.goto(GAME);
      const ok = await page.evaluate(async () => {
        try {
          await Promise.all(['34px Silkscreen', '18px "IBM Plex Mono"', '500 34px "IBM Plex Mono"'].map(f => document.fonts.load(f)));
          await document.fonts.ready;
        } catch (e) {}
        return document.fonts.check('34px Silkscreen') && document.fonts.check('18px "IBM Plex Mono"');
      });
      if (ok) break;
      await page.waitForTimeout(1500);
    }
    const fonts = await page.evaluate(() => [document.fonts.check('34px Silkscreen'), document.fonts.check('18px "IBM Plex Mono"')]);
    await page.click('#btn-start');
    await page.waitForTimeout(200);
    await page.evaluate(`(() => { const cw = window.__cw, G = cw.G; ${sc.setup} })()`);
    await page.evaluate(COMPOSITOR);
    await page.waitForTimeout(700);
    const info = await page.evaluate(() => window.__rec.start());
    await page.evaluate(`(async () => { ${sc.run} })()`);
    const b64 = await page.evaluate(() => window.__rec.stop());
    const webm = path.join(OUT, `${name}.webm`);
    fs.writeFileSync(webm, Buffer.from(b64, 'base64'));
    console.log(name, JSON.stringify(info), 'fonts', fonts, 'errs', errs.slice(0, 3), (fs.statSync(webm).size / 1e6).toFixed(1) + 'MB');
    if (FFMPEG) {
      const mp4 = path.join(OUT, `context-window-${name}.mp4`);
      execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', webm, '-t', '30', '-r', '30', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
        '-pix_fmt', 'yuv420p', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', mp4]);
      console.log(' ->', mp4, (fs.statSync(mp4).size / 1e6).toFixed(1) + 'MB');
    }
    await ctx.close();
  }
  await browser.close();
})();
