/**
 * Dashboard panels: which command each clickable panel runs, and what the system-event
 * indicator shows. Both read the engine's registry and the store; neither builds a report.
 */
(function (root) {
    const ns = root.NostromoShipComputer = root.NostromoShipComputer || {};

    // Each clickable Dashboard panel, by its container id, and the command it runs.
    const PANEL_COMMANDS = Object.freeze({
        'power-quadrant': 'ENGINEERING',
        'life-support-quadrant': 'LIFE SUPPORT',
        'navigation-quadrant': 'NAVIGATION',
        'crew-quadrant': 'CREW'
    });

    const RECENT_EVENTS = 3;

    /** @returns {string|null} the command for a panel id, or null when the element is not a command panel */
    function commandForPanel(panelId) {
        return Object.prototype.hasOwnProperty.call(PANEL_COMMANDS, panelId) ? PANEL_COMMANDS[panelId] : null;
    }

    /**
     * What the indicator shows: the alert list (the same one the header counts) and the newest events.
     * @param {ReturnType<import('./ship-state.js').createShipStore>} store
     * @param {number} [recent]
     */
    function eventIndicator(store, recent = RECENT_EVENTS) {
        const board = store.tick();
        return {
            overall: board.overall,
            alertCount: board.list.length,
            alerts: board.list.map((alert) => alert.message),
            // slice(-0) is slice(0), which would return the whole log, so zero is handled apart.
            recent: (recent > 0 ? store.events().slice(-recent) : []).reverse().map((event) => event.message)
        };
    }

    ns.dashboardPanels = { PANEL_COMMANDS, commandForPanel, eventIndicator };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.dashboardPanels;
    }
})(typeof window !== 'undefined' ? window : globalThis);
