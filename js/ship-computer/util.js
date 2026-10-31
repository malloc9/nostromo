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

    /**
     * Ship clock time of day, HH:MM:SS, as the header and the log both show it.
     * @param {number} ms milliseconds since the epoch
     * @returns {string}
     */
    function formatClock(ms) {
        const d = new Date(ms);
        const pad = (n) => String(n).padStart(2, '0');
        return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }

    ns.util = { clamp, formatClock };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.util;
    }
})(typeof window !== 'undefined' ? window : globalThis);
