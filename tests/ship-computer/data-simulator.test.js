'use strict';

/**
 * The DataSimulator adapter over the store: same shapes and units the six
 * screens already read, and the same answer for any reader at the same time.
 */

const DataSimulator = require('../../js/data-simulator.js');
const ns = require('./load');
const { createManualClock } = ns.shipState;

const START = Date.UTC(2122, 5, 2, 8, 0, 0);

function simulatorAt(startMs = START) {
    const clock = createManualClock(startMs);
    return { clock, sim: new DataSimulator({ clock }) };
}

describe('data simulator adapter: shapes and units', () => {
    test('generateSystemStatus keeps the shape the screens read', () => {
        const { sim } = simulatorAt();
        const status = sim.generateSystemStatus();
        expect(Object.keys(status).sort()).toEqual(['crew', 'lifeSupport', 'navigation', 'power', 'timestamp']);
        expect(Object.keys(status.power).sort()).toEqual(['consumption', 'efficiency', 'fuel', 'generation', 'netPower']);
        expect(Object.keys(status.lifeSupport).sort()).toEqual(['co2', 'oxygen', 'pressure', 'temperature']);
    });

    test('pressure is returned in ATM, as the Life Support screen shows it', () => {
        const { sim } = simulatorAt();
        const pressure = sim.generateSystemStatus().lifeSupport.pressure;
        expect(pressure).toBeGreaterThan(0.8);
        expect(pressure).toBeLessThan(1.2);
    });

    test('the crew list is the seven humans, with the old role field', () => {
        const { sim } = simulatorAt();
        const crew = sim.generateCrewData();
        expect(crew).toHaveLength(7);
        expect(crew.map((m) => m.name)).not.toContain('JONES');
        expect(crew.find((m) => m.name === 'DALLAS').role).toBe('CAPTAIN');
    });

    test('the navigation ETA is a Date 72 hours after the scenario start', () => {
        const { sim } = simulatorAt();
        const eta = sim.generateSystemStatus().navigation.eta;
        expect(eta).toBeInstanceOf(Date);
        expect(eta.getTime() - START).toBe(72 * 60 * 60 * 1000);
    });
});

describe('data simulator adapter: determinism', () => {
    test('two simulators at the same simulated time report identical values', () => {
        const a = simulatorAt(START + 90 * 1000).sim.generateSystemStatus();
        const b = simulatorAt(START + 90 * 1000).sim.generateSystemStatus();
        expect(a.power).toEqual(b.power);
        expect(a.lifeSupport).toEqual(b.lifeSupport);
        expect(a.navigation.coordinates).toEqual(b.navigation.coordinates);
        expect(a.crew).toEqual(b.crew);
    });

    test('trend data is built from the history of readings', () => {
        const { clock, sim } = simulatorAt();
        expect(sim.getTrend('power', 'generation').trend).toBe('insufficient_data');
        sim.generateSystemStatus();
        clock.advance(60 * 1000);
        sim.generateSystemStatus();
        expect(sim.getTrend('power', 'generation').trend).not.toBe('insufficient_data');
    });

    test('validateData accepts the generated status', () => {
        const { sim } = simulatorAt();
        expect(sim.validateData(sim.generateSystemStatus())).toEqual([]);
    });
});
