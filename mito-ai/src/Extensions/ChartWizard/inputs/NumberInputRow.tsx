/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { InputRowProps } from './types';

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

export const NumberInputRow: React.FC<InputRowProps> = ({ variable, label, onVariableChange }) => {
    const numValue = variable.value as number;
    const min = variable.min;
    const max = variable.max;
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        let value = parseFloat(e.target.value);
        if (Number.isNaN(value)) {
            value = min ?? 0;
        }
        if (min !== undefined && max !== undefined) {
            value = clamp(value, min, max);
        }
        onVariableChange(variable.name, value);
    };
    return (
        <div key={variable.name} className="chart-wizard-input-row">
            <label className="chart-wizard-input-label">{label}</label>
            <input
                type="number"
                value={numValue}
                min={min}
                max={max}
                step={min !== undefined && max !== undefined && max - min <= 1 ? 'any' : 1}
                onChange={handleChange}
                className="chart-wizard-number-input"
            />
        </div>
    );
};

