/**
 * Unit tests for DataSimulator
 * Tests data generation functions to ensure realistic value ranges
 */

// Simple test framework for browser/node compatibility
class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    test(name, fn) {
        this.tests.push({ name, fn });
    }

    async run() {
        console.log('Running DataSimulator tests...\n');
        
        for (const test of this.tests) {
            try {
                await test.fn();
                console.log(`✓ ${test.name}`);
                this.passed++;
            } catch (error) {
                console.log(`✗ ${test.name}`);
                console.log(`  Error: ${error.message}`);
                this.failed++;
            }
        }
        
        console.log(`\nTest Results: ${this.passed} passed, ${this.failed} failed`);
        return this.failed === 0;
    }
}

// Load DataSimulator (works in both browser and Node.js)
let DataSimulator;
if (typeof require !== 'undefined') {
    DataSimulator = require('../js/data-simulator.js');
} else {
    DataSimulator = window.DataSimulator;
}

const runner = new TestRunner();

// Test helper functions
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertInRange(value, min, max, message) {
    assert(value >= min && value <= max, 
        message || `Value ${value} not in range [${min}, ${max}]`);
}

function assertIsNumber(value, message) {
    assert(typeof value === 'number' && !isNaN(value), 
        message || `Value ${value} is not a valid number`);
}

// Initialize simulator for tests
const simulator = new DataSimulator();

// Test data generation functions
runner.test('DataSimulator initializes correctly', () => {
    assert(simulator instanceof DataSimulator, 'Simulator should be instance of DataSimulator');
    assert(simulator.baseData, 'Base data should be initialized');
    assert(simulator.fluctuationRanges, 'Fluctuation ranges should be initialized');
    assert(simulator.crewMembers, 'Crew members should be initialized');
    assert(simulator.crewMembers.length === 7, 'Should have 7 crew members');
});

runner.test('Power data generation produces valid ranges', () => {
    const powerData = simulator.generatePowerData();
    
    assertIsNumber(powerData.generation, 'Generation should be a number');
    assertIsNumber(powerData.consumption, 'Consumption should be a number');
    assertIsNumber(powerData.efficiency, 'Efficiency should be a number');
    assertIsNumber(powerData.fuel, 'Fuel should be a number');
    
    assertInRange(powerData.generation, 0, 100, 'Generation should be 0-100%');
    assertInRange(powerData.consumption, 0, 100, 'Consumption should be 0-100%');
    assertInRange(powerData.efficiency, 0, 100, 'Efficiency should be 0-100%');
    assertInRange(powerData.fuel, 0, 100, 'Fuel should be 0-100%');
});

runner.test('Life support data generation produces valid ranges', () => {
    const lifeSupportData = simulator.generateLifeSupportData();
    
    assertIsNumber(lifeSupportData.oxygen, 'Oxygen should be a number');
    assertIsNumber(lifeSupportData.co2, 'CO2 should be a number');
    assertIsNumber(lifeSupportData.pressure, 'Pressure should be a number');
    assertIsNumber(lifeSupportData.temperature, 'Temperature should be a number');
    
    assertInRange(lifeSupportData.oxygen, 0, 100, 'Oxygen should be 0-100%');
    assertInRange(lifeSupportData.co2, 0, 50, 'CO2 should be 0-50%');
    assertInRange(lifeSupportData.pressure, 0.8, 1.2, 'Pressure should be 0.8-1.2 atm');
    assertInRange(lifeSupportData.temperature, 18, 24, 'Temperature should be 18-24°C');
});

runner.test('Navigation data generation produces valid ranges', () => {
    const navData = simulator.generateNavigationData();
    
    assertIsNumber(navData.coordinates.x, 'X coordinate should be a number');
    assertIsNumber(navData.coordinates.y, 'Y coordinate should be a number');
    assertIsNumber(navData.coordinates.z, 'Z coordinate should be a number');
    assertIsNumber(navData.heading, 'Heading should be a number');
    assertIsNumber(navData.velocity, 'Velocity should be a number');
    
    assertInRange(navData.heading, 0, 360, 'Heading should be 0-360 degrees');
    assert(navData.velocity >= 0, 'Velocity should be non-negative');
    assert(navData.destination === 'LV-426', 'Destination should be LV-426');
    assert(navData.eta instanceof Date, 'ETA should be a Date object');
});

