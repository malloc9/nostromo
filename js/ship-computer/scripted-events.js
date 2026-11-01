/**
 * Scripted events, presentation side. The store fires each scripted event once and attaches a
 * notice to it; this module turns the notice into the warning-style lines the terminal prints.
 * Pure: no DOM, no store.
 *
 * @typedef {Object} Notice
 * @property {number} time       simulation time of the event, in ms
 * @property {string} source     subsystem label, for example ENGINEERING
 * @property {string} level      WARNING or CRITICAL
 * @property {string} headline   what happened, as one sentence
 * @property {Array<{label: string, value: number, unit: string}>} values  readings at the event
 */
(function (root) {
    const ns = root.NostromoShipComputer = root.NostromoShipComputer || {};

    /**
     * The notice as warning blocks, in the plan's layout:
     *   [HH:MM:SS] SOURCE LEVEL
     *   HEADLINE
     *   LABEL: VALUE UNIT   (one line per reading)
     * @param {Notice} notice
     * @returns {Array<{type: 'warning', text: string}>}
     */
    function noticeBlocks(notice) {
        const lines = [
            `[${ns.util.formatClock(notice.time)}] ${notice.source} ${notice.level}`,
            notice.headline
        ].concat(notice.values.map((v) => `${v.label}: ${v.value.toFixed(1)} ${v.unit}`));
        return lines.map((text) => ({ type: 'warning', text }));
    }

    ns.scriptedEvents = { noticeBlocks };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.scriptedEvents;
    }
})(typeof window !== 'undefined' ? window : globalThis);
