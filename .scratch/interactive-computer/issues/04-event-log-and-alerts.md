# 04: Event log and alerts, with the live count in the header

**What to build:**

Things that happen on the ship are recorded as events, and the events produce alerts. An event has a time from the simulation clock, a type (system, status, warning, error, crew, navigation, security, communication), the subsystem it came from, a severity and a message. The event log is append-only for the session. An alert manager derives the list of active alerts from the subsystems' faults and warnings, and removes an alert when its cause is resolved.

Users read the log with `LOG` (recent events), `LOG ALL`, `LOG [SUBSYSTEM]` (including `LOG SECURITY`) and `LOG LAST [N]`, with the output and closing hints shown in the plan.

The always-visible system header shows the number of active alerts and the ship computer time, both read from the store, so they cannot disagree with anything else. The Dashboard's summary status and alert count are moved onto the same alert list, so the old separately computed numbers disappear.

Alerts raised by thresholds that exist today (low power margin, life support limits and so on) become alerts from the manager, not strings computed inside a screen.

**Blocked by:**

- 02 Command engine core, HELP and structured output on the MOTHER screen
- 03 Ship state store, with the data simulator reading from it

**Status:** ready-for-agent

**Acceptance criteria:**

- [ ] Every change to ship state that the plan calls an event writes exactly one event with the simulation-clock time
- [ ] The log is append-only: nothing in the product edits or removes an entry during a session
- [ ] `LOG`, `LOG ALL`, `LOG [SUBSYSTEM]` and `LOG LAST [N]` work, reject bad arguments with usage text, and end with the hints described in the plan
- [ ] The header alert count and ship time update from the store and always match the alert list
- [ ] The Dashboard summary status and alert count come from the alert manager; the old per-screen alert computation for them is gone
- [ ] Creating and resolving a fault in a test adds and removes the alert and logs both transitions
- [ ] Unit tests cover event creation, alert derivation and resolution, and log filtering
