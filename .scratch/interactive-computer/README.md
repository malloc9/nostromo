# Interactive computer: ticket index

Source plan: `nostromo-interactive-computer-plan.md` (repository root).

## Decisions that apply to every ticket

- **Language:** plain JavaScript with JSDoc types, one namespace object, no TypeScript or new compile step (ticket 01 documents the convention).
- **Layout and devices:** desktop only, on the existing scaled 1366x768 stage. The plan's tablet and mobile requirements are out of scope for now; click-selectable suggestions are included.
- **Scenario:** the current app's crew and ship (Dallas, Kane resting, Ripley, Ash, Lambert, Parker, Brett) plus Jones the cat as a personnel record, in the plan's units (percent, kPa, degrees Celsius).
- **Determinism:** one authoritative ship state, an injectable simulation clock, no randomness; display drift is derived from the clock so every reader agrees.
- **Screens:** existing screens stay; MOTHER is the main terminal and the Dashboard console shares the same engine; screens change data source, not layout.
- **Legacy code:** the old static responses stay as a fallback (expand) until ticket 22 removes them (contract). The old unlock mechanic is retired in favour of privilege levels.
- **Out of scope (from the plan):** the Special Order 937 storyline, voice, AI-generated responses, random failures, multiple users, filesystem simulation, the full self-destruct sequence, advanced animated diagnostics.

## Tickets in dependency order

| # | Ticket | Blocked by |
|---|--------|------------|
| 01 | [Test harness and module layout for the ship computer](issues/01-test-harness-and-module-layout.md) | - |
| 02 | [Command engine core, HELP and structured output on the MOTHER screen](issues/02-command-engine-core-and-help.md) | 01 |
| 03 | [Ship state store, with the data simulator reading from it](issues/03-ship-state-store-and-simulator-adapter.md) | 01 |
| 04 | [Event log and alerts, with the live count in the header](issues/04-event-log-and-alerts.md) | 02, 03 |
| 05 | [Engineering fault tracer: ENGINEERING, STATUS and panels agree](issues/05-engineering-fault-tracer-and-status.md) | 04 |
| 06 | [Engineering and power subcommands](issues/06-engineering-and-power-subcommands.md) | 05 |
| 07 | [Privilege model: ACCESS, ACCESS LEVELS, WHOAMI](issues/07-privilege-model-access-whoami.md) | 02, 03 |
| 08 | [Confirmation prompts, ACCESS REQUEST and SECURITY](issues/08-confirmation-prompts-and-access-request.md) | 07, 04 |
| 09 | [Crew: commands and the Crew screen on the store](issues/09-crew-commands-and-screen-on-store.md) | 07 |
| 10 | [Life Support: commands and the screen on the store](issues/10-life-support-commands-and-screen-on-store.md) | 05 |
| 11 | [Navigation: commands and the screen on the store](issues/11-navigation-commands-and-screen-on-store.md) | 05 |
| 12 | [Ship, mission and cargo information commands](issues/12-ship-mission-and-cargo-information.md) | 07 |
| 13 | [REPORT: the comprehensive ship report](issues/13-report-command.md) | 06, 09, 10, 11, 12 |
| 14 | [Terminal input, command history and scrolling](issues/14-terminal-input-history-and-scrolling.md) | 02 |
| 15 | [Autocomplete, related-command suggestions and did-you-mean](issues/15-autocomplete-suggestions-and-did-you-mean.md) | 09, 14 |
| 16 | [NAVIGATION SET COURSE with confirmation](issues/16-navigation-set-course.md) | 08, 11 |
| 17 | [ENGINEERING POWER ALLOCATION with a safety threshold](issues/17-engineering-power-allocation.md) | 08, 06, 10 |
| 18 | [Clickable panels, event indicator and the Dashboard console on the engine](issues/18-panels-run-commands-and-dashboard-console-on-engine.md) | 05, 09, 10, 11, 14 |
| 19 | [Scripted automatic events](issues/19-scripted-automatic-events.md) | 06, 18 |
| 20 | [Versioned persistence of simulation, history and preferences](issues/20-versioned-persistence.md) | 09, 10, 11, 12, 14, 16 |
| 21 | [Reset simulation from settings](issues/21-reset-simulation.md) | 20 |
| 22 | [Retire the legacy responders](issues/22-retire-legacy-responders.md) | 08, 13, 17, 18 |
| 23 | [Definition-of-done audit and test coverage](issues/23-definition-of-done-audit.md) | all of 01-22 |

## Starting points

Only ticket 01 can start immediately. Once it is done, 02 and 03 can run in parallel.
After 05 sets the pattern, 10 and 11 are independent of each other; 09 and 12 only need 07.
