/**
 * Engineering model: the one place that says what the reactor, engines, cooling and
 * power distribution are doing. Pure: reads a store snapshot, writes nothing.
 *
 * Every consumer reads this model: the ENGINEERING and STATUS commands, the
 * Engineering screen and the Dashboard power quadrant. Fix a rule here and all of
 * them change together.
 *
 * Component status comes from the faults recorded against that component (the
 * `component` field). Overall status is the worst of the subsystem status and every
 * component. Statuses are NOMINAL, WARNING or CRITICAL.
 *
 * @typedef {'NOMINAL'|'WARNING'|'CRITICAL'} Level
 * @typedef {{key: string, label: string, status: Level}} ComponentStatus
 * @typedef {Object} EngineeringModel
 * @property {ComponentStatus[]} components
 * @property {Level} overall
 * @property {number} powerOutput   percent, the same reading as the power screens
 * @property {number} fuelReserve   percent
 * @property {Array<{code: string, message: string, severity: string, component: string|null}>} faults
 */
(function (root) {
    const ns = root.NostromoShipComputer = root.NostromoShipComputer || {};

    const COMPONENTS = [
        { key: 'mainReactor', label: 'MAIN REACTOR' },
        { key: 'primaryEngine', label: 'PRIMARY ENGINE' },
        { key: 'secondaryEngine', label: 'SECONDARY ENGINE' },
        { key: 'coolingSystem', label: 'COOLING SYSTEM' },
        { key: 'powerDistribution', label: 'POWER DISTRIBUTION' }
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
     * @param {Object} snapshot  store.snapshot('engineering')
     * @returns {EngineeringModel}
     */
    function build(snapshot) {
        const components = COMPONENTS.map((c) => ({
            key: c.key,
            label: c.label,
            status: levelOf(snapshot.faults.filter((f) => f.component === c.key))
        }));
        return {
            components,
            overall: worst([snapshot.status, ...components.map((c) => c.status)]),
            powerOutput: snapshot.measurements.powerGeneration,
            fuelReserve: snapshot.measurements.fuelReserve,
            faults: snapshot.faults.map((f) => ({ ...f }))
        };
    }

    /** Display name for an allocation key: navigation -> NAVIGATION, lifeSupport -> LIFE SUPPORT. */
    function labelOf(key) {
        return key.replace(/([A-Z])/g, ' $1').toUpperCase().trim();
    }

    /**
     * The one allocation rule. Returns the reason a change is refused, or null when it is allowed.
     * The store and the command both call this, so the rule has one definition.
     */
    function allocationProblem(alloc, rules, target, donor, percent) {
        if (!rules[target]) return `UNKNOWN SUBSYSTEM: ${target}.`;
        if (!rules[donor]) return `UNKNOWN SUBSYSTEM: ${donor}.`;
        if (target === donor) return 'TARGET AND DONOR MUST DIFFER.';
        if (!Number.isInteger(percent)) return 'PERCENT MUST BE A WHOLE NUMBER.';
        const tr = rules[target];
        const dr = rules[donor];
        if (percent < tr.min || percent > tr.max) return `${labelOf(target)} MUST STAY BETWEEN ${tr.min}% AND ${tr.max}%.`;
        const donorAfter = alloc[donor] - (percent - alloc[target]);
        if (donorAfter < dr.min || donorAfter > dr.max) return `${labelOf(donor)} MUST STAY BETWEEN ${dr.min}% AND ${dr.max}%.`;
        const safety = rules.lifeSupport && rules.lifeSupport.safetyMin;
        if (safety !== undefined) {
            const lifeSupportAfter = target === 'lifeSupport' ? percent : (donor === 'lifeSupport' ? donorAfter : alloc.lifeSupport);
            if (lifeSupportAfter < safety) return `LIFE SUPPORT CANNOT FALL BELOW ${safety}%.`;
        }
        return null;
    }

    ns.engineeringModel = { build, COMPONENTS, labelOf, allocationProblem };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.engineeringModel;
    }
})(typeof window !== 'undefined' ? window : globalThis);
