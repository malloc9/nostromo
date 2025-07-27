/**
 * Nostromo Engineering and Power Management Screen
 * Power distribution diagram, system-by-system consumption breakdown, and real-time monitoring
 */

class NostromoEngineering {
    constructor(dataSimulator) {
        this.dataSimulator = dataSimulator;
        this.refreshInterval = null;
        this.refreshRate = 2000; // 2 seconds for power monitoring
        this.isActive = false;
        this.historicalData = [];
        this.maxHistoryLength = 20; // Keep last 20 readings for trends
        this.powerSystems = this.initializePowerSystems();
        this.alertThresholds = this.initializeAlertThresholds();
        
        this.init();
    }

    init() {
        console.log('Engineering system initialized');
    }

    /**
     * Initialize power system definitions with consumption data
     */
    initializePowerSystems() {
        return [
            { 
                id: 'LIFE_SUPPORT', 
                name: 'LIFE SUPPORT', 
                baseConsumption: 25, 
                priority: 'CRITICAL',
                status: 'OPERATIONAL'
            },
            { 
                id: 'NAVIGATION', 
                name: 'NAVIGATION', 
                baseConsumption: 15, 
                priority: 'HIGH',
                status: 'OPERATIONAL'
            },
            { 
                id: 'PROPULSION', 
                name: 'PROPULSION', 
                baseConsumption: 20, 
                priority: 'HIGH',
                status: 'OPERATIONAL'
            },
            { 
                id: 'COMMUNICATIONS', 
                name: 'COMMUNICATIONS', 
                baseConsumption: 8, 
                priority: 'MEDIUM',
                status: 'OPERATIONAL'
            },
            { 
                id: 'LIGHTING', 
                name: 'LIGHTING', 
                baseConsumption: 12, 
                priority: 'MEDIUM',
                status: 'OPERATIONAL'
            },
            { 
                id: 'COMPUTER', 
                name: 'COMPUTER CORE', 
                baseConsumption: 18, 
                priority: 'HIGH',
                status: 'OPERATIONAL'
            },
            { 
                id: 'ARTIFICIAL_GRAVITY', 
                name: 'ARTIFICIAL GRAVITY', 
                baseConsumption: 22, 
                priority: 'CRITICAL',
                status: 'OPERATIONAL'
            }
        ];
    }

    /**
     * Initialize alert thresholds for power management
     */
    initializeAlertThresholds() {
        return {
            generation: {
                warning: 70,
                critical: 50
            },
            consumption: {
                warning: 85,
                critical: 95
            },
            efficiency: {
                warning: 75,
                critical: 60
            },
            fuel: {
                warning: 25,
                critical: 10
            },
            netPower: {
                warning: 10,
                critical: 0
            }
        };
    }

    /**
     * Activate engineering screen and start real-time updates
     */
    activate() {
        this.isActive = true;
        this.render();
        this.startRealTimeUpdates();
        console.log('Engineering system activated');
    }

