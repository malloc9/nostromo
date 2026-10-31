'use strict';

/**
 * The engineering model: what the store says about reactor, engines, cooling and power,
 * read by the ENGINEERING and STATUS commands and by the panels.
 */

const ns = require('./load');
const { createShipStore, createManualClock } = ns.shipState;

const START = Date.UTC(2122, 5, 2, 8, 0, 0);
const storeAt = () => createShipStore({ clock: createManualClock(START) });
const model = (store) => ns.engineeringModel.build(store.snapshot('engineering'));
const statusOf = (m, key) => m.components.find((c) => c.key === key).status;

describe('engineering model: nominal ship', () => {
    test('every component is nominal and the overall status is nominal', () => {
        const m = model(storeAt());
        expect(m.components.map((c) => c.label)).toEqual([
            'MAIN REACTOR', 'PRIMARY ENGINE', 'SECONDARY ENGINE', 'COOLING SYSTEM', 'POWER DISTRIBUTION'
        ]);
        m.components.forEach((c) => expect(c.status).toBe('NOMINAL'));
        expect(m.overall).toBe('NOMINAL');
        expect(m.faults).toEqual([]);
    });

    test('power output and fuel come from the same readings the screens show', () => {
        const store = storeAt();
        const m = model(store);
        const measurements = store.snapshot('engineering').measurements;
        expect(m.powerOutput).toBe(measurements.powerGeneration);
        expect(m.fuelReserve).toBe(measurements.fuelReserve);
    });
});

describe('engineering model: faults', () => {
    test('a warning on the reactor shows as that component\'s status and as the overall status', () => {
        const store = storeAt();
        store.operate('engineering', 'addFault', { code: 'R-7', message: 'REACTOR TEMP HIGH', component: 'mainReactor', severity: 'WARNING' }, 'engineering');
        const m = model(store);
        expect(statusOf(m, 'mainReactor')).toBe('WARNING');
        expect(statusOf(m, 'primaryEngine')).toBe('NOMINAL');
        expect(m.overall).toBe('WARNING');
        expect(m.faults.map((f) => f.code)).toEqual(['R-7']);
    });

    test('a critical fault makes the component and the overall status critical', () => {
        const store = storeAt();
        store.operate('engineering', 'addFault', { code: 'C-1', component: 'coolingSystem', severity: 'CRITICAL' }, 'engineering');
        const m = model(store);
        expect(statusOf(m, 'coolingSystem')).toBe('CRITICAL');
        expect(m.overall).toBe('CRITICAL');
    });

    test('a fault with no component still makes the overall status a warning', () => {
        const store = storeAt();
        store.operate('engineering', 'addFault', { code: 'X-1' }, 'engineering');
        const m = model(store);
        m.components.forEach((c) => expect(c.status).toBe('NOMINAL'));
        expect(m.overall).toBe('WARNING');
    });

    test('a misspelled component is refused and records nothing', () => {
        const store = storeAt();
        expect(() => store.operate('engineering', 'addFault', { code: 'R-7', component: 'mainRector' }, 'engineering'))
            .toThrow(/unknown engineering component: mainRector/);
        expect(store.snapshot('engineering').faults).toEqual([]);
        expect(store.events()).toEqual([]);
    });

    test('resolving the fault returns every value to nominal', () => {
        const store = storeAt();
        store.operate('engineering', 'addFault', { code: 'R-7', component: 'mainReactor', severity: 'CRITICAL' }, 'engineering');
        store.operate('engineering', 'clearFault', { code: 'R-7' }, 'engineering');
        const m = model(store);
        expect(statusOf(m, 'mainReactor')).toBe('NOMINAL');
        expect(m.overall).toBe('NOMINAL');
        expect(m.faults).toEqual([]);
    });
});
