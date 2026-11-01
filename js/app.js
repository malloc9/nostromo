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

// What is kept in the browser. The simulation and the command history are switched separately.
const PERSISTENCE = { simulation: true, history: true };
const SIMULATION_KEY = 'nostromo.simulation';
const HISTORY_KEY = 'nostromo.history';

function browserStorage() {
    return window.NostromoShipComputer.persistence.createStorage(() => window.localStorage);
}

// Messages about saves that could not be used. The first terminal to open shows them.
let startupNotices = [];

// The saved simulation, or null when there is none to use (the caller then starts a new one).
function openSimulation() {
    if (!PERSISTENCE.simulation) return null;
    const ns = window.NostromoShipComputer;
    const saved = ns.persistence.loadSaved(browserStorage().read(SIMULATION_KEY), {
        label: 'SAVED SIMULATION',
        outcome: 'INITIAL STATE RESTORED.',
        build: (payload) => ns.shipState.createShipStore({ restore: payload })
    });
    startupNotices = startupNotices.concat(saved.notices);
    return saved.value;
}

function saveSimulation() {
    const text = window.NostromoShipComputer.persistence.encodeSave(dataSimulator.store.exportState());
    browserStorage().write(SIMULATION_KEY, text);
}

function initializeDataSimulator() {
    if (typeof DataSimulator !== 'undefined') {
        const ns = window.NostromoShipComputer;
        const store = openSimulation() || ns.shipState.createShipStore();
        dataSimulator = new DataSimulator({ store });
        dataSimulator.store.subscribe(printScriptedEvent);
        if (PERSISTENCE.simulation) dataSimulator.store.subscribe(saveSimulation);
        // Opened now, so a damaged saved history is reported before any terminal opens.
        getMotherHistory();
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
    initMotherInterface();
    console.log('Console interface initialized');
}

// The MOTHER terminal. The Dashboard console binds itself when the Dashboard renders.
// The reset control. It is a button on this screen, never a terminal command, and it asks first.
let resetControl = null;

// A new session with a new identifier. The ship starts from its initial state, and the event log is cleared.
function performReset({ clearHistory }) {
    const ns = window.NostromoShipComputer;
    // A question still waiting for Y or N belongs to the old ship; it is dropped, not answered later.
    getMotherEngine().cancelPending();
    dataSimulator.store.reset();
    Object.keys(dataSimulator.history).forEach((key) => { dataSimulator.history[key] = []; });

    const session = getMotherSession();
    session.setId(ns.privilege.newSessionId());
    session.setLevel('COMMANDER');
    if (clearHistory) {
        getMotherHistory().clear();
        if (PERSISTENCE.history) {
            browserStorage().write(HISTORY_KEY, ns.persistence.encodeSave(getMotherHistory().entries()));
        }
    }
    updateSessionHeader();
    const out = document.getElementById('mother-output');
    if (out) ns.terminalView.renderBlocks(out, [{ type: 'text', text: `SIMULATION RESET. NEW SESSION: ${session.id}.` }]);
    drawResetControl();
}

// Shows the request button, or the confirmation with its history option, from the control's state.
function drawResetControl() {
    const asking = resetControl.state() === 'asking';
    const set = (id, fn) => { const el = document.getElementById(id); if (el) fn(el); };
    set('reset-request', (el) => { el.hidden = asking; });
    set('reset-confirm', (el) => { el.hidden = !asking; });
    set('reset-clear-history', (el) => { el.checked = resetControl.clearHistory(); });
}

function initResetControl() {
    resetControl = window.NostromoShipComputer.simulationReset.createResetControl(performReset);
    const on = (id, handler) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', handler);
    };
    on('reset-request', () => { resetControl.request(); drawResetControl(); });
    on('reset-confirm-yes', () => { resetControl.confirm(); drawResetControl(); });
    on('reset-confirm-no', () => { resetControl.decline(); drawResetControl(); });
    const history = document.getElementById('reset-clear-history');
    if (history) {
        history.addEventListener('change', () => { resetControl.setClearHistory(history.checked); drawResetControl(); });
    }
    drawResetControl();
}

