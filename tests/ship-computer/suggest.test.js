'use strict';

/**
 * Suggestions: generated from command metadata, filtered by permission, ranked, completed
 * only when unambiguous, did-you-mean for unknown input, and related commands.
 */

const ns = require('./load');
const { suggest, complete, didYouMean, relatedBlocks, candidatesFor } = ns.suggest;
const { createShipStore, createManualClock } = ns.shipState;

const START = Date.UTC(2122, 5, 2, 8, 0, 0);
const permitAll = () => null;
const denyCorporate = (required) => (required === 'CORPORATE' ? { required, current: 'COMMANDER' } : null);

function registry() {
    const r = ns.registry.createRegistry();
    ns.systemCommands.register(r);
    ns.navigationCommands.register(r, createShipStore({ clock: createManualClock(START) }));
    r.register({ name: 'CREW', description: 'CREW MANIFEST.', usage: 'CREW', handler: () => [] });
    r.register({ name: 'CREW ALL', description: 'FULL MANIFEST.', usage: 'CREW ALL', handler: () => [] });
    r.register({ name: 'CREW STATUS', description: 'STATUS.', usage: 'CREW STATUS', handler: () => [] });
    r.register({ name: 'SPECIAL ORDER 937', description: 'RESTRICTED.', usage: 'SPECIAL ORDER 937', privilege: 'CORPORATE', handler: () => [] });
    r.register({ name: 'ENGINEERING', description: 'OVERVIEW.', usage: 'ENGINEERING', related: ['ENGINEERING REACTOR', 'ENGINEERING POWER'], handler: () => [] });
    r.register({ name: 'ENGINEERING REACTOR', description: 'REACTOR.', usage: 'ENGINEERING REACTOR', handler: () => [] });
    r.register({ name: 'ENGINEERING POWER', description: 'POWER.', usage: 'ENGINEERING POWER', handler: () => [] });
    return r;
}

const names = (list) => list.map((c) => c.name);

describe('suggestions: matching and ranking', () => {
    test('typing a prefix offers the commands it begins', () => {
        const c = candidatesFor(registry(), null);
        expect(names(suggest(c, 'CREW', permitAll))).toEqual(['CREW', 'CREW ALL', 'CREW STATUS']);
    });

    test('suggestions narrow as more is typed', () => {
        const c = candidatesFor(registry(), null);
        expect(names(suggest(c, 'CREW S', permitAll))).toEqual(['CREW STATUS']);
    });

    test('an exact name ranks first, then shorter names', () => {
        const c = candidatesFor(registry(), null);
        expect(names(suggest(c, 'CREW', permitAll))[0]).toBe('CREW');
    });

    test('matching is case-insensitive and ignores extra spaces', () => {
        const c = candidatesFor(registry(), null);
        expect(names(suggest(c, '  crew   s', permitAll))).toEqual(['CREW STATUS']);
    });

    test('an empty input offers nothing', () => {
        expect(suggest(candidatesFor(registry(), null), '   ', permitAll)).toEqual([]);
    });

    test('a trailing space offers the next word of the commands that continue the input', () => {
        const c = candidatesFor(registry(), null);
        expect(names(suggest(c, 'ENGINEERING ', permitAll))).toEqual(['ENGINEERING POWER', 'ENGINEERING REACTOR']);
    });

    test('the list is capped, so it stays short', () => {
        const big = Array.from({ length: 20 }, (_, i) => ({ name: `TEST ${i}`, description: '', usage: '', privilege: 'CREW' }));
        expect(suggest(big, 'TEST', permitAll).length).toBe(8);
    });

    test('suggestions carry the description, so a short line can be shown beside each', () => {
        const c = candidatesFor(registry(), null);
        expect(suggest(c, 'CREW S', permitAll)[0].description).toBe('STATUS.');
    });
});

describe('suggestions: permissions', () => {
    test('a command the session may not use is not offered', () => {
        const c = candidatesFor(registry(), null);
        expect(names(suggest(c, 'SPECIAL', denyCorporate))).toEqual([]);
        expect(names(suggest(c, 'SPECIAL', permitAll))).toEqual(['SPECIAL ORDER 937']);
    });
});

describe('suggestions: arguments from known names', () => {
    test('crew names are offered as CREW arguments, from the roster', () => {
        const store = createShipStore({ clock: createManualClock(START) });
        const c = candidatesFor(registry(), store);
        expect(names(suggest(c, 'CREW R', permitAll))).toEqual(['CREW RIPLEY']);
    });

    test('subsystem names are offered after LOG', () => {
        const store = createShipStore({ clock: createManualClock(START) });
        const c = candidatesFor(registry(), store);
        expect(names(suggest(c, 'LOG SEC', permitAll))).toEqual(['LOG SECURITY']);
    });
});

describe('Tab completion', () => {
    test('completes when exactly one command matches', () => {
        const c = candidatesFor(registry(), null);
        expect(complete(c, 'CREW S', permitAll)).toEqual({ text: 'CREW STATUS', completed: true });
    });

    test('does not complete an ambiguous match', () => {
        const c = candidatesFor(registry(), null);
        expect(complete(c, 'CREW', permitAll)).toEqual({ text: 'CREW', completed: false });
    });

    test('does not complete to a command the session may not use', () => {
        const c = candidatesFor(registry(), null);
        expect(complete(c, 'SPECIAL', denyCorporate)).toEqual({ text: 'SPECIAL', completed: false });
    });
});

describe('did you mean', () => {
    test('an unknown command that begins a family of commands offers that family', () => {
        const c = candidatesFor(registry(), null);
        const near = names(didYouMean(c, 'NAVIGA', permitAll));
        expect(near.length).toBe(3);
        expect(near[0]).toBe('NAVIGATION');
    });

    test('a near miss is offered by spelling distance', () => {
        const c = candidatesFor(registry(), null);
        expect(names(didYouMean(c, 'CRWE', permitAll))).toContain('CREW');
    });

    test('nothing close gives nothing', () => {
        const c = candidatesFor(registry(), null);
        expect(didYouMean(c, 'XYZZYPLUGH', permitAll)).toEqual([]);
    });

    test('the engine\'s unknown-command error uses the plan\'s structure and offers the near commands', () => {
        const r = registry();
        const engine = ns.engine.createEngine({ registry: r });
        const result = engine.execute('CRWE');
        expect(result.status).toBe('unknown');
        const text = result.blocks.map((b) => b.text).join('\n');
        expect(text).toContain('COMMAND NOT RECOGNIZED.');
        expect(text).toContain('UNKNOWN COMMAND: CRWE');
        expect(text).toContain('DID YOU MEAN:');
        expect(text).toContain('ENTER HELP FOR AVAILABLE COMMANDS.');
    });
});

describe('related commands', () => {
    test('after ENGINEERING, the related commands come from its metadata', () => {
        const r = registry();
        const blocks = relatedBlocks(r, 'ENGINEERING');
        expect(blocks[0].text).toBe('RELATED COMMANDS:');
        expect(blocks.slice(1).map((b) => b.text)).toEqual(['ENGINEERING REACTOR', 'ENGINEERING POWER']);
    });

    test('a command with no related list shows nothing', () => {
        expect(relatedBlocks(registry(), 'CREW')).toEqual([]);
    });
});
