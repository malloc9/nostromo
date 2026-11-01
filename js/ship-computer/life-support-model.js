/**
 * Life support model: the atmosphere and climate readings in the plan's units, and the
 * status of the air circulation and atmospheric control. Pure: reads a store snapshot.
 *
 * Units: oxygen and CO2 are percent, pressure is kPa, temperature is Celsius, and
 * humidity is percent. The screens and the commands read this model, not the simulator
 * adapter, so the units agree everywhere.
 *
 * @typedef {'NOMINAL'|'WARNING'|'CRITICAL'} Level
 * @typedef {Object} LifeSupportModel
 * @property {{oxygen: number, co2: number, pressure: number, temperature: number, humidity: number}} readings
 * @property {Array<{key: string, label: string, status: Level}>} components
 * @property {Level} overall
 * @property {Array<Object>} faults
 */
(function (root) {
    const ns = root.NostromoShipComputer = root.NostromoShipComputer || {};

    const COMPONENTS = [
        { key: 'airCirculation', label: 'AIR CIRCULATION' },
        { key: 'atmosphericControl', label: 'ATMOSPHERIC CONTROL' }
    ];

    const RANK = { NOMINAL: 0, WARNING: 1, CRITICAL: 2 };

    function worst(levels) {
        return levels.reduce((a, b) => (RANK[b] > RANK[a] ? b : a), 'NOMINAL');
    }

    function levelOf(faults) {
        if (faults.some((f) => f.severity === 'CRITICAL')) return 'CRITICAL';
        return faults.length ? 'WARNING' : 'NOMINAL';
    }

    /**
     * @param {Object} snapshot store.snapshot('lifeSupport')
     * @returns {LifeSupportModel}
     */
    function build(snapshot) {
        const m = snapshot.measurements;
        const components = COMPONENTS.map((c) => ({
            key: c.key,
            label: c.label,
            status: levelOf(snapshot.faults.filter((f) => f.component === c.key))
        }));
        return {
            readings: {
                oxygen: m.oxygen,
                co2: m.co2,
                pressure: m.pressure,
                temperature: m.temperature,
                humidity: m.humidity
            },
            components,
            overall: worst([snapshot.status, ...components.map((c) => c.status)]),
            faults: snapshot.faults.map((f) => ({ ...f }))
        };
    }

    ns.lifeSupportModel = { build, COMPONENTS };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.lifeSupportModel;
    }
})(typeof window !== 'undefined' ? window : globalThis);
