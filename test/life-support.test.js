/**
 * Life Support System Tests
 * Tests for data processing, alert triggering, and environmental monitoring
 */

// Mock DOM elements for testing
function createMockDOM() {
    // Create a mock document object
    global.document = {
        getElementById: (id) => {
            return {
                textContent: '',
                innerHTML: '',
                className: '',
                style: {}
            };
        },
        querySelector: () => ({
            innerHTML: ''
        })
    };
    
    // Mock console for testing
    global.console = {
        log: () => {},
        warn: () => {},
        error: () => {}
    };
}

// Mock DataSimulator for testing
class MockDataSimulator {
    generateSystemStatus() {
        return {
            lifeSupport: {
                oxygen: 95.0,
                co2: 12.0,
                pressure: 1.02,
                temperature: 21.5
            }
        };
    }
}

// Import the modules (in a real environment, these would be loaded differently)
let NostromoLifeSupport;
let DataSimulator;

// Test setup
function setupTests() {
    createMockDOM();
    
    // In a real test environment, you would import these properly
    // For now, we'll assume they're available globally
    if (typeof require !== 'undefined') {
        try {
            NostromoLifeSupport = require('../js/life-support.js');
            DataSimulator = require('../js/data-simulator.js');
        } catch (e) {
            // Fallback for browser environment
            NostromoLifeSupport = window.NostromoLifeSupport;
            DataSimulator = MockDataSimulator;
        }
    } else {
        NostromoLifeSupport = window.NostromoLifeSupport;
        DataSimulator = MockDataSimulator;
    }
}

// Test Suite: Life Support Initialization
function testLifeSupportInitialization() {
    console.log('Testing Life Support Initialization...');
    
    const mockDataSimulator = new DataSimulator();
    const lifeSupport = new NostromoLifeSupport(mockDataSimulator);
    
    // Test that life support initializes with correct properties
    if (!lifeSupport.dataSimulator) {
        throw new Error('Life support should have data simulator reference');
    }
    
    if (!lifeSupport.alertThresholds) {
        throw new Error('Life support should have alert thresholds defined');
    }
    
    if (!lifeSupport.zones || lifeSupport.zones.length === 0) {
        throw new Error('Life support should have zones defined');
    }
    
    if (lifeSupport.refreshRate !== 2000) {
        throw new Error('Life support should have 2 second refresh rate');
    }
    
    console.log('✓ Life Support initialization test passed');
}

// Test Suite: Alert Threshold Processing
function testAlertThresholds() {
    console.log('Testing Alert Threshold Processing...');
    
    const mockDataSimulator = new DataSimulator();
    const lifeSupport = new NostromoLifeSupport(mockDataSimulator);
    
    // Test oxygen status determination
    let status = lifeSupport.getMetricStatus('oxygen', 95);
    if (status !== 'status-ok') {
        throw new Error('Oxygen at 95% should be OK status');
    }
    
    status = lifeSupport.getMetricStatus('oxygen', 85);
    if (status !== 'status-warning') {
        throw new Error('Oxygen at 85% should be WARNING status');
    }
    
    status = lifeSupport.getMetricStatus('oxygen', 75);
    if (status !== 'status-critical') {
        throw new Error('Oxygen at 75% should be CRITICAL status');
    }
    
    // Test CO2 status determination
    status = lifeSupport.getMetricStatus('co2', 15);
    if (status !== 'status-ok') {
        throw new Error('CO2 at 15 PPM should be OK status');
    }
    
    status = lifeSupport.getMetricStatus('co2', 25);
    if (status !== 'status-warning') {
        throw new Error('CO2 at 25 PPM should be WARNING status');
    }
    
    status = lifeSupport.getMetricStatus('co2', 35);
    if (status !== 'status-critical') {
        throw new Error('CO2 at 35 PPM should be CRITICAL status');
    }
    
    // Test pressure status determination
    status = lifeSupport.getMetricStatus('pressure', 1.00);
    if (status !== 'status-ok') {
        throw new Error('Pressure at 1.00 ATM should be OK status');
    }
    
    status = lifeSupport.getMetricStatus('pressure', 0.93);
    if (status !== 'status-warning') {
        throw new Error('Pressure at 0.93 ATM should be WARNING status');
    }
    
    status = lifeSupport.getMetricStatus('pressure', 0.85);
    if (status !== 'status-critical') {
        throw new Error('Pressure at 0.85 ATM should be CRITICAL status');
    }
    
    // Test temperature status determination
    status = lifeSupport.getMetricStatus('temperature', 21);
    if (status !== 'status-ok') {
        throw new Error('Temperature at 21°C should be OK status');
    }
    
    status = lifeSupport.getMetricStatus('temperature', 18.5);
    if (status !== 'status-warning') {
        throw new Error('Temperature at 18.5°C should be WARNING status');
    }
    
    status = lifeSupport.getMetricStatus('temperature', 17);
    if (status !== 'status-critical') {
        throw new Error('Temperature at 17°C should be CRITICAL status');
    }
    
    console.log('✓ Alert threshold processing tests passed');
}

