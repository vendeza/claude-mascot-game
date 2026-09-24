# Context Window soundtrack

Four chiptune tracks from **Context Window**, a fan-made browser roguelike about Clawd, the Claude Code
mascot. The game lives in [`context-window/`](../context-window/).

The music is not stored as audio inside the game. It is synthesized live by a small WebAudio step
sequencer in `context-window/index.html`: triangle-wave bass, a square-wave arpeggio, a lead melody and
noise-based drums. The files in this folder are recordings of that sequencer, made so the tracks can be
listened to, shared or used in videos outside the game.

## Tracks

| File | Track | Tempo | Key and progression | Where it plays |
|---|---|---|---|---|
| `night-shift.mp3` | Night Shift | 96 BPM | A minor, Am–F–G–Em | Start screen and death screen |
| `ship-it.mp3` | Ship It | 128 BPM | C major, C–G–Am–F | Floors 1–2, then every third pair of floors |
| `merge-rush.mp3` | Merge Rush | 160 BPM | E minor, Em–C–D–B | Floors 3–4, then every third pair of floors |
| `legacy-monolith.mp3` | Legacy Monolith | 150 BPM | D minor, Dm–B♭–C–A | Floors 5–6 and every boss floor (5, 10, 15…) |

In the game's Auto mode the floor tracks rotate every two floors, in step with the floor color themes.
The **Track** option in the settings menu (or the T key) pins any one track until the page is reloaded.

Each file holds several passes of the track's 4-bar loop (about 40 seconds) with a fade-out at the end.
They are 44.1 kHz stereo MP3 (VBR, about 120 kbps), loudness-normalized to −16 LUFS.

## How they were made

`context-window/tools/record/render-music.js` opens the game in headless Chromium with sound effects
muted, pins each track, and captures the raw audio output losslessly from the first note. ffmpeg then
trims the leading silence, adds the fade-out, normalizes loudness and encodes the MP3:

```sh
node context-window/tools/record/render-music.js ./wav
ffmpeg -i ./wav/ship-it.wav \
  -af "silenceremove=start_periods=1:start_threshold=-55dB,atrim=0:38.5,afade=t=out:st=35:d=3.5,loudnorm=I=-16:TP=-1.5:LRA=11" \
  -c:a libmp3lame -q:a 2 music/ship-it.mp3
```

If the sequencer changes, re-run the script to regenerate the files.

Context Window is a fan project and is not affiliated with Anthropic.
