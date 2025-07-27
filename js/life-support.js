/**
 * Nostromo Life Support Monitoring Screen
 * Environmental data tables, trend displays, and zone-based status monitoring
 */

class NostromoLifeSupport {
    constructor(dataSimulator) {
        this.dataSimulator = dataSimulator;
        this.refreshInterval = null;
        this.refreshRate = 2000; // 2 seconds for life support monitoring
        this.isActive = false;
        this.historicalData = [];
        this.maxHistoryLength = 20; // Keep last 20 readings for trends
        this.alertThresholds = this.initializeAlertThresholds();
        this.zones = this.initializeZones();
        
        this.init();
    }

    init() {
        console.log('Life Support system initialized');
    }

    /**
     * Initialize critical alert thresholds for life support systems
     */
    initializeAlertThresholds() {
        return {
            oxygen: {
                critical: 80,
                warning: 90
            },
            co2: {
                warning: 20,
                critical: 30
            },
            pressure: {
                warningLow: 0.95,
                warningHigh: 1.05,
                criticalLow: 0.90,
                criticalHigh: 1.10
            },
            temperature: {
                warningLow: 19,
                warningHigh: 23,
                criticalLow: 18,
                criticalHigh: 24
            }
        };
    }

    /**
     * Initialize ship zone data for environmental monitoring
     */
    initializeZones() {
        return [
            { id: 'BRIDGE', name: 'BRIDGE', priority: 'HIGH' },
            { id: 'ENGINE', name: 'ENGINE ROOM', priority: 'HIGH' },
            { id: 'QUARTERS', name: 'CREW QUARTERS', priority: 'MEDIUM' },
            { id: 'CARGO', name: 'CARGO BAY', priority: 'LOW' },
            { id: 'MAINTENANCE', name: 'MAINTENANCE', priority: 'MEDIUM' },
            { id: 'SCIENCE', name: 'SCIENCE LAB', priority: 'MEDIUM' }
        ];
    }

    /**
     * Activate life support monitoring and start real-time updates
     */
    activate() {
        this.isActive = true;
        this.render();
        this.startRealTimeUpdates();
        console.log('Life Support monitoring activated');
    }

