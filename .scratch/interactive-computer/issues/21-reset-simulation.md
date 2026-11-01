# 21: Reset simulation from settings

**What to build:**

A settings control lets the user reset the simulation. It asks for confirmation, restores the initial ship state, clears the simulation event log, optionally also clears command history, and starts a new session. It cannot be reached by an ordinary terminal command, so it cannot happen by accident.

**Blocked by:**

- 20 Versioned persistence of simulation, history and preferences

**Status:** ready-for-agent

**Acceptance criteria:**

- [ ] The control asks for confirmation and does nothing if declined
- [ ] Confirmed reset restores the initial state and clears the event log; history is cleared only if the user chose that option
- [ ] A new session identifier is issued and the header reflects it
- [ ] No terminal command can trigger a reset
- [ ] All screens, panels and the header show the initial values afterwards
- [ ] Tests cover accept, decline and the history option
