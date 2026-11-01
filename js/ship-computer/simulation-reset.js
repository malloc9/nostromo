/**
 * The reset control: the settings action that resets the simulation. Pure: no DOM. The screen
 * draws its state and calls these methods; nothing here is a terminal command.
 *
 * States: idle, then asking (the user has asked and must confirm). Declining or confirming ends the
 * question. The history option only exists while asking, and is forgotten when the question ends.
 */
(function (root) {
    const ns = root.NostromoShipComputer = root.NostromoShipComputer || {};

    /**
     * @param {(choice: {clearHistory: boolean}) => void} perform  runs the reset, once, when confirmed
     */
    function createResetControl(perform) {
        let state = 'idle';
        let clearHistory = false;

        function end() {
            state = 'idle';
            clearHistory = false;
        }

        return {
            state: () => state,
            clearHistory: () => clearHistory,
            /** Ask the user to confirm. Asking again while a question is open changes nothing. */
            request() {
                if (state === 'idle') state = 'asking';
                return state;
            },
            /** Choose whether command history is cleared too. Only meaningful while asking. */
            setClearHistory(on) {
                if (state === 'asking') clearHistory = Boolean(on);
            },
            decline() {
                end();
            },
            /** Run the reset if the user is being asked. Returns false when there was nothing to confirm. */
            confirm() {
                if (state !== 'asking') return false;
                const choice = { clearHistory };
                end();
                perform(choice);
                return true;
            }
        };
    }

    ns.simulationReset = { createResetControl };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.simulationReset;
    }
})(typeof window !== 'undefined' ? window : globalThis);
