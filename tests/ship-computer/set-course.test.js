'use strict';

/**
 * NAVIGATION SET COURSE: commander only, asks before it changes anything, confirm and cancel,
 * clear rejections, and consistency of the model, the adapter and the navigation report.
 */

const ns = require('./load');
const DataSimulator = require('../../js/data-simulator.js');
const { createShipStore, createManualClock } = ns.shipState;

const START = Date.UTC(2122, 5, 2, 8, 0, 0);

function setup(level = 'COMMANDER') {
    const session = ns.privilege.createSession({ level });
    const clock = createManualClock(START);
    const store = createShipStore({ clock });
    const registry = ns.registry.createRegistry();
    ns.systemCommands.register(registry);
    ns.navigationCommands.register(registry, store, session);
    ns.logCommands.register(registry, store);
    const engine = ns.engine.createEngine({
        registry,
        authorize: (required) => ns.privilege.authorize(session, required)
    });
    return { clock, store, engine, session, sim: new DataSimulator({ store, clock }), registry };
}

const textOf = (result) => result.blocks.map((b) => {
    if (b.type === 'table') return b.rows.map((r) => r.join(' ')).join('\n');
    if (b.type === 'authorization') return `ACCESS RESTRICTED. REQUIRED PRIVILEGE: ${b.required} CURRENT PRIVILEGE: ${b.current}`;
    return b.text || '';
}).join('\n');

describe('SET COURSE: privilege and the question', () => {
    test('below commander the command is refused before any question is shown', () => {
        const { engine } = setup('OFFICER');
        const result = engine.execute('NAVIGATION SET COURSE SOL SYSTEM');
        expect(result.status).toBe('denied');
        expect(result.blocks[0]).toEqual({ type: 'authorization', required: 'COMMANDER', current: 'OFFICER' });
        expect(engine.pending()).toBeNull();
    });

    test('a commander is asked, and the question shows the current and requested course', () => {
        const { engine } = setup();
        const result = engine.execute('NAVIGATION SET COURSE SOL SYSTEM');
        expect(result.status).toBe('pending');
        const text = textOf(result);
        expect(text).toContain('NEW COURSE REQUESTED.');
        expect(text).toContain('CURRENT COURSE: LV-426');
        expect(text).toContain('REQUESTED COURSE: SOL SYSTEM');
        expect(text).toContain('CONFIRM COURSE CHANGE? Y/N');
    });

    test('asking changes nothing: the destination, the ETA and the log are as they were', () => {
        const { store, engine } = setup();
        const before = store.snapshot('navigation').state;
        engine.execute('NAVIGATION SET COURSE SOL SYSTEM');
        expect(store.snapshot('navigation').state).toEqual(before);
        expect(store.events()).toEqual([]);
    });

    test('a missing destination is refused with the usage form', () => {
        const { engine } = setup();
        const result = engine.execute('NAVIGATION SET COURSE');
        expect(result.status).toBe('error');
        expect(textOf(result)).toContain('NAVIGATION SET COURSE [DESTINATION]');
        expect(engine.pending()).toBeNull();
    });
});

