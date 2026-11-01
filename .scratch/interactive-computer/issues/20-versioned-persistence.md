# 20: Versioned persistence of simulation, history and preferences

**What to build:**

The simulation survives a page reload. Current ship state, event log, command history and interface preferences are saved to browser storage in a versioned format, and restored on the next visit. History persistence can be configured separately from simulation state.

If the saved data is from an older or newer version, or is corrupt, the app falls back to the initial state and shows a clear error message in the terminal; it never crashes or shows exception text. Migrating older versions is allowed but not required for the first release.

**Blocked by:**

- 09 Crew: commands and the Crew screen on the store
- 10 Life Support: commands and the screen on the store
- 11 Navigation: commands and the screen on the store
- 12 Ship, mission and cargo information commands
- 14 Terminal input, command history and scrolling
- 16 NAVIGATION SET COURSE with confirmation

**Status:** ready-for-agent

**Acceptance criteria:**

- [ ] After changing state (for example confirming a course) and reloading, the same state, log and history are present
- [ ] Saved data carries a version, and an unknown or older version triggers the documented behaviour
- [ ] Corrupt data restores the initial state and shows an error message in the terminal
- [ ] History persistence can be switched independently of state persistence
- [ ] Storage being unavailable is handled without errors; the session simply does not persist
- [ ] Tests cover save, restore, version mismatch and corrupt data
