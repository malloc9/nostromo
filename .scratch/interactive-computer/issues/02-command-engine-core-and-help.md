# 02: Command engine core, HELP and structured output on the MOTHER screen

**What to build:**

On the MOTHER screen, whatever the user types is handled by a command engine instead of the static response map. The engine is independent of the terminal UI: it can be called with a plain string and returns a structured result, so panels and tests can invoke commands the same way the terminal does.

The engine follows the lifecycle in the plan: receive raw input, normalize, parse (command, subcommand, arguments, options), look up in a registry, validate, check privilege (a placeholder that allows everything until the privilege ticket), execute, produce structured output, record in history, and expose hooks for state refresh and event recording that later tickets fill in.

Commands are registered one at a time, each with metadata: name, description, usage, category, optional aliases, required privilege, and argument definitions. Multi-word commands ("LIFE SUPPORT", "SPECIAL ORDER 937") are matched against the registry, not hard-coded in the parser.

Handlers return structured output blocks, never HTML. The terminal renders these block types distinctly: text, table, status list, warning, error. The other types named in the plan (report, authorization, progress, confirmation) are defined now so later tickets can use them, and render as plain text until their ticket gives them a look.

Commands delivered here: `HELP` (grouped by category, generated from the registry), `HELP [COMMAND]` (usage and description from metadata), and a clear unknown-command error. "Did you mean" suggestions come in a later ticket.

Expand step: input the registry does not know falls back to the existing static responses, so nothing the app answers today stops working. Removing that fallback is a later ticket.

The terminal keeps the established look: entered commands are visually distinct from output, and normal, warning and error output each have their own treatment, restrained in the Alien style.

**Blocked by:**

- 01 Test harness and module layout for the ship computer

**Status:** ready-for-agent

**Acceptance criteria:**

- [ ] Input is matched case-insensitively; leading, trailing and repeated spaces do not change the result; quoted arguments keep their spaces
- [ ] Multi-word commands resolve through the registry; adding a new command requires only registering it
- [ ] `HELP` lists every registered command grouped by category, and `HELP [COMMAND]` shows its usage and description, both generated from registry metadata
- [ ] An unknown command returns an error block that names the unknown input and points to `HELP`; it never changes any state
- [ ] A handler that throws produces a generic error block in the terminal; no JavaScript exception text or stack ever appears there
- [ ] The engine can be called from a test with a string and no DOM, and returns the same structured result the terminal renders
- [ ] Handler output is rendered through the block renderer only; handler-supplied text is escaped rather than inserted as markup
- [ ] Input the registry does not know still gets the legacy response, and tests cover the engine lifecycle, parser edge cases (empty input, very long input, unmatched quote) and registry lookup