    /**
     * Deactivate life support monitoring and stop updates
     */
    deactivate() {
        this.isActive = false;
        this.stopRealTimeUpdates();
        console.log('Life Support monitoring deactivated');
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
     * Render the complete life support monitoring layout
     */
    render() {
        const lifeSupportScreen = document.getElementById('life-support-screen');
        if (!lifeSupportScreen) {
            console.error('Life Support screen element not found');
            return;
        }

        const screenContent = lifeSupportScreen.querySelector('.screen-content');
        if (!screenContent) {
            console.error('Life Support screen content not found');
            return;
        }

        screenContent.innerHTML = this.generateLifeSupportHTML();
        this.updateData();
    }

    /**
     * Generate the complete life support HTML structure
     */
    generateLifeSupportHTML() {
        return `
            <div class="life-support-container">
                <!-- Environmental Status Overview -->
                <div class="environmental-overview">
                    <div class="section-header">ENVIRONMENTAL STATUS OVERVIEW</div>
                    <div class="env-metrics-grid">
                        <div class="metric-panel" id="oxygen-panel">
                            <div class="metric-header">
                                <span class="metric-title">OXYGEN LEVEL</span>
                                <span class="metric-status" id="oxygen-status">●</span>
                            </div>
                            <div class="metric-display">
                                <div class="metric-value" id="oxygen-value">--.--%</div>
                                <div class="metric-bar" id="oxygen-bar"></div>
                            </div>
                        </div>

                        <div class="metric-panel" id="co2-panel">
                            <div class="metric-header">
                                <span class="metric-title">CO2 LEVEL</span>
                                <span class="metric-status" id="co2-status">●</span>
                            </div>
                            <div class="metric-display">
                                <div class="metric-value" id="co2-value">-- PPM</div>
                                <div class="metric-bar" id="co2-bar"></div>
                            </div>
                        </div>

                        <div class="metric-panel" id="pressure-panel">
                            <div class="metric-header">
                                <span class="metric-title">PRESSURE</span>
                                <span class="metric-status" id="pressure-status">●</span>
                            </div>
                            <div class="metric-display">
                                <div class="metric-value" id="pressure-value">-.-- ATM</div>
                                <div class="metric-bar" id="pressure-bar"></div>
                            </div>
                        </div>

                        <div class="metric-panel" id="temperature-panel">
                            <div class="metric-header">
                                <span class="metric-title">TEMPERATURE</span>
                                <span class="metric-status" id="temperature-status">●</span>
                            </div>
                            <div class="metric-display">
                                <div class="metric-value" id="temperature-value">--.-°C</div>
                                <div class="metric-bar" id="temperature-bar"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Zone Status Grid -->
                <div class="zone-status-section">
                    <div class="section-header">ZONE ENVIRONMENTAL STATUS</div>
                    <div class="zone-grid" id="zone-grid">
                        ${this.generateZoneGridHTML()}
                    </div>
                </div>

                <!-- Trend Analysis -->
                <div class="trend-section">
                    <div class="section-header">ENVIRONMENTAL TRENDS</div>
                    <div class="trend-display" id="trend-display">
                        <div class="trend-chart" id="trend-chart">
                            <div class="chart-loading">COLLECTING TREND DATA...</div>
                        </div>
                    </div>
                </div>

                <!-- Alert Panel -->
                <div class="alert-section">
                    <div class="section-header">
                        SYSTEM ALERTS
                        <span class="alert-count" id="alert-count">0</span>
                    </div>
                    <div class="alert-panel" id="alert-panel">
                        <div class="no-alerts">NO ACTIVE ALERTS</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate zone status grid HTML
     */
    generateZoneGridHTML() {
        return this.zones.map(zone => `
            <div class="zone-item" id="zone-${zone.id.toLowerCase()}">
                <div class="zone-header">
                    <span class="zone-name">${zone.name}</span>
                    <span class="zone-priority priority-${zone.priority.toLowerCase()}">${zone.priority}</span>
                </div>
                <div class="zone-status">
                    <div class="zone-metric">
                        <span class="zone-label">O2:</span>
                        <span class="zone-value" id="zone-${zone.id.toLowerCase()}-oxygen">--%</span>
                    </div>
                    <div class="zone-metric">
                        <span class="zone-label">CO2:</span>
                        <span class="zone-value" id="zone-${zone.id.toLowerCase()}-co2">--</span>
                    </div>
                    <div class="zone-metric">
                        <span class="zone-label">TEMP:</span>
                        <span class="zone-value" id="zone-${zone.id.toLowerCase()}-temp">--°C</span>
                    </div>
                    <div class="zone-indicator" id="zone-${zone.id.toLowerCase()}-indicator">●</div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Update all life support data
     */
    updateData() {
        if (!this.dataSimulator) {
            console.warn('Data simulator not available');
            return;
        }

        const systemData = this.dataSimulator.generateSystemStatus();
        const lifeSupportData = systemData.lifeSupport;
        
        // Store historical data for trends
        this.storeHistoricalData(lifeSupportData);
        
        // Update main environmental metrics
        this.updateEnvironmentalMetrics(lifeSupportData);
        
        // Update zone status
        this.updateZoneStatus(lifeSupportData);
        
        // Update trend display
        this.updateTrendDisplay();
        
        // Check and update alerts
        this.updateAlerts(lifeSupportData);
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
     * Update main environmental metrics display
     */
    updateEnvironmentalMetrics(data) {
        // Update oxygen
        this.updateMetricPanel('oxygen', data.oxygen, '%', 0, 100);
        
        // Update CO2
        this.updateMetricPanel('co2', data.co2, 'PPM', 0, 50);
        
        // Update pressure
        this.updateMetricPanel('pressure', data.pressure, 'ATM', 0.8, 1.2);
        
        // Update temperature
        this.updateMetricPanel('temperature', data.temperature, '°C', 18, 24);
    }

    /**
     * Update individual metric panel
     */
    updateMetricPanel(metric, value, unit, min, max) {
        const valueElement = document.getElementById(`${metric}-value`);
        const statusElement = document.getElementById(`${metric}-status`);
        const barElement = document.getElementById(`${metric}-bar`);
        
        if (!valueElement || !statusElement || !barElement) return;

        // Update value display
        const formattedValue = metric === 'pressure' ? value.toFixed(2) : value.toFixed(1);
        valueElement.textContent = `${formattedValue}${unit}`;
        
        // Determine status
        const status = this.getMetricStatus(metric, value);
        statusElement.className = `metric-status ${status}`;
        
        // Update ASCII bar chart
        const percentage = ((value - min) / (max - min)) * 100;
        barElement.innerHTML = this.generateASCIIBar(percentage, status);
    }

    /**
     * Get metric status based on thresholds
     */
    getMetricStatus(metric, value) {
        const thresholds = this.alertThresholds[metric];
        
        switch (metric) {
            case 'oxygen':
                if (value < thresholds.critical) return 'status-critical';
                if (value < thresholds.warning) return 'status-warning';
                return 'status-ok';
                
            case 'co2':
                if (value > thresholds.critical) return 'status-critical';
                if (value > thresholds.warning) return 'status-warning';
                return 'status-ok';
                
            case 'pressure':
                if (value < thresholds.criticalLow || value > thresholds.criticalHigh) return 'status-critical';
                if (value < thresholds.warningLow || value > thresholds.warningHigh) return 'status-warning';
                return 'status-ok';
                
            case 'temperature':
                if (value < thresholds.criticalLow || value > thresholds.criticalHigh) return 'status-critical';
                if (value < thresholds.warningLow || value > thresholds.warningHigh) return 'status-warning';
                return 'status-ok';
                
            default:
                return 'status-ok';
        }
    }

    /**
     * Generate ASCII bar chart
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
     * Update zone status display
     */
    updateZoneStatus(baseData) {
        this.zones.forEach(zone => {
            // Generate slight variations for each zone
            const zoneData = this.generateZoneVariation(baseData, zone);
            
            // Update zone display
            const oxygenElement = document.getElementById(`zone-${zone.id.toLowerCase()}-oxygen`);
            const co2Element = document.getElementById(`zone-${zone.id.toLowerCase()}-co2`);
            const tempElement = document.getElementById(`zone-${zone.id.toLowerCase()}-temp`);
            const indicatorElement = document.getElementById(`zone-${zone.id.toLowerCase()}-indicator`);
            
            if (oxygenElement) oxygenElement.textContent = `${zoneData.oxygen.toFixed(1)}%`;
            if (co2Element) co2Element.textContent = `${zoneData.co2.toFixed(1)}`;
            if (tempElement) tempElement.textContent = `${zoneData.temperature.toFixed(1)}°C`;
            
            // Update zone indicator
            if (indicatorElement) {
                const worstStatus = this.getWorstZoneStatus(zoneData);
                indicatorElement.className = `zone-indicator ${worstStatus}`;
            }
        });
    }

    /**
     * Generate zone-specific environmental variations
     */
    generateZoneVariation(baseData, zone) {
        // Create realistic variations based on zone type
        const variations = {
            'BRIDGE': { oxygen: 0, co2: -1, temperature: -0.5 },
            'ENGINE': { oxygen: -2, co2: 3, temperature: 2.0 },
            'QUARTERS': { oxygen: 1, co2: 1, temperature: 0.5 },
            'CARGO': { oxygen: -1, co2: 0, temperature: -1.0 },
            'MAINTENANCE': { oxygen: -1, co2: 2, temperature: 1.0 },
            'SCIENCE': { oxygen: 0, co2: -0.5, temperature: 0 }
        };
        
        const variation = variations[zone.id] || { oxygen: 0, co2: 0, temperature: 0 };
        
        return {
            oxygen: Math.max(0, Math.min(100, baseData.oxygen + variation.oxygen)),
            co2: Math.max(0, Math.min(50, baseData.co2 + variation.co2)),
            temperature: Math.max(15, Math.min(30, baseData.temperature + variation.temperature)),
            pressure: baseData.pressure // Pressure is consistent ship-wide
        };
    }

    /**
     * Get worst status among zone metrics
     */
    getWorstZoneStatus(zoneData) {
        const statuses = [
            this.getMetricStatus('oxygen', zoneData.oxygen),
            this.getMetricStatus('co2', zoneData.co2),
            this.getMetricStatus('temperature', zoneData.temperature)
        ];
        
        if (statuses.includes('status-critical')) return 'status-critical';
        if (statuses.includes('status-warning')) return 'status-warning';
        return 'status-ok';
    }

    /**
     * Update trend display with ASCII chart
     */
    updateTrendDisplay() {
        const trendChart = document.getElementById('trend-chart');
        if (!trendChart || this.historicalData.length < 3) {
            return;
        }

        trendChart.innerHTML = this.generateTrendChart();
    }

    /**
     * Generate ASCII trend chart
     */
    generateTrendChart() {
        if (this.historicalData.length < 3) {
            return '<div class="chart-loading">COLLECTING TREND DATA...</div>';
        }

        const chartHeight = 8;
        const chartWidth = 40;
        
        // Get oxygen trend data (most critical metric)
        const oxygenData = this.historicalData.map(d => d.oxygen);
        const minValue = Math.min(...oxygenData);
        const maxValue = Math.max(...oxygenData);
        const range = maxValue - minValue || 1;
        
        let chart = '<div class="trend-chart-ascii">\n';
        chart += '<div class="chart-title">OXYGEN LEVEL TREND (LAST 20 READINGS)</div>\n';
        chart += '<pre class="chart-display">\n';
        
        // Generate chart lines
        for (let y = chartHeight - 1; y >= 0; y--) {
            let line = '';
            const threshold = minValue + (range * y / (chartHeight - 1));
            
            for (let x = 0; x < Math.min(chartWidth, oxygenData.length); x++) {
                const dataIndex = Math.max(0, oxygenData.length - chartWidth + x);
                const value = oxygenData[dataIndex];
                
                if (Math.abs(value - threshold) < range / (chartHeight * 2)) {
                    line += '█';
                } else if (value > threshold) {
                    line += ' ';
                } else {
                    line += '░';
                }
            }
            
            const label = threshold.toFixed(1).padStart(5);
            chart += `${label}│${line}\n`;
        }
        
        // Add bottom axis
        chart += '     └' + '─'.repeat(Math.min(chartWidth, oxygenData.length)) + '\n';
        chart += '      ' + 'TIME →'.padStart(Math.min(chartWidth, oxygenData.length) / 2) + '\n';
        
        chart += '</pre>\n';
        chart += '</div>';
        
        return chart;
    }

    /**
     * Update alerts based on current data
     */
    updateAlerts(data) {
        const alerts = this.generateAlerts(data);
        const alertPanel = document.getElementById('alert-panel');
        const alertCount = document.getElementById('alert-count');
        
        if (!alertPanel || !alertCount) return;

        alertCount.textContent = alerts.length.toString();
        alertCount.className = `alert-count ${alerts.length > 0 ? 'has-alerts' : ''}`;
        
        if (alerts.length === 0) {
            alertPanel.innerHTML = '<div class="no-alerts">NO ACTIVE ALERTS</div>';
        } else {
            alertPanel.innerHTML = alerts.map(alert => `
                <div class="alert-item ${alert.severity}">
                    <span class="alert-icon">⚠</span>
                    <span class="alert-message">${alert.message}</span>
                    <span class="alert-time">${alert.time}</span>
                </div>
            `).join('');
        }
    }

    /**
     * Generate alerts based on current environmental data
     */
    generateAlerts(data) {
        const alerts = [];
        const currentTime = new Date().toTimeString().substring(0, 8);
        
        // Check oxygen levels
        if (data.oxygen < this.alertThresholds.oxygen.critical) {
            alerts.push({
                severity: 'alert-critical',
                message: `CRITICAL: OXYGEN LEVEL AT ${data.oxygen.toFixed(1)}% - IMMEDIATE ACTION REQUIRED`,
                time: currentTime
            });
        } else if (data.oxygen < this.alertThresholds.oxygen.warning) {
            alerts.push({
                severity: 'alert-warning',
                message: `WARNING: OXYGEN LEVEL AT ${data.oxygen.toFixed(1)}% - MONITOR CLOSELY`,
                time: currentTime
            });
        }
        
        // Check CO2 levels
        if (data.co2 > this.alertThresholds.co2.critical) {
            alerts.push({
                severity: 'alert-critical',
                message: `CRITICAL: CO2 LEVEL AT ${data.co2.toFixed(1)} PPM - VENTILATION REQUIRED`,
                time: currentTime
            });
        } else if (data.co2 > this.alertThresholds.co2.warning) {
            alerts.push({
                severity: 'alert-warning',
                message: `WARNING: CO2 LEVEL AT ${data.co2.toFixed(1)} PPM - CHECK SCRUBBERS`,
                time: currentTime
            });
        }
        
        // Check pressure
        if (data.pressure < this.alertThresholds.pressure.criticalLow || 
            data.pressure > this.alertThresholds.pressure.criticalHigh) {
            alerts.push({
                severity: 'alert-critical',
                message: `CRITICAL: PRESSURE AT ${data.pressure.toFixed(2)} ATM - HULL BREACH POSSIBLE`,
                time: currentTime
            });
        } else if (data.pressure < this.alertThresholds.pressure.warningLow || 
                   data.pressure > this.alertThresholds.pressure.warningHigh) {
            alerts.push({
                severity: 'alert-warning',
                message: `WARNING: PRESSURE AT ${data.pressure.toFixed(2)} ATM - CHECK SEALS`,
                time: currentTime
            });
        }
        
        // Check temperature
        if (data.temperature < this.alertThresholds.temperature.criticalLow || 
            data.temperature > this.alertThresholds.temperature.criticalHigh) {
            alerts.push({
                severity: 'alert-critical',
                message: `CRITICAL: TEMPERATURE AT ${data.temperature.toFixed(1)}°C - LIFE SUPPORT FAILURE`,
                time: currentTime
            });
        } else if (data.temperature < this.alertThresholds.temperature.warningLow || 
                   data.temperature > this.alertThresholds.temperature.warningHigh) {
            alerts.push({
                severity: 'alert-warning',
                message: `WARNING: TEMPERATURE AT ${data.temperature.toFixed(1)}°C - CHECK CLIMATE CONTROL`,
                time: currentTime
            });
        }
        
        return alerts;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NostromoLifeSupport;
} else {
    window.NostromoLifeSupport = NostromoLifeSupport;
}