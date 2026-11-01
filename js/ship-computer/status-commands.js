/**
 * STATUS: the quick whole-ship report. Every line comes from the store or the
 * engineering model, so it cannot disagree with the Engineering screen or the header.
 */
(function (root) {
    const ns = root.NostromoShipComputer = root.NostromoShipComputer || {};

    const RANK = { NOMINAL: 0, WARNING: 1, CRITICAL: 2 };

    function worst(levels) {
        return levels.reduce((a, b) => (RANK[b] > RANK[a] ? b : a), 'NOMINAL');
    }

    /** The plain-language overall label the report uses. */
    function overallLabel(level) {
        return level === 'NOMINAL' ? 'OPERATIONAL' : level;
    }

    /**
     * Which report row each subsystem's status and alerts belong to. Subsystems
     * not listed here are reported on OTHER SYSTEMS, which appears only when one is
     * not nominal, so every non-nominal state appears on a row above the overall line.
     */
    const ROW_FOR_SUBSYSTEM = {
        lifeSupport: 'LIFE SUPPORT',
        navigation: 'NAVIGATION',
        engineering: 'ENGINEERING',
        crew: 'CREW MONITORING',
        communications: 'COMMUNICATIONS'
    };
    const OTHER_SYSTEMS = 'OTHER SYSTEMS';

    /**
     * @param {ReturnType<import('./ship-state.js').createShipStore>} store
     * @returns {import('./blocks.js').Block[]}
     */
    function buildStatus(store) {
        const identity = store.snapshot('identity').state;
        const board = store.alerts();
        const model = ns.engineeringModel.build(store.snapshot('engineering'));

        // Each subsystem's level: its own status, and the worst alert that names it.
        const alertLevel = {};
        board.list.forEach((a) => {
            alertLevel[a.subsystem] = worst([alertLevel[a.subsystem] || 'NOMINAL', a.severity]);
        });
        const levelOf = (subsystem, own) => worst([own, alertLevel[subsystem] || 'NOMINAL']);

        const levels = {
            'LIFE SUPPORT': levelOf('lifeSupport', store.snapshot('lifeSupport').status),
            'NAVIGATION': levelOf('navigation', store.snapshot('navigation').status),
            // The engineering row takes the model's overall, which already includes the
            // subsystem's own faults and the reactor, engine, cooling and power components.
            'ENGINEERING': levelOf('engineering', model.overall),
            'POWER DISTRIBUTION': model.components.find((c) => c.key === 'powerDistribution').status,
            'CREW MONITORING': levelOf('crew', store.snapshot('crew').status),
            'COMMUNICATIONS': levelOf('communications', store.snapshot('communications').status)
        };
        const otherSubsystems = store.subsystemNames().filter((s) => !ROW_FOR_SUBSYSTEM[s]);
        const otherLevel = worst(otherSubsystems.map((s) => levelOf(s, store.snapshot(s).status)));
        const rows = Object.keys(levels).map((label) => [label, levels[label]]);
        if (otherLevel !== 'NOMINAL') rows.push([OTHER_SYSTEMS, otherLevel]);

        // Built from the rows, so the overall line is never milder than the rows above it.
        const overall = worst(rows.map((r) => r[1]));
        const crew = ns.crewModel.counts(store.snapshot('crew').state.members);

        const blocks = [
            { type: 'text', text: 'SHIP STATUS REPORT', tone: 'heading' },
            { type: 'text', text: `VESSEL: ${identity.vessel}` },
            { type: 'text', text: `REGISTRATION: ${identity.registration}` },
            { type: 'text', text: '' },
            { type: 'text', text: `OVERALL STATUS: ${overallLabel(overall)}` },
            { type: 'text', text: '' },
            { type: 'text', text: 'PRIMARY SYSTEMS', tone: 'heading' }
        ];
        rows.forEach(([label, level]) => {
            blocks.push({ type: 'text', text: ns.util.formatLeader(label, level) });
        });
        blocks.push({ type: 'text', text: '' });
        blocks.push({ type: 'text', text: `CREW: ${crew.active} ACTIVE / ${crew.synthetic} SYNTHETIC / ${crew.resting} RESTING` });
        blocks.push({ type: 'text', text: `ACTIVE ALERTS: ${board.list.length}` });
        blocks.push({ type: 'text', text: '' });
        blocks.push({ type: 'text', text: 'REPORT COMPLETE.' });
        return blocks;
    }

    function register(registry, store) {
        registry.register({
            name: 'STATUS',
            category: 'SHIP',
            description: 'SHOWS THE WHOLE-SHIP STATUS: OVERALL, PRIMARY SYSTEMS, CREW AND ALERTS.',
            usage: 'STATUS',
            handler: (ctx) => {
                if (ctx.args.length > 0) {
                    return [{ type: 'error', text: 'USAGE: STATUS' }];
                }
                return buildStatus(store);
            }
        });
    }

    ns.statusCommands = { register, buildStatus };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.statusCommands;
    }
})(typeof window !== 'undefined' ? window : globalThis);
