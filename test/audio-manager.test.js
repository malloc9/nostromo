/**
 * Test Suite for Nostromo Audio Manager
 * Tests audio loading, playback, and control functionality
 */

// Simple test framework
function describe(name, fn) {
    console.log(`\n=== ${name} ===`);
    fn();
}

function test(name, fn) {
    try {
        fn();
        console.log(`✓ ${name}`);
    } catch (error) {
        console.log(`✗ ${name}: ${error.message}`);
    }
}

function expect(actual) {
    return {
        toBe: (expected) => {
            if (actual !== expected) {
                throw new Error(`Expected ${expected}, got ${actual}`);
            }
        },
        toBeDefined: () => {
            if (actual === undefined) {
                throw new Error('Expected value to be defined');
            }
        },
        toHaveLength: (length) => {
            if (actual.length !== length) {
                throw new Error(`Expected length ${length}, got ${actual.length}`);
            }
        },
        toHaveProperty: (prop) => {
            if (!(prop in actual)) {
                throw new Error(`Expected object to have property ${prop}`);
            }
        },
        toBeGreaterThanOrEqual: (min) => {
            if (actual < min) {
                throw new Error(`Expected ${actual} to be >= ${min}`);
            }
        },
        toBeLessThanOrEqual: (max) => {
            if (actual > max) {
                throw new Error(`Expected ${actual} to be <= ${max}`);
            }
        },
        toContain: (item) => {
            if (!actual.includes(item)) {
                throw new Error(`Expected array to contain ${item}`);
            }
        },
        toBeGreaterThan: (min) => {
            if (actual <= min) {
                throw new Error(`Expected ${actual} to be > ${min}`);
            }
        },
        toHaveBeenCalled: () => {
            if (!actual.called) {
                throw new Error('Expected function to have been called');
            }
        },
        toHaveBeenCalledWith: (...args) => {
            if (!actual.calledWith || !actual.calledWith.some(call => 
                call.length === args.length && call.every((arg, i) => arg === args[i])
            )) {
                throw new Error(`Expected function to have been called with ${JSON.stringify(args)}`);
            }
        },
        not: {
            toThrow: () => {
                try {
                    actual();
                } catch (error) {
                    throw new Error('Expected function not to throw');
                }
            }
        }
    };
}

// Mock function helper
function mockFunction() {
    const fn = function(...args) {
        fn.called = true;
        fn.calledWith = fn.calledWith || [];
        fn.calledWith.push(args);
        return fn.returnValue;
    };
    fn.called = false;
    fn.calledWith = [];
    fn.returnValue = undefined;
    return fn;
}

