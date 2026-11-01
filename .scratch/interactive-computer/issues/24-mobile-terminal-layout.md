# 24: Terminal layout for mobile widths

**What to build:**

The plan's definition of done requires the terminal to work on mobile. Today the whole interface is a fixed 1366×768 stage that scales down: at a 375px-wide phone the stage scales to about 36%, which is too small to read or to type into. Give the MOTHER screen (and the Dashboard console) a layout for narrow widths, keeping the same engine, history and output. The fixed stage stays for desktop.

**Blocked by:** none. Found by the ticket 23 audit.

**Status:** ready-for-agent

**Acceptance criteria:**

- [ ] At 375px wide, the MOTHER input and output are readable without zooming, and there is no horizontal scroll
- [ ] Typing, history, suggestions and Enter work on a touch keyboard
- [ ] The desktop stage is unchanged at 1366×768
- [ ] The Dashboard console is usable at phone width, or is stated as not supported
