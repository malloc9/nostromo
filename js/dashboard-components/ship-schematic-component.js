/**
 * Ship Schematic Component
 * Displays the ASCII ship schematic with clickable system indicators
 */

class ShipSchematicComponent extends BaseDashboardComponent {
    constructor(containerId) {
        super(containerId);
        this.systemData = null;
        this.indicatorElements = {}; // Map of system to indicator element
    }

    /**
     * Generate the ASCII ship schematic HTML
     * @returns {string} HTML string for the schematic
     */
    generateSchematicHTML() {
        return `
            <pre class="ascii-ship">
╔═══════════════════════════════════╗
║            NOSTROMO               ║
║       COMMERCIAL TOWING           ║
║            VEHICLE                ║
╠═══════════════════════════════════╣
║                                   ║
║   [<span class="system-indicator clickable" data-system="life-support" id="schematic-life-support">LS</span>]      BRIDGE      [<span class="system-indicator clickable" data-system="navigation" id="schematic-navigation">NAV</span>]   ║
║    │        ┌───┐        │        ║
║    │   ┌────┤   ├────┐   │        ║
║    └───┤    │   │    ├───┘        ║
║        │    └───┘    │            ║
║        │             │            ║
║        │   CENTRAL   │            ║
║        │    CORE     │            ║
║        │             │            ║
║    ┌───┤    ┌───┐    ├───┐        ║
║    │   └────┤   ├────┘   │        ║
║    │        └───┘        │        ║
║   [<span class="system-indicator clickable" data-system="engineering" id="schematic-power">PWR</span>]    ENGINE ROOM    [<span class="system-indicator clickable" data-system="crew" id="schematic-crew">CRW</span>]   ║
║    │     ╔═══════════╗     │       ║
║    └─────╢ █████████ ╟─────┘       ║
║          ╢ █████████ ╟             ║
║          ╚═══════════╝             ║
║                                   ║
╚═══════════════════════════════════╝
            </pre>
        `;
    }

    /**
     * Initialize the component and set up click handlers
     */
    init() {
        if (!super.init()) {
            return false;
        }

        // Render the initial schematic
        this.render();

        // Set up click handlers for schematic indicators
        this.setupSchematicClickHandlers();

        return true;
    }

    /**
     * Render the ship schematic
     */
    render() {
        if (!this.isInitialized || !this.container) {
            return;
        }

        this.container.innerHTML = this.generateSchematicHTML();
        this.cacheIndicatorElements();
    }

    /**
     * Cache references to the indicator elements for later updates
     */
    cacheIndicatorElements() {
        const systems = ['life-support', 'navigation', 'engineering', 'crew'];
        systems.forEach(system => {
            const indicatorId = `schematic-${system}`;
            const element = document.getElementById(indicatorId);
            if (element) {
                this.indicatorElements[system] = element;
            }
        });
    }

    /**
     * Update the schematic indicators based on system data
     * @param {Object} systemData - Object containing data for all systems
     */
    update(systemData) {
        this.systemData = systemData;
        this.updateSchematicIndicators(systemData);
    }

    /**
     * Update the CSS classes of the schematic indicators based on system data
     * @param {Object} systemData - Object containing data for all systems
     */
    updateSchematicIndicators(systemData) {
        if (!this.indicatorElements) {
            return;
        }

        // Update life support indicator
        this.updateLifeSupportIndicator(systemData.lifeSupport);

        // Update power indicator
        this.updatePowerIndicator(systemData.power);

        // Update navigation indicator (typically always OK)
        this.updateNavigationIndicator();

        // Update crew indicator
        this.updateCrewIndicator(systemData.crew);
    }

    /**
     * Update life support indicator
     * @param {Object} lifeSupportData - Life support system data
     */
    updateLifeSupportIndicator(lifeSupportData) {
        const indicator = this.indicatorElements['life-support'];
        if (!indicator) return;

        let statusClass = 'status-ok';
        if (lifeSupportData.oxygen < 90 || lifeSupportData.co2 > 20 ||
            lifeSupportData.pressure < 0.95 || lifeSupportData.pressure > 1.05) {
            statusClass = 'status-warning';
        }
        if (lifeSupportData.oxygen < 80 || lifeSupportData.co2 > 30) {
            statusClass = 'status-critical';
        }

        indicator.className = `system-indicator clickable ${statusClass}`;
    }

    /**
     * Update power indicator
     * @param {Object} powerData - Power system data
     */
    updatePowerIndicator(powerData) {
        const indicator = this.indicatorElements['power'];
        if (!indicator) return;

        const powerLevel = powerData.generation - powerData.consumption;
        let statusClass = 'status-ok';
        if (powerLevel < 10) statusClass = 'status-warning';
        if (powerLevel < 0) statusClass = 'status-critical';

        indicator.className = `system-indicator clickable ${statusClass}`;
    }

    /**
     * Update navigation indicator (always OK)
     */
    updateNavigationIndicator() {
        const indicator = this.indicatorElements['navigation'];
        if (!indicator) return;
        indicator.className = 'system-indicator clickable status-ok';
    }

    /**
     * Update crew indicator
     * @param {Array} crewData - Array of crew member objects
     */
    updateCrewIndicator(crewData) {
        const indicator = this.indicatorElements['crew'];
        if (!indicator) return;

        const activeCrew = crewData.filter(member => member.status === 'active').length;
        const totalCrew = crewData.length;
        let statusClass = 'status-ok';
        if (activeCrew < totalCrew * 0.6) statusClass = 'status-warning';
        if (activeCrew < totalCrew * 0.4) statusClass = 'status-critical';

        indicator.className = `system-indicator clickable ${statusClass}`;
    }

    /**
     * Set up click handlers for schematic system indicators
     */
    setupSchematicClickHandlers() {
        const indicators = this.container.querySelectorAll('.system-indicator.clickable');
        indicators.forEach(indicator => {
            indicator.addEventListener('click', (event) => {
                const system = event.target.dataset.system;
                if (system && window.router) {
                    window.router.goTo(system);
                }
            });
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShipSchematicComponent;
} else {
    window.ShipSchematicComponent = ShipSchematicComponent;
}