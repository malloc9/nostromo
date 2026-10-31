'use strict';

/**
 * Ship state store: determinism, clock injection, ownership, subscriptions,
 * read-only snapshots and the drift bound. No DOM.
 */

const ns = require('./load');
const { createShipStore, createManualClock, OwnershipError } = ns.shipState;

const HOUR = 60 * 60 * 1000;
const START = Date.UTC(2122, 5, 2, 8, 0, 0);

function storeAt(startMs = START) {
    return createShipStore({ clock: createManualClock(startMs) });
}

describe('ship state: determinism and clock', () => {
    test('the same initial state and clock give identical state', () => {
        const a = storeAt();
        const b = storeAt();
        expect(a.snapshotAll()).toEqual(b.snapshotAll());
    });

    test('identical operation sequences on identical clocks give identical state', () => {
        const run = () => {
            const clock = createManualClock(START);
            const store = createShipStore({ clock });
            clock.advance(3 * HOUR);
            store.operate('engineering', 'addFault', { code: 'R-7', message: 'TEST' }, 'engineering');
            clock.advance(5 * HOUR);
            return store.snapshotAll();
        };
        expect(run()).toEqual(run());
    });

    test('an injected clock drives every reading; advancing it changes the values', () => {
        const clock = createManualClock(START);
        const store = createShipStore({ clock });
        const before = store.snapshot('lifeSupport').measurements.oxygen;
        clock.advance(7 * 1000);
        const after = store.snapshot('lifeSupport').measurements.oxygen;
        expect(after).not.toBe(before);
    });

    test('two readers asking at the same simulated time get the identical number', () => {
        const clock = createManualClock(START + 42 * 1000);
        const first = createShipStore({ clock });
        const second = createShipStore({ clock });
        const readerA = first.snapshot('lifeSupport').measurements.temperature;
        const readerB = second.snapshot('lifeSupport').measurements.temperature;
        expect(readerA).toBe(readerB);
    });

    test('fuel falls by the documented decay rate over elapsed simulated time', () => {
        const clock = createManualClock(START);
        const store = createShipStore({ clock });
        const start = store.snapshot('engineering').measurements.fuelReserve;
        clock.advance(24 * HOUR);
        const later = store.snapshot('engineering').measurements.fuelReserve;
        expect(start - later).toBeCloseTo(0.24, 5);
    });

    test('the state carries a data version from day one', () => {
        expect(storeAt().dataVersion).toBe(1);
    });
});

describe('ship state: subsystems', () => {
    test('every subsystem in the plan is present with its full shape', () => {
        const store = storeAt();
        const names = ['identity', 'mission', 'navigation', 'engineering', 'lifeSupport',
            'crew', 'cargo', 'communications', 'security', 'alerts', 'eventLog'];
        names.forEach((name) => {
            const snap = store.snapshot(name);
            expect(snap.name).toBe(name);
            expect(typeof snap.status).toBe('string');
            expect(snap.state).toBeDefined();
            expect(snap.measurements).toBeDefined();
            expect(typeof snap.lastUpdated).toBe('number');
            expect(Array.isArray(snap.faults)).toBe(true);
            expect(snap.operations).toEqual(expect.arrayContaining(['addFault', 'clearFault', 'setStatus']));
        });
    });

    test('reading an unknown subsystem is an error', () => {
        expect(() => storeAt().snapshot('galley')).toThrow(/unknown subsystem/);
    });
});

