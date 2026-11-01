# 08: Confirmation prompts, ACCESS REQUEST and SECURITY

**What to build:**

The engine can ask the user a yes/no question and wait for the answer before anything changes. This is the mechanism every state-changing command will use.

While a confirmation is pending, the next input is read as the answer: `Y` confirms, `N` cancels, anything else returns to the original prompt with the question still pending or cancelled according to a stated rule. Pressing Escape cancels. A confirmation that is cancelled changes nothing and says so.

The first users of it are in the security area. `ACCESS REQUEST [LEVEL]` asks for elevated privilege using the authorization wording from the plan ("ACCESS RESTRICTED... REQUEST ELEVATED ACCESS? Y/N"). Whether a request is granted follows a simple, documented rule for this version (for example, corporate level is refused, officer or commander is granted). `SECURITY` reports the security status. Granting, denying and cancelling all write security events to the log.

Rule: no command may silently change state. Every modification produces an explicit response saying what happened.

**Blocked by:**

- 07 Privilege model: ACCESS, ACCESS LEVELS, WHOAMI
- 04 Event log and alerts, with the live count in the header

**Status:** ready-for-agent

**Acceptance criteria:**

- [ ] A pending confirmation is part of engine state, not UI state; it can be set and answered from a test without a DOM
- [ ] `Y` confirms and `N` cancels; an invalid answer returns to the original prompt without changing state; Escape cancels
- [ ] `ACCESS REQUEST [LEVEL]` shows the authorization wording, applies the documented grant rule, changes the session level only on confirmation, and responds explicitly
- [ ] The header privilege indicator updates immediately when the level changes
- [ ] Granted, refused and cancelled requests each write a security event visible through `LOG SECURITY`
- [ ] `SECURITY` reports current security status from the store
- [ ] Unknown or restricted level names give a clear error or denial, not an exception
- [ ] Tests cover confirm, cancel, invalid answer, escape and each grant outcome
