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

    /** Crew counts from the roster: active humans, synthetic ones apart, and resting. */
    function crewCounts(store) {
        const humans = store.snapshot('crew').state.members.filter((m) => m.type === 'human');
        const active = humans.filter((m) => m.status === 'active');
        return {
            active: active.filter((m) => !m.synthetic).length,
            synthetic: active.filter((m) => m.synthetic).length,
            resting: humans.filter((m) => m.status === 'resting').length
        };
    }

    /**
     * @param {ReturnType<import('./ship-state.js').createShipStore>} store
     * @returns {import('./blocks.js').Block[]}
     */
    function buildStatus(store) {
        const identity = store.snapshot('identity').state;
        const model = ns.engineeringModel.build(store.snapshot('engineering'));
        const powerRow = model.components.find((c) => c.key === 'powerDistribution').status;
        const rows = [
            ['LIFE SUPPORT', store.snapshot('lifeSupport').status],
            ['NAVIGATION', store.snapshot('navigation').status],
            ['ENGINEERING', model.overall],
            ['POWER DISTRIBUTION', powerRow],
            ['CREW MONITORING', store.snapshot('crew').status],
            ['COMMUNICATIONS', store.snapshot('communications').status]
        ];
        const board = store.alerts();
        const overall = worst([board.overall, ...rows.map((r) => r[1])]);
        const crew = crewCounts(store);

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
