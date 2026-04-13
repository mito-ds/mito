/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import type { Dispatch, SetStateAction } from 'react';
import type { UIState } from '../types';

/** Match `mito-column-delete-exit` duration in CSS + buffer (same as row delete). */
export const GRID_COLUMN_DELETE_ANIM_MS = 620;

/** Whole-grid surface flashes */
export const GRID_SURFACE_FLASH_MS = 480;

/** Row enter stagger window */
export const GRID_ROW_ENTER_ANIM_MS = 520;

/** Selection / edit commit pulse */
export const GRID_CELL_PULSE_MS = 420;

/** Sheet tab slide */
export const GRID_SHEET_TRANSITION_MS = 360;

export type GridSurfaceFlashKind = 'sort' | 'filter' | 'undoRedo' | 'replace';

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

export function scheduleGridRowEnterAnimation(
    setUIState: Dispatch<SetStateAction<UIState>>,
    sheetIndex: number,
    rowIndices: number[]
): void {
    if (rowIndices.length === 0) {
        return;
    }
    window.setTimeout(() => {
        setUIState((prev) => ({
            ...prev,
            gridRowEnterAnimation: { sheetIndex, rowIndices },
        }));
        window.setTimeout(() => {
            setUIState((prev) => ({
                ...prev,
                gridRowEnterAnimation: undefined,
            }));
        }, GRID_ROW_ENTER_ANIM_MS);
    }, 0);
}

export function scheduleGridSurfaceFlash(
    setUIState: Dispatch<SetStateAction<UIState>>,
    sheetIndex: number,
    kind: GridSurfaceFlashKind
): void {
    window.setTimeout(() => {
        setUIState((prev) => ({
            ...prev,
            gridSurfaceFlash: { sheetIndex, kind },
        }));
        window.setTimeout(() => {
            setUIState((prev) => ({
                ...prev,
                gridSurfaceFlash: undefined,
            }));
        }, GRID_SURFACE_FLASH_MS);
    }, 0);
}

export function scheduleSelectionPulse(
    setUIState: Dispatch<SetStateAction<UIState>>,
    sheetIndex: number,
    rowIndex: number,
    columnIndex: number
): void {
    window.setTimeout(() => {
        setUIState((prev) => ({
            ...prev,
            gridSelectionPulse: { sheetIndex, rowIndex, columnIndex },
        }));
        window.setTimeout(() => {
            setUIState((prev) => ({
                ...prev,
                gridSelectionPulse: undefined,
            }));
        }, GRID_CELL_PULSE_MS);
    }, 0);
}

export function scheduleEditCommitPulse(
    setUIState: Dispatch<SetStateAction<UIState>>,
    sheetIndex: number,
    rowIndex: number,
    columnIndex: number
): void {
    window.setTimeout(() => {
        setUIState((prev) => ({
            ...prev,
            gridEditCommitPulse: { sheetIndex, rowIndex, columnIndex },
        }));
        window.setTimeout(() => {
            setUIState((prev) => ({
                ...prev,
                gridEditCommitPulse: undefined,
            }));
        }, GRID_CELL_PULSE_MS);
    }, 0);
}

