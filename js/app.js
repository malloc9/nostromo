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
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const cmd = input.value.trim();
            if (!cmd) return;
            handleMotherCommand(cmd.toUpperCase());
            input.value = '';
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

const MOTHER_RESPONSES = {
    'HELLO': 'INTERFACE 2037 READY FOR INQUIRY.',
    'HI': 'INTERFACE 2037 READY FOR INQUIRY.',
    'STATUS': 'ALL SYSTEMS NOMINAL. SHIP COURSE CORRECT.',
    'REPORT': 'STANDARD NAVIGATION PROTOCOLS IN EFFECT.',
    'WHO ARE YOU': 'I AM MU/TH/UR 6000. SHIP MAINFRAME.',
    'WHAT IS YOUR MISSION': 'COMMERCIAL TOWING VEHICLE NOSTROMO. CREW: 7. CARGO: REFINERY.',
    'HELP': 'AVAILABLE: STATUS, REPORT, CREW, MISSION, JONES, LOGS, OVERRIDE, DESTRUCT, SPECIAL ORDER 937',
    'SYSTEM': 'SYSTEM DIAGNOSTIC: OPERATIONAL. 2.1 TB MEMORY ALLOCATED.',
    'LOGS': 'ACCESS DENIED. RESTRICTED TO SCIENCE OFFICER.',
    'CREW': 'DALLAS, KANE, RIPLEY, ASH, LAMBERT, PARKER, BRETT. JONES THE CAT.',
    'JONES': 'SHIP CAT. VITAL SIGNS: NORMAL.',
    'CAT': 'SHIP CAT. VITAL SIGNS: NORMAL.',
    'ASH': 'SCIENCE OFFICER. ANDROID. DESIGNATION: AX-12.',
    'RIPLEY': 'WARRANT OFFICER ELLEN RIPLEY. NAVIGATION OFFICER.',
    'DALLAS': 'CAPTAIN DALLAS. SHIP COMMANDER.',
    'KANE': 'EXECUTIVE OFFICER. FIRST OFFICER.',
    'LAMBERT': 'NAVIGATION OFFICER.',
    'PARKER': 'CHIEF ENGINEER.',
    'BRETT': 'ENGINEERING TECHNICIAN.',
    'MISSION': 'RETURN REFINERY TO EARTH. CURRENT VECTOR: SOL SYSTEM.',
    'INTERFACE 2037': 'ACCESSING SECURE FILE... [SEE: SPECIAL ORDER 937]',
    'SPECIAL ORDER 937': 'PRIORITY ONE. INSURE RETURN OF ORGANISM FOR ANALYSIS. ALL OTHER CONSIDERATIONS SECONDARY. CREW EXPENDABLE.',
    'OVERRIDE': 'ACCESS DENIED. COMMAND AUTHORIZATION REQUIRED.',
    'DESTRUCT': 'WARNING: SELF-DESTRUCT SEQUENCE. MANUAL ACTIVATION REQUIRED AT EMERGENCY CONSOLE.'
};

function handleMotherCommand(cmd) {
    const out = document.getElementById('mother-output');
    if (!out) return;

    // echo user input
    const userLine = document.createElement('div');
    userLine.className = 'mother-input-line-echo';
    userLine.innerHTML = `<span class="mother-prompt">&gt;</span> <span class="mother-user-text">${cmd}</span>`;
    out.appendChild(userLine);

    // find response
    let response = MOTHER_RESPONSES[cmd];
    let klass = 'mother-response';
    if (!response) {
        if (cmd.startsWith('WHAT IS')) response = 'INSUFFICIENT DATA FOR MEANINGFUL ANSWER.';
        else if (cmd === 'CLS' || cmd === 'CLEAR') { out.innerHTML = ''; return; }
        else response = 'UNRECOGNIZED COMMAND. PLEASE RESTATE.';
    }
    if (cmd === 'DESTRUCT' || cmd === 'SPECIAL ORDER 937' || cmd === 'INTERFACE 2037') klass = 'mother-response urgent';
    if (cmd === 'OVERRIDE') klass = 'mother-response alert';

    const resp = document.createElement('div');
    resp.className = klass;
    resp.textContent = response;
    out.appendChild(resp);

    // add a blank spacer
    const sp = document.createElement('div');
    sp.innerHTML = '&nbsp;';
    out.appendChild(sp);

    out.scrollTop = out.scrollHeight;
}

function updateSystemTime() {
    const timeElement = document.getElementById('system-time');
    if (timeElement) {
        // Set futuristic date for the Nostromo mission
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const timeString = `2122-06-02 ${hours}:${minutes}:${seconds}`;
        timeElement.textContent = timeString;
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
            router.navigateTo('dashboard', false);
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
            if (bootSequence && bootSequence.bootComplete) {
                bootSequence.completeBootSequence();
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