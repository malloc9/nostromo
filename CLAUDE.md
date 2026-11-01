# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Node dev server (`scripts/dev-server.js`) on `http://localhost:3000` (override with `PORT=...`)
- `npm run build` - Minifies into `/dist` (HTML, CSS, JS) and validates required files
- `npm run clean` - Removes `/dist`
- `npm run deploy` - Alias for build

### Unit tests
- `npm test` runs Jest over `tests/**` (configured by the `jest.roots` key in `package.json`). It exits non-zero on failure. It covers the ship-computer logic: engine and parser, registry, privilege, confirmation, store, reports, persistence, reset, scripted events, and the state-consistency scenario (`tests/ship-computer/state-consistency.test.js`).
- Run one file with `npx jest tests/ship-computer/util.test.js`.
- Tests load modules with `require('../../js/<group>/<file>.js')`. Modules end with the dual-export guard (`module.exports` in Node, global in the browser), so the same file runs in both places.
- For a new ship-computer module, add a `tests/ship-computer/<name>.test.js` next to it. Use `jest-environment-jsdom` only when a test really needs a DOM. Pure logic modules must not touch the DOM.

### Manual verification
Everything else is verified manually. The pages live at the **repo root** (there is no `/test` directory):
- `test-*.html` (e.g. `test-boot-and-nav.html`, `test-engineering.html`, `test-navigation.html`, `test-router.html`) - open via `npm run dev` and view in a browser
- `verify-*.js` and `test-crew-basic.js` - ad-hoc scripts; run with `node <file>` (`test-crew-basic.js` works because `crew.js`/`data-simulator.js` export via `module.exports`; the `verify-*.js` scripts expect a DOM)
- The root also holds many screenshot PNGs, plan docs, and deployment notes from past iterations; they are not part of the app.

## Architecture

A static, build-light vanilla JS app (no framework, no bundler) that replicates the MU-TH-UR 6000 terminal from *Alien*. Understanding it takes several files:

- **Ship-computer group (`js/ship-computer/`).** New command-engine and ship-state logic lives here, not in loose top-level files. Load order is fixed in `index.html`: `namespace.js` first, then the other modules. Conventions:
  - Plain JavaScript with JSDoc types. There is no TypeScript and no compile step.
  - Everything attaches to one namespace object, `window.NostromoShipComputer` (for example `NostromoShipComputer.util.clamp`). Do not add new loose globals.
  - Pure logic modules have no DOM dependency. Only a thin presentation layer touches the DOM.
  - Each file ends with the dual-export guard so tests can `require` it. `namespace.js` creates the namespace when loaded in Node.
  - `scripts/build.js` minifies `js/ship-computer/` and `validateBuild()` requires the group's files. Add any new required file there.
  - The MOTHER terminal runs on the command engine. A command is `registry.register({name, aliases, category, usage, args, privilege, handler})`; handlers return blocks (`text`, `table`, `status`, `warning`, `error`, plus `report`/`authorization`/`progress`/`confirmation` rendered as text), never HTML. `engine.execute(string)` returns the structured result; `terminal-view.js` is the only renderer and escapes all text. Input the registry does not know is refused as unknown; there is no fallback. The old static responder and its unlock progress are gone (ticket 22).
  - `tests/ship-computer/load.js` loads the modules in browser order for Node tests. Add new module names there.
