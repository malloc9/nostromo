'use strict';

/**
 * The reset control: a settings action that asks first. Declining does nothing; confirming runs the
 * reset once, and clears the command history only if the user ticked that option. Plus the parts it
 * uses: a new session identifier, clearing history, and the guarantee that no terminal command resets.
 */

const ns = require('./load');
const { createResetControl } = ns.simulationReset;
const { createShipStore, createManualClock } = ns.shipState;
const { createInputHistory } = ns.inputHistory;

describe('reset control: confirmation', () => {
    test('nothing happens until the user asks, and declining leaves the ship alone', () => {
        const perform = jest.fn();
        const control = createResetControl(perform);
        expect(control.state()).toBe('idle');
        control.confirm();
        expect(perform).not.toHaveBeenCalled();
        control.request();
        expect(control.state()).toBe('asking');
        control.decline();
        expect(control.state()).toBe('idle');
        expect(perform).not.toHaveBeenCalled();
    });

    test('confirming runs the reset once, keeping command history by default', () => {
        const perform = jest.fn();
        const control = createResetControl(perform);
        control.request();
        control.confirm();
        expect(perform).toHaveBeenCalledTimes(1);
        expect(perform).toHaveBeenCalledWith({ clearHistory: false });
        expect(control.state()).toBe('idle');
        control.confirm();
        expect(perform).toHaveBeenCalledTimes(1);
    });

    test('the history option is applied only when confirmed', () => {
        const perform = jest.fn();
        const control = createResetControl(perform);
        control.request();
        control.setClearHistory(true);
        expect(control.clearHistory()).toBe(true);
        control.confirm();
        expect(perform).toHaveBeenCalledWith({ clearHistory: true });
    });

    test('the history option is forgotten after a decline', () => {
        const perform = jest.fn();
        const control = createResetControl(perform);
        control.request();
        control.setClearHistory(true);
        control.decline();
        expect(control.clearHistory()).toBe(false);
        control.request();
        control.confirm();
        expect(perform).toHaveBeenCalledWith({ clearHistory: false });
    });

    test('the history option cannot be set before the user asks', () => {
        const control = createResetControl(jest.fn());
        control.setClearHistory(true);
        expect(control.clearHistory()).toBe(false);
    });
});

describe('reset: the parts it uses', () => {
    test('a new session identifier has the same shape as the others', () => {
        const id = ns.privilege.newSessionId(() => 0.5);
        expect(id).toMatch(/^[0-9A-F]{4}-[0-9A-F]{4}$/);
        expect(ns.privilege.newSessionId(() => 0.999)).toMatch(/^[0-9A-F]{4}-[0-9A-F]{4}$/);
    });

    test('a session can take a new identifier, and its level is still checked', () => {
        const session = ns.privilege.createSession({ level: 'OFFICER' });
        session.setId('1234-ABCD');
        expect(session.id).toBe('1234-ABCD');
        expect(session.level).toBe('OFFICER');
    });

    test('clearing history empties it and leaves it working', () => {
        const history = createInputHistory();
        history.add('STATUS');
        history.add('CREW');
        history.clear();
        expect(history.entries()).toEqual([]);
        history.add('MISSION');
        expect(history.entries().map((e) => e.text)).toEqual(['MISSION']);
    });
});

describe('reset: no terminal command can trigger it', () => {
    function setup() {
        const session = ns.privilege.createSession({ level: 'COMMANDER' });
        const store = createShipStore({ clock: createManualClock(Date.UTC(2122, 5, 2, 8, 0, 0)) });
        const registry = ns.registry.createRegistry();
        ns.systemCommands.register(registry);
        ns.engineeringCommands.register(registry, store);
        ns.statusCommands.register(registry, store);
        const engine = ns.engine.createEngine({
            registry,
            authorize: (required) => ns.privilege.authorize(session, required)
        });
        return { store, engine };
    }

    test.each(['RESET', 'RESET SIMULATION', 'SIMULATION RESET', 'RESET ALL'])('"%s" is not a command', (line) => {
        const { store, engine } = setup();
        store.operate('engineering', 'addFault', { code: 'R-1', message: 'TEST', component: 'mainReactor', severity: 'WARNING' }, 'engineering');
        const before = store.version();
        expect(engine.execute(line).status).not.toBe('ok');
        expect(store.version()).toBe(before);
    });
});
