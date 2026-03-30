/**
 * Crew Quadrant Component
 * Displays crew status and data
 */

class CrewQuadrant extends QuadrantComponent {
    constructor() {
        super('crew-quadrant', 'CREW');
    }

    /**
     * Update the crew quadrant with new crew data
     * @param {Array} crewData - Array of crew member objects
     */
    update(crewData) {
        this.data = crewData;

        // Count crew by status
        const activeCrew = crewData.filter(member => member.status === 'active').length;
        const restingCrew = crewData.filter(member => member.status === 'resting').length;
        const totalCrew = crewData.length;

        // Determine crew status
        let statusClass = 'status-ok';
        if (activeCrew < totalCrew * 0.6) statusClass = 'status-warning';
        if (activeCrew < totalCrew * 0.4) statusClass = 'status-critical';

        this.updateStatus(statusClass);

        // Generate content HTML
        const contentHTML = `
            <div class="data-row">
                <span class="data-label">TOTAL CREW:</span>
                <span class="data-value">${totalCrew}</span>
            </div>
            <div class="data-row">
                <span class="data-label">ACTIVE:</span>
                <span class="data-value">${activeCrew}</span>
            </div>
            <div class="data-row">
                <span class="data-label">RESTING:</span>
                <span class="data-value">${restingCrew}</span>
            </div>
            <div class="data-row">
                <span class="data-label">AVG VITALS:</span>
                <span class="data-value">NOMINAL</span>
            </div>
        `;

        this.updateContent(contentHTML);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CrewQuadrant;
} else {
    window.CrewQuadrant = CrewQuadrant;
}