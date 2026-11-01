'use strict';

/**
 * CREW commands, name matching, personnel records and field-level permissions, and the
 * consistency of crew data across the terminal, the store and the simulator adapter.
 */

const ns = require('./load');
const DataSimulator = require('../../js/data-simulator.js');
const { createShipStore, createManualClock } = ns.shipState;

const START = Date.UTC(2122, 5, 2, 8, 0, 0);

function setup(level = 'COMMANDER') {
    const session = ns.privilege.createSession({ level });
    const clock = createManualClock(START);
    const store = createShipStore({ clock });
    const registry = ns.registry.createRegistry();
    ns.systemCommands.register(registry);
    ns.crewCommands.register(registry, store, session);
    ns.statusCommands.register(registry, store);
    ns.logCommands.register(registry, store);
    const engine = ns.engine.createEngine({
        registry,
        authorize: (required) => ns.privilege.authorize(session, required)
    });
    return { session, store, engine, registry, clock, sim: new DataSimulator({ store, clock }) };
}

const textOf = (result) => result.blocks.map((b) => {
    if (b.type === 'table') return b.rows.map((r) => r.join(' ')).join('\n');
    if (b.type === 'authorization') return `ACCESS RESTRICTED. REQUIRED PRIVILEGE: ${b.required} CURRENT PRIVILEGE: ${b.current}`;
    return b.text || (b.lines || []).join('\n');
}).join('\n');

describe('name matching', () => {
    const { store } = setup();
    const members = store.snapshot('crew').state.members;
    const match = (q) => ns.crewModel.matchMembers(members, q);

    test('an exact name matches in any case', () => {
        expect(match('ripley')).toEqual({ kind: 'exact', matches: [expect.objectContaining({ name: 'RIPLEY' })] });
    });

    test('a personnel identifier or crew id matches exactly', () => {
        const id = members.find((m) => m.name === 'RIPLEY').personnelId;
        expect(match(id).kind).toBe('exact');
        expect(match('CREW002').kind).toBe('exact');
    });

    test('a partial name that is unambiguous matches', () => {
        expect(match('RIP').kind).toBe('partial');
        expect(match('RIP').matches[0].name).toBe('RIPLEY');
    });

    test('a partial name matching several members is ambiguous, and lists them', () => {
        const result = match('A');
        expect(result.kind).toBe('ambiguous');
        expect(result.matches.map((m) => m.name)).toEqual(expect.arrayContaining(['ASH', 'DALLAS', 'PARKER']));
        expect(match('PA').kind).toBe('partial');
    });

    test('an empty query names nobody', () => {
        expect(match('   ').kind).toBe('none');
    });

    test('a name that matches nobody is none', () => {
        expect(match('GALLEY').kind).toBe('none');
    });
});

describe('CREW manifest and CREW ALL', () => {
    test('CREW lists every personnel record, numbered, with the record count', () => {
        const { engine } = setup();
        const result = engine.execute('CREW');
        const table = result.blocks.find((b) => b.type === 'table');
        expect(table.rows).toHaveLength(8);
        expect(table.rows[0][0]).toBe('01');
        expect(textOf(result)).toContain('PERSONNEL RECORDS: 8');
    });

    test('CREW ALL adds status and location to every row', () => {
        const { engine } = setup();
        const table = engine.execute('CREW ALL').blocks.find((b) => b.type === 'table');
        expect(table.columns).toEqual(['NO', 'NAME', 'POSITION', 'STATUS', 'LOCATION']);
    });

    test('CREW ALL refuses arguments with usage text', () => {
        const { engine } = setup();
        expect(engine.execute('CREW ALL NOW').blocks[0].text).toContain('USAGE: CREW ALL');
    });
});

describe('CREW [NAME]: the personnel record', () => {
    test('an officer sees the full record, including medical status and clearance', () => {
        const { engine } = setup('OFFICER');
        const text = textOf(engine.execute('CREW RIPLEY'));
        expect(text).toContain('PERSONNEL RECORD');
        expect(text).toContain('NAME ..');
        expect(text).toContain('WARRANT OFFICER');
        expect(text).toContain('MEDICAL STATUS');
        expect(text).toContain('SECURITY CLEARANCE');
        expect(text).toContain('RECORD COMPLETE.');
    });

    test('a crew-level session sees the basic record, with sensitive fields withheld and an authorization block', () => {
        const { engine } = setup('CREW');
        const result = engine.execute('CREW RIPLEY');
        const text = textOf(result);
        expect(text).toContain('WARRANT OFFICER');
        expect(text).not.toContain('MEDICAL STATUS');
        expect(text).not.toContain('SECURITY CLEARANCE');
        const block = result.blocks.find((b) => b.type === 'authorization');
        expect(block).toEqual({ type: 'authorization', required: 'OFFICER', current: 'CREW' });
    });

    test('an unknown name is an error with the wording from the plan', () => {
        const { engine } = setup();
        const result = engine.execute('CREW GALLEY');
        expect(result.status).toBe('error');
        expect(textOf(result)).toContain('NO CREW RECORD MATCHES "GALLEY".');
    });

    test('an ambiguous name shows a selection list instead of a record', () => {
        const { engine } = setup();
        const result = engine.execute('CREW A');
        expect(result.blocks[0].text).toBe('ERROR: MULTIPLE RECORDS FOUND.');
        expect(textOf(result)).toContain('MATCHING PERSONNEL:');
    });

    test('a record for jones the cat is a personnel record like the others', () => {
        const { engine } = setup('OFFICER');
        expect(textOf(engine.execute('CREW JONES'))).toContain('SHIP CAT');
    });
});

