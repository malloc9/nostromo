// Nostromo Monitoring System - Audio Manager
// Manages ambient sounds, interface effects, and audio controls

class NostromoAudioManager {
    constructor() {
        this.isEnabled = true;
        this.isMuted = false;
        this.masterVolume = 0.7;
        this.ambientVolume = 0.3;
        this.effectsVolume = 0.5;
        
        // Audio context and nodes
        this.audioContext = null;
        this.masterGainNode = null;
        this.ambientGainNode = null;
        this.effectsGainNode = null;
        
        // Audio sources
        this.ambientSources = new Map();
        this.effectSources = new Map();
        this.loadedSounds = new Map();
        
        // State tracking
        this.currentAmbientTrack = null;
        this.isInitialized = false;
        
        // Initialize audio system
        this.init();
    }

    async init() {
        try {
            // Initialize Web Audio API
            await this.initializeAudioContext();
            
            // Create audio nodes
            this.createAudioNodes();
            
            // Load sound effects
            await this.loadSoundEffects();
            
            // Start ambient audio
            this.startAmbientAudio();
            
            // Set up UI controls
            this.setupAudioControls();
            
            this.isInitialized = true;
            console.log('Nostromo Audio Manager initialized');
            
        } catch (error) {
            console.warn('Audio initialization failed:', error);
            this.isEnabled = false;
        }
    }

    async initializeAudioContext() {
        // Create audio context with user gesture requirement handling
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Handle suspended context (Chrome autoplay policy)
        if (this.audioContext.state === 'suspended') {
            // Wait for user interaction to resume context
            document.addEventListener('click', this.resumeAudioContext.bind(this), { once: true });
            document.addEventListener('keydown', this.resumeAudioContext.bind(this), { once: true });
        }
    }

