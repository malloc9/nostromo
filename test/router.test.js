// Router Tests for Nostromo Monitoring System

// Mock DOM elements for testing
function createMockDOM() {
    // Create mock screens
    const screens = ['dashboard', 'life-support', 'navigation', 'engineering', 'crew'];
    screens.forEach(screen => {
        const element = document.createElement('div');
        element.id = `${screen}-screen`;
        element.className = 'screen';
        document.body.appendChild(element);
    });

    // Create mock navigation items
    const nav = document.createElement('nav');
    nav.className = 'nav-bar';
    screens.forEach(screen => {
        const navItem = document.createElement('span');
        navItem.className = 'nav-item';
        navItem.dataset.screen = screen;
        navItem.textContent = screen.toUpperCase();
        nav.appendChild(navItem);
    });
    document.body.appendChild(nav);

    // Create boot screen
    const bootScreen = document.createElement('div');
    bootScreen.id = 'boot-screen';
    bootScreen.className = 'screen active';
    document.body.appendChild(bootScreen);
}

// Test Suite
function runRouterTests() {
    console.log('Starting Router Tests...');
    
    // Setup
    createMockDOM();
    
    // Test 1: Router Initialization
    console.log('Test 1: Router Initialization');
    const router = new NostromoRouter();
    
    if (router && typeof router.navigateTo === 'function') {
        console.log('✓ Router initialized successfully');
    } else {
        console.error('✗ Router initialization failed');
        return;
    }

    // Test 2: Route Registration
    console.log('Test 2: Route Registration');
    const routes = router.getAllRoutes();
    const expectedRoutes = ['dashboard', 'life-support', 'navigation', 'engineering', 'crew'];
    
    if (routes.length === expectedRoutes.length && 
        expectedRoutes.every(route => routes.includes(route))) {
        console.log('✓ All routes registered correctly');
    } else {
        console.error('✗ Route registration failed', { expected: expectedRoutes, actual: routes });
    }

    // Test 3: Navigation
    console.log('Test 3: Navigation');
    router.navigateTo('dashboard', false).then(success => {
        if (success && router.getCurrentRoute() === 'dashboard') {
            console.log('✓ Navigation to dashboard successful');
            
            // Test screen visibility
            const dashboardScreen = document.getElementById('dashboard-screen');
            if (dashboardScreen && dashboardScreen.classList.contains('active')) {
                console.log('✓ Dashboard screen is active');
            } else {
                console.error('✗ Dashboard screen not active');
            }
        } else {
            console.error('✗ Navigation to dashboard failed');
        }
    });

    // Test 4: Hash-based routing
    console.log('Test 4: Hash-based routing');
    router.goTo('life-support');
    
    setTimeout(() => {
        if (window.location.hash === '#life-support') {
            console.log('✓ Hash updated correctly');
        } else {
            console.error('✗ Hash not updated', window.location.hash);
        }
    }, 100);

    // Test 5: Hotkey handling
    console.log('Test 5: Hotkey handling');
    const hotkeyResult = router.handleHotkey('F3');
    
    if (hotkeyResult) {
        console.log('✓ Hotkey handling works');
    } else {
        console.error('✗ Hotkey handling failed');
    }

    // Test 6: Invalid route handling
    console.log('Test 6: Invalid route handling');
    router.navigateTo('invalid-route', false).then(success => {
        if (!success) {
            console.log('✓ Invalid route handled correctly');
        } else {
            console.error('✗ Invalid route not handled');
        }
    });

    // Test 7: Boot sequence completion
    console.log('Test 7: Boot sequence completion');
    const bootScreen = document.getElementById('boot-screen');
    bootScreen.classList.add('active');
    
    router.completeBootSequence();
    
    setTimeout(() => {
        if (!bootScreen.classList.contains('active')) {
            console.log('✓ Boot sequence completed successfully');
        } else {
            console.error('✗ Boot sequence completion failed');
        }
    }, 100);

    console.log('Router Tests Completed');
}

// Run tests when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runRouterTests);
} else {
    runRouterTests();
}