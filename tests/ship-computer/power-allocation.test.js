'use strict';

/**
 * ENGINEERING POWER ALLOCATION: commander only, validated before any question, a safety threshold
 * for life support, confirm and cancel, and the alert that a warning-level allocation raises.
 */

const ns = require('./load');
const { createShipStore, createManualClock } = ns.shipState;

const START = Date.UTC(2122, 5, 2, 8, 0, 0);

function setup(level = 'COMMANDER') {
    const session = ns.privilege.createSession({ level });
    const clock = createManualClock(START);
    const store = createShipStore({ clock });
    const registry = ns.registry.createRegistry();
    ns.systemCommands.register(registry);
    ns.powerAllocationCommands.register(registry, store, session);
    ns.engineeringCommands.register(registry, store);
    const engine = ns.engine.createEngine({
        registry,
        authorize: (required) => ns.privilege.authorize(session, required)
    });
    return { store, engine, session, registry };
}

const textOf = (result) => result.blocks.map((b) => {
    if (b.type === 'table') return b.rows.map((r) => r.join(' ')).join('\n');
    if (b.type === 'authorization') return `ACCESS RESTRICTED. REQUIRED PRIVILEGE: ${b.required} CURRENT PRIVILEGE: ${b.current}`;
    return b.text || '';
}).join('\n');

const allocation = (store) => store.snapshot('engineering').state.allocation;
const total = (store) => Object.values(allocation(store)).reduce((a, b) => a + b, 0);

describe('allocation: privilege and syntax', () => {
    test('below commander the command is refused before any question is shown', () => {
        const { engine } = setup('OFFICER');
        const result = engine.execute('ENGINEERING POWER ALLOCATION NAVIGATION 30 FROM ENGINES');
        expect(result.status).toBe('denied');
        expect(engine.pending()).toBeNull();
    });

    test('a missing FROM is refused with the usage form', () => {
        const { engine } = setup();
        const result = engine.execute('ENGINEERING POWER ALLOCATION NAVIGATION 30');
        expect(result.status).toBe('error');
        expect(textOf(result)).toContain('USAGE: ENGINEERING POWER ALLOCATION [SUBSYSTEM] [PERCENT] FROM [SUBSYSTEM]');
        expect(engine.pending()).toBeNull();
    });

    test('a percentage that is not a whole number is refused', () => {
        const { engine } = setup();
        const result = engine.execute('ENGINEERING POWER ALLOCATION NAVIGATION TWENTY FROM ENGINES');
        expect(result.status).toBe('error');
        expect(textOf(result)).toContain('PERCENT MUST BE A WHOLE NUMBER.');
    });

    test('an unknown subsystem is refused, with no question', () => {
        const { engine } = setup();
        const result = engine.execute('ENGINEERING POWER ALLOCATION GALLEY 30 FROM ENGINES');
        expect(result.status).toBe('error');
        expect(textOf(result)).toContain('UNKNOWN SUBSYSTEM: GALLEY.');
        expect(engine.pending()).toBeNull();
    });

    test('the same subsystem as target and donor is refused', () => {
        const { engine } = setup();
        const result = engine.execute('ENGINEERING POWER ALLOCATION NAVIGATION 30 FROM NAVIGATION');
        expect(textOf(result)).toContain('TARGET AND DONOR MUST DIFFER.');
    });
});

describe('allocation: validation and the safety threshold', () => {
    test('life support cannot be reduced below the safety threshold, and nothing is asked', () => {
        const { engine, store } = setup();
        const result = engine.execute('ENGINEERING POWER ALLOCATION ENGINES 40 FROM LIFE SUPPORT');
        expect(result.status).toBe('error');
        expect(textOf(result)).toContain('LIFE SUPPORT CANNOT FALL BELOW 30%');
        expect(engine.pending()).toBeNull();
        expect(allocation(store).lifeSupport).toBe(35);
    });

    test('a subsystem outside its allowed range is refused', () => {
        const { engine } = setup();
        const result = engine.execute('ENGINEERING POWER ALLOCATION NAVIGATION 2 FROM ENGINES');
        expect(textOf(result)).toContain('NAVIGATION MUST STAY BETWEEN 5% AND 60%.');
    });

    test('the store refuses the same reductions, so the rule holds without the command', () => {
        const { store } = setup();
        expect(() => store.operate('engineering', 'setAllocation', { target: 'engines', donor: 'lifeSupport', percent: 40 }, 'engineering'))
            .toThrow(/LIFE SUPPORT CANNOT FALL BELOW 30%/);
        expect(allocation(store).lifeSupport).toBe(35);
    });
});

