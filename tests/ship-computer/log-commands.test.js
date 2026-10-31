'use strict';

/**
 * LOG, LOG ALL, LOG [SUBSYSTEM] and LOG LAST [N], run through the engine.
 */

const ns = require('./load');
const { createShipStore, createManualClock } = ns.shipState;

const START = Date.UTC(2122, 5, 2, 8, 0, 0);

function makeEngine() {
    const clock = createManualClock(START);
    const store = createShipStore({ clock });
    const registry = ns.registry.createRegistry();
    ns.systemCommands.register(registry);
    ns.logCommands.register(registry, store);
    const engine = ns.engine.createEngine({ registry });
    return { clock, store, engine };
}

const textOf = (result) => result.blocks
    .map((b) => (b.type === 'table' ? b.rows.map((r) => r.join(' ')).join('\n') : (b.text || '')))
    .join('\n');

function seed(store, clock) {
    store.operate('engineering', 'addFault', { code: 'R-7', message: 'REACTOR' }, 'engineering');
    clock.advance(1000);
    store.operate('security', 'addFault', { code: 'SEC-1', message: 'ACCESS REQUEST' }, 'security');
    clock.advance(1000);
    store.operate('crew', 'addFault', { code: 'MED-1', message: 'CHECK' }, 'crew');
}

describe('LOG', () => {
    test('shows recent events, newest first, with the closing hint', () => {
        const { store, clock, engine } = makeEngine();
        seed(store, clock);
        const result = engine.execute('LOG');
        expect(result.status).toBe('ok');
        const text = textOf(result);
        expect(text.indexOf('CHECK')).toBeLessThan(text.indexOf('REACTOR'));
        expect(text).toContain('EVENTS DISPLAYED.');
        expect(text).toContain('ENTER LOG ALL FOR COMPLETE HISTORY.');
    });

    test('an empty log says so instead of showing an empty table', () => {
        const { engine } = makeEngine();
        expect(textOf(engine.execute('LOG'))).toContain('NO EVENTS RECORDED.');
    });

    test('shows the time, source, severity and message as columns', () => {
        const { store, engine } = makeEngine();
        store.operate('engineering', 'addFault', { code: 'R-7', message: 'REACTOR' }, 'engineering');
        const table = engine.execute('LOG').blocks.find((b) => b.type === 'table');
        expect(table.columns).toEqual(['TIME', 'SOURCE', 'SEVERITY', 'MESSAGE']);
        expect(table.rows[0][1]).toBe('ENGINEERING');
    });
});

describe('LOG ALL and LOG [SUBSYSTEM]', () => {
    test('LOG ALL shows the complete history without the recent-only hint', () => {
        const { store, clock, engine } = makeEngine();
        seed(store, clock);
        const text = textOf(engine.execute('LOG ALL'));
        // Each seeded fault writes a change event and an alert event.
        expect(text).toContain('6 EVENTS DISPLAYED.');
        expect(text).not.toContain('ENTER LOG ALL');
    });

    test('LOG SECURITY shows only the security subsystem', () => {
        const { store, clock, engine } = makeEngine();
        seed(store, clock);
        const text = textOf(engine.execute('LOG SECURITY'));
        expect(text).toContain('ACCESS REQUEST');
        expect(text).not.toContain('REACTOR');
        expect(text).toContain('2 EVENTS DISPLAYED.');
    });

    test('a multi-word subsystem name is matched in any case', () => {
        const { store, engine } = makeEngine();
        store.operate('lifeSupport', 'addFault', { code: 'O2' }, 'lifeSupport');
        expect(textOf(engine.execute('log life support'))).toContain('O2');
    });

    test('an unknown subsystem is rejected with usage text', () => {
        const { engine } = makeEngine();
        const result = engine.execute('LOG GALLEY');
        expect(result.blocks[0].type).toBe('error');
        expect(result.blocks[0].text).toContain('USAGE: LOG [ALL|SUBSYSTEM]');
    });
});

describe('LOG LAST [N]', () => {
    test('shows only the last N events, newest first', () => {
        const { store, clock, engine } = makeEngine();
        seed(store, clock);
        const text = textOf(engine.execute('LOG LAST 2'));
        expect(text).toContain('2 EVENTS DISPLAYED.');
        expect(textOf(engine.execute('LOG SECURITY'))).toContain('2 EVENTS DISPLAYED.');
        expect(text).not.toContain('REACTOR');
    });

    test('a missing count is rejected with the usage line', () => {
        const { engine } = makeEngine();
        const result = engine.execute('LOG LAST');
        expect(result.status).toBe('error');
        expect(result.blocks[0].text).toContain('USAGE: LOG LAST [N]');
    });

    test('a count that is not a positive whole number is rejected with usage', () => {
        const { engine } = makeEngine();
        ['0', 'many', '2.5', '-3', '5000'].forEach((n) => {
            const result = engine.execute(`LOG LAST ${n}`);
            expect(result.status).toBe('error');
            expect(result.blocks[0].text).toContain('USAGE: LOG LAST [N]');
        });
    });
});

describe('LOG: other arguments', () => {
    test('LOG with extra words that are not a filter is rejected with usage', () => {
        const { engine } = makeEngine();
        const result = engine.execute('LOG ENGINEERING EXTRA');
        expect(result.blocks[0].type).toBe('error');
        expect(result.blocks[0].text).toContain('USAGE: LOG [ALL|SUBSYSTEM]');
    });
});
