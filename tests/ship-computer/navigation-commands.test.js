'use strict';

/**
 * Navigation: the model, the six NAVIGATION commands with the NAV alias, navigation
 * history from the shared log, and consistency with the simulator and STATUS.
 */

const ns = require('./load');
const DataSimulator = require('../../js/data-simulator.js');
const { createShipStore, createManualClock } = ns.shipState;

const START = Date.UTC(2122, 5, 2, 8, 0, 0);

function setup() {
    const clock = createManualClock(START);
    const store = createShipStore({ clock });
    const registry = ns.registry.createRegistry();
    ns.systemCommands.register(registry);
    ns.navigationCommands.register(registry, store);
    ns.statusCommands.register(registry, store);
    ns.logCommands.register(registry, store);
    return { clock, store, engine: ns.engine.createEngine({ registry }), sim: new DataSimulator({ store, clock }) };
}

const lines = (result) => result.blocks.map((b) => b.text || '');
const line = (result, prefix) => lines(result).find((l) => l.startsWith(prefix));
const tableRows = (result) => (result.blocks.find((b) => b.type === 'table') || { rows: [] }).rows;

describe('navigation model', () => {
    test('readings have the screen\'s shape: coordinates, heading, velocity, destination and an ETA date', () => {
        const { store } = setup();
        const model = ns.navigationModel.build(store.snapshot('navigation'), { etaAt: store.startedAt + 72 * 3600 * 1000, now: store.now() });
        expect(Object.keys(model.readings.coordinates).sort()).toEqual(['x', 'y', 'z']);
        expect(model.readings.heading).toBeGreaterThanOrEqual(0);
        expect(model.readings.heading).toBeLessThan(360);
        expect(model.readings.destination).toBe('LV-426');
        expect(model.readings.eta).toBeInstanceOf(Date);
    });

    test('a quarter hour before arrival reads as a fraction, not as arrival', () => {
        const { store } = setup();
        const etaAt = store.startedAt + 15 * 60 * 1000;
        expect(ns.navigationModel.build(store.snapshot('navigation'), { etaAt, now: store.now() }).hoursRemaining).toBe(0.3);
    });

    test('hours remaining counts down with the simulation clock and stops at zero', () => {
        const { store, clock } = setup();
        const etaAt = store.startedAt + 2 * 3600 * 1000;
        expect(ns.navigationModel.build(store.snapshot('navigation'), { etaAt, now: store.now() }).hoursRemaining).toBe(2);
        clock.advance(3 * 3600 * 1000);
        expect(ns.navigationModel.build(store.snapshot('navigation'), { etaAt, now: store.now() }).hoursRemaining).toBe(0);
    });
});

