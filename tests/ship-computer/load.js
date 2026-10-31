/**
 * Loads the ship-computer modules in the same order index.html does.
 * Each file attaches itself to globalThis.NostromoShipComputer when required
 * in Node, so tests can use the namespace the way the browser does.
 */

const path = require('path');

const MODULES = [
    'namespace',
    'util',
    'ship-scenario',
    'ship-state',
    'blocks',
    'parser',
    'registry',
    'engine',
    'system-commands',
    'legacy-responses',
    'terminal-view'
];

MODULES.forEach((name) => {
    require(path.join(__dirname, '../../js/ship-computer', `${name}.js`));
});

module.exports = globalThis.NostromoShipComputer;
