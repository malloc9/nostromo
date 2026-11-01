# 13: REPORT: the comprehensive ship report

**What to build:**

`REPORT` produces the complete ship report with the ten sections from the plan: vessel identification, mission status, navigation, engineering, power distribution, life support, crew monitoring, cargo, active alerts and recent system events. `REPORT ENGINEERING`, `REPORT CREW` and `REPORT ALL` filter or expand it.

The report is composed by calling the existing subsystem report handlers. It must not contain any ship logic of its own, so that when a subsystem changes, the report changes with it.

**Blocked by:**

- 06 Engineering and power subcommands
- 09 Crew: commands and the Crew screen on the store
- 10 Life Support: commands and the screen on the store
- 11 Navigation: commands and the screen on the store
- 12 Ship, mission and cargo information commands

**Status:** ready-for-agent

**Acceptance criteria:**

- [ ] `REPORT`, `REPORT ENGINEERING`, `REPORT CREW` and `REPORT ALL` work, with usage and help
- [ ] Each section's content is exactly what the corresponding subsystem command returns at the same moment
- [ ] A fault injected through the test operation appears in the report's engineering, power and alert sections
- [ ] No section duplicates subsystem logic; the report only composes handlers
- [ ] Recent events in the report match `LOG`
- [ ] Tests compare each report section against its subsystem command
