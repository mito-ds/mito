/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito

import React, { useEffect, useState } from 'react';
import { MitoAPI } from '../../../api/api';
import { ColumnID, EditorState, SheetData, UIState, UserProfile } from '../../../types';
import Row from '../../layout/Row';
import DefaultTaskpane from '../DefaultTaskpane/DefaultTaskpane';
import DefaultTaskpaneBody from '../DefaultTaskpane/DefaultTaskpaneBody';
import DefaultTaskpaneHeader from '../DefaultTaskpane/DefaultTaskpaneHeader';
import { openGraphSidebar } from '../Graph/graphUtils';
import { GraphType } from '../Graph/GraphSetupTab';
import AIPrivacyPolicy from '../AITransformation/AIPrivacyPolicy';
import LoadingCircle from '../../icons/LoadingCircle';
import SuggestedChartPreview from './SuggestedChartPreview';
import '../../../../../css/taskpanes/SuggestedVisualizations/SuggestedVisualizations.css';

interface SuggestedVisualizationsTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>;
    sheetDataArray: SheetData[];
}

type SuggestionRow = {
    title: string;
    description: string;
    graph_type: string;
    column_indices: number[];
};

type LoadState =
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'ready'; suggestions: SuggestionRow[] };

function mapIndicesToColumnIds(sheetData: SheetData, indices: number[]): ColumnID[] | undefined {
    const ids: ColumnID[] = [];
    for (const i of indices) {
        if (i < 0 || i >= sheetData.data.length) {
            return undefined;
        }
        ids.push(sheetData.data[i].columnID);
    }
    return ids;
}

function parseGraphType(s: string): GraphType | undefined {
    const v = Object.values(GraphType).find(g => g === s);
    return v;
}

const SuggestedVisualizationsTaskpane = (props: SuggestedVisualizationsTaskpaneProps): JSX.Element => {
    const aiPrivacyPolicyAccepted = props.userProfile.aiPrivacyPolicy;

    const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });

    const sheetIndex = props.uiState.selectedSheetIndex;
    const sheetData = props.sheetDataArray[sheetIndex];

    useEffect(() => {
        let cancelled = false;

        const run = async (): Promise<void> => {
            setLoadState({ status: 'loading' });
            const res = await props.mitoAPI.getChartSuggestions(sheetIndex);
            if (cancelled) {
                return;
            }
            if (res === undefined || 'error' in res) {
                setLoadState({
                    status: 'error',
                    message: res !== undefined && 'error' in res ? res.error : 'Could not load chart suggestions.',
                });
                return;
            }
            const payload = res.result;
            if ('error' in payload) {
                setLoadState({ status: 'error', message: payload.error });
                return;
            }
            setLoadState({ status: 'ready', suggestions: payload.suggestions });
        };

        void run();
        return () => {
            cancelled = true;
        };
    }, [sheetIndex, props.mitoAPI]);

    const onCreateChart = (graphTypeStr: string, columnIndices: number[]): void => {
        if (sheetData === undefined) {
            return;
        }
        const graphType = parseGraphType(graphTypeStr);
        const columnIds = mapIndicesToColumnIds(sheetData, columnIndices);
        if (graphType === undefined || columnIds === undefined) {
            return;
        }
        void openGraphSidebar(
            props.setUIState,
            props.uiState,
            props.setEditorState,
            props.sheetDataArray,
            props.mitoAPI,
            {
                type: 'new_graph',
                graphType,
                selectedColumnIds: columnIds,
            },
        );
    };

    if (!aiPrivacyPolicyAccepted) {
        return <AIPrivacyPolicy mitoAPI={props.mitoAPI} setUIState={props.setUIState} />;
    }

    return (
        <DefaultTaskpane setUIState={props.setUIState} mitoAPI={props.mitoAPI}>
            <DefaultTaskpaneHeader header="Suggest Charts" setUIState={props.setUIState} />
            <DefaultTaskpaneBody userProfile={props.userProfile}>
                <div className="suggested-viz-taskpane-content">
                    {loadState.status === 'loading' && (
                        <Row justify="start" align="center" className="suggested-viz-status">
                            <LoadingCircle />
                            <span className="ml-10px">Generating suggestions…</span>
                        </Row>
                    )}
                    {loadState.status === 'error' && (
                        <p className="suggested-viz-error">{loadState.message}</p>
                    )}
                    {loadState.status === 'ready' &&
                        loadState.suggestions.length === 0 &&
                        sheetData !== undefined && (
                            <p className="suggested-viz-status">No chart suggestions for this sheet.</p>
                        )}
                    {loadState.status === 'ready' && loadState.suggestions.length > 0 && (
                        <div className="suggested-viz-suggestions">
                            {loadState.suggestions.map((s, idx) => (
                                <button
                                    key={`${s.title}-${idx}`}
                                    type="button"
                                    className="suggested-viz-card"
                                    onClick={() => {
                                        onCreateChart(s.graph_type, s.column_indices);
                                    }}
                                >
                                    <div className="suggested-viz-card-inner">
                                        <div className="suggested-viz-preview-layer" aria-hidden>
                                            <SuggestedChartPreview graphType={s.graph_type} />
                                        </div>
                                        <div className="suggested-viz-card-text">
                                            <div className="suggested-viz-card-title">{s.title}</div>
                                            <div className="suggested-viz-card-description">{s.description}</div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    );
};

export default SuggestedVisualizationsTaskpane;
