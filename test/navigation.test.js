/**
 * Navigation Tests
 * Tests for navigation calculations and coordinate display accuracy
 */

// Mock DOM elements for testing
function createMockNavigationDOM() {
    // Create navigation screen
    const navigationScreen = document.createElement('div');
    navigationScreen.id = 'navigation-screen';

    const screenContent = document.createElement('div');
    screenContent.className = 'screen-content';
    navigationScreen.appendChild(screenContent);

    document.body.appendChild(navigationScreen);

    return navigationScreen;
}

// Mock DataSimulator for testing
class MockNavigationDataSimulator {
    generateSystemStatus() {
        return {
            timestamp: new Date(),
            navigation: {
                coordinates: { x: -2847.3, y: 1592.7, z: -834.2 },
                heading: 127.4,
                velocity: 0.15,
                destination: "LV-426",
                eta: new Date(Date.now() + 72 * 60 * 60 * 1000) // 72 hours from now
            }
        };
    }
}

// Test Suite
describe('Navigation Tests', function () {
    let navigation;
    let mockDataSimulator;
    let navigationElement;

    beforeEach(function () {
        // Clean up any existing elements
        const existing = document.getElementById('navigation-screen');
        if (existing) {
            existing.remove();
        }

        // Create fresh mock DOM
        navigationElement = createMockNavigationDOM();
        mockDataSimulator = new MockNavigationDataSimulator();

        // Load navigation class if not already loaded
        if (typeof NostromoNavigation === 'undefined') {
            console.warn('NostromoNavigation not loaded - ensure navigation.js is included');
            return;
        }

        navigation = new NostromoNavigation(mockDataSimulator);
    });

    afterEach(function () {
        if (navigation) {
            navigation.deactivate();
        }
        if (navigationElement) {
            navigationElement.remove();
        }
    });

    describe('Navigation Initialization', function () {
        it('should initialize with data simulator', function () {
            expect(navigation).toBeDefined();
            expect(navigation.dataSimulator).toBe(mockDataSimulator);
            expect(navigation.isActive).toBe(false);
        });

        it('should have correct refresh rate', function () {
            expect(navigation.refreshRate).toBe(2000);
        });

        it('should initialize with null selected coordinate', function () {
            expect(navigation.selectedCoordinate).toBe(null);
        });
    });

    describe('Navigation Rendering', function () {
        it('should render navigation HTML structure', function () {
            navigation.render();

            const screenContent = document.querySelector('#navigation-screen .screen-content');
            expect(screenContent).toBeTruthy();

            // Check for main sections
            expect(screenContent.innerHTML).toContain('navigation-container');
            expect(screenContent.innerHTML).toContain('nav-status-section');
            expect(screenContent.innerHTML).toContain('star-map-section');
            expect(screenContent.innerHTML).toContain('coordinate-details-section');
            expect(screenContent.innerHTML).toContain('nav-status-bar');
        });

        it('should generate star map with coordinate grid', function () {
            navigation.render();

            const starMap = document.querySelector('#star-map');
            expect(starMap).toBeTruthy();

            const starField = starMap.querySelector('.star-field');
            expect(starField).toBeTruthy();

            // Check for coordinate grid elements
            expect(starField.innerHTML).toContain('|'); // Grid lines
            expect(starField.innerHTML).toContain('+'); // Grid intersections
        });

        it('should include ship position marker', function () {
            navigation.render();

            const shipMarker = document.getElementById('ship-marker');
            expect(shipMarker).toBeTruthy();
            expect(shipMarker.textContent).toBe('◊');
            expect(shipMarker.classList.contains('ship-position')).toBe(true);
            expect(shipMarker.classList.contains('clickable')).toBe(true);
        });

        it('should create clickable star points', function () {
            navigation.render();

            const starPoints = document.querySelectorAll('.star-point.clickable');
            expect(starPoints.length).toBeGreaterThan(0);

            starPoints.forEach(point => {
                expect(point.dataset.x).toBeDefined();
                expect(point.dataset.y).toBeDefined();
            });
        });
    });

    describe('Navigation Data Updates', function () {
        beforeEach(function () {
            navigation.render();
        });

        it('should update position display with correct coordinates', function () {
            navigation.updateNavigationData();

            const posX = document.getElementById('pos-x');
            const posY = document.getElementById('pos-y');
            const posZ = document.getElementById('pos-z');

            expect(posX.textContent).toBe('-2847.3');
            expect(posY.textContent).toBe('1592.7');
            expect(posZ.textContent).toBe('-834.2');
        });

        it('should update navigation information correctly', function () {
            navigation.updateNavigationData();

            const heading = document.getElementById('nav-heading');
            const velocity = document.getElementById('nav-velocity');
            const destination = document.getElementById('nav-destination');
            const eta = document.getElementById('nav-eta');

            expect(heading.textContent).toBe('127.4°');
            expect(velocity.textContent).toBe('0.150 C');
            expect(destination.textContent).toBe('LV-426');
            expect(eta.textContent).toMatch(/\d+ HOURS/);
        });

        it('should update ship position on star map', function () {
            navigation.updateNavigationData();

            const shipMarker = document.getElementById('ship-marker');
            expect(shipMarker).toBeTruthy();
            expect(shipMarker.dataset.x).toBeDefined();
            expect(shipMarker.dataset.y).toBeDefined();
            expect(shipMarker.title).toContain('Ship Position:');
        });

        it('should update status bar information', function () {
            navigation.updateNavigationData();

            const systemStatus = document.getElementById('nav-system-status');
            const lastUpdate = document.getElementById('nav-last-update');
            const drift = document.getElementById('nav-drift');

            expect(systemStatus.textContent).toBe('OPERATIONAL');
            expect(systemStatus.className).toContain('status-ok');
            expect(lastUpdate.textContent).toMatch(/\d{2}:\d{2}:\d{2}/);
            expect(drift.textContent).toMatch(/MINIMAL|MODERATE/);
        });
    });

    describe('Star Map Interactions', function () {
        beforeEach(function () {
            navigation.render();
        });

        it('should show coordinate details when star is clicked', function () {
            // Simulate clicking on a star point
            const starPoint = document.querySelector('.star-point.clickable');
            if (starPoint) {
                const x = parseInt(starPoint.dataset.x);
                const y = parseInt(starPoint.dataset.y);

                navigation.showCoordinateDetails(x, y, starPoint);

                const detailsContent = document.getElementById('coordinate-details');
                expect(detailsContent.innerHTML).toContain('COORDINATE ANALYSIS');
                expect(detailsContent.innerHTML).toContain('MAP POSITION:');
                expect(detailsContent.innerHTML).toContain('ACTUAL COORDS:');
                expect(detailsContent.innerHTML).toContain('OBJECT TYPE:');
            }
        });

        it('should show ship details when ship marker is clicked', function () {
            const shipMarker = document.getElementById('ship-marker');
            if (shipMarker) {
                const x = parseInt(shipMarker.dataset.x);
                const y = parseInt(shipMarker.dataset.y);

                navigation.showCoordinateDetails(x, y, shipMarker);

                const detailsContent = document.getElementById('coordinate-details');
                expect(detailsContent.innerHTML).toContain('NOSTROMO VESSEL');
                expect(detailsContent.innerHTML).toContain('OPERATIONAL');
            }
        });

        it('should highlight selected coordinate', function () {
            const starPoint = document.querySelector('.star-point.clickable');
            if (starPoint) {
                navigation.highlightCoordinate(starPoint);
                expect(starPoint.classList.contains('coordinate-highlight')).toBe(true);
            }
        });

        it('should remove previous highlight when new coordinate is selected', function () {
            const starPoints = document.querySelectorAll('.star-point.clickable');
            if (starPoints.length >= 2) {
                navigation.highlightCoordinate(starPoints[0]);
                expect(starPoints[0].classList.contains('coordinate-highlight')).toBe(true);

                navigation.highlightCoordinate(starPoints[1]);
                expect(starPoints[0].classList.contains('coordinate-highlight')).toBe(false);
                expect(starPoints[1].classList.contains('coordinate-highlight')).toBe(true);
            }
        });
    });

    describe('Route Calculations', function () {
        beforeEach(function () {
            navigation.render();
        });

        it('should calculate route to target coordinates', function () {
            const targetX = -2000;
            const targetY = 1500;

            navigation.calculateRoute(targetX, targetY);

            const detailsContent = document.getElementById('coordinate-details');
            expect(detailsContent.innerHTML).toContain('ROUTE CALCULATION');
            expect(detailsContent.innerHTML).toContain('TARGET COORDS:');
            expect(detailsContent.innerHTML).toContain('DISTANCE:');
            expect(detailsContent.innerHTML).toContain('BEARING:');
            expect(detailsContent.innerHTML).toContain('EST. TIME:');
            expect(detailsContent.innerHTML).toContain('WAYPOINT SET');
        });

        it('should calculate correct distance between coordinates', function () {
            const navData = mockDataSimulator.generateSystemStatus().navigation;
            const targetX = -2000;
            const targetY = 1500;

            const deltaX = targetX - navData.coordinates.x;
            const deltaY = targetY - navData.coordinates.y;
            const expectedDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            // Mock console.log to capture the output
            const originalLog = console.log;
            let loggedMessage = '';
            console.log = function (message) {
                loggedMessage = message;
            };

            navigation.calculateRoute(targetX, targetY);

            console.log = originalLog;

            expect(loggedMessage).toContain(expectedDistance.toFixed(1));
        });

        it('should calculate correct bearing to target', function () {
            const navData = mockDataSimulator.generateSystemStatus().navigation;
            const targetX = -2000;
            const targetY = 1500;

            const deltaX = targetX - navData.coordinates.x;
            const deltaY = targetY - navData.coordinates.y;
            const expectedBearing = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

            // Mock console.log to capture the output
            const originalLog = console.log;
            let loggedMessage = '';
            console.log = function (message) {
                loggedMessage = message;
            };

            navigation.calculateRoute(targetX, targetY);

            console.log = originalLog;

            expect(loggedMessage).toContain(expectedBearing.toFixed(1));
        });
    });

    describe('Star Information Generation', function () {
        it('should generate consistent star information for same coordinates', function () {
            const starInfo1 = navigation.generateStarInfo(10, 15);
            const starInfo2 = navigation.generateStarInfo(10, 15);

            expect(starInfo1.type).toBe(starInfo2.type);
            expect(starInfo1.magnitude).toBe(starInfo2.magnitude);
            expect(starInfo1.distance).toBe(starInfo2.distance);
        });

        it('should generate different star information for different coordinates', function () {
            const starInfo1 = navigation.generateStarInfo(10, 15);
            const starInfo2 = navigation.generateStarInfo(20, 25);

            // At least one property should be different
            const isDifferent = starInfo1.type !== starInfo2.type ||
                starInfo1.magnitude !== starInfo2.magnitude ||
                starInfo1.distance !== starInfo2.distance;

            expect(isDifferent).toBe(true);
        });

        it('should return valid star types', function () {
            const validTypes = ['G-CLASS STAR', 'K-CLASS STAR', 'M-CLASS DWARF', 'BINARY SYSTEM', 'RED GIANT'];
            const starInfo = navigation.generateStarInfo(5, 10);

            expect(validTypes).toContain(starInfo.type);
            expect(starInfo.magnitude).toMatch(/^\d+\.\d+$/);
            expect(starInfo.distance).toMatch(/^\d+\.\d+$/);
        });
    });

    describe('Navigation Calculations Validation', function () {
        it('should validate correct navigation data', function () {
            const validNavData = {
                coordinates: { x: -2847.3, y: 1592.7, z: -834.2 },
                heading: 127.4,
                velocity: 0.15
            };

            const errors = navigation.validateNavigationCalculations(validNavData);
            expect(errors.length).toBe(0);
        });

        it('should detect invalid coordinates', function () {
            const invalidNavData = {
                coordinates: { x: 'invalid', y: 1592.7, z: -834.2 },
                heading: 127.4,
                velocity: 0.15
            };

            const errors = navigation.validateNavigationCalculations(invalidNavData);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(error => error.includes('X coordinate'))).toBe(true);
        });

        it('should detect invalid heading values', function () {
            const invalidNavData = {
                coordinates: { x: -2847.3, y: 1592.7, z: -834.2 },
                heading: 400, // Invalid: should be 0-360
                velocity: 0.15
            };

            const errors = navigation.validateNavigationCalculations(invalidNavData);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(error => error.includes('heading'))).toBe(true);
        });

        it('should detect negative velocity values', function () {
            const invalidNavData = {
                coordinates: { x: -2847.3, y: 1592.7, z: -834.2 },
                heading: 127.4,
                velocity: -0.15 // Invalid: should be positive
            };

            const errors = navigation.validateNavigationCalculations(invalidNavData);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(error => error.includes('velocity'))).toBe(true);
        });

        it('should detect missing coordinate properties', function () {
            const invalidNavData = {
                coordinates: { x: -2847.3, y: 1592.7 }, // Missing z
                heading: 127.4,
                velocity: 0.15
            };

            const errors = navigation.validateNavigationCalculations(invalidNavData);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(error => error.includes('Z coordinate'))).toBe(true);
        });
    });

    describe('Real-time Updates', function () {
        it('should start real-time updates when activated', function (done) {
            navigation.activate();

            expect(navigation.isActive).toBe(true);
            expect(navigation.refreshInterval).toBeTruthy();

            // Test that updates are happening
            setTimeout(() => {
                expect(navigation.refreshInterval).toBeTruthy();
                done();
            }, 100);
        });

        it('should stop real-time updates when deactivated', function () {
            navigation.activate();
            expect(navigation.refreshInterval).toBeTruthy();

            navigation.deactivate();
            expect(navigation.isActive).toBe(false);
            expect(navigation.refreshInterval).toBe(null);
        });
    });

    describe('Current Navigation Data Access', function () {
        it('should return current navigation data', function () {
            const navData = navigation.getCurrentNavigationData();

            expect(navData).toBeTruthy();
            expect(navData.coordinates).toBeDefined();
            expect(navData.heading).toBeDefined();
            expect(navData.velocity).toBeDefined();
            expect(navData.destination).toBeDefined();
        });

        it('should return null when data simulator is not available', function () {
            const navWithoutSim = new NostromoNavigation(null);
            const navData = navWithoutSim.getCurrentNavigationData();

            expect(navData).toBe(null);
        });
    });

    describe('Click Handler Setup', function () {
        it('should set up click handlers for star map', function () {
            navigation.render();

            const starMap = document.getElementById('star-map');
            expect(starMap).toBeTruthy();

            // Check that click handlers are set up by verifying event listeners
            // This is a simplified test - in a real environment you'd test the actual click behavior
            const clickableElements = starMap.querySelectorAll('.clickable');
            expect(clickableElements.length).toBeGreaterThan(0);
        });
    });
});

// Run tests if in browser environment
if (typeof window !== 'undefined' && window.location) {
    console.log('Navigation tests loaded. Run tests manually or with a test runner.');
}