// Test Suite: Alert Generation
function testAlertGeneration() {
    console.log('Testing Alert Generation...');
    
    const mockDataSimulator = new DataSimulator();
    const lifeSupport = new NostromoLifeSupport(mockDataSimulator);
    
    // Test normal conditions - no alerts
    let normalData = {
        oxygen: 95,
        co2: 12,
        pressure: 1.02,
        temperature: 21.5
    };
    
    let alerts = lifeSupport.generateAlerts(normalData);
    if (alerts.length !== 0) {
        throw new Error('Normal conditions should generate no alerts');
    }
    
    // Test warning conditions
    let warningData = {
        oxygen: 85, // Warning level
        co2: 25,    // Warning level
        pressure: 1.02,
        temperature: 21.5
    };
    
    alerts = lifeSupport.generateAlerts(warningData);
    if (alerts.length !== 2) {
        throw new Error('Warning conditions should generate 2 alerts');
    }
    
    if (!alerts.some(alert => alert.severity === 'alert-warning' && alert.message.includes('OXYGEN'))) {
        throw new Error('Should generate oxygen warning alert');
    }
    
    if (!alerts.some(alert => alert.severity === 'alert-warning' && alert.message.includes('CO2'))) {
        throw new Error('Should generate CO2 warning alert');
    }
    
    // Test critical conditions
    let criticalData = {
        oxygen: 75, // Critical level
        co2: 35,    // Critical level
        pressure: 0.85, // Critical level
        temperature: 17 // Critical level
    };
    
    alerts = lifeSupport.generateAlerts(criticalData);
    if (alerts.length !== 4) {
        throw new Error('Critical conditions should generate 4 alerts');
    }
    
    if (!alerts.every(alert => alert.severity === 'alert-critical')) {
        throw new Error('All alerts should be critical severity');
    }
    
    console.log('✓ Alert generation tests passed');
}

// Test Suite: ASCII Bar Chart Generation
function testASCIIBarGeneration() {
    console.log('Testing ASCII Bar Chart Generation...');
    
    const mockDataSimulator = new DataSimulator();
    const lifeSupport = new NostromoLifeSupport(mockDataSimulator);
    
    // Test 100% bar
    let barHTML = lifeSupport.generateASCIIBar(100, 'status-ok');
    if (!barHTML.includes('█'.repeat(20))) {
        throw new Error('100% bar should be fully filled');
    }
    
    if (!barHTML.includes('100.0%')) {
        throw new Error('100% bar should show 100.0% label');
    }
    
    // Test 50% bar
    barHTML = lifeSupport.generateASCIIBar(50, 'status-warning');
    if (!barHTML.includes('█'.repeat(10))) {
        throw new Error('50% bar should be half filled');
    }
    
    if (!barHTML.includes('░'.repeat(10))) {
        throw new Error('50% bar should be half empty');
    }
    
    if (!barHTML.includes('50.0%')) {
        throw new Error('50% bar should show 50.0% label');
    }
    
    // Test 0% bar
    barHTML = lifeSupport.generateASCIIBar(0, 'status-critical');
    if (!barHTML.includes('░'.repeat(20))) {
        throw new Error('0% bar should be fully empty');
    }
    
    if (!barHTML.includes('0.0%')) {
        throw new Error('0% bar should show 0.0% label');
    }
    
    console.log('✓ ASCII bar chart generation tests passed');
}

