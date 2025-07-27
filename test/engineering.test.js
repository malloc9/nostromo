/**
 * Engineering System Tests
 * Tests for power calculations, distribution logic, and data validation
 */

// Mock DataSimulator for testing
class MockDataSimulator {
    generateSystemStatus() {
        return {
            power: {
                generation: 85.5,
                consumption: 72.3,
                efficiency: 88.2,
                fuel: 67.8,
                netPower: 13.2
            }
        };
    }
}

// Test suite for NostromoEngineering
describe('NostromoEngineering', () => {
    let engineering;
    let mockDataSimulator;

    beforeEach(() => {
        // Create mock data simulator
        mockDataSimulator = new MockDataSimulator();
        
        // Create engineering instance
        if (typeof NostromoEngineering !== 'undefined') {
            engineering = new NostromoEngineering(mockDataSimulator);
        }
    });

    describe('Initialization', () => {
        test('should initialize with correct power systems', () => {
            expect(engineering).toBeDefined();
            expect(engineering.powerSystems).toBeDefined();
            expect(engineering.powerSystems.length).toBe(7);
            
            // Check that all critical systems are present
            const systemNames = engineering.powerSystems.map(s => s.id);
            expect(systemNames).toContain('LIFE_SUPPORT');
            expect(systemNames).toContain('NAVIGATION');
            expect(systemNames).toContain('PROPULSION');
            expect(systemNames).toContain('ARTIFICIAL_GRAVITY');
        });

        test('should initialize with correct alert thresholds', () => {
            expect(engineering.alertThresholds).toBeDefined();
            expect(engineering.alertThresholds.generation).toBeDefined();
            expect(engineering.alertThresholds.consumption).toBeDefined();
            expect(engineering.alertThresholds.efficiency).toBeDefined();
            expect(engineering.alertThresholds.fuel).toBeDefined();
        });

        test('should start inactive', () => {
            expect(engineering.isActive).toBe(false);
            expect(engineering.refreshInterval).toBeNull();
        });
    });

    describe('Power Calculations', () => {
        test('should calculate system consumption correctly', () => {
            const testSystem = {
                id: 'LIFE_SUPPORT',
                baseConsumption: 25
            };
            
            const powerData = {
                consumption: 72
            };
            
            const consumption = engineering.calculateSystemConsumption(testSystem, powerData);
            
            expect(consumption).toBeGreaterThan(0);
            expect(consumption).toBeLessThan(50); // Reasonable upper bound
            expect(typeof consumption).toBe('number');
        });

        test('should validate power data correctly', () => {
            const validPowerData = {
                generation: 85.5,
                consumption: 72.3,
                efficiency: 88.2,
                fuel: 67.8,
                netPower: 13.2
            };
            
            const errors = engineering.validatePowerCalculations(validPowerData);
            expect(errors).toEqual([]);
        });

        test('should detect invalid power data', () => {
            const invalidPowerData = {
                generation: -10, // Invalid: negative
                consumption: 150, // Invalid: over 100
                efficiency: 88.2,
                fuel: 67.8
            };
            
            const errors = engineering.validatePowerCalculations(invalidPowerData);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.includes('generation'))).toBe(true);
            expect(errors.some(e => e.includes('consumption'))).toBe(true);
        });

        test('should calculate net power alerts correctly', () => {
            const powerData = {
                generation: 50, // Low generation
                consumption: 95, // High consumption
                efficiency: 60, // Low efficiency
                fuel: 15 // Low fuel
            };
            
            const alertCount = engineering.calculatePowerAlerts(powerData);
            expect(alertCount).toBeGreaterThan(0);
            expect(typeof alertCount).toBe('number');
        });
    });

    describe('Power Status Determination', () => {
        test('should correctly determine power metric status', () => {
            // Test generation status
            expect(engineering.getPowerMetricStatus('generation', 90)).toBe('status-ok');
            expect(engineering.getPowerMetricStatus('generation', 65)).toBe('status-warning');
            expect(engineering.getPowerMetricStatus('generation', 40)).toBe('status-critical');
            
            // Test consumption status
            expect(engineering.getPowerMetricStatus('consumption', 70)).toBe('status-ok');
            expect(engineering.getPowerMetricStatus('consumption', 90)).toBe('status-warning');
            expect(engineering.getPowerMetricStatus('consumption', 98)).toBe('status-critical');
        });

        test('should correctly determine system power status', () => {
            expect(engineering.getSystemPowerStatus(15)).toBe('status-ok');
            expect(engineering.getSystemPowerStatus(22)).toBe('status-warning');
            expect(engineering.getSystemPowerStatus(28)).toBe('status-critical');
        });
    });

    describe('ASCII Bar Generation', () => {
        test('should generate ASCII bars with correct length', () => {
            const bar = engineering.generateASCIIBar(50, 'status-ok');
            
            expect(bar).toContain('ascii-bar');
            expect(bar).toContain('status-ok');
            expect(bar).toContain('50.0%');
            expect(bar).toContain('bar-filled');
            expect(bar).toContain('bar-empty');
        });

        test('should handle edge cases for ASCII bars', () => {
            // Test 0%
            const zeroBar = engineering.generateASCIIBar(0, 'status-critical');
            expect(zeroBar).toContain('0.0%');
            
            // Test 100%
            const fullBar = engineering.generateASCIIBar(100, 'status-ok');
            expect(fullBar).toContain('100.0%');
        });
    });

    describe('Data Validation', () => {
        test('should validate realistic power system data', () => {
            const powerData = mockDataSimulator.generateSystemStatus().power;
            const errors = engineering.validatePowerCalculations(powerData);
            
            expect(errors).toEqual([]);
        });

        test('should detect data inconsistencies', () => {
            const inconsistentData = {
                generation: 85.5,
                consumption: 72.3,
                efficiency: 88.2,
                fuel: 67.8,
                netPower: 50.0 // Inconsistent with generation - consumption
            };
            
            const errors = engineering.validatePowerCalculations(inconsistentData);
            expect(errors.some(e => e.includes('Net power calculation mismatch'))).toBe(true);
        });
    });

    describe('System Integration', () => {
        test('should handle missing data simulator gracefully', () => {
            const engineeringWithoutSim = new NostromoEngineering(null);
            
            expect(engineeringWithoutSim.getCurrentPowerData()).toBeNull();
            
            // Should not throw when updating data
            expect(() => {
                engineeringWithoutSim.updateData();
            }).not.toThrow();
        });

        test('should provide current power data', () => {
            const powerData = engineering.getCurrentPowerData();
            
            expect(powerData).toBeDefined();
            expect(powerData.generation).toBeDefined();
            expect(powerData.consumption).toBeDefined();
            expect(powerData.efficiency).toBeDefined();
            expect(powerData.fuel).toBeDefined();
        });
    });

    describe('Historical Data Management', () => {
        test('should store historical data correctly', () => {
            const initialLength = engineering.historicalData.length;
            
            const testData = {
                generation: 85,
                consumption: 70,
                efficiency: 88,
                fuel: 65
            };
            
            engineering.storeHistoricalData(testData);
            
            expect(engineering.historicalData.length).toBe(initialLength + 1);
            expect(engineering.historicalData[engineering.historicalData.length - 1]).toMatchObject(testData);
        });

        test('should limit historical data to max length', () => {
            // Fill beyond max length
            for (let i = 0; i < engineering.maxHistoryLength + 5; i++) {
                engineering.storeHistoricalData({
                    generation: 85,
                    consumption: 70,
                    efficiency: 88,
                    fuel: 65
                });
            }
            
            expect(engineering.historicalData.length).toBe(engineering.maxHistoryLength);
        });
    });

    describe('Activation and Deactivation', () => {
        test('should activate correctly', () => {
            // Mock DOM elements
            document.body.innerHTML = `
                <div id="engineering-screen">
                    <div class="screen-content"></div>
                </div>
            `;
            
            engineering.activate();
            
            expect(engineering.isActive).toBe(true);
            expect(engineering.refreshInterval).not.toBeNull();
        });

        test('should deactivate correctly', () => {
            engineering.activate();
            engineering.deactivate();
            
            expect(engineering.isActive).toBe(false);
            expect(engineering.refreshInterval).toBeNull();
        });
    });
});

