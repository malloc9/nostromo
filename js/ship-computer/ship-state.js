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
    // Each operation may return an event description { type, severity, message }.
    // The store writes exactly one event for every successful operation that returns one.
    const OPERATIONS = {
        addFault(state, args, now) {
            const code = String(args.code || '');
            if (!code) throw new Error('fault needs a code');
            if (state.faults.some((f) => f.code === code)) throw new Error(`fault already active: ${code}`);
            const severity = args.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING';
            const message = String(args.message || code);
            // component names the part of the subsystem the fault is on (for example mainReactor).
            const component = args.component ? String(args.component) : null;
            state.faults.push({ code, message, severity, component, since: now });
            return {
                type: severity === 'CRITICAL' ? 'error' : 'warning',
                severity,
                message: `FAULT RAISED: ${message}`
            };
        },
        clearFault(state, args) {
            const index = state.faults.findIndex((f) => f.code === args.code);
            if (index === -1) throw new Error(`no active fault: ${args.code}`);
            const [cleared] = state.faults.splice(index, 1);
            return { type: 'status', severity: 'INFO', message: `FAULT CLEARED: ${cleared.message}` };
        },
        // Moves power between two subsystems. The validation is the engineering model's own rule.
        setAllocation(state, args) {
            const alloc = state.fields.allocation;
            const rules = state.fields.allocationRules;
            if (!alloc || !rules) throw new Error('only engineering allocates power');
            const percent = Number(args.percent);
            const problem = ns.engineeringModel.allocationProblem(alloc, rules, args.target, args.donor, percent);
            if (problem) throw new Error(problem);
            const from = alloc[args.target];
            alloc[args.target] = percent;
            alloc[args.donor] -= percent - from;
            const label = ns.engineeringModel.labelOf;
            return { type: 'status', severity: 'INFO', message: `POWER ALLOCATION: ${label(args.target)} ${from}% TO ${percent}%, FROM ${label(args.donor)}` };
        },

        // Changes the course. Only navigation has destinations; the change is logged by the caller's event.
        setCourse(state, args) {
            const destinations = state.fields.destinations;
            if (!destinations) throw new Error('only navigation has a course');
            const to = String(args.destination || '').toUpperCase();
            if (!Object.prototype.hasOwnProperty.call(destinations, to)) throw new Error(`unknown destination: ${to}`);
            if (to === state.fields.destination) throw new Error(`already on course for ${to}`);
            const from = state.fields.destination;
            state.fields.destination = to;
            // The arrival is counted from now: hours already travelled plus the destination's hours.
            state.fields.etaOffsetHours = Number(args.elapsedHours || 0) + destinations[to];
            return { type: 'navigation', severity: 'INFO', message: `COURSE CHANGED: ${from} TO ${to}` };
        },
        // Moves one crew member. Only the crew subsystem has members, and the change is logged.
        moveMember(state, args) {
            if (!Array.isArray(state.fields.members)) throw new Error('only crew has members');
            const member = state.fields.members.find((m) => m.id === args.id);
            if (!member) throw new Error(`no crew member: ${args.id}`);
            if (!args.location) throw new Error('move needs a location');
            member.location = String(args.location);
            return { type: 'crew', severity: 'INFO', message: `${member.name} MOVED TO ${member.location}` };
        },
        // Records one access request outcome: counts it, remembers it, and describes the event.
        recordAccessRequest(state, args) {
            if (typeof state.fields.accessRequests !== 'number') throw new Error('only security records access requests');
            if (['granted', 'refused', 'cancelled'].indexOf(args.outcome) === -1) throw new Error(`unknown outcome: ${args.outcome}`);
            state.fields.accessRequests += 1;
            state.fields.lastRequest = String(args.summary);
            return { type: 'security', severity: args.severity, message: String(args.message) };
        },
        setStatus(state, args) {
            if (!args.status) throw new Error('status needs a value');
            state.status = String(args.status);
            return { type: 'status', severity: 'INFO', message: `STATUS SET: ${state.status}` };
        },
        // Moves one reading by a fixed amount from now on. The script uses it for a rise in a reading;
        // the transition's own event describes the change, so this writes no event of its own.
        shiftMeasurement(state, args) {
            const def = state.measurements[args.key];
            if (!def || def.kind !== 'measurement') throw new Error(`no measurement: ${args.key}`);
            const by = Number(args.by);
            if (!Number.isFinite(by)) throw new Error('shift needs a number');
            def.offset += by;
            return null;
        }
    };

    // The parts of a subsystem that a fault can name. Each model owns its own list.
    function componentKeysFor(name) {
        if (name === 'engineering') return ns.engineeringModel.COMPONENTS.map((c) => c.key);
        if (name === 'lifeSupport') return ns.lifeSupportModel.COMPONENTS.map((c) => c.key);
        return null;
    }

    /**
     * @param {{clock?: Clock, scenario?: Object, scripted?: boolean}} [options]  scripted defaults to on
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
        // Threshold alerts are sampled on a one-second grid anchored at the start, so the
        // log is the same however often anything asks. sampledUpTo is the last grid point done.
        const SAMPLE_MS = 1000;
        let sampledUpTo = startedAt;
        let thresholdAlertsNow = new Map();
        let faultAlertsNow = new Map();

        // Scripted events fire at their own times, in order. A script that is off skips its entries as they pass.
        const script = (scenario.script || []).slice().sort((a, b) => a.at - b.at);
        let scriptNext = 0;
        let scriptOn = opts.scripted !== false;

        function elapsed() {
            return clock.now() - startedAt;
        }

        /** Append one event to the log. The log has no removal or edit path. */
        function appendEvent(time, event) {
            const entries = privates.eventLog.fields.entries;
            entries.push({
                id: entries.length + 1,
                time,
                type: event.type,
                subsystem: event.subsystem,
                severity: event.severity,
                message: event.message
            });
        }

        /** The readings the threshold rules use, at any simulation time. */
        function thresholdInputAt(time) {
            // Read only the five values the rules use. Sampling runs once a simulated second,
            // so it must not resolve whole subsystems each time.
            const at = time - startedAt;
            const read = (subsystem, key) => readMeasurement(privates[subsystem].measurements[key], at);
            const activeHumans = privates.crew.fields.members
                .filter((m) => m.type === 'human' && m.status === 'active').length;
            return {
                power: { generation: read('engineering', 'powerGeneration'), consumption: read('engineering', 'powerConsumption') },
                allocationWarnings: allocationWarnings(),
                lifeSupport: {
                    oxygen: read('lifeSupport', 'oxygen'),
                    co2: read('lifeSupport', 'co2'),
                    pressure: read('lifeSupport', 'pressure'),
                    temperature: read('lifeSupport', 'temperature')
                },
                navigation: { velocity: read('navigation', 'velocity') },
                activeCrew: activeHumans
            };
        }

        // Subsystems whose allocation is below their warning level now.
        function allocationWarnings() {
            const alloc = privates.engineering.fields.allocation;
            const rules = privates.engineering.fields.allocationRules;
            return Object.keys(rules)
                .filter((k) => rules[k].warnBelow !== undefined && alloc[k] < rules[k].warnBelow)
                .map((k) => ({ subsystem: k, value: alloc[k], warnBelow: rules[k].warnBelow }));
        }

        function thresholdAlertsAt(time) {
            return new Map(ns.alerts.thresholdAlerts(thresholdInputAt(time), time).map((a) => [a.id, a]));
        }

        function faultsByName() {
            const faultsBySubsystem = {};
            Object.keys(privates).forEach((name) => {
                faultsBySubsystem[name] = privates[name].faults;
            });
            return faultsBySubsystem;
        }

        /** Alerts as they stand now, from faults and readings. Reads nothing mutable. */
        function currentAlerts() {
            // Thresholds come from the last grid sample, the same state the log has recorded.
            return ns.alerts.faultAlerts(faultsByName())
                .concat(Array.from(thresholdAlertsNow.values()));
        }

        /** One "raised" event per alert that appeared, one "cleared" per alert that went. */
        function logTransitions(previous, current, time) {
            current.forEach((alert, id) => {
                if (!previous.has(id)) {
                    appendEvent(time, {
                        type: alert.severity === 'CRITICAL' ? 'error' : 'warning',
                        subsystem: alert.subsystem,
                        severity: alert.severity,
                        message: `ALERT RAISED: ${alert.message}`
                    });
                }
            });
            previous.forEach((alert, id) => {
                if (!current.has(id)) {
                    appendEvent(time, {
                        type: 'status',
                        subsystem: alert.subsystem,
                        severity: 'INFO',
                        message: `ALERT CLEARED: ${alert.message}`
                    });
                }
            });
        }

        /**
         * Evaluate threshold alerts at every grid point up to `until`, logging each
         * transition at its grid time. Calling this earlier or later changes nothing:
         * the same grid points are always evaluated in order.
         */
        function sampleThresholdsUntil(until) {
            while (sampledUpTo + SAMPLE_MS <= until) {
                sampledUpTo += SAMPLE_MS;
                const current = thresholdAlertsAt(sampledUpTo);
                logTransitions(thresholdAlertsNow, current, sampledUpTo);
                thresholdAlertsNow = current;
            }
        }

        /** Log fault alerts that appeared or cleared, at the time of the change. */
        function syncFaultAlerts(now) {
            const current = new Map(ns.alerts.faultAlerts(faultsByName()).map((a) => [a.id, a]));
            logTransitions(faultAlertsNow, current, now);
            faultAlertsNow = current;
        }

        /** Apply the scripted transitions due by `until`, then judge thresholds up to `until`. */
        function advance(until) {
            while (scriptNext < script.length && startedAt + script[scriptNext].at <= until) {
                const entry = script[scriptNext];
                scriptNext += 1;
                if (!scriptOn) continue;
                const time = startedAt + entry.at;
                const result = applyChanges(entry.changes, time);
                notify({
                    subsystem: entry.changes[0].subsystem,
                    operation: 'scripted',
                    version: result.version,
                    time,
                    notice: noticeFor(entry, time)
                });
            }
            sampleThresholdsUntil(until);
        }

        /** What the terminal prints for a scripted event: its readings as they stand at the event. */
        function noticeFor(entry, time) {
            const values = entry.notice.values.map((v) => ({
                label: v.label,
                value: v.measurement
                    ? readMeasurement(privates[v.subsystem].measurements[v.measurement], time - startedAt)
                    : privates[v.subsystem].fields[v.field],
                unit: v.unit
            }));
            return { time, source: entry.notice.source, level: entry.notice.level, headline: entry.notice.headline, values };
        }

        function notify(event) {
            // The change is already committed, so one bad subscriber must not
            // hide it from the others or make this write look failed.
            listeners.slice().forEach((listener) => {
                try {
                    listener(event);
                } catch (err) {
                    console.error(err);
                }
            });
        }

        function readSubsystem(name) {
            const state = privates[name];
            if (!state) throw new Error(`unknown subsystem: ${name}`);
            const faults = state.faults.map((f) => ({ ...f }));
            // The worst active fault sets the status; with no faults it is the base status.
            const worst = faults.some((f) => f.severity === 'CRITICAL') ? 'CRITICAL'
                : (faults.length ? 'WARNING' : state.status);
            return deepFreeze({
                name,
                status: worst,
                state: readValue(state.fields, elapsed()),
                measurements: readValue(state.measurements, elapsed()),
                faults,
                lastUpdated: state.lastUpdated,
                operations: Object.keys(OPERATIONS)
            });
        }

        function snapshot(name) {
            advance(clock.now());
            return readSubsystem(name);
        }

        function snapshotAll() {
            advance(clock.now());
            const all = {};
            Object.keys(privates).forEach((name) => { all[name] = readSubsystem(name); });
            return all;
        }

        /**
         * Apply one or more owner operations as a single transition at `time`. Every change is
         * checked and run on a copy first, so a refused change commits nothing. Each operation's
         * event is logged, and alerts are judged once the transition is in place.
         * @param {Array<{subsystem: string, operation: string, args?: Object}>} changes
         * @param {number} time
         * @returns {{version: number, time: number}}
         */
        function applyChanges(changes, time) {
            // Judge threshold readings up to this moment against the state before the change.
            sampleThresholdsUntil(time);
            const working = {};
            const described = [];
            changes.forEach((change) => {
                const name = change.subsystem;
                const args = change.args || {};
                if (!privates[name]) throw new Error(`unknown subsystem: ${name}`);
                const op = OPERATIONS[change.operation];
                if (!op) throw new Error(`unknown operation: ${change.operation}`);
                // Engineering component names belong to the engineering model; a typo must not
                // record a fault that no panel will ever show.
                const parts = componentKeysFor(name);
                if (parts && args.component && parts.indexOf(args.component) === -1) {
                    throw new Error(`unknown ${name} component: ${args.component}`);
                }
                if (!working[name]) working[name] = clone(privates[name]);
                const result = op(working[name], args, time);
                if (result) described.push({ ...result, subsystem: name });
            });

            Object.keys(working).forEach((name) => {
                working[name].lastUpdated = time;
                privates[name] = working[name];
            });
            version += changes.length;
            described.forEach((event) => appendEvent(time, event));
            syncFaultAlerts(time);
            // A change can move a threshold at this very moment (a power allocation does), so judge it now too.
            const atTime = thresholdAlertsAt(time);
            logTransitions(thresholdAlertsNow, atTime, time);
            thresholdAlertsNow = atTime;
            return { version, time };
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
            const now = clock.now();
            // Scripted events due by now fire first, so this change is applied after them.
            advance(now);
            const result = applyChanges([{ subsystem: name, operation, args }], now);
            notify({ subsystem: name, operation, version: result.version, time: now });
            return readSubsystem(name);
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

        /** The alert board every screen reads: overall status and the active alerts. */
        function alertBoard() {
            // Advance first, so the board never shows a threshold or scripted fault the log has not yet recorded.
            advance(clock.now());
            const list = currentAlerts();
            const overall = list.some((a) => a.severity === 'CRITICAL') ? 'CRITICAL'
                : (list.length ? 'WARNING' : 'OPERATIONAL');
            return deepFreeze({ overall, list: list.map((a) => ({ ...a })) });
        }

        /**
         * Log threshold transitions as of now. Threshold readings drift with the clock,
         * so the UI calls this on each refresh; calling it twice at the same time logs nothing new.
         */
        function tick() {
            return alertBoard();
        }

        // Anything already active when the store starts is logged at the start time.
        thresholdAlertsNow = thresholdAlertsAt(startedAt);
        logTransitions(new Map(), thresholdAlertsNow, startedAt);

        return {
            dataVersion: scenario.dataVersion,
            startedAt,
            now: () => clock.now(),
            operations: Object.keys(OPERATIONS),
            subsystemNames: () => Object.keys(privates),
            snapshot,
            snapshotAll,
            operate,
            subscribe,
            version: () => version,
            events: () => snapshot('eventLog').state.entries,
            alerts: alertBoard,
            tick,
            /** Whether the scripted events fire. Turning it off skips the entries whose time passes. */
            scripted: () => scriptOn,
            setScripted(on) {
                // Settle everything due under the old setting, so the switch only affects later times.
                advance(clock.now());
                scriptOn = Boolean(on);
            }
        };
    }

    ns.shipState = { createShipStore, createManualClock, OwnershipError, HOUR_MS };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.shipState;
    }
})(typeof window !== 'undefined' ? window : globalThis);
