/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import type { Dispatch, SetStateAction } from 'react';
import { getRandomId, type MitoAPI } from '../api/api';
import { TaskpaneType } from '../components/taskpanes/taskpanes';
import {
    EditorState,
    GridState,
    StreamlitAIModeAnnotation,
    StreamlitAIModeCategory,
    StreamlitAIModeSeverity,
    UIState,
} from '../types';

export type StreamlitAIModeApiPayload = {
    column_notes: {
        column: string;
        note: string;
        column_index: number;
        severity?: string;
        category?: string;
    }[];
    cell_notes: {
        column: string;
        row: number;
        note: string;
        column_index: number;
        value?: string;
        severity?: string;
        category?: string;
    }[];
};

const SEVERITIES = new Set(['info', 'warning', 'critical']);
const CATEGORIES = new Set([
    'outlier',
    'missing',
    'invalid_domain',
    'inconsistency',
    'duplicate',
    'other',
]);

function mapSeverity(s: string | undefined): StreamlitAIModeSeverity | undefined {
    if (s && SEVERITIES.has(s)) {
        return s as StreamlitAIModeSeverity;
    }
    return undefined;
}

function mapCategory(s: string | undefined): StreamlitAIModeCategory | undefined {
    if (s && CATEGORIES.has(s)) {
        return s as StreamlitAIModeCategory;
    }
    return undefined;
}

export function annotationsFromApiPayload(
    sheetIndex: number,
    data: StreamlitAIModeApiPayload
): StreamlitAIModeAnnotation[] {
    const out: StreamlitAIModeAnnotation[] = [];
    for (const cn of data.column_notes ?? []) {
        if (
            typeof cn.column_index !== 'number' ||
            typeof cn.note !== 'string' ||
            !cn.note.trim()
        ) {
            continue;
        }
        out.push({
            id: getRandomId(),
            kind: 'column',
            sheetIndex,
            columnIndex: cn.column_index,
            text: cn.note.trim(),
            severity: mapSeverity(cn.severity),
            category: mapCategory(cn.category),
        });
    }
    for (const cn of data.cell_notes ?? []) {
        if (
            typeof cn.column_index !== 'number' ||
            typeof cn.row !== 'number' ||
            typeof cn.note !== 'string' ||
            !cn.note.trim()
        ) {
            continue;
        }
        out.push({
            id: getRandomId(),
            kind: 'cell',
            sheetIndex,
            columnIndex: cn.column_index,
            rowIndex: cn.row,
            text: cn.note.trim(),
            severity: mapSeverity(cn.severity),
            category: mapCategory(cn.category),
            cellValue: typeof cn.value === 'string' ? cn.value : undefined,
        });
    }
    return out;
}

/** When the model omits or mislabels category, infer from note wording so fix buttons still appear. */
export function inferStreamlitAIModeCategoryFromText(text: string): StreamlitAIModeCategory | undefined {
    const t = text.toLowerCase();
    if (
        /\boutlier|\boutliers|\bstraggler|\biqr\b|\bextreme|\banomal|\bunusual value|\bfar from\b/i.test(t)
    ) {
        return 'outlier';
    }
    if (/\bduplicate|\bduplicated|\brepeated row|\bduplicate rows/i.test(t)) {
        return 'duplicate';
    }
    if (
        /\bmissing|null|high\s+proportion\s+of\s+null|many\s+null|na\b|nan\b|empty\s+(cell|cells|values?)/i.test(
            t
        )
    ) {
        return 'missing';
    }
    if (/\binvalid|wrong\s+type|format|typo|not\s+a\s+valid|doesn'?t\s+match\s+expected/i.test(t)) {
        return 'invalid_domain';
    }
    if (/\binconsisten|conflict|contradict|mismatch/i.test(t)) {
        return 'inconsistency';
    }
    return undefined;
}

