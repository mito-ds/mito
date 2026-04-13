/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import type { Dispatch, SetStateAction } from 'react';
import type { UIState } from '../types';

/** Match `mito-column-enter` duration in CSS + buffer (same pacing as row delete). */
export const GRID_COLUMN_ENTER_ANIM_MS = 700;

/**
 * Plays the column enter animation for an existing column (call after `editAddColumn` resolves).
 * Deferred so React + width data commit before we tag the column (avoids wrong viewport / no matching cells).
 */
export function scheduleAnimatedColumnEnter(
    setUIState: Dispatch<SetStateAction<UIState>>,
    sheetIndex: number,
    columnIndex: number
): void {
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            setUIState((prev) => ({
                ...prev,
                gridColumnEnterAnimation: { sheetIndex, columnIndex },
            }));
            window.setTimeout(() => {
                setUIState((prev) => ({
                    ...prev,
                    gridColumnEnterAnimation: undefined,
                }));
            }, GRID_COLUMN_ENTER_ANIM_MS);
        });
    });
}
