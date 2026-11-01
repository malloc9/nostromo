/**
 * HISTORY: the commands entered in this session, with their times. The history is the
 * terminal's own record; it is separate from the simulation and from the log.
 */
(function (root) {
    const ns = root.NostromoShipComputer = root.NostromoShipComputer || {};

    /**
     * @param {ReturnType<import('./input-history.js').createInputHistory>} history
     */
    function register(registry, history) {
        registry.register({
            name: 'HISTORY',
            category: 'TERMINAL',
            description: 'LISTS THE COMMANDS ENTERED THIS SESSION, WITH THEIR TIMES.',
            usage: 'HISTORY',
            handler: (ctx) => {
                if (ctx.args.length > 0) return [{ type: 'error', text: 'USAGE: HISTORY' }];
                const entries = history.entries();
                if (entries.length === 0) return [{ type: 'text', text: 'NO COMMANDS IN HISTORY.' }];
                return [{
                    type: 'table',
                    columns: ['TIME', 'COMMAND'],
                    rows: entries.map((e) => [ns.util.formatClock(e.time), e.text])
                }];
            }
        });
    }

    ns.inputCommands = { register };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.inputCommands;
    }
})(typeof window !== 'undefined' ? window : globalThis);
