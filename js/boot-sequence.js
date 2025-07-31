// Nostromo Monitoring System - Boot Sequence Module
// Handles system initialization, boot screens, and loading transitions

class NostromoBootSequence {
    constructor() {
        this.bootMessages = [
            'INITIALIZING MU/TH/UR 6000 MAINFRAME...',
            'LOADING SHIP SYSTEM PROTOCOLS...',
            'ESTABLISHING SENSOR NETWORK...',
            'CONNECTING TO NAVIGATION ARRAY...',
            'ACTIVATING CREW MONITORING...',
            'RUNNING SYSTEM DIAGNOSTICS...',
            'ALL SYSTEMS NOMINAL',
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
        this.typingSpeed = 20; // milliseconds per character (faster)
        this.messageDelay = 800; // delay between messages (faster)
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
            await this.wait(100);
            messageElement.style.opacity = '1';
            
            // Type the message
            await this.typeMessage(messageElement, message);
            
            // Wait before next message
            await this.wait(this.messageDelay);
            
            // Clear previous messages to keep screen clean
            if (i < this.bootMessages.length - 1) {
                messageElement.style.opacity = '0';
                await this.wait(150);
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
        await this.wait(100);
        headerElement.style.opacity = '1';
        await this.typeMessage(headerElement, 'RUNNING SYSTEM DIAGNOSTICS...');
        
        await this.wait(500);
        
        // Run diagnostic checks
        for (let i = 0; i < this.diagnosticMessages.length; i++) {
            const diagnostic = this.diagnosticMessages[i];
            
            const diagElement = document.createElement('div');
            diagElement.className = 'boot-line diagnostic-line';
            diagElement.style.opacity = '0';
            messagesContainer.appendChild(diagElement);
            
            await this.wait(150);
            diagElement.style.opacity = '1';
            
            await this.typeMessage(diagElement, diagnostic);
            await this.wait(250);
        }
        
        await this.wait(500);
        
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
        await this.wait(250);
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
            
            // Typing sound removed - silent typing
            
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
        
        // Error sound removed - silent error handling
    }
    
    // Complete the boot sequence and transition to main system
    completeBootSequence() {
        if (!this.bootComplete) {
            return false;
        }
        
        const bootScreen = document.getElementById('boot-screen');
        if (bootScreen && bootScreen.classList.contains('active')) {
            // Confirmation sound removed - silent completion
            
            // Hide boot screen with fade effect
            bootScreen.style.opacity = '0';
            
            setTimeout(() => {
                bootScreen.classList.remove('active');
                bootScreen.style.opacity = '1';
                
                // Navigate to dashboard
                if (window.router) {
                    window.router.navigateTo('dashboard', true);
                }
            }, 250);
            
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
                
                // Loading sound removed - silent loading
                
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