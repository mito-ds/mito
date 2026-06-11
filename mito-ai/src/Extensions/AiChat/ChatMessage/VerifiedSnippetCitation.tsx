/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from 'react';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { getVerifiedReport } from '../../../restAPI/RestAPI';
import { COMMAND_MITO_AI_OPEN_SETTINGS_VERIFIED_REPORTS } from '../../../commands';
import VerifiedShieldIcon from '../../../icons/VerifiedShieldIcon';
import '../../../../style/VerifiedSnippetCitation.css';

export interface VerifiedSnippetCitationProps {
    reportName: string;
    snippetId: string;
    /* Short description written by the agent, e.g. "set-intersection approach".
       Falls back to the report name for citations created before this was added. */
    displayText?: string;
    app: JupyterFrontEnd;
}

export const VerifiedSnippetCitation: React.FC<VerifiedSnippetCitationProps> = ({
    reportName,
    snippetId,
    displayText,
    app,
}): JSX.Element => {
    // Assume the report exists until proven otherwise so the citation doesn't flicker.
    const [exists, setExists] = useState(true);

    useEffect(() => {
        let cancelled = false;
        getVerifiedReport(reportName)
            .then(() => undefined)
            .catch(() => {
                if (!cancelled) {
                    setExists(false);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [reportName]);

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
            <VerifiedShieldIcon />
            {displayText ?? reportName}
        </span>
    );
};

export default VerifiedSnippetCitation;
