/**
 * Nostromo Crew Monitoring Screen
 * Personnel roster, location tracking, vital signs monitoring, and quarters environmental data
 */

class NostromoCrew {
    constructor(dataSimulator) {
        this.dataSimulator = dataSimulator;
        this.refreshInterval = null;
        this.refreshRate = 3000; // 3 seconds for crew monitoring
        this.isActive = false;
        this.selectedCrewMember = null;
        this.alertThresholds = this.initializeAlertThresholds();
        this.shipLayout = this.initializeShipLayout();
        this.quartersEnvironment = this.initializeQuartersEnvironment();
        
        this.init();
    }

    init() {
        console.log('Crew monitoring system initialized');
    }

    /**
     * Initialize vital signs alert thresholds
     */
    initializeAlertThresholds() {
        return {
            heartRate: {
                warningLow: 60,
                warningHigh: 100,
                criticalLow: 50,
                criticalHigh: 120
            },
            temperature: {
                warningLow: 36.0,
                warningHigh: 37.5,
                criticalLow: 35.0,
                criticalHigh: 38.5
            },
            oxygenSat: {
                warning: 95,
                critical: 90
            }
        };
    }

    /**
     * Initialize ship layout for crew location tracking
     */
    initializeShipLayout() {
        return {
            'BRIDGE': { x: 2, y: 1, symbol: '[B]' },
            'ENGINEERING': { x: 1, y: 3, symbol: '[E]' },
            'QUARTERS': { x: 3, y: 2, symbol: '[Q]' },
            'NAVIGATION': { x: 2, y: 0, symbol: '[N]' },
            'MAINTENANCE': { x: 0, y: 2, symbol: '[M]' },
            'SCIENCE': { x: 4, y: 1, symbol: '[S]' },
            'CARGO': { x: 2, y: 4, symbol: '[C]' }
        };
    }

    /**
     * Initialize quarters environmental monitoring
     */
    initializeQuartersEnvironment() {
        return {
            'CREW_A': { name: 'QUARTERS A', occupant: 'DALLAS' },
            'CREW_B': { name: 'QUARTERS B', occupant: 'RIPLEY' },
            'CREW_C': { name: 'QUARTERS C', occupant: 'KANE' },
            'CREW_D': { name: 'QUARTERS D', occupant: 'LAMBERT' },
            'CREW_E': { name: 'QUARTERS E', occupant: 'BRETT' },
            'CREW_F': { name: 'QUARTERS F', occupant: 'PARKER' },
            'CREW_G': { name: 'QUARTERS G', occupant: 'ASH' }
        };
    }

    /**
     * Activate crew monitoring and start real-time updates
     */
    activate() {
        this.isActive = true;
        this.render();
        this.startRealTimeUpdates();
        console.log('Crew monitoring activated');
    }

