'use strict';

/**
 * State consistency: one change to the ship, read through every surface that shows it. The
 * terminal reports, the alert board and header count, the Dashboard event indicator and the event
 * log must all agree at the same simulated time, before and after the change, and after it clears.
 */

const ns = require('./load');
const { createShipStore, createManualClock } = ns.shipState;

const START = Date.UTC(2122, 5, 2, 8, 0, 0);
const MINUTE = 60 * 1000;

function setup(options = {}) {
    const session = ns.privilege.createSession({ level: 'COMMANDER' });
    const clock = createManualClock(START);
    const store = createShipStore({ clock, ...options });
    const registry = ns.registry.createRegistry();
    ns.systemCommands.register(registry);
    ns.statusCommands.register(registry, store);
    ns.engineeringCommands.register(registry, store);
    ns.logCommands.register(registry, store);
    ns.reportCommands.register(registry, store, session);
    const engine = ns.engine.createEngine({
        registry,
        authorize: (required) => ns.privilege.authorize(session, required)
    });
    return { clock, store, engine };
}

const textOf = (result) => result.blocks.map((b) => {
    if (b.type === 'table') return b.rows.map((r) => r.join(' ')).join('\n');
    if (b.type === 'status') return b.items.map((i) => `${i.label} ${i.value}`).join('\n');
    return b.text || (b.lines ? b.lines.join('\n') : '');
}).join('\n');

/** What each surface says about the alert state, read at the store's current time. */
function readAll(store, engine) {
    const board = store.tick();
    const indicator = ns.dashboardPanels.eventIndicator(store);
    return {
        headerCount: board.list.length,
        headerOverall: board.overall,
        indicatorCount: indicator.alertCount,
        indicatorOverall: indicator.overall,
        engineering: textOf(engine.execute('ENGINEERING')),
        status: textOf(engine.execute('STATUS')),
        report: textOf(engine.execute('REPORT ENGINEERING')),
        log: textOf(engine.execute('LOG'))
    };
}

describe('state consistency: an injected fault', () => {
    test('is shown the same way everywhere at the same time, and clears everywhere', () => {
        // No script here: the scripted cooling event would add its own alert to the quiet baseline.
        const scenario = ns.scenario.standardScenario();
        scenario.script = [];
        const { clock, store, engine } = setup({ scenario });
        clock.set(START + 5 * MINUTE);
        const quiet = readAll(store, engine);
        expect(quiet.headerCount).toBe(0);
        expect(quiet.indicatorCount).toBe(0);
        expect(quiet.engineering).toContain('ACTIVE FAULTS: 0');

        store.operate('engineering', 'addFault', { code: 'R-9', message: 'REACTOR FAILURE', component: 'mainReactor', severity: 'CRITICAL' }, 'engineering');
        const faulted = readAll(store, engine);
        expect(faulted.headerCount).toBe(1);
        expect(faulted.indicatorCount).toBe(faulted.headerCount);
        expect(faulted.headerOverall).toBe('CRITICAL');
        expect(faulted.indicatorOverall).toBe('CRITICAL');
        expect(faulted.engineering).toContain('ACTIVE FAULTS: 1');
        expect(faulted.report).toContain('ACTIVE FAULTS: 1');
        expect(faulted.engineering).toContain('REACTOR FAILURE');
        expect(faulted.status).toMatch(/ENGINEERING.*CRITICAL/);
        expect(faulted.log).toContain('FAULT RAISED: REACTOR FAILURE');
        expect(faulted.log).toContain('ALERT RAISED: REACTOR FAILURE');

        store.operate('engineering', 'clearFault', { code: 'R-9' }, 'engineering');
        const cleared = readAll(store, engine);
        expect(cleared.headerCount).toBe(0);
        expect(cleared.indicatorCount).toBe(0);
        expect(cleared.engineering).toContain('ACTIVE FAULTS: 0');
        expect(cleared.log).toContain('FAULT CLEARED: REACTOR FAILURE');
    });

    test('the same story holds when the change comes from the script rather than an operation', () => {
        const { clock, store, engine } = setup();
        clock.set(START + 3 * MINUTE);
        const readings = readAll(store, engine);
        expect(readings.headerCount).toBe(1);
        expect(readings.indicatorCount).toBe(readings.headerCount);
        expect(readings.engineering).toContain('COOLING SYSTEM TEMPERATURE ABOVE NORMAL');
        expect(readings.log).toContain('FAULT RAISED: COOLING SYSTEM TEMPERATURE ABOVE NORMAL');
    });
});
