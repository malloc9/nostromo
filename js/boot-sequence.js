// Nostromo Monitoring System - Boot Sequence Module
// Handles system initialization, boot screens, and loading transitions

class NostromoBootSequence {
    constructor() {
        this.bootMessages = [
            'INITIALIZING MU/TH/UR 6000 MAINFRAME...',
            'LOADING SHIP SYSTEM PROTOCOLS...',
            'ESTABLISHING SENSOR NETWORK...',
            'CALIBRATING ENVIRONMENTAL CONTROLS...',
            'CONNECTING TO NAVIGATION ARRAY...',
            'ACTIVATING CREW MONITORING...',
            'POWER GRID SYNCHRONIZATION...',
            'RUNNING SYSTEM DIAGNOSTICS...',
            'ALL SYSTEMS NOMINAL',
            'NOSTROMO MONITORING SYSTEM READY'
        ];
        
        this.diagnosticMessages = [
            'CPU: MU/TH/UR 6000 SERIES - OK',
            'MEMORY: 2048KB AVAILABLE - OK',
            'STORAGE: MAGNETIC TAPE DRIVES - OK',
            'NETWORK: SHIP SYSTEMS ONLINE - OK',
            'SENSORS: ALL ARRAYS RESPONDING - OK',
            'POWER: FUSION REACTOR STABLE - OK'
        ];
        
        this.isBooting = false;
        this.bootComplete = false;
        this.typingSpeed = 50; // milliseconds per character
        this.messageDelay = 1500; // delay between messages
        this.currentMessageIndex = 0;
        
        this.init();
    }
    
    init() {
        console.log('Boot sequence system initialized');
    }
    
    // Start the complete boot sequence
    async startBootSequence() {
        if (this.isBooting || this.bootComplete) {
            return;
        }
        
        this.isBooting = true;
        
        try {
            // Show boot screen
            this.showBootScreen();
            
            // Play boot sound if available
            if (window.audioManager) {
                window.audioManager.playSystemBoot();
            }
            
            // Run boot messages sequence
            await this.runBootMessages();
            
            // Show system diagnostics
            await this.runDiagnostics();
            
            // Show ready prompt
            this.showReadyPrompt();
            
            this.bootComplete = true;
            
        } catch (error) {
            console.error('Boot sequence error:', error);
            this.handleBootError();
        } finally {
            this.isBooting = false;
        }
    }
    
    // Show the boot screen
    showBootScreen() {
        const bootScreen = document.getElementById('boot-screen');
        const allScreens = document.querySelectorAll('.screen');
        
        // Hide all other screens
        allScreens.forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show boot screen
        if (bootScreen) {
            bootScreen.classList.add('active');
            
            // Clear any existing content
            const messagesContainer = bootScreen.querySelector('.boot-messages');
            if (messagesContainer) {
                messagesContainer.innerHTML = '';
            }
        }
    }
    
    // Run the boot messages with typing animation
    async runBootMessages() {
        const messagesContainer = document.querySelector('.boot-messages');
        if (!messagesContainer) return;
        
        for (let i = 0; i < this.bootMessages.length; i++) {
            const message = this.bootMessages[i];
            
            // Create message element
            const messageElement = document.createElement('div');
            messageElement.className = 'boot-line';
            messageElement.style.opacity = '0';
            messagesContainer.appendChild(messageElement);
            
            // Fade in the message line
            await this.wait(200);
            messageElement.style.opacity = '1';
            
            // Type the message
            await this.typeMessage(messageElement, message);
            
            // Wait before next message
            await this.wait(this.messageDelay);
            
            // Clear previous messages to keep screen clean
            if (i < this.bootMessages.length - 1) {
                messageElement.style.opacity = '0';
                await this.wait(300);
                messageElement.remove();
            }
        }
    }
    
    // Run system diagnostics
    async runDiagnostics() {
        const messagesContainer = document.querySelector('.boot-messages');
        if (!messagesContainer) return;
        
        // Clear boot messages
        messagesContainer.innerHTML = '';
        
        // Add diagnostics header with typing animation
        const headerElement = document.createElement('div');
        headerElement.className = 'boot-line diagnostic-header';
        headerElement.style.opacity = '0';
        messagesContainer.appendChild(headerElement);
        
        // Fade in and type the diagnostics header
        await this.wait(200);
        headerElement.style.opacity = '1';
        await this.typeMessage(headerElement, 'RUNNING SYSTEM DIAGNOSTICS...');
        
        await this.wait(1000);
        
        // Run diagnostic checks
        for (let i = 0; i < this.diagnosticMessages.length; i++) {
            const diagnostic = this.diagnosticMessages[i];
            
            const diagElement = document.createElement('div');
            diagElement.className = 'boot-line diagnostic-line';
            diagElement.style.opacity = '0';
            messagesContainer.appendChild(diagElement);
            
            await this.wait(300);
            diagElement.style.opacity = '1';
            
            await this.typeMessage(diagElement, diagnostic);
            await this.wait(500);
        }
        
        await this.wait(1000);
        
        // Clear diagnostics
        messagesContainer.innerHTML = '';
    }
    
