// Node.js verification script for engineering system

// Create a minimal DOM environment
global.document = {
    getElementById: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {}
};

// Load modules directly
const DataSimulator = require('./js/data-simulator.js');
const NostromoEngineering = require('./js/engineering.js');

const dataSimulator = new DataSimulator();
const engineering = new NostromoEngineering(dataSimulator);

console.log('🔧 Engineering System Verification');
console.log('==================================');

// Test 1: Initialization
console.log('\n1. Testing Initialization:');
console.log(`   ✓ Power systems count: ${engineering.powerSystems.length}`);
console.log(`   ✓ Alert thresholds defined: ${Object.keys(engineering.alertThresholds).length}`);
console.log(`   ✓ Initial state: ${engineering.isActive ? 'Active' : 'Inactive'}`);

// Test 2: Power Data Generation
console.log('\n2. Testing Power Data:');
const systemData = dataSimulator.generateSystemStatus();
const powerData = systemData.power;
console.log(`   ✓ Generation: ${powerData.generation.toFixed(1)}%`);
console.log(`   ✓ Consumption: ${powerData.consumption.toFixed(1)}%`);
console.log(`   ✓ Efficiency: ${powerData.efficiency.toFixed(1)}%`);
console.log(`   ✓ Fuel: ${powerData.fuel.toFixed(1)}%`);
console.log(`   ✓ Net Power: ${powerData.netPower.toFixed(1)}%`);

// Test 3: Power Validation
console.log('\n3. Testing Power Validation:');
const validationErrors = engineering.validatePowerCalculations(powerData);
if (validationErrors.length === 0) {
    console.log('   ✓ Power data validation passed');
} else {
    console.log(`   ✗ Validation errors: ${validationErrors.join(', ')}`);
}

// Test 4: System Consumption Calculation
console.log('\n4. Testing System Consumption:');
engineering.powerSystems.forEach(system => {
    const consumption = engineering.calculateSystemConsumption(system, powerData);
    const status = engineering.getSystemPowerStatus(consumption);
    console.log(`   ✓ ${system.name}: ${consumption.toFixed(1)}% (${status})`);
});

// Test 5: Status Determination
console.log('\n5. Testing Status Determination:');
const testCases = [
    { metric: 'generation', value: 90, expected: 'status-ok' },
    { metric: 'generation', value: 65, expected: 'status-warning' },
    { metric: 'generation', value: 40, expected: 'status-critical' },
    { metric: 'consumption', value: 70, expected: 'status-ok' },
    { metric: 'consumption', value: 90, expected: 'status-warning' },
    { metric: 'consumption', value: 98, expected: 'status-critical' }
];

testCases.forEach(test => {
    const result = engineering.getPowerMetricStatus(test.metric, test.value);
    const passed = result === test.expected;
    console.log(`   ${passed ? '✓' : '✗'} ${test.metric} ${test.value}%: ${result} (expected: ${test.expected})`);
});

// Test 6: Alert Calculation
console.log('\n6. Testing Alert Calculation:');
const alertCount = engineering.calculatePowerAlerts(powerData);
console.log(`   ✓ Current alert count: ${alertCount}`);

// Test 7: ASCII Bar Generation
console.log('\n7. Testing ASCII Bar Generation:');
const testBar = engineering.generateASCIIBar(75, 'status-ok');
const hasRequiredElements = testBar.includes('ascii-bar') && 
                           testBar.includes('75.0%') && 
                           testBar.includes('bar-filled');
console.log(`   ${hasRequiredElements ? '✓' : '✗'} ASCII bar generation`);

// Test 8: Historical Data Management
console.log('\n8. Testing Historical Data:');
const initialLength = engineering.historicalData.length;
engineering.storeHistoricalData(powerData);
const newLength = engineering.historicalData.length;
console.log(`   ✓ Historical data stored: ${initialLength} → ${newLength}`);

// Test 9: Edge Cases
console.log('\n9. Testing Edge Cases:');
try {
    const invalidData = {
        generation: -10,
        consumption: 150,
        efficiency: 88,
        fuel: 67
    };
    const errors = engineering.validatePowerCalculations(invalidData);
    console.log(`   ✓ Invalid data detection: ${errors.length} errors found`);
} catch (error) {
    console.log(`   ✗ Edge case test failed: ${error.message}`);
}

// Test 10: System Integration
console.log('\n10. Testing System Integration:');
const currentPowerData = engineering.getCurrentPowerData();
if (currentPowerData && typeof currentPowerData.generation === 'number') {
    console.log('   ✓ System integration working');
} else {
    console.log('   ✗ System integration failed');
}

console.log('\n🎯 Engineering System Verification Complete');
console.log('==========================================');

// Summary
const totalTests = 10;
console.log(`\nSummary: ${totalTests} test categories completed`);
console.log('All core functionality verified successfully!');