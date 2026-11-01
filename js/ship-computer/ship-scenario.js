/**
 * The "standard" scenario: the initial ship state the store starts from.
 *
 * UNITS (used everywhere in the ship computer):
 *   - oxygen, carbon dioxide, humidity, fuel, efficiency, generation,
 *     consumption, oxygen saturation: percent (0-100)
 *   - pressure: kPa (the screens convert to ATM at the adapter)
 *   - temperature: degrees Celsius
 *   - heart rate: beats per minute
 *   - heading: degrees; coordinates: ship-relative units; velocity: units per second
 *   - time: milliseconds since the epoch, from the injected simulation clock
 *
 * DRIFT POLICY (how values move without randomness):
 *   A measurement's value at time t is a pure function of t and its definition:
 *     value(t) = base + offset + amplitude * sin(2*pi*t / period + phase)
 *   minus decayPerHour * elapsed hours (fuel only), then clamped to [min, max]
 *   and rounded to `precision` decimals. Two readers asking at the same simulated
 *   time therefore get the same number, and the same clock always gives the same
 *   history. Nothing is stored per read.
 *
 * ROLES: the `members` list below is the only place that says who holds which
 * position. Every screen reads positions from the store, never from its own list.
 *
 * Each measurement is written as `measure(base, options)` so the drift
 * parameters sit next to the value they describe.
 */
