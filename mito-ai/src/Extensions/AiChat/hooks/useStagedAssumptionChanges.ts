/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useEffect, useState } from 'react';
import { AgentExecutionStatus } from './useAgentExecution';

export interface IStagedAssumptionChange {
    // The assumption statement the agent originally selected
    originalSelected: string;
    // The alternative statement the user switched to
    newSelected: string;
}

// How long to wait after the last edit before sending staged changes to the agent,
// so multiple quick edits batch into a single correction message.
const FLUSH_DEBOUNCE_MS = 2000;

export const composeAssumptionChangeMessage = (changes: IStagedAssumptionChange[]): string => {
    const changeLines = changes.map(change =>
        `- Previously: "${change.originalSelected}" → Now follow: "${change.newSelected}"`
    );
    const plural = changes.length > 1 ? 's' : '';
    return `I've changed the following assumption${plural}:\n${changeLines.join('\n')}\n\nPlease update the analysis so it follows the new assumption${plural} exactly.`;
};

/**
 * Buffers assumption selection changes made in AssumptionToolUI and sends them
 * to the agent as a single correction message. Changes are held while the agent
 * is working (so we don't interrupt its flow) and flushed automatically once it
 * is idle, after a short debounce so multiple quick edits batch together.
 */
export const useStagedAssumptionChanges = ({
    agentExecutionStatus,
    sendMessage,
}: {
    agentExecutionStatus: AgentExecutionStatus;
    sendMessage: (content: string) => void;
}): {
    stagedAssumptionChanges: IStagedAssumptionChange[];
    stageAssumptionChange: (originalSelected: string, newSelected: string) => void;
} => {
    const [stagedAssumptionChanges, setStagedAssumptionChanges] = useState<IStagedAssumptionChange[]>([]);

    const stageAssumptionChange = (originalSelected: string, newSelected: string): void => {
        setStagedAssumptionChanges(prev => {
            const withoutThisAssumption = prev.filter(change => change.originalSelected !== originalSelected);

            // Reverting back to the original selection removes the staged change entirely
            if (newSelected === originalSelected) {
                return withoutThisAssumption;
            }

            return [...withoutThisAssumption, { originalSelected, newSelected }];
        });
    };

    useEffect(() => {
        if (stagedAssumptionChanges.length === 0 || agentExecutionStatus !== 'idle') {
            return;
        }

        const timeout = setTimeout(() => {
            const message = composeAssumptionChangeMessage(stagedAssumptionChanges);
            setStagedAssumptionChanges([]);
            sendMessage(message);
        }, FLUSH_DEBOUNCE_MS);

        return () => clearTimeout(timeout);
    }, [stagedAssumptionChanges, agentExecutionStatus]);

    return {
        stagedAssumptionChanges,
        stageAssumptionChange,
    };
};
