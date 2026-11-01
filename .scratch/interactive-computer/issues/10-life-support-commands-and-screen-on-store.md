# 10: Life Support: commands and the screen on the store

**What to build:**

The user can run `LIFE SUPPORT` (overview), `LIFE SUPPORT OXYGEN`, `LIFE SUPPORT ATMOSPHERE` (composition) and `LIFE SUPPORT TEMPERATURE` (temperature regulation), and the Life Support screen and the Dashboard life support quadrant read the same life-support model from the store.

The overview follows the plan's example: oxygen level, carbon dioxide concentration, atmospheric pressure, cabin temperature and humidity with dotted-leader formatting, air circulation and atmospheric control status, and a closing line. Values are illustrative defaults in the plan's units (percent, kPa, degrees Celsius), so the Life Support screen and quadrant switch to those units; the zone display and trend widgets keep their layout and read the model.

The oxygen-leak style scenario is not built here, but the model must be able to hold a fault and reflect it everywhere, using the template from the engineering tracer.

**Blocked by:**

- 05 Engineering fault tracer: ENGINEERING, STATUS and panels agree

**Status:** ready-for-agent

**Acceptance criteria:**

- [ ] The four commands exist with usage and help, return structured reports and agree with the screen values at the same simulated time
- [ ] The Life Support screen and Dashboard quadrant display the plan's units and read only the model
- [ ] A fault injected through the test operation changes the report, the screen, `STATUS`, the header alert count and the log in one transition
- [ ] Zones and trends continue to display, driven by model data and the shared simulation clock
- [ ] No screen computes its own life-support alerts any more; they come from the alert manager
- [ ] Tests cover each report, the unit handling and the consistency checks
