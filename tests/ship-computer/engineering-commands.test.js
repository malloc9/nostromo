'use strict';

/**
 * ENGINEERING and STATUS reports, read from the same model the panels read.
 */

const ns = require('./load');
const { createShipStore, createManualClock } = ns.shipState;

const START = Date.UTC(2122, 5, 2, 8, 0, 0);

function makeEngine() {
    const store = createShipStore({ clock: createManualClock(START) });
    const registry = ns.registry.createRegistry();
    ns.systemCommands.register(registry);
    ns.engineeringCommands.register(registry, store);
    ns.statusCommands.register(registry, store);
    return { store, engine: ns.engine.createEngine({ registry }) };
}

const lines = (result) => result.blocks.map((b) => b.text || '');

describe('ENGINEERING', () => {
    test('nominal: every component, power output, fuel and zero active faults', () => {
        const { engine } = makeEngine();
        const text = lines(engine.execute('ENGINEERING'));
        expect(text).toContain('ENGINEERING SYSTEMS');
        expect(text.find((l) => l.startsWith('MAIN REACTOR'))).toMatch(/NOMINAL$/);
        expect(text.find((l) => l.startsWith('POWER OUTPUT:'))).toMatch(/%$/);
        expect(text.find((l) => l.startsWith('FUEL RESERVES:'))).toMatch(/%$/);
        expect(text).toContain('ACTIVE FAULTS: 0');
        expect(text[text.length - 1]).toBe('ENGINEERING REPORT COMPLETE.');
    });

    test('component lines use aligned dotted leaders of the same width', () => {
        const { engine } = makeEngine();
        const rows = lines(engine.execute('ENGINEERING')).filter((l) => l.includes(' .'));
        expect(rows).toHaveLength(5);
        rows.forEach((row) => expect(row.length).toBe(rows[0].length));
    });

    test('with a reactor fault, the reactor line and the fault list say so', () => {
        const { store, engine } = makeEngine();
        store.operate('engineering', 'addFault', { code: 'R-7', message: 'REACTOR TEMP HIGH', component: 'mainReactor', severity: 'WARNING' }, 'engineering');
        const text = lines(engine.execute('ENGINEERING'));
        expect(text.find((l) => l.startsWith('MAIN REACTOR'))).toMatch(/WARNING$/);
        expect(text).toContain('ACTIVE FAULTS: 1');
        expect(text).toContain('R-7  REACTOR TEMP HIGH  WARNING');
    });

    test('arguments are refused with usage text until the sub-reports exist', () => {
        const { engine } = makeEngine();
        const result = engine.execute('ENGINEERING REACTOR');
        expect(result.status).toBe('error');
        expect(result.blocks[0].text).toContain('USAGE: ENGINEERING');
    });
});

describe('STATUS', () => {
    test('nominal: operational overall, every primary system nominal, crew and alert counts', () => {
        const { engine } = makeEngine();
        const text = lines(engine.execute('STATUS'));
        expect(text).toContain('VESSEL: USCSS NOSTROMO');
        expect(text).toContain('REGISTRATION: 1809246(09)');
        expect(text).toContain('OVERALL STATUS: OPERATIONAL');
        expect(text.find((l) => l.startsWith('ENGINEERING'))).toMatch(/NOMINAL$/);
        expect(text.find((l) => l.startsWith('POWER DISTRIBUTION'))).toMatch(/NOMINAL$/);
        expect(text.find((l) => l.startsWith('CREW:'))).toBe('CREW: 5 ACTIVE / 1 SYNTHETIC / 1 RESTING');
        expect(text).toContain('ACTIVE ALERTS: 0');
    });

    test('a reactor warning changes the engineering and power lines and the overall status', () => {
        const { store, engine } = makeEngine();
        store.operate('engineering', 'addFault', { code: 'R-7', component: 'mainReactor', severity: 'WARNING' }, 'engineering');
        const text = lines(engine.execute('STATUS'));
        expect(text).toContain('OVERALL STATUS: WARNING');
        expect(text.find((l) => l.startsWith('ENGINEERING'))).toMatch(/WARNING$/);
        expect(text.find((l) => l.startsWith('POWER DISTRIBUTION'))).toMatch(/NOMINAL$/);
        expect(text).toContain('ACTIVE ALERTS: 1');
    });

    test('a critical fault makes the overall status critical', () => {
        const { store, engine } = makeEngine();
        store.operate('engineering', 'addFault', { code: 'R-7', component: 'mainReactor', severity: 'CRITICAL' }, 'engineering');
        expect(lines(engine.execute('STATUS'))).toContain('OVERALL STATUS: CRITICAL');
    });
});
