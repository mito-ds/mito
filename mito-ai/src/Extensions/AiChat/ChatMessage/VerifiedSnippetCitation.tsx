/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { COMMAND_MITO_AI_OPEN_SETTINGS_VERIFIED_REPORTS } from '../../../commands';
import '../../../../style/VerifiedSnippetCitation.css';

export interface VerifiedSnippetCitationProps {
    reportName: string;
    snippetId: string;
    app: JupyterFrontEnd;
    exists?: boolean;
}

export const VerifiedSnippetCitation: React.FC<VerifiedSnippetCitationProps> = ({
    reportName,
    snippetId,
    app,
    exists = true,
}): JSX.Element => {
    const handleClick = (): void => {
        if (!exists) {
            return;
        }
        void app.commands.execute(COMMAND_MITO_AI_OPEN_SETTINGS_VERIFIED_REPORTS, {
            reportName,
            snippetId,
        });
    };

    const className = exists
        ? 'verified-snippet-citation'
        : 'verified-snippet-citation verified-snippet-citation-missing';
    const title = exists
        ? `View verified snippet from ${reportName}`
        : 'Verified report no longer exists';

    return (
        <span
            className={className}
            onClick={handleClick}
            title={title}
        >
            {reportName}
        </span>
    );
};

export default VerifiedSnippetCitation;
