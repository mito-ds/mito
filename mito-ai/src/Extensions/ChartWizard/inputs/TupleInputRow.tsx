/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { InputRowProps } from './types';

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

export const TupleInputRow: React.FC<InputRowProps> = ({ variable, label, onVariableChange }) => {
    const tupleValue = variable.value as [number, number];
    const min = variable.min;
    const max = variable.max;
    const clampOrIdentity = (v: number, fallback: number): number => {
        if (min !== undefined && max !== undefined) {
            return clamp(v, min, max);
        }
        return Number.isNaN(v) ? fallback : v;
    };
    return (
        <div key={variable.name} className="chart-wizard-input-row">
            <label className="chart-wizard-input-label">{label}</label>
            <div className="chart-wizard-tuple-container">
                <span>(</span>
                <input
                    type="number"
                    value={tupleValue[0]}
                    min={min}
                    max={max}
                    step={min !== undefined && max !== undefined && max - min <= 1 ? 'any' : 1}
                    onChange={(e) => {
                        const v = clampOrIdentity(parseFloat(e.target.value), 0);
                        onVariableChange(variable.name, [v, tupleValue[1]]);
                    }}
                    className="chart-wizard-tuple-input"
                />
                <span>,</span>
                <input
                    type="number"
                    value={tupleValue[1]}
                    min={min}
                    max={max}
                    step={min !== undefined && max !== undefined && max - min <= 1 ? 'any' : 1}
                    onChange={(e) => {
                        const v = clampOrIdentity(parseFloat(e.target.value), 0);
                        onVariableChange(variable.name, [tupleValue[0], v]);
                    }}
                    className="chart-wizard-tuple-input"
                />
                <span>)</span>
            </div>
        </div>
    );
};

