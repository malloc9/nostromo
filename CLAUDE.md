# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build Process
- `npm run build` - Creates optimized production build in `/dist` directory
- `npm run dev` - Starts development server
- `npm run clean` - Removes the `dist` directory
- `npm run deploy` - Runs build process (for deployment)

### Testing
- `npm test` - Currently outputs "No tests specified" (test suite not implemented)
- Individual test files exist in the `/test` directory for manual verification:
  - `test-boot-and-nav.html` - Boot sequence and navigation testing
  - `test-engineering.html` - Engineering systems testing
  - `test-navigation.html` - Navigation interface testing
  - Other test files for specific subsystems

### Code Structure
- `/js` - Core application logic:
  - `app.js` - Main application entry point
  - `router.js` - Handles navigation between views
  - `data-simulator.js` - Generates realistic system data
  - `console.js` - Interactive terminal interface
  - `crew.js`, `dashboard.js`, `engineering.js`, `life-support.js`, `navigation.js` - Subsystem modules
  - `audio-manager.js`, `boot-sequence.js` - Specialized functionality
- `/css` - Styling:
  - `main.css` - Primary styles
  - `terminal.css` - Terminal-specific retro styling
- `/assets` - Static assets (favicon, etc.)

### Architecture Overview
The Nostromo Monitoring System is a static web application designed to replicate the MU-TH-UR 6000 interface from the film *Alien*. Key architectural patterns:

1. **Modular JavaScript** - Each subsystem (engineering, life-support, navigation, etc.) is encapsulated in its own module
2. **Router-based Navigation** - `router.js` manages view transitions and state
3. **Data Simulation** - `data-simulator.js` provides realistic, evolving system metrics
4. **Retro Terminal Styling** - CSS creates CRT monitor effects with scanlines, curvature, and phosphor persistence
5. **Asset Pipeline** - Build process (`scripts/build.js`) minifies HTML/CSS/JS and optimizes for GitHub Pages

### Development Guidelines
- When modifying JavaScript, maintain compatibility with the build process (avoid features that break minification)
- CSS modifications should preserve the retro aesthetic (scanlines, terminal green color scheme, CRT effects)
- HTML structure follows semantic patterns for accessibility while maintaining the terminal appearance
- New features should align with the immersive Alien-inspired interface (see NOSTROMO_IMPROVEMENT_PLAN.md for vision)

### Deployment
The system is configured for GitHub Pages deployment:
- Build outputs to `/dist` directory
- GitHub Actions workflow (`.github/workflows/deploy.yml`) automates deployment on pushes to main
- Includes 404.html for SPA routing and .nojekyll to prevent Jekyll processing
- Build process generates build-info.json with timestamp and version data

### Common Troubleshooting
- If build fails, check Node.js version (requires >=16.0.0)
- For styling issues, verify CSS minification didn't break retro effects
- Navigation problems often relate to router.js state management
- Audio issues may require checking audio-manager.js and audio file paths


## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review