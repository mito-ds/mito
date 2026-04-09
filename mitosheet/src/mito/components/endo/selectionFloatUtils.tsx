/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { GridState, MitoSelection, SheetData } from '../../types';
import {
    getBodyBoundingIndices,
    isMultiCellRangeSelection,
    isSingleColumnAllRowsSelection,
} from './selectionUtils';

/** Must match DEFAULT_HEIGHT in EndoGrid.tsx */
const ROW_HEIGHT_PX = 25;

const GAP_PX = 4;

/**
 * Approximate height of the floating selection toolbar (one row of actions).
 * Keep in sync with `.mito-endo-grid__selection-actions` in EndoGrid.css
 * (padding + line-height / min-height). If you add a second row or taller controls,
 * bump this so above/below placement stays correct.
 */
export const SELECTION_FLOAT_APPROX_HEIGHT_PX = 34;

/**
 * Positions the selection toolbar above or below the visible part of the selection,
 * anchored to the endo grid container.
 */
export const getSelectionFloatStyle = (
    gridState: GridState,
    sheetData: SheetData,
    scrollContainerEl: HTMLDivElement | null,
    gridContainerEl: HTMLDivElement | null,
    selection: MitoSelection
): React.CSSProperties | undefined => {
    if (!scrollContainerEl || !gridContainerEl) {
        return undefined;
    }
    if (
        !isMultiCellRangeSelection(selection, sheetData, gridState.sheetIndex) &&
        !isSingleColumnAllRowsSelection(selection, sheetData, gridState.sheetIndex)
    ) {
        return undefined;
    }
    const bounds = getBodyBoundingIndices(selection, sheetData, gridState.sheetIndex);
    if (bounds === null) {
        return undefined;
    }

    const { minR, maxR, minC, maxC } = bounds;
    const wd = gridState.widthDataArray[gridState.sheetIndex];
    if (!wd?.widthSumArray?.length) {
        return undefined;
    }

    const selLeft = minC === 0 ? 0 : wd.widthSumArray[minC - 1];
    const selRight = wd.widthSumArray[maxC];
    const selTop = minR * ROW_HEIGHT_PX;
    const selBottom = (maxR + 1) * ROW_HEIGHT_PX;

    const { scrollLeft, scrollTop } = gridState.scrollPosition;
    const { width: vpWidth, height: vpHeight } = gridState.viewport;

    const vpLeft = scrollLeft;
    const vpRight = scrollLeft + vpWidth;
    const vpTop = scrollTop;
    const vpBottom = scrollTop + vpHeight;

    const visLeft = Math.max(selLeft, vpLeft);
    const visRight = Math.min(selRight, vpRight);
    const visTop = Math.max(selTop, vpTop);
    const visBottom = Math.min(selBottom, vpBottom);

    if (visLeft >= visRight || visTop >= visBottom) {
        return undefined;
    }

    const scrollRect = scrollContainerEl.getBoundingClientRect();
    const gridRect = gridContainerEl.getBoundingClientRect();

    const minTopScreen = scrollRect.top + (visTop - scrollTop);
    const maxBottomScreen = scrollRect.top + (visBottom - scrollTop);

    const tableRect = scrollRect;
    const roomBelow = tableRect.bottom - maxBottomScreen;
    const roomAbove = minTopScreen - tableRect.top;
    const visHeight = visBottom - visTop;
    const noRoomPastSelectionBottom =
        roomBelow < SELECTION_FLOAT_APPROX_HEIGHT_PX + GAP_PX + 4;
    const selectionFillsDataViewportVertically =
        vpHeight > 0 &&
        (visHeight >= vpHeight - 1 || noRoomPastSelectionBottom);

    const preferBelow =
        roomBelow >= SELECTION_FLOAT_APPROX_HEIGHT_PX + GAP_PX ||
        roomBelow >= roomAbove;

    let topPx: number;
    if (selectionFillsDataViewportVertically) {
        /*
         * Full-column (or any range) that covers the full visible data height: the old
         * "prefer below bottom edge" path put the toolbar just under the viewport bottom,
         * where overflow:hidden on Mito/Jupyter parents clips it. Anchor to the top of the
         * visible selection band instead (same as a short multi-cell range in view).
         */
        topPx = minTopScreen - gridRect.top + GAP_PX;
    } else if (preferBelow) {
        topPx = maxBottomScreen - gridRect.top + GAP_PX;
    } else {
        topPx =
            minTopScreen -
            gridRect.top -
            GAP_PX -
            SELECTION_FLOAT_APPROX_HEIGHT_PX;
    }

    const centerXScreen =
        scrollRect.left + (visLeft + visRight) / 2 - scrollLeft;
    const leftPx = centerXScreen - gridRect.left;

    if (!Number.isFinite(topPx) || !Number.isFinite(leftPx)) {
        return undefined;
    }

    return {
        top: topPx,
        left: leftPx,
        transform: 'translateX(-50%)',
    };
};