// Mock DOM environment
global.window = {};
global.document = {
    body: { innerHTML: '' },
    getElementById: (id) => {
        if (id === 'audio-toggle') {
            return {
                addEventListener: mockFunction(),
                textContent: '',
                classList: {
                    toggle: mockFunction()
                }
            };
        }
        return null;
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: mockFunction()
};

// Mock Web Audio API
const mockGainNode = {
    gain: {
        value: 1,
        setValueAtTime: mockFunction(),
        exponentialRampToValueAtTime: mockFunction()
    },
    connect: mockFunction()
};

const mockOscillator = {
    type: 'sine',
    frequency: {
        setValueAtTime: mockFunction(),
        exponentialRampToValueAtTime: mockFunction()
    },
    connect: mockFunction(),
    start: mockFunction(),
    stop: mockFunction()
};

const mockAudioContext = {
    state: 'running',
    currentTime: 0,
    sampleRate: 44100,
    destination: {},
    createGain: mockFunction(),
    createOscillator: mockFunction(),
    createBiquadFilter: mockFunction(),
    createBuffer: mockFunction(),
    createBufferSource: mockFunction(),
    resume: mockFunction(),
    close: mockFunction()
};

// Set up mock returns
mockAudioContext.createGain.returnValue = mockGainNode;
mockAudioContext.createOscillator.returnValue = mockOscillator;
mockAudioContext.createBiquadFilter.returnValue = {
    type: 'lowpass',
    frequency: { setValueAtTime: mockFunction() },
    Q: { setValueAtTime: mockFunction() },
    connect: mockFunction()
};
mockAudioContext.createBuffer.returnValue = {
    getChannelData: mockFunction()
};
mockAudioContext.createBuffer.returnValue.getChannelData.returnValue = new Float32Array(1024);
mockAudioContext.createBufferSource.returnValue = {
    buffer: null,
    loop: false,
    connect: mockFunction(),
    start: mockFunction(),
    stop: mockFunction()
};

// Mock global AudioContext
global.AudioContext = function() { return mockAudioContext; };
global.webkitAudioContext = function() { return mockAudioContext; };

// Import the audio manager
const fs = require('fs');
const path = require('path');
const audioManagerCode = fs.readFileSync(path.join(__dirname, '../js/audio-manager.js'), 'utf8');

// Set up global window object for the module
global.window = global.window || {};

// Evaluate the audio manager code
eval(audioManagerCode);

// Get the class from the global window object
const NostromoAudioManager = global.window.NostromoAudioManager;

describe('NostromoAudioManager', () => {
    let audioManager;

    function setup() {
        // Reset mocks
        Object.keys(mockAudioContext).forEach(key => {
            if (typeof mockAudioContext[key] === 'function') {
                mockAudioContext[key].called = false;
                mockAudioContext[key].calledWith = [];
            }
        });
        
        // Create audio manager instance
        audioManager = new NostromoAudioManager();
    }

    function teardown() {
        if (audioManager) {
            audioManager.destroy();
        }
    }

    describe('Initialization', () => {
        test('should initialize audio context', () => {
            setup();
            expect(audioManager.audioContext).toBeDefined();
            expect(audioManager.audioContext).toBe(mockAudioContext);
            teardown();
        });

        test('should create audio nodes', () => {
            setup();
            expect(mockAudioContext.createGain).toHaveBeenCalled();
            expect(mockGainNode.connect).toHaveBeenCalled();
            teardown();
        });

        test('should set initial volume levels', () => {
            setup();
            expect(audioManager.masterVolume).toBe(0.7);
            expect(audioManager.ambientVolume).toBe(0.3);
            expect(audioManager.effectsVolume).toBe(0.5);
            teardown();
        });

        test('should load sound effects', () => {
            setup();
            expect(audioManager.loadedSounds.size).toBeGreaterThan(0);
            expect(audioManager.loadedSounds.has('keypress')).toBe(true);
            expect(audioManager.loadedSounds.has('beep')).toBe(true);
            expect(audioManager.loadedSounds.has('alert')).toBe(true);
            teardown();
        });
    });

    describe('Sound Generation', () => {
        test('should generate keypress sound', () => {
            setup();
            const keypressSound = audioManager.generateKeypressSound();
            expect(keypressSound.type).toBe('generated');
            expect(typeof keypressSound.generator).toBe('function');
            teardown();
        });

        test('should generate beep sound', () => {
            setup();
            const beepSound = audioManager.generateBeepSound();
            expect(beepSound.type).toBe('generated');
            expect(typeof beepSound.generator).toBe('function');
            teardown();
        });

        test('should generate alert sound', () => {
            setup();
            const alertSound = audioManager.generateAlertSound();
            expect(alertSound.type).toBe('generated');
            expect(typeof alertSound.generator).toBe('function');
            teardown();
        });

        test('should generate ambient sounds', () => {
            setup();
            const shipHumSound = audioManager.generateShipHumSound();
            expect(shipHumSound.type).toBe('ambient');
            expect(typeof shipHumSound.generator).toBe('function');
            teardown();
        });
    });

    describe('Sound Playback', () => {
        test('should play sound effects when enabled', () => {
            setup();
            audioManager.isInitialized = true;
            audioManager.isEnabled = true;
            audioManager.isMuted = false;
            
            audioManager.playSound('keypress');
            expect(mockAudioContext.createOscillator).toHaveBeenCalled();
            expect(mockOscillator.start).toHaveBeenCalled();
            teardown();
        });

        test('should not play sounds when muted', () => {
            setup();
            audioManager.isInitialized = true;
            audioManager.isEnabled = true;
            audioManager.isMuted = true;
            
            // Reset mock call tracking
            mockAudioContext.createOscillator.called = false;
            
            audioManager.playSound('beep');
            expect(mockAudioContext.createOscillator.called).toBe(false);
            teardown();
        });

        test('should not play sounds when disabled', () => {
            setup();
            audioManager.isInitialized = true;
            audioManager.isEnabled = false;
            audioManager.isMuted = false;
            
            // Reset mock call tracking
            mockAudioContext.createOscillator.called = false;
            
            audioManager.playSound('beep');
            expect(mockAudioContext.createOscillator.called).toBe(false);
            teardown();
        });

        test('should handle invalid sound names gracefully', () => {
            setup();
            audioManager.isInitialized = true;
            audioManager.isEnabled = true;
            audioManager.isMuted = false;
            
            // Should not throw error
            expect(() => {
                audioManager.playSound('invalid-sound');
            }).not.toThrow();
            teardown();
        });
    });

    describe('Ambient Audio', () => {
        test('should start ambient tracks', () => {
            setup();
            audioManager.isInitialized = true;
            audioManager.isEnabled = true;
            audioManager.isMuted = false;
            
            audioManager.startAmbientTrack('ship-hum');
            expect(audioManager.ambientSources.has('ship-hum')).toBe(true);
            teardown();
        });

        test('should not start duplicate ambient tracks', () => {
            setup();
            audioManager.isInitialized = true;
            audioManager.isEnabled = true;
            audioManager.isMuted = false;
            
            audioManager.startAmbientTrack('ship-hum');
            const initialSize = audioManager.ambientSources.size;
            audioManager.startAmbientTrack('ship-hum');
            expect(audioManager.ambientSources.size).toBe(initialSize);
            teardown();
        });

        test('should stop ambient tracks', () => {
            setup();
            audioManager.isInitialized = true;
            audioManager.isEnabled = true;
            audioManager.isMuted = false;
            
            audioManager.startAmbientTrack('ship-hum');
            expect(audioManager.ambientSources.has('ship-hum')).toBe(true);
            
            audioManager.stopAmbientTrack('ship-hum');
            expect(audioManager.ambientSources.has('ship-hum')).toBe(false);
            teardown();
        });
    });

    describe('Volume Controls', () => {
        test('should toggle mute state', () => {
            setup();
            expect(audioManager.isMuted).toBe(false);
            
            const result = audioManager.toggleMute();
            expect(result).toBe(true);
            expect(audioManager.isMuted).toBe(true);
            
            audioManager.toggleMute();
            expect(audioManager.isMuted).toBe(false);
            teardown();
        });

        test('should set master volume', () => {
            setup();
            audioManager.setMasterVolume(0.5);
            expect(audioManager.masterVolume).toBe(0.5);
            teardown();
        });

        test('should clamp volume values', () => {
            setup();
            audioManager.setMasterVolume(1.5);
            expect(audioManager.masterVolume).toBe(1);
            
            audioManager.setMasterVolume(-0.5);
            expect(audioManager.masterVolume).toBe(0);
            teardown();
        });

        test('should set ambient volume', () => {
            setup();
            audioManager.setAmbientVolume(0.2);
            expect(audioManager.ambientVolume).toBe(0.2);
            teardown();
        });

        test('should set effects volume', () => {
            setup();
            audioManager.setEffectsVolume(0.8);
            expect(audioManager.effectsVolume).toBe(0.8);
            teardown();
        });
    });

    describe('UI Integration', () => {
        test('should setup audio controls', () => {
            setup();
            const mockElement = document.getElementById('audio-toggle');
            
            audioManager.setupAudioControls();
            expect(mockElement.addEventListener).toHaveBeenCalled();
            teardown();
        });

        test('should update audio controls display', () => {
            setup();
            const mockElement = document.getElementById('audio-toggle');
            
            audioManager.updateAudioControls();
            expect(mockElement.textContent).toBe('[F8] AUDIO: ON');
            
            audioManager.isMuted = true;
            audioManager.updateAudioControls();
            expect(mockElement.textContent).toBe('[F8] AUDIO: MUTED');
            teardown();
        });
    });

    describe('Convenience Methods', () => {
        test('should provide convenience methods for common sounds', () => {
            setup();
            audioManager.isInitialized = true;
            audioManager.isEnabled = true;
            audioManager.isMuted = false;
            
            // Test that convenience methods exist and don't throw
            expect(() => {
                audioManager.playKeypress();
                audioManager.playBeep();
                audioManager.playNavigation();
                audioManager.playAlert();
                audioManager.playError();
                audioManager.playConfirm();
                audioManager.playWarning();
                audioManager.playCritical();
            }).not.toThrow();
            teardown();
        });
    });

    describe('Error Handling', () => {
        test('should handle audio context creation failure gracefully', () => {
            // Mock AudioContext to throw error
            const originalAudioContext = global.AudioContext;
            global.AudioContext = function() {
                throw new Error('Audio context creation failed');
            };
            
            expect(() => {
                const failingAudioManager = new NostromoAudioManager();
            }).not.toThrow();
            
            // Restore original
            global.AudioContext = originalAudioContext;
        });

        test('should handle sound generation errors gracefully', () => {
            setup();
            audioManager.isInitialized = true;
            audioManager.isEnabled = true;
            audioManager.isMuted = false;
            
            // Mock oscillator creation to throw error
            const originalCreateOscillator = mockAudioContext.createOscillator;
            mockAudioContext.createOscillator = function() {
                throw new Error('Oscillator creation failed');
            };
            
            expect(() => {
                audioManager.playSound('keypress');
            }).not.toThrow();
            
            // Restore original
            mockAudioContext.createOscillator = originalCreateOscillator;
            teardown();
        });
    });

    describe('Cleanup', () => {
        test('should destroy audio manager properly', () => {
            setup();
            audioManager.startAmbientTrack('ship-hum');
            expect(audioManager.ambientSources.size).toBeGreaterThan(0);
            
            audioManager.destroy();
            
            expect(audioManager.ambientSources.size).toBe(0);
            expect(mockAudioContext.close).toHaveBeenCalled();
            expect(audioManager.isInitialized).toBe(false);
            teardown();
        });
    });

    describe('Noise Buffer Creation', () => {
        test('should create noise buffer with correct parameters', () => {
            setup();
            const duration = 2;
            audioManager.createNoiseBuffer(mockAudioContext, duration);
            
            expect(mockAudioContext.createBuffer).toHaveBeenCalled();
            teardown();
        });
    });
});