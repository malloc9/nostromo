# 06: Engineering and power subcommands

**What to build:**

The rest of the engineering information commands, all reading the same model as the screens: `ENGINEERING POWER` (power system report), `ENGINEERING REACTOR`, `ENGINEERING ENGINES`, `ENGINEERING COOLING`, `ENGINEERING DAMAGE` (engineering damage report), and `POWER` (overall power status).

Each command is a report block with the deterministic dotted-leader format and the same closing line style. Values come from the engineering and power models, including the cooling-system temperature and warning threshold that the scripted-events ticket will later use. Reports reuse one handler per subsystem rather than repeating logic, because the REPORT command will compose them.

These are informational; nothing here changes state.

**Blocked by:**

- 05 Engineering fault tracer: ENGINEERING, STATUS and panels agree

**Status:** ready-for-agent

**Acceptance criteria:**

- [ ] Each of the six commands is registered with description, usage and help text and returns a structured report
- [ ] Every value shown equals the value on the Engineering screen and Dashboard at the same simulated time
- [ ] `ENGINEERING DAMAGE` lists active faults and reports none when there are none
- [ ] An invalid subcommand shows usage and the valid subcommands
- [ ] A fault injected through the test operation appears in the relevant subcommand report
- [ ] Tests cover formatting, nominal and fault output for each command
