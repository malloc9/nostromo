/**
 * Base Dashboard Component
 * Abstract base class for all dashboard components
 */

class BaseDashboardComponent {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the component
     */
    init() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            console.warn(`Container ${this.containerId} not found for component ${this.constructor.name}`);
            return false;
        }
        this.isInitialized = true;
        return true;
    }

    /**
     * Render the component - to be implemented by subclasses
     */
    render() {
        throw new Error('render() method must be implemented by subclass');
    }

    /**
     * Update the component with new data - to be implemented by subclasses
     * @param {Object} data - Data to update the component with
     */
    update(data) {
        throw new Error('update() method must be implemented by subclass');
    }

    /**
     * Destroy the component and clean up resources
     */
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.isInitialized = false;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BaseDashboardComponent;
} else {
    window.BaseDashboardComponent = BaseDashboardComponent;
}