    async resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
            console.log('Audio context resumed');
        }
    }

    createAudioNodes() {
        if (!this.audioContext) return;

        // Create master gain node
        this.masterGainNode = this.audioContext.createGain();
        this.masterGainNode.gain.value = this.masterVolume;
        this.masterGainNode.connect(this.audioContext.destination);

        // Create ambient audio gain node
        this.ambientGainNode = this.audioContext.createGain();
        this.ambientGainNode.gain.value = this.ambientVolume;
        this.ambientGainNode.connect(this.masterGainNode);

        // Create effects gain node
        this.effectsGainNode = this.audioContext.createGain();
        this.effectsGainNode.gain.value = this.effectsVolume;
        this.effectsGainNode.connect(this.masterGainNode);
    }

    async loadSoundEffects() {
        // Define sound effects to load
        const soundEffects = {
            // Interface sounds
            'keypress': this.generateKeypressSound(),
            'beep': this.generateBeepSound(),
            'alert': this.generateAlertSound(),
            'error': this.generateErrorSound(),
            'confirm': this.generateConfirmSound(),
            'navigation': this.generateNavigationSound(),
            
            // System sounds
            'startup': this.generateStartupSound(),
            'shutdown': this.generateShutdownSound(),
            'data-update': this.generateDataUpdateSound(),
            'warning': this.generateWarningSound(),
            'critical': this.generateCriticalSound(),
            
            // Ambient sounds
            'ship-hum': this.generateShipHumSound(),
            'computer-processing': this.generateComputerProcessingSound(),
            'ventilation': this.generateVentilationSound()
        };

        // Load all sound effects
        for (const [name, soundData] of Object.entries(soundEffects)) {
            try {
                this.loadedSounds.set(name, soundData);
            } catch (error) {
                console.warn(`Failed to load sound effect: ${name}`, error);
            }
        }
    }

    // Sound generation methods using Web Audio API
    generateKeypressSound() {
        return {
            type: 'generated',
            generator: (context, destination) => {
                const oscillator = context.createOscillator();
                const gainNode = context.createGain();
                const filter = context.createBiquadFilter();
                
                // More retro terminal-like sound
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(1200, context.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(800, context.currentTime + 0.02);
                
                // Add filter for more authentic sound
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(2000, context.currentTime);
                filter.Q.setValueAtTime(1, context.currentTime);
                
                gainNode.gain.setValueAtTime(0.08, context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.06);
                
                oscillator.connect(filter);
                filter.connect(gainNode);
                gainNode.connect(destination);
                
                oscillator.start(context.currentTime);
                oscillator.stop(context.currentTime + 0.06);
                
                return { oscillator, gainNode, filter };
            }
        };
    }

    generateBeepSound() {
        return {
            type: 'generated',
            generator: (context, destination) => {
                const oscillator = context.createOscillator();
                const gainNode = context.createGain();
                
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(1000, context.currentTime);
                
                gainNode.gain.setValueAtTime(0.2, context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2);
                
                oscillator.connect(gainNode);
                gainNode.connect(destination);
                
                oscillator.start(context.currentTime);
                oscillator.stop(context.currentTime + 0.2);
                
                return { oscillator, gainNode };
            }
        };
    }

    generateAlertSound() {
        return {
            type: 'generated',
            generator: (context, destination) => {
                const oscillator1 = context.createOscillator();
                const oscillator2 = context.createOscillator();
                const gainNode = context.createGain();
                
                oscillator1.type = 'sawtooth';
                oscillator1.frequency.setValueAtTime(440, context.currentTime);
                oscillator1.frequency.setValueAtTime(880, context.currentTime + 0.1);
                oscillator1.frequency.setValueAtTime(440, context.currentTime + 0.2);
                
                oscillator2.type = 'sine';
                oscillator2.frequency.setValueAtTime(220, context.currentTime);
                
                gainNode.gain.setValueAtTime(0.3, context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
                
                oscillator1.connect(gainNode);
                oscillator2.connect(gainNode);
                gainNode.connect(destination);
                
                oscillator1.start(context.currentTime);
                oscillator2.start(context.currentTime);
                oscillator1.stop(context.currentTime + 0.5);
                oscillator2.stop(context.currentTime + 0.5);
                
                return { oscillator1, oscillator2, gainNode };
            }
        };
    }

    generateErrorSound() {
        return {
            type: 'generated',
            generator: (context, destination) => {
                const oscillator = context.createOscillator();
                const gainNode = context.createGain();
                
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(200, context.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(100, context.currentTime + 0.3);
                
                gainNode.gain.setValueAtTime(0.4, context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
                
                oscillator.connect(gainNode);
                gainNode.connect(destination);
                
                oscillator.start(context.currentTime);
                oscillator.stop(context.currentTime + 0.3);
                
                return { oscillator, gainNode };
            }
        };
    }

    generateConfirmSound() {
        return {
            type: 'generated',
            generator: (context, destination) => {
                const oscillator = context.createOscillator();
                const gainNode = context.createGain();
                
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(600, context.currentTime);
                oscillator.frequency.setValueAtTime(800, context.currentTime + 0.1);
                
                gainNode.gain.setValueAtTime(0.2, context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2);
                
                oscillator.connect(gainNode);
                gainNode.connect(destination);
                
                oscillator.start(context.currentTime);
                oscillator.stop(context.currentTime + 0.2);
                
                return { oscillator, gainNode };
            }
        };
    }

    generateNavigationSound() {
        return {
            type: 'generated',
            generator: (context, destination) => {
                const oscillator = context.createOscillator();
                const gainNode = context.createGain();
                
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(400, context.currentTime);
                oscillator.frequency.setValueAtTime(600, context.currentTime + 0.05);
                oscillator.frequency.setValueAtTime(500, context.currentTime + 0.1);
                
                gainNode.gain.setValueAtTime(0.15, context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.15);
                
                oscillator.connect(gainNode);
                gainNode.connect(destination);
                
                oscillator.start(context.currentTime);
                oscillator.stop(context.currentTime + 0.15);
                
                return { oscillator, gainNode };
            }
        };
    }

    generateStartupSound() {
        return {
            type: 'generated',
            generator: (context, destination) => {
                const oscillator = context.createOscillator();
                const gainNode = context.createGain();
                
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(200, context.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(800, context.currentTime + 1.0);
                
                gainNode.gain.setValueAtTime(0.1, context.currentTime);
                gainNode.gain.setValueAtTime(0.3, context.currentTime + 0.5);
                gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 1.0);
                
                oscillator.connect(gainNode);
                gainNode.connect(destination);
                
                oscillator.start(context.currentTime);
                oscillator.stop(context.currentTime + 1.0);
                
                return { oscillator, gainNode };
            }
        };
    }

    generateShutdownSound() {
        return {
            type: 'generated',
            generator: (context, destination) => {
                const oscillator = context.createOscillator();
                const gainNode = context.createGain();
                
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(800, context.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(200, context.currentTime + 1.0);
                
                gainNode.gain.setValueAtTime(0.3, context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 1.0);
                
                oscillator.connect(gainNode);
                gainNode.connect(destination);
                
                oscillator.start(context.currentTime);
                oscillator.stop(context.currentTime + 1.0);
                
                return { oscillator, gainNode };
            }
        };
    }

    generateDataUpdateSound() {
        return {
            type: 'generated',
            generator: (context, destination) => {
                const oscillator = context.createOscillator();
                const gainNode = context.createGain();
                
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(1200, context.currentTime);
                oscillator.frequency.setValueAtTime(1000, context.currentTime + 0.02);
                
                gainNode.gain.setValueAtTime(0.05, context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.05);
                
                oscillator.connect(gainNode);
                gainNode.connect(destination);
                
                oscillator.start(context.currentTime);
                oscillator.stop(context.currentTime + 0.05);
                
                return { oscillator, gainNode };
            }
        };
    }

    generateWarningSound() {
        return {
            type: 'generated',
            generator: (context, destination) => {
                const oscillator = context.createOscillator();
                const gainNode = context.createGain();
                
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(660, context.currentTime);
                oscillator.frequency.setValueAtTime(440, context.currentTime + 0.2);
                oscillator.frequency.setValueAtTime(660, context.currentTime + 0.4);
                
                gainNode.gain.setValueAtTime(0.25, context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.6);
                
                oscillator.connect(gainNode);
                gainNode.connect(destination);
                
                oscillator.start(context.currentTime);
                oscillator.stop(context.currentTime + 0.6);
                
                return { oscillator, gainNode };
            }
        };
    }

    generateCriticalSound() {
        return {
            type: 'generated',
            generator: (context, destination) => {
                const oscillator1 = context.createOscillator();
                const oscillator2 = context.createOscillator();
                const gainNode = context.createGain();
                
                oscillator1.type = 'sawtooth';
                oscillator1.frequency.setValueAtTime(330, context.currentTime);
                
                oscillator2.type = 'square';
                oscillator2.frequency.setValueAtTime(165, context.currentTime);
                
                gainNode.gain.setValueAtTime(0.4, context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.8);
                
                oscillator1.connect(gainNode);
                oscillator2.connect(gainNode);
                gainNode.connect(destination);
                
                oscillator1.start(context.currentTime);
                oscillator2.start(context.currentTime);
                oscillator1.stop(context.currentTime + 0.8);
                oscillator2.stop(context.currentTime + 0.8);
                
                return { oscillator1, oscillator2, gainNode };
            }
        };
    }

    generateShipHumSound() {
        return {
            type: 'ambient',
            generator: (context, destination) => {
                const oscillator1 = context.createOscillator();
                const oscillator2 = context.createOscillator();
                const oscillator3 = context.createOscillator();
                const gainNode = context.createGain();
                const filter = context.createBiquadFilter();
                
                oscillator1.type = 'sine';
                oscillator1.frequency.setValueAtTime(60, context.currentTime);
                
                oscillator2.type = 'sine';
                oscillator2.frequency.setValueAtTime(120, context.currentTime);
                
                oscillator3.type = 'sine';
                oscillator3.frequency.setValueAtTime(180, context.currentTime);
                
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(200, context.currentTime);
                filter.Q.setValueAtTime(1, context.currentTime);
                
                gainNode.gain.setValueAtTime(0.1, context.currentTime);
                
                oscillator1.connect(filter);
                oscillator2.connect(filter);
                oscillator3.connect(filter);
                filter.connect(gainNode);
                gainNode.connect(destination);
                
                oscillator1.start(context.currentTime);
                oscillator2.start(context.currentTime);
                oscillator3.start(context.currentTime);
                
                return { 
                    oscillators: [oscillator1, oscillator2, oscillator3], 
                    gainNode, 
                    filter,
                    stop: () => {
                        oscillator1.stop();
                        oscillator2.stop();
                        oscillator3.stop();
                    }
                };
            }
        };
    }

    generateComputerProcessingSound() {
        return {
            type: 'ambient',
            generator: (context, destination) => {
                const noiseBuffer = this.createNoiseBuffer(context, 2);
                const noiseSource = context.createBufferSource();
                const filter = context.createBiquadFilter();
                const gainNode = context.createGain();
                
                noiseSource.buffer = noiseBuffer;
                noiseSource.loop = true;
                
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(2000, context.currentTime);
                filter.Q.setValueAtTime(10, context.currentTime);
                
                gainNode.gain.setValueAtTime(0.02, context.currentTime);
                
                noiseSource.connect(filter);
                filter.connect(gainNode);
                gainNode.connect(destination);
                
                noiseSource.start(context.currentTime);
                
                return { 
                    noiseSource, 
                    filter, 
                    gainNode,
                    stop: () => noiseSource.stop()
                };
            }
        };
    }

    generateVentilationSound() {
        return {
            type: 'ambient',
            generator: (context, destination) => {
                const noiseBuffer = this.createNoiseBuffer(context, 4);
                const noiseSource = context.createBufferSource();
                const filter = context.createBiquadFilter();
                const gainNode = context.createGain();
                
                noiseSource.buffer = noiseBuffer;
                noiseSource.loop = true;
                
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(800, context.currentTime);
                filter.Q.setValueAtTime(0.5, context.currentTime);
                
                gainNode.gain.setValueAtTime(0.05, context.currentTime);
                
                noiseSource.connect(filter);
                filter.connect(gainNode);
                gainNode.connect(destination);
                
                noiseSource.start(context.currentTime);
                
                return { 
                    noiseSource, 
                    filter, 
                    gainNode,
                    stop: () => noiseSource.stop()
                };
            }
        };
    }

    createNoiseBuffer(context, duration) {
        const sampleRate = context.sampleRate;
        const bufferSize = sampleRate * duration;
        const buffer = context.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        return buffer;
    }

    // Public API methods
    playSound(soundName, volume = 1.0) {
        if (!this.isEnabled || this.isMuted || !this.isInitialized) {
            return;
        }

        const sound = this.loadedSounds.get(soundName);
        if (!sound) {
            console.warn(`Sound '${soundName}' not found`);
            return;
        }

        try {
            if (sound.type === 'generated') {
                const nodes = sound.generator(this.audioContext, this.effectsGainNode);
                // Adjust volume if specified
                if (nodes.gainNode && volume !== 1.0) {
                    const currentGain = nodes.gainNode.gain.value;
                    nodes.gainNode.gain.setValueAtTime(currentGain * volume, this.audioContext.currentTime);
                }
            }
        } catch (error) {
            console.warn(`Failed to play sound '${soundName}':`, error);
        }
    }

    startAmbientAudio() {
        if (!this.isEnabled || this.isMuted || !this.isInitialized) {
            return;
        }

        // Start ship hum
        this.startAmbientTrack('ship-hum');
        
        // Start computer processing sounds with random intervals
        this.scheduleRandomComputerSounds();
        
        // Start ventilation sounds
        setTimeout(() => {
            this.startAmbientTrack('ventilation');
        }, 2000);
    }

    startAmbientTrack(trackName) {
        if (this.ambientSources.has(trackName)) {
            return; // Already playing
        }

        const sound = this.loadedSounds.get(trackName);
        if (!sound || sound.type !== 'ambient') {
            return;
        }

        try {
            const nodes = sound.generator(this.audioContext, this.ambientGainNode);
            this.ambientSources.set(trackName, nodes);
        } catch (error) {
            console.warn(`Failed to start ambient track '${trackName}':`, error);
        }
    }

    stopAmbientTrack(trackName) {
        const source = this.ambientSources.get(trackName);
        if (source && source.stop) {
            source.stop();
            this.ambientSources.delete(trackName);
        }
    }

    scheduleRandomComputerSounds() {
        if (!this.isEnabled || this.isMuted) {
            return;
        }

        const playRandomSound = () => {
            if (Math.random() < 0.3) { // 30% chance
                this.playSound('data-update', 0.3);
            }
            
            // Schedule next random sound
            const nextDelay = 3000 + Math.random() * 7000; // 3-10 seconds
            setTimeout(playRandomSound, nextDelay);
        };

        // Start the random sound cycle
        setTimeout(playRandomSound, 5000);
    }

    // Audio control methods
    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.masterGainNode) {
            this.masterGainNode.gain.setValueAtTime(
                this.isMuted ? 0 : this.masterVolume,
                this.audioContext.currentTime
            );
        }

        this.updateAudioControls();
        this.playSound('confirm');
        
        return this.isMuted;
    }

    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        
        if (this.masterGainNode && !this.isMuted) {
            this.masterGainNode.gain.setValueAtTime(
                this.masterVolume,
                this.audioContext.currentTime
            );
        }
    }

    setAmbientVolume(volume) {
        this.ambientVolume = Math.max(0, Math.min(1, volume));
        
        if (this.ambientGainNode) {
            this.ambientGainNode.gain.setValueAtTime(
                this.ambientVolume,
                this.audioContext.currentTime
            );
        }
    }

    setEffectsVolume(volume) {
        this.effectsVolume = Math.max(0, Math.min(1, volume));
        
        if (this.effectsGainNode) {
            this.effectsGainNode.gain.setValueAtTime(
                this.effectsVolume,
                this.audioContext.currentTime
            );
        }
    }

    // UI Integration
    setupAudioControls() {
        const audioToggle = document.getElementById('audio-toggle');
        if (audioToggle) {
            audioToggle.addEventListener('click', () => {
                this.toggleMute();
            });
            
            // Update initial state
            this.updateAudioControls();
        }
    }

    updateAudioControls() {
        const audioToggle = document.getElementById('audio-toggle');
        if (audioToggle) {
            const statusText = this.isMuted ? 'MUTED' : 'ON';
            audioToggle.textContent = `[F8] AUDIO: ${statusText}`;
            audioToggle.classList.toggle('muted', this.isMuted);
        }
    }

    // Convenience methods for common interface sounds
    playKeypress() {
        this.playSound('keypress', 0.5);
    }

    playBeep() {
        this.playSound('beep');
    }

    playNavigation() {
        this.playSound('navigation');
    }

    playAlert() {
        this.playSound('alert');
    }

    playError() {
        this.playSound('error');
    }

    playConfirm() {
        this.playSound('confirm');
    }

    playWarning() {
        this.playSound('warning');
    }

    playCritical() {
        this.playSound('critical');
    }

    // Boot sequence specific methods
    playSystemBoot() {
        this.playSound('startup');
    }

    playSystemLoad() {
        this.playSound('beep', 0.3);
    }

    // Cleanup
    destroy() {
        // Stop all ambient tracks
        for (const [trackName] of this.ambientSources) {
            this.stopAmbientTrack(trackName);
        }

        // Close audio context
        if (this.audioContext) {
            this.audioContext.close();
        }

        this.isInitialized = false;
        console.log('Nostromo Audio Manager destroyed');
    }
}

// Export for use in other modules
window.NostromoAudioManager = NostromoAudioManager;