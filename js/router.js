// Nostromo Monitoring System - Router Module
// Hash-based routing system for GitHub Pages compatibility

class NostromoRouter {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.defaultRoute = 'dashboard';
        this.transitionDuration = 300; // milliseconds
        this.isTransitioning = false;
        
        // Initialize router
        this.init();
    }

    init() {
        // Set up event listeners
        window.addEventListener('hashchange', () => this.handleHashChange());
        window.addEventListener('load', () => this.handleInitialLoad());
        
        // Register default routes
        this.registerDefaultRoutes();
        
        console.log('Nostromo Router initialized');
    }

    registerDefaultRoutes() {
        // Register all ship system screens
        this.addRoute('dashboard', {
            element: 'dashboard-screen',
            title: 'SHIP STATUS OVERVIEW',
            breadcrumb: 'MAIN > DASHBOARD',
            hotkey: 'F1',
            onEnter: () => {
                if (window.dashboard) {
                    window.dashboard.activate();
                }
            },
            onExit: () => {
                if (window.dashboard) {
                    window.dashboard.deactivate();
                }
            }
        });

        this.addRoute('life-support', {
            element: 'life-support-screen',
            title: 'LIFE SUPPORT MONITORING',
            breadcrumb: 'MAIN > LIFE SUPPORT',
            hotkey: 'F2',
            onEnter: () => {
                if (window.lifeSupport) {
                    window.lifeSupport.activate();
                }
            },
            onExit: () => {
                if (window.lifeSupport) {
                    window.lifeSupport.deactivate();
                }
            }
        });

        this.addRoute('navigation', {
            element: 'navigation-screen',
            title: 'NAVIGATION & POSITIONING',
            breadcrumb: 'MAIN > NAVIGATION',
            hotkey: 'F3'
        });

        this.addRoute('engineering', {
            element: 'engineering-screen',
            title: 'ENGINEERING & POWER',
            breadcrumb: 'MAIN > ENGINEERING',
            hotkey: 'F4'
        });

        this.addRoute('crew', {
            element: 'crew-screen',
            title: 'CREW MONITORING',
            breadcrumb: 'MAIN > CREW',
            hotkey: 'F5'
        });
    }

    addRoute(path, config) {
        this.routes.set(path, {
            path,
            element: config.element,
            title: config.title || path.toUpperCase(),
            breadcrumb: config.breadcrumb || `MAIN > ${path.toUpperCase()}`,
            hotkey: config.hotkey || null,
            onEnter: config.onEnter || null,
            onExit: config.onExit || null
        });
    }

    getCurrentHash() {
        return window.location.hash.slice(1) || this.defaultRoute;
    }

    setHash(path) {
        if (path !== this.getCurrentHash()) {
            window.location.hash = path;
        }
    }

    handleInitialLoad() {
        const hash = this.getCurrentHash();
        
        // If we're on boot screen, don't navigate yet
        const bootScreen = document.getElementById('boot-screen');
        if (bootScreen && bootScreen.classList.contains('active')) {
            return;
        }
        
        this.navigateTo(hash, false);
    }

    handleHashChange() {
        const newRoute = this.getCurrentHash();
        this.navigateTo(newRoute, true);
    }

    async navigateTo(path, animate = true) {
        // Prevent navigation during transitions
        if (this.isTransitioning) {
            return false;
        }

        // Check if route exists
        if (!this.routes.has(path)) {
            console.warn(`Route '${path}' not found, redirecting to default`);
            this.setHash(this.defaultRoute);
            return false;
        }

        const route = this.routes.get(path);
        const previousRoute = this.currentRoute;

        // Skip if already on this route
        if (this.currentRoute === path) {
            return true;
        }

        this.isTransitioning = true;

        try {
            // Call onExit for previous route
            if (previousRoute && this.routes.has(previousRoute)) {
                const prevRoute = this.routes.get(previousRoute);
                if (prevRoute.onExit) {
                    await prevRoute.onExit();
                }
            }

            // Perform screen transition
            if (animate) {
                await this.performTransition(route);
            } else {
                this.switchToScreen(route);
            }

            // Update current route
            this.currentRoute = path;

            // Update navigation state
            this.updateNavigation(path);

            // Call onEnter for new route
            if (route.onEnter) {
                await route.onEnter();
            }

            // Dispatch route change event
            this.dispatchRouteChangeEvent(path, previousRoute);

            console.log(`Navigated to: ${path}`);
            return true;

        } catch (error) {
            console.error('Navigation error:', error);
            return false;
        } finally {
            this.isTransitioning = false;
        }
    }

    async performTransition(route) {
        const currentScreen = document.querySelector('.screen.active');
        const targetScreen = document.getElementById(route.element);

        if (!targetScreen) {
            throw new Error(`Screen element '${route.element}' not found`);
        }

        // Add transition classes
        if (currentScreen) {
            currentScreen.classList.add('screen-exit');
        }
        targetScreen.classList.add('screen-enter');

        // Wait for fade out
        if (currentScreen) {
            await this.wait(this.transitionDuration / 2);
            currentScreen.classList.remove('active', 'screen-exit');
        }

        // Switch screens
        targetScreen.classList.add('active');

        // Wait for fade in
        await this.wait(this.transitionDuration / 2);
        targetScreen.classList.remove('screen-enter');
    }

    switchToScreen(route) {
        // Hide all screens
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.getElementById(route.element);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
    }

    updateNavigation(path) {
        // Update navigation bar active state
        const navItems = document.querySelectorAll('.nav-item[data-screen]');
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.screen === path) {
                item.classList.add('active');
            }
        });

        // Update page title if needed
        const route = this.routes.get(path);
        if (route && route.title) {
            document.title = `NOSTROMO - ${route.title}`;
        }
    }

    dispatchRouteChangeEvent(newRoute, previousRoute) {
        const event = new CustomEvent('routechange', {
            detail: {
                newRoute,
                previousRoute,
                timestamp: Date.now()
            }
        });
        window.dispatchEvent(event);
    }

    // Utility method for async delays
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Public API methods
    goTo(path) {
        this.setHash(path);
    }

    goBack() {
        window.history.back();
    }

    getCurrentRoute() {
        return this.currentRoute;
    }

    getRouteInfo(path) {
        return this.routes.get(path);
    }

    getAllRoutes() {
        return Array.from(this.routes.keys());
    }

    // Boot sequence completion handler
    completeBootSequence() {
        const bootScreen = document.getElementById('boot-screen');
        if (bootScreen && bootScreen.classList.contains('active')) {
            bootScreen.classList.remove('active');
            this.navigateTo(this.defaultRoute, true);
        }
    }

    // Hotkey navigation support
    handleHotkey(key) {
        for (const [path, route] of this.routes) {
            if (route.hotkey === key) {
                this.goTo(path);
                return true;
            }
        }
        return false;
    }
}

// Export for use in other modules
window.NostromoRouter = NostromoRouter;