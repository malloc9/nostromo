# 07: Privilege model: ACCESS, ACCESS LEVELS, WHOAMI

**What to build:**

The privilege indicator that is only decoration today becomes a real authorization model. There is a session with an identifier and a current privilege level. The levels are crew, officer, commander, corporate and system, and the session starts at the level the current interface shows (commander).

Authorization is a central service. Each command declares the privilege it requires and the engine checks it before running the handler. A denied command returns an authorization block that states the required and current levels and never contains the restricted information. The permission matrix in the plan is the specification for which operations need which level.

Commands delivered: `ACCESS` (current access level), `ACCESS LEVELS` (available levels and what each allows), and `WHOAMI` (session and permissions). The header's session identifier and privilege indicator read from the session.

Asking to be elevated, and confirmation prompts in general, are the next ticket.

**Blocked by:**

- 02 Command engine core, HELP and structured output on the MOTHER screen
- 03 Ship state store, with the data simulator reading from it

**Status:** ready-for-agent

**Acceptance criteria:**

- [ ] The five levels exist and are ordered; the session starts at commander
- [ ] The engine checks a command's declared requirement before executing any handler, and a denied command executes nothing
- [ ] A denial shows an authorization block with required and current privilege and no restricted data
- [ ] The permission matrix in the plan is encoded and table-tested for each operation and level it covers
- [ ] `ACCESS`, `ACCESS LEVELS` and `WHOAMI` work and agree with the header
- [ ] No command or panel checks privilege on its own; there is exactly one place that decides
- [ ] Tests cover every level against representative commands, including the corporate-only and restricted cases
