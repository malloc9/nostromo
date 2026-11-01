'use strict';

/**
 * Versioned persistence: the save format, how a saved payload is read back, what a bad or
 * mismatched save does (a fresh start with a message, never an exception), and browser storage
 * that may be missing or refuse writes. No DOM: storage is a fake backend.
 */

const ns = require('./load');
const persistence = ns.persistence;

const { encode, decode, encodeSave, readSave, loadSaved, createStorage, SAVE_VERSION, FORMAT } = persistence;

describe('persistence: the save format', () => {
    test('infinite numbers survive a round trip, as the scenario uses them for open ranges', () => {
        const value = { min: -Infinity, max: Infinity, base: 5 };
        expect(decode(encode(value))).toEqual(value);
    });

    test('a save reads back to the payload it was made from', () => {
        const payload = { startedAt: 1, subsystems: { identity: { status: 'NOMINAL' } } };
        const read = readSave(encodeSave(payload));
        expect(read).toEqual({ ok: true, payload });
    });

    test('the save carries a format name and the version', () => {
        const envelope = decode(encodeSave({}));
        expect(envelope.format).toBe(FORMAT);
        expect(envelope.version).toBe(SAVE_VERSION);
    });
});

describe('persistence: reading a save', () => {
    test('text that is not JSON is corrupt', () => {
        expect(readSave('{not json')).toEqual({ ok: false, problem: 'corrupt' });
    });

    test('a file that is not one of ours is corrupt', () => {
        expect(readSave(encode({ format: 'something-else', version: SAVE_VERSION, payload: {} })))
            .toEqual({ ok: false, problem: 'corrupt' });
    });

    test('a save from another version is refused and reports that version', () => {
        expect(readSave(encode({ format: FORMAT, version: SAVE_VERSION + 1, payload: {} })))
            .toEqual({ ok: false, problem: 'version', found: SAVE_VERSION + 1 });
    });
});

describe('persistence: loading a saved payload', () => {
    const build = (payload) => ({ built: payload });

    test('with nothing saved there is no value and no message', () => {
        expect(loadSaved(null, { label: 'SAVED SIMULATION', outcome: 'INITIAL STATE RESTORED.', build }))
            .toEqual({ value: null, notices: [] });
    });

    test('a good save is built into a value with no message', () => {
        const text = encodeSave({ n: 1 });
        expect(loadSaved(text, { label: 'SAVED SIMULATION', outcome: 'INITIAL STATE RESTORED.', build }))
            .toEqual({ value: { built: { n: 1 } }, notices: [] });
    });

    test('a save that cannot be built is corrupt: no value, and a plain message', () => {
        const text = encodeSave({ n: 1 });
        const result = loadSaved(text, {
            label: 'SAVED SIMULATION',
            outcome: 'INITIAL STATE RESTORED.',
            build: () => { throw new TypeError('x is not a function at line 3'); }
        });
        expect(result.value).toBeNull();
        expect(result.notices).toEqual([{
            type: 'error',
            text: 'SAVED SIMULATION IS UNREADABLE. INITIAL STATE RESTORED.'
        }]);
        expect(result.notices[0].text).not.toMatch(/Error|TypeError|line/);
    });

    test('a save from another version says which version it is and what happened', () => {
        const text = encode({ format: FORMAT, version: 9, payload: {} });
        const result = loadSaved(text, { label: 'SAVED COMMAND HISTORY', outcome: 'HISTORY CLEARED.', build });
        expect(result.value).toBeNull();
        expect(result.notices).toEqual([{
            type: 'error',
            text: `SAVED COMMAND HISTORY IS VERSION 9; THIS COMPUTER READS VERSION ${SAVE_VERSION}. HISTORY CLEARED.`
        }]);
    });

    test('unreadable text gives the corrupt message', () => {
        const result = loadSaved('garbage', { label: 'SAVED SIMULATION', outcome: 'INITIAL STATE RESTORED.', build });
        expect(result.notices[0].text).toBe('SAVED SIMULATION IS UNREADABLE. INITIAL STATE RESTORED.');
    });
});

describe('persistence: browser storage', () => {
    function fakeBackend() {
        const items = new Map();
        return {
            getItem: (key) => (items.has(key) ? items.get(key) : null),
            setItem: (key, value) => { items.set(key, String(value)); },
            removeItem: (key) => { items.delete(key); }
        };
    }

    test('what is written is read back under the same key', () => {
        const backend = fakeBackend();
        const storage = createStorage(() => backend);
        expect(storage.write('k', 'v')).toBe(true);
        expect(storage.read('k')).toBe('v');
        expect(storage.read('other')).toBeNull();
    });

    test('storage that cannot be reached reads as empty and refuses writes, without throwing', () => {
        const storage = createStorage(() => { throw new Error('SecurityError: blocked'); });
        expect(storage.read('k')).toBeNull();
        expect(storage.write('k', 'v')).toBe(false);
    });

    test('storage that refuses a write (full or private) reports it without throwing', () => {
        const backend = fakeBackend();
        backend.setItem = () => { throw new Error('QuotaExceededError'); };
        const storage = createStorage(() => backend);
        expect(storage.write('k', 'v')).toBe(false);
    });
});
