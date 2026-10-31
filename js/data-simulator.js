/**
 * Nostromo Data Simulation System
 *
 * Thin adapter over the ship state store (js/ship-computer/ship-state.js).
 * Every value comes from the store, so the screens cannot disagree with each
 * other or with the ship computer. This class only converts the store's units
 * (kPa, percent, Celsius) into the shapes and units the screens already show
 * (ATM for pressure), and keeps the short history used for trend arrows.
 */

function resolveShipState() {
    if (typeof module !== 'undefined' && module.exports) {
        require('./ship-computer/namespace.js');
        require('./ship-computer/util.js');
        require('./ship-computer/ship-scenario.js');
        require('./ship-computer/alerts.js');
        require('./ship-computer/ship-state.js');
        return globalThis.NostromoShipComputer.shipState;
    }
    return window.NostromoShipComputer.shipState;
}

const KPA_PER_ATM = 101.325;

function round1(value) {
    return Math.round(value * 10) / 10;
}

class DataSimulator {
    /**
     * @param {{clock?: {now: () => number}, store?: Object}} [options]
     *   clock: injectable simulation clock (defaults to Date.now)
     *   store: an existing ship state store to read from
     */
    constructor(options) {
        const opts = options || {};
        const shipState = resolveShipState();
        this.store = opts.store || shipState.createShipStore({ clock: opts.clock });
        this.startTime = this.store.startedAt;
        this.hourMs = shipState.HOUR_MS;

        // Historical data storage for trend analysis
        this.history = {
            power: [],
            lifeSupport: [],
            navigation: [],
            crew: []
        };
        this.maxHistoryPoints = 50; // Keep last 50 data points for trends
    }

    /**
     * Power, from the engineering subsystem. Fuel falls with simulated time.
     */
    generatePowerData() {
        const m = this.store.snapshot('engineering').measurements;
        const generation = round1(m.powerGeneration);
        const consumption = round1(m.powerConsumption);

        return {
            generation,
            consumption,
            efficiency: round1(m.powerEfficiency),
            fuel: round1(m.fuelReserve),
            netPower: round1(generation - consumption)
        };
    }

    /**
     * Life support, converted for the screens: pressure from kPa to ATM.
     */
    generateLifeSupportData() {
        const m = this.store.snapshot('lifeSupport').measurements;

        return {
            oxygen: round1(m.oxygen),
            co2: round1(m.co2),
            pressure: Math.round((m.pressure / KPA_PER_ATM) * 100) / 100,
            temperature: round1(m.temperature)
        };
    }

    /**
     * Navigation, from the navigation subsystem. The ETA is the scenario start
     * plus the scenario's offset, so it does not move with the clock.
     */
    generateNavigationData() {
        const snap = this.store.snapshot('navigation');
        const m = snap.measurements;
        const c = snap.state.coordinates;

        return {
            coordinates: {
                x: round1(c.x),
                y: round1(c.y),
                z: round1(c.z)
            },
            heading: Math.round(((m.heading % 360 + 360) % 360) * 10) / 10,
            velocity: Math.round(m.velocity * 1000) / 1000,
            destination: snap.state.destination,
            eta: new Date(this.startTime + snap.state.etaOffsetHours * this.hourMs)
        };
    }

    /**
     * The crew the screens list: the seven humans. Jones is a personnel record
     * in the store but is not in the crew list. Role is the crew member's position.
     */
    generateCrewData() {
        return this.store.snapshot('crew').state.members
            .filter((member) => member.type === 'human')
            .map((member) => ({
                id: member.id,
                name: member.name,
                role: member.position,
                location: member.location,
                status: member.status,
                vitals: {
                    heartRate: member.vitals.heartRate,
                    temperature: round1(member.vitals.temperature),
                    oxygenSat: member.vitals.oxygenSat
                }
            }));
    }

    /**
     * Generate complete system status snapshot
     */
    generateSystemStatus() {
        const status = {
            timestamp: new Date(this.store.now()),
            power: this.generatePowerData(),
            lifeSupport: this.generateLifeSupportData(),
            navigation: this.generateNavigationData(),
            crew: this.generateCrewData()
        };

        // Store data in history for trend analysis
        this.updateHistory(status);

        return status;
    }