export function effectiveStreamlitAIModeCategory(
    annotation: StreamlitAIModeAnnotation
): StreamlitAIModeCategory {
    return (
        annotation.category ??
        inferStreamlitAIModeCategoryFromText(annotation.text) ??
        'other'
    );
}

export function getStreamlitAIModeAnnotationForClick(
    annotations: StreamlitAIModeAnnotation[] | undefined,
    sheetIndex: number,
    rowIndex: number,
    columnIndex: number
): StreamlitAIModeAnnotation | undefined {
    if (!annotations?.length || columnIndex < 0) {
        return undefined;
    }
    const sameSheet = annotations.filter((a) => a.sheetIndex === sheetIndex);
    if (rowIndex === -1) {
        const col = sameSheet.find(
            (a) => a.kind === 'column' && a.columnIndex === columnIndex
        );
        if (col !== undefined) {
            return col;
        }
        return sameSheet.find(
            (a) => a.kind === 'cell' && a.columnIndex === columnIndex
        );
    }
    return sameSheet.find(
        (a) =>
            a.kind === 'cell' &&
            a.columnIndex === columnIndex &&
            a.rowIndex === rowIndex
    );
}

export function columnHeaderHasAIModeAlert(
    annotations: StreamlitAIModeAnnotation[] | undefined,
    sheetIndex: number,
    columnIndex: number
): boolean {
    return (
        annotations?.some(
            (a) =>
                a.kind === 'column' &&
                a.sheetIndex === sheetIndex &&
                a.columnIndex === columnIndex
        ) ?? false
    );
}

/**
 * Only real data rows with an explicit cell annotation get a grid marker.
 * (The grid paints empty rows below `numRows`; those must never show a marker.)
 */
export function cellHasAIModeCellHighlight(
    annotations: StreamlitAIModeAnnotation[] | undefined,
    sheetIndex: number,
    rowIndex: number,
    columnIndex: number,
    dataRowCount: number
): boolean {
    if (rowIndex < 0 || rowIndex >= dataRowCount) {
        return false;
    }
    return (
        annotations?.some(
            (a) =>
                a.kind === 'cell' &&
                a.sheetIndex === sheetIndex &&
                a.columnIndex === columnIndex &&
                a.rowIndex === rowIndex
        ) ?? false
    );
}

export type StreamlitAIModeSuggestedAction = { id: string; label: string };

/** Maps annotation category to one-click fix buttons (backend runs deterministic pandas code). */
export function getSuggestedStreamlitAIModeActions(
    annotation: StreamlitAIModeAnnotation
): StreamlitAIModeSuggestedAction[] {
    const cat = effectiveStreamlitAIModeCategory(annotation);
    if (annotation.kind === 'column') {
        if (cat === 'outlier') {
            return [{ id: 'remove_iqr_outliers_column', label: 'Remove IQR outliers' }];
        }
        if (cat === 'duplicate') {
            return [{ id: 'drop_duplicate_rows', label: 'Drop duplicate rows' }];
        }
        if (cat === 'missing') {
            return [
                {
                    id: 'fill_missing_column_mean',
                    label: 'Fill missing values with average',
                },
                {
                    id: 'drop_missing_in_column',
                    label: 'Drop rows missing in this column',
                },
            ];
        }
        if (
            cat === 'other' ||
            cat === 'invalid_domain' ||
            cat === 'inconsistency'
        ) {
            return [
                {
                    id: 'fill_missing_column_mean',
                    label: 'Fill missing values with average',
                },
                { id: 'drop_missing_in_column', label: 'Drop rows missing in this column' },
                { id: 'remove_iqr_outliers_column', label: 'Remove IQR outliers' },
            ];
        }
        // Fallback: always offer column-level fixes if a column note slipped through unmatched.
        return [
            {
                id: 'fill_missing_column_mean',
                label: 'Fill missing values with average',
            },
            { id: 'drop_missing_in_column', label: 'Drop rows missing in this column' },
        ];
    }
    if (
        cat === 'outlier' ||
        cat === 'missing' ||
        cat === 'invalid_domain' ||
        cat === 'inconsistency' ||
        cat === 'duplicate'
    ) {
        return [{ id: 'remove_row', label: 'Remove this row' }];
    }
    if (cat === 'other' && annotation.kind === 'cell') {
        return [{ id: 'remove_row', label: 'Remove this row' }];
    }
    return [];
}

