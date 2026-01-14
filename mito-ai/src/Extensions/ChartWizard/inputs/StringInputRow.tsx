/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { InputRowProps } from './types';

export const StringInputRow: React.FC<InputRowProps> = ({ variable, label, onVariableChange }) => {
    const stringValue = variable.value as string;
    return (
        <div key={variable.name} className="chart-wizard-input-row">
            <label className="chart-wizard-input-label">{label}</label>
            <input
                type="text"
                value={stringValue}
                onChange={(e) => onVariableChange(variable.name, e.target.value)}
                className="chart-wizard-text-input"
            />
        </div>
    );
};

