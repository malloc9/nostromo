'use strict';

/**
 * ACCESS, ACCESS LEVELS, WHOAMI, the restricted SPECIAL ORDER 937, and the
 * engine's privilege gate: a denied command runs nothing and reveals nothing.
 */

const ns = require('./load');
const { createShipStore, createManualClock } = ns.shipState;

const START = Date.UTC(2122, 5, 2, 8, 0, 0);
const SO937_TEXT = 'PRIORITY ONE. INSURE RETURN OF ORGANISM FOR ANALYSIS. ALL OTHER CONSIDERATIONS SECONDARY. CREW EXPENDABLE.';

function makeEngine(level = 'COMMANDER') {
    const session = ns.privilege.createSession({ level });
    const store = createShipStore({ clock: createManualClock(START) });
    const registry = ns.registry.createRegistry();
    ns.systemCommands.register(registry);
    ns.accessCommands.register(registry, session);
    ns.engineeringCommands.register(registry, store);
    ns.statusCommands.register(registry, store);
    ns.restrictedCommands.register(registry);
    const engine = ns.engine.createEngine({
        registry,
        authorize: (required) => ns.privilege.authorize(session, required)
    });
    return { session, engine, store };
}

const textOf = (result) => result.blocks.map((b) => b.text || (b.lines || []).join('\n')).join('\n');

describe('ACCESS and WHOAMI agree with the session', () => {
    test('ACCESS shows the current level', () => {
        const { engine } = makeEngine('OFFICER');
        expect(textOf(engine.execute('ACCESS'))).toContain('CURRENT ACCESS LEVEL: OFFICER');
    });

    test('WHOAMI shows the session, the level, and what the level permits and withholds', () => {
        const { engine } = makeEngine('OFFICER');
        const text = textOf(engine.execute('WHOAMI'));
        expect(text).toContain('SESSION: 0000-A7F3');
        expect(text).toContain('PRIVILEGE: OFFICER');
        expect(text).toContain('PERMITTED:');
        expect(text).toContain('WITHHELD:');
        expect(text).toContain('MISSION ORDERS');
        expect(text).toContain('CORPORATE DIRECTIVES');
    });

    test('ACCESS LEVELS lists every level with what it allows', () => {
        const { engine } = makeEngine();
        const table = engine.execute('ACCESS LEVELS').blocks.find((b) => b.type === 'table');
        expect(table.rows.map((r) => r[0])).toEqual(['CREW', 'OFFICER', 'COMMANDER', 'CORPORATE', 'SYSTEM']);
        expect(table.columns).toEqual(['LEVEL', 'DESCRIPTION', 'ALLOWS']);
    });

    test('a level change on the session is what ACCESS reports', () => {
        const { session, engine } = makeEngine('COMMANDER');
        session.setLevel('CREW');
        expect(textOf(engine.execute('ACCESS'))).toContain('CURRENT ACCESS LEVEL: CREW');
    });
});

describe('SPECIAL ORDER 937 is restricted', () => {
    test('a commander is refused, sees the required and current level, and no restricted text', () => {
        const { engine } = makeEngine('COMMANDER');
        const result = engine.execute('SPECIAL ORDER 937');
        expect(result.status).toBe('denied');
        const block = result.blocks[0];
        expect(block.type).toBe('authorization');
        expect(block.required).toBe('CORPORATE');
        expect(block.current).toBe('COMMANDER');
        expect(JSON.stringify(result)).not.toContain('ORGANISM');
        expect(JSON.stringify(result)).not.toContain(SO937_TEXT);
    });

    test('a corporate session receives the order', () => {
        const { engine } = makeEngine('CORPORATE');
        const result = engine.execute('SPECIAL ORDER 937');
        expect(result.status).toBe('ok');
        expect(textOf(result)).toBe(SO937_TEXT);
    });
});

describe('the engine gate runs before any handler', () => {
    test('a denied command runs no handler and changes no state', () => {
        const handler = jest.fn(() => []);
        const registry = ns.registry.createRegistry();
        registry.register({ name: 'LOCKED', privilege: 'CORPORATE', handler });
        const engine = ns.engine.createEngine({
            registry,
            authorize: (required) => ns.privilege.authorize(ns.privilege.createSession({ level: 'CREW' }), required)
        });
        const result = engine.execute('LOCKED');
        expect(handler).not.toHaveBeenCalled();
        expect(result.status).toBe('denied');
    });

    test('a denied command is refused before its arguments are checked, so usage is not revealed', () => {
        const registry = ns.registry.createRegistry();
        registry.register({ name: 'LOCKED', privilege: 'CORPORATE', args: [{ name: 'X', required: true }], usage: 'LOCKED X', handler: () => [] });
        const engine = ns.engine.createEngine({
            registry,
            authorize: (required) => ns.privilege.authorize(ns.privilege.createSession({ level: 'CREW' }), required)
        });
        expect(engine.execute('LOCKED').blocks[0].type).toBe('authorization');
    });

    test('commands with no declared privilege need CREW', () => {
        const { engine } = makeEngine('CREW');
        expect(engine.execute('HELP').status).toBe('ok');
        expect(engine.execute('STATUS').status).toBe('ok');
    });
});
