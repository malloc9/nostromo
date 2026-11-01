/**
 * CREW commands: the manifest, status, locations, biometrics and personnel records.
 * Everything reads the store's crew members through the crew model. Privilege is
 * declared per command from the permission matrix; a record's sensitive fields are
 * withheld by the one authorization decision (privilege.authorize).
 */
(function (root) {
    const ns = root.NostromoShipComputer = root.NostromoShipComputer || {};

    const { OPERATIONS } = ns.privilege;

    function text(line) {
        return { type: 'text', text: line };
    }

    function heading(line) {
        return { type: 'text', text: line, tone: 'heading' };
    }

    function leader(label, value) {
        return text(ns.util.formatLeader(label, value));
    }

    function upper(value) {
        return String(value).toUpperCase();
    }

    function numbered(members) {
        return members.map((m, i) => [String(i + 1).padStart(2, '0'), m]);
    }

    /** Resolve a query to one member, or to the block that explains why not. */
    function resolve(members, query) {
        const result = ns.crewModel.matchMembers(members, query);
        if (result.kind === 'none') {
            return { error: [{ type: 'error', text: `NO CREW RECORD MATCHES "${upper(query)}".` }] };
        }
        if (result.kind === 'ambiguous') {
            return {
                error: [
                    { type: 'error', text: 'ERROR: MULTIPLE RECORDS FOUND.' },
                    text('MATCHING PERSONNEL:'),
                    {
                        type: 'table',
                        columns: ['NO', 'NAME', 'POSITION'],
                        rows: numbered(result.matches).map(([no, m]) => [no, m.name, m.position])
                    },
                    text('SPECIFY FULL RECORD NAME.')
                ]
            };
        }
        return { member: result.matches[0] };
    }

    function manifest(members, withStatus) {
        const columns = withStatus ? ['NO', 'NAME', 'POSITION', 'STATUS', 'LOCATION'] : ['NO', 'NAME', 'POSITION'];
        const rows = numbered(members).map(([no, m]) => (withStatus
            ? [no, m.name, m.position, upper(m.status), m.location]
            : [no, m.name, m.position]));
        return [
            heading('CREW MANIFEST'),
            { type: 'table', columns, rows },
            text(''),
            text(`PERSONNEL RECORDS: ${members.length}`)
        ];
    }

    /** The personnel record. Sensitive fields are withheld unless the decision permits them. */
    function personnelRecord(member, session) {
        const blocks = [
            heading('PERSONNEL RECORD'),
            leader('NAME', member.name),
            leader('POSITION', member.position),
            leader('DEPARTMENT', member.department),
            leader('PERSONNEL ID', member.personnelId),
            text(''),
            leader('STATUS', upper(member.status)),
            leader('LOCATION', member.location)
        ];
        const denial = ns.privilege.authorize(session, OPERATIONS.CREW_RECORDS);
        blocks.push(text(''));
        if (denial) {
            blocks.push({ type: 'authorization', required: denial.required, current: denial.current });
        } else {
            blocks.push(leader('MEDICAL STATUS', upper(member.medicalStatus)));
            blocks.push(leader('SECURITY CLEARANCE', upper(member.securityClearance)));
        }
        blocks.push(text(''));
        blocks.push(text('RECORD COMPLETE.'));
        return blocks;
    }

    function vitals(member) {
        return [
            heading('BIOMETRICS'),
            leader('NAME', member.name),
            leader('HEART RATE', `${member.vitals.heartRate} BPM`),
            leader('TEMPERATURE', `${member.vitals.temperature.toFixed(1)}°C`),
            leader('OXYGEN SATURATION', `${member.vitals.oxygenSat}%`),
            text(''),
            text('BIOMETRICS COMPLETE.')
        ];
    }

    /**
     * @param {ReturnType<import('./ship-state.js').createShipStore>} store
     * @param {ReturnType<import('./privilege.js').createSession>} session
     */
    function register(registry, store, session) {
        const members = () => store.snapshot('crew').state.members;
        const noArgs = (usage) => (ctx) => (ctx.args.length > 0 ? [{ type: 'error', text: `USAGE: ${usage}` }] : null);
        const nameOf = (ctx) => ctx.args.join(' ');

        registry.register({
            name: 'CREW',
            category: 'CREW',
            description: 'SHOWS THE CREW MANIFEST, OR THE PERSONNEL RECORD OF A NAMED MEMBER.',
            usage: 'CREW [NAME]',
            args: [{ name: 'NAME', required: false }],
            handler: (ctx) => {
                if (ctx.args.length === 0) return manifest(members(), false);
                const found = resolve(members(), nameOf(ctx));
                return found.error || personnelRecord(found.member, session);
            }
        });

        registry.register({
            name: 'CREW ALL',
            category: 'CREW',
            description: 'SHOWS THE FULL MANIFEST WITH STATUS AND LOCATION.',
            usage: 'CREW ALL',
            handler: (ctx) => noArgs('CREW ALL')(ctx) || manifest(members(), true)
        });

        registry.register({
            name: 'CREW STATUS',
            category: 'CREW',
            description: 'SHOWS EACH MEMBER\'S STATUS, OR ONE MEMBER\'S STATUS LINE.',
            usage: 'CREW STATUS [NAME]',
            args: [{ name: 'NAME', required: false }],
            handler: (ctx) => {
                if (ctx.args.length === 0) {
                    return [
                        heading('CREW STATUS'),
                        { type: 'table', columns: ['NAME', 'STATUS', 'LOCATION'], rows: members().map((m) => [m.name, upper(m.status), m.location]) }
                    ];
                }
                const found = resolve(members(), nameOf(ctx));
                return found.error || [leader('STATUS', upper(found.member.status))];
            }
        });

        registry.register({
            name: 'CREW LOCATION',
            category: 'CREW',
            description: 'SHOWS EACH MEMBER\'S LOCATION, OR ONE MEMBER\'S LOCATION.',
            usage: 'CREW LOCATION [NAME]',
            args: [{ name: 'NAME', required: false }],
            handler: (ctx) => {
                if (ctx.args.length === 0) {
                    return [
                        heading('CREW LOCATIONS'),
                        { type: 'table', columns: ['NAME', 'LOCATION'], rows: members().map((m) => [m.name, m.location]) }
                    ];
                }
                const found = resolve(members(), nameOf(ctx));
                return found.error || [leader('LOCATION', found.member.location)];
            }
        });

        registry.register({
            name: 'CREW BIOMETRICS',
            category: 'CREW',
            description: 'SHOWS THE VITAL SIGNS OF A NAMED MEMBER. OFFICER LEVEL.',
            usage: 'CREW BIOMETRICS NAME',
            args: [{ name: 'NAME', required: true }],
            privilege: OPERATIONS.CREW_RECORDS,
            handler: (ctx) => {
                const found = resolve(members(), nameOf(ctx));
                return found.error || vitals(found.member);
            }
        });

        registry.register({
            name: 'CREW RECORD',
            category: 'CREW',
            description: 'SHOWS THE FULL PERSONNEL RECORD OF A NAMED MEMBER. OFFICER LEVEL.',
            usage: 'CREW RECORD NAME',
            args: [{ name: 'NAME', required: true }],
            privilege: OPERATIONS.CREW_RECORDS,
            handler: (ctx) => {
                const found = resolve(members(), nameOf(ctx));
                return found.error || personnelRecord(found.member, session);
            }
        });
    }

    ns.crewCommands = { register, resolve, personnelRecord };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.crewCommands;
    }
})(typeof window !== 'undefined' ? window : globalThis);
