# 12: Ship, mission and cargo information commands

**What to build:**

Three groups of read-only commands backed by new model data that no screen shows today.

Ship: `SHIP` (general information), `SHIP SPECIFICATIONS`, `SHIP REGISTRATION` (registration and ownership), `SHIP SYSTEMS` (installed systems), `SHIP CONFIGURATION`, `SHIP MANIFEST`, plus `VERSION` (computer firmware information, matching the firmware label in the header) and `TIME` (ship computer date and time from the simulation clock).

Mission: `MISSION` (overview), `MISSION STATUS`, `MISSION OBJECTIVES`, `MISSION HISTORY` and `MISSION ORDERS`. Mission data is stored separately from technical ship state. Operational orders require officer level; the rest are open.

Cargo: `CARGO` (overview), `CARGO MANIFEST`, `CARGO STATUS` and `CARGO LOCATION`.

Content is written in the terse, uppercase, impersonal style of the original computer, using the film's setup (commercial towing vehicle, refinery, return to Earth) without implying anything about the classified directive, which has its own later command.

**Blocked by:**

- 07 Privilege model: ACCESS, ACCESS LEVELS, WHOAMI

**Status:** ready-for-agent

**Acceptance criteria:**

- [ ] Every command is registered, has usage and help, and returns a structured report or table
- [ ] `VERSION` and the header firmware label come from one source, and `TIME` agrees with the header clock
- [ ] Mission orders are denied below officer level with an authorization block; other mission commands are open
- [ ] Mission data lives in its own part of the ship state, separate from technical state
- [ ] Cargo commands read the cargo model and agree with each other
- [ ] Output matches the plan's formatting rules and never shows markup or exception text
- [ ] Tests cover each command and the one privilege check
