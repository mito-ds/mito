/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { InputRowProps } from './types';
import { isHexColor, normalizeHexColor } from './utils';

export const ColorInputRow: React.FC<InputRowProps> = ({ variable, label, onVariableChange }) => {
    const stringValue = variable.value as string;
    const normalizedColor = normalizeHexColor(stringValue);

    return (
        <div key={variable.name} className="chart-wizard-input-row">
            <label className="chart-wizard-input-label">{label}</label>
            <div className="chart-wizard-color-container">
                <input
                    type="color"
                    value={normalizedColor}
                    onChange={(e) => {
                        // Color picker returns #RRGGBB, store with #
                        onVariableChange(variable.name, e.target.value);
                    }}
                    className="chart-wizard-color-picker"
                />
                <input
                    type="text"
                    value={normalizedColor}
                    onChange={(e) => {
                        let newValue = e.target.value.trim();
                        // Normalize: ensure it has # for valid hex colors
                        if (newValue && !newValue.startsWith('#')) {
                            if (isHexColor(newValue)) {
                                newValue = `#${newValue}`;
                            }
                        }
                        // Only update if it's a valid hex color
                        if (isHexColor(newValue) || newValue === '') {
                            onVariableChange(variable.name, newValue);
                        }
                    }}
                    placeholder="#RRGGBB"
                    className="chart-wizard-color-input"
                />
            </div>
        </div>
    );
};

