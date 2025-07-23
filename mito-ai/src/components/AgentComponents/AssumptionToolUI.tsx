/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { classNames } from '../../utils/classNames';
import '../../../style/AssumptionTool.css';

interface AssumptionToolUIProps {
    assumptions: string[];
}

const AssumptionToolUI: React.FC<AssumptionToolUIProps> = ({
    assumptions,
}): JSX.Element => {
    return (
        <div className={classNames('assumption-tool-container')}>
            {/* Assumption Header Label */}
            <div className="assumption-header-label">
                Assumption
            </div>
            
            <p className={classNames('assumption-content')}>
                {assumptions.length > 1 && (
                    <ul>
                        {assumptions.map((assumption, index) => (
                            <li key={index}>
                                {assumption}
                            </li>
                        ))}
                    </ul>
                )}
                {assumptions.length === 1 && (
                    assumptions[0]
                )}
            </p>
        </div>
    );
};

export default AssumptionToolUI;