'use strict';

/**
 * REPORT and its filters. Each section is the subsystem command's own output at the same
 * moment, so the report can never disagree with the commands it composes.
 */

const ns = require('./load');
const { createShipStore, createManualClock } = ns.shipState;

const START = Date.UTC(2122, 5, 2, 8, 0, 0);
const FIRMWARE = 'MU/TH-UR FW 6000.50';

function setup(level = 'COMMANDER') {
    const session = ns.privilege.createSession({ level });
    const clock = createManualClock(START);
    const store = createShipStore({ clock });
    const registry = ns.registry.createRegistry();
    ns.systemCommands.register(registry);
    ns.shipCommands.register(registry, store, { firmware: FIRMWARE });
    ns.missionCommands.register(registry, store);
    ns.navigationCommands.register(registry, store);
    ns.engineeringCommands.register(registry, store);
    ns.lifeSupportCommands.register(registry, store);
    ns.crewCommands.register(registry, store, session);
    ns.cargoCommands.register(registry, store);
    ns.statusCommands.register(registry, store);
    ns.logCommands.register(registry, store);
    ns.reportCommands.register(registry, store, session);
    const engine = ns.engine.createEngine({
        registry,
        authorize: (required) => ns.privilege.authorize(session, required)
    });
    return { clock, store, engine, registry, session };
}

// The blocks a command produces when run on its own, at the current moment.
function commandBlocks(engine, name) {
    return engine.execute(name).blocks;
}

// True when `inner` appears as one unbroken run of blocks inside `outer`.
function containsRun(outer, inner) {
    const json = (b) => JSON.stringify(b);
    for (let i = 0; i + inner.length <= outer.length; i++) {
        if (inner.every((b, k) => json(outer[i + k]) === json(b))) return true;
    }
    return false;
}

describe('REPORT composes the subsystem commands', () => {
    test('each section of REPORT is exactly what its command returns at the same moment', () => {
        const { engine } = setup();
        const report = engine.execute('REPORT').blocks;
        ['SHIP', 'MISSION', 'NAVIGATION', 'ENGINEERING', 'POWER', 'LIFE SUPPORT', 'CREW', 'CARGO', 'ALERTS', 'LOG']
            .forEach((name) => {
                expect(containsRun(report, commandBlocks(engine, name))).toBe(true);
            });
    });

    test('REPORT lists the ten sections in the plan\'s order', () => {
        const { engine } = setup();
        const headings = engine.execute('REPORT').blocks
            .filter((b) => b.tone === 'heading' && b.text.indexOf('SECTION') === 0)
            .map((b) => b.text);
        expect(headings).toEqual([
            'SECTION VESSEL', 'SECTION MISSION', 'SECTION NAVIGATION', 'SECTION ENGINEERING',
            'SECTION POWER', 'SECTION LIFE SUPPORT', 'SECTION CREW', 'SECTION CARGO',
            'SECTION ALERTS', 'SECTION EVENTS'
        ]);
    });

    test('REPORT has usage and help, and the ALERTS command it composes is registered', () => {
        const { registry } = setup();
        ['REPORT', 'REPORT ENGINEERING', 'REPORT CREW', 'REPORT ALL', 'ALERTS'].forEach((name) => {
            const def = registry.get(name);
            expect(def).not.toBeNull();
            expect(def.usage).toEqual(expect.any(String));
            expect(def.description.length).toBeGreaterThan(0);
        });
    });
});

describe('the filters', () => {
    test('REPORT ENGINEERING gives the engineering and power sections only', () => {
        const { engine } = setup();
        const report = engine.execute('REPORT ENGINEERING').blocks;
        expect(containsRun(report, commandBlocks(engine, 'ENGINEERING'))).toBe(true);
        expect(containsRun(report, commandBlocks(engine, 'POWER'))).toBe(true);
        expect(containsRun(report, commandBlocks(engine, 'CARGO'))).toBe(false);
    });

    test('REPORT CREW gives the crew manifest section only', () => {
        const { engine } = setup();
        const report = engine.execute('REPORT CREW').blocks;
        expect(containsRun(report, commandBlocks(engine, 'CREW'))).toBe(true);
        expect(containsRun(report, commandBlocks(engine, 'LIFE SUPPORT'))).toBe(false);
    });

    test('REPORT ALL expands the report with the detailed sub-reports', () => {
        const { engine } = setup();
        const all = engine.execute('REPORT ALL').blocks;
        expect(containsRun(all, commandBlocks(engine, 'ENGINEERING REACTOR'))).toBe(true);
        expect(containsRun(all, commandBlocks(engine, 'LIFE SUPPORT OXYGEN'))).toBe(true);
        expect(all.length).toBeGreaterThan(engine.execute('REPORT').blocks.length);
    });

    test('an unknown filter is refused with usage text', () => {
        const { engine } = setup();
        const result = engine.execute('REPORT GALLEY');
        expect(result.status).toBe('error');
        expect(result.blocks[0].text).toContain('USAGE: REPORT [ENGINEERING|CREW|ALL]');
    });
});

describe('faults show in the report', () => {
    test('a reactor fault appears in the engineering and power sections and the alerts section', () => {
        const { store, engine } = setup();
        store.operate('engineering', 'addFault', { code: 'R-7', message: 'REACTOR TEMP HIGH', component: 'mainReactor', severity: 'WARNING' }, 'engineering');
        const report = engine.execute('REPORT').blocks;
        expect(containsRun(report, commandBlocks(engine, 'ENGINEERING'))).toBe(true);
        expect(containsRun(report, commandBlocks(engine, 'POWER'))).toBe(true);
        expect(containsRun(report, commandBlocks(engine, 'ALERTS'))).toBe(true);
        const text = JSON.stringify(report);
        expect(text).toContain('R-7');
        expect(text).toContain('ACTIVE ALERTS');
    });

    test('the events section matches LOG, and the alerts section lists the raised alert', () => {
        const { store, engine } = setup();
        store.operate('engineering', 'addFault', { code: 'R-7', message: 'REACTOR TEMP HIGH', component: 'mainReactor', severity: 'WARNING' }, 'engineering');
        const report = engine.execute('REPORT').blocks;
        expect(containsRun(report, commandBlocks(engine, 'LOG'))).toBe(true);
        expect(JSON.stringify(engine.execute('ALERTS').blocks)).toContain('REACTOR TEMP HIGH');
    });
});

describe('the privilege gate applies to composed commands', () => {
    test('a composed command the session may not use shows a notice in its place, never its output', () => {
        const session = ns.privilege.createSession({ level: 'CREW' });
        const registry = ns.registry.createRegistry();
        registry.register({
            name: 'SHIP',
            privilege: 'CORPORATE',
            handler: () => [{ type: 'text', text: 'SECRET SHIP DATA' }]
        });
        ns.reportCommands.register(registry, createShipStore({ clock: createManualClock(START) }), session);
        const engine = ns.engine.createEngine({
            registry,
            authorize: (required) => ns.privilege.authorize(session, required)
        });
        const text = JSON.stringify(engine.execute('REPORT').blocks);
        expect(text).toContain('SHIP: NOT AVAILABLE AT THIS LEVEL.');
        expect(text).not.toContain('SECRET SHIP DATA');
    });
});
