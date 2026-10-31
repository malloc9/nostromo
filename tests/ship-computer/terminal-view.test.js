/**
 * @jest-environment jsdom
 *
 * Block renderer: the only place engine output becomes DOM. Handler text must
 * be escaped, never inserted as markup.
 */

const ns = require('./load');

describe('terminal view: renderBlocks', () => {
    let out;

    beforeEach(() => {
        out = document.createElement('div');
    });

    test('handler text is escaped, never inserted as markup', () => {
        ns.terminalView.renderBlocks(out, [
            { type: 'text', text: '<img src=x onerror="alert(1)">' }
        ]);
        expect(out.querySelector('img')).toBeNull();
        expect(out.textContent).toContain('<img src=x onerror="alert(1)">');
    });

    test('echoed user input is escaped too', () => {
        ns.terminalView.echo(out, '<b>HI</b>');
        expect(out.querySelector('b')).toBeNull();
        expect(out.textContent).toContain('<b>HI</b>');
    });

    test('each block type gets its own class', () => {
        ns.terminalView.renderBlocks(out, [
            { type: 'text', text: 'plain' },
            { type: 'warning', text: 'careful' },
            { type: 'error', text: 'broken' }
        ]);
        const classes = Array.from(out.children).map((el) => el.className);
        expect(classes[0]).toContain('mother-response');
        expect(classes[1]).toContain('alert');
        expect(classes[2]).toContain('error');
    });

    test('a table block renders a header row and one row per entry', () => {
        ns.terminalView.renderBlocks(out, [
            { type: 'table', columns: ['COMMAND', 'DESCRIPTION'], rows: [['HELP', 'LISTS']] }
        ]);
        expect(out.querySelectorAll('.mother-table-row')).toHaveLength(2);
        expect(out.textContent).toContain('COMMAND');
        expect(out.textContent).toContain('HELP');
    });

    test('block types without a special look render as plain text', () => {
        ns.terminalView.renderBlocks(out, [
            { type: 'report', lines: ['LINE ONE', 'LINE TWO'] },
            { type: 'confirmation', text: 'PROCEED? Y/N' }
        ]);
        expect(out.textContent).toContain('LINE ONE');
        expect(out.textContent).toContain('PROCEED? Y/N');
    });
});
