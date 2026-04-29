/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import '../../../../css/endo/AINotesPopover.css';
import { MitoAPI } from '../../api/api';
import { AINotesAnnotation, EditorState, GridState, SheetData, UIState } from '../../types';
import { getDisplayColumnHeader } from '../../utils/columnHeaders';
import {
    getSuggestedAINotesActions,
    selectAINotesTargetInGrid,
    useAINotesApply,
} from '../../utils/aiNotesUtils';

export const AINotesPopover = (props: {
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    setGridState: React.Dispatch<React.SetStateAction<GridState>>;
    setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>;
    mitoContainerRef: React.RefObject<HTMLDivElement>;
    sheetData: SheetData | undefined;
    sheetIndex: number;
    mitoAPI: MitoAPI;
}): JSX.Element | null => {
    const pop = props.uiState.aiNotesPopover;
    const annotations = props.uiState.aiNotesAnnotations;
    const { applyingActionId, actionError, apply, clearState } = useAINotesApply(props.mitoAPI);

    const annotation: AINotesAnnotation | undefined = useMemo(() => {
        if (!pop || !annotations) return undefined;
        return annotations.find((a) => a.id === pop.annotationId);
    }, [pop, annotations]);

    const suggestedActions = useMemo(() => {
        if (annotation === undefined) return [];
        return getSuggestedAINotesActions(annotation, props.sheetData);
    }, [annotation, props.sheetData]);

    useEffect(() => {
        clearState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pop?.annotationId]);

    // Dismiss when the user switches to a different sheet
    useEffect(() => {
        if (pop !== undefined) {
            props.setUIState((prev) => ({ ...prev, aiNotesPopover: undefined }));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.sheetIndex]);

    if (!pop || !annotation) return null;

    const colLabel =
        props.sheetData?.data[annotation.columnIndex]?.columnHeader !== undefined
            ? getDisplayColumnHeader(props.sheetData.data[annotation.columnIndex].columnHeader)
            : `Column ${annotation.columnIndex + 1}`;

    const gridSelectDeps = {
        setUIState: props.setUIState,
        setGridState: props.setGridState,
        setEditorState: props.setEditorState,
    };

    const selectAndDismiss = (target: 'column' | 'row'): void => {
        selectAINotesTargetInGrid(annotation, target, gridSelectDeps, {
            dismissPopover: true,
            openAINotesTaskpane: false,
        });
    };

    const applyAction = async (actionId: string): Promise<void> => {
        await apply(annotation, actionId, () => {
            props.setUIState((prev) => ({
                ...prev,
                aiNotesPopover: undefined,
                aiNotesAnnotations: prev.aiNotesAnnotations?.filter((a) => a.id !== annotation.id),
            }));
        });
    };

    const host = props.mitoContainerRef.current;
    const cr = host?.getBoundingClientRect();
    const sev = annotation.severity ?? 'info';

    const viewportPadding = 8;
    const defaultPopoverWidth = 380;
    const defaultPopoverHeight = 320;

    const hostRelativeLeft = host && cr ? pop.x - cr.left + host.scrollLeft + 10 : undefined;
    const hostRelativeTop = host && cr ? pop.y - cr.top + host.scrollTop + 10 : undefined;

    const minHostLeft = host ? host.scrollLeft + viewportPadding : undefined;
    const maxHostLeft = host
        ? host.scrollLeft + host.clientWidth - defaultPopoverWidth - viewportPadding
        : undefined;
    const minHostTop = host ? host.scrollTop + viewportPadding : undefined;
    const maxHostTop = host
        ? host.scrollTop + host.clientHeight - defaultPopoverHeight - viewportPadding
        : undefined;

    const fallbackLeftUnclamped = pop.x + 10;
    const fallbackTopUnclamped = pop.y + 10;
    const minWindowLeft = viewportPadding;
    const maxWindowLeft = (typeof window !== 'undefined' ? window.innerWidth : 800) - defaultPopoverWidth - viewportPadding;
    const minWindowTop = viewportPadding;
    const maxWindowTop = (typeof window !== 'undefined' ? window.innerHeight : 600) - defaultPopoverHeight - viewportPadding;

    const left = host && hostRelativeLeft !== undefined && minHostLeft !== undefined && maxHostLeft !== undefined
        ? Math.max(minHostLeft, Math.min(hostRelativeLeft, Math.max(minHostLeft, maxHostLeft)))
        : Math.max(minWindowLeft, Math.min(fallbackLeftUnclamped, Math.max(minWindowLeft, maxWindowLeft)));
    const top = host && hostRelativeTop !== undefined && minHostTop !== undefined && maxHostTop !== undefined
        ? Math.max(minHostTop, Math.min(hostRelativeTop, Math.max(minHostTop, maxHostTop)))
        : Math.max(minWindowTop, Math.min(fallbackTopUnclamped, Math.max(minWindowTop, maxWindowTop)));

    const popEl = (
        <div
            className={`mito-ai-notes-popover mito-ai-notes-popover-severity-${sev}`}
            style={{
                position: host ? 'absolute' : 'fixed',
                left,
                top,
            }}
            role="dialog"
            aria-label="AI note"
            onMouseDown={(e) => e.stopPropagation()}
        >
            <button
                type="button"
                className="mito-ai-notes-popover-close"
                aria-label="Close"
                onClick={() => props.setUIState((prev) => ({ ...prev, aiNotesPopover: undefined }))}
            >
                ×
            </button>
            <div className="mito-ai-notes-popover-body-wrap">
                <div className="mito-ai-notes-popover-summary">
                    {pop.openedFrom === 'column_header' && (
                        <p className="mito-ai-notes-popover-scope">
                            <span className="mito-ai-notes-popover-scope-label">Column </span>
                            <span
                                className="mito-ai-notes-popover-scope-name mito-ai-notes-popover-scope-link"
                                role="button"
                                tabIndex={0}
                                title="Select this column in the sheet"
                                onClick={(e) => { e.stopPropagation(); selectAndDismiss('column'); }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); selectAndDismiss('column'); }
                                }}
                            >
                                {colLabel}
                            </span>
                        </p>
                    )}
                    {pop.openedFrom === 'cell' && (
                        <p className="mito-ai-notes-popover-scope">
                            <span
                                className="mito-ai-notes-popover-scope-name mito-ai-notes-popover-scope-link"
                                role="button"
                                tabIndex={0}
                                title="Select this row in the sheet"
                                onClick={(e) => { e.stopPropagation(); selectAndDismiss('row'); }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); selectAndDismiss('row'); }
                                }}
                            >
                                Row {(annotation.rowIndex ?? 0) + 1}
                            </span>
                            <span className="mito-ai-notes-popover-scope-infix">, </span>
                            <span
                                className="mito-ai-notes-popover-scope-name mito-ai-notes-popover-scope-link"
                                role="button"
                                tabIndex={0}
                                title="Select this column in the sheet"
                                onClick={(e) => { e.stopPropagation(); selectAndDismiss('column'); }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); selectAndDismiss('column'); }
                                }}
                            >
                                {colLabel}
                            </span>
                        </p>
                    )}
                    <p className="mito-ai-notes-popover-lead">{annotation.text}</p>
                </div>
                <div className="mito-ai-notes-popover-actions">
                    <p className="mito-ai-notes-popover-actions-label">Recommended Fixes</p>
                    {suggestedActions.length > 0 && (
                        <div className="mito-ai-notes-popover-action-list">
                            {suggestedActions.map((a) => (
                                <button
                                    key={a.id}
                                    type="button"
                                    className="mito-ai-notes-popover-action-link"
                                    disabled={applyingActionId !== undefined}
                                    onClick={() => void applyAction(a.id)}
                                >
                                    <span className="mito-ai-notes-popover-action-link-text">
                                        {applyingActionId === a.id ? 'Applying…' : a.label}
                                    </span>
                                    <span className="mito-ai-notes-popover-action-link-arrow">
                                        →
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                    {suggestedActions.length === 0 && (
                        <p className="mito-ai-notes-popover-action-empty">
                            No recommended fixes available.
                        </p>
                    )}
                    {actionError !== undefined && (
                        <p className="mito-ai-notes-popover-action-error" role="alert">
                            {actionError}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );

    return host ? ReactDOM.createPortal(popEl, host) : popEl;
};
