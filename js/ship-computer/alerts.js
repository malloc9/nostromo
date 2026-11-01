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
 * @property {{oxygen: number, co2: number, pressure: number, temperature: number}} lifeSupport
 * @property {{velocity: number}} navigation
 * @property {number} activeCrew   humans with status active
 */
(function (root) {
    const ns = root.NostromoShipComputer = root.NostromoShipComputer || {};

    /**
     * Alerts for faults recorded on subsystems. These change only when an operation runs.
     * @param {Object<string, Array<Object>>} faultsBySubsystem
     * @returns {Alert[]}
     */
    function faultAlerts(faultsBySubsystem) {
        const alerts = [];
        Object.keys(faultsBySubsystem).forEach((subsystem) => {
            faultsBySubsystem[subsystem].forEach((fault) => {
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
        return alerts;
    }

    /**
     * Alerts for thresholds on the readings. A pure function of the readings at `now`,
     * so the store can sample it at any simulation time.
     * @param {Omit<AlertInput, 'faultsBySubsystem'>} input
     * @param {number} now
     * @returns {Alert[]}
     */
    function thresholdAlerts(input, now) {
        const alerts = [];
        const threshold = (subsystem, id, severity, message) => {
            alerts.push({ id, subsystem, severity, message, since: now });
        };

        const margin = input.power.generation - input.power.consumption;
        if (margin < 0) {
            threshold('engineering', 'POWER_DEFICIT', 'CRITICAL', 'POWER DEFICIT: CONSUMPTION EXCEEDS GENERATION');
        } else if (margin < 10) {
            threshold('engineering', 'LOW_POWER_MARGIN', 'WARNING', 'LOW POWER MARGIN: REDUCE CONSUMPTION');
        }

        // Life support: one alert per parameter, critical when it is far out and warning when marginal.
        // Units are the plan's: oxygen and CO2 in percent, pressure in kPa, temperature in Celsius.
        const ls = input.lifeSupport;
        if (ls.oxygen < 18) {
            threshold('lifeSupport', 'LS_OXYGEN', 'CRITICAL', 'OXYGEN CRITICAL: O2 LEVEL LOW');
        } else if (ls.oxygen < 19.5) {
            threshold('lifeSupport', 'LS_OXYGEN', 'WARNING', 'OXYGEN LOW: O2 MARGINAL');
        }
        if (ls.co2 > 1.0) {
            threshold('lifeSupport', 'LS_CO2', 'CRITICAL', 'CO2 CRITICAL: CONCENTRATION HIGH');
        } else if (ls.co2 > 0.5) {
            threshold('lifeSupport', 'LS_CO2', 'WARNING', 'CO2 ELEVATED: CHECK SCRUBBERS');
        }
        if (ls.pressure < 91 || ls.pressure > 111) {
            threshold('lifeSupport', 'LS_PRESSURE', 'CRITICAL', 'PRESSURE CRITICAL: HULL BREACH POSSIBLE');
        } else if (ls.pressure < 96 || ls.pressure > 106) {
            threshold('lifeSupport', 'LS_PRESSURE', 'WARNING', 'PRESSURE OFF NOMINAL: CHECK SEALS');
        }
        if (ls.temperature < 10 || ls.temperature > 30) {
            threshold('lifeSupport', 'LS_TEMPERATURE', 'CRITICAL', 'TEMPERATURE CRITICAL: LIFE SUPPORT FAILURE');
        } else if (ls.temperature < 18 || ls.temperature > 24) {
            threshold('lifeSupport', 'LS_TEMPERATURE', 'WARNING', 'TEMPERATURE OFF NOMINAL: CHECK CLIMATE CONTROL');
        }

        if (input.navigation.velocity < 0.1) {
            threshold('navigation', 'NAV_VELOCITY', 'WARNING', 'NAVIGATION WARNING: VELOCITY BELOW NOMINAL');
        }

        if (input.activeCrew < 5) {
            threshold('crew', 'CREW_ACTIVE', 'WARNING', 'CREW STATUS: FEWER THAN 5 CREW ACTIVE');
        }

        return alerts;
    }

    /**
     * All alerts as they stand for one input.
     * @param {AlertInput} input
     * @param {number} now
     * @returns {Alert[]}
     */
    function derive(input, now) {
        return faultAlerts(input.faultsBySubsystem).concat(thresholdAlerts(input, now));
    }

    ns.alerts = { derive, faultAlerts, thresholdAlerts };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.alerts;
    }
})(typeof window !== 'undefined' ? window : globalThis);
