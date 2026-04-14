/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useCallback, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { getRandomId, type MitoAPI } from '../api/api';
import { TaskpaneType } from '../components/taskpanes/taskpanes';
import {
    AINotesAnnotation,
    AINotesAnnotationCategory,
    AINotesAnnotationSeverity,
    EditorState,
    GridState,
    SheetData,
    UIState,
} from '../types';
import { isNumberDtype } from './dtypes';

export type AINotesApiPayload = {
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

function mapSeverity(s: string | undefined): AINotesAnnotationSeverity | undefined {
    if (s && SEVERITIES.has(s)) {
        return s as AINotesAnnotationSeverity;
    }
    return undefined;
}

function mapCategory(s: string | undefined): AINotesAnnotationCategory | undefined {
    if (s && CATEGORIES.has(s)) {
        return s as AINotesAnnotationCategory;
    }
    return undefined;
}

export function annotationsFromApiPayload(
    sheetIndex: number,
    data: AINotesApiPayload
): AINotesAnnotation[] {
    const out: AINotesAnnotation[] = [];
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
export function inferAINotesCategoryFromText(text: string): AINotesAnnotationCategory | undefined {
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

export function effectiveAINotesCategory(
    annotation: AINotesAnnotation
): AINotesAnnotationCategory {
    return (
        annotation.category ??
        inferAINotesCategoryFromText(annotation.text) ??
        'other'
    );
}

/** Returns the first annotation that should open a popover for the given click. */
export function getAINotesAnnotationForClick(
    annotations: AINotesAnnotation[] | undefined,
    sheetIndex: number,
    rowIndex: number,
    columnIndex: number
): AINotesAnnotation | undefined {
    if (!annotations?.length || columnIndex < 0) {
        return undefined;
    }
    const sameSheet = annotations.filter((a) => a.sheetIndex === sheetIndex);
    if (rowIndex === -1) {
        // Column header click: prefer column-level note, fall back to any cell note in that column
        const col = sameSheet.find((a) => a.kind === 'column' && a.columnIndex === columnIndex);
        if (col !== undefined) return col;
        return sameSheet.find((a) => a.kind === 'cell' && a.columnIndex === columnIndex);
    }
    return sameSheet.find(
        (a) => a.kind === 'cell' && a.columnIndex === columnIndex && a.rowIndex === rowIndex
    );
}

export function columnHeaderHasAINote(
    annotations: AINotesAnnotation[] | undefined,
    sheetIndex: number,
    columnIndex: number
): boolean {
    return (
        annotations?.some(
            (a) => a.sheetIndex === sheetIndex && a.columnIndex === columnIndex
        ) ?? false
    );
}

export function cellHasAINote(
    annotations: AINotesAnnotation[] | undefined,
    sheetIndex: number,
    rowIndex: number,
    columnIndex: number,
    dataRowCount: number
): boolean {
    if (rowIndex < 0 || rowIndex >= dataRowCount) return false;
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

export type AINotesAction = { id: string; label: string };

/** Maps annotation category to one-click fix buttons. */
export function getSuggestedAINotesActions(
    annotation: AINotesAnnotation,
    sheetData?: SheetData
): AINotesAction[] {
    const cat = effectiveAINotesCategory(annotation);

    // IQR outlier removal and mean fill only apply to numeric columns (see get_ai_notes_action_code.py).
    const dtype = sheetData?.data[annotation.columnIndex]?.columnDtype;
    const isNumeric = dtype !== undefined ? isNumberDtype(dtype) : false;
    const canFillMissingWithMean = dtype !== undefined && isNumberDtype(dtype);

    const iqrAction = { id: 'remove_iqr_outliers_column', label: 'Remove IQR outliers' };
    const fillMeanAction = {
        id: 'fill_missing_column_mean',
        label: 'Fill missing values with average',
    } as const;
    const dropMissingInColumnAction = {
        id: 'drop_missing_in_column',
        label: 'Drop rows missing in this column',
    } as const;

    if (annotation.kind === 'column') {
        if (cat === 'outlier') {
            return isNumeric ? [iqrAction] : [];
        }
        if (cat === 'duplicate') {
            return [{ id: 'drop_duplicate_rows', label: 'Drop duplicate rows' }];
        }
        if (cat === 'missing') {
            return [
                ...(canFillMissingWithMean ? [fillMeanAction] : []),
                dropMissingInColumnAction,
            ];
        }
        if (cat === 'other' || cat === 'invalid_domain' || cat === 'inconsistency') {
            return [
                ...(canFillMissingWithMean ? [fillMeanAction] : []),
                dropMissingInColumnAction,
                ...(isNumeric ? [iqrAction] : []),
            ];
        }
        return [
            ...(canFillMissingWithMean ? [fillMeanAction] : []),
            dropMissingInColumnAction,
        ];
    }
    if (
        cat === 'outlier' ||
        cat === 'missing' ||
        cat === 'invalid_domain' ||
        cat === 'inconsistency' ||
        cat === 'duplicate' ||
        cat === 'other'
    ) {
        return [{ id: 'remove_row', label: 'Remove this row' }];
    }
    return [];
}

/** Run backend-generated pandas code via the AI transformation step. */
export async function applyAINotesAction(
    mitoAPI: MitoAPI,
    annotation: AINotesAnnotation,
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
    const fetched = await mitoAPI.getAINotesActionCode(apiParams);
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
            prompt_version: 'ai-notes-suggested-action-v1',
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
 * Shared hook for applying AI notes actions.
 * Manages the applying/error state and delegates post-success handling to the caller.
 */
export function useAINotesApply(mitoAPI: MitoAPI) {
    const [applyingActionId, setApplyingActionId] = useState<string | undefined>(undefined);
    const [actionError, setActionError] = useState<string | undefined>(undefined);

    const clearState = useCallback(() => {
        setApplyingActionId(undefined);
        setActionError(undefined);
    }, []);

    const apply = useCallback(async (
        annotation: AINotesAnnotation,
        actionId: string,
        onSuccess: () => void
    ): Promise<{ ok: true } | { ok: false }> => {
        setActionError(undefined);
        setApplyingActionId(actionId);
        const result = await applyAINotesAction(mitoAPI, annotation, actionId);
        setApplyingActionId(undefined);
        if (!result.ok) {
            setActionError(result.error);
            return { ok: false };
        }
        onSuccess();
        return { ok: true };
    }, [mitoAPI]);

    return { applyingActionId, actionError, apply, clearState };
}

/**
 * Focus the sheet and select the annotation's column (entire column) or data row (entire row).
 */
export function selectAINotesTargetInGrid(
    annotation: AINotesAnnotation,
    target: 'column' | 'row',
    deps: {
        setUIState: Dispatch<SetStateAction<UIState>>;
        setGridState: Dispatch<SetStateAction<GridState>>;
        setEditorState: Dispatch<SetStateAction<EditorState | undefined>>;
    },
    options?: { dismissPopover?: boolean }
): void {
    const { setUIState, setGridState, setEditorState } = deps;
    setEditorState(undefined);
    setUIState((prev) => ({
        ...prev,
        selectedSheetIndex: annotation.sheetIndex,
        aiNotesFocusedId: annotation.id,
        currOpenTaskpane: { type: TaskpaneType.AINOTES },
        ...(options?.dismissPopover === true ? { aiNotesPopover: undefined } : {}),
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
