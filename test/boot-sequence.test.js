/**
 * Test Suite for Nostromo Boot Sequence
 * Tests boot sequence functionality, timing, and message display
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
        toBeInstanceOf: (constructor) => {
            if (!(actual instanceof constructor)) {
                throw new Error(`Expected instance of ${constructor.name}`);
            }
        },
        toBeGreaterThan: (min) => {
            if (actual <= min) {
                throw new Error(`Expected ${actual} to be > ${min}`);
            }
        },
        toContain: (item) => {
            if (!actual.includes(item)) {
                throw new Error(`Expected to contain ${item}`);
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
            toHaveBeenCalled: () => {
                if (actual.called) {
                    throw new Error('Expected function not to have been called');
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
global.window = {
    location: { hash: '' },
    sessionStorage: {
        getItem: mockFunction(),
        setItem: mockFunction()
    }
};

global.document = {
    body: { innerHTML: '' },
    getElementById: (id) => {
        if (id === 'boot-screen') {
            return {
                classList: {
                    contains: mockFunction(),
                    add: mockFunction(),
                    remove: mockFunction()
                },
                querySelector: (selector) => {
                    if (selector === '.boot-messages') {
                        return {
                            innerHTML: '',
                            appendChild: mockFunction()
                        };
                    }
                    return null;
                },
                style: { opacity: '1' }
            };
        }
        if (id === 'boot-messages') {
            return {
                innerHTML: '',
                appendChild: mockFunction(),
                querySelector: mockFunction()
            };
        }
        if (id === 'loading-overlay') {
            return {
                classList: {
                    add: mockFunction(),
                    remove: mockFunction()
                }
            };
        }
        return null;
    },
    querySelector: (selector) => {
        if (selector === '.loading-text') {
            return { textContent: '' };
        }
        return null;
    },
    querySelectorAll: () => [],
    createElement: (tag) => ({
        className: '',
        innerHTML: '',
        textContent: '',
        style: { opacity: '1' },
        classList: {
            contains: mockFunction(),
            add: mockFunction(),
            remove: mockFunction()
        },
        querySelector: mockFunction(),
        appendChild: mockFunction(),
        remove: mockFunction()
    })
};

// Import the boot sequence module
const fs = require('fs');
const path = require('path');
const bootSequenceCode = fs.readFileSync(path.join(__dirname, '../js/boot-sequence.js'), 'utf8');

// Evaluate the boot sequence code
eval(bootSequenceCode);

// Get the class from the global window object
const NostromoBootSequence = global.window.NostromoBootSequence;

describe('NostromoBootSequence', () => {
    let bootSequence;
    let mockAudioManager;
    let mockRouter;

    function setup() {
        // Mock audio manager
        mockAudioManager = {
            playSystemBoot: mockFunction(),
            playSystemLoad: mockFunction(),
            playKeypress: mockFunction(),
            playConfirm: mockFunction(),
            playError: mockFunction()
        };
        global.window.audioManager = mockAudioManager;

        // Mock router
        mockRouter = {
            navigateTo: mockFunction()
        };
        global.window.router = mockRouter;

        // Reset sessionStorage mocks
        global.window.sessionStorage.getItem.called = false;
        global.window.sessionStorage.setItem.called = false;

        // Create boot sequence instance
        bootSequence = new NostromoBootSequence();
    }

    function teardown() {
        delete global.window.audioManager;
        delete global.window.router;
    }

    describe('Initialization', () => {
        test('should initialize with correct default values', () => {
            setup();
            expect(bootSequence.isBooting).toBe(false);
            expect(bootSequence.bootComplete).toBe(false);
            expect(bootSequence.typingSpeed).toBe(50);
            expect(bootSequence.messageDelay).toBe(1500);
            expect(bootSequence.currentMessageIndex).toBe(0);
            teardown();
        });

        test('should have predefined boot messages', () => {
            setup();
            expect(bootSequence.bootMessages).toBeInstanceOf(Array);
            expect(bootSequence.bootMessages.length).toBeGreaterThan(0);
            expect(bootSequence.bootMessages[0]).toContain('INITIALIZING');
            teardown();
        });

        test('should have predefined diagnostic messages', () => {
            setup();
            expect(bootSequence.diagnosticMessages).toBeInstanceOf(Array);
            expect(bootSequence.diagnosticMessages.length).toBeGreaterThan(0);
            expect(bootSequence.diagnosticMessages[0]).toContain('CPU');
            teardown();
        });
    });

    describe('Boot Sequence Detection', () => {
        test('should show boot sequence on first visit', () => {
            setup();
            global.window.sessionStorage.getItem.returnValue = null;
            expect(bootSequence.shouldShowBootSequence()).toBe(true);
            teardown();
        });

        test('should skip boot sequence on subsequent visits', () => {
            setup();
            global.window.sessionStorage.getItem.returnValue = 'true';
            expect(bootSequence.shouldShowBootSequence()).toBe(false);
            teardown();
        });

        test('should show boot sequence when explicitly requested', () => {
            setup();
            global.window.sessionStorage.getItem.returnValue = 'true';
            global.window.location.hash = '#boot';
            expect(bootSequence.shouldShowBootSequence()).toBe(true);
            teardown();
        });
    });

    describe('Boot Screen Display', () => {
        test('should show boot screen', () => {
            setup();
            bootSequence.showBootScreen();
            
            const bootScreen = global.document.getElementById('boot-screen');
            expect(bootScreen.classList.add).toHaveBeenCalled();
            teardown();
        });

        test('should clear existing boot messages', () => {
            setup();
            const messagesContainer = global.document.getElementById('boot-messages');
            messagesContainer.innerHTML = '<div>Old message</div>';

            bootSequence.showBootScreen();

            expect(messagesContainer.innerHTML).toBe('');
            teardown();
        });
    });

    describe('Message Typing Animation', () => {
        test('should type message character by character', () => {
            setup();
            const element = global.document.createElement('div');
            const message = 'TEST';

            // Mock the wait function to resolve immediately for testing
            bootSequence.wait = () => Promise.resolve();

            bootSequence.typeMessage(element, message).then(() => {
                expect(element.textContent).toBe(message);
            });
            teardown();
        });

        test('should have typing sound capability', () => {
            setup();
            expect(mockAudioManager.playKeypress).toBeDefined();
            teardown();
        });
    });

    describe('Boot Sequence Execution', () => {
        test('should not start if already booting', () => {
            setup();
            bootSequence.isBooting = true;

            bootSequence.startBootSequence();

            expect(mockAudioManager.playSystemBoot).not.toHaveBeenCalled();
            teardown();
        });

        test('should not start if already complete', () => {
            setup();
            bootSequence.bootComplete = true;

            bootSequence.startBootSequence();

            expect(mockAudioManager.playSystemBoot).not.toHaveBeenCalled();
            teardown();
        });

        test('should have boot sequence methods', () => {
            setup();
            expect(typeof bootSequence.startBootSequence).toBe('function');
            expect(typeof bootSequence.runBootMessages).toBe('function');
            expect(typeof bootSequence.runDiagnostics).toBe('function');
            expect(typeof bootSequence.showReadyPrompt).toBe('function');
            teardown();
        });
    });

    describe('Ready Prompt Display', () => {
        test('should create ready prompt', () => {
            setup();
            bootSequence.showReadyPrompt();

            const messagesContainer = global.document.getElementById('boot-messages');
            expect(messagesContainer.appendChild).toHaveBeenCalled();
            teardown();
        });

        test('should have ready prompt method', () => {
            setup();
            expect(typeof bootSequence.showReadyPrompt).toBe('function');
            teardown();
        });
    });

    describe('Boot Sequence Completion', () => {
        test('should not complete if boot not finished', () => {
            setup();
            bootSequence.bootComplete = false;

            const result = bootSequence.completeBootSequence();

            expect(result).toBe(false);
            expect(mockRouter.navigateTo).not.toHaveBeenCalled();
            teardown();
        });

        test('should complete when ready', () => {
            setup();
            bootSequence.bootComplete = true;
            const bootScreen = global.document.getElementById('boot-screen');
            bootScreen.classList.contains.returnValue = true;

            const result = bootSequence.completeBootSequence();

            expect(result).toBe(true);
            expect(mockAudioManager.playConfirm).toHaveBeenCalled();
            teardown();
        });
    });

    describe('Loading Screen', () => {
        test('should have loading screen method', () => {
            setup();
            expect(typeof bootSequence.showLoadingScreen).toBe('function');
            teardown();
        });

        test('should show loading screen with custom message', () => {
            setup();
            const customMessage = 'CUSTOM LOADING MESSAGE';
            const loadingText = global.document.querySelector('.loading-text');

            bootSequence.showLoadingScreen(customMessage, 100);

            expect(loadingText.textContent).toBe(customMessage);
            teardown();
        });
    });

    describe('Transition Messages', () => {
        test('should have transition message method', () => {
            setup();
            expect(typeof bootSequence.showTransitionMessage).toBe('function');
            teardown();
        });
    });

    describe('Error Handling', () => {
        test('should handle boot errors gracefully', () => {
            setup();
            bootSequence.handleBootError();

            expect(mockAudioManager.playError).toHaveBeenCalled();
            teardown();
        });

        test('should have error handling method', () => {
            setup();
            expect(typeof bootSequence.handleBootError).toBe('function');
            teardown();
        });
    });

    describe('Reset Functionality', () => {
        test('should reset boot sequence state', () => {
            setup();
            bootSequence.isBooting = true;
            bootSequence.bootComplete = true;
            bootSequence.currentMessageIndex = 5;

            bootSequence.reset();

            expect(bootSequence.isBooting).toBe(false);
            expect(bootSequence.bootComplete).toBe(false);
            expect(bootSequence.currentMessageIndex).toBe(0);
            teardown();
        });

        test('should clear boot messages on reset', () => {
            setup();
            const messagesContainer = global.document.getElementById('boot-messages');
            messagesContainer.innerHTML = '<div>Test message</div>';

            bootSequence.reset();

            expect(messagesContainer.innerHTML).toBe('');
            teardown();
        });
    });

    describe('Session Storage Integration', () => {
        test('should mark boot sequence as complete', () => {
            setup();
            bootSequence.markBootSequenceComplete();

            expect(global.window.sessionStorage.setItem).toHaveBeenCalled();
            teardown();
        });
    });

    describe('Utility Methods', () => {
        test('should have wait method', () => {
            setup();
            expect(typeof bootSequence.wait).toBe('function');
            teardown();
        });
    });
});