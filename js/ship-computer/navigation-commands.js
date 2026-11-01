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
    function register(registry, store, session) {
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
        // The one operational command: it asks first, and changes the course only on a Y.
        registry.register({
            name: 'NAVIGATION SET COURSE',
            category: 'NAVIGATION',
            description: 'SETS A NEW COURSE. COMMANDER LEVEL. ASKS FOR CONFIRMATION FIRST.',
            usage: 'NAVIGATION SET COURSE [DESTINATION]',
            privilege: 'COMMANDER',
            args: [{ name: 'DESTINATION', required: true }],
            handler: (ctx) => {
                const requested = ctx.args.join(' ').toUpperCase();
                const current = store.snapshot('navigation').state.destination;
                const known = Object.keys(store.snapshot('navigation').state.destinations);
                if (known.indexOf(requested) === -1) {
                    return [{ type: 'error', text: `UNKNOWN DESTINATION: ${requested}. KNOWN: ${known.join(', ')}` }];
                }
                if (requested === current) {
                    return [{ type: 'error', text: `ALREADY ON COURSE FOR ${current}.` }];
                }
                const question = [
                        heading('NEW COURSE REQUESTED.'),
                        text(`DESTINATION: ${requested}`),
                        text(''),
                        text(`CURRENT COURSE: ${current}`),
                        text(`REQUESTED COURSE: ${requested}`),
                        text(''),
                        text('CONFIRM COURSE CHANGE? Y/N')
                ];
                ctx.ask({
                    question,
                    confirm: () => {
                        // The privilege is decided again: the session may have lost commander level while the question waited.
                        const denial = ns.privilege.authorize(session, 'COMMANDER');
                        if (denial) return [{ type: 'authorization', required: denial.required, current: denial.current }];
                        // Checked again at confirmation: the course may have changed while the question waited.
                        const now = store.snapshot('navigation').state.destination;
                        if (requested === now) return [{ type: 'error', text: `ALREADY ON COURSE FOR ${now}.` }];
                        const elapsedHours = (store.now() - store.startedAt) / ns.navigationModel.HOUR_MS;
                        store.operate('navigation', 'setCourse', { destination: requested, elapsedHours }, 'navigation');
                        const eta = ns.navigationModel.build(store.snapshot('navigation'), { etaAt: store.startedAt + store.snapshot('navigation').state.etaOffsetHours * ns.navigationModel.HOUR_MS, now: store.now() }).hoursRemaining;
                        return [
                            heading('COURSE CHANGED.'),
                            text(`DESTINATION: ${requested}`),
                            text(`PREVIOUS COURSE: ${now}.`),
                            text(`ETA: ${eta.toFixed(1)} HOURS.`)
                        ];
                    },
                    cancel: () => [text(`COURSE CHANGE CANCELLED. CURRENT COURSE UNCHANGED: ${current}.`)]
                });
                return question;
            }
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
