'use strict';

/**
 * ENGINEERING POWER, REACTOR, ENGINES, COOLING and DAMAGE, and POWER.
 * Each reads the same store values the screens read.
 */

const ns = require('./load');
const DataSimulator = require('../../js/data-simulator.js');
const { createShipStore, createManualClock } = ns.shipState;

const START = Date.UTC(2122, 5, 2, 8, 0, 0);

function makeEngine(store = createShipStore({ clock: createManualClock(START) })) {
    const registry = ns.registry.createRegistry();
    ns.systemCommands.register(registry);
    ns.engineeringCommands.register(registry, store);
    return { store, engine: ns.engine.createEngine({ registry }) };
}

const lines = (result) => result.blocks.map((b) => b.text || '');
const line = (result, prefix) => lines(result).find((l) => l.startsWith(prefix));
const valueOf = (result, prefix) => line(result, prefix).split(' ').pop();

describe('ENGINEERING POWER', () => {
    test('nominal: generation, consumption, margin, efficiency, distribution, closing line', () => {
        const { engine } = makeEngine();
        const text = lines(engine.execute('ENGINEERING POWER'));
        expect(text).toContain('POWER DISTRIBUTION REPORT');
        expect(line(engine.execute('ENGINEERING POWER'), 'GENERATION')).toMatch(/%$/);
        expect(line(engine.execute('ENGINEERING POWER'), 'MARGIN')).toMatch(/%$/);
        expect(line(engine.execute('ENGINEERING POWER'), 'DISTRIBUTION')).toMatch(/NOMINAL$/);
        expect(text[text.length - 1]).toBe('POWER REPORT COMPLETE.');
    });

    test('a negative margin shows a minus sign, and a tiny one never prints -0.0', () => {
        const store = createShipStore({ clock: createManualClock(START) });
        const scenario = ns.scenario.standardScenario();
        scenario.subsystems.engineering.measurements.powerConsumption = ns.scenario.measure(90);
        const low = createShipStore({ clock: createManualClock(START), scenario });
        expect(line(makeEngine(low).engine.execute('ENGINEERING POWER'), 'MARGIN')).toMatch(/-4\.0%$/);
        expect(line(makeEngine(store).engine.execute('POWER'), 'NET POWER')).not.toContain('-0.0');
    });

    test('the margin is generation minus consumption', () => {
        const { store, engine } = makeEngine();
        const m = store.snapshot('engineering').measurements;
        const margin = Number(valueOf(engine.execute('ENGINEERING POWER'), 'MARGIN').replace('%', ''));
        expect(margin).toBeCloseTo(m.powerGeneration - m.powerConsumption, 1);
    });
});

describe('ENGINEERING REACTOR', () => {
    test('nominal: status, output and no faults', () => {
        const { engine } = makeEngine();
        const result = engine.execute('ENGINEERING REACTOR');
        expect(line(result, 'MAIN REACTOR')).toMatch(/NOMINAL$/);
        expect(line(result, 'OUTPUT')).toMatch(/%$/);
        expect(line(result, 'FAULTS')).toBe(ns.util.formatLeader('FAULTS', '0'));
    });

    test('with a reactor fault: warning status and the fault listed', () => {
        const { store, engine } = makeEngine();
        store.operate('engineering', 'addFault', { code: 'R-7', message: 'REACTOR TEMP HIGH', component: 'mainReactor', severity: 'WARNING' }, 'engineering');
        const result = engine.execute('ENGINEERING REACTOR');
        expect(line(result, 'MAIN REACTOR')).toMatch(/WARNING$/);
        expect(lines(result)).toContain('R-7  REACTOR TEMP HIGH  WARNING');
    });
});

describe('ENGINEERING ENGINES', () => {
    test('nominal: both engines report status and load', () => {
        const { engine } = makeEngine();
        const result = engine.execute('ENGINEERING ENGINES');
        expect(line(result, 'PRIMARY ENGINE')).toMatch(/NOMINAL$/);
        expect(line(result, 'SECONDARY ENGINE')).toMatch(/NOMINAL$/);
        expect(line(result, 'PRIMARY LOAD')).toMatch(/%$/);
        expect(line(result, 'SECONDARY LOAD')).toMatch(/%$/);
    });

    test('a primary engine fault shows on the primary engine line only', () => {
        const { store, engine } = makeEngine();
        store.operate('engineering', 'addFault', { code: 'E-2', component: 'primaryEngine', severity: 'CRITICAL' }, 'engineering');
        const result = engine.execute('ENGINEERING ENGINES');
        expect(line(result, 'PRIMARY ENGINE')).toMatch(/CRITICAL$/);
        expect(line(result, 'SECONDARY ENGINE')).toMatch(/NOMINAL$/);
    });
});

