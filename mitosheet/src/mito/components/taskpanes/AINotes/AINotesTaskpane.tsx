/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { MitoAPI } from '../../../api/api';
import {
    AINotesAnnotation,
    EditorState,
    GridState,
    SheetData,
    UIState,
} from '../../../types';
import DefaultTaskpane from '../DefaultTaskpane/DefaultTaskpane';
import DefaultTaskpaneBody from '../DefaultTaskpane/DefaultTaskpaneBody';
import DefaultTaskpaneHeader from '../DefaultTaskpane/DefaultTaskpaneHeader';
import TextButton from '../../elements/TextButton';
import LoadingCircle from '../../icons/LoadingCircle';
import CautionIcon from '../../icons/CautionIcon';
import Col from '../../layout/Col';
import Row from '../../layout/Row';
import { classNames } from '../../../utils/classNames';
import {
    AINotesApiPayload,
    annotationsFromApiPayload,
    getSuggestedAINotesActions,
    selectAINotesTargetInGrid,
    useAINotesApply,
} from '../../../utils/aiNotesUtils';
import { getDisplayColumnHeader } from '../../../utils/columnHeaders';
import { TaskpaneType } from '../taskpanes';

import '../../../../../css/taskpanes/AINotes/AINotes.css';

interface AINotesTaskpaneProps {
    mitoAPI: MitoAPI;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    setGridState: React.Dispatch<React.SetStateAction<GridState>>;
    setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>;
    uiState: UIState;
    sheetDataArray: SheetData[];
    selectedSheetIndex: number;
    focusedAnnotationId?: string;
    skipFetch?: boolean;
}

