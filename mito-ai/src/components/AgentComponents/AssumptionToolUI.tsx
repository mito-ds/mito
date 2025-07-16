/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { classNames } from '../../utils/classNames';
import '../../../style/AssumptionTool.css';

interface AssumptionToolUIProps {
    assumption: string;
}

const AssumptionToolUI: React.FC<AssumptionToolUIProps> = ({
    assumption,
}): JSX.Element => {
    return (
        <div className={classNames('assumption-tool-container')}>
            {/* Assumption Header Label */}
            <div className="assumption-header-label">
                Assumption
            </div>
            
            <span className={classNames('assumption-content')}>
                <div className="assumption-text">
                    {assumption}
                </div>
            </span>
        </div>
    );
};

export default AssumptionToolUI;