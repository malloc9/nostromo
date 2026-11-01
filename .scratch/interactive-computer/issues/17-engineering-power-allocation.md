# 17: ENGINEERING POWER ALLOCATION with a safety threshold

**What to build:**

The second operational command: a commander can reallocate power between subsystems. It follows the plan's rule for validated state changes: reducing life-support power below a defined safety threshold is rejected, or allowed only through an explicit extra authorization step.

The user states an allocation, the computer shows the before and after and the effects on dependent systems, asks for confirmation, and on confirmation changes the power distribution through the engineering subsystem's own operation, records an event, updates the Engineering screen and the Dashboard, and answers explicitly. Changes that would push a subsystem into a warning state raise an alert as part of the same transition.

The safety threshold, the rules for the extra authorization, and the allowed ranges are written down in the ticket's resulting documentation.

**Blocked by:**

- 08 Confirmation prompts, ACCESS REQUEST and SECURITY
- 06 Engineering and power subcommands
- 10 Life Support: commands and the screen on the store

**Status:** ready-for-agent

**Acceptance criteria:**

- [ ] The command requires commander privilege, validates arguments and shows before and after values
- [ ] Dropping life support below the threshold is rejected or requires the documented extra authorization, never silently allowed
- [ ] Confirmed changes update the engineering model, the Engineering screen, the Dashboard, the alerts and the log together
- [ ] A change that causes a warning raises the alert and header count in the same transition
- [ ] Cancelling or rejecting changes nothing
- [ ] Tests cover valid, rejected and escalated allocations and the alert consequences
