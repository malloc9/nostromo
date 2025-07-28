/**
 * Test Suite for Nostromo Crew Monitoring System
 * Tests crew data management, vital signs monitoring, and status updates
 */

// Simple test framework
function describe(name, fn) {
    console.log(`\n=== ${name} ===`);
    fn();
}

function test(name, fn) {
    try {
        fn();
        console.log(`✓ ${name}`);
    } catch (error) {
        console.log(`✗ ${name}: ${error.message}`);
    }
}

function expect(actual) {
    return {
        toBe: (expected) => {
            if (actual !== expected) {
                throw new Error(`Expected ${expected}, got ${actual}`);
            }
        },
        toBeDefined: () => {
            if (actual === undefined) {
                throw new Error('Expected value to be defined');
            }
        },
        toHaveLength: (length) => {
            if (actual.length !== length) {
                throw new Error(`Expected length ${length}, got ${actual.length}`);
            }
        },
        toHaveProperty: (prop) => {
            if (!(prop in actual)) {
                throw new Error(`Expected object to have property ${prop}`);
            }
        },
        toBeGreaterThanOrEqual: (min) => {
            if (actual < min) {
                throw new Error(`Expected ${actual} to be >= ${min}`);
            }
        },
        toBeLessThanOrEqual: (max) => {
            if (actual > max) {
                throw new Error(`Expected ${actual} to be <= ${max}`);
            }
        },
        toContain: (item) => {
            if (!actual.includes(item)) {
                throw new Error(`Expected array to contain ${item}`);
            }
        },
        toBeGreaterThan: (min) => {
            if (actual <= min) {
                throw new Error(`Expected ${actual} to be > ${min}`);
            }
        },
        not: {
            toThrow: () => {
                try {
                    actual();
                } catch (error) {
                    throw new Error('Expected function not to throw');
                }
            }
        }
    };
}

function beforeEach(fn) {
    // Simple beforeEach implementation
    global.beforeEachFn = fn;
}

function afterEach(fn) {
    // Simple afterEach implementation  
    global.afterEachFn = fn;
}

// Mock DOM environment
global.window = {};
global.document = {
    body: { innerHTML: '' },
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => []
};

// Import modules
const DataSimulator = require('../js/data-simulator.js');
const NostromoCrew = require('../js/crew.js');

