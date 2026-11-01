# 01: Test harness and module layout for the ship computer

**What to build:**

A developer can run one command and get a pass/fail result for unit tests of new ship-computer logic. That logic lives in a new, dedicated group of plain JavaScript modules that load in the browser through ordinary script tags (in a documented order) and can also be loaded by tests in Node, using the dual-export pattern some existing modules already follow. The new group is served by the dev server and is minified into the production build like the rest of the app.

This is the prefactor for everything else: every later ticket adds tested modules in this layout.

Conventions this ticket establishes (and documents for later tickets):
- Plain JavaScript with JSDoc type definitions. No TypeScript, no new compile step.
- One namespace object for the new code instead of many loose globals.
- Pure logic modules have no DOM dependency; only a thin presentation layer touches the DOM.
- Where a test needs a DOM, the test environment provides one.

Out of scope: converting or testing any existing module; adding real ship logic.

**Blocked by:**

None (can start immediately)

**Status:** ready-for-agent

**Acceptance criteria:**

- [ ] `npm test` runs the test suite and exits non-zero when a test fails (the test runner is already installed but unused)
- [ ] At least one real unit test of a small pure function in the new module group passes, proving the browser/Node loading pattern works without duplicating code
- [ ] The new module group is loaded by the page in a documented order, is served by the dev server, and appears (minified) in the build output; the build's validation step fails if it is missing
- [ ] The existing manual test pages and every current screen still work
- [ ] The project guide explains how to add a module, how to write and run its test, and the load-order rule
- [ ] A short note records the JSDoc-type convention and the single-namespace rule