describe('SET COURSE: confirm and cancel', () => {
    test('Y changes the destination through the navigation operation, logs it, and says what changed', () => {
        const { store, engine } = setup();
        engine.execute('NAVIGATION SET COURSE SOL SYSTEM');
        const answer = engine.execute('Y');
        expect(answer.status).toBe('ok');
        expect(store.snapshot('navigation').state.destination).toBe('SOL SYSTEM');
        expect(store.events().map((e) => e.message)).toEqual(['COURSE CHANGED: LV-426 TO SOL SYSTEM']);
        expect(textOf(answer)).toContain('COURSE CHANGED.');
        expect(textOf(answer)).toContain('DESTINATION: SOL SYSTEM');
        expect(textOf(answer)).toContain('PREVIOUS COURSE: LV-426.');
    });

    test('N cancels: nothing changes, and the response says so', () => {
        const { store, engine } = setup();
        engine.execute('NAVIGATION SET COURSE SOL SYSTEM');
        const answer = engine.execute('N');
        expect(answer.status).toBe('cancelled');
        expect(store.snapshot('navigation').state.destination).toBe('LV-426');
        expect(store.events()).toEqual([]);
        expect(textOf(answer)).toContain('COURSE CHANGE CANCELLED. CURRENT COURSE UNCHANGED: LV-426.');
    });

    test('Escape cancels the same way', () => {
        const { store, engine } = setup();
        engine.execute('NAVIGATION SET COURSE SOL SYSTEM');
        engine.cancelPending();
        expect(store.snapshot('navigation').state.destination).toBe('LV-426');
    });

    test('a second command while a change is waiting is refused as an invalid answer, and nothing changes', () => {
        const { store, engine } = setup();
        engine.execute('NAVIGATION SET COURSE SOL SYSTEM');
        const busy = engine.execute('NAVIGATION SET COURSE THOMAS EDISON');
        expect(busy.status).toBe('pending');
        expect(textOf(busy)).toContain('ANSWER Y OR N.');
        expect(store.snapshot('navigation').state.destination).toBe('LV-426');
    });
});

describe('SET COURSE: rejections', () => {
    test('an unknown destination is a clear error, with no question', () => {
        const { engine } = setup();
        const result = engine.execute('NAVIGATION SET COURSE GALLEY');
        expect(result.status).toBe('error');
        expect(textOf(result)).toContain('UNKNOWN DESTINATION: GALLEY.');
        expect(engine.pending()).toBeNull();
    });

    test('the course already set is refused, with no question', () => {
        const { engine } = setup();
        const result = engine.execute('NAVIGATION SET COURSE LV-426');
        expect(result.status).toBe('error');
        expect(textOf(result)).toContain('ALREADY ON COURSE FOR LV-426.');
        expect(engine.pending()).toBeNull();
    });

    test('the store refuses a course change to an unknown destination and changes nothing', () => {
        const { store } = setup();
        expect(() => store.operate('navigation', 'setCourse', { destination: 'GALLEY' }, 'navigation'))
            .toThrow(/unknown destination/);
        expect(store.events()).toEqual([]);
    });
});

describe('SET COURSE: consistency', () => {
    test('a course change late in the trip counts the arrival from now, not from the start', () => {
        const { clock, engine, sim } = setup();
        clock.advance(500 * 3600 * 1000);
        engine.execute('NAVIGATION SET COURSE SOL SYSTEM');
        engine.execute('Y');
        expect(sim.generateSystemStatus().navigation.eta.getTime() - START).toBe((500 + 2100) * 3600 * 1000);
    });

    test('the confirmation reports hours remaining, which matches the navigation overview', () => {
        const { engine } = setup();
        engine.execute('NAVIGATION SET COURSE SOL SYSTEM');
        expect(textOf(engine.execute('Y'))).toContain('ETA: 2100.0 HOURS.');
    });

    test('a commander who loses the level before confirming is refused, and nothing changes', () => {
        const { store, engine, session } = setup();
        engine.execute('NAVIGATION SET COURSE SOL SYSTEM');
        session.setLevel('OFFICER');
        const answer = engine.execute('Y');
        expect(answer.blocks[0].type).toBe('authorization');
        expect(store.snapshot('navigation').state.destination).toBe('LV-426');
    });

    test('after Y, the model, the simulator adapter and the navigation report agree on the new course and ETA', () => {
        const { engine, sim } = setup();
        engine.execute('NAVIGATION SET COURSE SOL SYSTEM');
        engine.execute('Y');
        const nav = sim.generateSystemStatus().navigation;
        expect(nav.destination).toBe('SOL SYSTEM');
        const overview = engine.execute('NAVIGATION DESTINATION').blocks;
        expect(JSON.stringify(overview)).toContain('SOL SYSTEM');
        expect(nav.eta.getTime() - START).toBe(2100 * 3600 * 1000);
    });
});
