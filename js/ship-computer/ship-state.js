/**
 * Ship state store: the single authoritative state of the ship.
 *
 * - Readings are pure functions of (definition, simulated time). Nothing random,
 *   nothing stored per read, so every reader at the same time sees the same value
 *   (drift policy: see ship-scenario.js).
 * - A subsystem's data changes only through its own operations. `operate` refuses
 *   any actor other than the owner, and runs the operation on a copy, so a failed
 *   operation changes nothing and notifies nobody.
 * - Reads return deep-frozen snapshots. Readers cannot write through them.
 * - Subscribers are told once per successful change and can unsubscribe.
 *
 * Cross-subsystem effects are not written directly. They must be events that the
 * owning subsystem handles, which arrive with the event log ticket (04).
 *
 * @typedef {{now: () => number}} Clock
 */
(function (root) {
    const ns = root.NostromoShipComputer = root.NostromoShipComputer || {};

    const HOUR_MS = 60 * 60 * 1000;

    /** Thrown when a subsystem is written by anything other than its owner. */
    class OwnershipError extends Error {
        constructor(message) {
            super(message);
            this.name = 'OwnershipError';
        }
    }

    /** A clock the tests can move. Time is a plain number of milliseconds. */
    function createManualClock(startMs) {
        let current = startMs;
        return {
            now: () => current,
            advance: (ms) => { current += ms; },
            set: (ms) => { current = ms; }
        };
    }

    function clone(value) {
        if (Array.isArray(value)) return value.map(clone);
        if (value && typeof value === 'object') {
            const out = {};
            Object.keys(value).forEach((key) => { out[key] = clone(value[key]); });
            return out;
        }
        return value;
    }

    function deepFreeze(value) {
        if (value && typeof value === 'object' && !Object.isFrozen(value)) {
            Object.freeze(value);
            Object.keys(value).forEach((key) => deepFreeze(value[key]));
        }
        return value;
    }

    /**
     * The drift policy in one function. See ship-scenario.js for the written version.
     * @param {Object} def  measurement definition
     * @param {number} elapsedMs  simulated time since the store started
     */
    function readMeasurement(def, elapsedMs) {
        const seconds = elapsedMs / 1000;
        let value = def.base + def.offset;
        if (def.amplitude) {
            value += def.amplitude * Math.sin((2 * Math.PI * seconds) / def.period + def.phase);
        }
        value -= def.decayPerHour * (elapsedMs / HOUR_MS);
        value = Math.min(def.max, Math.max(def.min, value));
        const factor = Math.pow(10, def.precision);
        return Math.round(value * factor) / factor;
    }

    /** Resolve every measurement definition inside a value to a number. */
    function readValue(node, elapsedMs) {
        if (Array.isArray(node)) return node.map((item) => readValue(item, elapsedMs));
        if (node && typeof node === 'object') {
            if (node.kind === 'measurement') return readMeasurement(node, elapsedMs);
            const out = {};
            Object.keys(node).forEach((key) => { out[key] = readValue(node[key], elapsedMs); });
            return out;
        }
        return node;
    }

    /**
     * Operations every subsystem supports. Each receives only the owner's own
     * private state, so it cannot reach into another subsystem.
     */
    const OPERATIONS = {
        addFault(state, args, now) {
            const code = String(args.code || '');
            if (!code) throw new Error('fault needs a code');
            if (state.faults.some((f) => f.code === code)) throw new Error(`fault already active: ${code}`);
            state.faults.push({ code, message: String(args.message || ''), since: now });
        },
        clearFault(state, args) {
            const index = state.faults.findIndex((f) => f.code === args.code);
            if (index === -1) throw new Error(`no active fault: ${args.code}`);
            state.faults.splice(index, 1);
        },
        setStatus(state, args) {
            if (!args.status) throw new Error('status needs a value');
            state.status = String(args.status);
        }
    };

    /**
     * @param {{clock?: Clock, scenario?: Object}} [options]
     */
    function createShipStore(options) {
        const opts = options || {};
        const clock = opts.clock || { now: () => Date.now() };
        const scenario = opts.scenario || ns.scenario.standardScenario();
        const startedAt = clock.now();

        const privates = {};
        Object.keys(scenario.subsystems).forEach((name) => {
            const def = scenario.subsystems[name];
            privates[name] = {
                status: def.status,
                fields: clone(def.fields),
                measurements: clone(def.measurements),
                faults: [],
                lastUpdated: startedAt
            };
        });

        const listeners = [];
        let version = 0;

        function elapsed() {
            return clock.now() - startedAt;
        }

        function snapshot(name) {
            const state = privates[name];
            if (!state) throw new Error(`unknown subsystem: ${name}`);
            const faults = state.faults.map((f) => ({ ...f }));
            return deepFreeze({
                name,
                status: faults.length ? 'WARNING' : state.status,
                state: readValue(state.fields, elapsed()),
                measurements: readValue(state.measurements, elapsed()),
                faults,
                lastUpdated: state.lastUpdated,
                operations: Object.keys(OPERATIONS)
            });
        }

        function snapshotAll() {
            const all = {};
            Object.keys(privates).forEach((name) => { all[name] = snapshot(name); });
            return all;
        }

        /**
         * Run an owner's operation. Only the owner may call it.
         * @param {string} name   subsystem that owns the data
         * @param {string} operation
         * @param {Object} args
         * @param {string} actor  subsystem making the request
         */
        function operate(name, operation, args, actor) {
            if (!privates[name]) throw new Error(`unknown subsystem: ${name}`);
            if (actor !== name) {
                throw new OwnershipError(`${actor} may not change ${name}`);
            }
            const op = OPERATIONS[operation];
            if (!op) throw new Error(`unknown operation: ${operation}`);

            const now = clock.now();
            const next = clone(privates[name]);
            op(next, args || {}, now);
            next.lastUpdated = now;

            privates[name] = next;
            version += 1;
            const event = { subsystem: name, operation, version, time: now };
            // The change is already committed, so one bad subscriber must not
            // hide it from the others or make this write look failed.
            listeners.slice().forEach((listener) => {
                try {
                    listener(event);
                } catch (err) {
                    console.error(err);
                }
            });
            return snapshot(name);
        }

        /**
         * @param {(event: {subsystem: string, operation: string, version: number, time: number}) => void} listener
         * @returns {() => void} unsubscribe
         */
        function subscribe(listener) {
            listeners.push(listener);
            return () => {
                const index = listeners.indexOf(listener);
                if (index !== -1) listeners.splice(index, 1);
            };
        }

        return {
            dataVersion: scenario.dataVersion,
            startedAt,
            now: () => clock.now(),
            operations: Object.keys(OPERATIONS),
            snapshot,
            snapshotAll,
            operate,
            subscribe,
            version: () => version
        };
    }

    ns.shipState = { createShipStore, createManualClock, OwnershipError, HOUR_MS };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.shipState;
    }
})(typeof window !== 'undefined' ? window : globalThis);
