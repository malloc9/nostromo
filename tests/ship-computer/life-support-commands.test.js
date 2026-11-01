'use strict';

/**
 * Life support: the model in the plan's units, the four LIFE SUPPORT commands, and the
 * consistency with the simulator, STATUS, the header count and the log.
 */

const ns = require('./load');
const DataSimulator = require('../../js/data-simulator.js');
const { createShipStore, createManualClock } = ns.shipState;

const START = Date.UTC(2122, 5, 2, 8, 0, 0);

function setup() {
    const clock = createManualClock(START);
    const store = createShipStore({ clock });
    const registry = ns.registry.createRegistry();
    ns.systemCommands.register(registry);
    ns.lifeSupportCommands.register(registry, store);
    ns.statusCommands.register(registry, store);
    ns.logCommands.register(registry, store);
    return { clock, store, registry, engine: ns.engine.createEngine({ registry }), sim: new DataSimulator({ store, clock }) };
}

const lines = (result) => result.blocks.map((b) => b.text || '');
const line = (result, prefix) => lines(result).find((l) => l.startsWith(prefix));

describe('life support model: plan units', () => {
    test('readings come in the plan\'s units: percent, kPa and Celsius', () => {
        const { store } = setup();
        const model = ns.lifeSupportModel.build(store.snapshot('lifeSupport'));
        expect(model.readings.oxygen).toBeGreaterThan(19);
        expect(model.readings.oxygen).toBeLessThan(23);
        expect(model.readings.co2).toBeLessThan(0.1);
        expect(model.readings.pressure).toBeGreaterThan(100);
        expect(model.readings.pressure).toBeLessThan(103);
        expect(model.readings.temperature).toBeGreaterThan(20);
        expect(model.readings.temperature).toBeLessThan(23);
    });

    test('nominal: both components nominal and the overall status nominal', () => {
        const { store } = setup();
        const model = ns.lifeSupportModel.build(store.snapshot('lifeSupport'));
        expect(model.components.map((c) => c.status)).toEqual(['NOMINAL', 'NOMINAL']);
        expect(model.overall).toBe('NOMINAL');
    });

    test('a fault on the atmospheric control is that component\'s status and the overall status', () => {
        const { store } = setup();
        store.operate('lifeSupport', 'addFault', { code: 'ATM-3', message: 'SCRUBBER DEGRADED', component: 'atmosphericControl' }, 'lifeSupport');
        const model = ns.lifeSupportModel.build(store.snapshot('lifeSupport'));
        expect(model.components.find((c) => c.key === 'atmosphericControl').status).toBe('WARNING');
        expect(model.components.find((c) => c.key === 'airCirculation').status).toBe('NOMINAL');
        expect(model.overall).toBe('WARNING');
    });

    test('a misspelled life-support component is refused by the store', () => {
        const { store } = setup();
        expect(() => store.operate('lifeSupport', 'addFault', { code: 'X', component: 'atmospherik' }, 'lifeSupport'))
            .toThrow(/unknown lifeSupport component/);
    });
});

describe('LIFE SUPPORT overview', () => {
    test('shows the plan\'s rows with aligned leaders, and the two component lines', () => {
        const { engine } = setup();
        const result = engine.execute('LIFE SUPPORT');
        expect(lines(result)).toContain('LIFE SUPPORT MONITORING');
        expect(line(result, 'OXYGEN LEVEL')).toMatch(/%$/);
        expect(line(result, 'CO2 CONCENTRATION')).toMatch(/%$/);
        expect(line(result, 'ATMOSPHERIC PRESSURE')).toMatch(/KPA$/);
        expect(line(result, 'CABIN TEMPERATURE')).toMatch(/°C$/);
        expect(line(result, 'HUMIDITY')).toMatch(/%$/);
        expect(lines(result)).toContain('AIR CIRCULATION: NOMINAL');
        expect(lines(result)).toContain('ATMOSPHERIC CONTROL: NOMINAL');
        expect(lines(result)).toContain('LIFE SUPPORT OPERATIONAL.');
    });

    test('a fault changes the component line and the closing line', () => {
        const { store, engine } = setup();
        store.operate('lifeSupport', 'addFault', { code: 'ATM-3', component: 'atmosphericControl' }, 'lifeSupport');
        const result = engine.execute('LIFE SUPPORT');
        expect(lines(result)).toContain('ATMOSPHERIC CONTROL: WARNING');
        expect(lines(result)).toContain('LIFE SUPPORT WARNING.');
    });

    test('LIFE SUPPORT with arguments is refused with usage text', () => {
        const { engine } = setup();
        const result = engine.execute('LIFE SUPPORT NOW');
        expect(result.status).toBe('error');
        expect(result.blocks[0].text).toContain('USAGE: LIFE SUPPORT');
    });
});

