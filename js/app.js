// Nostromo Monitoring System - Main Application Controller
// Integrates router, data simulation, and terminal effects
// Test comment to verify hooks are working

// Global instances
let dataSimulator;
let audioManager;
let router;
let dashboard;
let lifeSupport;
let engineering;
let crew;
let bootSequence;

// The UI is laid out on a fixed 1366x768 stage; scale it to fit the window.
const STAGE_WIDTH = 1366;
const STAGE_HEIGHT = 768;

function fitStageToWindow() {
    const scale = Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT);
    document.documentElement.style.setProperty('--stage-scale', scale.toFixed(4));
}

fitStageToWindow();
window.addEventListener('resize', fitStageToWindow);

document.addEventListener('DOMContentLoaded', function () {
    // Initialize core systems
    initializeDataSimulator();
    initializeAudioManager();
    initializeBootSequence();
    initializeRouter();
    initializeDashboard();
    initializeLifeSupport();
    initializeNavigationSystem();
    initializeEngineering();
    initializeCrew();
    initializeConsole();

    // Initialize UI components
    updateSystemTime();
    setInterval(updateSystemTime, 1000);

    // Initialize navigation
    initializeNavigation();

    // Add keyboard support for navigation
    initializeKeyboardControls();

    // Listen for route changes
    window.addEventListener('routechange', handleRouteChange);

    // A click anywhere on the boot screen skips it, like a key press
    const bootScreenEl = document.getElementById('boot-screen');
    if (bootScreenEl) {
        bootScreenEl.addEventListener('click', () => {
            if (bootSequence) bootSequence.skip();
        });
    }

    // Start boot sequence if needed
    startApplicationBootSequence();
});

function initializeDataSimulator() {
    if (typeof DataSimulator !== 'undefined') {
        dataSimulator = new DataSimulator();
        console.log('Data simulator initialized');
    } else {
        console.warn('DataSimulator not available - ensure data-simulator.js is loaded');
    }
}

function initializeAudioManager() {
    if (typeof NostromoAudioManager !== 'undefined') {
        audioManager = new NostromoAudioManager();
        window.audioManager = audioManager; // Make globally accessible
        console.log('Audio manager initialized');
    } else {
        console.warn('NostromoAudioManager not available - ensure audio-manager.js is loaded');
    }
}

function initializeBootSequence() {
    if (typeof NostromoBootSequence !== 'undefined') {
        bootSequence = new NostromoBootSequence();
        window.bootSequence = bootSequence; // Make globally accessible
        console.log('Boot sequence initialized');
    } else {
        console.warn('NostromoBootSequence not available - ensure boot-sequence.js is loaded');
    }
}

function initializeRouter() {
    if (typeof NostromoRouter !== 'undefined') {
        router = new NostromoRouter();
        window.router = router;
        console.log('Router initialized');
    } else {
        console.error('NostromoRouter not available - ensure router.js is loaded');
    }
}

function initializeDashboard() {
    if (typeof NostromoDashboard !== 'undefined' && dataSimulator) {
        dashboard = new NostromoDashboard(dataSimulator);
        window.dashboard = dashboard; // Make globally accessible
        console.log('Dashboard initialized');
    } else {
        console.warn('Dashboard or DataSimulator not available');
    }
}

function initializeLifeSupport() {
    if (typeof NostromoLifeSupport !== 'undefined' && dataSimulator) {
        lifeSupport = new NostromoLifeSupport(dataSimulator);
        window.lifeSupport = lifeSupport; // Make globally accessible
        console.log('Life Support system initialized');
    } else {
        console.warn('Life Support or DataSimulator not available');
    }
}

function initializeNavigationSystem() {
    if (typeof NostromoNavigation !== 'undefined' && dataSimulator) {
        const navigation = new NostromoNavigation(dataSimulator);
        window.navigation = navigation; // Make globally accessible
        console.log('Navigation system initialized');
    } else {
        console.warn('Navigation system or DataSimulator not available');
    }
}

