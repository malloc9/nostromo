# 09: Crew: commands and the Crew screen on the store

**What to build:**

The user can ask the computer about the crew, and the Crew screen, the roster and the Dashboard crew quadrant show the same people with the same data. All of it comes from the crew model in the ship state.

Commands: `CREW` (manifest with numbered rows, position and a record count), `CREW ALL` (full manifest), `CREW [NAME]` (personnel record), `CREW STATUS`, `CREW STATUS [NAME]`, `CREW BIOMETRICS [NAME]`, `CREW LOCATION [NAME]` and `CREW RECORD [NAME]`. A personnel record contains name, position, department, personnel ID, current status, current location, cryosleep status, medical status and security clearance.

Name matching: by name or identifier; partial names work when unambiguous; no match gives a "personnel record not found" error; several matches give a selection list. Sensitive fields (medical detail, clearance, detailed records) follow the permission matrix and are withheld below the required level with an authorization message.

The roster covers Dallas, Kane, Ripley, Ash, Lambert, Parker and Brett plus Jones the cat as a personnel record, with Ash's synthetic status reflected in crew counts. The positions shown in the terminal, the Crew screen and every other place must be identical, which removes today's contradictions between screens.

The Crew screen keeps its layout; only its data source changes.

**Blocked by:**

- 07 Privilege model: ACCESS, ACCESS LEVELS, WHOAMI

**Status:** ready-for-agent

**Acceptance criteria:**

- [ ] Every command in the list works, is registered with usage and help, and renders as table or report blocks
- [ ] `CREW [NAME]` supports exact, partial-unambiguous, ambiguous (selection list) and unknown names with the error wording from the plan
- [ ] The terminal, the Crew screen roster, the vitals table, the location map and the Dashboard crew quadrant show the same positions, locations and statuses at the same simulated time
- [ ] Sensitive fields are withheld according to the permission matrix, and an authorization block is shown instead
- [ ] Crew counts (active, resting, synthetic) are computed once and match everywhere
- [ ] A test changes a crew member's location through the crew subsystem's own operation and sees the terminal, screen and event log all reflect it
- [ ] Tests cover name matching, field-level permissions and the consistency checks
