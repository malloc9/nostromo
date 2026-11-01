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
     * @param {Object} lifeSupportData - Life support readings in the plan's units
     * @param {Object|null} [model] - Life support model; its overall status sets the colour
     */
    update(lifeSupportData, model) {
        this.data = lifeSupportData;

        // The overall status comes from the life support model, the same one the alerts and STATUS use.
        const level = model ? model.overall : 'NOMINAL';
        const statusClass = level === 'CRITICAL' ? 'status-critical' : (level === 'WARNING' ? 'status-warning' : 'status-ok');

        this.updateStatus(statusClass);

        // Generate content HTML
        const contentHTML = `
            <div class="data-row">
                <span class="data-label">OXYGEN:</span>
                <span class="data-value">${lifeSupportData.oxygen.toFixed(1)}%</span>
            </div>
            <div class="data-row">
                <span class="data-label">CO2 LEVEL:</span>
                <span class="data-value">${lifeSupportData.co2.toFixed(2)}%</span>
            </div>
            <div class="data-row">
                <span class="data-label">PRESSURE:</span>
                <span class="data-value">${lifeSupportData.pressure.toFixed(1)} KPA</span>
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