// Test runner for browser environment
if (typeof window !== 'undefined' && !window.runTests) {
    window.runTests = function() {
        console.log('Running Engineering System Tests...');
        
        // Simple test runner for browser
        const tests = [
            () => {
                console.log('✓ Engineering system initializes correctly');
                const mockSim = new MockDataSimulator();
                const eng = new NostromoEngineering(mockSim);
                console.assert(eng.powerSystems.length === 7, 'Power systems count');
                console.assert(eng.isActive === false, 'Initial state');
            },
            
            () => {
                console.log('✓ Power calculations work correctly');
                const mockSim = new MockDataSimulator();
                const eng = new NostromoEngineering(mockSim);
                const powerData = mockSim.generateSystemStatus().power;
                const errors = eng.validatePowerCalculations(powerData);
                console.assert(errors.length === 0, 'Power data validation');
            },
            
            () => {
                console.log('✓ Status determination works correctly');
                const mockSim = new MockDataSimulator();
                const eng = new NostromoEngineering(mockSim);
                console.assert(eng.getPowerMetricStatus('generation', 90) === 'status-ok', 'Generation status OK');
                console.assert(eng.getPowerMetricStatus('generation', 40) === 'status-critical', 'Generation status critical');
            }
        ];
        
        tests.forEach((test, index) => {
            try {
                test();
            } catch (error) {
                console.error(`✗ Test ${index + 1} failed:`, error);
            }
        });
        
        console.log('Engineering System Tests Complete');
    };
}