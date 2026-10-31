# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Node dev server (`scripts/dev-server.js`) on `http://localhost:3000` (override with `PORT=...`)
- `npm run build` - Minifies into `/dist` (HTML, CSS, JS) and validates required files
- `npm run clean` - Removes `/dist`
- `npm run deploy` - Alias for build

### Unit tests
- `npm test` runs Jest over `tests/**` (configured by the `jest.roots` key in `package.json`). It exits non-zero on failure. Only the ship-computer logic is covered so far.
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
  - The MOTHER terminal runs on the command engine. A command is `registry.register({name, aliases, category, usage, args, privilege, handler})`; handlers return blocks (`text`, `table`, `status`, `warning`, `error`, plus `report`/`authorization`/`progress`/`confirmation` rendered as text), never HTML. `engine.execute(string)` returns the structured result; `terminal-view.js` is the only renderer and escapes all text. Input the registry does not know falls back to `legacy-responses.js` and then to the unknown-command error. `legacy-responses.js` goes when ticket 22 lands.
  - `tests/ship-computer/load.js` loads the modules in browser order for Node tests. Add new module names there.
- **No module system.** `index.html` loads every script with a plain `<script>` tag in dependency order: `data-simulator` → `audio-manager` → `boot-sequence` → `router` → `dashboard-components/*` (base → quadrant → specific) → `dashboard`, `life-support`, `navigation`, `engineering`, `crew`, `console` → `app.js` last. A new JS file does nothing until it is added to `index.html` in the right position. Classes are globals (e.g. `NostromoRouter`, `NostromoCrew`); several also end with `if (typeof module !== 'undefined') module.exports = ...` so Node scripts can `require` them.
- **`app.js` is the composition root.** On `DOMContentLoaded` it instantiates each subsystem and publishes it on `window` (`window.router`, `window.dashboard`, `window.crew`, ...). Subsystems find each other through these globals, not imports.
- **Hash router** (`router.js`): routes (`dashboard`, life support, navigation, engineering, crew, mother console) are registered in `registerDefaultRoutes()` with a screen element id, F-key hotkey, and `onEnter`/`onExit` hooks that call `window.<subsystem>.activate()`/`deactivate()`. Hash routing is what keeps it working on GitHub Pages. Adding a screen means a new route, a `<section>` in `index.html`, and an init in `app.js`.
- **`data-simulator.js`** is a thin adapter over the ship state store (`js/ship-computer/ship-state.js`, initial data in `ship-scenario.js`). All subsystems still read through the single `dataSimulator` instance from `app.js`, and it converts store units to the ones the screens show (pressure kPa to ATM). Readings are derived from the simulation clock, not random, so two readers at the same time see the same value. The drift policy and units are written at the top of `ship-scenario.js`.
- **Store rules.** A subsystem changes only through its own operations: `store.operate(name, op, args, actor)` throws `OwnershipError` if `actor !== name`. Snapshots are deep-frozen. Subscribers hear about each successful change once.
- **Subsystem template (from ticket 05).** Each subsystem follows the same four parts, so the terminal, the panels and the header cannot disagree: (1) a model in the store: its state, measurements and faults; (2) a pure model module that reads a snapshot (`engineering-model.js` for engineering); (3) commands that render the model (`engineering-commands.js`, `status-commands.js`); (4) panels that call the same model builder (`engineering.js`, `power-quadrant.js`). Faults are added with `store.operate(..., 'addFault', {code, component, severity}, owner)`. This operation is test-only: no registered command calls it, and `fault-tracer.test.js` checks that the terminal cannot add a fault.
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