function initMotherInterface() {
    const input = document.getElementById('mother-input');
    if (!input) return;
    updateSessionHeader();
    bindTerminal(input, document.getElementById('mother-output'), { suggestions: true });
    initResetControl();
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

// Every bound terminal output, so a scripted event can print to each of them.
const terminalOutputs = new Set();

// One binding for every terminal: the MOTHER screen and the Dashboard console share the engine,
// the history and these key rules. Only the input and output elements differ. Suggestions draw
// in the MOTHER screen's box, so only the MOTHER terminal turns them on.
function bindTerminal(input, out, options = {}) {
    if (!input || !out) return;
    terminalOutputs.add(out);
    deliverStartupNotices(out);
    const withSuggestions = options.suggestions === true;
    input.addEventListener('keydown', (e) => {
        // Suggestions first: arrows move the highlight, Enter takes it, Escape closes the list.
        if (withSuggestions && suggestionList.length && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            e.preventDefault();
            moveSuggestion(e.key === 'ArrowDown' ? 1 : -1);
            return;
        }
        if (withSuggestions && suggestionList.length && e.key === 'Enter' && suggestionIndex >= 0) {
            e.preventDefault();
            chooseSuggestion(suggestionIndex);
            return;
        }
        if (withSuggestions && suggestionList.length && e.key === 'Escape') {
            e.preventDefault();
            hideSuggestions();
            return;
        }
        // Tab completes only an unambiguous match, and never runs anything. Otherwise focus moves on as usual.
        if (withSuggestions && e.key === 'Tab' && completeInput()) {
            e.preventDefault();
            return;
        }
        if (e.key === 'Enter') {
            // A held key repeats keydown; only the first press runs the command.
            if (e.repeat) return;
            const cmd = input.value.trim();
            if (!cmd) return;
            // A Y or N answering a pending question is not a command, so it is not recorded.
            if (!getMotherEngine().pending()) recordHistory(cmd);
            runTerminalCommand(out, cmd);
            input.value = '';
            if (withSuggestions) hideSuggestions();
        } else if (e.key === 'Escape') {
            cancelTerminalPending(out);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            input.value = getMotherHistory().previous(input.value);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            input.value = getMotherHistory().next();
        } else if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) {
            e.preventDefault();
            clearTerminal(out);
        } else if (e.ctrlKey && (e.key === 'c' || e.key === 'C') && getMotherEngine().pending()) {
            // Ctrl+C cancels a running operation; the only one here is a pending question.
            e.preventDefault();
            cancelTerminalPending(out);
        }
        if (audioManager && e.key.length === 1) {
            audioManager.playKeypress();
        }
    });
    if (withSuggestions) input.addEventListener('input', renderSuggestions);
}

// What the Dashboard needs from the shared terminal: bind a console, and run a command into an output.
window.shipTerminal = {
    bind: bindTerminal,
    run: (cmd, out) => runTerminalCommand(out, cmd)
};

// Messages about unusable saves are shown once, in the first terminal that opens.
function deliverStartupNotices(out) {
    if (!startupNotices.length) return;
    window.NostromoShipComputer.terminalView.renderBlocks(out, startupNotices);
    startupNotices = [];
}

// A scripted event prints once to each terminal output, in warning style. Outputs that have left
// the page (a re-rendered Dashboard, for example) are dropped.
function printScriptedEvent(event) {
    if (!event.notice) return;
    const blocks = window.NostromoShipComputer.scriptedEvents.noticeBlocks(event.notice);
    terminalOutputs.forEach((out) => {
        if (!out.isConnected) {
            terminalOutputs.delete(out);
            return;
        }
        const wasAtBottom = isAtBottom(out);
        window.NostromoShipComputer.terminalView.renderBlocks(out, blocks);
        keepAtBottom(out, wasAtBottom);
    });
}

