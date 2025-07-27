/**
 * Dashboard Tests
 * Tests for dashboard data integration and display updates
 */

// Mock DOM elements for testing
function createMockDashboardDOM() {
    // Create dashboard screen
    const dashboardScreen = document.createElement('div');
    dashboardScreen.id = 'dashboard-screen';
    
    const screenContent = document.createElement('div');
    screenContent.className = 'screen-content';
    dashboardScreen.appendChild(screenContent);
    
    document.body.appendChild(dashboardScreen);
    
    return dashboardScreen;
}

// Mock DataSimulator for testing
class MockDataSimulator {
    generateSystemStatus() {
        return {
            timestamp: new Date(),
            power: {
                generation: 85.5,
                consumption: 72.3,
                efficiency: 88.2,
                fuel: 67.8,
                netPower: 13.2
            },
            lifeSupport: {
                oxygen: 95.2,
                co2: 12.1,
                pressure: 1.02,
                temperature: 21.5
            },
            navigation: {
                coordinates: { x: -2847.3, y: 1592.7, z: -834.2 },
                heading: 127.4,
                velocity: 0.15,
                destination: "LV-426",
                eta: new Date(Date.now() + 72 * 60 * 60 * 1000)
            },
            crew: [
                {
                    id: "CREW001",
                    name: "DALLAS",
                    location: "BRIDGE",
                    status: "active",
                    vitals: { heartRate: 72, temperature: 36.8, oxygenSat: 98 }
                },
                {
                    id: "CREW002",
                    name: "RIPLEY",
                    location: "ENGINEERING",
                    status: "active",
                    vitals: { heartRate: 68, temperature: 36.6, oxygenSat: 99 }
                },
                {
                    id: "CREW003",
                    name: "KANE",
                    location: "QUARTERS",
                    status: "resting",
                    vitals: { heartRate: 58, temperature: 36.4, oxygenSat: 97 }
                }
            ]
        };
    }
}

