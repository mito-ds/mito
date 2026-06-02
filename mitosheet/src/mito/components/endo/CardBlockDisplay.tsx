/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from "react";

export type CardBlock =
    | { type: 'text'; content: string }
    | { type: 'header'; content: string }
    | { type: 'metric'; label: string; value: string; delta?: string }
    | { type: 'table'; rows: [string, string][] }
    | { type: 'divider' };

const CardBlockDisplay = (props: { blocks: CardBlock[] }): JSX.Element => {
    const elements: React.ReactNode[] = [];
    const metricBuffer: Extract<CardBlock, { type: 'metric' }>[] = [];

    const flushMetrics = () => {
        if (metricBuffer.length === 0) {
            return;
        }
        elements.push(
            <div key={`metrics-${elements.length}`} className="mito-card-metrics-row">
                {metricBuffer.map((block, i) => (
                    <div key={i} className="mito-card-metric">
                        <div className="mito-card-metric-label">{block.label}</div>
                        <div className="mito-card-metric-value">{block.value}</div>
                        {block.delta !== undefined && block.delta !== '' &&
                            <div className="mito-card-metric-delta">{block.delta}</div>
                        }
                    </div>
                ))}
            </div>
        );
        metricBuffer.length = 0;
    };

    props.blocks.forEach((block, index) => {
        if (block.type === 'metric') {
            metricBuffer.push(block);
            return;
        }
        flushMetrics();

        if (block.type === 'header') {
            elements.push(
                <div key={index} className="mito-card-header">{block.content}</div>
            );
        } else if (block.type === 'text') {
            elements.push(
                <div key={index} className="mito-card-text">{block.content}</div>
            );
        } else if (block.type === 'divider') {
            elements.push(<hr key={index} className="mito-card-divider" />);
        } else if (block.type === 'table') {
            elements.push(
                <table key={index} className="mito-card-table">
                    <tbody>
                        {block.rows.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                <td className="mito-card-table-label">{row[0]}</td>
                                <td className="mito-card-table-value">{row[1]}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }
    });

    flushMetrics();

    return (
        <div className="mito-selection-card-blocks">
            {elements}
        </div>
    );
};

export default CardBlockDisplay;
