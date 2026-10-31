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
        lifeSupport: { oxygen: 95, co2: 12 },
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

    test('life support gives one alert: critical takes precedence over warning', () => {
        const critical = derive(readings({ lifeSupport: { oxygen: 75, co2: 12 } }), NOW);
        expect(ids(critical)).toEqual(['LIFE_SUPPORT_CRITICAL']);
        const warning = derive(readings({ lifeSupport: { oxygen: 85, co2: 12 } }), NOW);
        expect(ids(warning)).toEqual(['LIFE_SUPPORT_WARNING']);
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
