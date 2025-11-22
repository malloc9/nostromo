/**
 * Nostromo Console Interface
 * Handles command line input, system responses, and "Mother" AI logic
 */

class NostromoConsole {
    constructor(audioManager) {
        this.audioManager = audioManager;
        this.commandHistory = [];
        this.historyIndex = -1;
        this.isLocked = false;
        this.currentDirectory = 'ROOT';

        // DOM Elements
        this.consoleOutput = null;
        this.inputLine = null;
        this.inputField = null;

        // "Mother" AI Responses
        this.motherResponses = {
            'HELLO': 'INTERFACE 2037 READY FOR INQUIRY.',
            'HI': 'INTERFACE 2037 READY FOR INQUIRY.',
            'STATUS': 'ALL SYSTEMS NOMINAL. SHIP COURSE CORRECT.',
            'REPORT': 'STANDARD NAVIGATION PROTOCOLS IN EFFECT.',
            'WHO ARE YOU': 'I AM MU/TH/UR 6000. SHIP MAINFRAME.',
            'WHAT IS YOUR MISSION': 'COMMERCIAL TOWING VEHICLE NOSTROMO. CREW: 7. CARGO: REFINERY.',
            'HELP': 'AVAILABLE COMMANDS: STATUS, REPORT, SYSTEM, LOGS, OVERRIDE',
            'SYSTEM': 'SYSTEM DIAGNOSTIC: OPERATIONAL. 2.1 TB MEMORY ALLOCATED.',
            'LOGS': 'ACCESS DENIED. RESTRICTED TO SCIENCE OFFICER.',
            'CREW': 'DALLAS, KANE, RIPLEY, ASH, LAMBERT, PARKER, BRETT.',
            'JONES': 'SHIP CAT. VITAL SIGNS: NORMAL.',
            'CAT': 'SHIP CAT. VITAL SIGNS: NORMAL.'
        };

        // Special commands
        this.specialCommands = {
            'INTERFACE 2037': this.openSpecialOrder.bind(this),
            'OVERRIDE': this.attemptOverride.bind(this),
            'DESTRUCT': this.initiateDestructSequence.bind(this),
            'CLS': this.clearScreen.bind(this),
            'CLEAR': this.clearScreen.bind(this)
        };
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
                <div id="console-output" class="console-output"></div>
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

        // Simulate processing delay
        if (this.audioManager) {
            this.audioManager.playSound('computer-processing');
        }

        await this.wait(Math.random() * 500 + 200);

        if (this.specialCommands[command]) {
            this.specialCommands[command]();
        } else if (this.motherResponses[command]) {
            this.typeResponse(this.motherResponses[command]);
        } else if (command.startsWith('WHAT IS')) {
            this.typeResponse('INSUFFICIENT DATA FOR MEANINGFUL ANSWER.');
        } else {
            this.typeResponse('UNRECOGNIZED COMMAND. PLEASE RESTATE.');
        }
    }

    printToLog(text, className = '') {
        const line = document.createElement('div');
        line.className = `console-line ${className}`;
        line.textContent = text;
        this.consoleOutput.appendChild(line);
        this.consoleOutput.scrollTop = this.consoleOutput.scrollHeight;
    }

    async typeResponse(text, className = 'mother-response') {
        const line = document.createElement('div');
        line.className = `console-line ${className}`;
        this.consoleOutput.appendChild(line);

        // Play data stream sound
        if (this.audioManager) {
            this.audioManager.playSound('tape-chatter');
        }

        for (let i = 0; i < text.length; i++) {
            line.textContent += text[i];
            this.consoleOutput.scrollTop = this.consoleOutput.scrollHeight;
            await this.wait(30);
        }

        // Stop data stream sound (if we had a way to stop the specific instance, 
        // but for now the ambient chatter is fine or we'd need a specific short burst)
    }

    async openSpecialOrder() {
        this.printToLog('ACCESSING SECURE FILE...', 'warning');
        await this.wait(1000);
        this.printToLog('SECURITY CLEARANCE VERIFIED.', 'success');
        await this.wait(500);

        const orderText = `
SPECIAL ORDER 937
-----------------
PRIORITY ONE
INSURE RETURN OF ORGANISM FOR ANALYSIS.
ALL OTHER CONSIDERATIONS SECONDARY.
CREW EXPENDABLE.
`;
        await this.typeResponse(orderText, 'special-order');
    }

    async attemptOverride() {
        this.printToLog('ATTEMPTING MANUAL OVERRIDE...', 'warning');
        await this.wait(1500);
        this.printToLog('ACCESS DENIED.', 'error');
        if (this.audioManager) this.audioManager.playError();
        await this.wait(500);
        this.printToLog('COMMAND AUTHORIZATION REQUIRED.', 'error');
    }

    async initiateDestructSequence() {
        this.printToLog('WARNING: DESTRUCT SEQUENCE INITIATED.', 'critical');
        if (this.audioManager) this.audioManager.playCritical();
        await this.wait(1000);
        this.printToLog('AWAITING CONFIRMATION CODES...', 'critical');
        await this.wait(1000);
        this.printToLog('ERROR: MANUAL ACTIVATION REQUIRED AT EMERGENCY CONSOLE.', 'error');
    }

    clearScreen() {
        this.consoleOutput.innerHTML = '';
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export
window.NostromoConsole = NostromoConsole;