describe('ENGINEERING COOLING', () => {
    test('nominal: status, temperature and the warning threshold from the store', () => {
        const { engine } = makeEngine();
        const result = engine.execute('ENGINEERING COOLING');
        expect(line(result, 'COOLING SYSTEM')).toMatch(/NOMINAL$/);
        expect(line(result, 'TEMPERATURE')).toMatch(/°C$/);
        expect(line(result, 'WARNING AT')).toBe(ns.util.formatLeader('WARNING AT', '80.0°C'));
    });

    test('a cooling fault shows on the cooling line', () => {
        const { store, engine } = makeEngine();
        store.operate('engineering', 'addFault', { code: 'C-1', component: 'coolingSystem', severity: 'WARNING' }, 'engineering');
        expect(line(engine.execute('ENGINEERING COOLING'), 'COOLING SYSTEM')).toMatch(/WARNING$/);
    });
});

describe('ENGINEERING DAMAGE', () => {
    test('reports no damage when there are no active faults', () => {
        const { engine } = makeEngine();
        const result = engine.execute('ENGINEERING DAMAGE');
        expect(lines(result)).toContain('NO ACTIVE DAMAGE.');
    });

    test('lists each active fault with the part it is on', () => {
        const { store, engine } = makeEngine();
        store.operate('engineering', 'addFault', { code: 'R-7', message: 'REACTOR TEMP HIGH', component: 'mainReactor', severity: 'WARNING' }, 'engineering');
        store.operate('engineering', 'addFault', { code: 'C-1', message: 'COOLANT LOW', component: 'coolingSystem', severity: 'CRITICAL' }, 'engineering');
        const result = engine.execute('ENGINEERING DAMAGE');
        expect(lines(result)).toContain(ns.util.formatLeader('ACTIVE DAMAGE', '2'));
        expect(lines(result)).toContain('MAIN REACTOR  R-7  REACTOR TEMP HIGH  WARNING');
        expect(lines(result)).toContain('COOLING SYSTEM  C-1  COOLANT LOW  CRITICAL');
        expect(lines(result)).not.toContain('NO ACTIVE DAMAGE.');
    });
});

describe('POWER', () => {
    test('overall power status: generation, consumption, net, fuel and distribution status', () => {
        const { engine } = makeEngine();
        const result = engine.execute('POWER');
        expect(lines(result)).toContain('POWER STATUS');
        expect(line(result, 'NET POWER')).toMatch(/%$/);
        expect(line(result, 'FUEL RESERVE')).toMatch(/%$/);
        expect(line(result, 'DISTRIBUTION')).toMatch(/NOMINAL$/);
    });

    test('POWER arguments are refused with usage text', () => {
        const { engine } = makeEngine();
        expect(engine.execute('POWER NOW').blocks[0].text).toContain('USAGE: POWER');
    });
});

describe('invalid subcommands and registration', () => {
    test('an unknown ENGINEERING subcommand shows usage and the valid subcommands', () => {
        const { engine } = makeEngine();
        const result = engine.execute('ENGINEERING GALLEY');
        expect(result.status).toBe('error');
        expect(result.blocks[0].text).toContain('USAGE: ENGINEERING [POWER|REACTOR|ENGINES|COOLING|DAMAGE]');
    });

    test('each of the six commands is registered with usage and description', () => {
        const registry = ns.registry.createRegistry();
        ns.engineeringCommands.register(registry, createShipStore({ clock: createManualClock(START) }));
        ['ENGINEERING', 'ENGINEERING POWER', 'ENGINEERING REACTOR', 'ENGINEERING ENGINES',
            'ENGINEERING COOLING', 'ENGINEERING DAMAGE', 'POWER'].forEach((name) => {
            const def = registry.get(name);
            expect(def).not.toBeNull();
            expect(def.usage).toEqual(expect.any(String));
            expect(def.description.length).toBeGreaterThan(0);
        });
    });
});

describe('consistency with the screens', () => {
    test('generation shown by ENGINEERING POWER equals the Dashboard and Engineering screen value at the same time', () => {
        const clock = createManualClock(START + 17 * 1000);
        const store = createShipStore({ clock });
        const { engine } = makeEngine(store);
        const sim = new DataSimulator({ store });
        const shownByTerminal = Number(valueOf(engine.execute('ENGINEERING POWER'), 'GENERATION').replace('%', ''));
        expect(shownByTerminal).toBe(sim.generateSystemStatus().power.generation);
    });

    test('a test fault shows in the damage report and the reactor report together', () => {
        const { store, engine } = makeEngine();
        store.operate('engineering', 'addFault', { code: 'R-7', component: 'mainReactor', severity: 'WARNING' }, 'engineering');
        expect(lines(engine.execute('ENGINEERING DAMAGE')).join('\n')).toContain('R-7');
        expect(line(engine.execute('ENGINEERING REACTOR'), 'MAIN REACTOR')).toMatch(/WARNING$/);
    });
});
