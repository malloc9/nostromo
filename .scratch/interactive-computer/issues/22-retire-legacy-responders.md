# 22: Retire the legacy responders

**What to build:**

The contract step. Every command the old responders answered is now answered by the engine, so the old code is deleted: the static response map and the Dashboard console's own command logic. What users could do before still works: crew names, `MISSION`, `STATUS` and the like now answer from the model, and the old overlapping `OVERRIDE`, `DESTRUCT`, `INTERFACE 2037` and `SPECIAL ORDER 937` are registered as restricted commands with proper privileges and authorization responses, keeping their existing wording (the full storyline stays out of scope).

The old discovery-and-unlock mechanic (sections unlocked by trying commands) is removed; access is now by privilege level.

**Blocked by:**

- 08 Confirmation prompts, ACCESS REQUEST and SECURITY
- 13 REPORT: the comprehensive ship report
- 17 ENGINEERING POWER ALLOCATION with a safety threshold
- 18 Clickable panels, event indicator and the Dashboard console on the engine

**Status:** ready-for-agent

**Acceptance criteria:**

- [ ] The static response map and the Dashboard console's duplicate command logic no longer exist in the code
- [ ] No command known to the old system is lost; each is either a registered command or documented as removed
- [ ] `SPECIAL ORDER 937`, `OVERRIDE`, `DESTRUCT` and `INTERFACE 2037` are registered with the privileges from the plan and keep their wording
- [ ] The unlock mechanic and its stored progress are removed and cause no errors for returning users
- [ ] Every legacy response now matches model data (for example roles agree with the Crew screen)
- [ ] The build, every screen and every manual test page still work