function initializeEngineering() {
    if (typeof NostromoEngineering !== 'undefined' && dataSimulator) {
        engineering = new NostromoEngineering(dataSimulator);
        window.engineering = engineering; // Make globally accessible
        console.log('Engineering system initialized');
    } else {
        console.warn('Engineering system or DataSimulator not available');
    }
}

function initializeCrew() {
    if (typeof NostromoCrew !== 'undefined' && dataSimulator) {
        crew = new NostromoCrew(dataSimulator);
        window.crew = crew; // Make globally accessible
        console.log('Crew monitoring system initialized');
    } else {
        console.warn('Crew monitoring system or DataSimulator not available');
    }
}

function initializeConsole() {
    if (typeof NostromoConsole !== 'undefined' && audioManager) {
        const consoleSystem = new NostromoConsole(audioManager);
        window.consoleSystem = consoleSystem; // Make globally accessible
        consoleSystem.init();
        initMotherInterface();
        console.log('Console interface initialized');
    } else {
        console.warn('NostromoConsole or AudioManager not available');
    }
}

function initMotherInterface() {
    const input = document.getElementById('mother-input');
    if (!input) return;
    updateSessionHeader();
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const cmd = input.value.trim();
            if (!cmd) return;
            handleMotherCommand(cmd);
            input.value = '';
        } else if (e.key === 'Escape') {
            handleMotherEscape();
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
        }
        if (audioManager && e.key.length === 1) {
            audioManager.playKeypress();
        }
    });
    // Auto-focus the input when on mother screen
    const observer = new MutationObserver(() => {
        const motherScreen = document.getElementById('mother-screen');
        if (motherScreen && motherScreen.classList.contains('active')) {
            input.focus();
        }
    });
    const motherScreen = document.getElementById('mother-screen');
    if (motherScreen) {
        observer.observe(motherScreen, { attributes: true, attributeFilter: ['class'] });
    }
}

let motherEngine = null;
let motherSession = null;

// The terminal session. It starts at commander, and the header reads it from here.
function getMotherSession() {
    if (!motherSession) {
        motherSession = window.NostromoShipComputer.privilege.createSession();
    }
    return motherSession;
}

// Header session fields read from the session, so they cannot disagree with the gate.
function updateSessionHeader() {
    const session = getMotherSession();
    const idElement = document.getElementById('mother-session-id');
    const privElement = document.getElementById('mother-priv-level');
    if (idElement) idElement.textContent = session.id;
    if (privElement) privElement.textContent = session.level;
}

// The MOTHER terminal's command engine. Built once; the registry holds the commands and
// the legacy responder answers anything the registry does not know yet. Every command
// is gated by the one privilege decision, through the engine's authorize option.
function getMotherEngine() {
    if (!motherEngine) {
        const ns = window.NostromoShipComputer;
        const session = getMotherSession();
        const registry = ns.registry.createRegistry();
        ns.systemCommands.register(registry);
        ns.accessCommands.register(registry, session);
        ns.restrictedCommands.register(registry);
        if (dataSimulator) {
            ns.logCommands.register(registry, dataSimulator.store);
            ns.accessRequestCommands.register(registry, dataSimulator.store, session);
            ns.crewCommands.register(registry, dataSimulator.store, session);
            ns.engineeringCommands.register(registry, dataSimulator.store);
            ns.statusCommands.register(registry, dataSimulator.store);
        }
        motherEngine = ns.engine.createEngine({
            registry,
            authorize: (required) => ns.privilege.authorize(session, required),
            fallback: (normalized) => ns.legacy.respond(normalized)
        });
    }
    return motherEngine;
}

// Escape cancels a pending question, as if the user had answered N.
function handleMotherEscape() {
    const out = document.getElementById('mother-output');
    const result = getMotherEngine().cancelPending();
    if (!out || !result) return;
    window.NostromoShipComputer.terminalView.renderBlocks(out, result.blocks);
    updateSessionHeader();
    out.scrollTop = out.scrollHeight;
}

function handleMotherCommand(cmd) {
    const out = document.getElementById('mother-output');
    if (!out) return;

    if (cmd.toUpperCase() === 'CLS' || cmd.toUpperCase() === 'CLEAR') {
        out.innerHTML = '';
        return;
    }

    const view = window.NostromoShipComputer.terminalView;
    view.echo(out, cmd);
    view.renderBlocks(out, getMotherEngine().execute(cmd).blocks);
    // A granted request changes the level; the header shows it straight away.
    updateSessionHeader();

    out.scrollTop = out.scrollHeight;
}