describe('the three sub-reports', () => {
    test('LIFE SUPPORT OXYGEN shows the oxygen level', () => {
        const { engine } = setup();
        expect(line(engine.execute('LIFE SUPPORT OXYGEN'), 'OXYGEN LEVEL')).toMatch(/%$/);
    });

    test('LIFE SUPPORT ATMOSPHERE shows CO2, pressure and the two component lines', () => {
        const { engine } = setup();
        const result = engine.execute('LIFE SUPPORT ATMOSPHERE');
        expect(line(result, 'CO2 CONCENTRATION')).toMatch(/%$/);
        expect(line(result, 'ATMOSPHERIC PRESSURE')).toMatch(/KPA$/);
        expect(lines(result)).toContain('ATMOSPHERIC CONTROL: NOMINAL');
    });

    test('LIFE SUPPORT TEMPERATURE shows temperature and humidity', () => {
        const { engine } = setup();
        const result = engine.execute('LIFE SUPPORT TEMPERATURE');
        expect(line(result, 'CABIN TEMPERATURE')).toMatch(/°C$/);
        expect(line(result, 'HUMIDITY')).toMatch(/%$/);
    });

    test('each command is registered with usage and description', () => {
        const { registry } = setup();
        ['LIFE SUPPORT', 'LIFE SUPPORT OXYGEN', 'LIFE SUPPORT ATMOSPHERE', 'LIFE SUPPORT TEMPERATURE'].forEach((name) => {
            const def = registry.get(name);
            expect(def).not.toBeNull();
            expect(def.usage).toEqual(expect.any(String));
            expect(def.description.length).toBeGreaterThan(0);
        });
    });
});

describe('consistency and the ticket\'s integration path', () => {
    test('the terminal values equal the simulator values at the same time (pressure converted to ATM)', () => {
        const { engine, sim } = setup();
        const status = sim.generateSystemStatus().lifeSupport;
        const oxygen = Number(line(engine.execute('LIFE SUPPORT'), 'OXYGEN LEVEL').split(' ').pop().replace('%', ''));
        const temperature = Number(line(engine.execute('LIFE SUPPORT'), 'CABIN TEMPERATURE').split(' ').pop().replace('°C', ''));
        expect(oxygen).toBe(status.oxygen);
        expect(temperature).toBe(status.temperature);
        const kpa = Number(line(engine.execute('LIFE SUPPORT'), 'ATMOSPHERIC PRESSURE').split(' ').slice(-2)[0]);
        expect(Math.round((kpa / 101.325) * 100) / 100).toBe(status.pressure);
    });

    test('a fault on the atmospheric control changes the report, STATUS, the header count and the log at once', () => {
        const { store, engine } = setup();
        store.operate('lifeSupport', 'addFault', { code: 'ATM-3', message: 'SCRUBBER DEGRADED', component: 'atmosphericControl' }, 'lifeSupport');
        expect(lines(engine.execute('LIFE SUPPORT'))).toContain('ATMOSPHERIC CONTROL: WARNING');
        expect(lines(engine.execute('STATUS')).find((l) => l.startsWith('LIFE SUPPORT'))).toMatch(/WARNING$/);
        expect(store.alerts().list.map((a) => a.id)).toEqual(['lifeSupport:ATM-3']);
        const log = engine.execute('LOG LIFE SUPPORT').blocks
            .map((b) => (b.type === 'table' ? b.rows.map((r) => r.join(' ')).join('\n') : b.text)).join('\n');
        expect(log).toContain('FAULT RAISED: SCRUBBER DEGRADED');
    });

    test('a reading that crosses its threshold raises a life-support alert on the board', () => {
        const scenario = ns.scenario.standardScenario();
        scenario.subsystems.lifeSupport.measurements.oxygen = ns.scenario.measure(18.5);
        const clock = createManualClock(START);
        const store = createShipStore({ clock, scenario });
        const registry = ns.registry.createRegistry();
        ns.statusCommands.register(registry, store);
        const status = ns.engine.createEngine({ registry }).execute('STATUS');
        expect(store.alerts().list.map((a) => a.id)).toEqual(['LS_OXYGEN']);
        expect(lines(status).find((l) => l.startsWith('LIFE SUPPORT'))).toMatch(/WARNING$/);
    });
});
