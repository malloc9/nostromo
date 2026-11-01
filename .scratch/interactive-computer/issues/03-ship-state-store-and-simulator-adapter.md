# 03: Ship state store, with the data simulator reading from it

**What to build:**

There is one authoritative ship state, and every existing screen reads from it. The state is deterministic: the same initial state, simulation clock and operation sequence always give the same values. The simulation clock is injectable and can be advanced in tests.

The state has the structure from the plan: identity, mission, navigation, engineering (reactor, engines, cooling, power distribution), life support, crew, cargo, communications, security, alerts and event log. Each subsystem exposes current state, operational status, relevant measurements, last-update time, active faults and the operations it supports. A subsystem owns its own data: others can read it, but changes go through the owner's operations, never by writing into another subsystem's data. Interested parties subscribe to be told when state changes.

The initial scenario is "standard", built from the current app: the same seven human and synthetic crew (Dallas, Kane, Ripley, Ash, Lambert, Parker, Brett, with Kane resting and the rest active) plus Jones the cat as a further personnel record, the existing ship identity and registration, and a mostly stable ship with no active alerts. Measurements use the plan's units: oxygen and carbon dioxide as percentages, pressure in kPa, temperature in degrees Celsius, humidity as a percentage. The state carries a data version number from day one.

The existing data simulator becomes a thin adapter over the store, so the six screens keep working without changes. The adapter converts to whatever units a screen currently shows until each subsystem ticket migrates its screen. The random fluctuation the simulator adds today is replaced by small, bounded drift derived from the simulation clock, so any two readers asking at the same moment get the same number. The drift policy is written down.

Roles must be consistent: the crew model is the single place that says who holds which position.

**Blocked by:**

- 01 Test harness and module layout for the ship computer

**Status:** ready-for-agent

**Acceptance criteria:**

- [ ] The store has no DOM dependency and is fully exercised by unit tests
- [ ] The same initial state, clock and operations always produce identical state; the clock can be injected and advanced in tests
- [ ] The state contains every subsystem listed in the plan, each with status, measurements, last-update time, active faults and supported operations
- [ ] A subsystem cannot have its data changed by another subsystem; cross-subsystem effects go through explicit operations or events, and a test shows a violation is rejected
- [ ] Subscribers are notified of a state change exactly once per change and can unsubscribe
- [ ] All six existing screens still render sensible, plausible values after the simulator is switched over, with no console errors
- [ ] Two different readers requesting a value at the same simulated time receive the identical number
- [ ] The drift policy and the units used are documented next to the state definition
