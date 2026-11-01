'use strict';

/**
 * ACCESS REQUEST, its grant rule, SECURITY, and the security events they write.
 */

const ns = require('./load');
const { createShipStore, createManualClock } = ns.shipState;

const START = Date.UTC(2122, 5, 2, 8, 0, 0);

function setup(level) {
    const session = ns.privilege.createSession({ level });
    const store = createShipStore({ clock: createManualClock(START) });
    const registry = ns.registry.createRegistry();
    ns.systemCommands.register(registry);
    ns.accessCommands.register(registry, session);
    ns.accessRequestCommands.register(registry, store, session);
    ns.logCommands.register(registry, store);
    const engine = ns.engine.createEngine({ registry });
    return { session, store, engine };
}

const textOf = (result) => result.blocks
    .map((b) => (b.type === 'table' ? b.rows.map((r) => r.join(' ')).join('\n') : (b.text || (b.lines || []).join('\n'))))
    .join('\n');

describe('grant rule', () => {
    const { grantRule } = ns.accessRequestCommands;

    test('officer and commander are granted to a lower level', () => {
        expect(grantRule('CREW', 'OFFICER')).toBe('granted');
        expect(grantRule('CREW', 'COMMANDER')).toBe('granted');
        expect(grantRule('OFFICER', 'COMMANDER')).toBe('granted');
    });

    test('corporate is refused at this terminal', () => {
        expect(grantRule('COMMANDER', 'CORPORATE')).toBe('refused');
        expect(grantRule('CREW', 'CORPORATE')).toBe('refused');
    });

    test('a level the session already holds needs no request', () => {
        expect(grantRule('COMMANDER', 'OFFICER')).toBe('held');
        expect(grantRule('COMMANDER', 'COMMANDER')).toBe('held');
    });

    test('system is never requested through the terminal', () => {
        expect(grantRule('COMMANDER', 'SYSTEM')).toBe('system');
    });

    test('an unknown level name is reported, not thrown', () => {
        expect(grantRule('CREW', 'ADMIRAL')).toBe('unknown');
    });
});

describe('ACCESS REQUEST: the prompt', () => {
    test('shows the authorization wording and asks, without changing the level', () => {
        const { session, engine } = setup('CREW');
        const result = engine.execute('ACCESS REQUEST OFFICER');
        expect(result.status).toBe('pending');
        const text = textOf(result);
        expect(text).toContain('ACCESS RESTRICTED.');
        expect(text).toContain('REQUIRED PRIVILEGE: OFFICER');
        expect(text).toContain('CURRENT PRIVILEGE: CREW');
        expect(text).toContain('REQUEST ELEVATED ACCESS? Y/N');
        expect(session.level).toBe('CREW');
    });

    test('with no level, asks for the next level up from the current one', () => {
        const { engine } = setup('OFFICER');
        expect(textOf(engine.execute('ACCESS REQUEST'))).toContain('REQUIRED PRIVILEGE: COMMANDER');
    });

    test('a level the session already holds is answered at once, with no question', () => {
        const { engine } = setup('COMMANDER');
        const result = engine.execute('ACCESS REQUEST OFFICER');
        expect(result.status).toBe('ok');
        expect(textOf(result)).toContain('ALREADY HOLD ACCESS AT LEVEL COMMANDER');
        expect(engine.pending()).toBeNull();
    });

    test('extra words after the level are refused with usage, not dropped', () => {
        const { engine } = setup('CREW');
        const result = engine.execute('ACCESS REQUEST OFFICER NOW');
        expect(result.status).toBe('error');
        expect(textOf(result)).toContain('USAGE: ACCESS REQUEST [LEVEL]');
        expect(engine.pending()).toBeNull();
    });

    test('an unknown level is a clear error that lists the levels', () => {
        const { engine } = setup('CREW');
        const result = engine.execute('ACCESS REQUEST ADMIRAL');
        expect(result.status).toBe('error');
        expect(textOf(result)).toContain('UNKNOWN ACCESS LEVEL: ADMIRAL');
        expect(textOf(result)).toContain('CREW, OFFICER, COMMANDER, CORPORATE');
        expect(engine.pending()).toBeNull();
    });

    test('system cannot be requested, and gets an error rather than an exception', () => {
        const { engine } = setup('COMMANDER');
        const result = engine.execute('ACCESS REQUEST SYSTEM');
        expect(result.status).toBe('error');
        expect(textOf(result)).toContain('NOT AVAILABLE THROUGH ACCESS REQUEST');
    });
});

