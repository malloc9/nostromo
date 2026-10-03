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
        
        // Waypoint and navigation tracking
        this.waypoints = [
            { name: 'WP-ALPHA', x: 15, y: -20, z: 0, active: true },
            { name: 'WP-BRAVO', x: -10, y: 25, z: 0, active: true },
            { name: 'WP-CHARLIE', x: 25, y: 10, z: 0, active: false }
        ];
        this.currentWaypoint = 0;
        this.courseDeviation = 0; // Degrees off course
        
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
                        <div class="status-item">
                            <span class="status-label">INCLIN:</span>
                            <span class="status-value" id="nav-inclination">--.-°</span>
                        </div>
                        <div class="status-item">
                            <span class="status-label">ECCENTRIC:</span>
                            <span class="status-value" id="nav-eccentricity">.--</span>
                        </div>
                        <div class="status-item">
                            <span class="status-label">PERIOD:</span>
                            <span class="status-value" id="nav-period">--:--:--</span>
                        </div>
                        <div class="status-item">
                            <span class="status-label">APOAPSIS:</span>
                            <span class="status-value" id="nav-apoapsis">---- km</span>
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
                            <div class="data-item">
                                <span class="data-label">COURSE:</span>
                                <span id="nav-course">---°</span>
                            </div>
                            <div class="data-item">
                                <span class="data-label">WPT:</span>
                                <span id="nav-waypoint">-----</span>
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
                    <div class="status-item">
                        <span class="status-label">SWEET:</span>
                        <span class="status-value" id="nav-sweet">0</span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">ELAPSED:</span>
                        <span class="status-value" id="nav-elapsed">00:00:00</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate wireframe terrain HTML with 3D enhancements
     */
    generateTerrainHTML() {
        const size = 20; // Grid size for display
        let html = '<pre class="terrain-wireframe">';
        
        // Generate contour lines with 3D shading
        for (let y = 0; y < size; y++) {
            let line = '';
            for (let x = 0; x < size; x++) {
                // Sample terrain height
                const height = this.getTerrainHeight(x * 5 - size*2.5, y * 5 - size*2.5);
                
                // Calculate shading based on height and simulated lighting
                const shadedHeight = height + Math.sin((x * 0.3) + (y * 0.2)) * 3;
                
                // Convert height to display character with enhanced 3D depth cues and texturing
                let char = ' ';
                const heightAbs = Math.abs(shadedHeight);
                
                if (shadedHeight > 25) char = '█'; // Very high ground/cliffs
                else if (shadedHeight > 20) char = '▓'; // High ground
                else if (shadedHeight > 15) char = '▒'; // Medium-high
                else if (shadedHeight > 10) char = '░'; // Medium
                else if (shadedHeight > 5) char = '‗'; // Slightly elevated
                else if (shadedHeight > 0) char = '▄'; // Low ground
                else if (shadedHeight > -5) char = '▀'; // Very low
                else if (shadedHeight > -10) char = '▐'; // Deep depression
                else if (shadedHeight > -15) char = '▌'; // Very deep
                else char = ' '; // Deepest/minimum
                
                // Add texturing based on height variability for more natural look
                const textureOffset = Math.sin(x * 0.3) * Math.cos(y * 0.3) * 0.5;
                if (Math.abs(textureOffset) > 0.3) {
                    // Add occasional texture variation
                    if (char === '░') char = (Math.random() > 0.5) ? '▒' : '▓';
                    else if (char === '▒') char = (Math.random() > 0.5) ? '░' : '█';
                    else if (char === '▓') char = (Math.random() > 0.5) ? '▒' : '█';
                }
                
                // Apply atmospheric perspective and lighting
                const lightX = size * 0.2;  // Light from upper left
                const lightY = size * 0.2;
                const dx = x - lightX;
                const dy = y - lightY;
                const dist = Math.sqrt(dx*dx + dy*dy);
                const intensity = Math.max(0.2, 1 - dist / (size * 0.8));
                
                // Distance-based fading (atmospheric perspective)
                const distanceFade = Math.max(0.5, 1 - (Math.sqrt(x*x + y*y) / (size * 0.9)));
                const finalIntensity = intensity * distanceFade;
                
                // Apply lighting-based character enhancement
                if (finalIntensity > 0.7) {
                    // Bright areas - use brighter characters
                    if (char === '▓') char = '█';
                    else if (char === '▒') char = '▓';
                    else if (char === '░') char = '▒';
                    else if (char === '▄') char = '▀';
                    else if (char === '▀') char = '▐';
                } else if (finalIntensity < 0.3) {
                    // Darker shades for shadowed areas
                    if (char === '█') char = '▓';
                    else if (char === '▓') char = '▒';
                    else if (char === '▒') char = '░';
                    else if (char === '░') char = '‗';
                    else if (char === '‗') char = '▄';
                    else if (char === '▄') char = '▀';
                    else if (char === '▀') char = '▐';
                    else if (char === '▐') char = ' ';
                }
                
                line += char;
            }
            html += line + '\n';
        }
        
        html += '</pre>';
        return html;
    }

    /**
     * Generate radar display HTML with 3D enhancements
     */
    generateRadarHTML() {
        const size = 20;
        let html = '<pre class="radar-scope">';
        
        // Generate radar concentric circles and sweeps with 3D effects
        for (let y = 0; y < size; y++) {
            let line = '';
            for (let x = 0; x < size; x++) {
                const dx = x - size/2;
                const dy = y - size/2;
                const distance = Math.sqrt(dx*dx + dy*dy);
                
                // Enhanced radar sweep line with multiple effects
                const sweepAngle = (Date.now() % 10000) / 10000 * Math.PI * 2;
                const angleToPoint = Math.atan2(dy, dx);
                const angleDiff = Math.abs(((sweepAngle - angleToPoint + Math.PI) % (Math.PI*2)) - Math.PI);
                
                // Add 3D depth shading based on distance from center
                const depthShading = Math.max(0, 1 - (distance / (size/2))) * 0.8;
                
                // Add range rings with varying intensity
                const rangeIntensity = Math.max(0, 1 - Math.abs(Math.round(distance) - distance) * 2);
                
                let char = ' ';
                if (distance < 0.8) {
                    char = '♦'; // Center (enhanced)
                } else if (Math.abs(distance - 3) < 0.3 || Math.abs(distance - 6) < 0.3 || 
                          Math.abs(distance - 9) < 0.3 || Math.abs(distance - 12) < 0.3 ||
                          Math.abs(distance - 15) < 0.3) {
                    // Enhanced range rings with intensity based on roundness
                    char = rangeIntensity > 0.7 ? '◑' : rangeIntensity > 0.3 ? '◐' : '◒';
                } else if (angleDiff < 0.08 && distance > 0.8 && distance < size/2 - 1) {
                    // 3D sweep line with intensity based on depth and pulse
                    const sweepIntensity = 0.3 + depthShading * 0.7;
                    const pulseIntensity = Math.abs(Math.sin(Date.now() * 0.01)) * 0.3 + 0.7;
                    const finalIntensity = sweepIntensity * pulseIntensity;
                    char = finalIntensity > 0.8 ? '▋' : finalIntensity > 0.6 ? '▊' : finalIntensity > 0.4 ? '▉' : '▊';
                } else if (this.isBlipAt(x, y)) {
                    // Enhanced 3D blip with pulsing and depth shading
                    const blipDepth = distance < size/2 * 0.6 ? '●' : 
                                   distance < size/2 * 0.8 ? '○' : 
                                   distance < size/2 * 0.9 ? '◦' : ' ';
                    // Add pulsing effect to blips
                    const pulseIntensity = Math.abs(Math.sin(Date.now() * 0.015 + distance)) * 0.3 + 0.7;
                    if (pulseIntensity > 0.8 && blipDepth !== ' ') {
                        char = blipDepth === '●' ? '◉' : blipDepth === '○' ? '◎' : '◈';
                    } else {
                        char = blipDepth;
                    }
                } else {
                    // Add subtle background texture for depth
                    const texture = Math.sin(x * 0.2) * Math.cos(y * 0.2) * depthShading * 0.2;
                    if (texture > 0.1) {
                        char = '.';
                    } else if (texture < -0.1) {
                        char = ':';
                    }
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
        // Add slight animation to orbital preview
        const orbitPhase = (Date.now() % 20000) / 20000;
        const orbitOffset = Math.sin(orbitPhase * Math.PI * 2) * 0.3;
        
        return `
            <div class="orbit-ascii">
                <pre class="orbit-display">   ╭─────────╮
  ╱               ╲
 ╱        ● ● ●    ╲ ← Orbit Path
│         ●   ●      │
 ╲        ● ● ●    ╱
  ╲               ╱
   ╰─────────╯
LV-426</pre>
                <div class="orbit-info">
                    <span>INCLINATION: <span id="orbit-inclination">28.5°</span></span><br>
                    <span>ECCENTRICITY: <span id="orbit-eccentricity">0.02</span></span><br>
                    <span>PERIOD: <span id="orbit-period">14.2 hrs</span></span><br>
                    <span>PHASE: <span id="orbit-phase">${((orbitPhase * 100).toFixed(0))}%</span></span>
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
     * Update radar (motion tracker) display
     * The sweep angle is time-based, so each tick naturally advances it
     */
    updateRadarDisplay() {
        this.regenerateRadar();
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
        
        // Update additional orbital parameters
        const inclination = document.getElementById('nav-inclination');
        if (inclination) {
            // Simulate orbital inclination based on coordinates
            const inc = 28.5 + Math.sin(Date.now() * 0.0005) * 2; // Base inclination with slow variation
            inclination.textContent = `${inc.toFixed(1)}°`;
            inclination.className = 'status-value status-ok';
        }
        
        const eccentricity = document.getElementById('nav-eccentricity');
        if (eccentricity) {
            // Calculate orbital eccentricity from velocity and altitude
            const speed = Math.abs(navData.velocity);
            const altFactor = Math.max(0, Math.min(1, navData.coordinates.z / 1000));
            const ecc = Math.min(0.9, Math.max(0.01, speed * 0.5 + altFactor * 0.1));
            eccentricity.textContent = `${ecc.toFixed(2)}`;
            eccentricity.className = `status-value ${ecc < 0.1 ? 'status-ok' : ecc < 0.3 ? 'status-warning' : 'status-critical'}`;
        }
        
        const period = document.getElementById('nav-period');
        if (period) {
            // Calculate orbital period based on altitude (simplified)
            const alt = Math.max(0, navData.coordinates.z + 200);
            // Kepler's third law simplified: T² ∝ r³
            const periodHours = Math.max(1, Math.pow((alt + 6371) / 6371, 1.5) * 1.5); // Rough approximation
            const hours = Math.floor(periodHours).toString().padStart(2, '0');
            const minutes = Math.floor((periodHours % 1) * 60).toString().padStart(2, '0');
            const seconds = Math.floor((periodHours * 60 % 1) * 60).toString().padStart(2, '0');
            period.textContent = `${hours}:${minutes}:${seconds}`;
            period.className = 'status-value status-ok';
        }
        
        const apoapsis = document.getElementById('nav-apoapsis');
        if (apoapsis) {
            // Calculate apoapsis (farthest point) based on energy
            const speedSquared = navData.velocity * navData.velocity;
            const altitude = Math.max(0, navData.coordinates.z + 200);
            // Simplified energy calculation for apoapsis
            const apoapsisKm = Math.max(altitude, altitude + (speedSquared * 10000));
            apoapsis.textContent = `${Math.floor(apoapsisKm).toString().padStart(4, ' ')} km`;
            apoapsis.className = 'status-value status-ok';
        }
        
        // Update course and waypoint information
        const course = document.getElementById('nav-course');
        if (course) {
            // Calculate course deviation based on current heading and target waypoint
            const targetWP = this.waypoints[this.currentWaypoint];
            if (targetWP) {
                const dx = targetWP.x - navData.coordinates.x;
                const dy = targetWP.y - navData.coordinates.y;
                const targetBearing = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
                this.courseDeviation = ((targetBearing - navData.heading + 540) % 360) - 180;
                course.textContent = `${this.courseDeviation.toFixed(0)}°`;
                
                // Color code based on deviation
                const absDeviation = Math.abs(this.courseDeviation);
                course.className = `status-value ${absDeviation < 5 ? 'status-ok' : absDeviation < 15 ? 'status-warning' : 'status-critical'}`;
            } else {
                course.textContent = '---°';
                course.className = 'status-value';
            }
        }
        
        const waypoint = document.getElementById('nav-waypoint');
        if (waypoint) {
            const targetWP = this.waypoints[this.currentWaypoint];
            if (targetWP) {
                waypoint.textContent = targetWP.name;
                
                // Check if we've reached the waypoint
                const dx = targetWP.x - navData.coordinates.x;
                const dy = targetWP.y - navData.coordinates.y;
                const distanceToWP = Math.sqrt(dx*dx + dy*dy);
                
                if (distanceToWP < 2 && targetWP.active) {
                    // Waypoint reached, move to next
                    targetWP.active = false;
                    this.currentWaypoint = (this.currentWaypoint + 1) % this.waypoints.length;
                    // Activate next waypoint
                    const nextWP = this.waypoints[this.currentWaypoint];
                    if (nextWP) nextWP.active = true;
                }
                
                // Color code based on status
                // Reuse existing distanceToWP variable from waypoint check above
                waypoint.className = `status-value ${distanceToWP < 2 ? 'status-warning' : 'status-ok'}`;
            } else {
                waypoint.textContent = '-----';
                waypoint.className = 'status-value';
            }
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
        
        // Update sweet (signal strength/efficiency) telemetry
        const sweet = document.getElementById('nav-sweet');
        if (sweet) {
            // Simulate signal strength based on various factors
            const baseSweet = 75 + Math.sin(Date.now() * 0.001) * 10; // Base oscillation
            const pingBonus = this.motionTrackerBlips.length > 0 ? 15 : 0; // Bonus for contacts
            const navBonus = Math.abs(this.courseDeviation) < 5 ? 10 : Math.abs(this.courseDeviation) < 15 ? 5 : 0; // Bonus for good navigation
            const sweetValue = Math.min(95, baseSweet + pingBonus + navBonus);
            sweet.textContent = `${sweetValue.toFixed(0)}`;
            sweet.className = `status-value ${sweetValue > 80 ? 'status-ok' : sweetValue > 60 ? 'status-warning' : 'status-critical'}`;
        }
        
        // Update elapsed mission time
        const elapsed = document.getElementById('nav-elapsed');
        if (elapsed) {
            // Simulate mission elapsed time (starting from some arbitrary point)
            const missionStart = Date.now() - (3 * 24 * 60 * 60 * 1000); // 3 days ago
            const elapsedMs = Date.now() - missionStart;
            const totalSeconds = Math.floor(elapsedMs / 1000);
            const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
            const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
            const seconds = (totalSeconds % 60).toString().padStart(2, '0');
            elapsed.textContent = `${hours}:${minutes}:${seconds}`;
            elapsed.className = 'status-value status-ok';
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