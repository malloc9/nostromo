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
    const SUBCOMMAND_USAGE = 'USAGE: ENGINEERING [POWER|REACTOR|ENGINES|COOLING|DAMAGE]';

    /**
     * @param {ReturnType<import('./registry.js').createRegistry>} registry
     * @param {ReturnType<import('./ship-state.js').createShipStore>} store
     */
    function register(registry, store) {
        registry.register({
            name: 'ENGINEERING',
            category: 'ENGINEERING',
            description: 'SHOWS THE ENGINEERING OVERVIEW. SUB-REPORTS: POWER, REACTOR, ENGINES, COOLING, DAMAGE.',
            usage: 'ENGINEERING [POWER|REACTOR|ENGINES|COOLING|DAMAGE]',
            handler: (ctx) => {
                if (ctx.args.length > 0) {
                    return [{ type: 'error', text: `UNKNOWN ENGINEERING REPORT: ${ctx.args.join(' ')}. ${SUBCOMMAND_USAGE}` }];
                }
                return renderEngineering(ns.engineeringModel.build(store.snapshot('engineering')));
            }
        });

        // Each sub-report is its own command, so HELP lists it and it refuses stray words.
        const sub = (name, description, build) => registry.register({
            name,
            category: 'ENGINEERING',
            description,
            usage: name,
            handler: (ctx) => (ctx.args.length > 0 ? [{ type: 'error', text: `USAGE: ${name}` }] : build(store))
        });
        sub('ENGINEERING POWER', 'SHOWS THE POWER DISTRIBUTION REPORT.', ns.engineeringReports.power);
        sub('ENGINEERING REACTOR', 'SHOWS THE MAIN REACTOR STATUS, OUTPUT AND FAULTS.', ns.engineeringReports.reactor);
        sub('ENGINEERING ENGINES', 'SHOWS THE PRIMARY AND SECONDARY ENGINES.', ns.engineeringReports.engines);
        sub('ENGINEERING COOLING', 'SHOWS THE COOLING SYSTEM AND ITS WARNING THRESHOLD.', ns.engineeringReports.cooling);
        sub('ENGINEERING DAMAGE', 'SHOWS EVERY ACTIVE ENGINEERING FAULT.', ns.engineeringReports.damage);
        sub('POWER', 'SHOWS THE OVERALL POWER STATUS.', ns.engineeringReports.powerStatus);
    }

    ns.engineeringCommands = { register, renderEngineering };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.engineeringCommands;
    }
})(typeof window !== 'undefined' ? window : globalThis);
