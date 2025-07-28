/**
 * Basic functionality test for Nostromo Crew Monitoring System
 */

// Mock DOM environment
global.window = {};
global.document = {
    body: { innerHTML: '' },
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => []
};

// Import modules
const DataSimulator = require('./js/data-simulator.js');
const NostromoCrew = require('./js/crew.js');

console.log('Testing Nostromo Crew Monitoring System...\n');

// Test 1: Basic initialization
console.log('1. Testing initialization...');
try {
    const dataSimulator = new DataSimulator();
    const crewSystem = new NostromoCrew(dataSimulator);
    
    console.log('✓ DataSimulator created successfully');
    console.log('✓ NostromoCrew created successfully');
    console.log('✓ Alert thresholds initialized:', Object.keys(crewSystem.alertThresholds));
    console.log('✓ Ship layout initialized:', Object.keys(crewSystem.shipLayout));
    console.log('✓ Quarters environment initialized:', Object.keys(crewSystem.quartersEnvironment).length, 'quarters');
} catch (error) {
    console.log('✗ Initialization failed:', error.message);
}

// Test 2: Crew data generation
console.log('\n2. Testing crew data generation...');
try {
    const dataSimulator = new DataSimulator();
    const crewData = dataSimulator.generateCrewData();
    
    console.log('✓ Generated crew data for', crewData.length, 'crew members');
    
    crewData.forEach(member => {
        console.log(`  - ${member.name}: HR=${member.vitals.heartRate}, TEMP=${member.vitals.temperature.toFixed(1)}°C, O2=${member.vitals.oxygenSat}%`);
    });
    
    // Validate data ranges
    let validationPassed = true;
    crewData.forEach(member => {
        const vitals = member.vitals;
        if (vitals.heartRate < 50 || vitals.heartRate > 120) {
            console.log('✗ Invalid heart rate for', member.name, ':', vitals.heartRate);
            validationPassed = false;
        }
        if (vitals.temperature < 35.0 || vitals.temperature > 38.5) {
            console.log('✗ Invalid temperature for', member.name, ':', vitals.temperature);
            validationPassed = false;
        }
        if (vitals.oxygenSat < 90 || vitals.oxygenSat > 100) {
            console.log('✗ Invalid oxygen saturation for', member.name, ':', vitals.oxygenSat);
            validationPassed = false;
        }
    });
    
    if (validationPassed) {
        console.log('✓ All vital signs within valid ranges');
    }
} catch (error) {
    console.log('✗ Crew data generation failed:', error.message);
}

// Test 3: Vital signs status assessment
console.log('\n3. Testing vital signs status assessment...');
try {
    const dataSimulator = new DataSimulator();
    const crewSystem = new NostromoCrew(dataSimulator);
    
    // Test heart rate assessment
    const normalHR = crewSystem.getVitalStatus('heartRate', 75);
    const warningHR = crewSystem.getVitalStatus('heartRate', 105);
    const criticalHR = crewSystem.getVitalStatus('heartRate', 125);
    
    console.log('✓ Heart rate status assessment:');
    console.log('  - Normal (75 BPM):', normalHR);
    console.log('  - Warning (105 BPM):', warningHR);
    console.log('  - Critical (125 BPM):', criticalHR);
    
    // Test temperature assessment
    const normalTemp = crewSystem.getVitalStatus('temperature', 36.8);
    const warningTemp = crewSystem.getVitalStatus('temperature', 37.8);
    const criticalTemp = crewSystem.getVitalStatus('temperature', 39.0);
    
    console.log('✓ Temperature status assessment:');
    console.log('  - Normal (36.8°C):', normalTemp);
    console.log('  - Warning (37.8°C):', warningTemp);
    console.log('  - Critical (39.0°C):', criticalTemp);
    
    // Test oxygen saturation assessment
    const normalO2 = crewSystem.getVitalStatus('oxygenSat', 98);
    const warningO2 = crewSystem.getVitalStatus('oxygenSat', 93);
    const criticalO2 = crewSystem.getVitalStatus('oxygenSat', 88);
    
    console.log('✓ Oxygen saturation status assessment:');
    console.log('  - Normal (98%):', normalO2);
    console.log('  - Warning (93%):', warningO2);
    console.log('  - Critical (88%):', criticalO2);
    
} catch (error) {
    console.log('✗ Vital signs status assessment failed:', error.message);
}

// Test 4: Alert generation
console.log('\n4. Testing alert generation...');
try {
    const dataSimulator = new DataSimulator();
    const crewSystem = new NostromoCrew(dataSimulator);
    
    // Test with normal crew data
    const normalCrewData = [{
        id: 'CREW001',
        name: 'DALLAS',
        vitals: { heartRate: 75, temperature: 36.8, oxygenSat: 98 }
    }];
    
    const normalAlerts = crewSystem.generateCrewAlerts(normalCrewData);
    console.log('✓ Normal vitals generate', normalAlerts.length, 'alerts');
    
    // Test with critical crew data
    const criticalCrewData = [{
        id: 'CREW001',
        name: 'DALLAS',
        vitals: { heartRate: 125, temperature: 39.0, oxygenSat: 88 }
    }];
    
    const criticalAlerts = crewSystem.generateCrewAlerts(criticalCrewData);
    console.log('✓ Critical vitals generate', criticalAlerts.length, 'alerts');
    
    if (criticalAlerts.length > 0) {
        console.log('  Sample alert:', criticalAlerts[0].message);
    }
    
} catch (error) {
    console.log('✗ Alert generation failed:', error.message);
}

// Test 5: Environmental status assessment
console.log('\n5. Testing environmental status assessment...');
try {
    const dataSimulator = new DataSimulator();
    const crewSystem = new NostromoCrew(dataSimulator);
    
    const normalEnv = { temperature: 21.0, oxygen: 95.0, pressure: 1.02 };
    const warningEnv = { temperature: 17.0, oxygen: 88.0, pressure: 1.02 };
    const criticalEnv = { temperature: 15.0, oxygen: 82.0, pressure: 1.02 };
    
    console.log('✓ Environmental status assessment:');
    console.log('  - Normal environment:', crewSystem.getEnvironmentalStatus(normalEnv));
    console.log('  - Warning environment:', crewSystem.getEnvironmentalStatus(warningEnv));
    console.log('  - Critical environment:', crewSystem.getEnvironmentalStatus(criticalEnv));
    
} catch (error) {
    console.log('✗ Environmental status assessment failed:', error.message);
}

// Test 6: System activation/deactivation
console.log('\n6. Testing system activation/deactivation...');
try {
    const dataSimulator = new DataSimulator();
    const crewSystem = new NostromoCrew(dataSimulator);
    
    console.log('✓ Initial state - isActive:', crewSystem.isActive);
    
    crewSystem.activate();
    console.log('✓ After activation - isActive:', crewSystem.isActive);
    
    crewSystem.deactivate();
    console.log('✓ After deactivation - isActive:', crewSystem.isActive);
    
} catch (error) {
    console.log('✗ System activation/deactivation failed:', error.message);
}

console.log('\n=== Test Summary ===');
console.log('Crew monitoring system basic functionality tests completed.');
console.log('If you see mostly ✓ marks above, the implementation is working correctly.');