const AINotesTaskpane = (props: AINotesTaskpaneProps): JSX.Element => {
    const [state, setState] = useState<
        | { type: 'loading' }
        | { type: 'error'; message: string }
        | { type: 'ready' }
    >({ type: 'loading' });

    const { applyingActionId, actionError: applyError, apply, clearState: clearApplyState } = useAINotesApply(props.mitoAPI);
    const [applyingAnnotationId, setApplyingAnnotationId] = useState<string | undefined>(undefined);
    const [errorAnnotationId, setErrorAnnotationId] = useState<string | undefined>(undefined);

    const fetchAnnotations = useCallback(async (focusPreference?: string): Promise<void> => {
        setState({ type: 'loading' });
        const res = await props.mitoAPI.getAINotesAnnotations(props.selectedSheetIndex);
        if ('error' in res) {
            setState({ type: 'error', message: res.error });
            return;
        }
        const data = res.result as AINotesApiPayload | { error?: string };
        if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
            setState({ type: 'error', message: data.error });
            return;
        }
        const built = annotationsFromApiPayload(
            props.selectedSheetIndex,
            data as AINotesApiPayload
        );
        props.setUIState((prev) => ({
            ...prev,
            aiNotesAnnotations: built,
            aiNotesFocusedId:
                focusPreference ?? built[0]?.id ?? prev.aiNotesFocusedId,
        }));
        setState({ type: 'ready' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.mitoAPI, props.selectedSheetIndex]);

    useEffect(() => {
        if (props.skipFetch && props.uiState.aiNotesAnnotations?.length) {
            setState({ type: 'ready' });
            props.setUIState((prev) => ({
                ...prev,
                aiNotesFocusedId: props.focusedAnnotationId ?? prev.aiNotesFocusedId,
            }));
            return;
        }
        void fetchAnnotations(props.focusedAnnotationId);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when sheet changes
    }, [props.selectedSheetIndex]);

    const annotations = props.uiState.aiNotesAnnotations;
    const focusedId = props.uiState.aiNotesFocusedId;

    // Clear stale error when the user moves focus to a different annotation
    useEffect(() => {
        if (errorAnnotationId !== undefined && errorAnnotationId !== focusedId) {
            clearApplyState();
            setErrorAnnotationId(undefined);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [focusedId]);

    const columnDisplayName = (a: AINotesAnnotation): string => {
        const sheet = props.sheetDataArray[a.sheetIndex];
        return sheet?.data[a.columnIndex]?.columnHeader !== undefined
            ? getDisplayColumnHeader(sheet.data[a.columnIndex].columnHeader)
            : `Col ${a.columnIndex + 1}`;
    };

    const alertTargetLabel = (a: AINotesAnnotation): string => {
        const columnName = columnDisplayName(a);
        if (a.kind === 'cell' && a.rowIndex !== undefined) {
            return `${columnName} [${a.rowIndex + 1}]`;
        }
        return columnName;
    };

    const gridSelectDeps = {
        setUIState: props.setUIState,
        setGridState: props.setGridState,
        setEditorState: props.setEditorState,
    };

    const focusAnnotation = (a: AINotesAnnotation): void => {
        props.setUIState((prev) => ({
            ...prev,
            selectedSheetIndex: a.sheetIndex,
            aiNotesFocusedId: a.id,
            currOpenTaskpane: {
                type: TaskpaneType.AINOTES,
            },
        }));
    };

    const handleAnnotationSummaryClick = (a: AINotesAnnotation): void => {
        focusAnnotation(a);
        selectAINotesTargetInGrid(a, a.kind === 'cell' ? 'cell' : 'column', gridSelectDeps);
    };

    const handleApplyAction = async (annotation: AINotesAnnotation, actionId: string): Promise<void> => {
        setApplyingAnnotationId(annotation.id);
        setErrorAnnotationId(undefined);
        const result = await apply(annotation, actionId, () => {
            setApplyingAnnotationId(undefined);
            props.setUIState((prev) => {
                const remaining = (prev.aiNotesAnnotations ?? []).filter(
                    (x) => x.id !== annotation.id
                );
                return {
                    ...prev,
                    aiNotesAnnotations: remaining,
                    aiNotesFocusedId:
                        prev.aiNotesFocusedId === annotation.id
                            ? remaining[0]?.id
                            : prev.aiNotesFocusedId,
                };
            });
        });
        if (!result.ok) {
            setErrorAnnotationId(annotation.id);
        }
        setApplyingAnnotationId(undefined);
    };

    return (
        <DefaultTaskpane setUIState={props.setUIState} mitoAPI={props.mitoAPI}>
            <DefaultTaskpaneHeader
                header="AI Notes"
                setUIState={props.setUIState}
            />
            <DefaultTaskpaneBody>
                <Row justify="start" align="top">
                    <Col className="ai-notes-taskpane-col" flex="1">
                        {state.type === 'loading' && (
                            <Row justify="start" align="center" className="mt-25px ai-notes-loading-status">
                                <LoadingCircle />
                                <span className="ml-10px">Fetching AI Alerts...</span>
                            </Row>
                        )}
                        {state.type === 'error' && (
                            <Row className="mt-25px">
                                <CautionIcon />
                                <p className="text-body-1 text-color-error">{state.message}</p>
                            </Row>
                        )}
                        {state.type === 'ready' && annotations && annotations.length === 0 && (
                            <p className="text-body-1 mt-25px">No issues reported for this sheet.</p>
                        )}
                        {state.type === 'ready' && annotations && annotations.length > 0 && (
                            <ul className="ai-notes-list mt-15px">
                                {annotations.map((a) => {
                                    const suggested = getSuggestedAINotesActions(a, props.sheetDataArray[a.sheetIndex]);
                                    const isApplying = applyingAnnotationId === a.id;
                                    const applyErr = errorAnnotationId === a.id ? applyError : undefined;
                                    return (
                                        <li
                                            key={a.id}
                                            className={classNames('ai-notes-item-wrap', {
                                                'ai-notes-item-wrap-focused': a.id === focusedId,
                                            })}
                                        >
                                            <button
                                                type="button"
                                                className="ai-notes-item"
                                                onClick={() => {
                                                    handleAnnotationSummaryClick(a);
                                                }}
                                            >
                                                <div className="ai-notes-item-column">
                                                    <span
                                                        className={classNames('ai-notes-item-kind-badge', {
                                                            'ai-notes-item-kind-badge-column': a.kind === 'column',
                                                            'ai-notes-item-kind-badge-cell': a.kind === 'cell',
                                                        })}
                                                    >
                                                        {a.kind}
                                                    </span>
                                                    <span>{alertTargetLabel(a)}</span>
                                                </div>
                                                <div className="ai-notes-item-description">{a.text}</div>
                                            </button>
                                            <div className="ai-notes-item-actions">
                                                <p className="ai-notes-item-actions-label">
                                                    Recommended Fixes
                                                </p>
                                                {suggested.length > 0 && (
                                                    <div className="ai-notes-item-action-list">
                                                        {suggested.map((s) => (
                                                            <button
                                                                key={s.id}
                                                                type="button"
                                                                className="ai-notes-item-action-link"
                                                                disabled={applyingAnnotationId !== undefined}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    void handleApplyAction(a, s.id);
                                                                }}
                                                            >
                                                                <span className="ai-notes-item-action-link-text">
                                                                    {isApplying && applyingActionId === s.id
                                                                        ? 'Applying…'
                                                                        : s.label}
                                                                </span>
                                                                <span className="ai-notes-item-action-link-arrow">
                                                                    →
                                                                </span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                                {suggested.length === 0 && (
                                                    <p className="ai-notes-item-action-empty">
                                                        No recommended fixes available.
                                                    </p>
                                                )}
                                                {applyErr !== undefined && (
                                                    <p
                                                        className="ai-notes-item-action-error text-color-error"
                                                        role="alert"
                                                    >
                                                        {applyErr}
                                                    </p>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                        {state.type !== 'loading' && (
                            <Row justify="center" className="mt-25px">
                                <TextButton
                                    variant="dark"
                                    onClick={() => {
                                        void fetchAnnotations(focusedId);
                                    }}
                                >
                                    Refresh notes
                                </TextButton>
                            </Row>
                        )}
                    </Col>
                </Row>
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    );
};

export default AINotesTaskpane;
