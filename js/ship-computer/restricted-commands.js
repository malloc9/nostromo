/**
 * Restricted commands. Each declares its privilege from the permission matrix and
 * has no check of its own: the engine refuses it before its handler runs, and answers
 * with an authorization block when the session lacks the level.
 *
 * The wording is the retired responder's, kept as it was. Each word reads in the tone
 * the old responder gave it.
 */
(function (root) {
    const ns = root.NostromoShipComputer = root.NostromoShipComputer || {};

    function register(registry) {
        const OPS = ns.privilege.OPERATIONS;
        const restricted = (name, privilege, description, text, tone) => registry.register({
            name,
            category: 'RESTRICTED',
            description,
            usage: name,
            privilege,
            handler: () => [{ type: 'text', text, tone }]
        });

        restricted('SPECIAL ORDER 937', OPS.SPECIAL_ORDER_937,
            'RESTRICTED TO CORPORATE AUTHORITY.',
            'PRIORITY ONE. INSURE RETURN OF ORGANISM FOR ANALYSIS. ALL OTHER CONSIDERATIONS SECONDARY. CREW EXPENDABLE.',
            'urgent');
        restricted('INTERFACE 2037', OPS.CREW_RECORDS,
            'OPENS THE SECURE FILE INDEX.',
            'ACCESSING SECURE FILE... [SEE: SPECIAL ORDER 937]',
            'urgent');
        restricted('OVERRIDE', OPS.CORPORATE_DIRECTIVES,
            'REQUESTS A SYSTEM OVERRIDE.',
            'ACCESS DENIED. COMMAND AUTHORIZATION REQUIRED.',
            'alert');
        restricted('DESTRUCT', OPS.CORPORATE_DIRECTIVES,
            'SHOWS THE SELF-DESTRUCT STATUS.',
            'WARNING: SELF-DESTRUCT SEQUENCE. MANUAL ACTIVATION REQUIRED AT EMERGENCY CONSOLE.',
            'urgent');
    }

    ns.restrictedCommands = { register };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.restrictedCommands;
    }
})(typeof window !== 'undefined' ? window : globalThis);
