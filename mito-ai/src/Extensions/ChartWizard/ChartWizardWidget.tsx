/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ReactWidget, Notification } from '@jupyterlab/apputils';
import { ChartWizardData } from './ChartWizardPlugin';
import { updateChartConfig, ChartConfigVariable } from './utils/parser';
import { convertChartCode, logEvent } from '../../restAPI/RestAPI';
import { removeMarkdownCodeFormatting } from '../../utils/strings';
import LoadingDots from '../../components/LoadingDots';
import {
    BooleanInputRow,
    TupleInputRow,
    NumberInputRow,
    ColorInputRow,
    StringInputRow,
    isHexColor
} from './inputs';
import { useChartConfig, useDebouncedNotebookUpdate } from './hooks';
import '../../../style/ChartWizardWidget.css';

interface ChartWizardContentProps {
    chartData: ChartWizardData | null;
}

/**
 * Formats a variable name into a human-readable label.
 * Converts snake_case to Title Case (e.g., "figure_size" -> "Figure Size").
 */
const formatVariableLabel = (variableName: string): string => {
    return variableName
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (l) => l.toUpperCase());
};

const ChartWizardContent: React.FC<ChartWizardContentProps> = ({ chartData }) => {
    const [isConverting, setIsConverting] = useState(false);
    const [currentSourceCode, setCurrentSourceCode] = useState<string | null>(null);

    // Reset currentSourceCode when switching to a different chart
    useEffect(() => {
        setCurrentSourceCode(null);
    }, [chartData?.sourceCode]);

    // Use custom hook for chart config management
    const { configVariables, setConfigVariables, hasConfig } = useChartConfig({
        sourceCode: chartData?.sourceCode,
        currentSourceCode,
    });

    // Use custom hook for debounced notebook updates
    const { updateNotebookCell, scheduleUpdate, clearPendingUpdate } = useDebouncedNotebookUpdate({
        chartData,
        debounceDelay: 500,
    });

    /**
     * Handles variable value changes with debounced notebook updates.
     */
    const handleVariableChange = useCallback(
        (
            variableName: string,
            newValue: string | number | boolean | [number, number]
        ): void => {
            const codeToUse = currentSourceCode || chartData?.sourceCode;
            if (!codeToUse) return;

            // Update config variables state
            const updated = configVariables.map((v) =>
                v.name === variableName ? { ...v, value: newValue } : v
            );
            setConfigVariables(updated);

            // Update the source code
            const updatedCode = updateChartConfig(codeToUse, updated);
            setCurrentSourceCode(updatedCode);

            // Schedule debounced notebook update
            scheduleUpdate(updatedCode);
        },
        [chartData?.sourceCode, currentSourceCode, configVariables, setConfigVariables, scheduleUpdate]
    );

    /**
     * Handles chart conversion from matplotlib to Chart Wizard format.
     */
    const handleConvertChart = useCallback(async (): Promise<void> => {
        void logEvent('clicked_convert_chart_button');

        if (!chartData?.sourceCode) {
            console.error('No source code available');
            return;
        }

        // Clear any pending debounced updates to prevent race conditions
        clearPendingUpdate();

        setIsConverting(true);
        try {
            const response = await convertChartCode(chartData.sourceCode);
            if (response.converted_code) {
                // Extract code from markdown code blocks if present
                const extractedCode = removeMarkdownCodeFormatting(response.converted_code);
                // Validate that extracted code is not empty to prevent deleting user's code
                if (!extractedCode || extractedCode.trim().length === 0) {
                    console.error('Error: Extracted code is empty. Cannot update notebook cell.');
                    Notification.emit(
                        'Chart conversion failed: The converted code is empty. Please try again or check your chart code.',
                        'error',
                        {
                            autoClose: 5000
                        }
                    );
                    return;
                }
                // Update current source code so the useEffect will parse it
                setCurrentSourceCode(extractedCode);
                // Update the cell with the converted code and re-execute
                updateNotebookCell(extractedCode);
            }
        } catch (error) {
            console.error('Error converting chart code:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            Notification.emit(
                `Chart conversion failed: ${errorMessage}. Please try again.`,
                'error',
                {
                    autoClose: 5000
                }
            );
        } finally {
            setIsConverting(false);
        }
    }, [chartData?.sourceCode, clearPendingUpdate, updateNotebookCell]);

    /**
     * Renders the appropriate input field component based on variable type.
     */
    const renderInputField = useCallback(
        (variable: ChartConfigVariable): React.ReactElement => {
            const label = formatVariableLabel(variable.name);

            const commonProps = {
                variable,
                label,
                onVariableChange: handleVariableChange,
            };

            switch (variable.type) {
                case 'boolean':
                    return <BooleanInputRow key={variable.name} {...commonProps} />;
                case 'tuple':
                    return <TupleInputRow key={variable.name} {...commonProps} />;
                case 'number':
                    return <NumberInputRow key={variable.name} {...commonProps} />;
                case 'string': {
                    // String input - check if it's a hex color
                    const stringValue = variable.value as string;
                    const isColor = isHexColor(stringValue);

                    if (isColor) {
                        return <ColorInputRow key={variable.name} {...commonProps} />;
                    }
                    return <StringInputRow key={variable.name} {...commonProps} />;
                }
                default:
                    return <StringInputRow key={variable.name} {...commonProps} />;
            }
        },
        [handleVariableChange]
    );

    // Memoize input fields to prevent unnecessary re-renders
    const inputFields = useMemo(
        () => configVariables.map(renderInputField),
        [configVariables, renderInputField]
    );

    // Early return for empty state
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
                    {inputFields}
                </div>
            ) : (
                <div className="chart-wizard-no-config">
                    <p>
                        <strong>This chart isn&apos;t ready for Chart Wizard yet.</strong>
                        <br />
                        Run the converter below or let Mito AI handle it automatically.
                    </p>
                    <button
                        className="button-base button-purple"
                        disabled={isConverting}
                        onClick={handleConvertChart}
                        type="button"
                    >
                        {isConverting ? (
                            <>
                                Converting{' '}
                                <span className="chart-wizard-loading-dots">
                                    <LoadingDots />
                                </span>
                            </>
                        ) : (
                            'Convert'
                        )}
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