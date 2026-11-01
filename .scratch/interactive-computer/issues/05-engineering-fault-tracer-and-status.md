# 05: Engineering fault tracer: ENGINEERING, STATUS and panels agree

**What to build:**

The first end-to-end proof that terminal and panels cannot contradict each other. The user can run `ENGINEERING` and `STATUS`, and the Engineering screen and the Dashboard power quadrant read the same engineering model from the store.

`ENGINEERING` shows the overview from the plan: main reactor, primary engine, secondary engine, cooling system and power distribution status, power output, fuel reserves and active faults, ending with the closing line. `STATUS` is the quick whole-ship report: vessel and registration, overall status, the status of every primary subsystem, crew counts, active alerts. Overall status and each line must come from the underlying state: if the reactor is in a warning state, `STATUS` says so.

A test-only operation can put a subsystem into a fault. It is not reachable from the terminal. When it runs, one state transition must update everything: the subsystem status, an alert, the header count, the Engineering panel, the log, and the `ENGINEERING` and `STATUS` output, with no separate update paths.

This ticket also fixes the shape other subsystem tickets will follow: model in the store, command reading the model, panel reading the model, consistency test.

**Blocked by:**

- 04 Event log and alerts, with the live count in the header

**Status:** ready-for-agent

**Acceptance criteria:**

- [ ] `ENGINEERING` and `STATUS` produce the structured reports described in the plan, formatted deterministically with aligned dotted leaders
- [ ] The Engineering screen and the Dashboard power quadrant read the engineering model from the store and show the same values as `ENGINEERING`
- [ ] A test-only fault operation changes the reactor to a warning or fault state and is not callable from the terminal
- [ ] The integration test from the plan passes: run `ENGINEERING` (reactor nominal), inject a reactor fault, run `ENGINEERING` (fault shown), run `STATUS` (overall status reflects it), confirm the Engineering panel shows the same fault, and confirm an event was recorded
- [ ] The header alert count increments and the Dashboard summary status changes in the same transition
- [ ] Resolving the fault returns every one of those places to nominal
- [ ] The pattern (store model, command, panel, consistency test) is written down as the template for the other subsystem tickets
