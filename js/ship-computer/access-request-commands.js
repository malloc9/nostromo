/**
 * ACCESS REQUEST and SECURITY: asking for elevated privilege, and the security status.
 *
 * Grant rule (for this version of the terminal):
 *   - a level the session already holds: nothing to request
 *   - OFFICER and COMMANDER: granted once confirmed
 *   - CORPORATE: refused at this terminal, whatever is confirmed
 *   - SYSTEM: not available through a request at all
 *
 * Nothing changes until the user answers Y. Every outcome (granted, refused, cancelled)
 * is written to the security log by the security subsystem.
 */
(function (root) {
    const ns = root.NostromoShipComputer = root.NostromoShipComputer || {};

    const SECURITY = 'security';

    /**
     * What a request for `requested` does, given the session's current level.
     * @returns {'held'|'granted'|'refused'|'system'|'unknown'}
     */
    function grantRule(current, requested) {
        if (ns.privilege.LEVELS.indexOf(requested) === -1) return 'unknown';
        if (requested === 'SYSTEM') return 'system';
        if (ns.privilege.permits(current, requested)) return 'held';
        if (requested === 'CORPORATE') return 'refused';
        return 'granted';
    }

    function nextLevelUp(level) {
        const index = ns.privilege.LEVELS.indexOf(level);
        return index + 1 < ns.privilege.LEVELS.length ? ns.privilege.LEVELS[index + 1] : null;
    }

    function text(line) {
        return { type: 'text', text: line };
    }

    /**
     * @param {ReturnType<import('./privilege.js').createSession>} session
     * @param {ReturnType<import('./ship-state.js').createShipStore>} store
     */
    function register(registry, store, session) {
        // Writes one security event for an outcome; the security subsystem owns the record.
        const record = (outcome, level, severity, message) => store.operate(SECURITY, 'recordAccessRequest', {
            outcome,
            severity,
            message,
            summary: `${outcome.toUpperCase()} ${level}`
        }, SECURITY);

        registry.register({
            name: 'ACCESS REQUEST',
            category: 'ACCESS',
            description: 'ASKS FOR ELEVATED PRIVILEGE. CONFIRM WITH Y, OR N TO CANCEL.',
            usage: 'ACCESS REQUEST [LEVEL]',
            args: [{ name: 'LEVEL', required: false }],
            handler: (ctx) => {
                if (ctx.args.length > 1) return [{ type: 'error', text: 'USAGE: ACCESS REQUEST [LEVEL]' }];
                const requested = ctx.args.length ? String(ctx.args[0]).toUpperCase() : nextLevelUp(session.level);
                if (!requested) {
                    return [{ type: 'error', text: `ALREADY AT THE HIGHEST LEVEL: ${session.level}.` }];
                }
                const rule = grantRule(session.level, requested);
                if (rule === 'unknown') {
                    return [{ type: 'error', text: `UNKNOWN ACCESS LEVEL: ${ctx.args[0]}. LEVELS: ${ns.privilege.LEVELS.join(', ')}` }];
                }
                if (rule === 'system') {
                    return [{ type: 'error', text: 'SYSTEM IS NOT AVAILABLE THROUGH ACCESS REQUEST.' }];
                }
                if (rule === 'held') {
                    return [text(`ALREADY HOLD ACCESS AT LEVEL ${session.level}.`)];
                }

                const question = [
                    text('ACCESS RESTRICTED.'),
                    text(`REQUIRED PRIVILEGE: ${requested}`),
                    text(`CURRENT PRIVILEGE: ${session.level}`),
                    text('REQUEST ELEVATED ACCESS? Y/N')
                ];
                ctx.ask({
                    question,
                    confirm: () => {
                        // Re-read the rule at confirmation: the level may have changed since the question.
                        const now = grantRule(session.level, requested);
                        if (now === 'held') {
                            return [text(`ALREADY HOLD ACCESS AT LEVEL ${session.level}.`)];
                        }
                        if (now === 'granted') {
                            // Record first: if the write fails, the level does not change.
                            record('granted', requested, 'INFO', `ACCESS GRANTED: ${requested}`);
                            session.setLevel(requested);
                            return [text(`ACCESS GRANTED. PRIVILEGE LEVEL NOW: ${requested}.`)];
                        }
                        record('refused', requested, 'WARNING', `ACCESS REFUSED: ${requested}`);
                        return [
                            text(`ACCESS REFUSED. ${requested} ACCESS IS NOT GRANTED AT THIS TERMINAL.`),
                            text(`PRIVILEGE LEVEL UNCHANGED: ${session.level}.`)
                        ];
                    },
                    cancel: () => {
                        record('cancelled', requested, 'INFO', `ACCESS REQUEST CANCELLED: ${requested}`);
                        return [text(`ACCESS REQUEST CANCELLED. PRIVILEGE LEVEL UNCHANGED: ${session.level}.`)];
                    }
                });
                return question;
            }
        });

        registry.register({
            name: 'SECURITY',
            category: 'SECURITY',
            description: 'SHOWS THE SECURITY STATUS AND RECENT ACCESS REQUESTS.',
            usage: 'SECURITY',
            handler: (ctx) => {
                if (ctx.args.length > 0) return [{ type: 'error', text: 'USAGE: SECURITY' }];
                const snap = store.snapshot(SECURITY);
                const leader = (label, value) => text(ns.util.formatLeader(label, value));
                return [
                    { type: 'text', text: 'SECURITY REPORT', tone: 'heading' },
                    leader('SECURITY STATUS', snap.status),
                    leader('SECURITY LEVEL', snap.state.level),
                    leader('SESSION LEVEL', session.level),
                    leader('ACCESS REQUESTS', String(snap.state.accessRequests)),
                    leader('LAST REQUEST', snap.state.lastRequest || 'NONE'),
                    text(''),
                    text('SECURITY REPORT COMPLETE.')
                ];
            }
        });
    }

    ns.accessRequestCommands = { register, grantRule };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.accessRequestCommands;
    }
})(typeof window !== 'undefined' ? window : globalThis);
