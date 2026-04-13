/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { Mito } from '../mito';
import { MitoResponse, SendFunctionReturnType } from '../mito';
import { getAnalysisDataFromString, getSheetDataArrayFromString, getUserProfileFromString } from '../jupyter/jupyterUtils';
import { AnalysisData, SheetData, UserProfile } from '../mito/types';

interface MitoVSCodeWrapperProps {
    port: number;
    sheetDataArray: SheetData[];
    analysisData: AnalysisData;
    userProfile: UserProfile;
}

const MitoVSCodeWrapper = (props: MitoVSCodeWrapperProps): JSX.Element => {
    const { port, sheetDataArray, analysisData, userProfile } = props;

    const getSendFunction = async () => {
        // Server binds to 127.0.0.1 only (see mitosheet/vscode/v1/spreadsheet.py). Using `localhost`
        // can resolve to ::1 (IPv6) first and fail with "TypeError: Failed to fetch" on some systems.
        const backendBase = `http://127.0.0.1:${port}`;
        const send = async <ResultType,>(msg: Record<string, unknown>): Promise<SendFunctionReturnType<ResultType>> => {
            try {
                const response = await fetch(`${backendBase}/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(msg),
                });

                if (!response.ok) {
                    return {
                        error: `HTTP error ${response.status}`,
                        errorShort: `HTTP error`,
                        showErrorModal: false,
                    };
                }

                const mitoResponse: MitoResponse = await response.json();

                if (mitoResponse['event'] === 'error') {
                    return {
                        error: mitoResponse.error,
                        errorShort: mitoResponse.errorShort,
                        showErrorModal: mitoResponse.showErrorModal,
                        traceback: mitoResponse.traceback,
                    };
                }

                const sharedVariables = mitoResponse.shared_variables;

                return {
                    sheetDataArray: sharedVariables ? getSheetDataArrayFromString(sharedVariables.sheet_data_json) : undefined,
                    analysisData: sharedVariables ? getAnalysisDataFromString(sharedVariables.analysis_data_json) : undefined,
                    userProfile: sharedVariables ? getUserProfileFromString(sharedVariables.user_profile_json) : undefined,
                    result: mitoResponse['data'] as ResultType,
                };
            } catch (e) {
                return {
                    error: `Failed to communicate with Mito backend: ${e}`,
                    errorShort: `Communication error`,
                    showErrorModal: false,
                };
            }
        };
        return send;
    };

    return (
        <Mito
            getSendFunction={getSendFunction}
            sheetDataArray={sheetDataArray}
            analysisData={analysisData}
            userProfile={userProfile}
            hideFullscreenButton={true}
        />
    );
};

export default MitoVSCodeWrapper;