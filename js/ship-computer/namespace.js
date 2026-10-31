/**
 * Ship computer namespace.
 *
 * Every ship-computer module attaches to this one object, `NostromoShipComputer`,
 * instead of creating its own global. Load this file first, before any other
 * ship-computer script. In Node (tests) it is exported directly.
 *
 * @typedef {Object} NostromoShipComputerNamespace
 */
(function (root) {
    root.NostromoShipComputer = root.NostromoShipComputer || {};

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = root.NostromoShipComputer;
    }
})(typeof window !== 'undefined' ? window : globalThis);