    /**
     * Deactivate engineering screen and stop updates
     */
    deactivate() {
        this.isActive = false;
        this.stopRealTimeUpdates();
        console.log('Engineering system deactivated');
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
     * Render the complete engineering screen layout
     */
    render() {
        const engineeringScreen = document.getElementById('engineering-screen');
        if (!engineeringScreen) {
            console.error('Engineering screen element not found');
            return;
        }

        const screenContent = engineeringScreen.querySelector('.screen-content');
        if (!screenContent) {
            console.error('Engineering screen content not found');
            return;
        }

        screenContent.innerHTML = this.generateEngineeringHTML();
        this.updateData();
    }

    /**
     * Generate the complete engineering HTML structure
     */
    generateEngineeringHTML() {
        return `
            <div class="engineering-container">
                <!-- Power Generation Overview -->
                <div class="power-overview-section">
                    <div class="section-header">POWER GENERATION & DISTRIBUTION</div>
                    <div class="power-metrics-grid">
                        <div class="power-metric" id="generation-metric">
                            <div class="metric-header">
                                <span class="metric-title">GENERATION</span>
                                <span class="metric-status" id="generation-status">●</span>
                            </div>
                            <div class="metric-display">
                                <div class="metric-value" id="generation-value">--.--%</div>
                                <div class="metric-bar" id="generation-bar"></div>
                            </div>
                        </div>

                        <div class="power-metric" id="consumption-metric">
                            <div class="metric-header">
                                <span class="metric-title">CONSUMPTION</span>
                                <span class="metric-status" id="consumption-status">●</span>
                            </div>
                            <div class="metric-display">
                                <div class="metric-value" id="consumption-value">--.--%</div>
                                <div class="metric-bar" id="consumption-bar"></div>
                            </div>
                        </div>

                        <div class="power-metric" id="efficiency-metric">
                            <div class="metric-header">
                                <span class="metric-title">EFFICIENCY</span>
                                <span class="metric-status" id="efficiency-status">●</span>
                            </div>
                            <div class="metric-display">
                                <div class="metric-value" id="efficiency-value">--.--%</div>
                                <div class="metric-bar" id="efficiency-bar"></div>
                            </div>
                        </div>

                        <div class="power-metric" id="fuel-metric">
                            <div class="metric-header">
                                <span class="metric-title">FUEL LEVEL</span>
                                <span class="metric-status" id="fuel-status">●</span>
                            </div>
                            <div class="metric-display">
                                <div class="metric-value" id="fuel-value">--.--%</div>
                                <div class="metric-bar" id="fuel-bar"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Power Distribution Diagram -->
                <div class="power-diagram-section">
                    <div class="section-header">POWER DISTRIBUTION GRID</div>
                    <div class="power-diagram" id="power-diagram">
                        ${this.generatePowerDiagram()}
                    </div>
                </div>

                <!-- System Power Consumption -->
                <div class="system-consumption-section">
                    <div class="section-header">SYSTEM POWER CONSUMPTION</div>
                    <div class="consumption-grid" id="consumption-grid">
                        ${this.generateConsumptionGrid()}
                    </div>
                </div>

                <!-- Power Status Summary -->
                <div class="power-summary-section">
                    <div class="section-header">POWER STATUS SUMMARY</div>
                    <div class="summary-display" id="power-summary">
                        <div class="summary-item">
                            <span class="summary-label">NET POWER:</span>
                            <span class="summary-value" id="net-power-value">+--.--%</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">GRID STATUS:</span>
                            <span class="summary-value" id="grid-status">STABLE</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">LAST UPDATE:</span>
                            <span class="summary-value" id="power-last-update">--:--:--</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">ALERTS:</span>
                            <span class="summary-value" id="power-alert-count">0</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } 
   /**
     * Generate ASCII power distribution diagram
     */
    generatePowerDiagram() {
        return `
            <pre class="power-grid-ascii">
                    POWER GENERATION CORE
                         ╔═══════════╗
                         ║ ████████  ║
                         ║ REACTOR   ║
                         ║ ████████  ║
                         ╚═════╤═════╝
                               │
                    ┌──────────┼──────────┐
                    │          │          │
              ╔═════▼═════╗    │    ╔═════▼═════╗
              ║ BACKUP    ║    │    ║ AUXILIARY ║
              ║ GENERATOR ║    │    ║ POWER     ║
              ╚═════╤═════╝    │    ╚═════╤═════╝
                    │          │          │
                    └──────────┼──────────┘
                               │
                    ╔══════════▼══════════╗
                    ║   MAIN POWER BUS    ║
                    ╚══╤══╤══╤══╤══╤══╤══╝
                       │  │  │  │  │  │
                 ┌─────┘  │  │  │  │  └─────┐
                 │        │  │  │  │        │
            <span class="system-node" id="node-life-support">LS</span>       <span class="system-node" id="node-navigation">NAV</span> <span class="system-node" id="node-propulsion">PROP</span> <span class="system-node" id="node-computer">COMP</span>      <span class="system-node" id="node-gravity">GRAV</span>
                 │        │  │  │  │        │
            LIFE SUPP  NAV PROP COMP    ARTIF GRAV
                 │        │  │  │  │        │
            <span class="power-flow" id="flow-life-support">████</span>     <span class="power-flow" id="flow-navigation">███</span> <span class="power-flow" id="flow-propulsion">████</span> <span class="power-flow" id="flow-computer">███</span>     <span class="power-flow" id="flow-gravity">████</span>
                 │        │  │  │  │        │
                 └────────┼──┼──┼──┼────────┘
                          │  │  │  │
                     ┌────┘  │  │  └────┐
                     │       │  │       │
                <span class="system-node" id="node-communications">COMM</span>    <span class="system-node" id="node-lighting">LIGHT</span>    <span class="system-node" id="node-other">OTHER</span>
                     │       │  │       │
                COMMUNIC  LIGHTING   OTHER SYS
                     │       │  │       │
                <span class="power-flow" id="flow-communications">██</span>      <span class="power-flow" id="flow-lighting">███</span>      <span class="power-flow" id="flow-other">██</span>
            </pre>
        `;
    }

    /**
     * Generate system consumption grid
     */
    generateConsumptionGrid() {
        return this.powerSystems.map(system => `
            <div class="consumption-item" id="consumption-${system.id.toLowerCase()}">
                <div class="system-info">
                    <div class="system-name">${system.name}</div>
                    <div class="system-priority priority-${system.priority.toLowerCase()}">${system.priority}</div>
                </div>
                <div class="consumption-display">
                    <div class="consumption-value" id="consumption-value-${system.id.toLowerCase()}">--%</div>
                    <div class="consumption-bar" id="consumption-bar-${system.id.toLowerCase()}"></div>
                </div>
                <div class="system-status">
                    <span class="status-indicator" id="status-${system.id.toLowerCase()}">●</span>
                    <span class="status-text" id="status-text-${system.id.toLowerCase()}">${system.status}</span>
                </div>
            </div>
        `).join('');
    }

    /**
     * Update all engineering data
     */
    updateData() {
        if (!this.dataSimulator) {
            console.warn('Data simulator not available');
            return;
        }

        const systemData = this.dataSimulator.generateSystemStatus();
        const powerData = systemData.power;
        
        // Store historical data
        this.storeHistoricalData(powerData);
        
        // Update power metrics
        this.updatePowerMetrics(powerData);
        
        // Update power diagram
        this.updatePowerDiagram(powerData);
        
        // Update system consumption
        this.updateSystemConsumption(powerData);
        
        // Update power summary
        this.updatePowerSummary(powerData);
    }

    /**
     * Store data for trend analysis
     */
    storeHistoricalData(data) {
        const timestamp = Date.now();
        this.historicalData.push({
            timestamp,
            ...data
        });
        
        // Keep only recent data
        if (this.historicalData.length > this.maxHistoryLength) {
            this.historicalData.shift();
        }
    }

    /**
     * Update power metrics display
     */
    updatePowerMetrics(powerData) {
        // Update generation
        this.updatePowerMetric('generation', powerData.generation, '%', 0, 100);
        
        // Update consumption
        this.updatePowerMetric('consumption', powerData.consumption, '%', 0, 100);
        
        // Update efficiency
        this.updatePowerMetric('efficiency', powerData.efficiency, '%', 0, 100);
        
        // Update fuel
        this.updatePowerMetric('fuel', powerData.fuel, '%', 0, 100);
    }

    /**
     * Update individual power metric
     */
    updatePowerMetric(metric, value, unit, min, max) {
        const valueElement = document.getElementById(`${metric}-value`);
        const statusElement = document.getElementById(`${metric}-status`);
        const barElement = document.getElementById(`${metric}-bar`);
        
        if (!valueElement || !statusElement || !barElement) return;

        // Update value display
        valueElement.textContent = `${value.toFixed(1)}${unit}`;
        
        // Determine status
        const status = this.getPowerMetricStatus(metric, value);
        statusElement.className = `metric-status ${status}`;
        
        // Update ASCII bar chart
        const percentage = ((value - min) / (max - min)) * 100;
        barElement.innerHTML = this.generateASCIIBar(percentage, status);
    }

    /**
     * Get power metric status based on thresholds
     */
    getPowerMetricStatus(metric, value) {
        const thresholds = this.alertThresholds[metric];
        if (!thresholds) return 'status-ok';
        
        switch (metric) {
            case 'generation':
            case 'efficiency':
            case 'fuel':
                if (value < thresholds.critical) return 'status-critical';
                if (value < thresholds.warning) return 'status-warning';
                return 'status-ok';
                
            case 'consumption':
                if (value > thresholds.critical) return 'status-critical';
                if (value > thresholds.warning) return 'status-warning';
                return 'status-ok';
                
            default:
                return 'status-ok';
        }
    }

    /**
     * Generate ASCII horizontal bar chart
     */
    generateASCIIBar(percentage, status) {
        const barWidth = 20;
        const filledBars = Math.round((percentage / 100) * barWidth);
        const emptyBars = barWidth - filledBars;
        
        const filled = '█'.repeat(filledBars);
        const empty = '░'.repeat(emptyBars);
        
        return `
            <div class="ascii-bar ${status}">
                <span class="bar-filled">${filled}</span><span class="bar-empty">${empty}</span>
                <span class="bar-percentage">${percentage.toFixed(1)}%</span>
            </div>
        `;
    }

    /**
     * Update power distribution diagram
     */
    updatePowerDiagram(powerData) {
        // Update system nodes based on power status
        this.powerSystems.forEach(system => {
            const nodeElement = document.getElementById(`node-${system.id.toLowerCase().replace('_', '-')}`);
            const flowElement = document.getElementById(`flow-${system.id.toLowerCase().replace('_', '-')}`);
            
            if (nodeElement) {
                // Calculate system consumption as percentage of total
                const systemConsumption = this.calculateSystemConsumption(system, powerData);
                const status = this.getSystemPowerStatus(systemConsumption);
                nodeElement.className = `system-node ${status}`;
            }
            
            if (flowElement) {
                // Update power flow visualization
                const systemConsumption = this.calculateSystemConsumption(system, powerData);
                const flowIntensity = Math.round((systemConsumption / 30) * 4); // Scale to 0-4
                const flowChars = '█'.repeat(Math.max(1, flowIntensity)) + '░'.repeat(Math.max(0, 4 - flowIntensity));
                flowElement.textContent = flowChars;
                
                const status = this.getSystemPowerStatus(systemConsumption);
                flowElement.className = `power-flow ${status}`;
            }
        });
    }

    /**
     * Calculate individual system power consumption
     */
    calculateSystemConsumption(system, powerData) {
        // Base consumption with some variation based on total consumption
        const variation = (powerData.consumption - 72) / 72; // Relative to base consumption
        const systemConsumption = system.baseConsumption * (1 + variation * 0.2);
        
        // Add some random fluctuation
        const fluctuation = (Math.random() - 0.5) * 0.1;
        return Math.max(0, systemConsumption * (1 + fluctuation));
    }

    /**
     * Get system power status
     */
    getSystemPowerStatus(consumption) {
        if (consumption > 25) return 'status-critical';
        if (consumption > 20) return 'status-warning';
        return 'status-ok';
    }

    /**
     * Update system consumption display
     */
    updateSystemConsumption(powerData) {
        this.powerSystems.forEach(system => {
            const consumption = this.calculateSystemConsumption(system, powerData);
            
            // Update consumption value
            const valueElement = document.getElementById(`consumption-value-${system.id.toLowerCase()}`);
            if (valueElement) {
                valueElement.textContent = `${consumption.toFixed(1)}%`;
            }
            
            // Update consumption bar
            const barElement = document.getElementById(`consumption-bar-${system.id.toLowerCase()}`);
            if (barElement) {
                const status = this.getSystemPowerStatus(consumption);
                const percentage = (consumption / 30) * 100; // Scale to 0-100%
                barElement.innerHTML = this.generateASCIIBar(percentage, status);
            }
            
            // Update system status
            const statusElement = document.getElementById(`status-${system.id.toLowerCase()}`);
            const statusTextElement = document.getElementById(`status-text-${system.id.toLowerCase()}`);
            
            if (statusElement && statusTextElement) {
                const status = this.getSystemPowerStatus(consumption);
                statusElement.className = `status-indicator ${status}`;
                
                let statusText = 'OPERATIONAL';
                if (status === 'status-warning') statusText = 'HIGH LOAD';
                if (status === 'status-critical') statusText = 'OVERLOAD';
                
                statusTextElement.textContent = statusText;
            }
        });
    }

    /**
     * Update power summary display
     */
    updatePowerSummary(powerData) {
        // Update net power
        const netPowerElement = document.getElementById('net-power-value');
        if (netPowerElement) {
            const netPower = powerData.generation - powerData.consumption;
            const sign = netPower >= 0 ? '+' : '';
            netPowerElement.textContent = `${sign}${netPower.toFixed(1)}%`;
            
            const status = this.getPowerMetricStatus('netPower', netPower);
            netPowerElement.className = `summary-value ${status}`;
        }
        
        // Update grid status
        const gridStatusElement = document.getElementById('grid-status');
        if (gridStatusElement) {
            const netPower = powerData.generation - powerData.consumption;
            let gridStatus = 'STABLE';
            let statusClass = 'status-ok';
            
            if (netPower < 0) {
                gridStatus = 'CRITICAL';
                statusClass = 'status-critical';
            } else if (netPower < 10) {
                gridStatus = 'UNSTABLE';
                statusClass = 'status-warning';
            }
            
            gridStatusElement.textContent = gridStatus;
            gridStatusElement.className = `summary-value ${statusClass}`;
        }
        
        // Update last update time
        const lastUpdateElement = document.getElementById('power-last-update');
        if (lastUpdateElement) {
            const now = new Date();
            lastUpdateElement.textContent = now.toTimeString().substring(0, 8);
        }
        
        // Update alert count
        const alertCountElement = document.getElementById('power-alert-count');
        if (alertCountElement) {
            const alerts = this.calculatePowerAlerts(powerData);
            alertCountElement.textContent = alerts.toString();
            alertCountElement.className = `summary-value ${alerts > 0 ? 'status-warning' : 'status-ok'}`;
        }
    }

    /**
     * Calculate number of power-related alerts
     */
    calculatePowerAlerts(powerData) {
        let alerts = 0;
        
        // Check generation
        if (powerData.generation < this.alertThresholds.generation.critical) alerts++;
        else if (powerData.generation < this.alertThresholds.generation.warning) alerts++;
        
        // Check consumption
        if (powerData.consumption > this.alertThresholds.consumption.critical) alerts++;
        else if (powerData.consumption > this.alertThresholds.consumption.warning) alerts++;
        
        // Check efficiency
        if (powerData.efficiency < this.alertThresholds.efficiency.critical) alerts++;
        else if (powerData.efficiency < this.alertThresholds.efficiency.warning) alerts++;
        
        // Check fuel
        if (powerData.fuel < this.alertThresholds.fuel.critical) alerts++;
        else if (powerData.fuel < this.alertThresholds.fuel.warning) alerts++;
        
        // Check net power
        const netPower = powerData.generation - powerData.consumption;
        if (netPower <= this.alertThresholds.netPower.critical) alerts++;
        else if (netPower <= this.alertThresholds.netPower.warning) alerts++;
        
        return alerts;
    }

    /**
     * Get current power data for external use
     */
    getCurrentPowerData() {
        if (!this.dataSimulator) return null;
        return this.dataSimulator.generateSystemStatus().power;
    }

    /**
     * Validate power calculations
     */
    validatePowerCalculations(powerData) {
        const errors = [];
        
        // Validate generation
        if (typeof powerData.generation !== 'number' || powerData.generation < 0 || powerData.generation > 100) {
            errors.push('Invalid power generation value');
        }
        
        // Validate consumption
        if (typeof powerData.consumption !== 'number' || powerData.consumption < 0 || powerData.consumption > 100) {
            errors.push('Invalid power consumption value');
        }
        
        // Validate efficiency
        if (typeof powerData.efficiency !== 'number' || powerData.efficiency < 0 || powerData.efficiency > 100) {
            errors.push('Invalid power efficiency value');
        }
        
        // Validate fuel
        if (typeof powerData.fuel !== 'number' || powerData.fuel < 0 || powerData.fuel > 100) {
            errors.push('Invalid fuel level value');
        }
        
        // Validate net power calculation
        const calculatedNetPower = powerData.generation - powerData.consumption;
        if (powerData.netPower !== undefined && Math.abs(powerData.netPower - calculatedNetPower) > 0.1) {
            errors.push('Net power calculation mismatch');
        }
        
        return errors;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NostromoEngineering;
} else {
    window.NostromoEngineering = NostromoEngineering;
}