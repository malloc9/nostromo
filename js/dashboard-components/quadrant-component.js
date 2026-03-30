/**
 * Base Quadrant Component
 * Abstract base class for all dashboard quadrants
 */

class QuadrantComponent extends BaseDashboardComponent {
    constructor(containerId, title) {
        super(containerId);
        this.title = title;
        this.data = null;
        this.statusElement = null;
        this.contentElement = null;
    }

    /**
     * Initialize the quadrant component
     */
    init() {
        if (!super.init()) {
            return false;
        }

        // Create the quadrant structure
        this.container.innerHTML = `
            <div class="status-quadrant">
                <div class="quadrant-header">
                    <span class="quadrant-title">${this.title}</span>
                    <span class="status-indicator" id="${this.containerId}-status">●</span>
                </div>
                <div class="quadrant-content" id="${this.containerId}-content">
                    <div class="data-loading">LOADING...</div>
                </div>
            </div>
        `;

        // Cache references to elements
        this.statusElement = document.getElementById(`${this.containerId}-status`);
        this.contentElement = document.getElementById(`${this.containerId}-content`);

        return true;
    }

    /**
     * Update the quadrant with new data - to be implemented by subclasses
     * @param {Object} data - Data to update the quadrant with
     */
    update(data) {
        throw new Error('update() method must be implemented by subclass');
    }

    /**
     * Update the status indicator
     * @param {string} statusClass - CSS class for the status (status-ok, status-warning, status-critical)
     */
    updateStatus(statusClass) {
        if (this.statusElement) {
            this.statusElement.className = `status-indicator ${statusClass}`;
        }
    }

    /**
     * Update the content area
     * @param {string} html - HTML content to display
     */
    updateContent(html) {
        if (this.contentElement) {
            this.contentElement.innerHTML = html;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuadrantComponent;
} else {
    window.QuadrantComponent = QuadrantComponent;
}