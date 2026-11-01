# 11: Navigation: commands and the screen on the store

**What to build:**

The user can run `NAVIGATION` (overview), `NAVIGATION POSITION`, `NAVIGATION DESTINATION`, `NAVIGATION COURSE`, `NAVIGATION STATUS` and `NAVIGATION HISTORY`, and `NAV` works as the one alias for `NAVIGATION`. The Navigation screen and Dashboard navigation quadrant read the same navigation model.

Navigation owns position, trajectory, destination and course. The mode and range readouts, waypoints, orbital values and motion tracker on the screen keep their layout and take their data from the model. The navigation history is a list of navigation events from the shared event log.

The commands only read in this ticket; changing course is a later operational ticket.

**Blocked by:**

- 05 Engineering fault tracer: ENGINEERING, STATUS and panels agree

**Status:** ready-for-agent

**Acceptance criteria:**

- [ ] The six commands and the `NAV` alias work, each with usage and help, and return structured reports
- [ ] Position, destination, course and status in the terminal equal the Navigation screen and Dashboard values at the same simulated time
- [ ] `NAVIGATION HISTORY` shows navigation events from the shared log
- [ ] The screen's waypoint, orbital and tracker displays read the model rather than computing their own state
- [ ] A navigation fault injected through the test operation shows in the report, screen, `STATUS`, header count and log
- [ ] Tests cover each report and the consistency checks
