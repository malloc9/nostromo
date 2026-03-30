/**
 * Nostromo Dashboard Screen
 * Modular dashboard system with reusable components for each quadrant and the ship schematic
 */

class NostromoDashboard {
    constructor(dataSimulator) {
        this.dataSimulator = dataSimulator;
        this.refreshInterval = null;
        this.refreshRate = 2500; // 2.5 seconds
        this.isActive = false;

        // Components
        this.shipSchematic = null;
        this.powerQuadrant = null;
        this.lifeSupportQuadrant = null;
        this.navigationQuadrant = null;
        this.crewQuadrant = null;

        this.init();
    }

    /**
     * Initialize the dashboard and all its components
     */
    init() {
        console.log('Dashboard initialized');

        // Initialize components
        this.shipSchematic = new ShipSchematicComponent('ship-schematic');
        this.powerQuadrant = new PowerQuadrant();
        this.lifeSupportQuadrant = new LifeSupportQuadrant();
        this.navigationQuadrant = new NavigationQuadrant();
        this.crewQuadrant = new CrewQuadrant();

        // Initialize all components
        this.shipSchematic.init();
        this.powerQuadrant.init();
        this.lifeSupportQuadrant.init();
        this.navigationQuadrant.init();
        this.crewQuadrant.init();
    }

    /**
     * Activate dashboard and start real-time updates
     */
    activate() {
        this.isActive = true;
        this.render();
        this.startRealTimeUpdates();
        console.log('Dashboard activated');
    }

    /**
     * Deactivate dashboard and stop updates
     */
    deactivate() {
        this.isActive = false;
        this.stopRealTimeUpdates();
        console.log('Dashboard deactivated');
    }

