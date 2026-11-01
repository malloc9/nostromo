# 15: Autocomplete, related-command suggestions and did-you-mean

**What to build:**

As the user types, a list of matching commands appears, generated from the command registry (nothing is maintained separately). Suggestions narrow as more is typed, show a short description for the highlighted entry, can be picked with the keyboard or by clicking, and respect privileges where appropriate. Tab completes the best unambiguous match. Nothing is ever executed by autocomplete alone.

Arguments get suggestions from the model: crew names, subsystem names, and valid options, so `CREW R` narrows to `CREW RIPLEY` with the description from the plan.

After a command runs, a "RELATED COMMANDS" list is shown, generated from command metadata, for example after `ENGINEERING` the four related engineering commands and a hint to use `HELP ENGINEERING`.

Unknown input returns "COMMAND NOT RECOGNIZED" with a "DID YOU MEAN" list of the closest commands, and missing or invalid arguments return the usage line and valid values.

**Blocked by:**

- 09 Crew: commands and the Crew screen on the store
- 14 Terminal input, command history and scrolling

**Status:** ready-for-agent

**Acceptance criteria:**

- [ ] Suggestions are generated only from registry metadata and update on every keystroke
- [ ] Keyboard and pointer selection both work; Escape closes the list; Tab completes unambiguous matches only
- [ ] Autocomplete never runs a command
- [ ] Crew names, subsystem names and valid options are offered as arguments where relevant
- [ ] Related commands are shown after informational commands and come from metadata
- [ ] Unknown commands, missing arguments and invalid arguments return the wording and structure given in the plan
- [ ] Tests cover matching, ranking, permission filtering and the error forms
