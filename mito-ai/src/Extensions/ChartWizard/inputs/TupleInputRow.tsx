/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { InputRowProps } from './types';

export const TupleInputRow: React.FC<InputRowProps> = ({ variable, label, onVariableChange }) => {
    const tupleValue = variable.value as [number, number];
    return (
        <div key={variable.name} className="chart-wizard-input-row">
            <label className="chart-wizard-input-label">{label}</label>
            <div className="chart-wizard-tuple-container">
                <span>(</span>
                <input
                    type="number"
                    value={tupleValue[0]}
                    onChange={(e) => {
                        const newValue: [number, number] = [parseFloat(e.target.value) || 0, tupleValue[1]];
                        onVariableChange(variable.name, newValue);
                    }}
                    className="chart-wizard-tuple-input"
                />
                <span>,</span>
                <input
                    type="number"
                    value={tupleValue[1]}
                    onChange={(e) => {
                        const newValue: [number, number] = [tupleValue[0], parseFloat(e.target.value) || 0];
                        onVariableChange(variable.name, newValue);
                    }}
                    className="chart-wizard-tuple-input"
                />
                <span>)</span>
            </div>
        </div>
    );
};