// Test Suite: Zone Data Generation
function testZoneDataGeneration() {
    console.log('Testing Zone Data Generation...');
    
    const mockDataSimulator = new DataSimulator();
    const lifeSupport = new NostromoLifeSupport(mockDataSimulator);
    
    const baseData = {
        oxygen: 95,
        co2: 12,
        pressure: 1.02,
        temperature: 21.5
    };
    
    // Test zone variations
    const bridgeZone = { id: 'BRIDGE', name: 'BRIDGE', priority: 'HIGH' };
    const engineZone = { id: 'ENGINE', name: 'ENGINE ROOM', priority: 'HIGH' };
    
    const bridgeData = lifeSupport.generateZoneVariation(baseData, bridgeZone);
    const engineData = lifeSupport.generateZoneVariation(baseData, engineZone);
    
    // Bridge should have better conditions than engine room
    if (bridgeData.oxygen <= engineData.oxygen) {
        throw new Error('Bridge should have better oxygen than engine room');
    }
    
    if (bridgeData.co2 >= engineData.co2) {
        throw new Error('Bridge should have lower CO2 than engine room');
    }
    
    if (bridgeData.temperature >= engineData.temperature) {
        throw new Error('Bridge should be cooler than engine room');
    }
    
    // All values should be within reasonable ranges
    if (bridgeData.oxygen < 0 || bridgeData.oxygen > 100) {
        throw new Error('Zone oxygen should be within 0-100 range');
    }
    
    if (bridgeData.co2 < 0 || bridgeData.co2 > 50) {
        throw new Error('Zone CO2 should be within 0-50 range');
    }
    
    if (bridgeData.temperature < 15 || bridgeData.temperature > 30) {
        throw new Error('Zone temperature should be within 15-30 range');
    }
    
    console.log('✓ Zone data generation tests passed');
}

// Test Suite: Historical Data Management
function testHistoricalDataManagement() {
    console.log('Testing Historical Data Management...');
    
    const mockDataSimulator = new DataSimulator();
    const lifeSupport = new NostromoLifeSupport(mockDataSimulator);
    
    // Test data storage
    const testData = {
        oxygen: 95,
        co2: 12,
        pressure: 1.02,
        temperature: 21.5
    };
    
    // Store multiple data points
    for (let i = 0; i < 25; i++) {
        lifeSupport.storeHistoricalData({
            ...testData,
            oxygen: testData.oxygen + i * 0.1
        });
    }
    
    // Should only keep maxHistoryLength items
    if (lifeSupport.historicalData.length !== lifeSupport.maxHistoryLength) {
        throw new Error(`Historical data should be limited to ${lifeSupport.maxHistoryLength} items`);
    }
    
    // Should have timestamps
    if (!lifeSupport.historicalData.every(item => item.timestamp)) {
        throw new Error('All historical data should have timestamps');
    }
    
    // Should maintain chronological order (newest data should have higher oxygen)
    const firstItem = lifeSupport.historicalData[0];
    const lastItem = lifeSupport.historicalData[lifeSupport.historicalData.length - 1];
    
    if (lastItem.oxygen <= firstItem.oxygen) {
        throw new Error('Historical data should maintain chronological order');
    }
    
    console.log('✓ Historical data management tests passed');
}