- **No module system.** `index.html` loads every script with a plain `<script>` tag in dependency order: `data-simulator` → `audio-manager` → `boot-sequence` → `router` → `dashboard-components/*` (base → quadrant → specific) → `dashboard`, `life-support`, `navigation`, `engineering`, `crew` → `app.js` last. A new JS file does nothing until it is added to `index.html` in the right position. Classes are globals (e.g. `NostromoRouter`, `NostromoCrew`); several also end with `if (typeof module !== 'undefined') module.exports = ...` so Node scripts can `require` them.
- **`app.js` is the composition root.** On `DOMContentLoaded` it instantiates each subsystem and publishes it on `window` (`window.router`, `window.dashboard`, `window.crew`, ...). Subsystems find each other through these globals, not imports.
- **Hash router** (`router.js`): routes (`dashboard`, life support, navigation, engineering, crew, mother console) are registered in `registerDefaultRoutes()` with a screen element id, F-key hotkey, and `onEnter`/`onExit` hooks that call `window.<subsystem>.activate()`/`deactivate()`. Hash routing is what keeps it working on GitHub Pages. Adding a screen means a new route, a `<section>` in `index.html`, and an init in `app.js`.
- **`data-simulator.js`** is a thin adapter over the ship state store (`js/ship-computer/ship-state.js`, initial data in `ship-scenario.js`). All subsystems still read through the single `dataSimulator` instance from `app.js`, and it converts store units to the ones the screens show (pressure kPa to ATM). Readings are derived from the simulation clock, not random, so two readers at the same time see the same value. The drift policy and units are written at the top of `ship-scenario.js`.
- **Store rules.** A subsystem changes only through its own operations: `store.operate(name, op, args, actor)` throws `OwnershipError` if `actor !== name`. Snapshots are deep-frozen. Subscribers hear about each successful change once.
- **Subsystem template (from ticket 05).** Each subsystem follows the same four parts, so the terminal, the panels and the header cannot disagree: (1) a model in the store: its state, measurements and faults; (2) a pure model module that reads a snapshot (`engineering-model.js` for engineering); (3) commands that render the model (`engineering-commands.js`, `status-commands.js`). Sub-reports (POWER, REACTOR, ENGINES, COOLING, DAMAGE) are pure functions of the store in `engineering-reports.js`, so the REPORT command can reuse them; (4) panels that call the same model builder (`engineering.js`, `power-quadrant.js`). Faults are added with `store.operate(..., 'addFault', {code, component, severity}, owner)`. This operation is test-only: no registered command calls it, and `fault-tracer.test.js` checks that the terminal cannot add a fault.
- **Privilege (from ticket 07).** `privilege.js` holds the levels, the plan's permission matrix and the one decision, `authorize(session, required)`. Each command declares its level in `privilege` (default CREW). The engine asks `authorize` before it checks arguments or runs a handler, and a denial is an `authorization` block with the required and current levels only. No command or panel checks privilege itself. `SPECIAL ORDER 937`, `OVERRIDE`, `DESTRUCT` and `INTERFACE 2037` are registered in `restricted-commands.js` with their privileges and their wording.
- **Confirmations (from ticket 08).** A handler asks a question with `ctx.ask({question, confirm, cancel})` and returns the question. The pending question is engine state: the next input is the answer (`Y` runs `confirm` once, `N` runs `cancel`, anything else keeps the question), and `engine.cancelPending()` is what Escape calls. Nothing changes before a Y. `access-request-commands.js` is the first user: `ACCESS REQUEST` applies `grantRule` (corporate refused, system not requestable, held levels answered at once), and every granted, refused or cancelled outcome is written to the security log by the security subsystem.
- **Crew (from ticket 09).** The store's crew members are the one roster. `crew-model.js` computes the counts and matches names (exact, partial, ambiguous, none), and `crew-commands.js` renders the manifest, status, locations, biometrics and personnel records from them. The record's sensitive fields are withheld through `privilege.authorize`, which returns an authorization block. Crew members move only through the crew subsystem's `moveMember` operation, which logs the move. The Crew screen and the Dashboard quadrant already read the same roster through the simulator adapter.
- **Life support (from ticket 10).** The store measures life support in the plan's units: oxygen and CO2 in percent, pressure in kPa, temperature in Celsius, humidity in percent (the scenario comments say so). `life-support-model.js` builds the readings and the air circulation and atmospheric control statuses, and `life-support-commands.js` renders LIFE SUPPORT and its OXYGEN, ATMOSPHERE and TEMPERATURE sub-reports. The alert thresholds for these live in `alerts.js` (one alert per parameter, LS_OXYGEN, LS_CO2, LS_PRESSURE, LS_TEMPERATURE). The Life Support screen reads the model and takes its alerts from the board; its colour thresholds mirror the alert rules.
- **Navigation (from ticket 11).** `navigation-model.js` builds the readings (coordinates, heading, velocity, destination, ETA) from the store, in the shape the screens already read, and counts hours to the ETA on the simulation clock. `navigation-commands.js` renders NAVIGATION, its POSITION, DESTINATION, COURSE, STATUS and HISTORY sub-reports, and the NAV alias. The Navigation screen takes its values from `navReadings()`. The commands are read-only; course changes come later.
- **Ship, mission and cargo (from ticket 12).** `ship-commands.js` renders SHIP and its sub-reports, plus VERSION and TIME. The firmware label comes from the header element built from `VERSION`, and the time from `util.formatShipDateTime`, which the header also uses. Mission data is its own subsystem (`mission`), and `mission-commands.js` renders it. `MISSION ORDERS` declares the officer level from the matrix, so the engine refuses it below officer. `cargo-commands.js` renders the cargo items the store holds, and every cargo figure is computed from the same list.
- **REPORT (from ticket 13).** `report-commands.js` builds REPORT by running each subsystem command's handler (SHIP, MISSION, NAVIGATION, ENGINEERING, POWER, LIFE SUPPORT, CREW, CARGO, ALERTS, LOG), so every section is that command's output at the same moment. Each composed command is checked by the same `privilege.authorize` decision as the engine; a command the session may not use shows a notice in its place. REPORT ENGINEERING, REPORT CREW and REPORT ALL filter or expand it. ALERTS is the command for the alert board.
- **Terminal input (from ticket 14).** `input-history.js` is the pure input history: chronological entries with times, consecutive duplicates collapse, a limit drops the oldest first, and walking back keeps the typed text as a draft. `input-commands.js` renders HISTORY. The MOTHER keys in `app.js`: Enter (ignores key repeat), Up and Down walk the history, Ctrl+L clears the display but not the history, Ctrl+C cancels a pending question, Escape does the same. Output follows the bottom only when the user was already there. The input has `maxlength` 200, matching the parser's limit.
- **Suggestions (from ticket 15).** `suggest.js` is pure: `suggest` ranks the commands a typed prefix fits, `complete` completes only a single match, `didYouMean` offers the commands in the family of an unknown word (or near spellings), and `relatedBlocks` shows a command's `related` list. Candidates come from the registry metadata plus crew names and subsystem names from the store; `permitted` filters them with `privilege.authorize`. Suggestions never run a command. The MOTHER input shows them in `#mother-suggestions`; arrows move the highlight, Enter inserts it, Tab completes, Escape closes the list. The engine's unknown-command and missing-argument errors use the plan's wording.
- **Course change (from ticket 16).** `NAVIGATION SET COURSE [DESTINATION]` is the first operational command. It declares COMMANDER, so the engine refuses it below commander before any question is shown. It validates the destination against `destinations` in the navigation scenario (unknown and already-set courses are refused with no question), then asks. Only a Y reaches the navigation subsystem's `setCourse` operation, which logs `COURSE CHANGED`; N and Escape cancel with the course unchanged. The handler re-checks the course at confirmation.
- **Power allocation (from ticket 17).** `ENGINEERING POWER ALLOCATION [SUBSYSTEM] [PERCENT] FROM [SUBSYSTEM]` needs COMMANDER. The shares live in `allocation` in the engineering scenario, with their limits in `allocationRules`: life support has a safety minimum of 30% (a cut below it is refused, not confirmed), and navigation, communications and engines warn below 15%, 10% and 15%. `engineeringModel.allocationProblem` is the one rule; the command and the store's `setAllocation` both call it. A change that leaves a subsystem below its warning level raises a POWER LOW alert in the same transition, because operations judge thresholds at their own moment. The POWER report lists the shares.
- **Dashboard console and panels (from ticket 18).** `dashboard-panels.js` maps each clickable panel (by its container id) to the command it runs, and builds the system-event indicator from the store: the alert board the header counts, and the newest events. The Dashboard console and the MOTHER screen both bind through `bindTerminal` in `app.js` (exposed as `window.shipTerminal`), so they share the engine, the input history and the key rules. Only suggestions are MOTHER-only. A panel click runs its command into the Dashboard console. The old `console.js` (`NostromoConsole`) is deleted (ticket 22).
- **Scripted events (from ticket 19).** The scenario's `script` is data: each entry has a trigger time (ms after the store starts) and `changes`, a list of owner operations applied as one transition. The store fires an entry once, from `advance()`, which every read and write goes through, so the log is the same however often the ship is read. Each entry's `notice` is passed to subscribers as `event.notice`; `scripted-events.js` turns it into warning lines, and `app.js` prints them once to every bound terminal output. `store.setScripted(false)` skips entries whose time passes (they are not postponed). `shiftMeasurement` moves a reading from its trigger time on; only the owning subsystem may use it.
- **Persistence (from ticket 20).** `persistence.js` holds the save format: a `{format, version, payload}` envelope in JSON, with infinities written as `{"$number": ...}`. `loadSaved` never throws; a save that is unreadable, from another version, or refused by its builder gives no value and one plain terminal message, and the app starts fresh. The simulation is saved (`nostromo.simulation`) on every store change through `store.exportState()`, and restored with `createShipStore({restore})`, which refuses a save that does not fit the scenario. Command history (`nostromo.history`) is saved on each recorded command. `PERSISTENCE` in `app.js` switches the two independently. Audio settings are saved by `audio-manager.js` under its own key.
- **Reset (from ticket 21).** `store.reset()` returns every subsystem, the log, the alerts and the script to their starting values at the current time; only the reset control calls it. `simulation-reset.js` is the pure confirmation state (request, decline, confirm, and the history option, forgotten after a decline). The control is the RESET SIMULATION button on the MOTHER screen, not a command: `performReset` in `app.js` resets the store, the trend history, and the session (new id, COMMANDER), and clears command history only when ticked. A reload keeps the session id default because the session is not saved (see ticket 20).
- **Events and alerts.** An operation may return `{type, severity, message}`; the store then appends exactly one event to the log, stamped with the simulation clock. The log is append-only, with no removal path. `alerts.js` derives the active alerts from faults and thresholds. The store logs each raise and clear as an event. Fault alerts are logged at the time of the change. Threshold alerts are sampled on a one-second grid anchored at the store's start, so the log is the same however often `store.tick()` is called. Each event is stamped with its grid time, so it is accurate to within one second. The header, the Dashboard summary and the `LOG` commands (`log-commands.js`) all read the same store.
- **Dashboard** is composed from `js/dashboard-components/` (`base-component` → `quadrant-component` → power/life-support/navigation/crew quadrants, plus the ship schematic).

