# Demo video recorder

Records three 30-second gameplay demos at 1280x720 with the game's music and sound effects:
`trailer`, `explainer` and `boss`.

A scripted bot plays the game in headless Chromium. `compositor.js` draws each frame (game board,
live context bar, captions, the Maintainer dialog) and records it with MediaRecorder together with
every sound routed to the speakers. ffmpeg then converts it to H.264/AAC mp4 with loudness
normalized to -16 LUFS.

```sh
pip install imageio-ffmpeg
FFMPEG=$(python3 -c "import imageio_ffmpeg as i; print(i.get_ffmpeg_exe())") \
  node record.js ./out            # all three
node record.js ./out boss          # just one (webm only without FFMPEG)
```

Requires Playwright. Recording runs in real time, about 35 seconds per video.
