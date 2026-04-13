/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import type { Dispatch, SetStateAction } from 'react';
import type { UIState } from '../types';

/** Must match `@keyframes mito-row-delete-exit` duration in GridData/IndexHeaders CSS (plus a small buffer). */
export const GRID_ROW_DELETE_ANIM_MS = 620;

/**
 * Highlights the given data row indices with `gridRowExitAnimation`, waits for the CSS
 * transition, then runs the delete (which updates sheet data from the backend).
 */
export function scheduleAnimatedRowDelete(
    setUIState: Dispatch<SetStateAction<UIState>>,
    sheetIndex: number,
    rowIndices: number[],
    runDelete: () => Promise<unknown>
): void {
    if (rowIndices.length === 0) {
        void runDelete();
        return;
    }
    // Two rAFs: commit a frame without exit styles so the browser has a "from" opacity/transform before the transition runs.
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            setUIState((prev) => ({
                ...prev,
                gridRowExitAnimation: { sheetIndex, rowIndices },
            }));
            window.setTimeout(() => {
                setUIState((prev) => ({
                    ...prev,
                    gridRowExitAnimation: undefined,
                }));
                void runDelete();
            }, GRID_ROW_DELETE_ANIM_MS);
        });
    });
}
