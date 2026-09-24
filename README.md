# Context Window

A fan-made, turn-based browser roguelike about **Clawd**, the Claude Code mascot.
Clawd has no health bar. He has a **200k-token context window**, and everything fills it:
damage becomes noise, tools add output, items take up space. Overflow while `/compact` is
recharging and the session is over.

**Play:** https://claude.ai/artifact/SE5VsG1ERw79FtJanfQDBr
(or open [`context-window/index.html`](context-window/index.html) in any browser, no build step).

## What's inside

- **Context as health.** System prompt, items, tool output and damage noise share one bar.
  `/compact` squeezes noise and output, gets weaker with every use, and may turn items into
  half-strength summaries. `/clear` wipes everything, items included.
- **Tools:** Read (dispels hallucinations), Grep (reveals the floor), Bash (area damage,
  sometimes *Permission denied*).
- **Items:** Subagent (a clone that fights for 36 turns), /clear, CLAUDE.md, Extended Thinking,
  Prompt Cache, Cache Hit.
- **Enemies:** Bug, Hallucination (disguised as items), Infinite Loop, Merge Conflict,
  Flaky Test, Rate Limiter, and the boss **Legacy Monolith** on every 5th floor.
- **The Maintainer,** a mentor NPC with advice, who also walks you through the boss fight.
- Enemy intent markers, a minimap, five floor color themes, a daily seeded run, and
  unlockable starting items.
- Synthesized sound effects and a four-track chiptune soundtrack.
- English and Russian, keyboard, swipe and an on-screen gamepad for phones.

## Repository layout

| Path | What it is |
|---|---|
| [`context-window/index.html`](context-window/index.html) | The whole game in a single file, no dependencies |
| [`context-window/README.md`](context-window/README.md) | Short game overview |
| [`context-window/tools/record/`](context-window/tools/record/) | Scripts that record 30-second gameplay demo videos and render the soundtrack |
| [`music/`](music/) | The soundtrack as MP3 files, with its own [README](music/README.md) |

## Controls

| Action | Keyboard | Phone |
|---|---|---|
| Move, attack (step into an enemy) | Arrows / WASD, hold to run | Swipe or d-pad |
| Wait a turn | Space | `wait` |
| Read, Grep, Bash | R, G, B | Action buttons |
| /compact, Subagent, /clear | C, Q, X | Action buttons |
| Menu, How to play | Esc, H | ⚙ and ? in the header |

## About

Built with Claude Code on the web. This is a fan project and is not affiliated with or
endorsed by Anthropic.
