/**
 * LIFE SUPPORT and its three sub-reports: OXYGEN, ATMOSPHERE and TEMPERATURE.
 * Every value comes from the life support model, in the plan's units.
 */
(function (root) {
    const ns = root.NostromoShipComputer = root.NostromoShipComputer || {};

    function text(line) {
        return { type: 'text', text: line };
    }

    function heading(line) {
        return { type: 'text', text: line, tone: 'heading' };
    }

    function leader(label, value) {
        return text(ns.util.formatLeader(label, value));
    }

    function componentStatus(model, key) {
        return model.components.find((c) => c.key === key).status;
    }

    const CLOSING = { NOMINAL: 'OPERATIONAL', WARNING: 'WARNING', CRITICAL: 'CRITICAL' };

    function overview(model) {
        const r = model.readings;
        return [
            heading('LIFE SUPPORT MONITORING'),
            leader('OXYGEN LEVEL', `${r.oxygen.toFixed(1)}%`),
            leader('CO2 CONCENTRATION', `${r.co2.toFixed(2)}%`),
            leader('ATMOSPHERIC PRESSURE', `${r.pressure.toFixed(1)} KPA`),
            leader('CABIN TEMPERATURE', `${r.temperature.toFixed(1)}°C`),
            leader('HUMIDITY', `${r.humidity.toFixed(1)}%`),
            text(''),
            text(`AIR CIRCULATION: ${componentStatus(model, 'airCirculation')}`),
            text(`ATMOSPHERIC CONTROL: ${componentStatus(model, 'atmosphericControl')}`),
            text(''),
            text(`LIFE SUPPORT ${CLOSING[model.overall]}.`)
        ];
    }

    function oxygen(model) {
        return [
            heading('OXYGEN REPORT'),
            leader('OXYGEN LEVEL', `${model.readings.oxygen.toFixed(1)}%`),
            text(''),
            text('OXYGEN REPORT COMPLETE.')
        ];
    }

    function atmosphere(model) {
        const r = model.readings;
        return [
            heading('ATMOSPHERE REPORT'),
            leader('CO2 CONCENTRATION', `${r.co2.toFixed(2)}%`),
            leader('ATMOSPHERIC PRESSURE', `${r.pressure.toFixed(1)} KPA`),
            text(`ATMOSPHERIC CONTROL: ${componentStatus(model, 'atmosphericControl')}`),
            text(`AIR CIRCULATION: ${componentStatus(model, 'airCirculation')}`),
            text(''),
            text('ATMOSPHERE REPORT COMPLETE.')
        ];
    }

    function temperature(model) {
        const r = model.readings;
        return [
            heading('TEMPERATURE REPORT'),
            leader('CABIN TEMPERATURE', `${r.temperature.toFixed(1)}°C`),
            leader('HUMIDITY', `${r.humidity.toFixed(1)}%`),
            text(''),
            text('TEMPERATURE REPORT COMPLETE.')
        ];
    }

    /** Refuses stray words, so a sub-report never silently ignores what was typed. */
    function refuseArgs(usage) {
        return (ctx) => (ctx.args.length > 0 ? [{ type: 'error', text: `USAGE: ${usage}` }] : null);
    }

    /**
     * @param {ReturnType<import('./ship-state.js').createShipStore>} store
     */
    function register(registry, store) {
        const model = () => ns.lifeSupportModel.build(store.snapshot('lifeSupport'));

        registry.register({
            name: 'LIFE SUPPORT',
            category: 'LIFE SUPPORT',
            description: 'SHOWS THE ATMOSPHERE, CLIMATE AND LIFE SUPPORT STATUS.',
            usage: 'LIFE SUPPORT',
            handler: (ctx) => refuseArgs('LIFE SUPPORT')(ctx) || overview(model())
        });

        const sub = (name, description, build) => registry.register({
            name,
            category: 'LIFE SUPPORT',
            description,
            usage: name,
            handler: (ctx) => refuseArgs(name)(ctx) || build(model())
        });
        sub('LIFE SUPPORT OXYGEN', 'SHOWS THE OXYGEN LEVEL.', oxygen);
        sub('LIFE SUPPORT ATMOSPHERE', 'SHOWS CO2, PRESSURE AND THE ATMOSPHERIC CONTROL.', atmosphere);
        sub('LIFE SUPPORT TEMPERATURE', 'SHOWS THE CABIN TEMPERATURE AND HUMIDITY.', temperature);
    }

    ns.lifeSupportCommands = { register, overview };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.lifeSupportCommands;
    }
})(typeof window !== 'undefined' ? window : globalThis);
