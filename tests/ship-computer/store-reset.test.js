'use strict';

/**
 * Reset of the store to its initial state at a moment: every subsystem, the event log and the
 * alerts start again, and the script starts again from its first entry. Subscribers hear it once.
 */

const ns = require('./load');
const { createShipStore, createManualClock } = ns.shipState;

const START = Date.UTC(2122, 5, 2, 8, 0, 0);
const MINUTE = 60 * 1000;

function faultRaised(store) {
    return store.events().filter((e) => e.message === 'FAULT RAISED: COOLING SYSTEM TEMPERATURE ABOVE NORMAL');
}

describe('store reset', () => {
    test('after a reset the ship is the same as a new one started at that moment', () => {
        const clock = createManualClock(START);
        const store = createShipStore({ clock });
        clock.set(START + 5 * MINUTE);
        store.operate('engineering', 'addFault', { code: 'R-1', message: 'TEST FAULT', component: 'mainReactor', severity: 'WARNING' }, 'engineering');
        store.tick();

        store.reset();
        const fresh = createShipStore({ clock: createManualClock(START + 5 * MINUTE) });
        expect(store.snapshotAll()).toEqual(fresh.snapshotAll());
        expect(store.events()).toEqual(fresh.events());
        expect(store.alerts()).toEqual(fresh.alerts());
        expect(store.version()).toBe(0);
    });

    test('the event log is cleared, not kept', () => {
        const clock = createManualClock(START);
        const store = createShipStore({ clock });
        clock.set(START + 5 * MINUTE);
        store.tick();
        expect(faultRaised(store)).toHaveLength(1);
        store.reset();
        expect(faultRaised(store)).toHaveLength(0);
    });

    test('the script starts again from its first entry, two minutes after the reset', () => {
        const clock = createManualClock(START);
        const store = createShipStore({ clock });
        clock.set(START + 5 * MINUTE);
        store.tick();
        store.reset();
        clock.set(START + 5 * MINUTE + 2 * MINUTE);
        store.tick();
        expect(faultRaised(store)).toHaveLength(1);
        expect(faultRaised(store)[0].time).toBe(START + 7 * MINUTE);
    });

    test('a script that was switched off stays off after a reset', () => {
        const clock = createManualClock(START);
        const store = createShipStore({ clock });
        store.setScripted(false);
        store.reset();
        clock.set(START + 5 * MINUTE);
        store.tick();
        expect(store.scripted()).toBe(false);
        expect(faultRaised(store)).toHaveLength(0);
    });

    test('subscribers hear the reset once', () => {
        const clock = createManualClock(START);
        const store = createShipStore({ clock });
        const heard = [];
        store.subscribe((event) => heard.push(event));
        store.reset();
        expect(heard).toHaveLength(1);
        expect(heard[0]).toMatchObject({ operation: 'reset', version: 0 });
    });

    test('the start time moves to the reset, so the readings start from their initial values', () => {
        const clock = createManualClock(START);
        const store = createShipStore({ clock });
        clock.set(START + 3 * 60 * MINUTE);
        store.reset();
        expect(store.startedAt).toBe(START + 3 * 60 * MINUTE);
    });
});
