/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useEffect, useRef, useState } from 'react';

/**
 * Hook to manage agent mode state in the chat taskpane.
 * 
 * Manages:
 * - agentModeEnabled: Whether agent mode is currently enabled
 * - agentModeEnabledRef: Ref to access the latest agentModeEnabled value (for use in callbacks)
 * - hasCheckpoint: Whether a checkpoint exists for the current agent session
 * - showRevertQuestionnaire: Whether to show the revert questionnaire UI
 * 
 * @returns Object containing:
 *   - agentModeEnabled: Boolean indicating if agent mode is enabled
 *   - agentModeEnabledRef: Ref to the latest agentModeEnabled value
 *   - setAgentModeEnabled: Function to set agent mode enabled state
 *   - hasCheckpoint: Boolean indicating if a checkpoint exists
 *   - setHasCheckpoint: Function to set checkpoint state
 *   - showRevertQuestionnaire: Boolean indicating if revert questionnaire should be shown
 *   - setShowRevertQuestionnaire: Function to set revert questionnaire visibility
 */
export const useAgentMode = (): {
    agentModeEnabled: boolean;
    agentModeEnabledRef: React.MutableRefObject<boolean>;
    setAgentModeEnabled: (enabled: boolean) => void;
    hasCheckpoint: boolean;
    setHasCheckpoint: (hasCheckpoint: boolean) => void;
    showRevertQuestionnaire: boolean;
    setShowRevertQuestionnaire: (show: boolean) => void;
} => {
    /* 
        Keep track of agent mode enabled state and use keep a ref in sync with it 
        so that we can access the most up-to-date value during a function's execution.
        Without it, we would always use the initial value of agentModeEnabled.
    */
    const [agentModeEnabled, setAgentModeEnabled] = useState<boolean>(true);
    const agentModeEnabledRef = useRef<boolean>(agentModeEnabled);

    // Track if checkpoint exists for UI updates
    const [hasCheckpoint, setHasCheckpoint] = useState<boolean>(false);

    // Track if revert questionnaire should be shown
    const [showRevertQuestionnaire, setShowRevertQuestionnaire] = useState<boolean>(false);

    // Keep ref in sync with state
    useEffect(() => {
        agentModeEnabledRef.current = agentModeEnabled;
    }, [agentModeEnabled]);

    return {
        agentModeEnabled,
        agentModeEnabledRef,
        setAgentModeEnabled,
        hasCheckpoint,
        setHasCheckpoint,
        showRevertQuestionnaire,
        setShowRevertQuestionnaire,
    };
};

