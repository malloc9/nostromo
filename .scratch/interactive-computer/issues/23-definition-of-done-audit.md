# 23: Definition-of-done audit and test coverage

**What to build:**

Walk the plan's definition of done item by item against the finished product and close every gap. Add the automated tests that are missing for the command engine and the critical state transitions. Update the project guide so the architecture (command engine, registry, state store, events, privileges, persistence) is documented for future work, and record anything deferred such as mobile layouts, the Special Order 937 storyline, random failures and self-destruct.

**Blocked by:**

- All of tickets 01 to 22

**Status:** ready-for-agent

**Acceptance criteria:**

- [ ] Each checklist item from the plan's definition of done is marked met, with evidence, or has a follow-up ticket
- [ ] Automated tests exist and pass for the engine lifecycle, parser, permissions, confirmation flow, persistence and the state-consistency scenario
- [ ] A scripted manual walkthrough of the main commands works on the production build
- [ ] The project guide describes the command and state architecture and how to add a command or subsystem
- [ ] A list of deferred items with reasons is recorded
