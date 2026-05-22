/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { getRandomId, MitoAPI } from '../../../api/api';
import { GridState, SheetData, UIState, UserProfile } from '../../../types';
import Row from '../../layout/Row';
import AIPrivacyPolicy from '../AITransformation/AIPrivacyPolicy';
import DefaultTaskpane from '../DefaultTaskpane/DefaultTaskpane';
import DefaultTaskpaneBody from '../DefaultTaskpane/DefaultTaskpaneBody';
import DefaultTaskpaneHeader from '../DefaultTaskpane/DefaultTaskpaneHeader';
import '../../../../../css/taskpanes/AIAlerts/AIAlerts.css';

interface AIAlertsTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    sheetDataArray: SheetData[];
    setGridState: React.Dispatch<React.SetStateAction<GridState>>;
}

type AlertFix = {
    fix_id: string;
    title: string;
    description: string;
    code: string;
};

type AlertRow = {
    issue_type: string;
    severity: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    column_indices: number[];
    fixes?: AlertFix[];
};

type LoadState =
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | {
          status: 'ready';
          alerts: AlertRow[];
          profileMetadata?: {
              rows_profiled: number;
              total_rows: number;
              columns_profiled: number;
              total_columns: number;
          };
      };

// Tracks the per-fix application state so a click shows a spinner / success / error
// without re-fetching the alerts list.
type FixState =
    | { status: 'applying' }
    | { status: 'applied' }
    | { status: 'error'; message: string };

