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

        // Create component instances but defer initialization
        // Components need their container elements which only exist after render() creates the HTML structure
        this.shipSchematic = new ShipSchematicComponent('ship-schematic');
        this.powerQuadrant = new PowerQuadrant();
        this.lifeSupportQuadrant = new LifeSupportQuadrant();
        this.navigationQuadrant = new NavigationQuadrant();
        this.crewQuadrant = new CrewQuadrant();
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
                        <div id="alert-details" class="alert-details" style="display: none;">
                            <div class="alert-header">ACTIVE ALERTS:</div>
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

        // Initialize and render all components NOW that their container elements exist
        // Quadrant components have direct references to their container elements from init(),
        // so we don't need to copy content with ensureQuadrantContent()
        this.shipSchematic.init();
        this.shipSchematic.render();
        this.powerQuadrant.init();
        this.lifeSupportQuadrant.init();
        this.navigationQuadrant.init();
        this.crewQuadrant.init();

        // Update data initially
        this.updateData();

        // Re-attach console if it exists
        if (window.consoleSystem) {
            window.consoleSystem.init();
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
        const alertDetails = document.getElementById('alert-details');

        if (!overallStatus || !alertCount) return;

        // Calculate overall system health
        let alerts = 0;
        let overallHealth = 'OPERATIONAL';
        const alertMessages = [];
        const predictiveAlerts = [];

        // Check power status
        const powerLevel = systemData.power.generation - systemData.power.consumption;
        if (powerLevel < 0) {
            alerts++;
            overallHealth = 'CRITICAL';
            alertMessages.push('POWER DEFICIT: Consumption exceeds generation');
        } else if (powerLevel < 10) {
            alerts++;
            if (overallHealth === 'OPERATIONAL') overallHealth = 'WARNING';
            alertMessages.push('LOW POWER MARGIN: Monitor consumption');
        }

        // Check life support
        if (systemData.lifeSupport.oxygen < 80 || systemData.lifeSupport.co2 > 30) {
            alerts++;
            overallHealth = 'CRITICAL';
            alertMessages.push('LIFE SUPPORT CRITICAL: O2 low or CO2 high');
        } else if (systemData.lifeSupport.oxygen < 90 || systemData.lifeSupport.co2 > 20) {
            alerts++;
            if (overallHealth === 'OPERATIONAL') overallHealth = 'WARNING';
            alertMessages.push('LIFE SUPPORT WARNING: O2 marginal or CO2 elevated');
        }

        // Check navigation
        if (systemData.navigation.velocity < 0.1) {
            alerts++;
            if (overallHealth === 'OPERATIONAL') overallHealth = 'WARNING';
            alertMessages.push('NAVIGATION WARNING: Sub-optimal velocity');
        }

        // Check crew status
        const activeCrew = systemData.crew.filter(c => c.status === 'ACTIVE').length;
        if (activeCrew < 5) {
            alerts++;
            if (overallHealth === 'OPERATIONAL') overallHealth = 'WARNING';
            alertMessages.push('CREW STATUS: Below optimal active personnel');
        }

        // Add predictive alerts based on trends
        const predictivePowerAlert = this.checkPredictivePowerAlert(systemData);
        if (predictivePowerAlert) {
            predictiveAlerts.push(predictivePowerAlert);
        }

        const predictiveLifeSupportAlert = this.checkPredictiveLifeSupportAlert(systemData);
        if (predictiveLifeSupportAlert) {
            predictiveAlerts.push(predictiveLifeSupportAlert);
        }

        // Update display
        overallStatus.textContent = overallHealth;
        overallStatus.className = `summary-value ${overallHealth === 'CRITICAL' ? 'status-critical' :
            overallHealth === 'WARNING' ? 'status-warning' : 'status-ok'
            }`;

        alertCount.textContent = alerts.toString();
        alertCount.className = `summary-value ${alerts > 0 ? 'status-warning' : 'status-ok'}`;

        // Update alert details if element exists
        if (alertDetails) {
            let alertHTML = '';
            if (alerts > 0) {
                alertHTML += `<div class="alert-list">${alertMessages.map(msg => `<div class="alert-item">${msg}</div>`).join('')}</div>`;
            }
            if (predictiveAlerts.length > 0) {
                if (alerts > 0) {
                    alertHTML += `<div class="alert-divider"></div>`;
                }
                alertHTML += `<div class="predictive-alerts-header">PREDICTIVE ALERTS:</div>`;
                alertHTML += `<div class="alert-list">${predictiveAlerts.map(msg => `<div class="alert-item predictive">${msg}</div>`).join('')}</div>`;
            }
            alertDetails.innerHTML = alertHTML;
            alertDetails.style.display = (alerts > 0 || predictiveAlerts.length > 0) ? 'block' : 'none';
        }

        // Add trend indicators to system summary
        this.addTrendIndicators(systemData);
    }

    /**
     * Check for predictive power system alerts based on trends
     * @param {Object} systemData - Current system data
     * @returns {string|null} Predictive alert message or null
     */
    checkPredictivePowerAlert(systemData) {
        const powerTrend = this.dataSimulator.getTrend('power', 'generation');
        const consumptionTrend = this.dataSimulator.getTrend('power', 'consumption');
        
        // Predict power margin in 5 minutes based on current trends
        const currentMargin = systemData.power.generation - systemData.power.consumption;
        const predictedGeneration = systemData.power.generation + (powerTrend.change * 5); // 5 minutes ahead
        const predictedConsumption = systemData.power.consumption + (consumptionTrend.change * 5); // 5 minutes ahead
        const predictedMargin = predictedGeneration - predictedConsumption;
        
        if (predictedMargin < 0 && currentMargin >= 0) {
            return `PREDICTIVE: POWER DEFICIT EXPECTED IN ~5 MIN (Margin: ${predictedMargin.toFixed(1)}%)`;
        } else if (predictedMargin < 5 && currentMargin >= 5) {
            return `PREDICTIVE: LOW POWER MARGIN EXPECTED IN ~5 MIN (Margin: ${predictedMargin.toFixed(1)}%)`;
        }
        
        return null;
    }

    /**
     * Check for predictive life support alerts based on trends
     * @param {Object} systemData - Current system data
     * @returns {string|null} Predictive alert message or null
     */
    checkPredictiveLifeSupportAlert(systemData) {
        const oxygenTrend = this.dataSimulator.getTrend('lifeSupport', 'oxygen');
        const co2Trend = this.dataSimulator.getTrend('lifeSupport', 'co2');
        
        // Predict O2 levels in 10 minutes based on current trends
        const predictedO2 = systemData.lifeSupport.oxygen + (oxygenTrend.change * 10); // 10 minutes ahead
        const predictedCO2 = systemData.lifeSupport.co2 + (co2Trend.change * 10); // 10 minutes ahead
        
        if (predictedO2 < 85 && systemData.lifeSupport.oxygen >= 85) {
            return `PREDICTIVE: OXYGEN LEVEL MAY DROP BELOW SAFE THRESHOLD (~10 MIN: ${predictedO2.toFixed(1)}%)`;
        } else if (predictedCO2 > 25 && systemData.lifeSupport.co2 <= 25) {
            return `PREDICTIVE: CO2 LEVEL MAY RISE ABOVE SAFE THRESHOLD (~10 MIN: ${predictedCO2.toFixed(1)} PPM)`;
        }
        
        return null;
    }

    /**
     * Update ship schematic system indicators
     * @param {Object} systemData - Complete system status data
     */
    updateSchematicIndicators(systemData) {
        this.shipSchematic.update(systemData);
    }

    /**
     * Add trend indicators to system summary
     * @param {Object} systemData - Complete system status data
     */
    addTrendIndicators(systemData) {
        // Remove existing trend indicators
        const existingTrends = document.querySelectorAll('.trend-indicator');
        existingTrends.forEach(indicator => indicator.remove());

        const systemSummary = document.querySelector('.system-summary');
        if (!systemSummary) return;

        // Get trend data for key metrics
        const powerTrend = this.dataSimulator.getTrend('power', 'generation');
        const oxygenTrend = this.dataSimulator.getTrend('lifeSupport', 'oxygen');
        const fuelTrend = this.dataSimulator.getTrend('power', 'fuel');

        // Create trend indicator elements
        const trendContainer = document.createElement('div');
        trendContainer.className = 'trend-indicators';
        trendContainer.style.marginTop = '8px';
        trendContainer.style.fontSize = '11px';
        trendContainer.style.display = 'flex';
        trendContainer.style.gap = '12px';

        // Power trend
        const powerTrendEl = document.createElement('div');
        powerTrendEl.className = `trend-indicator power-trend ${powerTrend.trend}`;
        powerTrendEl.innerHTML = `<span class="trend-label">PWR:</span> <span class="trend-value">${powerTrend.direction === 'up' ? '↑' : powerTrend.direction === 'down' ? '↓' : '→'}</span> <span class="trend-change">${Math.abs(powerTrend.changePercent).toFixed(1)}%</span>`;
        trendContainer.appendChild(powerTrendEl);

        // Oxygen trend
        const oxygenTrendEl = document.createElement('div');
        oxygenTrendEl.className = `trend-indicator oxygen-trend ${oxygenTrend.trend}`;
        oxygenTrendEl.innerHTML = `<span class="trend-label">O2:</span> <span class="trend-value">${oxygenTrend.direction === 'up' ? '↑' : oxygenTrend.direction === 'down' ? '↓' : '→'}</span> <span class="trend-change">${Math.abs(oxygenTrend.changePercent).toFixed(1)}%</span>`;
        trendContainer.appendChild(oxygenTrendEl);

        // Fuel trend
        const fuelTrendEl = document.createElement('div');
        fuelTrendEl.className = `trend-indicator fuel-trend ${fuelTrend.trend}`;
        fuelTrendEl.innerHTML = `<span class="trend-label">FUEL:</span> <span class="trend-value">${fuelTrend.direction === 'up' ? '↑' : fuelTrend.direction === 'down' ? '↓' : '→'}</span> <span class="trend-change">${Math.abs(fuelTrend.changePercent).toFixed(1)}%</span>`;
        trendContainer.appendChild(fuelTrendEl);

        systemSummary.appendChild(trendContainer);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NostromoDashboard;
} else {
    window.NostromoDashboard = NostromoDashboard;
}