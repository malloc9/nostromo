/**
 * Splits raw terminal input into tokens. Pure: no DOM, no registry.
 *
 * Whitespace separates tokens. Quotes (single or double) group words into one
 * token and keep their inner spaces. Matching against commands happens later,
 * in the registry, which is where multi-word names are resolved.
 *
 * @typedef {{value: string, quoted: boolean}} Token
 * @typedef {{ok: true, tokens: Token[]} | {ok: false, error: 'TOO_LONG'|'UNMATCHED_QUOTE'}} TokenizeResult
 */
(function (root) {
    const ns = root.NostromoShipComputer = root.NostromoShipComputer || {};

    const MAX_INPUT_LENGTH = 200;

    /**
     * @param {string} raw
     * @returns {TokenizeResult}
     */
    function tokenize(raw) {
        const text = raw == null ? '' : String(raw);
        if (text.length > MAX_INPUT_LENGTH) {
            return { ok: false, error: 'TOO_LONG' };
        }

        const tokens = [];
        let current = null;
        let openQuote = null;

        for (const ch of text) {
            if (openQuote) {
                if (ch === openQuote) {
                    openQuote = null;
                } else {
                    current.value += ch;
                }
            } else if (ch === '"' || ch === "'") {
                openQuote = ch;
                current = current || { value: '', quoted: false };
                current.quoted = true;
            } else if (/\s/.test(ch)) {
                if (current) {
                    tokens.push(current);
                    current = null;
                }
            } else {
                current = current || { value: '', quoted: false };
                current.value += ch;
            }
        }

        if (openQuote) {
            return { ok: false, error: 'UNMATCHED_QUOTE' };
        }
        if (current) {
            tokens.push(current);
        }
        return { ok: true, tokens };
    }

    ns.parser = { tokenize, MAX_INPUT_LENGTH };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.parser;
    }
})(typeof window !== 'undefined' ? window : globalThis);
