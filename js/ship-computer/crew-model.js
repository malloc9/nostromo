/**
 * Crew model: the one place crew counts and name matching are computed. Pure: works on
 * the crew members the store holds, and writes nothing.
 *
 * Counts cover the crew complement (humans). The synthetic member is counted apart.
 * The animal personnel record is listed as a personnel record and not in the crew counts.
 */
(function (root) {
    const ns = root.NostromoShipComputer = root.NostromoShipComputer || {};

    /**
     * @param {Array<Object>} members crew members from the store
     * @returns {{active: number, resting: number, synthetic: number}}
     */
    function counts(members) {
        const humans = members.filter((m) => m.type === 'human');
        const active = humans.filter((m) => m.status === 'active');
        return {
            active: active.filter((m) => !m.synthetic).length,
            synthetic: active.filter((m) => m.synthetic).length,
            resting: humans.filter((m) => m.status === 'resting').length
        };
    }

    /**
     * Find the member a query names. An exact name, crew id or personnel id wins outright.
     * Otherwise a part of a name matches: one match is partial, several are ambiguous.
     * @returns {{kind: 'exact'|'partial'|'ambiguous'|'none', matches: Array<Object>}}
     */
    function matchMembers(members, query) {
        const q = String(query).trim().toUpperCase();
        // An empty query is a substring of every name; it names nobody.
        if (q === '') return { kind: 'none', matches: [] };
        const exact = members.filter((m) => m.name === q || m.id === q || m.personnelId === q);
        if (exact.length) return { kind: 'exact', matches: exact };
        const partial = members.filter((m) => m.name.indexOf(q) !== -1);
        if (partial.length === 1) return { kind: 'partial', matches: partial };
        if (partial.length > 1) return { kind: 'ambiguous', matches: partial };
        return { kind: 'none', matches: [] };
    }

    ns.crewModel = { counts, matchMembers };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.crewModel;
    }
})(typeof window !== 'undefined' ? window : globalThis);
