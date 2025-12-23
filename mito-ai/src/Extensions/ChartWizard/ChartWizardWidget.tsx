/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState, useEffect, useRef } from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
import { KernelMessage } from '@jupyterlab/services';
import { ChartWizardData } from './ChartWizardPlugin';
import { parseChartConfig, updateChartConfig, ChartConfigVariable } from './chartConfigParser';

/**
 * Widget for the Chart Wizard panel that displays a chart and its source code.
 */
export class ChartWizardWidget extends ReactWidget {
    private chartData: ChartWizardData | undefined;

    constructor(chartData?: ChartWizardData) {
        super();
        this.addClass('chart-wizard-widget');
        this.chartData = chartData;
    }

    render(): React.ReactElement {
        return <ChartWizardContent chartData={this.chartData} />;
    }
}

interface ChartWizardContentProps {
    chartData?: ChartWizardData;
}

const ChartWizardContent: React.FC<ChartWizardContentProps> = ({ chartData }) => {
    const [sourceCode, setSourceCode] = useState(chartData?.sourceCode || '');
    const [configVariables, setConfigVariables] = useState<ChartConfigVariable[]>([]);
    const [currentImageData, setCurrentImageData] = useState<string | null>(chartData?.imageData || null);
    const [isExecuting, setIsExecuting] = useState(false);
    const executeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const configChangedRef = useRef(false); // Track if config variables changed (not manual code edit)

    // Parse config when source code changes
    useEffect(() => {
        const parsed = parseChartConfig(sourceCode);
        if (parsed) {
            setConfigVariables(parsed.variables);
        } else {
            setConfigVariables([]);
        }
    }, [sourceCode]);

    // Execute code and update chart preview
    const executeCodeAndUpdateChart = async (code: string) => {
        const notebookTracker = chartData?.notebookTracker;
        const notebookPanel = notebookTracker?.currentWidget;
        
        if (!notebookPanel || !notebookPanel.context.sessionContext.session?.kernel) {
            console.warn('No kernel available to execute code');
            return;
        }

        setIsExecuting(true);
        const kernel = notebookPanel.context.sessionContext.session.kernel;

        try {
            const future = kernel.requestExecute({
                code: code,
                silent: false,
                store_history: false
            });

            let imageData: string | null = null;

            future.onIOPub = (msg: KernelMessage.IMessage) => {
                // Check for display_data messages which contain matplotlib images
                if (KernelMessage.isDisplayDataMsg(msg)) {
                    const data = msg.content.data;
                    const imagePng = data['image/png'];
                    if (imagePng) {
                        // Extract base64 data - handle string or array format
                        if (typeof imagePng === 'string') {
                            imageData = imagePng;
                        } else if (Array.isArray(imagePng) && imagePng.length > 0) {
                            imageData = imagePng[0] as string;
                        }
                    }
                }
                // Also check execute_result messages
                if (KernelMessage.isExecuteResultMsg(msg)) {
                    const data = msg.content.data;
                    const imagePng = data['image/png'];
                    if (imagePng) {
                        if (typeof imagePng === 'string') {
                            imageData = imagePng;
                        } else if (Array.isArray(imagePng) && imagePng.length > 0) {
                            imageData = imagePng[0] as string;
                        }
                    }
                }
            };

            await future.done;

            if (imageData) {
                setCurrentImageData(imageData);
            }
        } catch (error) {
            console.error('Error executing code:', error);
        } finally {
            setIsExecuting(false);
        }
    };

    // Debounced execution when config variables change (not manual code edits)
    useEffect(() => {
        // Only execute if config variables changed (via input fields), not manual code edits
        if (!configChangedRef.current || configVariables.length === 0 || !chartData?.notebookTracker) {
            configChangedRef.current = false; // Reset flag
            return;
        }

        // Clear previous timeout
        if (executeTimeoutRef.current) {
            clearTimeout(executeTimeoutRef.current);
        }

        // Execute after a short delay (debounce)
        executeTimeoutRef.current = setTimeout(() => {
            void executeCodeAndUpdateChart(sourceCode);
            configChangedRef.current = false; // Reset after execution
        }, 500); // 500ms debounce

        return () => {
            if (executeTimeoutRef.current) {
                clearTimeout(executeTimeoutRef.current);
            }
        };
    }, [sourceCode, configVariables]);

    // Convert base64 image data to data URL
    const imageSrc = currentImageData 
        ? `data:image/png;base64,${currentImageData}` 
        : null;

    const handleVariableChange = (variableName: string, newValue: string | number | boolean | [number, number]) => {
        const updated = configVariables.map(v => 
            v.name === variableName 
                ? { ...v, value: newValue }
                : v
        );
        setConfigVariables(updated);
        
        // Mark that config changed (not manual code edit)
        configChangedRef.current = true;
        
        // Update the source code
        const updatedCode = updateChartConfig(sourceCode, updated);
        setSourceCode(updatedCode);
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

        // String input
        return (
            <div key={variable.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <label style={{ minWidth: '150px', fontWeight: '500' }}>{label}:</label>
                <input
                    type="text"
                    value={variable.value as string}
                    onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                    style={{ flex: 1, padding: '5px' }}
                />
            </div>
        );
    };

    const hasConfig = configVariables.length > 0;

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflow: 'auto' }}>
            <h2>Chart Wizard</h2>
            
            {imageSrc ? (
                <div style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '4px', position: 'relative' }}>
                    <h3>Chart Preview {isExecuting && <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>(updating...)</span>}</h3>
                    <img 
                        src={imageSrc} 
                        alt="Chart" 
                        style={{ 
                            maxWidth: '100%', 
                            height: 'auto',
                            opacity: isExecuting ? 0.6 : 1,
                            transition: 'opacity 0.2s'
                        }}
                    />
                </div>
            ) : (
                <div>
                    <p>No chart data available. Click the Chart Wizard button on a matplotlib chart to get started.</p>
                </div>
            )}

            {hasConfig ? (
                <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
                    <h3 style={{ marginTop: 0 }}>Chart Configuration</h3>
                    <p style={{ fontSize: '12px', color: '#666', marginTop: '-10px', marginBottom: '15px' }}>
                        Edit values below to customize your chart
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

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '200px' }}>
                <h3>Source Code</h3>
                <textarea
                    value={sourceCode}
                    onChange={(e) => setSourceCode(e.target.value)}
                    style={{
                        flex: 1,
                        fontFamily: 'monospace',
                        fontSize: '14px',
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        resize: 'none',
                        whiteSpace: 'pre',
                        overflowWrap: 'normal',
                        overflowX: 'auto',
                        minHeight: '200px'
                    }}
                    placeholder="Source code will appear here..."
                />
            </div>
        </div>
    );
};

