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
                this.updateWaypointDisplay();
                this.regenerateRadar();
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
                            <div class="terrain-scanlines"></div>
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
                                <span class="status-indicator searching" id="radar-status">SEARCHING</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Waypoint Navigation -->
                <div class="nav-waypoint-section">
                    <div class="section-header">WAYPOINTS</div>
                    <div class="wp-list" id="wp-list">
                        ${this.waypoints.map((wp, i) => `
                            <div class="wp-item ${i === this.currentWaypoint ? 'wp-active' : ''}" id="wp-item-${i}">
                                <span class="wp-name">${wp.name}</span>
                                <span class="wp-distance" id="wp-dist-${i}">DIST: ----</span>
                                <span class="wp-status ${i === this.currentWaypoint ? 'status-ok' : ''}" id="wp-status-${i}">${i === this.currentWaypoint ? 'TRACKING' : 'QUEUED'}</span>
                            </div>
                        `).join('')}
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
                                    <span class="coord-axis">X</span>: <span id="pos-x">----</span>
                                    <span class="coord-axis">Y</span>: <span id="pos-y">----</span>
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
                                <span class="data-label">COURSE DEV:</span>
                                <span id="nav-course">---°</span>
                            </div>
                            <div class="data-item">
                                <span class="data-label">TARGET WPT:</span>
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

                <!-- Expanded Status Bar -->
                <div class="nav-status-bar">
                    <div class="status-item">
                        <span class="status-label">NAV SYS:</span>
                        <span class="status-value status-ok" id="nav-system-status">OPERATIONAL</span>
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
                        <span class="status-label">SIGNAL:</span>
                        <span class="status-value" id="nav-signal">---</span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">SWEET:</span>
                        <span class="status-value" id="nav-sweet">0</span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">ELAPSED:</span>
                        <span class="status-value" id="nav-elapsed">00:00:00</span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">THREAT:</span>
                        <span class="status-value status-ok" id="nav-threat">NONE</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate wireframe terrain HTML with 3D enhancements
     */
    generateTerrainHTML() {
        const size = 24; // Grid size for display
        let html = '<pre class="terrain-wireframe">';
        
        // Pre-compute heights for slope calculation
        const heights = [];
        for (let y = 0; y < size; y++) {
            heights[y] = [];
            for (let x = 0; x < size; x++) {
                heights[y][x] = this.getTerrainHeight(x * 4 - size * 2, y * 4 - size * 2);
            }
        }
        
        for (let y = 0; y < size; y++) {
            let line = '';
            for (let x = 0; x < size; x++) {
                const h = heights[y][x];
                
                // Slope-based shading (hillshading): compare with neighbor to the upper-left
                const hUp = y > 0 ? heights[y - 1][x] : h;
                const hLeft = x > 0 ? heights[y][x - 1] : h;
                const slope = (h - hUp + h - hLeft) * 0.5;
                
                // Combine height and slope for a more realistic 3D look
                const shaded = h * 0.6 + slope * 2.5;
                
                // Map to character using contour levels
                let char = ' ';
                if (shaded > 22) char = '█';
                else if (shaded > 16) char = '▓';
                else if (shaded > 11) char = '▒';
                else if (shaded > 7) char = '░';
                else if (shaded > 3) char = '▄';
                else if (shaded > 0) char = '‗';
                else if (shaded > -3) char = '▀';
                else if (shaded > -7) char = '▐';
                else if (shaded > -11) char = '▌';
                else if (shaded > -15) char = '·';
                else char = ' ';
                
                // Atmospheric perspective: fade distant cells (far from upper-left light)
                const lightDist = Math.sqrt((x - size * 0.15) ** 2 + (y - size * 0.15) ** 2);
                const fade = Math.max(0.4, 1 - lightDist / (size * 0.75));
                
                if (fade < 0.55 && char !== ' ') {
                    // Push dim cells one step down in density
                    const dimMap = { '█': '▓', '▓': '▒', '▒': '░', '░': '▄', '▄': '‗', '‗': '▀', '▀': '▐', '▐': '·' };
                    char = dimMap[char] || ' ';
                }
                
                // Subtle texture noise on mid-range cells
                const noise = Math.sin(x * 0.7 + y * 0.5) * Math.cos(x * 0.3 - y * 0.4);
                if (Math.abs(shaded) < 8 && noise > 0.4 && char !== ' ') {
                    char = Math.random() > 0.5 ? '·' : '‗';
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
        const size = 22;
        const cx = size / 2;
        const cy = size / 2;
        const sweepAngle = (Date.now() % 10000) / 10000 * Math.PI * 2;
        const ringRadii = [3, 5.5, 8, 10.5];
        
        let html = '<pre class="radar-scope">';
        
        // Top row: bearing labels
        html += '   N    NE     E\n';
        
        for (let y = 0; y < size; y++) {
            let line = '';
            for (let x = 0; x < size; x++) {
                const dx = x - cx;
                const dy = y - cy;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Polar coordinate check: outside outer ring -> blank
                if (distance > size / 2 - 0.5) {
                    line += ' ';
                    continue;
                }
                
                const angleToPoint = Math.atan2(dy, dx);
                const angleDiff = Math.abs(((sweepAngle - angleToPoint + Math.PI) % (Math.PI * 2)) - Math.PI);
                
                let char = ' ';
                
                // Center marker
                if (distance < 0.8) {
                    char = '◆'; // diamond
                }
                // Range rings
                else {
                    let onRing = false;
                    for (const r of ringRadii) {
                        if (Math.abs(distance - r) < 0.4) { onRing = true; break; }
                    }
                    if (onRing) {
                        char = '·'; // middle dot
                    }
                    // Sweep beam with trailing fade
                    else if (angleDiff < 0.12 && distance > 1) {
                        const trailIntensity = 1 - angleDiff / 0.12;
                        char = trailIntensity > 0.7 ? '█' : trailIntensity > 0.4 ? '▒' : '░';
                    }
                    // Blips
                    else if (this.isBlipAt(x, y)) {
                        const pulse = Math.abs(Math.sin(Date.now() * 0.015 + distance));
                        char = pulse > 0.5 ? '●' : '○';
                    }
                    // Subtle phosphor afterglow texture
                    else {
                        const glow = Math.sin(x * 0.3 + y * 0.2) * Math.cos(x * 0.1 - y * 0.3);
                        char = glow > 0.55 ? '·' : ' ';
                    }
                }
                
                line += char;
            }
            html += line + '\n';
        }
        
        // Bottom row: bearing labels
        html += '   S    SW     W\n';
        
        html += '</pre>';
        return html;
    }

    /**
     * Generate orbital path preview HTML
     */
    generateOrbitalPreviewHTML() {
        const orbitPhase = (Date.now() % 20000) / 20000;
        const phasePct = Math.round(orbitPhase * 100);
        
        return `
            <div class="orbit-ascii">
                <pre class="orbit-display">    ╭───────────╮
  ╱               ╲
 ╱    ●  ●  ●     ╲
│     ●     ●      │
 ╲    ●  ●  ●     ╱
  ╲               ╱
   ╰───────────╯
   LV-426</pre>
                <div class="orbit-info">
                    <div>INCL: <span id="orbit-inclination">28.5°</span> &nbsp; ECC: <span id="orbit-eccentricity">0.02</span> &nbsp; T: <span id="orbit-period">14.2h</span></div>
                    <div>PHASE: <span class="orbit-phase-bar"><span class="orbit-phase-fill" id="orbit-phase-fill" style="width:${phasePct}%"></span></span> <span id="orbit-phase">${phasePct}%</span></div>
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
        this.updateWaypointDisplay();
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
        this.orbitProgress = (this.orbitProgress + 0.5) % 360;
        
        // Update orbital phase bar
        const phaseFill = document.getElementById('orbit-phase-fill');
        const phaseText = document.getElementById('orbit-phase');
        if (phaseFill && phaseText) {
            const pct = Math.round((this.orbitProgress / 360) * 100);
            phaseFill.style.width = `${pct}%`;
            phaseText.textContent = `${pct}%`;
        }
    }

    /**
     * Update waypoint display with distances and tracking status
     */
    updateWaypointDisplay() {
        const navData = this.dataSimulator ? this.dataSimulator.generateSystemStatus().navigation : null;
        if (!navData) return;
        
        for (let i = 0; i < this.waypoints.length; i++) {
            const wp = this.waypoints[i];
            const itemEl = document.getElementById(`wp-item-${i}`);
            const distEl = document.getElementById(`wp-dist-${i}`);
            const statusEl = document.getElementById(`wp-status-${i}`);
            
            if (!itemEl) continue;
            
            // Calculate distance to waypoint
            const dx = wp.x - navData.coordinates.x;
            const dy = wp.y - navData.coordinates.y;
            const dz = wp.z - (navData.coordinates.z || 0);
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            if (distEl) {
                distEl.textContent = `DIST: ${dist.toFixed(1)}`;
            }
            
            // Update item class based on state
            let cls = 'wp-item';
            let statusText = 'QUEUED';
            let statusCls = '';
            
            if (i === this.currentWaypoint && wp.active) {
                cls += ' wp-active';
                statusText = 'TRACKING';
                statusCls = 'status-ok';
            } else if (!wp.active && i < this.currentWaypoint) {
                cls += ' wp-complete';
                statusText = 'COMPLETE';
                statusCls = '';
            }
            
            itemEl.className = cls;
            
            if (statusEl) {
                statusEl.textContent = statusText;
                statusEl.className = `wp-status ${statusCls}`;
            }
        }
    }

    /**
     * Update status bar information with multiple telemetry streams
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
        
        // Signal strength telemetry
        const signal = document.getElementById('nav-signal');
        if (signal) {
            const base = 85 + Math.sin(Date.now() * 0.0008) * 8;
            const distFactor = Math.max(0, 1 - Math.abs(this.courseDeviation) / 90) * 10;
            const signalVal = Math.min(99, Math.round(base + distFactor));
            signal.textContent = `${signalVal}%`;
            signal.className = `status-value ${signalVal > 80 ? 'status-ok' : signalVal > 60 ? 'status-warning' : 'status-critical'}`;
        }
        
        // Sweet (efficiency) telemetry
        const sweet = document.getElementById('nav-sweet');
        if (sweet) {
            const baseSweet = 75 + Math.sin(Date.now() * 0.001) * 10;
            const pingBonus = this.motionTrackerBlips.length > 0 ? 15 : 0;
            const navBonus = Math.abs(this.courseDeviation) < 5 ? 10 : Math.abs(this.courseDeviation) < 15 ? 5 : 0;
            const sweetValue = Math.min(95, baseSweet + pingBonus + navBonus);
            sweet.textContent = `${sweetValue.toFixed(0)}`;
            sweet.className = `status-value ${sweetValue > 80 ? 'status-ok' : sweetValue > 60 ? 'status-warning' : 'status-critical'}`;
        }
        
        // Elapsed mission time
        const elapsed = document.getElementById('nav-elapsed');
        if (elapsed) {
            const missionStart = Date.now() - (3 * 24 * 60 * 60 * 1000);
            const elapsedMs = Date.now() - missionStart;
            const totalSeconds = Math.floor(elapsedMs / 1000);
            const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
            const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
            const seconds = (totalSeconds % 60).toString().padStart(2, '0');
            elapsed.textContent = `${hours}:${minutes}:${seconds}`;
            elapsed.className = 'status-value status-ok';
        }
        
        // Threat assessment
        const threat = document.getElementById('nav-threat');
        if (threat) {
            const blipCount = this.motionTrackerBlips.length;
            if (blipCount >= 3) {
                threat.textContent = 'ELEVATED';
                threat.className = 'status-value status-critical';
            } else if (blipCount > 0) {
                threat.textContent = 'MODERATE';
                threat.className = 'status-value status-warning';
            } else {
                threat.textContent = 'NONE';
                threat.className = 'status-value status-ok';
            }
        }
        
        // Update radar status indicator
        const radarStatus = document.getElementById('radar-status');
        if (radarStatus) {
            if (this.motionTrackerBlips.length > 0) {
                radarStatus.textContent = 'DETECTED';
                radarStatus.className = 'status-indicator detected';
            } else {
                radarStatus.textContent = 'SEARCHING';
                radarStatus.className = 'status-indicator searching';
            }
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