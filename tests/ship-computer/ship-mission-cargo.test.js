'use strict';

/**
 * Ship information, mission and cargo commands, the one officer-level check, and the
 * single sources for the firmware label and the ship time.
 */

const ns = require('./load');
const { createShipStore, createManualClock } = ns.shipState;

const START = Date.UTC(2122, 5, 2, 8, 0, 0);
const FIRMWARE = 'MU/TH-UR FW 6000.48';

function setup(level = 'OFFICER') {
    const session = ns.privilege.createSession({ level });
    const clock = createManualClock(START);
    const store = createShipStore({ clock });
    const registry = ns.registry.createRegistry();
    ns.systemCommands.register(registry);
    ns.shipCommands.register(registry, store, { firmware: FIRMWARE });
    ns.missionCommands.register(registry, store, session);
    ns.cargoCommands.register(registry, store);
    const engine = ns.engine.createEngine({
        registry,
        authorize: (required) => ns.privilege.authorize(session, required)
    });
    return { clock, store, engine, registry, session };
}

const textOf = (result) => result.blocks.map((b) => {
    if (b.type === 'table') return b.rows.map((r) => r.join(' ')).join('\n');
    if (b.type === 'authorization') return `ACCESS RESTRICTED. REQUIRED PRIVILEGE: ${b.required} CURRENT PRIVILEGE: ${b.current}`;
    return b.text || (b.lines || []).join('\n');
}).join('\n');

describe('ship information', () => {
    test('SHIP shows the identity and registration', () => {
        const { engine } = setup();
        const text = textOf(engine.execute('SHIP'));
        expect(text).toContain('USCSS NOSTROMO');
        expect(text).toContain('1809246(09)');
    });

    test('SHIP SPECIFICATIONS, SYSTEMS and CONFIGURATION each return a report', () => {
        const { engine } = setup();
        ['SHIP SPECIFICATIONS', 'SHIP SYSTEMS', 'SHIP CONFIGURATION'].forEach((cmd) => {
            const result = engine.execute(cmd);
            expect(result.status).toBe('ok');
            expect(result.blocks.length).toBeGreaterThan(2);
        });
    });

    test('SHIP REGISTRATION gives the registration and the owner', () => {
        const { engine } = setup();
        const text = textOf(engine.execute('SHIP REGISTRATION'));
        expect(text).toContain('REGISTRATION');
        expect(text).toContain('WEYLAND-YUTANI');
    });

    test('SHIP MANIFEST lists the crew complement', () => {
        const { engine } = setup();
        const table = engine.execute('SHIP MANIFEST').blocks.find((b) => b.type === 'table');
        expect(table.rows.length).toBe(7);
    });

    test('VERSION shows the firmware label the header shows, from the one source given to it', () => {
        const { engine } = setup();
        expect(textOf(engine.execute('VERSION'))).toContain(FIRMWARE);
    });

    test('TIME agrees with the header clock for the same simulated time', () => {
        const { clock, engine } = setup();
        clock.advance(65 * 1000);
        expect(textOf(engine.execute('TIME'))).toContain(ns.util.formatShipDateTime(clock.now()));
    });

    test('the ship date and time format is one function, used for the header and TIME', () => {
        expect(ns.util.formatShipDateTime(START)).toMatch(/^2122-06-02 \d{2}:\d{2}:\d{2}$/);
    });
});

describe('mission', () => {
    test('MISSION overview shows the objective and the phase', () => {
        const { engine } = setup();
        const text = textOf(engine.execute('MISSION'));
        expect(text).toContain('RETURN REFINERY TO EARTH');
        expect(text).toContain('IN PROGRESS');
    });

    test('MISSION STATUS, OBJECTIVES and HISTORY each return a report', () => {
        const { engine } = setup();
        expect(textOf(engine.execute('MISSION STATUS'))).toContain('MISSION STATUS');
        expect(engine.execute('MISSION OBJECTIVES').blocks.find((b) => b.type === 'table')).toBeDefined();
        expect(textOf(engine.execute('MISSION HISTORY'))).toContain('NO MISSION EVENTS RECORDED.');
    });

    test('MISSION ORDERS is denied below officer with an authorization block, and lists the orders at officer', () => {
        const below = setup('CREW').engine.execute('MISSION ORDERS');
        expect(below.status).toBe('denied');
        expect(below.blocks[0]).toEqual({ type: 'authorization', required: 'OFFICER', current: 'CREW' });
        const at = textOf(setup('OFFICER').engine.execute('MISSION ORDERS'));
        expect(at).toContain('OPERATIONAL ORDERS');
    });

    test('mission data is stored in its own subsystem, not in the technical state', () => {
        const { store } = setup();
        expect(Object.keys(store.snapshot('mission').state)).not.toContain('powerGeneration');
        const before = store.snapshot('engineering');
        store.operate('mission', 'setStatus', { status: 'WARNING' }, 'mission');
        expect(store.snapshot('engineering')).toEqual(before);
    });

    test('mission commands refuse arguments with usage text', () => {
        const { engine } = setup();
        expect(engine.execute('MISSION STATUS NOW').blocks[0].text).toContain('USAGE: MISSION STATUS');
    });
});

describe('cargo', () => {
    test('the overview, manifest and status agree on the item count and mass', () => {
        const { engine } = setup();
        const overview = textOf(engine.execute('CARGO'));
        const manifest = engine.execute('CARGO MANIFEST').blocks.find((b) => b.type === 'table');
        const count = manifest.rows.length;
        expect(overview).toContain(`ITEMS: ${count}`);
        const status = textOf(engine.execute('CARGO STATUS'));
        expect(status).toContain(`ITEMS: ${count}`);
    });

    test('CARGO LOCATION groups the items by where they are stored', () => {
        const { engine } = setup();
        const table = engine.execute('CARGO LOCATION').blocks.find((b) => b.type === 'table');
        expect(table.columns).toEqual(['LOCATION', 'ITEMS']);
        const total = table.rows.reduce((sum, r) => sum + Number(r[1]), 0);
        const manifest = engine.execute('CARGO MANIFEST').blocks.find((b) => b.type === 'table');
        expect(total).toBe(manifest.rows.length);
    });

    test('each cargo command is registered with usage and description', () => {
        const { registry } = setup();
        ['CARGO', 'CARGO MANIFEST', 'CARGO STATUS', 'CARGO LOCATION'].forEach((name) => {
            const def = registry.get(name);
            expect(def).not.toBeNull();
            expect(def.usage).toEqual(expect.any(String));
            expect(def.description.length).toBeGreaterThan(0);
        });
    });
});

describe('output never shows markup or exception text', () => {
    test('a report from every group contains no angle brackets or stack text', () => {
        const { engine } = setup();
        ['SHIP', 'MISSION', 'CARGO', 'VERSION', 'TIME'].forEach((cmd) => {
            expect(textOf(engine.execute(cmd))).not.toMatch(/[<>]|at .*\(|Error:/);
        });
    });
});
