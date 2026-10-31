/**
 * Parser edge cases: normalization, quoting, empty and oversized input.
 */

const ns = require('./load');
const { tokenize, MAX_INPUT_LENGTH } = ns.parser;

const values = (raw) => tokenize(raw).tokens.map((t) => t.value);

describe('parser: tokenize', () => {
    test('empty input yields no tokens and no error', () => {
        expect(tokenize('')).toEqual({ ok: true, tokens: [] });
        expect(tokenize('   ')).toEqual({ ok: true, tokens: [] });
    });

    test('leading, trailing and repeated spaces do not change the tokens', () => {
        expect(values('  HELP    STATUS  ')).toEqual(['HELP', 'STATUS']);
        expect(values('HELP STATUS')).toEqual(values('   HELP\tSTATUS   '));
    });

    test('quoted arguments keep their inner spaces and are marked quoted', () => {
        const { tokens } = tokenize('HELP "life support"');
        expect(tokens.map((t) => t.value)).toEqual(['HELP', 'life support']);
        expect(tokens.map((t) => t.quoted)).toEqual([false, true]);
    });

    test('single quotes work the same as double quotes', () => {
        expect(values("HELP 'two words'")).toEqual(['HELP', 'two words']);
    });

    test('an unmatched quote is an error, not a partial parse', () => {
        expect(tokenize('HELP "life support')).toEqual({ ok: false, error: 'UNMATCHED_QUOTE' });
    });

    test('input longer than the limit is rejected before parsing', () => {
        const long = 'A'.repeat(MAX_INPUT_LENGTH + 1);
        expect(tokenize(long)).toEqual({ ok: false, error: 'TOO_LONG' });
    });

    test('input exactly at the limit is accepted', () => {
        const atLimit = 'A'.repeat(MAX_INPUT_LENGTH);
        expect(tokenize(atLimit).ok).toBe(true);
    });

    test('non-string input is treated as empty text', () => {
        expect(tokenize(null)).toEqual({ ok: true, tokens: [] });
        expect(tokenize(undefined)).toEqual({ ok: true, tokens: [] });
    });
});
