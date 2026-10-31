/**
 * Command engine. Turns one line of input into a structured result.
 *
 * Lifecycle: tokenize, match against the registry, check arguments, check
 * privilege, refresh state, run the handler, normalise its output, record the
 * result, and notify the event hook. It has no DOM dependency: the terminal
 * and tests call it the same way.
 *
 * @typedef {'empty'|'ok'|'error'|'unknown'|'fallback'|'denied'} EngineStatus
 *
 * @typedef {Object} EngineResult
 * @property {string} input         The raw text as submitted
 * @property {string} normalized    Tokens joined with single spaces, upper case
 * @property {EngineStatus} status
 * @property {string|null} command  Matched command name, or null
 * @property {import('./blocks.js').Block[]} blocks
 *
 * @typedef {Object} EngineOptions
 * @property {ReturnType<import('./registry.js').createRegistry>} registry
 * @property {(normalized: string) => import('./blocks.js').Block[]|null} [fallback]
 *     Legacy responder, asked only when the registry does not know the input
 * @property {(required: string) => ({required: string, current: string}|null)} [authorize]
 *     Asked before any handler runs; returns a denial, or null when permitted.
 *     Defaults to permitting everything (tests and the bare engine).
 * @property {{refreshState?: () => void, recordEvent?: (result: EngineResult) => void}} [hooks]
 */
(function (root) {
    const ns = root.NostromoShipComputer = root.NostromoShipComputer || {};

    const GENERIC_FAILURE = 'COMMAND FAILED. MU/TH/UR COULD NOT COMPLETE THIS REQUEST.';

    /**
     * @param {EngineOptions} options
     */
    function createEngine(options) {
        const registry = options.registry;
        const fallback = options.fallback || (() => null);
        // The one authorization decision lives in privilege.js; the engine only asks it.
        const authorize = options.authorize || (() => null);
        const hooks = Object.assign({ refreshState() {}, recordEvent() {} }, options.hooks);
        /** @type {EngineResult[]} */
        const history = [];

        function errorResult(input, normalized, text) {
            return finish({ input, normalized, status: 'error', command: null, blocks: [{ type: 'error', text }] });
        }

        function finish(result) {
            history.push(result);
            hooks.recordEvent(result);
            return result;
        }

        /**
         * @param {string} raw
         * @returns {EngineResult}
         */
        function execute(raw) {
            const input = raw == null ? '' : String(raw);
            const parsed = ns.parser.tokenize(input);

            if (!parsed.ok) {
                const text = parsed.error === 'TOO_LONG'
                    ? `INPUT EXCEEDS ${ns.parser.MAX_INPUT_LENGTH} CHARACTERS. SHORTEN THE COMMAND AND RESUBMIT.`
                    : 'UNMATCHED QUOTATION MARK. CLOSE THE QUOTE AND RESUBMIT.';
                return errorResult(input, '', text);
            }

            const values = parsed.tokens.map((t) => t.value);
            const normalized = values.join(' ').toUpperCase();

            if (values.length === 0) {
                return { input, normalized, status: 'empty', command: null, blocks: [] };
            }

            const match = registry.match(values);
            if (!match) {
                const legacy = fallback(normalized);
                if (legacy && legacy.length) {
                    return finish({ input, normalized, status: 'fallback', command: null, blocks: ns.blocks.normalize(legacy) });
                }
                return finish({
                    input,
                    normalized,
                    status: 'unknown',
                    command: null,
                    blocks: [{ type: 'error', text: `UNKNOWN COMMAND: ${normalized}. TYPE HELP FOR A LIST OF COMMANDS.` }]
                });
            }

            const def = match.command;
            const args = values.slice(match.length);

            // The privilege gate comes before anything else a handler would reveal:
            // a denied command is refused without checking its arguments or running.
            let denial;
            try {
                denial = authorize(def.privilege);
            } catch (err) {
                console.error(err);
                return errorResult(input, normalized, GENERIC_FAILURE);
            }
            if (denial) {
                return finish({
                    input,
                    normalized,
                    status: 'denied',
                    command: def.name,
                    blocks: [{ type: 'authorization', required: denial.required, current: denial.current }]
                });
            }

            const missing = def.args.find((arg, i) => arg.required && args[i] === undefined);
            if (missing) {
                return errorResult(input, normalized, `MISSING ARGUMENT: ${missing.name}. USAGE: ${def.usage}`);
            }

            hooks.refreshState();

            let blocks;
            try {
                blocks = ns.blocks.normalize(def.handler({ args, command: def, registry, normalized }));
            } catch (err) {
                // Keep the detail in the browser console; never show it in the terminal.
                console.error(err);
                return errorResult(input, normalized, GENERIC_FAILURE);
            }

            // A handler that reports a problem as an error block still failed.
            const failed = blocks.some((b) => b.type === 'error');
            return finish({ input, normalized, status: failed ? 'error' : 'ok', command: def.name, blocks });
        }

        return { execute, history };
    }

    ns.engine = { createEngine };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.engine;
    }
})(typeof window !== 'undefined' ? window : globalThis);
