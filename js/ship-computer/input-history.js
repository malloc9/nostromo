/**
 * Terminal input history. Pure: no DOM. The MOTHER terminal records each command here and
 * walks it with the arrow keys.
 *
 * Policy:
 *   - Entries are chronological, each with the time it was entered.
 *   - A command identical to the one just before it is not recorded again (consecutive
 *     duplicates collapse to one entry).
 *   - The limit drops the oldest entries first.
 *   - Walking back keeps the text being typed as a draft; walking forward past the newest
 *     entry returns that draft.
 *
 * @typedef {{text: string, time: number}} HistoryEntry
 */
(function (root) {
    const ns = root.NostromoShipComputer = root.NostromoShipComputer || {};

    const DEFAULT_LIMIT = 50;

    /**
     * Entries from a saved history, checked and limited the same way recording limits them.
     * Throws on a saved history that is not a list of entries.
     * @param {*} saved
     * @param {number} limit
     * @returns {HistoryEntry[]}
     */
    function entriesFromSaved(saved, limit) {
        if (saved === undefined) return [];
        if (!Array.isArray(saved)) throw new Error('saved history must be a list');
        const items = saved.map((e) => {
            if (!e || typeof e.text !== 'string' || typeof e.time !== 'number') {
                throw new Error('saved history entry is malformed');
            }
            return { text: e.text.trim(), time: e.time };
        }).filter((e) => e.text);
        return items.length > limit ? items.slice(items.length - limit) : items;
    }

    /**
     * @param {{limit?: number, now?: () => number, entries?: HistoryEntry[]}} [options]
     *   entries: a saved history to start from (see persistence.js)
     */
    function createInputHistory(options) {
        const opts = options || {};
        const limit = opts.limit === undefined ? DEFAULT_LIMIT : opts.limit;
        if (!Number.isInteger(limit) || limit < 1) {
            throw new Error('history limit must be a whole number of at least 1');
        }
        const now = opts.now || (() => Date.now());

        /** @type {HistoryEntry[]} */
        let items = entriesFromSaved(opts.entries, limit);
        let cursor = null;   // null when not walking the history
        let draft = '';

        function add(input) {
            const text = String(input == null ? '' : input).trim();
            cursor = null;
            draft = '';
            if (!text) return;
            if (items.length && items[items.length - 1].text === text) return;
            items.push({ text, time: now() });
            if (items.length > limit) items = items.slice(items.length - limit);
        }

        /** Step back to the previous command. The first step keeps what was being typed. */
        function previous(current) {
            if (items.length === 0) return current;
            if (cursor === null) {
                draft = current;
                cursor = items.length - 1;
            } else if (cursor > 0) {
                cursor -= 1;
            }
            return items[cursor].text;
        }

        /** Step forward. Past the newest entry, the draft comes back. */
        function next() {
            if (cursor === null) return draft;
            if (cursor < items.length - 1) {
                cursor += 1;
                return items[cursor].text;
            }
            cursor = null;
            return draft;
        }

        /** Forget every entry and the walk through them. The next command starts a new history. */
        function clear() {
            items = [];
            cursor = null;
            draft = '';
        }

        function entries() {
            return items.map((e) => ({ ...e }));
        }

        return { add, previous, next, entries, clear };
    }

    ns.inputHistory = { createInputHistory, DEFAULT_LIMIT: DEFAULT_LIMIT };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.inputHistory;
    }
})(typeof window !== 'undefined' ? window : globalThis);
