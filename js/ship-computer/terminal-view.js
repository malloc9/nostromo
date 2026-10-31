/**
 * Terminal presentation for engine output. The only ship-computer module that
 * touches the DOM. Every string goes in through textContent, so handler text
 * is never parsed as markup.
 */
(function (root) {
    const ns = root.NostromoShipComputer = root.NostromoShipComputer || {};

    /**
     * @param {Document} doc
     * @param {string} tag
     * @param {string} [className]
     * @param {string} [text]
     * @returns {HTMLElement}
     */
    function make(doc, tag, className, text) {
        const node = doc.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
    }

    function renderTable(doc, block) {
        const wrap = make(doc, 'div', 'mother-table');
        if (block.title) wrap.appendChild(make(doc, 'div', 'mother-table-title', block.title));

        const header = make(doc, 'div', 'mother-table-row mother-table-head');
        block.columns.forEach((col) => header.appendChild(make(doc, 'span', 'mother-table-cell', col)));
        wrap.appendChild(header);

        block.rows.forEach((row) => {
            const line = make(doc, 'div', 'mother-table-row');
            row.forEach((cell) => line.appendChild(make(doc, 'span', 'mother-table-cell', cell)));
            wrap.appendChild(line);
        });
        return wrap;
    }

    function renderStatus(doc, block) {
        const list = make(doc, 'div', 'mother-status');
        block.items.forEach((item) => {
            const state = item.state ? ` mother-status-${item.state}` : '';
            const row = make(doc, 'div', `mother-status-item${state}`);
            row.appendChild(make(doc, 'span', 'mother-status-label', item.label));
            row.appendChild(make(doc, 'span', 'mother-status-value', item.value));
            list.appendChild(row);
        });
        return list;
    }

    /**
     * @param {Document} doc
     * @param {import('./blocks.js').Block} block
     * @returns {HTMLElement}
     */
    function renderBlock(doc, block) {
        switch (block.type) {
            case 'text': {
                const extra = block.tone === 'heading' ? 'mother-heading' : (block.tone || '');
                return make(doc, 'div', `mother-response ${extra}`.trim(), block.text);
            }
            case 'warning':
                return make(doc, 'div', 'mother-response alert', block.text);
            case 'error':
                return make(doc, 'div', 'mother-response error', block.text);
            case 'table':
                return renderTable(doc, block);
            case 'status':
                return renderStatus(doc, block);
            default: {
                // report, authorization, progress and confirmation read as plain text until styled
                const text = block.lines ? block.lines.join('\n') : (block.text || '');
                return make(doc, 'div', 'mother-response', text);
            }
        }
    }

    /**
     * Append rendered blocks to an output container.
     * @param {HTMLElement} container
     * @param {import('./blocks.js').Block[]} blocks
     */
    function renderBlocks(container, blocks) {
        const doc = container.ownerDocument;
        blocks.forEach((block) => container.appendChild(renderBlock(doc, block)));
    }

    /**
     * Echo what the user typed, as its own line above the response.
     * @param {HTMLElement} container
     * @param {string} input
     */
    function echo(container, input) {
        const doc = container.ownerDocument;
        const line = make(doc, 'div', 'mother-input-line-echo');
        line.appendChild(make(doc, 'span', 'mother-prompt', '>'));
        line.appendChild(doc.createTextNode(' '));
        line.appendChild(make(doc, 'span', 'mother-user-text', input));
        container.appendChild(line);
    }

    ns.terminalView = { renderBlocks, echo };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.terminalView;
    }
})(typeof window !== 'undefined' ? window : globalThis);
