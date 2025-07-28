/**
 * Verification script for crew monitoring system integration
 */

// Mock DOM elements that the crew system expects
function createMockDOM() {
    // Create crew screen element
    const crewScreen = document.createElement('div');
    crewScreen.id = 'crew-screen';
    crewScreen.className = 'screen';
    
    const screenHeader = document.createElement('div');
    screenHeader.className = 'screen-header';
    screenHeader.innerHTML = `
        <h2>CREW MONITORING</h2>
        <div class="breadcrumb">MAIN > CREW</div>
    `;
    
    const screenContent = document.createElement('div');
    screenContent.className = 'screen-content';
    screenContent.innerHTML = `
        <div class="loading-message">
            <span>SYSTEM NOT IMPLEMENTED</span>
        </div>
    `;
    
    crewScreen.appendChild(screenHeader);
    crewScreen.appendChild(screenContent);
    document.body.appendChild(crewScreen);
    
    console.log('✓ Mock DOM elements created');
}

// Test integration
function testIntegration() {
    console.log('Testing crew monitoring system integration...\n');
    
    try {
        // Create mock DOM
        createMockDOM();
        
        // Test if DataSimulator is available
        if (typeof DataSimulator === 'undefined') {
            throw new Error('DataSimulator not available');
        }
        console.log('✓ DataSimulator is available');
        
        // Test if NostromoCrew is available
        if (typeof NostromoCrew === 'undefined') {
            throw new Error('NostromoCrew not available');
        }
        console.log('✓ NostromoCrew is available');
        
        // Initialize systems
        const dataSimulator = new DataSimulator();
        const crewSystem = new NostromoCrew(dataSimulator);
        
        console.log('✓ Systems initialized successfully');
        
        // Test activation
        crewSystem.activate();
        console.log('✓ Crew system activated');
        
        // Test data generation
        const systemData = dataSimulator.generateSystemStatus();
        console.log('✓ System data generated:', {
            crewCount: systemData.crew.length,
            powerLevel: systemData.power.generation,
            lifeSupportOK: systemData.lifeSupport.oxygen > 90
        });
        
        // Test crew-specific functionality
        const crewData = systemData.crew;
        const alerts = crewSystem.generateCrewAlerts(crewData);
        console.log('✓ Crew alerts generated:', alerts.length, 'alerts');
        
        // Test vital signs assessment
        const firstCrew = crewData[0];
        const healthStatus = crewSystem.getCrewHealthStatus(firstCrew.vitals);
        console.log('✓ Health status assessment for', firstCrew.name + ':', healthStatus);
        
        // Test environmental status
        const envData = { temperature: 21.0, oxygen: 95.0, pressure: 1.02 };
        const envStatus = crewSystem.getEnvironmentalStatus(envData);
        console.log('✓ Environmental status assessment:', envStatus);
        
        // Test deactivation
        crewSystem.deactivate();
        console.log('✓ Crew system deactivated');
        
        console.log('\n=== Integration Test Summary ===');
        console.log('✓ All integration tests passed successfully!');
        console.log('✓ Crew monitoring system is ready for use');
        
    } catch (error) {
        console.error('✗ Integration test failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run tests when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', testIntegration);
} else {
    testIntegration();
}