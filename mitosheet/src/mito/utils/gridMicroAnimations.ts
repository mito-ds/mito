/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import type { Dispatch, SetStateAction } from 'react';
import type { UIState } from '../types';

/** Match `mito-column-delete-exit` duration in CSS + buffer. */
export const GRID_COLUMN_DELETE_ANIM_MS = 620;

/**
 * Column delete exit before backend removes columns (same pattern as row delete).
 */
export function scheduleAnimatedColumnDelete(
    setUIState: Dispatch<SetStateAction<UIState>>,
    sheetIndex: number,
    columnIndices: number[],
    runDelete: () => Promise<unknown>
): void {
    if (columnIndices.length === 0) {
        void runDelete();
        return;
    }
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            setUIState((prev) => ({
                ...prev,
                gridColumnExitAnimation: { sheetIndex, columnIndices },
            }));
            window.setTimeout(() => {
                setUIState((prev) => ({
                    ...prev,
                    gridColumnExitAnimation: undefined,
                }));
                void runDelete();
            }, GRID_COLUMN_DELETE_ANIM_MS);
        });
    });
}
