'use strict';

/**
 * Alert derivation: pure rules from readings and faults to the alert list.
 */

const ns = require('./load');
const { derive } = ns.alerts;

const NOW = 1000;

function readings(overrides = {}) {
    return Object.assign({
        faultsBySubsystem: {},
        power: { generation: 85, consumption: 70 },
        lifeSupport: { oxygen: 20.9, co2: 0.04, pressure: 101.3, temperature: 21.4 },
        navigation: { velocity: 0.15 },
        activeCrew: 6
    }, overrides);
}

const ids = (list) => list.map((a) => a.id);

describe('alerts: thresholds from the dashboard rules', () => {
    test('nominal readings raise no alerts', () => {
        expect(derive(readings(), NOW)).toEqual([]);
    });

    test('a power deficit is critical', () => {
        const [alert] = derive(readings({ power: { generation: 60, consumption: 70 } }), NOW);
        expect(alert).toMatchObject({ id: 'POWER_DEFICIT', subsystem: 'engineering', severity: 'CRITICAL' });
        expect(alert.message).toBe('POWER DEFICIT: CONSUMPTION EXCEEDS GENERATION');
    });

    test('a margin under 10 is a warning, not a deficit', () => {
        const [alert] = derive(readings({ power: { generation: 78, consumption: 70 } }), NOW);
        expect(alert).toMatchObject({ id: 'LOW_POWER_MARGIN', severity: 'WARNING' });
    });

    test('each life-support parameter raises one alert, critical when far out and warning when marginal', () => {
        const oxygen = derive(readings({ lifeSupport: { oxygen: 17, co2: 0.04, pressure: 101.3, temperature: 21.4 } }), NOW);
        expect(oxygen).toEqual([expect.objectContaining({ id: 'LS_OXYGEN', severity: 'CRITICAL' })]);
        const marginal = derive(readings({ lifeSupport: { oxygen: 19, co2: 0.04, pressure: 101.3, temperature: 21.4 } }), NOW);
        expect(marginal).toEqual([expect.objectContaining({ id: 'LS_OXYGEN', severity: 'WARNING' })]);
    });

    test('co2, pressure and temperature each have their own alert and severity', () => {
        const co2 = derive(readings({ lifeSupport: { oxygen: 20.9, co2: 1.2, pressure: 101.3, temperature: 21.4 } }), NOW);
        expect(co2.map((a) => a.id)).toEqual(['LS_CO2']);
        const pressure = derive(readings({ lifeSupport: { oxygen: 20.9, co2: 0.04, pressure: 109, temperature: 21.4 } }), NOW);
        expect(pressure).toEqual([expect.objectContaining({ id: 'LS_PRESSURE', severity: 'WARNING' })]);
        const temp = derive(readings({ lifeSupport: { oxygen: 20.9, co2: 0.04, pressure: 101.3, temperature: 35 } }), NOW);
        expect(temp).toEqual([expect.objectContaining({ id: 'LS_TEMPERATURE', severity: 'CRITICAL' })]);
    });

    test('velocity below 0.1 and fewer than five active crew each raise a warning', () => {
        const list = derive(readings({ navigation: { velocity: 0.05 }, activeCrew: 4 }), NOW);
        expect(ids(list)).toEqual(['NAV_VELOCITY', 'CREW_ACTIVE']);
        expect(list.every((a) => a.severity === 'WARNING')).toBe(true);
    });
});

describe('alerts: from faults', () => {
    test('each active fault becomes an alert named by subsystem and code', () => {
        const list = derive(readings({
            faultsBySubsystem: {
                engineering: [{ code: 'R-7', message: 'REACTOR COOLANT', severity: 'CRITICAL', since: 5 }]
            }
        }), NOW);
        expect(list).toEqual([{
            id: 'engineering:R-7', subsystem: 'engineering', code: 'R-7',
            severity: 'CRITICAL', message: 'REACTOR COOLANT', since: 5
        }]);
    });

    test('a fault without a severity is a warning', () => {
        const [alert] = derive(readings({
            faultsBySubsystem: { crew: [{ code: 'MED-1', message: 'CHECK', since: 1 }] }
        }), NOW);
        expect(alert.severity).toBe('WARNING');
    });

    test('an alert is removed when its cause is resolved', () => {
        const withFault = readings({
            faultsBySubsystem: { engineering: [{ code: 'R-7', message: 'X', since: 1 }] }
        });
        expect(derive(withFault, NOW)).toHaveLength(1);
        expect(derive(readings({ faultsBySubsystem: { engineering: [] } }), NOW)).toEqual([]);
    });

    test('threshold alerts are stamped with the time they were derived', () => {
        const [alert] = derive(readings({ activeCrew: 2 }), NOW);
        expect(alert.since).toBe(NOW);
    });
});
