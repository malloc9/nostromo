/**
 * ENGINEERING: the engineering overview, read from the engineering model.
 * Sub-reports (ENGINEERING POWER, REACTOR, ...) arrive with ticket 06.
 */
(function (root) {
    const ns = root.NostromoShipComputer = root.NostromoShipComputer || {};

    /**
     * @param {import('./engineering-model.js').EngineeringModel} model
     * @returns {import('./blocks.js').Block[]}
     */
    function renderEngineering(model) {
        const blocks = [{ type: 'text', text: 'ENGINEERING SYSTEMS', tone: 'heading' }];
        model.components.forEach((c) => {
            blocks.push({ type: 'text', text: ns.util.formatLeader(c.label, c.status) });
        });
        blocks.push({ type: 'text', text: '' });
        blocks.push({ type: 'text', text: `POWER OUTPUT: ${model.powerOutput.toFixed(1)}%` });
        blocks.push({ type: 'text', text: `FUEL RESERVES: ${model.fuelReserve.toFixed(1)}%` });
        blocks.push({ type: 'text', text: '' });
        blocks.push({ type: 'text', text: `ACTIVE FAULTS: ${model.faults.length}` });
        model.faults.forEach((f) => {
            blocks.push({ type: 'text', text: `${f.code}  ${f.message}  ${f.severity}` });
        });
        blocks.push({ type: 'text', text: '' });
        blocks.push({ type: 'text', text: 'ENGINEERING REPORT COMPLETE.' });
        return blocks;
    }

    /**
     * @param {ReturnType<import('./ship-state.js').createShipStore>} store
     */
    function register(registry, store) {
        registry.register({
            name: 'ENGINEERING',
            category: 'ENGINEERING',
            description: 'SHOWS THE ENGINEERING OVERVIEW: REACTOR, ENGINES, COOLING, POWER AND FAULTS.',
            usage: 'ENGINEERING',
            handler: (ctx) => {
                if (ctx.args.length > 0) {
                    return [{ type: 'error', text: 'UNRECOGNISED ENGINEERING REPORT. USAGE: ENGINEERING' }];
                }
                return renderEngineering(ns.engineeringModel.build(store.snapshot('engineering')));
            }
        });
    }

    ns.engineeringCommands = { register, renderEngineering };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.engineeringCommands;
    }
})(typeof window !== 'undefined' ? window : globalThis);
