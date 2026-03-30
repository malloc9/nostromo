/**
 * Life Support Quadrant Component
 * Displays life support system status and data
 */

class LifeSupportQuadrant extends QuadrantComponent {
    constructor() {
        super('life-support-quadrant', 'LIFE SUPPORT');
    }

    /**
     * Update the life support quadrant with new life support data
     * @param {Object} lifeSupportData - Life support system data
     */
    update(lifeSupportData) {
        this.data = lifeSupportData;

        // Determine life support status
        let statusClass = 'status-ok';
        if (lifeSupportData.oxygen < 90 || lifeSupportData.co2 > 20 ||
            lifeSupportData.pressure < 0.95 || lifeSupportData.pressure > 1.05) {
            statusClass = 'status-warning';
        }
        if (lifeSupportData.oxygen < 80 || lifeSupportData.co2 > 30) {
            statusClass = 'status-critical';
        }

        this.updateStatus(statusClass);

        // Generate content HTML
        const contentHTML = `
            <div class="data-row">
                <span class="data-label">OXYGEN:</span>
                <span class="data-value">${lifeSupportData.oxygen.toFixed(1)}%</span>
            </div>
            <div class="data-row">
                <span class="data-label">CO2 LEVEL:</span>
                <span class="data-value">${lifeSupportData.co2.toFixed(1)} PPM</span>
            </div>
            <div class="data-row">
                <span class="data-label">PRESSURE:</span>
                <span class="data-value">${lifeSupportData.pressure.toFixed(2)} ATM</span>
            </div>
            <div class="data-row">
                <span class="data-label">TEMPERATURE:</span>
                <span class="data-value">${lifeSupportData.temperature.toFixed(1)}°C</span>
            </div>
        `;

        this.updateContent(contentHTML);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LifeSupportQuadrant;
} else {
    window.LifeSupportQuadrant = LifeSupportQuadrant;
}