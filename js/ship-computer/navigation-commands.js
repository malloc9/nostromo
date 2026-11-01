/**
 * NAVIGATION and its sub-reports (POSITION, DESTINATION, COURSE, STATUS, HISTORY), with
 * the NAV alias. Read-only: changing course is a later operational ticket.
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

    const CLOSING = { NOMINAL: 'OPERATIONAL', WARNING: 'WARNING', CRITICAL: 'CRITICAL' };

    function etaAt(store) {
        return store.startedAt + store.snapshot('navigation').state.etaOffsetHours * ns.navigationModel.HOUR_MS;
    }

    function modelOf(store) {
        return ns.navigationModel.build(store.snapshot('navigation'), { etaAt: etaAt(store), now: store.now() });
    }

    function overview(model) {
        const r = model.readings;
        const c = r.coordinates;
        return [
            heading('NAVIGATION OVERVIEW'),
            leader('POSITION', `${c.x.toFixed(0)}, ${c.y.toFixed(0)}, ${c.z.toFixed(0)}`),
            leader('HEADING', `${r.heading.toFixed(0)}°`),
            leader('VELOCITY', `${r.velocity.toFixed(3)} C`),
            leader('DESTINATION', r.destination),
            leader('ETA', `${model.hoursRemaining.toFixed(1)} HOURS`),
            text(''),
            text(`NAVIGATION ${CLOSING[model.status]}.`)
        ];
    }

    function position(model) {
        const c = model.readings.coordinates;
        return [{
            type: 'table',
            columns: ['AXIS', 'POSITION'],
            rows: [['X', c.x.toFixed(1)], ['Y', c.y.toFixed(1)], ['Z', c.z.toFixed(1)]]
        }];
    }

    function destination(model) {
        return [
            heading('DESTINATION REPORT'),
            leader('DESTINATION', model.readings.destination),
            leader('ETA', model.readings.eta.toTimeString().substring(0, 8)),
            leader('HOURS REMAINING', model.hoursRemaining.toFixed(1))
        ];
    }

    function course(model) {
        const r = model.readings;
        return [
            heading('COURSE REPORT'),
            leader('HEADING', `${r.heading.toFixed(0)}°`),
            leader('VELOCITY', `${r.velocity.toFixed(3)} C`),
            leader('TRAJECTORY', `${r.heading.toFixed(0)}° AT ${r.velocity.toFixed(3)} C TOWARD ${r.destination}`)
        ];
    }

    function status(model) {
        const blocks = [heading('NAVIGATION REPORT'), leader('NAVIGATION STATUS', model.status)];
        model.faults.forEach((f) => blocks.push(text(`${f.code}  ${f.message}  ${f.severity}`)));
        blocks.push(text(''));
        blocks.push(text('NAVIGATION REPORT COMPLETE.'));
        return blocks;
    }

    function history(store) {
        const events = store.events().filter((e) => e.subsystem === 'navigation').slice().reverse();
        if (events.length === 0) return [text('NO NAVIGATION EVENTS RECORDED.')];
        return [{
            type: 'table',
            columns: ['TIME', 'SEVERITY', 'MESSAGE'],
            rows: events.map((e) => [ns.util.formatClock(e.time), e.severity, e.message])
        }];
    }

    /**
     * @param {ReturnType<import('./ship-state.js').createShipStore>} store
     */
    function register(registry, store) {
        const sub = (name, description, build, aliases = []) => registry.register({
            name,
            category: 'NAVIGATION',
            description,
            usage: name,
            aliases,
            handler: (ctx) => refuseArgs(name)(ctx) || build()
        });

        registry.register({
            name: 'NAVIGATION',
            category: 'NAVIGATION',
            description: 'SHOWS THE NAVIGATION OVERVIEW: POSITION, HEADING, VELOCITY, DESTINATION AND ETA.',
            usage: 'NAVIGATION',
            aliases: ['NAV'],
            handler: (ctx) => refuseArgs('NAVIGATION')(ctx) || overview(modelOf(store))
        });
        sub('NAVIGATION POSITION', 'SHOWS THE CURRENT COORDINATES.', () => position(modelOf(store)), ['NAV POSITION']);
        sub('NAVIGATION DESTINATION', 'SHOWS THE DESTINATION AND ITS ETA.', () => destination(modelOf(store)), ['NAV DESTINATION']);
        sub('NAVIGATION COURSE', 'SHOWS THE CURRENT TRAJECTORY.', () => course(modelOf(store)), ['NAV COURSE']);
        sub('NAVIGATION STATUS', 'SHOWS THE NAVIGATION SYSTEM HEALTH AND ITS FAULTS.', () => status(modelOf(store)), ['NAV STATUS']);
        sub('NAVIGATION HISTORY', 'SHOWS NAVIGATION EVENTS FROM THE LOG.', () => history(store), ['NAV HISTORY']);
    }

    ns.navigationCommands = { register };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.navigationCommands;
    }
})(typeof window !== 'undefined' ? window : globalThis);
