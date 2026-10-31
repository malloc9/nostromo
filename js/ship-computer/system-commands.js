/**
 * System commands that belong to the engine itself. Currently HELP.
 * Everything here reads metadata from the registry, so HELP never goes stale.
 */
(function (root) {
    const ns = root.NostromoShipComputer = root.NostromoShipComputer || {};

    /**
     * Group commands by category, keeping the order categories were first registered.
     * @param {Array<Object>} commands
     * @returns {Map<string, Array<Object>>}
     */
    function groupByCategory(commands) {
        const groups = new Map();
        commands.forEach((cmd) => {
            if (!groups.has(cmd.category)) groups.set(cmd.category, []);
            groups.get(cmd.category).push(cmd);
        });
        return groups;
    }

    function helpHandler(ctx) {
        if (ctx.args.length > 0) {
            const topic = ctx.args.join(' ');
            const def = ctx.registry.get(topic);
            if (!def) {
                return [{ type: 'error', text: `NO HELP ENTRY FOR ${topic.toUpperCase()}. TYPE HELP FOR A LIST OF COMMANDS.` }];
            }
            return [
                { type: 'text', text: `USAGE: ${def.usage}` },
                { type: 'text', text: def.description || 'NO DESCRIPTION ON FILE.' }
            ];
        }

        const blocks = [];
        groupByCategory(ctx.registry.list()).forEach((commands, category) => {
            blocks.push({ type: 'text', text: category, tone: 'heading' });
            blocks.push({
                type: 'table',
                columns: ['COMMAND', 'DESCRIPTION'],
                rows: commands.map((cmd) => [cmd.name, cmd.description])
            });
        });
        return blocks;
    }

    /**
     * @param {ReturnType<import('./registry.js').createRegistry>} registry
     */
    function register(registry) {
        registry.register({
            name: 'HELP',
            category: 'SYSTEM',
            description: 'LISTS THE AVAILABLE COMMANDS, OR DESCRIBES ONE.',
            usage: 'HELP [COMMAND]',
            args: [{ name: 'COMMAND', required: false }],
            handler: helpHandler
        });
    }

    ns.systemCommands = { register };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.systemCommands;
    }
})(typeof window !== 'undefined' ? window : globalThis);
