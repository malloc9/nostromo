/**
 * REPORT and its filters, and ALERTS. REPORT composes the subsystem commands: each section is
 * the command's own handler output, run now, so the report cannot disagree with them.
 * Each composed command passes the same privilege decision the engine uses.
 */
(function (root) {
    const ns = root.NostromoShipComputer = root.NostromoShipComputer || {};

    function text(line) {
        return { type: 'text', text: line };
    }

    function heading(line) {
        return { type: 'text', text: line, tone: 'heading' };
    }

    // The ten sections of the plan, in order, each with the command it composes.
    const SECTIONS = [
        { heading: 'SECTION VESSEL', command: 'SHIP' },
        { heading: 'SECTION MISSION', command: 'MISSION' },
        { heading: 'SECTION NAVIGATION', command: 'NAVIGATION' },
        { heading: 'SECTION ENGINEERING', command: 'ENGINEERING' },
        { heading: 'SECTION POWER', command: 'POWER' },
        { heading: 'SECTION LIFE SUPPORT', command: 'LIFE SUPPORT' },
        { heading: 'SECTION CREW', command: 'CREW' },
        { heading: 'SECTION CARGO', command: 'CARGO' },
        { heading: 'SECTION ALERTS', command: 'ALERTS' },
        { heading: 'SECTION EVENTS', command: 'LOG' }
    ];

    // The detailed sub-reports REPORT ALL adds after the section they belong to.
    const DETAIL = {
        ENGINEERING: ['ENGINEERING REACTOR', 'ENGINEERING ENGINES', 'ENGINEERING COOLING', 'ENGINEERING DAMAGE'],
        'LIFE SUPPORT': ['LIFE SUPPORT OXYGEN', 'LIFE SUPPORT ATMOSPHERE', 'LIFE SUPPORT TEMPERATURE'],
        NAVIGATION: ['NAVIGATION COURSE'],
        MISSION: ['MISSION OBJECTIVES'],
        CREW: ['CREW ALL'],
        CARGO: ['CARGO MANIFEST']
    };

    const FILTERS = {
        FULL: { sections: SECTIONS.map((s) => s.command), detail: false },
        ENGINEERING: { sections: ['ENGINEERING', 'POWER'], detail: false },
        CREW: { sections: ['CREW'], detail: false },
        ALL: { sections: SECTIONS.map((s) => s.command), detail: true }
    };

    /**
     * Run a command's handler, under the same privilege decision the engine makes.
     * A command the session may not use is replaced by a notice, never by its output.
     */
    function compose(registry, session, name) {
        const def = registry.get(name);
        if (!def) return [text(`${name}: NOT AVAILABLE.`)];
        if (ns.privilege.authorize(session, def.privilege)) return [text(`${name}: NOT AVAILABLE AT THIS LEVEL.`)];
        try {
            return ns.blocks.normalize(def.handler({ args: [], command: def, registry, normalized: name, ask() {} }));
        } catch (err) {
            // The detail stays in the console; the terminal gets only the notice.
            console.error(err);
            return [text(`${name}: NOT AVAILABLE.`)];
        }
    }

    function reportFor(registry, session, store, filter) {
        const blocks = [];
        SECTIONS.forEach((section) => {
            if (FILTERS[filter].sections.indexOf(section.command) === -1) return;
            blocks.push(heading(section.heading));
            blocks.push(...compose(registry, session, section.command));
            if (FILTERS[filter].detail && DETAIL[section.command]) {
                DETAIL[section.command].forEach((name) => blocks.push(...compose(registry, session, name)));
            }
        });
        return blocks;
    }

    function alertsBlocks(store) {
        const list = store.alerts().list;
        if (list.length === 0) return [text('NO ACTIVE ALERTS.')];
        return [
            heading('ACTIVE ALERTS'),
            {
                type: 'table',
                columns: ['SEVERITY', 'SOURCE', 'MESSAGE'],
                rows: list.map((a) => [a.severity, a.subsystem.toUpperCase(), a.message])
            },
            text(`ACTIVE ALERTS: ${list.length}`)
        ];
    }

    /**
     * @param {ReturnType<import('./registry.js').createRegistry>} registry
     * @param {ReturnType<import('./ship-state.js').createShipStore>} store
     * @param {ReturnType<import('./privilege.js').createSession>} session
     */
    function register(registry, store, session) {
        registry.register({
            name: 'ALERTS',
            category: 'SHIP',
            description: 'SHOWS THE ACTIVE ALERTS FROM THE ALERT MANAGER.',
            usage: 'ALERTS',
            handler: (ctx) => (ctx.args.length > 0 ? [{ type: 'error', text: 'USAGE: ALERTS' }] : alertsBlocks(store))
        });

        const report = (name, filter, description) => registry.register({
            name,
            category: 'SHIP',
            description,
            usage: name,
            handler: (ctx) => (ctx.args.length > 0
                ? [{ type: 'error', text: 'USAGE: REPORT [ENGINEERING|CREW|ALL]' }]
                : reportFor(registry, session, store, filter))
        });
        report('REPORT', 'FULL', 'SHOWS THE COMPREHENSIVE SHIP REPORT: TEN SECTIONS.');
        report('REPORT ENGINEERING', 'ENGINEERING', 'SHOWS THE ENGINEERING AND POWER SECTIONS.');
        report('REPORT CREW', 'CREW', 'SHOWS THE CREW SECTION.');
        report('REPORT ALL', 'ALL', 'SHOWS THE FULL REPORT WITH THE DETAILED SUB-REPORTS.');
    }

    ns.reportCommands = { register, SECTIONS };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.reportCommands;
    }
})(typeof window !== 'undefined' ? window : globalThis);