    /**
     * Update historical data for trend analysis
     * @param {Object} status - Current system status
     */
    updateHistory(status) {
        // Add current data to history arrays
        this.history.power.push({
            timestamp: status.timestamp,
            generation: status.power.generation,
            consumption: status.power.consumption,
            efficiency: status.power.efficiency,
            fuel: status.power.fuel,
            netPower: status.power.netPower
        });

        this.history.lifeSupport.push({
            timestamp: status.timestamp,
            oxygen: status.lifeSupport.oxygen,
            co2: status.lifeSupport.co2,
            pressure: status.lifeSupport.pressure,
            temperature: status.lifeSupport.temperature
        });

        this.history.navigation.push({
            timestamp: status.timestamp,
            heading: status.navigation.heading,
            velocity: status.navigation.velocity,
            x: status.navigation.coordinates.x,
            y: status.navigation.coordinates.y
        });

        // Store average crew vitals for trend analysis
        const avgHeartRate = status.crew.reduce((sum, member) => sum + member.vitals.heartRate, 0) / status.crew.length;
        const avgOxygenSat = status.crew.reduce((sum, member) => sum + member.vitals.oxygenSat, 0) / status.crew.length;

        this.history.crew.push({
            timestamp: status.timestamp,
            avgHeartRate: avgHeartRate,
            avgOxygenSat: avgOxygenSat,
            activeCount: status.crew.filter(c => c.status === 'active').length
        });

        // Limit history size
        if (this.history.power.length > this.maxHistoryPoints) {
            this.history.power.shift();
            this.history.lifeSupport.shift();
            this.history.navigation.shift();
            this.history.crew.shift();
        }
    }

    /**
     * Validate that generated values are within expected ranges
     */
    validateData(data) {
        const errors = [];

        // Validate power data
        if (data.power.generation < 0 || data.power.generation > 100) {
            errors.push(`Power generation out of range: ${data.power.generation}`);
        }
        if (data.power.consumption < 0 || data.power.consumption > 100) {
            errors.push(`Power consumption out of range: ${data.power.consumption}`);
        }
        if (data.power.fuel < 0 || data.power.fuel > 100) {
            errors.push(`Fuel level out of range: ${data.power.fuel}`);
        }

        // Validate life support data
        if (data.lifeSupport.oxygen < 0 || data.lifeSupport.oxygen > 100) {
            errors.push(`Oxygen level out of range: ${data.lifeSupport.oxygen}`);
        }
        if (data.lifeSupport.pressure < 0.8 || data.lifeSupport.pressure > 1.2) {
            errors.push(`Pressure out of range: ${data.lifeSupport.pressure}`);
        }
        if (data.lifeSupport.temperature < 18 || data.lifeSupport.temperature > 24) {
            errors.push(`Temperature out of range: ${data.lifeSupport.temperature}`);
        }

        // Validate crew data
        data.crew.forEach((member, index) => {
            if (member.vitals.heartRate < 50 || member.vitals.heartRate > 120) {
                errors.push(`Crew ${index} heart rate out of range: ${member.vitals.heartRate}`);
            }
            if (member.vitals.oxygenSat < 90 || member.vitals.oxygenSat > 100) {
                errors.push(`Crew ${index} oxygen saturation out of range: ${member.vitals.oxygenSat}`);
            }
        });

        return errors;
    }

    /**
     * Get trend data for a specific metric
     * @param {string} system - System name ('power', 'lifeSupport', 'navigation', 'crew')
     * @param {string} metric - Metric name to get trend for
     * @returns {Object} Trend data with direction and change rate
     */
    getTrend(system, metric) {
        const history = this.history[system];
        if (!history || history.length < 2) {
            return { direction: 'stable', change: 0, trend: 'insufficient_data' };
        }

        // Get latest and previous values
        const latest = history[history.length - 1];
        const previous = history[history.length - 2];

        if (!latest[metric] || !previous[metric]) {
            return { direction: 'stable', change: 0, trend: 'invalid_metric' };
        }

        const change = latest[metric] - previous[metric];
        const changePercent = (change / previous[metric]) * 100;

        let direction = 'stable';
        let trend = 'stable';

        if (change > 0.1) {
            direction = 'up';
            trend = 'improving';
        } else if (change < -0.1) {
            direction = 'down';
            trend = 'declining';
        }

        // For certain metrics, reverse the interpretation
        const reverseMetrics = ['co2', 'consumption'];
        if (reverseMetrics.includes(metric)) {
            if (change > 0.1) {
                trend = 'declining';
            } else if (change < -0.1) {
                trend = 'improving';
            }
        }

        return {
            direction: direction,
            change: change,
            changePercent: changePercent,
            trend: trend,
            latest: latest[metric],
            previous: previous[metric]
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataSimulator;
} else {
    window.DataSimulator = DataSimulator;
}
