# 18: Clickable panels, event indicator and the Dashboard console on the engine

**What to build:**

Clicking a summary panel on the Dashboard (Life Support, Navigation, Engineering, Crew) runs the matching command through the same command engine and shows the result in the terminal; the panel never has its own version of the report. The Dashboard's embedded console runs on the same engine and shares the history with the MOTHER terminal.

A restrained system-event indicator shows active warnings, recent events and system activity, read from the shared event log and alert list. It looks like part of an industrial computer, not a modern notification centre.

**Blocked by:**

- 05 Engineering fault tracer: ENGINEERING, STATUS and panels agree
- 09 Crew: commands and the Crew screen on the store
- 10 Life Support: commands and the screen on the store
- 11 Navigation: commands and the screen on the store
- 14 Terminal input, command history and scrolling

**Status:** ready-for-agent

**Acceptance criteria:**

- [ ] Each of the four panels runs its command through the engine and shows exactly what typing the command would show
- [ ] The Dashboard console and the MOTHER terminal use the same engine, command set and history
- [ ] The event indicator updates from the shared log and alert list and matches the header count
- [ ] No panel has a private implementation of any report
- [ ] A fault injected through the test operation shows in the indicator, panels, console output and header at once
- [ ] Tests cover the panel-to-command mapping and indicator contents
