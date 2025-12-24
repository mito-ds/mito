/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState, useEffect, useRef } from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
import { NotebookActions } from '@jupyterlab/notebook';
import { ChartWizardData } from './ChartWizardPlugin';
import { ChartConfigVariable } from './chartConfigParser';
import { writeCodeToCellByIDInNotebookPanel } from '../../utils/notebook';
import '../../../style/ChartWizardPlugin.css';

/**
 * Widget for the Chart Wizard panel that displays config inputs.
 */
export class ChartWizardWidget extends ReactWidget {
    private chartData: ChartWizardData | null = null;

    constructor() {
        super();
        this.addClass('chart-wizard-widget');
    }

    updateChartData(chartData: ChartWizardData): void {
        this.chartData = chartData;
        this.update();
    }

    render(): React.ReactElement {
        return <ChartWizardContent chartData={this.chartData} />;
    }
}

interface ChartWizardContentProps {
    chartData: ChartWizardData | null;
}

/**
 * Converts backend ChartWizardParameter to frontend ChartConfigVariable
 */
function convertParameterToConfigVariable(param: { name: string; value: string; parameter_type: string }): ChartConfigVariable | null {
    // Parse the value string to determine type and convert to appropriate type
    const valueStr = param.value.trim();
    
    // Boolean
    if (valueStr === 'True' || valueStr === 'False') {
        return {
            name: param.name,
            value: valueStr === 'True',
            type: 'boolean',
            rawValue: valueStr
        };
    }
    
    // Tuple (e.g., (12, 6))
    const tupleMatch = valueStr.match(/^\((\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\)$/);
    if (tupleMatch) {
        return {
            name: param.name,
            value: [parseFloat(tupleMatch[1] || '0'), parseFloat(tupleMatch[2] || '0')],
            type: 'tuple',
            rawValue: valueStr
        };
    }
    
    // Number
    if (/^-?\d+(?:\.\d+)?$/.test(valueStr)) {
        return {
            name: param.name,
            value: parseFloat(valueStr),
            type: 'number',
            rawValue: valueStr
        };
    }
    
    // String (remove quotes if present)
    const stringMatch = valueStr.match(/^['"](.*)['"]$/);
    const stringValue = stringMatch && stringMatch[1] !== undefined ? stringMatch[1] : valueStr;
    
    return {
        name: param.name,
        value: stringValue,
        type: 'string',
        rawValue: valueStr
    };
}

const ChartWizardContent: React.FC<ChartWizardContentProps> = ({ chartData }) => {
    const [configVariables, setConfigVariables] = useState<ChartConfigVariable[]>([]);
    const executeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Use backend parameters when available, otherwise fall back to empty
    useEffect(() => {
        if (!chartData) {
            setConfigVariables([]);
            return;
        }

        if (chartData.parameters && chartData.parameters.length > 0) {
            // Convert backend parameters to frontend format
            const converted = chartData.parameters
                .map(convertParameterToConfigVariable)
                .filter((v): v is ChartConfigVariable => v !== null);
            setConfigVariables(converted);
        } else {
            setConfigVariables([]);
        }
    }, [chartData?.parameters]);

    // Update notebook cell and re-execute when config variables change
    const updateNotebookCell = (updatedCode: string) => {
        if (!chartData) return;

        const notebookPanel = chartData.notebookTracker.currentWidget;
        if (!notebookPanel) return;

        // Update the cell code
        writeCodeToCellByIDInNotebookPanel(notebookPanel, updatedCode, chartData.cellId);

        // Re-execute the cell to show updated chart
        const notebook = notebookPanel.content;
        const sessionContext = notebookPanel.context?.sessionContext;
        void NotebookActions.run(notebook, sessionContext);
    };

    /**
     * Updates a parameter value in the source code by finding and replacing the assignment
     */
    const updateParameterInCode = (sourceCode: string, paramName: string, newValue: string | number | boolean | [number, number]): string => {
        // Format the value for Python code
        let formattedValue: string;
        if (typeof newValue === 'boolean') {
            formattedValue = newValue ? 'True' : 'False';
        } else if (Array.isArray(newValue)) {
            formattedValue = `(${newValue[0]}, ${newValue[1]})`;
        } else if (typeof newValue === 'number') {
            formattedValue = String(newValue);
        } else {
            // String - add quotes and escape if needed
            formattedValue = `'${String(newValue).replace(/'/g, "\\'")}'`;
        }

        // Find the parameter assignment and replace it
        // Match patterns like: PARAM_NAME = value or PARAM_NAME=value
        const regex = new RegExp(`(${paramName}\\s*=\\s*)(['"][^'"]*['"]|True|False|\\d+(?:\\.\\d+)?|\\([^)]+\\)|[^\\n,]+)`, 'g');
        return sourceCode.replace(regex, `$1${formattedValue}`);
    };

    const handleVariableChange = (variableName: string, newValue: string | number | boolean | [number, number]) => {
        if (!chartData?.sourceCode) return;

        const updated = configVariables.map(v => 
            v.name === variableName 
                ? { ...v, value: newValue, rawValue: String(newValue) }
                : v
        );
        setConfigVariables(updated);
        
        // Update the source code by replacing the parameter value
        const updatedCode = updateParameterInCode(chartData.sourceCode, variableName, newValue);
        
        // Clear previous timeout
        if (executeTimeoutRef.current) {
            clearTimeout(executeTimeoutRef.current);
        }

        // Debounce the cell update and execution
        executeTimeoutRef.current = setTimeout(() => {
            updateNotebookCell(updatedCode);
        }, 500); // 500ms debounce
    };

    // Helper function to check if a string is a hex color code
    const isHexColor = (value: string): boolean => {
        const hexPattern = /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
        return hexPattern.test(value);
    };

    // Helper function to normalize hex color (ensure it has #)
    const normalizeHexColor = (value: string): string => {
        if (value.startsWith('#')) {
            return value;
        }
        return `#${value}`;
    };

    const renderInputField = (variable: ChartConfigVariable) => {
        const label = variable.name.replace(/_/g, ' ').toLowerCase()
            .replace(/\b\w/g, l => l.toUpperCase());

        if (variable.type === 'boolean') {
            return (
                <div key={variable.name} className="chart-wizard-input-row">
                    <label className="chart-wizard-input-label">{label}:</label>
                    <input
                        type="checkbox"
                        checked={variable.value as boolean}
                        onChange={(e) => handleVariableChange(variable.name, e.target.checked)}
                        className="chart-wizard-checkbox"
                    />
                </div>
            );
        }

        if (variable.type === 'tuple') {
            const tupleValue = variable.value as [number, number];
            return (
                <div key={variable.name} className="chart-wizard-input-row">
                    <label className="chart-wizard-input-label">{label}:</label>
                    <div className="chart-wizard-tuple-container">
                        <span>(</span>
                        <input
                            type="number"
                            value={tupleValue[0]}
                            onChange={(e) => {
                                const newValue: [number, number] = [parseFloat(e.target.value) || 0, tupleValue[1]];
                                handleVariableChange(variable.name, newValue);
                            }}
                            className="chart-wizard-tuple-input"
                        />
                        <span>,</span>
                        <input
                            type="number"
                            value={tupleValue[1]}
                            onChange={(e) => {
                                const newValue: [number, number] = [tupleValue[0], parseFloat(e.target.value) || 0];
                                handleVariableChange(variable.name, newValue);
                            }}
                            className="chart-wizard-tuple-input"
                        />
                        <span>)</span>
                    </div>
                </div>
            );
        }

        if (variable.type === 'number') {
            return (
                <div key={variable.name} className="chart-wizard-input-row">
                    <label className="chart-wizard-input-label">{label}:</label>
                    <input
                        type="number"
                        value={variable.value as number}
                        onChange={(e) => handleVariableChange(variable.name, parseFloat(e.target.value) || 0)}
                        className="chart-wizard-number-input"
                    />
                </div>
            );
        }

        // String input - check if it's a hex color
        const stringValue = variable.value as string;
        const isColor = isHexColor(stringValue);

        if (isColor) {
            // Color picker for hex colors
            const normalizedColor = normalizeHexColor(stringValue);
            
            return (
                <div key={variable.name} className="chart-wizard-input-row">
                    <label className="chart-wizard-input-label">{label}:</label>
                    <div className="chart-wizard-color-container">
                        <input
                            type="color"
                            value={normalizedColor}
                            onChange={(e) => {
                                // Color picker returns #RRGGBB, store with #
                                handleVariableChange(variable.name, e.target.value);
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
                                    handleVariableChange(variable.name, newValue);
                                }
                            }}
                            placeholder="#RRGGBB"
                            className="chart-wizard-color-input"
                        />
                    </div>
                </div>
            );
        }

        // Regular string input
        return (
            <div key={variable.name} className="chart-wizard-input-row">
                <label className="chart-wizard-input-label">{label}:</label>
                <input
                    type="text"
                    value={stringValue}
                    onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                    className="chart-wizard-text-input"
                />
            </div>
        );
    };

    const hasConfig = configVariables.length > 0;

    if (!chartData) {
        return (
            <div className="chart-wizard-empty-state">
                <h2>Chart Wizard</h2>
                <p>Click the Chart Wizard button on a matplotlib chart to get started.</p>
            </div>
        );
    }

    return (
        <div className="chart-wizard-widget">
            <h2>Chart Wizard</h2>
            
            {hasConfig ? (
                <div className="chart-wizard-config-container">
                    <h3>Chart Configuration</h3>
                    <p className="chart-wizard-config-description">
                        Edit values below to customize your chart. Changes will be reflected in the notebook.
                    </p>
                    {configVariables.map(renderInputField)}
                </div>
            ) : (
                <div className="chart-wizard-no-config">
                    <p>
                        No chart parameters found. The Chart Wizard will analyze your code and extract customizable parameters.
                    </p>
                </div>
            )}
        </div>
    );
};
