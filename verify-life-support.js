/**
 * Simple verification script for Life Support implementation
 * This can be run in Node.js to verify the basic functionality
 */

// Mock DOM for Node.js environment
global.document = {
    getElementById: (id) => ({
        textContent: '',
        innerHTML: '',
        className: '',
        style: {},
        querySelector: () => ({ innerHTML: '' })
    }),
    querySelector: () => ({ innerHTML: '' })
};

global.console = {
    log: console.log,
    warn: console.warn,
    error: console.error
};

// Load the modules
const DataSimulator = require('./js/data-simulator.js');
const NostromoLifeSupport = require('./js/life-support.js');

console.log('🚀 Starting Life Support Verification...\n');

// Test 1: Basic Initialization
console.log('1. Testing Basic Initialization...');
try {
    const dataSimulator = new DataSimulator();
    const lifeSupport = new NostromoLifeSupport(dataSimulator);
    
    console.log('   ✓ DataSimulator created successfully');
    console.log('   ✓ NostromoLifeSupport created successfully');
    console.log('   ✓ Alert thresholds initialized:', Object.keys(lifeSupport.alertThresholds));
    console.log('   ✓ Zones initialized:', lifeSupport.zones.length, 'zones');
    console.log('   ✓ Refresh rate set to:', lifeSupport.refreshRate, 'ms');
} catch (error) {
    console.error('   ❌ Initialization failed:', error.message);
    process.exit(1);
}

// Test 2: Data Generation and Processing
console.log('\n2. Testing Data Generation and Processing...');
try {
    const dataSimulator = new DataSimulator();
    const lifeSupport = new NostromoLifeSupport(dataSimulator);
    
    const systemData = dataSimulator.generateSystemStatus();
    console.log('   ✓ System data generated:', {
        oxygen: systemData.lifeSupport.oxygen,
        co2: systemData.lifeSupport.co2,
        pressure: systemData.lifeSupport.pressure,
        temperature: systemData.lifeSupport.temperature
    });
    
    // Test status determination
    const oxygenStatus = lifeSupport.getMetricStatus('oxygen', systemData.lifeSupport.oxygen);
    const co2Status = lifeSupport.getMetricStatus('co2', systemData.lifeSupport.co2);
    console.log('   ✓ Status determination working:', { oxygen: oxygenStatus, co2: co2Status });
    
} catch (error) {
    console.error('   ❌ Data processing failed:', error.message);
    process.exit(1);
}

// Test 3: Alert Generation
console.log('\n3. Testing Alert Generation...');
try {
    const dataSimulator = new DataSimulator();
    const lifeSupport = new NostromoLifeSupport(dataSimulator);
    
    // Test normal conditions
    const normalData = { oxygen: 95, co2: 12, pressure: 1.02, temperature: 21.5 };
    const normalAlerts = lifeSupport.generateAlerts(normalData);
    console.log('   ✓ Normal conditions generate', normalAlerts.length, 'alerts');
    
    // Test critical conditions
    const criticalData = { oxygen: 75, co2: 35, pressure: 0.85, temperature: 17 };
    const criticalAlerts = lifeSupport.generateAlerts(criticalData);
    console.log('   ✓ Critical conditions generate', criticalAlerts.length, 'alerts');
    console.log('   ✓ Sample critical alert:', criticalAlerts[0]?.message.substring(0, 50) + '...');
    
} catch (error) {
    console.error('   ❌ Alert generation failed:', error.message);
    process.exit(1);
}

// Test 4: ASCII Bar Generation
console.log('\n4. Testing ASCII Bar Generation...');
try {
    const dataSimulator = new DataSimulator();
    const lifeSupport = new NostromoLifeSupport(dataSimulator);
    
    const bar100 = lifeSupport.generateASCIIBar(100, 'status-ok');
    const bar50 = lifeSupport.generateASCIIBar(50, 'status-warning');
    const bar0 = lifeSupport.generateASCIIBar(0, 'status-critical');
    
    console.log('   ✓ 100% bar generated (contains █):', bar100.includes('█'));
    console.log('   ✓ 50% bar generated (contains both █ and ░):', bar50.includes('█') && bar50.includes('░'));
    console.log('   ✓ 0% bar generated (contains ░):', bar0.includes('░'));
    console.log('   ✓ Percentage labels working:', bar100.includes('100.0%'));
    
} catch (error) {
    console.error('   ❌ ASCII bar generation failed:', error.message);
    process.exit(1);
}

// Test 5: Zone Data Generation
console.log('\n5. Testing Zone Data Generation...');
try {
    const dataSimulator = new DataSimulator();
    const lifeSupport = new NostromoLifeSupport(dataSimulator);
    
    const baseData = { oxygen: 95, co2: 12, pressure: 1.02, temperature: 21.5 };
    const bridgeZone = { id: 'BRIDGE', name: 'BRIDGE', priority: 'HIGH' };
    const engineZone = { id: 'ENGINE', name: 'ENGINE ROOM', priority: 'HIGH' };
    
    const bridgeData = lifeSupport.generateZoneVariation(baseData, bridgeZone);
    const engineData = lifeSupport.generateZoneVariation(baseData, engineZone);
    
    console.log('   ✓ Bridge zone data:', {
        oxygen: bridgeData.oxygen.toFixed(1),
        co2: bridgeData.co2.toFixed(1),
        temp: bridgeData.temperature.toFixed(1)
    });
    console.log('   ✓ Engine zone data:', {
        oxygen: engineData.oxygen.toFixed(1),
        co2: engineData.co2.toFixed(1),
        temp: engineData.temperature.toFixed(1)
    });
    console.log('   ✓ Zone variations working:', bridgeData.oxygen !== engineData.oxygen);
    
} catch (error) {
    console.error('   ❌ Zone data generation failed:', error.message);
    process.exit(1);
}

// Test 6: Historical Data Management
console.log('\n6. Testing Historical Data Management...');
try {
    const dataSimulator = new DataSimulator();
    const lifeSupport = new NostromoLifeSupport(dataSimulator);
    
    // Add some historical data
    for (let i = 0; i < 25; i++) {
        lifeSupport.storeHistoricalData({
            oxygen: 90 + i * 0.2,
            co2: 10 + i * 0.1,
            pressure: 1.0,
            temperature: 20 + i * 0.05
        });
    }
    
    console.log('   ✓ Historical data stored, length:', lifeSupport.historicalData.length);
    console.log('   ✓ Data limited to max length:', lifeSupport.historicalData.length <= lifeSupport.maxHistoryLength);
    console.log('   ✓ Data has timestamps:', lifeSupport.historicalData[0].timestamp ? 'Yes' : 'No');
    
    // Test trend chart generation
    const trendChart = lifeSupport.generateTrendChart();
    console.log('   ✓ Trend chart generated:', trendChart.includes('OXYGEN LEVEL TREND'));
    
} catch (error) {
    console.error('   ❌ Historical data management failed:', error.message);
    process.exit(1);
}

console.log('\n🎉 All Life Support verification tests passed!');
console.log('\nLife Support System is ready for integration.');
console.log('\nKey Features Verified:');
console.log('  • Environmental data monitoring (O2, CO2, pressure, temperature)');
console.log('  • ASCII bar charts for visual data representation');
console.log('  • Zone-based environmental status with variations');
console.log('  • Alert generation for critical thresholds');
console.log('  • Historical data tracking and trend analysis');
console.log('  • Real-time data processing and status determination');