describe('ship state: ownership', () => {
    test('another subsystem cannot change a subsystem\'s data', () => {
        const store = storeAt();
        const before = store.snapshot('engineering');
        expect(() => store.operate('engineering', 'addFault', { code: 'X' }, 'lifeSupport'))
            .toThrow(OwnershipError);
        expect(store.snapshot('engineering')).toEqual(before);
    });

    test('a rejected write is not announced to subscribers', () => {
        const store = storeAt();
        const listener = jest.fn();
        store.subscribe(listener);
        expect(() => store.operate('engineering', 'addFault', { code: 'X' }, 'crew')).toThrow();
        expect(listener).not.toHaveBeenCalled();
    });

    test('the owner can change its own data', () => {
        const store = storeAt();
        store.operate('lifeSupport', 'addFault', { code: 'O2-LOW' }, 'lifeSupport');
        expect(store.snapshot('lifeSupport').faults.map((f) => f.code)).toEqual(['O2-LOW']);
    });

    test('snapshots are read-only, so readers cannot write through them', () => {
        const snap = storeAt().snapshot('navigation');
        expect(() => { snap.state.destination = 'ELSEWHERE'; }).toThrow();
        expect(() => { snap.faults.push({ code: 'X' }); }).toThrow();
    });
});

describe('ship state: operations', () => {
    test('a fault changes the status and is listed; clearing it restores the status', () => {
        const store = storeAt();
        store.operate('engineering', 'addFault', { code: 'R-7', message: 'REACTOR' }, 'engineering');
        expect(store.snapshot('engineering').status).toBe('WARNING');
        store.operate('engineering', 'clearFault', { code: 'R-7' }, 'engineering');
        expect(store.snapshot('engineering').status).toBe('NOMINAL');
    });

    test('an operation that fails leaves the state exactly as it was', () => {
        const store = storeAt();
        const before = store.snapshotAll();
        expect(() => store.operate('engineering', 'clearFault', { code: 'NOPE' }, 'engineering'))
            .toThrow();
        expect(store.snapshotAll()).toEqual(before);
    });

    test('an unknown operation is refused', () => {
        expect(() => storeAt().operate('engineering', 'selfDestruct', {}, 'engineering'))
            .toThrow(/unknown operation/);
    });
});

describe('ship state: subscribers', () => {
    test('a subscriber is told once per change, with the subsystem and operation', () => {
        const store = storeAt();
        const listener = jest.fn();
        store.subscribe(listener);
        store.operate('crew', 'setStatus', { status: 'NOMINAL' }, 'crew');
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener.mock.calls[0][0]).toMatchObject({ subsystem: 'crew', operation: 'setStatus' });
    });

    test('a subscriber that throws does not stop the others or fail the committed change', () => {
        const store = storeAt();
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const later = jest.fn();
        store.subscribe(() => { throw new Error('bad subscriber'); });
        store.subscribe(later);
        expect(() => store.operate('crew', 'setStatus', { status: 'NOMINAL' }, 'crew')).not.toThrow();
        expect(later).toHaveBeenCalledTimes(1);
        expect(store.version()).toBe(1);
        spy.mockRestore();
    });

    test('reading the state does not notify anyone', () => {
        const store = storeAt();
        const listener = jest.fn();
        store.subscribe(listener);
        store.snapshotAll();
        store.snapshot('engineering');
        expect(listener).not.toHaveBeenCalled();
    });

    test('unsubscribing stops further notifications', () => {
        const store = storeAt();
        const listener = jest.fn();
        const unsubscribe = store.subscribe(listener);
        unsubscribe();
        store.operate('crew', 'setStatus', { status: 'NOMINAL' }, 'crew');
        expect(listener).not.toHaveBeenCalled();
    });
});

describe('ship state: drift bound', () => {
    test('measurements stay inside their documented range over ten simulated days', () => {
        const clock = createManualClock(START);
        const store = createShipStore({ clock });
        for (let h = 0; h < 24 * 10; h++) {
            clock.advance(HOUR);
            const lifeSupport = store.snapshot('lifeSupport').measurements;
            expect(lifeSupport.oxygen).toBeGreaterThanOrEqual(0);
            expect(lifeSupport.oxygen).toBeLessThanOrEqual(100);
            expect(lifeSupport.pressure).toBeGreaterThanOrEqual(81.06);
            expect(lifeSupport.pressure).toBeLessThanOrEqual(121.59);
            expect(lifeSupport.temperature).toBeGreaterThanOrEqual(18);
            expect(lifeSupport.temperature).toBeLessThanOrEqual(24);
        }
    });
});
