/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from 'react';
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
    applyAINotesAction,
    getSuggestedAINotesActions,
    selectAINotesTargetInGrid,
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

    const [applyState, setApplyState] = useState<
        | { status: 'idle' }
        | { status: 'applying'; annotationId: string; actionId: string }
        | { status: 'error'; annotationId: string; message: string }
    >({ status: 'idle' });

    const fetchAnnotations = async (focusPreference?: string): Promise<void> => {
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
    };

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
        if (applyState.status === 'error' && applyState.annotationId !== focusedId) {
            setApplyState({ status: 'idle' });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [focusedId]);

    const columnDisplayName = (a: AINotesAnnotation): string => {
        const sheet = props.sheetDataArray[a.sheetIndex];
        return sheet?.data[a.columnIndex]?.columnHeader !== undefined
            ? getDisplayColumnHeader(sheet.data[a.columnIndex].columnHeader)
            : `Col ${a.columnIndex + 1}`;
    };

    const gridSelectDeps = {
        setUIState: props.setUIState,
        setGridState: props.setGridState,
        setEditorState: props.setEditorState,
    };

    const renderAnnotationMeta = (a: AINotesAnnotation): JSX.Element => {
        const col = columnDisplayName(a);
        const columnLink = (
            <span
                className="ai-notes-meta-column-link"
                role="button"
                tabIndex={0}
                title="Select this column in the sheet"
                onClick={(e) => {
                    e.stopPropagation();
                    selectAINotesTargetInGrid(a, 'column', gridSelectDeps);
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        selectAINotesTargetInGrid(a, 'column', gridSelectDeps);
                    }
                }}
            >
                {col}
            </span>
        );
        if (a.kind === 'column') {
            return (
                <span className="ai-notes-meta">
                    <span className="ai-notes-meta-prefix">Column:</span>
                    {columnLink}
                </span>
            );
        }
        const rowLink = (
            <span
                className="ai-notes-meta-row-link"
                role="button"
                tabIndex={0}
                title="Select this row in the sheet"
                onClick={(e) => {
                    e.stopPropagation();
                    selectAINotesTargetInGrid(a, 'row', gridSelectDeps);
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        selectAINotesTargetInGrid(a, 'row', gridSelectDeps);
                    }
                }}
            >
                Row {(a.rowIndex ?? 0) + 1}
            </span>
        );
        return (
            <span className="ai-notes-meta">
                {rowLink}
                <span className="ai-notes-meta-infix">, </span>
                {columnLink}
            </span>
        );
    };

    const handleApplyAction = async (
        annotation: AINotesAnnotation,
        actionId: string
    ): Promise<void> => {
        setApplyState({ status: 'applying', annotationId: annotation.id, actionId });
        const result = await applyAINotesAction(props.mitoAPI, annotation, actionId);
        if (!result.ok) {
            setApplyState({
                status: 'error',
                annotationId: annotation.id,
                message: result.error,
            });
            return;
        }
        setApplyState({ status: 'idle' });
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
    };

    return (
        <DefaultTaskpane setUIState={props.setUIState} mitoAPI={props.mitoAPI}>
            <DefaultTaskpaneHeader
                header="AI notes"
                setUIState={props.setUIState}
            />
            <DefaultTaskpaneBody>
                <Row justify="center" align="center">
                    <Col className="ai-notes-taskpane-col" flex="1">
                        {state.type === 'loading' && (
                            <Row justify="center" className="mt-25px">
                                <LoadingCircle />
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
                                    const isApplying =
                                        applyState.status === 'applying' &&
                                        applyState.annotationId === a.id;
                                    const applyErr =
                                        applyState.status === 'error' &&
                                        applyState.annotationId === a.id
                                            ? applyState.message
                                            : undefined;
                                    return (
                                        <li
                                            key={a.id}
                                            className={classNames('ai-notes-item-wrap', {
                                                'ai-notes-item-wrap-has-actions':
                                                    suggested.length > 0,
                                            })}
                                        >
                                            <button
                                                type="button"
                                                className={classNames('ai-notes-item', {
                                                    'ai-notes-item-focused': a.id === focusedId,
                                                })}
                                                onClick={() => {
                                                    props.setUIState((prev) => ({
                                                        ...prev,
                                                        selectedSheetIndex: a.sheetIndex,
                                                        aiNotesFocusedId: a.id,
                                                        currOpenTaskpane: {
                                                            type: TaskpaneType.AINOTES,
                                                        },
                                                    }));
                                                }}
                                            >
                                                {renderAnnotationMeta(a)}
                                                {a.text}
                                            </button>
                                            {suggested.length > 0 && (
                                                <div className="ai-notes-item-actions">
                                                    <p className="ai-notes-item-actions-label">
                                                        Suggested fix
                                                    </p>
                                                    <div className="ai-notes-item-action-row">
                                                        {suggested.map((s) => (
                                                            <button
                                                                key={s.id}
                                                                type="button"
                                                                className="ai-notes-item-action-btn"
                                                                disabled={
                                                                    applyState.status === 'applying'
                                                                }
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    void handleApplyAction(a, s.id);
                                                                }}
                                                            >
                                                                {isApplying &&
                                                                applyState.status === 'applying' &&
                                                                applyState.actionId === s.id
                                                                    ? 'Applying…'
                                                                    : s.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    {applyErr !== undefined && (
                                                        <p
                                                            className="ai-notes-item-action-error text-color-error"
                                                            role="alert"
                                                        >
                                                            {applyErr}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                        <Row justify="center" className="mt-25px">
                            <TextButton
                                variant="dark"
                                onClick={() => {
                                    void fetchAnnotations(focusedId);
                                }}
                                disabled={state.type === 'loading'}
                            >
                                Refresh notes
                            </TextButton>
                        </Row>
                    </Col>
                </Row>
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    );
};

export default AINotesTaskpane;
