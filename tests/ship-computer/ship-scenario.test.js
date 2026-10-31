'use strict';

/**
 * The standard scenario: crew roster, roles and the units it promises.
 */

const ns = require('./load');
const { createShipStore, createManualClock } = ns.shipState;

const members = () => createShipStore({ clock: createManualClock(0) })
    .snapshot('crew').state.members;

describe('standard scenario: crew roster', () => {
    test('seven human crew plus Jones the cat as a personnel record', () => {
        const all = members();
        expect(all).toHaveLength(8);
        expect(all.filter((m) => m.type === 'human')).toHaveLength(7);
        const cat = all.find((m) => m.name === 'JONES');
        expect(cat.type).toBe('animal');
    });

    test('Kane is resting and everyone else is active', () => {
        const byName = Object.fromEntries(members().map((m) => [m.name, m.status]));
        expect(byName.KANE).toBe('resting');
        ['DALLAS', 'RIPLEY', 'LAMBERT', 'BRETT', 'PARKER', 'ASH', 'JONES']
            .forEach((name) => expect(byName[name]).toBe('active'));
    });

    test('every member has a unique id and a position', () => {
        const all = members();
        expect(new Set(all.map((m) => m.id)).size).toBe(all.length);
        all.forEach((m) => expect(m.position).toEqual(expect.any(String)));
    });

    test('vitals are resolved to numbers inside their documented ranges', () => {
        members().forEach((m) => {
            expect(typeof m.vitals.heartRate).toBe('number');
            expect(m.vitals.heartRate).toBeGreaterThanOrEqual(50);
            expect(m.vitals.heartRate).toBeLessThanOrEqual(120);
            expect(m.vitals.oxygenSat).toBeGreaterThanOrEqual(90);
            expect(m.vitals.oxygenSat).toBeLessThanOrEqual(100);
        });
    });
});

describe('standard scenario: identity and units', () => {
    test('the ship identity matches the boot screen registration', () => {
        const identity = createShipStore({ clock: createManualClock(0) }).snapshot('identity').state;
        expect(identity.vessel).toBe('USCSS NOSTROMO');
        expect(identity.registration).toBe('1809246(09)');
    });

    test('pressure is stored in kPa, near one atmosphere', () => {
        const pressure = createShipStore({ clock: createManualClock(0) })
            .snapshot('lifeSupport').measurements.pressure;
        expect(pressure).toBeGreaterThan(100);
        expect(pressure).toBeLessThan(106);
    });
});
