/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { AgentReviewChangeCounts } from '../hooks/useAgentReview';
import '../../../../style/AgentChangeControls.css';

interface IAgentChangeSummaryProps {    
    getChangeCounts: () => AgentReviewChangeCounts;
}

const AgentChangeSummary: React.FC<IAgentChangeSummaryProps> = ({
    getChangeCounts,
}) => {

    const changeCounts = getChangeCounts();

    return (
        <div className="agent-change-counts">
            <span className="agent-change-count">
                <span className="agent-change-count-number agent-change-count-added">
                    {changeCounts.added}
                </span>
                <span className="agent-change-count-text">
                    {changeCounts.added === 1 ? 'cell added' : 'cells added'}
                </span>
            </span>
            <span className="agent-change-count">
                <span className="agent-change-count-number agent-change-count-modified">
                    {changeCounts.modified}
                </span>
                <span className="agent-change-count-text">
                    {changeCounts.modified === 1 ? 'cell modified' : 'cells modified'}
                </span>
            </span>
            <span className="agent-change-count">
                <span className="agent-change-count-number agent-change-count-removed">
                    {changeCounts.removed}
                </span>
                <span className="agent-change-count-text">
                    {changeCounts.removed === 1 ? 'cell removed' : 'cells removed'}
                </span>
            </span>
        </div>
    );
};

export default AgentChangeSummary;

