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

        this.starMapSeed = Date.now(); // Seed for random star generation
        
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
        this.setupResizeHandler();
        console.log('Navigation system activated');
    }

    /**
     * Deactivate navigation screen and stop updates
     */
    deactivate() {
        this.isActive = false;
        this.stopRealTimeUpdates();
        this.removeResizeHandler();
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
     * Setup window resize handler to regenerate star map
     */
    setupResizeHandler() {
        this.resizeHandler = () => {
            if (this.isActive) {
                // Debounce resize events
                clearTimeout(this.resizeTimeout);
                this.resizeTimeout = setTimeout(() => {
                    this.regenerateStarMap();
                }, 300);
            }
        };
        window.addEventListener('resize', this.resizeHandler);
    }

    /**
     * Remove window resize handler
     */
    removeResizeHandler() {
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
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
        
        // Force regeneration after DOM is updated to get correct dimensions
        setTimeout(() => {
            this.regenerateStarMap();
        }, 100);
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
     * Calculate optimal map width based on container size
     */
    calculateMapWidth() {
        // Try to get the actual container width
        const starMapElement = document.querySelector('.star-map');
        if (starMapElement) {
            const containerWidth = starMapElement.clientWidth;
            // Account for padding and scrollbar, use monospace character width (~6px at 10px font)
            const charWidth = 6;
            const availableWidth = Math.floor((containerWidth - 20) / charWidth);
            // Ensure minimum and maximum bounds, make it fill most of the space
            return Math.max(100, Math.min(250, availableWidth));
        }
        // Fallback to a larger default that should fill most screens
        return 180;
    }

    /**
     * Calculate optimal map height based on container size
     */
    calculateMapHeight() {
        // Try to get the actual container height
        const starMapElement = document.querySelector('.star-map');
        if (starMapElement) {
            const containerHeight = starMapElement.clientHeight;
            // Account for padding, use line height (~12px at 10px font with 1.2 line-height)
            const lineHeight = 12;
            const availableHeight = Math.floor((containerHeight - 20) / lineHeight);
            // Ensure minimum and maximum bounds
            return Math.max(25, Math.min(80, availableHeight));
        }
        // Fallback to a good default height
        return 45;
    }

    /**
     * Generate ASCII star map with coordinate grid and ship position
     */
    generateStarMap() {
        // Calculate dynamic width based on container size
        const mapWidth = this.calculateMapWidth();
        const mapHeight = this.calculateMapHeight();
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

        // Generate more random star positions using better randomization
        const starPositions = this.generateRandomStarPositions(mapWidth, mapHeight, this.starMapSeed);

        // Generate star field with grid
        for (let y = 0; y < mapHeight; y++) {
            // Y-axis labels
            mapHTML += `${String(y * 10).padStart(3, ' ')} `;
            
            for (let x = 0; x < mapWidth; x++) {
                let char = ' ';
                
                // Grid lines (lighter grid)
                if (x % 10 === 0) {
                    char = '│';
                } else if (y % 5 === 0 && x % 5 === 0) {
                    char = '┼';
                } else if (y % 5 === 0) {
                    char = '─';
                }
                
                // Check if there's a star at this position
                const starKey = `${x},${y}`;
                if (starPositions.has(starKey) && char === ' ') {
                    const starType = starPositions.get(starKey);
                    char = starType;
                }
                
                // Ship position (more prominent and centered)
                const shipX = Math.floor(mapWidth / 2);
                const shipY = Math.floor(mapHeight / 2);
                if (x === shipX && y === shipY) {
                    char = '<span class="ship-position" id="ship-marker">◆</span>';
                } else if (char !== ' ' && char !== '│' && char !== '┼' && char !== '─') {
                    char = `<span class="star-point">${char}</span>`;
                }
                
                mapHTML += char;
            }
            mapHTML += '\n';
        }
        
        mapHTML += '</pre>';
        return mapHTML;
    }

    /**
     * Generate random star positions with better distribution
     */
    generateRandomStarPositions(width, height, baseSeed = 12345) {
        const starPositions = new Map();
        const starTypes = ['·', '∘', '*', '✦', '✧', '⋆', '✱', '✯', '⊙', '☆', '✶', '✴', '◦', '●', '○', '◉'];
        const starDensity = 0.15; // 15% chance of star per position - even more stars
        const nebulaTypes = ['░', '▒', '▓']; // Nebula characters for background
        
        // Use a more sophisticated random number generator for better distribution
        const seedRandom = (seed) => {
            let x = Math.sin(seed + baseSeed) * 10000;
            return x - Math.floor(x);
        };
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                // Create multiple seeds for better randomness
                const seed1 = x * 73 + y * 137 + 42;
                const seed2 = x * 97 + y * 163 + 17;
                const seed3 = x * 113 + y * 179 + 89;
                
                const random1 = seedRandom(seed1);
                const random2 = seedRandom(seed2);
                const random3 = seedRandom(seed3);
                
                // Combine multiple random values for better distribution
                const combinedRandom = (random1 + random2 + random3) / 3;
                
                if (combinedRandom < starDensity) {
                    // Choose star type based on another random value
                    const typeIndex = Math.floor(random2 * starTypes.length);
                    const starType = starTypes[typeIndex];
                    
                    // Add some clustering by checking nearby positions
                    const clusterBonus = this.getClusterBonus(x, y, starPositions);
                    if (combinedRandom < starDensity + clusterBonus) {
                        starPositions.set(`${x},${y}`, starType);
                    }
                } else if (combinedRandom < starDensity + 0.03) {
                    // Add some nebula effects (3% chance)
                    const nebulaIndex = Math.floor(random3 * nebulaTypes.length);
                    const nebulaType = nebulaTypes[nebulaIndex];
                    starPositions.set(`${x},${y}`, `<span class="nebula-point">${nebulaType}</span>`);
                }
            }
        }
        
        return starPositions;
    }

    /**
     * Calculate clustering bonus for more realistic star distribution
     */
    getClusterBonus(x, y, existingStars) {
        let nearbyStars = 0;
        const checkRadius = 3;
        
        for (let dy = -checkRadius; dy <= checkRadius; dy++) {
            for (let dx = -checkRadius; dx <= checkRadius; dx++) {
                if (dx === 0 && dy === 0) continue;
                const key = `${x + dx},${y + dy}`;
                if (existingStars.has(key)) {
                    nearbyStars++;
                }
            }
        }
        
        // Small bonus for clustering, but not too much
        return nearbyStars * 0.01;
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
        
        // Calculate map position based on coordinates (dynamic map size)
        const mapWidth = this.calculateMapWidth();
        const mapHeight = this.calculateMapHeight();
        const mapCenterX = Math.floor(mapWidth / 2);
        const mapCenterY = Math.floor(mapHeight / 2);
        const mapX = Math.round(mapCenterX + (navData.coordinates.x / 400));
        const mapY = Math.round(mapCenterY + (navData.coordinates.y / 400));
        
        // Keep ship within map bounds
        const clampedX = Math.max(0, Math.min(mapWidth - 1, mapX));
        const clampedY = Math.max(0, Math.min(mapHeight - 1, mapY));
        
        // Update ship marker position attributes
        shipMarker.dataset.x = clampedX.toString();
        shipMarker.dataset.y = clampedY.toString();
        
        // Update tooltip with more detailed information
        shipMarker.title = `NOSTROMO POSITION\nCoords: ${navData.coordinates.x.toFixed(1)}, ${navData.coordinates.y.toFixed(1)}, ${navData.coordinates.z.toFixed(1)}\nHeading: ${navData.heading.toFixed(1)}°\nVelocity: ${navData.velocity.toFixed(3)}c`;
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
        // Click handlers removed - no coordinate details functionality
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
        
        // Route calculation completed (no UI display)
        
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
     * Regenerate star map with new random seed
     */
    regenerateStarMap(seed = null) {
        if (seed !== null) {
            this.starMapSeed = seed;
        } else {
            this.starMapSeed = Date.now();
        }
        
        const starMapElement = document.getElementById('star-map');
        if (starMapElement) {
            starMapElement.innerHTML = this.generateStarMap();
            this.setupStarMapClickHandlers();
        }
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