/**
 * Nostromo Data Simulation System
 * Generates realistic mock data for all ship systems with time-based fluctuations
 */

class DataSimulator {
    constructor() {
        this.startTime = Date.now();
        this.baseData = this.initializeBaseData();
        this.fluctuationRanges = this.initializeFluctuationRanges();
        this.crewMembers = this.initializeCrewMembers();
    }

    /**
     * Initialize base values for all ship systems
     */
    initializeBaseData() {
        return {
            power: {
                generation: 85,
                consumption: 72,
                efficiency: 88,
                fuel: 67
            },
            lifeSupport: {
                oxygen: 95,
                co2: 12,
                pressure: 1.02,
                temperature: 21.5
            },
            navigation: {
                coordinates: { x: -2847.3, y: 1592.7, z: -834.2 },
                heading: 127.4,
                velocity: 0.15,
                destination: "LV-426",
                eta: new Date(Date.now() + 72 * 60 * 60 * 1000) // 72 hours from now
            }
        };
    }

    /**
     * Define fluctuation ranges for realistic data variations
     */
    initializeFluctuationRanges() {
        return {
            power: {
                generation: { min: -5, max: 3 },
                consumption: { min: -8, max: 12 },
                efficiency: { min: -3, max: 2 },
                fuel: { min: -0.1, max: 0 }
            },
            lifeSupport: {
                oxygen: { min: -2, max: 1 },
                co2: { min: -1, max: 3 },
                pressure: { min: -0.05, max: 0.03 },
                temperature: { min: -1.5, max: 2.0 }
            },
            navigation: {
                coordinates: { min: -0.1, max: 0.1 },
                heading: { min: -0.5, max: 0.5 },
                velocity: { min: -0.01, max: 0.01 }
            }
        };
    }

    /**
     * Initialize crew member data
     */
    initializeCrewMembers() {
        return [
            {
                id: "CREW001",
                name: "DALLAS",
                location: "BRIDGE",
                status: "active",
                vitals: {
                    heartRate: 72,
                    temperature: 36.8,
                    oxygenSat: 98
                }
            },
            {
                id: "CREW002", 
                name: "RIPLEY",
                location: "ENGINEERING",
                status: "active",
                vitals: {
                    heartRate: 68,
                    temperature: 36.6,
                    oxygenSat: 99
                }
            },
            {
                id: "CREW003",
                name: "KANE",
                location: "QUARTERS",
                status: "resting",
                vitals: {
                    heartRate: 58,
                    temperature: 36.4,
                    oxygenSat: 97
                }
            },
            {
                id: "CREW004",
                name: "LAMBERT",
                location: "NAVIGATION",
                status: "active",
                vitals: {
                    heartRate: 75,
                    temperature: 36.9,
                    oxygenSat: 98
                }
            },
            {
                id: "CREW005",
                name: "BRETT",
                location: "MAINTENANCE",
                status: "active",
                vitals: {
                    heartRate: 80,
                    temperature: 37.1,
                    oxygenSat: 96
                }
            },
            {
                id: "CREW006",
                name: "PARKER",
                location: "ENGINEERING",
                status: "active",
                vitals: {
                    heartRate: 77,
                    temperature: 37.0,
                    oxygenSat: 97
                }
            },
            {
                id: "CREW007",
                name: "ASH",
                location: "SCIENCE",
                status: "active",
                vitals: {
                    heartRate: 65,
                    temperature: 36.5,
                    oxygenSat: 99
                }
            }
        ];
    }

    /**
     * Generate time-based fluctuation using sine waves and random noise
     */
    generateFluctuation(baseValue, range, timeOffset = 0) {
        const elapsed = (Date.now() - this.startTime + timeOffset) / 1000;
        
        // Slow sine wave for gradual changes
        const slowWave = Math.sin(elapsed / 30) * 0.3;
        
        // Fast sine wave for minor fluctuations
        const fastWave = Math.sin(elapsed / 5) * 0.1;
        
        // Random noise
        const noise = (Math.random() - 0.5) * 0.2;
        
        // Combine all factors
        const fluctuation = (slowWave + fastWave + noise);
        const amplitude = (range.max - range.min) / 2;
        const offset = (range.max + range.min) / 2;
        
        return baseValue + (fluctuation * amplitude) + offset;
    }

