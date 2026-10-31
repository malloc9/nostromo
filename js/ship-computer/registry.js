/**
 * Command registry. Adding a command is a single call to register(); the
 * parser and HELP read everything from here.
 *
 * @typedef {Object} CommandArg
 * @property {string} name
 * @property {boolean} [required]
 *
 * @typedef {Object} CommandDefinition
 * @property {string} name            Command name; may be several words ("LIFE SUPPORT")
 * @property {string[]} [aliases]     Other names that resolve to this command
 * @property {string} [description]
 * @property {string} [usage]
 * @property {string} [category]      Grouping for HELP; defaults to GENERAL
 * @property {string} [privilege]     Required privilege level; defaults to CREW
 * @property {CommandArg[]} [args]
 * @property {(ctx: Object) => import('./blocks.js').Block[]|import('./blocks.js').Block|null} handler
 */
(function (root) {
    const ns = root.NostromoShipComputer = root.NostromoShipComputer || {};

    /**
     * Normalise a command name for lookup: upper case, single spaces.
     * @param {string} text
     * @returns {string}
     */
    function keyOf(text) {
        return String(text).trim().split(/\s+/).join(' ').toUpperCase();
    }

    function createRegistry() {
        /** @type {Map<string, Readonly<CommandDefinition>>} */
        const byName = new Map();
        /** @type {Readonly<CommandDefinition>[]} */
        const commands = [];
        let longestName = 0;

        /**
         * @param {CommandDefinition} def
         * @returns {Readonly<CommandDefinition>}
         */
        function register(def) {
            if (!def || typeof def.name !== 'string' || !def.name.trim()) {
                throw new Error('command needs a name');
            }
            // Fail at registration, not when a user types the command.
            if (def.privilege && ns.privilege) ns.privilege.rank(def.privilege);
            if (typeof def.handler !== 'function') {
                throw new Error(`command ${def.name} needs a handler`);
            }

            const entry = Object.freeze({
                name: keyOf(def.name),
                aliases: (def.aliases || []).map(keyOf),
                description: def.description || '',
                usage: def.usage || keyOf(def.name),
                category: keyOf(def.category || 'GENERAL'),
                privilege: def.privilege || 'CREW',
                args: def.args || [],
                handler: def.handler
            });

            const names = [entry.name, ...entry.aliases];
            names.forEach((n) => {
                if (byName.has(n)) {
                    throw new Error(`duplicate command name: ${n}`);
                }
            });
            names.forEach((n) => {
                byName.set(n, entry);
                longestName = Math.max(longestName, n.split(' ').length);
            });
            commands.push(entry);
            return entry;
        }

        /**
         * Exact lookup by a whole name, such as the argument to HELP.
         * @param {string} text
         * @returns {Readonly<CommandDefinition>|null}
         */
        function get(text) {
            return byName.get(keyOf(text)) || null;
        }

        /**
         * Find the command at the start of a word list. Longest name wins.
         * @param {string[]} words
         * @returns {{command: Readonly<CommandDefinition>, length: number}|null}
         */
        function match(words) {
            const upper = words.map((w) => String(w).toUpperCase());
            for (let n = Math.min(longestName, upper.length); n >= 1; n--) {
                const command = byName.get(upper.slice(0, n).join(' '));
                if (command) {
                    return { command, length: n };
                }
            }
            return null;
        }

        /** @returns {Readonly<CommandDefinition>[]} */
        function list() {
            return commands.slice();
        }

        return { register, get, match, list };
    }

    ns.registry = { createRegistry };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.registry;
    }
})(typeof window !== 'undefined' ? window : globalThis);
