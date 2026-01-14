/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { InputRowProps } from './types';

export const NumberInputRow: React.FC<InputRowProps> = ({ variable, label, onVariableChange }) => {
    return (
        <div key={variable.name} className="chart-wizard-input-row">
            <label className="chart-wizard-input-label">{label}</label>
            <input
                type="number"
                value={variable.value as number}
                onChange={(e) => onVariableChange(variable.name, parseFloat(e.target.value) || 0)}
                className="chart-wizard-number-input"
            />
        </div>
    );
};