    /**
     * Generate current power system data
     */
    generatePowerData() {
        const power = this.baseData.power;
        const ranges = this.fluctuationRanges.power;
        
        const generation = Math.max(0, Math.min(100, 
            this.generateFluctuation(power.generation, ranges.generation)
        ));
        
        const consumption = Math.max(0, Math.min(100,
            this.generateFluctuation(power.consumption, ranges.consumption, 1000)
        ));
        
        const efficiency = Math.max(0, Math.min(100,
            this.generateFluctuation(power.efficiency, ranges.efficiency, 2000)
        ));
        
        // Fuel decreases slowly over time
        const fuelDecrease = (Date.now() - this.startTime) / (1000 * 60 * 60) * 0.01; // 0.01% per hour
        const fuel = Math.max(0, Math.min(100,
            power.fuel - fuelDecrease + this.generateFluctuation(0, ranges.fuel, 3000)
        ));

        return {
            generation: Math.round(generation * 10) / 10,
            consumption: Math.round(consumption * 10) / 10,
            efficiency: Math.round(efficiency * 10) / 10,
            fuel: Math.round(fuel * 10) / 10,
            netPower: Math.round((generation - consumption) * 10) / 10
        };
    }

    /**
     * Generate current life support data
     */
    generateLifeSupportData() {
        const lifeSupport = this.baseData.lifeSupport;
        const ranges = this.fluctuationRanges.lifeSupport;
        
        const oxygen = Math.max(0, Math.min(100,
            this.generateFluctuation(lifeSupport.oxygen, ranges.oxygen)
        ));
        
        const co2 = Math.max(0, Math.min(50,
            this.generateFluctuation(lifeSupport.co2, ranges.co2, 1500)
        ));
        
        const pressure = Math.max(0.8, Math.min(1.2,
            this.generateFluctuation(lifeSupport.pressure, ranges.pressure, 2500)
        ));
        
        const temperature = Math.max(18, Math.min(24,
            this.generateFluctuation(lifeSupport.temperature, ranges.temperature, 3500)
        ));

        return {
            oxygen: Math.round(oxygen * 10) / 10,
            co2: Math.round(co2 * 10) / 10,
            pressure: Math.round(pressure * 100) / 100,
            temperature: Math.round(temperature * 10) / 10
        };
    }

    /**
     * Generate current navigation data
     */
    generateNavigationData() {
        const nav = this.baseData.navigation;
        const ranges = this.fluctuationRanges.navigation;
        
        // Coordinates change slightly due to ship movement
        const coordinates = {
            x: nav.coordinates.x + this.generateFluctuation(0, ranges.coordinates, 1000),
            y: nav.coordinates.y + this.generateFluctuation(0, ranges.coordinates, 2000),
            z: nav.coordinates.z + this.generateFluctuation(0, ranges.coordinates, 3000)
        };
        
        const heading = nav.heading + this.generateFluctuation(0, ranges.heading, 4000);
        const velocity = Math.max(0, nav.velocity + this.generateFluctuation(0, ranges.velocity, 5000));
        
        return {
            coordinates: {
                x: Math.round(coordinates.x * 10) / 10,
                y: Math.round(coordinates.y * 10) / 10,
                z: Math.round(coordinates.z * 10) / 10
            },
            heading: Math.round(((heading % 360 + 360) % 360) * 10) / 10,
            velocity: Math.round(velocity * 1000) / 1000,
            destination: nav.destination,
            eta: nav.eta
        };
    }

    /**
     * Generate current crew data with fluctuating vitals
     */
    generateCrewData() {
        return this.crewMembers.map((member, index) => {
            const timeOffset = index * 1000; // Stagger fluctuations per crew member
            
            // Heart rate fluctuations
            const heartRate = Math.max(50, Math.min(120,
                member.vitals.heartRate + this.generateFluctuation(0, { min: -5, max: 8 }, timeOffset)
            ));
            
            // Temperature fluctuations
            const temperature = Math.max(35.0, Math.min(38.5,
                member.vitals.temperature + this.generateFluctuation(0, { min: -0.3, max: 0.5 }, timeOffset + 500)
            ));
            
            // Oxygen saturation fluctuations
            const oxygenSat = Math.max(90, Math.min(100,
                member.vitals.oxygenSat + this.generateFluctuation(0, { min: -2, max: 1 }, timeOffset + 1000)
            ));

            return {
                ...member,
                vitals: {
                    heartRate: Math.round(heartRate),
                    temperature: Math.round(temperature * 10) / 10,
                    oxygenSat: Math.round(oxygenSat)
                }
            };
        });
    }

    /**
     * Generate complete system status snapshot
     */
    generateSystemStatus() {
        return {
            timestamp: new Date(),
            power: this.generatePowerData(),
            lifeSupport: this.generateLifeSupportData(),
            navigation: this.generateNavigationData(),
            crew: this.generateCrewData()
        };
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
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataSimulator;
} else {
    window.DataSimulator = DataSimulator;
}