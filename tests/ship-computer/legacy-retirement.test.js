'use strict';

/**
 * Retiring the legacy responders. Every answer the old responder gave is now a registered command,
 * or one of the words retired on purpose. The restricted words keep their wording and privilege.
 * The old code and its stored progress are gone, and nothing still refers to them.
 */

const fs = require('fs');
const path = require('path');
const ns = require('./load');
const { createShipStore, createManualClock } = ns.shipState;
const { createInputHistory } = ns.inputHistory;

const ROOT = path.join(__dirname, '../..');

// The words the old responder answered, as they were typed.
const OLD_ANSWERS = [
    'HELLO', 'HI', 'STATUS', 'REPORT', 'WHO ARE YOU', 'WHAT IS YOUR MISSION', 'SYSTEM', 'LOGS',
    'CREW', 'JONES', 'CAT', 'ASH', 'RIPLEY', 'DALLAS', 'KANE', 'LAMBERT', 'PARKER', 'BRETT',
    'MISSION', 'INTERFACE 2037', 'SPECIAL ORDER 937', 'OVERRIDE', 'DESTRUCT'
];

// Retired on purpose: LOG replaces LOGS, and crew are asked for as CREW <NAME>. REPORT is still a command;
// only its one-line answer was retired, in favour of the full report.
const RETIRED = ['LOGS', 'JONES', 'CAT', 'ASH', 'RIPLEY', 'DALLAS', 'KANE', 'LAMBERT', 'PARKER', 'BRETT'];

function fullRegistry(store, session) {
    const registry = ns.registry.createRegistry();
    ns.systemCommands.register(registry);
    ns.accessCommands.register(registry, session);
    ns.restrictedCommands.register(registry);
    ns.logCommands.register(registry, store);
    ns.crewCommands.register(registry, store, session);
    ns.lifeSupportCommands.register(registry, store);
    ns.navigationCommands.register(registry, store, session);
    ns.shipCommands.register(registry, store, { firmware: 'TEST' });
    ns.missionCommands.register(registry, store);
    ns.cargoCommands.register(registry, store);
    ns.reportCommands.register(registry, store, session);
    ns.engineeringCommands.register(registry, store);
    ns.statusCommands.register(registry, store);
    return registry;
}

function engineFor(level) {
    const session = ns.privilege.createSession({ level });
    const store = createShipStore({ clock: createManualClock(Date.UTC(2122, 5, 2, 8, 0, 0)) });
    const registry = fullRegistry(store, session);
    const engine = ns.engine.createEngine({
        registry,
        authorize: (required) => ns.privilege.authorize(session, required)
    });
    return { engine, registry, store };
}

const textOf = (result) => result.blocks.map((b) => b.text || '').join('\n');

describe('legacy retirement: every old answer has a home', () => {
    test('each word the old responder answered is a command, or a retired word', () => {
        const { registry } = engineFor('COMMANDER');
        OLD_ANSWERS.filter((word) => RETIRED.indexOf(word) === -1).forEach((word) => {
            expect({ word, command: registry.match(word.split(' ')) !== null }).toEqual({ word, command: true });
        });
    });

    test('a retired word is refused like any unknown input', () => {
        const { engine } = engineFor('COMMANDER');
        RETIRED.forEach((word) => expect(engine.execute(word).status).toBe('unknown'));
    });

    test('HI and HELLO give the same greeting', () => {
        const { engine } = engineFor('CREW');
        expect(textOf(engine.execute('HELLO'))).toBe('INTERFACE 2037 READY FOR INQUIRY.');
        expect(textOf(engine.execute('HI'))).toBe('INTERFACE 2037 READY FOR INQUIRY.');
    });

    test('WHAT IS YOUR MISSION answers from the ship data, not a fixed sentence', () => {
        const { engine } = engineFor('CREW');
        expect(textOf(engine.execute('WHAT IS YOUR MISSION')))
            .toBe('COMMERCIAL TOWING VEHICLE NOSTROMO. CREW: 7. CARGO: REFINERY.');
    });
});