function updateSystemTime() {
    const timeElement = document.getElementById('system-time');
    const store = dataSimulator ? dataSimulator.store : null;
    if (timeElement) {
        // Ship time comes from the store, so the header and the log agree on it
        const clockTime = store ? store.now() : Date.now();
        // Set futuristic date for the Nostromo mission
        timeElement.textContent = `2122-06-02 ${window.NostromoShipComputer.util.formatClock(clockTime)}`;
    }
    if (store) {
        updateHeaderAlerts(store);
    }
}

// Header alert count and overall status, from the same alert board the Dashboard reads
function updateHeaderAlerts(store) {
    const countElement = document.getElementById('header-alerts');
    const statusElement = document.getElementById('main-status');
    if (!countElement && !statusElement) return;

    const board = store.tick();
    const count = board.list.length;
    if (countElement) {
        countElement.textContent = count.toString();
        countElement.className = count > 0 ? 'status-warning' : 'status-ok';
    }
    if (statusElement) {
        statusElement.textContent = board.overall;
        statusElement.className = board.overall === 'CRITICAL' ? 'status-critical'
            : (board.overall === 'WARNING' ? 'status-warning' : 'status-ok');
    }
}

async function startApplicationBootSequence() {
    // Check if we should show the boot sequence
    if (bootSequence && bootSequence.shouldShowBootSequence()) {
        await bootSequence.startBootSequence();
        bootSequence.markBootSequenceComplete();
    } else {
        // Skip boot sequence and go directly to dashboard
        if (router) {
            router.navigateTo(router.getInitialRoute(), false);
        }
    }
}

function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-screen]');
    navItems.forEach(item => {
        item.addEventListener('click', function (event) {
            event.preventDefault();
            const screen = this.dataset.screen;
            if (screen && router) {
                // Play navigation sound
                if (audioManager) {
                    audioManager.playNavigation();
                }
                router.goTo(screen);
            }
        });
    });
}

function initializeKeyboardControls() {
    document.addEventListener('keydown', function (event) {
        // Play keypress sound for most keys
        if (audioManager && event.key.length === 1) {
            audioManager.playKeypress();
        }

        // Handle boot screen - any key to continue
        const bootScreen = document.getElementById('boot-screen');
        if (bootScreen && bootScreen.classList.contains('active')) {
            event.preventDefault();
            if (bootSequence) {
                bootSequence.skip();
            } else if (router) {
                router.completeBootSequence();
            }
            return;
        }

        // Handle F-key navigation through router
        if (router && router.handleHotkey(event.key)) {
            event.preventDefault();
            if (audioManager) {
                audioManager.playNavigation();
            }
            return;
        }

        // Handle F8 for audio toggle
        if (event.key === 'F8') {
            event.preventDefault();
            toggleAudio();
        }

        // [ and ] lower/raise volume (not while typing in an input)
        if ((event.key === '[' || event.key === ']') && audioManager &&
            !/^(INPUT|TEXTAREA)$/.test(event.target.tagName)) {
            audioManager.adjustVolume(event.key === ']' ? 0.05 : -0.05);
        }
    });
}

function toggleAudio() {
    if (audioManager) {
        const isMuted = audioManager.toggleMute();
        console.log(`Audio ${isMuted ? 'muted' : 'unmuted'}`);
    } else {
        console.warn('Audio manager not available');
    }
}

function handleRouteChange(event) {
    const { newRoute, previousRoute } = event.detail;
    console.log(`Route changed from ${previousRoute} to ${newRoute}`);

    // Update system status or perform route-specific actions
    updateSystemStatus(newRoute);
}

function updateSystemStatus(currentRoute) {
    // Update the main status indicator based on current screen
    const statusElement = document.getElementById('main-status');
    if (statusElement) {
        statusElement.textContent = 'OPERATIONAL';
        statusElement.className = 'status-ok';
    }
}