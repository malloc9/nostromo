// Nostromo Monitoring System - Main Application Controller
// Integrates router, data simulation, and terminal effects

// Global instances
let dataSimulator;
let audioManager;
let router;
let dashboard;
let lifeSupport;
let engineering;
let crew;
let bootSequence;

document.addEventListener('DOMContentLoaded', function() {
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
        item.addEventListener('click', function(event) {
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
    document.addEventListener('keydown', function(event) {
        // Play keypress sound for most keys
        if (audioManager && event.key.length === 1) {
            audioManager.playKeypress();
        }
        
        // Handle boot screen - any key to continue
        const bootScreen = document.getElementById('boot-screen');
        if (bootScreen && bootScreen.classList.contains('active')) {
            event.preventDefault();
            if (bootSequence) {
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