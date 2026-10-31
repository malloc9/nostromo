/**
 * Power Quadrant Component
 * Displays power system status and data
 */

class PowerQuadrant extends QuadrantComponent {
    constructor() {
        super('power-quadrant', 'POWER');
    }

    /**
     * Update the power quadrant with new power data
     * @param {Object} powerData - Power system data
     * @param {Object|null} [model] - Engineering model; adds component faults
     */
    update(powerData, model) {
        this.data = powerData;

        // Determine power status
        const powerLevel = powerData.generation - powerData.consumption;
        let statusClass = 'status-ok';
        if (powerLevel < 10) statusClass = 'status-warning';
        if (powerLevel < 0) statusClass = 'status-critical';
        if (model && model.overall === 'WARNING' && statusClass === 'status-ok') statusClass = 'status-warning';
        if (model && model.overall === 'CRITICAL') statusClass = 'status-critical';

        this.updateStatus(statusClass);

        // Components that are not nominal, named as the ENGINEERING report names them
        const faulted = model ? model.components.filter((c) => c.status !== 'NOMINAL') : [];
        const faultRows = faulted.map((c) => `
            <div class="data-row">
                <span class="data-label">${c.label}:</span>
                <span class="data-value">${c.status}</span>
            </div>`).join('');

        // Generate content HTML
        const contentHTML = `
            <div class="data-row">
                <span class="data-label">GENERATION:</span>
                <span class="data-value">${powerData.generation.toFixed(1)}%</span>
            </div>
            <div class="data-row">
                <span class="data-label">CONSUMPTION:</span>
                <span class="data-value">${powerData.consumption.toFixed(1)}%</span>
            </div>
            <div class="data-row">
                <span class="data-label">NET POWER:</span>
                <span class="data-value ${powerLevel >= 0 ? 'positive' : 'negative'}">${powerLevel >= 0 ? '+' : ''}${powerLevel.toFixed(1)}%</span>
            </div>
            <div class="data-row">
                <span class="data-label">EFFICIENCY:</span>
                <span class="data-value">${powerData.efficiency.toFixed(1)}%</span>
            </div>
            <div class="data-row">
                <span class="data-label">FUEL LEVEL:</span>
                <span class="data-value">${powerData.fuel.toFixed(1)}%</span>
            </div>
            ${faultRows}
        `;

        this.updateContent(contentHTML);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PowerQuadrant;
} else {
    window.PowerQuadrant = PowerQuadrant;
}