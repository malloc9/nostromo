'use strict';

/**
 * Pending confirmations are engine state: set by a handler, answered by the next input,
 * and never acted on before a Y. Tested with no DOM.
 */

const ns = require('./load');

function makeEngine(handler) {
    const registry = ns.registry.createRegistry();
    registry.register({ name: 'CHANGE', handler });
    return ns.engine.createEngine({ registry });
}

// A handler that asks, and records whether its action has run.
function askingCommand(action = jest.fn(() => [{ type: 'text', text: 'DONE.' }]), cancel = jest.fn(() => [{ type: 'text', text: 'CANCELLED.' }])) {
    return (ctx) => {
        ctx.ask({
            command: 'CHANGE',
            question: [{ type: 'text', text: 'CONFIRM CHANGE? Y/N' }],
            confirm: action,
            cancel
        });
        return [{ type: 'text', text: 'CONFIRM CHANGE? Y/N' }];
    };
}

describe('pending confirmation', () => {
    test('asking changes nothing until a Y arrives', () => {
        const action = jest.fn(() => []);
        const engine = makeEngine(askingCommand(action));
        const result = engine.execute('CHANGE');
        expect(result.status).toBe('pending');
        expect(action).not.toHaveBeenCalled();
        expect(engine.pending()).not.toBeNull();
    });

    test('Y runs the action once and clears the pending question', () => {
        const action = jest.fn(() => [{ type: 'text', text: 'DONE.' }]);
        const engine = makeEngine(askingCommand(action));
        engine.execute('CHANGE');
        const answer = engine.execute('Y');
        expect(action).toHaveBeenCalledTimes(1);
        expect(answer.status).toBe('ok');
        expect(answer.blocks).toEqual([{ type: 'text', text: 'DONE.' }]);
        expect(engine.pending()).toBeNull();
    });

    test('N cancels: the cancel action runs, the change action does not', () => {
        const action = jest.fn(() => []);
        const cancel = jest.fn(() => [{ type: 'text', text: 'CANCELLED.' }]);
        const engine = makeEngine(askingCommand(action, cancel));
        engine.execute('CHANGE');
        const answer = engine.execute('N');
        expect(action).not.toHaveBeenCalled();
        expect(cancel).toHaveBeenCalledTimes(1);
        expect(answer.status).toBe('cancelled');
        expect(engine.pending()).toBeNull();
    });

    test('an invalid answer returns to the same question and changes nothing', () => {
        const action = jest.fn(() => []);
        const engine = makeEngine(askingCommand(action));
        engine.execute('CHANGE');
        const answer = engine.execute('MAYBE');
        expect(answer.status).toBe('pending');
        expect(answer.blocks.map((b) => b.text)).toContain('CONFIRM CHANGE? Y/N');
        expect(answer.blocks.map((b) => b.text).join(' ')).toContain('Y OR N');
        expect(action).not.toHaveBeenCalled();
        expect(engine.pending()).not.toBeNull();
        expect(engine.execute('Y').status).toBe('ok');
    });

    test('an empty answer is also invalid and keeps the question pending', () => {
        const engine = makeEngine(askingCommand());
        engine.execute('CHANGE');
        expect(engine.execute('   ').status).toBe('pending');
        expect(engine.pending()).not.toBeNull();
    });

    test('Escape cancels a pending question through cancelPending', () => {
        const cancel = jest.fn(() => [{ type: 'text', text: 'CANCELLED.' }]);
        const action = jest.fn(() => []);
        const engine = makeEngine(askingCommand(action, cancel));
        engine.execute('CHANGE');
        const result = engine.cancelPending();
        expect(cancel).toHaveBeenCalledTimes(1);
        expect(action).not.toHaveBeenCalled();
        expect(result.status).toBe('cancelled');
        expect(engine.pending()).toBeNull();
    });

    test('cancelPending with nothing pending does nothing', () => {
        const engine = makeEngine(askingCommand());
        expect(engine.cancelPending()).toBeNull();
    });

    test('while a question is pending, input is read as the answer, not as a command', () => {
        const engine = makeEngine(askingCommand());
        engine.execute('CHANGE');
        // "CHANGE" would run the command again if it were treated as a command.
        expect(engine.execute('CHANGE').status).toBe('pending');
    });

    test('a confirmed action that fails returns the generic failure, not an exception', () => {
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const engine = makeEngine(askingCommand(() => { throw new Error('internal detail'); }));
        engine.execute('CHANGE');
        const answer = engine.execute('Y');
        spy.mockRestore();
        expect(answer.status).toBe('error');
        expect(JSON.stringify(answer)).not.toContain('internal detail');
    });
});
