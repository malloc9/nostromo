/**
 * Command engine. Turns one line of input into a structured result.
 *
 * Lifecycle: tokenize, match against the registry, check arguments, check
 * privilege, refresh state, run the handler, normalise its output, record the
 * result, and notify the event hook. It has no DOM dependency: the terminal
 * and tests call it the same way.
 *
 * @typedef {'empty'|'ok'|'error'|'unknown'|'fallback'|'denied'|'pending'|'cancelled'} EngineStatus
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
        // The question waiting for Y or N. It is engine state, so a test can set and answer it without a DOM.
        let pending = null;

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
        /**
         * Answer the pending question. Y confirms and runs its action once; N cancels;
         * anything else keeps the question open. Nothing changes until a Y.
         */
        function answerPending(input) {
            const answer = String(input == null ? '' : input).trim().toUpperCase();
            const current = pending;
            if (answer === 'Y' || answer === 'YES') {
                pending = null;
                let blocks;
                try {
                    blocks = ns.blocks.normalize(current.confirm());
                } catch (err) {
                    console.error(err);
                    return errorResult(input, answer, GENERIC_FAILURE);
                }
                const failed = blocks.some((b) => b.type === 'error');
                return finish({ input, normalized: answer, status: failed ? 'error' : 'ok', command: current.command, blocks });
            }
            if (answer === 'N' || answer === 'NO') {
                return cancelPendingWith(input, answer);
            }
            return finish({
                input,
                normalized: answer,
                status: 'pending',
                command: current.command,
                blocks: [{ type: 'error', text: 'ANSWER Y OR N.' }, ...ns.blocks.normalize(current.question)]
            });
        }

        function cancelPendingWith(input, normalized) {
            const current = pending;
            pending = null;
            let blocks;
            try {
                blocks = ns.blocks.normalize(current.cancel());
            } catch (err) {
                console.error(err);
                return errorResult(input, normalized, GENERIC_FAILURE);
            }
            return finish({ input, normalized, status: 'cancelled', command: current.command, blocks });
        }

        /**
         * @param {string} raw
         * @returns {EngineResult}
         */
        function execute(raw) {
            const input = raw == null ? '' : String(raw);
            if (pending) {
                return answerPending(input);
            }
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
                // Did-you-mean offers only commands the session may use, in the plan's structure.
                const near = ns.suggest.didYouMean(ns.suggest.candidatesFor(registry, null), normalized, authorize);
                const blocks = [
                    { type: 'error', text: 'COMMAND NOT RECOGNIZED.' },
                    { type: 'text', text: `UNKNOWN COMMAND: ${normalized}` }
                ];
                if (near.length) {
                    blocks.push({ type: 'text', text: 'DID YOU MEAN:' });
                    near.forEach((c) => blocks.push({ type: 'text', text: `  ${c.name}` }));
                }
                blocks.push({ type: 'text', text: 'ENTER HELP FOR AVAILABLE COMMANDS.' });
                return finish({ input, normalized, status: 'unknown', command: null, blocks });
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
                return finish({
                    input,
                    normalized,
                    status: 'error',
                    command: def.name,
                    blocks: [
                        { type: 'error', text: 'ERROR: MISSING ARGUMENT.' },
                        { type: 'text', text: 'USAGE:' },
                        { type: 'text', text: def.usage }
                    ]
                });
            }

            hooks.refreshState();

            // A handler asks a question by calling ask(); the change happens only when confirmed.
            const ask = (spec) => {
                pending = { command: def.name, question: spec.question || [], confirm: spec.confirm, cancel: spec.cancel || (() => []) };
            };

            let blocks;
            try {
                blocks = ns.blocks.normalize(def.handler({ args, command: def, registry, normalized, ask }));
            } catch (err) {
                // Keep the detail in the browser console; never show it in the terminal.
                console.error(err);
                return errorResult(input, normalized, GENERIC_FAILURE);
            }

            if (pending) {
                return finish({ input, normalized, status: 'pending', command: def.name, blocks });
            }

            // A handler that reports a problem as an error block still failed.
            const failed = blocks.some((b) => b.type === 'error');
            return finish({ input, normalized, status: failed ? 'error' : 'ok', command: def.name, blocks });
        }

        /** The question waiting for an answer, or null. */
        function pendingQuestion() {
            return pending ? { command: pending.command } : null;
        }

        /** Escape: cancel the pending question as if the user had answered N. */
        function cancelPending() {
            return pending ? cancelPendingWith('ESCAPE', 'ESCAPE') : null;
        }

        return { execute, history, pending: pendingQuestion, cancelPending };
    }

    ns.engine = { createEngine };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.engine;
    }
})(typeof window !== 'undefined' ? window : globalThis);
