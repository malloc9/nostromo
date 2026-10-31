/**
 * Engineering sub-reports: POWER, REACTOR, ENGINES, COOLING, DAMAGE, and the overall
 * POWER status. Pure: each takes the store and returns report blocks, so the terminal
 * commands and the future REPORT command share one handler per subsystem.
 *
 * Every value comes from the same store measurements and engineering model that the
 * Engineering screen and Dashboard read, so the numbers match at the same time.
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

    function percent(value) {
        return `${value.toFixed(1)}%`;
    }

    /** Signed net value to one decimal; a tiny negative rounds to +0.0 rather than -0.0. */
    function signed(value) {
        const rounded = Math.round(value * 10) / 10;
        return `${rounded > 0 ? '+' : ''}${rounded.toFixed(1)}%`;
    }

    function celsius(value) {
        return `${value.toFixed(1)}°C`;
    }

    function componentStatus(model, key) {
        return model.components.find((c) => c.key === key).status;
    }

    /** One line per fault, naming the part it sits on. */
    function faultBlocks(faults, labelOf) {
        return faults.map((f) => {
            const part = labelOf(f.component);
            return text(`${part ? `${part}  ` : ''}${f.code}  ${f.message}  ${f.severity}`);
        });
    }

    function componentLabel(key) {
        const found = ns.engineeringModel.COMPONENTS.find((c) => c.key === key);
        return found ? found.label : null;
    }

    /** @returns {import('./blocks.js').Block[]} */
    function power(store) {
        const model = ns.engineeringModel.build(store.snapshot('engineering'));
        const m = store.snapshot('engineering').measurements;
        const margin = m.powerGeneration - m.powerConsumption;
        return [
            heading('POWER DISTRIBUTION REPORT'),
            leader('GENERATION', percent(m.powerGeneration)),
            leader('CONSUMPTION', percent(m.powerConsumption)),
            leader('MARGIN', signed(margin)),
            leader('EFFICIENCY', percent(m.powerEfficiency)),
            leader('DISTRIBUTION', componentStatus(model, 'powerDistribution')),
            text(''),
            text('POWER REPORT COMPLETE.')
        ];
    }

    /** @returns {import('./blocks.js').Block[]} */
    function reactor(store) {
        const snap = store.snapshot('engineering');
        const model = ns.engineeringModel.build(snap);
        const faults = model.faults.filter((f) => f.component === 'mainReactor');
        return [
            heading('REACTOR REPORT'),
            leader('MAIN REACTOR', componentStatus(model, 'mainReactor')),
            leader('OUTPUT', percent(snap.measurements.powerGeneration)),
            leader('FAULTS', String(faults.length)),
            // The heading already names the part, so the fault lines omit it.
            ...faultBlocks(faults, () => null),
            text(''),
            text('REACTOR REPORT COMPLETE.')
        ];
    }

    /** @returns {import('./blocks.js').Block[]} */
    function engines(store) {
        const snap = store.snapshot('engineering');
        const model = ns.engineeringModel.build(snap);
        return [
            heading('ENGINE REPORT'),
            leader('PRIMARY ENGINE', componentStatus(model, 'primaryEngine')),
            leader('PRIMARY LOAD', percent(snap.measurements.primaryEngineLoad)),
            leader('SECONDARY ENGINE', componentStatus(model, 'secondaryEngine')),
            leader('SECONDARY LOAD', percent(snap.measurements.secondaryEngineLoad)),
            text(''),
            text('ENGINE REPORT COMPLETE.')
        ];
    }

    /** @returns {import('./blocks.js').Block[]} */
    function cooling(store) {
        const snap = store.snapshot('engineering');
        const model = ns.engineeringModel.build(snap);
        return [
            heading('COOLING REPORT'),
            leader('COOLING SYSTEM', componentStatus(model, 'coolingSystem')),
            leader('TEMPERATURE', celsius(snap.measurements.coolingTemperature)),
            leader('WARNING AT', celsius(snap.state.coolingWarningAt)),
            text(''),
            text('COOLING REPORT COMPLETE.')
        ];
    }

    /** Every active fault, or a clear statement that there is none. */
    function damage(store) {
        const model = ns.engineeringModel.build(store.snapshot('engineering'));
        const blocks = [heading('DAMAGE REPORT')];
        if (model.faults.length === 0) {
            blocks.push(text('NO ACTIVE DAMAGE.'));
        } else {
            blocks.push(leader('ACTIVE DAMAGE', String(model.faults.length)));
            blocks.push(...faultBlocks(model.faults, componentLabel));
        }
        blocks.push(text(''));
        blocks.push(text('DAMAGE REPORT COMPLETE.'));
        return blocks;
    }

    /** Overall power status for the POWER command. */
    function powerStatus(store) {
        const model = ns.engineeringModel.build(store.snapshot('engineering'));
        const m = store.snapshot('engineering').measurements;
        const net = m.powerGeneration - m.powerConsumption;
        return [
            heading('POWER STATUS'),
            leader('GENERATION', percent(m.powerGeneration)),
            leader('CONSUMPTION', percent(m.powerConsumption)),
            leader('NET POWER', signed(net)),
            leader('FUEL RESERVE', percent(m.fuelReserve)),
            leader('DISTRIBUTION', componentStatus(model, 'powerDistribution')),
            text(''),
            text('POWER STATUS COMPLETE.')
        ];
    }

    ns.engineeringReports = { power, reactor, engines, cooling, damage, powerStatus };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.engineeringReports;
    }
})(typeof window !== 'undefined' ? window : globalThis);
