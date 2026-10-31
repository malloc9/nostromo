/**
 * LOG commands: read the append-only event log from the store.
 *
 *   LOG                 most recent events
 *   LOG ALL             every event
 *   LOG [SUBSYSTEM]     events from one subsystem, e.g. LOG SECURITY, LOG LIFE SUPPORT
 *   LOG LAST [N]        the last N events
 */
(function (root) {
    const ns = root.NostromoShipComputer = root.NostromoShipComputer || {};

    const RECENT_COUNT = 10;
    const MAX_LAST = 200;
    const USAGE_FILTER = 'USAGE: LOG [ALL|SUBSYSTEM]';
    const USAGE_LAST = 'USAGE: LOG LAST [N]';

    /** lifeSupport becomes LIFE SUPPORT for display and for matching. */
    function displayName(name) {
        return name.replace(/([A-Z])/g, ' $1').toUpperCase().trim();
    }

    function plural(count, word) {
        return `${count} ${word}${count === 1 ? '' : 'S'} DISPLAYED.`;
    }

    /**
     * @param {Array<Object>} events oldest first, as stored
     * @param {{hint: boolean}} options
     */
    function renderLog(events, options) {
        const newestFirst = events.slice().reverse();
        const blocks = [{ type: 'text', text: 'SYSTEM EVENT LOG', tone: 'heading' }];

        if (newestFirst.length === 0) {
            blocks.push({ type: 'text', text: 'NO EVENTS RECORDED.' });
            return blocks;
        }

        blocks.push({
            type: 'table',
            columns: ['TIME', 'SOURCE', 'SEVERITY', 'MESSAGE'],
            rows: newestFirst.map((e) => [
                ns.util.formatClock(e.time),
                displayName(e.subsystem),
                e.severity,
                e.message
            ])
        });
        blocks.push({ type: 'text', text: plural(newestFirst.length, 'EVENT') });
        if (options.hint) {
            blocks.push({ type: 'text', text: 'ENTER LOG ALL FOR COMPLETE HISTORY.' });
        }
        return blocks;
    }

    /**
     * @param {ReturnType<import('./ship-state.js').createShipStore>} store
     */
    function register(registry, store) {
        registry.register({
            name: 'LOG',
            category: 'RECORDS',
            description: 'SHOWS THE SYSTEM EVENT LOG. LOG ALL FOR EVERYTHING, OR LOG [SUBSYSTEM].',
            usage: 'LOG [ALL|SUBSYSTEM]',
            args: [{ name: 'FILTER', required: false }],
            handler: (ctx) => {
                const events = store.events();
                if (ctx.args.length === 0) {
                    return renderLog(events.slice(-RECENT_COUNT), { hint: true });
                }

                const filter = ctx.args.join(' ').toUpperCase();
                if (filter === 'ALL') {
                    return renderLog(events, { hint: false });
                }

                const compact = filter.replace(/\s+/g, '');
                const subsystem = store.subsystemNames().find((name) => name.toUpperCase() === compact);
                if (!subsystem) {
                    return [{ type: 'error', text: `UNKNOWN LOG FILTER: ${filter}. ${USAGE_FILTER}` }];
                }
                return renderLog(events.filter((e) => e.subsystem === subsystem), { hint: false });
            }
        });

        registry.register({
            name: 'LOG LAST',
            category: 'RECORDS',
            description: 'SHOWS THE MOST RECENT N EVENTS.',
            usage: 'LOG LAST [N]',
            args: [{ name: 'COUNT', required: true }],
            handler: (ctx) => {
                const raw = ctx.args[0];
                const count = Number(raw);
                if (!Number.isInteger(count) || count < 1 || count > MAX_LAST) {
                    return [{ type: 'error', text: `INVALID COUNT: ${raw}. ${USAGE_LAST}` }];
                }
                return renderLog(store.events().slice(-count), { hint: false });
            }
        });
    }

    ns.logCommands = { register, RECENT_COUNT, MAX_LAST };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.logCommands;
    }
})(typeof window !== 'undefined' ? window : globalThis);
