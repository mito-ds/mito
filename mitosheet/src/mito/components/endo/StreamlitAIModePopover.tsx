/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import '../../../../css/endo/StreamlitAIModePopover.css';
import { MitoAPI } from '../../api/api';
import { EditorState, GridState, SheetData, StreamlitAIModeAnnotation, UIState } from '../../types';
import { getDisplayColumnHeader } from '../../utils/columnHeaders';
import {
    applyStreamlitAIModeSuggestedFix,
    getSuggestedStreamlitAIModeActions,
    selectStreamlitAiTargetInGrid,
} from '../../utils/streamlitAIModeUtils';

export const StreamlitAIModePopover = (props: {
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    setGridState: React.Dispatch<React.SetStateAction<GridState>>;
    setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>;
    mitoContainerRef: React.RefObject<HTMLDivElement>;
    sheetData: SheetData | undefined;
    sheetIndex: number;
    mitoAPI: MitoAPI;
}): JSX.Element | null => {
    const pop = props.uiState.streamlitAIModePopover;
    const annotations = props.uiState.streamlitAIModeAnnotations;
    const [actionError, setActionError] = useState<string | undefined>(undefined);
    const [applyingActionId, setApplyingActionId] = useState<string | undefined>(undefined);

    const annotation: StreamlitAIModeAnnotation | undefined = useMemo(() => {
        if (!pop || !annotations) {
            return undefined;
        }
        return annotations.find((a) => a.id === pop.annotationId);
    }, [pop, annotations]);

    const suggestedActions = useMemo(() => {
        if (annotation === undefined) {
            return [];
        }
        return getSuggestedStreamlitAIModeActions(annotation);
    }, [annotation]);

    useEffect(() => {
        setActionError(undefined);
        setApplyingActionId(undefined);
    }, [pop?.annotationId]);

    if (!pop || !annotation) {
        return null;
    }

    const colLabel =
        props.sheetData?.data[annotation.columnIndex]?.columnHeader !== undefined
            ? getDisplayColumnHeader(props.sheetData.data[annotation.columnIndex].columnHeader)
            : `Column ${annotation.columnIndex + 1}`;

    const gridSelectDeps = {
        setUIState: props.setUIState,
        setGridState: props.setGridState,
        setEditorState: props.setEditorState,
    };

    const selectInGridAndDismissPopover = (target: 'column' | 'row'): void => {
        selectStreamlitAiTargetInGrid(annotation, target, gridSelectDeps, {
            dismissAiPopover: true,
        });
    };

    const applySuggestedAction = async (actionId: string): Promise<void> => {
        setActionError(undefined);
        setApplyingActionId(actionId);
        const result = await applyStreamlitAIModeSuggestedFix(
            props.mitoAPI,
            annotation,
            actionId
        );
        setApplyingActionId(undefined);
        if (!result.ok) {
            setActionError(result.error);
            return;
        }
        props.setUIState((prev) => ({
            ...prev,
            streamlitAIModePopover: undefined,
            streamlitAIModeAnnotations: prev.streamlitAIModeAnnotations?.filter((a) => a.id !== annotation.id),
        }));
    };

    const host = props.mitoContainerRef.current;
    const cr = host?.getBoundingClientRect();
    const sev = annotation.severity ?? 'info';
    const title = annotation.kind === 'column' ? 'Column note' : 'Cell note';

    const fallbackLeft = Math.min(
        pop.x + 10,
        (typeof window !== 'undefined' ? window.innerWidth : 800) - 400
    );
    const fallbackTop = Math.min(
        pop.y + 10,
        (typeof window !== 'undefined' ? window.innerHeight : 600) - 200
    );

    const popEl = (
        <div
            className={`mito-ai-mode-popover mito-ai-mode-popover-severity-${sev}`}
            style={{
                position: host ? 'absolute' : 'fixed',
                left:
                    host && cr
                        ? pop.x - cr.left + host.scrollLeft + 10
                        : fallbackLeft,
                top:
                    host && cr
                        ? pop.y - cr.top + host.scrollTop + 10
                        : fallbackTop,
            }}
            role="dialog"
            aria-label={title}
            onMouseDown={(e) => {
                e.stopPropagation();
            }}
        >
            <button
                type="button"
                className="mito-ai-mode-popover-close"
                aria-label="Close"
                onClick={() => {
                    props.setUIState((prev) => ({
                        ...prev,
                        streamlitAIModePopover: undefined,
                    }));
                }}
            >
                ×
            </button>
            <div className="mito-ai-mode-popover-body-wrap">
                {pop.openedFrom === 'column_header' && (
                    <p className="mito-ai-mode-popover-scope">
                        <span className="mito-ai-mode-popover-scope-label">Column </span>
                        <span
                            className="mito-ai-mode-popover-scope-name mito-ai-mode-popover-scope-link"
                            role="button"
                            tabIndex={0}
                            title="Select this column in the sheet"
                            onClick={(e) => {
                                e.stopPropagation();
                                selectInGridAndDismissPopover('column');
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    selectInGridAndDismissPopover('column');
                                }
                            }}
                        >
                            {colLabel}
                        </span>
                    </p>
                )}
                {pop.openedFrom === 'cell' && (
                    <p className="mito-ai-mode-popover-scope">
                        <span
                            className="mito-ai-mode-popover-scope-name mito-ai-mode-popover-scope-link"
                            role="button"
                            tabIndex={0}
                            title="Select this row in the sheet"
                            onClick={(e) => {
                                e.stopPropagation();
                                selectInGridAndDismissPopover('row');
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    selectInGridAndDismissPopover('row');
                                }
                            }}
                        >
                            Row {(annotation.rowIndex ?? 0) + 1}
                        </span>
                        <span className="mito-ai-mode-popover-scope-infix">, </span>
                        <span
                            className="mito-ai-mode-popover-scope-name mito-ai-mode-popover-scope-link"
                            role="button"
                            tabIndex={0}
                            title="Select this column in the sheet"
                            onClick={(e) => {
                                e.stopPropagation();
                                selectInGridAndDismissPopover('column');
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    selectInGridAndDismissPopover('column');
                                }
                            }}
                        >
                            {colLabel}
                        </span>
                    </p>
                )}
                <p className="mito-ai-mode-popover-lead">{annotation.text}</p>
                {suggestedActions.length > 0 && (
                    <div className="mito-ai-mode-popover-actions">
                        <p className="mito-ai-mode-popover-actions-label">Suggested fix</p>
                        <div className="mito-ai-mode-popover-action-row">
                            {suggestedActions.map((a) => (
                                <button
                                    key={a.id}
                                    type="button"
                                    className="mito-ai-mode-popover-action-btn"
                                    disabled={applyingActionId !== undefined}
                                    onClick={() => {
                                        void applySuggestedAction(a.id);
                                    }}
                                >
                                    {applyingActionId === a.id ? 'Applying…' : a.label}
                                </button>
                            ))}
                        </div>
                        {actionError !== undefined && (
                            <p className="mito-ai-mode-popover-action-error" role="alert">
                                {actionError}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    if (host) {
        return ReactDOM.createPortal(popEl, host);
    }
    return popEl;
};
