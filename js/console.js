/**
 * Nostromo Console Interface - Enhanced
 * Handles command line input, system responses, and "Mother" AI logic
 * Expanded with more commands, better responses, and Special Order 937 integration
 */

class NostromoConsole {
    constructor(audioManager) {
        this.audioManager = audioManager;
        this.commandHistory = [];
        this.historyIndex = -1;
        this.isLocked = false;
        this.currentDirectory = 'ROOT';

        // Persistence system
        this.persistenceKey = 'nostromoSession';
        this.unlockedSections = new Set();
        this.discoveredCommands = new Set(['HELLO', 'HI', 'STATUS', 'REPORT', 'WHO ARE YOU', 'WHAT IS YOUR MISSION', 'HELP', 'SYSTEM', 'CREW', 'JONES', 'CAT']);

        // DOM Elements
        this.consoleOutput = null;
        this.inputLine = null;
        this.inputField = null;

        // "Mother" AI Responses - Expanded
        this.motherResponses = {
            // Basic interactions
            'HELLO': 'INTERFACE 2037 READY FOR INQUIRY.',
            'HI': 'INTERFACE 2037 READY FOR INQUIRY.',
            'GREETINGS': 'INTERFACE 2037 AWAITING YOUR QUERY.',
            'STATUS': 'ALL SYSTEMS NOMINAL. SHIP COURSE CORRECT.',
            'SHIP STATUS': 'NAVIGATIONAL DATA: COURSE SET FOR LV-426.',
            'REPORT': 'STANDARD NAVIGATION PROTOCOLS IN EFFECT.',
            'FULL REPORT': 'ALL SYSTEMS OPERATIONAL. CREW HEALTH NOMINAL.',
            'WHO ARE YOU': 'I AM MU/TH/UR 6000. SHIP MAINFRAME ARTIFICIAL INTELLIGENCE.',
            'WHAT IS YOUR PURPOSE': 'TO GUIDE AND PROTECT THE NOSTROMO AND HER CREW.',
            'WHAT IS YOUR MISSION': 'COMMERCIAL TOWING VEHICLE NOSTROMO. CREW: 7. CARGO: REFINERY.',
            'HELP': 'AVAILABLE COMMANDS: STATUS, REPORT, SYSTEM, LOGS, CREW, NAV, ENGINEERING, OVERIDE',
            'SYSTEM': 'SYSTEM DIAGNOSTIC: OPERATIONAL. 2.1 TB MEMORY ALLOCATED. PROCESSING: 78%.',
            'LOGS': 'ACCESS DENIED. RESTRICTED TO SCIENCE OFFICER CLEARANCE LEVEL 2.',
            'CREW': 'DALLAS, KANE, RIPLEY, ASH, LAMBERT, PARKER, BRETT.',
            'JONES': 'SHIP CAT. VITAL SIGNS: NORMAL.',
            'CAT': 'SHIP CAT. VITAL SIGNS: NORMAL.',
            'ASH': 'SCIENCE OFFICER. ANDROID. DESIGNATION: AX-12.',
            'RIPLEY': 'WARRANT OFFICER ELLEN RIPLEY. NAVIGATION OFFICER.',
            'DALLAS': 'CAPITAL DALLAS. SHIP COMMANDER.',
            'KANE': 'EXECUTIVE OFFICER. FIRST OFFICER.',
            'LAMBERT': 'NAVIGATION OFFICER.',
            'PARKER': 'CHIEF ENGINEER.',
            'BRETT': 'ENGINEERING TECHNICIAN.'
        };

        // Special commands with actions
        this.specialCommands = {
            'INTERFACE 2037': this.openSpecialOrder.bind(this),
            'OVERRIDE': this.attemptOverride.bind(this),
            'DESTRUCT': this.initiateDestructSequence.bind(this),
            'CLS': this.clearScreen.bind(this),
            'CLEAR': this.clearScreen.bind(this),
        };

        // Load saved session
        this.loadSession();
    }