describe('CREW STATUS, LOCATION, BIOMETRICS and RECORD', () => {
    test('CREW STATUS lists every member with status and location', () => {
        const { engine } = setup();
        const table = engine.execute('CREW STATUS').blocks.find((b) => b.type === 'table');
        expect(table.columns).toEqual(['NAME', 'STATUS', 'LOCATION']);
    });

    test('CREW STATUS RIPLEY shows that member\'s status line', () => {
        const { engine } = setup();
        expect(textOf(engine.execute('CREW STATUS RIPLEY'))).toContain('STATUS ..');
    });

    test('CREW LOCATION lists locations, and CREW LOCATION RIPLEY gives one', () => {
        const { engine } = setup();
        expect(engine.execute('CREW LOCATION').blocks.find((b) => b.type === 'table')).toBeDefined();
        expect(textOf(engine.execute('CREW LOCATION RIPLEY'))).toContain('ENGINEERING');
    });

    test('CREW BIOMETRICS needs officer and shows the vitals', () => {
        const denied = setup('CREW').engine.execute('CREW BIOMETRICS RIPLEY');
        expect(denied.blocks[0].type).toBe('authorization');
        const text = textOf(setup('OFFICER').engine.execute('CREW BIOMETRICS RIPLEY'));
        expect(text).toContain('HEART RATE');
        expect(text).toContain('OXYGEN SATURATION');
    });

    test('CREW RECORD is the full record and needs officer', () => {
        expect(setup('CREW').engine.execute('CREW RECORD RIPLEY').blocks[0].type).toBe('authorization');
        expect(textOf(setup('OFFICER').engine.execute('CREW RECORD RIPLEY'))).toContain('PERSONNEL RECORD');
    });

    test('CREW BIOMETRICS without a name shows usage text', () => {
        const { engine } = setup('OFFICER');
        expect(textOf(engine.execute('CREW BIOMETRICS'))).toContain('CREW BIOMETRICS NAME');
    });
});

describe('the crew model is the one source', () => {
    test('counts are computed in one place and match the STATUS report', () => {
        const { store, engine } = setup();
        const counts = ns.crewModel.counts(store.snapshot('crew').state.members);
        const status = textOf(engine.execute('STATUS'));
        expect(status).toContain(`CREW: ${counts.active} ACTIVE / ${counts.synthetic} SYNTHETIC / ${counts.resting} RESTING`);
    });

    test('positions, statuses and locations match between the terminal and the simulator adapter', () => {
        const { engine, sim } = setup();
        const table = engine.execute('CREW ALL').blocks.find((b) => b.type === 'table');
        const adapter = sim.generateCrewData();
        table.rows.forEach((row) => {
            const member = adapter.find((m) => m.name === row[1]);
            // The adapter lists the crew complement only; the animal record is a personnel record.
            if (!member) {
                expect(row[1]).toBe('JONES');
                return;
            }
            expect(member.role).toBe(row[2]);
            expect(member.status.toUpperCase()).toBe(row[3]);
            expect(member.location).toBe(row[4]);
        });
    });
});

describe('moving a crew member changes every reader and the log', () => {
    test('the crew subsystem\'s own operation moves Ripley; terminal, adapter and log all show it', () => {
        const { store, engine, sim } = setup('OFFICER');
        store.operate('crew', 'moveMember', { id: 'CREW002', location: 'BRIDGE' }, 'crew');
        expect(textOf(engine.execute('CREW LOCATION RIPLEY'))).toContain('BRIDGE');
        expect(sim.generateCrewData().find((m) => m.name === 'RIPLEY').location).toBe('BRIDGE');
        expect(textOf(engine.execute('LOG CREW'))).toContain('RIPLEY MOVED TO BRIDGE');
    });

    test('an unknown member id is refused and changes nothing', () => {
        const { store } = setup();
        const before = store.snapshot('crew').state.members;
        expect(() => store.operate('crew', 'moveMember', { id: 'CREW999', location: 'BRIDGE' }, 'crew')).toThrow();
        expect(store.snapshot('crew').state.members).toEqual(before);
        expect(store.events()).toEqual([]);
    });
});

describe('registration', () => {
    test('each CREW command is registered with usage and description', () => {
        const { registry } = setup();
        ['CREW', 'CREW ALL', 'CREW STATUS', 'CREW BIOMETRICS', 'CREW LOCATION', 'CREW RECORD'].forEach((name) => {
            const def = registry.get(name);
            expect(def).not.toBeNull();
            expect(def.usage).toEqual(expect.any(String));
            expect(def.description.length).toBeGreaterThan(0);
        });
    });
});