/** Run backend-generated pandas code via the same step as Mito AI transforms. */
export async function applyStreamlitAIModeSuggestedFix(
    mitoAPI: MitoAPI,
    annotation: StreamlitAIModeAnnotation,
    actionId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
    const apiParams: {
        action_id: string;
        sheet_index: number;
        column_index: number;
        row_index?: number;
    } = {
        action_id: actionId,
        sheet_index: annotation.sheetIndex,
        column_index: annotation.columnIndex,
    };
    if (annotation.kind === 'cell' && annotation.rowIndex !== undefined) {
        apiParams.row_index = annotation.rowIndex;
    }
    const fetched = await mitoAPI.getStreamlitAIModeActionCode(apiParams);
    if ('error' in fetched) {
        return { ok: false, error: fetched.error };
    }
    const payload = fetched.result;
    if (payload !== null && typeof payload === 'object' && 'error' in payload) {
        return { ok: false, error: String((payload as { error: string }).error) };
    }
    const { title, code } = payload as { title: string; code: string };
    const stepId = getRandomId();
    const applied = await mitoAPI._edit(
        'ai_transformation_edit',
        {
            user_input: title,
            prompt_version: 'streamlit-ai-mode-suggested-action-v1',
            prompt: 'Suggested fix from AI note.',
            completion: code,
            edited_completion: code,
        },
        stepId
    );
    if ('error' in applied) {
        return { ok: false, error: applied.error };
    }
    return { ok: true };
}

/**
 * Focus the sheet and select the annotation’s column (entire column) or data row (entire row).
 * Deferred `setGridState` so EndoGrid sheet reconciliation runs after `selectedSheetIndex` updates.
 */
export function selectStreamlitAiTargetInGrid(
    annotation: StreamlitAIModeAnnotation,
    target: 'column' | 'row',
    deps: {
        setUIState: Dispatch<SetStateAction<UIState>>;
        setGridState: Dispatch<SetStateAction<GridState>>;
        setEditorState: Dispatch<SetStateAction<EditorState | undefined>>;
    },
    options?: { dismissAiPopover?: boolean }
): void {
    const { setUIState, setGridState, setEditorState } = deps;
    setEditorState(undefined);
    setUIState((prev) => ({
        ...prev,
        selectedSheetIndex: annotation.sheetIndex,
        streamlitAIModeFocusedId: annotation.id,
        currOpenTaskpane: { type: TaskpaneType.STREAMLIT_AI_MODE },
        ...(options?.dismissAiPopover === true ? { streamlitAIModePopover: undefined } : {}),
    }));
    window.setTimeout(() => {
        if (target === 'column') {
            setGridState((gs) => ({
                ...gs,
                sheetIndex: annotation.sheetIndex,
                selections: [
                    {
                        startingRowIndex: -1,
                        endingRowIndex: -1,
                        startingColumnIndex: annotation.columnIndex,
                        endingColumnIndex: annotation.columnIndex,
                        sheetIndex: annotation.sheetIndex,
                    },
                ],
                copiedSelections: [],
            }));
        } else {
            const r = annotation.rowIndex ?? 0;
            setGridState((gs) => ({
                ...gs,
                sheetIndex: annotation.sheetIndex,
                selections: [
                    {
                        startingRowIndex: r,
                        endingRowIndex: r,
                        startingColumnIndex: -1,
                        endingColumnIndex: -1,
                        sheetIndex: annotation.sheetIndex,
                    },
                ],
                copiedSelections: [],
            }));
        }
    }, 0);
}
