/**
 * HELP and HELP [COMMAND], generated from registry metadata.
 */

const ns = require('./load');

function makeEngine() {
    const registry = ns.registry.createRegistry();
    ns.systemCommands.register(registry);
    registry.register({
        name: 'STATUS',
        description: 'SHOWS THE WHOLE-SHIP STATUS.',
        usage: 'STATUS',
        category: 'SHIP',
        handler: () => []
    });
    registry.register({
        name: 'LIFE SUPPORT',
        description: 'SHOWS LIFE SUPPORT.',
        usage: 'LIFE SUPPORT [ZONE]',
        category: 'SHIP',
        handler: () => []
    });
    return ns.engine.createEngine({ registry });
}

describe('HELP', () => {
    test('lists every registered command, grouped by category', () => {
        const result = makeEngine().execute('HELP');
        expect(result.status).toBe('ok');
        const tables = result.blocks.filter((b) => b.type === 'table');
        const categories = result.blocks.filter((b) => b.type === 'text').map((b) => b.text);
        expect(categories).toEqual(['SYSTEM', 'SHIP']);
        const allNames = tables.flatMap((t) => t.rows.map((r) => r[0]));
        expect(allNames).toEqual(['HELP', 'HELLO', 'WHO ARE YOU', 'SYSTEM', 'STATUS', 'LIFE SUPPORT']);
    });

    test('HELP COMMAND shows the usage and description from metadata', () => {
        const result = makeEngine().execute('HELP STATUS');
        expect(result.blocks).toEqual([
            { type: 'text', text: 'USAGE: STATUS' },
            { type: 'text', text: 'SHOWS THE WHOLE-SHIP STATUS.' }
        ]);
    });

    test('HELP accepts multi-word commands, in any case', () => {
        const result = makeEngine().execute('help life  support');
        expect(result.blocks[0].text).toBe('USAGE: LIFE SUPPORT [ZONE]');
    });

    test('HELP for an unknown command is an error that points back to HELP', () => {
        const result = makeEngine().execute('HELP NOPE');
        expect(result.blocks[0].type).toBe('error');
        expect(result.blocks[0].text).toContain('NOPE');
    });
});
