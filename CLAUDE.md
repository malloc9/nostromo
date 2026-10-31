# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Node dev server (`scripts/dev-server.js`) on `http://localhost:3000` (override with `PORT=...`)
- `npm run build` - Minifies into `/dist` (HTML, CSS, JS) and validates required files
- `npm run clean` - Removes `/dist`
- `npm run deploy` - Alias for build

### Testing
There is no automated test suite: `package.json` has no `test` script, and jest/jest-environment-jsdom are installed but unconfigured and unused. Verification is manual and lives at the **repo root** (there is no `/test` directory):
- `test-*.html` (e.g. `test-boot-and-nav.html`, `test-engineering.html`, `test-navigation.html`, `test-router.html`) - open via `npm run dev` and view in a browser
- `verify-*.js` and `test-crew-basic.js` - ad-hoc scripts; run with `node <file>` (`test-crew-basic.js` works because `crew.js`/`data-simulator.js` export via `module.exports`; the `verify-*.js` scripts expect a DOM)
- The root also holds many screenshot PNGs, plan docs, and deployment notes from past iterations; they are not part of the app.

## Architecture

A static, build-light vanilla JS app (no framework, no bundler) that replicates the MU-TH-UR 6000 terminal from *Alien*. Understanding it takes several files:

- **No module system.** `index.html` loads every script with a plain `<script>` tag in dependency order: `data-simulator` → `audio-manager` → `boot-sequence` → `router` → `dashboard-components/*` (base → quadrant → specific) → `dashboard`, `life-support`, `navigation`, `engineering`, `crew`, `console` → `app.js` last. A new JS file does nothing until it is added to `index.html` in the right position. Classes are globals (e.g. `NostromoRouter`, `NostromoCrew`); several also end with `if (typeof module !== 'undefined') module.exports = ...` so Node scripts can `require` them.
- **`app.js` is the composition root.** On `DOMContentLoaded` it instantiates each subsystem and publishes it on `window` (`window.router`, `window.dashboard`, `window.crew`, ...). Subsystems find each other through these globals, not imports.
- **Hash router** (`router.js`): routes (`dashboard`, life support, navigation, engineering, crew, mother console) are registered in `registerDefaultRoutes()` with a screen element id, F-key hotkey, and `onEnter`/`onExit` hooks that call `window.<subsystem>.activate()`/`deactivate()`. Hash routing is what keeps it working on GitHub Pages. Adding a screen means a new route, a `<section>` in `index.html`, and an init in `app.js`.
- **`data-simulator.js`** is the shared data source: all subsystems read evolving simulated metrics from the single `dataSimulator` instance passed in from `app.js`.
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
