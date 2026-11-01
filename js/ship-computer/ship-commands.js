/**
 * Ship information: SHIP and its sub-reports, plus VERSION and TIME. Read-only.
 *
 * The firmware label and the ship time have one source each: the firmware label comes from
 * the header (built from VERSION) and is passed in; the time comes from util.formatShipDateTime,
 * which the header also uses.
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

    /**
     * @param {ReturnType<import('./ship-state.js').createShipStore>} store
     * @param {{firmware: string}} options  the firmware label, as the header shows it
     */
    function register(registry, store, options) {
        const identity = () => store.snapshot('identity').state;
        const members = () => store.snapshot('crew').state.members.filter((m) => m.type === 'human');

        const sub = (name, description, build) => registry.register({
            name,
            category: 'SHIP',
            description,
            usage: name,
            handler: (ctx) => refuseArgs(name)(ctx) || build()
        });

        registry.register({
            name: 'SHIP',
            category: 'SHIP',
            description: 'SHOWS GENERAL SHIP INFORMATION.',
            usage: 'SHIP',
            handler: (ctx) => refuseArgs('SHIP')(ctx) || [
                heading('SHIP INFORMATION'),
                leader('VESSEL', identity().vessel),
                leader('CLASS', identity().vesselClass),
                leader('REGISTRATION', identity().registration),
                leader('HOME PORT', identity().homePort),
                text(''),
                text('SHIP INFORMATION COMPLETE.')
            ]
        });

        sub('SHIP SPECIFICATIONS', 'SHOWS THE TECHNICAL SPECIFICATIONS.', () => {
            const spec = identity().specifications;
            return [
                heading('SPECIFICATIONS'),
                leader('LENGTH', spec.length),
                leader('MASS', spec.mass),
                leader('CREW RATED', String(spec.crewRated)),
                text(''),
                text('SPECIFICATIONS COMPLETE.')
            ];
        });

        sub('SHIP REGISTRATION', 'SHOWS THE REGISTRATION AND OWNERSHIP.', () => [
            heading('REGISTRATION'),
            leader('REGISTRATION', identity().registration),
            leader('OPERATOR', identity().operator),
            leader('HOME PORT', identity().homePort),
            text(''),
            text('REGISTRATION COMPLETE.')
        ]);

        sub('SHIP SYSTEMS', 'SHOWS THE INSTALLED SYSTEMS.', () => [
            heading('INSTALLED SYSTEMS'),
            ...identity().systems.map((s) => text(s)),
            text(''),
            text('SYSTEMS COMPLETE.')
        ]);

        sub('SHIP CONFIGURATION', 'SHOWS THE CURRENT CONFIGURATION.', () => [
            heading('CONFIGURATION'),
            text(identity().configuration),
            text(''),
            text('CONFIGURATION COMPLETE.')
        ]);

        sub('SHIP MANIFEST', 'SHOWS THE HUMAN CREW COMPLEMENT.', () => [
            heading('SHIP MANIFEST'),
            { type: 'table', columns: ['NO', 'NAME', 'POSITION'], rows: members().map((m, i) => [String(i + 1).padStart(2, '0'), m.name, m.position]) },
            text(''),
            text(`CREW COMPLEMENT: ${members().length}`)
        ]);

        registry.register({
            name: 'VERSION',
            category: 'SHIP',
            description: 'SHOWS THE COMPUTER FIRMWARE, AS THE HEADER SHOWS IT.',
            usage: 'VERSION',
            handler: (ctx) => refuseArgs('VERSION')(ctx) || [
                heading('FIRMWARE'),
                text(options.firmware),
                text('FIRMWARE INFORMATION COMPLETE.')
            ]
        });

        registry.register({
            name: 'TIME',
            category: 'SHIP',
            description: 'SHOWS THE SHIP COMPUTER DATE AND TIME, AS THE HEADER SHOWS IT.',
            usage: 'TIME',
            handler: (ctx) => refuseArgs('TIME')(ctx) || [
                leader('SHIP TIME', ns.util.formatShipDateTime(store.now()))
            ]
        });
    }

    ns.shipCommands = { register };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.shipCommands;
    }
})(typeof window !== 'undefined' ? window : globalThis);
