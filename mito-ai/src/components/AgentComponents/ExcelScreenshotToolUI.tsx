/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import PhotoIcon from '../../icons/PhotoIcon';
import '../../../style/AgentToolUIComponent.css';


interface IExcelScreenshotToolUIProps {
    excelFilePath?: string | null;
}

const ExcelScreenshotToolUI: React.FC<IExcelScreenshotToolUIProps> = ({ excelFilePath }) => {
    return (
        <div className="agent-tool-ui-container">
            <div className="agent-tool-ui-content">
                <PhotoIcon />
                <span>Screenshotting Excel worksheets{excelFilePath ? `: ${excelFilePath}` : ''}</span>
            </div>
        </div>
    );
};

export default ExcelScreenshotToolUI;