    // Show the ready prompt with typing animation
    async showReadyPrompt() {
        const messagesContainer = document.querySelector('.boot-messages');
        if (!messagesContainer) return;
        
        const promptElement = document.createElement('div');
        promptElement.className = 'boot-line';
        promptElement.style.opacity = '0';
        messagesContainer.appendChild(promptElement);
        
        // Fade in and type the ready message
        await this.wait(500);
        promptElement.style.opacity = '1';
        await this.typeMessage(promptElement, 'SYSTEM READY - PRESS ANY KEY TO CONTINUE');
        
        // Add blinking cursor after typing
        const cursor = document.createElement('span');
        cursor.className = 'cursor';
        cursor.textContent = '_';
        cursor.style.marginLeft = '10px';
        promptElement.appendChild(cursor);
        
        // Add blinking animation to cursor
        setInterval(() => {
            cursor.style.opacity = cursor.style.opacity === '0' ? '1' : '0';
        }, 500);
    }
    
    // Type a message with animation
    async typeMessage(element, message) {
        element.textContent = '';
        
        for (let i = 0; i < message.length; i++) {
            element.textContent += message[i];
            
            // Play typing sound occasionally
            if (window.audioManager && Math.random() < 0.3) {
                window.audioManager.playKeypress();
            }
            
            await this.wait(this.typingSpeed);
        }
    }
    
    // Handle boot errors
    handleBootError() {
        const messagesContainer = document.querySelector('.boot-messages');
        if (!messagesContainer) return;
        
        messagesContainer.innerHTML = `
            <div class="boot-line error-message">
                SYSTEM ERROR - BOOT SEQUENCE FAILED
            </div>
            <div class="boot-prompt">
                <span class="prompt-text">PRESS ANY KEY TO RETRY</span>
                <span class="cursor">_</span>
            </div>
        `;
        
        if (window.audioManager) {
            window.audioManager.playError();
        }
    }
    
    // Complete the boot sequence and transition to main system
    completeBootSequence() {
        if (!this.bootComplete) {
            return false;
        }
        
        const bootScreen = document.getElementById('boot-screen');
        if (bootScreen && bootScreen.classList.contains('active')) {
            // Play confirmation sound
            if (window.audioManager) {
                window.audioManager.playConfirm();
            }
            
            // Hide boot screen with fade effect
            bootScreen.style.opacity = '0';
            
            setTimeout(() => {
                bootScreen.classList.remove('active');
                bootScreen.style.opacity = '1';
                
                // Navigate to dashboard
                if (window.router) {
                    window.router.navigateTo('dashboard', true);
                }
            }, 500);
            
            return true;
        }
        
        return false;
    }
    
    // Create loading screen for transitions
    showLoadingScreen(message = 'LOADING SYSTEM...', duration = 2000) {
        return new Promise((resolve) => {
            const loadingOverlay = document.getElementById('loading-overlay');
            const loadingText = document.querySelector('.loading-text');
            
            if (loadingOverlay && loadingText) {
                loadingText.textContent = message;
                loadingOverlay.classList.add('active');
                
                // Play loading sound
                if (window.audioManager) {
                    window.audioManager.playSystemLoad();
                }
                
                setTimeout(() => {
                    loadingOverlay.classList.remove('active');
                    resolve();
                }, duration);
            } else {
                resolve();
            }
        });
    }
    
    // Show transition message between screens
    async showTransitionMessage(fromScreen, toScreen) {
        const messages = [
            `DISCONNECTING FROM ${fromScreen.toUpperCase()}...`,
            `ESTABLISHING CONNECTION TO ${toScreen.toUpperCase()}...`,
            `${toScreen.toUpperCase()} SYSTEM READY`
        ];
        
        for (const message of messages) {
            await this.showLoadingScreen(message, 800);
        }
    }
    
    // Utility method for delays
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Reset boot sequence for testing
    reset() {
        this.isBooting = false;
        this.bootComplete = false;
        this.currentMessageIndex = 0;
        
        const bootScreen = document.getElementById('boot-screen');
        if (bootScreen) {
            const messagesContainer = bootScreen.querySelector('.boot-messages');
            if (messagesContainer) {
                messagesContainer.innerHTML = '';
            }
        }
    }
    
    // Check if boot sequence is needed
    shouldShowBootSequence() {
        // Always show boot sequence on page load, or if explicitly requested
        // Clear any existing session flag to ensure boot sequence shows
        sessionStorage.removeItem('nostromo-boot-seen');
        return true;
    }
    
    // Mark boot sequence as seen
    markBootSequenceComplete() {
        sessionStorage.setItem('nostromo-boot-seen', 'true');
    }
}

// Export for use in other modules
window.NostromoBootSequence = NostromoBootSequence;