# Plan: Enhanced Dashboard with Modular Ship Data Display

## Problem Statement
Enhance the dashboard to show ship information after a loading phase instead of the static starter screen showing "Nostromo, Weyland-Yutani Corporation, etc." The goal is to create a more immersive Alien MU-TH-UR 6000 interface experience by displaying dynamic ship system information.

## Chosen Approach
APPROACH B: Modular ship data dashboard (Ideal Architecture) — chosen because it provides the best balance of implementability, authenticity to the Alien film interface, and extensibility for future enhancements while leveraging the existing modular codebase structure.

## Implementation Steps

1. **Create Ship Dashboard Container Component**
   - Create new file: `js/ship-dashboard.js`
   - Implement tabbed interface for subsystem views
   - Manage active tab state and data updates

2. **Modify Dashboard Initialization**
   - Update `js/dashboard.js` to use ShipDashboardContainer instead of direct quadrant management
   - Implement component registry pattern to reduce tight coupling
   - Extract HTML structure to separate rendering functions

3. **Adapt Existing Quadrant Components**
   - Refactor quadrant components to work as tab views
   - Ensure consistent rendering lifecycle
   - Extract constants for CSS classes and IDs

4. **Integrate with Data Simulator**
   - ShipDashboardContainer will distribute relevant data to each tab
   - Maintain real-time update mechanism
   - Add component readiness checks before updates

5. **Style Tab Interface**
   - Update CSS to maintain retro terminal aesthetic
   - Create tab controls that match Alien interface
   - Ensure styling works with existing build process

6. **Add Subtle Animations**
   - Implement idle states to make system feel "alive"
   - Add cursor blinking or subtle indicators
   - Preserve CRT effects during tab transitions

7. **Testing and Validation**
   - Update existing tests to cover new functionality
   - Add tests for tab switching and data distribution
   - Verify build process still works correctly

## Files to Modify/Create
- `js/ship-dashboard.js` (new)
- `js/dashboard.js` (modify)
- `js/dashboard-components/*quadrant.js` (modify for consistency)
- `css/main.css` (potential updates for tab styling)
- `test/dashboard.test.js` (update/add tests)

## Dependencies
- Existing data-simulator.js for ship metrics
- Existing router.js for potential navigation integration
- Existing build process (npm run build)
- Existing GitHub Pages deployment

## Success Criteria
- Users can navigate between different ship subsystem views (power, life support, navigation, crew, engineering)
- Each view displays relevant, dynamically updating ship data from the data simulator
- The interface maintains the retro Alien aesthetic with appropriate styling
- The solution works with the existing build process without breaking minification
- Tab switching is responsive and maintains state correctly

## Engineering Decisions (from reviews)

### Architecture (resolved in /plan-eng-review)
- **No component registry** — use existing NostromoDashboard class, add tab bar on top of the quadrant grid. The plan already committed to ShipDashboardContainer but the minimal approach is recommended.
- **Tab-to-screen relationship** — tabs show quadrant content inside the dashboard. F2-F5 key routes still open full separate screens. The same QuadrantComponent instances are reused between tab views and full-screen views.
- **Lazy rendering** — only the active tab's component calls render(). Switching tabs triggers render() for the newly shown tab. Inactive tabs store data but don't update DOM.
- **Tab bar styling** — chunky block-bordered tabs, uppercase VT323, dim-green-on-black inactive (`#0a1a0a`), thick-green-border active. No rounded pills. Hardware button aesthetic, not modern soft tabs.

### Data Flow
```
                    ┌─────────────────────────────┐
                    │     ShipDashboardContainer  │
                    │  ├── activeTab (state)      │
                    │  ├── dataRefreshInterval    │
                    │  └── tab registry           │
                    └──────────┬──────────────────┘
                               │ dispatches data to
               ┌───────────────┼───────────────────┐
               ▼               ▼                   ▼
        ┌──────────┐    ┌──────────┐        ┌──────────┐
        │  POWER   │    │  LIFE    │        │  CREW    │  (tab components)
        │  Tab     │    │  SUPPORT │        │  Tab     │
        │          │    │  Tab     │        │          │
        └──────────┘    └──────────┘        └──────────┘
               │ reuse existing QuadrantComponent instances
               ▼
        ┌──────────────────────────────────┐
        │  DataSimulator.generateSystem... │
        └──────────────────────────────────┘
```

### Test Plan
- All tests must pass before merging; plan proposes 14 gaps to cover (see eng review section)
- Jest setup is broken (modules not loaded in jsdom) — fix as TODO in separate PR
- Test file: `test/dashboard.test.js` — add tab switching, data distribution, lazy render

## Open Questions
- ~~How should the tabbed interface be styled~~ → resolved (see Engineering Decisions)
- ~~What specific ship systems data should be displayed~~ → resolved (reuse existing quadrant data)
- Should there be ambient audio that changes based on the active subsystem tab? (deferred)

## NOT in scope
- Ambient audio per-tab — not core to the feature
- Full Jest test infrastructure fix — captured as TODO
- Quadrant component rewrite for dual-context (tab + full-screen) — implement incrementally during this feature

## What already exists
- `NostromoDashboard` — already orchestrates all 4 quadrants with 2.5s refresh loop
- `QuadrantComponent` base class — already provides init/render/update lifecycle
- `data-simulator.js` — already generates all ship metrics
- Ship schematic — already exists with clickable system indicators
- Router — already has F1-F5 routes; dashboard route calls activate/deactivate

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | \`/plan-ceo-review\` | Scope & strategy | 0 | — | — |
| Codex Review | \`/codex review\` | Independent 2nd opinion | 0 | — | — |
| Eng Review | \`/plan-eng-review\` | Architecture & tests (required) | 1 | CLEARED (PLAN) | 4 issues, 1 critical gap |
| Design Review | \`/plan-design-review\` | UI/UX gaps | 1 | CLEAN (FULL) | score: 4/10 -> 8/10, 3 decisions |

**UNRESOLVED:** 0 decisions deferred
**VERDICT:** ENG + DESIGN CLEARED — ready to implement
