/**
 * MISSION and its sub-reports. Mission data is its own subsystem, separate from the technical
 * state. MISSION ORDERS is the one command that needs officer level; the engine checks it
 * from the command's declared privilege, so nothing here checks privilege itself.
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
     */
    function register(registry, store) {
        const mission = () => store.snapshot('mission');

        // The one-line answer the retired responder gave, read from the ship data it describes.
        registry.register({
            name: 'WHAT IS YOUR MISSION',
            category: 'MISSION',
            description: 'SAYS WHAT THE SHIP IS CARRYING AND HOW MANY ARE ABOARD.',
            usage: 'WHAT IS YOUR MISSION',
            handler: (ctx) => refuseArgs('WHAT IS YOUR MISSION')(ctx) || (() => {
                const identity = store.snapshot('identity').state;
                const humans = store.snapshot('crew').state.members.filter((m) => m.type === 'human').length;
                const vessel = identity.vessel.split(' ').pop();
                return [text(`${identity.vesselClass} ${vessel}. CREW: ${humans}. CARGO: ${mission().state.cargo}.`)];
            })()
        });

        const sub = (name, description, privilege, build) => registry.register({
            name,
            category: 'MISSION',
            description,
            usage: name,
            privilege,
            handler: (ctx) => refuseArgs(name)(ctx) || build()
        });

        registry.register({
            name: 'MISSION',
            category: 'MISSION',
            description: 'SHOWS THE CURRENT MISSION: OBJECTIVE, PHASE AND CARGO.',
            usage: 'MISSION',
            handler: (ctx) => refuseArgs('MISSION')(ctx) || [
                heading('MISSION OVERVIEW'),
                leader('OBJECTIVE', mission().state.objective),
                leader('PHASE', mission().state.phase),
                leader('CARGO', mission().state.cargo),
                leader('CREW COMPLEMENT', String(store.snapshot('crew').state.members.filter((m) => m.type === 'human').length)),
                text(''),
                text('MISSION OVERVIEW COMPLETE.')
            ]
        });

        sub('MISSION STATUS', 'SHOWS THE MISSION PROGRESS.', undefined, () => [
            heading('MISSION STATUS'),
            leader('PHASE', mission().state.phase),
            leader('SYSTEM STATUS', mission().status),
            text(''),
            text('MISSION STATUS COMPLETE.')
        ]);

        sub('MISSION OBJECTIVES', 'SHOWS THE CURRENT OBJECTIVES.', undefined, () => [
            { type: 'table', columns: ['OBJECTIVE', 'STATUS'], rows: mission().state.objectives.map((o) => [o.text, o.status]) },
            text(''),
            text(`OBJECTIVES: ${mission().state.objectives.length}`)
        ]);

        sub('MISSION HISTORY', 'SHOWS PREVIOUS MISSION EVENTS FROM THE LOG.', undefined, () => {
            const events = store.events().filter((e) => e.subsystem === 'mission').slice().reverse();
            if (events.length === 0) return [text('NO MISSION EVENTS RECORDED.')];
            return [{
                type: 'table',
                columns: ['TIME', 'SEVERITY', 'MESSAGE'],
                rows: events.map((e) => [ns.util.formatClock(e.time), e.severity, e.message])
            }];
        });

        sub('MISSION ORDERS', 'SHOWS THE CURRENT OPERATIONAL ORDERS. OFFICER LEVEL.', ns.privilege.OPERATIONS.MISSION_ORDERS, () => [
            heading('OPERATIONAL ORDERS'),
            ...mission().state.orders.map((o) => text(`${o.code}  ${o.text}`)),
            text(''),
            text('ORDERS COMPLETE.')
        ]);
    }

    ns.missionCommands = { register };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.missionCommands;
    }
})(typeof window !== 'undefined' ? window : globalThis);
