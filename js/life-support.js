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
        this.maxHistoryLength = 12; // 12 readings = ~24s of trend history
        this.alertThresholds = this.initializeAlertThresholds();
        this.zones = this.initializeZones();
        this.seedHistory();

        this.init();
    }

    seedHistory() {
        if (!this.dataSimulator) return;
        const baseData = this.dataSimulator.generateSystemStatus().lifeSupport;
        for (let i = 0; i < this.maxHistoryLength - 1; i++) {
            const jitter = () => (Math.random() - 0.5) * 0.6;
            this.historicalData.push({
                timestamp: Date.now() - (this.maxHistoryLength - 1 - i) * this.refreshRate,
                oxygen:        Math.max(80, Math.min(100, baseData.oxygen + jitter())),
                co2:           Math.max(8,  Math.min(20, baseData.co2 + jitter())),
                pressure:      Math.max(0.98, Math.min(1.04, baseData.pressure + jitter() * 0.02)),
                temperature:   Math.max(20, Math.min(24, baseData.temperature + jitter() * 0.3))
            });
        }
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
            <div class="ls-1979">
                <!-- Row 1: 4 large primary metrics -->
                <section class="ls-row ls-row-metrics">
                    <div class="ls-metric" id="oxygen-panel">
                        <div class="ls-metric-tag">PRIMARY &middot; ATMOSPHERE</div>
                        <div class="ls-metric-label">OXYGEN</div>
                        <div class="ls-metric-value" id="oxygen-value">--.-<span class="ls-unit">%</span></div>
                        <div class="ls-metric-bar" id="oxygen-bar"></div>
                        <div class="ls-metric-foot">
                            <span class="ls-metric-status" id="oxygen-status">●</span>
                            <span class="ls-metric-range">RANGE 0&ndash;100%</span>
                        </div>
                    </div>

                    <div class="ls-metric" id="co2-panel">
                        <div class="ls-metric-tag">PRIMARY &middot; ATMOSPHERE</div>
                        <div class="ls-metric-label">CO2</div>
                        <div class="ls-metric-value" id="co2-value">--.-<span class="ls-unit">PPM</span></div>
                        <div class="ls-metric-bar" id="co2-bar"></div>
                        <div class="ls-metric-foot">
                            <span class="ls-metric-status" id="co2-status">●</span>
                            <span class="ls-metric-range">RANGE 0&ndash;50 PPM</span>
                        </div>
                    </div>

                    <div class="ls-metric" id="pressure-panel">
                        <div class="ls-metric-tag">PRIMARY &middot; HULL</div>
                        <div class="ls-metric-label">PRESSURE</div>
                        <div class="ls-metric-value" id="pressure-value">-.--<span class="ls-unit">ATM</span></div>
                        <div class="ls-metric-bar" id="pressure-bar"></div>
                        <div class="ls-metric-foot">
                            <span class="ls-metric-status" id="pressure-status">●</span>
                            <span class="ls-metric-range">NOMINAL 0.90&ndash;1.10</span>
                        </div>
                    </div>

                    <div class="ls-metric" id="temperature-panel">
                        <div class="ls-metric-tag">PRIMARY &middot; CLIMATE</div>
                        <div class="ls-metric-label">TEMP</div>
                        <div class="ls-metric-value" id="temperature-value">--.-<span class="ls-unit">&deg;C</span></div>
                        <div class="ls-metric-bar" id="temperature-bar"></div>
                        <div class="ls-metric-foot">
                            <span class="ls-metric-status" id="temperature-status">●</span>
                            <span class="ls-metric-range">NOMINAL 19&ndash;23 &deg;C</span>
                        </div>
                    </div>
                </section>

                <!-- Row 2: zone grid + trend charts -->
                <section class="ls-row ls-row-body">
                    <div class="ls-section ls-zones">
                        <div class="ls-section-header">
                            <span>ZONE ENVIRONMENTAL STATUS</span>
                            <span class="ls-section-sub">6 / 6 ZONES ONLINE</span>
                        </div>
                        <div class="ls-zone-grid" id="zone-grid">
                            ${this.generateZoneGridHTML()}
                        </div>
                    </div>

                    <div class="ls-section ls-trends">
                        <div class="ls-section-header">
                            <span>ENVIRONMENTAL TRENDS</span>
                            <span class="ls-section-sub">20 SAMPLE WINDOW</span>
                        </div>
                        <div class="ls-trend-display" id="trend-display">
                            <div class="trend-chart" id="trend-chart">
                                <div class="chart-loading">COLLECTING TREND DATA...</div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Row 3: alerts -->
                <section class="ls-row ls-row-alerts">
                    <div class="ls-section-header">
                        <span>SYSTEM ALERTS</span>
                        <span class="ls-alert-count" id="alert-count">0 ACTIVE</span>
                    </div>
                    <div class="ls-alert-panel" id="alert-panel">
                        <div class="no-alerts">NO ACTIVE ALERTS</div>
                    </div>
                </section>
            </div>
        `;
    }

    /**
     * Generate zone status grid HTML
     */
    generateZoneGridHTML() {
        return this.zones.map(zone => `
            <div class="ls-zone-item" id="zone-${zone.id.toLowerCase()}">
                <div class="ls-zone-head">
                    <span class="ls-zone-name">${zone.name}</span>
                    <span class="ls-zone-priority priority-${zone.priority.toLowerCase()}">${zone.priority}</span>
                </div>
                <div class="ls-zone-body">
                    <div class="ls-zone-cell">
                        <span class="ls-zone-label">O2</span>
                        <span class="ls-zone-value" id="zone-${zone.id.toLowerCase()}-oxygen">--%</span>
                    </div>
                    <div class="ls-zone-cell">
                        <span class="ls-zone-label">CO2</span>
                        <span class="ls-zone-value" id="zone-${zone.id.toLowerCase()}-co2">--</span>
                    </div>
                    <div class="ls-zone-cell">
                        <span class="ls-zone-label">TEMP</span>
                        <span class="ls-zone-value" id="zone-${zone.id.toLowerCase()}-temp">--&deg;C</span>
                    </div>
                    <div class="ls-zone-ind" id="zone-${zone.id.toLowerCase()}-indicator">●</div>
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
        const barWidth = 16;
        const filledBars = Math.round((percentage / 100) * barWidth);
        const emptyBars = barWidth - filledBars;

        const filled = '\u2588'.repeat(filledBars);
        const empty = '\u2591'.repeat(emptyBars);

        return `
            <div class="ascii-bar ${status}">
                <span class="bar-filled">${filled}</span><span class="bar-empty">${empty}</span>
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
     * Generate ASCII trend chart with multiple environmental parameters
     */
    generateTrendChart() {
        if (this.historicalData.length < 3) {
            return '<div class="chart-loading">COLLECTING TREND DATA...</div>';
        }

        const chartHeight = 6;
        const chartWidth = 24;

        const parameters = [
            { key: 'oxygen', label: 'OXYGEN', unit: '%' },
            { key: 'co2', label: 'CO2', unit: 'PPM' },
            { key: 'pressure', label: 'PRESSURE', unit: 'ATM' },
            { key: 'temperature', label: 'TEMP', unit: '\u00B0C' }
        ];

        let chart = '<div class="trend-charts-list">';

        for (const param of parameters) {
            chart += this.generateParameterChart(param, chartHeight, chartWidth);
        }

        chart += '</div>';
        return chart;
    }

    /**
     * Generate compact chart for a specific parameter suitable for list layout
     */
    generateParameterChart(param, chartHeight, chartWidth) {
        const data = this.historicalData.map(d => d[param.key]);
        const minValue = Math.min(...data);
        const maxValue = Math.max(...data);
        const range = maxValue - minValue || 1;
        const currentValue = data[data.length - 1];

        let chart = `<div class="parameter-chart">`;
        chart += `<div class="chart-subtitle">${param.label}</div>`;
        chart += '<div class="chart-display">';

        let chartLines = '';
        for (let y = chartHeight - 1; y >= 0; y--) {
            let line = '';
            const threshold = minValue + (range * y / (chartHeight - 1));

            for (let x = 0; x < Math.min(chartWidth, data.length); x++) {
                const dataIndex = Math.max(0, data.length - chartWidth + x);
                const value = data[dataIndex];

                if (Math.abs(value - threshold) < range / (chartHeight * 2)) {
                    line += '\u2588';
                } else if (value > threshold) {
                    line += ' ';
                } else {
                    line += '\u2591';
                }
            }
            chartLines += `<div class="chart-line">${line}</div>\n`;
        }
        chart += chartLines;

        const trend = this.calculateTrend(data);
        const trendSymbol = trend > 0.1 ? '\u2197' : trend < -0.1 ? '\u2198' : '\u2192';
        const formatted = (param.key === 'pressure')
            ? currentValue.toFixed(2)
            : currentValue.toFixed(1);
        chart += `<div class="chart-current">${formatted}${param.unit} ${trendSymbol}</div>\n`;

        chart += '</div>';
        chart += '</div>';

        return chart;
    }

    /**
     * Calculate trend direction for a data series
     */
    calculateTrend(data) {
        if (data.length < 3) return 0;

        const recent = data.slice(-3);
        const slope = (recent[2] - recent[0]) / 2;
        return slope;
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

