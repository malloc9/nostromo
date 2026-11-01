'use strict';

/**
 * Saving and restoring the ship store. A restored store must carry on exactly as the original
 * would: same state, log and alerts, and the same later events, with no scripted event repeated.
 */

const ns = require('./load');
const { createShipStore, createManualClock } = ns.shipState;
const persistence = ns.persistence;

const START = Date.UTC(2122, 5, 2, 8, 0, 0);
const MINUTE = 60 * 1000;
const TRIGGER_MS = 2 * MINUTE;

/** Save to text and read it back, as the browser does. */
function saved(store) {
    return persistence.readSave(persistence.encodeSave(store.exportState())).payload;
}

/** A store restored from a save, on a clock already at `ms` after the original start. */
function restoredAt(state, ms) {
    const clock = createManualClock(START + ms);
    return { clock, store: createShipStore({ clock, restore: state }) };
}

function faultRaised(store) {
    return store.events().filter((e) => e.message === 'FAULT RAISED: COOLING SYSTEM TEMPERATURE ABOVE NORMAL');
}

describe('store restore: the same state', () => {
    test('a save taken after a change restores the same state, log, alerts and version', () => {
        const clock = createManualClock(START);
        const original = createShipStore({ clock });
        clock.set(START + 5 * MINUTE);
        original.operate('engineering', 'addFault', { code: 'R-1', message: 'TEST FAULT', component: 'mainReactor', severity: 'WARNING' }, 'engineering');
        original.tick();

        const { store } = restoredAt(saved(original), 5 * MINUTE);
        expect(store.snapshotAll()).toEqual(original.snapshotAll());
        expect(store.events()).toEqual(original.events());
        expect(store.alerts()).toEqual(original.alerts());
        expect(store.version()).toBe(original.version());
    });

    test('exporting a state changes nothing', () => {
        const clock = createManualClock(START);
        const store = createShipStore({ clock });
        clock.set(START + MINUTE);
        const first = store.exportState();
        const second = store.exportState();
        expect(second).toEqual(first);
    });
});

describe('store restore: carrying on', () => {
    test('a restored store and the original give the same events from then on', () => {
        const clock = createManualClock(START);
        const original = createShipStore({ clock });
        clock.set(START + MINUTE);
        original.tick();
        const { clock: restoredClock, store: restored } = restoredAt(saved(original), MINUTE);

        for (let ms = MINUTE; ms <= 10 * MINUTE; ms += 1000) {
            clock.set(START + ms);
            restoredClock.set(START + ms);
            original.tick();
            restored.tick();
        }
        expect(restored.events()).toEqual(original.events());
        expect(restored.snapshotAll()).toEqual(original.snapshotAll());
    });

    test('a scripted event that has not fired before the save fires once after the restore', () => {
        const clock = createManualClock(START);
        const original = createShipStore({ clock });
        clock.set(START + MINUTE);
        original.tick();
        const { clock: restoredClock, store: restored } = restoredAt(saved(original), MINUTE);

        restoredClock.set(START + TRIGGER_MS);
        restored.tick();
        expect(faultRaised(restored)).toHaveLength(1);
        expect(faultRaised(restored)[0].time).toBe(START + TRIGGER_MS);
    });

    test('a scripted event that fired before the save is not fired again after the restore', () => {
        const clock = createManualClock(START);
        const original = createShipStore({ clock });
        clock.set(START + 5 * MINUTE);
        original.tick();
        expect(faultRaised(original)).toHaveLength(1);

        const { clock: restoredClock, store: restored } = restoredAt(saved(original), 5 * MINUTE);
        restoredClock.set(START + 10 * MINUTE);
        restored.tick();
        expect(faultRaised(restored)).toHaveLength(1);
    });

    test('a restored store keeps the script switched off if it was saved that way', () => {
        const clock = createManualClock(START);
        const original = createShipStore({ clock, scripted: false });
        const { clock: restoredClock, store: restored } = restoredAt(saved(original), 0);
        restoredClock.set(START + 5 * MINUTE);
        restored.tick();
        expect(restored.scripted()).toBe(false);
        expect(faultRaised(restored)).toHaveLength(0);
    });
});

describe('store restore: refusing what does not fit', () => {
    function goodSave() {
        return saved(createShipStore({ clock: createManualClock(START) }));
    }

    test('a save for a different set of subsystems is refused', () => {
        const state = goodSave();
        delete state.subsystems.crew;
        expect(() => createShipStore({ clock: createManualClock(START), restore: state }))
            .toThrow(/does not match this computer/);
    });

    test('a save with a script position that the script does not have is refused', () => {
        const state = goodSave();
        state.scriptNext = 99;
        expect(() => createShipStore({ clock: createManualClock(START), restore: state }))
            .toThrow(/does not match this computer/);
    });

    test('a save with a start time that is not a number is refused', () => {
        const state = goodSave();
        state.startedAt = 'yesterday';
        expect(() => createShipStore({ clock: createManualClock(START), restore: state }))
            .toThrow(/does not match this computer/);
    });
});

describe('store restore: times and readings must be plausible', () => {
    test('a save that starts after the clock is refused', () => {
        const state = saved(createShipStore({ clock: createManualClock(START + MINUTE) }));
        expect(() => createShipStore({ clock: createManualClock(START), restore: state }))
            .toThrow(/does not match this computer: start time/);
    });

    test('a save that has been sampled after the clock is refused', () => {
        const state = saved(createShipStore({ clock: createManualClock(START + MINUTE) }));
        state.startedAt = START;
        state.sampledUpTo = START + 2 * MINUTE;
        expect(() => createShipStore({ clock: createManualClock(START + MINUTE), restore: state }))
            .toThrow(/does not match this computer: sample position/);
    });

    test('a reading with no usable base is refused rather than shown as NaN', () => {
        const state = saved(createShipStore({ clock: createManualClock(START) }));
        state.subsystems.engineering.measurements.coolingTemperature.base = 'hot';
        expect(() => createShipStore({ clock: createManualClock(START), restore: state }))
            .toThrow(/readings of engineering/);
    });
});