runner.test('Crew data generation produces valid ranges', () => {
    const crewData = simulator.generateCrewData();
    
    assert(Array.isArray(crewData), 'Crew data should be an array');
    assert(crewData.length === 7, 'Should have 7 crew members');
    
    crewData.forEach((member, index) => {
        assert(typeof member.id === 'string', `Crew ${index} should have string ID`);
        assert(typeof member.name === 'string', `Crew ${index} should have string name`);
        assert(typeof member.location === 'string', `Crew ${index} should have string location`);
        assert(['active', 'resting', 'offline'].includes(member.status), 
            `Crew ${index} should have valid status`);
        
        assertIsNumber(member.vitals.heartRate, `Crew ${index} heart rate should be a number`);
        assertIsNumber(member.vitals.temperature, `Crew ${index} temperature should be a number`);
        assertIsNumber(member.vitals.oxygenSat, `Crew ${index} oxygen saturation should be a number`);
        
        assertInRange(member.vitals.heartRate, 50, 120, 
            `Crew ${index} heart rate should be 50-120 bpm`);
        assertInRange(member.vitals.temperature, 35.0, 38.5, 
            `Crew ${index} temperature should be 35.0-38.5°C`);
        assertInRange(member.vitals.oxygenSat, 90, 100, 
            `Crew ${index} oxygen saturation should be 90-100%`);
    });
});

runner.test('System status generation produces complete data', () => {
    const systemStatus = simulator.generateSystemStatus();
    
    assert(systemStatus.timestamp instanceof Date, 'Should have timestamp');
    assert(systemStatus.power, 'Should have power data');
    assert(systemStatus.lifeSupport, 'Should have life support data');
    assert(systemStatus.navigation, 'Should have navigation data');
    assert(systemStatus.crew, 'Should have crew data');
    
    // Validate the complete data structure
    const errors = simulator.validateData(systemStatus);
    assert(errors.length === 0, `Data validation failed: ${errors.join(', ')}`);
});

runner.test('Data fluctuates over time', async () => {
    const data1 = simulator.generatePowerData();
    
    // Wait a small amount of time
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const data2 = simulator.generatePowerData();
    
    // At least one value should be different (due to time-based fluctuations)
    const hasFluctuation = 
        data1.generation !== data2.generation ||
        data1.consumption !== data2.consumption ||
        data1.efficiency !== data2.efficiency;
    
    assert(hasFluctuation, 'Data should fluctuate over time');
});

runner.test('Data validation catches out-of-range values', () => {
    // Create invalid data to test validation
    const invalidData = {
        power: {
            generation: 150, // Invalid: > 100
            consumption: -10, // Invalid: < 0
            fuel: 50
        },
        lifeSupport: {
            oxygen: 95,
            co2: 12,
            pressure: 2.0, // Invalid: > 1.2
            temperature: 21
        },
        navigation: {
            coordinates: { x: 0, y: 0, z: 0 },
            heading: 180,
            velocity: 0.1
        },
        crew: [{
            vitals: {
                heartRate: 200, // Invalid: > 120
                temperature: 36.5,
                oxygenSat: 50 // Invalid: < 90
            }
        }]
    };
    
    const errors = simulator.validateData(invalidData);
    assert(errors.length > 0, 'Validation should catch invalid values');
    assert(errors.some(e => e.includes('Power generation')), 'Should catch invalid power generation');
    assert(errors.some(e => e.includes('Power consumption')), 'Should catch invalid power consumption');
    assert(errors.some(e => e.includes('Pressure')), 'Should catch invalid pressure');
    assert(errors.some(e => e.includes('heart rate')), 'Should catch invalid heart rate');
    assert(errors.some(e => e.includes('oxygen saturation')), 'Should catch invalid oxygen saturation');
});

runner.test('Fluctuation generation produces reasonable variations', () => {
    const baseValue = 50;
    const range = { min: -5, max: 5 };
    
    // Generate multiple fluctuations
    const fluctuations = [];
    for (let i = 0; i < 100; i++) {
        const value = simulator.generateFluctuation(baseValue, range, i * 100);
        fluctuations.push(value);
        assertInRange(value, baseValue + range.min, baseValue + range.max, 
            'Fluctuation should be within expected range');
    }
    
    // Check that we get some variation
    const min = Math.min(...fluctuations);
    const max = Math.max(...fluctuations);
    assert(max - min > 1, 'Should have reasonable variation in fluctuations');
});

// Run tests
if (typeof window !== 'undefined') {
    // Browser environment
    window.runDataSimulatorTests = () => runner.run();
} else {
    // Node.js environment
    runner.run().then(success => {
        process.exit(success ? 0 : 1);
    });
}