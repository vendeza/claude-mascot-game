# Context Window

A fan-made turn-based browser roguelike. Clawd descends through repository floors, and instead of health he has a 200k-token context window. English and Russian, picked on the start screen (English by default).

- Damage, tool calls and items fill the context. Overflow while `/compact` is recharging and the session ends.
- `/compact` squeezes noise and tool output, gets weaker with every use, and may turn items into summaries.
- Tools: Read, Grep, Bash. Items: CLAUDE.md, Extended Thinking, Prompt Cache, Subagent, Cache Hit, /clear.
- Enemies: Bug, Hallucination, Infinite Loop, Merge Conflict, Flaky Test, Rate Limiter. Every 5th floor holds the boss Legacy Monolith.
- A color theme per two floors (Monorepo, Server Room, Hotfix Hell, Green Build, Neon Nightly).
- Enemy intents, run interruption, minimap, a settings menu (Esc) with language, sound and music volume, synthesized sound effects and chiptune music: Night Shift in menus; floors rotate Ship It, Merge Rush and Legacy Monolith every two floors, and boss floors always play Legacy Monolith. First-run hints.
- The Maintainer, a fictional mentor NPC, waits in the first room (and after every boss) with one of 15 lines of advice, and on boss floors walks you through the Monolith fight.
- Commits from each run unlock starting items. The daily run uses the same seed for everyone.

Single `index.html`, no dependencies. Open it in a browser to play.

Fan project, not affiliated with Anthropic.