### Versioning
`/VERSION` (a bare integer, currently bumped in nearly every commit) is the source of truth. `index.html` contains the placeholder `MU/TH-UR FW 6000.__VERSION__`, which both `scripts/build.js` and `scripts/dev-server.js` substitute at serve/build time. Never hardcode the number in HTML; bump `VERSION` instead.

### Build specifics
- `scripts/build.js` only processes `index.html`, `css/*.css`, and top-level `js/*.js` (terser with `mangle: false`, console calls kept). `assets/` and `js/dashboard-components/` are copied **unminified**.
- Any new top-level HTML page, or new JS subdirectory, must be added to `build.js` or it will not be in `dist`. Missing required files fail the build via `validateBuild()`.
- It also generates `404.html` (redirects to `/`), `.nojekyll`, and `build-info.json`. `.github/workflows/deploy.yml` builds and deploys to GitHub Pages on push to `main`.

### Styling
Three stylesheets load in this order: `main.css` (layout and components, the largest and most-edited), `terminal.css` (CRT effects: scanlines, curvature, phosphor), then `nostromo-1979.css`, which loads last and overrides the earlier two. Keep the green-phosphor retro look when changing CSS.

### Layout model
The UI is a fixed 1366×768 stage (`#terminal-container` at the end of `nostromo-1979.css`) that `fitStageToWindow()` in `app.js` scales to the window, so every screen is laid out for exactly that size with no scrolling. Check overflow with `.screen-content` `scrollHeight` vs `clientHeight`. `.screen-content` resets `white-space: normal` because `.terminal-content` is `pre-wrap` and would render template indentation as blank lines. The three stylesheets once carried hundreds of declarations that a later rule with the same selector overrode; those were removed (verified by swapping old and new CSS on live elements and comparing computed styles, so layout is unchanged). Cascade order is `main.css`, `terminal.css`, `nostromo-1979.css`, and the latter uses `!important` heavily, so edit the existing rule for an element rather than appending another. Some recent layout fixes still sit as override blocks at the end of `main.css` and `nostromo-1979.css`.

