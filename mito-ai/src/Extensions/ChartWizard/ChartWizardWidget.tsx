/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState, useEffect, useRef } from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
import { NotebookActions } from '@jupyterlab/notebook';
import { ChartWizardData } from './ChartWizardPlugin';
import { parseChartConfig, updateChartConfig, ChartConfigVariable } from './chartConfigParser';
import { writeCodeToCellByIDInNotebookPanel } from '../../utils/notebook';

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

const ChartWizardContent: React.FC<ChartWizardContentProps> = ({ chartData }) => {
    const [configVariables, setConfigVariables] = useState<ChartConfigVariable[]>([]);
    const executeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Parse config when chart data changes
    useEffect(() => {
        if (!chartData?.sourceCode) {
            setConfigVariables([]);
            return;
        }

        const parsed = parseChartConfig(chartData.sourceCode);
        if (parsed) {
            setConfigVariables(parsed.variables);
        } else {
            setConfigVariables([]);
        }
    }, [chartData?.sourceCode]);

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

    const handleVariableChange = (variableName: string, newValue: string | number | boolean | [number, number]) => {
        if (!chartData?.sourceCode) return;

        const updated = configVariables.map(v => 
            v.name === variableName 
                ? { ...v, value: newValue }
                : v
        );
        setConfigVariables(updated);
        
        // Update the source code
        const updatedCode = updateChartConfig(chartData.sourceCode, updated);
        
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
                <div key={variable.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <label style={{ minWidth: '150px', fontWeight: '500' }}>{label}:</label>
                    <input
                        type="checkbox"
                        checked={variable.value as boolean}
                        onChange={(e) => handleVariableChange(variable.name, e.target.checked)}
                        style={{ width: '20px', height: '20px' }}
                    />
                </div>
            );
        }

        if (variable.type === 'tuple') {
            const tupleValue = variable.value as [number, number];
            return (
                <div key={variable.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <label style={{ minWidth: '150px', fontWeight: '500' }}>{label}:</label>
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        <span>(</span>
                        <input
                            type="number"
                            value={tupleValue[0]}
                            onChange={(e) => {
                                const newValue: [number, number] = [parseFloat(e.target.value) || 0, tupleValue[1]];
                                handleVariableChange(variable.name, newValue);
                            }}
                            style={{ width: '60px', padding: '5px' }}
                        />
                        <span>,</span>
                        <input
                            type="number"
                            value={tupleValue[1]}
                            onChange={(e) => {
                                const newValue: [number, number] = [tupleValue[0], parseFloat(e.target.value) || 0];
                                handleVariableChange(variable.name, newValue);
                            }}
                            style={{ width: '60px', padding: '5px' }}
                        />
                        <span>)</span>
                    </div>
                </div>
            );
        }

        if (variable.type === 'number') {
            return (
                <div key={variable.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <label style={{ minWidth: '150px', fontWeight: '500' }}>{label}:</label>
                    <input
                        type="number"
                        value={variable.value as number}
                        onChange={(e) => handleVariableChange(variable.name, parseFloat(e.target.value) || 0)}
                        style={{ flex: 1, padding: '5px' }}
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
                <div key={variable.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <label style={{ minWidth: '150px', fontWeight: '500' }}>{label}:</label>
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flex: 1 }}>
                        <input
                            type="color"
                            value={normalizedColor}
                            onChange={(e) => {
                                // Color picker returns #RRGGBB, store with #
                                handleVariableChange(variable.name, e.target.value);
                            }}
                            style={{ 
                                width: '50px', 
                                height: '35px', 
                                padding: '2px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
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
                            style={{ 
                                flex: 1, 
                                padding: '5px',
                                fontFamily: 'monospace'
                            }}
                        />
                    </div>
                </div>
            );
        }

        // Regular string input
        return (
            <div key={variable.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <label style={{ minWidth: '150px', fontWeight: '500' }}>{label}:</label>
                <input
                    type="text"
                    value={stringValue}
                    onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                    style={{ flex: 1, padding: '5px' }}
                />
            </div>
        );
    };

    const hasConfig = configVariables.length > 0;

    if (!chartData) {
        return (
            <div style={{ padding: '20px' }}>
                <h2>Chart Wizard</h2>
                <p>Click the Chart Wizard button on a matplotlib chart to get started.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', height: '100%', overflow: 'auto' }}>
            <h2 style={{ marginTop: 0 }}>Chart Wizard</h2>
            
            {hasConfig ? (
                <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
                    <h3 style={{ marginTop: 0 }}>Chart Configuration</h3>
                    <p style={{ fontSize: '12px', color: '#666', marginTop: '-10px', marginBottom: '15px' }}>
                        Edit values below to customize your chart. Changes will be reflected in the notebook.
                    </p>
                    {configVariables.map(renderInputField)}
                </div>
            ) : (
                <div style={{ padding: '10px', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px' }}>
                    <p style={{ margin: 0, fontSize: '14px' }}>
                        No chart configuration found. Make sure your code includes a section between <code># === CHART CONFIG ===</code> and <code># === END CONFIG ===</code>.
                    </p>
                </div>
            )}
        </div>
    );
};