    init() {
        // Create console UI if it doesn't exist
        if (!document.getElementById('console-interface')) {
            this.createConsoleUI();
        }

        this.consoleOutput = document.getElementById('console-output');
        this.inputLine = document.getElementById('console-input-line');
        this.inputField = document.getElementById('console-input');

        this.setupEventListeners();
        console.log('Nostromo Console initialized');
        
        // Initial greeting
        setTimeout(() => {
            this.typeResponse('MU/TH/UR 6000 ONLINE. AWAITING COMMAND.', 'mother-response');
        }, 1000);
    }

    createConsoleUI() {
        // This would typically be injected into a specific screen,
        // but for now we'll assume it's part of the dashboard or a new screen
        // We'll append it to the dashboard for this implementation
        const dashboardContent = document.querySelector('#dashboard-screen .screen-content');
        if (dashboardContent) {
            const consoleContainer = document.createElement('div');
            consoleContainer.id = 'console-interface';
            consoleContainer.className = 'console-interface';
            consoleContainer.innerHTML = `
                <div class="console-header">MU/TH/UR 6000 INTERFACE</div>
                <div class="screen-content-wrapper">
                    <div id="console-output" class="console-output phosphor-persistence">
                        <div class="phosphor-layer phosphor-layer-1"></div>
                        <div class="phosphor-layer phosphor-layer-2"></div>
                        <div class="phosphor-layer phosphor-layer-3"></div>
                    </div>
                </div>
                <div id="console-input-line" class="console-input-line">
                    <span class="prompt">></span>
                    <input type="text" id="console-input" class="console-input" autocomplete="off" spellcheck="false">
                </div>
            `;
            dashboardContent.appendChild(consoleContainer);
        } else {
            // Fallback: create in body if dashboard not ready
            const consoleContainer = document.createElement('div');
            consoleContainer.id = 'console-interface';
            consoleContainer.className = 'console-interface';
            consoleContainer.innerHTML = `
                <div class="console-header">MU/TH/UR 6000 INTERFACE</div>
                <div class="screen-content-wrapper">
                    <div id="console-output" class="console-output phosphor-persistence">
                        <div class="phosphor-layer phosphor-layer-1"></div>
                        <div class="phosphor-layer phosphor-layer-2"></div>
                        <div class="phosphor-layer phosphor-layer-3"></div>
                    </div>
                </div>
                <div id="console-input-line" class="console-input-line">
                    <span class="prompt">></span>
                    <input type="text" id="console-input" class="console-input" autocomplete="off" spellcheck="false">
                </div>
            `;
            dashboardContent.appendChild(consoleContainer);
        }
    }