(function (root) {
    const ns = root.NostromoShipComputer = root.NostromoShipComputer || {};

    const MINUTE_MS = 60 * 1000;
    const HOUR_MS = 60 * 60 * 1000;
    const SCENARIO_ETA_HOURS = 72;

    /**
     * The scripted events, in simulated time from the store's start. Each entry is data: a trigger
     * time, the owner operations that make up one transition, and the notice the terminal prints.
     * `values` are read at the trigger time: a measurement by its key, a field by its name.
     */
    const SCRIPT = [
        {
            at: 2 * MINUTE_MS,
            changes: [
                { subsystem: 'engineering', operation: 'shiftMeasurement', args: { key: 'coolingTemperature', by: 30 } },
                { subsystem: 'engineering', operation: 'addFault', args: { code: 'COOLING-TEMP', message: 'COOLING SYSTEM TEMPERATURE ABOVE NORMAL', component: 'coolingSystem', severity: 'WARNING' } }
            ],
            notice: {
                source: 'ENGINEERING',
                level: 'WARNING',
                headline: 'COOLING SYSTEM TEMPERATURE ABOVE NORMAL.',
                values: [
                    { label: 'CURRENT TEMPERATURE', subsystem: 'engineering', measurement: 'coolingTemperature', unit: 'C' },
                    { label: 'WARNING THRESHOLD', subsystem: 'engineering', field: 'coolingWarningAt', unit: 'C' }
                ]
            }
        }
    ];

    /**
     * @param {number} base
     * @param {{offset?: number, amplitude?: number, period?: number, phase?: number,
     *          min?: number, max?: number, precision?: number, decayPerHour?: number}} [options]
     */
    function measure(base, options) {
        const o = options || {};
        return {
            kind: 'measurement',
            base,
            offset: o.offset || 0,
            amplitude: o.amplitude || 0,
            period: o.period || 60,
            phase: o.phase || 0,
            min: o.min === undefined ? -Infinity : o.min,
            max: o.max === undefined ? Infinity : o.max,
            precision: o.precision === undefined ? 1 : o.precision,
            decayPerHour: o.decayPerHour || 0
        };
    }

    /**
     * Crew entry. `type` is 'human' or 'animal'; the screens list humans only.
     * `vitals` are measurements, so each member drifts on its own phase.
     */
    function member(index, data) {
        const phase = index * 0.9;
        const entry = {
            id: `CREW00${index + 1}`,
            personnelId: `WU-1809246-${String(index + 1).padStart(3, '0')}`,
            name: data.name,
            type: data.type || 'human',
            position: data.position,
            location: data.location,
            status: data.status,
            department: 'COMMAND',
            cryosleep: false,
            medicalStatus: 'FIT',
            securityClearance: 'OFFICER',
            vitals: {
                heartRate: measure(data.heartRate, { offset: 1.5, amplitude: 6.5, period: 90, phase, min: 50, max: 120, precision: 0 }),
                temperature: measure(data.temperature, { offset: 0.1, amplitude: 0.4, period: 120, phase, min: data.tempMin || 35, max: data.tempMax || 38.5, precision: 1 }),
                oxygenSat: measure(data.oxygenSat, { offset: -0.5, amplitude: 1.5, period: 150, phase, min: 90, max: 100, precision: 0 })
            }
        };
        return Object.assign(entry, data.profile);
    }

    /**
     * @returns {{subsystems: Object<string, Object>}} a fresh, independent copy of the standard scenario
     */
    function standardScenario() {
        return {
            scenarioId: 'standard',
            dataVersion: 1,
            script: JSON.parse(JSON.stringify(SCRIPT)),
            subsystems: {
                identity: {
                    status: 'NOMINAL',
                    fields: {
                        vessel: 'USCSS NOSTROMO',
                        registration: '1809246(09)',
                        vesselClass: 'COMMERCIAL TOWING VEHICLE',
                        homePort: 'THOMAS EDISON',
                        operator: 'WEYLAND-YUTANI CORPORATION',
                        specifications: { length: '39 M', mass: '2400 TONNES', crewRated: 7 },
                        systems: ['MU/TH/UR 6000 MAINFRAME', 'TOWING ARRAY', 'LIFE SUPPORT', 'NAVIGATION SUITE', 'SHUTTLE (LANDER)'],
                        configuration: 'TOWING CONFIGURATION, REFINERY LOADED'
                    },
                    measurements: {}
                },
                mission: {
                    status: 'NOMINAL',
                    fields: {
                        objective: 'RETURN REFINERY TO EARTH',
                        cargo: 'REFINERY',
                        phase: 'IN PROGRESS',
                        objectives: [
                            { text: 'RETURN REFINERY TO EARTH', status: 'IN PROGRESS' },
                            { text: 'MAINTAIN CREW SAFETY', status: 'IN PROGRESS' },
                            { text: 'DELIVER CARGO INTACT', status: 'PENDING' }
                        ],
                        orders: [
                            { code: 'OPS-01', text: 'MAINTAIN COURSE FOR SOL SYSTEM' },
                            { code: 'OPS-02', text: 'HOLD TOWING CONFIGURATION' }
                        ]
                    },
                    measurements: {}
                },
                navigation: {
                    status: 'NOMINAL',
                    fields: {
                        destination: 'LV-426',
                        etaOffsetHours: SCENARIO_ETA_HOURS,
                        // Destinations the ship may be set for, and the hours to reach each.
                        destinations: { 'LV-426': SCENARIO_ETA_HOURS, 'SOL SYSTEM': 2100, 'THOMAS EDISON': 60 },
                        coordinates: {
                            x: measure(-2847.3, { amplitude: 0.1, period: 240, phase: 0, precision: 1 }),
                            y: measure(1592.7, { amplitude: 0.1, period: 300, phase: 1.1, precision: 1 }),
                            z: measure(-834.2, { amplitude: 0.1, period: 360, phase: 2.2, precision: 1 })
                        }
                    },
                    measurements: {
                        heading: measure(127.4, { amplitude: 0.5, period: 200, precision: 1 }),
                        velocity: measure(0.15, { amplitude: 0.01, period: 180, precision: 3, min: 0 })
                    }
                },
                engineering: {
                    status: 'NOMINAL',
                    // Cooling warning threshold, in degrees Celsius. The scripted cooling event
                    // below reports the reading against it.
                    fields: {
                        coolingWarningAt: 80,
                        // Power shares across subsystems, in percent. They always total 100.
                        allocation: { lifeSupport: 35, navigation: 25, communications: 20, engines: 20 },
                        // Allowed range per subsystem. Life support has a safety minimum, and below a warning
                        // level the subsystem raises a POWER LOW alert.
                        allocationRules: {
                            lifeSupport: { min: 5, max: 60, safetyMin: 30 },
                            navigation: { min: 5, max: 60, warnBelow: 15 },
                            communications: { min: 5, max: 60, warnBelow: 10 },
                            engines: { min: 5, max: 60, warnBelow: 15 }
                        }
                    },
                    measurements: {
                        primaryEngineLoad: measure(35, { amplitude: 4, period: 75, min: 0, max: 100 }),
                        secondaryEngineLoad: measure(0, { min: 0, max: 100 }),
                        coolingTemperature: measure(58, { amplitude: 3, period: 240, min: 40, max: 100 }),
                        powerGeneration: measure(86, { amplitude: 1.5, period: 30, min: 0, max: 100 }),
                        powerConsumption: measure(70, { amplitude: 2, period: 60, min: 0, max: 100 }),
                        powerEfficiency: measure(88, { offset: -0.5, amplitude: 2.5, period: 45, min: 0, max: 100 }),
                        fuelReserve: measure(67, { decayPerHour: 0.01, min: 0, max: 100, precision: 2 })
                    }
                },
                lifeSupport: {
                    status: 'NOMINAL',
                    fields: {},
                    measurements: {
                        // Plan units: oxygen and CO2 are percent of the air; pressure kPa; temperature C.
                        oxygen: measure(20.9, { amplitude: 0.2, period: 90, min: 0, max: 30 }),
                        co2: measure(0.04, { amplitude: 0.005, period: 120, min: 0, max: 2, precision: 2 }),
                        pressure: measure(101.3, { amplitude: 1, period: 150, min: 60, max: 130, precision: 1 }),
                        temperature: measure(21.4, { amplitude: 0.8, period: 180, min: 0, max: 40, precision: 1 }),
                        humidity: measure(43, { amplitude: 2, period: 210, min: 20, max: 80, precision: 1 })
                    }
                },
                crew: {
                    status: 'NOMINAL',
                    fields: {
                        members: [
                            member(0, { name: 'DALLAS', position: 'CAPTAIN', location: 'BRIDGE', status: 'active', heartRate: 72, temperature: 36.8, oxygenSat: 98,
                                profile: { department: 'COMMAND' } }),
                            member(1, { name: 'RIPLEY', position: 'WARRANT OFFICER', location: 'ENGINEERING', status: 'active', heartRate: 68, temperature: 36.6, oxygenSat: 99,
                                profile: { department: 'COMMAND' } }),
                            member(2, { name: 'KANE', position: 'EXEC OFFICER', location: 'QUARTERS', status: 'resting', heartRate: 58, temperature: 36.4, oxygenSat: 97,
                                profile: { department: 'COMMAND' } }),
                            member(3, { name: 'LAMBERT', position: 'NAVIGATOR', location: 'NAVIGATION', status: 'active', heartRate: 75, temperature: 36.9, oxygenSat: 98,
                                profile: { department: 'NAVIGATION' } }),
                            member(4, { name: 'BRETT', position: 'ENG TECH', location: 'MAINTENANCE', status: 'active', heartRate: 80, temperature: 37.1, oxygenSat: 96,
                                profile: { department: 'ENGINEERING' } }),
                            member(5, { name: 'PARKER', position: 'CHIEF ENGINEER', location: 'ENGINEERING', status: 'active', heartRate: 77, temperature: 37.0, oxygenSat: 97,
                                profile: { department: 'ENGINEERING' } }),
                            member(6, { name: 'ASH', position: 'SCIENCE OFFICER', location: 'SCIENCE', status: 'active', heartRate: 65, temperature: 36.5, oxygenSat: 99,
                                profile: { department: 'SCIENCE', securityClearance: 'OFFICER', synthetic: true } }),
                            member(7, { name: 'JONES', type: 'animal', position: 'SHIP CAT', location: 'QUARTERS', status: 'active', heartRate: 110, temperature: 38.4, oxygenSat: 98,
                                tempMin: 37.5, tempMax: 39.5,
                                profile: { department: 'PERSONNEL', medicalStatus: 'FIT' } })
                        ]
                    },
                    measurements: {}
                },
                cargo: {
                    status: 'NOMINAL',
                    fields: {
                        items: [
                            { item: 'REFINERY UNIT A', units: 1, location: 'CARGO BAY 1', condition: 'NOMINAL' },
                            { item: 'REFINERY UNIT B', units: 1, location: 'CARGO BAY 1', condition: 'NOMINAL' },
                            { item: 'ORE CONTAINER', units: 4, location: 'CARGO BAY 2', condition: 'NOMINAL' },
                            { item: 'SPARE PARTS', units: 12, location: 'STORES', condition: 'NOMINAL' }
                        ]
                    },
                    measurements: {}
                },
                communications: {
                    status: 'NOMINAL',
                    fields: { channel: 'MOTHER-LINK', relayStatus: 'NOMINAL' },
                    measurements: {}
                },
                security: {
                    status: 'NOMINAL',
                    fields: { level: 'STANDARD', accessRequests: 0, lastRequest: null },
                    measurements: {}
                },
                alerts: {
                    status: 'NOMINAL',
                    fields: {},
                    measurements: {}
                },
                eventLog: {
                    status: 'NOMINAL',
                    fields: { entries: [] },
                    measurements: {}
                }
            }
        };
    }

    ns.scenario = { standardScenario, measure, HOUR_MS };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.scenario;
    }
})(typeof window !== 'undefined' ? window : globalThis);
