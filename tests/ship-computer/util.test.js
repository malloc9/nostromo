/**
 * Unit tests for the ship-computer util module.
 * Run with `npm test`; the module is loaded through the same dual-export
 * pattern the browser uses, so this also proves the loading pattern works.
 */

const util = require('../../js/ship-computer/util.js');

describe('ship computer util: clamp', () => {
    test('returns the value unchanged when it lies inside the range', () => {
        expect(util.clamp(42, 0, 100)).toBe(42);
    });

    test('raises a value below the minimum to the minimum', () => {
        expect(util.clamp(-5, 0, 100)).toBe(0);
    });

    test('lowers a value above the maximum to the maximum', () => {
        expect(util.clamp(140, 0, 100)).toBe(100);
    });

    test('keeps boundary values as they are', () => {
        expect(util.clamp(0, 0, 100)).toBe(0);
        expect(util.clamp(100, 0, 100)).toBe(100);
    });
});
