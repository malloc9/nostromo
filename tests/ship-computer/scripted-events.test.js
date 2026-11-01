'use strict';

/**
 * Scripted automatic events: a predefined script of transitions that the store fires at
 * simulated times. Each one goes through the owner's own operations, so the log, the alerts,
 * the status and the printed notice all come from the same transition. No randomness.
 */

const ns = require('./load');
const { createShipStore, createManualClock, OwnershipError } = ns.shipState;

const START = Date.UTC(2122, 5, 2, 8, 0, 0);
const MINUTE = 60 * 1000;
const TRIGGER_MS = 2 * MINUTE;
const FAULT_MESSAGE = 'COOLING SYSTEM TEMPERATURE ABOVE NORMAL';

function setup(options = {}) {
    const clock = createManualClock(START);
    const store = createShipStore({ clock, ...options });
    return { clock, store };
}

/** Move the clock to `ms` after start and read the ship, as the screens do. */
function readAt(clock, store, ms) {
    clock.set(START + ms);
    store.tick();
    return store;
}

function faultRaisedEvents(store) {
    return store.events().filter((e) => e.message === `FAULT RAISED: ${FAULT_MESSAGE}`);
}

function coolingTemperature(store) {
    return store.snapshot('engineering').measurements.coolingTemperature;
}

describe('scripted events: the script', () => {
    test('the standard scenario has one cooling event at two minutes, described as data', () => {
        const { script } = ns.scenario.standardScenario();
        expect(script).toHaveLength(1);
        expect(script[0].at).toBe(TRIGGER_MS);
        script[0].changes.forEach((change) => {
            expect(typeof change.subsystem).toBe('string');
            expect(typeof change.operation).toBe('string');
        });
    });
});

describe('scripted events: firing', () => {
    test('nothing fires before its trigger time', () => {
        const { clock, store } = setup();
        readAt(clock, store, TRIGGER_MS - 1000);
        expect(faultRaisedEvents(store)).toHaveLength(0);
        expect(store.snapshot('engineering').faults).toHaveLength(0);
        expect(coolingTemperature(store)).toBeLessThan(80);
    });

    test('at the trigger time the temperature passes its threshold and the fault is raised', () => {
        const { clock, store } = setup();
        readAt(clock, store, TRIGGER_MS);
        expect(coolingTemperature(store)).toBeGreaterThanOrEqual(80);
        expect(store.snapshot('engineering').faults.map((f) => f.code)).toEqual(['COOLING-TEMP']);
        const [raised] = faultRaisedEvents(store);
        expect(raised.time).toBe(START + TRIGGER_MS);
        expect(raised.subsystem).toBe('engineering');
    });

    test('the consequences all come from the same transition: alert, status and cooling component', () => {
        const { clock, store } = setup();
        readAt(clock, store, TRIGGER_MS);
        const board = store.alerts();
        expect(board.overall).toBe('WARNING');
        expect(board.list.map((a) => a.id)).toContain('engineering:COOLING-TEMP');
        const alertEvent = store.events().find((e) => e.message === `ALERT RAISED: ${FAULT_MESSAGE}`);
        expect(alertEvent.time).toBe(START + TRIGGER_MS);
        const model = ns.engineeringModel.build(store.snapshot('engineering'));
        expect(model.overall).toBe('WARNING');
        expect(model.components.find((c) => c.key === 'coolingSystem').status).toBe('WARNING');
    });

    test('a subscriber hears one transition for the script, carrying the notice', () => {
        const { clock, store } = setup();
        const heard = [];
        store.subscribe((event) => heard.push(event));
        readAt(clock, store, TRIGGER_MS);
        const scripted = heard.filter((event) => event.notice);
        expect(scripted).toHaveLength(1);
        expect(scripted[0].time).toBe(START + TRIGGER_MS);
        expect(scripted[0].notice).toMatchObject({
            time: START + TRIGGER_MS,
            source: 'ENGINEERING',
            level: 'WARNING',
            headline: `${FAULT_MESSAGE}.`
        });
        const [temperature, threshold] = scripted[0].notice.values;
        expect(temperature.label).toBe('CURRENT TEMPERATURE');
        expect(temperature.value).toBeGreaterThanOrEqual(80);
        expect(temperature.unit).toBe('C');
        expect(threshold).toEqual({ label: 'WARNING THRESHOLD', value: 80, unit: 'C' });
    });

    test('operations outside the script carry no notice', () => {
        const { store } = setup();
        const heard = [];
        store.subscribe((event) => heard.push(event));
        store.operate('engineering', 'addFault', { code: 'R-7', message: 'TEST' }, 'engineering');
        expect(heard).toHaveLength(1);
        expect(heard[0].notice).toBeUndefined();
    });

    test('the event fires once however often the ship is read', () => {
        const { clock, store } = setup();
        const notices = [];
        store.subscribe((event) => { if (event.notice) notices.push(event.notice); });
        for (let ms = 0; ms <= 10 * MINUTE; ms += 1000) {
            readAt(clock, store, ms);
            store.snapshot('engineering');
            store.events();
        }
        expect(faultRaisedEvents(store)).toHaveLength(1);
        expect(notices).toHaveLength(1);
    });

    test('the same clock gives the same log, whether it is read every second or once at the end', () => {
        const stepped = setup();
        for (let ms = 0; ms <= 5 * MINUTE; ms += 1000) readAt(stepped.clock, stepped.store, ms);

        const jumped = setup();
        readAt(jumped.clock, jumped.store, 5 * MINUTE);

        expect(stepped.store.events()).toEqual(jumped.store.events());
        expect(stepped.store.snapshotAll()).toEqual(jumped.store.snapshotAll());
    });
});