    /**
     * Deactivate crew monitoring and stop updates
     */
    deactivate() {
        this.isActive = false;
        this.stopRealTimeUpdates();
        console.log('Crew monitoring deactivated');
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
     * Render the complete crew monitoring layout
     */
    render() {
        const crewScreen = document.getElementById('crew-screen');
        if (!crewScreen) {
            console.error('Crew screen element not found');
            return;
        }

        const screenContent = crewScreen.querySelector('.screen-content');
        if (!screenContent) {
            console.error('Crew screen content not found');
            return;
        }

        screenContent.innerHTML = this.generateCrewHTML();
        this.updateData();
        this.initializeEventListeners();
    }

    /**
     * Generate the complete crew monitoring HTML structure
     */
    generateCrewHTML() {
        return `
            <div class="crew-container">
                <!-- Personnel Roster -->
                <div class="personnel-section">
                    <div class="section-header">PERSONNEL ROSTER</div>
                    <div class="crew-roster" id="crew-roster">
                        ${this.generateCrewRosterHTML()}
                    </div>
                </div>

                <!-- Ship Layout with Crew Positions -->
                <div class="location-section">
                    <div class="section-header">CREW LOCATION TRACKING</div>
                    <div class="ship-schematic" id="ship-schematic">
                        ${this.generateShipSchematicHTML()}
                    </div>
                    <div class="location-legend">
                        <div class="legend-item">[B] BRIDGE</div>
                        <div class="legend-item">[E] ENGINEERING</div>
                        <div class="legend-item">[Q] QUARTERS</div>
                        <div class="legend-item">[N] NAVIGATION</div>
                        <div class="legend-item">[M] MAINTENANCE</div>
                        <div class="legend-item">[S] SCIENCE</div>
                        <div class="legend-item">[C] CARGO</div>
                    </div>
                </div>

                <!-- Vital Signs Monitoring -->
                <div class="vitals-section">
                    <div class="section-header">VITAL SIGNS MONITORING</div>
                    <div class="vitals-display" id="vitals-display">
                        ${this.generateVitalsHTML()}
                    </div>
                </div>

                <!-- Quarters Environmental Data -->
                <div class="quarters-section">
                    <div class="section-header">QUARTERS ENVIRONMENTAL STATUS</div>
                    <div class="quarters-grid" id="quarters-grid">
                        ${this.generateQuartersHTML()}
                    </div>
                </div>

                <!-- Crew Alerts -->
                <div class="crew-alerts-section">
                    <div class="section-header">
                        CREW ALERTS
                        <span class="alert-count" id="crew-alert-count">0</span>
                    </div>
                    <div class="crew-alert-panel" id="crew-alert-panel">
                        <div class="no-alerts">NO ACTIVE CREW ALERTS</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate crew roster HTML
     */
    generateCrewRosterHTML() {
        if (!this.dataSimulator) {
            return '<div class="loading-message">DATA SIMULATOR NOT AVAILABLE</div>';
        }

        const crewData = this.dataSimulator.generateCrewData();
        return crewData.map(member => `
            <div class="crew-member" id="crew-${member.id}" data-crew-id="${member.id}">
                <div class="crew-header">
                    <span class="crew-name">${member.name}</span>
                    <span class="crew-status status-${member.status}">${member.status.toUpperCase()}</span>
                </div>
                <div class="crew-details">
                    <div class="crew-location">
                        <span class="detail-label">LOCATION:</span>
                        <span class="detail-value" id="crew-${member.id}-location">${member.location}</span>
                    </div>
                    <div class="crew-vitals-summary">
                        <span class="vital-item">
                            HR: <span id="crew-${member.id}-hr">${member.vitals.heartRate}</span>
                        </span>
                        <span class="vital-item">
                            TEMP: <span id="crew-${member.id}-temp">${member.vitals.temperature.toFixed(1)}°C</span>
                        </span>
                        <span class="vital-item">
                            O2: <span id="crew-${member.id}-o2">${member.vitals.oxygenSat}%</span>
                        </span>
                    </div>
                </div>
                <div class="crew-indicator" id="crew-${member.id}-indicator">●</div>
            </div>
        `).join('');
    }

    /**
     * Generate ship schematic HTML with crew positions
     */
    generateShipSchematicHTML() {
        const schematic = `
            <div class="schematic-display">
                <pre class="ship-layout">
╔═══════════════════════════════════════╗
║              USCSS NOSTROMO           ║
╠═══════════════════════════════════════╣
║                                       ║
║     [N]           [B]           [S]   ║
║      │             │             │    ║
║   ┌──┴──┐       ┌──┴──┐       ┌──┴──┐ ║
║   │ NAV │───────│BRDG │───────│ SCI │ ║
║   └─────┘       └─────┘       └─────┘ ║
║                                       ║
║ [M]               [Q]                 ║
║  │                 │                  ║
║┌─┴─┐             ┌─┴─┐                ║
║│MNT│─────────────│QTR│                ║
║└───┘             └───┘                ║
║                                       ║
║     [E]                               ║
║      │                                ║
║   ┌──┴──┐                             ║
║   │ ENG │                             ║
║   └─────┘                             ║
║                                       ║
║                 [C]                   ║
║                  │                    ║
║               ┌──┴──┐                 ║
║               │CRGO │                 ║
║               └─────┘                 ║
║                                       ║
╚═══════════════════════════════════════╝
                </pre>
                <div class="crew-positions" id="crew-positions">
                    <!-- Crew positions will be updated dynamically -->
                </div>
            </div>
        `;
        return schematic;
    }

    /**
     * Generate vital signs monitoring HTML
     */
    generateVitalsHTML() {
        return `
            <div class="vitals-grid">
                <div class="vitals-chart" id="vitals-chart">
                    <div class="chart-title">CREW VITAL SIGNS OVERVIEW</div>
                    <div class="vitals-table" id="vitals-table">
                        <!-- Vitals table will be populated dynamically -->
                    </div>
                </div>
                <div class="selected-crew-vitals" id="selected-crew-vitals">
                    <div class="selected-title">SELECT CREW MEMBER FOR DETAILED VITALS</div>
                    <div class="detailed-vitals" id="detailed-vitals">
                        <!-- Detailed vitals will be shown when crew member is selected -->
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate quarters environmental monitoring HTML
     */
    generateQuartersHTML() {
        return Object.entries(this.quartersEnvironment).map(([quarterId, quarters]) => `
            <div class="quarters-item" id="quarters-${quarterId.toLowerCase()}">
                <div class="quarters-header">
                    <span class="quarters-name">${quarters.name}</span>
                    <span class="quarters-occupant">${quarters.occupant}</span>
                </div>
                <div class="quarters-env">
                    <div class="env-metric">
                        <span class="env-label">TEMP:</span>
                        <span class="env-value" id="quarters-${quarterId.toLowerCase()}-temp">--°C</span>
                    </div>
                    <div class="env-metric">
                        <span class="env-label">O2:</span>
                        <span class="env-value" id="quarters-${quarterId.toLowerCase()}-oxygen">--%</span>
                    </div>
                    <div class="env-metric">
                        <span class="env-label">PRESS:</span>
                        <span class="env-value" id="quarters-${quarterId.toLowerCase()}-pressure">-- ATM</span>
                    </div>
                    <div class="quarters-indicator" id="quarters-${quarterId.toLowerCase()}-indicator">●</div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Initialize event listeners for crew interaction
     */
    initializeEventListeners() {
        // Add click handlers for crew member selection
        const crewMembers = document.querySelectorAll('.crew-member');
        crewMembers.forEach(member => {
            member.addEventListener('click', (e) => {
                const crewId = member.dataset.crewId;
                this.selectCrewMember(crewId);
            });
        });
    }

    /**
     * Select a crew member for detailed monitoring
     */
    selectCrewMember(crewId) {
        // Remove previous selection
        const previousSelected = document.querySelector('.crew-member.selected');
        if (previousSelected) {
            previousSelected.classList.remove('selected');
        }

        // Select new crew member
        const selectedMember = document.getElementById(`crew-${crewId}`);
        if (selectedMember) {
            selectedMember.classList.add('selected');
            this.selectedCrewMember = crewId;
            this.updateDetailedVitals(crewId);
        }
    }

    /**
     * Update all crew monitoring data
     */
    updateData() {
        if (!this.dataSimulator) {
            console.warn('Data simulator not available');
            return;
        }

        const systemData = this.dataSimulator.generateSystemStatus();
        const crewData = systemData.crew;
        const lifeSupportData = systemData.lifeSupport;
        
        // Update crew roster
        this.updateCrewRoster(crewData);
        
        // Update crew positions on schematic
        this.updateCrewPositions(crewData);
        
        // Update vital signs table
        this.updateVitalsTable(crewData);
        
        // Update quarters environmental data
        this.updateQuartersEnvironment(lifeSupportData);
        
        // Update detailed vitals if crew member is selected
        if (this.selectedCrewMember) {
            this.updateDetailedVitals(this.selectedCrewMember);
        }
        
        // Check and update crew alerts
        this.updateCrewAlerts(crewData);
    }

    /**
     * Update crew roster display
     */
    updateCrewRoster(crewData) {
        // Regenerate the entire roster to ensure all data is visible
        const rosterContainer = document.getElementById('crew-roster');
        if (rosterContainer && crewData) {
            rosterContainer.innerHTML = crewData.map(member => `
                <div class="crew-member" id="crew-${member.id}" data-crew-id="${member.id}">
                    <div class="crew-header">
                        <span class="crew-name">${member.name}</span>
                        <span class="crew-status status-${member.status}">${member.status.toUpperCase()}</span>
                    </div>
                    <div class="crew-details">
                        <div class="crew-location">
                            <span class="detail-label">LOCATION:</span>
                            <span class="detail-value">${member.location}</span>
                        </div>
                        <div class="crew-vitals-summary">
                            <span class="vital-item">
                                HR: <span>${member.vitals.heartRate}</span>
                            </span>
                            <span class="vital-item">
                                TEMP: <span>${member.vitals.temperature.toFixed(1)}°C</span>
                            </span>
                            <span class="vital-item">
                                O2: <span>${member.vitals.oxygenSat}%</span>
                            </span>
                        </div>
                    </div>
                    <div class="crew-indicator ${this.getCrewHealthStatus(member.vitals)}">●</div>
                </div>
            `).join('');
            
            // Re-initialize event listeners after regenerating HTML
            this.initializeEventListeners();
        }
    }

    /**
     * Update crew positions on ship schematic
     */
    updateCrewPositions(crewData) {
        const positionsContainer = document.getElementById('crew-positions');
        if (!positionsContainer) return;

        // Create position markers for each crew member
        const positionMarkers = crewData.map(member => {
            const layout = this.shipLayout[member.location];
            if (!layout) return '';

            return `
                <div class="crew-position" 
                     style="grid-column: ${layout.x + 1}; grid-row: ${layout.y + 1};"
                     title="${member.name} - ${member.location}">
                    ${member.name.charAt(0)}
                </div>
            `;
        }).join('');

        positionsContainer.innerHTML = positionMarkers;
    }

    /**
     * Update vital signs table
     */
    updateVitalsTable(crewData) {
        const vitalsTable = document.getElementById('vitals-table');
        if (!vitalsTable) return;

        const tableHTML = `
            <table class="crew-vitals-table">
                <thead>
                    <tr>
                        <th>CREW MEMBER</th>
                        <th>HEART RATE</th>
                        <th>TEMPERATURE</th>
                        <th>OXYGEN SAT</th>
                        <th>STATUS</th>
                    </tr>
                </thead>
                <tbody>
                    ${crewData.map(member => `
                        <tr class="vitals-row ${this.getCrewHealthStatus(member.vitals)}">
                            <td class="crew-name-cell">${member.name}</td>
                            <td class="vitals-cell">${member.vitals.heartRate} BPM</td>
                            <td class="vitals-cell">${member.vitals.temperature.toFixed(1)}°C</td>
                            <td class="vitals-cell">${member.vitals.oxygenSat}%</td>
                            <td class="status-cell">${this.getVitalsStatusText(member.vitals)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        vitalsTable.innerHTML = tableHTML;
    }

    /**
     * Update detailed vitals for selected crew member
     */
    updateDetailedVitals(crewId) {
        if (!this.dataSimulator) return;

        const crewData = this.dataSimulator.generateCrewData();
        const selectedMember = crewData.find(member => member.id === crewId);
        
        if (!selectedMember) return;

        const detailedVitals = document.getElementById('detailed-vitals');
        if (!detailedVitals) return;

        const vitals = selectedMember.vitals;
        const status = this.getCrewHealthStatus(vitals);

        detailedVitals.innerHTML = `
            <div class="detailed-crew-info">
                <div class="detailed-header">
                    <span class="detailed-name">${selectedMember.name}</span>
                    <span class="detailed-status ${status}">${this.getVitalsStatusText(vitals)}</span>
                </div>
                <div class="detailed-metrics">
                    <div class="detailed-metric">
                        <div class="metric-label">HEART RATE</div>
                        <div class="metric-value ${this.getVitalStatus('heartRate', vitals.heartRate)}">
                            ${vitals.heartRate} BPM
                        </div>
                        <div class="metric-bar">
                            ${this.generateVitalBar('heartRate', vitals.heartRate)}
                        </div>
                    </div>
                    <div class="detailed-metric">
                        <div class="metric-label">BODY TEMPERATURE</div>
                        <div class="metric-value ${this.getVitalStatus('temperature', vitals.temperature)}">
                            ${vitals.temperature.toFixed(1)}°C
                        </div>
                        <div class="metric-bar">
                            ${this.generateVitalBar('temperature', vitals.temperature)}
                        </div>
                    </div>
                    <div class="detailed-metric">
                        <div class="metric-label">OXYGEN SATURATION</div>
                        <div class="metric-value ${this.getVitalStatus('oxygenSat', vitals.oxygenSat)}">
                            ${vitals.oxygenSat}%
                        </div>
                        <div class="metric-bar">
                            ${this.generateVitalBar('oxygenSat', vitals.oxygenSat)}
                        </div>
                    </div>
                </div>
                <div class="crew-location-detail">
                    <div class="location-label">CURRENT LOCATION</div>
                    <div class="location-value">${selectedMember.location}</div>
                    <div class="activity-label">ACTIVITY STATUS</div>
                    <div class="activity-value">${selectedMember.status.toUpperCase()}</div>
                </div>
            </div>
        `;
    }

    /**
     * Generate vital sign bar chart
     */
    generateVitalBar(vitalType, value) {
        const ranges = {
            heartRate: { min: 50, max: 120, normal: [60, 100] },
            temperature: { min: 35.0, max: 38.5, normal: [36.0, 37.5] },
            oxygenSat: { min: 90, max: 100, normal: [95, 100] }
        };

        const range = ranges[vitalType];
        const percentage = ((value - range.min) / (range.max - range.min)) * 100;
        const status = this.getVitalStatus(vitalType, value);

        const barWidth = 20;
        const filledBars = Math.round((percentage / 100) * barWidth);
        const emptyBars = barWidth - filledBars;

        return `
            <div class="vital-bar ${status}">
                <span class="bar-filled">${'█'.repeat(filledBars)}</span><span class="bar-empty">${'░'.repeat(emptyBars)}</span>
            </div>
        `;
    }

    /**
     * Update quarters environmental data
     */
    updateQuartersEnvironment(lifeSupportData) {
        Object.keys(this.quartersEnvironment).forEach((quarterId, index) => {
            // Generate slight variations for each quarters
            const variation = {
                temperature: (Math.random() - 0.5) * 2,
                oxygen: (Math.random() - 0.5) * 3,
                pressure: (Math.random() - 0.5) * 0.02
            };

            const quartersData = {
                temperature: lifeSupportData.temperature + variation.temperature,
                oxygen: lifeSupportData.oxygen + variation.oxygen,
                pressure: lifeSupportData.pressure + variation.pressure
            };

            // Update display
            const tempElement = document.getElementById(`quarters-${quarterId.toLowerCase()}-temp`);
            const oxygenElement = document.getElementById(`quarters-${quarterId.toLowerCase()}-oxygen`);
            const pressureElement = document.getElementById(`quarters-${quarterId.toLowerCase()}-pressure`);
            const indicatorElement = document.getElementById(`quarters-${quarterId.toLowerCase()}-indicator`);

            if (tempElement) tempElement.textContent = `${quartersData.temperature.toFixed(1)}°C`;
            if (oxygenElement) oxygenElement.textContent = `${quartersData.oxygen.toFixed(1)}%`;
            if (pressureElement) pressureElement.textContent = `${quartersData.pressure.toFixed(2)} ATM`;

            if (indicatorElement) {
                const status = this.getEnvironmentalStatus(quartersData);
                indicatorElement.className = `quarters-indicator ${status}`;
            }
        });
    }

    /**
     * Get crew health status based on vital signs
     */
    getCrewHealthStatus(vitals) {
        const hrStatus = this.getVitalStatus('heartRate', vitals.heartRate);
        const tempStatus = this.getVitalStatus('temperature', vitals.temperature);
        const o2Status = this.getVitalStatus('oxygenSat', vitals.oxygenSat);

        const statuses = [hrStatus, tempStatus, o2Status];
        
        if (statuses.includes('status-critical')) return 'status-critical';
        if (statuses.includes('status-warning')) return 'status-warning';
        return 'status-ok';
    }

    /**
     * Get individual vital sign status
     */
    getVitalStatus(vitalType, value) {
        const thresholds = this.alertThresholds[vitalType];
        
        switch (vitalType) {
            case 'heartRate':
                if (value < thresholds.criticalLow || value > thresholds.criticalHigh) return 'status-critical';
                if (value < thresholds.warningLow || value > thresholds.warningHigh) return 'status-warning';
                return 'status-ok';
                
            case 'temperature':
                if (value < thresholds.criticalLow || value > thresholds.criticalHigh) return 'status-critical';
                if (value < thresholds.warningLow || value > thresholds.warningHigh) return 'status-warning';
                return 'status-ok';
                
            case 'oxygenSat':
                if (value < thresholds.critical) return 'status-critical';
                if (value < thresholds.warning) return 'status-warning';
                return 'status-ok';
                
            default:
                return 'status-ok';
        }
    }

    /**
     * Get vitals status text
     */
    getVitalsStatusText(vitals) {
        const status = this.getCrewHealthStatus(vitals);
        
        switch (status) {
            case 'status-critical': return 'CRITICAL';
            case 'status-warning': return 'WARNING';
            default: return 'NORMAL';
        }
    }

    /**
     * Get environmental status for quarters
     */
    getEnvironmentalStatus(envData) {
        // Simple environmental status based on temperature and oxygen
        if (envData.temperature < 18 || envData.temperature > 24 || envData.oxygen < 90) {
            return 'status-warning';
        }
        if (envData.temperature < 16 || envData.temperature > 26 || envData.oxygen < 85) {
            return 'status-critical';
        }
        return 'status-ok';
    }

    /**
     * Update crew alerts
     */
    updateCrewAlerts(crewData) {
        const alerts = this.generateCrewAlerts(crewData);
        const alertPanel = document.getElementById('crew-alert-panel');
        const alertCount = document.getElementById('crew-alert-count');
        
        if (!alertPanel || !alertCount) return;

        alertCount.textContent = alerts.length.toString();
        alertCount.className = `alert-count ${alerts.length > 0 ? 'has-alerts' : ''}`;
        
        if (alerts.length === 0) {
            alertPanel.innerHTML = '<div class="no-alerts">NO ACTIVE CREW ALERTS</div>';
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
     * Generate crew alerts based on vital signs
     */
    generateCrewAlerts(crewData) {
        const alerts = [];
        const currentTime = new Date().toTimeString().substring(0, 8);
        
        crewData.forEach(member => {
            const vitals = member.vitals;
            
            // Check heart rate
            if (vitals.heartRate < this.alertThresholds.heartRate.criticalLow || 
                vitals.heartRate > this.alertThresholds.heartRate.criticalHigh) {
                alerts.push({
                    severity: 'alert-critical',
                    message: `CRITICAL: ${member.name} HEART RATE ${vitals.heartRate} BPM - MEDICAL ATTENTION REQUIRED`,
                    time: currentTime
                });
            } else if (vitals.heartRate < this.alertThresholds.heartRate.warningLow || 
                       vitals.heartRate > this.alertThresholds.heartRate.warningHigh) {
                alerts.push({
                    severity: 'alert-warning',
                    message: `WARNING: ${member.name} HEART RATE ${vitals.heartRate} BPM - MONITOR CLOSELY`,
                    time: currentTime
                });
            }
            
            // Check temperature
            if (vitals.temperature < this.alertThresholds.temperature.criticalLow || 
                vitals.temperature > this.alertThresholds.temperature.criticalHigh) {
                alerts.push({
                    severity: 'alert-critical',
                    message: `CRITICAL: ${member.name} TEMPERATURE ${vitals.temperature.toFixed(1)}°C - IMMEDIATE MEDICAL RESPONSE`,
                    time: currentTime
                });
            } else if (vitals.temperature < this.alertThresholds.temperature.warningLow || 
                       vitals.temperature > this.alertThresholds.temperature.warningHigh) {
                alerts.push({
                    severity: 'alert-warning',
                    message: `WARNING: ${member.name} TEMPERATURE ${vitals.temperature.toFixed(1)}°C - CHECK CREW MEMBER`,
                    time: currentTime
                });
            }
            
            // Check oxygen saturation
            if (vitals.oxygenSat < this.alertThresholds.oxygenSat.critical) {
                alerts.push({
                    severity: 'alert-critical',
                    message: `CRITICAL: ${member.name} OXYGEN SATURATION ${vitals.oxygenSat}% - OXYGEN SUPPORT NEEDED`,
                    time: currentTime
                });
            } else if (vitals.oxygenSat < this.alertThresholds.oxygenSat.warning) {
                alerts.push({
                    severity: 'alert-warning',
                    message: `WARNING: ${member.name} OXYGEN SATURATION ${vitals.oxygenSat}% - MONITOR BREATHING`,
                    time: currentTime
                });
            }
        });
        
        return alerts;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NostromoCrew;
} else {
    window.NostromoCrew = NostromoCrew;
}