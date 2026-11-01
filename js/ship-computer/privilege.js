/**
 * Privilege model: the levels, the permission matrix, the session, and the one
 * decision. Pure: no DOM. The engine calls authorize() before any handler runs;
 * no command or panel checks privilege on its own.
 *
 * Levels are ordered. A session holds one level, and an operation needs a minimum
 * level. SYSTEM (internal administration) is above every other level.
 *
 * @typedef {'CREW'|'OFFICER'|'COMMANDER'|'CORPORATE'|'SYSTEM'} Level
 * @typedef {{required: Level, current: Level}} Denial
 */
(function (root) {
    const ns = root.NostromoShipComputer = root.NostromoShipComputer || {};

    const LEVELS = ['CREW', 'OFFICER', 'COMMANDER', 'CORPORATE', 'SYSTEM'];

    const DESCRIPTIONS = {
        CREW: 'BASIC SHIP INFORMATION',
        OFFICER: 'OPERATIONAL REPORTS',
        COMMANDER: 'FULL SHIP OPERATIONAL CONTROL',
        CORPORATE: 'CORPORATE DIRECTIVES',
        SYSTEM: 'INTERNAL COMPUTER ADMINISTRATION'
    };

    /** The plan's matrix: each operation and the minimum level that may perform it. */
    const OPERATIONS = {
        GENERAL_STATUS: 'CREW',
        CREW_MANIFEST: 'CREW',
        CREW_RECORDS: 'OFFICER',
        ENGINEERING_REPORTS: 'CREW',
        ENGINEERING_CONTROL: 'COMMANDER',
        MISSION_ORDERS: 'OFFICER',
        CORPORATE_DIRECTIVES: 'CORPORATE',
        SPECIAL_ORDER_937: 'CORPORATE'
    };

    const OPERATION_LABELS = {
        GENERAL_STATUS: 'GENERAL STATUS',
        CREW_MANIFEST: 'CREW MANIFEST',
        CREW_RECORDS: 'DETAILED CREW RECORDS',
        ENGINEERING_REPORTS: 'ENGINEERING REPORTS',
        ENGINEERING_CONTROL: 'ENGINEERING CONTROL',
        MISSION_ORDERS: 'MISSION ORDERS',
        CORPORATE_DIRECTIVES: 'CORPORATE DIRECTIVES',
        SPECIAL_ORDER_937: 'SPECIAL ORDER 937'
    };

    function rank(level) {
        const index = LEVELS.indexOf(level);
        if (index === -1) throw new Error(`unknown privilege level: ${level}`);
        return index;
    }

    /** Whether a holder of `current` may use something that needs `required`. */
    function permits(current, required) {
        return rank(current) >= rank(required);
    }

    /**
     * The one authorization decision. Returns null when permitted, otherwise the
     * required and current levels. A denial never carries any restricted data.
     * @param {{level: Level}} session
     * @param {Level} required
     * @returns {Denial|null}
     */
    function authorize(session, required) {
        return permits(session.level, required) ? null : { required, current: session.level };
    }

    /** Operations a level may perform, in matrix order. */
    function operationsFor(level) {
        return Object.keys(OPERATIONS).filter((op) => permits(level, OPERATIONS[op]));
    }

    /**
     * The terminal session. Starts at commander, as the MOTHER screen shows.
     * @param {{id?: string, level?: Level}} [options]
     */
    function createSession(options) {
        const opts = options || {};
        let id = opts.id || '0000-A7F3';
        let level = opts.level || 'COMMANDER';
        rank(level);
        return {
            get id() {
                return id;
            },
            setId(next) {
                id = String(next);
            },
            get level() {
                return level;
            },
            setLevel(next) {
                rank(next);
                level = next;
            }
        };
    }

    /**
     * A session identifier in the same shape as the others, XXXX-XXXX in hexadecimal.
     * @param {() => number} [random]  returns a number in [0, 1); injected by tests
     */
    function newSessionId(random = Math.random) {
        const part = () => Math.floor(random() * 0x10000).toString(16).toUpperCase().padStart(4, '0');
        return `${part()}-${part()}`;
    }

    ns.privilege = {
        LEVELS,
        DESCRIPTIONS,
        OPERATIONS,
        OPERATION_LABELS,
        rank,
        permits,
        authorize,
        operationsFor,
        createSession,
        newSessionId
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.privilege;
    }
})(typeof window !== 'undefined' ? window : globalThis);