## Guidelines
- Keep JS compatible with terser (no syntax newer than its parser handles).
- Audio problems usually trace to `audio-manager.js` (Web Audio, 920 lines) and browser autoplay restrictions rather than file paths.
- Navigation/view bugs usually trace to route state in `router.js` (`isTransitioning`, `onEnter`/`onExit`) or to a subsystem's `activate()`/`deactivate()`.
- Requires Node >=16. `NOSTROMO_IMPROVEMENT_PLAN.md` describes the intended design vision.

- **Retired responders (from ticket 22).** `legacy-responses.js` and `console.js` are deleted. Old answers are now commands: `HELLO` (alias `HI`), `WHO ARE YOU` and `SYSTEM` in `system-commands.js`; `WHAT IS YOUR MISSION` in `mission-commands.js`, answered from the store. Retired on purpose: `LOGS` (use `LOG`), bare crew names (use `CREW <NAME>`), and the `WHAT IS ...` catch-all. The old REPORT one-liner is gone; `REPORT` is the full report.

## Adding a command

1. Put the command in the module for its subsystem (`*-commands.js`), or make a new module with `register(registry, store, session)`. Declare `name`, `aliases`, `category`, `description`, `usage`, `args`, and `privilege` (from `ns.privilege.OPERATIONS`; the default is CREW).
2. The handler reads the store (`store.snapshot(...)`) and returns blocks. It never checks privilege and never returns HTML. Refuse extra words with `USAGE: ...`, as the other commands do.
3. A command that changes state declares COMMANDER (or the level it needs), asks with `ctx.ask({question, confirm, cancel})`, and changes state only in `confirm`, through the owner's operation.
4. Wire it: add the file to `index.html` before `app.js`, to the `scripts/build.js` required list, and to `tests/ship-computer/load.js`; register it in `getMotherEngine()` in `app.js`.
5. Test it in `tests/ship-computer/<name>.test.js` against a store built from the scenario, with a test for each privilege it declares.

