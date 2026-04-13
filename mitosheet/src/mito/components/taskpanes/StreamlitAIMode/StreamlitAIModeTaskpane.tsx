/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from 'react';
import { MitoAPI } from '../../../api/api';
import {
    EditorState,
    GridState,
    SheetData,
    StreamlitAIModeAnnotation,
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
    annotationsFromApiPayload,
    applyStreamlitAIModeSuggestedFix,
    getSuggestedStreamlitAIModeActions,
    selectStreamlitAiTargetInGrid,
    StreamlitAIModeApiPayload,
} from '../../../utils/streamlitAIModeUtils';
import { getDisplayColumnHeader } from '../../../utils/columnHeaders';
import { TaskpaneType } from '../taskpanes';

import '../../../../../css/taskpanes/StreamlitAIMode/StreamlitAIMode.css';

interface StreamlitAIModeTaskpaneProps {
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

const StreamlitAIModeTaskpane = (props: StreamlitAIModeTaskpaneProps): JSX.Element => {
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
        const res = await props.mitoAPI.getStreamlitAIModeAnnotations(props.selectedSheetIndex);
        if ('error' in res) {
            setState({ type: 'error', message: res.error });
            return;
        }
        const data = res.result as StreamlitAIModeApiPayload | { error?: string };
        if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
            setState({ type: 'error', message: data.error });
            return;
        }
        const built = annotationsFromApiPayload(
            props.selectedSheetIndex,
            data as StreamlitAIModeApiPayload
        );
        props.setUIState((prev) => ({
            ...prev,
            streamlitAIModeAnnotations: built,
            streamlitAIModeFocusedId:
                focusPreference ?? built[0]?.id ?? prev.streamlitAIModeFocusedId,
        }));
        setState({ type: 'ready' });
    };

    useEffect(() => {
        if (props.skipFetch && props.uiState.streamlitAIModeAnnotations?.length) {
            setState({ type: 'ready' });
            props.setUIState((prev) => ({
                ...prev,
                streamlitAIModeFocusedId:
                    props.focusedAnnotationId ?? prev.streamlitAIModeFocusedId,
            }));
            return;
        }
        void fetchAnnotations(props.focusedAnnotationId);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when sheet changes
    }, [props.selectedSheetIndex]);

    const annotations = props.uiState.streamlitAIModeAnnotations;
    const focusedId = props.uiState.streamlitAIModeFocusedId;

    const columnDisplayName = (a: StreamlitAIModeAnnotation): string => {
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

    const renderAnnotationMeta = (a: StreamlitAIModeAnnotation): JSX.Element => {
        const col = columnDisplayName(a);
        const columnLink = (
            <span
                className="streamlit-ai-mode-meta-column-link"
                role="button"
                tabIndex={0}
                title="Select this column in the sheet"
                onClick={(e) => {
                    e.stopPropagation();
                    selectStreamlitAiTargetInGrid(a, 'column', gridSelectDeps);
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        selectStreamlitAiTargetInGrid(a, 'column', gridSelectDeps);
                    }
                }}
            >
                {col}
            </span>
        );
        if (a.kind === 'column') {
            return (
                <span className="streamlit-ai-mode-meta">
                    <span className="streamlit-ai-mode-meta-prefix">Column:</span>
                    {columnLink}
                </span>
            );
        }
        const rowLink = (
            <span
                className="streamlit-ai-mode-meta-row-link"
                role="button"
                tabIndex={0}
                title="Select this row in the sheet"
                onClick={(e) => {
                    e.stopPropagation();
                    selectStreamlitAiTargetInGrid(a, 'row', gridSelectDeps);
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        selectStreamlitAiTargetInGrid(a, 'row', gridSelectDeps);
                    }
                }}
            >
                Row {(a.rowIndex ?? 0) + 1}
            </span>
        );
        return (
            <span className="streamlit-ai-mode-meta">
                {rowLink}
                <span className="streamlit-ai-mode-meta-infix">, </span>
                {columnLink}
            </span>
        );
    };

    const handleApplySuggestedFix = async (
        annotation: StreamlitAIModeAnnotation,
        actionId: string
    ): Promise<void> => {
        setApplyState({ status: 'applying', annotationId: annotation.id, actionId });
        const result = await applyStreamlitAIModeSuggestedFix(
            props.mitoAPI,
            annotation,
            actionId
        );
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
            const remaining = (prev.streamlitAIModeAnnotations ?? []).filter(
                (x) => x.id !== annotation.id
            );
            return {
                ...prev,
                streamlitAIModeAnnotations: remaining,
                streamlitAIModeFocusedId:
                    prev.streamlitAIModeFocusedId === annotation.id
                        ? remaining[0]?.id
                        : prev.streamlitAIModeFocusedId,
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
                    <Col className="streamlit-ai-mode-taskpane-col" flex="1">
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
                            <ul className="streamlit-ai-mode-list mt-15px">
                                {annotations.map((a) => {
                                    const suggested = getSuggestedStreamlitAIModeActions(a);
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
                                            className={classNames('streamlit-ai-mode-item-wrap', {
                                                'streamlit-ai-mode-item-wrap-has-actions':
                                                    suggested.length > 0,
                                            })}
                                        >
                                            <button
                                                type="button"
                                                className={classNames('streamlit-ai-mode-item', {
                                                    'streamlit-ai-mode-item-focused': a.id === focusedId,
                                                })}
                                                onClick={() => {
                                                    props.setUIState((prev) => ({
                                                        ...prev,
                                                        selectedSheetIndex: a.sheetIndex,
                                                        streamlitAIModeFocusedId: a.id,
                                                        currOpenTaskpane: {
                                                            type: TaskpaneType.STREAMLIT_AI_MODE,
                                                        },
                                                    }));
                                                }}
                                            >
                                                {renderAnnotationMeta(a)}
                                                {a.text}
                                            </button>
                                            {suggested.length > 0 && (
                                                <div className="streamlit-ai-mode-item-actions">
                                                    <p className="streamlit-ai-mode-item-actions-label">
                                                        Suggested fix
                                                    </p>
                                                    <div className="streamlit-ai-mode-item-action-row">
                                                        {suggested.map((s) => (
                                                            <button
                                                                key={s.id}
                                                                type="button"
                                                                className="streamlit-ai-mode-item-action-btn"
                                                                disabled={
                                                                    applyState.status === 'applying'
                                                                }
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    void handleApplySuggestedFix(a, s.id);
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
                                                            className="streamlit-ai-mode-item-action-error text-color-error"
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

export default StreamlitAIModeTaskpane;
