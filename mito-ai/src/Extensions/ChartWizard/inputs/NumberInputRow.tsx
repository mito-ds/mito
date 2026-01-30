/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { InputRowProps } from './types';

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/** Use slider when range is small and decimal-friendly (e.g. opacity 0–1). */
const SLIDER_RANGE_THRESHOLD = 2;

/** Step for decimal ranges: fine for 0–1, coarser for 1–2. */
function decimalStep(min: number, max: number): number {
    const range = max - min;
    return range <= 1 ? 0.01 : 0.1;
}

export const NumberInputRow: React.FC<InputRowProps> = ({ variable, label, onVariableChange }) => {
    const numValue = variable.value as number;
    const min = variable.min;
    const max = variable.max;
    const hasRange = min !== undefined && max !== undefined;
    const rangeSpan = hasRange ? (max as number) - (min as number) : 0;
    const useSlider = hasRange && rangeSpan <= SLIDER_RANGE_THRESHOLD;
    const step = useSlider ? decimalStep(min as number, max as number) : 1;

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        let value = parseFloat(e.target.value);
        if (Number.isNaN(value)) {
            value = min ?? 0;
        }
        if (hasRange) {
            value = clamp(value, min as number, max as number);
        }
        onVariableChange(variable.name, value);
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const value = parseFloat(e.target.value);
        onVariableChange(variable.name, clamp(value, min as number, max as number));
    };

    return (
        <div key={variable.name} className="chart-wizard-input-row">
            <label className="chart-wizard-input-label">{label}</label>
            {useSlider ? (
                <div className="chart-wizard-number-slider-row">
                    <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={numValue}
                        onChange={handleSliderChange}
                        className="chart-wizard-range-slider"
                        aria-label={label}
                    />
                    <input
                        type="number"
                        min={min}
                        max={max}
                        step={step}
                        value={numValue}
                        onChange={handleNumberChange}
                        className="chart-wizard-number-input chart-wizard-number-input-narrow"
                        aria-label={`${label} (number)`}
                    />
                </div>
            ) : (
                <input
                    type="number"
                    value={numValue}
                    min={min}
                    max={max}
                    step={step}
                    onChange={handleNumberChange}
                    className="chart-wizard-number-input"
                />
            )}
        </div>
    );
};

