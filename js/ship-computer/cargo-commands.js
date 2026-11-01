/**
 * CARGO and its sub-reports. Every figure comes from the cargo items the store holds,
 * so the overview, manifest, status and location always agree.
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

    function refuseArgs(usage) {
        return (ctx) => (ctx.args.length > 0 ? [{ type: 'error', text: `USAGE: ${usage}` }] : null);
    }

    /** Units summed across the items: the one count every cargo report uses. */
    function unitsOf(items) {
        return items.reduce((sum, i) => sum + i.units, 0);
    }

    /**
     * @param {ReturnType<import('./ship-state.js').createShipStore>} store
     */
    function register(registry, store) {
        const items = () => store.snapshot('cargo').state.items;

        const sub = (name, description, build) => registry.register({
            name,
            category: 'CARGO',
            description,
            usage: name,
            handler: (ctx) => refuseArgs(name)(ctx) || build()
        });

        registry.register({
            name: 'CARGO',
            category: 'CARGO',
            description: 'SHOWS THE CARGO OVERVIEW.',
            usage: 'CARGO',
            handler: (ctx) => refuseArgs('CARGO')(ctx) || [
                heading('CARGO OVERVIEW'),
                text(`ITEMS: ${items().length}`),
                text(`UNITS: ${unitsOf(items())}`),
                text(''),
                text('CARGO OVERVIEW COMPLETE.')
            ]
        });

        sub('CARGO MANIFEST', 'SHOWS THE CARGO INVENTORY.', () => [
            { type: 'table', columns: ['ITEM', 'UNITS', 'LOCATION'], rows: items().map((i) => [i.item, String(i.units), i.location]) },
            text(''),
            text(`ITEMS: ${items().length}`)
        ]);

        sub('CARGO STATUS', 'SHOWS THE CONDITION OF THE CARGO.', () => {
            const byCondition = {};
            items().forEach((i) => { byCondition[i.condition] = (byCondition[i.condition] || 0) + 1; });
            const rows = Object.keys(byCondition).map((c) => [c, String(byCondition[c])]);
            return [
                heading('CARGO STATUS'),
                text(`ITEMS: ${items().length}`),
                { type: 'table', columns: ['CONDITION', 'ITEMS'], rows },
                text(''),
                text('CARGO STATUS COMPLETE.')
            ];
        });

        sub('CARGO LOCATION', 'SHOWS WHERE THE CARGO IS STORED.', () => {
            const byLocation = {};
            items().forEach((i) => { byLocation[i.location] = (byLocation[i.location] || 0) + 1; });
            const rows = Object.keys(byLocation).map((l) => [l, String(byLocation[l])]);
            return [
                { type: 'table', columns: ['LOCATION', 'ITEMS'], rows },
                text(''),
                text(`ITEMS: ${items().length}`)
            ];
        });
    }

    ns.cargoCommands = { register, unitsOf };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.cargoCommands;
    }
})(typeof window !== 'undefined' ? window : globalThis);