describe('scripted events: a transition is all or nothing', () => {
    test('when a later change in the entry is refused, the earlier one is not committed', () => {
        const scenario = ns.scenario.standardScenario();
        scenario.script = [{
            at: TRIGGER_MS,
            changes: [
                { subsystem: 'engineering', operation: 'shiftMeasurement', args: { key: 'coolingTemperature', by: 30 } },
                { subsystem: 'engineering', operation: 'addFault', args: { code: 'BAD', message: 'BAD', component: 'noSuchPart', severity: 'WARNING' } }
            ],
            notice: { source: 'ENGINEERING', level: 'WARNING', headline: 'X.', values: [] }
        }];
        const { clock, store } = setup({ scenario });
        const before = coolingTemperature(store);
        clock.set(START + TRIGGER_MS);
        expect(() => store.tick()).toThrow(/unknown engineering component/);
        expect(coolingTemperature(store)).toBeCloseTo(before, 1);
        expect(store.snapshot('engineering').faults).toEqual([]);
        expect(store.events().filter((e) => e.subsystem === 'engineering')).toEqual([]);
    });
});

describe('scripted events: switching the script', () => {
    test('a script that is turned off never fires', () => {
        const { clock, store } = setup();
        expect(store.scripted()).toBe(true);
        store.setScripted(false);
        expect(store.scripted()).toBe(false);
        readAt(clock, store, TRIGGER_MS + MINUTE);
        expect(faultRaisedEvents(store)).toHaveLength(0);
        expect(coolingTemperature(store)).toBeLessThan(80);
    });

    test('entries whose time passed while the script was off are skipped, not postponed', () => {
        const { clock, store } = setup();
        store.setScripted(false);
        readAt(clock, store, TRIGGER_MS + MINUTE);
        store.setScripted(true);
        readAt(clock, store, TRIGGER_MS + 2 * MINUTE);
        expect(faultRaisedEvents(store)).toHaveLength(0);
    });

    test('turning the script on before its trigger lets it fire', () => {
        const { clock, store } = setup();
        store.setScripted(false);
        readAt(clock, store, TRIGGER_MS - MINUTE);
        store.setScripted(true);
        readAt(clock, store, TRIGGER_MS);
        expect(faultRaisedEvents(store)).toHaveLength(1);
    });
});

describe('scripted events: the shift operation', () => {
    test('only the owning subsystem can shift its own reading', () => {
        const { store } = setup();
        expect(() => store.operate('engineering', 'shiftMeasurement', { key: 'coolingTemperature', by: 5 }, 'lifeSupport'))
            .toThrow(OwnershipError);
    });

    test('an unknown reading is refused and changes nothing', () => {
        const { store } = setup();
        const before = store.version();
        expect(() => store.operate('engineering', 'shiftMeasurement', { key: 'noSuchReading', by: 5 }, 'engineering'))
            .toThrow(/no measurement/);
        expect(store.version()).toBe(before);
    });

    test('a shift moves the reading and writes no event of its own', () => {
        const { store } = setup();
        const before = coolingTemperature(store);
        const events = store.events().length;
        store.operate('engineering', 'shiftMeasurement', { key: 'coolingTemperature', by: 5 }, 'engineering');
        expect(coolingTemperature(store)).toBeCloseTo(before + 5, 1);
        expect(store.events()).toHaveLength(events);
    });
});

describe('scripted events: the printed notice', () => {
    const notice = {
        time: START + TRIGGER_MS,
        source: 'ENGINEERING',
        level: 'WARNING',
        headline: `${FAULT_MESSAGE}.`,
        values: [
            { label: 'CURRENT TEMPERATURE', value: 87.2, unit: 'C' },
            { label: 'WARNING THRESHOLD', value: 80, unit: 'C' }
        ]
    };

    test('the first line gives the time, source and level', () => {
        const blocks = ns.scriptedEvents.noticeBlocks(notice);
        expect(blocks[0].text).toBe(`[${ns.util.formatClock(notice.time)}] ENGINEERING WARNING`);
    });

    test('the notice follows the plan: headline, current value, then threshold', () => {
        const lines = ns.scriptedEvents.noticeBlocks(notice).map((b) => b.text);
        expect(lines.slice(1)).toEqual([
            `${FAULT_MESSAGE}.`,
            'CURRENT TEMPERATURE: 87.2 C',
            'WARNING THRESHOLD: 80.0 C'
        ]);
    });

    test('every line is in the warning style', () => {
        const blocks = ns.scriptedEvents.noticeBlocks(notice);
        expect(blocks.every((b) => b.type === 'warning')).toBe(true);
    });
});
