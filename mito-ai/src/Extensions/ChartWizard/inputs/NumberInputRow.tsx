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

interface SliderWithNumberInputProps {
    value: number;
    min: number;
    max: number;
    step: number;
    label: string;
    onChange: (value: number) => void;
}

const SliderWithNumberInput: React.FC<SliderWithNumberInputProps> = ({
    value,
    min,
    max,
    step,
    label,
    onChange
}) => (
    <div className="chart-wizard-number-slider-row">
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(clamp(parseFloat(e.target.value), min, max))}
            className="chart-wizard-range-slider"
            aria-label={label}
        />
        <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => {
                let v = parseFloat(e.target.value);
                if (Number.isNaN(v)) v = min;
                onChange(clamp(v, min, max));
            }}
            className="chart-wizard-number-input chart-wizard-number-input-narrow"
            aria-label={`${label} (number)`}
        />
    </div>
);

interface NumberInputOnlyProps {
    value: number;
    min?: number;
    max?: number;
    step: number;
    onChange: (value: number) => void;
}

const NumberInputOnly: React.FC<NumberInputOnlyProps> = ({
    value,
    min,
    max,
    step,
    onChange
}) => (
    <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
            let v = parseFloat(e.target.value);
            if (Number.isNaN(v)) v = min ?? 0;
            if (min !== undefined && max !== undefined) v = clamp(v, min, max);
            onChange(v);
        }}
        className="chart-wizard-number-input"
    />
);

export const NumberInputRow: React.FC<InputRowProps> = ({ variable, label, onVariableChange }) => {
    const numValue = variable.value as number;
    const min = variable.min;
    const max = variable.max;
    const hasRange = min !== undefined && max !== undefined;
    const rangeSpan = hasRange ? (max as number) - (min as number) : 0;
    const useSlider = hasRange && rangeSpan <= SLIDER_RANGE_THRESHOLD;
    const step = useSlider ? decimalStep(min as number, max as number) : 1;

    const handleChange = (value: number): void => {
        onVariableChange(variable.name, value);
    };

    return (
        <div key={variable.name} className="chart-wizard-input-row">
            <label className="chart-wizard-input-label">{label}</label>
            {useSlider && min !== undefined && max !== undefined ? (
                <SliderWithNumberInput
                    value={numValue}
                    min={min}
                    max={max}
                    step={step}
                    label={label}
                    onChange={handleChange}
                />
            ) : (
                <NumberInputOnly
                    value={numValue}
                    min={min}
                    max={max}
                    step={step}
                    onChange={handleChange}
                />
            )}
        </div>
    );
};

