/**
 * ACCESS, ACCESS LEVELS and WHOAMI: what the session may do. These read the session
 * and the privilege model; they never decide anything themselves.
 */
(function (root) {
    const ns = root.NostromoShipComputer = root.NostromoShipComputer || {};

    function allowsText(level) {
        const labels = ns.privilege.operationsFor(level).map((op) => ns.privilege.OPERATION_LABELS[op]);
        return labels.join(', ');
    }

    /**
     * @param {ReturnType<import('./privilege.js').createSession>} session
     */
    function register(registry, session) {
        const noArgs = (usage) => (ctx) => (ctx.args.length > 0 ? [{ type: 'error', text: `USAGE: ${usage}` }] : null);

        registry.register({
            name: 'ACCESS',
            category: 'ACCESS',
            description: 'SHOWS THE CURRENT ACCESS LEVEL.',
            usage: 'ACCESS',
            handler: (ctx) => noArgs('ACCESS')(ctx) || [
                { type: 'text', text: `CURRENT ACCESS LEVEL: ${session.level}` },
                { type: 'text', text: ns.privilege.DESCRIPTIONS[session.level] }
            ]
        });

        registry.register({
            name: 'ACCESS LEVELS',
            category: 'ACCESS',
            description: 'LISTS THE ACCESS LEVELS AND WHAT EACH ALLOWS.',
            usage: 'ACCESS LEVELS',
            handler: (ctx) => noArgs('ACCESS LEVELS')(ctx) || [{
                type: 'table',
                columns: ['LEVEL', 'DESCRIPTION', 'ALLOWS'],
                rows: ns.privilege.LEVELS.map((level) => [level, ns.privilege.DESCRIPTIONS[level], allowsText(level)])
            }]
        });

        registry.register({
            name: 'WHOAMI',
            category: 'ACCESS',
            description: 'SHOWS THIS SESSION AND WHAT ITS LEVEL PERMITS AND WITHHOLDS.',
            usage: 'WHOAMI',
            handler: (ctx) => {
                if (ctx.args.length > 0) return [{ type: 'error', text: 'USAGE: WHOAMI' }];
                const permitted = ns.privilege.operationsFor(session.level);
                const withheld = Object.keys(ns.privilege.OPERATIONS).filter((op) => permitted.indexOf(op) === -1);
                const labelsOf = (ops) => ops.map((op) => ({ type: 'text', text: `  ${ns.privilege.OPERATION_LABELS[op]}` }));
                return [
                    { type: 'text', text: `SESSION: ${session.id}` },
                    { type: 'text', text: `PRIVILEGE: ${session.level}` },
                    { type: 'text', text: '' },
                    { type: 'text', text: 'PERMITTED:', tone: 'heading' },
                    ...labelsOf(permitted),
                    { type: 'text', text: 'WITHHELD:', tone: 'heading' },
                    ...(withheld.length ? labelsOf(withheld) : [{ type: 'text', text: '  NONE' }])
                ];
            }
        });
    }

    ns.accessCommands = { register };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.accessCommands;
    }
})(typeof window !== 'undefined' ? window : globalThis);
