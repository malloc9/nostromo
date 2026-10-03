/**
 * Nostromo Navigation Screen - Redesigned
 * Wireframe terrain map, motion tracker, and orbital visualization
 * Inspired by the Alien movie navigation displays
 */

class NostromoNavigation {
    constructor(dataSimulator) {
        this.dataSimulator = dataSimulator;
        this.refreshInterval = null;
        this.refreshRate = 1500; // 1.5 seconds for more dynamic feel
        this.isActive = false;
        this.terrainMap = null;
        this.motionTracker = null;
        this.orbitalPath = null;
        
        // Terrain simulation parameters
        this.terrainSize = 100;
        this.terrainScale = 10;
        this.terrainSeed = Date.now();
        
        // Motion tracker
        this.motionTrackerRange = 50; // units
        this.motionTrackerBlips = [];
        this.lastPingTime = 0;
        this.pingInterval = 8000 + Math.random() * 4000; // 8-12 seconds
        
        // Orbital elements
        this.orbitPoints = [];
        this.orbitProgress = 0;
        
        this.init();
    }

    init() {
        console.log('Nostromo Navigation system initialized');
        this.regenerateTerrain();
        this.generateOrbitalPath();
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
                this.updateMotionTracker();
                this.updateOrbitalDisplay();
            }
        }, this.refreshRate);
    }

    /**
     * Stop real-time updates
     */
    stopRealTimeUpdates() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    /**
     * Setup window resize handler
     */
    setupResizeHandler() {
        this.resizeHandler = () => {
            if (this.isActive) {
                clearTimeout(this.resizeTimeout);
                this.resizeTimeout = setTimeout(() => {
                    this.regenerateDisplays();
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
        this.setupEventListeners();
        this.updateAllDisplays();
        
        // Force regeneration after DOM update
        setTimeout(() => {
            this.regenerateDisplays();
        }, 100);
    }

    /**
     * Generate the complete navigation HTML structure
     */
    generateNavigationHTML() {
        return `
            <div class="navigation-container">
                <!-- Ship Status and Orbital Info -->
                <div class="nav-status-section">
                    <div class="section-header">ORBITAL STATUS</div>
                    <div class="status-grid">
                        <div class="status-item">
                            <span class="status-label">ORBIT:</span>
                            <span class="status-value" id="nav-orbit">STABLE</span>
                        </div>
                        <div class="status-item">
                            <span class="status-label">ALTITUDE:</span>
                            <span class="status-value" id="nav-altitude">--.-- km</span>
                        </div>
                        <div class="status-item">
                            <span class="status-label">VELOCITY:</span>
                            <span class="status-value" id="nav-velocity">-.--- C</span>
                        </div>
                        <div class="status-item">
                            <span class="status-label">HEADING:</span>
                            <span class="status-value" id="nav-heading">---°</span>
                        </div>
                    </div>
                </div>

                <!-- Main Display: Terrain and Motion Tracker -->
                <div class="main-display">
                    <!-- Wireframe Terrain Map -->
                    <div class="terrain-section">
                        <div class="section-header">LV-426 TERRAIN SURVEY</div>
                        <div class="terrain-container">
                            <div class="terrain-grid" id="terrain-grid">
                                ${this.generateTerrainHTML()}
                            </div>
                            <div class="terrain-coords">
                                <span>X: <span id="terrain-x">----</span></span> |
                                <span>Y: <span id="terrain-y">----</span></span> |
                                <span>Z: <span id="terrain-z">----</span></span>
                            </div>
                        </div>
                    </div>

                    <!-- Motion Tracker Radar -->
                    <div class="motion-tracker-section">
                        <div class="section-header">MOTION TRACKER</div>
                        <div class="motion-tracker-container">
                            <div class="radar-display" id="radar-display">
                                ${this.generateRadarHTML()}
                            </div>
                            <div class="radar-controls">
                                <span class="range-label">RANGE: <span id="radar-range">${this.motionTrackerRange}</span>m</span>
                                <span class="status-indicator" id="radar-status">SEARCHING</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Navigation Data and Coordinates -->
                <div class="nav-data-section">
                    <div class="section-header">NAVIGATION DATA</div>
                    <div class="data-grid">
                        <div class="data-column">
                            <div class="data-item">
                                <span class="data-label">POSITION:</span>
                                <div class="coord-triplet">
                                    <span class="coord-axis">X</span>: <span id="pos-x">----</span><br>
                                    <span class="coord-axis">Y</span>: <span id="pos-y">----</span><br>
                                    <span class="coord-axis">Z</span>: <span id="pos-z">----</span>
                                </div>
                            </div>
                            <div class="data-item">
                                <span class="data-label">DESTINATION:</span>
                                <span id="nav-destination">LV-426</span>
                            </div>
                            <div class="data-item">
                                <span class="data-label">ETA:</span>
                                <span id="nav-eta">--:--</span>
                            </div>
                        </div>
                        <div class="data-column">
                            <div class="data-item">
                                <span class="data-label">ORBITAL PATH:</span>
                                <div id="orbital-path-preview">
                                    ${this.generateOrbitalPreviewHTML()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Status Bar -->
                <div class="nav-status-bar">
                    <div class="status-item">
                        <span class="status-label">NAV STATUS:</span>
                        <span class="status-value" id="nav-system-status">OPERATIONAL</span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">LAST PING:</span>
                        <span class="status-value" id="nav-last-ping">--:--:--</span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">CONTACTS:</span>
                        <span class="status-value" id="nav-contacts">0</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate wireframe terrain HTML
     */
    generateTerrainHTML() {
        const size = 20; // Grid size for display
        let html = '<pre class="terrain-wireframe">';
        
        // Generate contour lines
        for (let y = 0; y < size; y++) {
            let line = '';
            for (let x = 0; x < size; x++) {
                // Sample terrain height
                const height = this.getTerrainHeight(x * 5 - size*2.5, y * 5 - size*2.5);
                
                // Convert height to display character
                let char = ' ';
                if (height > 20) char = '#'; // High ground
                else if (height > 10) char = '+'; // Medium
                else if (height > 0) char = '.'; // Low
                else if (height > -10) char = ','; // Very low
                else char = ' '; // Deep/minimum
                
                line += char;
            }
            html += line + '\n';
        }
        
        html += '</pre>';
        return html;
    }

    /**
     * Generate radar display HTML
     */
    generateRadarHTML() {
        const size = 20;
        let html = '<pre class="radar-scope">';
        
        // Generate radar concentric circles and sweeps
        for (let y = 0; y < size; y++) {
            let line = '';
            for (let x = 0; x < size; x++) {
                const dx = x - size/2;
                const dy = y - size/2;
                const distance = Math.sqrt(dx*dx + dy*dy);
                
                // Radar sweep line (current angle)
                const sweepAngle = (Date.now() % 10000) / 10000 * Math.PI * 2;
                const angleToPoint = Math.atan2(dy, dx);
                const angleDiff = Math.abs(((sweepAngle - angleToPoint + Math.PI) % (Math.PI*2)) - Math.PI);
                
                let char = ' ';
                if (distance < 1) {
                    char = '+'; // Center
                } else if (Math.abs(distance - 3) < 0.5 || Math.abs(distance - 6) < 0.5 || 
                          Math.abs(distance - 9) < 0.5 || Math.abs(distance - 12) < 0.5) {
                    char = '○'; // Range rings
                } else if (angleDiff < 0.1 && distance > 1 && distance < size/2 - 1) {
                    char = '▋'; // Sweep line
                } else if (this.isBlipAt(x, y)) {
                    char = '●'; // Motion tracker blip
                }
                
                line += char;
            }
            html += line + '\n';
        }
        
        html += '</pre>';
        return html;
    }

    /**
     * Generate orbital path preview HTML
     */
    generateOrbitalPreviewHTML() {
        return `
            <div class="orbit-ascii">
                <pre class="orbit-display">  ╭───────╮
 ╱         ╲
│   ● ● ●   │  ← Orbit Path
 ╲         ╱
  ╰───────╯
LV-426</pre>
                <div class="orbit-info">
                    <span>INCLINATION: 28.5°</span><br>
                    <span>ECCENTRICITY: 0.02</span><br>
                    <span>PERIOD: 14.2 hrs</span>
                </div>
            </div>
        `;
    }

    /**
     * Get terrain height at coordinates (procedural generation)
     */
    getTerrainHeight(x, y) {
        // Simple procedural terrain using sine waves
        const frequency1 = 0.1;
        const frequency2 = 0.3;
        const amplitude1 = 15;
        const amplitude2 = 8;
        
        const height1 = Math.sin(x * frequency1 + this.terrainSeed * 0.001) * 
                       Math.cos(y * frequency1 + this.terrainSeed * 0.001) * amplitude1;
        const height2 = Math.sin(x * frequency2 + this.terrainSeed * 0.002) * 
                       Math.cos(y * frequency2 + this.terrainSeed * 0.002) * amplitude2;
        
        return height1 + height2;
    }

    /**
     * Check if there's a motion tracker blip at radar coordinates
     */
    isBlipAt(radarX, radarY) {
        // Convert radar coordinates to actual positions
        const center = 10; // Assuming 20x20 grid, center at 10,10
        const scale = this.motionTrackerRange / 10; // pixels to world units
        
        const worldX = (radarX - center) * scale;
        const worldY = (radarY - center) * scale;
        
        // Check against active blips
        return this.motionTrackerBlips.some(blip => {
            const dx = blip.x - worldX;
            const dy = blip.y - worldY;
            const distance = Math.sqrt(dx*dx + dy*dy);
            return distance < scale * 0.8; // Blip size
        });
    }

    /**
     * Update all navigation displays
     */
    updateAllDisplays() {
        this.updatePositionDisplay();
        this.updateNavigationInfo();
        this.updateTerrainDisplay();
        this.updateRadarDisplay();
        this.updateStatusBar();
        this.updateOrbitalDisplay();
    }

    /**
     * Update navigation data from simulator
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
        this.updateStatusBar(navData);
    }

    /**
     * Update position coordinate display
     */
    updatePositionDisplay(navData) {
        if (!navData) navData = this.dataSimulator.generateSystemStatus().navigation;
        
        const posX = document.getElementById('pos-x');
        const posY = document.getElementById('pos-y');
        const posZ = document.getElementById('pos-z');
        
        if (posX) posX.textContent = navData.coordinates.x.toFixed(0);
        if (posY) posY.textContent = navData.coordinates.y.toFixed(0);
        if (posZ) posZ.textContent = navData.coordinates.z.toFixed(0);
    }

    /**
     * Update navigation information display
     */
    updateNavigationInfo(navData) {
        if (!navData) navData = this.dataSimulator.generateSystemStatus().navigation;
        
        const heading = document.getElementById('nav-heading');
        const velocity = document.getElementById('nav-velocity');
        const destination = document.getElementById('nav-destination');
        const eta = document.getElementById('nav-eta');
        const altitude = document.getElementById('nav-altitude');
        const orbit = document.getElementById('nav-orbit');
        
        if (heading) heading.textContent = `${navData.heading.toFixed(0)}°`;
        if (velocity) velocity.textContent = `${navData.velocity.toFixed(3)} C`;
        if (destination) destination.textContent = navData.destination;
        
        if (eta && navData.eta) {
            const hoursToETA = Math.max(0, Math.round((navData.eta.getTime() - Date.now()) / (1000 * 60)));
            const hours = String(hoursToETA).padStart(2, '0');
            const mins = String(hoursToETA % 60).padStart(2, '0');
            eta.textContent = `${hours}:${mins}`;
        }
        
        if (altitude) {
            // Calculate approximate altitude from Z coordinate
            const alt = Math.max(0, navData.coordinates.z + 200); // Offset for display
            altitude.textContent = `${alt.toFixed(0)} km`;
        }
        
        if (orbit) {
            // Determine orbit status based on velocity and altitude
            const orbitStatus = navData.velocity > 0.1 ? 'DECAY' : 'STABLE';
            orbit.textContent = orbitStatus;
            orbit.className = `status-value ${orbitStatus === 'STABLE' ? 'status-ok' : 'status-warning'}`;
        }
    }

    /**
     * Update terrain display with current position marker
     */
    updateTerrainDisplay() {
        if (!this.dataSimulator) return;
        
        const navData = this.dataSimulator.generateSystemStatus().navigation;
        const terrainX = document.getElementById('terrain-x');
        const terrainY = document.getElementById('terrain-y');
        const terrainZ = document.getElementById('terrain-z');
        
        if (terrainX) terrainX.textContent = Math.round(navData.coordinates.x);
        if (terrainY) terrainY.textContent = Math.round(navData.coordinates.y);
        if (terrainZ) terrainZ.textContent = Math.round(navData.coordinates.z);
    }

    /**
     * Update motion tracker with new blips and pings
     */
    updateMotionTracker() {
        const now = Date.now();
        
        // Generate occasional blips
        if (Math.random() < 0.3) { // 30% chance per update
            // Generate random blip within range
            const angle = Math.random() * Math.PI * 2;
            const distance = 0.2 + Math.random() * 0.8; // 20%-100% of range
            const worldX = Math.cos(angle) * distance * this.motionTrackerRange;
            const worldY = Math.sin(angle) * distance * this.motionTrackerRange;
            
            this.motionTrackerBlips.push({
                x: worldX,
                y: worldY,
                time: now,
                lifetime: 5000 + Math.random() * 3000 // 5-8 seconds
            });
        }
        
        // Remove expired blips
        this.motionTrackerBlips = this.motionTrackerBlips.filter(blip => 
            now - blip.time < blip.lifetime
        );
        
        // Check for ping
        if (now - this.lastPingTime > this.pingInterval) {
            this.lastPingTime = now;
            this.pingInterval = 8000 + Math.random() * 4000; // New random interval
            
            // Play ping sound via audio manager
            if (window.audioManager) {
                window.audioManager.playSound('navigation', 0.7);
            }
            
            // Add a strong central blip for the ping
            this.motionTrackerBlips.push({
                x: 0,
                y: 0,
                time: now,
                lifetime: 1000 // Short-lived ping indicator
            });
        }
    }

    /**
     * Update orbital path display
     */
    updateOrbitalDisplay() {
        // Slowly progress along orbital path for animation
        this.orbitProgress = (this.orbitProgress + 0.5) % 360;
    }

    /**
     * Update status bar information
     */
    updateStatusBar(navData) {
        if (!navData) navData = this.dataSimulator.generateSystemStatus().navigation;
        
        const systemStatus = document.getElementById('nav-system-status');
        const lastPing = document.getElementById('nav-last-ping');
        const contacts = document.getElementById('nav-contacts');
        
        if (systemStatus) {
            systemStatus.textContent = 'OPERATIONAL';
            systemStatus.className = 'status-value status-ok';
        }
        
        if (lastPing) {
            const time = new Date(this.lastPingTime);
            lastPing.textContent = time.toTimeString().substring(0, 8);
        }
        
        if (contacts) {
            contacts.textContent = this.motionTrackerBlips.length.toString();
            contacts.className = `status-value ${this.motionTrackerBlips.length > 0 ? 'status-warning' : 'status-ok'}`;
        }
    }

    /**
     * Regenerate all procedural displays
     */
    regenerateDisplays() {
        this.regenerateTerrain();
        this.regenerateRadar();
    }

    /**
     * Regenerate terrain wireframe
     */
    regenerateTerrain() {
        const terrainGrid = document.getElementById('terrain-grid');
        if (terrainGrid) {
            terrainGrid.innerHTML = this.generateTerrainHTML();
        }
    }

    /**
     * Regenerate radar display
     */
    regenerateRadar() {
        const radarDisplay = document.getElementById('radar-display');
        if (radarDisplay) {
            radarDisplay.innerHTML = this.generateRadarHTML();
        }
    }

    /**
     * Generate orbital path for animation
     */
    generateOrbitalPath() {
        // Generate elliptical orbit points
        this.orbitPoints = [];
        const centerX = 0;
        const centerY = 0;
        const radiusX = 80; // X radius
        const radiusY = 40; // Y radius (elliptical)
        const points = 32;
        
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * radiusX;
            const y = centerY + Math.sin(angle) * radiusY;
            this.orbitPoints.push({x, y});
        }
    }

    /**
     * Setup event listeners for interactions
     */
    setupEventListeners() {
        // Click handlers for terrain inspection
        const terrainGrid = document.getElementById('terrain-grid');
        if (terrainGrid) {
            terrainGrid.addEventListener('click', (e) => {
                // In a real implementation, this would show detailed terrain data
                if (window.audioManager) {
                    window.audioManager.playSound('beep', 0.3);
                }
            });
        }
        
        // Radar display click
        const radarDisplay = document.getElementById('radar-display');
        if (radarDisplay) {
            radarDisplay.addEventListener('click', (e) => {
                // Ping the motion tracker manually
                if (window.audioManager) {
                    window.audioManager.playSound('navigation', 0.5);
                }
                this.lastPingTime = Date.now() - this.pingInterval - 1000; // Trigger immediate ping
            });
        }
    }

    /**
     * Get current navigation data for external use
     */
    getCurrentNavigationData() {
        if (!this.dataSimulator) return null;
        return this.dataSimulator.generateSystemStatus().navigation;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NostromoNavigation;
} else {
    window.NostromoNavigation = NostromoNavigation;
}