## Adding a subsystem

1. Describe its state, measurements, and initial values in `ship-scenario.js` (see the units and drift policy at the top of that file).
2. Write a pure model module that reads a snapshot, and the commands that render it. Panels call the same model builder, so the terminal and the screen cannot disagree.
3. Change its data only through its own operations, which return an event `{type, severity, message}`. The store logs exactly one event per operation and judges alerts in the same transition.
4. Thresholds go in `alerts.js`. Scripted events go in the scenario's `script`, as data.
5. Add a consistency test: one change, read through the terminal, the panel, the alert board and the log.

## Definition of done (ticket 23 audit)

Checked against the plan's section 16.3:

- [x] Informational commands are registered and work: 31 commands run on the production build with no failure text.
- [x] One shared engine, and parser with subcommands and arguments (`engine.test.js`, `parser.test.js`).
- [x] Autocomplete comes from command definitions (`suggest.test.js`); history walks with the arrow keys (`input-history.test.js`, checked in the browser).
- [x] Reports return structured blocks; crew records are queried by name (`CREW RIPLEY`).
- [x] Ship state has one source (the store), and the panels, screens and terminal read it (`state-consistency.test.js`).
- [x] Responses and dashboard values agree for the alert state. Other values are checked by the subsystem tests, not screen by screen.
- [x] Permission checks are centralized in `privilege.authorize` (`privilege.test.js`).
- [x] Operational commands confirm before changing state (`confirmation.test.js`; checked in the browser with a course change).
- [x] State changes write events, and `LOG` reads them.
- [x] Simulation state survives reloads (`persistence.test.js`, `store-restore.test.js`; checked in the browser on the production build).
- [ ] **Not met: the terminal on mobile.** The stage scales to about 36% at a 375px-wide phone, so the text is too small to use. Follow-up: a mobile layout.
- [x] Automated tests cover the engine, the state, and the critical transitions (see the test files above).

## Deferred items

These are deferred on purpose, from the plan's section 17 or from this audit:

- Special Order 937 storyline, voice interaction, AI-generated responses, multiple users, a filesystem simulation, a full self-destruct sequence, and animated diagnostics. The plan defers each of these as separate work.
- Random ship failures. Scripted events come first; random ones wait until the scripted model has been played.
- Mobile layout (the one unmet checklist item above).
- Engineering screen shows power allocation (ticket 17 follow-up). The POWER report shows it.
- Dashboard panels are mouse-only: no keyboard focus or key handler (ticket 18).
- Dashboard panel and console wiring has no automated DOM test; the browser checks cover it (tickets 18, 21).
- The session identifier is not saved, so a reload brings back the default (tickets 20, 21).
- Saves grow with the event log: each change clones and encodes the whole log (ticket 20).
- `store.reset()` is public with no owner check; only the reset control calls it (ticket 21).
- No player-facing command or setting turns the script on or off (ticket 19).
- Retired words: `LOGS`, bare crew names, and the `WHAT IS ...` catch-all (ticket 22). `OVERRIDE` still prints its access-denied wording when permitted (kept on purpose).