const AIAlertsTaskpane = (props: AIAlertsTaskpaneProps): JSX.Element => {
    const aiPrivacyPolicyAccepted = props.userProfile.aiPrivacyPolicy;
    const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });
    const [loadingColumnIndex, setLoadingColumnIndex] = useState(0);
    const [fixStates, setFixStates] = useState<Record<string, FixState>>({});

    const sheetIndex = props.uiState.selectedSheetIndex;
    const sheetData = props.sheetDataArray[sheetIndex];
    const loadingColumnNames = useMemo(
        () => (sheetData?.data ?? []).map(col => String(col.columnHeader)),
        [sheetData]
    );

    useEffect(() => {
        let cancelled = false;

        const run = async (): Promise<void> => {
            setLoadState({ status: 'loading' });
            setFixStates({});
            const res = await props.mitoAPI.getDataAlerts(sheetIndex);
            if (cancelled) {
                return;
            }
            if (res === undefined || 'error' in res) {
                setLoadState({
                    status: 'error',
                    message: res !== undefined && 'error' in res ? res.error : 'Could not load AI alerts.',
                });
                return;
            }

            const payload = res.result;
            if ('error' in payload) {
                setLoadState({ status: 'error', message: payload.error });
                return;
            }

            setLoadState({
                status: 'ready',
                alerts: payload.alerts,
                profileMetadata: payload.profile_metadata,
            });
        };

        void run();
        return () => {
            cancelled = true;
        };
    }, [sheetIndex, props.mitoAPI]);

    useEffect(() => {
        setLoadingColumnIndex(0);
    }, [sheetIndex]);

    useEffect(() => {
        if (loadState.status !== 'loading' || loadingColumnNames.length === 0) {
            return;
        }

        const interval = setInterval(() => {
            setLoadingColumnIndex(prev => (prev + 1) % loadingColumnNames.length);
        }, 2800);

        return () => {
            clearInterval(interval);
        };
    }, [loadState.status, loadingColumnNames]);

    const columnLabelByIndex = useMemo(() => {
        if (sheetData === undefined) {
            return {};
        }

        const mapping: Record<number, string> = {};
        sheetData.data.forEach((col, idx) => {
            mapping[idx] = String(col.columnHeader);
        });
        return mapping;
    }, [sheetData]);

    const handleAlertClick = (columnIndices: number[]): void => {
        const numColumns = sheetData?.data.length ?? 0;
        const validColumnIndices = columnIndices.filter(idx => idx >= 0 && idx < numColumns);
        if (validColumnIndices.length === 0) {
            return;
        }

        props.setGridState(prev => ({
            ...prev,
            selections: validColumnIndices.map(colIdx => ({
                sheetIndex: sheetIndex,
                startingRowIndex: -1,
                endingRowIndex: -1,
                startingColumnIndex: colIdx,
                endingColumnIndex: colIdx,
            })),
        }));

        props.setUIState(prev => ({
            ...prev,
            pendingColumnScroll: { sheetIndex: sheetIndex, columnIndex: validColumnIndices[0] },
        }));
    };

    const getFixKey = (alertIdx: number, fixId: string): string => `${alertIdx}:${fixId}`;

    const applyFix = async (alertIdx: number, alert: AlertRow, fix: AlertFix): Promise<void> => {
        const key = getFixKey(alertIdx, fix.fix_id);
        setFixStates(prev => ({ ...prev, [key]: { status: 'applying' } }));

        const res = await props.mitoAPI._edit(
            'ai_transformation_edit',
            {
                user_input: `AI Alerts fix: ${fix.title}`,
                prompt_version: 'data-alerts-v2',
                prompt: alert.title,
                completion: fix.code,
                edited_completion: fix.code,
            },
            getRandomId()
        );

        if (res !== undefined && 'error' in res) {
            setFixStates(prev => ({
                ...prev,
                [key]: { status: 'error', message: res.error || 'Could not apply fix.' },
            }));
            return;
        }

        setFixStates(prev => ({ ...prev, [key]: { status: 'applied' } }));
    };

    if (!aiPrivacyPolicyAccepted) {
        return <AIPrivacyPolicy mitoAPI={props.mitoAPI} setUIState={props.setUIState} />;
    }

    return (
        <DefaultTaskpane setUIState={props.setUIState} mitoAPI={props.mitoAPI}>
            <DefaultTaskpaneHeader header='AI Alerts' setUIState={props.setUIState} />
            <DefaultTaskpaneBody userProfile={props.userProfile}>
                <div className='ai-alerts-taskpane-content'>
                    {loadState.status === 'loading' && (
                        <div>
                            <Row justify='start' align='center' className='ai-alerts-status'>
                                <span>Linting data quality issues...</span>
                            </Row>
                            {loadingColumnNames.length > 0 && (
                                <p
                                    key={`loading-col-${loadingColumnIndex}`}
                                    className='ai-alerts-loading-column'
                                >
                                    Examining {loadingColumnNames[loadingColumnIndex]}
                                </p>
                            )}
                        </div>
                    )}
                    {loadState.status === 'error' && (
                        <p className='ai-alerts-error'>{loadState.message}</p>
                    )}
                    {loadState.status === 'ready' && (
                        <>
                            {loadState.profileMetadata !== undefined && (
                                <p className='ai-alerts-metadata'>
                                    Profiled {loadState.profileMetadata.rows_profiled.toLocaleString()} of {loadState.profileMetadata.total_rows.toLocaleString()} rows
                                    across {loadState.profileMetadata.columns_profiled} of {loadState.profileMetadata.total_columns} columns.
                                </p>
                            )}
                            {loadState.alerts.length === 0 ? (
                                <p className='ai-alerts-status'>No high-signal issues detected for this sheet.</p>
                            ) : (
                                <div className='ai-alerts-list'>
                                    {loadState.alerts.map((alert, idx) => (
                                        <div
                                            key={`${alert.title}-${idx}`}
                                            className='ai-alert-card'
                                            role='button'
                                            tabIndex={0}
                                            onClick={() => handleAlertClick(alert.column_indices)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    handleAlertClick(alert.column_indices);
                                                }
                                            }}
                                        >
                                            <div className='ai-alert-card-header'>
                                                <span className={`ai-alert-severity ai-alert-severity-${alert.severity}`}>
                                                    {alert.severity.toUpperCase()}
                                                </span>
                                                <span className='ai-alert-issue-type'>{alert.issue_type}</span>
                                            </div>
                                            <div className='ai-alert-title'>{alert.title}</div>
                                            <div className='ai-alert-description'>{alert.description}</div>
                                            <div className='ai-alert-columns'>
                                                Columns:{' '}
                                                {alert.column_indices
                                                    .map(colIdx => columnLabelByIndex[colIdx] ?? `Column ${colIdx}`)
                                                    .join(', ')}
                                            </div>
                                            {alert.fixes !== undefined && alert.fixes.length > 0 && (
                                                <div className='ai-alert-fixes'>
                                                    <div className='ai-alert-fixes-label'>Suggested fixes</div>
                                                    {alert.fixes.map(fix => {
                                                        const key = getFixKey(idx, fix.fix_id);
                                                        const state = fixStates[key];
                                                        const isApplying = state?.status === 'applying';
                                                        const isApplied = state?.status === 'applied';
                                                        const isError = state?.status === 'error';
                                                        return (
                                                            <div
                                                                key={`${fix.fix_id}`}
                                                                className='ai-alert-fix'
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <div className='ai-alert-fix-text'>
                                                                    <div className='ai-alert-fix-title'>{fix.title}</div>
                                                                    <div className='ai-alert-fix-description'>{fix.description}</div>
                                                                    {isError && (
                                                                        <div className='ai-alert-fix-error'>{state.message}</div>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    type='button'
                                                                    className={
                                                                        'ai-alert-fix-button' +
                                                                        (isApplied ? ' ai-alert-fix-button-applied' : '')
                                                                    }
                                                                    disabled={isApplying || isApplied}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        void applyFix(idx, alert, fix);
                                                                    }}
                                                                >
                                                                    {isApplied
                                                                        ? 'Applied'
                                                                        : isApplying
                                                                            ? 'Applying…'
                                                                            : isError
                                                                                ? 'Retry'
                                                                                : 'Apply'}
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    );
};

export default AIAlertsTaskpane;