describe('legacy retirement: restricted words keep their privilege and wording', () => {
    test('OVERRIDE and DESTRUCT need corporate directives; INTERFACE 2037 needs an officer', () => {
        const { registry } = engineFor('COMMANDER');
        expect(registry.get('OVERRIDE').privilege).toBe(ns.privilege.OPERATIONS.CORPORATE_DIRECTIVES);
        expect(registry.get('DESTRUCT').privilege).toBe(ns.privilege.OPERATIONS.CORPORATE_DIRECTIVES);
        expect(registry.get('INTERFACE 2037').privilege).toBe(ns.privilege.OPERATIONS.CREW_RECORDS);
    });

    test('a session without the privilege gets an authorization response, not the wording', () => {
        const { engine } = engineFor('COMMANDER');
        const result = engine.execute('DESTRUCT');
        expect(result.blocks.map((b) => b.type)).toContain('authorization');
        expect(textOf(result)).not.toContain('SELF-DESTRUCT');
    });

    test('a session with the privilege gets the wording, marked urgent', () => {
        const { engine } = engineFor('CORPORATE');
        const result = engine.execute('DESTRUCT');
        expect(textOf(result)).toBe('WARNING: SELF-DESTRUCT SEQUENCE. MANUAL ACTIVATION REQUIRED AT EMERGENCY CONSOLE.');
        expect(result.blocks[0].tone).toBe('urgent');
    });

    test('INTERFACE 2037 keeps its pointer to SPECIAL ORDER 937 for an officer', () => {
        const { engine } = engineFor('OFFICER');
        expect(textOf(engine.execute('INTERFACE 2037'))).toBe('ACCESSING SECURE FILE... [SEE: SPECIAL ORDER 937]');
    });

    test('SPECIAL ORDER 937 still needs corporate authority', () => {
        expect(textOf(engineFor('COMMANDER').engine.execute('SPECIAL ORDER 937'))).not.toContain('PRIORITY ONE');
        expect(textOf(engineFor('CORPORATE').engine.execute('SPECIAL ORDER 937'))).toContain('PRIORITY ONE');
    });
});

describe('legacy retirement: the old code is gone', () => {
    const FORBIDDEN = ['legacy-responses', 'NostromoConsole', 'ns.legacy', 'consoleSystem', 'js/console.js'];
    const SOURCES = [
        'index.html', 'scripts/build.js', 'tests/ship-computer/load.js',
        ...fs.readdirSync(path.join(ROOT, 'js')).filter((f) => f.endsWith('.js')).map((f) => `js/${f}`),
        ...fs.readdirSync(path.join(ROOT, 'js/ship-computer')).map((f) => `js/ship-computer/${f}`)
    ];

    test('the legacy responder and the Dashboard console file are deleted', () => {
        expect(fs.existsSync(path.join(ROOT, 'js/ship-computer/legacy-responses.js'))).toBe(false);
        expect(fs.existsSync(path.join(ROOT, 'js/console.js'))).toBe(false);
    });

    test('nothing still refers to them or to the old unlock progress', () => {
        SOURCES.filter((file) => fs.existsSync(path.join(ROOT, file))).forEach((file) => {
            const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
            FORBIDDEN.forEach((word) => {
                if (text.indexOf(word) !== -1) throw new Error(`${file} still mentions ${word}`);
            });
        });
    });
});

describe('legacy retirement: the engine has no fallback', () => {
    test('input the registry does not know is unknown, however old answers would have read it', () => {
        const { engine } = engineFor('COMMANDER');
        expect(engine.execute('WHAT IS THE CARGO').status).toBe('unknown');
    });
});

describe('legacy retirement: returning users', () => {
    test('the old unlock progress is removed by the storage wrapper, and a missing store does not fail', () => {
        const backend = new Map([['nostromoSession', '{"unlockedSections":["VAULT"]}']]);
        const storage = ns.persistence.createStorage(() => ({
            getItem: (k) => (backend.has(k) ? backend.get(k) : null),
            setItem: (k, v) => backend.set(k, String(v)),
            removeItem: (k) => backend.delete(k)
        }));
        expect(storage.remove('nostromoSession')).toBe(true);
        expect(backend.has('nostromoSession')).toBe(false);
        const blocked = ns.persistence.createStorage(() => { throw new Error('blocked'); });
        expect(blocked.remove('nostromoSession')).toBe(false);
    });
});

describe('legacy retirement: extra words are refused on the greetings', () => {
    test.each(['HELLO WORLD', 'HI THERE', 'WHO ARE YOU NOW', 'SYSTEM CHECK', 'WHAT IS YOUR MISSION NOW'])('"%s" gives a usage error', (line) => {
        const { engine } = engineFor('COMMANDER');
        const result = engine.execute(line);
        expect(result.blocks[0]).toEqual(expect.objectContaining({ type: 'error' }));
        expect(result.blocks[0].text).toMatch(/^USAGE: /);
    });
});
