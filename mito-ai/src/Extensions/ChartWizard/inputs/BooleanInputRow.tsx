/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { InputRowProps } from './types';

export const BooleanInputRow: React.FC<InputRowProps> = ({ variable, label, onVariableChange }) => {
    return (
        <div key={variable.name} className="chart-wizard-input-row chart-wizard-boolean-row">
            <label className="chart-wizard-input-label chart-wizard-boolean-label">
                {label}
            </label>
            <label className="chart-wizard-toggle-container">
                <input
                    type="checkbox"
                    checked={variable.value as boolean}
                    onChange={(e) => onVariableChange(variable.name, e.target.checked)}
                    className="chart-wizard-toggle-input"
                />
                <span className="chart-wizard-toggle-slider"></span>
            </label>
        </div>
    );
};