    /**
     * Start real-time data updates
     */
    startRealTimeUpdates() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        this.refreshInterval = setInterval(() => {
            if (this.isActive) {
                this.updateData();
            }
        }, this.refreshRate);
    }

    /**
     * Stop real-time data updates
     */
    stopRealTimeUpdates() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    /**
     * Render the complete dashboard layout
     */
    render() {
        const dashboardScreen = document.getElementById('dashboard-screen');
        if (!dashboardScreen) {
            console.error('Dashboard screen element not found');
            return;
        }

        const screenContent = dashboardScreen.querySelector('.screen-content');
        if (!screenContent) {
            console.error('Dashboard screen content not found');
            return;
        }

        // Generate the dashboard HTML structure
        screenContent.innerHTML = `
            <div class="dashboard-container">
                <!-- Top Left: Ship Schematic & Summary -->
                <div class="ship-schematic-section">
                    <div class="section-header">NOSTROMO VESSEL STATUS</div>
                    <div id="ship-schematic" class="ship-schematic">
                        <!-- Ship schematic will be inserted here by component -->
                    </div>
                    <!-- System Summary Integrated here -->
                    <div class="system-summary">
                        <div class="summary-item">
                            <span class="summary-label">STATUS:</span>
                            <span class="summary-value" id="overall-status">OPERATIONAL</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">TIME:</span>
                            <span class="summary-value" id="last-update">--:--:--</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">ALERTS:</span>
                            <span class="summary-value" id="alert-count">0</span>
                        </div>
                    </div>
                </div>

                <!-- Top Right: 4-Quadrant Status Grid -->
                <div class="status-grid">
                    <!-- Power Systems Quadrant -->
                    <div id="power-quadrant" class="status-quadrant">
                        <!-- Power quadrant content will be inserted here by component -->
                    </div>

                    <!-- Life Support Quadrant -->
                    <div id="life-support-quadrant" class="status-quadrant">
                        <!-- Life support quadrant content will be inserted here by component -->
                    </div>

                    <!-- Navigation Quadrant -->
                    <div id="navigation-quadrant" class="status-quadrant">
                        <!-- Navigation quadrant content will be inserted here by component -->
                    </div>

                    <!-- Crew Status Quadrant -->
                    <div id="crew-quadrant" class="status-quadrant">
                        <!-- Crew quadrant content will be inserted here by component -->
                    </div>
                </div>

                <!-- Bottom: Console Interface -->
                <div id="console-interface" class="console-interface">
                    <div class="console-header">MU/TH/UR 6000 INTERFACE</div>
                    <div id="console-output" class="console-output"></div>
                    <div id="console-input-line" class="console-input-line">
                        <span class="prompt">></span>
                        <input type="text" id="console-input" class="console-input" autocomplete="off" spellcheck="false">
                    </div>
                </div>
            </div>
        `;

        // Render all components
        this.renderComponents();

        // Update data initially
        this.updateData();

        // Re-attach console if it exists
        if (window.consoleSystem) {
            window.consoleSystem.init();
        }
    }

    /**
     * Render all dashboard components
     */
    renderComponents() {
        // Render ship schematic
        this.shipSchematic.render();

        // Render quadrants (they render themselves in init)
        // But we need to make sure their content is in the right place
        this.ensureQuadrantContent();
    }

    /**
     * Ensure quadrant content is in the right place in the DOM
     */
    ensureQuadrantContent() {
        // Power quadrant
        const powerContainer = document.getElementById('power-quadrant');
        if (powerContainer && this.powerQuadrant.container) {
            // Clear and replace with component content
            powerContainer.innerHTML = this.powerQuadrant.container.innerHTML;
        }

        // Life support quadrant
        const lifeSupportContainer = document.getElementById('life-support-quadrant');
        if (lifeSupportContainer && this.lifeSupportQuadrant.container) {
            lifeSupportContainer.innerHTML = this.lifeSupportQuadrant.container.innerHTML;
        }

        // Navigation quadrant
        const navigationContainer = document.getElementById('navigation-quadrant');
        if (navigationContainer && this.navigationQuadrant.container) {
            navigationContainer.innerHTML = this.navigationQuadrant.container.innerHTML;
        }

        // Crew quadrant
        const crewContainer = document.getElementById('crew-quadrant');
        if (crewContainer && this.crewQuadrant.container) {
            crewContainer.innerHTML = this.crewQuadrant.container.innerHTML;
        }
    }

    /**
     * Update all dashboard data
     */
    updateData() {
        if (!this.dataSimulator) {
            console.warn('Data simulator not available');
            return;
        }

        const systemData = this.dataSimulator.generateSystemStatus();

        this.updatePowerQuadrant(systemData.power);
        this.updateLifeSupportQuadrant(systemData.lifeSupport);
        this.updateNavigationQuadrant(systemData.navigation);
        this.updateCrewQuadrant(systemData.crew);
        this.updateSystemSummary(systemData);
        this.updateSchematicIndicators(systemData);

        // Update last update timestamp
        const lastUpdateElement = document.getElementById('last-update');
        if (lastUpdateElement) {
            const now = new Date();
            lastUpdateElement.textContent = now.toTimeString().substring(0, 8);
        }
    }

    /**
     * Update power systems quadrant
     * @param {Object} powerData - Power system data
     */
    updatePowerQuadrant(powerData) {
        this.powerQuadrant.update(powerData);
    }

    /**
     * Update life support quadrant
     * @param {Object} lifeSupportData - Life support system data
     */
    updateLifeSupportQuadrant(lifeSupportData) {
        this.lifeSupportQuadrant.update(lifeSupportData);
    }

    /**
     * Update navigation quadrant
     * @param {Object} navigationData - Navigation system data
     */
    updateNavigationQuadrant(navigationData) {
        this.navigationQuadrant.update(navigationData);
    }

    /**
     * Update crew status quadrant
     * @param {Array} crewData - Array of crew member objects
     */
    updateCrewQuadrant(crewData) {
        this.crewQuadrant.update(crewData);
    }

    /**
     * Update system summary information
     * @param {Object} systemData - Complete system status data
     */
    updateSystemSummary(systemData) {
        const overallStatus = document.getElementById('overall-status');
        const alertCount = document.getElementById('alert-count');

        if (!overallStatus || !alertCount) return;

        // Calculate overall system health
        let alerts = 0;
        let overallHealth = 'OPERATIONAL';

        // Check power status
        const powerLevel = systemData.power.generation - systemData.power.consumption;
        if (powerLevel < 0) {
            alerts++;
            overallHealth = 'CRITICAL';
        } else if (powerLevel < 10) {
            alerts++;
            if (overallHealth === 'OPERATIONAL') overallHealth = 'WARNING';
        }

        // Check life support
        if (systemData.lifeSupport.oxygen < 80 || systemData.lifeSupport.co2 > 30) {
            alerts++;
            overallHealth = 'CRITICAL';
        } else if (systemData.lifeSupport.oxygen < 90 || systemData.lifeSupport.co2 > 20) {
            alerts++;
            if (overallHealth === 'OPERATIONAL') overallHealth = 'WARNING';
        }

        // Update display
        overallStatus.textContent = overallHealth;
        overallStatus.className = `summary-value ${overallHealth === 'CRITICAL' ? 'status-critical' :
            overallHealth === 'WARNING' ? 'status-warning' : 'status-ok'
            }`;

        alertCount.textContent = alerts.toString();
        alertCount.className = `summary-value ${alerts > 0 ? 'status-warning' : 'status-ok'}`;
    }

    /**
     * Update ship schematic system indicators
     * @param {Object} systemData - Complete system status data
     */
    updateSchematicIndicators(systemData) {
        this.shipSchematic.update(systemData);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NostromoDashboard;
} else {
    window.NostromoDashboard = NostromoDashboard;
}