/**
 * ENGINEERING POWER ALLOCATION: moves a share of power from one subsystem to another.
 *
 *   ENGINEERING POWER ALLOCATION [SUBSYSTEM] [PERCENT] FROM [SUBSYSTEM]
 *
 * Commander level. The request is validated before any question is shown, and the change is made
 * only on a Y, through the engineering subsystem's own setAllocation operation.
 */
(function (root) {
    const ns = root.NostromoShipComputer = root.NostromoShipComputer || {};

    const USAGE = 'ENGINEERING POWER ALLOCATION [SUBSYSTEM] [PERCENT] FROM [SUBSYSTEM]';

    function text(line) {
        return { type: 'text', text: line };
    }

    function heading(line) {
        return { type: 'text', text: line, tone: 'heading' };
    }

    function error(line) {
        return [{ type: 'error', text: line }];
    }

    /** The allocation key for a typed name, matched without regard to spaces or case. */
    function keyFor(typed, rules) {
        const compact = typed.replace(/\s+/g, '').toUpperCase();
        return Object.keys(rules).find((k) => ns.engineeringModel.labelOf(k).replace(/\s+/g, '') === compact) || null;
    }

    /** The before and after table, with the warnings that the change would cause. */
    function preview(alloc, rules, target, donor, percent) {
        const after = { ...alloc };
        after[target] = percent;
        after[donor] = alloc[donor] - (percent - alloc[target]);
        const label = ns.engineeringModel.labelOf;
        const blocks = [
            heading('POWER ALLOCATION REQUESTED.'),
            {
                type: 'table',
                columns: ['SUBSYSTEM', 'BEFORE', 'AFTER'],
                rows: [[label(target), `${alloc[target]}%`, `${after[target]}%`], [label(donor), `${alloc[donor]}%`, `${after[donor]}%`]]
            }
        ];
        [target, donor].forEach((k) => {
            const warnBelow = rules[k].warnBelow;
            if (warnBelow !== undefined && after[k] < warnBelow) {
                blocks.push(text(`WARNING: ${label(k)} WILL BE BELOW ITS SAFE LEVEL (${warnBelow}%).`));
            }
        });
        blocks.push(text(''));
        blocks.push(text('CONFIRM ALLOCATION CHANGE? Y/N'));
        return blocks;
    }

    /**
     * @param {ReturnType<import('./ship-state.js').createShipStore>} store
     * @param {ReturnType<import('./privilege.js').createSession>} session
     */
    function register(registry, store, session) {
        registry.register({
            name: 'ENGINEERING POWER ALLOCATION',
            category: 'ENGINEERING',
            description: 'MOVES POWER FROM ONE SUBSYSTEM TO ANOTHER. COMMANDER LEVEL. ASKS FOR CONFIRMATION FIRST.',
            usage: USAGE,
            privilege: 'COMMANDER',
            args: [{ name: 'SUBSYSTEM', required: true }],
            handler: (ctx) => {
                const engineering = store.snapshot('engineering').state;
                const rules = engineering.allocationRules;
                const words = ctx.args.map((w) => String(w).toUpperCase());
                const fromAt = words.indexOf('FROM');
                if (fromAt < 2 || fromAt === words.length - 1) return error(`USAGE: ${USAGE}`);

                const percentWord = words[fromAt - 1];
                const targetTyped = words.slice(0, fromAt - 1).join(' ');
                const donorTyped = words.slice(fromAt + 1).join(' ');
                if (!/^\d+$/.test(percentWord)) return error('PERCENT MUST BE A WHOLE NUMBER.');
                const target = keyFor(targetTyped, rules);
                const donor = keyFor(donorTyped, rules);
                if (!target) return error(`UNKNOWN SUBSYSTEM: ${targetTyped}.`);
                if (!donor) return error(`UNKNOWN SUBSYSTEM: ${donorTyped}.`);

                const percent = Number(percentWord);
                const problem = ns.engineeringModel.allocationProblem(engineering.allocation, rules, target, donor, percent);
                if (problem) return error(problem);

                const question = preview(engineering.allocation, rules, target, donor, percent);
                ctx.ask({
                    question,
                    confirm: () => {
                        // Decided again at confirmation: the level and the allocation may have changed while the question waited.
                        const denial = ns.privilege.authorize(session, 'COMMANDER');
                        if (denial) return [{ type: 'authorization', required: denial.required, current: denial.current }];
                        const current = store.snapshot('engineering').state;
                        const again = ns.engineeringModel.allocationProblem(current.allocation, current.allocationRules, target, donor, percent);
                        if (again) return error(again);
                        store.operate('engineering', 'setAllocation', { target, donor, percent }, 'engineering');
                        const now = store.snapshot('engineering').state.allocation;
                        const label = ns.engineeringModel.labelOf;
                        return [
                            heading('POWER ALLOCATION CHANGED.'),
                            {
                                type: 'table',
                                columns: ['SUBSYSTEM', 'ALLOCATION'],
                                rows: [[label(target), `${now[target]}%`], [label(donor), `${now[donor]}%`]]
                            }
                        ];
                    },
                    cancel: () => [text('POWER ALLOCATION CANCELLED. ALLOCATION UNCHANGED.')]
                });
                return question;
            }
        });
    }

    ns.powerAllocationCommands = { register };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ns.powerAllocationCommands;
    }
})(typeof window !== 'undefined' ? window : globalThis);
