// Nostromo Monitoring System - Main Application Controller
// Integrates router, data simulation, and terminal effects

// Global instances
let dataSimulator;
let router;
let dashboard;
let lifeSupport;
let engineering;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize core systems
    initializeDataSimulator();
    initializeRouter();
    initializeDashboard();
    initializeLifeSupport();
    initializeNavigationSystem();
    initializeEngineering();
    
    // Initialize UI components
    updateSystemTime();
    setInterval(updateSystemTime, 1000);
    
    // Add typing effect to boot messages
    initializeBootSequence();
    
    // Initialize navigation
    initializeNavigation();
    
    // Add keyboard support for navigation
    initializeKeyboardControls();
    
    // Listen for route changes
    window.addEventListener('routechange', handleRouteChange);
});

function initializeDataSimulator() {
    if (typeof DataSimulator !== 'undefined') {
        dataSimulator = new DataSimulator();
        console.log('Data simulator initialized');
    } else {
        console.warn('DataSimulator not available - ensure data-simulator.js is loaded');
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

function initializeBootSequence() {
    const bootMessages = document.querySelectorAll('.boot-line');
    const bootPrompt = document.querySelector('.boot-prompt');
    
    // Hide the prompt initially and ensure it's not visible
    if (bootPrompt) {
        bootPrompt.style.opacity = '0';
        bootPrompt.style.display = 'none';
    }
    
    bootMessages.forEach((message, index) => {
        message.style.opacity = '0';
        setTimeout(() => {
            // Hide all previous messages
            bootMessages.forEach((prevMessage, prevIndex) => {
                if (prevIndex < index) {
                    prevMessage.style.opacity = '0';
                }
            });
            // Show current message
            message.style.opacity = '1';
            message.classList.add('typing-text');
            
            // Show prompt after last message in the same spot
            if (index === bootMessages.length - 1) {
                setTimeout(() => {
                    // Hide the last message
                    message.style.opacity = '0';
                    // Show prompt in the same location
                    if (bootPrompt) {
                        bootPrompt.style.display = 'block';
                        bootPrompt.style.opacity = '1';
                    }
                }, 1500);
            }
        }, (index + 1) * 2000); // 2 seconds between messages
    });
}

function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-screen]');
    navItems.forEach(item => {
        item.addEventListener('click', function(event) {
            event.preventDefault();
            const screen = this.dataset.screen;
            if (screen && router) {
                router.goTo(screen);
            }
        });
    });
}

function initializeKeyboardControls() {
    document.addEventListener('keydown', function(event) {
        // Handle boot screen - any key to continue
        const bootScreen = document.getElementById('boot-screen');
        if (bootScreen && bootScreen.classList.contains('active')) {
            event.preventDefault();
            if (router) {
                router.completeBootSequence();
            }
            return;
        }
        
        // Handle F-key navigation through router
        if (router && router.handleHotkey(event.key)) {
            event.preventDefault();
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
    // This will be implemented in the audio task
    console.log('Audio toggle clicked - will be implemented in audio task');
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