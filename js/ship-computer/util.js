/**
 * Pure helper functions for the ship computer. No DOM access.
 *
 * Attaches as `NostromoShipComputer.util`. Requires namespace.js to load first
 * in the browser; in Node it creates the namespace itself.
 */
(function (root) {
    const ns = root.NostromoShipComputer = root.NostromoShipComputer || {};

    /**
     * Restrict a number to an inclusive range.
     *
     * @param {number} value
     * @param {number} min
     * @param {number} max
     * @returns {number}
     */
    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    ns.util = { clamp };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.util;
    }
})(typeof window !== 'undefined' ? window : globalThis);
