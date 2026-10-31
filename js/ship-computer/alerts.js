/**
 * Alert derivation. Pure: no DOM, no store. The store calls derive() with the
 * current faults and readings, so an alert exists exactly while its cause does.
 *
 * Two sources:
 *   - faults recorded on a subsystem (id "subsystem:CODE")
 *   - thresholds on readings (fixed ids such as POWER_DEFICIT)
 *
 * Severities: CRITICAL or WARNING. A fault with no severity is a WARNING.
 *
 * @typedef {Object} Alert
 * @property {string} id
 * @property {string} subsystem
 * @property {string} [code]
 * @property {'CRITICAL'|'WARNING'} severity
 * @property {string} message
 * @property {number} since   simulation time the alert was derived or raised
 *
 * @typedef {Object} AlertInput
 * @property {Object<string, Array<{code: string, message?: string, severity?: string, since: number}>>} faultsBySubsystem
 * @property {{generation: number, consumption: number}} power
 * @property {{oxygen: number, co2: number}} lifeSupport
 * @property {{velocity: number}} navigation
 * @property {number} activeCrew   humans with status active
 */
(function (root) {
    const ns = root.NostromoShipComputer = root.NostromoShipComputer || {};

    /**
     * @param {AlertInput} input
     * @param {number} now simulation time, used for threshold alerts
     * @returns {Alert[]}
     */
    function derive(input, now) {
        const alerts = [];

        Object.keys(input.faultsBySubsystem).forEach((subsystem) => {
            input.faultsBySubsystem[subsystem].forEach((fault) => {
                alerts.push({
                    id: `${subsystem}:${fault.code}`,
                    subsystem,
                    code: fault.code,
                    severity: fault.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
                    message: fault.message || fault.code,
                    since: fault.since
                });
            });
        });

        const threshold = (subsystem, id, severity, message) => {
            alerts.push({ id, subsystem, severity, message, since: now });
        };

        const margin = input.power.generation - input.power.consumption;
        if (margin < 0) {
            threshold('engineering', 'POWER_DEFICIT', 'CRITICAL', 'POWER DEFICIT: CONSUMPTION EXCEEDS GENERATION');
        } else if (margin < 10) {
            threshold('engineering', 'LOW_POWER_MARGIN', 'WARNING', 'LOW POWER MARGIN: REDUCE CONSUMPTION');
        }

        const ls = input.lifeSupport;
        if (ls.oxygen < 80 || ls.co2 > 30) {
            threshold('lifeSupport', 'LIFE_SUPPORT_CRITICAL', 'CRITICAL', 'LIFE SUPPORT CRITICAL: O2 LOW OR CO2 HIGH');
        } else if (ls.oxygen < 90 || ls.co2 > 20) {
            threshold('lifeSupport', 'LIFE_SUPPORT_WARNING', 'WARNING', 'LIFE SUPPORT WARNING: O2 MARGINAL OR CO2 ELEVATED');
        }

        if (input.navigation.velocity < 0.1) {
            threshold('navigation', 'NAV_VELOCITY', 'WARNING', 'NAVIGATION WARNING: VELOCITY BELOW NOMINAL');
        }

        if (input.activeCrew < 5) {
            threshold('crew', 'CREW_ACTIVE', 'WARNING', 'CREW STATUS: FEWER THAN 5 CREW ACTIVE');
        }

        return alerts;
    }

    ns.alerts = { derive };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.alerts;
    }
})(typeof window !== 'undefined' ? window : globalThis);
