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

    /**
     * One report line with a dotted leader: "LABEL ........ VALUE", exactly `width` long.
     * Always at least three dots, so a long label never runs into its value.
     * @param {string} label
     * @param {string} value
     * @param {number} [width]
     * @returns {string}
     */
    function formatLeader(label, value, width = 36) {
        const dots = Math.max(3, width - label.length - value.length - 2);
        return `${label} ${'.'.repeat(dots)} ${value}`;
    }

    ns.util = { clamp, formatClock, formatLeader };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.util;
    }
})(typeof window !== 'undefined' ? window : globalThis);