// Test Suite: Trend Chart Generation
function testTrendChartGeneration() {
    console.log('Testing Trend Chart Generation...');
    
    const mockDataSimulator = new DataSimulator();
    const lifeSupport = new NostromoLifeSupport(mockDataSimulator);
    
    // Test with insufficient data
    let chartHTML = lifeSupport.generateTrendChart();
    if (!chartHTML.includes('COLLECTING TREND DATA')) {
        throw new Error('Should show loading message with insufficient data');
    }
    
    // Add sufficient data
    for (let i = 0; i < 10; i++) {
        lifeSupport.storeHistoricalData({
            oxygen: 90 + i,
            co2: 10 + i,
            pressure: 1.0,
            temperature: 20
        });
    }
    
    chartHTML = lifeSupport.generateTrendChart();
    
    if (!chartHTML.includes('OXYGEN LEVEL TREND')) {
        throw new Error('Chart should include oxygen trend title');
    }
    
    if (!chartHTML.includes('█')) {
        throw new Error('Chart should contain ASCII chart characters');
    }
    
    if (!chartHTML.includes('TIME →')) {
        throw new Error('Chart should include time axis label');
    }
    
    console.log('✓ Trend chart generation tests passed');
}

// Test Suite: Zone Status Determination
function testZoneStatusDetermination() {
    console.log('Testing Zone Status Determination...');
    
    const mockDataSimulator = new DataSimulator();
    const lifeSupport = new NostromoLifeSupport(mockDataSimulator);
    
    // Test normal zone data
    let normalZoneData = {
        oxygen: 95,
        co2: 12,
        temperature: 21.5
    };
    
    let status = lifeSupport.getWorstZoneStatus(normalZoneData);
    if (status !== 'status-ok') {
        throw new Error('Normal zone data should return OK status');
    }
    
    // Test warning zone data
    let warningZoneData = {
        oxygen: 85, // Warning level
        co2: 12,    // OK level
        temperature: 21.5 // OK level
    };
    
    status = lifeSupport.getWorstZoneStatus(warningZoneData);
    if (status !== 'status-warning') {
        throw new Error('Zone with warning oxygen should return WARNING status');
    }
    
    // Test critical zone data
    let criticalZoneData = {
        oxygen: 95,  // OK level
        co2: 35,     // Critical level
        temperature: 21.5 // OK level
    };
    
    status = lifeSupport.getWorstZoneStatus(criticalZoneData);
    if (status !== 'status-critical') {
        throw new Error('Zone with critical CO2 should return CRITICAL status');
    }
    
    // Test mixed conditions - critical should take precedence
    let mixedZoneData = {
        oxygen: 85,  // Warning level
        co2: 35,     // Critical level
        temperature: 18.5 // Warning level
    };
    
    status = lifeSupport.getWorstZoneStatus(mixedZoneData);
    if (status !== 'status-critical') {
        throw new Error('Zone with mixed conditions should return worst (CRITICAL) status');
    }
    
    console.log('✓ Zone status determination tests passed');
}

// Run all tests
function runAllTests() {
    console.log('Starting Life Support System Tests...\n');
    
    try {
        setupTests();
        
        testLifeSupportInitialization();
        testAlertThresholds();
        testAlertGeneration();
        testASCIIBarGeneration();
        testZoneDataGeneration();
        testHistoricalDataManagement();
        testTrendChartGeneration();
        testZoneStatusDetermination();
        
        console.log('\n✅ All Life Support System tests passed!');
        return true;
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error(error.stack);
        return false;
    }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runAllTests,
        testLifeSupportInitialization,
        testAlertThresholds,
        testAlertGeneration,
        testASCIIBarGeneration,
        testZoneDataGeneration,
        testHistoricalDataManagement,
        testTrendChartGeneration,
        testZoneStatusDetermination
    };
} else if (typeof window !== 'undefined') {
    window.lifeSupportTests = {
        runAllTests,
        testLifeSupportInitialization,
        testAlertThresholds,
        testAlertGeneration,
        testASCIIBarGeneration,
        testZoneDataGeneration,
        testHistoricalDataManagement,
        testTrendChartGeneration,
        testZoneStatusDetermination
    };
}

// Auto-run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
    runAllTests();
}