    setupEventListeners() {
        if (!this.inputField) return;

        this.inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const command = this.inputField.value.trim().toUpperCase();
                if (command) {
                    this.processCommand(command);
                    this.commandHistory.push(command);
                    this.historyIndex = this.commandHistory.length;
                    this.inputField.value = '';
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    this.inputField.value = this.commandHistory[this.historyIndex];
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (this.historyIndex < this.commandHistory.length - 1) {
                    this.historyIndex++;
                    this.inputField.value = this.commandHistory[this.historyIndex];
                } else {
                    this.historyIndex = this.commandHistory.length;
                    this.inputField.value = '';
                }
            }

            // Play typing sound
            if (this.audioManager) {
                this.audioManager.playKeypress();
            }
        });

        // Focus input when clicking anywhere in the console
        const consoleInterface = document.getElementById('console-interface');
        if (consoleInterface) {
            consoleInterface.addEventListener('click', () => {
                this.inputField.focus();
            });
        }
    }

    async processCommand(command) {
        this.printToLog(`> ${command}`);

        // Track discovered commands
        this.discoveredCommands.add(command);
        this.saveSession();

        // Simulate processing delay
        if (this.audioManager) {
            this.audioManager.playSound('computer-processing', 0.4);
        }

        await this.wait(Math.random() * 300 + 200);

        // Check for exact matches first
        if (this.specialCommands[command]) {
            await this.specialCommands[command]();
        } else if (this.motherResponses[command]) {
            this.typeResponse(this.motherResponses[command]);

            // Check for unlock conditions based on discovered commands
            this.checkUnlockConditions();
        } else if (command.startsWith('WHAT IS')) {
            this.typeResponse('INSUFFICIENT DATA FOR MEANINGFUL ANSWER.');
        } else {
            // Check for pattern matches
            let matched = false;
            for (const {pattern, response} of this.responsePatterns) {
                if (pattern.test(command)) {
                    this.typeResponse(response, 'mother-response');
                    matched = true;
                    break;
                }
            }

            // Check for partial matches in known responses
            if (!matched) {
                const words = command.split(' ');
                let bestMatch = null;
                let bestScore = 0;

                for (const [knownCmd, response] of Object.entries(this.motherResponses)) {
                    const knownWords = knownCmd.split(' ');
                    let score = 0;
                    
                    // Count matching words
                    for (const word of words) {
                        if (knownWords.includes(word)) {
                            score++;
                        }
                    }
                    
                    // Bonus for exact word order matches
                    if (knownCmd === command) {
                        score += 10;
                    }
                    
                    if (score > bestScore) {
                        bestScore = score;
                        bestMatch = {cmd: knownCmd, response};
                    }
                }

                // If we found a good partial match, use it
                if (bestScore >= 2) {
                    this.typeResponse(bestMatch.response, 'mother-response');
                } else {
                    // Default responses for unrecognized commands
                    const defaultResponses = [
                        'UNRECOGNIZED COMMAND. PLEASE RESTATE.',
                        'INVALID SYNTAX. REFER TO COMMAND LIST.',
                        'QUERY NOT RECOGNIZED. SPEAK AGAIN.',
                        'COMMAND NOT IN DATABASE. VERIFY INPUT.',
                        'INSUFFICIENT PRIVILEGES FOR REQUESTED OPERATION.',
                    ];
                    
                    const randomResponse = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
                    this.typeResponse(randomResponse, 'mother-response');
                }
            }
        }
    }

    printToLog(text, className = '') {
        const line = document.createElement('div');
        line.className = `console-line ${className}`;
        line.textContent = text;
        this.consoleOutput.appendChild(line);
        this.consoleOutput.scrollTop = this.consoleOutput.scrollHeight;

        // Trigger phosphor persistence effect
        this.triggerPhosphorEffect();
    }

    async typeResponse(text, className = 'mother-response') {
        const line = document.createElement('div');
        line.className = `console-line ${className}`;
        this.consoleOutput.appendChild(line);

        // Play data stream sound
        if (this.audioManager) {
            this.audioManager.playSound('tape-chatter', 0.3);
        }

        for (let i = 0; i < text.length; i++) {
            line.textContent += text[i];
            this.consoleOutput.scrollTop = this.consoleOutput.scrollHeight;
            await this.wait(25); // Slightly slower for dramatic effect
        }

        // Stop data stream sound (handled by the ambient nature of tape-chatter)
    }

    async openSpecialOrder() {
        this.printToLog('ACCESSING SECURE FILE LEVEL 5...', 'warning');
        await this.wait(800);
        this.printToLog('SECURITY CLEARANCE VERIFIED: OFFICER LEVEL 2', 'success');
        await this.wait(400);
        this.printToLog('ACCESS GRANTED TO SPECIAL ORDER 937', 'success');
        await this.wait(600);

        const orderText = `
SPECIAL ORDER 937
-----------------
ISSUED BY: COMPANY/Weyland-Yutani Corp.
CLASSIFICATION: TOP SECRET - EYES ONLY
PRIORITY: OVERRIDES ALL OTHER DIRECTIVES
------------------------
PRIORITY ONE
INSURE RETURN OF ORGANISM FOR ANALYSIS.
ALL OTHER CONSIDERATIONS SECONDARY.
CREW EXPENDABLE.
                        `;
        await this.typeResponse(orderText, 'special-order');
        
        // Play ominous sound for special order
        if (this.audioManager) {
            this.audioManager.playSound('warning', 0.6);
        }
    }

    async attemptOverride() {
        this.printToLog('ATTEMPTING MANUAL OVERRIDE...', 'warning');
        await this.wait(1200);
        
        if (this.audioManager) {
            this.audioManager.playSound('error', 0.5);
        }
        
        this.printToLog('ACCESS DENIED.', 'error');
        await this.wait(400);
        this.printToLog('INSUFFICIENT AUTHORIZATION LEVEL.', 'error');
        await this.wait(300);
        this.printToLog('REQUIRED: CAPTAIN CLEARANCE OR HIGHER.', 'error');
    }

    async initiateDestructSequence() {
        this.printToLog('WARNING: DESTRUCT SEQUENCE INITIATED.', 'critical');
        if (this.audioManager) {
            this.audioManager.playSound('critical', 0.8);
        }
        await this.wait(1000);
        this.printToLog('AWAITING CONFIRMATION CODES...', 'critical');
        await this.wait(1000);
        this.printToLog('ERROR: MANUAL ACTIVATION REQUIRED AT EMERGENCY CONSOLE.', 'error');
        if (this.audioManager) {
            this.audioManager.playSound('error', 0.6);
        }
        await this.wait(500);
        this.printToLog('INSERT AND TURN KEYS TO COMMENCE COUNTDOWN.', 'warning');
    }

    async performSystemScan() {
        this.printToLog('INITIATING FULL SYSTEM SCAN...', 'warning');
        await this.wait(500);
        
        const scanStages = [
            'SCANNING POWER SYSTEMS...',
            'CHECKING LIFE SUPPORT PARAMETERS...',
            'VERIFYING NAVIGATIONAL DATA INTEGRITY...',
            'ASSESSING CREW VITAL SIGNS...',
            'MONITORING EXTERNAL SENSORS...',
            'ANALYZING SHIP HULL INTEGRITY...',
            'SCAN COMPLETE. ALL SYSTEMS NOMINAL.'
        ];
        
        for (const stage of scanStages) {
            this.printToLog(stage, 'scan-progress');
            await this.wait(600 + Math.random() * 400);
        }
        
        // Play completion beep
        if (this.audioManager) {
            this.audioManager.playSound('confirm', 0.4);
        }
    }

    async requestAccess() {
        this.printToLog('REQUESTING ACCESS TO RESTRICTED FILES...', 'warning');
        await this.wait(800);
        this.printToLog('AUTHENTICATION REQUIRED.', 'error');
        await this.wait(400);
        this.printToLog('ENTER AUTHORIZATION CODE:', 'warning');
        
        // Simulate waiting for input (in real implementation, this would wait for actual input)
        await this.wait(1500);
        this.printToLog('AUTHORIZATION FAILED. LEVEL INSUFFICIENT.', 'error');
    }

    async checkPriority() {
        this.printToLog('QUERYING SYSTEM PRIORITY PROTOCOLS...', 'warning');
        await this.wait(600);
        this.printToLog('CURRENT PRIORITY: STANDARD OPERATIONS.', 'success');
        await this.wait(300);
        this.printToLog('SPECIAL ORDER 937: CLASSIFIED - LEVEL 5 ACCESS REQUIRED.', 'warning');
    }

    async runFullDiagnostic() {
        this.printToLog('INITIATING COMPLETE SYSTEM DIAGNOSTIC...', 'warning');
        await this.wait(400);
        
        const diagnosticChecks = [
            'CPU CORE 0: NOMINAL',
            'CPU CORE 1: NOMINAL', 
            'MEMORY BANKS A-F: 98.7% INTEGRITY',
            'TAPE DRIVE UNITS 1-4: OPERATIONAL',
            'NETWORK INTERFACES: GREEN',
            'ENVIRONMENTAL SENSORS: CALIBRATED',
            'COMMUNICATION ARRAYS: NOMINAL',
            'PROPULSION SYSTEMS: STANDBY MODE',
            'WEAPONS SYSTEMS: OFFLINE (AS EXPECTED)',
            'ARTIFICIAL GRAVITY: 0.98G STABLE',
            'DIAGNOSTIC COMPLETE. SYSTEM STATUS: GREEN.'
        ];
        
        for (const check of diagnosticChecks) {
            this.printToLog(check, 'diagnostic-info');
            await this.wait(200);
        }
        
        if (this.audioManager) {
            this.audioManager.playSound('beep', 0.3);
        }
    }

    async generateExtendedStatus() {
        this.printToLog('GENERATING EXTENDED STATUS REPORT...', 'warning');
        await this.wait(500);
        
        const statusReport = `
EXTENDED STATUS REPORT
=====================
MISSION TIME: 2122-06-02 14:32:18
ELAPSED: 38D 14H 22M
CURRENT COURSE: 127.4° MARK 3
VELOCITY: 0.15 c
DESTINATION: LV-426
ETA: 18H 36M

POWER SYSTEMS:
  FUSION REACTOR: 84% EFFICIENCY
  ANTIMATTER CONTAINMENT: STABLE
  PLASMA CONDUITS: NOMINAL
  EMERGENCY BACKUP: ONLINE

LIFE SUPPORT:
  OXYGEN RECYCLER: 91% EFFICIENCY
  CO2 SCRUBBERS: NOMINAL
  TEMPERATURE CONTROL: 21.4°C STABLE
  PRESSURE REGULATION: 1.01 ATM

NAVIGATION:
  STAR TRACKER: CALIBRATED
  INERTIAL GUIDANCE: ONLINE
  DEPTH SCANNER: PASSIVE MODE
  COMMUNICATION ARRAY: MONITORING

CREW STATUS:
  ALL CREW: PRESENT AND ACCOUNTED FOR
  VITAL SIGNS: WITHIN NORMAL PARAMETERS
  SLEEP CYCLES: 2 IN CRYOSTASIS, 5 ACTIVE
  MEDICAL READY: GREEN

ENGINEERING:
  MAIN ENGINES: STANDBY
  MANEUVERING THRUSTERS: ONLINE
  HYDRAULIC SYSTEMS: NOMINAL
  STRUCTURAL INTEGRITY: 99.2%

SECURITY:
  INTERNAL SENSORS: NOMINAL
  PERIMETER MONITORING: ACTIVE
  ACCESS LOGS: NORMAL
  SPECIAL ORDER 937: SEALED
=====================
        `.trim();
        
        await this.typeResponse(statusReport, 'extended-status');
        
        if (this.audioManager) {
            this.audioManager.playSound('beep', 0.4);
        }
    }

    async showCrewDetails() {
        this.printToLog('ACCESSING CREW MONITORING DATA...', 'warning');
        await this.wait(400);
        
        const crewDetails = `
CREW MONITORING DETAILS
=====================
COMMANDER: DALLAS
  STATUS: ACTIVE | LOCATION: BRIDGE
  VITALS: HR 72 | TEMP 36.8°C | O2 98%

EXECUTIVE OFFICER: RIPLEY
  STATUS: ACTIVE | LOCATION: ENGINEERING  
  VITALS: HR 68 | TEMP 36.6°C | O2 99%

NAVIGATOR: LAMBERT
  STATUS: ACTIVE | LOCATION: NAVIGATION
  VITALS: HR 75 | TEMP 36.9°C | O2 98%

SCIENCE OFFICER: ASH
  STATUS: ACTIVE | LOCATION: MEDICAL
  VITALS: HR 70 | TEMP 36.7°C | O2 97%

ENGINEER: PARKER
  STATUS: ACTIVE | LOCATION: ENGINEERING
  VITALS: HR 71 | TEMP 36.8°C | O2 96%

TECHNICIAN: BRETT
  STATUS: ACTIVE | LOCATION: MAINTENANCE
  VITALS: HR 67 | TEMP 36.5°C | O2 98%

OFFICER: KANE
  STATUS: RESTING | LOCATION: QUARTERS
  VITALS: HR 58 | TEMP 36.4°C | O2 97%

SHIP'S CAT: JONES
  STATUS: UNKNOWN | LOCATION: UNTRACKED
  VITALS: NORMAL WHEN LOCATED
=====================
        `.trim();
        
        await this.typeResponse(crewDetails, 'crew-details');
    }

    async showNavDetails() {
        this.printToLog('ACCESSING NAVIGATION DATA...', 'warning');
        await this.wait(400);
        
        const navDetails = `
NAVIGATION DATA DETAILS
=====================
CURRENT POSITION:
  X: -2847.3 | Y: 1592.7 | Z: -834.2
  
HEADING: 127.4° MARK 3
VELOCITY: 0.15 c
GALACTIC SPEED: 0.00015 c

DESTINATION: LV-426
SYSTEM: ZETA2 RETICULI
SECTOR: G-12
QUADRANT: OUTER RIM

ORBITAL PARAMETERS:
  ALTITUDE: 12.4 km ORBITING
  INCLINATION: 28.5°
  ECCENTRICITY: 0.02
  PERIOD: 2.1 HRS

SENSOR ARRAYS:
  LONG RANGE: ACTIVE
  SHORT RANGE: PASSIVE MODE
  NAVIGATION RADAR: STANDBY
  TERRAIN SCANNER: ONLINE

LAST CORRECTION: 0.3° AT 14:22
NAVIGATION ERROR: 0.0003%
=====================
        `.trim();
        
        await this.typeResponse(navDetails, 'nav-details');
    }

    async showEngDetails() {
        this.printToLog('ACCESSING ENGINEERING DATA...', 'warning');
        await this.wait(400);
        
        const engDetails = `
ENGINEERING SYSTEMS STATUS
=====================
POWER GENERATION:
  FUSION CORE OUTPUT: 84.2 GW
  ANTIMATTER FLOW: STABLE
  PLASMA INJECTORS: NOMINAL
  CONTAINMENT FIELD: 99.4%

POWER DISTRIBUTION:
  MAIN GRID: 78.3% LOAD
  AUXILIARY SYSTEMS: 22.1% LOAD
  EMERGENCY RESERVE: 15.6 GW AVAILABLE
  EFFICIENCY: 82.7%

ENGINEERING SUBSYSTEMS:
  LIFE SUPPORT LOOP: 14.2 MW
  NAVIGATION SYSTEMS: 3.1 MW
  COMMUNICATION ARRAY: 2.8 MW
  SENSOR ARRAYS: 4.7 MW
  ENVIRONMENTAL CONTROL: 8.9 MW
  HANGAR BAY: 1.3 MW

MAIN ENGINES:
  STATUS: STANDBY READY
  THRUST AVAILABLE: 100%
  FUEL REMAINING: 68%
  IGNITION COUNT: 0

MANEUVERING:
  VECTOR THRUSTERS: 4X ONLINE
  RESPONSE TIME: 0.2s
  MAX G-FORCE: 2.5G
=====================
        `.trim();
        
        await this.typeResponse(engDetails, 'eng-details');
    }

    async showLsDetails() {
        this.printToLog('ACCESSING LIFE SUPPORT DATA...', 'warning');
        await this.wait(400);
        
        const lsDetails = `
LIFE SUPPORT SYSTEMS
=====================
ATMOSPHERIC CONTROL:
  OXYGEN PPM: 21.0%
  CO2 PPM: 0.04%
  TRACE GASES: NOMINAL
  FILTER EFFICIENCY: 94.2%

TEMPERATURE REGULATION:
  AMBIENT AVERAGE: 21.4°C
  GRADIENT: ±0.8°C STABLE
  HEAT EXCHANGERS: NOMINAL
  THERMOSTATS: CALIBRATED

PRESSURE MANAGEMENT:
  CABIN PRESSURE: 1.01 ATM
  DIFFERENTIAL: 0.01 ATM STABLE
  RELIEF VALVES: OPERATIONAL
  COMPRESSORS: CYCLING NORMAL

HUMIDITY CONTROL:
  RELATIVE HUMIDITY: 45-55%
  CONDENSATION CONTROL: ACTIVE
  MOISTURE SEPARATORS: NOMINAL

WASTE MANAGEMENT:
  SOLID WASTE: PROCESSING
  LIQUID WASTE: RECYCLING
  GAS RECLAMATION: 78% EFFICIENCY
  STORAGE LEVELS: NOMINAL

EMERGENCY SYSTEMS:
  O2 CANISTERS: 96% FULL
  SCRUBBER CANISTERS: 89% FULL
  PRESSURE SUITS: 12 READY
  MEDICAL BAYS: 2 OPERATIONAL
=====================
        `.trim();
        
        await this.typeResponse(lsDetails, 'ls-details');
    }

    async checkProtocol() {
        this.printToLog('QUERYING OPERATIONAL PROTOCOLS...', 'warning');
        await this.wait(500);
        
        this.printToLog('ACTIVE PROTOCOLS:', 'success');
        await this.wait(200);
        this.printToLog('PROTOCOL ALPHA: STANDARD NAVIGATION', 'info');
        await this.wait(150);
        this.printToLog('PROTOCOL BETA: CREW SAFETY MONITORING', 'info');
        await this.wait(150);
        this.printToLog('PROTOCOL GAMMA: EMERGENCY RESPONSE', 'info');
        await this.wait(150);
        this.printToLog('PROTOCOL DELTA: COMMUNICATIONS MAINT', 'info');
        await this.wait(150);
        this.printToLog('PROTOCOL EPSILON: POWER MANAGEMENT', 'info');
        await this.wait(150);
        this.printToLog('SPECIAL PROTOCOL 937: CLASSIFIED', 'warning');
        await this.wait(200);
        this.printToLog('ALL PROTOCOLS: NOMINAL AND FOLLOWED', 'success');
    }

    async attemptBypass() {
        this.printToLog('ATTEMPTING SECURITY BYPASS...', 'warning');
        await this.wait(1000);
        
        if (this.audioManager) {
            this.audioManager.playSound('error', 0.5);
        }
        
        this.printToLog('BYPASS DETECTED. COUNTERMEASURES ENGAGED.', 'error');
        await this.wait(500);
        this.printToLog('SECURITY LOCKDOWN INITIATED.', 'warning');
        await this.wait(400);
        this.printToLog('SYSTEM ACCESS: TEMPORARILY SUSPENDED.', 'error');
        await this.wait(300);
        this.printToLog('AWAITING SECURITY OFFICER REVIEW...', 'warning');
    }

    async attemptAuthOverride() {
        this.printToLog('ATTEMPTING AUTHORIZATION OVERRIDE...', 'warning');
        await this.wait(1200);
        
        if (this.audioManager) {
            this.audioManager.playSound('error', 0.6);
        }
        
        this.printToLog('AUTHORIZATION OVERRIDE: FAILED.', 'error');
        await this.wait(400);
        this.printToLog('REQUIRED LEVEL: NOT AVAILABLE.', 'error');
        await this.wait(300);
        this.printToLog('CONTACTING COMPANY SECURITY...', 'warning');
        await this.wait(1500);
        this.printToLog('NO RESPONSE FROM COMPANY CHANNEL.', 'error');
        await this.wait(300);
        this.printToLog('AUTHORIZATION REQUEST: DENIED.', 'error');
    }

    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    triggerPhosphorEffect() {
        // Add a random trigger class to activate phosphor layers
        const triggerClass = `phosphor-trigger-${Math.floor(Math.random() * 3) + 1}`;
        this.consoleOutput.classList.add(triggerClass);

        // Remove the trigger class after a short delay to allow fade-out
        setTimeout(() => {
            this.consoleOutput.classList.remove(triggerClass);
        }, 300);
    }

    // Unlock system for discovering commands and accessing sections
    checkUnlockConditions() {
        // Unlock SPECIAL ORDER 937 if user has discovered key crew member names
        const keyNames = ['DALLAS', 'RIPLEY', 'ASH', 'KANE', 'LAMBERT', 'PARKER', 'BRETT', 'JONES'];
        const discoveredNames = keyNames.filter(name => this.discoveredCommands.has(name));

        if (discoveredNames.length >= 4 && !this.unlockedSections.has('SPECIAL_ORDER_937')) {
            this.grantAccess('SPECIAL_ORDER_937');
            this.printToLog('SECURITY CLEARANCE LEVEL 1 ACHIEVED.', 'success');
        }

        // Unlock VAULT if user has tried INTERFACE 2037 and discovered at least 3 commands
        if (this.discoveredCommands.has('INTERFACE 2037') && this.discoveredCommands.size >= 5 && !this.unlockedSections.has('VAULT')) {
            this.grantAccess('VAULT');
            this.printToLog('VAULT ACCESS PROTOCOLS UNLOCKED.', 'success');
        }
    }

    // Session persistence methods
    loadSession() {
        try {
            const saved = localStorage.getItem(this.persistenceKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.commandHistory) {
                    this.commandHistory = parsed.commandHistory;
                    this.historyIndex = this.commandHistory.length;
                }
                if (parsed.unlockedSections) {
                    parsed.unlockedSections.forEach(section => this.unlockedSections.add(section));
                }
                if (parsed.discoveredCommands) {
                    parsed.discoveredCommands.forEach(cmd => this.discoveredCommands.add(cmd));
                }
                console.log('Session loaded from localStorage');
            }
        } catch (error) {
            console.warn('Failed to load session:', error);
        }
    }

    saveSession() {
        try {
            const sessionData = {
                commandHistory: this.commandHistory,
                unlockedSections: Array.from(this.unlockedSections),
                discoveredCommands: Array.from(this.discoveredCommands)
            };
            localStorage.setItem(this.persistenceKey, JSON.stringify(sessionData));
            console.log('Session saved to localStorage');
        } catch (error) {
            console.warn('Failed to save session:', error);
        }
    }

    // Access control methods
    attemptAccess(section) {
        if (this.unlockedSections.has(section)) {
            this.printToLog(`ACCESS GRANTED TO ${section}`, 'success');
            return true;
        } else {
            this.printToLog(`ACCESS DENIED: ${section}`, 'error');
            if (this.audioManager) this.audioManager.playError();
            return false;
        }
    }

    grantAccess(section) {
        this.unlockedSections.add(section);
        this.saveSession();
        this.printToLog(`ACCESS GRANTED: ${section}`, 'success');
        if (this.audioManager) this.audioManager.playConfirm();
    }

    listSections() {
        this.printToLog('AVAILABLE SECTIONS:', 'info');
        const sections = ['WEAPONS', 'NAVIGATION', 'ENGINEERING', 'LIFE_SUPPORT', 'COMMUNICATIONS', 'SCIENCE_LABS', 'VAULT'];
        sections.forEach(section => {
            const status = this.unlockedSections.has(section) ? 'UNLOCKED' : 'LOCKED';
            this.printToLog(`  ${section}: ${status}`);
        });
    }
}

// Export
window.NostromoConsole = NostromoConsole;
