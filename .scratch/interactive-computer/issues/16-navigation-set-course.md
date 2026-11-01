# 16: NAVIGATION SET COURSE with confirmation

**What to build:**

The first operational command. `NAVIGATION SET COURSE [DESTINATION]` changes the ship's course, and nothing happens until the user confirms.

The flow follows the plan: the computer states the requested change, shows current and requested course and asks for confirmation. Confirming changes the navigation model through the navigation subsystem's own operation, writes a navigation event, updates the Navigation screen and Dashboard quadrant, and answers explicitly with what changed. Cancelling changes nothing and says so. The command needs commander privilege.

Invalid destinations, a destination equal to the current course, and a command given while another operation is in progress are rejected with the plan's wording.

**Blocked by:**

- 08 Confirmation prompts, ACCESS REQUEST and SECURITY
- 11 Navigation: commands and the screen on the store

**Status:** ready-for-agent

**Acceptance criteria:**

- [ ] The command requires commander privilege and the check happens before any prompt is shown
- [ ] The confirmation shows current and requested course and changes nothing until confirmed
- [ ] Confirming updates the model, the Navigation screen, the Dashboard quadrant and the log together, and the response states what changed
- [ ] Cancelling leaves every one of those unchanged
- [ ] Unknown destinations, the same course, bad syntax and an operation already running each produce a clear rejection
- [ ] Tests cover confirm, cancel, rejection cases and the consistency of everything the change touches
