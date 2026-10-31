'use strict';

/**
 * Event log and alert transitions, driven through the store.
 */

const ns = require('./load');
const { createShipStore, createManualClock } = ns.shipState;

const START = Date.UTC(2122, 5, 2, 8, 0, 0);

function storeWithClock() {
    const clock = createManualClock(START);
    return { clock, store: createShipStore({ clock }) };
}

describe('event log: creation', () => {
    test('a fault change writes exactly one change event stamped with the simulation time', () => {
        const { clock, store } = storeWithClock();
        clock.advance(5000);
        store.operate('engineering', 'addFault', { code: 'R-7', message: 'REACTOR COOLANT' }, 'engineering');
        // The alert it raises is a separate event from the same subsystem.
        const events = store.events().filter((e) => e.message.startsWith('FAULT'));
        expect(events).toHaveLength(1);
        expect(events[0]).toMatchObject({
            id: 1,
            time: START + 5000,
            type: 'warning',
            subsystem: 'engineering',
            severity: 'WARNING',
            message: 'FAULT RAISED: REACTOR COOLANT'
        });
    });

    test('a critical fault is an error event', () => {
        const { store } = storeWithClock();
        store.operate('lifeSupport', 'addFault', { code: 'O2-LOW', severity: 'CRITICAL' }, 'lifeSupport');
        const [event] = store.events();
        expect(event).toMatchObject({ type: 'error', severity: 'CRITICAL' });
    });

    test('an operation with no event description writes no change event', () => {
        const { store } = storeWithClock();
        const before = store.events().length;
        store.operate('crew', 'setStatus', { status: 'NOMINAL' }, 'crew');
        expect(store.events().filter((e) => e.subsystem === 'crew')).toHaveLength(1);
        expect(store.events().length).toBe(before + 1);
    });

    test('a failed operation writes no event', () => {
        const { store } = storeWithClock();
        const before = store.events().length;
        expect(() => store.operate('engineering', 'clearFault', { code: 'NOPE' }, 'engineering')).toThrow();
        expect(store.events()).toHaveLength(before);
    });

    test('a rejected write from another subsystem writes no event', () => {
        const { store } = storeWithClock();
        const before = store.events().length;
        expect(() => store.operate('engineering', 'addFault', { code: 'X' }, 'crew')).toThrow();
        expect(store.events()).toHaveLength(before);
    });
});

describe('event log: append-only', () => {
    test('event ids count up from one and entries are never removed', () => {
        const { store } = storeWithClock();
        store.operate('engineering', 'addFault', { code: 'A' }, 'engineering');
        store.operate('engineering', 'clearFault', { code: 'A' }, 'engineering');
        // Raise change, raise alert, clear change, clear alert.
        expect(store.events().map((e) => e.id)).toEqual([1, 2, 3, 4]);
    });

    test('the log cannot be edited through a read', () => {
        const { store } = storeWithClock();
        store.operate('engineering', 'addFault', { code: 'A' }, 'engineering');
        const entries = store.events();
        expect(() => { entries[0].message = 'REWRITTEN'; }).toThrow();
        expect(() => { entries.length = 0; }).toThrow();
        expect(store.events()[0].message).toBe('FAULT RAISED: A');
    });

    test('the store offers no way to remove or edit an entry', () => {
        const { store } = storeWithClock();
        expect(store.remove).toBeUndefined();
        expect(store.edit).toBeUndefined();
        expect(store.operations).not.toContain('removeEvent');
    });
});

describe('alerts: transitions are logged', () => {
    test('creating and resolving a fault adds and removes the alert and logs both transitions', () => {
        const { store } = storeWithClock();
        expect(store.alerts().list).toEqual([]);

        store.operate('engineering', 'addFault', { code: 'R-7', message: 'REACTOR COOLANT', severity: 'CRITICAL' }, 'engineering');
        expect(store.alerts().list.map((a) => a.id)).toEqual(['engineering:R-7']);
        expect(store.alerts().overall).toBe('CRITICAL');

        store.operate('engineering', 'clearFault', { code: 'R-7' }, 'engineering');
        expect(store.alerts().list).toEqual([]);
        expect(store.alerts().overall).toBe('OPERATIONAL');

        const messages = store.events().map((e) => e.message);
        expect(messages).toEqual([
            'FAULT RAISED: REACTOR COOLANT',
            'ALERT RAISED: REACTOR COOLANT',
            'FAULT CLEARED: REACTOR COOLANT',
            'ALERT CLEARED: REACTOR COOLANT'
        ]);
    });

    test('an alert is raised once, not on every later change', () => {
        const { store } = storeWithClock();
        store.operate('engineering', 'addFault', { code: 'R-7', message: 'X' }, 'engineering');
        store.operate('crew', 'setStatus', { status: 'NOMINAL' }, 'crew');
        store.operate('crew', 'setStatus', { status: 'NOMINAL' }, 'crew');
        const raised = store.events().filter((e) => e.message.startsWith('ALERT RAISED'));
        expect(raised).toHaveLength(1);
    });

    test('a threshold alert is raised by tick when the reading crosses the line', () => {
        // Two active humans become resting, leaving four active: below the crew threshold.
        const scenario = ns.scenario.standardScenario();
        scenario.subsystems.crew.fields.members.forEach((m) => {
            if (m.name === 'ASH' || m.name === 'PARKER') m.status = 'resting';
        });
        const store = createShipStore({ clock: createManualClock(START), scenario });
        expect(store.alerts().list.map((a) => a.id)).toEqual(['CREW_ACTIVE']);
        store.tick();
        expect(store.events().map((e) => e.message))
            .toEqual(['ALERT RAISED: CREW STATUS: FEWER THAN 5 CREW ACTIVE']);
    });

    test('tick does not repeat a transition it has already logged', () => {
        const { store } = storeWithClock();
        store.operate('engineering', 'addFault', { code: 'R-7', message: 'X' }, 'engineering');
        const before = store.events().length;
        store.tick();
        store.tick();
        expect(store.events()).toHaveLength(before);
    });
});

describe('alerts: the board', () => {
    test('overall is WARNING when only warnings are active, and CRITICAL when any is critical', () => {
        const { store } = storeWithClock();
        store.operate('crew', 'addFault', { code: 'MED-1', message: 'CHECK' }, 'crew');
        expect(store.alerts().overall).toBe('WARNING');
        store.operate('lifeSupport', 'addFault', { code: 'O2', severity: 'CRITICAL' }, 'lifeSupport');
        expect(store.alerts().overall).toBe('CRITICAL');
    });

    test('the alert count is the length of the list the header and Dashboard both read', () => {
        const { store } = storeWithClock();
        store.operate('crew', 'addFault', { code: 'A' }, 'crew');
        store.operate('cargo', 'addFault', { code: 'B' }, 'cargo');
        expect(store.alerts().list).toHaveLength(2);
    });

    test('the board is read-only', () => {
        const { store } = storeWithClock();
        store.operate('crew', 'addFault', { code: 'A' }, 'crew');
        const board = store.alerts();
        expect(() => { board.list.push({}); }).toThrow();
    });
});
