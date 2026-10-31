'use strict';

/**
 * Privilege levels and the permission matrix from the plan (section 7.2).
 */

const ns = require('./load');
const { LEVELS, OPERATIONS, rank, permits, authorize, createSession } = ns.privilege;

// The plan's matrix, written out independently of the code. SYSTEM is not in the plan's
// table; it is the internal administration level and is treated as permitted everywhere.
const PLAN_MATRIX = {
    GENERAL_STATUS:          { CREW: true,  OFFICER: true,  COMMANDER: true,  CORPORATE: true },
    CREW_MANIFEST:           { CREW: true,  OFFICER: true,  COMMANDER: true,  CORPORATE: true },
    CREW_RECORDS:            { CREW: false, OFFICER: true,  COMMANDER: true,  CORPORATE: true },
    ENGINEERING_REPORTS:     { CREW: true,  OFFICER: true,  COMMANDER: true,  CORPORATE: true },
    ENGINEERING_CONTROL:     { CREW: false, OFFICER: false, COMMANDER: true,  CORPORATE: true },
    MISSION_ORDERS:          { CREW: false, OFFICER: true,  COMMANDER: true,  CORPORATE: true },
    CORPORATE_DIRECTIVES:    { CREW: false, OFFICER: false, COMMANDER: false, CORPORATE: true },
    SPECIAL_ORDER_937:       { CREW: false, OFFICER: false, COMMANDER: false, CORPORATE: true }
};

describe('privilege levels', () => {
    test('the five levels exist in order from least to most privileged', () => {
        expect(LEVELS).toEqual(['CREW', 'OFFICER', 'COMMANDER', 'CORPORATE', 'SYSTEM']);
        expect(rank('CREW')).toBeLessThan(rank('OFFICER'));
        expect(rank('OFFICER')).toBeLessThan(rank('COMMANDER'));
        expect(rank('COMMANDER')).toBeLessThan(rank('CORPORATE'));
        expect(rank('CORPORATE')).toBeLessThan(rank('SYSTEM'));
    });

    test('an unknown level is an error, not a silent pass', () => {
        expect(() => rank('ADMIRAL')).toThrow(/unknown privilege level/);
        expect(() => permits('ADMIRAL', 'CREW')).toThrow();
    });

    test('a session starts at commander, with the terminal session identifier', () => {
        const session = createSession();
        expect(session.level).toBe('COMMANDER');
        expect(session.id).toBe('0000-A7F3');
    });

    test('a session level can be set only to a known level', () => {
        const session = createSession();
        session.setLevel('OFFICER');
        expect(session.level).toBe('OFFICER');
        expect(() => session.setLevel('ADMIRAL')).toThrow();
        expect(session.level).toBe('OFFICER');
    });
});

describe('permission matrix', () => {
    test('every operation in the plan is encoded', () => {
        expect(Object.keys(OPERATIONS).sort()).toEqual(Object.keys(PLAN_MATRIX).sort());
    });

    LEVELS.filter((level) => level !== 'SYSTEM').forEach((level) => {
        Object.keys(PLAN_MATRIX).forEach((operation) => {
            test(`${level} ${PLAN_MATRIX[operation][level] ? 'may' : 'may not'} ${operation}`, () => {
                expect(permits(level, OPERATIONS[operation])).toBe(PLAN_MATRIX[operation][level]);
            });
        });
    });

    test('SYSTEM is permitted everything', () => {
        Object.keys(OPERATIONS).forEach((operation) => {
            expect(permits('SYSTEM', OPERATIONS[operation])).toBe(true);
        });
    });
});

describe('authorize: the one decision', () => {
    test('a permitted request returns nothing to report', () => {
        expect(authorize(createSession(), 'CREW')).toBeNull();
    });

    test('a denied request says what is required and what is held, and nothing else', () => {
        const denial = authorize(createSession({ level: 'COMMANDER' }), 'CORPORATE');
        expect(denial).toEqual({ required: 'CORPORATE', current: 'COMMANDER' });
    });
});
