# Context Window

A fan-made turn-based browser roguelike. Clawd descends through repository floors, and instead of health he has a 200k-token context window. English and Russian, picked on the start screen (English by default).

- Damage, tool calls and items fill the context. Overflow while `/compact` is recharging and the session ends.
- `/compact` squeezes noise and tool output, gets weaker with every use, and may turn items into summaries.
- Tools: Read, Grep, Bash. Items: CLAUDE.md, Extended Thinking, Prompt Cache, Subagent, Cache Hit, /clear.
- Enemies: Bug, Hallucination, Infinite Loop, Merge Conflict, Flaky Test, Rate Limiter. Every 5th floor holds the boss Legacy Monolith.
- A color theme per two floors (Monorepo, Server Room, Hotfix Hell, Green Build, Neon Nightly).
- Enemy intents, run interruption, minimap, synthesized sound effects (M) and chiptune music (N toggles, T picks a track): Night Shift in menus, Ship It on floors 1-2, Merge Rush on 3-4, Legacy Monolith from floor 5. First-run hints.
- The Maintainer, a fictional mentor NPC, waits in the first room (and after every boss) with one of 15 lines of advice.
- Commits from each run unlock starting items. The daily run uses the same seed for everyone.

Single `index.html`, no dependencies. Open it in a browser to play.

Fan project, not affiliated with Anthropic.
