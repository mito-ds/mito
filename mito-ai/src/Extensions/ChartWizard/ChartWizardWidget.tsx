/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
import { ChartWizardData } from './ChartWizardPlugin';

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

    // Convert base64 image data to data URL
    const imageSrc = chartData?.imageData 
        ? `data:image/png;base64,${chartData.imageData}` 
        : null;

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
            <h2>Chart Wizard</h2>
            
            {imageSrc ? (
                <div style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '4px' }}>
                    <h3>Chart Preview</h3>
                    <img 
                        src={imageSrc} 
                        alt="Chart" 
                        style={{ maxWidth: '100%', height: 'auto' }}
                    />
                </div>
            ) : (
                <div>
                    <p>No chart data available. Click the Chart Wizard button on a matplotlib chart to get started.</p>
                </div>
            )}

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                        overflowX: 'auto'
                    }}
                    placeholder="Source code will appear here..."
                />
            </div>
        </div>
    );
};