describe('ACCESS REQUEST: each outcome', () => {
    test('Y to an officer request grants it: the level changes and a security event is logged', () => {
        const { session, store, engine } = setup('CREW');
        engine.execute('ACCESS REQUEST OFFICER');
        const answer = engine.execute('Y');
        expect(session.level).toBe('OFFICER');
        expect(textOf(answer)).toContain('ACCESS GRANTED. PRIVILEGE LEVEL NOW: OFFICER.');
        const events = store.events().filter((e) => e.subsystem === 'security');
        expect(events.map((e) => e.message)).toEqual(['ACCESS GRANTED: OFFICER']);
        expect(events[0].type).toBe('security');
    });

    test('Y to a corporate request is refused: the level is unchanged and the refusal is logged', () => {
        const { session, store, engine } = setup('COMMANDER');
        engine.execute('ACCESS REQUEST CORPORATE');
        const answer = engine.execute('Y');
        expect(session.level).toBe('COMMANDER');
        expect(textOf(answer)).toContain('ACCESS REFUSED');
        expect(textOf(answer)).toContain('PRIVILEGE LEVEL UNCHANGED: COMMANDER');
        expect(store.events().filter((e) => e.subsystem === 'security').map((e) => e.message))
            .toEqual(['ACCESS REFUSED: CORPORATE']);
    });

    test('N cancels: the level is unchanged and the cancellation is logged', () => {
        const { session, store, engine } = setup('CREW');
        engine.execute('ACCESS REQUEST COMMANDER');
        const answer = engine.execute('N');
        expect(session.level).toBe('CREW');
        expect(textOf(answer)).toContain('ACCESS REQUEST CANCELLED. PRIVILEGE LEVEL UNCHANGED: CREW.');
        expect(store.events().filter((e) => e.subsystem === 'security').map((e) => e.message))
            .toEqual(['ACCESS REQUEST CANCELLED: COMMANDER']);
    });

    test('Escape cancels and logs the cancellation', () => {
        const { session, store, engine } = setup('CREW');
        engine.execute('ACCESS REQUEST OFFICER');
        const answer = engine.cancelPending();
        expect(session.level).toBe('CREW');
        expect(answer.status).toBe('cancelled');
        expect(store.events().filter((e) => e.subsystem === 'security').map((e) => e.message))
            .toEqual(['ACCESS REQUEST CANCELLED: OFFICER']);
    });

    test('an invalid answer keeps the question and writes no event', () => {
        const { session, store, engine } = setup('CREW');
        engine.execute('ACCESS REQUEST OFFICER');
        engine.execute('PERHAPS');
        expect(session.level).toBe('CREW');
        expect(store.events()).toEqual([]);
        expect(engine.execute('Y').status).toBe('ok');
        expect(session.level).toBe('OFFICER');
    });
});

describe('SECURITY', () => {
    test('reports the security status and the access request count from the store', () => {
        const { engine } = setup('CREW');
        const text = textOf(engine.execute('SECURITY'));
        expect(text).toContain('SECURITY STATUS');
        expect(text).toContain('NOMINAL');
        expect(text).toContain('ACCESS REQUESTS');
        expect(text).toContain('LAST REQUEST');
    });

    test('the count and last request change after a request is answered', () => {
        const { engine } = setup('CREW');
        engine.execute('ACCESS REQUEST OFFICER');
        engine.execute('Y');
        const text = textOf(engine.execute('SECURITY'));
        expect(text).toContain('ACCESS REQUESTS');
        expect(text).toContain('1');
        expect(text).toContain('GRANTED OFFICER');
    });

    test('LOG SECURITY shows the outcomes of requests', () => {
        const { engine } = setup('CREW');
        engine.execute('ACCESS REQUEST OFFICER');
        engine.execute('Y');
        const text = textOf(engine.execute('LOG SECURITY'));
        expect(text).toContain('ACCESS GRANTED: OFFICER');
    });

    test('SECURITY refuses arguments with usage text', () => {
        const { engine } = setup('CREW');
        expect(engine.execute('SECURITY NOW').blocks[0].text).toContain('USAGE: SECURITY');
    });
});
