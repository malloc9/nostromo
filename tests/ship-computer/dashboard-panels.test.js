'use strict';

/**
 * Dashboard panels and the event indicator: each clickable panel maps to the command it runs,
 * every mapped command exists in the engine, and the indicator reads the shared alert list and
 * event log, so a fault shows in the indicator, the panel report and the header count together.
 */

const ns = require('./load');
const { createShipStore, createManualClock } = ns.shipState;

const START = Date.UTC(2122, 5, 2, 8, 0, 0);

function setup() {
    const session = ns.privilege.createSession({ level: 'COMMANDER' });
    const clock = createManualClock(START);
    const store = createShipStore({ clock });
    const registry = ns.registry.createRegistry();
    ns.systemCommands.register(registry);
    ns.engineeringCommands.register(registry, store);
    ns.lifeSupportCommands.register(registry, store);
    ns.navigationCommands.register(registry, store, session);
    ns.crewCommands.register(registry, store, session);
    const engine = ns.engine.createEngine({
        registry,
        authorize: (required) => ns.privilege.authorize(session, required)
    });
    return { store, engine, registry };
}

const textOf = (result) => result.blocks.map((b) => {
    if (b.type === 'table') return b.rows.map((r) => r.join(' ')).join('\n');
    return b.text || '';
}).join('\n');

describe('panel-to-command mapping', () => {
    test('each of the four panels runs its matching command', () => {
        const { commandForPanel } = ns.dashboardPanels;
        expect(commandForPanel('power-quadrant')).toBe('ENGINEERING');
        expect(commandForPanel('life-support-quadrant')).toBe('LIFE SUPPORT');
        expect(commandForPanel('navigation-quadrant')).toBe('NAVIGATION');
        expect(commandForPanel('crew-quadrant')).toBe('CREW');
    });

    test('an element that is not a command panel maps to nothing', () => {
        expect(ns.dashboardPanels.commandForPanel('ship-schematic')).toBeNull();
        expect(ns.dashboardPanels.commandForPanel('toString')).toBeNull();
    });

    test('every mapped command is registered and runs through the engine', () => {
        const { store, engine, registry } = setup();
        Object.values(ns.dashboardPanels.PANEL_COMMANDS).forEach((command) => {
            expect(registry.get(command)).toBeTruthy();
            expect(engine.execute(command).status).toBe('ok');
        });
        expect(store.events()).toEqual([]);
    });
});

describe('event indicator', () => {
    test('a quiet ship shows no alerts and no recent events', () => {
        const { store } = setup();
        const indicator = ns.dashboardPanels.eventIndicator(store);
        expect(indicator.overall).toBe('OPERATIONAL');
        expect(indicator.alertCount).toBe(0);
        expect(indicator.alerts).toEqual([]);
        expect(indicator.recent).toEqual([]);
    });

    test('an injected fault shows in the indicator, matches the header count, and appears in the ENGINEERING report', () => {
        const { store, engine } = setup();
        store.operate('engineering', 'addFault', { code: 'C-1', message: 'COOLANT LEAK', component: 'coolingSystem', severity: 'CRITICAL' }, 'engineering');
        const indicator = ns.dashboardPanels.eventIndicator(store);
        expect(indicator.alertCount).toBe(store.tick().list.length);
        expect(indicator.alertCount).toBe(1);
        expect(indicator.overall).toBe('CRITICAL');
        expect(indicator.alerts.join(' ')).toContain('COOLANT LEAK');
        // Raising the alert is logged too, so the newest event is the alert and the fault sits behind it.
        expect(indicator.recent).toEqual(['ALERT RAISED: COOLANT LEAK', 'FAULT RAISED: COOLANT LEAK']);
        expect(textOf(engine.execute(ns.dashboardPanels.PANEL_COMMANDS['power-quadrant']))).toContain('ACTIVE FAULTS: 1');
    });

    test('recent events are newest first and limited to the given count', () => {
        const { store } = setup();
        ['ONE', 'TWO', 'THREE', 'FOUR'].forEach((code) => {
            store.operate('engineering', 'addFault', { code, message: code, component: 'mainReactor', severity: 'WARNING' }, 'engineering');
        });
        const indicator = ns.dashboardPanels.eventIndicator(store, 2);
        expect(indicator.recent).toEqual(['ALERT RAISED: FOUR', 'FAULT RAISED: FOUR']);
    });

    test('asking for zero recent events returns none, not the whole log', () => {
        const { store } = setup();
        store.operate('engineering', 'addFault', { code: 'Z-1', message: 'ZERO', component: 'mainReactor', severity: 'WARNING' }, 'engineering');
        expect(store.events().length).toBeGreaterThan(0);
        expect(ns.dashboardPanels.eventIndicator(store, 0).recent).toEqual([]);
    });
});
