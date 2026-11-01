/**
 * Versioned persistence: the save format, reading a save back, and the browser storage it sits in.
 * Pure apart from the storage wrapper, which takes its backend as a getter so tests can pass a fake.
 *
 * A save is JSON in an envelope: { format, version, payload }. Infinite and NaN numbers, which
 * JSON cannot hold, are written as { "$number": "Infinity" } and read back as numbers.
 *
 * A save that is unreadable, from another version, or cannot be built never throws. The caller gets
 * no value and a message for the terminal, and starts from the initial state.
 *
 * @typedef {{type: 'error', text: string}} NoticeBlock
 */
(function (root) {
    const ns = root.NostromoShipComputer = root.NostromoShipComputer || {};

    const FORMAT = 'nostromo-save';
    const SAVE_VERSION = 1;

    function replacer(key, value) {
        if (typeof value === 'number' && !Number.isFinite(value)) return { $number: String(value) };
        return value;
    }

    function reviver(key, value) {
        if (value && typeof value === 'object' && !Array.isArray(value)
            && Object.keys(value).length === 1 && typeof value.$number === 'string') {
            return Number(value.$number);
        }
        return value;
    }

    /** @returns {string} */
    function encode(value) {
        return JSON.stringify(value, replacer);
    }

    /** Throws on text that is not JSON. */
    function decode(text) {
        return JSON.parse(text, reviver);
    }

    /** @returns {string} the save text for a payload */
    function encodeSave(payload) {
        return encode({ format: FORMAT, version: SAVE_VERSION, payload });
    }

    /**
     * Read a save back. Never throws.
     * @param {string} text
     * @returns {{ok: true, payload: *} | {ok: false, problem: 'corrupt'} | {ok: false, problem: 'version', found: *}}
     */
    function readSave(text) {
        let envelope;
        try {
            envelope = decode(text);
        } catch (err) {
            return { ok: false, problem: 'corrupt' };
        }
        if (!envelope || typeof envelope !== 'object' || envelope.format !== FORMAT || !('payload' in envelope)) {
            return { ok: false, problem: 'corrupt' };
        }
        if (envelope.version !== SAVE_VERSION) {
            return { ok: false, problem: 'version', found: envelope.version };
        }
        return { ok: true, payload: envelope.payload };
    }

    /**
     * The message the terminal shows when a save cannot be used. Plain words only, never exception text.
     * @param {string} label    what was saved, for example SAVED SIMULATION
     * @param {string} outcome  what happened instead, for example INITIAL STATE RESTORED.
     * @param {'corrupt'|'version'} problem
     * @param {*} [found]       the version the save carries, when it is another version
     * @returns {NoticeBlock[]}
     */
    function saveNotice(label, outcome, problem, found) {
        const text = problem === 'version'
            ? `${label} IS VERSION ${found}; THIS COMPUTER READS VERSION ${SAVE_VERSION}. ${outcome}`
            : `${label} IS UNREADABLE. ${outcome}`;
        return [{ type: 'error', text }];
    }

    /**
     * Open a saved payload, or say why it cannot be used. Never throws.
     * @param {string|null} text  the saved text, or null when nothing is saved
     * @param {{label: string, outcome: string, build: (payload: *) => *}} options
     *   build turns a payload into the live value and throws if the payload does not fit
     * @returns {{value: *, notices: NoticeBlock[]}}  value is null when the caller must start fresh
     */
    function loadSaved(text, options) {
        if (text === null || text === undefined) return { value: null, notices: [] };
        const read = readSave(text);
        if (!read.ok) {
            return { value: null, notices: saveNotice(options.label, options.outcome, read.problem, read.found) };
        }
        try {
            return { value: options.build(read.payload), notices: [] };
        } catch (err) {
            return { value: null, notices: saveNotice(options.label, options.outcome, 'corrupt') };
        }
    }

    /**
     * Browser storage that may be missing, blocked, or full. Reads give null and writes give false
     * instead of throwing, so the session simply does not persist.
     * @param {() => {getItem: Function, setItem: Function}} getBackend  returns the storage object, or throws
     */
    function createStorage(getBackend) {
        function backend() {
            try {
                return getBackend() || null;
            } catch (err) {
                return null;
            }
        }
        return {
            read(key) {
                const store = backend();
                if (!store) return null;
                try {
                    return store.getItem(key);
                } catch (err) {
                    return null;
                }
            },
            write(key, text) {
                const store = backend();
                if (!store) return false;
                try {
                    store.setItem(key, text);
                    return true;
                } catch (err) {
                    return false;
                }
            }
        };
    }

    ns.persistence = {
        FORMAT, SAVE_VERSION, encode, decode, encodeSave, readSave, loadSaved, createStorage
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.persistence;
    }
})(typeof window !== 'undefined' ? window : globalThis);