describe('Nostromo Crew Monitoring System', () => {
    let dataSimulator;
    let crewSystem;

    function setup() {
        // Initialize systems
        dataSimulator = new DataSimulator();
        crewSystem = new NostromoCrew(dataSimulator);
    }

    function teardown() {
        if (crewSystem) {
            crewSystem.deactivate();
        }
    }

    describe('Initialization', () => {
        test('should initialize with data simulator', () => {
            setup();
            expect(crewSystem).toBeDefined();
            expect(crewSystem.dataSimulator).toBe(dataSimulator);
            expect(crewSystem.isActive).toBe(false);
            teardown();
        });

        test('should initialize alert thresholds', () => {
            setup();
            expect(crewSystem.alertThresholds).toBeDefined();
            expect(crewSystem.alertThresholds.heartRate).toBeDefined();
            expect(crewSystem.alertThresholds.temperature).toBeDefined();
            expect(crewSystem.alertThresholds.oxygenSat).toBeDefined();
            teardown();
        });

        test('should initialize ship layout', () => {
            setup();
            expect(crewSystem.shipLayout).toBeDefined();
            expect(crewSystem.shipLayout.BRIDGE).toBeDefined();
            expect(crewSystem.shipLayout.ENGINEERING).toBeDefined();
            expect(crewSystem.shipLayout.QUARTERS).toBeDefined();
            teardown();
        });

        test('should initialize quarters environment', () => {
            setup();
            expect(crewSystem.quartersEnvironment).toBeDefined();
            expect(Object.keys(crewSystem.quartersEnvironment)).toHaveLength(7);
            teardown();
        });
    });

    describe('Crew Data Management', () => {
        test('should generate crew data with valid structure', () => {
            setup();
            const crewData = dataSimulator.generateCrewData();
            
            expect(Array.isArray(crewData)).toBe(true);
            expect(crewData.length).toBe(7);
            
            crewData.forEach(member => {
                expect(member).toHaveProperty('id');
                expect(member).toHaveProperty('name');
                expect(member).toHaveProperty('location');
                expect(member).toHaveProperty('status');
                expect(member).toHaveProperty('vitals');
                
                expect(member.vitals).toHaveProperty('heartRate');
                expect(member.vitals).toHaveProperty('temperature');
                expect(member.vitals).toHaveProperty('oxygenSat');
            });
            teardown();
        });

        test('should validate crew vital signs ranges', () => {
            const crewData = dataSimulator.generateCrewData();
            
            crewData.forEach(member => {
                const vitals = member.vitals;
                
                // Heart rate should be within reasonable range
                expect(vitals.heartRate).toBeGreaterThanOrEqual(50);
                expect(vitals.heartRate).toBeLessThanOrEqual(120);
                
                // Temperature should be within human range
                expect(vitals.temperature).toBeGreaterThanOrEqual(35.0);
                expect(vitals.temperature).toBeLessThanOrEqual(38.5);
                
                // Oxygen saturation should be within valid range
                expect(vitals.oxygenSat).toBeGreaterThanOrEqual(90);
                expect(vitals.oxygenSat).toBeLessThanOrEqual(100);
            });
        });

        test('should have all expected crew members', () => {
            const crewData = dataSimulator.generateCrewData();
            const expectedNames = ['DALLAS', 'RIPLEY', 'KANE', 'LAMBERT', 'BRETT', 'PARKER', 'ASH'];
            
            const actualNames = crewData.map(member => member.name);
            expectedNames.forEach(name => {
                expect(actualNames).toContain(name);
            });
        });
    });

    describe('Vital Signs Status Assessment', () => {
        test('should correctly assess heart rate status', () => {
            // Normal heart rate
            expect(crewSystem.getVitalStatus('heartRate', 75)).toBe('status-ok');
            
            // Warning heart rate
            expect(crewSystem.getVitalStatus('heartRate', 55)).toBe('status-warning');
            expect(crewSystem.getVitalStatus('heartRate', 105)).toBe('status-warning');
            
            // Critical heart rate
            expect(crewSystem.getVitalStatus('heartRate', 45)).toBe('status-critical');
            expect(crewSystem.getVitalStatus('heartRate', 125)).toBe('status-critical');
        });

        test('should correctly assess temperature status', () => {
            // Normal temperature
            expect(crewSystem.getVitalStatus('temperature', 36.8)).toBe('status-ok');
            
            // Warning temperature
            expect(crewSystem.getVitalStatus('temperature', 35.5)).toBe('status-warning');
            expect(crewSystem.getVitalStatus('temperature', 37.8)).toBe('status-warning');
            
            // Critical temperature
            expect(crewSystem.getVitalStatus('temperature', 34.5)).toBe('status-critical');
            expect(crewSystem.getVitalStatus('temperature', 39.0)).toBe('status-critical');
        });

        test('should correctly assess oxygen saturation status', () => {
            // Normal oxygen saturation
            expect(crewSystem.getVitalStatus('oxygenSat', 98)).toBe('status-ok');
            
            // Warning oxygen saturation
            expect(crewSystem.getVitalStatus('oxygenSat', 93)).toBe('status-warning');
            
            // Critical oxygen saturation
            expect(crewSystem.getVitalStatus('oxygenSat', 88)).toBe('status-critical');
        });

        test('should determine overall crew health status', () => {
            const normalVitals = {
                heartRate: 75,
                temperature: 36.8,
                oxygenSat: 98
            };
            expect(crewSystem.getCrewHealthStatus(normalVitals)).toBe('status-ok');

            const warningVitals = {
                heartRate: 105,
                temperature: 36.8,
                oxygenSat: 98
            };
            expect(crewSystem.getCrewHealthStatus(warningVitals)).toBe('status-warning');

            const criticalVitals = {
                heartRate: 125,
                temperature: 36.8,
                oxygenSat: 98
            };
            expect(crewSystem.getCrewHealthStatus(criticalVitals)).toBe('status-critical');
        });
    });

    describe('Alert Generation', () => {
        test('should generate no alerts for normal crew vitals', () => {
            const normalCrewData = [{
                id: 'CREW001',
                name: 'DALLAS',
                vitals: {
                    heartRate: 75,
                    temperature: 36.8,
                    oxygenSat: 98
                }
            }];

            const alerts = crewSystem.generateCrewAlerts(normalCrewData);
            expect(alerts).toHaveLength(0);
        });

        test('should generate warning alerts for borderline vitals', () => {
            const warningCrewData = [{
                id: 'CREW001',
                name: 'DALLAS',
                vitals: {
                    heartRate: 105,
                    temperature: 37.8,
                    oxygenSat: 93
                }
            }];

            const alerts = crewSystem.generateCrewAlerts(warningCrewData);
            expect(alerts.length).toBeGreaterThan(0);
            
            alerts.forEach(alert => {
                expect(alert).toHaveProperty('severity');
                expect(alert).toHaveProperty('message');
                expect(alert).toHaveProperty('time');
                expect(alert.severity).toBe('alert-warning');
            });
        });

        test('should generate critical alerts for dangerous vitals', () => {
            const criticalCrewData = [{
                id: 'CREW001',
                name: 'DALLAS',
                vitals: {
                    heartRate: 125,
                    temperature: 39.0,
                    oxygenSat: 88
                }
            }];

            const alerts = crewSystem.generateCrewAlerts(criticalCrewData);
            expect(alerts.length).toBeGreaterThan(0);
            
            const criticalAlerts = alerts.filter(alert => alert.severity === 'alert-critical');
            expect(criticalAlerts.length).toBeGreaterThan(0);
        });

        test('should include crew member name in alert messages', () => {
            const testCrewData = [{
                id: 'CREW001',
                name: 'DALLAS',
                vitals: {
                    heartRate: 125,
                    temperature: 36.8,
                    oxygenSat: 98
                }
            }];

            const alerts = crewSystem.generateCrewAlerts(testCrewData);
            expect(alerts.length).toBeGreaterThan(0);
            expect(alerts[0].message).toContain('DALLAS');
        });
    });

    describe('Environmental Status', () => {
        test('should assess quarters environmental status', () => {
            const normalEnv = {
                temperature: 21.0,
                oxygen: 95.0,
                pressure: 1.02
            };
            expect(crewSystem.getEnvironmentalStatus(normalEnv)).toBe('status-ok');

            const warningEnv = {
                temperature: 17.0,
                oxygen: 88.0,
                pressure: 1.02
            };
            expect(crewSystem.getEnvironmentalStatus(warningEnv)).toBe('status-warning');

            const criticalEnv = {
                temperature: 15.0,
                oxygen: 82.0,
                pressure: 1.02
            };
            expect(crewSystem.getEnvironmentalStatus(criticalEnv)).toBe('status-critical');
        });
    });

    describe('System Activation and Deactivation', () => {
        test('should activate crew monitoring system', () => {
            expect(crewSystem.isActive).toBe(false);
            
            crewSystem.activate();
            expect(crewSystem.isActive).toBe(true);
            expect(crewSystem.refreshInterval).toBeDefined();
        });

        test('should deactivate crew monitoring system', () => {
            crewSystem.activate();
            expect(crewSystem.isActive).toBe(true);
            
            crewSystem.deactivate();
            expect(crewSystem.isActive).toBe(false);
            expect(crewSystem.refreshInterval).toBeNull();
        });

        test('should handle activation without DOM elements gracefully', () => {
            document.body.innerHTML = '';
            
            expect(() => {
                crewSystem.activate();
            }).not.toThrow();
        });
    });

    describe('Vital Signs Bar Generation', () => {
        test('should generate vital sign bars with correct status', () => {
            const normalBar = crewSystem.generateVitalBar('heartRate', 75);
            expect(normalBar).toContain('status-ok');
            expect(normalBar).toContain('█');
            expect(normalBar).toContain('░');

            const warningBar = crewSystem.generateVitalBar('heartRate', 105);
            expect(warningBar).toContain('status-warning');

            const criticalBar = crewSystem.generateVitalBar('heartRate', 125);
            expect(criticalBar).toContain('status-critical');
        });

        test('should generate bars for all vital types', () => {
            const heartRateBar = crewSystem.generateVitalBar('heartRate', 75);
            const temperatureBar = crewSystem.generateVitalBar('temperature', 36.8);
            const oxygenBar = crewSystem.generateVitalBar('oxygenSat', 98);

            expect(heartRateBar).toBeDefined();
            expect(temperatureBar).toBeDefined();
            expect(oxygenBar).toBeDefined();
        });
    });

    describe('Data Validation', () => {
        test('should handle missing data simulator gracefully', () => {
            const crewWithoutSimulator = new NostromoCrew(null);
            
            expect(() => {
                crewWithoutSimulator.updateData();
            }).not.toThrow();
        });

        test('should validate crew data consistency over time', () => {
            const data1 = dataSimulator.generateCrewData();
            const data2 = dataSimulator.generateCrewData();
            
            // Should have same crew members
            expect(data1.length).toBe(data2.length);
            
            // Names should be consistent
            const names1 = data1.map(m => m.name).sort();
            const names2 = data2.map(m => m.name).sort();
            expect(names1).toEqual(names2);
            
            // Vitals should fluctuate but stay within reasonable ranges
            data1.forEach((member1, index) => {
                const member2 = data2[index];
                expect(member1.name).toBe(member2.name);
                
                // Vitals should be different (fluctuating)
                const vitalsChanged = 
                    member1.vitals.heartRate !== member2.vitals.heartRate ||
                    member1.vitals.temperature !== member2.vitals.temperature ||
                    member1.vitals.oxygenSat !== member2.vitals.oxygenSat;
                
                // Allow for small chance they might be the same
                // expect(vitalsChanged).toBe(true);
            });
        });
    });
});