/**
 * Static responses from before the command engine. They answer only input the
 * registry does not know, so nothing the MOTHER screen said before stops
 * working. Ticket 22 removes this file once every entry is a registered command.
 */
(function (root) {
    const ns = root.NostromoShipComputer = root.NostromoShipComputer || {};

    const RESPONSES = {
        'HELLO': 'INTERFACE 2037 READY FOR INQUIRY.',
        'HI': 'INTERFACE 2037 READY FOR INQUIRY.',
        'STATUS': 'ALL SYSTEMS NOMINAL. SHIP COURSE CORRECT.',
        'REPORT': 'STANDARD NAVIGATION PROTOCOLS IN EFFECT.',
        'WHO ARE YOU': 'I AM MU/TH/UR 6000. SHIP MAINFRAME.',
        'WHAT IS YOUR MISSION': 'COMMERCIAL TOWING VEHICLE NOSTROMO. CREW: 7. CARGO: REFINERY.',
        'SYSTEM': 'SYSTEM DIAGNOSTIC: OPERATIONAL. 2.1 TB MEMORY ALLOCATED.',
        'LOGS': 'ACCESS DENIED. RESTRICTED TO SCIENCE OFFICER.',
        'CREW': 'DALLAS, KANE, RIPLEY, ASH, LAMBERT, PARKER, BRETT. JONES THE CAT.',
        'JONES': 'SHIP CAT. VITAL SIGNS: NORMAL.',
        'CAT': 'SHIP CAT. VITAL SIGNS: NORMAL.',
        'ASH': 'SCIENCE OFFICER. ANDROID. DESIGNATION: AX-12.',
        'RIPLEY': 'WARRANT OFFICER ELLEN RIPLEY. ENGINEERING.',
        'DALLAS': 'CAPTAIN DALLAS. SHIP COMMANDER.',
        'KANE': 'EXECUTIVE OFFICER. FIRST OFFICER.',
        'LAMBERT': 'NAVIGATOR.',
        'PARKER': 'CHIEF ENGINEER.',
        'BRETT': 'ENGINEERING TECHNICIAN.',
        'MISSION': 'RETURN REFINERY TO EARTH. CURRENT VECTOR: SOL SYSTEM.',
        'INTERFACE 2037': 'ACCESSING SECURE FILE... [SEE: SPECIAL ORDER 937]',
        'SPECIAL ORDER 937': 'PRIORITY ONE. INSURE RETURN OF ORGANISM FOR ANALYSIS. ALL OTHER CONSIDERATIONS SECONDARY. CREW EXPENDABLE.',
        'OVERRIDE': 'ACCESS DENIED. COMMAND AUTHORIZATION REQUIRED.',
        'DESTRUCT': 'WARNING: SELF-DESTRUCT SEQUENCE. MANUAL ACTIVATION REQUIRED AT EMERGENCY CONSOLE.'
    };

    const URGENT = ['DESTRUCT', 'SPECIAL ORDER 937', 'INTERFACE 2037'];

    /**
     * @param {string} normalized Upper-case input
     * @returns {import('./blocks.js').Block[]|null} null when there is no legacy answer
     */
    function respond(normalized) {
        let text = Object.prototype.hasOwnProperty.call(RESPONSES, normalized) ? RESPONSES[normalized] : null;
        if (!text && normalized.indexOf('WHAT IS') === 0) {
            text = 'INSUFFICIENT DATA FOR MEANINGFUL ANSWER.';
        }
        if (!text) return null;

        let tone = null;
        if (URGENT.indexOf(normalized) !== -1) tone = 'urgent';
        if (normalized === 'OVERRIDE') tone = 'alert';
        return [{ type: 'text', text, tone }];
    }

    ns.legacy = { respond };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.legacy;
    }
})(typeof window !== 'undefined' ? window : globalThis);
