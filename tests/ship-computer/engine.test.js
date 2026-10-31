/**
 * Engine lifecycle, tested with plain strings and no DOM.
 */

const ns = require('./load');

function makeEngine(extra = {}) {
    const registry = ns.registry.createRegistry();
    ns.systemCommands.register(registry);
    registry.register({
        name: 'PING',
        description: 'TEST COMMAND.',
        usage: 'PING [TARGET]',
        category: 'TEST',
        args: [{ name: 'TARGET', required: false }],
        handler: (ctx) => [{ type: 'text', text: `PONG ${ctx.args.join(' ')}`.trim() }]
    });
    registry.register({
        name: 'BOOM',
        handler: () => { throw new Error('internal detail at line 42'); }
    });
    registry.register({
        name: 'NEEDS',
        args: [{ name: 'SYSTEM', required: true }],
        usage: 'NEEDS SYSTEM',
        handler: () => [{ type: 'text', text: 'OK' }]
    });
    return ns.engine.createEngine({ registry, ...extra });
}

const textOf = (result) => result.blocks.map((b) => b.text || '').join('\n');

describe('engine: lifecycle', () => {
    test('a string goes in and a structured result comes out', () => {
        const engine = makeEngine();
        const result = engine.execute('ping radar');
        expect(result.status).toBe('ok');
        expect(result.command).toBe('PING');
        expect(result.blocks).toEqual([{ type: 'text', text: 'PONG radar' }]);
    });

    test('empty input is a no-op that touches neither history nor hooks', () => {
        const refreshState = jest.fn();
        const recordEvent = jest.fn();
        const engine = makeEngine({ hooks: { refreshState, recordEvent } });
        expect(engine.execute('   ').status).toBe('empty');
        expect(engine.history).toHaveLength(0);
        expect(refreshState).not.toHaveBeenCalled();
        expect(recordEvent).not.toHaveBeenCalled();
    });

    test('hooks run in order: state refresh before the handler, event recording after', () => {
        const calls = [];
        const engine = makeEngine({
            hooks: {
                refreshState: () => calls.push('refresh'),
                recordEvent: (r) => calls.push(`record:${r.command}`)
            }
        });
        engine.execute('PING');
        expect(calls).toEqual(['refresh', 'record:PING']);
    });

    test('every executed command is recorded in history', () => {
        const engine = makeEngine();
        engine.execute('PING a');
        engine.execute('PING b');
        expect(engine.history.map((r) => r.input)).toEqual(['PING a', 'PING b']);
    });

    test('a handler that throws produces a generic error and no exception text', () => {
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const engine = makeEngine();
        const result = engine.execute('BOOM');
        spy.mockRestore();
        expect(result.status).toBe('error');
        expect(result.blocks).toEqual([
            { type: 'error', text: 'COMMAND FAILED. MU/TH/UR COULD NOT COMPLETE THIS REQUEST.' }
        ]);
        expect(JSON.stringify(result)).not.toMatch(/internal detail|at line|Error/);
    });

    test('an unknown command returns an error block naming the input and pointing to HELP', () => {
        const engine = makeEngine();
        const result = engine.execute('frobnicate now');
        expect(result.status).toBe('unknown');
        expect(result.command).toBeNull();
        const text = textOf(result);
        expect(text).toContain('FROBNICATE NOW');
        expect(text).toContain('HELP');
        expect(result.blocks[0].type).toBe('error');
    });

    test('an unknown command never refreshes or changes state', () => {
        const refreshState = jest.fn();
        const engine = makeEngine({ hooks: { refreshState } });
        engine.execute('frobnicate');
        expect(refreshState).not.toHaveBeenCalled();
    });

    test('input the registry does not know falls back to the legacy responder', () => {
        const fallback = jest.fn((input) => (input === 'STATUS' ? [{ type: 'text', text: 'LEGACY' }] : null));
        const engine = makeEngine({ fallback });
        const result = engine.execute('status');
        expect(fallback).toHaveBeenCalledWith('STATUS');
        expect(result.status).toBe('fallback');
        expect(result.blocks).toEqual([{ type: 'text', text: 'LEGACY' }]);
    });

    test('when the fallback has no answer the unknown-command error is used', () => {
        const engine = makeEngine({ fallback: () => null });
        expect(engine.execute('zzz').status).toBe('unknown');
    });

    test('a handler that reports its own error block gives an error status, not ok', () => {
        const registry = ns.registry.createRegistry();
        registry.register({ name: 'PICKY', handler: () => [{ type: 'error', text: 'BAD COUNT' }] });
        const result = ns.engine.createEngine({ registry }).execute('PICKY');
        expect(result.status).toBe('error');
    });

    test('a missing required argument returns an error that shows the usage', () => {
        const engine = makeEngine();
        const result = engine.execute('NEEDS');
        expect(result.status).toBe('error');
        expect(textOf(result)).toContain('NEEDS SYSTEM');
    });

    test('a command the privilege check refuses does not run', () => {
        const handler = jest.fn(() => []);
        const registry = ns.registry.createRegistry();
        registry.register({ name: 'LOCKED', privilege: 'COMMANDER', handler });
        const engine = ns.engine.createEngine({ registry, isPermitted: () => false });
        const result = engine.execute('LOCKED');
        expect(handler).not.toHaveBeenCalled();
        expect(result.status).toBe('error');
    });

    test('by default every privilege is permitted (placeholder until the privilege ticket)', () => {
        const engine = makeEngine();
        expect(engine.execute('PING').status).toBe('ok');
    });

    test('unmatched quote and oversized input return errors and do not run any handler', () => {
        const handler = jest.fn(() => []);
        const registry = ns.registry.createRegistry();
        registry.register({ name: 'PING', handler });
        const engine = ns.engine.createEngine({ registry });
        expect(engine.execute('PING "open').status).toBe('error');
        expect(engine.execute('PING ' + 'x'.repeat(300)).status).toBe('error');
        expect(handler).not.toHaveBeenCalled();
    });
});
