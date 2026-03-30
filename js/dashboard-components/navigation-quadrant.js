/**
 * Navigation Quadrant Component
 * Displays navigation system status and data
 */

class NavigationQuadrant extends QuadrantComponent {
    constructor() {
        super('navigation-quadrant', 'NAV');
    }

    /**
     * Update the navigation quadrant with new navigation data
     * @param {Object} navigationData - Navigation system data
     */
    update(navigationData) {
        this.data = navigationData;

        // Navigation is typically always operational
        this.updateStatus('status-ok');

        // Generate content HTML
        const contentHTML = `
            <div class="data-row">
                <span class="data-label">POSITION:</span>
                <span class="data-value">${navigationData.coordinates.x.toFixed(1)}, ${navigationData.coordinates.y.toFixed(1)}</span>
            </div>
            <div class="data-row">
                <span class="data-label">HEADING:</span>
                <span class="data-value">${navigationData.heading.toFixed(1)}°</span>
            </div>
            <div class="data-row">
                <span class="data-label">VELOCITY:</span>
                <span class="data-value">${navigationData.velocity.toFixed(3)} C</span>
            </div>
            <div class="data-row">
                <span class="data-label">DESTINATION:</span>
                <span class="data-value">${navigationData.destination}</span>
            </div>
        `;

        this.updateContent(contentHTML);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavigationQuadrant;
} else {
    window.NavigationQuadrant = NavigationQuadrant;
}