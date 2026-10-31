'use strict';

/**
 * The integration test from the plan: terminal, store, header and panels agree on
 * the same reactor fault, and resolving it returns everything to nominal.
 */

const ns = require('./load');
const { createShipStore, createManualClock } = ns.shipState;

const START = Date.UTC(2122, 5, 2, 8, 0, 0);

function setup() {
    const clock = createManualClock(START);
    const store = createShipStore({ clock });
    const registry = ns.registry.createRegistry();
    ns.systemCommands.register(registry);
    ns.engineeringCommands.register(registry, store);
    ns.statusCommands.register(registry, store);
    ns.logCommands.register(registry, store);
    const engine = ns.engine.createEngine({ registry });
    return { clock, store, engine, registry };
}

const lines = (result) => result.blocks.map((b) => b.text || '');
const reactorLine = (result) => lines(result).find((l) => l.startsWith('MAIN REACTOR'));
const panelReactor = (store) => ns.engineeringModel.build(store.snapshot('engineering'))
    .components.find((c) => c.key === 'mainReactor').status;

describe('fault tracer: the plan\'s integration sequence', () => {
    test('nominal, then a reactor fault shows everywhere, then resolving it clears everywhere', () => {
        const { clock, store, engine } = setup();

        // 1. ENGINEERING with the reactor nominal
        expect(reactorLine(engine.execute('ENGINEERING'))).toMatch(/NOMINAL$/);

        // 2. A test-only fault on the reactor
        clock.advance(2000);
        store.operate('engineering', 'addFault', {
            code: 'R-7', message: 'REACTOR TEMP HIGH', component: 'mainReactor', severity: 'WARNING'
        }, 'engineering');

        // 3. ENGINEERING shows the fault
        const engReport = engine.execute('ENGINEERING');
        expect(reactorLine(engReport)).toMatch(/WARNING$/);
        expect(lines(engReport)).toContain('ACTIVE FAULTS: 1');

        // 4. STATUS reflects it
        const status = lines(engine.execute('STATUS'));
        expect(status).toContain('OVERALL STATUS: WARNING');
        expect(status.find((l) => l.startsWith('ENGINEERING'))).toMatch(/WARNING$/);

        // 5. The Engineering panel and the Dashboard read the same status
        expect(panelReactor(store)).toBe('WARNING');
        expect(store.alerts().overall).toBe('WARNING');

        // 6. The header count and the log both recorded the transition
        expect(store.alerts().list.map((a) => a.id)).toEqual(['engineering:R-7']);
        expect(store.events().map((e) => e.message)).toEqual([
            'FAULT RAISED: REACTOR TEMP HIGH',
            'ALERT RAISED: REACTOR TEMP HIGH'
        ]);

        // 7. Resolving the fault returns every place to nominal
        clock.advance(2000);
        store.operate('engineering', 'clearFault', { code: 'R-7' }, 'engineering');
        expect(reactorLine(engine.execute('ENGINEERING'))).toMatch(/NOMINAL$/);
        expect(lines(engine.execute('STATUS'))).toContain('OVERALL STATUS: OPERATIONAL');
        expect(panelReactor(store)).toBe('NOMINAL');
        expect(store.alerts().list).toEqual([]);
        expect(store.events().slice(-2).map((e) => e.message)).toEqual([
            'FAULT CLEARED: REACTOR TEMP HIGH',
            'ALERT CLEARED: REACTOR TEMP HIGH'
        ]);
    });
});

describe('fault tracer: the fault cannot be injected from the terminal', () => {
    test('no registered command can add a fault', () => {
        const { registry } = setup();
        const names = registry.list().map((c) => c.name);
        expect(names.some((n) => /FAULT|INJECT/.test(n))).toBe(false);
    });

    test('typing the operation name is an unknown command, and changes nothing', () => {
        const { store, engine } = setup();
        const before = store.snapshot('engineering');
        expect(engine.execute('addFault R-7').status).toBe('unknown');
        expect(engine.execute('ADDFAULT ENGINEERING R-7 CRITICAL').status).toBe('unknown');
        expect(store.snapshot('engineering')).toEqual(before);
        expect(store.events()).toEqual([]);
    });
});