let motherEngine = null;
let motherSession = null;
let motherHistory = null;
let motherRegistry = null;
// The suggestion list under the input: what is offered, and which entry is highlighted (-1 for none).
let suggestionList = [];
let suggestionIndex = -1;

// The commands entered this session. The MOTHER terminal records and walks them.
function getMotherHistory() {
    if (!motherHistory) {
        motherHistory = openHistory();
    }
    return motherHistory;
}

// The saved command history, or a new one when there is nothing usable saved.
function openHistory() {
    const ns = window.NostromoShipComputer;
    const saved = PERSISTENCE.history
        ? ns.persistence.loadSaved(browserStorage().read(HISTORY_KEY), {
            label: 'SAVED COMMAND HISTORY',
            outcome: 'HISTORY CLEARED.',
            build: (entries) => ns.inputHistory.createInputHistory({ entries })
        })
        : { value: null, notices: [] };
    startupNotices = startupNotices.concat(saved.notices);
    return saved.value || ns.inputHistory.createInputHistory();
}

// Records a command and, when history is kept, saves it.
function recordHistory(cmd) {
    const history = getMotherHistory();
    history.add(cmd);
    if (PERSISTENCE.history) {
        browserStorage().write(HISTORY_KEY, window.NostromoShipComputer.persistence.encodeSave(history.entries()));
    }
}

// The terminal session. It starts at commander, and the header reads it from here.
function getMotherSession() {
    if (!motherSession) {
        motherSession = window.NostromoShipComputer.privilege.createSession();
    }
    return motherSession;
}

