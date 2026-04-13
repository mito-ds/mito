/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import '../../../../css/endo/GhostColumn.css';
import { AIGhostSuggestedColumn, SheetData } from '../../types';
import { getColumnHeaderParts } from '../../utils/columnHeaders';
import { DEFAULT_HEIGHT } from './EndoGrid';

const GhostColumnHeader = (props: {
    columnIndex: number;
    width: number;
    sheetData: SheetData;
    ghost: AIGhostSuggestedColumn;
    onCommit: () => void;
}): JSX.Element => {
    const firstHeader = props.sheetData.data[0]?.columnHeader;
    const { lowerLevelColumnHeaders } = getColumnHeaderParts(firstHeader ?? '');
    const extraLevels = lowerLevelColumnHeaders.length;
    const totalMinHeight = DEFAULT_HEIGHT * Math.max(0, extraLevels) + 45;

    return (
        <div
            className="endo-column-header-container mito-ghost-column-header"
            style={{
                width: props.width,
                minHeight: totalMinHeight,
            }}
            mito-col-index={props.columnIndex + ''}
            onMouseDown={(e) => {
                e.stopPropagation();
            }}
            onClick={(e) => {
                e.stopPropagation();
                props.onCommit();
            }}
            title={props.ghost.description ?? props.ghost.formula}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    props.onCommit();
                }
            }}
        >
            <div className="mito-ghost-column-header-inner text-overflow-hide">
                <span className="mito-ghost-column-badge" aria-hidden>
                    fx
                </span>
                <span>{props.ghost.columnHeader}</span>
            </div>
        </div>
    );
};

export default React.memo(GhostColumnHeader);
