/**
 * Nostromo Dashboard Screen
 * Main status overview with 4-quadrant layout and ship schematic
 */

class NostromoDashboard {
    constructor(dataSimulator) {
        this.dataSimulator = dataSimulator;
        this.refreshInterval = null;
        this.refreshRate = 2500; // 2.5 seconds
        this.isActive = false;
        
        this.init();
    }

    init() {
        console.log('Dashboard initialized');
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

        screenContent.innerHTML = this.generateDashboardHTML();
        this.setupSchematicClickHandlers();
        this.updateData();
    }

    /**
     * Generate the complete dashboard HTML structure
     */
    generateDashboardHTML() {
        return `
            <div class="dashboard-container">
                <!-- Ship Schematic Section -->
                <div class="ship-schematic-section">
                    <div class="section-header">NOSTROMO VESSEL STATUS</div>
                    <div class="ship-schematic">
                        ${this.generateShipSchematic()}
                    </div>
                </div>

                <!-- 4-Quadrant Status Grid -->
                <div class="status-grid">
                    <!-- Power Systems Quadrant -->
                    <div class="status-quadrant" id="power-quadrant">
                        <div class="quadrant-header">
                            <span class="quadrant-title">POWER SYSTEMS</span>
                            <span class="status-indicator" id="power-status">●</span>
                        </div>
                        <div class="quadrant-content" id="power-content">
                            <div class="data-loading">LOADING...</div>
                        </div>
                    </div>

                    <!-- Life Support Quadrant -->
                    <div class="status-quadrant" id="life-support-quadrant">
                        <div class="quadrant-header">
                            <span class="quadrant-title">LIFE SUPPORT</span>
                            <span class="status-indicator" id="life-support-status">●</span>
                        </div>
                        <div class="quadrant-content" id="life-support-content">
                            <div class="data-loading">LOADING...</div>
                        </div>
                    </div>

                    <!-- Navigation Quadrant -->
                    <div class="status-quadrant" id="navigation-quadrant">
                        <div class="quadrant-header">
                            <span class="quadrant-title">NAVIGATION</span>
                            <span class="status-indicator" id="navigation-status">●</span>
                        </div>
                        <div class="quadrant-content" id="navigation-content">
                            <div class="data-loading">LOADING...</div>
                        </div>
                    </div>

                    <!-- Crew Status Quadrant -->
                    <div class="status-quadrant" id="crew-quadrant">
                        <div class="quadrant-header">
                            <span class="quadrant-title">CREW STATUS</span>
                            <span class="status-indicator" id="crew-status">●</span>
                        </div>
                        <div class="quadrant-content" id="crew-content">
                            <div class="data-loading">LOADING...</div>
                        </div>
                    </div>
                </div>

                <!-- System Summary Bar -->
                <div class="system-summary">
                    <div class="summary-item">
                        <span class="summary-label">OVERALL STATUS:</span>
                        <span class="summary-value" id="overall-status">OPERATIONAL</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">LAST UPDATE:</span>
                        <span class="summary-value" id="last-update">--:--:--</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">ALERTS:</span>
                        <span class="summary-value" id="alert-count">0</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate ASCII art ship schematic with clickable system indicators
     */
    generateShipSchematic() {
        return `
            <pre class="ascii-ship">
╔═══════════════════════════════════╗
║            NOSTROMO               ║
║       COMMERCIAL TOWING           ║
║            VEHICLE                ║
╠═══════════════════════════════════╣
║                                   ║
║   [<span class="system-indicator clickable" data-system="life-support" id="schematic-life-support">LS</span>]      BRIDGE      [<span class="system-indicator clickable" data-system="navigation" id="schematic-navigation">NAV</span>]   ║
║    │        ┌───┐        │        ║
║    │   ┌────┤   ├────┐   │        ║
║    └───┤    │   │    ├───┘        ║
║        │    └───┘    │            ║
║        │             │            ║
║        │   CENTRAL   │            ║
║        │    CORE     │            ║
║        │             │            ║
║    ┌───┤    ┌───┐    ├───┐        ║
║    │   └────┤   ├────┘   │        ║
║    │        └───┘        │        ║
║   [<span class="system-indicator clickable" data-system="engineering" id="schematic-power">PWR</span>]    ENGINE ROOM    [<span class="system-indicator clickable" data-system="crew" id="schematic-crew">CRW</span>]   ║
║    │     ╔═══════════╗     │       ║
║    └─────╢ █████████ ╟─────┘       ║
║          ╢ █████████ ╟             ║
║          ╚═══════════╝             ║
║                                   ║
╚═══════════════════════════════════╝
            </pre>
        `;
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
     */
    updatePowerQuadrant(powerData) {
        const content = document.getElementById('power-content');
        const status = document.getElementById('power-status');
        
        if (!content || !status) return;

        // Determine power status
        const powerLevel = powerData.generation - powerData.consumption;
        let statusClass = 'status-ok';
        if (powerLevel < 10) statusClass = 'status-warning';
        if (powerLevel < 0) statusClass = 'status-critical';
        
        status.className = `status-indicator ${statusClass}`;

        content.innerHTML = `
            <div class="data-row">
                <span class="data-label">GENERATION:</span>
                <span class="data-value">${powerData.generation.toFixed(1)}%</span>
            </div>
            <div class="data-row">
                <span class="data-label">CONSUMPTION:</span>
                <span class="data-value">${powerData.consumption.toFixed(1)}%</span>
            </div>
            <div class="data-row">
                <span class="data-label">NET POWER:</span>
                <span class="data-value ${powerLevel >= 0 ? 'positive' : 'negative'}">${powerLevel >= 0 ? '+' : ''}${powerLevel.toFixed(1)}%</span>
            </div>
            <div class="data-row">
                <span class="data-label">EFFICIENCY:</span>
                <span class="data-value">${powerData.efficiency.toFixed(1)}%</span>
            </div>
            <div class="data-row">
                <span class="data-label">FUEL LEVEL:</span>
                <span class="data-value">${powerData.fuel.toFixed(1)}%</span>
            </div>
        `;
    }

    /**
     * Update life support quadrant
     */
    updateLifeSupportQuadrant(lifeSupportData) {
        const content = document.getElementById('life-support-content');
        const status = document.getElementById('life-support-status');
        
        if (!content || !status) return;

        // Determine life support status
        let statusClass = 'status-ok';
        if (lifeSupportData.oxygen < 90 || lifeSupportData.co2 > 20 || 
            lifeSupportData.pressure < 0.95 || lifeSupportData.pressure > 1.05) {
            statusClass = 'status-warning';
        }
        if (lifeSupportData.oxygen < 80 || lifeSupportData.co2 > 30) {
            statusClass = 'status-critical';
        }
        
        status.className = `status-indicator ${statusClass}`;

        content.innerHTML = `
            <div class="data-row">
                <span class="data-label">OXYGEN:</span>
                <span class="data-value">${lifeSupportData.oxygen.toFixed(1)}%</span>
            </div>
            <div class="data-row">
                <span class="data-label">CO2 LEVEL:</span>
                <span class="data-value">${lifeSupportData.co2.toFixed(1)} PPM</span>
            </div>
            <div class="data-row">
                <span class="data-label">PRESSURE:</span>
                <span class="data-value">${lifeSupportData.pressure.toFixed(2)} ATM</span>
            </div>
            <div class="data-row">
                <span class="data-label">TEMPERATURE:</span>
                <span class="data-value">${lifeSupportData.temperature.toFixed(1)}°C</span>
            </div>
        `;
    }

    /**
     * Update navigation quadrant
     */
    updateNavigationQuadrant(navigationData) {
        const content = document.getElementById('navigation-content');
        const status = document.getElementById('navigation-status');
        
        if (!content || !status) return;

        // Navigation is typically always operational
        status.className = 'status-indicator status-ok';

        content.innerHTML = `
            <div class="data-row">
                <span class="data-label">POSITION:</span>
                <span class="data-value">${navigationData.coordinates.x.toFixed(1)}, ${navigationData.coordinates.y.toFixed(1)}</span>
            </div>
            <div class="data-row">
                <span class="data-label">HEADING:</span>
                <span class="data-value">${navigationData.heading.toFixed(1)}°</span>
            </div>
            <div class="data-row">
                <span class="data-label">VELOCITY:</span>
                <span class="data-value">${navigationData.velocity.toFixed(3)} C</span>
            </div>
            <div class="data-row">
                <span class="data-label">DESTINATION:</span>
                <span class="data-value">${navigationData.destination}</span>
            </div>
        `;
    }

    /**
     * Update crew status quadrant
     */
    updateCrewQuadrant(crewData) {
        const content = document.getElementById('crew-content');
        const status = document.getElementById('crew-status');
        
        if (!content || !status) return;

        // Count crew by status
        const activeCrew = crewData.filter(member => member.status === 'active').length;
        const restingCrew = crewData.filter(member => member.status === 'resting').length;
        const totalCrew = crewData.length;

        // Determine crew status
        let statusClass = 'status-ok';
        if (activeCrew < totalCrew * 0.6) statusClass = 'status-warning';
        if (activeCrew < totalCrew * 0.4) statusClass = 'status-critical';
        
        status.className = `status-indicator ${statusClass}`;

        content.innerHTML = `
            <div class="data-row">
                <span class="data-label">TOTAL CREW:</span>
                <span class="data-value">${totalCrew}</span>
            </div>
            <div class="data-row">
                <span class="data-label">ACTIVE:</span>
                <span class="data-value">${activeCrew}</span>
            </div>
            <div class="data-row">
                <span class="data-label">RESTING:</span>
                <span class="data-value">${restingCrew}</span>
            </div>
            <div class="data-row">
                <span class="data-label">AVG VITALS:</span>
                <span class="data-value">NOMINAL</span>
            </div>
        `;
    }

    /**
     * Update system summary information
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
        overallStatus.className = `summary-value ${
            overallHealth === 'CRITICAL' ? 'status-critical' : 
            overallHealth === 'WARNING' ? 'status-warning' : 'status-ok'
        }`;
        
        alertCount.textContent = alerts.toString();
        alertCount.className = `summary-value ${alerts > 0 ? 'status-warning' : 'status-ok'}`;
    }

    /**
     * Update ship schematic system indicators
     */
    updateSchematicIndicators(systemData) {
        // Update life support indicator
        const lsIndicator = document.getElementById('schematic-life-support');
        if (lsIndicator) {
            let statusClass = 'status-ok';
            if (systemData.lifeSupport.oxygen < 90 || systemData.lifeSupport.co2 > 20) {
                statusClass = 'status-warning';
            }
            if (systemData.lifeSupport.oxygen < 80 || systemData.lifeSupport.co2 > 30) {
                statusClass = 'status-critical';
            }
            lsIndicator.className = `system-indicator clickable ${statusClass}`;
        }

        // Update power indicator
        const powerIndicator = document.getElementById('schematic-power');
        if (powerIndicator) {
            const powerLevel = systemData.power.generation - systemData.power.consumption;
            let statusClass = 'status-ok';
            if (powerLevel < 10) statusClass = 'status-warning';
            if (powerLevel < 0) statusClass = 'status-critical';
            powerIndicator.className = `system-indicator clickable ${statusClass}`;
        }

        // Update navigation indicator (typically always OK)
        const navIndicator = document.getElementById('schematic-navigation');
        if (navIndicator) {
            navIndicator.className = 'system-indicator clickable status-ok';
        }

        // Update crew indicator
        const crewIndicator = document.getElementById('schematic-crew');
        if (crewIndicator) {
            const activeCrew = systemData.crew.filter(member => member.status === 'active').length;
            const totalCrew = systemData.crew.length;
            let statusClass = 'status-ok';
            if (activeCrew < totalCrew * 0.6) statusClass = 'status-warning';
            if (activeCrew < totalCrew * 0.4) statusClass = 'status-critical';
            crewIndicator.className = `system-indicator clickable ${statusClass}`;
        }
    }

    /**
     * Set up click handlers for schematic system indicators
     */
    setupSchematicClickHandlers() {
        const indicators = document.querySelectorAll('.system-indicator.clickable');
        indicators.forEach(indicator => {
            indicator.addEventListener('click', (event) => {
                const system = event.target.dataset.system;
                if (system && window.router) {
                    window.router.goTo(system);
                }
            });
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NostromoDashboard;
} else {
    window.NostromoDashboard = NostromoDashboard;
}