// Test Suite
describe('Dashboard Tests', function() {
    let dashboard;
    let mockDataSimulator;
    let dashboardElement;

    beforeEach(function() {
        // Clean up any existing elements
        const existing = document.getElementById('dashboard-screen');
        if (existing) {
            existing.remove();
        }
        
        // Create fresh mock DOM
        dashboardElement = createMockDashboardDOM();
        mockDataSimulator = new MockDataSimulator();
        
        // Load dashboard class if not already loaded
        if (typeof NostromoDashboard === 'undefined') {
            // In a real test environment, you would load the script
            console.warn('NostromoDashboard not loaded - ensure dashboard.js is included');
            return;
        }
        
        dashboard = new NostromoDashboard(mockDataSimulator);
    });

    afterEach(function() {
        if (dashboard) {
            dashboard.deactivate();
        }
        if (dashboardElement) {
            dashboardElement.remove();
        }
    });

    describe('Dashboard Initialization', function() {
        it('should initialize with data simulator', function() {
            expect(dashboard).toBeDefined();
            expect(dashboard.dataSimulator).toBe(mockDataSimulator);
            expect(dashboard.isActive).toBe(false);
        });

        it('should have correct refresh rate', function() {
            expect(dashboard.refreshRate).toBe(2500);
        });
    });

    describe('Dashboard Rendering', function() {
        it('should render dashboard HTML structure', function() {
            dashboard.render();
            
            const screenContent = document.querySelector('#dashboard-screen .screen-content');
            expect(screenContent).toBeTruthy();
            
            // Check for main sections
            expect(screenContent.innerHTML).toContain('dashboard-container');
            expect(screenContent.innerHTML).toContain('ship-schematic-section');
            expect(screenContent.innerHTML).toContain('status-grid');
            expect(screenContent.innerHTML).toContain('system-summary');
        });

        it('should generate ship schematic with system indicators', function() {
            dashboard.render();
            
            const schematic = document.querySelector('.ship-schematic');
            expect(schematic).toBeTruthy();
            
            // Check for system indicators
            expect(schematic.innerHTML).toContain('data-system="life-support"');
            expect(schematic.innerHTML).toContain('data-system="navigation"');
            expect(schematic.innerHTML).toContain('data-system="engineering"');
            expect(schematic.innerHTML).toContain('data-system="crew"');
        });

        it('should create all four status quadrants', function() {
            dashboard.render();
            
            const quadrants = document.querySelectorAll('.status-quadrant');
            expect(quadrants.length).toBe(4);
            
            // Check quadrant IDs
            expect(document.getElementById('power-quadrant')).toBeTruthy();
            expect(document.getElementById('life-support-quadrant')).toBeTruthy();
            expect(document.getElementById('navigation-quadrant')).toBeTruthy();
            expect(document.getElementById('crew-quadrant')).toBeTruthy();
        });
    });

    describe('Data Display Updates', function() {
        beforeEach(function() {
            dashboard.render();
        });

        it('should update power quadrant with correct data', function() {
            dashboard.updateData();
            
            const powerContent = document.getElementById('power-content');
            expect(powerContent).toBeTruthy();
            
            const content = powerContent.innerHTML;
            expect(content).toContain('GENERATION:');
            expect(content).toContain('85.5%');
            expect(content).toContain('CONSUMPTION:');
            expect(content).toContain('72.3%');
            expect(content).toContain('NET POWER:');
            expect(content).toContain('+13.2%');
        });

        it('should update life support quadrant with correct data', function() {
            dashboard.updateData();
            
            const lifeSupportContent = document.getElementById('life-support-content');
            expect(lifeSupportContent).toBeTruthy();
            
            const content = lifeSupportContent.innerHTML;
            expect(content).toContain('OXYGEN:');
            expect(content).toContain('95.2%');
            expect(content).toContain('CO2 LEVEL:');
            expect(content).toContain('12.1 PPM');
            expect(content).toContain('PRESSURE:');
            expect(content).toContain('1.02 ATM');
            expect(content).toContain('TEMPERATURE:');
            expect(content).toContain('21.5°C');
        });

        it('should update navigation quadrant with correct data', function() {
            dashboard.updateData();
            
            const navigationContent = document.getElementById('navigation-content');
            expect(navigationContent).toBeTruthy();
            
            const content = navigationContent.innerHTML;
            expect(content).toContain('POSITION:');
            expect(content).toContain('-2847.3, 1592.7');
            expect(content).toContain('HEADING:');
            expect(content).toContain('127.4°');
            expect(content).toContain('VELOCITY:');
            expect(content).toContain('0.150 C');
            expect(content).toContain('DESTINATION:');
            expect(content).toContain('LV-426');
        });

        it('should update crew quadrant with correct data', function() {
            dashboard.updateData();
            
            const crewContent = document.getElementById('crew-content');
            expect(crewContent).toBeTruthy();
            
            const content = crewContent.innerHTML;
            expect(content).toContain('TOTAL CREW:');
            expect(content).toContain('3');
            expect(content).toContain('ACTIVE:');
            expect(content).toContain('2');
            expect(content).toContain('RESTING:');
            expect(content).toContain('1');
        });

        it('should update system summary correctly', function() {
            dashboard.updateData();
            
            const overallStatus = document.getElementById('overall-status');
            const alertCount = document.getElementById('alert-count');
            const lastUpdate = document.getElementById('last-update');
            
            expect(overallStatus).toBeTruthy();
            expect(alertCount).toBeTruthy();
            expect(lastUpdate).toBeTruthy();
            
            expect(overallStatus.textContent).toBe('OPERATIONAL');
            expect(alertCount.textContent).toBe('0');
            expect(lastUpdate.textContent).toMatch(/\d{2}:\d{2}:\d{2}/);
        });
    });

    describe('Status Indicators', function() {
        beforeEach(function() {
            dashboard.render();
        });

        it('should show correct status colors for normal conditions', function() {
            dashboard.updateData();
            
            const powerStatus = document.getElementById('power-status');
            const lifeSupportStatus = document.getElementById('life-support-status');
            const navigationStatus = document.getElementById('navigation-status');
            const crewStatus = document.getElementById('crew-status');
            
            expect(powerStatus.className).toContain('status-ok');
            expect(lifeSupportStatus.className).toContain('status-ok');
            expect(navigationStatus.className).toContain('status-ok');
            expect(crewStatus.className).toContain('status-ok');
        });

        it('should update schematic indicators with correct status', function() {
            dashboard.updateData();
            
            const lsIndicator = document.getElementById('schematic-life-support');
            const powerIndicator = document.getElementById('schematic-power');
            const navIndicator = document.getElementById('schematic-navigation');
            const crewIndicator = document.getElementById('schematic-crew');
            
            expect(lsIndicator.className).toContain('status-ok');
            expect(powerIndicator.className).toContain('status-ok');
            expect(navIndicator.className).toContain('status-ok');
            expect(crewIndicator.className).toContain('status-ok');
        });
    });

    describe('Real-time Updates', function() {
        it('should start real-time updates when activated', function(done) {
            dashboard.activate();
            
            expect(dashboard.isActive).toBe(true);
            expect(dashboard.refreshInterval).toBeTruthy();
            
            // Test that updates are happening
            setTimeout(() => {
                expect(dashboard.refreshInterval).toBeTruthy();
                done();
            }, 100);
        });

        it('should stop real-time updates when deactivated', function() {
            dashboard.activate();
            expect(dashboard.refreshInterval).toBeTruthy();
            
            dashboard.deactivate();
            expect(dashboard.isActive).toBe(false);
            expect(dashboard.refreshInterval).toBe(null);
        });
    });

    describe('Click Handlers', function() {
        beforeEach(function() {
            dashboard.render();
            
            // Mock router
            window.router = {
                goTo: jasmine.createSpy('goTo')
            };
        });

        afterEach(function() {
            delete window.router;
        });

        it('should set up click handlers for schematic indicators', function() {
            const indicators = document.querySelectorAll('.system-indicator.clickable');
            expect(indicators.length).toBeGreaterThan(0);
            
            indicators.forEach(indicator => {
                expect(indicator.dataset.system).toBeTruthy();
            });
        });

        it('should navigate to correct system when indicator is clicked', function() {
            const lsIndicator = document.getElementById('schematic-life-support');
            expect(lsIndicator).toBeTruthy();
            
            // Simulate click
            lsIndicator.click();
            
            expect(window.router.goTo).toHaveBeenCalledWith('life-support');
        });
    });
});

// Run tests if in browser environment
if (typeof window !== 'undefined' && window.location) {
    console.log('Dashboard tests loaded. Run tests manually or with a test runner.');
}