# 14: Terminal input, command history and scrolling

**What to build:**

The MOTHER terminal behaves like a real command line. Enter runs a command, arrow up and down walk the history, Home and End move the cursor, backspace edits normally, Ctrl+L clears the display, Ctrl+C cancels a supported running operation, and Escape closes anything open such as a suggestion list.

Rules: double Enter must not run a command twice; empty input does nothing; very long input is limited or rejected with a message; input focus is taken when the user clicks the terminal but not stolen when they use another panel; ordinary browser shortcuts keep working.

The history is chronological with timestamps, survives moving between screens within the session, has a configurable limit, and follows one stated policy for consecutive duplicates. `HISTORY` lists it, and `CLEAR` clears the display. A previous command can be re-run.

Scrolling: if the user is at the bottom, new output scrolls into view; if they have scrolled up to read older output, their position is left alone.

**Blocked by:**

- 02 Command engine core, HELP and structured output on the MOTHER screen

**Status:** ready-for-agent

**Acceptance criteria:**

- [ ] Every key behaviour in the plan's input table works, and each is covered by a test or a documented manual check
- [ ] Double Enter produces one execution
- [ ] History navigation, the limit and the duplicate policy work and are unit tested
- [ ] `HISTORY` and `CLEAR` work; clearing the display does not clear the stored history
- [ ] History is shared across screens in the same session
- [ ] Output auto-scrolls only when the user was already at the bottom
- [ ] The terminal does not take focus when another panel is used
