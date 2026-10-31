/**
 * Registry lookup: adding a command is only a call to register().
 */

const ns = require('./load');

const noop = () => [];

describe('registry', () => {
    test('a registered command is found by exact name, ignoring case and spacing', () => {
        const registry = ns.registry.createRegistry();
        registry.register({ name: 'STATUS', handler: noop });
        expect(registry.get('status').name).toBe('STATUS');
        expect(registry.get('  Status ').name).toBe('STATUS');
    });

    test('an unregistered name returns null', () => {
        const registry = ns.registry.createRegistry();
        expect(registry.get('NOPE')).toBeNull();
    });

    test('multi-word commands match on the leading words and report how many were used', () => {
        const registry = ns.registry.createRegistry();
        registry.register({ name: 'LIFE SUPPORT', handler: noop });
        const match = registry.match(['life', 'support', 'now']);
        expect(match.command.name).toBe('LIFE SUPPORT');
        expect(match.length).toBe(2);
    });

    test('the longest matching name wins over a shorter prefix', () => {
        const registry = ns.registry.createRegistry();
        registry.register({ name: 'SPECIAL', handler: noop });
        registry.register({ name: 'SPECIAL ORDER 937', handler: noop });
        expect(registry.match(['special', 'order', '937']).command.name).toBe('SPECIAL ORDER 937');
        expect(registry.match(['special', 'x']).command.name).toBe('SPECIAL');
    });

    test('aliases resolve to the same command', () => {
        const registry = ns.registry.createRegistry();
        registry.register({ name: 'NAVIGATION', aliases: ['NAV'], handler: noop });
        expect(registry.get('NAV').name).toBe('NAVIGATION');
        expect(registry.match(['nav']).command.name).toBe('NAVIGATION');
    });

    test('registering a duplicate name or alias is rejected', () => {
        const registry = ns.registry.createRegistry();
        registry.register({ name: 'NAVIGATION', aliases: ['NAV'], handler: noop });
        expect(() => registry.register({ name: 'NAV', handler: noop })).toThrow(/duplicate/);
    });

    test('a command needs a name and a handler', () => {
        const registry = ns.registry.createRegistry();
        expect(() => registry.register({ handler: noop })).toThrow();
        expect(() => registry.register({ name: 'X' })).toThrow();
    });

    test('list returns every registered command in registration order', () => {
        const registry = ns.registry.createRegistry();
        registry.register({ name: 'B', handler: noop });
        registry.register({ name: 'A', handler: noop });
        expect(registry.list().map((c) => c.name)).toEqual(['B', 'A']);
    });
});
