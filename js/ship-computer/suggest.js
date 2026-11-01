/**
 * Suggestions for the MOTHER terminal: autocomplete, Tab completion, did-you-mean and related
 * commands. Pure: no DOM. Every candidate comes from command metadata or from the store (crew
 * names, subsystem names), so nothing here is a separately maintained list.
 *
 * A suggestion never runs a command. Permissions filter what is offered: a command the session
 * may not use is not offered, and the same decision the engine makes is used (authorize).
 *
 * @typedef {{name: string, description: string, usage: string, privilege?: string, related?: string[]}} Candidate
 */
(function (root) {
    const ns = root.NostromoShipComputer = root.NostromoShipComputer || {};

    const MAX_SHOWN = 8;
    const DID_YOU_MEAN_MAX = 3;
    const NEAR_DISTANCE = 2;

    function text(line) {
        return { type: 'text', text: line };
    }

    /** The typed words, upper case. A trailing space means the next word is being started. */
    function wordsOf(input) {
        const raw = String(input == null ? '' : input).replace(/^\s+/, '').toUpperCase();
        return raw.split(/\s+/);
    }

    /** Does a command name fit what has been typed so far? The last typed word may be partial. */
    function fits(name, parts) {
        const cw = name.split(' ');
        if (parts.length > cw.length) return false;
        for (let i = 0; i < parts.length - 1; i++) {
            if (cw[i] !== parts[i]) return false;
        }
        return cw[parts.length - 1].indexOf(parts[parts.length - 1]) === 0;
    }

    function permitted(candidate, authorize) {
        return !authorize || authorize(candidate.privilege || 'CREW') === null;
    }

    /** Exact matches first, then shorter names, then alphabetical. */
    function rank(list, typedName) {
        return list.slice().sort((a, b) => {
            const exactA = a.name === typedName ? 0 : 1;
            const exactB = b.name === typedName ? 0 : 1;
            if (exactA !== exactB) return exactA - exactB;
            if (a.name.length !== b.name.length) return a.name.length - b.name.length;
            return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0);
        });
    }

    function matchAll(candidates, input, authorize) {
        const parts = wordsOf(input);
        if (parts.join('') === '') return [];
        const typedName = parts.join(' ');
        return rank(candidates.filter((c) => permitted(c, authorize) && fits(c.name, parts)), typedName);
    }

    /** The suggestions shown as the user types, most relevant first. */
    function suggest(candidates, input, authorize) {
        return matchAll(candidates, input, authorize).slice(0, MAX_SHOWN);
    }

    /**
     * Tab: completes only when exactly one permitted command matches. Otherwise the input is kept.
     * @returns {{text: string, completed: boolean}}
     */
    function complete(candidates, input, authorize) {
        const matches = matchAll(candidates, input, authorize);
        if (matches.length === 1) return { text: matches[0].name, completed: true };
        return { text: String(input).trim(), completed: false };
    }

    function levenshtein(a, b) {
        const row = Array.from({ length: b.length + 1 }, (_, j) => j);
        for (let i = 1; i <= a.length; i++) {
            let prev = row[0];
            row[0] = i;
            for (let j = 1; j <= b.length; j++) {
                const tmp = row[j];
                row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
                prev = tmp;
            }
        }
        return row[b.length];
    }

    /**
     * For an unknown command: the commands in the family it begins, or else the commands whose
     * first word is a near spelling of it. Nothing close gives an empty list.
     */
    function didYouMean(candidates, input, authorize) {
        const parts = wordsOf(input);
        if (parts.join('') === '') return [];
        const first = parts[0];
        const allowed = candidates.filter((c) => permitted(c, authorize));
        const family = rank(allowed.filter((c) => c.name.split(' ')[0].indexOf(first) === 0), first);
        if (family.length) return family.slice(0, DID_YOU_MEAN_MAX);
        const near = allowed
            .map((c) => ({ c, d: levenshtein(c.name.split(' ')[0], first) }))
            .filter((x) => x.d <= NEAR_DISTANCE)
            .sort((a, b) => a.d - b.d || a.c.name.length - b.c.name.length);
        return near.slice(0, DID_YOU_MEAN_MAX).map((x) => x.c);
    }

    /** Command candidates from the registry, plus crew names and subsystem names from the store. */
    function candidatesFor(registry, store) {
        const list = registry.list().map((d) => ({
            name: d.name,
            description: d.description,
            usage: d.usage,
            privilege: d.privilege,
            related: d.related
        }));
        if (store) {
            store.snapshot('crew').state.members.forEach((m) => {
                list.push({ name: `CREW ${m.name}`, description: `PERSONNEL RECORD: ${m.position}.`, usage: `CREW ${m.name}`, privilege: 'CREW' });
            });
            store.subsystemNames().forEach((s) => {
                const label = s.replace(/([A-Z])/g, ' $1').toUpperCase().trim();
                list.push({ name: `LOG ${label}`, description: 'EVENTS FROM THIS SUBSYSTEM.', usage: `LOG ${label}`, privilege: 'CREW' });
            });
        }
        return list;
    }

    /** RELATED COMMANDS after an informational command, from its own metadata. */
    function relatedBlocks(registry, name) {
        const def = registry.get(name);
        if (!def || !def.related || def.related.length === 0) return [];
        return [text('RELATED COMMANDS:'), ...def.related.map((n) => text(n))];
    }

    ns.suggest = { suggest, complete, didYouMean, candidatesFor, relatedBlocks, MAX_SHOWN };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.suggest;
    }
})(typeof window !== 'undefined' ? window : globalThis);
