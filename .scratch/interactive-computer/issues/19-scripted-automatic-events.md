# 19: Scripted automatic events

**What to build:**

The ship computer reports things on its own, from a small, deterministic, predefined script. For example a cooling-system temperature rises above its warning threshold at a set simulated time, or a transmission arrives. There is no randomness.

Each scripted event goes through the normal path: the owning subsystem changes state, an event is logged, an alert is raised if appropriate, and the header, panels, indicator, `STATUS` and `LOG` all reflect it. If the terminal is open the event also prints as unsolicited output in the warning style, in the form given in the plan (time, source, message, current value and threshold).

The script can be turned on and off, and tests drive it with the simulation clock so results are reproducible. Random failures stay out of scope.

**Blocked by:**

- 06 Engineering and power subcommands
- 18 Clickable panels, event indicator and the Dashboard console on the engine

**Status:** ready-for-agent

**Acceptance criteria:**

- [ ] The script is data, not code branching, and each entry has a simulated trigger time
- [ ] A triggered event updates subsystem state, log, alert, header, panels, indicator and `STATUS` in one transition
- [ ] The terminal prints the event once, in warning style, using the plan's layout
- [ ] The script can be disabled and replayed from the start with identical results
- [ ] Tests advance the simulation clock and check each consequence
- [ ] Nothing in the script uses randomness