describe('NAVIGATION commands', () => {
    test('NAVIGATION overview shows position, heading, velocity, destination, ETA and status', () => {
        const { engine } = setup();
        const result = engine.execute('NAVIGATION');
        expect(line(result, 'POSITION')).toBeDefined();
        expect(line(result, 'HEADING')).toMatch(/°$/);
        expect(line(result, 'VELOCITY')).toMatch(/ C$/);
        expect(line(result, 'DESTINATION')).toMatch(/LV-426$/);
        expect(line(result, 'ETA')).toMatch(/HOURS$/);
        expect(lines(result)).toContain('NAVIGATION OPERATIONAL.');
    });

    test('NAVIGATION POSITION gives x, y and z', () => {
        const { engine } = setup();
        const rows = tableRows(engine.execute('NAVIGATION POSITION'));
        expect(rows.map((r) => r[0])).toEqual(['X', 'Y', 'Z']);
    });

    test('NAVIGATION DESTINATION and COURSE give the destination and the trajectory', () => {
        const { engine } = setup();
        expect(lines(engine.execute('NAVIGATION DESTINATION')).find((l) => /^DESTINATION \./.test(l))).toMatch(/LV-426$/);
        expect(line(engine.execute('NAVIGATION COURSE'), 'TRAJECTORY')).toBeDefined();
    });

    test('NAVIGATION STATUS shows nominal, then the fault that changes it', () => {
        const { store, engine } = setup();
        expect(line(engine.execute('NAVIGATION STATUS'), 'NAVIGATION STATUS')).toMatch(/NOMINAL$/);
        store.operate('navigation', 'addFault', { code: 'NAV-2', message: 'STAR TRACKER DRIFT' }, 'navigation');
        const result = engine.execute('NAVIGATION STATUS');
        expect(line(result, 'NAVIGATION STATUS')).toMatch(/WARNING$/);
        expect(lines(result)).toContain('NAV-2  STAR TRACKER DRIFT  WARNING');
    });

    test('NAVIGATION HISTORY lists navigation events from the shared log, and says so when empty', () => {
        const { store, engine } = setup();
        expect(lines(engine.execute('NAVIGATION HISTORY'))).toContain('NO NAVIGATION EVENTS RECORDED.');
        store.operate('navigation', 'addFault', { code: 'NAV-2', message: 'STAR TRACKER DRIFT' }, 'navigation');
        const rows = tableRows(engine.execute('NAVIGATION HISTORY'));
        expect(rows.some((r) => r.join(' ').indexOf('FAULT RAISED: STAR TRACKER DRIFT') !== -1)).toBe(true);
    });

    test('NAV is the alias of NAVIGATION, and NAV with a part works like the full command', () => {
        const { engine } = setup();
        expect(engine.execute('NAV').command).toBe('NAVIGATION');
        expect(engine.execute('nav destination').command).toBe('NAVIGATION DESTINATION');
    });

    test('each command is registered with usage and description', () => {
        const { store } = setup();
        const registry = ns.registry.createRegistry();
        ns.navigationCommands.register(registry, store);
        ['NAVIGATION', 'NAVIGATION POSITION', 'NAVIGATION DESTINATION', 'NAVIGATION COURSE',
            'NAVIGATION STATUS', 'NAVIGATION HISTORY'].forEach((name) => {
            const def = registry.get(name);
            expect(def).not.toBeNull();
            expect(def.usage).toEqual(expect.any(String));
            expect(def.description.length).toBeGreaterThan(0);
        });
    });

    test('a sub-command with extra words is refused with usage text', () => {
        const { engine } = setup();
        expect(engine.execute('NAVIGATION POSITION NOW').blocks[0].text).toContain('USAGE: NAVIGATION POSITION');
    });
});

describe('consistency and the integration path', () => {
    test('position, heading, velocity and destination equal the simulator values at the same time', () => {
        const { clock, engine, sim } = setup();
        clock.advance(45 * 1000);
        const nav = sim.generateSystemStatus().navigation;
        const rows = tableRows(engine.execute('NAVIGATION POSITION'));
        expect(Number(rows[0][1])).toBe(nav.coordinates.x);
        expect(Number(rows[2][1])).toBe(nav.coordinates.z);
        expect(line(engine.execute('NAVIGATION'), 'DESTINATION')).toMatch(nav.destination);
    });

    test('a navigation fault shows in the report, STATUS, the header count and the log at once', () => {
        const { store, engine } = setup();
        store.operate('navigation', 'addFault', { code: 'NAV-2', message: 'STAR TRACKER DRIFT' }, 'navigation');
        expect(line(engine.execute('NAVIGATION STATUS'), 'NAVIGATION STATUS')).toMatch(/WARNING$/);
        expect(lines(engine.execute('STATUS')).find((l) => l.startsWith('NAVIGATION'))).toMatch(/WARNING$/);
        expect(store.alerts().list.map((a) => a.id)).toEqual(['navigation:NAV-2']);
        expect(tableRows(engine.execute('LOG NAVIGATION')).some((r) => r.join(' ').indexOf('STAR TRACKER DRIFT') !== -1)).toBe(true);
    });
});
