'use strict';

/**
 * Input history: chronological entries with times, navigation with a kept draft, a limit,
 * one duplicate policy, and the HISTORY command. No DOM.
 */

const ns = require('./load');
const { createInputHistory } = ns.inputHistory;

describe('input history: recording', () => {
    test('records commands in order, with the time each was entered', () => {
        const h = createInputHistory({ now: () => 1000 });
        h.add('STATUS');
        h.add('CREW');
        expect(h.entries()).toEqual([{ text: 'STATUS', time: 1000 }, { text: 'CREW', time: 1000 }]);
    });

    test('an empty or blank entry is not recorded', () => {
        const h = createInputHistory();
        h.add('');
        h.add('   ');
        expect(h.entries()).toEqual([]);
    });

    test('consecutive duplicates collapse: the same command twice in a row is kept once', () => {
        const h = createInputHistory();
        h.add('STATUS');
        h.add('STATUS');
        h.add('CREW');
        h.add('STATUS');
        expect(h.entries().map((e) => e.text)).toEqual(['STATUS', 'CREW', 'STATUS']);
    });

    test('the limit drops the oldest entries first', () => {
        const h = createInputHistory({ limit: 3 });
        ['A', 'B', 'C', 'D'].forEach((c) => h.add(c));
        expect(h.entries().map((e) => e.text)).toEqual(['B', 'C', 'D']);
    });

    test('a limit below one is refused', () => {
        expect(() => createInputHistory({ limit: 0 })).toThrow(/limit/);
    });
});

describe('input history: navigation', () => {
    test('up walks back from the newest command, and down walks forward again', () => {
        const h = createInputHistory();
        ['A', 'B', 'C'].forEach((c) => h.add(c));
        expect(h.previous('')).toBe('C');
        expect(h.previous('')).toBe('B');
        expect(h.previous('')).toBe('A');
        expect(h.previous('')).toBe('A');
        expect(h.next()).toBe('B');
    });

    test('the text being typed is kept as a draft and restored when walking back down past the newest', () => {
        const h = createInputHistory();
        h.add('STATUS');
        expect(h.previous('CRE')).toBe('STATUS');
        expect(h.next()).toBe('CRE');
    });

    test('down with nothing to walk back to returns the draft unchanged', () => {
        const h = createInputHistory();
        h.add('STATUS');
        expect(h.next()).toBe('');
    });

    test('adding a command resets navigation to the newest end', () => {
        const h = createInputHistory();
        h.add('A');
        h.add('B');
        h.previous('');
        h.previous('');
        h.add('C');
        expect(h.previous('')).toBe('C');
    });

    test('an empty history gives back the draft', () => {
        const h = createInputHistory();
        expect(h.previous('X')).toBe('X');
    });
});

describe('input history: the HISTORY command', () => {
    test('lists the entries with their times, newest last', () => {
        const registry = ns.registry.createRegistry();
        const h = createInputHistory({ now: () => Date.UTC(2122, 5, 2, 8, 0, 0) });
        ns.inputCommands.register(registry, h);
        h.add('STATUS');
        h.add('CREW');
        const result = ns.engine.createEngine({ registry }).execute('HISTORY');
        const table = result.blocks.find((b) => b.type === 'table');
        expect(table.columns).toEqual(['TIME', 'COMMAND']);
        expect(table.rows.map((r) => r[1])).toEqual(['STATUS', 'CREW']);
    });

    test('an empty history says so', () => {
        const registry = ns.registry.createRegistry();
        ns.inputCommands.register(registry, createInputHistory());
        const result = ns.engine.createEngine({ registry }).execute('HISTORY');
        expect(result.blocks[0].text).toBe('NO COMMANDS IN HISTORY.');
    });

    test('HISTORY refuses arguments with usage text', () => {
        const registry = ns.registry.createRegistry();
        ns.inputCommands.register(registry, createInputHistory());
        expect(ns.engine.createEngine({ registry }).execute('HISTORY NOW').blocks[0].text).toContain('USAGE: HISTORY');
    });
});
