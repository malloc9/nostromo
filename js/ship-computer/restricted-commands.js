/**
 * Restricted commands. Each declares its privilege from the permission matrix and
 * has no check of its own: the engine refuses it before its handler runs.
 *
 * SPECIAL ORDER 937 is registered here so the legacy fallback can no longer answer it
 * for any session. Its text comes from the legacy responder, reached only when the
 * engine has permitted the command.
 */
(function (root) {
    const ns = root.NostromoShipComputer = root.NostromoShipComputer || {};

    function register(registry) {
        registry.register({
            name: 'SPECIAL ORDER 937',
            category: 'RESTRICTED',
            description: 'RESTRICTED TO CORPORATE AUTHORITY.',
            usage: 'SPECIAL ORDER 937',
            privilege: ns.privilege.OPERATIONS.SPECIAL_ORDER_937,
            handler: () => ns.legacy.respond('SPECIAL ORDER 937') || []
        });
    }

    ns.restrictedCommands = { register };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.restrictedCommands;
    }
})(typeof window !== 'undefined' ? window : globalThis);
