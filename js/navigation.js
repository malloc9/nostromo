/**
 * Nostromo Navigation Screen
 * Navigation and positioning system with star map display and coordinate tracking
 */

class NostromoNavigation {
    constructor(dataSimulator) {
        this.dataSimulator = dataSimulator;
        this.refreshInterval = null;
        this.refreshRate = 2000; // 2 seconds
        this.isActive = false;
        this.starMap = null;
        this.selectedCoordinate = null;
        
        this.init();
    }

    init() {
        console.log('Navigation system initialized');
    }

    /**
     * Activate navigation screen and start real-time updates
     */
    activate() {
        this.isActive = true;
        this.render();
        this.startRealTimeUpdates();
        console.log('Navigation system activated');
    }

    /**
     * Deactivate navigation screen and stop updates
     */
    deactivate() {
        this.isActive = false;
        this.stopRealTimeUpdates();
        console.log('Navigation system deactivated');
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
                this.updateNavigationData();
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
     * Render the complete navigation screen layout
     */
    render() {
        const navigationScreen = document.getElementById('navigation-screen');
        if (!navigationScreen) {
            console.error('Navigation screen element not found');
            return;
        }

        const screenContent = navigationScreen.querySelector('.screen-content');
        if (!screenContent) {
            console.error('Navigation screen content not found');
            return;
        }

        screenContent.innerHTML = this.generateNavigationHTML();
        this.setupStarMapClickHandlers();
        this.updateNavigationData();
    }

    /**
     * Generate the complete navigation HTML structure
     */
    generateNavigationHTML() {
        return `
            <div class="navigation-container">
                <!-- Ship Position and Status Section -->
                <div class="nav-status-section">
                    <div class="section-header">SHIP POSITION & STATUS</div>
                    <div class="position-grid">
                        <div class="position-data">
                            <div class="data-group">
                                <div class="group-header">CURRENT POSITION</div>
                                <div class="coordinate-display">
                                    <div class="coord-row">
                                        <span class="coord-label">X:</span>
                                        <span class="coord-value" id="pos-x">--.--</span>
                                    </div>
                                    <div class="coord-row">
                                        <span class="coord-label">Y:</span>
                                        <span class="coord-value" id="pos-y">--.--</span>
                                    </div>
                                    <div class="coord-row">
                                        <span class="coord-label">Z:</span>
                                        <span class="coord-value" id="pos-z">--.--</span>
                                    </div>
                                </div>
                            </div>
                            <div class="data-group">
                                <div class="group-header">NAVIGATION DATA</div>
                                <div class="nav-data-display">
                                    <div class="nav-row">
                                        <span class="nav-label">HEADING:</span>
                                        <span class="nav-value" id="nav-heading">---°</span>
                                    </div>
                                    <div class="nav-row">
                                        <span class="nav-label">VELOCITY:</span>
                                        <span class="nav-value" id="nav-velocity">-.--- C</span>
                                    </div>
                                    <div class="nav-row">
                                        <span class="nav-label">DESTINATION:</span>
                                        <span class="nav-value" id="nav-destination">----</span>
                                    </div>
                                    <div class="nav-row">
                                        <span class="nav-label">ETA:</span>
                                        <span class="nav-value" id="nav-eta">-- HOURS</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Star Map Section -->
                <div class="star-map-section">
                    <div class="section-header">STELLAR CARTOGRAPHY</div>
                    <div class="star-map-container">
                        <div class="star-map" id="star-map">
                            ${this.generateStarMap()}
                        </div>
                        <div class="map-controls">
                            <div class="control-group">
                                <span class="control-label">SCALE:</span>
                                <span class="control-value">1:10000</span>
                            </div>
                            <div class="control-group">
                                <span class="control-label">GRID:</span>
                                <span class="control-value">ENABLED</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Coordinate Details Section -->
                <div class="coordinate-details-section">
                    <div class="section-header">COORDINATE DETAILS</div>
                    <div class="details-content" id="coordinate-details">
                        <div class="details-placeholder">
                            SELECT COORDINATES ON STAR MAP FOR DETAILS
                        </div>
                    </div>
                </div>

                <!-- Navigation Status Bar -->
                <div class="nav-status-bar">
                    <div class="status-item">
                        <span class="status-label">NAV STATUS:</span>
                        <span class="status-value" id="nav-system-status">OPERATIONAL</span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">LAST UPDATE:</span>
                        <span class="status-value" id="nav-last-update">--:--:--</span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">DRIFT:</span>
                        <span class="status-value" id="nav-drift">MINIMAL</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate ASCII star map with coordinate grid and ship position
     */
    generateStarMap() {
        const mapWidth = 60;
        const mapHeight = 20;
        let mapHTML = '<pre class="star-field">';
        
        // Generate coordinate grid header
        mapHTML += '    ';
        for (let x = 0; x < mapWidth; x += 10) {
            mapHTML += `${String(x).padStart(10, ' ')}`;
        }
        mapHTML += '\n';
        
        mapHTML += '    ';
        for (let x = 0; x < mapWidth; x++) {
            mapHTML += (x % 10 === 0) ? '|' : (x % 5 === 0) ? '+' : '-';
        }
        mapHTML += '\n';

        // Generate star field with grid
        for (let y = 0; y < mapHeight; y++) {
            // Y-axis labels
            mapHTML += `${String(y * 10).padStart(3, ' ')} `;
            
            for (let x = 0; x < mapWidth; x++) {
                let char = ' ';
                
                // Grid lines
                if (x % 10 === 0) {
                    char = '|';
                } else if (y % 5 === 0 && x % 5 === 0) {
                    char = '+';
                }
                
                // Add stars (pseudo-random based on position)
                const starSeed = (x * 7 + y * 13) % 100;
                if (starSeed < 3 && char === ' ') {
                    char = '·';
                } else if (starSeed < 5 && char === ' ') {
                    char = '*';
                } else if (starSeed === 7 && char === ' ') {
                    char = '✦';
                }
                
                // Ship position (will be updated dynamically)
                if (x === 30 && y === 10) {
                    char = '<span class="ship-position clickable" data-x="30" data-y="10" id="ship-marker">◊</span>';
                } else if (char !== ' ' && char !== '|' && char !== '+') {
                    char = `<span class="star-point clickable" data-x="${x}" data-y="${y}">${char}</span>`;
                }
                
                mapHTML += char;
            }
            mapHTML += '\n';
        }
        
        mapHTML += '</pre>';
        return mapHTML;
    }

    /**
     * Update navigation data from data simulator
     */
    updateNavigationData() {
        if (!this.dataSimulator) {
            console.warn('Data simulator not available');
            return;
        }

        const systemData = this.dataSimulator.generateSystemStatus();
        const navData = systemData.navigation;
        
        this.updatePositionDisplay(navData);
        this.updateNavigationInfo(navData);
        this.updateShipPosition(navData);
        this.updateStatusBar();
    }

    /**
     * Update position coordinate display
     */
    updatePositionDisplay(navData) {
        const posX = document.getElementById('pos-x');
        const posY = document.getElementById('pos-y');
        const posZ = document.getElementById('pos-z');
        
        if (posX) posX.textContent = navData.coordinates.x.toFixed(1);
        if (posY) posY.textContent = navData.coordinates.y.toFixed(1);
        if (posZ) posZ.textContent = navData.coordinates.z.toFixed(1);
    }

    /**
     * Update navigation information display
     */
    updateNavigationInfo(navData) {
        const heading = document.getElementById('nav-heading');
        const velocity = document.getElementById('nav-velocity');
        const destination = document.getElementById('nav-destination');
        const eta = document.getElementById('nav-eta');
        
        if (heading) heading.textContent = `${navData.heading.toFixed(1)}°`;
        if (velocity) velocity.textContent = `${navData.velocity.toFixed(3)} C`;
        if (destination) destination.textContent = navData.destination;
        
        if (eta && navData.eta) {
            const hoursToETA = Math.round((navData.eta.getTime() - Date.now()) / (1000 * 60 * 60));
            eta.textContent = `${hoursToETA} HOURS`;
        }
    }

    /**
     * Update ship position on star map
     */
    updateShipPosition(navData) {
        const shipMarker = document.getElementById('ship-marker');
        if (!shipMarker) return;
        
        // Calculate map position based on coordinates
        // This is a simplified mapping - in reality you'd use proper coordinate transformation
        const mapX = Math.round(30 + (navData.coordinates.x / 100));
        const mapY = Math.round(10 + (navData.coordinates.y / 100));
        
        // Update ship marker position attributes
        shipMarker.dataset.x = mapX.toString();
        shipMarker.dataset.y = mapY.toString();
        
        // Update tooltip or status
        shipMarker.title = `Ship Position: ${navData.coordinates.x.toFixed(1)}, ${navData.coordinates.y.toFixed(1)}, ${navData.coordinates.z.toFixed(1)}`;
    }

    /**
     * Update navigation status bar
     */
    updateStatusBar() {
        const systemStatus = document.getElementById('nav-system-status');
        const lastUpdate = document.getElementById('nav-last-update');
        const drift = document.getElementById('nav-drift');
        
        if (systemStatus) {
            systemStatus.textContent = 'OPERATIONAL';
            systemStatus.className = 'status-value status-ok';
        }
        
        if (lastUpdate) {
            const now = new Date();
            lastUpdate.textContent = now.toTimeString().substring(0, 8);
        }
        
        if (drift) {
            // Calculate drift based on velocity variations (simplified)
            const driftLevel = Math.random() < 0.1 ? 'MODERATE' : 'MINIMAL';
            drift.textContent = driftLevel;
            drift.className = `status-value ${driftLevel === 'MINIMAL' ? 'status-ok' : 'status-warning'}`;
        }
    }

    /**
     * Set up click handlers for star map interactions
     */
    setupStarMapClickHandlers() {
        const starMap = document.getElementById('star-map');
        if (!starMap) return;
        
        // Handle clicks on clickable elements in the star map
        starMap.addEventListener('click', (event) => {
            const clickable = event.target.closest('.clickable');
            if (!clickable) return;
            
            const x = parseInt(clickable.dataset.x);
            const y = parseInt(clickable.dataset.y);
            
            if (!isNaN(x) && !isNaN(y)) {
                this.showCoordinateDetails(x, y, clickable);
            }
        });
    }

    /**
     * Show details for selected coordinates
     */
    showCoordinateDetails(x, y, element) {
        this.selectedCoordinate = { x, y };
        
        const detailsContent = document.getElementById('coordinate-details');
        if (!detailsContent) return;
        
        // Calculate actual coordinates from map position
        const actualX = (x - 30) * 100;
        const actualY = (y - 10) * 100;
        
        // Determine what was clicked
        const isShip = element.id === 'ship-marker';
        const isStar = element.classList.contains('star-point');
        
        let detailsHTML = `
            <div class="coordinate-info">
                <div class="info-header">COORDINATE ANALYSIS</div>
                <div class="info-grid">
                    <div class="info-row">
                        <span class="info-label">MAP POSITION:</span>
                        <span class="info-value">${x}, ${y}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">ACTUAL COORDS:</span>
                        <span class="info-value">${actualX.toFixed(1)}, ${actualY.toFixed(1)}</span>
                    </div>
        `;
        
        if (isShip) {
            detailsHTML += `
                    <div class="info-row">
                        <span class="info-label">OBJECT TYPE:</span>
                        <span class="info-value status-ok">NOSTROMO VESSEL</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">STATUS:</span>
                        <span class="info-value status-ok">OPERATIONAL</span>
                    </div>
            `;
        } else if (isStar) {
            const starType = this.generateStarInfo(x, y);
            detailsHTML += `
                    <div class="info-row">
                        <span class="info-label">OBJECT TYPE:</span>
                        <span class="info-value">${starType.type}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">MAGNITUDE:</span>
                        <span class="info-value">${starType.magnitude}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">DISTANCE:</span>
                        <span class="info-value">${starType.distance} LY</span>
                    </div>
            `;
        } else {
            detailsHTML += `
                    <div class="info-row">
                        <span class="info-label">OBJECT TYPE:</span>
                        <span class="info-value">EMPTY SPACE</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">SCAN RESULT:</span>
                        <span class="info-value">NO OBJECTS DETECTED</span>
                    </div>
            `;
        }
        
        detailsHTML += `
                </div>
                <div class="info-actions">
                    <button class="nav-button" onclick="window.navigation.calculateRoute(${actualX}, ${actualY})">
                        SET AS WAYPOINT
                    </button>
                </div>
            </div>
        `;
        
        detailsContent.innerHTML = detailsHTML;
        
        // Highlight selected coordinate
        this.highlightCoordinate(element);
    }

    /**
     * Generate star information based on position
     */
    generateStarInfo(x, y) {
        const seed = (x * 7 + y * 13) % 100;
        const starTypes = [
            { type: 'G-CLASS STAR', magnitude: '4.2', distance: '12.7' },
            { type: 'K-CLASS STAR', magnitude: '5.8', distance: '8.3' },
            { type: 'M-CLASS DWARF', magnitude: '7.1', distance: '4.9' },
            { type: 'BINARY SYSTEM', magnitude: '3.9', distance: '15.2' },
            { type: 'RED GIANT', magnitude: '2.1', distance: '23.8' }
        ];
        
        return starTypes[seed % starTypes.length];
    }

    /**
     * Highlight selected coordinate on map
     */
    highlightCoordinate(element) {
        // Remove previous highlights
        const previousHighlight = document.querySelector('.coordinate-highlight');
        if (previousHighlight) {
            previousHighlight.classList.remove('coordinate-highlight');
        }
        
        // Add highlight to selected element
        element.classList.add('coordinate-highlight');
    }

    /**
     * Calculate route to specified coordinates
     */
    calculateRoute(targetX, targetY) {
        if (!this.dataSimulator) return;
        
        const systemData = this.dataSimulator.generateSystemStatus();
        const currentPos = systemData.navigation.coordinates;
        
        // Calculate distance and bearing
        const deltaX = targetX - currentPos.x;
        const deltaY = targetY - currentPos.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const bearing = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        
        // Estimate travel time (simplified)
        const travelTime = distance / (systemData.navigation.velocity * 100); // hours
        
        // Show route calculation results
        const detailsContent = document.getElementById('coordinate-details');
        if (detailsContent) {
            detailsContent.innerHTML = `
                <div class="route-calculation">
                    <div class="info-header">ROUTE CALCULATION</div>
                    <div class="info-grid">
                        <div class="info-row">
                            <span class="info-label">TARGET COORDS:</span>
                            <span class="info-value">${targetX.toFixed(1)}, ${targetY.toFixed(1)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">DISTANCE:</span>
                            <span class="info-value">${distance.toFixed(1)} UNITS</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">BEARING:</span>
                            <span class="info-value">${bearing.toFixed(1)}°</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">EST. TIME:</span>
                            <span class="info-value">${travelTime.toFixed(1)} HOURS</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">STATUS:</span>
                            <span class="info-value status-warning">WAYPOINT SET</span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        console.log(`Route calculated to ${targetX}, ${targetY}: ${distance.toFixed(1)} units, ${bearing.toFixed(1)}°`);
    }

    /**
     * Get current navigation data for external use
     */
    getCurrentNavigationData() {
        if (!this.dataSimulator) return null;
        return this.dataSimulator.generateSystemStatus().navigation;
    }

    /**
     * Validate navigation calculations
     */
    validateNavigationCalculations(navData) {
        const errors = [];
        
        // Validate coordinates
        if (!navData.coordinates || typeof navData.coordinates.x !== 'number') {
            errors.push('Invalid X coordinate');
        }
        if (!navData.coordinates || typeof navData.coordinates.y !== 'number') {
            errors.push('Invalid Y coordinate');
        }
        if (!navData.coordinates || typeof navData.coordinates.z !== 'number') {
            errors.push('Invalid Z coordinate');
        }
        
        // Validate heading (0-360 degrees)
        if (typeof navData.heading !== 'number' || navData.heading < 0 || navData.heading >= 360) {
            errors.push('Invalid heading value');
        }
        
        // Validate velocity (should be positive)
        if (typeof navData.velocity !== 'number' || navData.velocity < 0) {
            errors.push('Invalid velocity value');
        }
        
        return errors;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NostromoNavigation;
} else {
    window.NostromoNavigation = NostromoNavigation;
}