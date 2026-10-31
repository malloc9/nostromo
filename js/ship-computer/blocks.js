/**
 * Structured output blocks. Command handlers return these, never HTML.
 * The terminal view decides how each type looks.
 *
 * @typedef {{type: 'text', text: string, tone?: 'urgent'|'alert'|'heading'}} TextBlock
 * @typedef {{type: 'warning', text: string}} WarningBlock
 * @typedef {{type: 'error', text: string}} ErrorBlock
 * @typedef {{type: 'table', title?: string, columns: string[], rows: string[][]}} TableBlock
 * @typedef {{type: 'status', items: Array<{label: string, value: string, state?: string}>}} StatusBlock
 * @typedef {{type: 'report'|'authorization'|'progress'|'confirmation', text?: string, lines?: string[]}} OtherBlock
 * @typedef {TextBlock|WarningBlock|ErrorBlock|TableBlock|StatusBlock|OtherBlock} Block
 */
(function (root) {
    const ns = root.NostromoShipComputer = root.NostromoShipComputer || {};

    const BLOCK_TYPES = ['text', 'warning', 'error', 'table', 'status', 'report', 'authorization', 'progress', 'confirmation'];

    /**
     * Turn whatever a handler returned into an array of blocks.
     * null or undefined becomes no blocks; a single block is wrapped; anything
     * that is not a known block type is dropped rather than rendered.
     *
     * @param {Block|Block[]|null|undefined} output
     * @returns {Block[]}
     */
    function normalize(output) {
        if (output == null) return [];
        const list = Array.isArray(output) ? output : [output];
        return list.filter((block) => block && BLOCK_TYPES.indexOf(block.type) !== -1);
    }

    ns.blocks = { BLOCK_TYPES, normalize };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.blocks;
    }
})(typeof window !== 'undefined' ? window : globalThis);
