/**
 * Navigation model: position, heading, velocity, destination and ETA, from the store.
 * Pure: takes a navigation snapshot plus the ETA and the clock time, writes nothing.
 *
 * `readings` has the same shape as the navigation data the screens already read, so the
 * Navigation screen can take its values from here without changing its layout.
 *
 * @typedef {Object} NavigationModel
 * @property {{coordinates: {x: number, y: number, z: number}, heading: number,
 *             velocity: number, destination: string, eta: Date}} readings
 * @property {number} hoursRemaining   hours to the ETA to one decimal, never below zero
 * @property {string} status           NOMINAL, WARNING or CRITICAL
 * @property {Array<Object>} faults
 */
(function (root) {
    const ns = root.NostromoShipComputer = root.NostromoShipComputer || {};

    const HOUR_MS = 60 * 60 * 1000;

    /**
     * @param {Object} snapshot  store.snapshot('navigation')
     * @param {{etaAt: number, now: number}} times  the ETA and the current time, in milliseconds
     * @returns {NavigationModel}
     */
    function build(snapshot, times) {
        const m = snapshot.measurements;
        const c = snapshot.state.coordinates;
        // One decimal, so 25 minutes reads as 0.4 HOURS and not as arrival.
        const hoursRemaining = Math.max(0, Math.round(((times.etaAt - times.now) / HOUR_MS) * 10) / 10);
        return {
            readings: {
                coordinates: { x: c.x, y: c.y, z: c.z },
                heading: ((m.heading % 360) + 360) % 360,
                velocity: m.velocity,
                destination: snapshot.state.destination,
                eta: new Date(times.etaAt)
            },
            hoursRemaining,
            status: snapshot.status,
            faults: snapshot.faults.map((f) => ({ ...f }))
        };
    }

    ns.navigationModel = { build, HOUR_MS };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.navigationModel;
    }
})(typeof window !== 'undefined' ? window : globalThis);