// The firmware label as the header shows it, which is built from VERSION. One source for both.
function headerFirmware() {
    const element = document.getElementById('mu-thur-version');
    return element ? element.textContent.trim() : 'UNKNOWN';
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
        motherRegistry = registry;
        ns.systemCommands.register(registry);
        ns.accessCommands.register(registry, session);
        ns.restrictedCommands.register(registry);
        if (dataSimulator) {
            ns.logCommands.register(registry, dataSimulator.store);
            ns.accessRequestCommands.register(registry, dataSimulator.store, session);
            ns.crewCommands.register(registry, dataSimulator.store, session);
            ns.lifeSupportCommands.register(registry, dataSimulator.store);
            ns.navigationCommands.register(registry, dataSimulator.store, session);
            ns.powerAllocationCommands.register(registry, dataSimulator.store, session);
            ns.shipCommands.register(registry, dataSimulator.store, { firmware: headerFirmware() });
            ns.missionCommands.register(registry, dataSimulator.store);
            ns.cargoCommands.register(registry, dataSimulator.store);
            ns.reportCommands.register(registry, dataSimulator.store, session);
            ns.inputCommands.register(registry, getMotherHistory());
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

// Suggestions: built from command metadata and the store, filtered by the one privilege decision.
function motherCandidates() {
    getMotherEngine(); // builds the registry the candidates come from, if it is not built yet
    const store = dataSimulator ? dataSimulator.store : null;
    return window.NostromoShipComputer.suggest.candidatesFor(motherRegistry, store);
}

function motherAuthorize(required) {
    return window.NostromoShipComputer.privilege.authorize(getMotherSession(), required);
}

function suggestionBox() {
    return document.getElementById('mother-suggestions');
}

function hideSuggestions() {
    suggestionList = [];
    suggestionIndex = -1;
    const box = suggestionBox();
    if (box) {
        box.hidden = true;
        box.textContent = '';
    }
}

// Each entry is a text node or an element with text content only, so store names cannot inject markup.
function renderSuggestions() {
    const input = document.getElementById('mother-input');
    if (!input || !input.value.trim()) return hideSuggestions();
    suggestionList = window.NostromoShipComputer.suggest.suggest(motherCandidates(), input.value, motherAuthorize);
    suggestionIndex = -1;
    const box = suggestionBox();
    if (!box || suggestionList.length === 0) return hideSuggestions();
    box.textContent = '';
    suggestionList.forEach((c, i) => {
        const row = document.createElement('div');
        row.className = 'mother-suggestion';
        row.dataset.index = String(i);
        const name = document.createElement('span');
        name.className = 'mother-suggestion-name';
        name.textContent = c.name;
        const desc = document.createElement('span');
        desc.className = 'mother-suggestion-desc';
        desc.textContent = c.description;
        row.appendChild(name);
        row.appendChild(desc);
        row.addEventListener('mousedown', (e) => {
            e.preventDefault();
            chooseSuggestion(i);
        });
        box.appendChild(row);
    });
    box.hidden = false;
}

function moveSuggestion(step) {
    const box = suggestionBox();
    const count = suggestionList.length;
    suggestionIndex = (suggestionIndex + step + count) % count;
    if (!box) return;
    Array.from(box.children).forEach((row, i) => row.classList.toggle('active', i === suggestionIndex));
}

// Puts the chosen suggestion in the input. It does not run; the user presses Enter again to run it.
function chooseSuggestion(index) {
    const input = document.getElementById('mother-input');
    if (!input || !suggestionList[index]) return;
    input.value = suggestionList[index].name;
    hideSuggestions();
    input.focus();
}

// Returns true only when a unique completion was applied, so Tab is taken only then.
function completeInput() {
    const input = document.getElementById('mother-input');
    if (!input) return false;
    const done = window.NostromoShipComputer.suggest.complete(motherCandidates(), input.value, motherAuthorize);
    if (!done.completed) return false;
    input.value = done.text;
    renderSuggestions();
    return true;
}

// Scrolling: new output follows the bottom only if the user was already there.
// Pixels of slack that still count as at the bottom, so sub-pixel rounding does not unpin the view.
const SCROLL_SLACK_PX = 8;

function isAtBottom(out) {
    return out.scrollHeight - out.scrollTop - out.clientHeight < SCROLL_SLACK_PX;
}

function keepAtBottom(out, wasAtBottom) {
    if (wasAtBottom) out.scrollTop = out.scrollHeight;
}

// Ctrl+L: clear the display. The stored history is not touched.
function clearTerminal(out) {
    out.innerHTML = '';
}

// Escape cancels a pending question, as if the user had answered N.
function cancelTerminalPending(out) {
    const result = getMotherEngine().cancelPending();
    if (!result) return;
    const wasAtBottom = isAtBottom(out);
    window.NostromoShipComputer.terminalView.renderBlocks(out, result.blocks);
    updateSessionHeader();
    keepAtBottom(out, wasAtBottom);
}

// Runs one line into an output: the echo, the engine's answer, and the related commands.
function runTerminalCommand(out, cmd) {
    if (cmd.toUpperCase() === 'CLS' || cmd.toUpperCase() === 'CLEAR') {
        clearTerminal(out);
        return;
    }

    const wasAtBottom = isAtBottom(out);
    const view = window.NostromoShipComputer.terminalView;
    view.echo(out, cmd);
    const result = getMotherEngine().execute(cmd);
    view.renderBlocks(out, result.blocks);
    // Informational results point to their related commands, from the command metadata.
    if (result.status === 'ok' && result.command) {
        view.renderBlocks(out, window.NostromoShipComputer.suggest.relatedBlocks(motherRegistry, result.command));
    }
    // A granted request changes the level; the header shows it straight away.
    updateSessionHeader();
    keepAtBottom(out, wasAtBottom);
}

function updateSystemTime() {
    const timeElement = document.getElementById('system-time');
    const store = dataSimulator ? dataSimulator.store : null;
    if (timeElement) {
        // Ship time comes from the store, so the header and the log agree on it
        const clockTime = store ? store.now() : Date.now();
        // Set futuristic date for the Nostromo mission
        timeElement.textContent = window.NostromoShipComputer.util.formatShipDateTime(clockTime);
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