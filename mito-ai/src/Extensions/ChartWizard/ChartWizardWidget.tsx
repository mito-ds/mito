/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState, useEffect, useRef } from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
import { NotebookActions } from '@jupyterlab/notebook';
import { ChartWizardData } from './ChartWizardPlugin';
import { parseChartConfig, updateChartConfig, ChartConfigVariable } from './parser';
import { writeCodeToCellByIDInNotebookPanel } from '../../utils/notebook';
import { convertChartCode } from '../../restAPI/RestAPI';
import { removeMarkdownCodeFormatting } from '../../utils/strings';
import {
    BooleanInputRow,
    TupleInputRow,
    NumberInputRow,
    ColorInputRow,
    StringInputRow,
    isHexColor
} from './inputs';
import '../../../style/ChartWizardWidget.css';

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

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (executeTimeoutRef.current) {
                clearTimeout(executeTimeoutRef.current);
            }
        };
    }, []);

    // Update notebook cell and re-execute when config variables change
    const updateNotebookCell = (updatedCode: string): void => {
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

    const handleVariableChange = (
        variableName: string, newValue: string | number | boolean | [number, number]
    ): void => {
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

    const renderInputField = (variable: ChartConfigVariable): React.ReactElement => {
        const label = variable.name.replace(/_/g, ' ').toLowerCase()
            .replace(/\b\w/g, l => l.toUpperCase());

        const commonProps = {
            variable,
            label,
            onVariableChange: handleVariableChange
        };

        if (variable.type === 'boolean') {
            return <BooleanInputRow {...commonProps} />;
        }

        if (variable.type === 'tuple') {
            return <TupleInputRow {...commonProps} />;
        }

        if (variable.type === 'number') {
            return <NumberInputRow {...commonProps} />;
        }

        // String input - check if it's a hex color
        const stringValue = variable.value as string;
        const isColor = isHexColor(stringValue);

        if (isColor) {
            return <ColorInputRow {...commonProps} />;
        }

        // Regular string input
        return <StringInputRow {...commonProps} />;
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
                    <p className="chart-wizard-config-description">
                        Edit values below to customize your chart. Changes will be reflected in the notebook.
                    </p>
                    {configVariables.map(renderInputField)}
                </div>
            ) : (
                <div className="chart-wizard-no-config">
                    <p>
                        No chart configuration found. Convert your chart using the utility below, or have Mito AI convert it for you. In both cases, the chart will remain visually unchanged.
                    </p>
                    <button
                        onClick={async () => {
                            if (!chartData?.sourceCode) {
                                console.error('No source code available');
                                return;
                            }
                            try {
                                const response = await convertChartCode(chartData.sourceCode);
                                console.log('Chart conversion response:', response);
                                if (response.converted_code) {
                                    // Extract code from markdown code blocks if present
                                    const extractedCode = removeMarkdownCodeFormatting(response.converted_code);
                                    console.log('Extracted code:', extractedCode);
                                    // TODO: Update the cell with extractedCode
                                }
                            } catch (error) {
                                console.error('Error converting chart code:', error);
                            }
                        }}
                    >
                        Convert
                    </button>
                </div>
            )}
        </div>
    );
};

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