describe('allocation: confirm and cancel', () => {
    test('a valid request shows the before and after, and changes nothing until Y', () => {
        const { store, engine } = setup();
        const result = engine.execute('ENGINEERING POWER ALLOCATION NAVIGATION 30 FROM ENGINES');
        expect(result.status).toBe('pending');
        const text = textOf(result);
        expect(text).toContain('POWER ALLOCATION REQUESTED.');
        expect(text).toContain('CONFIRM ALLOCATION CHANGE? Y/N');
        expect(allocation(store).navigation).toBe(25);
        expect(store.events()).toEqual([]);
    });

    test('Y applies the change: the total stays 100, the event is logged, and the answer states the change', () => {
        const { store, engine } = setup();
        engine.execute('ENGINEERING POWER ALLOCATION NAVIGATION 30 FROM ENGINES');
        const answer = engine.execute('Y');
        expect(answer.status).toBe('ok');
        expect(allocation(store).navigation).toBe(30);
        expect(allocation(store).engines).toBe(15);
        expect(total(store)).toBe(100);
        expect(store.events().map((e) => e.message)).toEqual(['POWER ALLOCATION: NAVIGATION 25% TO 30%, FROM ENGINES']);
        expect(textOf(answer)).toContain('POWER ALLOCATION CHANGED.');
    });

    test('N cancels: nothing changes, and the answer says so', () => {
        const { store, engine } = setup();
        engine.execute('ENGINEERING POWER ALLOCATION NAVIGATION 30 FROM ENGINES');
        const answer = engine.execute('N');
        expect(answer.status).toBe('cancelled');
        expect(allocation(store).navigation).toBe(25);
        expect(store.events()).toEqual([]);
        expect(textOf(answer)).toContain('POWER ALLOCATION CANCELLED. ALLOCATION UNCHANGED.');
    });
});

describe('allocation: consequences', () => {
    test('a change that puts a subsystem below its warning level raises the alert and the header count together', () => {
        const { store, engine } = setup();
        engine.execute('ENGINEERING POWER ALLOCATION NAVIGATION 12 FROM ENGINES');
        expect(store.alerts().list).toEqual([]);
        engine.execute('Y');
        expect(store.alerts().list.map((a) => a.id)).toEqual(['POWER_NAVIGATION']);
        expect(store.events().map((e) => e.message)).toEqual(expect.arrayContaining([
            'POWER ALLOCATION: NAVIGATION 25% TO 12%, FROM ENGINES',
            'ALERT RAISED: NAVIGATION POWER LOW: 12%'
        ]));
    });

    test('the question warns before the change when the target would be below its safe level', () => {
        const { engine } = setup();
        const result = engine.execute('ENGINEERING POWER ALLOCATION NAVIGATION 12 FROM ENGINES');
        expect(textOf(result)).toContain('WARNING: NAVIGATION WILL BE BELOW ITS SAFE LEVEL (15%).');
    });

    test('the POWER report shows the allocation, so the terminal reflects the change', () => {
        const { engine } = setup();
        engine.execute('ENGINEERING POWER ALLOCATION NAVIGATION 30 FROM ENGINES');
        engine.execute('Y');
        expect(textOf(engine.execute('ENGINEERING POWER'))).toContain('NAVIGATION');
        expect(textOf(engine.execute('ENGINEERING POWER'))).toContain('30%');
    });
});
